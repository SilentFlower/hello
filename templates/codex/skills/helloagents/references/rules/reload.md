# 规则常驻规则

本模块定义 HelloAGENTS 在上下文压缩后的规则恢复机制。

---

## 规则概述

```yaml
规则名称: 规则常驻规则
规则编号: G12
适用范围: 上下文压缩后的规则恢复
核心职责:
  - 定义恢复触发信号
  - 定义恢复流程
  - 定义跨 CLI 的规则文件映射
```

---

<rule_reload>
## 核心规则

### 恢复触发信号

```yaml
自动检测信号:
  - 收到 "context compacted" 提示
  - 无法回忆规则细节
  - 执行行为与规则不符

用户触发信号:
  - 用户说 "重新加载规则"
  - ~rlm reload 命令
  - 直接请求 "reload HelloAGENTS"
```

### 恢复流程

```yaml
步骤1 - 重新读取主规则文件:
  Codex: AGENTS.md
  Claude Code: CLAUDE.md
  Gemini: GEMINI.md

  读取位置优先级:
    1. {CWD}/（当前工作目录）
    2. {USER_HOME}/{CLI_DIR}/（用户配置目录）

步骤2 - 恢复任务上下文:
  检查: helloagents/plan/*/tasks.md 是否存在活动任务
  存在时: 重新读取 tasks.md，恢复进度
  不存在时: 跳过此步骤

步骤3 - 输出恢复确认:
  格式: "📋 规则恢复完成 - HelloAGENTS 已重新加载"
  附加: 如有活动任务，输出当前进度
```

### 跨 CLI 规则文件

```yaml
文件映射:
  Codex CLI: AGENTS.md
  Claude Code: CLAUDE.md（可符号链接到 AGENTS.md）
  Gemini CLI: GEMINI.md（可符号链接到 AGENTS.md）

符号链接建议:
  当使用多个 CLI 时，建议:
    1. 维护一份 AGENTS.md 作为主文件
    2. 其他 CLI 配置文件符号链接到 AGENTS.md
    3. 确保修改同步生效

符号链接命令:
  Linux/macOS: ln -s AGENTS.md CLAUDE.md
  Windows: mklink CLAUDE.md AGENTS.md
```

### 部分恢复

```yaml
场景: 仅需恢复特定模块时

触发: ~rlm reload {模块名}

模块名映射:
  core: G1-G4 核心规则
  modes: G5 执行模式
  globals: G6 通用规则
  modules: G7 模块加载
  validation: G8 验收标准
  agents: G9 子代理编排
  compat: G10 跨CLI兼容
  attention: G11 注意力控制
  all: 完整恢复（默认）
```

### 恢复验证

```yaml
验证项:
  - 主规则文件读取成功
  - 核心变量可访问（如 OUTPUT_LANGUAGE）
  - 路由功能正常

验证失败处理:
  - 输出错误详情
  - 提示检查规则文件位置
  - 建议手动提供规则文件路径
```
</rule_reload>

---

## 异常处理

```yaml
主规则文件不存在:
  - 按优先级尝试所有可能位置
  - 全部失败时输出错误
  - 提示用户确认文件位置

任务文件损坏:
  - 跳过任务恢复
  - 输出警告，建议检查 tasks.md
  - 允许继续使用规则

符号链接失效:
  - 检测到符号链接指向无效时
  - 尝试读取原始文件
  - 建议重建符号链接
```

---

## 规则引用关系

```yaml
被引用:
  - 上下文压缩处理器（自动触发）
  - ~rlm 命令（手动触发）

引用:
  - G7 模块加载（路径规则）
  - G11 注意力控制（任务恢复）
```
