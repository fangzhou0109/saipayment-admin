import request from '@/utils/http'

/**
 * 商户充值 API（/core/pay/recharge/*）
 *
 * 充值由商户门户发起，后台只读 + 审核（审核通过入账、驳回不动余额），
 * **不提供新增/编辑/删除**。
 */
export default {
  /**
   * 充值数据列表
   * @param params 搜索/分页参数（keyword/merchant_id/status/...）
   */
  list(params: Record<string, any>) {
    return request.get<Api.Common.ApiPage>({
      url: '/core/pay/recharge/index',
      params
    })
  },

  /**
   * 读取单个充值单详情
   * @param id 充值单ID
   */
  read(id: number | string) {
    return request.get<Api.Common.ApiData>({
      url: '/core/pay/recharge/read?id=' + id
    })
  },

  /**
   * 审核充值（通过/驳回）
   * @param params { id, approve(1通过/0驳回), remark }
   */
  audit(params: Record<string, any>) {
    return request.post<any>({
      url: '/core/pay/recharge/audit',
      data: params
    })
  }
}
