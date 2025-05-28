// API模块统一导出
// 用户API - 使用named export
export { userApi } from './user'

// 其他API模块 - 使用namespace export
export * as warehouseApi from './warehouse'
export * as productsApi from './products'
export * as inboundApi from './inbound'
export * as outboundApi from './outbound'
export * as inventoryApi from './inventory'
export * as reportsApi from './reports'
export * as roleApi from './role'
export * as permissionApi from './permission'
export * as systemApi from './system'

// 导出请求实例
export { default as request } from './request' 