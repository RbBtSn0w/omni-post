# Requirements Checklist: API 与功能稳定性对齐 (API/Functionality Parity)

*说明: 本检查清单专门用于评估 `024-node-backend-rewrite` 需求/设计文档关于功能等价性、稳定性和边缘场景的编写质量。*

## 核心 API 行为描述 (Core API Behavior)

- [x] CHK001 - 是否针对每个需要迁移的 API 明确列出了它在遇到未预期的输入（如平台类型不支持、文件超出大小）时的响应状态码和具体错误结构？[Completeness, Spec §US1]
- [x] CHK002 - 对于返回列表的 API（如 `getTasks`, `getGroups`），Spec 是否定义了默认排序方式（以维持与 Python 版行为一致）？[Completeness, Gap]
- [x] CHK003 - 对于依赖外部调用的 API（如二维码获取或 Cookie 验证），超时时间阈值是否明确写出，而非只使用空泛的“超时重试”？[Clarity, Ambiguity]

## 平台登录与 Cookie 管理要求 (Login & Auth)

- [x] CHK004 - 是否明确要求了在使用 Playwright 获取不同平台 Cookie 时，需要采取与 Python 相同的防探测 (anti-bot) 策略或 Stealth 脚本配置？[Consistency, Spec §FR-013]
- [x] CHK005 - 需求中是否规定了 Cookie 过期或失效时的重签发和静默刷新行为应该如何与旧版本对齐？[Coverage, Edge Case]
- [x] CHK006 - 针对通过 SSE 返回二维码状态的需求，每个可能推送的状态枚举（如“等待扫码”、“已扫码”、“失效”）是否完整记录在了规范中？[Completeness, Spec §FR-010]
- [x] CHK007 - sqlite 文件的文件锁和并发写入机制在 Node.js (基于 `better-sqlite3`) 中的行为模式是否被定义？[Clarity, Data Integrity]
- [x] CHK008 - 是否明确了如果有多个 `postVideo` 任务同时触发时，新的并发策略应该和原有的 Python 单队列行为保持一致，还是有其他的限制声明？[Consistency, Spec §FR-007]
- [x] CHK009 - 特殊时间函数的实现边界（如跨夜零点任务的时间补偿），在需求层面是否有明确的度量或具体测试案例的要求？[Completeness, Spec §FR-012]

## 测试深度和逻辑同等性覆盖 (Test Parity Coverage)

- [ ] CHK010 - 是否在规范中要求了对于现有的 33 个 Python 测试，不仅要“通过”，而且要断言同样的报错文案和验证同样的错误分支（Sad paths）？[Clarity, Spec §SC-003]
- [ ] CHK011 - 上传器的 Mock 测试需求中，是否明确指出了如何模拟各大平台的拦截行为，而不仅是模拟 HTTP 200？[Coverage, Exception Flow]

## 兼容回退与切换 (Rollback & Transition)

- [ ] CHK012 - 前端切换到新后端的过程中，如果发生兼容性故障（如特定平台发布全挂），规范中是否定义了如何回滚至 Python 服务的机制或预案？[Gap, Exception Flow]
- [ ] CHK013 - 旧有数据库文件（sqlite）在被 Node.js 版本读取和写入后，如果是向前不兼容的（由于库的细微区别），该风险点是否有相应的数据备份要求？[Coverage, Data Integrity]

## 最终代码审查与逻辑对齐 (Code Review & Logic Parity)

- [ ] CHK014 - 是否在需求或任务列表中明确规定了“重写代码逐行审查(Code Review)”环节，以对比 Node.js 和 Python 版本是否存在边界处理上的差异？[Completeness, Quality Gate]
- [ ] CHK015 - 对于第三方库依赖所实现的核心逻辑（如 Playwright 交互时序、重试间隔），是否要求代码 Review 时重点人工核对两端的等价性？[Clarity, Logic Parity]
- [ ] CHK016 - 规范中是否定义了何种差异是“可接受的”（如因底层运行时抛出不同形态的错误对象），以及何种差异是“必须强制拉齐的”？[Consistency, Ambiguity]
