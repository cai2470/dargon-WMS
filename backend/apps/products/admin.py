"""
商品管理后台配置
"""
from django.contrib import admin
from .models import Category, Supplier, Brand, Product, Barcode, ProductSupplier, ProductAttribute


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """商品分类后台管理"""
    
    list_display = ('code', 'name', 'parent', 'sort_order', 'is_active', 'created_at')
    list_filter = ('parent', 'is_active', 'created_at')
    search_fields = ('code', 'name', 'description')
    ordering = ('sort_order', 'code')
    
    fieldsets = (
        ('基本信息', {
            'fields': ('code', 'name', 'parent', 'description')
        }),
        ('设置', {
            'fields': ('sort_order', 'is_active')
        }),
    )


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    """供应商后台管理"""
    
    list_display = ('code', 'name', 'short_name', 'contact_person', 'contact_phone', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('code', 'name', 'short_name', 'contact_person')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('基本信息', {
            'fields': ('code', 'name', 'short_name', 'status')
        }),
        ('联系信息', {
            'fields': ('contact_person', 'contact_phone', 'contact_email', 'address')
        }),
        ('财务信息', {
            'fields': ('tax_number', 'bank_account', 'payment_terms'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    """品牌后台管理"""
    
    list_display = ('code', 'name', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('code', 'name', 'description')
    ordering = ('code',)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """商品后台管理"""
    
    list_display = ('code', 'name', 'category', 'brand', 'status', 'safety_stock', 'created_at')
    list_filter = ('category', 'brand', 'supplier', 'status', 'storage_type', 'created_at')
    search_fields = ('code', 'name', 'short_name', 'specification', 'model')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('基本信息', {
            'fields': ('code', 'name', 'short_name', 'specification', 'model', 'isku', 'description')
        }),
        ('分类信息', {
            'fields': ('category', 'brand', 'supplier')
        }),
        ('物理属性', {
            'fields': ('length', 'width', 'height', 'weight', 'volume'),
            'classes': ('collapse',)
        }),
        ('包装信息', {
            'fields': ('package_unit', 'package_quantity'),
            'classes': ('collapse',)
        }),
        ('存储要求', {
            'fields': ('storage_type', 'temperature_min', 'temperature_max', 'humidity_min', 'humidity_max'),
            'classes': ('collapse',)
        }),
        ('库存设置', {
            'fields': ('safety_stock', 'min_stock', 'max_stock')
        }),
        ('价格信息', {
            'fields': ('cost_price', 'sale_price'),
            'classes': ('collapse',)
        }),
        ('管理信息', {
            'fields': ('shelf_life_days', 'is_batch_managed', 'is_serial_managed', 'status')
        }),
        ('图片信息', {
            'fields': ('image', 'images'),
            'classes': ('collapse',)
        }),
        ('其他', {
            'fields': ('remark',),
            'classes': ('collapse',)
        }),
    )


class BarcodeInline(admin.TabularInline):
    """条形码内联编辑"""
    model = Barcode
    extra = 1
    fields = ('barcode', 'barcode_type', 'is_primary', 'description')


@admin.register(Barcode)
class BarcodeAdmin(admin.ModelAdmin):
    """条形码后台管理"""
    
    list_display = ('barcode', 'product', 'barcode_type', 'is_primary', 'created_at')
    list_filter = ('barcode_type', 'is_primary', 'created_at')
    search_fields = ('barcode', 'product__code', 'product__name')
    ordering = ('-is_primary', '-created_at')


@admin.register(ProductSupplier)
class ProductSupplierAdmin(admin.ModelAdmin):
    """商品供应商关联后台管理"""
    
    list_display = ('product', 'supplier', 'purchase_price', 'min_order_quantity', 'is_preferred', 'is_active')
    list_filter = ('supplier', 'is_preferred', 'is_active', 'created_at')
    search_fields = ('product__code', 'product__name', 'supplier__name', 'supplier_product_code')
    ordering = ('-is_preferred', '-created_at')


@admin.register(ProductAttribute)
class ProductAttributeAdmin(admin.ModelAdmin):
    """商品属性后台管理"""
    
    list_display = ('product', 'attribute_name', 'attribute_value', 'sort_order', 'is_visible', 'created_at')
    list_filter = ('attribute_name', 'is_visible', 'created_at')
    search_fields = ('product__code', 'product__name', 'attribute_name', 'attribute_value')
    ordering = ('product', 'sort_order', 'attribute_name')


class ProductAttributeInline(admin.TabularInline):
    """商品属性内联编辑"""
    model = ProductAttribute
    extra = 1
    fields = ('attribute_name', 'attribute_value', 'sort_order', 'is_visible')


# 在Product管理页面中添加条形码和属性内联编辑
ProductAdmin.inlines = [BarcodeInline, ProductAttributeInline]