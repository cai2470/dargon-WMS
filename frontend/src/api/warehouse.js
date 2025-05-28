import request from './request'

// 仓库管理API
export const warehouseAPI = {
  // 获取仓库列表
  getWarehouseList: (params) => {
    return request({
      url: '/warehouse/warehouses/',
      method: 'get',
      params
    })
  },

  // 获取仓库详情
  getWarehouseDetail: (id) => {
    return request({
      url: `/warehouse/warehouses/${id}/`,
      method: 'get'
    })
  },

  // 创建仓库
  createWarehouse: (data) => {
    return request({
      url: '/warehouse/warehouses/',
      method: 'post',
      data
    })
  },

  // 更新仓库
  updateWarehouse: (id, data) => {
    return request({
      url: `/warehouse/warehouses/${id}/`,
      method: 'put',
      data
    })
  },

  // 删除仓库
  deleteWarehouse: (id) => {
    return request({
      url: `/warehouse/warehouses/${id}/`,
      method: 'delete'
    })
  }
}

// 库区管理API
export const zoneAPI = {
  // 获取库区列表
  getZoneList: (params) => {
    return request({
      url: '/warehouse/zones/',
      method: 'get',
      params
    })
  },

  // 创建库区
  createZone: (data) => {
    return request({
      url: '/warehouse/zones/',
      method: 'post',
      data
    })
  },

  // 更新库区
  updateZone: (id, data) => {
    return request({
      url: `/warehouse/zones/${id}/`,
      method: 'put',
      data
    })
  },

  // 删除库区
  deleteZone: (id) => {
    return request({
      url: `/warehouse/zones/${id}/`,
      method: 'delete'
    })
  }
}

// 储位管理API
export const locationAPI = {
  // 获取储位列表
  getLocationList: (params) => {
    return request({
      url: '/warehouse/locations/',
      method: 'get',
      params
    })
  },

  // 创建储位
  createLocation: (data) => {
    return request({
      url: '/warehouse/locations/',
      method: 'post',
      data
    })
  },

  // 更新储位
  updateLocation: (id, data) => {
    return request({
      url: `/warehouse/locations/${id}/`,
      method: 'put',
      data
    })
  },

  // 删除储位
  deleteLocation: (id) => {
    return request({
      url: `/warehouse/locations/${id}/`,
      method: 'delete'
    })
  }
} 