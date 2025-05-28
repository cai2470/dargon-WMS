// 库存扣减测试脚本
// 用于测试出库完成后库存是否正确减少

function testInventoryDeduction() {
  console.log('🧪 开始测试库存扣减功能...')
  
  // 1. 查看当前库存状态
  const inventory = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
  const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
  const movements = JSON.parse(localStorage.getItem('wms_stock_movements') || '[]')
  
  console.log('📊 当前库存状态:')
  inventory.forEach(inv => {
    console.log(`  ${inv.product_code} (仓库${inv.warehouse_id}): 当前库存=${inv.current_stock}, 可用库存=${inv.available_stock}`)
  })
  
  // 2. 查看已完成的出库单
  const completedOrders = orders.filter(o => o.status === 'completed')
  console.log(`📦 已完成出库单: ${completedOrders.length}个`)
  
  // 3. 查看库存变动记录
  const outboundMovements = movements.filter(m => m.movement_type === 'outbound')
  console.log(`📝 出库变动记录: ${outboundMovements.length}条`)
  
  return {
    inventory: inventory.length,
    completedOrders: completedOrders.length,
    outboundMovements: outboundMovements.length
  }
}

// 模拟出库完成并测试库存扣减
function simulateOutboundCompletion() {
  console.log('🚚 模拟出库完成流程...')
  
  const orders = JSON.parse(localStorage.getItem('outbound_orders') || '[]')
  const shippingOrders = orders.filter(o => o.status === 'shipping')
  
  if (shippingOrders.length === 0) {
    console.log('❌ 没有待发货的订单可以测试')
    return false
  }
  
  const testOrder = shippingOrders[0]
  console.log(`📋 测试订单: ${testOrder.order_no}`)
  
  // 记录出库前库存
  const inventoryBefore = JSON.parse(localStorage.getItem('inventory_stock') || '[]')
  console.log('📊 出库前库存:')
  testOrder.products.forEach(product => {
    const inv = inventoryBefore.find(i => \n      (i.product_code === product.product_code || i.product_id === product.product_id) &&\n      i.warehouse_id == testOrder.warehouse_id\n    )\n    if (inv) {\n      console.log(`  ${product.product_code}: 当前库存=${inv.current_stock}, 可用库存=${inv.available_stock}`)\n    }\n  })\n  \n  // 模拟确认发货\n  const orderIndex = orders.findIndex(o => o.id === testOrder.id)\n  if (orderIndex !== -1) {\n    orders[orderIndex] = {\n      ...orders[orderIndex],\n      status: 'completed',\n      shipping_completed_time: new Date().toLocaleString(),\n      logistics_company_code: 'SF',\n      logistics_company: '顺丰速运',\n      tracking_number: 'TEST' + Date.now(),\n      updated_at: new Date().toLocaleString()\n    }\n    \n    // 执行库存扣减\n    updateInventoryForOutbound(orders[orderIndex])\n    \n    localStorage.setItem('outbound_orders', JSON.stringify(orders))\n    \n    console.log('✅ 出库完成，库存已更新')\n    \n    // 检查库存变化\n    const inventoryAfter = JSON.parse(localStorage.getItem('inventory_stock') || '[]')\n    console.log('📊 出库后库存:')\n    testOrder.products.forEach(product => {\n      const invBefore = inventoryBefore.find(i => \n        (i.product_code === product.product_code || i.product_id === product.product_id) &&\n        i.warehouse_id == testOrder.warehouse_id\n      )\n      const invAfter = inventoryAfter.find(i => \n        (i.product_code === product.product_code || i.product_id === product.product_id) &&\n        i.warehouse_id == testOrder.warehouse_id\n      )\n      \n      if (invBefore && invAfter) {\n        const quantityShipped = product.packed_quantity || product.actual_picked_quantity || product.quantity || 0\n        const expectedCurrent = invBefore.current_stock - quantityShipped\n        const expectedAvailable = invBefore.available_stock - quantityShipped\n        \n        console.log(`  ${product.product_code}:`)\n        console.log(`    出库数量: ${quantityShipped}`)\n        console.log(`    当前库存: ${invBefore.current_stock} → ${invAfter.current_stock} (预期: ${expectedCurrent})`)\n        console.log(`    可用库存: ${invBefore.available_stock} → ${invAfter.available_stock} (预期: ${expectedAvailable})`)\n        \n        if (invAfter.current_stock === expectedCurrent && invAfter.available_stock === expectedAvailable) {\n          console.log('    ✅ 库存扣减正确')\n        } else {\n          console.log('    ❌ 库存扣减错误')\n        }\n      }\n    })\n    \n    return true\n  }\n  \n  return false\n}\n\n// 库存扣减函数（与ShippingGoods组件中的函数相同）\nfunction updateInventoryForOutbound(order) {\n  try {\n    let inventoryData = JSON.parse(localStorage.getItem('inventory_stock') || '[]')\n    \n    order.products.forEach(outboundProduct => {\n      const inventoryIndex = inventoryData.findIndex(inv => \n        (inv.product_code === outboundProduct.product_code || inv.product_id === outboundProduct.product_id) &&\n        inv.warehouse_id == order.warehouse_id\n      )\n      \n      if (inventoryIndex !== -1) {\n        const currentStock = inventoryData[inventoryIndex].current_stock || 0\n        const availableStock = inventoryData[inventoryIndex].available_stock || 0\n        const shippedQuantity = outboundProduct.packed_quantity || outboundProduct.actual_picked_quantity || outboundProduct.quantity || 0\n        \n        inventoryData[inventoryIndex].current_stock = Math.max(0, currentStock - shippedQuantity)\n        inventoryData[inventoryIndex].available_stock = Math.max(0, availableStock - shippedQuantity)\n        inventoryData[inventoryIndex].last_updated = new Date().toISOString()\n      }\n    })\n    \n    localStorage.setItem('inventory_stock', JSON.stringify(inventoryData))\n    \n    // 创建库存变动记录\n    createOutboundMovementRecords(order)\n    \n  } catch (error) {\n    console.error('库存扣减失败:', error)\n  }\n}\n\n// 创建出库库存变动记录\nfunction createOutboundMovementRecords(order) {\n  try {\n    const movements = JSON.parse(localStorage.getItem('wms_stock_movements') || '[]')\n    \n    order.products.forEach(product => {\n      const shippedQuantity = product.packed_quantity || product.actual_picked_quantity || product.quantity || 0\n      \n      movements.push({\n        id: Date.now() + Math.random(),\n        product_id: product.product_id,\n        product_code: product.product_code,\n        product_name: product.product_name,\n        movement_type: 'outbound',\n        quantity: -shippedQuantity,\n        warehouse_id: order.warehouse_id,\n        order_no: order.order_no,\n        remark: `出库发货：${order.shipping_remark || '测试出库'}`,\n        created_at: new Date().toISOString(),\n        created_by: '系统管理员'\n      })\n    })\n    \n    localStorage.setItem('wms_stock_movements', JSON.stringify(movements))\n  } catch (error) {\n    console.error('创建库存变动记录失败:', error)\n  }\n}\n\n// 重置库存为初始状态\nfunction resetInventoryToInitial() {\n  console.log('🔄 重置库存到初始状态...')\n  \n  const initialInventory = [\n    { id: 1, product_id: 1, product_code: 'P001', warehouse_id: 1, current_stock: 100, available_stock: 90 },\n    { id: 2, product_id: 2, product_code: 'P002', warehouse_id: 1, current_stock: 80, available_stock: 70 },\n    { id: 3, product_id: 3, product_code: 'P003', warehouse_id: 1, current_stock: 60, available_stock: 50 },\n    { id: 4, product_id: 4, product_code: 'P004', warehouse_id: 1, current_stock: 40, available_stock: 35 }\n  ]\n  \n  localStorage.setItem('inventory_stock', JSON.stringify(initialInventory))\n  localStorage.setItem('wms_stock_movements', JSON.stringify([]))\n  \n  console.log('✅ 库存已重置到初始状态')\n  console.log('📊 当前库存:')\n  initialInventory.forEach(inv => {\n    console.log(`  ${inv.product_code}: 当前库存=${inv.current_stock}, 可用库存=${inv.available_stock}`)\n  })\n}\n\n// 查看库存变动历史\nfunction viewStockMovements() {\n  const movements = JSON.parse(localStorage.getItem('wms_stock_movements') || '[]')\n  const outboundMovements = movements.filter(m => m.movement_type === 'outbound')\n  \n  console.log('📝 出库变动记录:')\n  outboundMovements.forEach(movement => {\n    console.log(`  ${movement.created_at}: ${movement.product_code} 出库 ${Math.abs(movement.quantity)} (订单: ${movement.order_no})`)\n  })\n  \n  return outboundMovements\n}\n\n// 导出到全局\nwindow.testInventoryDeduction = testInventoryDeduction\nwindow.simulateOutboundCompletion = simulateOutboundCompletion\nwindow.resetInventoryToInitial = resetInventoryToInitial\nwindow.viewStockMovements = viewStockMovements\n\nconsole.log('📦 库存扣减测试脚本已加载')\nconsole.log('🧪 运行 testInventoryDeduction() 查看当前状态')\nconsole.log('🚚 运行 simulateOutboundCompletion() 模拟出库完成')\nconsole.log('🔄 运行 resetInventoryToInitial() 重置库存')\nconsole.log('📝 运行 viewStockMovements() 查看变动记录')