<template>
  <el-dialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增代付通道' : '编辑代付通道'"
    width="760px"
    align-center
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-collapse v-model="helpActive" class="channel-help">
      <el-collapse-item title="代付通道配置说明" name="help">
        <el-alert type="info" :closable="false" show-icon class="help-tip">
          <template #title>
            代付能力<strong>仅认 transfer_adapter</strong>（与代收 adapter 独立）。回调地址为
            <code>{域名}/pay/transferNotify/{通道编码}</code>；创建后通道编码不可修改。
          </template>
        </el-alert>
        <ul class="help-list">
          <li><b>代付适配器</b>：从注册表选择，如 <code>mock_transfer</code>、<code>bank_transfer</code>。</li>
          <li>
            <b>代付平台默认费率</b>：商户未单独配置 <code>rate_transfer</code> 时继承本字段（百分数）。
          </li>
          <li><b>上游网关 / 密钥</b>：与代收通道相同语义；编辑时密钥留空表示不修改。</li>
          <li><b>列表排序</b>：影响提现代付下拉与后台列表展示顺序。</li>
        </ul>
      </el-collapse-item>
    </el-collapse>

    <el-form ref="formRef" :model="formData" :rules="rules" label-width="130px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="通道名称" prop="title">
            <el-input v-model="formData.title" placeholder="请输入通道名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="通道编码" prop="code">
            <el-input
              v-model="formData.code"
              placeholder="唯一编码，如 tf_mock_01"
              :disabled="dialogType === 'edit'"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="代付适配器" prop="transfer_adapter">
            <el-select
              v-model="formData.transfer_adapter"
              placeholder="请选择代付适配器"
              style="width: 100%"
            >
              <el-option
                v-for="item in adapterOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="代付默认费率(%)" prop="rate_transfer_self">
            <el-input-number
              v-model="formData.rate_transfer_self"
              :min="0"
              :max="100"
              :precision="4"
              :step="0.1"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="上游网关" prop="gateway_url">
            <el-input v-model="formData.gateway_url" placeholder="上游代付网关地址" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上游商户号" prop="upstream_mch_id">
            <el-input v-model="formData.upstream_mch_id" placeholder="上游分配的商户号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上游MD5密钥" prop="upstream_key">
            <el-input
              v-model="formData.upstream_key"
              placeholder="编辑时留空表示不修改"
              show-password
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="上游RSA公钥" prop="upstream_public_key">
            <el-input
              v-model="formData.upstream_public_key"
              type="textarea"
              :rows="2"
              placeholder="可空"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="上游RSA私钥" prop="upstream_private_key">
            <el-input
              v-model="formData.upstream_private_key"
              type="textarea"
              :rows="2"
              placeholder="可空"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="列表排序" prop="sort">
            <el-input-number
              v-model="formData.sort"
              :min="0"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <sa-radio v-model="formData.status" dict="data_status" />
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

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import api from '@/api/payment/transferChannel'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'

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
  const helpActive = ref(['help'])
  const adapterOptions = ref<Array<{ label: string; value: string }>>([])

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const rules = reactive<FormRules>({
    title: [{ required: true, message: '请输入通道名称', trigger: 'blur' }],
    code: [{ required: true, message: '请输入通道编码', trigger: 'blur' }],
    transfer_adapter: [{ required: true, message: '请选择代付适配器', trigger: 'change' }],
    rate_transfer_self: [{ required: true, message: '请填写代付默认费率', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  })

  const initialFormData = {
    id: null,
    title: '',
    code: '',
    transfer_adapter: '',
    rate_transfer_self: 0,
    gateway_url: '',
    upstream_mch_id: '',
    upstream_key: '',
    upstream_public_key: '',
    upstream_private_key: '',
    sort: 0,
    status: 1,
    remark: ''
  }

  const formData = reactive({ ...initialFormData })

  const loadAdapters = async () => {
    if (adapterOptions.value.length > 0) return
    const list = await api.transferAdapters()
    adapterOptions.value = Array.isArray(list) ? list : []
  }

  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        loadAdapters()
        initPage()
      }
    }
  )

  const initPage = async () => {
    Object.assign(formData, initialFormData)
    if (props.data) {
      await nextTick()
      initForm()
    }
  }

  const initForm = () => {
    if (!props.data) return
    for (const key in formData) {
      if (props.data[key] != null && props.data[key] !== undefined) {
        ;(formData as any)[key] = props.data[key]
      }
    }
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
        await api.save(formData)
        ElMessage.success('新增成功')
      } else {
        await api.update(formData)
        ElMessage.success('修改成功')
      }
      emit('success')
      handleClose()
    } catch (error) {
      console.log('表单验证失败:', error)
    }
  }
</script>

<style scoped>
  .channel-help {
    margin-bottom: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    overflow: hidden;
  }
  .channel-help :deep(.el-collapse-item__header) {
    padding: 0 12px;
    font-weight: 600;
    background: var(--el-fill-color-light);
  }
  .channel-help :deep(.el-collapse-item__wrap) {
    border-top: 1px solid var(--el-border-color-lighter);
  }
  .channel-help :deep(.el-collapse-item__content) {
    padding: 12px 14px 14px;
  }
  .help-tip {
    margin-bottom: 12px;
  }
  .help-list {
    margin: 0;
    padding-left: 18px;
    font-size: 13px;
    line-height: 1.75;
    color: var(--el-text-color-regular);
  }
  .help-list code {
    padding: 1px 5px;
    font-size: 12px;
    border-radius: 4px;
    background: var(--el-fill-color);
    color: var(--el-color-primary);
  }
</style>
