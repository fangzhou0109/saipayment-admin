import request from '@/utils/http'

/**
 * 路由-通道关联 API（/core/pay/routeChannel/*）
 *
 * 维护某条综合路由下绑定的通道、金额规则与权重；权限码复用 pay:route:*。
 */
export default {
  /**
   * 关联列表（通常按 route_id 过滤）
   * @param params { route_id, channel_id, page, limit }
   */
  list(params: Record<string, any>) {
    return request.get<Api.Common.ApiPage>({
      url: '/core/pay/routeChannel/index',
      params
    })
  },

  /**
   * 新增关联
   * @param params 关联数据
   */
  save(params: Record<string, any>) {
    return request.post<any>({
      url: '/core/pay/routeChannel/save',
      data: params
    })
  },

  /**
   * 更新关联
   * @param params 关联数据
   */
  update(params: Record<string, any>) {
    return request.put<any>({
      url: '/core/pay/routeChannel/update',
      data: params
    })
  },

  /**
   * 删除关联
   * @param params { ids: [...] }
   */
  delete(params: Record<string, any>) {
    return request.del<any>({
      url: '/core/pay/routeChannel/destroy',
      data: params
    })
  }
}
