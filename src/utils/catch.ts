export function to<T = any, U = Error>(
  request: Promise<T>
): Promise<[null, T] | [U, undefined]> {
  return request
    .then<[null, T]>((result) => {
      return [null, result];
    })
    .catch<[U, undefined]>((err: U) => {
      return [err, undefined];
    });
}

export async function handleTask<T>(
  taskPromise: Promise<T>,
  defaultValue: T
): Promise<T> {
  try {
    return await taskPromise;
  } catch (error) {
    console.error("Task failed:", error);
    return defaultValue;
  }
}
