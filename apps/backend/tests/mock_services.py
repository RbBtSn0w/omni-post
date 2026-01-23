from pathlib import Path
from queue import Queue

from src.core.constants import PlatformType
from src.services.auth_service import AuthService
from src.services.login_service import LoginService


class MockAuthService(AuthService):
    """
    测试用的认证服务mock实现
    """

    def __init__(self, cookie_valid: bool = True):
        self.cookie_valid = cookie_valid

    async def cookie_auth_douyin(self, account_file: Path) -> bool:
        return self.cookie_valid

    async def cookie_auth_tencent(self, account_file: Path) -> bool:
        return self.cookie_valid

    async def cookie_auth_ks(self, account_file: Path) -> bool:
        return self.cookie_valid

    async def cookie_auth_xhs(self, account_file: Path) -> bool:
        return self.cookie_valid

    async def cookie_auth_bilibili(self, account_file: Path) -> bool:
        return self.cookie_valid

    async def check_cookie(self, platform_type: int, file_path: str) -> bool:
        # Check if type is a valid PlatformType enum value or int
        try:
            PlatformType(platform_type)
            return self.cookie_valid
        except ValueError:
            return False


class MockLoginService(LoginService):
    """
    测试用的登录服务mock实现
    """

    def __init__(self, login_status: bool = True, cookie_valid: bool = True):
        self.login_status = login_status
        self.cookie_valid = cookie_valid

    async def douyin_cookie_gen(self, user_id: str, status_queue: Queue) -> None:
        await status_queue.put("https://mock-qrcode-url.com/douyin")
        if self.login_status:
            if self.cookie_valid:
                await status_queue.put("200")
            else:
                await status_queue.put("500")
        else:
            await status_queue.put("500")

    async def get_tencent_cookie(self, user_id: str, status_queue: Queue) -> dict:
        await status_queue.put("https://mock-qrcode-url.com/tencent")
        if self.login_status:
            if self.cookie_valid:
                await status_queue.put("200")
            else:
                await status_queue.put("500")
        else:
            await status_queue.put("500")
        return {}

    async def get_ks_cookie(self, user_id: str, status_queue: Queue) -> None:
        await status_queue.put("https://mock-qrcode-url.com/ks")
        if self.login_status:
            if self.cookie_valid:
                await status_queue.put("200")
            else:
                await status_queue.put("500")
        else:
            await status_queue.put("500")

    async def xiaohongshu_cookie_gen(self, user_id: str, status_queue: Queue) -> None:
        await status_queue.put("https://mock-qrcode-url.com/xiaohongshu")
        if self.login_status:
            if self.cookie_valid:
                await status_queue.put("200")
            else:
                await status_queue.put("500")
        else:
            await status_queue.put("500")

    async def bilibili_cookie_gen(self, user_id: str, status_queue: Queue) -> None:
        await status_queue.put("https://mock-qrcode-url.com/bilibili")
        if self.login_status:
            if self.cookie_valid:
                await status_queue.put("200")
            else:
                await status_queue.put("500")
        else:
            await status_queue.put("500")
