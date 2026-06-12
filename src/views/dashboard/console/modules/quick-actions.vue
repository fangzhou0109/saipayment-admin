<template>
  <ElCard shadow="never" class="insight-card quick-card">
    <template #header>快捷入口</template>
    <div class="quick-grid">
      <RouterLink
        v-for="item in actions"
        :key="item.path"
        :to="item.path"
        class="quick-item"
      >
        <ArtSvgIcon :icon="item.icon" class="quick-icon" />
        <span class="quick-label">{{ item.label }}</span>
      </RouterLink>
    </div>
  </ElCard>
</template>

<script setup lang="ts">
  /** 平台运营常用菜单入口（与 menu.sql 路径一致） */
  const actions = [
    { label: '订单管理', path: '/payment/order', icon: 'ri:file-list-3-line' },
    { label: '提现审核', path: '/payment/withdraw', icon: 'ri:hand-coin-line' },
    { label: '充值审核', path: '/payment/recharge', icon: 'ri:wallet-3-line' },
    { label: '商户管理', path: '/payment/merchant', icon: 'ri:store-2-line' },
    { label: '代收通道', path: '/payment/channel', icon: 'ri:route-line' },
    { label: '代付通道', path: '/payment/transfer-channel', icon: 'ri:swap-line' },
    { label: '资金流水', path: '/payment/capital', icon: 'ri:exchange-funds-line' },
    { label: '通知日志', path: '/payment/notify-log', icon: 'ri:notification-3-line' }
  ]
</script>

<style scoped lang="scss">
  .quick-card {
    min-height: 320px;
  }

  .quick-card :deep(.el-card__body) {
    justify-content: center;
  }

  .quick-grid {
    display: grid;
    flex: 1;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    align-content: center;
  }

  .quick-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    justify-content: center;
    min-height: 72px;
    padding: 12px 6px;
    color: var(--el-text-color-primary);
    text-decoration: none;
    background: var(--el-fill-color-light);
    border-radius: 8px;
    transition: background 0.15s, color 0.15s;

    &:hover {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
    }
  }

  .quick-icon {
    font-size: 22px;
  }

  .quick-label {
    font-size: 12px;
    line-height: 1.3;
    text-align: center;
  }

  @media (width <= 768px) {
    .quick-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
