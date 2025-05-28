// 一键修复出库流程脚本 - 解决所有数据显示问题
// 在浏览器控制台运行: fixAllOutboundIssues()

function fixAllOutboundIssues() {
  console.log('🚀 开始一键修复所有出库流程问题...')
  
  // 清除所有相关数据，确保干净的环境
  console.log('🧹 清理现有数据...')
  localStorage.removeItem('outbound_orders')
  localStorage.removeItem('wms_warehouses')
  localStorage.removeItem('wms_products')
  localStorage.removeItem('inventory_stock')
  localStorage.removeItem('wms_stock_movements')
  
  // 创建完整的基础数据
  console.log('📋 创建基础数据...')
  
  // 仓库数据
  const warehouses = [
    { id: 1, name: '主仓库', code: 'WH001', status: '启用', location: '北京市朝阳区' },
    { id: 2, name: '分仓库', code: 'WH002', status: '启用', location: '上海市浦东新区' }
  ]
  localStorage.setItem('wms_warehouses', JSON.stringify(warehouses))
  
  // 商品数据
  const products = [
    { 
      id: 1, code: 'P001', isku: 'SKU001', name: '测试商品A', unit: '个', price: 50.00, 
      image: '', attributes: [{ name: '颜色', value: '红色' }, { name: '尺寸', value: 'M' }] 
    },
    { 
      id: 2, code: 'P002', isku: 'SKU002', name: '测试商品B', unit: '件', price: 30.00, 
      image: '', attributes: [{ name: '颜色', value: '蓝色' }, { name: '尺寸', value: 'L' }] 
    },
    { 
      id: 3, code: 'P003', isku: 'SKU003', name: '测试商品C', unit: '盒', price: 25.00, 
      image: '', attributes: [{ name: '规格', value: '500ml' }] 
    }
  ]
  localStorage.setItem('wms_products', JSON.stringify(products))
  
  // 库存数据
  const inventory = [
    { id: 1, product_id: 1, product_code: 'P001', warehouse_id: 1, current_stock: 100, available_stock: 95, reserved_stock: 5, location: 'A001' },
    { id: 2, product_id: 2, product_code: 'P002', warehouse_id: 1, current_stock: 80, available_stock: 75, reserved_stock: 5, location: 'A002' },
    { id: 3, product_id: 3, product_code: 'P003', warehouse_id: 1, current_stock: 60, available_stock: 55, reserved_stock: 5, location: 'B001' },
    { id: 4, product_id: 1, product_code: 'P001', warehouse_id: 2, current_stock: 50, available_stock: 45, reserved_stock: 5, location: 'C001' }
  ]
  localStorage.setItem('inventory_stock', JSON.stringify(inventory))
  
  // 创建完整的出库单数据 - 每个状态都有订单
  console.log('📦 创建出库单数据...')
  const currentTime = new Date().toLocaleString()
  const baseTime = new Date()
  
  const outboundOrders = [
    // 1. 草稿状态
    {
      id: 3001,
      order_no: 'OUT20241201001',
      customer_name: '草稿测试客户',
      warehouse_id: 1,
      outbound_type: 'sale',
      priority: 'high',
      status: 'draft',
      expected_date: new Date(baseTime.getTime() + 24 * 60 * 60 * 1000).toLocaleString(),
      shipping_fee: 15.00,
      delivery_address: '北京市朝阳区草稿测试地址',
      remark: '草稿状态测试单 - 可编辑删除',
      products: [{
        product_id: 1, product_code: 'P001', isku: 'SKU001', product_name: '测试商品A',
        unit: '个', available_stock: 95, quantity: 5, unit_price: 50.00, amount: 250.00,
        attributes: [{ name: '颜色', value: '红色' }]
      }],
      total_amount: 250.00,
      created_by: '系统管理员',
      created_at: currentTime,
      updated_at: currentTime
    },
    
    // 2. 预发货状态
    {
      id: 3002,
      order_no: 'OUT20241201002',
      customer_name: '预发货测试客户',
      warehouse_id: 1,
      outbound_type: 'sale',
      priority: 'medium',
      status: 'pre_delivery',
      expected_date: new Date(baseTime.getTime() + 48 * 60 * 60 * 1000).toLocaleString(),
      shipping_fee: 20.00,
      delivery_address: '上海市浦东新区预发货测试地址',
      remark: '预发货状态测试单 - 可开始拣货',
      confirmed_at: new Date(baseTime.getTime() - 30 * 60 * 1000).toLocaleString(),
      products: [{
        product_id: 2, product_code: 'P002', isku: 'SKU002', product_name: '测试商品B',
        unit: '件', available_stock: 75, quantity: 3, unit_price: 30.00, amount: 90.00,
        attributes: [{ name: '颜色', value: '蓝色' }]
      }],
      total_amount: 90.00,
      created_by: '系统管理员',
      created_at: new Date(baseTime.getTime() - 60 * 60 * 1000).toLocaleString(),
      updated_at: currentTime
    },
    
    // 3. 拣货中状态 - 重点修复
    {
      id: 3003,
      order_no: 'OUT20241201003',
      customer_name: '拣货测试客户',
      warehouse_id: 1,
      outbound_type: 'transfer',
      priority: 'low',
      status: 'picking',
      expected_date: new Date(baseTime.getTime() + 72 * 60 * 60 * 1000).toLocaleString(),
      shipping_fee: 12.00,
      delivery_address: '广州市天河区拣货测试地址',
      remark: '拣货中状态测试单 - 正在拣货',
      confirmed_at: new Date(baseTime.getTime() - 90 * 60 * 1000).toLocaleString(),
      picking_start_time: new Date(baseTime.getTime() - 30 * 60 * 1000).toLocaleString(),
      picker_staff: [1, 2], // 重要：拣货人员ID
      picking_strategy: 'zone',
      estimated_picking_time: 1.5,
      picking_priority: 'medium',
      picking_remark: '按库区拣货策略',
      products: [{
        product_id: 3, product_code: 'P003', isku: 'SKU003', product_name: '测试商品C',
        unit: '盒', available_stock: 55, quantity: 4, unit_price: 25.00, amount: 100.00,
        attributes: [{ name: '规格', value: '500ml' }],
        picking_quantity: 4, // 计划拣货数量
        actual_picked_quantity: 2, // 实际已拣数量
        actual_picking_remark: '正在拣货中'
      }],
      total_amount: 100.00,
      created_by: '系统管理员',
      created_at: new Date(baseTime.getTime() - 2 * 60 * 60 * 1000).toLocaleString(),
      updated_at: currentTime
    },
    
    // 4. 打包中状态
    {
      id: 3004,
      order_no: 'OUT20241201004',
      customer_name: '打包测试客户',
      warehouse_id: 1,
      outbound_type: 'sale',
      priority: 'medium',
      status: 'packing',
      expected_date: new Date(baseTime.getTime() + 96 * 60 * 60 * 1000).toLocaleString(),
      shipping_fee: 25.00,
      delivery_address: '深圳市南山区打包测试地址',
      remark: '打包中状态测试单 - 正在打包',
      confirmed_at: new Date(baseTime.getTime() - 4 * 60 * 60 * 1000).toLocaleString(),
      picking_start_time: new Date(baseTime.getTime() - 3 * 60 * 60 * 1000).toLocaleString(),
      picking_completed_time: new Date(baseTime.getTime() - 2 * 60 * 60 * 1000).toLocaleString(),
      picker_staff: [3],
      packer_staff: 2, // 打包人员
      package_type: 'standard_box',
      package_count: 1,
      total_weight: 1.5,
      package_fee: 3.00,
      products: [{
        product_id: 1, product_code: 'P001', isku: 'SKU001', product_name: '测试商品A',
        unit: '个', available_stock: 95, quantity: 6, unit_price: 50.00, amount: 300.00,
        attributes: [{ name: '颜色', value: '红色' }],
        actual_picked_quantity: 6,
        packed_quantity: 4, // 部分打包
        package_spec: 'single',
        packing_remark: '正在打包中'
      }],
      total_amount: 300.00,
      created_by: '系统管理员',
      created_at: new Date(baseTime.getTime() - 5 * 60 * 60 * 1000).toLocaleString(),
      updated_at: currentTime
    },
    
    // 5. 待发货状态
    {
      id: 3005,
      order_no: 'OUT20241201005',
      customer_name: '发货测试客户',
      warehouse_id: 1,
      outbound_type: 'sale',
      priority: 'high',
      status: 'shipping',
      expected_date: new Date(baseTime.getTime() + 120 * 60 * 60 * 1000).toLocaleString(),
      shipping_fee: 30.00,
      delivery_address: '杭州市西湖区发货测试地址',
      remark: '待发货状态测试单 - 可安排发货',
      confirmed_at: new Date(baseTime.getTime() - 8 * 60 * 60 * 1000).toLocaleString(),
      picking_start_time: new Date(baseTime.getTime() - 7 * 60 * 60 * 1000).toLocaleString(),
      picking_completed_time: new Date(baseTime.getTime() - 6 * 60 * 60 * 1000).toLocaleString(),
      packing_completed_time: new Date(baseTime.getTime() - 4 * 60 * 60 * 1000).toLocaleString(),
      package_type: 'thick_box',
      package_count: 1,
      total_weight: 2.0,
      package_fee: 5.00,
      products: [{
        product_id: 2, product_code: 'P002', isku: 'SKU002', product_name: '测试商品B',
        unit: '件', available_stock: 75, quantity: 5, unit_price: 30.00, amount: 150.00,
        attributes: [{ name: '颜色', value: '蓝色' }],
        actual_picked_quantity: 5,
        packed_quantity: 5,
        package_spec: 'batch'
      }],
      total_amount: 150.00,
      created_by: '系统管理员',
      created_at: new Date(baseTime.getTime() - 10 * 60 * 60 * 1000).toLocaleString(),
      updated_at: currentTime
    },
    
    // 6. 已完成状态
    {
      id: 3006,
      order_no: 'OUT20241201006',
      customer_name: '完成测试客户',
      warehouse_id: 1,
      outbound_type: 'sale',
      priority: 'low',
      status: 'completed',
      expected_date: new Date(baseTime.getTime() - 24 * 60 * 60 * 1000).toLocaleString(),
      shipping_fee: 18.00,
      delivery_address: '成都市高新区完成测试地址',
      remark: '已完成状态测试单 - 流程结束',
      confirmed_at: new Date(baseTime.getTime() - 50 * 60 * 60 * 1000).toLocaleString(),
      picking_start_time: new Date(baseTime.getTime() - 49 * 60 * 60 * 1000).toLocaleString(),
      picking_completed_time: new Date(baseTime.getTime() - 48 * 60 * 60 * 1000).toLocaleString(),
      packing_completed_time: new Date(baseTime.getTime() - 46 * 60 * 60 * 1000).toLocaleString(),
      shipping_completed_time: new Date(baseTime.getTime() - 24 * 60 * 60 * 1000).toLocaleString(),
      logistics_company_code: 'SF',
      logistics_company: '顺丰速运',
      tracking_number: 'SF1234567890',
      products: [{
        product_id: 3, product_code: 'P003', isku: 'SKU003', product_name: '测试商品C',
        unit: '盒', available_stock: 55, quantity: 2, unit_price: 25.00, amount: 50.00,
        attributes: [{ name: '规格', value: '500ml' }],
        actual_picked_quantity: 2,
        packed_quantity: 2
      }],
      total_amount: 50.00,
      created_by: '系统管理员',
      created_at: new Date(baseTime.getTime() - 52 * 60 * 60 * 1000).toLocaleString(),
      updated_at: new Date(baseTime.getTime() - 24 * 60 * 60 * 1000).toLocaleString()
    }
  ]
  
  localStorage.setItem('outbound_orders', JSON.stringify(outboundOrders))
  localStorage.setItem('wms_stock_movements', JSON.stringify([]))
  
  console.log('✅ 一键修复完成！')
  console.log('')
  console.log('📊 修复结果统计:')
  console.log('   ✓ 草稿: 1个')
  console.log('   ✓ 预发货: 1个') 
  console.log('   ✓ 拣货中: 1个 ⭐')
  console.log('   ✓ 打包中: 1个')
  console.log('   ✓ 待发货: 1个')
  console.log('   ✓ 已完成: 1个')
  console.log('')
  console.log('🎯 现在所有标签页都应该有数据了！')
  console.log('🔄 请刷新页面查看效果')
  console.log('')
  console.log('📝 测试流程建议:')
  console.log('   1. 草稿单点击"确认" → 进入预发货')
  console.log('   2. 预发货单点击"开始拣货" → 进入拣货')
  console.log('   3. 拣货单点击"完成拣货" → 进入打包')
  console.log('   4. 打包单点击"完成打包" → 进入发货')
  console.log('   5. 发货单点击"确认发货" → 进入完成')
  
  return {
    warehouses: warehouses.length,
    products: products.length,
    inventory: inventory.length,
    orders: outboundOrders.length,
    success: true
  }
}

