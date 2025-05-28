// 数据初始化工具
// 确保系统有基础数据可以显示

// 初始化供应商数据
export const initSuppliers = () => {
  const existingSuppliers = JSON.parse(localStorage.getItem('wms_suppliers') || '[]')
  
  if (existingSuppliers.length === 0) {
    const defaultSuppliers = [
      { id: 1, name: '华为供应商', code: 'SUP001', contact: '张经理', phone: '13800138001', address: '深圳市南山区' },
      { id: 2, name: '小米供应商', code: 'SUP002', contact: '李经理', phone: '13800138002', address: '北京市海淀区' },
      { id: 3, name: '苹果供应商', code: 'SUP003', contact: '王经理', phone: '13800138003', address: '上海市浦东新区' },
      { id: 4, name: '联想供应商', code: 'SUP004', contact: '赵经理', phone: '13800138004', address: '北京市朝阳区' },
      { id: 5, name: '戴尔供应商', code: 'SUP005', contact: '陈经理', phone: '13800138005', address: '广州市天河区' }
    ]
    
    localStorage.setItem('wms_suppliers', JSON.stringify(defaultSuppliers))
    console.log('✅ 初始化供应商数据完成')
    return defaultSuppliers
  }
  
  return existingSuppliers
}

// 初始化客户数据
export const initCustomers = () => {
  const existingCustomers = JSON.parse(localStorage.getItem('wms_customers') || '[]')
  
  if (existingCustomers.length === 0) {
    const defaultCustomers = [
      { id: 1, name: '京东商城', code: 'JD001', contact: '刘经理', phone: '13900139001', address: '北京市大兴区' },
      { id: 2, name: '天猫超市', code: 'TM001', contact: '马经理', phone: '13900139002', address: '杭州市西湖区' },
      { id: 3, name: '苏宁易购', code: 'SN001', contact: '张经理', phone: '13900139003', address: '南京市建邺区' },
      { id: 4, name: '拼多多', code: 'PDD001', contact: '黄经理', phone: '13900139004', address: '上海市长宁区' },
      { id: 5, name: '淘宝网', code: 'TB001', contact: '孙经理', phone: '13900139005', address: '杭州市余杭区' }
    ]
    
    localStorage.setItem('wms_customers', JSON.stringify(defaultCustomers))
    console.log('✅ 初始化客户数据完成')
    return defaultCustomers
  }
  
  return existingCustomers
}

// 初始化库存预警数据
export const initStockAlerts = () => {
  const inventoryStock = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
  const products = JSON.parse(localStorage.getItem('wms_products') || '[]')
  
  if (inventoryStock.length === 0) {
    console.log('⚠️ 没有库存数据，无法生成预警')
    return []
  }
  
  const alerts = []
  let alertId = 1
  
  // 遍历库存数据生成预警
  for (const stock of inventoryStock) {
    const product = products.find(p => p.id === stock.id || p.code === stock.product_code)
    const currentStock = parseInt(stock.current_stock || stock.qualified_stock || 0)
    const minStock = parseInt(stock.min_stock || product?.min_stock || 10)
    const alertThreshold = Math.ceil(minStock * 1.5) // 预警阈值为最低库存的1.5倍
    
    let alertType = ''
    let priority = ''
    
    // 判断预警类型和级别
    if (currentStock === 0) {
      alertType = 'out_of_stock'
      priority = 'critical'
    } else if (currentStock <= alertThreshold) {
      alertType = 'low_stock'
      priority = currentStock <= minStock ? 'critical' : 'warning'
    }
    
    // 只有需要预警的才加入列表
    if (alertType) {
      alerts.push({
        id: alertId++,
        alert_type: alertType,
        priority: priority,
        product_name: stock.product_name || product?.name || '未知商品',
        product_code: stock.product_code || product?.code || 'UNKNOWN',
        warehouse_name: stock.warehouse_name || '主仓库',
        location_name: stock.location_name || 'A001',
        current_stock: currentStock,
        min_stock: minStock,
        alert_threshold: alertThreshold,
        status: 'pending',
        created_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleString(),
        processed_time: '',
        supplier_id: Math.floor(Math.random() * 5) + 1
      })
    }
  }
  
  console.log(`✅ 生成 ${alerts.length} 条库存预警`)
  return alerts
}

