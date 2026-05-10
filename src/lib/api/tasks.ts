export async function pollTaskUntilDone(
  taskId: string,
  getTaskStatus: (taskId: string) => Promise<{ status: string; [key: string]: unknown }>,
  options?: { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal },
): Promise<{ status: string; [key: string]: unknown }> {
  const interval = options?.intervalMs ?? 1500;
  const timeout = options?.timeoutMs ?? 300_000;
  const signal = options?.signal;
  const start = Date.now();

  while (Date.now() - start < timeout) {
    signal?.throwIfAborted();

    const task = await getTaskStatus(taskId);

    if (task.status === 'done' || task.status === 'error') {
      return task;
    }

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, interval);
      signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true },
      );
    });
  }

  throw new Error(`任务 ${taskId} 超时（${timeout / 1000}s）`);
}
