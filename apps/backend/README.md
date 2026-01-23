# 社交媒体自动上传后端服务

## 项目概述

社交媒体自动上传后端服务是一个强大的自动化工具，用于将视频上传到多个社交媒体平台，包括小红书、视频号、抖音和快手等。本项目采用Python 3.10开发，基于Flask框架，支持异步编程和浏览器自动化。

**新功能**：现已集成 GitHub Copilot SDK，支持通过自然语言发布视频！详见下方 [AI Agent 集成](#ai-agent-集成) 部分。

## 快速启动指南

### 1. 环境要求

- Python版本：3.10.x
- 浏览器：Google Chrome（可选，用于浏览器自动化）

### 2. 安装步骤

1. **安装依赖**
   ```bash
   pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
   ```

2. **配置Chrome浏览器路径**
   修改`conf.py`文件中的`LOCAL_CHROME_PATH`为本地Chrome浏览器地址：
   ```python
   # macOS 环境
   LOCAL_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
   
   # Windows 环境
   LOCAL_CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe"
   ```

3. **初始化数据库**
   ```bash
   python src/db/createTable.py
   ```

4. **启动后端服务**
   ```bash
   python src/app.py
   ```

## 目录结构

```
├── src/                  # 源代码目录
│   ├── conf.py           # 全局配置文件
│   ├── app.py            # 应用入口
│   ├── db/               # 数据库相关
│   │   ├── createTable.py # 数据库表创建脚本
│   │   └── db_manager.py  # 数据库路径管理
│   ├── routes/           # API路由
│   │   ├── account.py    # 账号管理
│   │   ├── cookie.py     # Cookie管理
│   │   ├── dashboard.py  # 仪表盘
│   │   ├── file.py       # 文件管理
│   │   └── publish.py    # 发布管理
│   ├── services/         # 业务服务
│   │   ├── auth_service.py  # 认证服务
│   │   └── login_service.py # 登录服务
│   ├── uploader/         # 平台上传器
│   │   ├── douyin_uploader/    # 抖音上传
│   │   ├── tencent_uploader/   # 视频号上传
│   │   ├── xiaohongshu_uploader/ # 小红书上传
│   │   └── ks_uploader/        # 快手上传
│   └── utils/            # 工具函数
│       ├── auth.py       # 认证工具
│       ├── login.py      # 登录工具
│       ├── log.py        # 日志工具
│       └── network.py    # 网络工具
├── data/                 # 数据目录
│   └── database.db       # SQLite数据库文件
├── logs/                 # 日志文件
├── tests/                # 测试目录
├── requirements.txt       # 依赖列表
└── README.md             # 项目说明文档
```

## 核心配置

### 1. 配置文件

主要配置文件为`src/conf.py`，包含以下核心配置：

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `DEBUG_MODE` | 调试模式开关 | `True` |
| `TEST_MODE` | 测试模式开关 | `False` |
| `LOCAL_CHROME_PATH` | Chrome浏览器路径 | 自动检测系统路径 |
| `LOCAL_CHROME_HEADLESS` | 是否以无界面模式运行Chrome | `True` |

### 2. 环境变量

| 变量名 | 说明 | 默认值 | 配置源 |
|--------|------|--------|--------|
| `PYTHONPATH` | Python模块搜索路径 | `.:src` | pytest.ini |
| `TEST_MODE` | 测试模式开关 | `False` | pytest.ini |
| `DEBUG_MODE` | 调试模式开关 | `False` | pytest.ini |

## 数据库管理

### 1. 数据库路径

数据库文件位于`data/database.db`，由`DatabaseManager`类统一管理，确保路径一致性和安全性。

### 2. 数据库管理类

`src/db/db_manager.py`提供了统一的数据库路径管理功能：

- 集中管理数据库文件路径
- 路径验证机制，确保数据库文件位于正确的`data`目录下
- 自动清理旧数据库文件
- 确保数据库文件存在

### 3. 数据库操作示例

```python
from src.db.db_manager import db_manager
import sqlite3

# 获取数据库路径
db_path = db_manager.get_db_path()

# 连接数据库
with sqlite3.connect(db_path) as conn:
    cursor = conn.cursor()
    # 执行SQL操作
    cursor.execute("SELECT * FROM users")
    result = cursor.fetchall()
```

## 测试架构

### 1. 测试分层

- **单元测试**：Mock所有外部依赖，专注于核心逻辑
- **集成测试**：模拟关键业务行为，验证模块间协作
- **E2E测试**：验证完整用户交互流程

### 2. 测试覆盖率目标

- 核心模块覆盖率：80%以上
- 整体覆盖率：50%以上

### 3. 测试配置

测试配置与生产配置完全分离，使用`test_conf.py`存储测试专用配置，通过依赖注入模式实现测试与生产代码的解耦。

### 4. 测试优化策略

- 实现测试模式，通过Mock扫码逻辑避免真实扫码操作
- 采用Mock技术完全隔离外部依赖，消除测试等待环节
- 使用FakeTimer工具加快时间流逝，高效测试轮询超时逻辑
- 确保所有测试用例秒级完成，适配CI环境

## API接口说明

### 1. 文件上传

- **接口地址**：`/upload`
- **请求方法**：POST
- **功能**：上传视频文件，返回文件唯一标识
- **返回示例**：
  ```json
  {"fileId": "1234567890"}
  ```

### 2. 账号登录

- **接口地址**：`/login`
- **请求方法**：GET
- **参数**：
  - `id`: 用户名
  - `type`: 平台标识（1:小红书, 2:视频号, 3:抖音, 4:快手）
- **功能**：建立SSE连接，获取登录二维码
- **返回示例**：
  ```
  data: {"qrcode": "base64-encoded-qrcode"}
  data: {"status": "200"}
  ```

### 3. 获取有效账号

- **接口地址**：`/getValidAccounts`
- **请求方法**：GET
- **功能**：获取所有可用账号及其Cookie状态
- **返回示例**：
  ```json
  [
    {"id": 1, "username": "user1", "platform": 1, "filePath": "cookies/user1.json", "status": 1}
  ]
  ```

### 4. 发布视频

- **接口地址**：`/postVideo`
- **请求方法**：POST
- **请求体**：
  ```json
  {
    "file_list": ["1234567890"],
    "account_list": ["cookies/user1.json"],
    "type": 1,
    "title": "视频标题",
    "tags": ["标签1", "标签2"],
    "category": 0,
    "enableTimer": false
  }
  ```
- **功能**：发布视频到指定平台

## 开发指南

### 1. 代码风格

- 遵循PEP 8编码规范
- 使用异步编程模式（async/await）
- 采用依赖注入模式提高代码可测试性

### 2. 新增功能流程

1. 定义接口规范
2. 实现业务逻辑
3. 编写单元测试
4. 编写集成测试
5. 更新文档

### 3. 数据库操作最佳实践

- 所有数据库操作均通过`DatabaseManager`获取路径
- 使用上下文管理器管理数据库连接
- 遵循SQL注入防护原则

## 优化与重构

### 1. 数据库路径优化

已实现数据库路径集中管理，确保数据库文件位于`data`目录下，自动清理旧数据库文件，提高了系统的可靠性和可维护性。

### 2. 测试配置解耦

通过依赖注入模式实现了测试配置与生产代码的完全分离，提高了代码的可测试性和可扩展性，确保测试配置仅在测试环境生效。

### 3. 测试架构优化

建立了分层测试架构，采用Mock技术完全隔离外部依赖，实现了测试的快速执行和高覆盖率目标。

## AI Agent 集成

OmniPost 现已集成 GitHub Copilot SDK，提供自然语言驱动的发布功能。

### 快速开始

```bash
# 安装依赖（包含 github-copilot-sdk）
pip install -r requirements.txt

# 测试 Agent 服务
pytest tests/test_agent_service.py -v

# 使用 CLI 发布内容
python -m tools.omni_cli post "帮我把这个视频发到抖音，标题要吸引年轻人"
```

### 功能特点

- 🤖 **自然语言理解**：使用中文或英文描述发布需求
- 🛠️ **工具系统**：可扩展的工具注册机制，支持集成所有平台上传器
- 📋 **CLI 工具**：命令行界面快速发布
- ✅ **离线测试**：stub 模式支持无网络测试

### CLI 命令示例

```bash
# 列出可用账号
python -m tools.omni_cli accounts --platform douyin

# 发布到指定平台
python -m tools.omni_cli post --file video.mp4 --platforms douyin xiaohongshu

# 预览模式（不实际上传）
python -m tools.omni_cli post "上传视频" --dry-run
```

### Python API 示例

```python
from services.agent_service import AgentService

# 获取单例实例
agent = AgentService.get_instance()
agent.start()

# 执行自然语言指令
result = agent.run("帮我发布视频到抖音", {"file_id": "123"})
print(result)

agent.stop()
```

### 详细文档

完整的集成指南和 API 文档，请参阅 [docs/agent.md](../../docs/agent.md)。

## 后续计划

1. 完善CI/CD流程
2. 提高测试覆盖率
3. 优化浏览器自动化性能
4. 支持更多社交媒体平台
5. 实现视频处理和编辑功能
6. 增强监控和日志系统
7. **完善 AI Agent 集成**：接入真实 Copilot SDK，实现智能工具选择

## 平台标识说明

| 平台 | 标识值 |
|------|--------|
| 小红书 | 1 |
| 视频号 | 2 |
| 抖音 | 3 |
| 快手 | 4 |

## 许可证

本项目采用MIT许可证，详见项目根目录的LICENSE文件。