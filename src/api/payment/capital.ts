import request from '@/utils/http'

/**
 * 资金流水 API（/core/pay/capital/*）
 *
 * 资金流水为不可变流水账，只读 + 导出（导出由 SaExport 组件直接走 /core/pay/capital/export）。
 */
export default {
  /**
   * 资金流水列表
   * @param params 搜索/分页参数（merchant_id/biz_no/biz_type/change_type/...）
   */
  list(params: Record<string, any>) {
    return request.get<Api.Common.ApiPage>({
      url: '/core/pay/capital/index',
      params
    })
  }
}
