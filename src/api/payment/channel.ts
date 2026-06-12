import request from '@/utils/http'

/**
 * 上游通道 API（/core/pay/channel/*）
 */
export default {
  /**
   * 通道数据列表
   * @param params 搜索/分页参数
   */
  list(params: Record<string, any>) {
    return request.get<Api.Common.ApiPage>({
      url: '/core/pay/channel/index',
      params
    })
  },

  /**
   * 读取单个通道
   * @param id 通道ID
   */
  read(id: number | string) {
    return request.get<Api.Common.ApiData>({
      url: '/core/pay/channel/read?id=' + id
    })
  },

  /**
   * 新增通道
   * @param params 通道数据
   */
  save(params: Record<string, any>) {
    return request.post<any>({
      url: '/core/pay/channel/save',
      data: params
    })
  },

  /**
   * 更新通道（通道编码后端只读）
   * @param params 通道数据
   */
  update(params: Record<string, any>) {
    return request.put<any>({
      url: '/core/pay/channel/update',
      data: params
    })
  },

  /**
   * 删除通道
   * @param params { ids: [...] }
   */
  delete(params: Record<string, any>) {
    return request.del<any>({
      url: '/core/pay/channel/destroy',
      data: params
    })
  },

  /**
   * 获取可选适配器下拉选项（label/value）
   */
  adapters() {
    return request.get<Api.Common.ApiData>({
      url: '/core/pay/channel/adapters'
    })
  }
}
