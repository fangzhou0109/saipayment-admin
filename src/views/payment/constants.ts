/**
 * 支付渠道前端公共常量
 *
 * 与后端枚举保持一致（sa_pay_channel.pay_type / sa_pay_route.pay_type）。
 * 由于这些是固定业务枚举（非数据字典），直接在前端维护选项列表。
 */

/** 支付类型选项：value 与后端 pay_type 字段对应（1~7） */
export const PAY_TYPE_OPTIONS = [
  { label: '支付宝PC', value: 1 },
  { label: '支付宝H5', value: 2 },
  { label: '微信PC', value: 3 },
  { label: '微信H5', value: 4 },
  { label: '银联快捷', value: 5 },
  { label: '银联扫码', value: 6 },
  { label: '其他', value: 7 }
]

/** 通道业务能力 channel_biz（Phase 9.5，与后端 Channel::BIZ_* 一致） */
export const CHANNEL_BIZ_MAP: Record<number, { label: string; tagType: string }> = {
  0: { label: '未配置', tagType: 'info' },
  1: { label: '仅代收', tagType: 'warning' },
  2: { label: '仅代付', tagType: 'success' },
  3: { label: '双能力', tagType: 'primary' }
}

/** 支付类型 value -> label 映射，便于表格列格式化展示 */
export const PAY_TYPE_MAP: Record<number, string> = PAY_TYPE_OPTIONS.reduce(
  (acc, cur) => {
    acc[cur.value] = cur.label
    return acc
  },
  {} as Record<number, string>
)

/** 订单状态选项：与后端 sa_pay_order.status 对应（0待支付/1已支付/2失败/3已关闭） */
export const ORDER_STATUS_OPTIONS = [
  { label: '待支付', value: 0, tagType: 'info' },
  { label: '已支付', value: 1, tagType: 'success' },
  { label: '支付失败', value: 2, tagType: 'danger' },
  { label: '已关闭', value: 3, tagType: 'warning' }
]

/** 订单状态 value -> {label,tagType} 映射 */
export const ORDER_STATUS_MAP: Record<number, { label: string; tagType: string }> =
  ORDER_STATUS_OPTIONS.reduce(
    (acc, cur) => {
      acc[cur.value] = { label: cur.label, tagType: cur.tagType }
      return acc
    },
    {} as Record<number, { label: string; tagType: string }>
  )

/** 入账状态映射（sa_pay_order.settle_status 0未入账/1已入账） */
export const SETTLE_STATUS_MAP: Record<number, { label: string; tagType: string }> = {
  0: { label: '未入账', tagType: 'info' },
  1: { label: '已入账', tagType: 'success' }
}

/** 商户通知状态映射（sa_pay_order.notify_status 0未通知/1已通知/2通知失败） */
export const NOTIFY_STATUS_MAP: Record<number, { label: string; tagType: string }> = {
  0: { label: '未通知', tagType: 'info' },
  1: { label: '已通知', tagType: 'success' },
  2: { label: '通知失败', tagType: 'danger' }
}

/** 通知日志类型（sa_pay_notify_log.biz_type 1代收/2代付） */
export const NOTIFY_LOG_BIZ_TYPE_OPTIONS = [
  { label: '代收', value: 1 },
  { label: '代付', value: 2 }
]

export const NOTIFY_LOG_BIZ_TYPE_MAP: Record<number, string> = NOTIFY_LOG_BIZ_TYPE_OPTIONS.reduce(
  (acc, cur) => {
    acc[cur.value] = cur.label
    return acc
  },
  {} as Record<number, string>
)

/** 通知日志状态（sa_pay_notify_log.status 0待通知/1成功/2失败） */
export const NOTIFY_LOG_STATUS_OPTIONS = [
  { label: '待通知', value: 0, tagType: 'warning' },
  { label: '成功', value: 1, tagType: 'success' },
  { label: '失败', value: 2, tagType: 'danger' }
]

export const NOTIFY_LOG_STATUS_MAP: Record<number, { label: string; tagType: string }> =
  NOTIFY_LOG_STATUS_OPTIONS.reduce(
    (acc, cur) => {
      acc[cur.value] = { label: cur.label, tagType: cur.tagType }
      return acc
    },
    {} as Record<number, { label: string; tagType: string }>
  )

/** 订单费率来源（sa_pay_order.rate_source，Phase 9.3.4 建单快照） */
export const RATE_SOURCE_MAP: Record<string, string> = {
  merchant_channel: '商户×通道定制费率',
  route: '路由费率',
  channel: '通道默认平台费率'
}

