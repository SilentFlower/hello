# 注意力控制规则

本模块定义 HelloAGENTS 的任务状态跟踪和进度更新规则。

---

## 规则概述

```yaml
规则名称: 注意力控制规则
规则编号: G11
适用范围: 任务执行过程中的状态跟踪
核心职责:
  - 定义活状态区格式
  - 定义状态更新时机
  - 定义更新流程
  - 适配不同 CLI 的任务管理工具
```

---

<attention_control>
## 核心规则

### 活状态区格式

```yaml
格式模板:
  <!-- LIVE_STATUS_BEGIN -->
  状态: {running|paused|completed|failed} | 进度: {完成数}/{总数} ({百分比}%) | 更新: {HH:MM:SS}
  当前: {正在执行的任务描述}
  <!-- LIVE_STATUS_END -->

字段说明:
  状态: running（执行中）、paused（暂停）、completed（完成）、failed（失败）
  进度: 已完成任务数/总任务数 及百分比
  更新: 最后更新时间（24小时制）
  当前: 当前正在执行的任务描述

位置: tasks.md 文件顶部
```

### 更新时机

```yaml
必须更新:
  - 任务开始
  - 状态变更（开始/完成/失败/跳过）
  - 遇到错误
  - 阶段流转

可选更新:
  - 长时间运行任务的进度提示
  - 子任务完成
```

### 更新流程

```yaml
任务开始:
  - 状态设为 running
  - 当前设为任务描述
  - 进度保持不变

任务完成:
  - 任务符号 [ ] → [√]
  - 进度 +1
  - 追加执行日志到任务项

任务失败:
  - 任务符号 [ ] → [X]
  - 状态设为 failed
  - 追加执行日志（含错误信息）

全部完成:
  - 状态设为 completed
  - 当前清空或设为"所有任务已完成"
```

### CLI 工具适配

```yaml
Claude Code:
  工具: TaskCreate / TaskUpdate
  用法:
    创建: TaskCreate(subject="任务标题", description="任务描述")
    更新: TaskUpdate(taskId="1", status="completed")

Codex CLI:
  方式: 直接编辑 tasks.md 文件
  格式: 按活状态区格式更新

通用方式:
  当 CLI 工具不可用时，直接编辑 tasks.md 文件
```

### 进度计算

```yaml
公式: 百分比 = (完成数 / 总数) × 100

完成数统计:
  计入: [√] 已完成、[-] 已跳过
  不计入: [ ] 待执行、[X] 执行失败、[?] 待确认

示例:
  总数: 10
  [√]: 5, [-]: 2, [X]: 1, [ ]: 2
  完成数: 7 (5+2)
  百分比: 70%
```
</attention_control>

---

## 异常处理

```yaml
tasks.md 不存在:
  - 创建新的 tasks.md 文件
  - 初始化活状态区
  - 添加当前任务

状态更新失败:
  - 重试一次
  - 仍失败则输出警告，继续执行
  - 最终在完成时尝试批量更新

进度计算异常:
  - 总数为0时显示 0/0 (0%)
  - 数值异常时重新扫描任务列表
```

---

## 规则引用关系

```yaml
被引用:
  - references/stages/develop.md（开发实施进度）
  - references/functions/auto.md（全授权模式进度）
  - references/services/attention.md（详细注意力服务）

引用:
  - G6 通用规则（任务状态符号）
  - G3 输出格式（状态输出）
```
