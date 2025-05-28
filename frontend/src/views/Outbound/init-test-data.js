// 简化的出库测试数据初始化脚本
// 在浏览器控制台中运行: initOutboundTestData()

function initOutboundTestData() {
  // 确保基础数据存在
  const warehouses = [
    { id: 1, name: '主仓库', code: 'WH001', status: '启用' },
    { id: 2, name: '分仓库', code: 'WH002', status: '启用' }
  ]
  localStorage.setItem('wms_warehouses', JSON.stringify(warehouses))
  
  const products = [
    { id: 1, code: 'P001', isku: 'SKU001', name: '测试商品A', unit: '个', price: 50.00 },
    { id: 2, code: 'P002', isku: 'SKU002', name: '测试商品B', unit: '件', price: 30.00 },
    { id: 3, code: 'P003', isku: 'SKU003', name: '测试商品C', unit: '盒', price: 25.00 }
  ]
  localStorage.setItem('wms_products', JSON.stringify(products))
  
  const inventory = [
    { id: 1, product_id: 1, product_code: 'P001', warehouse_id: 1, current_stock: 100, available_stock: 95 },
    { id: 2, product_id: 2, product_code: 'P002', warehouse_id: 1, current_stock: 80, available_stock: 75 },
    { id: 3, product_id: 3, product_code: 'P003', warehouse_id: 1, current_stock: 60, available_stock: 55 }
  ]
  localStorage.setItem('inventory_stock', JSON.stringify(inventory))
  
  // 创建出库单测试数据
  const currentTime = new Date().toLocaleString()
  const outboundOrders = [
    {
      id: 1001,
      order_no: 'OUT20241201001',
      customer_name: '测试客户A',
      warehouse_id: 1,
      outbound_type: 'sale',
      priority: 'high',
      status: 'draft',
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
        amount: 250.00
      }],
      total_amount: 250.00,
      created_by: '系统管理员',
      created_at: currentTime,
      updated_at: currentTime
    },
    {
      id: 1002,
      order_no: 'OUT20241201002',
      customer_name: '测试客户B',
      warehouse_id: 1,
      outbound_type: 'sale',
      priority: 'medium',
      status: 'pre_delivery',
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
        amount: 90.00
      }],
      total_amount: 90.00,
      created_by: '系统管理员',
      created_at: currentTime,
      updated_at: currentTime
    },
    {
      id: 1003,
      order_no: 'OUT20241201003',
      customer_name: '测试客户C',
      warehouse_id: 1,
      outbound_type: 'sale',
      priority: 'low',
      status: 'picking',
      shipping_fee: 12.00,
      delivery_address: '广州市天河区测试地址789号',
      remark: '拣货中状态测试单',
      confirmed_at: currentTime,
      picking_start_time: currentTime,
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
        actual_picked_quantity: 2
      }],
      total_amount: 100.00,
      created_by: '系统管理员',
      created_at: currentTime,
      updated_at: currentTime
    }
  ]
  
  localStorage.setItem('outbound_orders', JSON.stringify(outboundOrders))
  localStorage.setItem('wms_stock_movements', JSON.stringify([]))
  
  console.log('✅ 出库测试数据初始化完成！')
  console.log('📊 数据统计:')
  console.log('   - 仓库: 2个')
  console.log('   - 商品: 3个')
  console.log('   - 库存: 3条')
  console.log('   - 出库单: 3个')
  console.log('     * 草稿: 1个')
  console.log('     * 预发货: 1个')
  console.log('     * 拣货中: 1个')
  console.log('🔄 请刷新页面查看效果')
  
  return true
}

// 导出到全局作用域
window.initOutboundTestData = initOutboundTestData

console.log('📋 出库测试数据初始化脚本已加载')
console.log('🚀 运行 initOutboundTestData() 来创建测试数据')