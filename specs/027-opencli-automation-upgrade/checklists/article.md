# 需求质量检查表：文章发布业务逻辑 (Article Publishing)

**用途**: 验证 027-opencli-automation-upgrade 特性的文章发布需求、数据模型及平台适配规范的质量，确保其具备可测试性和上线标准。
**创建日期**: 2024-05-22
**特性**: [specs/027-opencli-automation-upgrade/spec.md](../spec.md)
**重点领域**: 文章发布业务逻辑 (Q1-B), 评审/QA 准入网关 (Q2-B), 跨后端演进 (Q3-是)

## 需求完整性 (Requirement Completeness)

 - [x] **CHK001** - 规范是否明确了支持的文章最大字符限制或文件大小限制？ [Gap, Spec §FR-002]
 - [x] **CHK002** - 是否定义了文章封面图的格式（JPG/PNG）、比例及分辨率要求？ [Completeness, Data Model §2]
 - [x] **CHK003** - 对于“多平台文章发布”，是否明确了各平台特定的元数据要求（如：知乎的专栏选择、掘金的分区选择）？ [Gap, Spec §User Story 2]
 - [x] **CHK004** - 是否定义了发布后的“回显”需求，即系统是否需要捕获并存储发布后的文章 URL？ [Completeness, Spec §FR-004]
 - [x] **CHK005** - 规范是否明确了对文章中引用的“本地图片路径”如何自动上传至平台图床的流程要求？ [Gap, Spec §FR-002]

## 需求精确性与可测量性 (Clarity & Measurability)

 - [x] **CHK006** - SC-005 中“95% 的格式准确保留”是否定义了具体的验收基准（如：哪些 Markdown 标签是必须对等的）？ [Measurability, Spec §SC-005]
 - [x] **CHK007** - 是否明确定义了“定时发布”失败后的重试策略（重试次数、间隔时间）？ [Clarity, Spec §User Story 2]
 - [x] **CHK008** - 对于 Markdown 转 HTML 的结果，是否定义了统一的预览渲染标准？ [Clarity, Research §2]
 - [x] **CHK009** - 规范中是否量化了“发布中”状态的超时判定标准？ [Clarity, Plan §Performance Goals]

## 需求一致性 (Requirement Consistency)

 - [x] **CHK010** - Data Model 中的 Article 实体字段是否完全覆盖了各平台适配器 (Adapter) 所需的输入数据？ [Consistency, Data Model]
 - [x] **CHK011** - 任务状态 (Task Status) 的流转定义在视频发布和文章发布场景下是否保持一致？ [Consistency, Data Model §3]
 - [x] **CHK012** - CLI 命令参数定义与后端 API 契约中的字段名称是否保持一致？ [Consistency, Quickstart vs Contracts]

## 场景与边缘情况覆盖 (Coverage & Edge Cases)

 - [x] **CHK013** - 是否定义了文章内容为空或标题过短时的校验失败行为？ [Edge Case, Data Model]
 - [x] **CHK014** - 规范是否明确了当平台接口返回“发布受限”（如：今日次数已达上限）时的处理逻辑？ [Edge Case, Gap]
 - [x] **CHK015** - 是否定义了对包含特殊字符或无法解析的 Markdown 语法的降级处理方案？ [Coverage, Spec §FR-007]

## 跨后端演进与解耦 (Cross-backend Evolution)

 - [x] **CHK016** - 规范是否明确声明了“文章发布”功能仅在 Node.js 端实现，不再考虑 Python 端的兼容性？ [Clarity, Plan §Constraints]
 - [x] **CHK017** - 数据库 Schema 设计是否考虑了与旧版 Python 后端共享表的兼容性（或彻底解耦的方案）？ [Gap, Plan §Structure Decision]
 - [x] **CHK018** - 规范是否定义了如何验证 Node.js 版本的文章服务在功能上完全覆盖了原有的设计预期？ [Traceability, Plan §Constitution Check]

## 备注

- 此检查表作为评审网关，任何标记为 [Gap] 的项均需在进入开发阶段前在 Spec 或 Plan 中补充完整。
- 重点关注 Markdown 在知乎、掘金等不同解析器下的表现一致性。
