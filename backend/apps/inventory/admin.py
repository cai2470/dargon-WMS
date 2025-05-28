"""
库存管理后台配置
"""
from django.contrib import admin
from .models import Stock, StockMovement, StockAlert, StockReservation, InventoryCount, InventoryCountDetail


@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    """库存后台管理"""
    
    list_display = ('product', 'warehouse', 'location', 'quantity', 'available_quantity', 'status', 'batch_number', 'updated_at')
    list_filter = ('warehouse', 'status', 'updated_at')
    search_fields = ('product__code', 'product__name', 'location__code', 'batch_number')
    ordering = ('-updated_at',)
    
    fieldsets = (
        ('基本信息', {
            'fields': ('product', 'warehouse', 'location', 'status')
        }),
        ('数量信息', {
            'fields': ('quantity', 'available_quantity', 'reserved_quantity', 'frozen_quantity')
        }),
        ('批次信息', {
            'fields': ('batch_number', 'production_date', 'expiry_date'),
            'classes': ('collapse',)
        }),
        ('成本信息', {
            'fields': ('unit_cost', 'total_cost'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('available_quantity', 'total_cost', 'created_at', 'updated_at')


@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    """库存变动后台管理"""
    
    list_display = ('product', 'warehouse', 'location', 'movement_type', 'quantity', 'operator', 'operation_time')
    list_filter = ('movement_type', 'warehouse', 'operation_time')
    search_fields = ('product__code', 'product__name', 'reference_number')
    ordering = ('-operation_time',)
    
    readonly_fields = ('product', 'warehouse', 'location', 'movement_type', 'quantity', 'before_quantity', 
                      'after_quantity', 'operator', 'operation_time')


@admin.register(StockAlert)
class StockAlertAdmin(admin.ModelAdmin):
    """库存预警后台管理"""
    
    list_display = ('product', 'warehouse', 'alert_type', 'level', 'current_stock', 'is_active', 'is_handled', 'created_at')
    list_filter = ('alert_type', 'level', 'is_active', 'is_handled', 'warehouse', 'created_at')
    search_fields = ('product__code', 'product__name', 'message')
    ordering = ('-level', '-created_at')
    
    actions = ['mark_as_handled']
    
    def mark_as_handled(self, request, queryset):
        """批量标记为已处理"""
        updated = queryset.update(is_handled=True, handled_by=request.user)
        self.message_user(request, f'已处理 {updated} 条预警')
    mark_as_handled.short_description = '标记为已处理'


@admin.register(StockReservation)
class StockReservationAdmin(admin.ModelAdmin):
    """库存预留后台管理"""
    
    list_display = ('stock', 'reserved_quantity', 'status', 'reference_type', 'reference_number', 'reserved_at')
    list_filter = ('status', 'reference_type', 'reserved_at')
    search_fields = ('stock__product__code', 'reference_number')
    ordering = ('-reserved_at',)


@admin.register(InventoryCount)
class InventoryCountAdmin(admin.ModelAdmin):
    """库存盘点后台管理"""
    
    list_display = ('count_number', 'warehouse', 'count_scope', 'status', 'count_leader', 'planned_start_at', 'created_at')
    list_filter = ('warehouse', 'count_scope', 'status', 'created_at')
    search_fields = ('count_number', 'description')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('基本信息', {
            'fields': ('count_number', 'warehouse', 'count_scope', 'scope_filter', 'status')
        }),
        ('时间安排', {
            'fields': ('planned_start_at', 'planned_end_at', 'actual_start_at', 'actual_end_at')
        }),
        ('人员安排', {
            'fields': ('created_by', 'count_leader')
        }),
        ('统计信息', {
            'fields': ('total_items', 'completed_items', 'variance_items'),
            'classes': ('collapse',)
        }),
        ('其他', {
            'fields': ('description',),
            'classes': ('collapse',)
        }),
    )


@admin.register(InventoryCountDetail)
class InventoryCountDetailAdmin(admin.ModelAdmin):
    """库存盘点明细后台管理"""
    
    list_display = ('count', 'stock', 'book_quantity', 'actual_quantity', 'variance_quantity', 'status', 'counted_by')
    list_filter = ('count', 'status', 'counted_at')
    search_fields = ('stock__product__code', 'stock__product__name')
    ordering = ('count', 'stock__product__code')
    
    readonly_fields = ('variance_quantity',)