// 初始化库存盘点数据
export const initInventoryCounts = () => {
  const existingCounts = JSON.parse(localStorage.getItem('inventory_counts') || '[]')
  
  if (existingCounts.length > 0) {
    return existingCounts
  }
  
  const inventoryStock = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
  const warehousesData = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
  
  if (inventoryStock.length === 0) {
    console.log('⚠️ 没有库存数据，无法生成盘点记录')
    return []
  }
  
  // 按仓库分组统计商品数量
  const warehouseStats = {}
  inventoryStock.forEach(stock => {
    const warehouseId = stock.warehouse_id || 1
    const warehouseName = stock.warehouse_name || warehousesData.find(w => w.id === warehouseId)?.name || '主仓库'
    
    if (!warehouseStats[warehouseId]) {
      warehouseStats[warehouseId] = {
        warehouse_name: warehouseName,
        product_count: 0,
        zones: new Set()
      }
    }
    
    warehouseStats[warehouseId].product_count++
    warehouseStats[warehouseId].zones.add(stock.zone_name || 'A区')
  })
  
  // 生成盘点记录
  const counters = ['张三', '李四', '王五', '赵六', '陈七']
  const countTypes = ['full', 'sample', 'cycle', 'dynamic']
  const statuses = ['completed', 'counting', 'pending']
  
  const counts = []
  let countId = 1
  
  Object.entries(warehouseStats).forEach(([warehouseId, stats]) => {
    // 为每个仓库生成1-2个盘点记录
    const countNum = Math.floor(Math.random() * 2) + 1
    
    for (let i = 0; i < countNum; i++) {
      const daysAgo = Math.floor(Math.random() * 7) + 1
      const createdTime = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      
      let startTime = ''
      let endTime = ''
      let differenceCount = null
      
      if (status === 'counting' || status === 'completed') {
        startTime = new Date(createdTime.getTime() + 30 * 60 * 1000).toLocaleString()
      }
      
      if (status === 'completed') {
        endTime = new Date(createdTime.getTime() + (3 + Math.random() * 2) * 60 * 60 * 1000).toLocaleString()
        differenceCount = Math.floor(Math.random() * 5) // 0-4个差异
      }
      
      counts.push({
        id: countId++,
        count_no: `IC${createdTime.getFullYear()}${String(createdTime.getMonth() + 1).padStart(2, '0')}${String(createdTime.getDate()).padStart(2, '0')}${String(countId).padStart(4, '0')}`,
        count_type: countTypes[Math.floor(Math.random() * countTypes.length)],
        warehouse_id: parseInt(warehouseId),
        warehouse_name: stats.warehouse_name,
        zone_name: Array.from(stats.zones)[0] || 'A区',
        product_count: Math.min(stats.product_count, Math.floor(Math.random() * 20) + 5),
        status: status,
        difference_count: differenceCount,
        counter: counters[Math.floor(Math.random() * counters.length)],
        created_time: createdTime.toLocaleString(),
        start_time: startTime,
        end_time: endTime,
        remark: status === 'completed' ? '盘点完成' : status === 'counting' ? '盘点进行中' : '待开始盘点'
      })
    }
  })
  
  localStorage.setItem('inventory_counts', JSON.stringify(counts))
  console.log(`✅ 生成 ${counts.length} 条盘点记录`)
  return counts
}

// 初始化所有基础数据
export const initAllData = () => {
  console.log('🚀 开始初始化系统基础数据...')
  
  try {
    initSuppliers()
    initCustomers()
    initStockAlerts()
    initInventoryCounts()
    
    console.log('✅ 系统基础数据初始化完成')
    return true
  } catch (error) {
    console.error('❌ 系统基础数据初始化失败:', error)
    return false
  }
}

// 检查数据完整性
export const checkDataIntegrity = () => {
  const checks = {
    warehouses: JSON.parse(localStorage.getItem('wms_warehouses') || '[]').length > 0,
    products: JSON.parse(localStorage.getItem('wms_products') || '[]').length > 0,
    inventory: JSON.parse(localStorage.getItem('inventory_stock') || '[]').length > 0,
    suppliers: JSON.parse(localStorage.getItem('wms_suppliers') || '[]').length > 0,
    customers: JSON.parse(localStorage.getItem('wms_customers') || '[]').length > 0,
    inboundOrders: JSON.parse(localStorage.getItem('inbound_orders') || '[]').length > 0,
    outboundOrders: JSON.parse(localStorage.getItem('outbound_orders') || '[]').length > 0
  }
  
  const missingData = Object.entries(checks)
    .filter(([key, hasData]) => !hasData)
    .map(([key]) => key)
  
  if (missingData.length > 0) {
    console.warn('⚠️ 缺少以下数据:', missingData)
    return false
  }
  
  console.log('✅ 数据完整性检查通过')
  return true
} 