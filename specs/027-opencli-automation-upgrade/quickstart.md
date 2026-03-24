# Quickstart: Enhance Automation and Stability using OpenCLI Patterns

## 1. 使用 CLI 工具管理任务

### 安装 CLI
```bash
cd packages/cli
npm install
npm link
```

### 关联本地浏览器配置
```bash
omni browser link "PersonalChrome" "/path/to/user/data" --profile "Default"
```

### 发布文章
```bash
omni publish article article.md --platform zhihu --account <ACCOUNT_ID> --profile <PROFILE_ID>
```

## 2. 在 Web 端配置本地会话复用

1.  打开 **账号管理** 页面。
2.  点击 **配置管理**，添加您的 Chrome 用户数据目录 (`UserDataDir`)。
3.  在添加或编辑账号时，选择对应的 **关联配置文件**。
4.  发布时，系统将自动尝试通过该配置文件进行免密登录和发布。

## 3. 运行平台探索器 (开发者专用)

```bash
omni explore https://example.com/publish --output adapter.yaml
```
探索器将分析该页面的 DOM 结构，识别发布组件，并为您生成一个基础的适配器代码模板。
