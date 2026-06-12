import request from '@/utils/http'

/**
 * 代收订单 API（/core/pay/order/*）
 *
 * 订单由网关/回调驱动产生与流转，后台只读 + 人工补单，**不提供新增/编辑/删除**。
 */
export default {
  /**
   * 订单数据列表
   * @param params 搜索/分页参数（keyword/merchant_id/status/...）
   */
  list(params: Record<string, any>) {
    return request.get<Api.Common.ApiPage>({
      url: '/core/pay/order/index',
      params
    })
  },

  /**
   * 读取单个订单详情
   * @param id 订单ID
   */
  read(id: number | string) {
    return request.get<Api.Common.ApiData>({
      url: '/core/pay/order/read?id=' + id
    })
  },

  /**
   * 人工补单（强幂等）：把订单置为已支付并入账 + 通知
   * @param params { id }
   */
  reissue(params: Record<string, any>) {
    return request.post<any>({
      url: '/core/pay/order/reissue',
      data: params
    })
  },

  /**
   * 测试商户 notify 接收记录（/pay/test/notify 闭环排障）
   */
  testNotifyRecent(params?: Record<string, any>) {
    return request.get<Api.Common.ApiData>({
      url: '/core/pay/order/testNotifyRecent',
      params
    })
  }
}
