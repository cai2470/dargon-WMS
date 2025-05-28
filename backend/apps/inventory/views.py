"""
库存管理视图
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, F
from django.utils import timezone

from .models import Stock, StockMovement, StockAlert, StockReservation, InventoryCount, InventoryCountDetail
from .serializers import (
    StockSerializer, StockMovementSerializer, StockAlertSerializer,
    StockReservationSerializer, InventoryCountSerializer, InventoryCountDetailSerializer
)
from utils.permissions import HasModulePermission


class StockViewSet(viewsets.ModelViewSet):
    """库存管理视图集"""
    
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    permission_classes = [HasModulePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['product', 'warehouse', 'location', 'status', 'batch_number']
    search_fields = ['product__code', 'product__name', 'location__code']
    ordering = ['-updated_at']
    
    @action(detail=False, methods=['get'])
    def by_product(self, request):
        """按商品查询库存"""
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response({'error': '请提供商品ID'}, status=status.HTTP_400_BAD_REQUEST)
        
        stocks = self.get_queryset().filter(product_id=product_id, quantity__gt=0)
        serializer = StockSerializer(stocks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """库存汇总统计"""
        warehouse_id = request.query_params.get('warehouse_id')
        queryset = self.get_queryset()
        
        if warehouse_id:
            queryset = queryset.filter(warehouse_id=warehouse_id)
        
        # 统计数据
        total_products = queryset.values('product').distinct().count()
        total_quantity = queryset.aggregate(total=Sum('quantity'))['total'] or 0
        low_stock_count = queryset.filter(
            quantity__lt=F('product__min_stock')
        ).count()
        
        return Response({
            'total_products': total_products,
            'total_quantity': total_quantity,
            'low_stock_count': low_stock_count,
        })


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """库存变动记录视图集"""
    
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [HasModulePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['product', 'warehouse', 'location', 'movement_type', 'operator']
    search_fields = ['product__code', 'product__name', 'reference_number']
    ordering = ['-operation_time']


class StockAlertViewSet(viewsets.ModelViewSet):
    """库存预警视图集"""
    
    queryset = StockAlert.objects.all()
    serializer_class = StockAlertSerializer
    permission_classes = [HasModulePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['product', 'warehouse', 'alert_type', 'level', 'is_active', 'is_handled']
    search_fields = ['product__code', 'product__name', 'message']
    ordering = ['-level', '-created_at']
    
    @action(detail=True, methods=['post'])
    def handle(self, request, pk=None):
        """处理预警"""
        alert = self.get_object()
        alert.is_handled = True
        alert.handled_by = request.user
        alert.handled_at = timezone.now()
        alert.save()
        
        return Response({'message': '预警已处理'})


class StockReservationViewSet(viewsets.ModelViewSet):
    """库存预留视图集"""
    
    queryset = StockReservation.objects.all()
    serializer_class = StockReservationSerializer
    permission_classes = [HasModulePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['stock', 'status', 'reference_type']
    ordering = ['-reserved_at']


class InventoryCountViewSet(viewsets.ModelViewSet):
    """库存盘点视图集"""
    
    queryset = InventoryCount.objects.all()
    serializer_class = InventoryCountSerializer
    permission_classes = [HasModulePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['warehouse', 'status', 'count_scope']
    search_fields = ['count_number', 'description']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        """获取盘点明细"""
        count = self.get_object()
        details = InventoryCountDetail.objects.filter(count=count)
        serializer = InventoryCountDetailSerializer(details, many=True)
        return Response(serializer.data)


class InventoryCountDetailViewSet(viewsets.ModelViewSet):
    """库存盘点明细视图集"""
    
    queryset = InventoryCountDetail.objects.all()
    serializer_class = InventoryCountDetailSerializer
    permission_classes = [HasModulePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['count', 'status']
    ordering = ['count', 'stock__product__code']