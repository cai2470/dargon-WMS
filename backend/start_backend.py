#!/usr/bin/env python
"""
小神龙WMS后端启动脚本
自动完成数据库迁移、创建超级用户、启动开发服务器等操作
"""
import os
import sys
import subprocess
import django
from pathlib import Path

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'xiaoshenlong_wms.settings')

def run_command(command, description):
    """运行命令并显示进度"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description}完成")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description}失败: {e}")
        print(f"错误输出: {e.stderr}")
        return False

def check_requirements():
    """检查依赖包是否安装"""
    print("🔍 检查依赖包...")
    try:
        import django
        import rest_framework
        import corsheaders
        print("✅ 依赖包检查完成")
        return True
    except ImportError as e:
        print(f"❌ 缺少依赖包: {e}")
        print("💡 请运行: pip install -r requirements.txt")
        return False

def create_directories():
    """创建必要的目录"""
    print("📁 创建必要目录...")
    directories = ['logs', 'media', 'static']
    
    for dir_name in directories:
        dir_path = Path(dir_name)
        dir_path.mkdir(exist_ok=True)
        print(f"  ✅ {dir_name}/ 目录已创建")

def run_migrations():
    """运行数据库迁移"""
    commands = [
        ("python manage.py makemigrations", "生成迁移文件"),
        ("python manage.py migrate", "执行数据库迁移"),
    ]
    
    for command, description in commands:
        if not run_command(command, description):
            return False
    return True

def create_superuser():
    """创建超级用户"""
    print("👤 创建超级用户...")
    
    # 设置Django环境
    django.setup()
    from django.contrib.auth import get_user_model
    
    User = get_user_model()
    
    # 检查是否已有超级用户
    if User.objects.filter(is_superuser=True).exists():
        print("✅ 超级用户已存在，跳过创建")
        return True
    
    try:
        # 创建默认超级用户
        user = User.objects.create_superuser(
            username='admin',
            email='admin@xiaoshenlong.com',
            password='admin123',
            first_name='系统',
            last_name='管理员'
        )
        print("✅ 超级用户创建成功")
        print("   用户名: admin")
        print("   密码: admin123")
        print("   邮箱: admin@xiaoshenlong.com")
        return True
    except Exception as e:
        print(f"❌ 创建超级用户失败: {e}")
        return False

def load_initial_data():
    """加载初始数据"""
    print("📊 加载初始数据...")
    
    # 检查是否存在演示数据脚本
    if Path('create_demo_data.py').exists():
        if run_command("python create_demo_data.py", "加载演示数据"):
            return True
    
    print("💡 如需演示数据，请手动运行: python create_demo_data.py")
    return True

def start_server():
    """启动开发服务器"""
    print("🚀 启动开发服务器...")
    print("   后端API地址: http://127.0.0.1:8000/")
    print("   管理后台: http://127.0.0.1:8000/admin/")
    print("   按 Ctrl+C 停止服务器")
    print("=" * 50)
    
    try:
        subprocess.run("python manage.py runserver 127.0.0.1:8000", shell=True)
    except KeyboardInterrupt:
        print("\n🛑 服务器已停止")

def main():
    """主函数"""
    print("🐉 小神龙WMS后端启动脚本")
    print("=" * 50)
    
    # 1. 检查依赖
    if not check_requirements():
        sys.exit(1)
    
    # 2. 创建目录
    create_directories()
    
    # 3. 数据库迁移
    if not run_migrations():
        print("❌ 数据库迁移失败，请检查配置")
        sys.exit(1)
    
    # 4. 创建超级用户
    if not create_superuser():
        print("⚠️  超级用户创建失败，可稍后手动创建")
    
    # 5. 加载初始数据
    load_initial_data()
    
    # 6. 启动服务器
    print("\n🎉 后端初始化完成！")
    print("📝 API文档: http://127.0.0.1:8000/api/")
    print("🔐 登录接口: http://127.0.0.1:8000/api/auth/login/")
    
    choice = input("\n是否启动开发服务器？(y/n): ").lower()
    if choice in ['y', 'yes', '']:
        start_server()
    else:
        print("💡 手动启动服务器: python manage.py runserver")

if __name__ == "__main__":
    main() 