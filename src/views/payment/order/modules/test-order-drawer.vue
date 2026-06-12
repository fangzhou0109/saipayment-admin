<template>
  <el-drawer
    v-model="visible"
    title="代收测试下单"
    size="720px"
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <TestOrderPanel ref="panelRef" embedded :default-pay-type="defaultPayType" />
  </el-drawer>
</template>

<script setup lang="ts">
  import TestOrderPanel from './test-order-panel.vue'

  interface Props {
    modelValue: boolean
    /** 打开时预填支付类型（通道页可带入当前筛选或行数据） */
    defaultPayType?: number
  }
  interface Emits {
    (e: 'update:modelValue', value: boolean): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    defaultPayType: undefined
  })
  const emit = defineEmits<Emits>()

  const panelRef = ref<InstanceType<typeof TestOrderPanel>>()

  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const handleOpen = () => {
    panelRef.value?.initPanel(props.defaultPayType)
  }
</script>
