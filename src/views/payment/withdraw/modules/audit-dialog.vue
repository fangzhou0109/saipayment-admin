<template>
  <el-drawer
    v-model="visible"
    :title="readonly ? '提现详情' : '提现审核'"
    size="680px"
    @open="handleOpen"
  >
    <el-descriptions v-loading="loading" :column="1" border>
      <el-descriptions-item label="提现单号">{{ detail.withdraw_no }}</el-descriptions-item>
      <el-descriptions-item label="商户号">{{ detail.mch_id }}</el-descriptions-item>
      <el-descriptions-item label="提现金额">{{ detail.amount }} 元</el-descriptions-item>
      <el-descriptions-item label="手续费">{{ detail.fee }} 元</el-descriptions-item>
      <el-descriptions-item label="到账金额">{{ detail.real_amount }} 元</el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="(statusMap[detail.status]?.tagType as any) || 'info'" size="small">
          {{ statusMap[detail.status]?.label || detail.status }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="代付单号">{{ detail.transfer_no || '-' }}</el-descriptions-item>
      <el-descriptions-item label="审核人">{{ detail.audit_by || '-' }}</el-descriptions-item>
      <el-descriptions-item label="审核时间">{{ detail.audit_time || '-' }}</el-descriptions-item>
      <el-descriptions-item label="审核备注">{{ detail.audit_remark || '-' }}</el-descriptions-item>
      <el-descriptions-item label="申请时间">{{ detail.create_time || '-' }}</el-descriptions-item>
    </el-descriptions>

    <!-- 收款银行卡：仅展示申请时落库快照，不回查 bank_card_id -->
    <el-alert
      v-if="!detail.account_no"
      class="snapshot-missing-alert"
      type="warning"
      :closable="false"
      show-icon
      title="该提现单无银行卡快照（多为历史单据），无法展示申请时收款信息。"
    />
    <el-card class="bank-card-panel" shadow="never">
      <template #header>
        <div class="bank-card-panel__title">
          <ArtSvgIcon icon="ri:bank-card-line" />
          <span>收款银行卡</span>
          <el-tag v-if="detail.account_no" size="small" type="info">申请快照</el-tag>
        </div>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="收款人">{{ detail.account_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="银行卡号">
          <span class="account-no-full">{{ detail.account_no || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="开户银行">{{ detail.bank_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="银行编码">{{ detail.bank_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="开户支行">{{ detail.branch_name || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 审核操作区（仅待审核且非只读时展示） -->
    <template v-if="!readonly && detail.status === 0">
      <el-divider />
      <el-form ref="auditFormRef" :model="auditForm" :rules="auditRules" label-width="100px">
        <el-form-item label="审核操作" prop="action">
          <el-radio-group v-model="auditForm.action" class="audit-action-group">
            <el-radio value="pass">常规通过（财务线下已打款）</el-radio>
            <el-radio value="disburse">代付下发</el-radio>
            <el-radio value="reject">拒绝（解冻退款）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="auditForm.action === 'disburse'"
          label="代付渠道"
          prop="channel_id"
        >
          <el-select
            v-model="auditForm.channel_id"
            placeholder="请选择代付渠道"
            style="width: 100%"
            :loading="channelsLoading"
          >
            <el-option
              v-for="item in transferChannels"
              :key="item.id"
              :label="`${item.title}（${item.code}）`"
              :value="item.id"
            />
          </el-select>
          <div v-if="!channelsLoading && transferChannels.length === 0" class="channel-empty-tip">
            该商户暂无已授权代付通道，请先在「代付通道管理」建通道并在商户「代付通道配置」中授权
          </div>
        </el-form-item>
        <el-form-item label="审核备注" prop="remark">
          <el-input
            v-model="auditForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入审核备注（拒绝时建议填写原因）"
          />
        </el-form-item>
        <el-alert
          v-if="auditForm.action === 'pass'"
          type="success"
          :closable="false"
          show-icon
          title="确认财务已线下打款后提交：单据置为「成功」终态，冻结余额扣减，不再触发代付。"
        />
        <el-alert
          v-else-if="auditForm.action === 'disburse'"
          type="warning"
          :closable="false"
          show-icon
          title="提交后将调用上游代付接口，最终成功/失败由代付回调决定。"
        />
      </el-form>
    </template>

    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button
        v-if="!readonly && detail.status === 0"
        v-permission="'pay:withdraw:audit'"
        type="primary"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ submitButtonText }}
      </el-button>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
  import api from '@/api/payment/withdraw'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { WITHDRAW_STATUS_MAP } from '../../constants'

  interface Props {
    modelValue: boolean
    withdraw?: Record<string, any>
    readonly?: boolean
  }
  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }
  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    withdraw: undefined,
    readonly: false
  })
  const emit = defineEmits<Emits>()

  const statusMap = WITHDRAW_STATUS_MAP
  const loading = ref(false)
  const submitting = ref(false)
  const channelsLoading = ref(false)
  const detail = ref<Record<string, any>>({})
  const transferChannels = ref<Array<{ id: number; title: string; code: string }>>([])
  const auditFormRef = ref<FormInstance>()
  const auditForm = ref<{ action: string; channel_id: number | undefined; remark: string }>({
    action: 'pass',
    channel_id: undefined,
    remark: ''
  })

  const auditRules = reactive<FormRules>({
    action: [{ required: true, message: '请选择审核操作', trigger: 'change' }],
    channel_id: [
      {
        validator: (_rule, value, callback) => {
          if (auditForm.value.action === 'disburse' && !value) {
            callback(new Error('请选择代付渠道'))
            return
          }
          callback()
        },
        trigger: 'change'
      }
    ]
  })

  const submitButtonText = computed(() => {
    if (auditForm.value.action === 'disburse') return '提交代付'
    if (auditForm.value.action === 'reject') return '确认拒绝'
    return '确认线下已打款'
  })

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  /** 加载该商户已授权的可选代付通道 */
  const loadTransferChannels = async (merchantId?: number) => {
    const mid = Number(merchantId ?? detail.value.merchant_id ?? props.withdraw?.merchant_id ?? 0)
    if (mid <= 0) {
      transferChannels.value = []
      return
    }

    channelsLoading.value = true
    try {
      const list = await api.transferChannels(mid)
      transferChannels.value = (Array.isArray(list) ? list : []) as Array<{
        id: number
        title: string
        code: string
      }>
      if (transferChannels.value.length === 1) {
        auditForm.value.channel_id = transferChannels.value[0].id
      }
    } finally {
      channelsLoading.value = false
    }
  }

  /** 抽屉打开：拉详情（含银行卡快照）+ 代付通道，重置表单 */
  const handleOpen = async () => {
    detail.value = { ...(props.withdraw || {}) }
    auditForm.value = { action: 'pass', channel_id: undefined, remark: '' }
    const id = props.withdraw?.id
    if (!id) return
    loading.value = true
    try {
      const data = await api.read(id)
      if (data) {
        detail.value = data
      }
      if (!props.readonly) {
        await loadTransferChannels(Number(detail.value.merchant_id))
      }
    } finally {
      loading.value = false
    }
  }

  /** 提交审核 */
  const handleSubmit = async () => {
    if (!auditFormRef.value) return
    try {
      await auditFormRef.value.validate()
      submitting.value = true
      const payload: Record<string, any> = {
        id: detail.value.id,
        action: auditForm.value.action,
        remark: auditForm.value.remark
      }
      if (auditForm.value.action === 'disburse') {
        payload.channel_id = auditForm.value.channel_id
      }
      await api.audit(payload)
      const msgMap: Record<string, string> = {
        pass: '已确认线下打款完成',
        disburse: '已提交代付',
        reject: '已拒绝并解冻退款'
      }
      ElMessage.success(msgMap[auditForm.value.action] || '审核完成')
      visible.value = false
      emit('success')
    } finally {
      submitting.value = false
    }
  }
</script>

<style scoped>
  .snapshot-missing-alert {
    margin-top: 16px;
  }

  .bank-card-panel {
    margin-top: 16px;
    border: 1px solid var(--el-color-primary-light-7);
  }

  .bank-card-panel__title {
    display: flex;
    gap: 8px;
    align-items: center;
    font-weight: 600;
  }

  .account-no-full {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: var(--el-color-primary);
    word-break: break-all;
  }

  .audit-action-group {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .channel-empty-tip {
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-color-warning);
  }
</style>
