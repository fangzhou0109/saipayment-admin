<template>
  <div class="art-full-height">
    <!-- 搜索面板 -->
    <TableSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部（代付订单只读，无新增/删除按钮） -->
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData" />

      <!-- 表格 -->
      <ArtTable
        ref="tableRef"
        rowKey="id"
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @sort-change="handleSortChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <!-- 代付状态列 -->
        <template #status="{ row }">
          <ElTag :type="(statusMap[row.status]?.tagType as any) || 'info'" size="small">
            {{ statusMap[row.status]?.label || row.status }}
          </ElTag>
        </template>
        <!-- 操作列：审核 + 详情（直接展示，待审核才可点审核） -->
        <template #operation="{ row }">
          <div class="flex gap-2">
            <ElButton
              v-permission="'pay:transferOrder:audit'"
              type="warning"
              size="small"
              plain
              :disabled="row.status !== 0"
              @click="openAudit(row)"
            >
              审核
            </ElButton>
            <ElButton
              v-permission="'pay:transferOrder:read'"
              type="primary"
              size="small"
              plain
              @click="openDetail(row)"
            >
              详情
            </ElButton>
            <ElButton
              v-permission="'pay:transferOrder:audit'"
              type="warning"
              size="small"
              plain
              :disabled="!canRenotify(row)"
              :loading="renotifyingId === row.id"
              @click="handleRenotify(row)"
            >
              重推通知
            </ElButton>
            <ElButton
              v-permission="'pay:transferOrder:audit'"
              type="danger"
              size="small"
              plain
              :disabled="!canManualSuccess(row)"
              :loading="manualSuccessingId === row.id"
              @click="handleManualSuccess(row)"
            >
              确认成功
            </ElButton>
          </div>
        </template>
      </ArtTable>
    </ElCard>

    <!-- 审核/详情抽屉 -->
    <AuditDialog
      v-model="auditVisible"
      :withdraw="currentRow"
      :readonly="auditReadonly"
      @success="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { useTable } from '@/hooks/core/useTable'
  import api from '@/api/payment/transferOrder'
  import { WITHDRAW_STATUS_MAP } from '../constants'
  import TableSearch from './modules/table-search.vue'
  import AuditDialog from './modules/audit-dialog.vue'

  defineOptions({ name: 'PayTransferOrder' })

  const statusMap = WITHDRAW_STATUS_MAP
  const renotifyingId = ref<number | string>('')
  const manualSuccessingId = ref<number | string>('')

  /** 仅终态（成功=3 / 代付失败=-2）允许重推下游通知 */
  const canRenotify = (row: Record<string, any>) => row.status === 3 || row.status === -2

  /**
   * 允许人工确认成功的状态：审核通过待下发(1)/代付中(2)/代付失败已退款(-2)。
   * 待审核(0)未发起代付、已拒绝(-1)、已成功(3) 不展示该操作。
   */
  const canManualSuccess = (row: Record<string, any>) =>
    row.status === 1 || row.status === 2 || row.status === -2

  // 审核抽屉状态
  const auditVisible = ref(false)
  const auditReadonly = ref(false)
  const currentRow = ref<Record<string, any>>({})

  // 搜索表单
  const searchForm = ref({
    keyword: undefined,
    out_biz_no: undefined,
    merchant_id: undefined,
    status: undefined
  })

  // 搜索处理
  const handleSearch = (params: Record<string, any>) => {
    Object.assign(searchParams, params)
    getData()
  }

  // 表格配置
  const {
    columns,
    columnChecks,
    data,
    loading,
    getData,
    searchParams,
    pagination,
    resetSearchParams,
    handleSortChange,
    handleSizeChange,
    handleCurrentChange,
    refreshData
  } = useTable({
    core: {
      apiFn: api.list,
      columnsFactory: () => [
        { prop: 'withdraw_no', label: '平台代付单号', minWidth: 200 },
        { prop: 'out_biz_no', label: '商户代付单号', minWidth: 200 },
        { prop: 'mch_id', label: '商户号', minWidth: 140 },
        { prop: 'amount', label: '代付金额(元)', width: 120, align: 'right' },
        { prop: 'fee', label: '手续费(元)', width: 110, align: 'right' },
        { prop: 'real_amount', label: '到账金额(元)', width: 120, align: 'right' },
        { prop: 'account_name', label: '收款人', width: 100 },
        { prop: 'bank_name', label: '开户银行', minWidth: 120 },
        { prop: 'account_no', label: '银行卡号', minWidth: 200 },
        { prop: 'account_phone', label: '收款人手机号', width: 130 },
        { prop: 'status', label: '状态', width: 100, useSlot: true, slotName: 'status' },
        { prop: 'transfer_no', label: '上游代付单号', minWidth: 160 },
        { prop: 'create_time', label: '进单时间', width: 170, sortable: true },
        { prop: 'operation', label: '操作', width: 320, fixed: 'right', useSlot: true }
      ]
    }
  })

  /**
   * 打开审核抽屉（可操作）
   * @param row 代付订单行数据
   */
  const openAudit = (row: Record<string, any>) => {
    currentRow.value = row
    auditReadonly.value = false
    auditVisible.value = true
  }

  /**
   * 打开详情抽屉（只读）
   * @param row 代付订单行数据
   */
  const openDetail = (row: Record<string, any>) => {
    currentRow.value = row
    auditReadonly.value = true
    auditVisible.value = true
  }

  /** 手动重推下游通知（仅终态可推，二次确认后调用） */
  const handleRenotify = async (row: Record<string, any>) => {
    if (!canRenotify(row)) {
      ElMessage.warning('代付处理中，暂无可推送的结果通知')
      return
    }
    try {
      await ElMessageBox.confirm(
        `确认重新向下游推送该代付单（${row.withdraw_no}）的结果通知？`,
        '重推通知',
        { type: 'warning', confirmButtonText: '确认重推', cancelButtonText: '取消' }
      )
    } catch {
      return
    }

    renotifyingId.value = row.id
    try {
      const res: any = await api.renotify(row.id)
      ElMessage.success(res?.message || '通知已重新投递')
      refreshData()
    } finally {
      renotifyingId.value = ''
    }
  }

  /**
   * 人工确认代付成功并立即通知下游（高风险：会按状态扣减/补扣商户余额）。
   * 适用「下游实际已出款成功，但上游返回错误/超时」的差错处理，需二次确认 + 填写备注。
   */
  const handleManualSuccess = async (row: Record<string, any>) => {
    if (!canManualSuccess(row)) {
      ElMessage.warning('当前状态不可人工确认成功')
      return
    }

    let remark = ''
    try {
      const { value } = await ElMessageBox.prompt(
        `确认把代付单（${row.withdraw_no}）置为「成功」并立即通知下游？\n` +
          `若该单为「代付失败」状态，将从商户可用余额补扣 ${row.amount} 元（实际已出款）。此操作不可撤销。`,
        '人工确认代付成功',
        {
          type: 'warning',
          confirmButtonText: '确认置成功',
          cancelButtonText: '取消',
          inputPlaceholder: '请填写差错处理备注（选填）',
          inputType: 'textarea'
        }
      )
      remark = value || ''
    } catch {
      return
    }

    manualSuccessingId.value = row.id
    try {
      const res: any = await api.manualSuccess(row.id, remark)
      ElMessage.success(res?.message || '已确认代付成功')
      refreshData()
    } finally {
      manualSuccessingId.value = ''
    }
  }
</script>
