/**
 * XSS 清理工具
 * 防止跨站脚本攻击，清理用户输入中的恶意内容
 */

/** HTML 特殊字符映射 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

/** 匹配 HTML 特殊字符的正则 */
const HTML_ESCAPE_REGEX = /[&<>"'`/]/g;

/**
 * 转义 HTML 特殊字符
 * @param str - 原始字符串
 * @returns 转义后的安全字符串
 *
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
 */
export function escapeHtml(str: string): string {
  return str.replace(HTML_ESCAPE_REGEX, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/** 危险的 URL 协议 */
const DANGEROUS_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

/** 安全的 URL 协议 */
const SAFE_PROTOCOLS = /^(https?|mailto|tel|ftp):/i;

/**
 * 清理 URL，防止 javascript: 等危险协议
 * @param url - 原始 URL
 * @returns 安全的 URL 或空字符串
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();

  if (!trimmed) return '';

  // 允许相对路径
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return trimmed;
  }

  // 检查协议
  if (DANGEROUS_PROTOCOLS.test(trimmed)) {
    return '';
  }

  if (SAFE_PROTOCOLS.test(trimmed)) {
    return trimmed;
  }

  // 没有协议的视为相对路径
  if (!trimmed.includes(':')) {
    return trimmed;
  }

  return '';
}

/** 允许的 HTML 标签（白名单） */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's',
  'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'span', 'div',
]);

/**
 * 清理 HTML 内容（简单白名单方案）
 * 移除不在白名单中的标签和属性
 * @param html - 原始 HTML
 * @returns 清理后的安全 HTML
 */
export function sanitizeHtml(html: string): string {
  // 移除 script/style 标签及其内容
  let cleaned = html.replace(/<(script|style|iframe|object|embed|form)[^>]*>[\s\S]*?<\/\1>/gi, '');

  // 移除所有 on* 事件属性
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, '');

  // 移除不在白名单中的标签
  cleaned = cleaned.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag) => {
    const lowerTag = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(lowerTag)) {
      return '';
    }

    // 对于 a 标签，清理 href
    if (lowerTag === 'a') {
      return match.replace(/href\s*=\s*["']([^"']*)["']/gi, (_, url) => {
        const safeUrl = sanitizeUrl(url);
        return safeUrl ? `href="${safeUrl}"` : '';
      });
    }

    return match;
  });

  return cleaned;
}

/**
 * 清理用户输入文本（用于显示）
 * @param input - 用户输入
 * @returns 安全的纯文本
 */
export function sanitizeText(input: string): string {
  return escapeHtml(input.trim());
}

/**
 * 清理 Markdown 内容（防止注入）
 * @param markdown - Markdown 文本
 * @returns 安全的 Markdown
 */
export function sanitizeMarkdown(markdown: string): string {
  // 移除 HTML 标签
  let cleaned = markdown.replace(/<[^>]*>/g, '');

  // 清理链接中的危险 URL
  cleaned = cleaned.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_match, text, url) => {
    const safeUrl = sanitizeUrl(url);
    return safeUrl ? `[${text}](${safeUrl})` : text;
  });

  return cleaned;
}
