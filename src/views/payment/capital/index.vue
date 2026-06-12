<template>
  <div class="art-full-height">
    <!-- 搜索面板 -->
    <TableSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部（流水只读，提供导出） -->
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <SaExport
            v-permission="'pay:capital:export'"
            url="/core/pay/capital/export"
            :params="searchParams"
            file-name="资金流水.xlsx"
          />
        </template>
      </ArtTableHeader>

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
        <!-- 业务类型列 -->
        <template #bizType="{ row }">
          {{ bizTypeMap[row.biz_type] || row.biz_type }}
        </template>
        <!-- 账户类型列 -->
        <template #changeType="{ row }">
          {{ accountMap[row.change_type] || row.change_type }}
        </template>
        <!-- 变动金额列（正绿负红） -->
        <template #changeAmount="{ row }">
          <span :class="isNegative(row.change_amount) ? 'amount-out' : 'amount-in'">
            {{ row.change_amount }}
          </span>
        </template>
      </ArtTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/hooks/core/useTable'
  import api from '@/api/payment/capital'
  import { CAPITAL_BIZ_TYPE_MAP, CAPITAL_ACCOUNT_MAP } from '../constants'
  import TableSearch from './modules/table-search.vue'

  defineOptions({ name: 'PayCapital' })

  const bizTypeMap = CAPITAL_BIZ_TYPE_MAP
  const accountMap = CAPITAL_ACCOUNT_MAP

  // 判断变动金额是否为负（出账）
  const isNegative = (val: any) =>
    String(val ?? '')
      .trim()
      .startsWith('-')

  // 搜索表单
  const searchForm = ref({
    merchant_id: undefined,
    biz_no: undefined,
    biz_type: undefined,
    change_type: undefined
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
        { prop: 'flow_no', label: '流水号', minWidth: 200 },
        { prop: 'merchant_id', label: '商户ID', width: 100, align: 'center' },
        { prop: 'mch_id', label: '商户号', minWidth: 140 },
        { prop: 'biz_type', label: '业务类型', width: 110, useSlot: true, slotName: 'bizType' },
        { prop: 'biz_no', label: '业务单号', minWidth: 200 },
        {
          prop: 'change_type',
          label: '账户类型',
          width: 100,
          useSlot: true,
          slotName: 'changeType'
        },
        {
          prop: 'change_amount',
          label: '变动金额(元)',
          width: 130,
          align: 'right',
          useSlot: true,
          slotName: 'changeAmount'
        },
        { prop: 'before_balance', label: '变动前(元)', width: 120, align: 'right' },
        { prop: 'after_balance', label: '变动后(元)', width: 120, align: 'right' },
        { prop: 'remark', label: '备注', minWidth: 140 },
        { prop: 'create_time', label: '时间', width: 170, sortable: true }
      ]
    }
  })
</script>

<style scoped>
  .amount-in {
    color: var(--el-color-success);
  }
  .amount-out {
    color: var(--el-color-danger);
  }
</style>
