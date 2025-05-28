// 完整出库流程修复脚本
// 解决所有环节的数据显示问题

function fixCompleteOutboundFlow() {
  console.log('🔧 开始修复完整出库流程...')
  
  // 清除现有数据，重新创建完整的测试数据
  localStorage.removeItem('outbound_orders')
  localStorage.removeItem('wms_warehouses')
  localStorage.removeItem('wms_products')
  localStorage.removeItem('inventory_stock')
  localStorage.removeItem('wms_stock_movements')
  
  // 1. 创建基础数据
  const warehouses = [
    { id: 1, name: '主仓库', code: 'WH001', status: '启用' },
    { id: 2, name: '分仓库', code: 'WH002', status: '启用' }
  ]
  localStorage.setItem('wms_warehouses', JSON.stringify(warehouses))
  
  const products = [
    { id: 1, code: 'P001', isku: 'SKU001', name: '测试商品A', unit: '个', price: 50.00, attributes: [{ name: '颜色', value: '红色' }] },
    { id: 2, code: 'P002', isku: 'SKU002', name: '测试商品B', unit: '件', price: 30.00, attributes: [{ name: '颜色', value: '蓝色' }] },
    { id: 3, code: 'P003', isku: 'SKU003', name: '测试商品C', unit: '盒', price: 25.00, attributes: [{ name: '规格', value: '500ml' }] }
  ]
  localStorage.setItem('wms_products', JSON.stringify(products))
  
  const inventory = [
    { id: 1, product_id: 1, product_code: 'P001', warehouse_id: 1, current_stock: 100, available_stock: 95 },
    { id: 2, product_id: 2, product_code: 'P002', warehouse_id: 1, current_stock: 80, available_stock: 75 },
    { id: 3, product_id: 3, product_code: 'P003', warehouse_id: 1, current_stock: 60, available_stock: 55 }
  ]
  localStorage.setItem('inventory_stock', JSON.stringify(inventory))
  
  // 2. 创建完整的出库单数据，覆盖所有状态
  const currentTime = new Date().toLocaleString()
  const baseTime = new Date()
  
  const outboundOrders = [
    // 草稿状态
    {
      id: 2001,
      order_no: 'OUT20241201001',
      customer_name: '测试客户A',
      warehouse_id: 1,
      outbound_type: 'sale',
      priority: 'high',
      status: 'draft',
      expected_date: new Date(baseTime.getTime() + 24 * 60 * 60 * 1000).toLocaleString(),
      shipping_fee: 15.00,
      delivery_address: '北京市朝阳区测试地址123号',
      remark: '草稿状态测试单',
      products: [{
        product_id: 1,
        product_code: 'P001',
        isku: 'SKU001',
        product_name: '测试商品A',
        unit: '个',
        available_stock: 95,
        quantity: 5,
        unit_price: 50.00,
        amount: 250.00,
        attributes: [{ name: '颜色', value: '红色' }]
      }],
      total_amount: 250.00,
      created_by: '系统管理员',
      created_at: currentTime,
      updated_at: currentTime
    },
    
    // 预发货状态
    {
      id: 2002,
      order_no: 'OUT20241201002',
      customer_name: '测试客户B',
      warehouse_id: 1,
      outbound_type: 'sale',
      priority: 'medium',
      status: 'pre_delivery',
      expected_date: new Date(baseTime.getTime() + 48 * 60 * 60 * 1000).toLocaleString(),
      shipping_fee: 20.00,
      delivery_address: '上海市浦东新区测试地址456号',
      remark: '预发货状态测试单',
      confirmed_at: currentTime,
      products: [{
        product_id: 2,
        product_code: 'P002',
        isku: 'SKU002',
        product_name: '测试商品B',
        unit: '件',
        available_stock: 75,
        quantity: 3,
        unit_price: 30.00,
        amount: 90.00,
        attributes: [{ name: '颜色', value: '蓝色' }]
      }],
      total_amount: 90.00,
      created_by: '系统管理员',
      created_at: currentTime,
      updated_at: currentTime
    },
    
    // 拣货中状态 - 关键修复点
    {
      id: 2003,
      order_no: 'OUT20241201003',
      customer_name: '测试客户C',
      warehouse_id: 1,
      outbound_type: 'transfer',
      priority: 'low',
      status: 'picking',
      expected_date: new Date(baseTime.getTime() + 72 * 60 * 60 * 1000).toLocaleString(),
      shipping_fee: 12.00,
      delivery_address: '广州市天河区测试地址789号',
      remark: '拣货中状态测试单',
      confirmed_at: new Date(baseTime.getTime() - 60 * 60 * 1000).toLocaleString(),
      picking_start_time: currentTime,
      picker_staff: [1, 2], // 重要：确保有拣货人员
      picking_strategy: 'zone',
      estimated_picking_time: 1.5,
      picking_priority: 'medium',
      picking_remark: '按库区拣货',
      products: [{
        product_id: 3,
        product_code: 'P003',
        isku: 'SKU003',
        product_name: '测试商品C',
        unit: '盒',
        available_stock: 55,
        quantity: 4,
        unit_price: 25.00,
        amount: 100.00,
        attributes: [{ name: '规格', value: '500ml' }],
        picking_quantity: 4, // 计划拣货数量
        actual_picked_quantity: 2, // 实际拣货数量
        picking_remark: '拣货中'
      }],
      total_amount: 100.00,
      created_by: '系统管理员',
      created_at: new Date(baseTime.getTime() - 2 * 60 * 60 * 1000).toLocaleString(),
      updated_at: currentTime
    },
    
    // 打包中状态
    {
      id: 2004,
      order_no: 'OUT20241201004',
      customer_name: '测试客户D',
      warehouse_id: 1,
      outbound_type: 'sale',
      priority: 'medium',
      status: 'packing',
      expected_date: new Date(baseTime.getTime() + 96 * 60 * 60 * 1000).toLocaleString(),
      shipping_fee: 25.00,
      delivery_address: '深圳市南山区测试地址101号',
      remark: '打包中状态测试单',
      confirmed_at: new Date(baseTime.getTime() - 3 * 60 * 60 * 1000).toLocaleString(),
      picking_start_time: new Date(baseTime.getTime() - 2 * 60 * 60 * 1000).toLocaleString(),
      picking_completed_time: new Date(baseTime.getTime() - 1 * 60 * 60 * 1000).toLocaleString(),
      picker_staff: [3],
      products: [{
        product_id: 1,
        product_code: 'P001',
        isku: 'SKU001',
        product_name: '测试商品A',
        unit: '个',
        available_stock: 95,
        quantity: 8,
        unit_price: 50.00,
        amount: 400.00,
        attributes: [{ name: '颜色', value: '红色' }],
        actual_picked_quantity: 8,
        packed_quantity: 5, // 部分打包
        package_spec: 'single',
        packing_remark: '打包中'
      }],
      total_amount: 400.00,
      created_by: '系统管理员',
      created_at: new Date(baseTime.getTime() - 4 * 60 * 60 * 1000).toLocaleString(),
      updated_at: currentTime
    },
    
    // 待发货状态
    {
      id: 2005,
      order_no: 'OUT20241201005',
      customer_name: '测试客户E',
      warehouse_id: 1,
      outbound_type: 'sale',
      priority: 'high',
      status: 'shipping',
      expected_date: new Date(baseTime.getTime() + 120 * 60 * 60 * 1000).toLocaleString(),
      shipping_fee: 30.00,
      delivery_address: '杭州市西湖区测试地址202号',
      remark: '待发货状态测试单',
      confirmed_at: new Date(baseTime.getTime() - 6 * 60 * 60 * 1000).toLocaleString(),
      picking_start_time: new Date(baseTime.getTime() - 5 * 60 * 60 * 1000).toLocaleString(),
      picking_completed_time: new Date(baseTime.getTime() - 4 * 60 * 60 * 1000).toLocaleString(),
      packing_completed_time: new Date(baseTime.getTime() - 2 * 60 * 60 * 1000).toLocaleString(),
      package_type: 'standard_box',
      package_count: 1,
      total_weight: 2.5,
      package_fee: 5.00,
      products: [{
        product_id: 2,
        product_code: 'P002',
        isku: 'SKU002',
        product_name: '测试商品B',
        unit: '件',
        available_stock: 75,
        quantity: 6,
        unit_price: 30.00,
        amount: 180.00,
        attributes: [{ name: '颜色', value: '蓝色' }],
        actual_picked_quantity: 6,
        packed_quantity: 6,
        package_spec: 'batch'
      }],
      total_amount: 180.00,
      created_by: '系统管理员',
      created_at: new Date(baseTime.getTime() - 8 * 60 * 60 * 1000).toLocaleString(),
      updated_at: currentTime
    },
    
    // 已完成状态
    {
      id: 2006,
      order_no: 'OUT20241201006',
      customer_name: '测试客户F',
      warehouse_id: 1,
      outbound_type: 'sale',
      priority: 'low',
      status: 'completed',
      expected_date: new Date(baseTime.getTime() - 24 * 60 * 60 * 1000).toLocaleString(),
      shipping_fee: 18.00,
      delivery_address: '成都市高新区测试地址303号',
      remark: '已完成状态测试单',
      confirmed_at: new Date(baseTime.getTime() - 48 * 60 * 60 * 1000).toLocaleString(),
      picking_start_time: new Date(baseTime.getTime() - 47 * 60 * 60 * 1000).toLocaleString(),
      picking_completed_time: new Date(baseTime.getTime() - 46 * 60 * 60 * 1000).toLocaleString(),
      packing_completed_time: new Date(baseTime.getTime() - 44 * 60 * 60 * 1000).toLocaleString(),
      shipping_completed_time: new Date(baseTime.getTime() - 24 * 60 * 60 * 1000).toLocaleString(),
      logistics_company_code: 'SF',
      logistics_company: '顺丰速运',
      tracking_number: 'SF1234567890',
      products: [{
        product_id: 3,
        product_code: 'P003',
        isku: 'SKU003',
        product_name: '测试商品C',
        unit: '盒',
        available_stock: 55,
        quantity: 3,
        unit_price: 25.00,
        amount: 75.00,
        attributes: [{ name: '规格', value: '500ml' }],
        actual_picked_quantity: 3,
        packed_quantity: 3
      }],
      total_amount: 75.00,
      created_by: '系统管理员',
      created_at: new Date(baseTime.getTime() - 50 * 60 * 60 * 1000).toLocaleString(),
      updated_at: new Date(baseTime.getTime() - 24 * 60 * 60 * 1000).toLocaleString()
    }
  ]
  
  localStorage.setItem('outbound_orders', JSON.stringify(outboundOrders))
  localStorage.setItem('wms_stock_movements', JSON.stringify([]))
  
  console.log('✅ 完整出库流程修复完成！')
  console.log('📊 数据统计:')
  console.log('   - 草稿: 1个')
  console.log('   - 预发货: 1个')
  console.log('   - 拣货中: 1个 ⭐ (关键修复)')
  console.log('   - 打包中: 1个')
  console.log('   - 待发货: 1个')
  console.log('   - 已完成: 1个')
  console.log('')
  console.log('🎯 现在每个标签页都应该有数据显示！')
  console.log('🔄 请刷新页面查看效果')
  
  return outboundOrders.length
}

