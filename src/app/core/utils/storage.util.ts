export function readStorage<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }

    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private modes or full quotas; UI should keep working.
  }
}

export function readStringStorage(key: string, fallback: string | null = null): string | null {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStringStorage(key: string, value: string | null): void {
  try {
    if (value === null) {
      localStorage.removeItem(key);
      return;
    }

    localStorage.setItem(key, value);
  } catch {
    // Keep the in-memory signal state authoritative if persistence fails.
  }
}
