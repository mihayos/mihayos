/* =========================================================
   Mihayo's Safaris — i18n Engine
   Applies TRANSLATIONS (see translations.js) to any element
   carrying data-i18n="key" (text) or data-i18n-ph="key" (placeholder)
   NOTE: language choice is kept in memory for this page view only
   (no browser storage is used), so it resets to English on reload —
   swap the setLang() call below for a cookie/session value once
   this is wired to a backend.
   ========================================================= */

const LANG_LS_KEY = "mihayo_lang";
let currentLang = DEFAULT_LANG;

function applyTranslations(lang) {
  // normalize input and fallback
  let chosen = (lang || "").toLowerCase();
  if (!TRANSLATIONS[chosen]) chosen = DEFAULT_LANG;
  currentLang = chosen;
  document.documentElement.setAttribute("lang", lang);
  document.documentElement.setAttribute("lang", currentLang);
  const isRTL = (currentLang === "ar");
  document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  document.body.classList.toggle("rtl-mode", isRTL);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const dict = TRANSLATIONS[currentLang] || {};
    const defaultDict = TRANSLATIONS[DEFAULT_LANG] || {};
    const text = (dict[key] !== undefined)
      ? dict[key]
      : (defaultDict[key] !== undefined ? defaultDict[key] : el.textContent);
    el.textContent = text;
  });

  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    const key = el.getAttribute("data-i18n-ph");
    const dict = TRANSLATIONS[currentLang] || {};
    const defaultDict = TRANSLATIONS[DEFAULT_LANG] || {};
    const ph = (dict[key] !== undefined)
      ? dict[key]
      : (defaultDict[key] !== undefined ? defaultDict[key] : (el.getAttribute('placeholder') || ''));
    el.setAttribute("placeholder", ph);
  });

  document.querySelectorAll(".lang-current").forEach((el) => {
    el.textContent = currentLang.toUpperCase();
  });

  document.querySelectorAll("[data-lang-option]").forEach((el) => {
    el.classList.toggle("active", el.getAttribute("data-lang-option") === currentLang);
  });
}

function setLang(lang) {
  // normalize and apply
  const normalized = (lang || "").toLowerCase();
  applyTranslations(normalized);
  try {
    if (currentLang === DEFAULT_LANG) {
      localStorage.removeItem(LANG_LS_KEY);
    } else {
      localStorage.setItem(LANG_LS_KEY, currentLang);
    }
  } catch (e) {
    /* ignore storage errors (privacy mode) */
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // prefer saved language from localStorage when available
  let saved = null;
  try { saved = (localStorage.getItem(LANG_LS_KEY) || null); } catch (e) { saved = null; }
  if (saved) saved = saved.toLowerCase();
  const initial = (saved && TRANSLATIONS[saved]) ? saved : DEFAULT_LANG;
  applyTranslations(initial);

  document.querySelectorAll("[data-lang-option]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      setLang(btn.getAttribute("data-lang-option"));
    });
  });
});
