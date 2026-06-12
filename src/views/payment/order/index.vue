<template>
  <div class="art-full-height">
    <TableSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <ElCard class="flex flex-col flex-1 min-h-0 art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton
              v-permission="'pay:order:testSubmit'"
              type="primary"
              @click="openTestOrderDrawer()"
              v-ripple
            >
              测试下单
            </ElButton>
            <ElButton v-permission="'pay:order:read'" @click="openTestNotifyDrawer()" v-ripple>
              测试回调记录
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
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <template #payType="{ row }">
          {{ payTypeMap[row.pay_type] || row.pay_type }}
        </template>
        <template #channel="{ row }">
          <template v-if="row.channel_title">
            <div>{{ row.channel_title }}</div>
            <div class="channel-code">{{ row.channel_code }}</div>
          </template>
          <span v-else class="channel-empty">—</span>
        </template>
        <template #status="{ row }">
          <ElTag :type="(orderStatusMap[row.status]?.tagType as any) || 'info'" size="small">
            {{ orderStatusMap[row.status]?.label || row.status }}
          </ElTag>
        </template>
        <template #settleStatus="{ row }">
          <ElTag
            :type="(settleStatusMap[row.settle_status]?.tagType as any) || 'info'"
            size="small"
          >
            {{ settleStatusMap[row.settle_status]?.label || row.settle_status }}
          </ElTag>
        </template>
        <template #notifyStatus="{ row }">
          <ElTag
            :type="(notifyStatusMap[row.notify_status]?.tagType as any) || 'info'"
            size="small"
          >
            {{ notifyStatusMap[row.notify_status]?.label || row.notify_status }}
          </ElTag>
        </template>
        <template #operation="{ row }">
          <div class="flex gap-2">
            <ElButton
              v-permission="'pay:order:read'"
              type="primary"
              size="small"
              plain
              @click="openDetail(row)"
            >
              详情
            </ElButton>
            <ElButton
              v-permission="'pay:order:reissue'"
              type="warning"
              size="small"
              plain
              @click="handleReissue(row)"
            >
              补单
            </ElButton>
          </div>
        </template>
      </ArtTable>
    </ElCard>

    <DetailDialog v-model="detailVisible" :order="currentOrder" />

    <TestOrderDrawer v-model="testOrderVisible" :default-pay-type="testOrderPayType" />

    <TestNotifyDrawer
      v-model="testNotifyVisible"
      :order-no="testNotifyOrderNo"
      :out-trade-no="testNotifyOutTradeNo"
    />
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/hooks/core/useTable'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import api from '@/api/payment/order'
  import {
    PAY_TYPE_MAP,
    ORDER_STATUS_MAP,
    SETTLE_STATUS_MAP,
    NOTIFY_STATUS_MAP
  } from '../constants'
  import TableSearch from './modules/table-search.vue'
  import DetailDialog from './modules/detail-dialog.vue'
  import TestOrderDrawer from './modules/test-order-drawer.vue'
  import TestNotifyDrawer from './modules/test-notify-drawer.vue'

  defineOptions({ name: 'PayOrder' })

  const payTypeMap = PAY_TYPE_MAP
  const orderStatusMap = ORDER_STATUS_MAP
  const settleStatusMap = SETTLE_STATUS_MAP
  const notifyStatusMap = NOTIFY_STATUS_MAP

  const detailVisible = ref(false)
  const currentOrder = ref<Record<string, any>>({})
  const testOrderVisible = ref(false)
  const testOrderPayType = ref<number | undefined>()
  const testNotifyVisible = ref(false)
  const testNotifyOrderNo = ref('')
  const testNotifyOutTradeNo = ref('')

  /** 打开测试下单抽屉，带入当前搜索栏支付类型（若有） */
  const openTestOrderDrawer = () => {
    const payType = searchForm.value.pay_type
    testOrderPayType.value = payType ? Number(payType) : undefined
    testOrderVisible.value = true
  }

  /** 默认搜索条件（与后端 /core/pay/order/index 搜索器字段对齐） */
  const createDefaultSearchForm = () => ({
    order_no: undefined,
    out_trade_no: undefined,
    mch_id: undefined,
    pay_type: undefined,
    channel_id: undefined,
    status: undefined,
    create_time: undefined,
    pay_time: undefined
  })

  const searchForm = ref(createDefaultSearchForm())

  const handleSearch = (params: Record<string, any>) => {
    Object.assign(searchParams, params)
    getData()
  }

  const handleReset = () => {
    searchForm.value = createDefaultSearchForm()
    resetSearchParams()
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
        { prop: 'order_no', label: '平台订单号', minWidth: 200 },
        { prop: 'out_trade_no', label: '商户订单号', minWidth: 180 },
        { prop: 'mch_id', label: '商户号', minWidth: 140 },
        { prop: 'upstream_no', label: '上游订单号', minWidth: 180 },
        { prop: 'amount', label: '金额(元)', width: 110, align: 'right' },
        { prop: 'fee', label: '手续费(元)', width: 110, align: 'right' },
        { prop: 'real_amount', label: '实收(元)', width: 110, align: 'right' },
        { prop: 'rate', label: '费率(%)', width: 90, align: 'right' },
        { prop: 'pay_type', label: '支付类型', width: 110, useSlot: true, slotName: 'payType' },
        {
          prop: 'channel_title',
          label: '代收通道',
          minWidth: 160,
          useSlot: true,
          slotName: 'channel'
        },
        { prop: 'status', label: '订单状态', width: 100, useSlot: true, slotName: 'status' },
        {
          prop: 'settle_status',
          label: '入账状态',
          width: 100,
          useSlot: true,
          slotName: 'settleStatus'
        },
        {
          prop: 'notify_status',
          label: '通知状态',
          width: 100,
          useSlot: true,
          slotName: 'notifyStatus'
        },
        { prop: 'create_time', label: '创建时间', width: 170, sortable: true },
        { prop: 'pay_time', label: '支付时间', width: 170 },
        { prop: 'operation', label: '操作', width: 150, fixed: 'right', useSlot: true }
      ]
    }
  })

  const openDetail = (row: Record<string, any>) => {
    currentOrder.value = row
    detailVisible.value = true
  }

  const openTestNotifyDrawer = (row?: Record<string, any>) => {
    testNotifyOrderNo.value = row?.order_no || ''
    testNotifyOutTradeNo.value = row?.out_trade_no || ''
    testNotifyVisible.value = true
  }

  /** 人工补单：二次确认后调用后端 reissue（强幂等） */
  const handleReissue = (row: Record<string, any>) => {
    const isTest = (row.notify_url || '').includes('/pay/test/notify')
    const extraTip = isTest
      ? '\n\n该订单 notify_url 指向测试接收端，补单成功后可点「测试回调记录」查看验签结果。'
      : ''

    ElMessageBox.confirm(
      `确认对订单【${row.order_no}】补单？将置为已支付并入账+通知（已支付订单仅重发通知）。${extraTip}`,
      '补单确认',
      { type: 'warning' }
    )
      .then(async () => {
        const res: any = await api.reissue({ id: row.id })
        const msg = res?.message || '补单成功'
        if (res?.notify_ok === false) {
          ElMessage.warning(msg)
        } else {
          ElMessage.success(msg)
        }
        refreshData()
        if (isTest || res?.is_test_notify) {
          openTestNotifyDrawer(row)
        }
      })
      .catch(() => {})
  }
</script>

<style scoped>
  .channel-code {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
  }

  .channel-empty {
    color: var(--el-text-color-placeholder);
  }
</style>
