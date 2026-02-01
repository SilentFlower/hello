import * as p from '@clack/prompts'
import { CLI_CONFIGS, getDefaultPaths, type CLIType, type InstallConfig } from './constants.js'
import { expandHome } from './utils/platform.js'
import { exists } from './utils/fs.js'

/**
 * 运行安装交互流程
 * @returns 安装配置
 */
export async function askInstallOptions(): Promise<InstallConfig | null> {
  p.intro('🚀 HelloAGENTS 安装器')

  // 选择 CLI 类型
  const cli = await p.select({
    message: '选择要安装的 CLI',
    options: [
      { value: 'claude', label: 'Claude Code', hint: '~/.claude' },
      { value: 'codex', label: 'Codex CLI', hint: '~/.codex' },
      { value: 'both', label: '两者都安装' }
    ]
  }) as CLIType

  if (p.isCancel(cli)) {
    p.cancel('安装已取消')
    return null
  }

  // 询问是否自定义路径
  const customPath = await p.confirm({
    message: '是否自定义安装路径？',
    initialValue: false
  })

  if (p.isCancel(customPath)) {
    p.cancel('安装已取消')
    return null
  }

  let paths = getDefaultPaths(cli)

  if (customPath) {
    const customPaths = await askCustomPaths(cli)
    if (!customPaths) return null
    paths = customPaths
  }

  // 检查已存在的安装
  const existingPaths = checkExistingInstall(cli, paths)
  if (existingPaths.length > 0) {
    const overwrite = await p.select({
      message: '检测到已安装的 HelloAGENTS',
      options: [
        { value: 'overwrite', label: '覆盖现有文件' },
        { value: 'skip', label: '跳过已存在的文件' },
        { value: 'cancel', label: '取消安装' }
      ]
    })

    if (p.isCancel(overwrite) || overwrite === 'cancel') {
      p.cancel('安装已取消')
      return null
    }

    // 如果选择跳过，标记需要跳过的路径
    if (overwrite === 'skip') {
      for (const existing of existingPaths) {
        if (existing === 'claude') paths.claude = undefined
        if (existing === 'codex') paths.codex = undefined
      }
    }
  }

  return { cli, paths }
}

/**
 * 询问自定义路径
 */
async function askCustomPaths(cli: CLIType): Promise<InstallConfig['paths'] | null> {
  const paths: InstallConfig['paths'] = {}

  if (cli === 'claude' || cli === 'both') {
    const claudePath = await p.text({
      message: 'Claude Code 安装路径',
      placeholder: CLI_CONFIGS.claude.defaultPath,
      defaultValue: CLI_CONFIGS.claude.defaultPath,
      validate: (value) => {
        if (!value) return '请输入路径'
        return undefined
      }
    })

    if (p.isCancel(claudePath)) {
      p.cancel('安装已取消')
      return null
    }
    paths.claude = expandHome(claudePath as string)
  }

  if (cli === 'codex' || cli === 'both') {
    const codexPath = await p.text({
      message: 'Codex CLI 安装路径',
      placeholder: CLI_CONFIGS.codex.defaultPath,
      defaultValue: CLI_CONFIGS.codex.defaultPath,
      validate: (value) => {
        if (!value) return '请输入路径'
        return undefined
      }
    })

    if (p.isCancel(codexPath)) {
      p.cancel('安装已取消')
      return null
    }
    paths.codex = expandHome(codexPath as string)
  }

  return paths
}

/**
 * 检查已存在的安装
 */
function checkExistingInstall(cli: CLIType, paths: InstallConfig['paths']): string[] {
  const existing: string[] = []

  if ((cli === 'claude' || cli === 'both') && paths.claude) {
    const skillsPath = `${paths.claude}/${CLI_CONFIGS.claude.skillsDir}`
    if (exists(skillsPath)) existing.push('claude')
  }

  if ((cli === 'codex' || cli === 'both') && paths.codex) {
    const skillsPath = `${paths.codex}/${CLI_CONFIGS.codex.skillsDir}`
    if (exists(skillsPath)) existing.push('codex')
  }

  return existing
}

/**
 * 运行卸载交互流程
 */
export async function askUninstallOptions(): Promise<{ cli: CLIType; paths: InstallConfig['paths'] } | null> {
  p.intro('🗑️  HelloAGENTS 卸载器')

  // 检测已安装的 CLI
  const installed: Array<{ value: CLIType; label: string }> = []
  const claudePath = CLI_CONFIGS.claude.defaultPath
  const codexPath = CLI_CONFIGS.codex.defaultPath

  const claudeInstalled = exists(`${claudePath}/${CLI_CONFIGS.claude.skillsDir}`)
  const codexInstalled = exists(`${codexPath}/${CLI_CONFIGS.codex.skillsDir}`)

  if (claudeInstalled) installed.push({ value: 'claude', label: 'Claude Code' })
  if (codexInstalled) installed.push({ value: 'codex', label: 'Codex CLI' })

  if (installed.length === 0) {
    p.log.warning('未检测到已安装的 HelloAGENTS')
    p.outro('无需卸载')
    return null
  }

  if (installed.length === 2) {
    installed.push({ value: 'both', label: '两者都卸载' })
  }

  const cli = await p.select({
    message: '选择要卸载的 CLI',
    options: installed
  }) as CLIType

  if (p.isCancel(cli)) {
    p.cancel('卸载已取消')
    return null
  }

  // 显示将删除的文件
  const toDelete: string[] = []
  const paths: InstallConfig['paths'] = {}

  if (cli === 'claude' || cli === 'both') {
    paths.claude = claudePath
    toDelete.push(`${claudePath}/${CLI_CONFIGS.claude.skillsDir}`)
    toDelete.push(`${claudePath}/${CLI_CONFIGS.claude.commandDir}/${CLI_CONFIGS.claude.commandFile}`)
  }
  if (cli === 'codex' || cli === 'both') {
    paths.codex = codexPath
    toDelete.push(`${codexPath}/${CLI_CONFIGS.codex.skillsDir}`)
    toDelete.push(`${codexPath}/${CLI_CONFIGS.codex.commandDir}/${CLI_CONFIGS.codex.commandFile}`)
  }

  p.log.info('将删除以下文件:')
  for (const file of toDelete) {
    p.log.message(`  - ${file}`)
  }

  const confirm = await p.confirm({
    message: '确认卸载？',
    initialValue: false
  })

  if (p.isCancel(confirm) || !confirm) {
    p.cancel('卸载已取消')
    return null
  }

  return { cli, paths }
}
