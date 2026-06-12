<template>
  <el-drawer
    v-model="visible"
    :title="`代收费率 - ${merchant?.name || merchant?.mch_id || ''}`"
    size="1100px"
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <el-alert type="info" :closable="false" show-icon class="tip-alert">
      <template #title>
        按通道配置代收平台费率与单笔限额。平台费率 <b>0</b> 继承 rate_self；&gt;0 须大于上游成本。
        单笔最小/最大、日限额填 <b>0</b> 表示不限（元）。商户级兜底限额见操作列「单笔限额」；代付见「代付费率」「代付通道」。
      </template>
    </el-alert>

    <div class="toolbar">
      <el-button :loading="loading" @click="loadData">刷新</el-button>
      <el-button
        v-permission="'pay:merchant:channel'"
        type="primary"
        :loading="saving"
        @click="handleSave"
      >
        保存
      </el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="rows"
      border
      stripe
      size="small"
      max-height="calc(100vh - 260px)"
    >
      <el-table-column
        prop="channel_title"
        label="通道名称"
        min-width="120"
        show-overflow-tooltip
        fixed="left"
      />
      <el-table-column prop="channel_code" label="编码" width="100" show-overflow-tooltip />
      <el-table-column label="支付类型" width="100" align="center">
        <template #default="{ row }">
          {{ payTypeMap[row.channel_pay_type] || row.channel_pay_type }}
        </template>
      </el-table-column>
      <el-table-column label="代收授权" width="88" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="2"
            :disabled="!canEdit"
          />
        </template>
      </el-table-column>
      <el-table-column label="平台费率(%)" width="130" align="center">
        <template #default="{ row }">
          <el-input-number
            v-model="row.rate"
            :min="0"
            :max="100"
            :precision="4"
            :step="0.1"
            :disabled="!canEdit || row.status !== 1"
            controls-position="right"
            size="small"
            style="width: 110px"
          />
        </template>
      </el-table-column>
      <el-table-column label="单笔最小(元)" width="130" align="center">
        <template #default="{ row }">
          <el-input-number
            v-model="row.single_min"
            :min="0"
            :precision="4"
            :step="1"
            :disabled="!canEdit || row.status !== 1"
            controls-position="right"
            size="small"
            style="width: 110px"
          />
        </template>
      </el-table-column>
      <el-table-column label="单笔最大(元)" width="130" align="center">
        <template #default="{ row }">
          <el-input-number
            v-model="row.single_max"
            :min="0"
            :precision="4"
            :step="1"
            :disabled="!canEdit || row.status !== 1"
            controls-position="right"
            size="small"
            style="width: 110px"
          />
        </template>
      </el-table-column>
      <el-table-column label="日限额(元)" width="130" align="center">
        <template #default="{ row }">
          <el-input-number
            v-model="row.day_limit"
            :min="0"
            :precision="4"
            :step="100"
            :disabled="!canEdit || row.status !== 1"
            controls-position="right"
            size="small"
            style="width: 110px"
          />
        </template>
      </el-table-column>
      <el-table-column label="通道默认(%)" width="100" align="right">
        <template #default="{ row }">
          <span class="readonly-rate">{{ formatRate(row.channel_rate_self) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="上游成本(%)" width="100" align="right">
        <template #default="{ row }">
          <span class="readonly-rate">{{ formatRate(row.channel_upstream_rate) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="校验" width="90" align="center" fixed="right">
        <template #default="{ row }">
          <el-tag v-if="row.status !== 1" type="info" size="small">未授权</el-tag>
          <el-tag v-else-if="payRowValid(row)" type="success" size="small">通过</el-tag>
          <el-tag v-else type="danger" size="small">{{ payRowError(row) }}</el-tag>
        </template>
      </el-table-column>
    </el-table>
  </el-drawer>
</template>

<script setup lang="ts">
  import channelApi from '@/api/payment/channel'
  import merchantChannelApi from '@/api/payment/merchantChannel'
  import { PAY_TYPE_MAP } from '@/views/payment/constants'
  import { useUserStore } from '@/store/modules/user'
  import { ElMessage } from 'element-plus'

  /** 代收配置行（保留代付字段用于 batchSave 时不覆盖既有代付授权） */
  interface PayConfigRow {
    id?: number
    channel_id: number
    channel_title: string
    channel_code: string
    channel_pay_type: number
    channel_rate_self: string | number
    channel_upstream_rate: string | number
    rate: number
    rate_transfer: number
    single_min: number
    single_max: number
    day_limit: number
    status: number
    transfer_enabled: number
  }

  interface Props {
    modelValue: boolean
    merchant?: Record<string, any>
  }
  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    merchant: undefined
  })
  const emit = defineEmits<Emits>()

  const payTypeMap = PAY_TYPE_MAP
  const userStore = useUserStore()

  const canEdit = computed(() => {
    const buttons = userStore.getUserInfo.buttons || []
    return buttons.includes('*') || buttons.includes('pay:merchant:channel')
  })

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const loading = ref(false)
  const saving = ref(false)
  const rows = ref<PayConfigRow[]>([])

  const formatRate = (val: string | number | undefined) => {
    const n = Number(val ?? 0)
    return Number.isFinite(n) ? n.toFixed(4) : '0.0000'
  }

  const rateValid = (row: PayConfigRow): boolean => {
    if (row.status !== 1) return true
    const rate = Number(row.rate)
    const upstream = Number(row.channel_upstream_rate)
    if (!rate || rate <= 0) return true
    return rate > upstream
  }

  const singleLimitValid = (row: PayConfigRow): boolean => {
    if (row.status !== 1) return true
    const min = Number(row.single_min ?? 0)
    const max = Number(row.single_max ?? 0)
    if (min < 0 || max < 0) return false
    if (min > 0 && max > 0 && max < min) return false
    return true
  }

  const dayLimitValid = (row: PayConfigRow): boolean => {
    if (row.status !== 1) return true
    return Number(row.day_limit ?? 0) >= 0
  }

  const payRowValid = (row: PayConfigRow): boolean =>
    rateValid(row) && singleLimitValid(row) && dayLimitValid(row)

  const payRowError = (row: PayConfigRow): string => {
    if (!rateValid(row)) return '亏损'
    if (!singleLimitValid(row)) return '限额'
    if (!dayLimitValid(row)) return '日限'
    return '异常'
  }

  const buildRows = (
    channels: Record<string, any>[],
    bindings: Record<string, any>[]
  ): PayConfigRow[] => {
    const bindingMap = new Map<number, Record<string, any>>()
    bindings.forEach((b) => bindingMap.set(Number(b.channel_id), b))

    return channels.map((ch) => {
      const channelId = Number(ch.id)
      const binding = bindingMap.get(channelId)
      return {
        id: binding?.id,
        channel_id: channelId,
        channel_title: String(ch.title ?? binding?.channel_title ?? ''),
        channel_code: String(ch.code ?? binding?.channel_code ?? ''),
        channel_pay_type: Number(ch.pay_type ?? binding?.channel_pay_type ?? 0),
        channel_rate_self: binding?.channel_rate_self ?? ch.rate_self ?? '0',
        channel_upstream_rate: binding?.channel_upstream_rate ?? ch.rate ?? '0',
        rate: Number(binding?.rate ?? 0),
        rate_transfer: Number(binding?.rate_transfer ?? 0),
        single_min: Number(binding?.single_min ?? 0),
        single_max: Number(binding?.single_max ?? 0),
        day_limit: Number(binding?.day_limit ?? 0),
        status: Number(binding?.status ?? 2),
        transfer_enabled: Number(binding?.transfer_enabled ?? 2)
      }
    })
  }

  const loadData = async () => {
    const merchantId = props.merchant?.id
    if (!merchantId) return

    loading.value = true
    try {
      const [channelPage, bindings] = await Promise.all([
        channelApi.list({ page: 1, limit: 500, status: 1 }),
        merchantChannelApi.listByMerchant(merchantId)
      ])

      const channels: Record<string, any>[] = channelPage?.data ?? []
      const bindingList: Record<string, any>[] = Array.isArray(bindings) ? bindings : []
      rows.value = buildRows(channels, bindingList)
    } finally {
      loading.value = false
    }
  }

  const handleOpen = () => {
    loadData()
  }

  /** 保存代收配置；代付字段原样带回，避免覆盖商户代付授权 */
  const handleSave = async () => {
    const merchantId = Number(props.merchant?.id)
    if (!merchantId) return

    if (rows.value.some((r) => r.status === 1 && !rateValid(r))) {
      ElMessage.warning('存在平台费率不大于上游成本的授权通道，请调整后再保存')
      return
    }
    if (rows.value.some((r) => r.status === 1 && !singleLimitValid(r))) {
      ElMessage.warning('存在单笔最大限额小于最小限额的授权通道，请调整后再保存')
      return
    }
    if (rows.value.some((r) => r.status === 1 && !dayLimitValid(r))) {
      ElMessage.warning('日限额不能为负数')
      return
    }

    const payloadRows = rows.value
      .filter((r) => r.status === 1 || r.id)
      .map((r) => ({
        channel_id: r.channel_id,
        rate: r.rate,
        rate_transfer: r.rate_transfer,
        single_min: r.single_min,
        single_max: r.single_max,
        day_limit: r.day_limit,
        status: r.status,
        transfer_enabled: r.transfer_enabled
      }))

    if (payloadRows.length === 0) {
      ElMessage.warning('请至少配置一条代收授权，或保留已有绑定后再保存')
      return
    }

    saving.value = true
    try {
      await merchantChannelApi.batchSave({ merchant_id: merchantId, rows: payloadRows })
      emit('success')
      await loadData()
    } finally {
      saving.value = false
    }
  }
</script>

<style scoped>
  .tip-alert {
    margin-bottom: 12px;
  }
  .toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  .readonly-rate {
    color: var(--el-text-color-secondary);
    font-variant-numeric: tabular-nums;
  }
</style>
