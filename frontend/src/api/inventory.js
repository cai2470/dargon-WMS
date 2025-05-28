import request from './request'

const inventoryApi = {
  // 库存管理
  stock: {
    // 获取库存列表
    list(params = {}) {
      return request({
        url: '/api/inventory/stock/',
        method: 'get',
        params
      })
    },

    // 获取库存详情
    detail(id) {
      return request({
        url: `/api/inventory/stock/${id}/`,
        method: 'get'
      })
    },

    // 更新库存
    update(id, data) {
      return request({
        url: `/api/inventory/stock/${id}/`,
        method: 'put',
        data
      })
    },

    // 库存调整
    adjust(data) {
      return request({
        url: '/api/inventory/stock/adjust/',
        method: 'post',
        data
      })
    },

    // 批量库存调整
    batchAdjust(data) {
      return request({
        url: '/api/inventory/stock/batch_adjust/',
        method: 'post',
        data
      })
    },

    // 库存预留
    reserve(data) {
      return request({
        url: '/api/inventory/stock/reserve/',
        method: 'post',
        data
      })
    },

    // 取消预留
    unreserve(data) {
      return request({
        url: '/api/inventory/stock/unreserve/',
        method: 'post',
        data
      })
    },

    // 库存转移
    transfer(data) {
      return request({
        url: '/api/inventory/stock/transfer/',
        method: 'post',
        data
      })
    },

    // 获取库存统计
    getStats(params = {}) {
      return request({
        url: '/api/inventory/stock/stats/',
        method: 'get',
        params
      })
    }
  },

  // 库存移动记录
  movements: {
    // 获取移动记录列表
    list(params = {}) {
      return request({
        url: '/api/inventory/movements/',
        method: 'get',
        params
      })
    },

    // 获取移动记录详情
    detail(id) {
      return request({
        url: `/api/inventory/movements/${id}/`,
        method: 'get'
      })
    },

    // 创建移动记录
    create(data) {
      return request({
        url: '/api/inventory/movements/',
        method: 'post',
        data
      })
    },

    // 获取移动统计
    getStats(params = {}) {
      return request({
        url: '/api/inventory/movements/stats/',
        method: 'get',
        params
      })
    }
  },

  // 库存预警
  alerts: {
    // 获取预警列表
    list(params = {}) {
      return request({
        url: '/api/inventory/alerts/',
        method: 'get',
        params
      })
    },

    // 获取预警详情
    detail(id) {
      return request({
        url: `/api/inventory/alerts/${id}/`,
        method: 'get'
      })
    },

    // 处理预警
    handle(id, data) {
      return request({
        url: `/api/inventory/alerts/${id}/handle/`,
        method: 'post',
        data
      })
    },

    // 忽略预警
    ignore(id, reason) {
      return request({
        url: `/api/inventory/alerts/${id}/ignore/`,
        method: 'post',
        data: { reason }
      })
    },

    // 批量处理预警
    batchHandle(ids, action, data = {}) {
      return request({
        url: '/api/inventory/alerts/batch_handle/',
        method: 'post',
        data: { ids, action, ...data }
      })
    },

    // 获取预警统计
    getStats(params = {}) {
      return request({
        url: '/api/inventory/alerts/stats/',
        method: 'get',
        params
      })
    }
  },

  // 盘点管理
  count: {
    // 获取盘点任务列表
    list(params = {}) {
      return request({
        url: '/api/inventory/count/',
        method: 'get',
        params
      })
    },

    // 获取盘点任务详情
    detail(id) {
      return request({
        url: `/api/inventory/count/${id}/`,
        method: 'get'
      })
    },

    // 创建盘点任务
    create(data) {
      return request({
        url: '/api/inventory/count/',
        method: 'post',
        data
      })
    },

    // 更新盘点任务
    update(id, data) {
      return request({
        url: `/api/inventory/count/${id}/`,
        method: 'put',
        data
      })
    },

    // 删除盘点任务
    delete(id) {
      return request({
        url: `/api/inventory/count/${id}/`,
        method: 'delete'
      })
    },

    // 开始盘点
    start(id) {
      return request({
        url: `/api/inventory/count/${id}/start/`,
        method: 'post'
      })
    },

    // 完成盘点
    complete(id) {
      return request({
        url: `/api/inventory/count/${id}/complete/`,
        method: 'post'
      })
    },

    // 提交盘点结果
    submit(id, data) {
      return request({
        url: `/api/inventory/count/${id}/submit/`,
        method: 'post',
        data
      })
    },

    // 审核盘点结果
    review(id, data) {
      return request({
        url: `/api/inventory/count/${id}/review/`,
        method: 'post',
        data
      })
    },

    // 扫码盘点
    scan(id, data) {
      return request({
        url: `/api/inventory/count/${id}/scan/`,
        method: 'post',
        data
      })
    },

    // 获取盘点明细
    getItems(id, params = {}) {
      return request({
        url: `/api/inventory/count/${id}/items/`,
        method: 'get',
        params
      })
    },

    // 更新盘点明细
    updateItem(countId, itemId, data) {
      return request({
        url: `/api/inventory/count/${countId}/items/${itemId}/`,
        method: 'put',
        data
      })
    }
  },

  // 库存查询
  query: {
    // 按商品查询库存
    byProduct(productId, params = {}) {
      return request({
        url: `/api/inventory/query/product/${productId}/`,
        method: 'get',
        params
      })
    },

    // 按库位查询库存
    byLocation(locationId, params = {}) {
      return request({
        url: `/api/inventory/query/location/${locationId}/`,
        method: 'get',
        params
      })
    },

    // 按仓库查询库存
    byWarehouse(warehouseId, params = {}) {
      return request({
        url: `/api/inventory/query/warehouse/${warehouseId}/`,
        method: 'get',
        params
      })
    },

    // 库存可用性查询
    availability(data) {
      return request({
        url: '/api/inventory/query/availability/',
        method: 'post',
        data
      })
    },

    // 库存历史查询
    history(params = {}) {
      return request({
        url: '/api/inventory/query/history/',
        method: 'get',
        params
      })
    }
  },

  // 导出功能
  export: {
    // 导出库存数据
    stock(params = {}) {
      return request({
        url: '/api/inventory/export/stock/',
        method: 'get',
        params,
        responseType: 'blob'
      })
    },

    // 导出移动记录
    movements(params = {}) {
      return request({
        url: '/api/inventory/export/movements/',
        method: 'get',
        params,
        responseType: 'blob'
      })
    },

    // 导出预警数据
    alerts(params = {}) {
      return request({
        url: '/api/inventory/export/alerts/',
        method: 'get',
        params,
        responseType: 'blob'
      })
    },

    // 导出盘点结果
    count(id) {
      return request({
        url: `/api/inventory/export/count/${id}/`,
        method: 'get',
        responseType: 'blob'
      })
    }
  }
}

export default inventoryApi 