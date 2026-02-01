import * as p from '@clack/prompts'
import { CLI_CONFIGS, type InstallConfig } from './constants.js'
import { remove, exists } from './utils/fs.js'
import { askUninstallOptions } from './prompts.js'

/**
 * 卸载单个 CLI
 */
function uninstallCLI(
  cliType: 'claude' | 'codex',
  basePath: string,
  deleted: string[],
  errors: string[]
): void {
  const config = CLI_CONFIGS[cliType]

  // 删除 skills 目录
  const skillsPath = `${basePath}/${config.skillsDir}`
  try {
    if (exists(skillsPath)) {
      remove(skillsPath)
      deleted.push(skillsPath)
    }
  } catch (error) {
    errors.push(`删除 skills 失败: ${(error as Error).message}`)
  }

  // 删除命令入口文件
  const commandPath = `${basePath}/${config.commandDir}/${config.commandFile}`
  try {
    if (exists(commandPath)) {
      remove(commandPath)
      deleted.push(commandPath)
    }
  } catch (error) {
    errors.push(`删除命令文件失败: ${(error as Error).message}`)
  }
}

/**
 * 执行卸载
 */
async function uninstall(config: { cli: InstallConfig['cli']; paths: InstallConfig['paths'] }): Promise<{ deleted: string[]; errors: string[] }> {
  const deleted: string[] = []
  const errors: string[] = []

  const s = p.spinner()
  s.start('卸载中...')

  try {
    if (config.paths.claude) {
      uninstallCLI('claude', config.paths.claude, deleted, errors)
    }

    if (config.paths.codex) {
      uninstallCLI('codex', config.paths.codex, deleted, errors)
    }
  } catch (error) {
    errors.push((error as Error).message)
  }

  s.stop(errors.length === 0 ? '卸载完成' : '卸载过程中出现错误')

  return { deleted, errors }
}

/**
 * 运行卸载流程
 */
export async function runUninstaller(): Promise<void> {
  try {
    const config = await askUninstallOptions()

    if (!config) {
      process.exit(0)
    }

    const { deleted, errors } = await uninstall(config)

    if (deleted.length > 0) {
      p.log.success('已删除:')
      for (const file of deleted) {
        p.log.message(`  ✓ ${file}`)
      }
    }

    if (errors.length > 0) {
      p.log.error('错误:')
      for (const error of errors) {
        p.log.message(`  ✗ ${error}`)
      }
    }

    if (errors.length === 0) {
      p.outro('✅ 卸载完成')
    } else {
      p.outro('⚠️ 卸载完成，但存在错误')
      process.exit(1)
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EACCES') {
      p.log.error('权限不足，请检查目录权限或使用 sudo')
    } else {
      p.log.error(`卸载失败: ${(error as Error).message}`)
    }
    process.exit(1)
  }
}
