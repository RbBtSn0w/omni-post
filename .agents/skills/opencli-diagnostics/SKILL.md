---
name: opencli-diagnostics
description: 借助 OpenCLI 强大的浏览器原生命探测和拦截能力，逆向分析平台真实底层请求和状态，用于诊断大文件上传超时、UI改版等自动化痛点，并将此情报转化为去大模型化的强壮 Playwright 硬编码重构方案。
---

# OpenCLI 辅助诊断与代码自愈工作流 (Diagnostic-Driven Development)

## 🎯 核心目标
当开发者面临某平台频繁改版导致硬编码由于抓不到 Selectors 大面积报错，或者由于固定 `Timeout` 导致大文件在弱网环境下频繁触发上传失败时，调用此技能。
本技能旨在指导大模型利用开发者提供的高清晰度 `OpenCLI` 探测快报（JSON格式网络流水/DOM切片），找到最具鲁棒性（Robustness）的事件锚点，从而**降维重构**和**自我修复**传统的 Playwright / Node.js （含 Python）代码逻辑。

---

## 🚦 何时触发本技能 (Trigger Conditions)
- 用户抱怨：“抖音的大文件上传老是超时死掉！”
- 用户抱怨：“快手的界面刚才又改了，代码跑不通了。”
- 用户主动请求：“使用 opencli 技能，帮我排查一下并重构某某代码。”

---

## 🛠️ 工作流执行步骤 (Workflow Execution)

作为 AI Agent，请严格按照以下步骤推进诊断与重构流程：

### 第一阶段：情报索取 (Require Exploration Artifacts)

Consult 'references/CLI-EXPLORER.md' for more information.

1. 询问用户当前遇到问题的平台。
2. 引导用户使用 OpenCLI 自己执行一遍探矿流程，例如：
   > “请您在本地运行命令：`opencli explore <目标平台的发布入口URL>`，并在浏览器中手动走一遍上传的完整流程。请等待该流程结束。”
3. 告诉用户完成后，只需要将生成的类似 `.opencli/explore/creator.xxx.com/endpoints.json` 这样的路径扔给你即可。

> **如果用户已经提供了包含 OpenCLI 情报的上下文内容，请直接跳过此阶段进入第二阶段。**

### 第二阶段：情报提纯与分析 (Analyze Artifacts)
运用 `view_file` 或相关读取工具深度解析用户提供的 `endpoints.json` 等探测结果：
1. **寻找业务真理**：放弃寻找视觉层面的 UI (如进度条的百分比文字更新) 提示线索。
2. **筛选底层交互**：查找在用户刚触发关键动作（如开始上传、传完的那一秒、点击发布的瞬间），出现的最为突出的关键请求。
   - 过滤准则一：状态码（Status Code）必须为 200/成功。
   - 过滤准则二：包含具有唯一标识性的 response payload (如包含 `video_id`, `success: true` 等代表核心业务流转下发的信号字段)。

### 第三阶段：出具诊断与痛点刨析报告 (Diagnostics Report)
在阅读完相关旧版的项目源码（如 OmniPost 项目下的 `src/uploader/xxx_uploader.py` 或 `src/services/login-impl.ts` 等相关代码）后，向用户简明扼要地汇报你发现的“破局点”：
- **指出原有脆弱点**：例如过度依赖于 `page.wait_for_timeout` 或对某一个经常改名的 DOM css-selector 有绝对依赖。
- **展示新锚点**：说明你在探测文件中挖到的“宝藏”，比如通过拦截一个精准且高层级的内部接口请求，替换原本的傻等。

### 第四阶段：大手术，降维重构 (Surgical Code Healing)
经过用户同意后，通过多点替换或编辑工具帮助重构脚本逻辑。必须遵守以下重构黄金法则：
1. **纯粹 Playwright 优先**：最终代码依然只有 Playwright，不要保留乃至引入对 `OpenCLI` SDK 和大模型运行时的高成本依赖调用，保障任务日常执行速度和低成本。
2. **消灭死等策略（Timeout)**：
   - 移除 `wait_for_timeout` / `waitForTimeout()`。
   - 将其替换为网络侦听或响应判断事件（如通过捕获你找到的关键底层请求作为流转放行信号）。
   - 【案例】:
     ```python
     # Python Playwright 示例
     async with page.expect_response(
         lambda response: "具体的特征API_URI" in response.url and response.status == 200,
         timeout=0  # 把时间限制松绑，由真实返回来放行
     ) as response_info:
         # 触发上传的操作
         await page.locator(...).set_input_files(...)
     ```
3. **Selector 分离化**：如有可能，将那些易变的 Hardcoded class 名与 DOM 元素抽离，将其放在独立文件或者字典头部，使将来的单独调整易如反手。

---

## 🚫 准则约束 (Constraints)
- 切忌在重构中引入臃肿或非完全必要的第三方扩展。项目 `OmniPost` 是基于 Playwright 独立执行发布任务的。
- 请牢记本技能的核心思想：**把高昂的 AI 成本只用在生病看病（Develop/Debug Time）时，而不用在日常跑腿的劳动（Run Time）上。**