// 验证数据完整性的函数
function verifyOutboundData() {
  const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
  const statusCount = {
    draft: 0,
    pre_delivery: 0,
    picking: 0,
    packing: 0,
    shipping: 0,
    completed: 0,
    cancelled: 0
  }
  
  orders.forEach(order => {
    if (statusCount.hasOwnProperty(order.status)) {
      statusCount[order.status]++
    }
  })
  
  console.log('📋 数据验证结果:')
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}个`)
  })
  
  // 重点检查拣货中的订单
  const pickingOrders = orders.filter(o => o.status === 'picking')
  console.log('🔍 拣货中订单详情:')
  pickingOrders.forEach(order => {
    console.log(`   订单号: ${order.order_no}`)
    console.log(`   拣货人员: ${order.picker_staff ? order.picker_staff.join(',') : '无'}`)
    console.log(`   拣货策略: ${order.picking_strategy || '无'}`)
    console.log(`   商品数: ${order.products ? order.products.length : 0}`)
  })
  
  return statusCount
}

// 快速创建更多拣货任务的函数
function addMorePickingTasks() {
  const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
  const currentTime = new Date().toLocaleString()
  
  const newPickingOrders = [
    {
      id: Date.now() + 1,
      order_no: 'OUT20241201101',
      customer_name: '拣货测试客户G',
      warehouse_id: 1,
      outbound_type: 'sale',
      priority: 'high',
      status: 'picking',
      confirmed_at: currentTime,
      picking_start_time: currentTime,
      picker_staff: [2, 3],
      picking_strategy: 'batch',
      estimated_picking_time: 2.0,
      products: [{
        product_id: 1,
        product_code: 'P001',
        isku: 'SKU001',
        product_name: '测试商品A',
        unit: '个',
        quantity: 10,
        unit_price: 50.00,
        amount: 500.00,
        actual_picked_quantity: 6
      }],
      total_amount: 500.00,
      created_at: currentTime
    },
    {
      id: Date.now() + 2,
      order_no: 'OUT20241201102',
      customer_name: '拣货测试客户H',
      warehouse_id: 1,
      outbound_type: 'transfer',
      priority: 'medium',
      status: 'picking',
      confirmed_at: currentTime,
      picking_start_time: currentTime,
      picker_staff: [1],
      picking_strategy: 'wave',
      estimated_picking_time: 1.0,
      products: [{
        product_id: 2,
        product_code: 'P002',
        isku: 'SKU002',
        product_name: '测试商品B',
        unit: '件',
        quantity: 5,
        unit_price: 30.00,
        amount: 150.00,
        actual_picked_quantity: 0
      }],
      total_amount: 150.00,
      created_at: currentTime
    }
  ]
  
  orders.push(...newPickingOrders)
  localStorage.setItem('outbound_orders', JSON.stringify(orders))
  
  console.log(`✅ 新增 ${newPickingOrders.length} 个拣货任务`)
  return newPickingOrders.length
}

// 导出到全局作用域
window.fixCompleteOutboundFlow = fixCompleteOutboundFlow
window.verifyOutboundData = verifyOutboundData
window.addMorePickingTasks = addMorePickingTasks

console.log('🛠️ 完整出库流程修复脚本已加载')
console.log('🚀 运行 fixCompleteOutboundFlow() 修复所有问题')
console.log('🔍 运行 verifyOutboundData() 验证数据')
console.log('➕ 运行 addMorePickingTasks() 添加更多拣货任务')