import { http } from './request'

export const userApi = {
  // 登录
  login(data) {
    return http.post('/users/login/', data)
  },

  // 登出
  logout() {
    return http.post('/users/logout/')
  },

  // 获取用户信息
  getProfile() {
    return http.get('/users/profile/')
  },

  // 更新用户信息
  updateProfile(data) {
    return http.put('/users/profile/', data)
  },

  // 修改密码
  changePassword(data) {
    return http.post('/users/change-password/', data)
  },

  // 获取用户列表
  getUserList(params) {
    return http.get('/users/users/', params)
  },

  // 创建用户
  createUser(data) {
    return http.post('/users/users/', data)
  },

  // 更新用户
  updateUser(id, data) {
    return http.put(`/users/users/${id}/`, data)
  },

  // 删除用户
  deleteUser(id) {
    return http.delete(`/users/users/${id}/`)
  },

  // 获取角色列表
  getRoleList(params) {
    return http.get('/users/roles/', params)
  },

  // 获取权限列表
  getPermissionList(params) {
    return http.get('/users/permissions/', params)
  },

  // 获取登录日志
  getLoginLogs(params) {
    return http.get('/users/login-logs/', params)
  }
}