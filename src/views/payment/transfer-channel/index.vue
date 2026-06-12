<template>
  <div class="art-full-height">
    <TableSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <ElCard class="art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton
              v-permission="'pay:transferChannel:save'"
              @click="showDialog('add')"
              v-ripple
            >
              <template #icon>
                <ArtSvgIcon icon="ri:add-fill" />
              </template>
              新增代付通道
            </ElButton>
            <ElButton
              v-permission="'pay:transferChannel:destroy'"
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
        <template #channelBiz="{ row }">
          <el-tag :type="(channelBizMap[row.channel_biz]?.tagType as any) || 'info'" size="small">
            {{ channelBizMap[row.channel_biz]?.label ?? row.channel_biz }}
          </el-tag>
        </template>
        <template #transferAdapter="{ row }">
          {{ row.transfer_adapter || '-' }}
        </template>
        <template #operation="{ row }">
          <div class="flex gap-2">
            <SaButton
              v-permission="'pay:transferChannel:update'"
              type="secondary"
              @click="showDialog('edit', row)"
            />
            <SaButton
              v-permission="'pay:transferChannel:destroy'"
              type="error"
              @click="deleteRow(row, api.delete, refreshData)"
            />
            <ArtButtonMore
              :list="transferChannelMoreList"
              @click="(item) => handleTransferChannelMore(item, row)"
            />
          </div>
        </template>
      </ArtTable>
    </ElCard>

    <EditDialog
      v-model="dialogVisible"
      :dialog-type="dialogType"
      :data="dialogData"
      @success="refreshData"
    />

    <MerchantAuthTransferDrawer v-model="authDrawerVisible" :channel="authChannel" />
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/hooks/core/useTable'
  import { useSaiAdmin } from '@/composables/useSaiAdmin'
  import api from '@/api/payment/transferChannel'
  import { CHANNEL_BIZ_MAP } from '../constants'
  import TableSearch from './modules/table-search.vue'
  import EditDialog from './modules/edit-dialog.vue'
  import MerchantAuthTransferDrawer from './modules/merchant-auth-transfer-drawer.vue'

  import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'

  defineOptions({ name: 'PayTransferChannel' })

  const transferChannelMoreList: ButtonMoreItem[] = [
    {
      key: 'auth',
      label: '授权商户',
      auth: 'pay:transferChannel:auth',
      icon: 'ri:user-shared-line'
    }
  ]

  const handleTransferChannelMore = (item: ButtonMoreItem, row: Record<string, any>) => {
    if (item.key === 'auth') {
      openMerchantAuthDrawer(row)
    }
  }

  const channelBizMap = CHANNEL_BIZ_MAP

  const searchForm = ref({
    keyword: undefined,
    status: undefined
  })

  const handleSearch = (params: Record<string, any>) => {
    Object.assign(searchParams, params)
    getData()
  }

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
        { prop: 'code', label: '通道编码', minWidth: 140 },
        { prop: 'title', label: '通道名称', minWidth: 140 },
        {
          prop: 'transfer_adapter',
          label: '代付适配器',
          minWidth: 130,
          useSlot: true,
          slotName: 'transferAdapter'
        },
        { prop: 'rate_transfer_self', label: '代付默认费率(%)', width: 130, align: 'right' },
        {
          prop: 'channel_biz',
          label: '业务能力',
          width: 100,
          align: 'center',
          useSlot: true,
          slotName: 'channelBiz'
        },
        { prop: 'sort', label: '排序', width: 80, align: 'center' },
        { prop: 'status', label: '状态', saiType: 'dict', saiDict: 'data_status', width: 90 },
        { prop: 'operation', label: '操作', width: 140, fixed: 'right', useSlot: true }
      ]
    }
  })

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

  const authDrawerVisible = ref(false)
  const authChannel = ref<Record<string, any>>()

  const openMerchantAuthDrawer = (row: Record<string, any>) => {
    authChannel.value = row
    authDrawerVisible.value = true
  }
</script>
