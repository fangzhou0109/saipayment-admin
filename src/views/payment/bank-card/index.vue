<template>
  <div class="art-full-height">
    <!-- 搜索面板 -->
    <TableSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton v-permission="'pay:bankCard:save'" @click="showDialog('add')" v-ripple>
              <template #icon>
                <ArtSvgIcon icon="ri:add-fill" />
              </template>
              绑定银行卡
            </ElButton>
            <ElButton
              v-permission="'pay:bankCard:destroy'"
              :disabled="selectedRows.length === 0"
              @click="deleteSelectedRows(api.delete, refreshData)"
              v-ripple
            >
              <template #icon>
                <ArtSvgIcon icon="ri:delete-bin-5-line" />
              </template>
              删除
            </ElButton>
          </ElSpace>
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
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <!-- 卡号脱敏列 -->
        <template #cardNo="{ row }">
          {{ maskCardNo(row.card_no) }}
        </template>
        <!-- 状态列 -->
        <template #status="{ row }">
          <ElTag :type="(statusMap[row.status]?.tagType as any) || 'info'" size="small">
            {{ statusMap[row.status]?.label || row.status }}
          </ElTag>
        </template>
        <!-- 操作列 -->
        <template #operation="{ row }">
          <div class="flex gap-2">
            <SaButton
              v-permission="'pay:bankCard:update'"
              type="secondary"
              @click="showDialog('edit', row)"
            />
            <SaButton
              v-permission="'pay:bankCard:destroy'"
              type="error"
              @click="deleteRow(row, api.delete, refreshData)"
            />
          </div>
        </template>
      </ArtTable>
    </ElCard>

    <!-- 编辑弹窗 -->
    <EditDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :data="dialogData"
      @success="refreshData"
    />
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/hooks/core/useTable'
  import { useSaiAdmin } from '@/composables/useSaiAdmin'
  import api from '@/api/payment/bankCard'
  import { BANK_CARD_STATUS_MAP, maskCardNo } from '../constants'
  import TableSearch from './modules/table-search.vue'
  import EditDialog from './modules/edit-dialog.vue'

  defineOptions({ name: 'PayBankCard' })

  const statusMap = BANK_CARD_STATUS_MAP

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
        { type: 'selection' },
        { prop: 'id', label: '编号', width: 80, align: 'center' },
        { prop: 'merchant_id', label: '商户ID', width: 100, align: 'center' },
        { prop: 'holder_name', label: '持卡人', minWidth: 120 },
        { prop: 'card_no', label: '银行卡号', minWidth: 200, useSlot: true, slotName: 'cardNo' },
        { prop: 'bank_name', label: '开户银行', minWidth: 140 },
        { prop: 'bank_code', label: '银行编码', width: 110 },
        { prop: 'status', label: '状态', width: 90, useSlot: true, slotName: 'status' },
        { prop: 'create_time', label: '绑定时间', width: 170, sortable: true },
        { prop: 'operation', label: '操作', width: 120, fixed: 'right', useSlot: true }
      ]
    }
  })

  // 弹窗与删除/多选（来自 useSaiAdmin）
  const {
    dialogVisible,
    dialogType,
    dialogData,
    showDialog,
    deleteRow,
    deleteSelectedRows,
    handleSelectionChange,
    selectedRows
  } = useSaiAdmin()
</script>
