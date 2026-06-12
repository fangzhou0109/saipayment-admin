/** 平台工作台统计（与后端 AdminDashboardLogic::stats 对齐） */
export interface PlatformDashboardStats {
  stats_time?: string
  merchant_count?: number
  merchant_active_count?: number
  balance_total?: string
  balance_freeze_total?: string
  balance_pool_total?: string
  today_order_count?: number
  today_order_amount?: string
  today_paid_count?: number
  today_paid_amount?: string
  today_fee_amount?: string
  today_pending_count?: number
  today_failed_count?: number
  today_success_rate?: number
  yesterday_paid_count?: number
  yesterday_paid_amount?: string
  paid_amount_change_pct?: number | null
  order_count_change_pct?: number | null
  fee_amount_change_pct?: number | null
  month_order_count?: number
  month_order_amount?: string
  month_paid_count?: number
  month_paid_amount?: string
  month_fee_amount?: string
  pending_withdraw_count?: number
  pending_withdraw_amount?: string
  pending_recharge_count?: number
  pending_recharge_amount?: string
  notify_pending_count?: number
  notify_failed_count?: number
  pay_channel_active_count?: number
  transfer_channel_active_count?: number
  trend_7d?: TrendItem[]
  pay_type_dist_today?: PayTypeDistItem[]
  top_merchants_today?: MerchantRankItem[]
  recent_orders?: Record<string, any>[]
  recent_pending_withdraws?: PendingWithdrawItem[]
  recent_pending_recharges?: PendingRechargeItem[]
}

export interface TrendItem {
  date?: string
  label?: string
  order_count?: number
  order_amount?: string
  paid_count?: number
  paid_amount?: string
  fee_amount?: string
}

export interface PayTypeDistItem {
  pay_type: number
  order_count: number
  paid_amount: string
}

export interface MerchantRankItem {
  merchant_id: number
  mch_id: string
  merchant_name: string
  paid_count: number
  paid_amount: string
  fee_amount: string
}

export interface PendingWithdrawItem {
  id: number
  withdraw_no: string
  mch_id: string
  merchant_name: string
  amount: string
  create_time: string
}

export interface PendingRechargeItem {
  id: number
  recharge_no: string
  mch_id: string
  merchant_name: string
  amount: string
  create_time: string
}
