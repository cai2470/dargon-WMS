/**
 * 小神龙WMS系统 - API请求封装
 * 包含JWT认证、自动重试、错误处理等功能
 */
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import router from '@/router'

// API基础配置
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

// 创建axios实例
const request = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Token管理
const TokenManager = {
  // 获取访问令牌
  getAccessToken() {
    return localStorage.getItem('access_token')
  },
  
  // 获取刷新令牌
  getRefreshToken() {
    return localStorage.getItem('refresh_token')
  },
  
  // 设置令牌
  setTokens(accessToken, refreshToken) {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
  },
  
  // 清除令牌
  clearTokens() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_info')
  },
  
  // 检查令牌是否过期
  isTokenExpired(token) {
    if (!token) return true
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const exp = payload.exp * 1000
      return Date.now() >= exp
    } catch (error) {
      return true
    }
  }
}

// 刷新令牌
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

const refreshToken = async () => {
  const refreshToken = TokenManager.getRefreshToken()
  
  if (!refreshToken) {
    throw new Error('没有刷新令牌')
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/refresh/`, {
      refresh: refreshToken
    })
    
    const { access, refresh } = response.data
    TokenManager.setTokens(access, refresh)
    
    return access
  } catch (error) {
    TokenManager.clearTokens()
    throw error
  }
}

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 添加认证头
    const token = TokenManager.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 显示加载状态
    if (config.showLoading !== false) {
      // 可以在这里添加全局加载状态
    }
    
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  async error => {
    const originalRequest = error.config
    
    // 处理401未授权错误
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果正在刷新令牌，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return request(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }
      
      originalRequest._retry = true
      isRefreshing = true
      
      try {
        const newToken = await refreshToken()
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return request(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        
        // 刷新失败，跳转到登录页
        ElMessage.error('登录已过期，请重新登录')
        router.push('/login')
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    
    // 处理其他错误
    const message = error.response?.data?.message || 
                   error.response?.data?.detail || 
                   error.message || 
                   '请求失败'
    
    // 根据状态码显示不同的错误信息
    switch (error.response?.status) {
      case 400:
        ElMessage.error(`请求参数错误: ${message}`)
        break
      case 403:
        ElMessage.error('没有操作权限')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 500:
        ElMessage.error('服务器内部错误')
        break
      default:
        if (error.code === 'ECONNABORTED') {
          ElMessage.error('请求超时，请检查网络连接')
        } else if (error.code === 'ERR_NETWORK') {
          ElMessage.error('网络连接失败，请检查后端服务是否启动')
        } else {
          ElMessage.error(message)
        }
    }
    
    return Promise.reject(error)
  }
)

// API方法封装
export const api = {
  // GET请求
  get(url, params = {}, config = {}) {
    return request.get(url, { params, ...config })
  },
  
  // POST请求
  post(url, data = {}, config = {}) {
    return request.post(url, data, config)
  },
  
  // PUT请求
  put(url, data = {}, config = {}) {
    return request.put(url, data, config)
  },
  
  // PATCH请求
  patch(url, data = {}, config = {}) {
    return request.patch(url, data, config)
  },
  
  // DELETE请求
  delete(url, config = {}) {
    return request.delete(url, config)
  },
  
  // 文件上传
  upload(url, formData, config = {}) {
    return request.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config
    })
  },
  
  // 文件下载
  download(url, params = {}, filename = '') {
    return request.get(url, {
      params,
      responseType: 'blob'
    }).then(response => {
      const blob = new Blob([response])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    })
  }
}

// 认证相关API
export const authAPI = {
  // 登录
  login(credentials) {
    return api.post('/api/auth/login/', credentials)
  },
  
  // 刷新令牌
  refresh(refreshToken) {
    return api.post('/api/auth/refresh/', { refresh: refreshToken })
  },
  
  // 验证令牌
  verify(token) {
    return api.post('/api/auth/verify/', { token })
  },
  
  // 登出
  logout(refreshToken) {
    return api.post('/api/users/logout/', { refresh_token: refreshToken })
  },
  
  // 获取用户信息
  getUserInfo() {
    return api.get('/api/users/profile/')
  }
}

export { TokenManager }
export default request