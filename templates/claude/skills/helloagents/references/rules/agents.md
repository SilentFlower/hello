# 子代理编排规则

本模块定义 HelloAGENTS 的子代理角色、调用策略和触发条件。

---

## 规则概述

```yaml
规则名称: 子代理编排规则
规则编号: G9
适用范围: 需要调用子代理的复杂任务
核心职责:
  - 定义大型项目判定标准
  - 定义子代理角色列表
  - 定义调用策略和降级方案
  - 定义各阶段的子代理调用场景
```

---

<agent_orchestration>
## 核心规则

### 大型项目判定

```yaml
判定时机: 项目分析阶段评估
判定条件（满足任一即为大型项目）:
  - 源代码文件 > 200
  - 代码行数 > 20000
  - 模块数 > 12

判定方式:
  自动判定: 项目分析阶段扫描项目时自动评估
  手动验证: project_stats.py [--path <项目路径>]
```

### 角色列表

```yaml
能力型角色:
  explorer: 代码探索、文件定位、结构分析
  analyzer: 依赖分析、代码分析、影响评估
  designer: 方案设计、架构规划
  implementer: 代码实现、修改应用
  reviewer: 代码审查、质量检查
  tester: 测试编写、测试执行
  synthesizer: 多维度综合、方案对比

服务绑定型角色:
  kb_keeper: 知识库维护、文档同步
  pkg_keeper: 方案包管理、验证归档
```

### 调用策略

```yaml
优先策略: 尝试调用子代理执行
降级策略: 1轮无响应或失败 → 主上下文直接执行，标记 [降级执行]

降级标记:
  位置: tasks.md 对应任务项
  格式: [降级执行] {原因}
```

### 调用场景

```yaml
EVALUATE/TWEAK:
  策略: 主代理直接执行
  原因: 轻量操作，无需子代理

ANALYZE:
  explorer(强制): 大型项目
  explorer(按需): 文件数>50 或 目录深度>5 或 跨多模块定位
  analyzer(按需): 依赖关系涉及>5模块 或 需深度代码分析

DESIGN:
  analyzer(强制,并行): 标准开发+候选方案≥2
  designer(按需): 轻量迭代单方案设计
  synthesizer(按需): 需综合3+维度对比

DEVELOP:
  implementer(强制): 任何代码文件修改
  reviewer(按需): 核心模块/安全敏感/涉及EHRB
  tester(按需): 新测试用例/高覆盖率要求/核心功能回归
  kb_keeper(按需): 变更涉及>3个知识库文件
```

### 触发条件详细说明

```yaml
implementer触发:
  - 单任务>50行代码
  - 涉及≥3个文件
  - tasks.md标记complexity:high

reviewer触发:
  - 修改核心模块
  - 涉及安全相关代码
  - 涉及EHRB风险

tester触发:
  - 新增公共API
  - 修改现有测试覆盖的代码
  - tasks.md要求测试
```
</agent_orchestration>

---

## 异常处理

```yaml
子代理无响应:
  - 等待1轮（约30秒）
  - 超时后自动降级
  - 记录降级原因

子代理执行失败:
  - 捕获错误信息
  - 立即降级到主上下文
  - 输出失败原因和降级提示

并行调用冲突:
  - 多个子代理同时修改同一文件时
  - 按角色优先级串行处理
  - 优先级: implementer > reviewer > tester
```

---

## 规则引用关系

```yaml
被引用:
  - references/stages/analyze.md（ANALYZE阶段）
  - references/stages/design.md（DESIGN阶段）
  - references/stages/develop.md（DEVELOP阶段）
  - references/rules/scaling.md（大型项目扩展）

引用:
  - G10 跨CLI兼容（子代理调用方式）
  - G2 安全规则（EHRB检测）
  - rlm/roles/*.md（角色定义详情）
```
