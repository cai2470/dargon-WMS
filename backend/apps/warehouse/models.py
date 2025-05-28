"""
仓库管理模型
"""
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Warehouse(models.Model):
    """仓库模型"""
    
    STATUS_CHOICES = [
        ('active', '正常'),
        ('inactive', '停用'),
        ('maintenance', '维护中'),
    ]
    
    code = models.CharField('仓库编码', max_length=20, unique=True)
    name = models.CharField('仓库名称', max_length=100)
    description = models.TextField('仓库描述', null=True, blank=True)
    address = models.TextField('仓库地址', null=True, blank=True)
    contact_person = models.CharField('联系人', max_length=50, null=True, blank=True)
    contact_phone = models.CharField('联系电话', max_length=20, null=True, blank=True)
    
    # 仓库规格
    total_area = models.DecimalField('总面积(㎡)', max_digits=10, decimal_places=2, null=True, blank=True)
    usable_area = models.DecimalField('可用面积(㎡)', max_digits=10, decimal_places=2, null=True, blank=True)
    height = models.DecimalField('仓库高度(m)', max_digits=6, decimal_places=2, null=True, blank=True)
    
    # 状态信息
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='active')
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='仓库管理员')
    
    # 时间戳
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'warehouse_warehouse'
        verbose_name = '仓库'
        verbose_name_plural = '仓库'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Zone(models.Model):
    """库区模型"""
    
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, verbose_name='所属仓库')
    code = models.CharField('库区编码', max_length=20)
    name = models.CharField('库区名称', max_length=50)
    description = models.TextField('库区描述', null=True, blank=True)
    
    # 库区类型
    ZONE_TYPE_CHOICES = [
        ('storage', '存储区'),
        ('picking', '拣货区'),
        ('shipping', '发货区'),
        ('receiving', '收货区'),
        ('return', '退货区'),
        ('quarantine', '隔离区'),
    ]
    zone_type = models.CharField('库区类型', max_length=20, choices=ZONE_TYPE_CHOICES)
    
    # 库区规格
    length = models.DecimalField('长度(m)', max_digits=8, decimal_places=2, null=True, blank=True)
    width = models.DecimalField('宽度(m)', max_digits=8, decimal_places=2, null=True, blank=True)
    height = models.DecimalField('高度(m)', max_digits=6, decimal_places=2, null=True, blank=True)
    
    is_active = models.BooleanField('是否启用', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'warehouse_zone'
        verbose_name = '库区'
        verbose_name_plural = '库区'
        unique_together = ['warehouse', 'code']
        ordering = ['warehouse', 'code']
    
    def __str__(self):
        return f"{self.warehouse.code}-{self.code} {self.name}"


class Location(models.Model):
    """库位模型"""
    
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, verbose_name='所属库区')
    code = models.CharField('库位编码', max_length=20)
    name = models.CharField('库位名称', max_length=50, null=True, blank=True)
    
    # 库位坐标
    row = models.CharField('行号', max_length=10, null=True, blank=True)
    column = models.CharField('列号', max_length=10, null=True, blank=True)
    level = models.CharField('层号', max_length=10, null=True, blank=True)
    
    # 库位规格
    length = models.DecimalField('长度(m)', max_digits=6, decimal_places=2, null=True, blank=True)
    width = models.DecimalField('宽度(m)', max_digits=6, decimal_places=2, null=True, blank=True)
    height = models.DecimalField('高度(m)', max_digits=6, decimal_places=2, null=True, blank=True)
    max_weight = models.DecimalField('最大承重(kg)', max_digits=10, decimal_places=2, null=True, blank=True)
    
    # 库位状态
    STATUS_CHOICES = [
        ('empty', '空闲'),
        ('occupied', '占用'),
        ('reserved', '预留'),
        ('locked', '锁定'),
        ('damaged', '损坏'),
    ]
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='empty')
    
    # 库位属性
    is_pickable = models.BooleanField('是否可拣货', default=True)
    is_storable = models.BooleanField('是否可存储', default=True)
    temperature_controlled = models.BooleanField('是否温控', default=False)
    
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'warehouse_location'
        verbose_name = '库位'
        verbose_name_plural = '库位'
        unique_together = ['zone', 'code']
        ordering = ['zone', 'row', 'column', 'level']
    
    def __str__(self):
        return f"{self.zone.warehouse.code}-{self.zone.code}-{self.code}"
    
    @property
    def full_code(self):
        """完整库位编码"""
        return f"{self.zone.warehouse.code}-{self.zone.code}-{self.code}"


class WarehouseEquipment(models.Model):
    """仓库设备模型"""
    
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, verbose_name='所属仓库')
    name = models.CharField('设备名称', max_length=100)
    code = models.CharField('设备编码', max_length=50)
    
    EQUIPMENT_TYPE_CHOICES = [
        ('forklift', '叉车'),
        ('conveyor', '传送带'),
        ('scanner', '扫码器'),
        ('printer', '打印机'),
        ('scale', '电子秤'),
        ('camera', '监控摄像头'),
        ('sensor', '传感器'),
        ('other', '其他'),
    ]
    equipment_type = models.CharField('设备类型', max_length=20, choices=EQUIPMENT_TYPE_CHOICES)
    
    brand = models.CharField('品牌', max_length=50, null=True, blank=True)
    model = models.CharField('型号', max_length=50, null=True, blank=True)
    serial_number = models.CharField('序列号', max_length=100, null=True, blank=True)
    
    # 设备状态
    STATUS_CHOICES = [
        ('normal', '正常'),
        ('maintenance', '维护中'),
        ('fault', '故障'),
        ('retired', '报废'),
    ]
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='normal')
    
    purchase_date = models.DateField('采购日期', null=True, blank=True)
    warranty_date = models.DateField('保修期至', null=True, blank=True)
    location = models.CharField('设备位置', max_length=100, null=True, blank=True)
    
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'warehouse_equipment'
        verbose_name = '仓库设备'
        verbose_name_plural = '仓库设备'
        unique_together = ['warehouse', 'code']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.warehouse.code} - {self.name}"


class WarehouseOperationLog(models.Model):
    """仓库操作日志模型"""
    
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, verbose_name='仓库')
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='库位')
    operator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='操作人')
    
    OPERATION_TYPE_CHOICES = [
        ('inbound', '入库'),
        ('outbound', '出库'),
        ('move', '移库'),
        ('adjust', '调整'),
        ('freeze', '冻结'),
        ('unfreeze', '解冻'),
        ('count', '盘点'),
    ]
    operation_type = models.CharField('操作类型', max_length=20, choices=OPERATION_TYPE_CHOICES)
    
    description = models.TextField('操作描述')
    operation_time = models.DateTimeField('操作时间', auto_now_add=True)
    
    # 关联信息
    reference_no = models.CharField('关联单号', max_length=50, null=True, blank=True)
    
    class Meta:
        db_table = 'warehouse_operation_log'
        verbose_name = '仓库操作日志'
        verbose_name_plural = '仓库操作日志'
        ordering = ['-operation_time']