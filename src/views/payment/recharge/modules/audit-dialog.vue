<template>
  <el-drawer
    v-model="visible"
    :title="readonly ? '充值详情' : '充值审核'"
    size="600px"
    @open="handleOpen"
  >
    <el-descriptions v-loading="loading" :column="1" border>
      <el-descriptions-item label="充值单号">{{ detail.recharge_no }}</el-descriptions-item>
      <el-descriptions-item label="商户号">{{ detail.mch_id }}</el-descriptions-item>
      <el-descriptions-item label="充值金额">{{ detail.amount }} 元</el-descriptions-item>
      <el-descriptions-item label="充值方式">
        {{ typeMap[detail.recharge_type] || detail.recharge_type }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="(statusMap[detail.status]?.tagType as any) || 'info'" size="small">
          {{ statusMap[detail.status]?.label || detail.status }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="审核人">{{ detail.audit_by || '-' }}</el-descriptions-item>
      <el-descriptions-item label="审核时间">{{ detail.audit_time || '-' }}</el-descriptions-item>
      <el-descriptions-item label="审核备注">{{ detail.audit_remark || '-' }}</el-descriptions-item>
      <el-descriptions-item label="备注">{{ detail.remark || '-' }}</el-descriptions-item>
      <el-descriptions-item label="申请时间">{{ detail.create_time || '-' }}</el-descriptions-item>
    </el-descriptions>

    <!-- 审核操作区（仅待审核且非只读时展示） -->
    <template v-if="!readonly && detail.status === 0">
      <el-divider />
      <el-form label-width="90px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.approve">
            <el-radio :value="1">通过（入账到可用余额）</el-radio>
            <el-radio :value="0">驳回（不动余额）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input
            v-model="auditForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入审核备注（驳回时建议填写原因）"
          />
        </el-form-item>
      </el-form>
    </template>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button
        v-if="!readonly && detail.status === 0"
        v-permission="'pay:recharge:audit'"
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        提交审核
      </el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
  import api from '@/api/payment/recharge'
  import { ElMessage } from 'element-plus'
  import { RECHARGE_STATUS_MAP, RECHARGE_TYPE_MAP } from '../../constants'

  interface Props {
    modelValue: boolean
    recharge?: Record<string, any>
    readonly?: boolean
  }
  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }
  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    recharge: undefined,
    readonly: false
  })
  const emit = defineEmits<Emits>()

  const statusMap = RECHARGE_STATUS_MAP
  const typeMap = RECHARGE_TYPE_MAP
  const loading = ref(false)
  const submitting = ref(false)
  const detail = ref<Record<string, any>>({})
  const auditForm = ref<{ approve: number; remark: string }>({ approve: 1, remark: '' })

  // 抽屉显隐双向绑定
  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  /**
   * 抽屉打开时拉取最新充值详情
   */
  const handleOpen = async () => {
    detail.value = { ...(props.recharge || {}) }
    auditForm.value = { approve: 1, remark: '' }
    const id = props.recharge?.id
    if (!id) return
    loading.value = true
    try {
      const res: any = await api.read(id)
      if (res?.data) {
        detail.value = res.data
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 提交审核（通过/驳回）
   */
  const handleSubmit = async () => {
    submitting.value = true
    try {
      const res: any = await api.audit({
        id: detail.value.id,
        approve: auditForm.value.approve,
        remark: auditForm.value.remark
      })
      ElMessage.success(res?.message || '审核完成')
      visible.value = false
      emit('success')
    } finally {
      submitting.value = false
    }
  }
</script>
