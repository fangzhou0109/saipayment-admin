<template>
  <el-dialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增商户' : '编辑商户'"
    width="640px"
    align-center
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-alert
      v-if="dialogType === 'add'"
      type="info"
      :closable="false"
      show-icon
      class="tip-alert"
    >
      费率与单笔限额请在创建成功后，于列表操作列「更多」中单独配置。
    </el-alert>

    <el-form
      ref="formRef"
      v-loading="formLoading"
      :model="formData"
      :rules="rules"
      label-width="120px"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="商户号" prop="mch_id">
            <el-input
              v-model="formData.mch_id"
              placeholder="请输入商户号"
              :disabled="dialogType === 'edit'"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="商户名称" prop="name">
            <el-input v-model="formData.name" placeholder="请输入商户名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="门户登录名" prop="login_name">
            <el-input v-model="formData.login_name" placeholder="商户门户登录名" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="门户登录密码" prop="password">
            <el-input
              v-model="formData.password"
              type="password"
              show-password
              autocomplete="new-password"
              :placeholder="dialogType === 'add' ? '商户门户登录密码' : '留空表示不修改'"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="IP 白名单" prop="ip_whitelist_status">
            <el-switch
              v-model="formData.ip_whitelist_status"
              :active-value="1"
              :inactive-value="2"
              inline-prompt
              active-text="开启"
              inactive-text="关闭"
            />
            <div class="field-tip">开启后门户登录与 API 网关均校验来源 IP</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <sa-radio v-model="formData.status" dict="data_status" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="IP 白名单" prop="ip_whitelist">
            <el-input
              v-model="formData.ip_whitelist"
              type="textarea"
              :rows="2"
              placeholder="多个 IP 用英文逗号分隔；开启白名单时至少填写一个 IP"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="2"
              placeholder="请输入备注"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <CredentialsPanel v-if="issuedCredentials" :credentials="issuedCredentials" />

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button v-if="!issuedCredentials" type="primary" @click="handleSubmit">提交</el-button>
      <el-button v-else type="primary" @click="handleClose">我已保存，关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import api from '@/api/payment/merchant'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import CredentialsPanel, {
    type MerchantCredentials
  } from './credentials-panel.vue'

  interface Props {
    modelValue: boolean
    dialogType: string
    data?: Record<string, any>
  }
  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    data: undefined
  })
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const formLoading = ref(false)
  const issuedCredentials = ref<MerchantCredentials | null>(null)

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const rules = computed<FormRules>(() => ({
    mch_id: [{ required: true, message: '请输入商户号', trigger: 'blur' }],
    name: [{ required: true, message: '请输入商户名称', trigger: 'blur' }],
    login_name: [
      { required: true, message: '请输入门户登录名', trigger: 'blur' },
      { min: 4, max: 50, message: '门户登录名长度需在 4~50 之间', trigger: 'blur' }
    ],
    password: [
      {
        required: props.dialogType === 'add',
        message: '请输入门户登录密码',
        trigger: 'blur'
      },
      {
        validator: (_rule: any, value: string, callback: (err?: Error) => void) => {
          if (value && (value.length < 6 || value.length > 32)) {
            callback(new Error('门户登录密码长度需在 6~32 之间'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }],
    ip_whitelist: [
      {
        validator: (_rule: any, value: string, callback: (err?: Error) => void) => {
          if (Number(formData.ip_whitelist_status) !== 1) {
            callback()
            return
          }
          const items = String(value ?? '')
            .split(/[,，]/)
            .map((s) => s.trim())
            .filter(Boolean)
          if (items.length === 0) {
            callback(new Error('开启 IP 白名单时必须填写至少一个 IP'))
          } else {
            callback()
          }
        },
        trigger: 'blur'
      }
    ]
  }))

  const initialFormData = {
    id: null,
    mch_id: '',
    name: '',
    login_name: '',
    password: '',
    ip_whitelist: '',
    ip_whitelist_status: 2,
    status: 1,
    remark: ''
  }

  const formData = reactive({ ...initialFormData })

  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        initPage()
      }
    }
  )

  const initPage = async () => {
    issuedCredentials.value = null
    Object.assign(formData, initialFormData)
    if (props.dialogType === 'edit' && props.data?.id) {
      formLoading.value = true
      try {
        const res: any = await api.read(props.data.id)
        fillFormFromRecord(res || props.data)
      } catch {
        fillFormFromRecord(props.data)
      } finally {
        formLoading.value = false
      }
      return
    }
    if (props.data) {
      fillFormFromRecord(props.data)
    }
  }

  /** 用接口/行数据回填表单（编辑须 read 拉全量，避免列表缺字段把白名单开关重置为关闭） */
  const fillFormFromRecord = (record: Record<string, any>) => {
    for (const key in formData) {
      if (record[key] != null && record[key] !== undefined) {
        ;(formData as any)[key] = record[key]
      }
    }
    formData.ip_whitelist_status = Number(record.ip_whitelist_status ?? formData.ip_whitelist_status ?? 2)
  }

  const handleClose = () => {
    visible.value = false
    formRef.value?.resetFields()
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
      if (props.dialogType === 'add') {
        const res: any = await api.save(formData)
        ElMessage.success('新增成功')
        emit('success')
        if (res?.secret_key) {
          issuedCredentials.value = {
            mch_id: res.mch_id ?? formData.mch_id,
            secret_key: res.secret_key,
            platform_rsa_public_key: res.platform_rsa_public_key ?? ''
          }
          return
        }
      } else {
        await api.update(formData)
        ElMessage.success('修改成功')
        emit('success')
      }
      handleClose()
    } catch (error) {
      console.log('表单验证失败:', error)
    }
  }
</script>

<style scoped>
  .tip-alert {
    margin-bottom: 16px;
  }

  .field-tip {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--el-text-color-secondary);
  }
</style>
