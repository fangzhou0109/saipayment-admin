import request from '@/utils/http'

/**
 * API 代付订单管理 API（/core/pay/transferOrder/*）
 *
 * 与「提现管理」物理拆分：本接口只管 source=2 的「商户服务端 API 代付」单
 * （下游调 /pay/transfer 进单），提现管理只管 source=1 的商户门户人工提现。
 * 二者共用底层 sa_pay_withdraw 表与 WithdrawLogic 状态机，权限码独立 pay:transferOrder:*，
 * 后台只读 + 审核（常规通过=线下打款完成；代付下发走通道；拒绝解冻退款），**不提供新增/编辑/删除**。
 */
export default {
  /**
   * 代付订单数据列表
   * @param params 搜索/分页参数（keyword/out_biz_no/merchant_id/status/...）
   */
  list(params: Record<string, any>) {
    return request.get<Api.Common.ApiPage>({
      url: '/core/pay/transferOrder/index',
      params
    })
  },

  /**
   * 读取单个代付订单详情
   * @param id 代付单ID
   */
  read(id: number | string) {
    return request.get<Api.Common.ApiData>({
      url: '/core/pay/transferOrder/read?id=' + id
    })
  },

  /**
   * 可选代付通道（审核「代付下发」时使用，按商户已授权代付过滤）
   * @param merchantId 代付单所属商户 ID
   */
  transferChannels(merchantId: number | string) {
    return request.get<Api.Common.ApiData[]>({
      url: '/core/pay/transferOrder/transferChannels',
      params: { merchant_id: merchantId }
    })
  },

  /**
   * 审核代付订单
   * @param params { id, action(pass=线下打款完成|disburse|reject), remark, channel_id? }
   */
  audit(params: Record<string, any>) {
    return request.post<any>({
      url: '/core/pay/transferOrder/audit',
      data: params
    })
  }
}
