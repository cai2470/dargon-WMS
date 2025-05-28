/**
 * 小神龙WMS系统 - 业务数据服务层
 * 将localStorage数据持久化替换为真正的API调用
 */
import { api } from './request'

// ==================== 认证服务 ====================
export const authService = {
  // 登录
  async login(credentials) {
    const response = await api.post('/api/auth/login/', credentials)
    
    // 保存令牌和用户信息
    if (response.tokens) {
      localStorage.setItem('access_token', response.tokens.access)
      localStorage.setItem('refresh_token', response.tokens.refresh)
    }
    
    if (response.user) {
      localStorage.setItem('user_info', JSON.stringify(response.user))
    }
    
    return response
  },
  
  // 登出
  async logout() {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      try {
        await api.post('/api/users/logout/', { refresh_token: refreshToken })
      } catch (error) {
        console.warn('登出请求失败:', error)
      }
    }
    
    // 清除本地数据
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_info')
  },
  
  // 获取当前用户信息
  async getCurrentUser() {
    return await api.get('/api/users/profile/')
  }
}

// ==================== 仓库服务 ====================
export const warehouseService = {
  // 获取仓库列表
  async getWarehouses(params = {}) {
    const response = await api.get('/api/warehouse/warehouses/', params)
    return response.results || response
  },
  
  // 创建仓库
  async createWarehouse(data) {
    return await api.post('/api/warehouse/warehouses/', data)
  },
  
  // 更新仓库
  async updateWarehouse(id, data) {
    return await api.put(`/api/warehouse/warehouses/${id}/`, data)
  },
  
  // 删除仓库
  async deleteWarehouse(id) {
    return await api.delete(`/api/warehouse/warehouses/${id}/`)
  },
  
  // 获取库区列表
  async getZones(warehouseId = null) {
    const params = warehouseId ? { warehouse: warehouseId } : {}
    const response = await api.get('/api/warehouse/zones/', params)
    return response.results || response
  },
  
  // 创建库区
  async createZone(data) {
    return await api.post('/api/warehouse/zones/', data)
  },
  
  // 获取库位列表
  async getLocations(params = {}) {
    const response = await api.get('/api/warehouse/locations/', params)
    return response.results || response
  },
  
  // 创建库位
  async createLocation(data) {
    return await api.post('/api/warehouse/locations/', data)
  }
}

// ==================== 商品服务 ====================
export const productService = {
  // 获取商品列表
  async getProducts(params = {}) {
    const response = await api.get('/api/products/products/', params)
    return response.results || response
  },
  
  // 创建商品
  async createProduct(data) {
    return await api.post('/api/products/products/', data)
  },
  
  // 更新商品
  async updateProduct(id, data) {
    return await api.put(`/api/products/products/${id}/`, data)
  },
  
  // 删除商品
  async deleteProduct(id) {
    return await api.delete(`/api/products/products/${id}/`)
  },
  
  // 批量导入商品
  async batchImportProducts(formData) {
    return await api.upload('/api/products/products/batch_import/', formData)
  },
  
  // 导出商品数据
  async exportProducts(params = {}) {
    return await api.download('/api/products/products/export/', params, '商品数据.csv')
  },
  
  // 获取商品分类
  async getCategories() {
    const response = await api.get('/api/products/categories/')
    return response.results || response
  },
  
  // 获取供应商列表
  async getSuppliers(params = {}) {
    const response = await api.get('/api/products/suppliers/', params)
    return response.results || response
  },
  
  // 创建供应商
  async createSupplier(data) {
    return await api.post('/api/products/suppliers/', data)
  },
  
  // 批量导入供应商
  async batchImportSuppliers(formData) {
    return await api.upload('/api/products/suppliers/batch_import/', formData)
  }
}

// ==================== 库存服务 ====================
export const inventoryService = {
  // 获取库存列表
  async getStock(params = {}) {
    const response = await api.get('/api/inventory/stock/', params)
    return response.results || response
  },
  
  // 获取库存汇总统计
  async getStockSummary(warehouseId = null) {
    const params = warehouseId ? { warehouse_id: warehouseId } : {}
    return await api.get('/api/inventory/stock/summary/', params)
  },
  
  // 导出库存数据
  async exportStock(params = {}) {
    return await api.download('/api/inventory/stock/export/', params, '库存数据.csv')
  },
  
  // 获取库存变动记录
  async getStockMovements(params = {}) {
    const response = await api.get('/api/inventory/stock_movements/', params)
    return response.results || response
  },
  
  // 获取库存预警
  async getStockAlerts(params = {}) {
    const response = await api.get('/api/inventory/stock_alerts/', params)
    return response.results || response
  },
  
  // 处理库存预警
  async handleStockAlert(alertId) {
    return await api.post(`/api/inventory/stock_alerts/${alertId}/handle/`)
  }
}

