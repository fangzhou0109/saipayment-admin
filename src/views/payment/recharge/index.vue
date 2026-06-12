<template>
  <div class="art-full-height">
    <!-- 搜索面板 -->
    <TableSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部（充值只读，无新增/删除按钮） -->
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
        <!-- 充值方式列 -->
        <template #rechargeType="{ row }">
          {{ typeMap[row.recharge_type] || row.recharge_type }}
        </template>
        <!-- 充值状态列 -->
        <template #status="{ row }">
          <ElTag :type="(statusMap[row.status]?.tagType as any) || 'info'" size="small">
            {{ statusMap[row.status]?.label || row.status }}
          </ElTag>
        </template>
        <!-- 操作列：审核（仅待审核可点）+ 详情 -->
        <template #operation="{ row }">
          <ArtButtonMore
            :list="getRechargeMoreList(row)"
            @click="(item) => handleRechargeMore(item, row)"
          />
        </template>
      </ArtTable>
    </ElCard>

    <!-- 审核/详情抽屉 -->
    <AuditDialog
      v-model="auditVisible"
      :recharge="currentRow"
      :readonly="auditReadonly"
      @success="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/hooks/core/useTable'
  import api from '@/api/payment/recharge'
  import { RECHARGE_STATUS_MAP, RECHARGE_TYPE_MAP } from '../constants'
  import TableSearch from './modules/table-search.vue'
  import AuditDialog from './modules/audit-dialog.vue'

  import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'

  defineOptions({ name: 'PayRecharge' })

  const getRechargeMoreList = (row: Record<string, any>): ButtonMoreItem[] => [
    {
      key: 'audit',
      label: '审核',
      auth: 'pay:recharge:audit',
      icon: 'ri:checkbox-circle-line',
      color: 'var(--el-color-warning)',
      disabled: row.status !== 0
    },
    { key: 'detail', label: '详情', auth: 'pay:recharge:read', icon: 'ri:file-list-3-line' }
  ]

  const handleRechargeMore = (item: ButtonMoreItem, row: Record<string, any>) => {
    if (item.key === 'audit') {
      openAudit(row)
    } else if (item.key === 'detail') {
      openDetail(row)
    }
  }

  const statusMap = RECHARGE_STATUS_MAP
  const typeMap = RECHARGE_TYPE_MAP

  // 审核抽屉状态
  const auditVisible = ref(false)
  const auditReadonly = ref(false)
  const currentRow = ref<Record<string, any>>({})

  // 搜索表单
  const searchForm = ref({
    keyword: undefined,
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
        { prop: 'recharge_no', label: '充值单号', minWidth: 200 },
        { prop: 'mch_id', label: '商户号', minWidth: 140 },
        { prop: 'amount', label: '充值金额(元)', width: 130, align: 'right' },
        {
          prop: 'recharge_type',
          label: '充值方式',
          width: 110,
          useSlot: true,
          slotName: 'rechargeType'
        },
        { prop: 'status', label: '状态', width: 100, useSlot: true, slotName: 'status' },
        { prop: 'create_time', label: '申请时间', width: 170, sortable: true },
        { prop: 'operation', label: '操作', width: 80, fixed: 'right', useSlot: true }
      ]
    }
  })

  /**
   * 打开审核抽屉（可操作）
   * @param row 充值行数据
   */
  const openAudit = (row: Record<string, any>) => {
    currentRow.value = row
    auditReadonly.value = false
    auditVisible.value = true
  }

  /**
   * 打开详情抽屉（只读）
   * @param row 充值行数据
   */
  const openDetail = (row: Record<string, any>) => {
    currentRow.value = row
    auditReadonly.value = true
    auditVisible.value = true
  }
</script>
