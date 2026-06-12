import request from '@/utils/http'

/**
 * 代付通道 API（/core/pay/transferChannel/*，Phase 9.5.2）
 */
export default {
  /**
   * 代付通道列表（channel_biz IN 2,3）
   */
  list(params: Record<string, any>) {
    return request.get<Api.Common.ApiPage>({
      url: '/core/pay/transferChannel/index',
      params
    })
  },

  /**
   * 读取单个代付通道
   */
  read(id: number | string) {
    return request.get<Api.Common.ApiData>({
      url: '/core/pay/transferChannel/read?id=' + id
    })
  },

  /**
   * 新增代付通道（纯代付可不填代收 adapter）
   */
  save(params: Record<string, any>) {
    return request.post<any>({
      url: '/core/pay/transferChannel/save',
      data: params
    })
  },

  /**
   * 更新代付通道
   */
  update(params: Record<string, any>) {
    return request.put<any>({
      url: '/core/pay/transferChannel/update',
      data: params
    })
  },

  /**
   * 删除代付通道
   */
  delete(params: Record<string, any>) {
    return request.del<any>({
      url: '/core/pay/transferChannel/destroy',
      data: params
    })
  },

  /**
   * 代付适配器下拉（label/value）
   */
  transferAdapters() {
    return request.get<Api.Common.ApiData>({
      url: '/core/pay/transferChannel/transferAdapters'
    })
  }
}
