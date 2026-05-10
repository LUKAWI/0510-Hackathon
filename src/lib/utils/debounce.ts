/**
 * 防抖函数工具
 * 延迟执行函数，在指定时间内重复调用时只执行最后一次
 */

/** 防抖函数类型 */
export interface DebouncedFunction<T extends (...args: unknown[]) => void> {
  (...args: Parameters<T>): void;
  /** 取消待执行的防抖调用 */
  cancel: () => void;
  /** 立即执行待执行的防抖调用 */
  flush: () => void;
}

/**
 * 创建防抖函数
 * @param fn - 要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数，附带 cancel 和 flush 方法
 *
 * @example
 * const debouncedSearch = debounce((query: string) => {
 *   fetchResults(query);
 * }, 300);
 *
 * // 输入时调用
 * input.addEventListener('input', (e) => debouncedSearch(e.target.value));
 *
 * // 组件卸载时取消
 * useEffect(() => {
 *   return () => debouncedSearch.cancel();
 * }, []);
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: unknown[] | null = null;

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (lastArgs !== null) {
        fn(...lastArgs as Parameters<T>);
        lastArgs = null;
      }
    }, delay);
  }) as DebouncedFunction<T>;

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (lastArgs !== null) {
      fn(...lastArgs as Parameters<T>);
      lastArgs = null;
    }
  };

  return debounced;
}
