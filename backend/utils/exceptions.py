"""
自定义异常处理
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    自定义异常处理器
    """
    # 调用REST framework默认的异常处理器
    response = exception_handler(exc, context)
    
    # 如果没有响应，说明是未处理的异常
    if response is None:
        logger.error(f"未处理的异常: {exc}", exc_info=True)
        return Response({
            'error': '服务器内部错误',
            'message': '请联系管理员'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # 自定义错误响应格式
    custom_response_data = {
        'error': True,
        'message': '请求失败',
        'errors': response.data,
        'status_code': response.status_code
    }
    
    # 根据不同的状态码设置不同的消息
    if response.status_code == 400:
        custom_response_data['message'] = '请求参数错误'
    elif response.status_code == 401:
        custom_response_data['message'] = '未授权访问'
    elif response.status_code == 403:
        custom_response_data['message'] = '权限不足'
    elif response.status_code == 404:
        custom_response_data['message'] = '资源不存在'
    elif response.status_code == 405:
        custom_response_data['message'] = '请求方法不允许'
    elif response.status_code == 429:
        custom_response_data['message'] = '请求过于频繁'
    elif response.status_code >= 500:
        custom_response_data['message'] = '服务器内部错误'
    
    response.data = custom_response_data
    return response


class BusinessException(Exception):
    """
    业务异常基类
    """
    
    def __init__(self, message, code=None):
        self.message = message
        self.code = code
        super().__init__(message)


class InventoryException(BusinessException):
    """
    库存相关异常
    """
    pass


class WarehouseException(BusinessException):
    """
    仓库相关异常
    """
    pass


class BarcodeException(BusinessException):
    """
    条码相关异常
    """
    pass