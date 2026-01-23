from src.core.constants import (
    PlatformType,
    get_platform_name,
    get_platform_type,
    is_valid_platform,
)


def test_platform_type_enum():
    """Test PlatformType enum values"""
    assert PlatformType.XIAOHONGSHU == 1
    assert PlatformType.TENCENT == 2
    assert PlatformType.DOUYIN == 3
    assert PlatformType.KUAISHOU == 4
    assert PlatformType.BILIBILI == 5

    # Verify Enum behavior
    assert PlatformType(1) == PlatformType.XIAOHONGSHU
    assert PlatformType["BILIBILI"] == PlatformType.BILIBILI


def test_get_platform_name():
    """Test ID to name mapping"""
    assert get_platform_name(1) == "小红书"
    assert get_platform_name(5) == "Bilibili"
    assert get_platform_name(99) == "未知"
    assert get_platform_name(PlatformType.DOUYIN) == "抖音"


def test_get_platform_type():
    """Test name to ID mapping"""
    assert get_platform_type("小红书") == 1
    assert get_platform_type("Bilibili") == 5
    assert get_platform_type("Unknown") == 0


def test_is_valid_platform():
    """Test validation logic"""
    assert is_valid_platform(1) is True
    assert is_valid_platform(5) is True
    assert is_valid_platform(6) is False
    assert is_valid_platform(0) is False
