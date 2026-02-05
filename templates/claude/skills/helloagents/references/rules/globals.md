# 通用规则

本模块定义 HelloAGENTS 的全局状态变量、任务符号和方案包类型。

---

## 规则概述

```yaml
规则名称: 通用规则
规则编号: G6
适用范围: 所有执行流程
核心职责:
  - 定义状态变量及其取值
  - 定义任务状态符号
  - 定义方案包类型和处理规则
  - 定义遗留方案包扫描规则
  - 定义状态重置协议
```

---

<global_rules>
## 核心规则

### 状态变量定义

```yaml
WORKFLOW_MODE:
  INTERACTIVE: 交互模式（默认）
  AUTO_FULL: 全授权模式（~auto）
  AUTO_PLAN: 规划模式（~plan）

CURRENT_STAGE: EVALUATE | ANALYZE | DESIGN | DEVELOP | TWEAK

STAGE_ENTRY_MODE:
  NATURAL: 自然流转（默认）
  DIRECT: 直接进入（~exec）

KB_SKIPPED: true/未设置

方案包相关:
  CREATED_PACKAGE: 方案设计阶段创建后设置
  CURRENT_PACKAGE: 开发实施阶段选定后设置

外部工具相关:
  ACTIVE_TOOL: 当前活跃工具名称
  SUSPENDED_STAGE: 暂存的阶段名称（外部工具执行期间暂存，完成后恢复）
  TOOL_NESTING: 工具嵌套层级（默认0，多层嵌套时每层输出都按G3格式，最终只保留最外层）

SILENCE_BROKEN: 静默模式是否已被打破（默认false）
```

### 任务状态符号

| 符号 | 含义 |
|------|------|
| `[ ]` | 待执行 |
| `[√]` | 已完成 |
| `[X]` | 执行失败 |
| `[-]` | 已跳过 |
| `[?]` | 待确认 |

### 方案包类型

| 类型 | 条件 | 后续流程 |
|------|------|---------|
| implementation | 需求涉及代码变更（默认） | 可进入开发实施 |
| overview | 用户明确要求"文档/设计/分析" | 仅保存，不进入开发实施 |

```yaml
类型判定规则:
  判定时机: design阶段步骤3、develop阶段步骤2、~exec步骤5
  判定方式: 读取proposal.md内容识别类型标记
  默认类型: implementation（无法识别时）

overview类型处理:
  design阶段: 交互模式询问归档/静默模式自动归档 → 跳过develop
  develop阶段: 按确认场景输出（归档/查看/取消）→ 归档后跳过执行
  ~exec命令: 同develop阶段处理
  CHANGELOG记录: 记录到"文档"分类下
```

### 遗留方案包扫描

```yaml
触发时机: 开发实施、方案设计、轻量迭代、规划命令、执行命令完成时
扫描范围: plan/ 目录，排除 CURRENT_PACKAGE
显示条件: 检测到≥1个遗留方案包
显示位置: 底部操作栏（📦 遗留方案包）
```

### 状态重置协议

```yaml
触发条件: 命令完成、用户取消、流程结束、错误终止

重置顺序:
  1. 临时变量: CREATED_PACKAGE, CURRENT_PACKAGE, KB_SKIPPED, ACTIVE_TOOL, SUSPENDED_STAGE → 清除
  2. 工具状态: TOOL_NESTING → 0, SILENCE_BROKEN → false
  3. 流程状态: CURRENT_STAGE → 清除, STAGE_ENTRY_MODE → NATURAL
  4. 工作流模式: WORKFLOW_MODE → INTERACTIVE

重置后: 系统回到IDLE状态，等待用户输入
```
</global_rules>

---

## 异常处理

```yaml
状态变量冲突:
  - 优先级: 显式设置 > 自动推断 > 默认值
  - 冲突时输出警告，按优先级选择

方案包类型识别失败:
  - 使用默认类型 implementation
  - 输出警告，建议检查 proposal.md 格式
```

---

## 规则引用关系

```yaml
被引用:
  - 所有阶段模块（状态变量读写）
  - G4 路由架构（模式判定）
  - references/rules/state.md（状态管理扩展）

引用:
  - G3 输出格式（状态输出）
```
