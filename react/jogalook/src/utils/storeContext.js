const STORE_COOKIE = 'jogalook_store_context';

export function getStoreContext() {
  if (typeof document === 'undefined') return '';
  const value = document.cookie.split('; ').find((part) => part.startsWith(`${STORE_COOKIE}=`));
  return value ? decodeURIComponent(value.slice(STORE_COOKIE.length + 1)) : '';
}

export function setStoreContext(slug) {
  if (typeof document === 'undefined' || !slug) return;
  document.cookie = `${STORE_COOKIE}=${encodeURIComponent(slug)}; Path=/; Max-Age=2592000; SameSite=Lax`;
}

export function clearStoreContext() {
  if (typeof document === 'undefined') return;
  document.cookie = `${STORE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
