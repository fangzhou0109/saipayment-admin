import request from '@/utils/http'

/**
 * 商户通知日志 API（/core/pay/notify/*）
 */
export default {
  /** 通知日志列表 */
  list(params: Record<string, any>) {
    return request.get<Api.Common.ApiPage>({
      url: '/core/pay/notify/index',
      params
    })
  },

  /** 通知日志详情 */
  read(id: number | string) {
    return request.get<Api.Common.ApiData>({
      url: '/core/pay/notify/read?id=' + id
    })
  },

  /** 人工重发通知 */
  resend(data: { id: number | string }) {
    return request.post<any>({
      url: '/core/pay/notify/resend',
      data
    })
  }
}
