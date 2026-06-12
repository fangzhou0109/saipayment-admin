<template>
  <div class="art-full-height">
    <!-- 搜索面板 -->
    <TableSearch v-model="searchForm" @search="handleSearch" @reset="resetSearchParams" />

    <ElCard class="art-table-card" shadow="never">
      <!-- 表格头部 -->
      <ArtTableHeader v-model:columns="columnChecks" :loading="loading" @refresh="refreshData">
        <template #left>
          <ElSpace wrap>
            <ElButton v-permission="'pay:merchant:save'" @click="showDialog('add')" v-ripple>
              <template #icon>
                <ArtSvgIcon icon="ri:add-fill" />
              </template>
              新增商户
            </ElButton>
            <ElButton
              v-permission="'pay:merchant:destroy'"
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
        <!-- 操作列 -->
        <template #operation="{ row }">
          <div class="flex gap-2">
            <SaButton
              v-permission="'pay:merchant:update'"
              type="secondary"
              @click="showDialog('edit', row)"
            />
            <SaButton
              v-permission="'pay:merchant:destroy'"
              type="error"
              @click="deleteRow(row, api.delete, refreshData)"
            />
            <ArtButtonMore :list="getMerchantMoreList()" @click="(item) => handleMerchantMore(item, row)" />
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

    <ChannelDrawerPay v-model="payChannelDrawerVisible" :merchant="payChannelMerchant" />
    <ChannelDrawerTransfer
      v-model="transferChannelDrawerVisible"
      :merchant="transferChannelMerchant"
    />
    <RateTransferDialog
      v-model="rateTransferDialogVisible"
      :merchant="rateTransferMerchant"
      @success="refreshData"
    />
    <SingleLimitDialog
      v-model="singleLimitDialogVisible"
      :merchant="singleLimitMerchant"
      @success="refreshData"
    />

    <el-dialog
      v-model="credentialsDialogVisible"
      :title="credentialsDialogTitle"
      width="720px"
      :close-on-click-modal="false"
    >
      <div v-loading="credentialsLoading">
        <CredentialsPanel
          v-if="credentialsData"
          :credentials="credentialsData"
          :mode="credentialsMode"
        />
      </div>
      <template #footer>
        <el-button type="primary" @click="credentialsDialogVisible = false">
          {{ credentialsMode === 'issue' ? '我已保存，关闭' : '关闭' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/hooks/core/useTable'
  import { useSaiAdmin } from '@/composables/useSaiAdmin'
  import { ElMessageBox } from 'element-plus'
  import api from '@/api/payment/merchant'
  import TableSearch from './modules/table-search.vue'
  import EditDialog from './modules/edit-dialog.vue'
  import ChannelDrawerPay from './modules/channel-drawer-pay.vue'
  import ChannelDrawerTransfer from './modules/channel-drawer-transfer.vue'
  import RateTransferDialog from './modules/rate-transfer-dialog.vue'
  import SingleLimitDialog from './modules/single-limit-dialog.vue'
  import CredentialsPanel from './modules/credentials-panel.vue'
  import type { ButtonMoreItem } from '@/components/core/forms/art-button-more/index.vue'

  defineOptions({ name: 'PayMerchant' })

  /** 行内「更多」：费率/限额与通道配置独立入口，主弹窗仅维护基础资料 */
  const getMerchantMoreList = (): ButtonMoreItem[] => [
    {
      key: 'payRate',
      label: '支付通道配置',
      auth: 'pay:merchant:channel',
      icon: 'ri:percent-line'
    },
    {
      key: 'transferChannel',
      label: '代付通道配置',
      auth: 'pay:merchant:channel',
      icon: 'ri:bank-card-line'
    },
    {
      key: 'rateTransfer',
      label: '默认代付费率',
      auth: 'pay:merchant:update',
      icon: 'ri:money-cny-circle-line'
    },
    { key: 'api', label: 'API资料', auth: 'pay:merchant:read', icon: 'ri:file-code-line' },
    {
      key: 'resetKey',
      label: '重置密钥',
      auth: 'pay:merchant:resetKey',
      icon: 'ri:key-line',
      color: 'var(--el-color-warning)'
    }
  ]

  const handleMerchantMore = (item: ButtonMoreItem, row: Record<string, any>) => {
    switch (item.key) {
      case 'payRate':
        openPayChannelDrawer(row)
        break
      case 'rateTransfer':
        openRateTransferDialog(row)
        break
      case 'singleLimit':
        openSingleLimitDialog(row)
        break
      case 'transferChannel':
        openTransferChannelDrawer(row)
        break
      case 'api':
        openApiCredentials(row)
        break
      case 'resetKey':
        handleResetKey(row)
        break
    }
  }

  // 搜索表单
  const searchForm = ref({
    keyword: undefined,
    mch_id: undefined,
    status: undefined
  })

  // 搜索处理：合并参数后查询（不跳转分页）
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
        { prop: 'mch_id', label: '商户号', minWidth: 160 },
        { prop: 'name', label: '商户名称', minWidth: 140 },
        { prop: 'balance', label: '可用余额(元)', width: 130, align: 'right' },
        { prop: 'balance_freeze', label: '冻结余额(元)', width: 130, align: 'right' },
        {
          prop: 'ip_whitelist_status',
          label: 'IP白名单',
          width: 90,
          align: 'center',
          formatter: (row: Record<string, any>) =>
            Number(row.ip_whitelist_status) === 1 ? '开启' : '关闭'
        },
        { prop: 'rate_transfer', label: '代付费率(%)', width: 110, align: 'right' },
        {
          prop: 'single_limit',
          label: '单笔限额(元)',
          width: 150,
          align: 'center',
          formatter: (row: Record<string, any>) => formatSingleLimit(row)
        },
        { prop: 'status', label: '状态', saiType: 'dict', saiDict: 'data_status', width: 90 },
        { prop: 'create_time', label: '创建时间', width: 170, sortable: true },
        { prop: 'operation', label: '操作', width: 160, fixed: 'right', useSlot: true }
      ]
    }
  })

  /** 列表展示商户级单笔限额：双 0 显示「不限」 */
  const formatSingleLimit = (row: Record<string, any>) => {
    const min = Number(row.single_min ?? 0)
    const max = Number(row.single_max ?? 0)
    if (min <= 0 && max <= 0) return '不限'
    const minText = min > 0 ? min : '不限'
    const maxText = max > 0 ? max : '不限'
    return `${minText} ~ ${maxText}`
  }

  const payChannelDrawerVisible = ref(false)
  const payChannelMerchant = ref<Record<string, any>>()
  const transferChannelDrawerVisible = ref(false)
  const transferChannelMerchant = ref<Record<string, any>>()
  const rateTransferDialogVisible = ref(false)
  const rateTransferMerchant = ref<Record<string, any>>()
  const singleLimitDialogVisible = ref(false)
  const singleLimitMerchant = ref<Record<string, any>>()
  const credentialsDialogVisible = ref(false)
  const credentialsLoading = ref(false)
  const credentialsMode = ref<'issue' | 'view'>('view')
  const credentialsData = ref<Record<string, any> | null>(null)

  const credentialsDialogTitle = computed(() =>
    credentialsMode.value === 'issue'
      ? '密钥已重置 — 对接凭证'
      : `商户 API 资料 — ${credentialsData.value?.mch_id ?? ''}`
  )

  /** 查看商户 API 对接资料 */
  const openApiCredentials = async (row: Record<string, any>) => {
    credentialsMode.value = 'view'
    credentialsData.value = null
    credentialsDialogVisible.value = true
    credentialsLoading.value = true
    try {
      const res: any = await api.credentials(row.id)
      if (res) {
        credentialsData.value = res
      }
    } finally {
      credentialsLoading.value = false
    }
  }

  const openPayChannelDrawer = (row: Record<string, any>) => {
    payChannelMerchant.value = row
    payChannelDrawerVisible.value = true
  }

  const openTransferChannelDrawer = (row: Record<string, any>) => {
    transferChannelMerchant.value = row
    transferChannelDrawerVisible.value = true
  }

  const openRateTransferDialog = (row: Record<string, any>) => {
    rateTransferMerchant.value = row
    rateTransferDialogVisible.value = true
  }

  const openSingleLimitDialog = (row: Record<string, any>) => {
    singleLimitMerchant.value = row
    singleLimitDialogVisible.value = true
  }

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
   * 重置商户密钥：二次确认后调用后端，成功后展示新 MD5 密钥供复制下发
   * @param row 商户行数据
   */
  const handleResetKey = (row: Record<string, any>) => {
    ElMessageBox.confirm(`确认重置商户【${row.mch_id}】的密钥？重置后旧密钥立即失效。`, '提示', {
      type: 'warning'
    })
      .then(async () => {
        const res: any = await api.resetKey({ id: row.id })
        if (res?.secret_key) {
          credentialsMode.value = 'issue'
          credentialsData.value = {
            mch_id: res.mch_id ?? row.mch_id,
            merchant_name: row.name,
            secret_key: res.secret_key,
            platform_rsa_public_key: res.platform_rsa_public_key ?? '',
            rsa_public_key: res.rsa_public_key ?? ''
          }
          credentialsDialogVisible.value = true
        }
      })
      .catch(() => {})
  }
</script>
