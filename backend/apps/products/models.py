"""
商品管理模型
"""
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Category(models.Model):
    """商品分类模型"""
    
    name = models.CharField('分类名称', max_length=50)
    code = models.CharField('分类编码', max_length=20, unique=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, verbose_name='父分类')
    description = models.TextField('分类描述', null=True, blank=True)
    sort_order = models.IntegerField('排序', default=0)
    is_active = models.BooleanField('是否启用', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'products_category'
        verbose_name = '商品分类'
        verbose_name_plural = '商品分类'
        ordering = ['sort_order', 'code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Supplier(models.Model):
    """供应商模型"""
    
    code = models.CharField('供应商编码', max_length=20, unique=True)
    name = models.CharField('供应商名称', max_length=100)
    short_name = models.CharField('简称', max_length=50, null=True, blank=True)
    
    # 联系信息
    contact_person = models.CharField('联系人', max_length=50, null=True, blank=True)
    contact_phone = models.CharField('联系电话', max_length=20, null=True, blank=True)
    contact_email = models.EmailField('联系邮箱', null=True, blank=True)
    address = models.TextField('地址', null=True, blank=True)
    
    # 财务信息
    tax_number = models.CharField('税号', max_length=50, null=True, blank=True)
    bank_account = models.CharField('银行账户', max_length=50, null=True, blank=True)
    payment_terms = models.CharField('付款条件', max_length=100, null=True, blank=True)
    
    # 状态信息
    STATUS_CHOICES = [
        ('active', '正常'),
        ('inactive', '停用'),
        ('blacklist', '黑名单'),
    ]
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='active')
    
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'products_supplier'
        verbose_name = '供应商'
        verbose_name_plural = '供应商'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class Brand(models.Model):
    """品牌模型"""
    
    name = models.CharField('品牌名称', max_length=50, unique=True)
    code = models.CharField('品牌编码', max_length=20, unique=True)
    logo = models.ImageField('品牌Logo', upload_to='brands/', null=True, blank=True)
    description = models.TextField('品牌描述', null=True, blank=True)
    is_active = models.BooleanField('是否启用', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    
    class Meta:
        db_table = 'products_brand'
        verbose_name = '品牌'
        verbose_name_plural = '品牌'
        ordering = ['code']
    
    def __str__(self):
        return self.name


class Product(models.Model):
    """商品模型"""
    
    # 基本信息
    code = models.CharField('商品编码', max_length=50, unique=True)
    name = models.CharField('商品名称', max_length=200)
    short_name = models.CharField('简称', max_length=100, null=True, blank=True)
    specification = models.CharField('规格', max_length=100, null=True, blank=True)
    model = models.CharField('型号', max_length=100, null=True, blank=True)
    
    # iSKU信息
    isku = models.CharField('iSKU', max_length=100, null=True, blank=True, help_text='内部SKU编码')
    product_attributes = models.JSONField('商品属性', default=dict, blank=True, help_text='存储商品的各种属性，如颜色、尺寸等')
    
    # 分类信息
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, verbose_name='商品分类')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='品牌')
    supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='默认供应商')
    
    # 物理属性
    length = models.DecimalField('长度(cm)', max_digits=8, decimal_places=2, null=True, blank=True)
    width = models.DecimalField('宽度(cm)', max_digits=8, decimal_places=2, null=True, blank=True)
    height = models.DecimalField('高度(cm)', max_digits=8, decimal_places=2, null=True, blank=True)
    weight = models.DecimalField('重量(kg)', max_digits=8, decimal_places=3, null=True, blank=True)
    volume = models.DecimalField('体积(cm³)', max_digits=12, decimal_places=2, null=True, blank=True)
    
    # 包装信息
    package_unit = models.CharField('包装单位', max_length=20, default='件')
    package_quantity = models.IntegerField('包装数量', default=1)
    
    # 存储要求
    STORAGE_TYPE_CHOICES = [
        ('normal', '常温'),
        ('cold', '冷藏'),
        ('frozen', '冷冻'),
        ('dry', '干燥'),
        ('humid', '保湿'),
    ]
    storage_type = models.CharField('存储类型', max_length=20, choices=STORAGE_TYPE_CHOICES, default='normal')
    temperature_min = models.DecimalField('最低温度(℃)', max_digits=5, decimal_places=2, null=True, blank=True)
    temperature_max = models.DecimalField('最高温度(℃)', max_digits=5, decimal_places=2, null=True, blank=True)
    humidity_min = models.DecimalField('最低湿度(%)', max_digits=5, decimal_places=2, null=True, blank=True)
    humidity_max = models.DecimalField('最高湿度(%)', max_digits=5, decimal_places=2, null=True, blank=True)
    
    # 安全库存
    safety_stock = models.IntegerField('安全库存', default=0)
    min_stock = models.IntegerField('最低库存', default=0)
    max_stock = models.IntegerField('最高库存', default=0)
    
    # 价格信息
    cost_price = models.DecimalField('成本价', max_digits=10, decimal_places=2, null=True, blank=True)
    sale_price = models.DecimalField('销售价', max_digits=10, decimal_places=2, null=True, blank=True)
    
    # 有效期管理
    shelf_life_days = models.IntegerField('保质期(天)', null=True, blank=True)
    is_batch_managed = models.BooleanField('是否批次管理', default=False)
    is_serial_managed = models.BooleanField('是否序列号管理', default=False)
    
    # 状态信息
    STATUS_CHOICES = [
        ('active', '正常'),
        ('inactive', '停用'),
        ('discontinued', '停产'),
    ]
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='active')
    
    # 描述信息
    description = models.TextField('商品描述', null=True, blank=True)
    remark = models.TextField('备注', null=True, blank=True)
    
    # 图片
    image = models.ImageField('主图片', upload_to='products/', null=True, blank=True)
    images = models.JSONField('商品图片列表', default=list, blank=True, help_text='存储多张商品图片的URL列表')
    
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name='创建人')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    
    class Meta:
        db_table = 'products_product'
        verbose_name = '商品'
        verbose_name_plural = '商品'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class ProductAttribute(models.Model):
    """商品属性模型"""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='attributes', verbose_name='商品')
    attribute_name = models.CharField('属性名称', max_length=50)  # 如：颜色、尺寸、材质等
    attribute_value = models.CharField('属性值', max_length=100)  # 如：红色、XL、棉质等
    sort_order = models.IntegerField('排序', default=0)
    is_visible = models.BooleanField('是否显示', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    
    class Meta:
        db_table = 'products_product_attribute'
        verbose_name = '商品属性'
        verbose_name_plural = '商品属性'
        ordering = ['sort_order', 'attribute_name']
        unique_together = ['product', 'attribute_name']
    
    def __str__(self):
        return f"{self.product.code} - {self.attribute_name}: {self.attribute_value}"


class Barcode(models.Model):
    """条形码模型"""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='商品')
    barcode = models.CharField('条形码', max_length=50, unique=True)
    
    BARCODE_TYPE_CHOICES = [
        ('ean13', 'EAN-13'),
        ('ean8', 'EAN-8'),
        ('upc', 'UPC'),
        ('code128', 'Code 128'),
        ('code39', 'Code 39'),
        ('qr', 'QR码'),
        ('custom', '自定义'),
    ]
    barcode_type = models.CharField('条形码类型', max_length=20, choices=BARCODE_TYPE_CHOICES, default='ean13')
    
    is_primary = models.BooleanField('是否主条码', default=False)
    description = models.CharField('描述', max_length=100, null=True, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    
    class Meta:
        db_table = 'products_barcode'
        verbose_name = '商品条码'
        verbose_name_plural = '商品条码'
        ordering = ['-is_primary', '-created_at']
    
    def __str__(self):
        return f"{self.product.code} - {self.barcode}"


class ProductSupplier(models.Model):
    """商品供应商关联模型"""
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name='商品')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, verbose_name='供应商')
    supplier_product_code = models.CharField('供应商商品编码', max_length=50, null=True, blank=True)
    supplier_product_name = models.CharField('供应商商品名称', max_length=200, null=True, blank=True)
    
    # 价格信息
    purchase_price = models.DecimalField('采购价', max_digits=10, decimal_places=2, null=True, blank=True)
    min_order_quantity = models.IntegerField('最小订购量', default=1)
    delivery_days = models.IntegerField('交期(天)', null=True, blank=True)
    
    is_preferred = models.BooleanField('是否首选供应商', default=False)
    is_active = models.BooleanField('是否有效', default=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    
    class Meta:
        db_table = 'products_product_supplier'
        verbose_name = '商品供应商'
        verbose_name_plural = '商品供应商'
        unique_together = ['product', 'supplier']
        ordering = ['-is_preferred', '-created_at']