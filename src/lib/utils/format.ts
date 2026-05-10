/**
 * 格式化工具函数
 * 提供文件大小、日期、百分比等常用格式化功能
 */

/** 文件大小单位 */
const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * 格式化文件大小
 * @param bytes - 字节数
 * @returns 格式化后的文件大小字符串（如 "1.5 MB"）
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 0) return '0 B';
  if (bytes === 0) return '0 B';

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    FILE_SIZE_UNITS.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  // 对于字节单位不显示小数
  if (exponent === 0) {
    return `${bytes} B`;
  }

  return `${value.toFixed(exponent > 1 ? 2 : 1)} ${FILE_SIZE_UNITS[exponent]}`;
}

/**
 * 格式化日期
 * @param date - ISO 日期字符串或 Date 对象
 * @param format - 输出格式：'short'（默认）| 'long' | 'relative'
 * @returns 格式化后的日期字符串
 *
 * @example
 * formatFileSize(1536) // "1.5 KB"
 * formatDate('2026-05-10T14:30:00Z') // "2026-05-10"
 * formatDate('2026-05-10T14:30:00Z', 'long') // "2026年5月10日 14:30"
 * formatDate('2026-05-10T14:30:00Z', 'relative') // "刚刚"
 */
export function formatDate(
  date: string | Date,
  format: 'short' | 'long' | 'relative' = 'short',
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return '无效日期';
  }

  if (format === 'relative') {
    return formatRelativeDate(d);
  }

  if (format === 'long') {
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // short 格式：YYYY-MM-DD
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 格式化相对时间
 */
function formatRelativeDate(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;
  return `${Math.floor(days / 365)} 年前`;
}

/**
 * 格式化百分比
 * @param value - 0-1 之间的小数，或 0-100 之间的数值
 * @param options - 配置选项
 * @returns 格式化后的百分比字符串（如 "85.5%"）
 */
export function formatPercentage(
  value: number,
  options: { decimals?: number; isNormalized?: boolean } = {},
): string {
  const { decimals = 1, isNormalized = true } = options;

  if (isNaN(value) || !isFinite(value)) return '0%';

  const percent = isNormalized ? value * 100 : value;
  const clamped = Math.max(0, Math.min(100, percent));

  // 整数时不显示小数
  if (clamped === Math.floor(clamped)) {
    return `${Math.floor(clamped)}%`;
  }

  return `${clamped.toFixed(decimals)}%`;
}

/**
 * 截断文本
 * @param text - 原始文本
 * @param maxLength - 最大长度
 * @param suffix - 截断后缀（默认 "..."）
 */
export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 格化数字（添加千分位分隔符）
 * @param num - 数值
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}
