<template>
  <div class="stat-overview">
    <ElRow :gutter="16">
      <ElCol v-for="item in primaryCards" :key="item.key" :xs="12" :sm="12" :lg="6">
        <div class="stat-card art-card">
          <div class="stat-card-icon" :class="item.iconClass">
            <ArtSvgIcon :icon="item.icon" />
          </div>
          <div class="stat-card-body">
            <div class="stat-label">{{ item.label }}</div>
            <div class="stat-value" :class="item.valueClass">{{ item.value }}</div>
            <div v-if="item.hint" class="stat-hint">{{ item.hint }}</div>
          </div>
        </div>
      </ElCol>
    </ElRow>

    <ElRow :gutter="16" class="summary-row">
      <ElCol :xs="24" :md="8">
        <ElCard shadow="never" class="summary-card">
          <template #header>今日代收</template>
          <div class="kv"><span>下单笔数</span><b>{{ stats.today_order_count }}</b></div>
          <div class="kv"><span>下单金额(元)</span><b>{{ stats.today_order_amount }}</b></div>
          <div class="kv"><span>已支付笔数</span><b class="text-success">{{ stats.today_paid_count }}</b></div>
          <div class="kv"><span>实收金额(元)</span><b class="text-success">{{ stats.today_paid_amount }}</b></div>
          <div class="kv"><span>平台手续费(元)</span><b class="text-primary">{{ stats.today_fee_amount }}</b></div>
          <div class="kv">
            <span>待支付 / 失败关闭</span>
            <b>{{ stats.today_pending_count }} / {{ stats.today_failed_count }}</b>
          </div>
          <div class="kv"><span>支付成功率</span><b>{{ formatRate(stats.today_success_rate) }}</b></div>
        </ElCard>
      </ElCol>
      <ElCol :xs="24" :md="8">
        <ElCard shadow="never" class="summary-card">
          <template #header>本月累计</template>
          <div class="kv"><span>下单笔数</span><b>{{ stats.month_order_count }}</b></div>
          <div class="kv"><span>下单金额(元)</span><b>{{ stats.month_order_amount }}</b></div>
          <div class="kv"><span>已支付笔数</span><b>{{ stats.month_paid_count }}</b></div>
          <div class="kv"><span>实收金额(元)</span><b>{{ stats.month_paid_amount }}</b></div>
          <div class="kv"><span>平台手续费(元)</span><b>{{ stats.month_fee_amount }}</b></div>
        </ElCard>
      </ElCol>
      <ElCol :xs="24" :md="8">
        <ElCard shadow="never" class="summary-card">
          <template #header>环比与通道</template>
          <div class="kv"><span>昨日实收(元)</span><b>{{ stats.yesterday_paid_amount }}</b></div>
          <div class="kv"><span>今日实收(元)</span><b>{{ stats.today_paid_amount }}</b></div>
          <div class="kv">
            <span>实收环比</span>
            <b :class="changeClass">{{ formatChange(stats.paid_amount_change_pct) }}</b>
          </div>
          <div class="kv">
            <span>商户资金池(元)</span>
            <b>{{ stats.balance_pool_total }}</b>
          </div>
          <div class="kv">
            <span>启用代收 / 代付通道</span>
            <b>{{ stats.pay_channel_active_count }} / {{ stats.transfer_channel_active_count }}</b>
          </div>
          <div class="kv">
            <span>商户总数 / 正常</span>
            <b>{{ stats.merchant_count }} / {{ stats.merchant_active_count }}</b>
          </div>
        </ElCard>
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  /** 平台工作台统计字段（与后端 AdminDashboardLogic::stats 对齐） */
  interface DashboardStats {
    merchant_count?: number
    merchant_active_count?: number
    balance_pool_total?: string
    today_order_count?: number
    today_order_amount?: string
    today_paid_count?: number
    today_paid_amount?: string
    today_fee_amount?: string
    today_pending_count?: number
    today_failed_count?: number
    today_success_rate?: number
    yesterday_paid_amount?: string
    paid_amount_change_pct?: number | null
    month_order_count?: number
    month_order_amount?: string
    month_paid_count?: number
    month_paid_amount?: string
    month_fee_amount?: string
    pending_withdraw_count?: number
    pending_recharge_count?: number
    notify_pending_count?: number
    notify_failed_count?: number
    pay_channel_active_count?: number
    transfer_channel_active_count?: number
  }

  const props = defineProps<{
    stats: DashboardStats
  }>()

  const formatRate = (val?: number) => {
    if (val === undefined || val === null) return '0%'
    return `${val}%`
  }

  const formatChange = (val?: number | null) => {
    if (val === undefined || val === null) return '—'
    return `${val > 0 ? '+' : ''}${val}%`
  }

  const changeClass = computed(() => {
    const val = props.stats.paid_amount_change_pct
    if (val === undefined || val === null) return ''
    if (val > 0) return 'text-success'
    if (val < 0) return 'text-danger'
    return ''
  })

  const primaryCards = computed(() => [
    {
      key: 'today_paid',
      label: '今日实收(元)',
      value: props.stats.today_paid_amount ?? '0.0000',
      icon: 'ri:money-cny-circle-line',
      iconClass: 'icon-success',
      valueClass: 'text-success',
      hint: `成功率 ${formatRate(props.stats.today_success_rate)}`
    },
    {
      key: 'today_fee',
      label: '今日手续费(元)',
      value: props.stats.today_fee_amount ?? '0.0000',
      icon: 'ri:percent-line',
      iconClass: 'icon-primary',
      valueClass: 'text-primary',
      hint: '已支付订单平台收入'
    },
    {
      key: 'balance_pool',
      label: '商户资金池(元)',
      value: props.stats.balance_pool_total ?? '0.0000',
      icon: 'ri:wallet-3-line',
      iconClass: 'icon-info',
      valueClass: '',
      hint: `正常商户 ${props.stats.merchant_active_count ?? 0} 家`
    },
    {
      key: 'today_order',
      label: '今日订单(笔)',
      value: String(props.stats.today_order_count ?? 0),
      icon: 'ri:file-list-3-line',
      iconClass: 'icon-info',
      valueClass: '',
      hint: `已支付 ${props.stats.today_paid_count ?? 0} 笔`
    },
    {
      key: 'pending_withdraw',
      label: '待审提现(笔)',
      value: String(props.stats.pending_withdraw_count ?? 0),
      icon: 'ri:hand-coin-line',
      iconClass: 'icon-danger',
      valueClass: 'text-danger'
    },
    {
      key: 'pending_recharge',
      label: '待审充值(笔)',
      value: String(props.stats.pending_recharge_count ?? 0),
      icon: 'ri:bank-card-line',
      iconClass: 'icon-warning',
      valueClass: 'text-warning'
    },
    {
      key: 'notify_failed',
      label: '通知失败(笔)',
      value: String(props.stats.notify_failed_count ?? 0),
      icon: 'ri:notification-off-line',
      iconClass: 'icon-danger',
      valueClass: 'text-danger',
      hint: `待通知 ${props.stats.notify_pending_count ?? 0} 笔`
    },
    {
      key: 'month_paid',
      label: '本月实收(元)',
      value: props.stats.month_paid_amount ?? '0.0000',
      icon: 'ri:bar-chart-grouped-line',
      iconClass: 'icon-primary',
      valueClass: '',
      hint: `${props.stats.month_paid_count ?? 0} 笔已支付`
    }
  ])
</script>

<style scoped lang="scss">
  .stat-card {
    position: relative;
    display: flex;
    gap: 12px;
    align-items: flex-start;
    min-height: 96px;
    padding: 16px;
    margin-bottom: 16px;
  }

  .stat-card-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    font-size: 20px;
    border-radius: 10px;
  }

  .icon-success {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }

  .icon-warning {
    color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
  }

  .icon-danger {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9);
  }

  .icon-primary {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  .icon-info {
    color: var(--el-color-info);
    background: var(--el-fill-color-light);
  }

  .stat-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .stat-value {
    margin-top: 6px;
    font-size: 24px;
    font-weight: 600;
    line-height: 1.2;
  }

  .stat-hint {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .summary-row {
    margin-top: 4px;
  }

  .summary-card {
    margin-bottom: 16px;
  }

  .kv {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    font-size: 13px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:last-child {
      border-bottom: none;
    }

    span {
      color: var(--el-text-color-secondary);
    }
  }

  .text-success {
    color: var(--el-color-success);
  }

  .text-warning {
    color: var(--el-color-warning);
  }

  .text-danger {
    color: var(--el-color-danger);
  }

  .text-primary {
    color: var(--el-color-primary);
  }
</style>
