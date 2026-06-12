<template>
  <div class="art-full-height">
    <!-- 搜索面板 -->
    <TableSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton v-permission="'pay:route:save'" @click="showDialog('add')" v-ripple>
              <template #icon>
                <ArtSvgIcon icon="ri:add-fill" />
              </template>
              新增路由
            </ElButton>
            <ElButton
              v-permission="'pay:route:destroy'"
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
        <!-- 支付类型列：枚举转中文 -->
        <template #payType="{ row }">
          {{ payTypeMap[row.pay_type] || row.pay_type }}
        </template>
        <!-- 操作列 -->
        <template #operation="{ row }">
          <div class="flex gap-2">
            <SaButton
              v-permission="'pay:route:update'"
              type="secondary"
              @click="showDialog('edit', row)"
            />
            <SaButton
              v-permission="'pay:route:destroy'"
              type="error"
              @click="deleteRow(row, api.delete, refreshData)"
            />
            <ArtButtonMore :list="routeMoreList" @click="(item) => handleRouteMore(item, row)" />
          </div>
        </template>
      </ArtTable>
    </ElCard>

    <!-- 路由编辑弹窗 -->
    <EditDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :data="dialogData"
      @success="refreshData"
    />

    <!-- 路由通道配置抽屉（含试算） -->
    <ChannelDrawer v-model="channelDrawerVisible" :route="currentRoute" />
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/hooks/core/useTable'
  import { useSaiAdmin } from '@/composables/useSaiAdmin'
  import api from '@/api/payment/route'
  import { PAY_TYPE_MAP } from '../constants'
  import TableSearch from './modules/table-search.vue'
  import EditDialog from './modules/edit-dialog.vue'
  import ChannelDrawer from './modules/channel-drawer.vue'

  import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'

  defineOptions({ name: 'PayRoute' })

  const routeMoreList: ButtonMoreItem[] = [
    { key: 'channels', label: '通道配置', auth: 'pay:route:index', icon: 'ri:git-branch-line' }
  ]

  const handleRouteMore = (item: ButtonMoreItem, row: Record<string, any>) => {
    if (item.key === 'channels') {
      openChannels(row)
    }
  }

  // 支付类型枚举映射（模板内引用）
  const payTypeMap = PAY_TYPE_MAP

  // 通道配置抽屉状态
  const channelDrawerVisible = ref(false)
  const currentRoute = ref<Record<string, any>>({})

  // 搜索表单
  const searchForm = ref({
    keyword: undefined,
    pay_type: undefined,
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
        { prop: 'title', label: '路由名称', minWidth: 160 },
        { prop: 'pay_type', label: '支付类型', width: 120, useSlot: true, slotName: 'payType' },
        { prop: 'sort', label: '路由优先级', width: 110 },
        { prop: 'status', label: '状态', saiType: 'dict', saiDict: 'data_status', width: 90 },
        { prop: 'create_time', label: '创建时间', width: 170, sortable: true },
        { prop: 'operation', label: '操作', width: 140, fixed: 'right', useSlot: true }
      ]
    }
  })

  // 弹窗与删除
  const {
    dialogType,
    dialogVisible,
    dialogData,
    showDialog,
    deleteRow,
    deleteSelectedRows,
    handleSelectionChange,
    selectedRows
  } = useSaiAdmin()

  /**
   * 打开通道配置抽屉
   * @param row 路由行数据
   */
  const openChannels = (row: Record<string, any>) => {
    currentRoute.value = row
    channelDrawerVisible.value = true
  }
</script>
