import request from '@/utils/http'

/**
 * 商户银行卡 API（/core/pay/bankCard/*）
 *
 * 银行卡 CRUD：绑卡含首现卡风控提示（save 返回 first_card 标记），卡号经后端 Luhn 校验。
 */
export default {
  /**
   * 银行卡数据列表
   * @param params 搜索/分页参数（keyword/merchant_id/status/...）
   */
  list(params: Record<string, any>) {
    return request.get<Api.Common.ApiPage>({
      url: '/core/pay/bankCard/index',
      params
    })
  },

  /**
   * 新增银行卡（绑卡，返回首现卡风控提示）
   * @param params 银行卡数据
   */
  save(params: Record<string, any>) {
    return request.post<any>({
      url: '/core/pay/bankCard/save',
      data: params
    })
  },

  /**
   * 更新银行卡
   * @param params 银行卡数据
   */
  update(params: Record<string, any>) {
    return request.put<any>({
      url: '/core/pay/bankCard/update',
      data: params
    })
  },

  /**
   * 删除银行卡
   * @param params { ids: [...] }
   */
  delete(params: Record<string, any>) {
    return request.del<any>({
      url: '/core/pay/bankCard/destroy',
      data: params
    })
  }
}
