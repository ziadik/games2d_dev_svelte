import { browser } from "$app/environment";

// Initial values
const defaults = {
  fontSize: 22,
  fontWeight: 700,
  textColor: "#e8c84a",
  bgColor: "#050508",
};

let current = $state({ ...defaults });

// Load from localStorage on init
if (browser) {
  const stored = localStorage.getItem("tablo_settings");
  if (stored) {
    try {
      current = { ...defaults, ...JSON.parse(stored) };
    } catch (e) {
      console.error(e);
    }
  }

  // Apply initial styles
  applyStyles();
}

function applyStyles() {
  if (!browser) return;
  const root = document.documentElement;
  root.style.setProperty("--text-color", current.textColor);
  root.style.setProperty("--bg-color", current.bgColor);

  // We apply font props directly to elements via style binding in components,
  // but we can set global defaults here if needed.
}

export function updateSetting(key, value) {
  current[key] = value;
  if (browser) {
    localStorage.setItem("tablo_settings", JSON.stringify(current));
    applyStyles();
  }
}

export function resetSettings() {
  current = { ...defaults };
  if (browser) {
    localStorage.removeItem("tablo_settings");
    applyStyles();
    location.reload();
  }
}

export { current as settings };
