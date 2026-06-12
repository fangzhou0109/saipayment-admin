<template>
  <sa-search-bar
    ref="searchBarRef"
    v-model="formData"
    label-width="100px"
    :showExpand="false"
    @reset="handleReset"
    @search="handleSearch"
  >
    <el-col v-bind="setSpan(6)">
      <el-form-item label="提现单号" prop="keyword">
        <el-input v-model="formData.keyword" placeholder="请输入提现单号" clearable />
      </el-form-item>
    </el-col>
    <el-col v-bind="setSpan(6)">
      <el-form-item label="商户ID" prop="merchant_id">
        <el-input v-model="formData.merchant_id" placeholder="请输入商户ID" clearable />
      </el-form-item>
    </el-col>
    <el-col v-bind="setSpan(6)">
      <el-form-item label="状态" prop="status">
        <el-select v-model="formData.status" placeholder="请选择" clearable style="width: 100%">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </el-col>
  </sa-search-bar>
</template>

<script setup lang="ts">
  import { WITHDRAW_STATUS_OPTIONS } from '../../constants'

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

  const statusOptions = WITHDRAW_STATUS_OPTIONS
  const searchBarRef = ref()

  // 表单数据双向绑定
  const formData = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  // 重置
  function handleReset() {
    searchBarRef.value?.ref.resetFields()
    emit('reset')
  }

  // 搜索
  async function handleSearch() {
    emit('search', formData.value)
  }

  // 栅格占据的列数（响应式断点）
  const setSpan = (span: number) => {
    return {
      span,
      xs: 24,
      sm: span >= 12 ? span : 12,
      md: span >= 8 ? span : 8,
      lg: span,
      xl: span
    }
  }
</script>
