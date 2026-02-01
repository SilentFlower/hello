import { homedir } from 'node:os'

/**
 * 展开路径中的 ~ 为用户主目录
 * @param inputPath 输入路径
 * @returns 展开后的路径
 */
export function expandHome(inputPath: string): string {
  if (inputPath.startsWith('~')) {
    return inputPath.replace('~', homedir())
  }
  return inputPath
}

/**
 * 获取当前平台类型
 * @returns 平台类型
 */
export function getPlatform(): 'windows' | 'unix' {
  return process.platform === 'win32' ? 'windows' : 'unix'
}

/**
 * 标准化路径分隔符
 * @param inputPath 输入路径
 * @returns 标准化后的路径
 */
export function normalizePath(inputPath: string): string {
  // Node.js path 模块会自动处理分隔符
  return inputPath.replace(/\\/g, '/')
}
