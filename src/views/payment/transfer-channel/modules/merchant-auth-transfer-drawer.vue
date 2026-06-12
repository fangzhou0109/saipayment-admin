<template>
  <el-drawer
    v-model="visible"
    :title="`授权商户（代付）- ${channel?.title || channel?.code || ''}`"
    size="820px"
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <el-alert type="info" :closable="false" show-icon class="tip-alert">
      <template #title>
        批量为当前通道开通/关闭商户<strong>代付</strong>授权（<code>transfer_enabled</code>，与代收
        <code>status</code> 独立）。新开通默认代付费率 <b>0</b>（继承通道 rate_transfer_self
        {{ formatRate(channel?.rate_transfer_self) }}%）。
      </template>
    </el-alert>

    <div class="toolbar">
      <el-button :loading="loading" @click="loadData">刷新</el-button>
      <el-button
        v-permission="'pay:transferChannel:auth'"
        type="primary"
        :disabled="selectedIds.length === 0"
        :loading="enabling"
        @click="handleBatch(1)"
      >
        批量开通 ({{ selectedIds.length }})
      </el-button>
      <el-button
        v-permission="'pay:transferChannel:auth'"
        type="warning"
        :disabled="selectedIds.length === 0"
        :loading="disabling"
        @click="handleBatch(2)"
      >
        批量关闭 ({{ selectedIds.length }})
      </el-button>
    </div>

    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="rows"
      border
      stripe
      size="small"
      max-height="calc(100vh - 240px)"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="48" align="center" />
      <el-table-column prop="mch_id" label="商户号" width="140" show-overflow-tooltip />
      <el-table-column prop="name" label="商户名称" min-width="140" show-overflow-tooltip />
      <el-table-column label="代付授权" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.transfer_enabled === 1 ? 'success' : 'info'" size="small">
            {{ row.transfer_enabled === 1 ? '已授权' : '未授权' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="代付费率(%)" width="110" align="right">
        <template #default="{ row }">
          <span class="readonly-rate">{{ formatRate(row.rate_transfer) }}</span>
        </template>
      </el-table-column>
    </el-table>
  </el-drawer>
</template>

<script setup lang="ts">
  import merchantChannelApi from '@/api/payment/merchantChannel'
  import { ElMessageBox } from 'element-plus'
  import type { TableInstance } from 'element-plus'

  interface MerchantTransferAuthRow {
    id?: number
    merchant_id: number
    mch_id: string
    name: string
    rate_transfer: string | number
    transfer_enabled: number
  }

  interface Props {
    modelValue: boolean
    channel?: Record<string, any>
  }
  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    channel: undefined
  })
  const emit = defineEmits<Emits>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const loading = ref(false)
  const enabling = ref(false)
  const disabling = ref(false)
  const rows = ref<MerchantTransferAuthRow[]>([])
  const selectedIds = ref<number[]>([])
  const tableRef = ref<TableInstance>()

  const formatRate = (val: string | number | undefined) => {
    const n = Number(val ?? 0)
    return Number.isFinite(n) ? n.toFixed(4) : '0.0000'
  }

  const handleSelectionChange = (selection: MerchantTransferAuthRow[]) => {
    selectedIds.value = selection.map((r) => Number(r.merchant_id))
  }

  const loadData = async () => {
    const channelId = Number(props.channel?.id)
    if (!channelId) return

    loading.value = true
    try {
      const list = await merchantChannelApi.listByChannel(channelId)
      rows.value = (Array.isArray(list) ? list : []) as MerchantTransferAuthRow[]
      selectedIds.value = []
      tableRef.value?.clearSelection()
    } finally {
      loading.value = false
    }
  }

  const handleOpen = () => {
    loadData()
  }

  /**
   * 批量开通/关闭代付授权
   * @param transferEnabled 1=开通 2=关闭
   */
  const handleBatch = async (transferEnabled: 1 | 2) => {
    const channelId = Number(props.channel?.id)
    if (!channelId || selectedIds.value.length === 0) return

    const action = transferEnabled === 1 ? '开通' : '关闭'
    try {
      await ElMessageBox.confirm(
        `确认为所选 ${selectedIds.value.length} 个商户${action}通道「${props.channel?.title || props.channel?.code}」的代付授权？`,
        `批量${action}代付`,
        { type: transferEnabled === 1 ? 'info' : 'warning' }
      )
    } catch {
      return
    }

    const loadingFlag = transferEnabled === 1 ? enabling : disabling
    loadingFlag.value = true
    try {
      await merchantChannelApi.batchAuthorizeTransferByChannel({
        channel_id: channelId,
        merchant_ids: selectedIds.value,
        transfer_enabled: transferEnabled
      })
      emit('success')
      await loadData()
    } finally {
      loadingFlag.value = false
    }
  }
</script>

<style scoped>
  .tip-alert {
    margin-bottom: 12px;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
  }
  .readonly-rate {
    color: var(--el-text-color-secondary);
    font-variant-numeric: tabular-nums;
  }
</style>
