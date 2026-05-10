/**
 * 轮询工具 - 支持指数退避
 * 用于异步任务状态查询（文档解析、知识提取、图谱构建等）
 */

/** 轮询配置选项 */
export interface PollingOptions {
  /** 初始轮询间隔（毫秒），默认 1000 */
  readonly initialInterval?: number;
  /** 最大轮询间隔（毫秒），默认 30000 */
  readonly maxInterval?: number;
  /** 退避倍数，默认 1.5 */
  readonly backoffFactor?: number;
  /** 最大轮询次数，默认 Infinity */
  readonly maxAttempts?: number;
  /** 超时时间（毫秒），默认 300000（5分钟） */
  readonly timeout?: number;
  /** AbortSignal 用于取消轮询 */
  readonly signal?: AbortSignal;
}

/** 轮询状态 */
export type PollingStatus = 'pending' | 'polling' | 'completed' | 'failed' | 'cancelled';

/** 轮询结果 */
export interface PollingResult<T> {
  readonly status: PollingStatus;
  readonly data?: T;
  readonly error?: Error;
  readonly attempts: number;
  readonly elapsed: number;
}

/** 轮询控制器 */
export interface PollingController<T> {
  /** 停止轮询 */
  cancel: () => void;
  /** 等待轮询完成 */
  readonly result: Promise<PollingResult<T>>;
}

/**
 * 创建轮询任务
 * @param pollFn - 轮询函数，返回结果或 null（表示继续轮询）
 * @param options - 轮询配置
 * @returns 轮询控制器
 *
 * @example
 * const controller = poll(
 *   async () => {
 *     const task = await getTaskStatus(taskId);
 *     if (task.status === 'done') return task;
 *     if (task.status === 'error') throw new Error(task.error);
 *     return null; // 继续轮询
 *   },
 *   { initialInterval: 2000, maxInterval: 15000 }
 * );
 *
 * // 可以取消
 * controller.cancel();
 *
 * // 等待结果
 * const result = await controller.result;
 */
export function poll<T>(
  pollFn: () => Promise<T | null>,
  options: PollingOptions = {},
): PollingController<T> {
  const {
    initialInterval = 1000,
    maxInterval = 30_000,
    backoffFactor = 1.5,
    maxAttempts = Infinity,
    timeout = 300_000,
    signal,
  } = options;

  let cancelled = false;
  let currentTimeout: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    cancelled = true;
    if (currentTimeout !== null) {
      clearTimeout(currentTimeout);
      currentTimeout = null;
    }
  };

  // 监听外部 AbortSignal
  if (signal) {
    if (signal.aborted) {
      cancel();
    } else {
      signal.addEventListener('abort', cancel, { once: true });
    }
  }

  const result = new Promise<PollingResult<T>>((resolve) => {
    let attempts = 0;
    let currentInterval = initialInterval;
    const startTime = Date.now();

    const executePoll = async () => {
      while (!cancelled) {
        attempts++;

        // 检查超时
        const elapsed = Date.now() - startTime;
        if (elapsed >= timeout) {
          resolve({
            status: 'failed',
            error: new Error(`轮询超时：已等待 ${Math.round(elapsed / 1000)} 秒`),
            attempts,
            elapsed,
          });
          return;
        }

        // 检查最大尝试次数
        if (attempts > maxAttempts) {
          resolve({
            status: 'failed',
            error: new Error(`已达最大轮询次数：${maxAttempts}`),
            attempts: attempts - 1,
            elapsed,
          });
          return;
        }

        try {
          const data = await pollFn();

          if (cancelled) {
            resolve({
              status: 'cancelled',
              attempts: attempts - 1,
              elapsed: Date.now() - startTime,
            });
            return;
          }

          // 返回了结果，轮询完成
          if (data !== null) {
            resolve({
              status: 'completed',
              data,
              attempts,
              elapsed: Date.now() - startTime,
            });
            return;
          }

          // 继续轮询，使用指数退避
          await sleep(currentInterval, () => cancelled);
          currentInterval = Math.min(currentInterval * backoffFactor, maxInterval);
        } catch (error) {
          resolve({
            status: 'failed',
            error: error instanceof Error ? error : new Error(String(error)),
            attempts,
            elapsed: Date.now() - startTime,
          });
          return;
        }
      }

      // 被取消
      resolve({
        status: 'cancelled',
        attempts: attempts - 1,
        elapsed: Date.now() - startTime,
      });
    };

    executePoll();
  });

  return { cancel, result };
}

/**
 * 可取消的 sleep
 */
function sleep(ms: number, isCancelled: () => boolean): Promise<void> {
  return new Promise<void>((resolve) => {
    if (isCancelled()) {
      resolve();
      return;
    }

    const timer = setTimeout(resolve, ms);

    // 定期检查是否被取消
    const checkInterval = setInterval(() => {
      if (isCancelled()) {
        clearTimeout(timer);
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // 清理检查定时器
    setTimeout(() => clearInterval(checkInterval), ms + 100);
  });
}
