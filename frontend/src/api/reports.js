import request from './request'

const reportsApi = {
  // 获取概览数据
  getOverview(params = {}) {
    return request({
      url: '/api/reports/overview/',
      method: 'get',
      params
    })
  },

  // 获取趋势数据
  getTrendData(params = {}) {
    return request({
      url: '/api/reports/trend/',
      method: 'get',
      params
    })
  },

  // 获取分布数据
  getDistributionData(params = {}) {
    return request({
      url: '/api/reports/distribution/',
      method: 'get',
      params
    })
  },

  // 获取排行数据
  getRankingData(params = {}) {
    return request({
      url: '/api/reports/ranking/',
      method: 'get',
      params
    })
  },

  // 获取预警数据
  getAlertData(params = {}) {
    return request({
      url: '/api/reports/alerts/',
      method: 'get',
      params
    })
  },

  // 获取详细数据
  getDetailData(params = {}) {
    return request({
      url: '/api/reports/detail/',
      method: 'get',
      params
    })
  },

  // 导出分析数据
  exportAnalysisData(params = {}) {
    return request({
      url: '/api/reports/export/analysis/',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  // 入库报表
  getInboundReport(params = {}) {
    return request({
      url: '/api/reports/inbound/',
      method: 'get',
      params
    })
  },

  // 出库报表
  getOutboundReport(params = {}) {
    return request({
      url: '/api/reports/outbound/',
      method: 'get',
      params
    })
  },

  // 库存报表
  getInventoryReport(params = {}) {
    return request({
      url: '/api/reports/inventory/',
      method: 'get',
      params
    })
  },

  // 导出入库报表
  exportInboundReport(params = {}) {
    return request({
      url: '/api/reports/export/inbound/',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  // 导出出库报表
  exportOutboundReport(params = {}) {
    return request({
      url: '/api/reports/export/outbound/',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  // 导出库存报表
  exportInventoryReport(params = {}) {
    return request({
      url: '/api/reports/export/inventory/',
      method: 'get',
      params,
      responseType: 'blob'
    })
  },

  // 获取仓库利用率
  getWarehouseUtilization(params = {}) {
    return request({
      url: '/api/reports/warehouse_utilization/',
      method: 'get',
      params
    })
  },

  // 获取商品周转率
  getProductTurnover(params = {}) {
    return request({
      url: '/api/reports/product_turnover/',
      method: 'get',
      params
    })
  },

  // 获取操作员绩效
  getOperatorPerformance(params = {}) {
    return request({
      url: '/api/reports/operator_performance/',
      method: 'get',
      params
    })
  },

  // 获取异常统计
  getExceptionStats(params = {}) {
    return request({
      url: '/api/reports/exceptions/',
      method: 'get',
      params
    })
  },

  // 生成自定义报表
  generateCustomReport(data) {
    return request({
      url: '/api/reports/custom/',
      method: 'post',
      data
    })
  },

  // 获取报表模板
  getReportTemplates() {
    return request({
      url: '/api/reports/templates/',
      method: 'get'
    })
  },

  // 保存报表模板
  saveReportTemplate(data) {
    return request({
      url: '/api/reports/templates/',
      method: 'post',
      data
    })
  }
}

export default reportsApi 