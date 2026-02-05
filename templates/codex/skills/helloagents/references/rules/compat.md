# 跨 CLI 兼容规则

本模块定义 HelloAGENTS 在不同 CLI 环境下的子代理调用方式。

---

## 规则概述

```yaml
规则名称: 跨 CLI 兼容规则
规则编号: G10
适用范围: 需要调用子代理的场景
核心职责:
  - 定义各 CLI 环境的子代理调用命令
  - 定义统一的降级策略
  - 确保跨环境的一致行为
```

---

<cli_compat>
## 核心规则

### Codex CLI 调用方式

```yaml
命令格式: codex exec --full-auto --json --sandbox workspace-write "{角色}: {任务描述}"

参数说明:
  --full-auto: 全自动模式，无需人工确认
  --json: 输出JSON格式结果
  --sandbox workspace-write: 沙箱模式，允许工作区写入

示例:
  codex exec --full-auto --json --sandbox workspace-write "implementer: 实现用户登录功能"
```

### Claude Code 调用方式

```yaml
工具: Task
参数:
  subagent_type: general-purpose
  prompt: "{角色}: {任务描述}"

示例:
  Task(
    subagent_type="general-purpose",
    prompt="implementer: 实现用户登录功能"
  )
```

### Gemini CLI 调用方式

```yaml
命令格式: gemini run --auto "{角色}: {任务描述}"

参数说明:
  --auto: 自动模式

示例:
  gemini run --auto "implementer: 实现用户登录功能"
```

### 统一降级策略

```yaml
触发条件:
  - 子代理调用失败
  - 子代理超时无响应
  - CLI 不支持子代理功能

降级处理:
  1. 主上下文直接执行任务
  2. 在 tasks.md 对应任务项标记 [降级执行]
  3. 输出降级提示

标记格式:
  [降级执行] {原因}
  示例: [降级执行] 子代理超时
```

### 环境检测

```yaml
检测顺序:
  1. 检查当前 CLI 类型（通过环境变量或上下文）
  2. 选择对应的调用方式
  3. 调用失败时自动降级

CLI 类型标识:
  Codex: CLI_TYPE=codex 或存在 codex 命令
  Claude Code: CLI_TYPE=claude 或存在 Task 工具
  Gemini: CLI_TYPE=gemini 或存在 gemini 命令
```
</cli_compat>

---

## 异常处理

```yaml
CLI 类型识别失败:
  - 尝试通用调用方式
  - 失败后直接降级到主上下文
  - 输出警告，建议设置 CLI_TYPE 环境变量

跨 CLI 数据格式不兼容:
  - 统一使用 JSON 格式传递数据
  - 解析失败时使用文本格式降级
```

---

## 规则引用关系

```yaml
被引用:
  - G9 子代理编排（调用方式选择）
  - rlm/roles/*.md（角色调用实现）

引用:
  - G6 通用规则（降级标记格式）
```
