declare const __HOC_DATA_VERSION__: string | undefined;
declare const __HOC_ICON_VERSION__: string | undefined;

const HOC_DATA_VERSION =
  typeof __HOC_DATA_VERSION__ !== 'undefined' ? __HOC_DATA_VERSION__ : 'dev';
const HOC_ICON_VERSION =
  typeof __HOC_ICON_VERSION__ !== 'undefined' ? __HOC_ICON_VERSION__ : 'dev';

function withVersion(path: string, version: string): string {
  const join = path.includes('?') ? '&' : '?';
  return `${path}${join}v=${encodeURIComponent(version)}`;
}

/** Cache-bust JSON under /assets/data/hoc (and hoc_config.json). */
export function hocAssetUrl(path: string): string {
  return withVersion(path, HOC_DATA_VERSION);
}

export function hocIconUrl(): string {
  return withVersion('/assets/images/items/hoc_icon_equipment.webp', HOC_ICON_VERSION);
}

export function applyHocIconCacheBust(): void {
  document.documentElement.style.setProperty('--hoc-icon-equipment', `url("${hocIconUrl()}")`);
}
