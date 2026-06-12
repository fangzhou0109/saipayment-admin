<template>
  <el-drawer
    v-model="visible"
    title="测试回调记录"
    size="720px"
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <el-alert type="info" :closable="false" show-icon class="tip-alert">
      <template #title>
        平台补单/入账后会 POST 到订单 <code>notify_url</code>。配置为
        <code>/pay/test/notify</code> 时由本系统模拟商户收妥并回应 <code>SUCCESS</code>，形成测试闭环。
      </template>
    </el-alert>

    <div class="toolbar">
      <span class="url-label">默认测试地址：</span>
      <code class="url-text">{{ defaultNotifyUrl || '—' }}</code>
      <el-button :loading="loading" @click="loadList">刷新</el-button>
    </div>

    <el-form :inline="true" class="filter-form" @submit.prevent>
      <el-form-item label="平台订单号">
        <el-input v-model="filterOrderNo" clearable placeholder="可选" style="width: 200px" />
      </el-form-item>
      <el-form-item label="商户订单号">
        <el-input v-model="filterOutTradeNo" clearable placeholder="可选" style="width: 200px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="loading" @click="loadList">查询</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" border stripe size="small" empty-text="暂无测试回调记录">
      <el-table-column prop="received_at" label="接收时间" width="170" />
      <el-table-column prop="order_no" label="平台订单号" min-width="180" />
      <el-table-column prop="order_id" label="商户订单号" min-width="160" />
      <el-table-column prop="money" label="金额(分)" width="100" align="right" />
      <el-table-column prop="mch_id" label="商户号" width="120" />
      <el-table-column label="验签" min-width="120">
        <template #default="{ row }">
          <el-tag :type="row.sign_ok ? 'success' : 'danger'" size="small">
            {{ row.sign_ok ? '通过' : '失败' }}
          </el-tag>
          <span v-if="!row.sign_ok && row.sign_message" class="sign-msg">
            {{ row.sign_message }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="client_ip" label="来源IP" width="120" />
    </el-table>
  </el-drawer>
</template>

<script setup lang="ts">
  import api from '@/api/payment/order'

  interface Props {
    modelValue: boolean
    /** 打开时预填的平台订单号 */
    orderNo?: string
    /** 打开时预填的商户订单号 */
    outTradeNo?: string
  }
  interface Emits {
    (e: 'update:modelValue', value: boolean): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    orderNo: '',
    outTradeNo: ''
  })
  const emit = defineEmits<Emits>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const loading = ref(false)
  const list = ref<Record<string, any>[]>([])
  const defaultNotifyUrl = ref('')
  const filterOrderNo = ref('')
  const filterOutTradeNo = ref('')

  const handleOpen = () => {
    filterOrderNo.value = props.orderNo || ''
    filterOutTradeNo.value = props.outTradeNo || ''
    loadList()
  }

  const loadList = async () => {
    loading.value = true
    try {
      const res: any = await api.testNotifyRecent({
        limit: 30,
        order_no: filterOrderNo.value || undefined,
        out_trade_no: filterOutTradeNo.value || undefined
      })
      list.value = res?.items ?? []
      defaultNotifyUrl.value = res?.default_notify_url ?? ''
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
  .tip-alert {
    margin-bottom: 12px;
  }
  .tip-alert code {
    padding: 1px 4px;
    font-size: 12px;
    border-radius: 4px;
    background: var(--el-fill-color);
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }
  .url-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  .url-text {
    flex: 1;
    min-width: 200px;
    font-size: 12px;
    word-break: break-all;
  }
  .filter-form {
    margin-bottom: 12px;
  }
  .sign-msg {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-color-danger);
  }
</style>
