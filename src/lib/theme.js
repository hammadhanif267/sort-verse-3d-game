// Offline-only visual themes. Piece colours, level mechanics and rewards do not change.
export const THEME_KEY = "sortverse-setting-theme";
export const DEFAULT_THEME = "neon";
export const THEMES = [
  { id: "neon", name: "Midnight Blue", description: "Original SortVerse look", colors: ["#020912", "#063853", "#55cfff"] },
  { id: "forest", name: "Emerald", description: "Deep green and mint", colors: ["#051510", "#135040", "#73e8b2"] },
  { id: "royal", name: "Royal Purple", description: "Violet and lavender", colors: ["#100a22", "#45246b", "#cd94ff"] },
  { id: "sunset", name: "Amber Sunset", description: "Warm copper and gold", colors: ["#1a0e0c", "#633323", "#ffb766"] },
];
const THEME_IDS = new Set(THEMES.map(({ id }) => id));
const CHANGE_EVENT = "sortverse-theme-change";

export function normalizeTheme(theme) {
  return THEME_IDS.has(theme) ? theme : DEFAULT_THEME;
}

export function getTheme() {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try { return normalizeTheme(window.localStorage.getItem(THEME_KEY)); }
  catch { return DEFAULT_THEME; }
}

export function applyTheme(theme) {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.sortverseTheme = normalizeTheme(theme);
  }
}

export function applySavedTheme() {
  applyTheme(getTheme());
}

export function subscribeToTheme(onChange) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event) => {
    if (!event || event.key === THEME_KEY || event.key === null) {
      applySavedTheme();
      onChange();
    }
  };
  const onThemeChange = () => onChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onThemeChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onThemeChange);
  };
}

export function setTheme(theme) {
  const valid = normalizeTheme(theme);
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, valid);
  applyTheme(valid);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
