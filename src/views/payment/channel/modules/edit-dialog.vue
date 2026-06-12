<template>
  <el-dialog
    v-model="visible"
    :title="dialogType === 'add' ? '新增代收通道' : '编辑代收通道'"
    width="760px"
    align-center
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <!-- 字段填写说明（新增/编辑均展示，默认展开） -->
    <el-collapse v-model="helpActive" class="channel-help">
      <el-collapse-item title="代收通道配置填写说明" name="help">
        <el-alert type="info" :closable="false" show-icon class="help-tip">
          <template #title>
            通道编码与适配器是核心：编码决定平台回调地址路径，适配器决定如何调用上游协议。创建后<strong>通道编码不可修改</strong>。
          </template>
        </el-alert>
        <ul class="help-list">
          <li>
            <b>通道名称</b>：后台展示用，建议含上游与用途，如「支付宝扫码-生产A」。
          </li>
          <li>
            <b>通道编码</b>：本系统内唯一标识（英文/数字/下划线），如
            <code>alipay_scan_a</code>。用于拼接上游回调地址
            <code>{域名}/pay/notify/{通道编码}</code>，落单后请勿改动。
          </li>
          <li>
            <b>适配器</b>：从后端已注册协议实现中选择（非手填）。决定下单/验签/解析逻辑：
            <code>mock</code> 本地联调；
            <code>alipay_scan</code> / <code>wechat_scan</code> 通用扫码。同适配器可配置多条通道（不同编码与凭证）。
          </li>
          <li>
            <b>支付类型</b>：与商户 API 下单时的 <code>pay_type</code> 对应，路由选通道时须匹配。
          </li>
          <li>
            <b>上游网关</b>：上游支付下单接口地址（完整 URL）。Mock 适配器可填占位地址。
          </li>
          <li>
            <b>上游商户号 / MD5 密钥</b>：上游分配的商户号与签名密钥；适配器下单、回调验签时使用。<b>编辑时密钥留空表示不修改</b>。
          </li>
          <li>
            <b>上游 RSA 公钥 / 私钥</b>：仅 RSA 签名通道需要；MD5 通道可留空。支持 PEM 或裸 base64。
          </li>
          <li>
            <b>上游费率 / 平台费率</b>：百分数，用于成本核算与路由试算（如 2.6 表示 2.6%）。
          </li>
          <li>
            <b>金额规则</b>：综合路由未命中时的<b>直连选路</b>过滤条件，格式与「路由管理 →
            通道绑定」一致：留空=不限；范围如 <code>300-10000</code>；固定面额池如
            <code>800+1000+2000</code>。综合路由内仍用绑定表的金额规则。
          </li>
          <li>
            <b>直连权重</b>（原列表排序）：无综合路由命中时，在通过金额规则的已授权通道中按本字段<b>加权随机</b>选取；数值越大越优先。同路由下多通道仍由绑定表的<b>权重</b>分配。
          </li>
          <li><b>状态</b>：停用后不参与下单路由与回调处理。</li>
          <li><b>备注</b>：运营备注，仅后台可见。</li>
        </ul>
        <div v-if="dialogType === 'add'" class="help-example">
          <span class="help-example-label">本地联调示例：</span>
          编码 <code>mock_test_001</code> + 适配器 <code>Mock 模拟通道</code> + 支付类型按需选择 + 状态启用。
        </div>
      </el-collapse-item>
    </el-collapse>

    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="通道名称" prop="title">
            <el-input v-model="formData.title" placeholder="请输入通道名称" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="通道编码" prop="code">
            <!-- 通道编码新增可填，编辑后不可改（后端 update 场景已排除） -->
            <el-input
              v-model="formData.code"
              placeholder="唯一编码，如 alipay_scan_a"
              :disabled="dialogType === 'edit'"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="适配器" prop="adapter">
            <el-select v-model="formData.adapter" placeholder="请选择适配器" style="width: 100%">
              <el-option
                v-for="item in adapterOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="支付类型" prop="pay_type">
            <el-select v-model="formData.pay_type" placeholder="请选择" style="width: 100%">
              <el-option
                v-for="item in payTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="上游网关" prop="gateway_url">
            <el-input v-model="formData.gateway_url" placeholder="上游支付网关地址" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上游商户号" prop="upstream_mch_id">
            <el-input v-model="formData.upstream_mch_id" placeholder="上游分配的商户号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="上游MD5密钥" prop="upstream_key">
            <el-input
              v-model="formData.upstream_key"
              placeholder="上游 MD5 密钥（编辑时留空表示不修改）"
              show-password
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="上游RSA公钥" prop="upstream_public_key">
            <el-input
              v-model="formData.upstream_public_key"
              type="textarea"
              :rows="2"
              placeholder="上游 RSA 公钥（PEM 或裸 base64，可空）"
            />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="上游RSA私钥" prop="upstream_private_key">
            <el-input
              v-model="formData.upstream_private_key"
              type="textarea"
              :rows="2"
              placeholder="上游 RSA 私钥（PEM 或裸 base64，可空）"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="上游费率(%)" prop="rate">
            <el-input-number
              v-model="formData.rate"
              :min="0"
              :max="100"
              :precision="4"
              :step="0.1"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="平台费率(%)" prop="rate_self">
            <el-input-number
              v-model="formData.rate_self"
              :min="0"
              :max="100"
              :precision="4"
              :step="0.1"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="金额规则" prop="money_rule">
            <el-input
              v-model="formData.money_rule"
              placeholder="范围 300-10000 或 固定池 300+500+1000，留空不限"
            />
            <div class="form-hint">直连选路时按订单金额过滤；综合路由内仍用绑定表规则</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="直连权重" prop="sort">
            <el-input-number
              v-model="formData.sort"
              :min="0"
              controls-position="right"
              style="width: 100%"
            />
            <div class="form-hint">直连模式下加权随机权重，越大越优先</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态" prop="status">
            <sa-radio v-model="formData.status" dict="data_status" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="2"
              placeholder="请输入备注"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import api from '@/api/payment/channel'
  import { PAY_TYPE_OPTIONS } from '../../constants'
  import { ElMessage } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'

  interface Props {
    modelValue: boolean
    dialogType: string
    data?: Record<string, any>
  }
  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    dialogType: 'add',
    data: undefined
  })
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  /** 填写说明折叠面板（默认展开） */
  const helpActive = ref(['help'])
  const payTypeOptions = PAY_TYPE_OPTIONS
  // 适配器下拉选项（从后端 adapters 接口拉取）
  const adapterOptions = ref<Array<{ label: string; value: string }>>([])

  // 弹窗显隐双向绑定
  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  // 表单校验规则（与后端 ChannelValidate 保持一致）
  const rules = reactive<FormRules>({
    title: [{ required: true, message: '请输入通道名称', trigger: 'blur' }],
    code: [{ required: true, message: '请输入通道编码', trigger: 'blur' }],
    adapter: [{ required: true, message: '请选择适配器', trigger: 'change' }],
    pay_type: [{ required: true, message: '请选择支付类型', trigger: 'change' }],
    status: [{ required: true, message: '请选择状态', trigger: 'change' }]
  })

  // 初始表单数据
  const initialFormData = {
    id: null,
    title: '',
    code: '',
    adapter: '',
    pay_type: 1,
    gateway_url: '',
    upstream_mch_id: '',
    upstream_key: '',
    upstream_public_key: '',
    upstream_private_key: '',
    rate: 0,
    rate_self: 0,
    money_rule: '',
    sort: 0,
    status: 1,
    remark: ''
  }

  const formData = reactive({ ...initialFormData })

  /**
   * 拉取适配器下拉选项（http 已解包 data，直接使用返回值）
   */
  const loadAdapters = async () => {
    if (adapterOptions.value.length > 0) return
    const list = await api.adapters()
    adapterOptions.value = Array.isArray(list) ? list : []
  }

  // 监听弹窗打开，初始化表单 + 拉取适配器
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        loadAdapters()
        initPage()
      }
    }
  )

  /**
   * 初始化页面数据：重置后回填编辑数据
   */
  const initPage = async () => {
    Object.assign(formData, initialFormData)
    if (props.data) {
      await nextTick()
      initForm()
    }
  }

  /**
   * 用行数据回填表单（敏感字段如密钥后端不下发，保持留空表示不修改）
   */
  const initForm = () => {
    if (props.data) {
      for (const key in formData) {
        if (props.data[key] != null && props.data[key] != undefined) {
          ;(formData as any)[key] = props.data[key]
        }
      }
    }
  }

  /**
   * 关闭弹窗并重置表单
   */
  const handleClose = () => {
    visible.value = false
    formRef.value?.resetFields()
  }

  /**
   * 提交表单：新增/更新
   */
  const handleSubmit = async () => {
    if (!formRef.value) return
    try {
      await formRef.value.validate()
      if (props.dialogType === 'add') {
        await api.save(formData)
        ElMessage.success('新增成功')
      } else {
        await api.update(formData)
        ElMessage.success('修改成功')
      }
      emit('success')
      handleClose()
    } catch (error) {
      console.log('表单验证失败:', error)
    }
  }
