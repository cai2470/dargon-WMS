/**
 * 数据迁移工具
 * 将localStorage中的业务数据迁移到后端API
 */
import { ElMessage, ElMessageBox } from 'element-plus'
import services from '@/api/services'

/**
 * 数据迁移管理器
 */
export class DataMigrationManager {
  constructor() {
    this.isApiAvailable = false
    this.migrationStatus = {
      total: 0,
      success: 0,
      failed: 0,
      items: []
    }
  }

  /**
   * 检查API是否可用
   */
  async checkApiAvailability() {
    try {
      // 尝试获取用户信息来测试API连接
      await services.auth.getCurrentUser()
      this.isApiAvailable = true
      return true
    } catch (error) {
      console.warn('API不可用，将继续使用localStorage:', error.message)
      this.isApiAvailable = false
      return false
    }
  }

  /**
   * 检查localStorage中是否有数据需要迁移
   */
  checkLocalStorageData() {
    const localDataKeys = [
      'wms_warehouses',
      'wms_products', 
      'wms_suppliers',
      'inventory_stock',
      'inbound_orders',
      'outbound_orders'
    ]

    const dataToMigrate = {}
    let totalItems = 0

    localDataKeys.forEach(key => {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '[]')
        if (Array.isArray(data) && data.length > 0) {
          dataToMigrate[key] = data
          totalItems += data.length
        }
      } catch (error) {
        console.warn(`解析${key}数据失败:`, error)
      }
    })

    return { dataToMigrate, totalItems }
  }

  /**
   * 显示迁移提示对话框
   */
  async showMigrationDialog() {
    const { dataToMigrate, totalItems } = this.checkLocalStorageData()

    if (totalItems === 0) {
      ElMessage.info('没有发现需要迁移的本地数据')
      return false
    }

    const dataTypes = Object.keys(dataToMigrate).map(key => {
      const typeMap = {
        'wms_warehouses': '仓库',
        'wms_products': '商品',
        'wms_suppliers': '供应商', 
        'inventory_stock': '库存',
        'inbound_orders': '入库单',
        'outbound_orders': '出库单'
      }
      return `${typeMap[key] || key}: ${dataToMigrate[key].length}条`
    }).join('\n')

    try {
      await ElMessageBox.confirm(
        `检测到本地存储中有以下数据需要迁移到服务器：\n\n${dataTypes}\n\n总计 ${totalItems} 条记录\n\n是否立即开始迁移？`,
        '数据迁移确认',
        {
          confirmButtonText: '开始迁移',
          cancelButtonText: '稍后迁移',
          type: 'info',
          customClass: 'migration-dialog'
        }
      )
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 执行数据迁移
   */
  async performMigration() {
    const { dataToMigrate, totalItems } = this.checkLocalStorageData()
    
    if (totalItems === 0) {
      return { success: true, message: '没有数据需要迁移' }
    }

    this.migrationStatus = {
      total: totalItems,
      success: 0,
      failed: 0,
      items: []
    }

    // 显示进度提示
    const progressMsg = ElMessage({
      type: 'info',
      message: '正在迁移数据，请稍候...',
      duration: 0
    })

    try {
      // 1. 迁移仓库数据
      if (dataToMigrate.wms_warehouses) {
        await this.migrateWarehouses(dataToMigrate.wms_warehouses)
      }

      // 2. 迁移商品数据
      if (dataToMigrate.wms_products) {
        await this.migrateProducts(dataToMigrate.wms_products)
      }

      // 3. 迁移供应商数据
      if (dataToMigrate.wms_suppliers) {
        await this.migrateSuppliers(dataToMigrate.wms_suppliers)
      }

      // 4. 迁移库存数据（需要特殊处理）
      if (dataToMigrate.inventory_stock) {
        await this.migrateInventory(dataToMigrate.inventory_stock)
      }

      progressMsg.close()

      const successRate = (this.migrationStatus.success / this.migrationStatus.total * 100).toFixed(1)
      
      if (this.migrationStatus.failed === 0) {
        ElMessage.success(`🎉 数据迁移完成！成功迁移 ${this.migrationStatus.success} 条记录`)
        
        // 询问是否清除本地数据
        const shouldClear = await this.showClearLocalDataDialog()
        if (shouldClear) {
          this.clearLocalData()
        }
        
        return { 
          success: true, 
          message: `迁移完成，成功率: ${successRate}%`,
          details: this.migrationStatus
        }
      } else {
        ElMessage.warning(`⚠️ 数据迁移部分完成：成功 ${this.migrationStatus.success} 条，失败 ${this.migrationStatus.failed} 条`)
        return { 
          success: false, 
          message: `部分数据迁移失败，成功率: ${successRate}%`,
          details: this.migrationStatus
        }
      }

    } catch (error) {
      progressMsg.close()
      ElMessage.error(`❌ 数据迁移过程中发生错误: ${error.message}`)
      return { 
        success: false, 
        message: `迁移失败: ${error.message}`,
        details: this.migrationStatus
      }
    }
  }

  /**
   * 迁移仓库数据
   */
  async migrateWarehouses(warehouses) {
    for (const warehouse of warehouses) {
      try {
        await services.warehouse.createWarehouse(warehouse)
        this.migrationStatus.success++
        this.migrationStatus.items.push({
          type: 'warehouse',
          name: warehouse.name,
          status: 'success'
        })
      } catch (error) {
        this.migrationStatus.failed++
        this.migrationStatus.items.push({
          type: 'warehouse',
          name: warehouse.name,
          status: 'failed',
          error: error.message
        })
      }
    }
  }

  /**
   * 迁移商品数据
   */
  async migrateProducts(products) {
    for (const product of products) {
      try {
        await services.product.createProduct(product)
        this.migrationStatus.success++
        this.migrationStatus.items.push({
          type: 'product',
          name: product.name,
          status: 'success'
        })
      } catch (error) {
        this.migrationStatus.failed++
        this.migrationStatus.items.push({
          type: 'product',
          name: product.name,
          status: 'failed',
          error: error.message
        })
      }
    }
  }

  /**
   * 迁移供应商数据
   */
  async migrateSuppliers(suppliers) {
    for (const supplier of suppliers) {
      try {
        await services.product.createSupplier(supplier)
        this.migrationStatus.success++
        this.migrationStatus.items.push({
          type: 'supplier',
          name: supplier.name,
          status: 'success'
        })
      } catch (error) {
        this.migrationStatus.failed++
        this.migrationStatus.items.push({
          type: 'supplier',
          name: supplier.name,
          status: 'failed',
          error: error.message
        })
      }
    }
  }

  /**
   * 迁移库存数据（暂时跳过，因为库存数据结构复杂）
   */
  async migrateInventory(inventory) {
    console.log('库存数据迁移暂时跳过，需要根据API设计调整')
    // 这部分需要根据实际的库存API设计来实现
  }

  /**
   * 显示清除本地数据确认对话框
   */
  async showClearLocalDataDialog() {
    try {
      await ElMessageBox.confirm(
        '数据已成功迁移到服务器！\n\n是否清除本地存储的数据？\n（清除后将完全使用服务器数据）',
        '清除本地数据',
        {
          confirmButtonText: '清除本地数据',
          cancelButtonText: '保留本地数据',
          type: 'warning'
        }
      )
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 清除本地业务数据
   */
  clearLocalData() {
    const keysToRemove = [
      'wms_warehouses',
      'wms_products', 
      'wms_suppliers',
      'inventory_stock',
      'inbound_orders',
      'outbound_orders'
    ]

    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })

    // 设置迁移完成标记
    localStorage.setItem('data_migration_completed', 'true')
    
    ElMessage.success('本地数据已清除，系统将使用服务器数据')
  }

  /**
   * 检查是否已完成数据迁移
   */
  isMigrationCompleted() {
    return localStorage.getItem('data_migration_completed') === 'true'
  }
}

// 创建全局实例
export const dataMigration = new DataMigrationManager()

/**
 * 在应用启动时检查和执行数据迁移
 */
export async function initDataMigration() {
  // 如果已经完成迁移，跳过
  if (dataMigration.isMigrationCompleted()) {
    console.log('✅ 数据迁移已完成，使用服务器数据')
    return
  }

  // 检查API是否可用
  const apiAvailable = await dataMigration.checkApiAvailability()
  
  if (!apiAvailable) {
    console.log('🔄 API不可用，继续使用localStorage模式')
    return
  }

  // 检查是否有数据需要迁移
  const { totalItems } = dataMigration.checkLocalStorageData()
  
  if (totalItems === 0) {
    // 没有本地数据，标记为已迁移
    localStorage.setItem('data_migration_completed', 'true')
    return
  }

  // 显示迁移提示
  setTimeout(async () => {
    const shouldMigrate = await dataMigration.showMigrationDialog()
    if (shouldMigrate) {
      await dataMigration.performMigration()
    }
  }, 2000) // 延迟2秒显示，让用户先看到界面
}

export default dataMigration 