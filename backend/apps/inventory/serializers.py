"""
库存管理序列化器
"""
from rest_framework import serializers
from .models import Stock, StockMovement, StockAlert, StockReservation, InventoryCount, InventoryCountDetail


class StockSerializer(serializers.ModelSerializer):
    """库存序列化器"""
    
    product_code = serializers.CharField(source='product.code', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    location_code = serializers.CharField(source='location.full_code', read_only=True)
    
    class Meta:
        model = Stock
        fields = '__all__'


class StockMovementSerializer(serializers.ModelSerializer):
    """库存变动序列化器"""
    
    product_code = serializers.CharField(source='product.code', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    location_code = serializers.CharField(source='location.full_code', read_only=True)
    operator_name = serializers.CharField(source='operator.username', read_only=True)
    
    class Meta:
        model = StockMovement
        fields = '__all__'


class StockAlertSerializer(serializers.ModelSerializer):
    """库存预警序列化器"""
    
    product_code = serializers.CharField(source='product.code', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    handled_by_name = serializers.CharField(source='handled_by.username', read_only=True)
    
    class Meta:
        model = StockAlert
        fields = '__all__'


class StockReservationSerializer(serializers.ModelSerializer):
    """库存预留序列化器"""
    
    product_code = serializers.CharField(source='stock.product.code', read_only=True)
    product_name = serializers.CharField(source='stock.product.name', read_only=True)
    location_code = serializers.CharField(source='stock.location.full_code', read_only=True)
    reserved_by_name = serializers.CharField(source='reserved_by.username', read_only=True)
    
    class Meta:
        model = StockReservation
        fields = '__all__'


class InventoryCountSerializer(serializers.ModelSerializer):
    """库存盘点序列化器"""
    
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    count_leader_name = serializers.CharField(source='count_leader.username', read_only=True)
    
    class Meta:
        model = InventoryCount
        fields = '__all__'


class InventoryCountDetailSerializer(serializers.ModelSerializer):
    """库存盘点明细序列化器"""
    
    product_code = serializers.CharField(source='stock.product.code', read_only=True)
    product_name = serializers.CharField(source='stock.product.name', read_only=True)
    location_code = serializers.CharField(source='stock.location.full_code', read_only=True)
    counted_by_name = serializers.CharField(source='counted_by.username', read_only=True)
    
    class Meta:
        model = InventoryCountDetail
        fields = '__all__'