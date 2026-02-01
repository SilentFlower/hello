# 根因追踪技术

## 概述

Bug 通常在调用栈深处显现（git init 在错误目录执行、文件创建在错误位置、数据库使用错误路径打开）。你的直觉是在错误出现的地方修复，但那只是在治疗症状。

**核心原则:** 沿调用链反向追踪，直到找到原始触发点，然后在源头修复。

---

## 适用场景

**使用时机:**
- 错误发生在执行深处（不在入口点）
- 堆栈跟踪显示长调用链
- 不清楚无效数据的来源
- 需要找到哪个测试/代码触发了问题

**决策流程:**
```
Bug在调用栈深处? → 能反向追踪? → 追踪到原始触发点 → 修复 + 添加纵深防御
                         ↓ 否
                    在症状点修复（不推荐）
```

---

## 追踪流程

### 1. 观察症状

```
错误: git init 在 /Users/jesse/project/packages/core 失败
```

### 2. 找到直接原因

**什么代码直接导致了这个问题?**
```typescript
await execFileAsync('git', ['init'], { cwd: projectDir });
```

### 3. 问: 谁调用了它?

```typescript
WorktreeManager.createSessionWorktree(projectDir, sessionId)
  → 被 Session.initializeWorkspace() 调用
  → 被 Session.create() 调用
  → 被 Project.create() 的测试调用
```

### 4. 继续向上追踪

**传递了什么值?**
- `projectDir = ''`（空字符串！）
- 空字符串作为 `cwd` 会解析为 `process.cwd()`
- 那就是源代码目录！

### 5. 找到原始触发点

**空字符串从哪来?**
```typescript
const context = setupCoreTest(); // 返回 { tempDir: '' }
Project.create('name', context.tempDir); // 在 beforeEach 之前访问了！
```

---

## 添加堆栈跟踪

当无法手动追踪时，添加诊断代码：

```typescript
// 在问题操作之前
async function gitInit(directory: string) {
  const stack = new Error().stack;
  console.error('DEBUG git init:', {
    directory,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
    stack,
  });

  await execFileAsync('git', ['init'], { cwd: directory });
}
```

**关键:** 在测试中使用 `console.error()`（不用 logger - 可能不显示）

**运行并捕获:**
```bash
npm test 2>&1 | grep 'DEBUG git init'
```

**分析堆栈跟踪:**
- 查找测试文件名
- 找到触发调用的行号
- 识别模式（同一个测试？同一个参数？）

---

## 找出哪个测试造成污染

如果在测试期间出现问题但不知道是哪个测试：

**二分法查找:**
```bash
# 逐个运行测试，找到第一个污染者
npm test -- --testNamePattern="TestA" && check_pollution
npm test -- --testNamePattern="TestB" && check_pollution
# ...
```

---

## 实际示例: 空 projectDir

**症状:** `.git` 在 `packages/core/`（源代码）中创建

**追踪链:**
1. `git init` 在 `process.cwd()` 中运行 ← cwd 参数为空
2. WorktreeManager 被传入空 projectDir
3. Session.create() 传递了空字符串
4. 测试在 beforeEach 之前访问了 `context.tempDir`
5. setupCoreTest() 最初返回 `{ tempDir: '' }`

**根因:** 顶层变量初始化时访问了空值

**修复:** 将 tempDir 改为 getter，在 beforeEach 之前访问时抛出异常

**同时添加纵深防御:**
- 第1层: Project.create() 验证目录
- 第2层: WorkspaceManager 验证非空
- 第3层: NODE_ENV 守卫拒绝在测试中于 tmpdir 外执行 git init
- 第4层: git init 前的堆栈跟踪日志

---

## 核心原则

```
找到直接原因
    ↓
能向上追溯一层? → 是 → 反向追踪 → 是源头吗? → 是 → 在源头修复 → 每层添加验证 → Bug不可能发生
    ↓ 否                           ↓ 否
绝不只修复症状!                    继续追踪
```

**绝不只在错误出现的地方修复。** 反向追踪找到原始触发点。

---

## 堆栈跟踪技巧

- **在测试中:** 使用 `console.error()` 而非 logger - logger 可能被抑制
- **操作之前:** 在危险操作前记录日志，而非失败后
- **包含上下文:** 目录、cwd、环境变量、时间戳
- **捕获堆栈:** `new Error().stack` 显示完整调用链

---

## 实际影响

来自调试会话:
- 通过5层追踪找到根因
- 在源头修复（getter 验证）
- 添加4层防御
- 1847个测试通过，零污染
