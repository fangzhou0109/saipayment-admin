<template>
  <el-dialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增路由' : '编辑路由'"
    width="600px"
    align-center
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
      <el-form-item label="路由名称" prop="title">
        <el-input v-model="formData.title" placeholder="请输入路由名称" />
      </el-form-item>
      <el-form-item label="支付类型" prop="pay_type">
        <el-select v-model="formData.pay_type" placeholder="请选择" style="width: 100%">
          <el-option
            v-for="item in payTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <div class="form-hint">
          仅可绑定同支付类型的代收通道；已有通道绑定时修改支付类型须先调整绑定。平台费率由通道/商户授权配置，路由本身不设费率。
        </div>
      </el-form-item>
      <el-form-item label="路由优先级" prop="sort">
        <el-input-number
          v-model="formData.sort"
          :min="0"
          controls-position="right"
          style="width: 100%"
        />
        <div class="form-hint">
          数值越大越先遍历（代收选路）；路由内具体通道由「通道绑定」的权重/轮询决定，与通道直连权重无关
        </div>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <sa-radio v-model="formData.status" dict="data_status" />
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import api from '@/api/payment/route'
  import { PAY_TYPE_OPTIONS } from '../../constants'
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
  const payTypeOptions = PAY_TYPE_OPTIONS

  // 弹窗显隐双向绑定
  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  // 表单校验规则（与后端 RouteValidate 保持一致）
  const rules = reactive<FormRules>({
    title: [{ required: true, message: '请输入路由名称', trigger: 'blur' }],
    pay_type: [{ required: true, message: '请选择支付类型', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  })

  // 初始表单数据
  const initialFormData = {
    id: null,
    title: '',
    pay_type: 1,
    sort: 0,
    status: 1,
    remark: ''
  }

  const formData = reactive({ ...initialFormData })

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
    Object.assign(formData, initialFormData)
    if (props.data) {
      await nextTick()
      initForm()
    }
  }

  /**
   * 用行数据回填表单
   */
  const initForm = () => {
    if (props.data) {
      for (const key in formData) {
        if (props.data[key] != null && props.data[key] != undefined) {
          ;(formData as any)[key] = props.data[key]
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
   * 提交表单：新增/更新
   */
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

<style scoped lang="scss">
  .form-hint {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }
</style>
