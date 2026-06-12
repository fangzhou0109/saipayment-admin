import request from '@/utils/http'

/**
 * 商户×通道授权 API（/core/pay/merchantChannel/*）
 */
export default {
  /**
   * 按商户列出通道授权（含通道参考字段）
   * @param merchantId 商户ID
   */
  listByMerchant(merchantId: number | string) {
    return request.get<Record<string, any>[]>({
      url: '/core/pay/merchantChannel/listByMerchant',
      params: { merchant_id: merchantId }
    })
  },

  /**
   * 批量保存商户×通道绑定
   * @param params { merchant_id, rows: [{ channel_id, rate, rate_transfer, single_min, single_max, day_limit, status, transfer_enabled }] }
   */
  batchSave(params: { merchant_id: number; rows: Record<string, any>[] }) {
    return request.post<{ saved: number }>({
      url: '/core/pay/merchantChannel/batchSave',
      data: params,
      showSuccessMessage: true
    })
  },

  /**
   * 按通道列出商户授权（通道页「授权商户」）
   * @param channelId 通道ID
   */
  listByChannel(channelId: number | string) {
    return request.get<Record<string, any>[]>({
      url: '/core/pay/merchantChannel/listByChannel',
      params: { channel_id: channelId }
    })
  },

  /**
   * 按通道批量开通/关闭商户授权
   * @param params { channel_id, merchant_ids, status: 1开通|2关闭 }
   */
  batchAuthorizeByChannel(params: {
    channel_id: number
    merchant_ids: number[]
    status: 1 | 2
  }) {
    return request.post<{ saved: number }>({
      url: '/core/pay/merchantChannel/batchAuthorizeByChannel',
      data: params,
      showSuccessMessage: true
    })
  },

  /**
   * 按商户列出代付通道授权（Phase 9.5.3，供商户「代付通道配置」）
   */
  listTransferByMerchant(merchantId: number | string) {
    return request.get<Record<string, any>[]>({
      url: '/core/pay/merchantChannel/listTransferByMerchant',
      params: { merchant_id: merchantId }
    })
  },

  /**
   * 批量保存商户×代付通道绑定
   */
  batchSaveTransfer(params: {
    merchant_id: number
    rows: Array<{ channel_id: number; rate_transfer: number; transfer_enabled: number }>
  }) {
    return request.post<{ saved: number }>({
      url: '/core/pay/merchantChannel/batchSaveTransfer',
      data: params,
      showSuccessMessage: true
    })
  },

  /**
   * 按通道批量开通/关闭商户代付授权（Phase 9.5.3）
   */
  batchAuthorizeTransferByChannel(params: {
    channel_id: number
    merchant_ids: number[]
    transfer_enabled: 1 | 2
  }) {
    return request.post<{ saved: number }>({
      url: '/core/pay/merchantChannel/batchAuthorizeTransferByChannel',
      data: params,
      showSuccessMessage: true
    })
  }
}
