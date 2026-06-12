<template>
  <el-drawer v-model="visible" title="订单详情" size="640px" @open="handleOpen">
    <el-descriptions v-loading="loading" :column="1" border>
      <el-descriptions-item label="平台订单号">{{ detail.order_no }}</el-descriptions-item>
      <el-descriptions-item label="商户订单号">{{ detail.out_trade_no }}</el-descriptions-item>
      <el-descriptions-item label="上游订单号">{{
        detail.upstream_no || '-'
      }}</el-descriptions-item>
      <el-descriptions-item label="商户号">{{ detail.mch_id }}</el-descriptions-item>
      <el-descriptions-item label="支付类型">
        {{ payTypeMap[detail.pay_type] || detail.pay_type }}
      </el-descriptions-item>
      <el-descriptions-item label="代收通道">
        <template v-if="detail.channel_title">
          {{ detail.channel_title }}（{{ detail.channel_code }}）
        </template>
        <template v-else>—</template>
      </el-descriptions-item>
      <el-descriptions-item label="订单金额">{{ detail.amount }} 元</el-descriptions-item>
      <el-descriptions-item label="手续费">{{ detail.fee }} 元</el-descriptions-item>
      <el-descriptions-item label="实收金额">{{ detail.real_amount }} 元</el-descriptions-item>
      <el-descriptions-item label="费率快照">{{ detail.rate }} %</el-descriptions-item>
      <el-descriptions-item label="费率来源">
        {{ rateSourceMap[detail.rate_source] || detail.rate_source || '-' }}
      </el-descriptions-item>
      <el-descriptions-item
        v-if="detail.rate_source === 'merchant_channel' && detail.merchant_channel_id"
        label="授权绑定ID"
      >
        {{ detail.merchant_channel_id }}
      </el-descriptions-item>
      <el-descriptions-item label="订单状态">
        <el-tag :type="(orderStatusMap[detail.status]?.tagType as any) || 'info'" size="small">
          {{ orderStatusMap[detail.status]?.label || detail.status }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="入账状态">
        <el-tag
          :type="(settleStatusMap[detail.settle_status]?.tagType as any) || 'info'"
          size="small"
        >
          {{ settleStatusMap[detail.settle_status]?.label || detail.settle_status }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="通知状态">
        <el-tag
          :type="(notifyStatusMap[detail.notify_status]?.tagType as any) || 'info'"
          size="small"
        >
          {{ notifyStatusMap[detail.notify_status]?.label || detail.notify_status }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="商品名称">{{
        detail.commodity_name || '-'
      }}</el-descriptions-item>
      <el-descriptions-item label="用户端IP">{{ detail.client_ip || '-' }}</el-descriptions-item>
      <el-descriptions-item label="透传参数">{{ detail.extra || '-' }}</el-descriptions-item>
      <el-descriptions-item label="异步通知地址">{{
        detail.notify_url || '-'
      }}</el-descriptions-item>
      <el-descriptions-item label="同步跳转地址">{{
        detail.return_url || '-'
      }}</el-descriptions-item>
      <el-descriptions-item label="支付链接/二维码">
        <span class="break-all">{{ detail.pay_url || '-' }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="过期时间">{{ detail.expire_time || '-' }}</el-descriptions-item>
      <el-descriptions-item label="支付时间">{{ detail.pay_time || '-' }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ detail.create_time || '-' }}</el-descriptions-item>
    </el-descriptions>
  </el-drawer>
</template>

<script setup lang="ts">
  import api from '@/api/payment/order'
  import {
    PAY_TYPE_MAP,
    ORDER_STATUS_MAP,
    SETTLE_STATUS_MAP,
    NOTIFY_STATUS_MAP,
    RATE_SOURCE_MAP
  } from '../../constants'

  interface Props {
    modelValue: boolean
    order?: Record<string, any>
  }
  interface Emits {
    (e: 'update:modelValue', value: boolean): void
  }
  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    order: undefined
  })
  const emit = defineEmits<Emits>()

  const payTypeMap = PAY_TYPE_MAP
  const orderStatusMap = ORDER_STATUS_MAP
  const settleStatusMap = SETTLE_STATUS_MAP
  const notifyStatusMap = NOTIFY_STATUS_MAP
  const rateSourceMap = RATE_SOURCE_MAP

  const loading = ref(false)
  // 详情数据：先用列表行数据兜底，打开时再拉最新详情
  const detail = ref<Record<string, any>>({})

  // 抽屉显隐双向绑定
  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  /**
   * 抽屉打开时拉取最新订单详情（确保 pay_time/notify_status 等为最新）
   */
  const handleOpen = async () => {
    detail.value = { ...(props.order || {}) }
    const id = props.order?.id
    if (!id) return
    loading.value = true
    try {
      // request 封装已解包 { code, message, data }，返回值即 data
      const data = await api.read(id)
      if (data) {
        detail.value = data
      }
    } finally {
      loading.value = false
    }
  }
</script>

<style scoped>
  .break-all {
    word-break: break-all;
  }
</style>
