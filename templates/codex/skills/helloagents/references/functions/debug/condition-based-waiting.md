# 条件等待技术

## 概述

不稳定的测试通常用任意延迟来猜测时序。这会产生竞态条件：测试在快速机器上通过，但在负载下或 CI 中失败。

**核心原则:** 等待你真正关心的条件，而不是猜测需要多长时间。

---

## 适用场景

**使用时机:**
- 测试中有任意延迟（`setTimeout`、`sleep`、`time.sleep()`）
- 测试不稳定（有时通过，负载下失败）
- 并行运行时测试超时
- 等待异步操作完成

**不使用时机:**
- 测试实际的时序行为（防抖、节流间隔）
- 如果使用任意超时，必须注释说明原因

**决策流程:**
```
测试使用 setTimeout/sleep? → 测试时序行为? → 是 → 注释说明原因
                                    ↓ 否
                              使用条件等待
```

---

## 核心模式

```typescript
// ❌ 之前: 猜测时序
await new Promise(r => setTimeout(r, 50));
const result = getResult();
expect(result).toBeDefined();

// ✅ 之后: 等待条件
await waitFor(() => getResult() !== undefined);
const result = getResult();
expect(result).toBeDefined();
```

---

## 快速参考

| 场景 | 模式 |
|------|------|
| 等待事件 | `waitFor(() => events.find(e => e.type === 'DONE'))` |
| 等待状态 | `waitFor(() => machine.state === 'ready')` |
| 等待数量 | `waitFor(() => items.length >= 5)` |
| 等待文件 | `waitFor(() => fs.existsSync(path))` |
| 复杂条件 | `waitFor(() => obj.ready && obj.value > 10)` |

---

## 实现

通用轮询函数:
```typescript
async function waitFor<T>(
  condition: () => T | undefined | null | false,
  description: string,
  timeoutMs = 5000
): Promise<T> {
  const startTime = Date.now();

  while (true) {
    const result = condition();
    if (result) return result;

    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`等待 ${description} 超时，已等待 ${timeoutMs}ms`);
    }

    await new Promise(r => setTimeout(r, 10)); // 每 10ms 轮询一次
  }
}
```

**Python 版本:**
```python
import time

def wait_for(condition, description, timeout_sec=5):
    start_time = time.time()

    while True:
        result = condition()
        if result:
            return result

        if time.time() - start_time > timeout_sec:
            raise TimeoutError(f"等待 {description} 超时，已等待 {timeout_sec}s")

        time.sleep(0.01)  # 每 10ms 轮询一次
```

---

## 常见错误

**❌ 轮询太快:** `setTimeout(check, 1)` - 浪费 CPU
**✅ 修复:** 每 10ms 轮询一次

**❌ 无超时:** 条件不满足时永远循环
**✅ 修复:** 始终包含超时和清晰的错误信息

**❌ 陈旧数据:** 在循环前缓存状态
**✅ 修复:** 在循环内调用 getter 获取新鲜数据

---

## 何时使用任意超时是正确的

```typescript
// 工具每 100ms tick 一次 - 需要 2 次 tick 来验证部分输出
await waitForEvent(manager, 'TOOL_STARTED'); // 首先: 等待条件
await new Promise(r => setTimeout(r, 200));   // 然后: 等待定时行为
// 200ms = 100ms 间隔的 2 次 tick - 有文档说明和理由
```

**要求:**
1. 首先等待触发条件
2. 基于已知时序（不是猜测）
3. 注释解释原因

---

## 实际影响

来自调试会话:
- 修复了 3 个文件中的 15 个不稳定测试
- 通过率: 60% → 100%
- 执行时间: 快 40%
- 不再有竞态条件

---

## 检查清单

重构异步测试时:

- [ ] 用 `waitFor()` 替换 `setTimeout/sleep`
- [ ] 条件检查在轮询中获取新鲜数据
- [ ] 超时有清晰的错误信息
- [ ] 如果保留任意延迟，注释说明原因
- [ ] 测试在负载下运行稳定