// ==================== 入库服务 ====================
export const inboundService = {
  // 获取入库单列表
  async getInboundOrders(params = {}) {
    const response = await api.get('/api/inbound/orders/', params)
    return response.results || response
  },
  
  // 创建入库单
  async createInboundOrder(data) {
    return await api.post('/api/inbound/orders/', data)
  },
  
  // 更新入库单
  async updateInboundOrder(id, data) {
    return await api.put(`/api/inbound/orders/${id}/`, data)
  },
  
  // 确认收货
  async confirmReceiving(id, data) {
    return await api.post(`/api/inbound/orders/${id}/confirm_receiving/`, data)
  },
  
  // 完成入库
  async completeInbound(id, data) {
    return await api.post(`/api/inbound/orders/${id}/complete/`, data)
  }
}

// ==================== 出库服务 ====================
export const outboundService = {
  // 获取出库单列表
  async getOutboundOrders(params = {}) {
    const response = await api.get('/api/outbound/orders/', params)
    return response.results || response
  },
  
  // 创建出库单
  async createOutboundOrder(data) {
    return await api.post('/api/outbound/orders/', data)
  },
  
  // 更新出库单
  async updateOutboundOrder(id, data) {
    return await api.put(`/api/outbound/orders/${id}/`, data)
  },
  
  // 开始拣货
  async startPicking(id) {
    return await api.post(`/api/outbound/orders/${id}/start_picking/`)
  },
  
  // 完成出库
  async completeOutbound(id, data) {
    return await api.post(`/api/outbound/orders/${id}/complete/`, data)
  }
}

// ==================== 报表服务 ====================
export const reportService = {
  // 获取仪表板统计数据
  async getDashboardStats() {
    return await api.get('/api/reports/dashboard_stats/')
  },
  
  // 获取最近操作记录
  async getRecentActivities(limit = 10) {
    return await api.get('/api/reports/recent_activities/', { limit })
  },
  
  // 获取库存报表
  async getInventoryReport(params = {}) {
    return await api.get('/api/reports/inventory/', params)
  },
  
  // 获取出入库报表
  async getInOutboundReport(params = {}) {
    return await api.get('/api/reports/inoutbound/', params)
  }
}

// ==================== 系统服务 ====================
export const systemService = {
  // 获取系统配置
  async getSystemConfig() {
    return await api.get('/api/system/config/')
  },
  
  // 更新系统配置
  async updateSystemConfig(data) {
    return await api.put('/api/system/config/', data)
  },
  
  // 获取操作日志
  async getOperationLogs(params = {}) {
    const response = await api.get('/api/system/operation_logs/', params)
    return response.results || response
  }
}

// ==================== 数据迁移服务 ====================
export const migrationService = {
  // 将localStorage数据迁移到后端
  async migrateLocalStorageData() {
    const migrations = []
    
    try {
      // 1. 迁移仓库数据
      const warehouses = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
      if (warehouses.length > 0) {
        for (const warehouse of warehouses) {
          try {
            await warehouseService.createWarehouse(warehouse)
            migrations.push({ type: 'warehouse', id: warehouse.id, status: 'success' })
          } catch (error) {
            migrations.push({ type: 'warehouse', id: warehouse.id, status: 'failed', error })
          }
        }
      }
      
      // 2. 迁移商品数据
      const products = JSON.parse(localStorage.getItem('wms_products') || '[]')
      if (products.length > 0) {
        for (const product of products) {
          try {
            await productService.createProduct(product)
            migrations.push({ type: 'product', id: product.id, status: 'success' })
          } catch (error) {
            migrations.push({ type: 'product', id: product.id, status: 'failed', error })
          }
        }
      }
      
      // 3. 迁移供应商数据
      const suppliers = JSON.parse(localStorage.getItem('wms_suppliers') || '[]')
      if (suppliers.length > 0) {
        for (const supplier of suppliers) {
          try {
            await productService.createSupplier(supplier)
            migrations.push({ type: 'supplier', id: supplier.id, status: 'success' })
          } catch (error) {
            migrations.push({ type: 'supplier', id: supplier.id, status: 'failed', error })
          }
        }
      }
      
      // 4. 迁移库存数据（需要特殊处理，因为库存数据结构可能不同）
      // 这部分可能需要根据实际API设计调整
      
      return {
        success: true,
        migrations,
        message: `数据迁移完成，成功迁移 ${migrations.filter(m => m.status === 'success').length} 条记录`
      }
      
    } catch (error) {
      return {
        success: false,
        error,
        message: '数据迁移过程中发生错误'
      }
    }
  },
  
  // 清除localStorage中的业务数据（保留用户登录信息）
  clearLocalStorageData() {
    const keysToRemove = [
      'wms_warehouses',
      'wms_products', 
      'wms_suppliers',
      'inventory_stock',
      'inbound_orders',
      'outbound_orders',
      // 可以根据需要添加更多key
    ]
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
  }
}

// 导出所有服务
export default {
  auth: authService,
  warehouse: warehouseService,
  product: productService,
  inventory: inventoryService,
  inbound: inboundService,
  outbound: outboundService,
  report: reportService,
  system: systemService,
  migration: migrationService
} 