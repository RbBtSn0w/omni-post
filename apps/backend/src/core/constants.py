"""
Core constants module for omni-post backend.

This module defines platform constants and enumerations.
"""

import enum


class TencentZoneTypes(enum.Enum):
    """腾讯视频号分区类型"""

    LIFESTYLE = "生活"
    CUTE_KIDS = "萌娃"
    MUSIC = "音乐"
    KNOWLEDGE = "知识"
    EMOTION = "情感"
    TRAVEL_SCENERY = "旅行风景"
    FASHION = "时尚"
    FOOD = "美食"
    LIFE_HACKS = "生活技巧"
    DANCE = "舞蹈"
    MOVIES_TV_SHOWS = "影视综艺"
    SPORTS = "运动"
    FUNNY = "搞笑"
    CELEBRITIES = "明星名人"
    NEWS_INFO = "新闻资讯"
    GAMING = "游戏"
    AUTOMOTIVE = "车"
    ANIME = "二次元"
    TALENT = "才艺"
    CUTE_PETS = "萌宠"
    INDUSTRY_MACHINERY_CONSTRUCTION = "机械"
    ANIMALS = "动物"
    PARENTING = "育儿"
    TECHNOLOGY = "科技"


class VideoZoneTypes(enum.Enum):
    """B站视频分区类型"""

    MAINPAGE = 0
    ANIME = 13
    ANIME_SERIAL = 33
    ANIME_FINISH = 32
    ANIME_INFORMATION = 51
    ANIME_OFFICAL = 152
    MOVIE = 23
    GUOCHUANG = 167
    GUOCHUANG_CHINESE = 153
    GUOCHUANG_ORIGINAL = 168
    GUOCHUANG_PUPPETRY = 169
    GUOCHUANG_MOTIONCOMIC = 195
    GUOCHUANG_INFORMATION = 170
    TELEPLAY = 11
    DOCUMENTARY = 177
    DOUGA = 1
    DOUGA_MAD = 24
    DOUGA_MMD = 25
    DOUGA_VOICE = 47
    DOUGA_GARAGE_KIT = 210
    DOUGA_TOKUSATSU = 86
    DOUGA_ACGNTALKS = 253
    DOUGA_OTHER = 27
    GAME = 4
    GAME_STAND_ALONE = 17
    GAME_ESPORTS = 171
    GAME_MOBILE = 172
    GAME_ONLINE = 65
    GAME_BOARD = 173
    GAME_GMV = 121
    GAME_MUSIC = 136
    GAME_MUGEN = 19
    KICHIKU = 119
    KICHIKU_GUIDE = 22
    KICHIKU_MAD = 26
    KICHIKU_MANUAL_VOCALOID = 126
    KICHIKU_THEATRE = 216
    KICHIKU_COURSE = 127
    MUSIC = 3
    MUSIC_ORIGINAL = 28
    MUSIC_COVER = 31
    MUSIC_PERFORM = 59
    MUSIC_VOCALOID = 30
    MUSIC_LIVE = 29
    MUSIC_MV = 193
    MUSIC_COMMENTARY = 243
    MUSIC_TUTORIAL = 244
    MUSIC_OTHER = 130
    DANCE = 129
    DANCE_OTAKU = 20
    DANCE_HIPHOP = 198
    DANCE_STAR = 199
    DANCE_CHINA = 200
    DANCE_THREE_D = 154
    DANCE_DEMO = 156
    CINEPHILE = 181
    CINEPHILE_CINECISM = 182
    CINEPHILE_MONTAGE = 183
    CINEPHILE_SHORTFILM = 85
    CINEPHILE_TRAILER_INFO = 184
    ENT = 5
    ENT_VARIETY = 71
    ENT_TALKER = 241
    ENT_FANS = 242
    ENT_CELEBRITY = 137
    KNOWLEDGE = 36
    KNOWLEDGE_SCIENCE = 201
    KNOWLEDGE_SOCIAL_SCIENCE = 124
    KNOWLEDGE_HUMANITY_HISTORY = 228
    KNOWLEDGE_BUSINESS = 207
    KNOWLEDGE_CAMPUS = 208
    KNOWLEDGE_CAREER = 209
    KNOWLEDGE_DESIGN = 229
    KNOWLEDGE_SKILL = 122
    TECH = 188
    TECH_DIGITAL = 95
    TECH_APPLICATION = 230
    TECH_COMPUTER_TECH = 231
    TECH_INDUSTRY = 232
    INFORMATION = 202
    INFORMATION_HOTSPOT = 203
    INFORMATION_GLOBAL = 204
    INFORMATION_SOCIAL = 205
    INFORMATION_MULTIPLE = 206
    FOOD = 211
    FOOD_MAKE = 76
    FOOD_DETECTIVE = 212
    FOOD_MEASUREMENT = 213
    FOOD_RURAL = 214
    FOOD_RECORD = 215
    LIFE = 160
    LIFE_FUNNY = 138
    LIFE_TRAVEL = 250
    LIFE_RURALLIFE = 251
    LIFE_HOME = 239
    LIFE_HANDMAKE = 161
    LIFE_PAINTING = 162
    LIFE_DAILY = 21
    CAR = 223
    CAR_RACING = 245
    CAR_MODIFIEDVEHICLE = 246
    CAR_NEWENERGYVEHICLE = 247
    CAR_TOURINGCAR = 248
    CAR_MOTORCYCLE = 240
    CAR_STRATEGY = 227
    CAR_LIFE = 176
    FASHION = 155
    FASHION_MAKEUP = 157
    FASHION_COS = 252
    FASHION_CLOTHING = 158
    FASHION_TREND = 159
    SPORTS = 234
    SPORTS_BASKETBALL = 235
    SPORTS_FOOTBALL = 249
    SPORTS_AEROBICS = 164
    SPORTS_ATHLETIC = 236
    SPORTS_CULTURE = 237
    SPORTS_COMPREHENSIVE = 238
    ANIMAL = 217
    ANIMAL_CAT = 218
    ANIMAL_DOG = 219
    ANIMAL_PANDA = 220
    ANIMAL_WILD_ANIMAL = 221
    ANIMAL_REPTILES = 222
    ANIMAL_COMPOSITE = 75
    VLOG = 19


