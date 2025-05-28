import request from './request'

const outboundApi = {
  // 出库订单管理
  orders: {
    // 获取出库订单列表
    list(params = {}) {
      return request({
        url: '/api/outbound/orders/',
        method: 'get',
        params
      })
    },

    // 获取出库订单详情
    detail(id) {
      return request({
        url: `/api/outbound/orders/${id}/`,
        method: 'get'
      })
    },

    // 创建出库订单
    create(data) {
      return request({
        url: '/api/outbound/orders/',
        method: 'post',
        data
      })
    },

    // 更新出库订单
    update(id, data) {
      return request({
        url: `/api/outbound/orders/${id}/`,
        method: 'put',
        data
      })
    },

    // 删除出库订单
    delete(id) {
      return request({
        url: `/api/outbound/orders/${id}/`,
        method: 'delete'
      })
    },

    // 确认出库订单
    confirm(id) {
      return request({
        url: `/api/outbound/orders/${id}/confirm/`,
        method: 'post'
      })
    },

    // 取消出库订单
    cancel(id, reason) {
      return request({
        url: `/api/outbound/orders/${id}/cancel/`,
        method: 'post',
        data: { reason }
      })
    },

    // 完成出库订单
    complete(id) {
      return request({
        url: `/api/outbound/orders/${id}/complete/`,
        method: 'post'
      })
    },

    // 批量操作
    batchConfirm(ids) {
      return request({
        url: '/api/outbound/orders/batch_confirm/',
        method: 'post',
        data: { ids }
      })
    },

    batchCancel(ids, reason) {
      return request({
        url: '/api/outbound/orders/batch_cancel/',
        method: 'post',
        data: { ids, reason }
      })
    }
  },

  // 销售出库
  sales: {
    // 获取销售出库列表
    list(params = {}) {
      return request({
        url: '/api/outbound/sales/',
        method: 'get',
        params
      })
    },

    // 创建销售出库
    create(data) {
      return request({
        url: '/api/outbound/sales/',
        method: 'post',
        data
      })
    },

    // 更新销售出库
    update(id, data) {
      return request({
        url: `/api/outbound/sales/${id}/`,
        method: 'put',
        data
      })
    },

    // 删除销售出库
    delete(id) {
      return request({
        url: `/api/outbound/sales/${id}/`,
        method: 'delete'
      })
    },

    // 获取销售统计
    getStats(params = {}) {
      return request({
        url: '/api/outbound/sales/stats/',
        method: 'get',
        params
      })
    }
  },

  // 调拨出库
  transfer: {
    // 获取调拨出库列表
    list(params = {}) {
      return request({
        url: '/api/outbound/transfer/',
        method: 'get',
        params
      })
    },

    // 创建调拨出库
    create(data) {
      return request({
        url: '/api/outbound/transfer/',
        method: 'post',
        data
      })
    },

    // 更新调拨出库
    update(id, data) {
      return request({
        url: `/api/outbound/transfer/${id}/`,
        method: 'put',
        data
      })
    },

    // 删除调拨出库
    delete(id) {
      return request({
        url: `/api/outbound/transfer/${id}/`,
        method: 'delete'
      })
    },

    // 确认调拨
    confirm(id) {
      return request({
        url: `/api/outbound/transfer/${id}/confirm/`,
        method: 'post'
      })
    }
  },

  // 出库明细
  items: {
    // 获取出库明细列表
    list(params = {}) {
      return request({
        url: '/api/outbound/items/',
        method: 'get',
        params
      })
    },

    // 添加出库明细
    create(data) {
      return request({
        url: '/api/outbound/items/',
        method: 'post',
        data
      })
    },

    // 更新出库明细
    update(id, data) {
      return request({
        url: `/api/outbound/items/${id}/`,
        method: 'put',
        data
      })
    },

    // 删除出库明细
    delete(id) {
      return request({
        url: `/api/outbound/items/${id}/`,
        method: 'delete'
      })
    }
  },

  // 拣货任务
  picking: {
    // 获取拣货任务列表
    list(params = {}) {
      return request({
        url: '/api/outbound/picking/',
        method: 'get',
        params
      })
    },

    // 创建拣货任务
    create(data) {
      return request({
        url: '/api/outbound/picking/',
        method: 'post',
        data
      })
    },

    // 开始拣货
    start(id) {
      return request({
        url: `/api/outbound/picking/${id}/start/`,
        method: 'post'
      })
    },

    // 完成拣货
    complete(id, data) {
      return request({
        url: `/api/outbound/picking/${id}/complete/`,
        method: 'post',
        data
      })
    },

    // 扫码拣货
    scan(id, data) {
      return request({
        url: `/api/outbound/picking/${id}/scan/`,
        method: 'post',
        data
      })
    }
  },

  // 出库统计
  getStats(params = {}) {
    return request({
      url: '/api/outbound/stats/',
      method: 'get',
      params
    })
  },

  // 导出出库数据
  export(params = {}) {
    return request({
      url: '/api/outbound/export/',
      method: 'get',
      params,
      responseType: 'blob'
    })
  }
}

export default outboundApi 