</script>

<style scoped>
  .channel-help {
    margin-bottom: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    overflow: hidden;
  }
  .channel-help :deep(.el-collapse-item__header) {
    padding: 0 12px;
    font-weight: 600;
    background: var(--el-fill-color-light);
  }
  .channel-help :deep(.el-collapse-item__wrap) {
    border-top: 1px solid var(--el-border-color-lighter);
  }
  .channel-help :deep(.el-collapse-item__content) {
    padding: 12px 14px 14px;
  }
  .help-tip {
    margin-bottom: 12px;
  }
  .help-list {
    margin: 0;
    padding-left: 18px;
    font-size: 13px;
    line-height: 1.75;
    color: var(--el-text-color-regular);
  }
  .help-list li {
    margin-bottom: 6px;
  }
  .help-list code {
    padding: 1px 5px;
    font-size: 12px;
    border-radius: 4px;
    background: var(--el-fill-color);
    color: var(--el-color-primary);
  }
  .help-example {
    margin-top: 10px;
    padding: 8px 10px;
    font-size: 13px;
    line-height: 1.6;
    border-radius: 6px;
    background: var(--el-color-success-light-9);
    color: var(--el-text-color-regular);
  }
  .help-example-label {
    font-weight: 600;
    color: var(--el-color-success-dark-2);
  }
  .help-example code {
    padding: 1px 5px;
    font-size: 12px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.6);
  }
  .form-hint {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }
</style>
