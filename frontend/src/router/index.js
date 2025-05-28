import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

// 配置NProgress
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
NProgress.configure({ showSpinner: false })

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue'),
    meta: { title: '登录', requireAuth: false }
  },
  {
    path: '/',
    component: () => import('@/components/Layout/index.vue'),
    redirect: '/dashboard',
    meta: { requireAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: { title: '工作台' }
      },
      // 仓库管理
      {
        path: 'warehouse/list',
        name: 'WarehouseList',
        component: () => import('@/views/Warehouse/List.vue'),
        meta: { title: '仓库列表' }
      },
      {
        path: 'warehouse/zones',
        name: 'WarehouseZones',
        component: () => import('@/views/Warehouse/Zones.vue'),
        meta: { title: '库区管理' }
      },
      {
        path: 'warehouse/locations',
        name: 'WarehouseLocations',
        component: () => import('@/views/Warehouse/Locations.vue'),
        meta: { title: '库位管理' }
      },
      // 商品管理
      {
        path: 'products/list',
        name: 'ProductList',
        component: () => import('@/views/Products/index.vue'),
        meta: { title: '商品列表' }
      },
      {
        path: 'products/categories',
        name: 'ProductCategories',
        component: () => import('@/views/Products/Categories.vue'),
        meta: { title: '商品分类' }
      },
      {
        path: 'products/suppliers',
        name: 'ProductSuppliers',
        component: () => import('@/views/Products/Suppliers.vue'),
        meta: { title: '供应商管理' }
      },
      {
        path: 'products/brands',
        name: 'ProductBrands',
        component: () => import('@/views/Products/Brands.vue'),
        meta: { title: '品牌管理' }
      },
      {
        path: 'products/customers',
        name: 'ProductCustomers',
        component: () => import('@/views/Products/Customers.vue'),
        meta: { title: '客户管理' }
      },
      // 库存管理
      {
        path: 'inventory/stock',
        name: 'InventoryStock',
        component: () => import('@/views/Inventory/Stock.vue'),
        meta: { title: '库存查询' }
      },
      {
        path: 'inventory/alerts',
        name: 'InventoryAlerts',
        component: () => import('@/views/Inventory/Alerts.vue'),
        meta: { title: '库存预警' }
      },
      {
        path: 'inventory/movements',
        name: 'InventoryMovements',
        component: () => import('@/views/Inventory/Movements.vue'),
        meta: { title: '库存变动' }
      },
      {
        path: 'inventory/count',
        name: 'InventoryCount',
        component: () => import('@/views/Inventory/Count.vue'),
        meta: { title: '库存盘点' }
      },
      // 质检管理
      {
        path: 'quality/inspection',
        name: 'QualityInspection',
        component: () => import('@/views/Quality/Inspection.vue'),
        meta: { title: '质检管理' }
      },
      // 入库管理
      {
        path: 'inbound/orders',
        name: 'InboundOrders',
        component: () => import('@/views/Inbound/Orders.vue'),
        meta: { title: '入库管理' }
      },
      {
        path: 'inbound/purchase',
        name: 'InboundPurchase',
        component: () => import('@/views/Inbound/Purchase.vue'),
        meta: { title: '采购入库' }
      },
      {
        path: 'inbound/returns',
        name: 'InboundReturns',
        component: () => import('@/views/Inbound/Returns.vue'),
        meta: { title: '退货入库' }
      },
      // 出库管理
      {
        path: 'outbound/orders',
        name: 'OutboundOrders',
        component: () => import('@/views/Outbound/Orders.vue'),
        meta: { title: '出库管理' }
      },
      {
        path: 'outbound/sales',
        name: 'OutboundSales',
        component: () => import('@/views/Outbound/Sales.vue'),
        meta: { title: '销售出库' }
      },
      {
        path: 'outbound/transfer',
        name: 'OutboundTransfer',
        component: () => import('@/views/Outbound/Transfer.vue'),
        meta: { title: '调拨出库' }
      },
      // 报表中心
      {
        path: 'reports/inventory',
        name: 'ReportsInventory',
        component: () => import('@/views/Reports/InventoryReport.vue'),
        meta: { title: '库存报表' }
      },
      {
        path: 'reports/inbound',
        name: 'ReportsInbound',
        component: () => import('@/views/Reports/InboundReport.vue'),
        meta: { title: '入库报表' }
      },
      {
        path: 'reports/outbound',
        name: 'ReportsOutbound',
        component: () => import('@/views/Reports/OutboundReport.vue'),
        meta: { title: '出库报表' }
      },
      {
        path: 'reports/analysis',
        name: 'ReportsAnalysis',
        component: () => import('@/views/Reports/DataAnalysis.vue'),
        meta: { title: '数据分析' }
      },
      // 系统管理
      {
        path: 'system/staff',
        name: 'SystemStaff',
        component: () => import('@/views/System/Staff.vue'),
        meta: { title: '员工管理' }
      },
      {
        path: 'system/users',
        name: 'SystemUsers',
        component: () => import('@/views/System/Users.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'system/roles',
        name: 'SystemRoles',
        component: () => import('@/views/System/Roles.vue'),
        meta: { title: '角色管理' }
      },
      {
        path: 'system/permissions',
        name: 'SystemPermissions',
        component: () => import('@/views/System/Permissions.vue'),
        meta: { title: '权限管理' }
      },
      {
        path: 'system/logs',
        name: 'SystemLogs',
        component: () => import('@/views/System/Logs.vue'),
        meta: { title: '系统日志' }
      },
      {
        path: 'system/settings',
        name: 'SystemSettings',
        component: () => import('@/views/System/Settings.vue'),
        meta: { title: '系统设置' }
      }
    ]
  },
  {
    path: '/mobile',
    component: () => import('@/components/MobileLayout/index.vue'),
    redirect: '/mobile/dashboard',
    meta: { requireAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'MobileDashboard',
        component: () => import('@/views/Dashboard/index.vue'),
        meta: { title: '移动工作台' }
      },
      {
        path: 'products',
        name: 'MobileProducts',
        component: () => import('@/views/Products/index.vue'),
        meta: { title: '商品管理' }
      },
      {
        path: 'inventory',
        name: 'MobileInventory',
        component: () => import('@/views/Inventory/Stock.vue'),
        meta: { title: '库存查询' }
      },
      {
        path: 'inbound',
        name: 'MobileInbound',
        component: () => import('@/views/Inbound/Orders.vue'),
        meta: { title: '入库管理' }
      },
      {
        path: 'outbound',
        name: 'MobileOutbound',
        component: () => import('@/views/Outbound/Orders.vue'),
        meta: { title: '出库管理' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/Dashboard/index.vue'), // 临时使用Dashboard作为404页面
    meta: { title: '页面不存在' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  NProgress.start()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 小神龙仓库管理系统`
  }
  
  // 不需要认证的页面
  if (to.meta.requireAuth === false) {
    next()
    return
  }
  
  // 需要认证的页面 - 暂时跳过认证，直接允许访问
  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router