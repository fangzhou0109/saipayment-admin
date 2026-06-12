<template>
  <div class="art-full-height">
    <TableSearch v-model="searchForm" @search="handleSearch" @reset="handleReset" />

    <ElCard class="flex flex-col flex-1 min-h-0 art-table-card" shadow="never">
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData" />

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
        <template #bizType="{ row }">
          {{ bizTypeMap[row.biz_type] || row.biz_type }}
        </template>
        <template #notifyUrl="{ row }">
          <span class="url-ellipsis" :title="row.notify_url">{{ row.notify_url || '—' }}</span>
        </template>
        <template #status="{ row }">
          <ElTag :type="(statusMap[row.status]?.tagType as any) || 'info'" size="small">
            {{ statusMap[row.status]?.label || row.status }}
          </ElTag>
        </template>
        <template #operation="{ row }">
          <div class="flex gap-2">
            <ElButton
              v-permission="'pay:notify:read'"
              type="primary"
              size="small"
              plain
              @click="openDetail(row)"
            >
              详情
            </ElButton>
            <ElButton
              v-if="row.status !== 1"
              v-permission="'pay:notify:resend'"
              type="warning"
              size="small"
              plain
              :loading="resendingId === row.id"
              :disabled="resendingId === row.id"
              @click="handleResend(row)"
            >
              重发
            </ElButton>
          </div>
        </template>
      </ArtTable>
    </ElCard>

    <DetailDrawer v-model="detailVisible" :log="currentLog" />
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/hooks/core/useTable'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import api from '@/api/payment/notifyLog'
  import { NOTIFY_LOG_BIZ_TYPE_MAP, NOTIFY_LOG_STATUS_MAP } from '../constants'
  import TableSearch from './modules/table-search.vue'
  import DetailDrawer from './modules/detail-drawer.vue'

  defineOptions({ name: 'PayNotifyLog' })

  const bizTypeMap = NOTIFY_LOG_BIZ_TYPE_MAP
  const statusMap = NOTIFY_LOG_STATUS_MAP

  const detailVisible = ref(false)
  const currentLog = ref<Record<string, any>>({})
  const resendingId = ref<number | string | null>(null)

  const createDefaultSearchForm = () => ({
    order_no: undefined,
    mch_id: undefined,
    biz_type: undefined,
    status: undefined,
    create_time: undefined
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
        { prop: 'id', label: '编号', width: 80, align: 'center' },
        { prop: 'order_no', label: '平台订单号', minWidth: 180 },
        { prop: 'mch_id', label: '商户号', minWidth: 130 },
        { prop: 'biz_type', label: '类型', width: 80, useSlot: true, slotName: 'bizType' },
        {
          prop: 'notify_url',
          label: '通知地址',
          minWidth: 200,
          useSlot: true,
          slotName: 'notifyUrl'
        },
        { prop: 'http_code', label: 'HTTP', width: 80, align: 'center' },
        { prop: 'retry_num', label: '重试', width: 70, align: 'center' },
        { prop: 'status', label: '状态', width: 90, useSlot: true, slotName: 'status' },
        { prop: 'next_notify_time', label: '下次重试', width: 170 },
        { prop: 'create_time', label: '创建时间', width: 170, sortable: true },
        { prop: 'operation', label: '操作', width: 150, fixed: 'right', useSlot: true }
      ]
    }
  })

  const openDetail = (row: Record<string, any>) => {
    currentLog.value = row
    detailVisible.value = true
  }

  /** 人工重发：原样重放已签名通知体 */
  const handleResend = (row: Record<string, any>) => {
    ElMessageBox.confirm(
      `确认重发订单【${row.order_no}】的商户通知？将立即 POST 到 notify_url。`,
      '重发确认',
      { type: 'warning' }
    )
      .then(async () => {
        resendingId.value = row.id
        try {
          const res: any = await api.resend({ id: row.id })
          const msg = res?.message || '重发成功'
          ElMessage.success(msg)
          refreshData()
        } catch (e: any) {
          const msg = e?.message || e?.response?.data?.message || '重发失败'
          ElMessage.error(msg)
          refreshData()
        } finally {
          resendingId.value = null
        }
      })
      .catch(() => {})
  }
</script>

<style scoped>
  .url-ellipsis {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: bottom;
  }
</style>
