"""
创建演示数据脚本
运行此脚本会创建一些示例数据用于体验系统功能
"""
import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'xiaoshenlong_wms.settings')

# 初始化Django
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import Role, UserRole
from apps.warehouse.models import Warehouse, Zone, Location
from apps.products.models import Category, Supplier, Brand, Product, Barcode
from apps.inventory.models import Stock, StockAlert

User = get_user_model()

def generate_simple_barcode():
    """生成简单的13位数字条码"""
    import random
    return ''.join([str(random.randint(0, 9)) for _ in range(13)])

def create_demo_data():
    """创建演示数据"""
    print("🚀 开始创建演示数据...")
    
    # 1. 创建管理员用户（如果不存在）
    print("📝 创建用户和角色...")
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@xiaoshenlong.com',
            'phone': '13800138000',
            'department': '信息技术部',
            'position': '系统管理员',
            'is_staff': True,
            'is_superuser': True,
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"  ✅ 创建管理员用户: {admin_user.username}")
    
    # 创建角色
    warehouse_admin_role, _ = Role.objects.get_or_create(
        name='仓库管理员',
        defaults={
            'code': 'warehouse_admin',
            'description': '负责仓库全面管理',
        }
    )
    
    operator_role, _ = Role.objects.get_or_create(
        name='仓库操作员',
        defaults={
            'code': 'operator',
            'description': '负责日常仓库操作',
        }
    )
    
    # 创建测试用户
    test_users = [
        {'username': 'zhang_san', 'name': '张三', 'department': '仓库部', 'position': '仓库管理员'},
        {'username': 'li_si', 'name': '李四', 'department': '仓库部', 'position': '操作员'},
        {'username': 'wang_wu', 'name': '王五', 'department': '仓库部', 'position': '操作员'},
    ]
    
    for user_data in test_users:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': f"{user_data['username']}@xiaoshenlong.com",
                'phone': f"138001380{hash(user_data['username']) % 100:02d}",
                'department': user_data['department'],
                'position': user_data['position'],
            }
        )
        if created:
            user.set_password('123456')
            user.save()
            print(f"  ✅ 创建用户: {user.username} ({user_data['name']})")
            
            # 分配角色
            role = warehouse_admin_role if '管理员' in user_data['position'] else operator_role
            UserRole.objects.get_or_create(user=user, role=role)
    
    # 2. 创建仓库结构
    print("🏢 创建仓库结构...")
    
    # 主仓库
    main_warehouse, _ = Warehouse.objects.get_or_create(
        code='WH001',
        defaults={
            'name': '小神龙主仓库',
            'type': 'main',
            'address': '北京市朝阳区科技园区88号',
            'contact_person': '张三',
            'contact_phone': '13800138001',
            'area': 5000.00,
            'status': 'active'
        }
    )
    print(f"  ✅ 创建仓库: {main_warehouse.name}")
    
    # 创建库区
    zones_data = [
        {'code': 'A', 'name': 'A区-电子产品区', 'type': 'storage'},
        {'code': 'B', 'name': 'B区-日用品区', 'type': 'storage'},
        {'code': 'C', 'name': 'C区-收货暂存区', 'type': 'receiving'},
        {'code': 'D', 'name': 'D区-发货区', 'type': 'shipping'},
    ]
    
    for zone_data in zones_data:
        zone, _ = Zone.objects.get_or_create(
            warehouse=main_warehouse,
            code=zone_data['code'],
            defaults={
                'name': zone_data['name'],
                'zone_type': zone_data['type'],
                'area': 1000.00,
                'status': 'active'
            }
        )
        print(f"  ✅ 创建库区: {zone.name}")
        
        # 为每个库区创建库位
        if zone_data['type'] == 'storage':
            for row in range(1, 4):  # 3排
                for col in range(1, 6):  # 5列
                    for level in range(1, 4):  # 3层
                        location, _ = Location.objects.get_or_create(
                            zone=zone,
                            code=f"{row:02d}{col:02d}{level:02d}",
                            defaults={
                                'row': f"{row:02d}",
                                'column': f"{col:02d}",
                                'level': f"{level:02d}",
                                'capacity': 100.00,
                                'status': 'available'
                            }
                        )
    
    print(f"  ✅ 创建库位: {Location.objects.count()} 个")
    
    # 3. 创建商品数据
    print("📦 创建商品数据...")
    
    # 创建商品分类
    categories_data = [
        {'code': 'ELEC', 'name': '电子产品'},
        {'code': 'PHONE', 'name': '手机通讯', 'parent_code': 'ELEC'},
        {'code': 'COMPUTER', 'name': '电脑数码', 'parent_code': 'ELEC'},
        {'code': 'HOME', 'name': '家居用品'},
        {'code': 'KITCHEN', 'name': '厨房用品', 'parent_code': 'HOME'},
    ]
    
    category_map = {}
    for cat_data in categories_data:
        parent = category_map.get(cat_data.get('parent_code'))
        category, _ = Category.objects.get_or_create(
            code=cat_data['code'],
            defaults={
                'name': cat_data['name'],
                'parent': parent,
                'sort_order': 1
            }
        )
        category_map[cat_data['code']] = category
        print(f"  ✅ 创建分类: {category.name}")
    
    # 创建供应商
    suppliers_data = [
        {'code': 'SUP001', 'name': '华为技术有限公司', 'contact': '张经理', 'phone': '13800138001'},
        {'code': 'SUP002', 'name': '小米科技有限公司', 'contact': '李经理', 'phone': '13800138002'},
        {'code': 'SUP003', 'name': '苹果电子产品商贸有限公司', 'contact': '王经理', 'phone': '13800138003'},
        {'code': 'SUP004', 'name': '九阳股份有限公司', 'contact': '赵经理', 'phone': '13800138004'},
    ]
    
    supplier_map = {}
    for sup_data in suppliers_data:
        supplier, _ = Supplier.objects.get_or_create(
            code=sup_data['code'],
            defaults={
                'name': sup_data['name'],
                'contact_person': sup_data['contact'],
                'contact_phone': sup_data['phone'],
                'email': f"{sup_data['code'].lower()}@example.com",
                'address': '供应商地址',
                'status': 'active'
            }
        )
        supplier_map[sup_data['code']] = supplier
        print(f"  ✅ 创建供应商: {supplier.name}")
    
    # 创建品牌
    brands_data = [
        {'code': 'HUAWEI', 'name': '华为'},
        {'code': 'XIAOMI', 'name': '小米'},
        {'code': 'APPLE', 'name': '苹果'},
        {'code': 'JOYOUNG', 'name': '九阳'},
    ]
    
    brand_map = {}
    for brand_data in brands_data:
        brand, _ = Brand.objects.get_or_create(
            code=brand_data['code'],
            defaults={
                'name': brand_data['name'],
                'description': f"{brand_data['name']}品牌产品"
            }
        )
        brand_map[brand_data['code']] = brand
        print(f"  ✅ 创建品牌: {brand.name}")
    
    # 创建商品
    products_data = [
        {'code': 'P001', 'name': '华为P50 Pro', 'category': 'PHONE', 'supplier': 'SUP001', 'brand': 'HUAWEI', 'price': 4999.00, 'cost': 4000.00},
        {'code': 'P002', 'name': '华为MatePad 11', 'category': 'COMPUTER', 'supplier': 'SUP001', 'brand': 'HUAWEI', 'price': 2999.00, 'cost': 2400.00},
        {'code': 'P003', 'name': '小米12 Pro', 'category': 'PHONE', 'supplier': 'SUP002', 'brand': 'XIAOMI', 'price': 3999.00, 'cost': 3200.00},
        {'code': 'P004', 'name': 'iPhone 14 Pro', 'category': 'PHONE', 'supplier': 'SUP003', 'brand': 'APPLE', 'price': 8999.00, 'cost': 7200.00},
        {'code': 'P005', 'name': '九阳豆浆机', 'category': 'KITCHEN', 'supplier': 'SUP004', 'brand': 'JOYOUNG', 'price': 299.00, 'cost': 240.00},
    ]
    
    for prod_data in products_data:
        product, _ = Product.objects.get_or_create(
            code=prod_data['code'],
            defaults={
                'name': prod_data['name'],
                'category': category_map[prod_data['category']],
                'supplier': supplier_map[prod_data['supplier']],
                'brand': brand_map[prod_data['brand']],
                'unit': '个',
                'price': Decimal(str(prod_data['price'])),
                'cost': Decimal(str(prod_data['cost'])),
                'min_stock': 10,
                'max_stock': 1000,
                'weight': 0.5,
                'status': 'active'
            }
        )
        print(f"  ✅ 创建商品: {product.name}")
        
        # 为每个商品创建条码
        barcode_code = generate_simple_barcode()
        barcode, _ = Barcode.objects.get_or_create(
            product=product,
            barcode=barcode_code,
            defaults={
                'barcode_type': 'code128',
                'is_primary': True
            }
        )
        print(f"    📊 条码: {barcode.barcode}")
    
    # 4. 创建库存数据
    print("📊 创建库存数据...")
    
    products = Product.objects.all()
    locations = Location.objects.filter(zone__zone_type='storage')[:10]  # 选择前10个存储库位
    
    for i, product in enumerate(products):
        if locations:
            location = locations[i % len(locations)]
            
            # 创建库存
            stock, _ = Stock.objects.get_or_create(
                product=product,
                warehouse=main_warehouse,
                location=location,
                defaults={
                    'quantity': 100 + (i * 20),
                    'available_quantity': 100 + (i * 20),
                    'unit_cost': product.cost,
                    'batch_number': f'BATCH{datetime.now().strftime("%Y%m%d")}{i:03d}',
                    'production_date': datetime.now().date() - timedelta(days=30),
                    'expiry_date': datetime.now().date() + timedelta(days=365),
                    'status': 'normal'
                }
            )
            print(f"  ✅ 创建库存: {product.name} - 数量: {stock.quantity}")
            
            # 为低库存商品创建预警
            if stock.quantity < product.min_stock:
                alert, _ = StockAlert.objects.get_or_create(
                    product=product,
                    warehouse=main_warehouse,
                    defaults={
                        'alert_type': 'low_stock',
                        'level': 'medium',
                        'current_stock': stock.quantity,
                        'threshold_value': product.min_stock,
                        'message': f'{product.name} 库存不足，当前库存: {stock.quantity}，最低库存: {product.min_stock}',
                        'is_active': True,
                        'is_handled': False
                    }
                )
    
    print("\n🎉 演示数据创建完成！")
    print("\n📋 数据统计:")
    print(f"  👥 用户: {User.objects.count()} 个")
    print(f"  🏢 仓库: {Warehouse.objects.count()} 个")
    print(f"  📍 库位: {Location.objects.count()} 个")
    print(f"  📦 商品: {Product.objects.count()} 个")
    print(f"  📊 库存: {Stock.objects.count()} 条")
    print(f"  ⚠️ 预警: {StockAlert.objects.count()} 条")
    
    print("\n🔑 测试账户:")
    print("  管理员: admin / admin123")
    print("  测试用户: zhang_san / 123456")
    print("  测试用户: li_si / 123456")
    print("  测试用户: wang_wu / 123456")
    
    print("\n🌐 访问地址:")
    print("  管理后台: http://127.0.0.1:8000/admin")
    print("  API文档: http://127.0.0.1:8000/swagger")

if __name__ == '__main__':
    create_demo_data()