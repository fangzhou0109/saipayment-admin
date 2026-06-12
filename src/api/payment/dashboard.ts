import request from '@/utils/http'

/**
 * 平台后台 - 工作台统计 API（/core/pay/dashboard）
 */
export default {
  /** 全平台经营概览、资金池、待办与趋势 */
  stats() {
    return request.get<Api.Common.ApiData>({
      url: '/core/pay/dashboard/stats'
    })
  }
}
