<!-- 商户全局保底代付费率配置（与代付通道配置分离，列表操作列入口） -->
<template>
  <el-dialog
    v-model="visible"
    :title="`代付费率 - ${merchantLabel}`"
    width="520px"
    align-center
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <el-alert type="info" :closable="false" show-icon class="tip-alert">
      全局保底费率：无代付通道或未按通道配置时用于提现算费；已授权代付通道时优先使用「代付通道」中的费率。填
      <b>0</b> 表示免代付手续费。
    </el-alert>

    <el-form
      ref="formRef"
      v-loading="loading"
      :model="formData"
      :rules="rules"
      label-width="120px"
      class="form-body"
    >
      <el-form-item label="代付费率(%)" prop="rate_transfer">
        <el-input-number
          v-model="formData.rate_transfer"
          :min="0"
          :max="100"
          :precision="4"
          :step="0.1"
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
  /** read 接口拉取的完整商户快照，提交 update 时带上必填字段 */
  const merchantSnapshot = ref<Record<string, any>>({})

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const merchantLabel = computed(
    () => props.merchant?.name || props.merchant?.mch_id || merchantSnapshot.value.mch_id || ''
  )

  const formData = reactive({ rate_transfer: 0 })

  const rules: FormRules = {
    rate_transfer: [
      {
        validator: (_rule, value, callback) => {
          const n = Number(value ?? 0)
          if (Number.isNaN(n) || n < 0 || n > 100) {
            callback(new Error('代付费率需在 0~100 之间'))
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
      formData.rate_transfer = Number(res?.rate_transfer ?? 0)
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
        rate_transfer: formData.rate_transfer
      })
      ElMessage.success('代付费率已保存')
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
