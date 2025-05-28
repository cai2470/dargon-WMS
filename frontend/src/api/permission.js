import request from './request'

const permissionApi = {
  // 获取权限列表
  list(params = {}) {
    return request({
      url: '/api/users/permissions/',
      method: 'get',
      params
    })
  },

  // 获取权限详情
  detail(id) {
    return request({
      url: `/api/users/permissions/${id}/`,
      method: 'get'
    })
  },

  // 创建权限
  create(data) {
    return request({
      url: '/api/users/permissions/',
      method: 'post',
      data
    })
  },

  // 更新权限
  update(id, data) {
    return request({
      url: `/api/users/permissions/${id}/`,
      method: 'put',
      data
    })
  },

  // 删除权限
  delete(id) {
    return request({
      url: `/api/users/permissions/${id}/`,
      method: 'delete'
    })
  },

  // 获取权限树结构
  getTree() {
    return request({
      url: '/api/users/permissions/tree/',
      method: 'get'
    })
  },

  // 按模块获取权限
  getByModule(module) {
    return request({
      url: '/api/users/permissions/by_module/',
      method: 'get',
      params: { module }
    })
  },

  // 同步权限（从Django模型同步）
  sync() {
    return request({
      url: '/api/users/permissions/sync/',
      method: 'post'
    })
  }
}

export default permissionApi 