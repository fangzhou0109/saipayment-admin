<template>
  <el-drawer v-model="visible" title="通知日志详情" size="720px" @open="handleOpen">
    <el-descriptions v-loading="loading" :column="1" border>
      <el-descriptions-item label="编号">{{ detail.id }}</el-descriptions-item>
      <el-descriptions-item label="平台订单号">{{ detail.order_no }}</el-descriptions-item>
      <el-descriptions-item label="商户号">{{ detail.mch_id || '—' }}</el-descriptions-item>
      <el-descriptions-item label="商户名称">{{ detail.merchant_name || '—' }}</el-descriptions-item>
      <el-descriptions-item label="通知类型">
        {{ bizTypeMap[detail.biz_type] || detail.biz_type }}
      </el-descriptions-item>
      <el-descriptions-item label="通知状态">
        <el-tag :type="(statusMap[detail.status]?.tagType as any) || 'info'" size="small">
          {{ statusMap[detail.status]?.label || detail.status }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="HTTP 状态码">{{ detail.http_code ?? '—' }}</el-descriptions-item>
      <el-descriptions-item label="已重试次数">{{ detail.retry_num ?? 0 }}</el-descriptions-item>
      <el-descriptions-item label="下次重试">{{ detail.next_notify_time || '—' }}</el-descriptions-item>
      <el-descriptions-item label="通知地址">
        <span class="break-all">{{ detail.notify_url || '—' }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ detail.create_time || '—' }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ detail.update_time || '—' }}</el-descriptions-item>
    </el-descriptions>

    <div class="body-block">
      <div class="body-title">请求内容（request_body）</div>
      <pre class="body-pre">{{ formatBody(detail.request_body) }}</pre>
    </div>

    <div class="body-block">
      <div class="body-title">商户响应（response_body）</div>
      <pre class="body-pre">{{ formatBody(detail.response_body) }}</pre>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
  import api from '@/api/payment/notifyLog'
  import { NOTIFY_LOG_BIZ_TYPE_MAP, NOTIFY_LOG_STATUS_MAP } from '../../constants'

  interface Props {
    modelValue: boolean
    log?: Record<string, any>
  }
  interface Emits {
    (e: 'update:modelValue', value: boolean): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    log: undefined
  })
  const emit = defineEmits<Emits>()

  const bizTypeMap = NOTIFY_LOG_BIZ_TYPE_MAP
  const statusMap = NOTIFY_LOG_STATUS_MAP
  const loading = ref(false)
  const detail = ref<Record<string, any>>({})

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  /** JSON 美化展示，非 JSON 则原样输出 */
  const formatBody = (raw?: string) => {
    if (!raw) return '—'
    try {
      return JSON.stringify(JSON.parse(raw), null, 2)
    } catch {
      return raw
    }
  }

  const handleOpen = async () => {
    detail.value = { ...(props.log || {}) }
    const id = props.log?.id
    if (!id) return
    loading.value = true
    try {
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
  .body-block {
    margin-top: 16px;
  }
  .body-title {
    margin-bottom: 8px;
    font-weight: 600;
    font-size: 14px;
  }
  .body-pre {
    margin: 0;
    padding: 12px;
    max-height: 280px;
    overflow: auto;
    font-size: 12px;
    line-height: 1.5;
    border-radius: 6px;
    background: var(--el-fill-color-light);
    white-space: pre-wrap;
    word-break: break-all;
  }
</style>