/** 提现状态选项（sa_pay_withdraw.status 0待审核/1审核通过/2代付中/3成功/-1审核拒绝/-2代付失败） */
export const WITHDRAW_STATUS_OPTIONS = [
  { label: '待审核', value: 0, tagType: 'info' },
  { label: '审核通过', value: 1, tagType: 'primary' },
  { label: '代付中', value: 2, tagType: 'warning' },
  { label: '成功', value: 3, tagType: 'success' },
  { label: '审核拒绝', value: -1, tagType: 'danger' },
  { label: '代付失败', value: -2, tagType: 'danger' }
]

/** 提现状态 value -> {label,tagType} 映射 */
export const WITHDRAW_STATUS_MAP: Record<number, { label: string; tagType: string }> =
  WITHDRAW_STATUS_OPTIONS.reduce(
    (acc, cur) => {
      acc[cur.value] = { label: cur.label, tagType: cur.tagType }
      return acc
    },
    {} as Record<number, { label: string; tagType: string }>
  )

/** 充值状态选项（sa_pay_recharge.status 0待审核/1通过/-1驳回） */
export const RECHARGE_STATUS_OPTIONS = [
  { label: '待审核', value: 0, tagType: 'info' },
  { label: '通过', value: 1, tagType: 'success' },
  { label: '驳回', value: -1, tagType: 'danger' }
]

/** 充值状态 value -> {label,tagType} 映射 */
export const RECHARGE_STATUS_MAP: Record<number, { label: string; tagType: string }> =
  RECHARGE_STATUS_OPTIONS.reduce(
    (acc, cur) => {
      acc[cur.value] = { label: cur.label, tagType: cur.tagType }
      return acc
    },
    {} as Record<number, { label: string; tagType: string }>
  )

/** 充值方式选项（sa_pay_recharge.recharge_type 1余额/2转卡/3在线） */
export const RECHARGE_TYPE_OPTIONS = [
  { label: '余额充值', value: 1 },
  { label: '转卡充值', value: 2 },
  { label: '在线充值', value: 3 }
]

/** 充值方式 value -> label 映射 */
export const RECHARGE_TYPE_MAP: Record<number, string> = RECHARGE_TYPE_OPTIONS.reduce(
  (acc, cur) => {
    acc[cur.value] = cur.label
    return acc
  },
  {} as Record<number, string>
)

/** 资金流水业务类型选项（sa_pay_capital_flow.biz_type 1~7） */
export const CAPITAL_BIZ_TYPE_OPTIONS = [
  { label: '代收入账', value: 1 },
  { label: '提现冻结', value: 2 },
  { label: '提现扣款', value: 3 },
  { label: '提现退款', value: 4 },
  { label: '充值', value: 5 },
  { label: '手续费', value: 6 },
  { label: '人工调整', value: 7 }
]

/** 资金流水业务类型 value -> label 映射 */
export const CAPITAL_BIZ_TYPE_MAP: Record<number, string> = CAPITAL_BIZ_TYPE_OPTIONS.reduce(
  (acc, cur) => {
    acc[cur.value] = cur.label
    return acc
  },
  {} as Record<number, string>
)

/** 资金流水账户类型选项（sa_pay_capital_flow.change_type 1可用/2冻结） */
export const CAPITAL_ACCOUNT_OPTIONS = [
  { label: '可用余额', value: 1 },
  { label: '冻结余额', value: 2 }
]

/** 资金流水账户类型 value -> label 映射 */
export const CAPITAL_ACCOUNT_MAP: Record<number, string> = CAPITAL_ACCOUNT_OPTIONS.reduce(
  (acc, cur) => {
    acc[cur.value] = cur.label
    return acc
  },
  {} as Record<number, string>
)

/** 银行卡状态映射（sa_pay_bank_card.status 1正常/2停用） */
export const BANK_CARD_STATUS_MAP: Record<number, { label: string; tagType: string }> = {
  1: { label: '正常', tagType: 'success' },
  2: { label: '停用', tagType: 'info' }
}

/**
 * 银行卡号脱敏：保留前 6 后 4，中间用 * 填充（前端展示用，降低 PAN 暴露面）
 * @param cardNo 完整卡号
 */
export function maskCardNo(cardNo?: string): string {
  if (!cardNo) return '-'
  const s = String(cardNo).replace(/\s/g, '')
  if (s.length < 11) return s
  return s.slice(0, 6) + '****' + s.slice(-4)
}
