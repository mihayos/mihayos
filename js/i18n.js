/* =========================================================
   Mihayo's Safaris — i18n Engine
   Applies TRANSLATIONS (translations.js + translations-auto-*.js)
   data-i18n="key"        -> text content
   data-i18n-ph="key"     -> placeholder
   data-i18n-alt/-aria/-title="key" -> alt / aria-label / title
   Language choice is saved in localStorage so it persists site-wide.
   ========================================================= */

const LANG_LS_KEY = "mihayo_lang";
let currentLang = DEFAULT_LANG;

function t(key, fallback) {
  const d = TRANSLATIONS[currentLang] || {};
  const e = TRANSLATIONS[DEFAULT_LANG] || {};
  return d[key] !== undefined ? d[key] : (e[key] !== undefined ? e[key] : fallback);
}

function applyTranslations(lang) {
  let chosen = (lang || "").toLowerCase();
  if (!TRANSLATIONS[chosen]) chosen = DEFAULT_LANG;
  currentLang = chosen;
  const isRTL = currentLang === "ar";
  document.documentElement.setAttribute("lang", currentLang);
  document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  document.body.classList.toggle("rtl-mode", isRTL);

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    // remember original English the first time so fallback always works
    if (el.dataset.i18nOrig === undefined) el.dataset.i18nOrig = el.textContent;
    el.textContent = t(el.getAttribute("data-i18n"), el.dataset.i18nOrig);
  });

  [["data-i18n-ph", "placeholder"], ["data-i18n-alt", "alt"],
   ["data-i18n-aria", "aria-label"], ["data-i18n-title", "title"]].forEach(([da, attr]) => {
    document.querySelectorAll("[" + da + "]").forEach((el) => {
      const orig = "i18nOrig_" + attr.replace("-", "");
      if (el.dataset[orig] === undefined) el.dataset[orig] = el.getAttribute(attr) || "";
      el.setAttribute(attr, t(el.getAttribute(da), el.dataset[orig]));
    });
  });

  document.querySelectorAll(".lang-current").forEach((el) => {
    el.textContent = currentLang.toUpperCase();
  });
  document.querySelectorAll("[data-lang-option]").forEach((el) => {
    el.classList.toggle("active", el.getAttribute("data-lang-option") === currentLang);
  });
  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: currentLang } }));
}

function setLang(lang) {
  applyTranslations((lang || "").toLowerCase());
  try {
    if (currentLang === DEFAULT_LANG) localStorage.removeItem(LANG_LS_KEY);
    else localStorage.setItem(LANG_LS_KEY, currentLang);
  } catch (e) { /* storage blocked */ }
}

document.addEventListener("DOMContentLoaded", () => {
  let saved = null;
  try { saved = localStorage.getItem(LANG_LS_KEY); } catch (e) {}
  saved = saved ? saved.toLowerCase() : null;
  applyTranslations(saved && TRANSLATIONS[saved] ? saved : DEFAULT_LANG);

  document.querySelectorAll("[data-lang-option]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      setLang(btn.getAttribute("data-lang-option"));
    });
  });
});
