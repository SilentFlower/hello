# 模块加载规则

本模块定义 HelloAGENTS 子模块的路径解析和按需加载规则。

---

## 规则概述

```yaml
规则名称: 模块加载规则
规则编号: G7
适用范围: 所有需要加载子模块的场景
核心职责:
  - 定义模块路径变量和推断规则
  - 定义按需读取的触发条件和目标文件
  - 确保模块加载的完整性和顺序
```

---

<module_loading>
## 核心规则

### 模块路径规则（CRITICAL）

```yaml
路径变量:
  {USER_HOME}: Windows=%USERPROFILE%, Linux/macOS=$HOME
  {CWD}: 当前工作目录
  {CLI_DIR}: .codex、.claude、.gemini 等

两类文件加载方式:
  规则文件（AGENTS.md/CLAUDE.md/GEMINI.md）:
    位置: {CWD}/ 或 {USER_HOME}/{CLI_DIR}/
    加载: CLI 自动加载，始终驻留内存

  HelloAGENTS 子模块（references/、scripts/、assets/）:
    位置: 通过 SKILL_ROOT 解析
    加载: 按需读取

SKILL_ROOT 路径推断规则（仅用于子模块）:
  当需要加载某个模块文件时，按以下优先级尝试完整路径:
  优先级1: {USER_HOME}/{CLI_DIR}/skills/helloagents/{模块相对路径}
  优先级2: {CWD}/skills/helloagents/{模块相对路径}
  锁定: 首个成功读取的路径所在目录即为 SKILL_ROOT，后续模块复用此路径，不回退

路径拼接规则:
  SKILL_ROOT: 不含尾部斜杠（如 C:/Users/xxx/.claude/skills/helloagents）
  SCRIPT_DIR: {SKILL_ROOT}/scripts/
  TEMPLATE_DIR: {SKILL_ROOT}/assets/templates/
  完整路径: {SKILL_ROOT}/{模块相对路径}
  示例: {SKILL_ROOT}/references/stages/analyze.md

模块加载流程:
  1. 确定 SKILL_ROOT（按上方推断规则，仅首次执行）
  2. 触发条件匹配时，拼接完整路径: {SKILL_ROOT}/{模块相对路径}
  3. 优先使用 AI 内置工具读取模块文件（必须遵循 G1「文件操作工具规则」的降级策略）
  4. 将文件内容作为当前阶段的执行规则

强制规则:
  - 子模块内容必须完整读取后再执行，禁止跳过模块加载直接执行（除非模块文件不存在），禁止部分读取或猜测内容
  - 多个模块需加载时，按表格顺序依次读取
```

### 按需读取规则

| 触发条件 | 读取文件 |
|----------|----------|
| 进入项目分析 | references/stages/analyze.md, references/services/knowledge.md |
| 进入微调模式 | references/stages/tweak.md, references/services/package.md |
| 进入方案设计 | references/stages/design.md, references/services/package.md, references/services/templates.md |
| 进入开发实施 | references/stages/develop.md, references/services/package.md, references/services/attention.md |
| ~auto 命令 | references/functions/auto.md |
| ~plan 命令 | references/functions/plan.md |
| ~exec 命令 | references/functions/exec.md |
| ~init 命令 | references/functions/init.md |
| ~upgrade 命令 | references/functions/upgrade.md |
| ~clean 命令 | references/functions/clean.md |
| ~commit 命令 | references/functions/commit.md |
| ~test 命令 | references/functions/test.md |
| ~review 命令 | references/functions/review.md |
| ~validate 命令 | references/functions/validate.md |
| ~rollback 命令 | references/functions/rollback.md |
| ~brain 命令 | references/functions/brain.md |
| ~debug 命令 | references/functions/debug.md |
| ~help 命令 | references/functions/help.md |
| ~rlm 命令 | references/functions/rlm.md |
| 需要执行模式详情 | references/rules/modes.md |
| 需要通用规则详情 | references/rules/globals.md |
| 需要验收标准详情 | references/rules/validation.md |
| 需要子代理编排 | references/rules/agents.md |
| 需要跨CLI兼容 | references/rules/compat.md |
| 需要注意力控制 | references/rules/attention.md |
| 上下文压缩后恢复 | references/rules/reload.md |
| 大型项目扩展 | references/rules/scaling.md |
| 状态管理详情 | references/rules/state.md |
</module_loading>

---

## 异常处理

```yaml
模块文件不存在:
  - 输出警告，标明缺失的模块路径
  - 尝试使用内置规则降级执行
  - 建议用户检查 SKILL_ROOT 配置

SKILL_ROOT 推断失败:
  - 两个优先级路径都不可用时输出错误
  - 提示用户确认 skills/helloagents/ 目录位置

模块内容不完整:
  - 禁止部分执行
  - 输出错误，要求修复模块文件
```

---

## 规则引用关系

```yaml
被引用:
  - 所有命令模块（触发加载）
  - 所有阶段模块（触发加载）
  - G12 规则常驻（恢复时加载）

引用:
  - G1 文件操作工具规则（读取方式）
```
