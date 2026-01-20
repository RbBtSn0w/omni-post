from abc import ABC, abstractmethod
from pathlib import Path


class AuthService(ABC):
    """
    认证服务接口，定义了认证相关的抽象方法
    """

    @abstractmethod
    async def cookie_auth_douyin(self, account_file: Path) -> bool:
        """抖音cookie认证"""
        pass

    @abstractmethod
    async def cookie_auth_tencent(self, account_file: Path) -> bool:
        """腾讯视频号cookie认证"""
        pass

    @abstractmethod
    async def cookie_auth_ks(self, account_file: Path) -> bool:
        """快手cookie认证"""
        pass

    @abstractmethod
    async def cookie_auth_xhs(self, account_file: Path) -> bool:
        """小红书cookie认证"""
        pass

    @abstractmethod
    async def check_cookie(self, platform_type: int, file_path: str) -> bool:
        """检查指定平台的cookie有效性"""
        pass


class DefaultAuthService(AuthService):
    """
    默认认证服务实现
    """

    async def cookie_auth_douyin(self, account_file: Path) -> bool:
        """抖音cookie认证"""
        from src.services.cookie_service import get_cookie_service

        return await get_cookie_service().cookie_auth_douyin(account_file)

    async def cookie_auth_tencent(self, account_file: Path) -> bool:
        """腾讯视频号cookie认证"""
        from src.services.cookie_service import get_cookie_service

        return await get_cookie_service().cookie_auth_tencent(account_file)

    async def cookie_auth_ks(self, account_file: Path) -> bool:
        """快手cookie认证"""
        from src.services.cookie_service import get_cookie_service

        return await get_cookie_service().cookie_auth_ks(account_file)

    async def cookie_auth_xhs(self, account_file: Path) -> bool:
        """小红书cookie认证"""
        from src.services.cookie_service import get_cookie_service

        return await get_cookie_service().cookie_auth_xhs(account_file)

    async def check_cookie(self, platform_type: int, file_path: str) -> bool:
        """检查指定平台的cookie有效性"""
        from src.services.cookie_service import get_cookie_service

        return await get_cookie_service().check_cookie(platform_type, file_path)


# 全局默认认证服务实例
default_auth_service = DefaultAuthService()
