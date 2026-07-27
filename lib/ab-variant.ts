const KEY = 'io_ab_variant';

export function getAbVariant(): string {
  try { return localStorage.getItem(KEY) ?? 'control'; } catch { return 'control'; }
}

export function setAbVariant(variant: string): void {
  try { localStorage.setItem(KEY, variant); } catch {}
}