class PlatformType(enum.IntEnum):
    """平台类型枚举 - 所有平台类型的唯一真相来源"""

    XIAOHONGSHU = 1
    TENCENT = 2  # 视频号
    DOUYIN = 3
    KUAISHOU = 4
    BILIBILI = 5


# ============================================================================
# PLATFORM_REGISTRY: Single Source of Truth (DRY Principle)
# ============================================================================
# To add a new platform:
# 1. Add enum value to PlatformType
# 2. Add entry to PLATFORM_REGISTRY below
# All other mappings are auto-derived!

PLATFORM_REGISTRY = {
    PlatformType.XIAOHONGSHU: {
        "name_cn": "小红书",
        "name_cli": "xiaohongshu",
        "login_url": "https://creator.xiaohongshu.com/",
        "aliases": [],
    },
    PlatformType.TENCENT: {
        "name_cn": "视频号",
        "name_cli": "tencent",
        "login_url": "https://channels.weixin.qq.com",
        "aliases": ["wechat"],  # CLI alias
    },
    PlatformType.DOUYIN: {
        "name_cn": "抖音",
        "name_cli": "douyin",
        "login_url": "https://creator.douyin.com/",
        "aliases": [],
    },
    PlatformType.KUAISHOU: {
        "name_cn": "快手",
        "name_cli": "kuaishou",
        "login_url": "https://cp.kuaishou.com",
        "aliases": [],
    },
    PlatformType.BILIBILI: {
        "name_cn": "Bilibili",
        "name_cli": "bilibili",
        "login_url": "https://member.bilibili.com/platform/home",
        "aliases": [],
    },
}


# ============================================================================
# Auto-derived mappings (DO NOT EDIT - generated from PLATFORM_REGISTRY)
# ============================================================================

# Platform display names (Chinese)
PLATFORM_NAMES = {k: v["name_cn"] for k, v in PLATFORM_REGISTRY.items()}

# Reverse mapping: Chinese name -> type
PLATFORM_NAME_TO_TYPE = {v["name_cn"]: k for k, v in PLATFORM_REGISTRY.items()}

# Platform login URLs
PLATFORM_LOGIN_URLS = {k: v["login_url"] for k, v in PLATFORM_REGISTRY.items()}

# CLI name -> type (includes aliases)
PLATFORM_CLI_NAMES = {}
for platform_type, info in PLATFORM_REGISTRY.items():
    PLATFORM_CLI_NAMES[info["name_cli"]] = platform_type
    for alias in info["aliases"]:
        PLATFORM_CLI_NAMES[alias] = platform_type

# Type -> CLI name (primary name only, no aliases)
PLATFORM_TYPE_TO_CLI_NAME = {k: v["name_cli"] for k, v in PLATFORM_REGISTRY.items()}


# ============================================================================
# Helper Functions
# ============================================================================


def get_platform_name(platform_type: int) -> str:
    """Get platform display name by type ID.

    Args:
        platform_type: Platform type ID (1-5)

    Returns:
        Platform Chinese name or "未知" if not found
    """
    try:
        return PLATFORM_NAMES.get(PlatformType(platform_type), "未知")
    except ValueError:
        return "未知"


def get_platform_type(platform_name: str) -> int:
    """Get platform type ID by name.

    Args:
        platform_name: Platform display name (Chinese)

    Returns:
        Platform type ID or 0 if not found
    """
    platform = PLATFORM_NAME_TO_TYPE.get(platform_name)
    return int(platform) if platform else 0


def is_valid_platform(platform_type: int) -> bool:
    """Check if a platform type ID is valid.

    Args:
        platform_type: Platform type ID to check

    Returns:
        True if valid, False otherwise
    """
    try:
        PlatformType(platform_type)
        return True
    except ValueError:
        return False


def get_cli_platform_choices() -> list:
    """Get list of valid platform choices for CLI argument parsing.

    Returns:
        List of lowercase platform names for argparse choices
    """
    return list(PLATFORM_CLI_NAMES.keys())


def cli_name_to_type(cli_name: str) -> int:
    """Convert CLI platform name to type ID.

    Args:
        cli_name: Lowercase platform name (e.g., 'douyin', 'wechat')

    Returns:
        Platform type ID or 0 if not found
    """
    platform = PLATFORM_CLI_NAMES.get(cli_name.lower())
    return int(platform) if platform else 0


def type_to_cli_name(platform_type: int) -> str:
    """Convert platform type ID to CLI-friendly name.

    Args:
        platform_type: Platform type ID (1-5)

    Returns:
        CLI-friendly name or 'unknown' if not found
    """
    try:
        return PLATFORM_TYPE_TO_CLI_NAME.get(PlatformType(platform_type), "unknown")
    except ValueError:
        return "unknown"


def get_platform_login_url(platform_type: int) -> str:
    """Get platform login URL by type ID.

    Args:
        platform_type: Platform type ID (1-5)

    Returns:
        Login URL or empty string if not found
    """
    try:
        return PLATFORM_LOGIN_URLS.get(PlatformType(platform_type), "")
    except ValueError:
        return ""
