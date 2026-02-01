import { existsSync, mkdirSync, cpSync, rmSync, readdirSync, statSync } from 'node:fs'
import { dirname } from 'node:path'

/**
 * 确保目录存在，不存在则创建
 * @param dirPath 目录路径
 */
export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true })
  }
}

/**
 * 复制目录
 * @param src 源目录
 * @param dest 目标目录
 */
export function copyDir(src: string, dest: string): void {
  ensureDir(dirname(dest))
  cpSync(src, dest, { recursive: true })
}

/**
 * 复制文件
 * @param src 源文件
 * @param dest 目标文件
 */
export function copyFile(src: string, dest: string): void {
  ensureDir(dirname(dest))
  cpSync(src, dest)
}

/**
 * 删除目录或文件
 * @param targetPath 目标路径
 */
export function remove(targetPath: string): void {
  if (existsSync(targetPath)) {
    rmSync(targetPath, { recursive: true, force: true })
  }
}

/**
 * 检查路径是否存在
 * @param targetPath 目标路径
 * @returns 是否存在
 */
export function exists(targetPath: string): boolean {
  return existsSync(targetPath)
}

/**
 * 检查是否为目录
 * @param targetPath 目标路径
 * @returns 是否为目录
 */
export function isDirectory(targetPath: string): boolean {
  if (!existsSync(targetPath)) return false
  return statSync(targetPath).isDirectory()
}

/**
 * 列出目录内容
 * @param dirPath 目录路径
 * @returns 文件/目录名列表
 */
export function listDir(dirPath: string): string[] {
  if (!existsSync(dirPath)) return []
  return readdirSync(dirPath)
}
