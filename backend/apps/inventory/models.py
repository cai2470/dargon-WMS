"""
库存管理模型
"""
from django.db import models
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()


class Stock(models.Model):
    """库存主表"""
    
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, verbose_name='商品')
    warehouse = models.ForeignKey('warehouse.Warehouse', on_delete=models.CASCADE, verbose_name='仓库')
    location = models.ForeignKey('warehouse.Location', on_delete=models.CASCADE, verbose_name='库位')
    
    # 库存数量
    quantity = models.IntegerField('库存数量', default=0)
    available_quantity = models.IntegerField('可用数量', default=0)  # 扣除预留、冻结等
    reserved_quantity = models.IntegerField('预留数量', default=0)
    frozen_quantity = models.IntegerField('冻结数量', default=0)
    
    # 批次信息
    batch_number = models.CharField('批次号', max_length=50, null=True, blank=True)
    production_date = models.DateField('生产日期', null=True, blank=True)
    expiry_date = models.DateField('过期日期', null=True, blank=True)
    
    # 成本信息
    unit_cost = models.DecimalField('单位成本', max_digits=10, decimal_places=2, default=Decimal('0.00'))
    total_cost = models.DecimalField('总成本', max_digits=12, decimal_places=2, default=Decimal('0.00'))
    
    # 状态信息
    STATUS_CHOICES = [
        ('normal', '正常'),
        ('frozen', '冻结'),
        ('damaged', '损坏'),
        ('expired', '过期'),
        ('quarantine', '隔离'),
    ]
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='normal')
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    last_movement_at = models.DateTimeField('最后变动时间', null=True, blank=True)
    
    class Meta:
        db_table = 'inventory_stock'
        verbose_name = '库存'
        verbose_name_plural = '库存'
        unique_together = ['product', 'warehouse', 'location', 'batch_number']
        indexes = [
            models.Index(fields=['product', 'warehouse']),
            models.Index(fields=['location']),
            models.Index(fields=['batch_number']),
            models.Index(fields=['expiry_date']),
        ]
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.product.code} - {self.location.full_code} - {self.quantity}"
    
    def save(self, *args, **kwargs):
        # 自动计算总成本
        self.total_cost = self.quantity * self.unit_cost
        # 自动计算可用数量
        self.available_quantity = max(0, self.quantity - self.reserved_quantity - self.frozen_quantity)
        super().save(*args, **kwargs)


class StockMovement(models.Model):
    """库存变动记录"""
    
    # 关联信息
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, verbose_name='商品')
    warehouse = models.ForeignKey('warehouse.Warehouse', on_delete=models.CASCADE, verbose_name='仓库')
    location = models.ForeignKey('warehouse.Location', on_delete=models.CASCADE, verbose_name='库位')
    
    # 变动类型
    MOVEMENT_TYPE_CHOICES = [
        ('inbound', '入库'),
        ('outbound', '出库'),
        ('transfer', '调拨'),
        ('adjust', '调整'),
        ('freeze', '冻结'),
        ('unfreeze', '解冻'),
        ('damage', '损耗'),
        ('return', '退货'),
        ('count', '盘点'),
    ]
    movement_type = models.CharField('变动类型', max_length=20, choices=MOVEMENT_TYPE_CHOICES)
    
    # 数量信息
    quantity = models.IntegerField('变动数量')  # 正数为增加，负数为减少
    before_quantity = models.IntegerField('变动前数量', default=0)
    after_quantity = models.IntegerField('变动后数量', default=0)
    
    # 批次信息
    batch_number = models.CharField('批次号', max_length=50, null=True, blank=True)
    
    # 成本信息
    unit_cost = models.DecimalField('单位成本', max_digits=10, decimal_places=2, null=True, blank=True)
    total_cost = models.DecimalField('总成本', max_digits=12, decimal_places=2, null=True, blank=True)
    
    # 关联单据
    reference_type = models.CharField('关联单据类型', max_length=20, null=True, blank=True)  # inbound_order, outbound_order等
    reference_id = models.CharField('关联单据ID', max_length=50, null=True, blank=True)
    reference_number = models.CharField('关联单据号', max_length=100, null=True, blank=True)
    
    # 操作信息
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='操作人')
    operation_time = models.DateTimeField('操作时间', auto_now_add=True)
    remark = models.TextField('备注', null=True, blank=True)
    
    class Meta:
        db_table = 'inventory_stock_movement'
        verbose_name = '库存变动'
        verbose_name_plural = '库存变动'
        indexes = [
            models.Index(fields=['product', 'warehouse']),
            models.Index(fields=['movement_type']),
            models.Index(fields=['operation_time']),
            models.Index(fields=['reference_type', 'reference_id']),
        ]
        ordering = ['-operation_time']
    
    def __str__(self):
        return f"{self.product.code} - {self.movement_type} - {self.quantity}"


class StockAlert(models.Model):
    """库存预警"""
    
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, verbose_name='商品')
    warehouse = models.ForeignKey('warehouse.Warehouse', on_delete=models.CASCADE, verbose_name='仓库')
    
    # 预警类型
    ALERT_TYPE_CHOICES = [
        ('low_stock', '库存不足'),
        ('overstock', '库存过量'),
        ('near_expiry', '临近过期'),
        ('expired', '已过期'),
        ('zero_stock', '零库存'),
    ]
    alert_type = models.CharField('预警类型', max_length=20, choices=ALERT_TYPE_CHOICES)
    
    # 预警级别
    LEVEL_CHOICES = [
        ('low', '低'),
        ('medium', '中'),
        ('high', '高'),
        ('critical', '紧急'),
    ]
    level = models.CharField('预警级别', max_length=10, choices=LEVEL_CHOICES)
    
    # 库存信息
    current_stock = models.IntegerField('当前库存')
    threshold_value = models.IntegerField('阈值', null=True, blank=True)
    
    # 状态信息
    is_active = models.BooleanField('是否有效', default=True)
    is_handled = models.BooleanField('是否已处理', default=False)
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='处理人')
    handled_at = models.DateTimeField('处理时间', null=True, blank=True)
    
    # 预警信息
    message = models.TextField('预警消息')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'inventory_stock_alert'
        verbose_name = '库存预警'
        verbose_name_plural = '库存预警'
        indexes = [
            models.Index(fields=['product', 'warehouse']),
            models.Index(fields=['alert_type']),
            models.Index(fields=['level']),
            models.Index(fields=['is_active', 'is_handled']),
        ]
        ordering = ['-level', '-created_at']
    
    def __str__(self):
        return f"{self.product.code} - {self.get_alert_type_display()} - {self.get_level_display()}"


