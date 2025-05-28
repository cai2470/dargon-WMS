"""
条形码工具类 - 专门为Code128设计
"""
import barcode
from barcode.writer import ImageWriter
from django.conf import settings
import os
import io
import base64
from PIL import Image


def validate_barcode(barcode_str, barcode_type='code128'):
    """
    验证条形码格式
    """
    if not barcode_str:
        return False
    
    # Code128基本验证
    if barcode_type.lower() == 'code128':
        # Code128可以包含ASCII字符0-127
        try:
            # 尝试编码验证
            barcode_str.encode('ascii')
            return len(barcode_str) >= 1  # Code128至少需要1个字符
        except UnicodeEncodeError:
            return False
    
    # EAN13验证
    elif barcode_type.lower() == 'ean13':
        if len(barcode_str) != 13:
            return False
        return barcode_str.isdigit()
    
    # QR码验证（基本检查）
    elif barcode_type.lower() == 'qr':
        return len(barcode_str) <= 4296  # QR码最大容量
    
    return True


def generate_barcode(data, barcode_type='code128', save_path=None):
    """
    生成条形码图片
    
    Args:
        data: 条形码数据
        barcode_type: 条形码类型
        save_path: 保存路径（可选）
    
    Returns:
        dict: 包含文件路径和base64编码的字典
    """
    try:
        # 获取条形码类
        if barcode_type.lower() == 'code128':
            barcode_class = barcode.get_barcode_class('code128')
        elif barcode_type.lower() == 'ean13':
            barcode_class = barcode.get_barcode_class('ean13')
        else:
            raise ValueError(f"不支持的条形码类型: {barcode_type}")
        
        # 获取条形码配置
        barcode_options = getattr(settings, 'BARCODE_SETTINGS', {}).get('CODE128_OPTIONS', {})
        
        # 创建条形码实例
        barcode_instance = barcode_class(data, writer=ImageWriter())
        
        # 生成图片
        if save_path:
            # 保存到文件
            filename = barcode_instance.save(save_path, options=barcode_options)
            
            # 生成base64编码
            with open(filename, 'rb') as f:
                image_data = f.read()
                base64_data = base64.b64encode(image_data).decode('utf-8')
            
            return {
                'file_path': filename,
                'base64': f"data:image/png;base64,{base64_data}",
                'success': True
            }
        else:
            # 生成到内存
            buffer = io.BytesIO()
            barcode_instance.write(buffer, options=barcode_options)
            buffer.seek(0)
            
            # 生成base64编码
            base64_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return {
                'base64': f"data:image/png;base64,{base64_data}",
                'success': True
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def generate_qr_code(data, save_path=None):
    """
    生成QR码
    
    Args:
        data: QR码数据
        save_path: 保存路径（可选）
    
    Returns:
        dict: 包含文件路径和base64编码的字典
    """
    try:
        import qrcode
        
        # 创建QR码实例
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        
        qr.add_data(data)
        qr.make(fit=True)
        
        # 创建图片
        img = qr.make_image(fill_color="black", back_color="white")
        
        if save_path:
            # 保存到文件
            img.save(save_path)
            
            # 生成base64编码
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            base64_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return {
                'file_path': save_path,
                'base64': f"data:image/png;base64,{base64_data}",
                'success': True
            }
        else:
            # 生成到内存
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            
            # 生成base64编码
            base64_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
            
            return {
                'base64': f"data:image/png;base64,{base64_data}",
                'success': True
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def parse_barcode_data(barcode_str, barcode_type='code128'):
    """
    解析条形码数据
    
    Args:
        barcode_str: 条形码字符串
        barcode_type: 条形码类型
    
    Returns:
        dict: 解析后的数据
    """
    result = {
        'original': barcode_str,
        'type': barcode_type,
        'valid': validate_barcode(barcode_str, barcode_type)
    }
    
    if not result['valid']:
        result['error'] = '条形码格式不正确'
        return result
    
    # Code128解析
    if barcode_type.lower() == 'code128':
        result['data'] = {
            'content': barcode_str,
            'length': len(barcode_str),
            'charset': 'ASCII'
        }
    
    # EAN13解析
    elif barcode_type.lower() == 'ean13':
        if len(barcode_str) == 13:
            result['data'] = {
                'country_code': barcode_str[:3],
                'manufacturer_code': barcode_str[3:8],
                'product_code': barcode_str[8:12],
                'check_digit': barcode_str[12]
            }
    
    return result


def generate_product_barcode(product_code, sequence=None):
    """
    为商品生成标准条形码
    
    Args:
        product_code: 商品编码
        sequence: 序列号（可选）
    
    Returns:
        str: 生成的条形码字符串
    """
    import time
    import random
    
    if sequence is None:
        # 使用时间戳和随机数生成序列号
        timestamp = str(int(time.time()))[-6:]  # 取时间戳后6位
        random_num = str(random.randint(100, 999))
        sequence = timestamp + random_num
    
    # 格式: 商品编码 + 序列号
    barcode_str = f"{product_code}{sequence}"
    
    # 确保长度不超过Code128限制
    if len(barcode_str) > 48:  # Code128建议最大长度
        barcode_str = barcode_str[:48]
    
    return barcode_str


class BarcodeGenerator:
    """条形码生成器类"""
    
    def __init__(self, barcode_type='code128'):
        self.barcode_type = barcode_type
        self.options = getattr(settings, 'BARCODE_SETTINGS', {}).get('CODE128_OPTIONS', {})
    
    def generate(self, data, save_path=None):
        """生成条形码"""
        return generate_barcode(data, self.barcode_type, save_path)
    
    def validate(self, barcode_str):
        """验证条形码"""
        return validate_barcode(barcode_str, self.barcode_type)
    
    def parse(self, barcode_str):
        """解析条形码"""
        return parse_barcode_data(barcode_str, self.barcode_type)