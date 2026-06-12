<template>
  <ElRow :gutter="16">
    <ElCol v-for="item in cards" :key="item.key" :xs="12" :sm="12" :lg="6">
      <RouterLink :to="item.path" class="kpi-card art-card">
        <div class="kpi-icon" :class="item.iconClass">
          <ArtSvgIcon :icon="item.icon" />
        </div>
        <div class="kpi-body">
          <div class="kpi-label">{{ item.label }}</div>
          <div class="kpi-value" :class="item.valueClass">{{ item.value }}</div>
          <div class="kpi-footer">
            <span v-if="item.hint" class="kpi-hint">{{ item.hint }}</span>
            <span v-if="item.change" class="kpi-change" :class="item.changeClass">{{ item.change }}</span>
          </div>
        </div>
      </RouterLink>
    </ElCol>
  </ElRow>
</template>

<script setup lang="ts">
  import type { PlatformDashboardStats } from '../types'

  const props = defineProps<{
    stats: PlatformDashboardStats
  }>()

  const formatRate = (val?: number) => {
    if (val === undefined || val === null) return '0%'
    return `${val}%`
  }

  const formatChange = (val?: number | null) => {
    if (val === undefined || val === null) return ''
    return `较昨日 ${val > 0 ? '+' : ''}${val}%`
  }

  const changeClass = (val?: number | null) => {
    if (val === undefined || val === null) return ''
    if (val > 0) return 'text-success'
    if (val < 0) return 'text-danger'
    return ''
  }

  const cards = computed(() => [
    {
      key: 'today_paid',
      label: '今日实收(元)',
      value: props.stats.today_paid_amount ?? '0.0000',
      path: '/payment/order',
      icon: 'ri:money-cny-circle-line',
      iconClass: 'icon-success',
      valueClass: 'text-success',
      hint: `成功率 ${formatRate(props.stats.today_success_rate)}`,
      change: formatChange(props.stats.paid_amount_change_pct),
      changeClass: changeClass(props.stats.paid_amount_change_pct)
    },
    {
      key: 'today_fee',
      label: '今日手续费(元)',
      value: props.stats.today_fee_amount ?? '0.0000',
      path: '/payment/capital',
      icon: 'ri:percent-line',
      iconClass: 'icon-primary',
      valueClass: 'text-primary',
      hint: '平台收入',
      change: formatChange(props.stats.fee_amount_change_pct),
      changeClass: changeClass(props.stats.fee_amount_change_pct)
    },
    {
      key: 'today_order',
      label: '今日订单(笔)',
      value: String(props.stats.today_order_count ?? 0),
      path: '/payment/order',
      icon: 'ri:file-list-3-line',
      iconClass: 'icon-info',
      valueClass: '',
      hint: `已支付 ${props.stats.today_paid_count ?? 0} 笔`,
      change: formatChange(props.stats.order_count_change_pct),
      changeClass: changeClass(props.stats.order_count_change_pct)
    },
    {
      key: 'balance_pool',
      label: '商户资金池(元)',
      value: props.stats.balance_pool_total ?? '0.0000',
      path: '/payment/merchant',
      icon: 'ri:wallet-3-line',
      iconClass: 'icon-warning',
      valueClass: '',
      hint: `可用 ${props.stats.balance_total ?? '0'} / 冻结 ${props.stats.balance_freeze_total ?? '0'}`,
      change: '',
      changeClass: ''
    }
  ])
</script>

<style scoped lang="scss">
  .kpi-card {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    min-height: 108px;
    padding: 16px;
    margin-bottom: 16px;
    color: inherit;
    text-decoration: none;
    transition: transform 0.15s, box-shadow 0.15s;

    &:hover {
      box-shadow: 0 6px 16px rgb(0 0 0 / 8%);
      transform: translateY(-2px);
    }
  }

  .kpi-icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    font-size: 20px;
    border-radius: 12px;
  }

  .icon-success {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }

  .icon-warning {
    color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
  }

  .icon-primary {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  .icon-info {
    color: var(--el-color-info);
    background: var(--el-fill-color-light);
  }

  .kpi-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .kpi-value {
    margin-top: 6px;
    font-size: 26px;
    font-weight: 600;
    line-height: 1.2;
  }

  .kpi-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 10px;
    margin-top: 6px;
    font-size: 12px;
  }

  .kpi-hint {
    color: var(--el-text-color-secondary);
  }

  .text-success {
    color: var(--el-color-success);
  }

  .text-danger {
    color: var(--el-color-danger);
  }

  .text-primary {
    color: var(--el-color-primary);
  }
</style>
