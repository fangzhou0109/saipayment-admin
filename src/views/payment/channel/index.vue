<template>
  <div class="art-full-height">
    <!-- 搜索面板 -->
    <TableSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton v-permission="'pay:channel:save'" @click="showDialog('add')" v-ripple>
              <template #icon>
                <ArtSvgIcon icon="ri:add-fill" />
              </template>
              新增代收通道
            </ElButton>
            <ElButton
              v-permission="'pay:channel:destroy'"
              :disabled="selectedRows.length === 0"
              @click="deleteSelectedRows(api.delete, refreshData)"
              v-ripple
            >
              <template #icon>
                <ArtSvgIcon icon="ri:delete-bin-5-line" />
              </template>
              删除
            </ElButton>
            <ElButton
              v-permission="'pay:order:testSubmit'"
              type="primary"
              @click="openTestOrderDrawer()"
              v-ripple
            >
              测试下单
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
              v-permission="'pay:channel:update'"
              type="secondary"
              @click="showDialog('edit', row)"
            />
            <SaButton
              v-permission="'pay:channel:destroy'"
              type="error"
              @click="deleteRow(row, api.delete, refreshData)"
            />
            <ArtButtonMore :list="channelMoreList" @click="(item) => handleChannelMore(item, row)" />
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

    <!-- 授权商户抽屉 -->
    <MerchantAuthDrawer v-model="authDrawerVisible" :channel="authChannel" />

    <!-- 代收测试下单抽屉 -->
    <TestOrderDrawer v-model="testOrderVisible" :default-pay-type="testOrderPayType" />
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/hooks/core/useTable'
  import { useSaiAdmin } from '@/composables/useSaiAdmin'
  import api from '@/api/payment/channel'
  import { PAY_TYPE_MAP } from '../constants'
  import TableSearch from './modules/table-search.vue'
  import EditDialog from './modules/edit-dialog.vue'
  import MerchantAuthDrawer from './modules/merchant-auth-drawer.vue'
  import TestOrderDrawer from '../order/modules/test-order-drawer.vue'

  import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'

  defineOptions({ name: 'PayChannel' })

  const channelMoreList: ButtonMoreItem[] = [
    { key: 'auth', label: '授权商户', auth: 'pay:channel:auth', icon: 'ri:user-shared-line' },
    { key: 'testOrder', label: '测试下单', auth: 'pay:order:testSubmit', icon: 'ri:flask-line' }
  ]

  const handleChannelMore = (item: ButtonMoreItem, row: Record<string, any>) => {
    if (item.key === 'auth') {
      openMerchantAuthDrawer(row)
    } else if (item.key === 'testOrder') {
      openTestOrderDrawer(row)
    }
  }

  // 支付类型枚举映射（模板内引用）
  const payTypeMap = PAY_TYPE_MAP

  // 搜索表单
  const searchForm = ref({
    title: undefined,
    code: undefined,
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
        { prop: 'title', label: '通道名称', minWidth: 140 },
        { prop: 'code', label: '通道编码', minWidth: 140 },
        { prop: 'adapter', label: '适配器', minWidth: 120 },
        { prop: 'pay_type', label: '支付类型', width: 110, useSlot: true, slotName: 'payType' },
        { prop: 'rate', label: '上游费率(%)', width: 110, align: 'right' },
        { prop: 'rate_self', label: '平台费率(%)', width: 110, align: 'right' },
        {
          prop: 'money_rule',
          label: '金额规则',
          minWidth: 140,
          formatter: (row: Record<string, any>) => row.money_rule || '不限'
        },
        { prop: 'sort', label: '直连权重', width: 100 },
        { prop: 'status', label: '状态', saiType: 'dict', saiDict: 'data_status', width: 90 },
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

  /** 授权商户抽屉 */
  const authDrawerVisible = ref(false)
  const authChannel = ref<Record<string, any>>()

  const openMerchantAuthDrawer = (row: Record<string, any>) => {
    authChannel.value = row
    authDrawerVisible.value = true
  }

  /** 代收测试下单抽屉 */
  const testOrderVisible = ref(false)
  const testOrderPayType = ref<number | undefined>()

  /** 打开测试下单，优先带入搜索栏支付类型；从行「授权商户」旁也可扩展传入 row.pay_type */
  const openTestOrderDrawer = (row?: Record<string, any>) => {
    const payType = row?.pay_type ?? searchForm.value.pay_type
    testOrderPayType.value = payType ? Number(payType) : undefined
    testOrderVisible.value = true
  }
</script>
