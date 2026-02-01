# 纵深防御验证

## 概述

当你修复一个由无效数据引起的 Bug 时，在一个地方添加验证似乎已经足够。但单一检查可能被不同的代码路径、重构或 Mock 绕过。

**核心原则:** 在数据经过的每一层都进行验证。让 Bug 在结构上不可能发生。

---

## 为什么需要多层验证

单一验证: "我们修复了 Bug"
多层验证: "我们让 Bug 变得不可能"

不同层捕获不同情况:
- 入口验证捕获大多数 Bug
- 业务逻辑捕获边界情况
- 环境守卫防止特定上下文的危险
- 调试日志在其他层失效时帮助定位

---

## 四层防御

### 第1层: 入口点验证

**目的:** 在 API 边界拒绝明显无效的输入

```typescript
function createProject(name: string, workingDirectory: string) {
  if (!workingDirectory || workingDirectory.trim() === '') {
    throw new Error('workingDirectory 不能为空');
  }
  if (!existsSync(workingDirectory)) {
    throw new Error(`workingDirectory 不存在: ${workingDirectory}`);
  }
  if (!statSync(workingDirectory).isDirectory()) {
    throw new Error(`workingDirectory 不是目录: ${workingDirectory}`);
  }
  // ... 继续处理
}
```

### 第2层: 业务逻辑验证

**目的:** 确保数据对当前操作有意义

```typescript
function initializeWorkspace(projectDir: string, sessionId: string) {
  if (!projectDir) {
    throw new Error('工作空间初始化需要 projectDir');
  }
  // ... 继续处理
}
```

### 第3层: 环境守卫

**目的:** 在特定上下文中防止危险操作

```typescript
async function gitInit(directory: string) {
  // 在测试中，拒绝在临时目录外执行 git init
  if (process.env.NODE_ENV === 'test') {
    const normalized = normalize(resolve(directory));
    const tmpDir = normalize(resolve(tmpdir()));

    if (!normalized.startsWith(tmpDir)) {
      throw new Error(
        `测试期间拒绝在临时目录外执行 git init: ${directory}`
      );
    }
  }
  // ... 继续处理
}
```

### 第4层: 调试诊断

**目的:** 为取证捕获上下文

```typescript
async function gitInit(directory: string) {
  const stack = new Error().stack;
  logger.debug('即将执行 git init', {
    directory,
    cwd: process.cwd(),
    stack,
  });
  // ... 继续处理
}
```

---

## 应用模式

当你发现一个 Bug 时:

1. **追踪数据流** - 错误值从哪来？在哪使用？
2. **映射所有检查点** - 列出数据经过的每个点
3. **在每层添加验证** - 入口、业务、环境、调试
4. **测试每层** - 尝试绕过第1层，验证第2层能捕获

---

## 实际示例

**Bug:** 空 `projectDir` 导致 `git init` 在源代码中执行

**数据流:**
1. 测试设置 → 空字符串
2. `Project.create('name', '')`
3. `WorkspaceManager.createWorkspace('')`
4. `git init` 在 `process.cwd()` 中运行

**添加的四层防御:**
- 第1层: `Project.create()` 验证非空/存在/可写
- 第2层: `WorkspaceManager` 验证 projectDir 非空
- 第3层: `WorktreeManager` 测试中拒绝在 tmpdir 外执行 git init
- 第4层: git init 前的堆栈跟踪日志

**结果:** 全部 1847 个测试通过，Bug 无法复现

---

## 关键洞察

四层防御都是必要的。在测试过程中，每层都捕获了其他层遗漏的 Bug:
- 不同代码路径绕过了入口验证
- Mock 绕过了业务逻辑检查
- 不同平台的边界情况需要环境守卫
- 调试日志识别了结构性误用

**不要止步于一个验证点。** 在每层都添加检查。

---

## 检查清单

修复 Bug 后，确认以下各层:

- [ ] **第1层 - 入口验证:** 公共 API 是否验证了所有输入？
- [ ] **第2层 - 业务验证:** 内部函数是否检查了前置条件？
- [ ] **第3层 - 环境守卫:** 危险操作是否有上下文保护？
- [ ] **第4层 - 调试诊断:** 关键操作前是否有日志记录？
