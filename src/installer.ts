import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as p from '@clack/prompts'
import { CLI_CONFIGS, type InstallConfig, type InstallResult } from './constants.js'
import { copyDir, copyFile, ensureDir, exists } from './utils/fs.js'
import { askInstallOptions } from './prompts.js'

// 获取 templates 目录路径
const __dirname = dirname(fileURLToPath(import.meta.url))
const templatesDir = join(__dirname, '..', 'templates')

/**
 * 安装单个 CLI
 */
function installCLI(
  cliType: 'claude' | 'codex',
  basePath: string,
  result: InstallResult
): void {
  const config = CLI_CONFIGS[cliType]
  const templatePath = join(templatesDir, cliType)

  // 复制 skills 目录
  const skillsSrc = join(templatePath, 'skills', 'helloagents')
  const skillsDest = join(basePath, config.skillsDir)

  try {
    if (exists(skillsSrc)) {
      copyDir(skillsSrc, skillsDest)
      result.installed.push(skillsDest)
    } else {
      result.errors.push(`Skills 模板不存在: ${skillsSrc}`)
    }
  } catch (error) {
    result.errors.push(`复制 skills 失败: ${(error as Error).message}`)
  }

  // 复制命令入口文件
  const commandSrc = join(templatePath, config.commandDir, config.commandFile)
  const commandDest = join(basePath, config.commandDir, config.commandFile)

  try {
    if (exists(commandSrc)) {
      ensureDir(dirname(commandDest))
      copyFile(commandSrc, commandDest)
      result.installed.push(commandDest)
    } else {
      result.errors.push(`命令模板不存在: ${commandSrc}`)
    }
  } catch (error) {
    result.errors.push(`复制命令文件失败: ${(error as Error).message}`)
  }
}

/**
 * 执行安装
 */
async function install(config: InstallConfig): Promise<InstallResult> {
  const result: InstallResult = {
    success: true,
    installed: [],
    skipped: [],
    errors: []
  }

  const s = p.spinner()
  s.start('安装中...')

  try {
    // 安装 Claude
    if (config.paths.claude) {
      installCLI('claude', config.paths.claude, result)
    }

    // 安装 Codex
    if (config.paths.codex) {
      installCLI('codex', config.paths.codex, result)
    }

    if (result.errors.length > 0) {
      result.success = false
    }
  } catch (error) {
    result.success = false
    result.errors.push((error as Error).message)
  }

  s.stop(result.success ? '安装完成' : '安装过程中出现错误')

  return result
}

/**
 * 运行安装流程
 */
export async function runInstaller(): Promise<void> {
  try {
    const config = await askInstallOptions()

    if (!config) {
      process.exit(0)
    }

    const result = await install(config)

    // 输出结果
    if (result.installed.length > 0) {
      p.log.success('已安装:')
      for (const file of result.installed) {
        p.log.message(`  ✓ ${file}`)
      }
    }

    if (result.skipped.length > 0) {
      p.log.warning('已跳过:')
      for (const file of result.skipped) {
        p.log.message(`  - ${file}`)
      }
    }

    if (result.errors.length > 0) {
      p.log.error('错误:')
      for (const error of result.errors) {
        p.log.message(`  ✗ ${error}`)
      }
    }

    if (result.success) {
      p.outro('✅ 安装完成！使用 /hello 启动')
    } else {
      p.outro('⚠️ 安装完成，但存在错误')
      process.exit(1)
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EACCES') {
      p.log.error('权限不足，请检查目录权限或使用 sudo')
    } else if ((error as NodeJS.ErrnoException).code === 'ENOSPC') {
      p.log.error('磁盘空间不足')
    } else {
      p.log.error(`安装失败: ${(error as Error).message}`)
    }
    process.exit(1)
  }
}
