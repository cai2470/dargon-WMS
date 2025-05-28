import { defineStore } from 'pinia'
import { ref } from 'vue'
// import { userApi } from '@/api/user'
// import Cookies from 'js-cookie'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref({
    id: 1,
    username: 'admin',
    email: 'admin@xiaoshenlong.com',
    avatar: '',
    role: '管理员'
  })
  const permissions = ref([])
  const roles = ref([])

  // 设置token
  const setToken = (newToken) => {
    token.value = newToken
    // Cookies.set('token', newToken, { expires: 7 })
  }

  // 清除token
  const removeToken = () => {
    token.value = ''
    // Cookies.remove('token')
  }

  // 登录 - 简化版本，不调用真实API
  const login = async (loginData) => {
    try {
      // 模拟登录
      if (loginData.username === 'admin' && loginData.password === 'admin123') {
        setToken('mock-token-admin')
        userInfo.value = {
          id: 1,
          username: 'admin',
          email: 'admin@xiaoshenlong.com',
          avatar: '',
          role: '管理员'
        }
        return { data: { access: 'mock-token-admin', user: userInfo.value } }
      } else if (loginData.username === 'zhang_san' && loginData.password === '123456') {
        setToken('mock-token-user')
        userInfo.value = {
          id: 2,
          username: 'zhang_san',
          email: 'zhang_san@xiaoshenlong.com',
          avatar: '',
          role: '仓库管理员'
        }
        return { data: { access: 'mock-token-user', user: userInfo.value } }
      } else {
        throw new Error('用户名或密码错误')
      }
    } catch (error) {
      throw error
    }
  }

  // 登出
  const logout = async () => {
    removeToken()
    userInfo.value = {}
    permissions.value = []
    roles.value = []
  }

  // 获取用户信息
  const getUserInfo = async () => {
    return userInfo.value
  }

  // 更新用户信息
  const updateUserInfo = async (data) => {
    userInfo.value = { ...userInfo.value, ...data }
    return userInfo.value
  }

  // 修改密码
  const changePassword = async (passwordData) => {
    // 模拟修改密码
    return { message: '密码修改成功' }
  }

  // 初始化用户
  const initUser = async () => {
    // 如果有token但没有用户信息，模拟获取用户信息
    if (token.value && !userInfo.value.id) {
      // 这里可以添加逻辑
    }
  }

  // 检查权限
  const hasPermission = (permission) => {
    return true // 暂时返回true
  }

  // 检查角色
  const hasRole = (role) => {
    return true // 暂时返回true
  }

  return {
    token,
    userInfo,
    permissions,
    roles,
    setToken,
    removeToken,
    login,
    logout,
    getUserInfo,
    updateUserInfo,
    changePassword,
    initUser,
    hasPermission,
    hasRole
  }
})