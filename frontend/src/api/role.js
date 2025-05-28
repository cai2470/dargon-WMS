import request from './request'

const roleApi = {
  // 获取角色列表
  list(params = {}) {
    return request({
      url: '/api/users/roles/',
      method: 'get',
      params
    })
  },

  // 获取角色详情
  detail(id) {
    return request({
      url: `/api/users/roles/${id}/`,
      method: 'get'
    })
  },

  // 创建角色
  create(data) {
    return request({
      url: '/api/users/roles/',
      method: 'post',
      data
    })
  },

  // 更新角色
  update(id, data) {
    return request({
      url: `/api/users/roles/${id}/`,
      method: 'put',
      data
    })
  },

  // 部分更新角色
  patch(id, data) {
    return request({
      url: `/api/users/roles/${id}/`,
      method: 'patch',
      data
    })
  },

  // 删除角色
  delete(id) {
    return request({
      url: `/api/users/roles/${id}/`,
      method: 'delete'
    })
  },

  // 更新角色权限
  updatePermissions(id, data) {
    return request({
      url: `/api/users/roles/${id}/permissions/`,
      method: 'post',
      data
    })
  },

  // 获取角色权限
  getPermissions(id) {
    return request({
      url: `/api/users/roles/${id}/permissions/`,
      method: 'get'
    })
  },

  // 批量删除角色
  batchDelete(ids) {
    return request({
      url: '/api/users/roles/batch_delete/',
      method: 'post',
      data: { ids }
    })
  },

  // 批量更新角色状态
  batchUpdateStatus(ids, is_active) {
    return request({
      url: '/api/users/roles/batch_update_status/',
      method: 'post',
      data: { ids, is_active }
    })
  }
}

export default roleApi 