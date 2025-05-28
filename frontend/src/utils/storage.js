// 统一数据存储管理
const STORAGE_KEYS = {
  // 基础数据
  suppliers: 'wms_suppliers',
  warehouses: 'wms_warehouses', 
  products: 'wms_products',
  categories: 'wms_categories',
  brands: 'wms_brands',
  users: 'wms_users',
  
  // 业务数据
  inbound_orders: 'wms_inbound_orders',
  outbound_orders: 'wms_outbound_orders',
  inventory_records: 'wms_inventory_records',
  
  // 系统设置
  system_settings: 'wms_system_settings'
}

// 获取数据
export const getStorageData = (key) => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS[key])
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error(`Failed to get storage data for key: ${key}`, error)
    return null
  }
}

// 保存数据
export const setStorageData = (key, data) => {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(data))
    return true
  } catch (error) {
    console.error(`Failed to set storage data for key: ${key}`, error)
    return false
  }
}

// 生成唯一ID
export const generateId = () => {
  return Date.now() + Math.random().toString(36).substr(2, 9)
}

// 生成单号
export const generateOrderNo = (prefix = 'ORDER') => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0')
  const random = Math.random().toString().substr(2, 3)
  return `${prefix}${year}${month}${day}${time}${random}`
}

// 初始化库存变动记录export const initStockMovements = () => {  if (!getStorageData('stock_movements')) {    const movements = [      {        id: '1',        product_id: '1',        product_code: 'HW001',        product_name: '华为P50 Pro',        movement_type: 'inbound',        quantity: 20,        before_quantity: 25,        after_quantity: 45,        warehouse_id: '1',        location_id: '1',        location_name: 'A001',        order_no: 'IB2024010001',        remark: '采购入库',        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),        created_by: '仓库管理员'      },      {        id: '2',        product_id: '2',        product_code: 'IP001',        product_name: 'iPhone 14 Pro',        movement_type: 'outbound',        quantity: -5,        before_quantity: 13,        after_quantity: 8,        warehouse_id: '1',        location_id: '2',        location_name: 'A002',        order_no: 'OB2024010001',        remark: '销售出库',        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),        created_by: '销售人员'      },      {        id: '3',        product_id: '3',        product_code: 'XM001',        product_name: '小米13 Pro',        movement_type: 'adjustment',        quantity: 5,        before_quantity: 0,        after_quantity: 5,        warehouse_id: '2',        location_id: '3',        location_name: 'B001',        order_no: '',        remark: '盘点调整',        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),        created_by: '系统管理员'      }    ]    setStorageData('stock_movements', movements)  }}// 初始化默认数据export const initDefaultData = () => {
  // 初始化供应商数据
  if (!getStorageData('suppliers')) {
    setStorageData('suppliers', [
      { id: '1', name: '华为技术有限公司', code: 'SUP001', contact: '张经理', phone: '13800138001', status: 1 },
      { id: '2', name: '小米科技有限公司', code: 'SUP002', contact: '李经理', phone: '13800138002', status: 1 },
      { id: '3', name: '苹果电子产品商贸有限公司', code: 'SUP003', contact: '王经理', phone: '13800138003', status: 1 },
      { id: '4', name: '联想集团有限公司', code: 'SUP004', contact: '刘经理', phone: '13800138004', status: 1 }
    ])
  }

  // 初始化仓库数据
  if (!getStorageData('warehouses')) {
    setStorageData('warehouses', [
      { id: '1', name: '主仓库', code: 'WH001', address: '北京市朝阳区', status: 1 },
      { id: '2', name: '北京仓库', code: 'WH002', address: '北京市海淀区', status: 1 },
      { id: '3', name: '上海仓库', code: 'WH003', address: '上海市浦东新区', status: 1 },
      { id: '4', name: '广州仓库', code: 'WH004', address: '广州市天河区', status: 1 }
    ])
  }

  // 初始化商品数据
  if (!getStorageData('products')) {
    setStorageData('products', [
      { 
        id: '1', 
        name: '华为P50 Pro', 
        code: 'HW001', 
        unit: '台', 
        price: 4999.99,
        category: '手机',
        brand: '华为',
        supplier_id: '1',
        min_stock: 10,
        max_stock: 100,
        current_stock: 45
      },
      { 
        id: '2', 
        name: 'iPhone 14 Pro', 
        code: 'IP001', 
        unit: '台', 
        price: 7999.99,
        category: '手机',
        brand: '苹果',
        supplier_id: '3',
        min_stock: 5,
        max_stock: 80,
        current_stock: 8
      },
      { 
        id: '3', 
        name: '小米13 Pro', 
        code: 'XM001', 
        unit: '台', 
        price: 3999.99,
        category: '手机',
        brand: '小米',
        supplier_id: '2',
        min_stock: 10,
        max_stock: 60,
        current_stock: 0
      },
      { 
        id: '4', 
        name: 'ThinkPad X1 Carbon', 
        code: 'LP001', 
        unit: '台', 
        price: 12999.99,
        category: '笔记本',
        brand: '联想',
        supplier_id: '4',
        min_stock: 5,
        max_stock: 30,
        current_stock: 85
      }
    ])
  }

  // 初始化用户数据
  if (!getStorageData('users')) {
    setStorageData('users', [
      { 
        id: '1', 
        username: 'admin', 
        name: '系统管理员',
        email: 'admin@xiaoshenlong.com',
        phone: '13800138000',
        role: '超级管理员',
        status: 1,
        last_login: '2024-01-15 10:30:00'
      },
      { 
        id: '2', 
        username: 'warehouse_manager', 
        name: '仓库经理',
        email: 'wm@xiaoshenlong.com',
        phone: '13800138001',
        role: '仓库管理员',
        status: 1,
        last_login: '2024-01-15 09:15:00'
      }
    ])
  }

  // 初始化入库单数据
  if (!getStorageData('inbound_orders')) {
    setStorageData('inbound_orders', [])
  }

  // 初始化出库单数据
  if (!getStorageData('outbound_orders')) {
    setStorageData('outbound_orders', [])
  }


