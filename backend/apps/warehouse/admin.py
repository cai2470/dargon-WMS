"""
仓库管理后台配置
"""
from django.contrib import admin
from .models import Warehouse, Zone, Location, WarehouseEquipment, WarehouseOperationLog


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    """仓库后台管理"""
    
    list_display = ('code', 'name', 'status', 'manager', 'total_area', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('code', 'name', 'address')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('基本信息', {
            'fields': ('code', 'name', 'description', 'status', 'manager')
        }),
        ('联系信息', {
            'fields': ('address', 'contact_person', 'contact_phone')
        }),
        ('仓库规格', {
            'fields': ('total_area', 'usable_area', 'height'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    """库区后台管理"""
    
    list_display = ('warehouse', 'code', 'name', 'zone_type', 'is_active', 'created_at')
    list_filter = ('warehouse', 'zone_type', 'is_active', 'created_at')
    search_fields = ('code', 'name')
    ordering = ('warehouse', 'code')


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    """库位后台管理"""
    
    list_display = ('zone', 'code', 'name', 'row', 'column', 'level', 'status')
    list_filter = ('zone__warehouse', 'zone', 'status', 'is_pickable', 'is_storable')
    search_fields = ('code', 'name', 'row', 'column', 'level')
    ordering = ('zone', 'row', 'column', 'level')
    
    fieldsets = (
        ('基本信息', {
            'fields': ('zone', 'code', 'name', 'status')
        }),
        ('位置信息', {
            'fields': ('row', 'column', 'level')
        }),
        ('规格信息', {
            'fields': ('length', 'width', 'height', 'max_weight'),
            'classes': ('collapse',)
        }),
        ('属性信息', {
            'fields': ('is_pickable', 'is_storable', 'temperature_controlled'),
            'classes': ('collapse',)
        }),
    )


@admin.register(WarehouseEquipment)
class WarehouseEquipmentAdmin(admin.ModelAdmin):
    """仓库设备后台管理"""
    
    list_display = ('warehouse', 'name', 'code', 'equipment_type', 'status', 'created_at')
    list_filter = ('warehouse', 'equipment_type', 'status', 'created_at')
    search_fields = ('name', 'code', 'brand', 'model', 'serial_number')
    ordering = ('-created_at',)


@admin.register(WarehouseOperationLog)
class WarehouseOperationLogAdmin(admin.ModelAdmin):
    """仓库操作日志后台管理"""
    
    list_display = ('warehouse', 'location', 'operator', 'operation_type', 'operation_time')
    list_filter = ('warehouse', 'operation_type', 'operation_time')
    search_fields = ('description', 'reference_no')
    ordering = ('-operation_time',)
    readonly_fields = ('warehouse', 'location', 'operator', 'operation_type', 'description', 'operation_time', 'reference_no')