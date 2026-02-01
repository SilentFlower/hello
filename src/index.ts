import { parseArgs } from 'node:util'
import { runInstaller } from './installer.js'
import { runUninstaller } from './uninstaller.js'

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
🚀 HelloAGENTS 安装器

用法:
  npx @huajiwuyan/hello          交互式安装
  npx @huajiwuyan/hello -u       卸载
  npx @huajiwuyan/hello -h       显示帮助

选项:
  -u, --uninstall    卸载 HelloAGENTS
  -h, --help         显示帮助信息

支持的 CLI:
  - Claude Code (~/.claude)
  - Codex CLI (~/.codex)
`)
}

/**
 * 主入口
 */
async function main(): Promise<void> {
  try {
    const { values } = parseArgs({
      options: {
        uninstall: { type: 'boolean', short: 'u' },
        help: { type: 'boolean', short: 'h' }
      }
    })

    if (values.help) {
      showHelp()
      process.exit(0)
    }

    if (values.uninstall) {
      await runUninstaller()
    } else {
      await runInstaller()
    }
  } catch (error) {
    console.error('错误:', (error as Error).message)
    process.exit(1)
  }
}

main()
