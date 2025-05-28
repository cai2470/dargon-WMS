import request from './request'

// 商品管理API
export const productAPI = {
  // 获取商品列表
  getProductList: (params) => {
    return request({
      url: '/products/products/',
      method: 'get',
      params
    })
  },

  // 获取商品详情
  getProductDetail: (id) => {
    return request({
      url: `/products/products/${id}/`,
      method: 'get'
    })
  },

  // 创建商品
  createProduct: (data) => {
    return request({
      url: '/products/products/',
      method: 'post',
      data
    })
  },

  // 更新商品
  updateProduct: (id, data) => {
    return request({
      url: `/products/products/${id}/`,
      method: 'put',
      data
    })
  },

  // 删除商品
  deleteProduct: (id) => {
    return request({
      url: `/products/products/${id}/`,
      method: 'delete'
    })
  }
}

// 分类管理API
export const categoryAPI = {
  // 获取分类列表
  getCategoryList: (params) => {
    return request({
      url: '/products/categories/',
      method: 'get',
      params
    })
  },

  // 创建分类
  createCategory: (data) => {
    return request({
      url: '/products/categories/',
      method: 'post',
      data
    })
  },

  // 更新分类
  updateCategory: (id, data) => {
    return request({
      url: `/products/categories/${id}/`,
      method: 'put',
      data
    })
  },

  // 删除分类
  deleteCategory: (id) => {
    return request({
      url: `/products/categories/${id}/`,
      method: 'delete'
    })
  }
}

// 供应商管理API
export const supplierAPI = {
  // 获取供应商列表
  getSupplierList: (params) => {
    return request({
      url: '/products/suppliers/',
      method: 'get',
      params
    })
  },

  // 获取供应商详情
  getSupplierDetail: (id) => {
    return request({
      url: `/products/suppliers/${id}/`,
      method: 'get'
    })
  },

  // 创建供应商
  createSupplier: (data) => {
    return request({
      url: '/products/suppliers/',
      method: 'post',
      data
    })
  },

  // 更新供应商
  updateSupplier: (id, data) => {
    return request({
      url: `/products/suppliers/${id}/`,
      method: 'put',
      data
    })
  },

  // 删除供应商
  deleteSupplier: (id) => {
    return request({
      url: `/products/suppliers/${id}/`,
      method: 'delete'
    })
  }
}

// 品牌管理API
export const brandAPI = {
  // 获取品牌列表
  getBrandList: (params) => {
    return request({
      url: '/products/brands/',
      method: 'get',
      params
    })
  },

  // 创建品牌
  createBrand: (data) => {
    return request({
      url: '/products/brands/',
      method: 'post',
      data
    })
  },

  // 更新品牌
  updateBrand: (id, data) => {
    return request({
      url: `/products/brands/${id}/`,
      method: 'put',
      data
    })
  },

  // 删除品牌
  deleteBrand: (id) => {
    return request({
      url: `/products/brands/${id}/`,
      method: 'delete'
    })
  }
} 