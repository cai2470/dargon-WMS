import request from './request'

const systemApi = {
  // 系统设置
  settings: {
    // 获取系统设置
    get() {
      return request({
        url: '/api/system/settings/',
        method: 'get'
      })
    },

    // 更新系统设置
    update(data) {
      return request({
        url: '/api/system/settings/',
        method: 'put',
        data
      })
    },

    // 重置系统设置
    reset() {
      return request({
        url: '/api/system/settings/reset/',
        method: 'post'
      })
    }
  },

  // 系统日志
  logs: {
    // 获取系统日志列表
    list(params = {}) {
      return request({
        url: '/api/system/logs/',
        method: 'get',
        params
      })
    },

    // 获取日志详情
    detail(id) {
      return request({
        url: `/api/system/logs/${id}/`,
        method: 'get'
      })
    },

    // 清理日志
    clean(data) {
      return request({
        url: '/api/system/logs/clean/',
        method: 'post',
        data
      })
    },

    // 导出日志
    export(params = {}) {
      return request({
        url: '/api/system/logs/export/',
        method: 'get',
        params,
        responseType: 'blob'
      })
    },

    // 获取日志统计
    getStats(params = {}) {
      return request({
        url: '/api/system/logs/stats/',
        method: 'get',
        params
      })
    }
  },

  // 操作日志
  operationLogs: {
    // 获取操作日志列表
    list(params = {}) {
      return request({
        url: '/api/system/operation_logs/',
        method: 'get',
        params
      })
    },

    // 获取操作日志详情
    detail(id) {
      return request({
        url: `/api/system/operation_logs/${id}/`,
        method: 'get'
      })
    },

    // 导出操作日志
    export(params = {}) {
      return request({
        url: '/api/system/operation_logs/export/',
        method: 'get',
        params,
        responseType: 'blob'
      })
    }
  },

  // 登录日志
  loginLogs: {
    // 获取登录日志列表
    list(params = {}) {
      return request({
        url: '/api/system/login_logs/',
        method: 'get',
        params
      })
    },

    // 获取登录统计
    getStats(params = {}) {
      return request({
        url: '/api/system/login_logs/stats/',
        method: 'get',
        params
      })
    },

    // 导出登录日志
    export(params = {}) {
      return request({
        url: '/api/system/login_logs/export/',
        method: 'get',
        params,
        responseType: 'blob'
      })
    }
  },

  // 系统监控
  monitor: {
    // 获取系统状态
    getStatus() {
      return request({
        url: '/api/system/monitor/status/',
        method: 'get'
      })
    },

    // 获取性能指标
    getMetrics(params = {}) {
      return request({
        url: '/api/system/monitor/metrics/',
        method: 'get',
        params
      })
    },

    // 获取数据库状态
    getDatabaseStatus() {
      return request({
        url: '/api/system/monitor/database/',
        method: 'get'
      })
    },

    // 获取存储状态
    getStorageStatus() {
      return request({
        url: '/api/system/monitor/storage/',
        method: 'get'
      })
    }
  },

  // 数据备份
  backup: {
    // 获取备份列表
    list(params = {}) {
      return request({
        url: '/api/system/backup/',
        method: 'get',
        params
      })
    },

    // 创建备份
    create(data) {
      return request({
        url: '/api/system/backup/',
        method: 'post',
        data
      })
    },

    // 删除备份
    delete(id) {
      return request({
        url: `/api/system/backup/${id}/`,
        method: 'delete'
      })
    },

    // 恢复备份
    restore(id) {
      return request({
        url: `/api/system/backup/${id}/restore/`,
        method: 'post'
      })
    },

    // 下载备份
    download(id) {
      return request({
        url: `/api/system/backup/${id}/download/`,
        method: 'get',
        responseType: 'blob'
      })
    }
  },

  // 系统维护
  maintenance: {
    // 获取维护状态
    getStatus() {
      return request({
        url: '/api/system/maintenance/status/',
        method: 'get'
      })
    },

    // 开启维护模式
    enable(data) {
      return request({
        url: '/api/system/maintenance/enable/',
        method: 'post',
        data
      })
    },

    // 关闭维护模式
    disable() {
      return request({
        url: '/api/system/maintenance/disable/',
        method: 'post'
      })
    },

    // 清理缓存
    clearCache() {
      return request({
        url: '/api/system/maintenance/clear_cache/',
        method: 'post'
      })
    },

    // 重建索引
    rebuildIndex() {
      return request({
        url: '/api/system/maintenance/rebuild_index/',
        method: 'post'
      })
    },

    // 数据库优化
    optimizeDatabase() {
      return request({
        url: '/api/system/maintenance/optimize_db/',
        method: 'post'
      })
    }
  },

  // 系统配置
  config: {
    // 获取配置列表
    list(params = {}) {
      return request({
        url: '/api/system/config/',
        method: 'get',
        params
      })
    },

    // 获取配置详情
    detail(key) {
      return request({
        url: `/api/system/config/${key}/`,
        method: 'get'
      })
    },

    // 更新配置
    update(key, data) {
      return request({
        url: `/api/system/config/${key}/`,
        method: 'put',
        data
      })
    },

    // 批量更新配置
    batchUpdate(data) {
      return request({
        url: '/api/system/config/batch_update/',
        method: 'post',
        data
      })
    },

    // 重置配置
    reset(key) {
      return request({
        url: `/api/system/config/${key}/reset/`,
        method: 'post'
      })
    }
  },

  // 系统信息
  info: {
    // 获取系统信息
    get() {
      return request({
        url: '/api/system/info/',
        method: 'get'
      })
    },

    // 获取版本信息
    getVersion() {
      return request({
        url: '/api/system/info/version/',
        method: 'get'
      })
    },

    // 检查更新
    checkUpdate() {
      return request({
        url: '/api/system/info/check_update/',
        method: 'get'
      })
    }
  },

  // 通知管理
  notifications: {
    // 获取通知列表
    list(params = {}) {
      return request({
        url: '/api/system/notifications/',
        method: 'get',
        params
      })
    },

    // 创建通知
    create(data) {
      return request({
        url: '/api/system/notifications/',
        method: 'post',
        data
      })
    },

    // 标记为已读
    markAsRead(id) {
      return request({
        url: `/api/system/notifications/${id}/read/`,
        method: 'post'
      })
    },

    // 批量标记为已读
    batchMarkAsRead(ids) {
      return request({
        url: '/api/system/notifications/batch_read/',
        method: 'post',
        data: { ids }
      })
    },

    // 删除通知
    delete(id) {
      return request({
        url: `/api/system/notifications/${id}/`,
        method: 'delete'
      })
    }
  }
}

export default systemApi 