// 验证修复结果
function verifyFix() {
  const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
  const warehouses = JSON.parse(localStorage.getItem('wms_warehouses') || '[]')
  const products = JSON.parse(localStorage.getItem('wms_products') || '[]')
  const inventory = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
  
  const statusCount = {}
  orders.forEach(order => {
    statusCount[order.status] = (statusCount[order.status] || 0) + 1
  })
  
  console.log('🔍 修复验证结果:')
  console.log('   仓库数据:', warehouses.length, '个')
  console.log('   商品数据:', products.length, '个')
  console.log('   库存数据:', inventory.length, '条')
  console.log('   出库单数据:', orders.length, '个')
  console.log('   状态分布:', statusCount)
  
  // 特别检查拣货订单
  const pickingOrders = orders.filter(o => o.status === 'picking')
  console.log('   拣货订单详情:')
  pickingOrders.forEach(order => {
    console.log(`     ${order.order_no}: 拣货员${order.picker_staff}, 策略${order.picking_strategy}`)
  })
  
  return {
    warehouses: warehouses.length,
    products: products.length,
    inventory: inventory.length,
    orders: orders.length,
    statusCount
  }
}

// 清理所有数据
function clearAllData() {
  localStorage.removeItem('outbound_orders')
  localStorage.removeItem('wms_warehouses') 
  localStorage.removeItem('wms_products')
  localStorage.removeItem('inventory_stock')
  localStorage.removeItem('wms_stock_movements')
  console.log('🧹 所有出库相关数据已清除')
}

// 导出到全局
window.fixAllOutboundIssues = fixAllOutboundIssues
window.verifyFix = verifyFix
window.clearAllData = clearAllData

console.log('🛠️ 一键修复脚本已加载')
console.log('🚀 运行 fixAllOutboundIssues() 一键解决所有问题')
console.log('🔍 运行 verifyFix() 验证修复结果')
console.log('🧹 运行 clearAllData() 清除所有数据')