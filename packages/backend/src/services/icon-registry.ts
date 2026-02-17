import * as allIcons from 'lucide-static';

/**
 * Converts PascalCase to kebab-case: "ArrowUpRight" → "arrow-up-right"
 */
function toKebab(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/** kebab-case name → SVG string */
const iconMap = new Map<string, string>();

/** All available kebab-case icon names (for search) */
const iconNames: string[] = [];

// Build the lookup map once at import time
for (const [pascal, svg] of Object.entries(allIcons)) {
  if (typeof svg !== 'string') continue;
  const kebab = toKebab(pascal);
  iconMap.set(kebab, svg);
  iconNames.push(kebab);
}

/**
 * Look up an icon SVG by kebab-case name.
 * Returns undefined if not found.
 */
export function getIcon(name: string): string | undefined {
  return iconMap.get(name);
}

/**
 * Keyword aliases: common synonyms → actual icon name segments.
 */
const ALIASES: Record<string, string[]> = {
  cancel: ['x', 'circle-x', 'ban'],
  close: ['x', 'circle-x'],
  cross: ['x'],
  delete: ['trash', 'x'],
  remove: ['trash', 'minus', 'x'],
  add: ['plus', 'circle-plus'],
  growth: ['trending-up', 'chart-line'],
  decline: ['trending-down', 'chart-bar-decreasing'],
  money: ['dollar-sign', 'banknote', 'wallet', 'coins'],
  dollar: ['dollar-sign', 'banknote', 'circle-dollar-sign'],
  secure: ['shield', 'lock'],
  security: ['shield', 'lock'],
  fast: ['zap', 'rocket', 'gauge'],
  speed: ['zap', 'rocket', 'gauge'],
  time: ['clock', 'timer', 'hourglass'],
  email: ['mail', 'at-sign'],
  phone: ['phone', 'smartphone'],
  settings: ['settings', 'sliders-horizontal', 'wrench'],
  warning: ['alert-triangle', 'triangle-alert'],
  error: ['alert-circle', 'circle-alert', 'circle-x'],
  success: ['check', 'circle-check', 'circle-check-big'],
  ok: ['check', 'circle-check', 'thumbs-up'],
  yes: ['check', 'circle-check'],
  no: ['x', 'circle-x', 'ban'],
  team: ['users', 'user'],
  people: ['users', 'user'],
  person: ['user'],
  graph: ['chart-line', 'chart-bar', 'chart-area'],
  analytics: ['chart-bar', 'chart-line', 'bar-chart-3'],
  ai: ['brain', 'sparkles', 'bot'],
  idea: ['lightbulb'],
  globe: ['globe', 'earth'],
  world: ['globe', 'earth'],
  document: ['file', 'file-text'],
  folder: ['folder', 'folder-open'],
  link: ['link', 'external-link'],
  image: ['image', 'camera'],
  photo: ['image', 'camera'],
  video: ['video', 'play', 'film'],
  music: ['music', 'headphones'],
  search: ['search'],
  find: ['search'],
  home: ['home', 'house'],
  save: ['save', 'download'],
  edit: ['pencil', 'pen'],
  copy: ['copy', 'clipboard'],
  share: ['share', 'share-2'],
  send: ['send'],
  upload: ['upload', 'cloud-upload'],
  download: ['download', 'cloud-download'],
  notification: ['bell'],
  message: ['message-square', 'message-circle'],
  chat: ['message-square', 'message-circle', 'messages-square'],
  calendar: ['calendar', 'calendar-days'],
  location: ['map-pin', 'map'],
  navigation: ['compass', 'navigation'],
  target: ['target', 'crosshair'],
  eye: ['eye'],
  visible: ['eye'],
  hidden: ['eye-off'],
  expand: ['maximize', 'arrows-maximize'],
  collapse: ['minimize'],
  refresh: ['refresh-cw', 'rotate-cw'],
  sync: ['refresh-cw'],
  network: ['network', 'wifi'],
  database: ['database', 'server'],
  code: ['code', 'terminal', 'braces'],
  bug: ['bug'],
};

/**
 * Search icons by keyword. Supports multi-word queries and aliases.
 * Scoring: exact > alias > prefix > segment > substring.
 */
export function searchIcons(query: string, limit = 20): string[] {
  const q = query.toLowerCase().trim();

  // Split multi-word queries into individual terms
  const terms = q.split(/[\s,+]+/).filter(Boolean);

  // Collect results with deduplication
  const seen = new Set<string>();
  const exact: string[] = [];
  const alias: string[] = [];
  const prefix: string[] = [];
  const segment: string[] = [];
  const substring: string[] = [];

  // Check aliases first for each term
  for (const term of terms) {
    const aliasMatches = ALIASES[term];
    if (aliasMatches) {
      for (const aliasName of aliasMatches) {
        // Find icons matching the alias
        for (const name of iconNames) {
          if (seen.has(name)) continue;
          if (name === aliasName || name.startsWith(`${aliasName}-`) || name.endsWith(`-${aliasName}`)) {
            seen.add(name);
            alias.push(name);
          }
        }
      }
    }
  }

  // Then search each term against icon names
  for (const term of terms) {
    for (const name of iconNames) {
      if (seen.has(name)) continue;

      if (name === term) {
        seen.add(name);
        exact.push(name);
      } else if (name.startsWith(term)) {
        seen.add(name);
        prefix.push(name);
      } else if (name.includes(`-${term}`) || name.includes(`${term}-`)) {
        seen.add(name);
        segment.push(name);
      } else if (name.includes(term)) {
        seen.add(name);
        substring.push(name);
      }
    }
  }

  return [...exact, ...alias, ...prefix, ...segment, ...substring].slice(0, limit);
}

/**
 * Prepare an icon SVG for embedding: set size, replace currentColor, optional stroke-width.
 */
export function prepareIconSvg(
  svg: string,
  color: string,
  size: number,
  strokeWidth?: number,
): string {
  let result = svg;

  // Replace size attributes
  result = result.replace(/width="24"/g, `width="${size}"`);
  result = result.replace(/height="24"/g, `height="${size}"`);

  // Replace currentColor with the specified color
  result = result.replace(/currentColor/g, color);

  // Optionally override stroke-width
  if (strokeWidth !== undefined) {
    result = result.replace(/stroke-width="2"/g, `stroke-width="${strokeWidth}"`);
  }

  // Collapse to single line for clean embedding (preserve spaces between attributes)
  result = result.replace(/\n\s*/g, ' ').replace(/> </g, '><').trim();

  return result;
}

/**
 * Total number of available icons.
 */
export const iconCount = iconNames.length;
