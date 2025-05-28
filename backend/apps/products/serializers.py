"""
商品管理序列化器
"""
from rest_framework import serializers
from .models import Category, Supplier, Brand, Product, Barcode, ProductSupplier


class CategorySerializer(serializers.ModelSerializer):
    """商品分类序列化器"""
    
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    children_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = '__all__'
    
    def get_children_count(self, obj):
        """获取子分类数量"""
        return obj.category_set.filter(is_active=True).count()


class SupplierSerializer(serializers.ModelSerializer):
    """供应商序列化器"""
    
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Supplier
        fields = '__all__'
    
    def get_product_count(self, obj):
        """获取商品数量"""
        return obj.product_set.filter(status='active').count()


class BrandSerializer(serializers.ModelSerializer):
    """品牌序列化器"""
    
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Brand
        fields = '__all__'
    
    def get_product_count(self, obj):
        """获取商品数量"""
        return obj.product_set.filter(status='active').count()


class BarcodeSerializer(serializers.ModelSerializer):
    """条形码序列化器"""
    
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.code', read_only=True)
    
    class Meta:
        model = Barcode
        fields = '__all__'
    
    def validate_barcode(self, value):
        """验证条形码格式"""
        if not value:
            raise serializers.ValidationError('条形码不能为空')
        
        # Code128条形码基本验证
        if len(value) < 6:
            raise serializers.ValidationError('条形码长度不能少于6位')
        
        return value


class ProductSupplierSerializer(serializers.ModelSerializer):
    """商品供应商关联序列化器"""
    
    product_name = serializers.CharField(source='product.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    
    class Meta:
        model = ProductSupplier
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    """商品序列化器"""
    
    category_name = serializers.CharField(source='category.name', read_only=True)
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    # 关联数据
    barcodes = BarcodeSerializer(many=True, read_only=True, source='barcode_set')
    primary_barcode = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = '__all__'
    
    def get_primary_barcode(self, obj):
        """获取主条码"""
        primary_barcode = obj.barcode_set.filter(is_primary=True).first()
        return primary_barcode.barcode if primary_barcode else None
    
    def validate_code(self, value):
        """验证商品编码唯一性"""
        if self.instance and self.instance.code == value:
            return value
        
        if Product.objects.filter(code=value).exists():
            raise serializers.ValidationError('商品编码已存在')
        
        return value
    
    def create(self, validated_data):
        """创建商品"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        
        return super().create(validated_data)


class ProductSimpleSerializer(serializers.ModelSerializer):
    """商品简单序列化器"""
    
    primary_barcode = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = ['id', 'code', 'name', 'specification', 'category_name', 
                 'primary_barcode', 'safety_stock', 'status']
    
    def get_primary_barcode(self, obj):
        """获取主条码"""
        primary_barcode = obj.barcode_set.filter(is_primary=True).first()
        return primary_barcode.barcode if primary_barcode else None


class ProductWithStockSerializer(ProductSimpleSerializer):
    """带库存信息的商品序列化器"""
    
    current_stock = serializers.SerializerMethodField()
    available_stock = serializers.SerializerMethodField()
    
    class Meta(ProductSimpleSerializer.Meta):
        fields = ProductSimpleSerializer.Meta.fields + ['current_stock', 'available_stock']
    
    def get_current_stock(self, obj):
        """获取当前总库存"""
        # 这里需要在inventory应用完成后实现
        return 0
    
    def get_available_stock(self, obj):
        """获取可用库存"""
        # 这里需要在inventory应用完成后实现
        return 0