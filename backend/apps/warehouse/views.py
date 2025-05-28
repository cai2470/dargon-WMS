"""
仓库管理视图
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q

from .models import Warehouse, Zone, Location, WarehouseEquipment, WarehouseOperationLog
from .serializers import (
    WarehouseSerializer, ZoneSerializer, LocationSerializer, LocationSimpleSerializer,
    WarehouseEquipmentSerializer, WarehouseOperationLogSerializer, WarehouseStatsSerializer
)
from utils.permissions import WarehousePermission


class WarehouseViewSet(viewsets.ModelViewSet):
    """仓库管理视图集"""
    
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    permission_classes = [WarehousePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'manager']
    search_fields = ['code', 'name', 'address']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['get'])
    def zones(self, request, pk=None):
        """获取仓库的所有库区"""
        warehouse = self.get_object()
        zones = Zone.objects.filter(warehouse=warehouse, is_active=True)
        serializer = ZoneSerializer(zones, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def locations(self, request, pk=None):
        """获取仓库的所有库位"""
        warehouse = self.get_object()
        locations = Location.objects.filter(zone__warehouse=warehouse, zone__is_active=True)
        
        # 支持状态过滤
        status_filter = request.query_params.get('status')
        if status_filter:
            locations = locations.filter(status=status_filter)
        
        serializer = LocationSimpleSerializer(locations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """获取仓库统计信息"""
        warehouse = self.get_object()
        
        # 库区统计
        zone_count = Zone.objects.filter(warehouse=warehouse, is_active=True).count()
        
        # 库位统计
        locations = Location.objects.filter(zone__warehouse=warehouse, zone__is_active=True)
        total_locations = locations.count()
        empty_locations = locations.filter(status='empty').count()
        occupied_locations = locations.filter(status='occupied').count()
        
        # 计算利用率
        utilization_rate = (occupied_locations / total_locations * 100) if total_locations > 0 else 0
        
        stats_data = {
            'total_zones': zone_count,
            'total_locations': total_locations,
            'empty_locations': empty_locations,
            'occupied_locations': occupied_locations,
            'utilization_rate': round(utilization_rate, 2)
        }
        
        return Response(stats_data)


class ZoneViewSet(viewsets.ModelViewSet):
    """库区管理视图集"""
    
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer
    permission_classes = [WarehousePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['warehouse', 'zone_type', 'is_active']
    search_fields = ['code', 'name']
    ordering = ['warehouse', 'code']
    
    @action(detail=True, methods=['get'])
    def locations(self, request, pk=None):
        """获取库区的所有库位"""
        zone = self.get_object()
        locations = zone.location_set.all()
        
        # 支持状态过滤
        status_filter = request.query_params.get('status')
        if status_filter:
            locations = locations.filter(status=status_filter)
        
        serializer = LocationSerializer(locations, many=True)
        return Response(serializer.data)


class LocationViewSet(viewsets.ModelViewSet):
    """库位管理视图集"""
    
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [WarehousePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['zone', 'zone__warehouse', 'status', 'is_pickable', 'is_storable']
    search_fields = ['code', 'name', 'row', 'column', 'level']
    ordering = ['zone', 'row', 'column', 'level']
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """获取可用库位"""
        locations = self.get_queryset().filter(
            status='empty',
            is_storable=True,
            zone__is_active=True
        )
        
        # 支持仓库过滤
        warehouse_id = request.query_params.get('warehouse')
        if warehouse_id:
            locations = locations.filter(zone__warehouse_id=warehouse_id)
        
        serializer = LocationSimpleSerializer(locations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def reserve(self, request, pk=None):
        """预留库位"""
        location = self.get_object()
        
        if location.status != 'empty':
            return Response({'error': '库位状态不允许预留'}, status=status.HTTP_400_BAD_REQUEST)
        
        location.status = 'reserved'
        location.save()
        
        # 记录操作日志
        WarehouseOperationLog.objects.create(
            warehouse=location.zone.warehouse,
            location=location,
            operator=request.user,
            operation_type='freeze',
            description=f'库位 {location.full_code} 被预留'
        )
        
        return Response({'message': '库位预留成功'})
    
    @action(detail=True, methods=['post'])
    def release(self, request, pk=None):
        """释放库位"""
        location = self.get_object()
        
        if location.status != 'reserved':
            return Response({'error': '库位状态不允许释放'}, status=status.HTTP_400_BAD_REQUEST)
        
        location.status = 'empty'
        location.save()
        
        # 记录操作日志
        WarehouseOperationLog.objects.create(
            warehouse=location.zone.warehouse,
            location=location,
            operator=request.user,
            operation_type='unfreeze',
            description=f'库位 {location.full_code} 被释放'
        )
        
        return Response({'message': '库位释放成功'})


class WarehouseEquipmentViewSet(viewsets.ModelViewSet):
    """仓库设备管理视图集"""
    
    queryset = WarehouseEquipment.objects.all()
    serializer_class = WarehouseEquipmentSerializer
    permission_classes = [WarehousePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['warehouse', 'equipment_type', 'status']
    search_fields = ['name', 'code', 'brand', 'model', 'serial_number']
    ordering = ['-created_at']


class WarehouseOperationLogViewSet(viewsets.ReadOnlyModelViewSet):
    """仓库操作日志视图集"""
    
    queryset = WarehouseOperationLog.objects.all()
    serializer_class = WarehouseOperationLogSerializer
    permission_classes = [WarehousePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['warehouse', 'location', 'operator', 'operation_type']
    search_fields = ['description', 'reference_no']
    ordering = ['-operation_time']