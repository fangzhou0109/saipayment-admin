<template>
  <el-drawer
    v-model="visible"
    :title="`通道配置 - ${route?.title || ''}`"
    size="720px"
    :close-on-click-modal="false"
    @open="handleOpen"
  >
    <!-- 路由试算：可选商户上下文，对齐生产选路 + 费率预览 -->
    <el-card shadow="never" class="preview-card">
      <div class="preview-row">
        <span class="preview-label">路由试算</span>
        <el-select
          v-model="previewMerchantId"
          placeholder="商户(可选)"
          clearable
          filterable
          style="width: 220px"
        >
          <el-option
            v-for="item in merchantOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-input-number
          v-model="previewAmount"
          :min="0"
          :precision="4"
          :step="100"
          controls-position="right"
          placeholder="金额(元)"
          style="width: 160px"
        />
        <el-button type="primary" :loading="previewLoading" @click="handlePreview">
          试算
        </el-button>
      </div>
      <div v-if="previewResult" class="preview-result-block">{{ previewResult }}</div>
    </el-card>

    <el-alert type="info" :closable="false" show-icon class="bind-tip">
      仅可绑定与当前路由<b>支付类型一致</b>且具备代收能力的启用通道；平台费率由通道/商户授权配置，路由本身不设置费率。
    </el-alert>

    <!-- 通道绑定列表工具栏 -->
    <div class="toolbar">
      <el-button v-permission="'pay:route:save'" type="primary" @click="openEdit('add')">
        <template #icon>
          <ArtSvgIcon icon="ri:add-fill" />
        </template>
        新增通道绑定
      </el-button>
      <el-button :loading="loading" @click="loadList">刷新</el-button>
    </div>

    <!-- 通道绑定列表 -->
    <el-table v-loading="loading" :data="list" border stripe size="small">
      <el-table-column prop="id" label="编号" width="70" align="center" />
      <el-table-column label="通道" min-width="160">
        <template #default="{ row }">
          {{ channelMap[row.channel_id] || `#${row.channel_id}` }}
        </template>
      </el-table-column>
      <el-table-column prop="money_rule" label="金额规则" min-width="160">
        <template #default="{ row }">
          {{ row.money_rule || '不限' }}
        </template>
      </el-table-column>
      <el-table-column prop="weight" label="权重" width="80" align="center" />
      <el-table-column label="状态" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
            {{ row.status === 1 ? '正常' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button
            v-permission="'pay:route:update'"
            type="primary"
            link
            @click="openEdit('edit', row)"
          >
            编辑
          </el-button>
          <el-button
            v-permission="'pay:route:destroy'"
            type="danger"
            link
            @click="handleDelete(row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 绑定编辑弹窗 -->
    <el-dialog
      v-model="editVisible"
      :title="editType === 'add' ? '新增通道绑定' : '编辑通道绑定'"
      width="560px"
      align-center
      append-to-body
      :close-on-click-modal="false"
    >
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="110px">
        <el-form-item label="通道" prop="channel_id">
          <el-select
            v-model="editForm.channel_id"
            placeholder="请选择通道"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in channelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="金额规则" prop="money_rule">
          <el-input
            v-model="editForm.money_rule"
            placeholder="范围 300-10000 或 固定池 300+500+1000，留空不限"
          />
        </el-form-item>
        <el-form-item label="权重" prop="weight">
          <el-input-number
            v-model="editForm.weight"
            :min="1"
            controls-position="right"
            style="width: 100%"
          />
          <div class="form-hint">同路由下多通道的分配权重（加权随机策略）；与通道表 sort 无关</div>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <sa-radio v-model="editForm.status" dict="data_status" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEdit">提交</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
  import routeApi from '@/api/payment/route'
  import routeChannelApi from '@/api/payment/routeChannel'
  import channelApi from '@/api/payment/channel'
  import merchantApi from '@/api/payment/merchant'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'

  interface Props {
    modelValue: boolean
    route?: Record<string, any>
  }
  interface Emits {
    (e: 'update:modelValue', value: boolean): void
  }
  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    route: undefined
  })
  const emit = defineEmits<Emits>()

  // 抽屉显隐双向绑定
  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  // ===== 通道绑定列表 =====
  const loading = ref(false)
  const list = ref<Record<string, any>[]>([])

  // 通道选项与 id->名称 映射（用于下拉与列表展示）
  const channelOptions = ref<Array<{ label: string; value: number }>>([])
  const channelMap = reactive<Record<number, string>>({})

  /**
   * 加载与当前路由 pay_type 一致的代收通道下拉（每次打开抽屉刷新）
   */
  const loadChannels = async () => {
    const payType = props.route?.pay_type
    if (!payType) {
      channelOptions.value = []
      return
    }
    const res = await channelApi.list({ page: 1, limit: 200, pay_type: payType, status: 1 })
    const rows: any[] = res?.data ?? []
    channelOptions.value = rows.map((c) => ({
      label: `${c.title}（${c.code}）`,
      value: c.id
    }))
    Object.keys(channelMap).forEach((key) => delete channelMap[Number(key)])
    rows.forEach((c) => {
      channelMap[c.id] = `${c.title}（${c.code}）`
    })
  }

  /**
   * 加载当前路由下的通道绑定列表
   */
  const loadList = async () => {
    if (!props.route?.id) return
    loading.value = true
    try {
      const res = await routeChannelApi.list({ route_id: props.route.id, page: 1, limit: 200 })
      list.value = res?.data ?? []
    } finally {
      loading.value = false
    }
  }

  /**
   * 抽屉打开时初始化：拉通道选项 + 绑定列表，重置试算
   */
  const handleOpen = async () => {
    previewAmount.value = undefined
    previewMerchantId.value = undefined
    previewResult.value = ''
    await Promise.all([loadChannels(), loadMerchants(), loadList()])
  }

  // ===== 路由试算 =====
  const previewAmount = ref<number | undefined>(undefined)
  const previewMerchantId = ref<number | undefined>(undefined)
  const previewLoading = ref(false)
  const previewResult = ref('')
  const merchantOptions = ref<Array<{ label: string; value: number }>>([])

  /**
   * 加载商户下拉（试算排障用，可选）
   */
  const loadMerchants = async () => {
    if (merchantOptions.value.length > 0) return
    const page = await merchantApi.list({ page: 1, limit: 300, status: 1 })
    const rows: any[] = page?.data ?? []
    merchantOptions.value = rows.map((m) => ({
      label: `${m.name || m.mch_id}（${m.mch_id}）`,
      value: m.id
    }))
  }

  /**
   * 试算：调用后端 preview，展示命中通道与费率预览
   */
  const handlePreview = async () => {
    if (!props.route?.id) return
    if (previewAmount.value == null) {
      ElMessage.warning('请输入试算金额')
      return
    }
    previewLoading.value = true
    try {
      const params: Record<string, any> = {
        route_id: props.route.id,
        amount: previewAmount.value
      }
      if (previewMerchantId.value) {
        params.merchant_id = previewMerchantId.value
      }

      const res = await routeApi.preview(params)

      if (!res?.hit) {
        previewResult.value = res?.message || '未命中任何通道'
        return
      }

      const title =
        res.channel_title || channelMap[res.channel_id as number] || `#${res.channel_id}`
      const lines = [
        `命中通道：${title}`,
        `平台费率：${res.resolved_rate ?? '-'}%`,
        `手续费预览：${res.fee_preview ?? '-'} 元`,
        `入账预览：${res.real_amount_preview ?? '-'} 元`
      ]
      if (res.profitable === false) {
        lines.push(`⚠ ${res.message || '平台费率不大于上游成本'}`)
      }
      previewResult.value = lines.join('\n')
    } finally {
      previewLoading.value = false
    }
  }

  // ===== 绑定新增/编辑 =====
  const editVisible = ref(false)
  const editType = ref<'add' | 'edit'>('add')
  const editFormRef = ref<FormInstance>()

  const initialEditForm = {
    id: null as number | null,
    route_id: 0,
    channel_id: undefined as number | undefined,
    money_rule: '',
    weight: 1,
    status: 1
  }
  const editForm = reactive({ ...initialEditForm })

  const editRules = reactive<FormRules>({
    channel_id: [{ required: true, message: '请选择通道', trigger: 'change' }],
    weight: [{ required: true, message: '请输入权重', trigger: 'blur' }]
  })

  /**
   * 打开绑定编辑弹窗
   * @param type add | edit
   * @param row 编辑时的行数据
   */
  const openEdit = (type: 'add' | 'edit', row?: Record<string, any>) => {
    editType.value = type
    Object.assign(editForm, initialEditForm)
    editForm.route_id = props.route?.id || 0
    if (type === 'edit' && row) {
      Object.assign(editForm, {
        id: row.id,
        route_id: row.route_id,
        channel_id: row.channel_id,
        money_rule: row.money_rule || '',
        weight: row.weight ?? 1,
        status: row.status ?? 1
      })
    }
    editVisible.value = true
  }

  /**
   * 提交绑定新增/编辑
   */
  const submitEdit = async () => {
    if (!editFormRef.value) return
    try {
      await editFormRef.value.validate()
      if (editType.value === 'add') {
        await routeChannelApi.save(editForm)
        ElMessage.success('新增成功')
      } else {
        await routeChannelApi.update(editForm)
        ElMessage.success('修改成功')
      }
      editVisible.value = false
      loadList()
    } catch (error) {
      console.log('表单验证失败:', error)
    }
  }

  /**
   * 删除绑定
   * @param row 行数据
   */
  const handleDelete = (row: Record<string, any>) => {
    ElMessageBox.confirm('确认删除该通道绑定？', '提示', { type: 'warning' })
      .then(async () => {
        await routeChannelApi.delete({ ids: [row.id] })
        ElMessage.success('删除成功')
        loadList()
      })
      .catch(() => {})
  }
</script>

<style scoped>
  .bind-tip {
    margin-bottom: 12px;
  }
  .preview-card {
    margin-bottom: 12px;
  }
  .preview-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .preview-label {
    font-weight: 600;
  }
  .preview-result-block {
    margin-top: 10px;
    padding: 8px 12px;
    border-radius: 4px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-line;
  }
  .toolbar {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  .form-hint {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }
</style>
