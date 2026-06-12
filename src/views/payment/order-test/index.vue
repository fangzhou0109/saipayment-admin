<template>
  <div class="art-full-height order-test-page">
    <ElCard shadow="never">
      <template #header>
        <div class="card-header">
          <span>代收测试下单</span>
          <span class="header-tip">走生产网关逻辑，免商户签名；用于验证通道授权与选路</span>
        </div>
      </template>

      <TestOrderPanel />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import TestOrderPanel from '@/views/payment/order/modules/test-order-panel.vue'

  defineOptions({ name: 'PayOrderTest' })
</script>

<style scoped>
  .card-header {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .header-tip {
    font-size: 12px;
    font-weight: normal;
    color: var(--el-text-color-secondary);
  }
</style>
