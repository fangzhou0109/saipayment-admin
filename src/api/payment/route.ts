import request from '@/utils/http'

/**
 * 综合路由 API（/core/pay/route/*）
 */
export default {
  /**
   * 路由数据列表
   * @param params 搜索/分页参数
   */
  list(params: Record<string, any>) {
    return request.get<Api.Common.ApiPage>({
      url: '/core/pay/route/index',
      params
    })
  },

  /**
   * 读取单个路由
   * @param id 路由ID
   */
  read(id: number | string) {
    return request.get<Api.Common.ApiData>({
      url: '/core/pay/route/read?id=' + id
    })
  },

  /**
   * 新增路由
   * @param params 路由数据
   */
  save(params: Record<string, any>) {
    return request.post<any>({
      url: '/core/pay/route/save',
      data: params
    })
  },

  /**
   * 更新路由
   * @param params 路由数据
   */
  update(params: Record<string, any>) {
    return request.put<any>({
      url: '/core/pay/route/update',
      data: params
    })
  },

  /**
   * 删除路由
   * @param params { ids: [...] }
   */
  delete(params: Record<string, any>) {
    return request.del<any>({
      url: '/core/pay/route/destroy',
      data: params
    })
  },

  /**
   * 路由试算（调试）：给定路由ID、金额，可选 merchant_id 模拟商户上下文
   * @param params { route_id, amount, merchant_id? }
   */
  preview(params: Record<string, any>) {
    return request.get<{
      hit: boolean
      channel_id: number | null
      channel_title: string
      resolved_rate: string | null
      fee_preview: string | null
      real_amount_preview: string | null
      profitable: boolean | null
      message: string | null
      merchant_id: number | null
    }>({
      url: '/core/pay/route/preview',
      params
    })
  }
}
