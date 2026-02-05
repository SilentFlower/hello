# @huajiwuyan/hello

HelloAGENTS 交互式安装器 - 支持 Claude Code 和 Codex CLI。

## 安装

```bash
# 使用 npx 一次性运行（推荐）
npx @huajiwuyan/hello

# 或全局安装
npm install -g @huajiwuyan/hello
hello
```

## 使用

### 交互式安装

```bash
npx @huajiwuyan/hello
```

运行后会引导你：
1. 选择要安装的 CLI（Claude Code / Codex CLI / 两者）
2. 选择是否自定义安装路径
3. 处理已存在的安装（覆盖/跳过/取消）

### 卸载

```bash
npx @huajiwuyan/hello -u
# 或
npx @huajiwuyan/hello --uninstall
```

### 帮助

```bash
npx @huajiwuyan/hello -h
```

## 默认安装位置

| CLI | 默认路径 |
|-----|----------|
| Claude Code | `~/.claude` |
| Codex CLI | `~/.codex` |

安装内容：
- `skills/helloagents/` - HelloAGENTS 技能模块（包含完整规则和动态加载索引）

## 安装后使用

**Claude Code:**
```
/helloagents
```

**Codex CLI:**
```
/helloagents
```

## 许可证

MIT
