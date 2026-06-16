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
  import { useTable } from '@/hooks/core/useTable'
  import api from '@/api/payment/transferOrder'
  import { WITHDRAW_STATUS_MAP } from '../constants'
  import TableSearch from './modules/table-search.vue'
  import AuditDialog from './modules/audit-dialog.vue'

  defineOptions({ name: 'PayTransferOrder' })

  const statusMap = WITHDRAW_STATUS_MAP

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
        { prop: 'status', label: '状态', width: 100, useSlot: true, slotName: 'status' },
        { prop: 'transfer_no', label: '上游代付单号', minWidth: 160 },
        { prop: 'create_time', label: '进单时间', width: 170, sortable: true },
        { prop: 'operation', label: '操作', width: 150, fixed: 'right', useSlot: true }
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
</script>
