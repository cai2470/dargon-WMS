"""
仓库管理序列化器
"""
from rest_framework import serializers
from .models import Warehouse, Zone, Location, WarehouseEquipment, WarehouseOperationLog


class WarehouseSerializer(serializers.ModelSerializer):
    """仓库序列化器"""
    
    manager_name = serializers.CharField(source='manager.username', read_only=True)
    zone_count = serializers.SerializerMethodField()
    location_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Warehouse
        fields = '__all__'
    
    def get_zone_count(self, obj):
        """获取库区数量"""
        return obj.zone_set.filter(is_active=True).count()
    
    def get_location_count(self, obj):
        """获取库位数量"""
        return Location.objects.filter(zone__warehouse=obj, zone__is_active=True).count()


class ZoneSerializer(serializers.ModelSerializer):
    """库区序列化器"""
    
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    location_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Zone
        fields = '__all__'
    
    def get_location_count(self, obj):
        """获取库位数量"""
        return obj.location_set.count()


class LocationSerializer(serializers.ModelSerializer):
    """库位序列化器"""
    
    zone_name = serializers.CharField(source='zone.name', read_only=True)
    warehouse_name = serializers.CharField(source='zone.warehouse.name', read_only=True)
    full_code = serializers.ReadOnlyField()
    
    class Meta:
        model = Location
        fields = '__all__'


class LocationSimpleSerializer(serializers.ModelSerializer):
    """库位简单序列化器"""
    
    full_code = serializers.ReadOnlyField()
    
    class Meta:
        model = Location
        fields = ['id', 'code', 'name', 'full_code', 'status']


class WarehouseEquipmentSerializer(serializers.ModelSerializer):
    """仓库设备序列化器"""
    
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    
    class Meta:
        model = WarehouseEquipment
        fields = '__all__'


class WarehouseOperationLogSerializer(serializers.ModelSerializer):
    """仓库操作日志序列化器"""
    
    warehouse_name = serializers.CharField(source='warehouse.name', read_only=True)
    location_code = serializers.CharField(source='location.full_code', read_only=True)
    operator_name = serializers.CharField(source='operator.username', read_only=True)
    
    class Meta:
        model = WarehouseOperationLog
        fields = '__all__'


class WarehouseStatsSerializer(serializers.Serializer):
    """仓库统计序列化器"""
    
    total_warehouses = serializers.IntegerField()
    total_zones = serializers.IntegerField()
    total_locations = serializers.IntegerField()
    empty_locations = serializers.IntegerField()
    occupied_locations = serializers.IntegerField()
    utilization_rate = serializers.DecimalField(max_digits=5, decimal_places=2)