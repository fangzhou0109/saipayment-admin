<!-- 商户级代收单笔限额（下单兜底校验；按通道细调走代收费率/代收通道配置） -->
<template>
  <el-dialog
    v-model="visible"
    :title="`单笔限额 - ${merchantLabel}`"
    width="520px"
    align-center
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <el-alert type="info" :closable="false" show-icon class="tip-alert">
      商户级代收兜底限额，填 <b>0</b> 表示不限。按支付类型/通道的细调限额请在「代收费率」中配置。
    </el-alert>

    <el-form
      ref="formRef"
      v-loading="loading"
      :model="formData"
      :rules="rules"
      label-width="120px"
      class="form-body"
    >
      <el-form-item label="单笔最小(元)" prop="single_min">
        <el-input-number
          v-model="formData.single_min"
          :min="0"
          :precision="4"
          :step="100"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="单笔最大(元)" prop="single_max">
        <el-input-number
          v-model="formData.single_max"
          :min="0"
          :precision="4"
          :step="100"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import api from '@/api/payment/merchant'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'

  interface Props {
    modelValue: boolean
    merchant?: Record<string, any>
  }
  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const loading = ref(false)
  const saving = ref(false)
  const merchantSnapshot = ref<Record<string, any>>({})

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const merchantLabel = computed(
    () => props.merchant?.name || props.merchant?.mch_id || merchantSnapshot.value.mch_id || ''
  )

  const formData = reactive({ single_min: 0, single_max: 0 })

  const rules: FormRules = {
    single_max: [
      {
        validator: (_rule, _value, callback) => {
          const min = Number(formData.single_min ?? 0)
          const max = Number(formData.single_max ?? 0)
          if (max > 0 && min > 0 && max < min) {
            callback(new Error('单笔最大不能小于单笔最小'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }

  const handleOpen = async () => {
    if (!props.merchant?.id) return
    loading.value = true
    try {
      const res: any = await api.read(props.merchant.id)
      merchantSnapshot.value = res || {}
      formData.single_min = Number(res?.single_min ?? 0)
      formData.single_max = Number(res?.single_max ?? 0)
    } finally {
      loading.value = false
    }
  }

  const handleSubmit = async () => {
    if (!formRef.value || !merchantSnapshot.value.id) return
    try {
      await formRef.value.validate()
      saving.value = true
      const snap = merchantSnapshot.value
      await api.update({
        id: snap.id,
        name: snap.name,
        login_name: snap.login_name,
        status: snap.status,
        ip_whitelist: snap.ip_whitelist ?? '',
        single_min: formData.single_min,
        single_max: formData.single_max
      })
      ElMessage.success('单笔限额已保存')
      emit('success')
      visible.value = false
    } catch {
      // 校验或请求失败
    } finally {
      saving.value = false
    }
  }
</script>

<style scoped>
  .tip-alert {
    margin-bottom: 16px;
  }

  .form-body {
    padding-top: 4px;
  }
</style>
