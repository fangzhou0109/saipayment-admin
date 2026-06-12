import request from '@/utils/http'

/**
 * 支付商户 API
 *
 * 注意：支付后端接口统一挂在 `/core/pay/*` 分组下（区别于 saiadmin 的 `/core/*`）。
 */
export default {
  /**
   * 商户数据列表
   * @param params 搜索/分页参数
   */
  list(params: Record<string, any>) {
    return request.get<Api.Common.ApiPage>({
      url: '/core/pay/merchant/index',
      params
    })
  },

  /**
   * 读取单个商户
   * @param id 商户ID
   */
  read(id: number | string) {
    return request.get<Api.Common.ApiData>({
      url: '/core/pay/merchant/read?id=' + id
    })
  },

  /**
   * 新增商户（后端自动下发密钥）
   * @param params 商户数据
   */
  save(params: Record<string, any>) {
    return request.post<any>({
      url: '/core/pay/merchant/save',
      data: params
    })
  },

  /**
   * 更新商户（余额字段后端只读）
   * @param params 商户数据
   */
  update(params: Record<string, any>) {
    return request.put<any>({
      url: '/core/pay/merchant/update',
      data: params
    })
  },

  /**
   * 删除商户
   * @param params { ids: [...] }
   */
  delete(params: Record<string, any>) {
    return request.del<any>({
      url: '/core/pay/merchant/destroy',
      data: params
    })
  },

  /**
   * 重置商户密钥（重新下发 MD5 密钥与平台 RSA 私钥）
   * @param params { id }
   */
  resetKey(params: Record<string, any>) {
    return request.post<any>({
      url: '/core/pay/merchant/resetKey',
      data: params
    })
  },

  /**
   * 查看商户 API 对接资料（运营查阅/补发）
   * @param id 商户ID
   */
  credentials(id: number | string) {
    return request.get<Api.Common.ApiData>({
      url: '/core/pay/merchant/credentials?id=' + id
    })
  }
}
