<template>
  <ElCard shadow="never" class="audit-card">
    <template #header>
      <div class="card-header">
        <span>待审队列</span>
        <RouterLink :to="activeTab === 'withdraw' ? '/payment/withdraw' : '/payment/recharge'">
          <ElButton link type="primary">全部</ElButton>
        </RouterLink>
      </div>
    </template>
    <ElTabs v-model="activeTab" class="audit-tabs">
      <ElTabPane :label="`提现(${withdraws.length})`" name="withdraw">
        <ElTable :data="withdraws" size="small" empty-text="暂无待审提现">
          <ElTableColumn prop="merchant_name" label="商户" min-width="90" show-overflow-tooltip />
          <ElTableColumn prop="amount" label="金额" width="88" align="right" />
          <ElTableColumn prop="create_time" label="时间" width="150" show-overflow-tooltip />
        </ElTable>
      </ElTabPane>
      <ElTabPane :label="`充值(${recharges.length})`" name="recharge">
        <ElTable :data="recharges" size="small" empty-text="暂无待审充值">
          <ElTableColumn prop="merchant_name" label="商户" min-width="90" show-overflow-tooltip />
          <ElTableColumn prop="amount" label="金额" width="88" align="right" />
          <ElTableColumn prop="create_time" label="时间" width="150" show-overflow-tooltip />
        </ElTable>
      </ElTabPane>
    </ElTabs>
  </ElCard>
</template>

<script setup lang="ts">
  import type { PendingRechargeItem, PendingWithdrawItem } from '../types'

  defineProps<{
    withdraws: PendingWithdrawItem[]
    recharges: PendingRechargeItem[]
  }>()

  const activeTab = ref('withdraw')
</script>

<style scoped lang="scss">
  .audit-card {
    margin-bottom: 16px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .audit-tabs {
    margin-top: -8px;
  }
</style>
