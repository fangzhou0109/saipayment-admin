<template>
  <ElCard shadow="never" class="insight-card rank-card">
    <template #header>
      <div class="card-header">
        <span>今日商户实收 TOP5</span>
        <RouterLink to="/payment/merchant">
          <ElButton link type="primary">商户</ElButton>
        </RouterLink>
      </div>
    </template>
    <ElTable :data="list" size="small" empty-text="今日暂无实收数据">
      <ElTableColumn type="index" label="#" width="40" align="center" />
      <ElTableColumn prop="merchant_name" label="商户" min-width="100" show-overflow-tooltip />
      <ElTableColumn prop="mch_id" label="商户号" width="100" show-overflow-tooltip />
      <ElTableColumn prop="paid_count" label="笔数" width="56" align="center" />
      <ElTableColumn prop="paid_amount" label="实收(元)" width="96" align="right" />
      <ElTableColumn prop="fee_amount" label="手续费" width="88" align="right" />
    </ElTable>
  </ElCard>
</template>

<script setup lang="ts">
  import type { MerchantRankItem } from '../types'

  defineProps<{
    list: MerchantRankItem[]
  }>()
</script>

<style scoped lang="scss">
  .rank-card {
    min-height: 360px;
  }

  .rank-card :deep(.el-card__body) {
    min-height: 300px;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
