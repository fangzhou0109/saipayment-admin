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
      <ElFormItem label="商户号" prop="mch_id">
        <ElInput v-model="formData.mch_id" placeholder="商户号" clearable />
      </ElFormItem>
    </ElCol>
    <ElCol v-bind="setSpan(6)">
      <ElFormItem label="通知类型" prop="biz_type">
        <ElSelect v-model="formData.biz_type" placeholder="全部" clearable>
          <ElOption
            v-for="item in bizTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>
    </ElCol>
    <ElCol v-bind="setSpan(6)">
      <ElFormItem label="通知状态" prop="status">
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
  </sa-search-bar>
</template>

<script setup lang="ts">
  import { NOTIFY_LOG_BIZ_TYPE_OPTIONS, NOTIFY_LOG_STATUS_OPTIONS } from '../../constants'

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

  const bizTypeOptions = NOTIFY_LOG_BIZ_TYPE_OPTIONS
  const statusOptions = NOTIFY_LOG_STATUS_OPTIONS
  const searchBarRef = ref()

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

  const setSpan = (span: number) => ({
    span,
    xs: 24,
    sm: span >= 12 ? span : 12,
    md: span >= 8 ? span : 8,
    lg: span,
    xl: span
  })
</script>
