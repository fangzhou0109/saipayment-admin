<!-- 平台工作台：四方支付渠道运营指挥台 -->
<template>
  <div v-loading="loading" class="platform-console">
    <HeroPanel
      :stats="stats"
      :display-name="displayName"
      :greeting="greeting"
      :loading="loading"
      @refresh="loadStats"
    />

    <section class="console-section">
      <h3 class="section-title">核心指标</h3>
      <KpiStrip :stats="stats" />
    </section>

    <section class="console-section">
      <h3 class="section-title">经营明细</h3>
      <BusinessPanels :stats="stats" />
    </section>

    <section class="console-section">
      <h3 class="section-title">趋势分析</h3>
      <ElRow :gutter="16">
        <ElCol :xs="24" :xl="14">
          <TrendChart :trend="stats.trend_7d || []" />
        </ElCol>
        <ElCol :xs="24" :xl="10">
          <VolumeChart :trend="stats.trend_7d || []" />
        </ElCol>
      </ElRow>
    </section>

    <section class="console-section insight-section">
      <h3 class="section-title">结构洞察</h3>
      <ElRow :gutter="16" class="insight-row">
        <ElCol :xs="24" :lg="12" class="insight-col">
          <PayTypeChart :dist="stats.pay_type_dist_today || []" />
        </ElCol>
        <ElCol :xs="24" :lg="12" class="insight-col">
          <MerchantRank :list="stats.top_merchants_today || []" />
        </ElCol>
      </ElRow>
      <ElRow :gutter="16" class="insight-row">
        <ElCol :xs="24" :lg="12" class="insight-col">
          <PendingTasks :stats="stats" />
        </ElCol>
        <ElCol :xs="24" :lg="12" class="insight-col">
          <QuickActions />
        </ElCol>
      </ElRow>
    </section>

    <section class="console-section">
      <h3 class="section-title">实时动态</h3>
      <ElRow :gutter="16">
        <ElCol :xs="24" :xl="15">
          <RecentOrders :orders="stats.recent_orders || []" />
        </ElCol>
        <ElCol :xs="24" :xl="9">
          <PendingAudits
            :withdraws="stats.recent_pending_withdraws || []"
            :recharges="stats.recent_pending_recharges || []"
          />
        </ElCol>
      </ElRow>
    </section>
  </div>
</template>

<script setup lang="ts">
  import api from '@/api/payment/dashboard'
  import HeroPanel from './modules/hero-panel.vue'
  import KpiStrip from './modules/kpi-strip.vue'
  import BusinessPanels from './modules/business-panels.vue'
  import TrendChart from './modules/trend-chart.vue'
  import VolumeChart from './modules/volume-chart.vue'
  import PayTypeChart from './modules/pay-type-chart.vue'
  import MerchantRank from './modules/merchant-rank.vue'
  import PendingTasks from './modules/pending-tasks.vue'
  import QuickActions from './modules/quick-actions.vue'
  import RecentOrders from './modules/recent-orders.vue'
  import PendingAudits from './modules/pending-audits.vue'
  import type { PlatformDashboardStats } from './types'
  import { useCommon } from '@/hooks/core/useCommon'
  import { useUserStore } from '@/store/modules/user'

  defineOptions({ name: 'Console' })

  const userStore = useUserStore()
  const loading = ref(false)

  const createDefaultStats = (): PlatformDashboardStats => ({
    stats_time: '',
    merchant_count: 0,
    merchant_active_count: 0,
    balance_total: '0.0000',
    balance_freeze_total: '0.0000',
    balance_pool_total: '0.0000',
    today_order_count: 0,
    today_order_amount: '0.0000',
    today_paid_count: 0,
    today_paid_amount: '0.0000',
    today_fee_amount: '0.0000',
    today_pending_count: 0,
    today_failed_count: 0,
    today_success_rate: 0,
    yesterday_paid_count: 0,
    yesterday_paid_amount: '0.0000',
    paid_amount_change_pct: null,
    order_count_change_pct: null,
    fee_amount_change_pct: null,
    month_order_count: 0,
    month_order_amount: '0.0000',
    month_paid_count: 0,
    month_paid_amount: '0.0000',
    month_fee_amount: '0.0000',
    pending_withdraw_count: 0,
    pending_withdraw_amount: '0.0000',
    pending_recharge_count: 0,
    pending_recharge_amount: '0.0000',
    notify_pending_count: 0,
    notify_failed_count: 0,
    pay_channel_active_count: 0,
    transfer_channel_active_count: 0,
    trend_7d: [],
    pay_type_dist_today: [],
    top_merchants_today: [],
    recent_orders: [],
    recent_pending_withdraws: [],
    recent_pending_recharges: []
  })

  const stats = ref<PlatformDashboardStats>(createDefaultStats())

  const greeting = computed(() => {
    const hour = new Date().getHours()
    if (hour < 12) return '上午好'
    if (hour < 18) return '下午好'
    return '晚上好'
  })

  const displayName = computed(() => {
    const info = userStore.getUserInfo
    return info.realname || info.username || '管理员'
  })

  const loadStats = async () => {
    loading.value = true
    try {
      const data = await api.stats()
      if (data) {
        Object.assign(stats.value, createDefaultStats(), data)
      }
    } finally {
      loading.value = false
    }
  }

  const { scrollToTop } = useCommon()
  scrollToTop()

  onMounted(loadStats)
</script>

<style scoped lang="scss">
  .platform-console {
    padding: 4px 4px 20px;
  }

  .console-section {
    margin-bottom: 8px;
  }

  .section-title {
    margin: 0 0 12px 2px;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);

    &::before {
      display: inline-block;
      width: 3px;
      height: 14px;
      margin-right: 8px;
      vertical-align: -2px;
      content: '';
      background: var(--el-color-primary);
      border-radius: 2px;
    }
  }

  /* 结构洞察：2×2 等高卡片网格 */
  .insight-section {
    .insight-row {
      margin-bottom: 0;
    }

    .insight-col {
      display: flex;
      margin-bottom: 16px;

      :deep(.insight-card) {
        display: flex;
        flex: 1;
        flex-direction: column;
        width: 100%;
        margin-bottom: 0;

        .el-card__body {
          display: flex;
          flex: 1;
          flex-direction: column;
        }
      }
    }
  }
</style>
