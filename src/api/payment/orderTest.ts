import request from '@/utils/http'

/**
 * 代收测试下单 API（/core/pay/order/testSubmit）
 *
 * 平台后台专用，走生产 PayGatewayLogic，免商户网关签名。
 */
export default {
  /**
   * 发起测试下单
   * @param data merchant_id, amount(元), pay_type, out_trade_no?, notify_url?, commodity_name?
   */
  testSubmit(data: Record<string, any>) {
    return request.post<Api.Common.ApiData>({
      url: '/core/pay/order/testSubmit',
      data
    })
  }
}
