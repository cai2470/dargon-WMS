// 筛选选项工具函数
// 用于动态加载各种筛选数据，确保与实际存储数据同步

/**
 * 获取启用的仓库列表
 * @returns {Array} 仓库选项数组
 */
export const getWarehouseOptions = () => {
  try {
    const warehouses = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
    return warehouses
      .filter(w => w.status === 1)
      .map(w => ({
        id: w.id,
        label: w.name,
        value: w.id,
        code: w.code
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  } catch (error) {
    console.error('获取仓库选项失败:', error)
    return [
      { id: 1, label: '主仓库', value: 1, code: 'WH001' },
      { id: 2, label: '北京仓库', value: 2, code: 'WH002' },
      { id: 3, label: '上海仓库', value: 3, code: 'WH003' }
    ]
  }
}

/**
 * 获取启用的库区列表
 * @param {number} warehouseId - 仓库ID，如果提供则只返回该仓库的库区
 * @returns {Array} 库区选项数组
 */
export const getZoneOptions = (warehouseId = null) => {
  try {
    const zones = JSON.parse(localStorage.getItem('wms_zones') || '[]')
    let filteredZones = zones.filter(z => z.status === 1)
    
    if (warehouseId) {
      filteredZones = filteredZones.filter(z => z.warehouse_id === warehouseId)
    }
    
    return filteredZones
      .map(z => ({
        id: z.id,
        label: z.name,
        value: z.id,
        warehouse_id: z.warehouse_id
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  } catch (error) {
    console.error('获取库区选项失败:', error)
    return []
  }
}

/**
 * 获取启用的分类列表
 * @returns {Array} 分类选项数组
 */
export const getCategoryOptions = () => {
  try {
    const categories = JSON.parse(localStorage.getItem('wms_categories') || '[]')
    return categories
      .filter(c => c.status === 1)
      .map(c => ({
        id: c.id,
        label: c.name,
        value: c.name,
        code: c.code
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  } catch (error) {
    console.error('获取分类选项失败:', error)
    return [
      { id: 1, label: '手机数码', value: '手机数码', code: 'ELECTRONICS' },
      { id: 2, label: '电脑办公', value: '电脑办公', code: 'COMPUTER' },
      { id: 3, label: '家用电器', value: '家用电器', code: 'APPLIANCE' },
      { id: 4, label: '服装鞋帽', value: '服装鞋帽', code: 'CLOTHING' }
    ]
  }
}

/**
 * 获取启用的供应商列表
 * @returns {Array} 供应商选项数组
 */
export const getSupplierOptions = () => {
  try {
    const suppliers = JSON.parse(localStorage.getItem('wms_suppliers') || '[]')
    if (suppliers.length > 0) {
      return suppliers
        .filter(s => s.status === 1)
        .map(s => ({
          id: s.id,
          label: s.name,
          value: s.id,
          code: s.code
        }))
        .sort((a, b) => a.label.localeCompare(b.label))
    } else {
      // 返回默认供应商数据
      return [
        { id: 1, label: '华为技术有限公司', value: 1, code: 'HUAWEI' },
        { id: 2, label: '小米科技有限公司', value: 2, code: 'XIAOMI' },
        { id: 3, label: '苹果公司', value: 3, code: 'APPLE' },
        { id: 4, label: '联想集团', value: 4, code: 'LENOVO' },
        { id: 5, label: '美的集团', value: 5, code: 'MIDEA' }
      ]
    }
  } catch (error) {
    console.error('获取供应商选项失败:', error)
    return [
      { id: 1, label: '华为技术有限公司', value: 1, code: 'HUAWEI' },
      { id: 2, label: '小米科技有限公司', value: 2, code: 'XIAOMI' },
      { id: 3, label: '苹果公司', value: 3, code: 'APPLE' }
    ]
  }
}

/**
 * 从商品数据中提取所有分类
 * @returns {Array} 从商品数据提取的分类选项
 */
export const getProductCategoryOptions = () => {
  try {
    const products = JSON.parse(localStorage.getItem('wms_products') || '[]')
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))]
    return categories.map(cat => ({
      label: cat,
      value: cat
    })).sort((a, b) => a.label.localeCompare(b.label))
  } catch (error) {
    console.error('获取商品分类选项失败:', error)
    return []
  }
}

/**
 * 获取合并的分类选项（包括分类管理和商品中的分类）
 * @returns {Array} 合并后的分类选项数组
 */
export const getAllCategoryOptions = () => {
  try {
    const dbCategories = getCategoryOptions()
    const productCategories = getProductCategoryOptions()
    
    // 合并并去重
    const allCategories = [...dbCategories, ...productCategories]
    const uniqueCategories = allCategories.filter((cat, index, self) => 
      index === self.findIndex(c => c.value === cat.value)
    )
    
    return uniqueCategories.sort((a, b) => a.label.localeCompare(b.label))
  } catch (error) {
    console.error('获取所有分类选项失败:', error)
    return getCategoryOptions() // 出错时使用分类管理中的数据
  }
}

/**
 * 获取库存状态选项
 * @returns {Array} 库存状态选项数组
 */
export const getStockStatusOptions = () => {
  return [
    { label: '正常', value: 'normal' },
    { label: '预警', value: 'warning' },
    { label: '缺货', value: 'out_of_stock' },
    { label: '超储', value: 'overstock' }
  ]
}

/**
 * 获取变动类型选项
 * @returns {Array} 变动类型选项数组
 */
export const getMovementTypeOptions = () => {
  return [
    { label: '入库', value: 'inbound' },
    { label: '出库', value: 'outbound' },
    { label: '调整', value: 'adjustment' },
    { label: '调拨', value: 'transfer' },
    { label: '盘点', value: 'count' },
    { label: '损耗', value: 'loss' }
  ]
}

/**
 * 获取出库类型选项
 * @returns {Array} 出库类型选项数组
 */
export const getOutboundTypeOptions = () => {
  return [
    { label: '销售出库', value: 'sale' },
    { label: '调拨出库', value: 'transfer' },
    { label: '退货出库', value: 'return' },
    { label: '其他出库', value: 'other' }
  ]
}

/**
 * 获取入库类型选项
 * @returns {Array} 入库类型选项数组
 */
export const getInboundTypeOptions = () => {
  return [
    { label: '采购入库', value: 'purchase' },
    { label: '退货入库', value: 'return' },
    { label: '调拨入库', value: 'transfer' },
    { label: '其他入库', value: 'other' }
  ]
}

/**
 * 获取优先级选项
 * @returns {Array} 优先级选项数组
 */
export const getPriorityOptions = () => {
  return [
    { label: '高', value: 'high' },
    { label: '中', value: 'medium' },
    { label: '低', value: 'low' }
  ]
}

/**
 * 获取状态选项（通用）
 * @returns {Array} 状态选项数组
 */
export const getStatusOptions = () => {
  return [
    { label: '启用', value: 1 },
    { label: '停用', value: 0 }
  ]
}

/**
 * 获取质检状态选项
 * @returns {Array} 质检状态选项数组
 */
export const getInspectionStatusOptions = () => {
  return [
    { label: '待质检', value: 'pending' },
    { label: '质检中', value: 'inspecting' },
    { label: '质检合格', value: 'passed' },
    { label: '质检不合格', value: 'failed' }
  ]
}

/**
 * 获取预警类型选项
 * @returns {Array} 预警类型选项数组
 */
export const getAlertTypeOptions = () => {
  return [
    { id: 'out_of_stock', label: '缺货预警', value: 'out_of_stock' },
    { id: 'low_stock', label: '低库存预警', value: 'low_stock' },
    { id: 'expiry', label: '过期预警', value: 'expiry' },
    { id: 'slow_moving', label: '滞销预警', value: 'slow_moving' }
  ]
}

/**
 * 获取预警状态选项
 * @returns {Array} 预警状态选项数组
 */
export const getAlertStatusOptions = () => {
  return [
    { id: 'pending', label: '未处理', value: 'pending' },
    { id: 'processing', label: '处理中', value: 'processing' },
    { id: 'resolved', label: '已处理', value: 'resolved' },
    { id: 'ignored', label: '已忽略', value: 'ignored' }
  ]
}

/**
 * 获取仓库类型选项
 * @returns {Array} 仓库类型选项数组
 */
export const getWarehouseTypeOptions = () => {
  return [
    { id: '主仓库', label: '主仓库', value: '主仓库' },
    { id: '分仓库', label: '分仓库', value: '分仓库' },
    { id: '中转仓', label: '中转仓', value: '中转仓' },
    { id: '退货仓', label: '退货仓', value: '退货仓' }
  ]
}

/**
 * 获取库区类型选项
 * @returns {Array} 库区类型选项数组
 */
export const getZoneTypeOptions = () => {
  return [
    { id: '常温区', label: '常温区', value: '常温区' },
    { id: '冷藏区', label: '冷藏区', value: '冷藏区' },
    { id: '冷冻区', label: '冷冻区', value: '冷冻区' },
    { id: '危险品区', label: '危险品区', value: '危险品区' },
    { id: '贵重品区', label: '贵重品区', value: '贵重品区' }
  ]
}

/**
 * 获取库位类型选项
 * @returns {Array} 库位类型选项数组
 */
export const getLocationTypeOptions = () => {
  return [
    { id: '货架', label: '货架', value: '货架' },
    { id: '地堆', label: '地堆', value: '地堆' },
    { id: '托盘', label: '托盘', value: '托盘' },
    { id: '悬挂', label: '悬挂', value: '悬挂' }
  ]
}

/**
 * 获取库位状态选项
 * @returns {Array} 库位状态选项数组
 */
export const getLocationStatusOptions = () => {
  return [
    { id: 'empty', label: '空闲', value: 'empty' },
    { id: 'occupied', label: '占用', value: 'occupied' },
    { id: 'reserved', label: '预留', value: 'reserved' },
    { id: 'disabled', label: '禁用', value: 'disabled' }
  ]
}

/**
 * 动态监听存储变化，自动刷新选项
 * @param {Function} callback - 当存储变化时的回调函数
 */
export const watchStorageChanges = (callback) => {
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.startsWith('wms_')) {
      callback(e.key, e.newValue)
    }
  })
} 