import request from '@/utils/http'

/**
 * 商户提现 API（/core/pay/withdraw/*）
 *
 * 提现由商户门户发起，后台只读 + 审核（常规通过=线下打款完成；代付下发走通道；拒绝解冻退款），
 * **不提供新增/编辑/删除**。
 */
export default {
  /**
   * 提现数据列表
   * @param params 搜索/分页参数（keyword/merchant_id/status/...）
   */
  list(params: Record<string, any>) {
    return request.get<Api.Common.ApiPage>({
      url: '/core/pay/withdraw/index',
      params
    })
  },

  /**
   * 读取单个提现单详情
   * @param id 提现单ID
   */
  read(id: number | string) {
    return request.get<Api.Common.ApiData>({
      url: '/core/pay/withdraw/read?id=' + id
    })
  },

  /**
   * 可选代付通道（审核「代付下发」时使用，按商户已授权代付过滤）
   * @param merchantId 提现单所属商户 ID
   */
  transferChannels(merchantId: number | string) {
    return request.get<Api.Common.ApiData[]>({
      url: '/core/pay/withdraw/transferChannels',
      params: { merchant_id: merchantId }
    })
  },

  /**
   * 审核提现
   * @param params { id, action(pass=线下打款完成|disburse|reject), remark, channel_id? }
   */
  audit(params: Record<string, any>) {
    return request.post<any>({
      url: '/core/pay/withdraw/audit',
      data: params
    })
  }
}