class StockReservation(models.Model):
    """库存预留"""
    
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, verbose_name='库存')
    
    # 预留信息
    reserved_quantity = models.IntegerField('预留数量')
    reserved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='预留人')
    reserved_at = models.DateTimeField('预留时间', auto_now_add=True)
    
    # 关联单据
    reference_type = models.CharField('关联类型', max_length=20)  # outbound_order, transfer_order等
    reference_id = models.CharField('关联ID', max_length=50)
    reference_number = models.CharField('关联单号', max_length=100, null=True, blank=True)
    
    # 状态信息
    STATUS_CHOICES = [
        ('active', '生效中'),
        ('used', '已使用'),
        ('expired', '已过期'),
        ('cancelled', '已取消'),
    ]
    status = models.CharField('状态', max_length=10, choices=STATUS_CHOICES, default='active')
    
    # 时间信息
    expire_at = models.DateTimeField('过期时间', null=True, blank=True)
    used_at = models.DateTimeField('使用时间', null=True, blank=True)
    cancelled_at = models.DateTimeField('取消时间', null=True, blank=True)
    
    remark = models.TextField('备注', null=True, blank=True)
    
    class Meta:
        db_table = 'inventory_stock_reservation'
        verbose_name = '库存预留'
        verbose_name_plural = '库存预留'
        indexes = [
            models.Index(fields=['stock']),
            models.Index(fields=['reference_type', 'reference_id']),
            models.Index(fields=['status']),
            models.Index(fields=['expire_at']),
        ]
        ordering = ['-reserved_at']
    
    def __str__(self):
        return f"{self.stock.product.code} - 预留 {self.reserved_quantity}"


class InventoryCount(models.Model):
    """库存盘点"""
    
    # 盘点基本信息
    count_number = models.CharField('盘点单号', max_length=50, unique=True)
    warehouse = models.ForeignKey('warehouse.Warehouse', on_delete=models.CASCADE, verbose_name='盘点仓库')
    
    # 盘点范围
    COUNT_SCOPE_CHOICES = [
        ('all', '全盘'),
        ('location', '按库位'),
        ('category', '按分类'),
        ('product', '按商品'),
    ]
    count_scope = models.CharField('盘点范围', max_length=20, choices=COUNT_SCOPE_CHOICES)
    scope_filter = models.JSONField('范围过滤条件', null=True, blank=True)
    
    # 盘点状态
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('counting', '盘点中'),
        ('completed', '已完成'),
        ('cancelled', '已取消'),
    ]
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # 时间信息
    planned_start_at = models.DateTimeField('计划开始时间')
    planned_end_at = models.DateTimeField('计划结束时间')
    actual_start_at = models.DateTimeField('实际开始时间', null=True, blank=True)
    actual_end_at = models.DateTimeField('实际结束时间', null=True, blank=True)
    
    # 负责人信息
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_counts', verbose_name='创建人')
    count_leader = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='led_counts', verbose_name='盘点负责人')
    
    # 统计信息
    total_items = models.IntegerField('盘点条目数', default=0)
    completed_items = models.IntegerField('已盘点条目数', default=0)
    variance_items = models.IntegerField('差异条目数', default=0)
    
    description = models.TextField('盘点说明', null=True, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'inventory_count'
        verbose_name = '库存盘点'
        verbose_name_plural = '库存盘点'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.count_number} - {self.warehouse.name}"


class InventoryCountDetail(models.Model):
    """库存盘点明细"""
    
    count = models.ForeignKey(InventoryCount, on_delete=models.CASCADE, verbose_name='盘点单')
    stock = models.ForeignKey(Stock, on_delete=models.CASCADE, verbose_name='库存')
    
    # 盘点数据
    book_quantity = models.IntegerField('账面数量')  # 系统数量
    actual_quantity = models.IntegerField('实盘数量', null=True, blank=True)
    variance_quantity = models.IntegerField('差异数量', default=0)  # 实盘 - 账面
    
    # 批次信息
    batch_number = models.CharField('批次号', max_length=50, null=True, blank=True)
    
    # 盘点状态
    STATUS_CHOICES = [
        ('pending', '待盘点'),
        ('counted', '已盘点'),
        ('adjusted', '已调整'),
    ]
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # 操作信息
    counted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='盘点人')
    counted_at = models.DateTimeField('盘点时间', null=True, blank=True)
    
    remark = models.TextField('备注', null=True, blank=True)
    
    class Meta:
        db_table = 'inventory_count_detail'
        verbose_name = '库存盘点明细'
        verbose_name_plural = '库存盘点明细'
        unique_together = ['count', 'stock']
        ordering = ['count', 'stock__product__code']
    
    def save(self, *args, **kwargs):
        # 自动计算差异数量
        if self.actual_quantity is not None:
            self.variance_quantity = self.actual_quantity - self.book_quantity
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.count.count_number} - {self.stock.product.code}"