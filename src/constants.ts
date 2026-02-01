import { homedir } from 'node:os'
import { join } from 'node:path'

/**
 * CLI 类型定义
 */
export type CLIType = 'claude' | 'codex' | 'both'

/**
 * CLI 配置映射
 */
export interface CLIMapping {
  /** CLI 名称 */
  name: string
  /** 默认安装路径 */
  defaultPath: string
  /** skills 目录名 */
  skillsDir: string
  /** 命令目录名 (commands 或 prompts) */
  commandDir: string
  /** 入口文件名 */
  commandFile: string
}

/**
 * 安装配置
 */
export interface InstallConfig {
  cli: CLIType
  paths: {
    claude?: string
    codex?: string
  }
}

/**
 * 安装结果
 */
export interface InstallResult {
  success: boolean
  installed: string[]
  skipped: string[]
  errors: string[]
}

/**
 * CLI 配置表
 */
export const CLI_CONFIGS: Record<'claude' | 'codex', CLIMapping> = {
  claude: {
    name: 'Claude Code',
    defaultPath: join(homedir(), '.claude'),
    skillsDir: 'skills/helloagents',
    commandDir: 'commands',
    commandFile: 'hello.md'
  },
  codex: {
    name: 'Codex CLI',
    defaultPath: join(homedir(), '.codex'),
    skillsDir: 'skills/helloagents',
    commandDir: 'prompts',
    commandFile: 'hello.md'
  }
}

/**
 * 获取默认安装路径
 */
export function getDefaultPaths(cli: CLIType): InstallConfig['paths'] {
  const paths: InstallConfig['paths'] = {}

  if (cli === 'claude' || cli === 'both') {
    paths.claude = CLI_CONFIGS.claude.defaultPath
  }
  if (cli === 'codex' || cli === 'both') {
    paths.codex = CLI_CONFIGS.codex.defaultPath
  }

  return paths
}