// 添加入库单
export const addInboundOrder = (orderData) => {
  const orders = getStorageData('inbound_orders') || []
  const newOrder = {
    id: generateId(),
    order_no: generateOrderNo('IB'),
    created_at: new Date().toLocaleString(),
    updated_at: new Date().toLocaleString(),
    status: 'pending',
    ...orderData
  }
  orders.unshift(newOrder)
  setStorageData('inbound_orders', orders)
  return newOrder
}

// 添加出库单
export const addOutboundOrder = (orderData) => {
  const orders = getStorageData('outbound_orders') || []
  const newOrder = {
    id: generateId(),
    order_no: generateOrderNo('OB'),
    created_at: new Date().toLocaleString(),
    updated_at: new Date().toLocaleString(),
    status: 'pending',
    ...orderData
  }
  orders.unshift(newOrder)
  setStorageData('outbound_orders', orders)
  return newOrder
}

// 更新入库单
export const updateInboundOrder = (orderId, updateData) => {
  const orders = getStorageData('inbound_orders') || []
  const index = orders.findIndex(order => order.id === orderId)
  if (index !== -1) {
    orders[index] = {
      ...orders[index],
      ...updateData,
      updated_at: new Date().toLocaleString()
    }
    setStorageData('inbound_orders', orders)
    return orders[index]
  }
  return null
}

// 更新出库单
export const updateOutboundOrder = (orderId, updateData) => {
  const orders = getStorageData('outbound_orders') || []
  const index = orders.findIndex(order => order.id === orderId)
  if (index !== -1) {
    orders[index] = {
      ...orders[index],
      ...updateData,
      updated_at: new Date().toLocaleString()
    }
    setStorageData('outbound_orders', orders)
    return orders[index]
  }
  return null
}

// 删除入库单
export const deleteInboundOrder = (orderId) => {
  const orders = getStorageData('inbound_orders') || []
  const filteredOrders = orders.filter(order => order.id !== orderId)
  setStorageData('inbound_orders', filteredOrders)
  return true
}

// 删除出库单
export const deleteOutboundOrder = (orderId) => {
  const orders = getStorageData('outbound_orders') || []
  const filteredOrders = orders.filter(order => order.id !== orderId)
  setStorageData('outbound_orders', filteredOrders)
  return true
}

// 获取供应商名称
export const getSupplierName = (supplierId) => {
  const suppliers = getStorageData('suppliers') || []
  const supplier = suppliers.find(s => s.id === supplierId)
  return supplier ? supplier.name : '未知供应商'
}

// 获取仓库名称
export const getWarehouseName = (warehouseId) => {
  const warehouses = getStorageData('warehouses') || []
  const warehouse = warehouses.find(w => w.id === warehouseId)
  return warehouse ? warehouse.name : '未知仓库'
}

// 获取商品信息
export const getProductInfo = (productId) => {
  const products = getStorageData('products') || []
  return products.find(p => p.id === productId)
} 