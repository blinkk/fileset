const cache = new Map<string, any>();

export function get(key: string) {
  return cache.get(key) ?? undefined;
}

export function set(key: string, value: any, expires = 15000) {
  cache.set(key, value);
  setTimeout(() => {
    cache.delete(key);
  }, expires);
}
