"""
商品管理视图
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.conf import settings

from .models import Category, Supplier, Brand, Product, Barcode, ProductSupplier
from .serializers import (
    CategorySerializer, SupplierSerializer, BrandSerializer,
    ProductSerializer, ProductSimpleSerializer, BarcodeSerializer,
    ProductSupplierSerializer
)
from utils.permissions import HasModulePermission
from utils.barcode_utils import generate_barcode, validate_barcode


class CategoryViewSet(viewsets.ModelViewSet):
    """商品分类管理视图集"""
    
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [HasModulePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['parent', 'is_active']
    search_fields = ['name', 'code']
    ordering = ['sort_order', 'code']
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """获取分类树结构"""
        categories = self.get_queryset().filter(is_active=True)
        
        def build_tree(parent=None):
            tree = []
            for category in categories.filter(parent=parent):
                node = CategorySerializer(category).data
                node['children'] = build_tree(category)
                tree.append(node)
            return tree
        
        tree_data = build_tree()
        return Response(tree_data)


class SupplierViewSet(viewsets.ModelViewSet):
    """供应商管理视图集"""
    
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [HasModulePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']
    search_fields = ['code', 'name', 'short_name', 'contact_person']
    ordering = ['-created_at']


class BrandViewSet(viewsets.ModelViewSet):
    """品牌管理视图集"""
    
    queryset = Brand.objects.all()
    serializer_class = BrandSerializer
    permission_classes = [HasModulePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code']
    ordering = ['code']


class ProductViewSet(viewsets.ModelViewSet):
    """商品管理视图集"""
    
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [HasModulePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'brand', 'supplier', 'status', 'storage_type']
    search_fields = ['code', 'name', 'short_name', 'specification', 'model']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        """根据action选择序列化器"""
        if self.action == 'list':
            return ProductSimpleSerializer
        return ProductSerializer
    
    @action(detail=False, methods=['get'])
    def by_barcode(self, request):
        """通过条形码查询商品"""
        barcode = request.query_params.get('barcode')
        if not barcode:
            return Response({'error': '请提供条形码'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            barcode_obj = Barcode.objects.get(barcode=barcode)
            product = barcode_obj.product
            serializer = ProductSerializer(product)
            return Response(serializer.data)
        except Barcode.DoesNotExist:
            return Response({'error': '条形码不存在'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def generate_barcode(self, request, pk=None):
        """为商品生成条形码"""
        product = self.get_object()
        barcode_type = request.data.get('type', 'code128')
        
        try:
            # 生成条形码字符串（这里简化实现）
            import time
            import random
            barcode_str = f"{product.code}{int(time.time())}{random.randint(10, 99)}"
            
            # 验证条形码格式
            if not validate_barcode(barcode_str, barcode_type):
                return Response({'error': '条形码格式不正确'}, status=status.HTTP_400_BAD_REQUEST)
            
            # 创建条形码记录
            barcode_obj = Barcode.objects.create(
                product=product,
                barcode=barcode_str,
                barcode_type=barcode_type,
                is_primary=not product.barcode_set.exists()
            )
            
            serializer = BarcodeSerializer(barcode_obj)
            return Response(serializer.data)
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """获取低库存商品"""
        # 这里需要等inventory模块完成后实现
        products = self.get_queryset().filter(status='active')
        # TODO: 添加库存查询逻辑
        serializer = ProductSimpleSerializer(products[:20], many=True)
        return Response(serializer.data)


class BarcodeViewSet(viewsets.ModelViewSet):
    """条形码管理视图集"""
    
    queryset = Barcode.objects.all()
    serializer_class = BarcodeSerializer
    permission_classes = [HasModulePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['product', 'barcode_type', 'is_primary']
    search_fields = ['barcode', 'product__code', 'product__name']
    ordering = ['-is_primary', '-created_at']
    
    @action(detail=False, methods=['post'])
    def scan(self, request):
        """扫描条形码"""
        barcode = request.data.get('barcode')
        if not barcode:
            return Response({'error': '请提供条形码'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            barcode_obj = Barcode.objects.get(barcode=barcode)
            serializer = BarcodeSerializer(barcode_obj)
            return Response({
                'success': True,
                'data': serializer.data,
                'product': ProductSimpleSerializer(barcode_obj.product).data
            })
        except Barcode.DoesNotExist:
            return Response({
                'success': False,
                'error': '条形码不存在'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def batch_create(self, request):
        """批量创建条形码"""
        data_list = request.data.get('barcodes', [])
        if not data_list:
            return Response({'error': '请提供条形码数据'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_barcodes = []
        errors = []
        
        for data in data_list:
            serializer = BarcodeSerializer(data=data)
            if serializer.is_valid():
                try:
                    barcode_obj = serializer.save()
                    created_barcodes.append(BarcodeSerializer(barcode_obj).data)
                except Exception as e:
                    errors.append(f"条形码 {data.get('barcode', '')}: {str(e)}")
            else:
                errors.append(f"条形码 {data.get('barcode', '')}: {serializer.errors}")
        
        return Response({
            'created': created_barcodes,
            'errors': errors,
            'success_count': len(created_barcodes),
            'error_count': len(errors)
        })


class ProductSupplierViewSet(viewsets.ModelViewSet):
    """商品供应商关联管理视图集"""
    
    queryset = ProductSupplier.objects.all()
    serializer_class = ProductSupplierSerializer
    permission_classes = [HasModulePermission]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['product', 'supplier', 'is_preferred', 'is_active']
    ordering = ['-is_preferred', '-created_at']