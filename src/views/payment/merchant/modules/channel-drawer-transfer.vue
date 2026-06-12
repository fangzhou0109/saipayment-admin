<template>
  <el-drawer
    v-model="visible"
    :title="`代付通道 - ${merchant?.name || merchant?.mch_id || ''}`"
    size="900px"
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <el-alert type="info" :closable="false" show-icon class="tip-alert">
      <template #title>
        按通道配置代付授权与费率。代付费率 <b>0</b> 继承 rate_transfer_self（<b>0</b> 表示免手续费）。
        无代付通道时提现算费使用操作列「代付费率」中的全局保底；有通道授权时本页费率优先。代收请在「代收费率」中维护。
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
      <el-table-column prop="channel_code" label="编码" width="110" show-overflow-tooltip />
      <el-table-column label="代付适配器" width="130" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="readonly-rate">{{ row.channel_transfer_adapter || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="代付授权" width="88" align="center">
        <template #default="{ row }">
          <el-switch
            v-model="row.transfer_enabled"
            :active-value="1"
            :inactive-value="2"
            :disabled="!canEdit"
          />
        </template>
      </el-table-column>
      <el-table-column label="代付费率(%)" width="130" align="center">
        <template #default="{ row }">
          <el-input-number
            v-model="row.rate_transfer"
            :min="0"
            :max="100"
            :precision="4"
            :step="0.1"
            :disabled="!canEdit || row.transfer_enabled !== 1"
            controls-position="right"
            size="small"
            style="width: 110px"
          />
        </template>
      </el-table-column>
      <el-table-column label="通道默认(%)" width="110" align="right">
        <template #default="{ row }">
          <span class="readonly-rate">{{ formatRate(row.channel_rate_transfer_self) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="校验" width="90" align="center" fixed="right">
        <template #default="{ row }">
          <el-tag v-if="row.transfer_enabled !== 1" type="info" size="small">未授权</el-tag>
          <el-tag v-else-if="transferRowValid(row)" type="success" size="small">通过</el-tag>
          <el-tag v-else type="danger" size="small">费率</el-tag>
        </template>
      </el-table-column>
    </el-table>

    <el-empty
      v-if="!loading && rows.length === 0"
      description="暂无代付通道，请先在「代付通道管理」中创建并配置 transfer_adapter"
    />
  </el-drawer>
</template>

<script setup lang="ts">
  import merchantChannelApi from '@/api/payment/merchantChannel'
  import { useUserStore } from '@/store/modules/user'
  import { ElMessage } from 'element-plus'

  interface TransferConfigRow {
    id?: number
    channel_id: number
    channel_title: string
    channel_code: string
    channel_transfer_adapter: string
    channel_rate_transfer_self: string | number
    rate_transfer: number
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
  const rows = ref<TransferConfigRow[]>([])

  const formatRate = (val: string | number | undefined) => {
    const n = Number(val ?? 0)
    return Number.isFinite(n) ? n.toFixed(4) : '0.0000'
  }

  const transferRowValid = (row: TransferConfigRow): boolean => {
    if (row.transfer_enabled !== 1) return true
    const rate = Number(row.rate_transfer ?? 0)
    return rate >= 0 && rate <= 100
  }

  /** 使用 listTransferByMerchant（后端已过滤 channel_biz IN 2,3） */
  const loadData = async () => {
    const merchantId = props.merchant?.id
    if (!merchantId) return

    loading.value = true
    try {
      const list = await merchantChannelApi.listTransferByMerchant(merchantId)
      const bindingList: Record<string, any>[] = Array.isArray(list) ? list : []

      rows.value = bindingList.map((item) => ({
        id: item.id ? Number(item.id) : undefined,
        channel_id: Number(item.channel_id),
        channel_title: String(item.channel_title ?? ''),
        channel_code: String(item.channel_code ?? ''),
        channel_transfer_adapter: String(item.channel_transfer_adapter ?? ''),
        channel_rate_transfer_self: item.channel_rate_transfer_self ?? '0',
        rate_transfer: Number(item.rate_transfer ?? 0),
        transfer_enabled: Number(item.transfer_enabled ?? 2)
      }))
    } finally {
      loading.value = false
    }
  }

  const handleOpen = () => {
    loadData()
  }

  const handleSave = async () => {
    const merchantId = Number(props.merchant?.id)
    if (!merchantId) return

    if (rows.value.some((r) => r.transfer_enabled === 1 && !transferRowValid(r))) {
      ElMessage.warning('代付费率须在 0~100 之间')
      return
    }

    const payloadRows = rows.value
      .filter((r) => r.transfer_enabled === 1 || (r.id && r.id > 0))
      .map((r) => ({
        channel_id: r.channel_id,
        rate_transfer: r.rate_transfer,
        transfer_enabled: r.transfer_enabled
      }))

    if (payloadRows.length === 0) {
      ElMessage.warning('请至少配置一条代付授权，或保留已有绑定后再保存')
      return
    }

    saving.value = true
    try {
      await merchantChannelApi.batchSaveTransfer({ merchant_id: merchantId, rows: payloadRows })
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
