<template>
  <div class="credentials-panel">
    <el-alert
      :type="mode === 'issue' ? 'success' : 'info'"
      :closable="false"
      show-icon
      :title="alertTitle"
    />

    <el-descriptions v-if="credentials.merchant_name" :column="1" border size="small" class="cred-desc">
      <el-descriptions-item label="商户名称">{{ credentials.merchant_name }}</el-descriptions-item>
    </el-descriptions>

    <el-descriptions :column="1" border size="small" class="cred-desc">
      <el-descriptions-item label="商户号 (mch_id)">
        <div class="cred-row">
          <span class="mono">{{ credentials.mch_id }}</span>
          <el-button link type="primary" size="small" @click="copy(credentials.mch_id)">复制</el-button>
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="MD5 签名密钥 (secret_key)">
        <div class="cred-row">
          <span class="mono break-all">{{ credentials.secret_key }}</span>
          <el-button link type="primary" size="small" @click="copy(credentials.secret_key)">
            复制
          </el-button>
        </div>
        <div class="cred-tip">sign_type=1 时使用；RSA 模式下仍参与拼签名字符串</div>
      </el-descriptions-item>
      <el-descriptions-item label="平台 RSA 公钥 (验异步通知)">
        <div class="cred-row col">
          <pre class="mono pre-key">{{ credentials.platform_rsa_public_key || '—' }}</pre>
          <div class="cred-actions">
            <el-button
              v-if="credentials.platform_rsa_public_key"
              link
              type="primary"
              size="small"
              @click="copy(credentials.platform_rsa_public_key)"
            >
              复制
            </el-button>
            <el-button link type="primary" size="small" @click="downloadTxt">下载对接包</el-button>
          </div>
        </div>
        <div class="cred-tip">
          sign_type=2 时商户用此公钥验平台 notify；<b>勿与商户来签公钥混淆</b>
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="商户来签 RSA 公钥">
        <div class="cred-row col">
          <pre v-if="credentials.rsa_public_key" class="mono pre-key">{{ credentials.rsa_public_key }}</pre>
          <span v-else class="cred-empty">未配置（仅用 MD5 对接或待商户门户上传）</span>
          <el-button
            v-if="credentials.rsa_public_key"
            link
            type="primary"
            size="small"
            class="self-start"
            @click="copy(credentials.rsa_public_key)"
          >
            复制
          </el-button>
        </div>
        <div class="cred-tip">sign_type=2 时平台用此公钥验商户请求；由商户在门户自行上传</div>
      </el-descriptions-item>
    </el-descriptions>

    <el-alert type="warning" :closable="false" show-icon class="cred-warn">
      <template #title>
        若使用 RSA 对接（sign_type=2），商户还需在门户上传<b>自己的 RSA 公钥</b>供平台验签；商户私钥由商户自行保管，平台不下发。
      </template>
    </el-alert>
  </div>
</template>

<script setup lang="ts">
  import { ElMessage } from 'element-plus'

  export interface MerchantCredentials {
    mch_id?: string
    merchant_name?: string
    secret_key?: string
    platform_rsa_public_key?: string
    rsa_public_key?: string
  }

  interface Props {
    credentials: MerchantCredentials
    /** issue=创建/重置后下发；view=列表查阅 */
    mode?: 'issue' | 'view'
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: 'issue'
  })

  const alertTitle = computed(() =>
    props.mode === 'issue'
      ? '对接凭证（请妥善保存并下发商户，仅本次可见）'
      : '商户 API 对接资料（含敏感密钥，请勿对外泄露）'
  )

  const copy = async (text?: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      ElMessage.success('已复制')
    } catch {
      ElMessage.warning('复制失败，请手动复制')
    }
  }

  /** 下载完整对接包为 txt，便于运营线下发给商户 */
  const downloadTxt = () => {
    const c = props.credentials
    const content = [
      '=== SaiPayment 商户对接凭证 ===',
      `商户号 mch_id: ${c.mch_id ?? ''}`,
      '',
      '--- MD5 签名密钥 secret_key ---',
      c.secret_key ?? '',
      '',
      '--- 平台 RSA 公钥（验异步通知 sign_type=2）---',
      c.platform_rsa_public_key ?? '',
      '',
      '--- 商户来签 RSA 公钥（平台验商户请求 sign_type=2）---',
      c.rsa_public_key ?? '（未配置）',
      '',
      '说明：',
      '1. sign_type=1：下单/验通知均用 secret_key（MD5）',
      '2. sign_type=2：商户用自有私钥签名请求，并上传公钥到商户门户；',
      '   验平台 notify 时用上方「平台 RSA 公钥」',
      '3. 平台 RSA 私钥由平台保管，切勿向商户索取或下发',
      ''
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `merchant-${c.mch_id || 'credentials'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }
</script>

<style scoped>
  .credentials-panel {
    margin-top: 12px;
  }
  .cred-desc {
    margin-top: 12px;
  }
  .cred-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    flex-wrap: wrap;
  }
  .cred-row.col {
    flex-direction: column;
    align-items: stretch;
  }
  .cred-actions {
    display: flex;
    gap: 8px;
  }
  .mono {
    font-family: monospace;
    font-size: 13px;
  }
  .break-all {
    word-break: break-all;
  }
  .pre-key {
    margin: 0;
    max-height: 160px;
    overflow: auto;
    padding: 8px;
    border-radius: 4px;
    background: var(--el-fill-color-light);
    white-space: pre-wrap;
    word-break: break-all;
  }
  .cred-tip {
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
  }
  .cred-warn {
    margin-top: 12px;
  }
  .cred-empty {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  .self-start {
    align-self: flex-start;
  }
</style>
