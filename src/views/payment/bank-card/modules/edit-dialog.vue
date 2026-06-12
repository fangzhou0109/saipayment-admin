<template>
  <el-dialog
    v-model="visible"
    :title="dialogType === 'add' ? '绑定银行卡' : '编辑银行卡'"
    width="640px"
    align-center
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="110px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="商户ID" prop="merchant_id">
            <!-- 归属商户：新增可填，编辑后不可改（后端 update 场景已排除，防越权改归属） -->
            <el-input-number
              v-model="formData.merchant_id"
              :min="1"
              :precision="0"
              :controls="false"
              placeholder="归属商户ID"
              :disabled="dialogType === 'edit'"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="持卡人" prop="holder_name">
            <el-input v-model="formData.holder_name" placeholder="请输入持卡人姓名" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="银行卡号" prop="card_no">
            <el-input
              v-model="formData.card_no"
              placeholder="请输入银行卡号（保存前经 Luhn 校验）"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="开户银行" prop="bank_name">
            <el-input v-model="formData.bank_name" placeholder="如：工商银行" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="银行编码" prop="bank_code">
            <el-input v-model="formData.bank_code" placeholder="如：ICBC（可空）" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="开户支行" prop="branch_name">
            <el-input v-model="formData.branch_name" placeholder="开户支行（可空）" />
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

    <!-- 首现卡风控提示（绑卡成功且为该商户首张卡时展示） -->
    <el-alert
      v-if="firstCardHint"
      type="warning"
      :closable="false"
      show-icon
      title="首现卡风控提示：该商户首次绑卡，后续提现到此卡请加强人工复核。"
      style="margin-top: 8px"
    />

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import api from '@/api/payment/bankCard'
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
  // 绑卡后首现卡提示
  const firstCardHint = ref(false)

  // 弹窗显隐双向绑定
  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  // 表单校验规则（与后端 BankCardValidate 对齐）
  const rules = reactive<FormRules>({
    merchant_id: [{ required: true, message: '请填写归属商户ID', trigger: 'blur' }],
    holder_name: [{ required: true, message: '请输入持卡人姓名', trigger: 'blur' }],
    card_no: [{ required: true, message: '请输入银行卡号', trigger: 'blur' }]
  })

  // 初始表单数据
  const initialFormData = {
    id: null,
    merchant_id: undefined,
    holder_name: '',
    card_no: '',
    bank_name: '',
    bank_code: '',
    branch_name: '',
    status: 1,
    remark: ''
  }

  const formData = reactive<Record<string, any>>({ ...initialFormData })

  // 监听弹窗打开，初始化表单
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        initPage()
      }
    }
  )

  /**
   * 初始化页面数据：重置后回填编辑数据
   */
  const initPage = async () => {
    firstCardHint.value = false
    Object.assign(formData, initialFormData)
    if (props.data && Object.keys(props.data).length > 0) {
      await nextTick()
      initForm()
    }
  }

  /**
   * 用行数据回填表单（仅回填已存在的字段）
   */
  const initForm = () => {
    if (props.data) {
      for (const key in formData) {
        if (props.data[key] != null && props.data[key] != undefined) {
          formData[key] = props.data[key]
        }
      }
    }
  }

  /**
   * 关闭弹窗并重置表单
   */
  const handleClose = () => {
    visible.value = false
    formRef.value?.resetFields()
  }

  /**
   * 提交表单：新增（绑卡）/更新
   * 新增成功后若后端返回 first_card=true，则展示首现卡风控提示并保留弹窗。
   */
  const handleSubmit = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
      if (props.dialogType === 'add') {
        const res: any = await api.save(formData)
        ElMessage.success(res?.message || '绑卡成功')
        emit('success')
        // 首现卡：保留弹窗展示风控提示，运营确认后手动关闭
        if (res?.data?.first_card) {
          firstCardHint.value = true
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
