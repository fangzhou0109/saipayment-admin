<template>
  <sa-search-bar
    ref="searchBarRef"
    v-model="formData"
    label-width="100px"
    :show-expand="false"
    @reset="handleReset"
    @search="handleSearch"
  >
    <ElCol v-bind="setSpan(6)">
      <ElFormItem label="平台订单号" prop="order_no">
        <ElInput v-model="formData.order_no" placeholder="平台订单号" clearable />
      </ElFormItem>
    </ElCol>
    <ElCol v-bind="setSpan(6)">
      <ElFormItem label="商户订单号" prop="out_trade_no">
        <ElInput v-model="formData.out_trade_no" placeholder="商户订单号" clearable />
      </ElFormItem>
    </ElCol>
    <ElCol v-bind="setSpan(6)">
      <ElFormItem label="商户号" prop="mch_id">
        <ElInput v-model="formData.mch_id" placeholder="商户号" clearable />
      </ElFormItem>
    </ElCol>
    <ElCol v-bind="setSpan(6)">
      <ElFormItem label="支付类型" prop="pay_type">
        <ElSelect
          v-model="formData.pay_type"
          placeholder="全部"
          clearable
          @change="handlePayTypeChange"
        >
          <ElOption
            v-for="item in payTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
    </ElCol>
    <ElCol v-bind="setSpan(6)">
      <ElFormItem label="代收通道" prop="channel_id">
        <ElSelect
          v-model="formData.channel_id"
          placeholder="全部"
          clearable
          filterable
          :loading="channelLoading"
        >
          <ElOption
            v-for="item in channelOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
    </ElCol>
    <ElCol v-bind="setSpan(6)">
      <ElFormItem label="订单状态" prop="status">
        <ElSelect v-model="formData.status" placeholder="全部" clearable>
          <ElOption
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
    </ElCol>
    <ElCol v-bind="setSpan(12)">
      <ElFormItem label="创建时间" prop="create_time">
        <ElDatePicker
          v-model="formData.create_time"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          clearable
          style="width: 100%"
        />
      </ElFormItem>
    </ElCol>
    <ElCol v-bind="setSpan(12)">
      <ElFormItem label="支付时间" prop="pay_time">
        <ElDatePicker
          v-model="formData.pay_time"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
          clearable
          style="width: 100%"
        />
      </ElFormItem>
    </ElCol>
  </sa-search-bar>
</template>

<script setup lang="ts">
  import channelApi from '@/api/payment/channel'
  import { PAY_TYPE_OPTIONS, ORDER_STATUS_OPTIONS } from '../../constants'

  interface Props {
    modelValue: Record<string, any>
  }
  interface Emits {
    (e: 'update:modelValue', value: Record<string, any>): void
    (e: 'search', params: Record<string, any>): void
    (e: 'reset'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const payTypeOptions = PAY_TYPE_OPTIONS
  const statusOptions = ORDER_STATUS_OPTIONS
  const searchBarRef = ref()
  const channelLoading = ref(false)
  const channelOptions = ref<Array<{ value: number; label: string }>>([])

  /** 加载代收通道下拉（与路由绑定一致：可按 pay_type 收窄） */
  const loadChannelOptions = async (payType?: number) => {
    channelLoading.value = true
    try {
      const params: Record<string, any> = { page: 1, limit: 500, status: 1 }
      if (payType) {
        params.pay_type = payType
      }
      const res = await channelApi.list(params)
      const rows: any[] = res?.data ?? []
      channelOptions.value = rows.map((item) => ({
        value: item.id,
        label: `${item.title}（${item.code}）`
      }))
    } finally {
      channelLoading.value = false
    }
  }

  /** 切换支付类型时刷新通道列表，并清空不再匹配的通道筛选 */
  const handlePayTypeChange = async (payType?: number) => {
    await loadChannelOptions(payType)
    const currentId = formData.value.channel_id
    if (currentId && !channelOptions.value.some((item) => item.value === currentId)) {
      emit('update:modelValue', { ...formData.value, channel_id: undefined })
    }
  }

  onMounted(() => {
    loadChannelOptions(formData.value.pay_type)
  })

  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const handleReset = () => {
    searchBarRef.value?.ref.resetFields()
    emit('reset')
  }

  const handleSearch = () => {
    emit('search', formData.value)
  }

  /** 搜索栏栅格：与商户门户 table-search 保持一致 */
  const setSpan = (span: number) => ({
    span,
    xs: 24,
    sm: span >= 12 ? span : 12,
    md: span >= 8 ? span : 8,
    lg: span,
    xl: span
  })
</script>
