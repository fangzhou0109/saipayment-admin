<template>
  <div class="test-order-panel">
    <el-alert type="info" :closable="false" show-icon class="tip-alert">
      <template #title>
        <b>选路规则</b>：已配置综合路由且金额命中时走路由（<code>route_channel.weight</code>）；否则在已授权同
        <code>pay_type</code> 通道中先按 <code>channel.money_rule</code> 过滤，再按
        <code>channel.sort</code> 加权直连。须先在商户「代收通道配置」中授权通道。
      </template>
    </el-alert>

    <el-alert type="success" :closable="false" show-icon class="tip-alert">
      <template #title>
        <b>测试闭环</b>：notify_url 留空时默认 <code>{{ defaultNotifyUrl || '/pay/test/notify' }}</code>。
        下单后到「代收订单」点<b>补单</b>触发入账+通知，再点<b>测试回调记录</b>查看验签结果。
      </template>
    </el-alert>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      class="test-form"
      @submit.prevent
    >
      <el-row :gutter="16">
        <el-col :span="embedded ? 24 : 12">
          <el-form-item label="商户" prop="merchant_id">
            <el-select
              v-model="form.merchant_id"
              placeholder="选择商户"
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="item in merchantOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="embedded ? 24 : 12">
          <el-form-item label="支付类型" prop="pay_type">
            <el-select v-model="form.pay_type" placeholder="选择支付类型" style="width: 100%">
              <el-option
                v-for="item in payTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="embedded ? 24 : 12">
          <el-form-item label="订单金额(元)" prop="amount">
            <el-input-number
              v-model="form.amount"
              :min="0.01"
              :precision="2"
              :step="10"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="embedded ? 24 : 12">
          <el-form-item label="商户订单号" prop="out_trade_no">
            <el-input v-model="form.out_trade_no" placeholder="留空自动生成" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="异步通知 URL" prop="notify_url">
            <el-input
              v-model="form.notify_url"
              :placeholder="`留空使用 ${defaultNotifyUrl || '/pay/test/notify'}`"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="商品名称" prop="commodity_name">
            <el-input v-model="form.commodity_name" placeholder="可选" clearable />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item>
        <el-button
          v-permission="'pay:order:testSubmit'"
          type="primary"
          :loading="submitting"
          @click="handleSubmit"
        >
          提交测试下单
        </el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>

    <el-divider v-if="lastResult" />

    <div v-if="lastResult" class="result-block">
      <div class="result-title">最近一次结果</div>
      <el-descriptions :column="embedded ? 1 : 2" border size="small">
        <el-descriptions-item label="平台订单号">{{ lastResult.order_no }}</el-descriptions-item>
        <el-descriptions-item label="商户订单号">{{ lastResult.out_trade_no }}</el-descriptions-item>
        <el-descriptions-item label="选路模式">
          <el-tag :type="lastResult.pick_mode === 'route' ? 'primary' : 'success'" size="small">
            {{ lastResult.pick_mode === 'route' ? '综合路由' : '通道直连(规则+sort)' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="路由 ID">
          {{ lastResult.route_id > 0 ? lastResult.route_id : '—' }}
        </el-descriptions-item>
        <el-descriptions-item label="通道 ID">{{ lastResult.channel_id }}</el-descriptions-item>
        <el-descriptions-item label="手续费">{{ lastResult.fee }}</el-descriptions-item>
        <el-descriptions-item label="实收金额">{{ lastResult.real_amount }}</el-descriptions-item>
        <el-descriptions-item label="上游单号">{{ lastResult.upstream_no || '—' }}</el-descriptions-item>
        <el-descriptions-item label="notify_url" :span="2">
          {{ lastResult.notify_url || '—' }}
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="lastResult.order_no" class="next-step-tip">
        下一步：在「代收订单」对该单<b>补单</b>，完成后点「测试回调记录」验证通知闭环。
      </div>
      <div v-if="lastResult.pay_url" class="pay-url-box">
        <span class="pay-url-label">支付链接：</span>
        <el-link type="primary" :href="lastResult.pay_url" target="_blank">
          {{ lastResult.pay_url }}
        </el-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import merchantApi from '@/api/payment/merchant'
  import orderApi from '@/api/payment/order'
  import orderTestApi from '@/api/payment/orderTest'
  import { PAY_TYPE_OPTIONS } from '@/views/payment/constants'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'

  interface Props {
    /** 抽屉内嵌模式：表单单列布局 */
    embedded?: boolean
    /** 打开时预填支付类型（如从通道列表带入） */
    defaultPayType?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    embedded: false,
    defaultPayType: undefined
  })

  const formRef = ref<FormInstance>()
  const submitting = ref(false)
  const merchantOptions = ref<Array<{ label: string; value: number }>>([])
  const payTypeOptions = PAY_TYPE_OPTIONS
  const lastResult = ref<Record<string, any> | null>(null)
  const defaultNotifyUrl = ref('')
  const merchantsLoaded = ref(false)

  const form = reactive({
    merchant_id: undefined as number | undefined,
    pay_type: 3,
    amount: 100,
    out_trade_no: '',
    notify_url: '',
    commodity_name: '后台测试下单'
  })

  const rules: FormRules = {
    merchant_id: [{ required: true, message: '请选择商户', trigger: 'change' }],
    pay_type: [{ required: true, message: '请选择支付类型', trigger: 'change' }],
    amount: [{ required: true, message: '请填写金额', trigger: 'blur' }]
  }

  const loadMerchants = async () => {
    if (merchantsLoaded.value) return
    const res: any = await merchantApi.list({ page: 1, limit: 500, status: 1, saiType: 'list' })
    const rows = res?.data ?? []
    merchantOptions.value = rows.map((m: any) => ({
      label: `${m.name}（${m.mch_id}）`,
      value: Number(m.id)
    }))
    merchantsLoaded.value = true
  }

  const loadDefaultNotifyUrl = async () => {
    try {
      const res: any = await orderApi.testNotifyRecent({ limit: 1 })
      defaultNotifyUrl.value = res?.default_notify_url ?? ''
    } catch {
      defaultNotifyUrl.value = ''
    }
  }

  /** 按外部上下文重置表单（抽屉每次打开时调用） */
  const applyDefaults = (payType?: number) => {
    formRef.value?.resetFields()
    form.amount = 100
    form.pay_type = payType && payType > 0 ? payType : 3
    form.commodity_name = '后台测试下单'
    form.out_trade_no = ''
    form.notify_url = ''
    form.merchant_id = undefined
    lastResult.value = null
  }

  const handleSubmit = async () => {
    if (!formRef.value) return
    await formRef.value.validate()
    submitting.value = true
    try {
      const res: any = await orderTestApi.testSubmit({
        merchant_id: form.merchant_id,
        pay_type: form.pay_type,
        amount: form.amount,
        out_trade_no: form.out_trade_no || undefined,
        notify_url: form.notify_url || undefined,
        commodity_name: form.commodity_name || undefined
      })
      lastResult.value = res ?? null
      ElMessage.success('测试下单成功')
    } catch (e) {
      console.error(e)
    } finally {
      submitting.value = false
    }
  }

  const resetForm = () => {
    applyDefaults(props.defaultPayType)
  }

  /** 抽屉 @open 或页面挂载时初始化 */
  const initPanel = async (payType?: number) => {
    await Promise.all([loadMerchants(), loadDefaultNotifyUrl()])
    applyDefaults(payType ?? props.defaultPayType)
  }

  onMounted(() => {
    if (!props.embedded) {
      initPanel()
    }
  })

  defineExpose({ initPanel })
</script>

<style scoped>
  .tip-alert {
    margin-bottom: 16px;
  }
  .tip-alert code {
    padding: 1px 4px;
    font-size: 12px;
    border-radius: 4px;
    background: var(--el-fill-color);
  }
  .test-form {
    max-width: 880px;
  }
  .result-block {
    margin-top: 8px;
  }
  .result-title {
    margin-bottom: 12px;
    font-weight: 600;
  }
  .pay-url-box {
    margin-top: 12px;
    word-break: break-all;
  }
  .pay-url-label {
    color: var(--el-text-color-secondary);
  }
  .next-step-tip {
    margin-top: 12px;
    padding: 8px 12px;
    font-size: 13px;
    line-height: 1.6;
    border-radius: 6px;
    background: var(--el-color-warning-light-9);
    color: var(--el-text-color-regular);
  }
</style>
