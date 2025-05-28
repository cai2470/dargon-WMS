import request from './request'

// 入库管理API
export const inboundAPI = {
  // 获取入库单列表
  getInboundList: (params) => {
    return request({
      url: '/inbound/purchase-orders/',
      method: 'get',
      params
    })
  },

  // 获取入库单详情
  getInboundDetail: (id) => {
    return request({
      url: `/inbound/purchase-orders/${id}/`,
      method: 'get'
    })
  },

  // 创建入库单
  createInbound: (data) => {
    return request({
      url: '/inbound/purchase-orders/',
      method: 'post',
      data
    })
  },

  // 更新入库单
  updateInbound: (id, data) => {
    return request({
      url: `/inbound/purchase-orders/${id}/`,
      method: 'put',
      data
    })
  },

  // 删除入库单
  deleteInbound: (id) => {
    return request({
      url: `/inbound/purchase-orders/${id}/`,
      method: 'delete'
    })
  },

  // 开始收货
  startReceive: (id, data) => {
    return request({
      url: `/inbound/purchase-orders/${id}/start_receive/`,
      method: 'post',
      data
    })
  },

  // 确认收货
  confirmReceive: (id, data) => {
    return request({
      url: `/inbound/purchase-orders/${id}/confirm_receive/`,
      method: 'post',
      data
    })
  },

  // 验收入库
  verifyInbound: (id, data) => {
    return request({
      url: `/inbound/purchase-orders/${id}/verify/`,
      method: 'post',
      data
    })
  },

  // 入库完成
  completeInbound: (id) => {
    return request({
      url: `/inbound/purchase-orders/${id}/complete/`,
      method: 'post'
    })
  }
}

// 退货管理API
export const returnAPI = {
  // 获取退货单列表
  getReturnList: (params) => {
    return request({
      url: '/inbound/return-orders/',
      method: 'get',
      params
    })
  },

  // 创建退货单
  createReturn: (data) => {
    return request({
      url: '/inbound/return-orders/',
      method: 'post',
      data
    })
  },

  // 更新退货单
  updateReturn: (id, data) => {
    return request({
      url: `/inbound/return-orders/${id}/`,
      method: 'put',
      data
    })
  },

  // 处理退货
  processReturn: (id, data) => {
    return request({
      url: `/inbound/return-orders/${id}/process/`,
      method: 'post',
      data
    })
  }
}

// 调拨入库API
export const transferInAPI = {
  // 获取调拨入库列表
  getTransferInList: (params) => {
    return request({
      url: '/inbound/transfer-in/',
      method: 'get',
      params
    })
  },

  // 创建调拨入库
  createTransferIn: (data) => {
    return request({
      url: '/inbound/transfer-in/',
      method: 'post',
      data
    })
  },

  // 确认调拨入库
  confirmTransferIn: (id, data) => {
    return request({
      url: `/inbound/transfer-in/${id}/confirm/`,
      method: 'post',
      data
    })
  }
} 