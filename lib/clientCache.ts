const DEFAULT_TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inflightCache = new Map<string, Promise<unknown>>();

function getStorageKey(key: string) {
  return `bluebook:${key}`;
}

function isExpired(entry: CacheEntry<unknown>) {
  return entry.expiresAt <= Date.now();
}

function readStorageEntry<T>(key: string) {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const rawValue = window.sessionStorage.getItem(getStorageKey(key));
    if (!rawValue) {
      return undefined;
    }

    const parsedValue = JSON.parse(rawValue) as CacheEntry<T>;
    if (!parsedValue || typeof parsedValue !== "object" || typeof parsedValue.expiresAt !== "number") {
      window.sessionStorage.removeItem(getStorageKey(key));
      return undefined;
    }

    if (isExpired(parsedValue as CacheEntry<unknown>)) {
      window.sessionStorage.removeItem(getStorageKey(key));
      return undefined;
    }

    return parsedValue;
  } catch {
    return undefined;
  }
}

function writeStorageEntry<T>(key: string, entry: CacheEntry<T>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(getStorageKey(key), JSON.stringify(entry));
  } catch {
    // Ignore storage write failures and keep the in-memory cache only.
  }
}

export function getClientCache<T>(key: string): T | undefined {
  const memoryEntry = memoryCache.get(key);
  if (memoryEntry) {
    if (isExpired(memoryEntry)) {
      memoryCache.delete(key);
    } else {
      return memoryEntry.value as T;
    }
  }

  const storageEntry = readStorageEntry<T>(key);
  if (!storageEntry) {
    return undefined;
  }

  memoryCache.set(key, storageEntry);
  return storageEntry.value;
}

export function setClientCache<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS) {
  const entry: CacheEntry<T> = {
    value,
    expiresAt: Date.now() + ttlMs,
  };

  memoryCache.set(key, entry);
  writeStorageEntry(key, entry);
}

export function deleteClientCache(key: string) {
  memoryCache.delete(key);
  inflightCache.delete(key);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(getStorageKey(key));
  } catch {
    // Ignore storage delete failures and continue.
  }
}

export function clearClientCache(keyPrefix?: string) {
  if (!keyPrefix) {
    memoryCache.clear();
    inflightCache.clear();

    if (typeof window !== "undefined") {
      try {
        Object.keys(window.sessionStorage)
          .filter((key) => key.startsWith("bluebook:"))
          .forEach((key) => window.sessionStorage.removeItem(key));
      } catch {
        // Ignore storage cleanup failures and continue.
      }
    }

    return;
  }

  Array.from(memoryCache.keys())
    .filter((key) => key.startsWith(keyPrefix))
    .forEach((key) => memoryCache.delete(key));
  Array.from(inflightCache.keys())
    .filter((key) => key.startsWith(keyPrefix))
    .forEach((key) => inflightCache.delete(key));

  if (typeof window === "undefined") {
    return;
  }

  try {
    Object.keys(window.sessionStorage)
      .filter((key) => key.startsWith(getStorageKey(keyPrefix)))
      .forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Ignore storage cleanup failures and continue.
  }
}

interface ReadThroughOptions {
  forceRefresh?: boolean;
  ttlMs?: number;
}

export async function readThroughClientCache<T>(
  key: string,
  load: () => Promise<T>,
  options?: ReadThroughOptions,
) {
  if (!options?.forceRefresh) {
    const cachedValue = getClientCache<T>(key);
    if (cachedValue !== undefined) {
      return cachedValue;
    }

    const inflightValue = inflightCache.get(key);
    if (inflightValue) {
      return inflightValue as Promise<T>;
    }
  }

  const request = load()
    .then((value) => {
      setClientCache(key, value, options?.ttlMs);
      inflightCache.delete(key);
      return value;
    })
    .catch((error) => {
      inflightCache.delete(key);
      throw error;
    });

  inflightCache.set(key, request);
  return request;
}
