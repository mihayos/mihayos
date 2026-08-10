/* =========================================================
   MIHAYO'S SAFARIS — main.js
   Core interactivity: navbar state, mobile nav, filters,
   FAQ accordion, lightbox, form validation, cookie banner
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- Navbar scroll state ---------- */
  const navbar = document.querySelector(".navbar");
  const onScroll = () => {
    if (!navbar) return;
    navbar.classList.toggle("scrolled", window.scrollY > 40);
    const backTop = document.querySelector(".fab-top");
    if (backTop) backTop.classList.toggle("show", window.scrollY > 500);
  };
  window.addEventListener("scroll", onScroll);
  onScroll();

  /* ---------- Mobile nav ---------- */
  const navToggle = document.querySelector(".nav-toggle");
  const navClose = document.querySelector(".mobile-nav .close-btn");
  navToggle && navToggle.addEventListener("click", () => document.body.classList.add("nav-open"));
  navClose && navClose.addEventListener("click", () => document.body.classList.remove("nav-open"));
  document.querySelectorAll(".mobile-nav a").forEach(a =>
    a.addEventListener("click", () => document.body.classList.remove("nav-open"))
  );

  /* ---------- Services dropdown ---------- */
  document.querySelectorAll(".services-toggle").forEach(toggle => {
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const item = toggle.closest(".services-nav");
      if (!item) return;
      const isOpen = item.classList.contains("open");
      document.querySelectorAll(".services-nav.open").forEach(openItem => {
        openItem.classList.remove("open");
        const openToggle = openItem.querySelector(".services-toggle");
        if (openToggle) openToggle.setAttribute("aria-expanded", "false");
      });
      if (!isOpen) {
        item.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
      }
    });
  });
  document.querySelectorAll(".services-menu").forEach(menu => {
    menu.addEventListener("click", (e) => e.stopPropagation());
  });
  document.addEventListener("click", () => {
    document.querySelectorAll(".services-nav.open").forEach(item => {
      item.classList.remove("open");
      const toggle = item.querySelector(".services-toggle");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ---------- Language dropdown open/close ---------- */
  const langSwitch = document.querySelector(".lang-switch");
  const langBtn = document.querySelector(".lang-btn");
  langBtn && langBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    langSwitch.classList.toggle("open");
  });
  document.addEventListener("click", () => langSwitch && langSwitch.classList.remove("open"));

  /* ---------- Scroll-reveal (lightweight AOS fallback) ---------- */
  const revealEls = document.querySelectorAll("[data-aos]");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("aos-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("aos-in"));
  }

  /* ---------- Filter pills (destinations / safaris) ---------- */
  document.querySelectorAll(".filter-row").forEach(row => {
    const pills = row.querySelectorAll(".filter-pill");
    const targetSelector = row.getAttribute("data-target");
    const items = targetSelector ? document.querySelectorAll(targetSelector) : [];
    pills.forEach(pill => {
      pill.addEventListener("click", () => {
        pills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        const filter = pill.getAttribute("data-filter");
        items.forEach(item => {
          const cats = (item.getAttribute("data-cats") || "").split(",");
          item.style.display = (filter === "all" || cats.includes(filter)) ? "" : "none";
        });
      });
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item .faq-q").forEach(q => {
    q.addEventListener("click", () => {
      const item = q.closest(".faq-item");
      const wasOpen = item.classList.contains("open");
      item.parentElement.querySelectorAll(".faq-item").forEach(i => i.classList.remove("open"));
      if (!wasOpen) item.classList.add("open");
    });
  });

  /* ---------- Lightweight lightbox for gallery ---------- */
  const galleryItems = document.querySelectorAll(".masonry .g-item img");
  if (galleryItems.length) {
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(7,20,15,.92);display:none;align-items:center;justify-content:center;z-index:2000;padding:40px;";
    overlay.innerHTML = '<img style="max-width:90vw;max-height:85vh;border-radius:10px;" /><button aria-label="Close" style="position:absolute;top:24px;right:32px;background:none;border:none;color:#fff;font-size:2rem;cursor:pointer;">&times;</button>';
    document.body.appendChild(overlay);
    const imgEl = overlay.querySelector("img");
    galleryItems.forEach(img => {
      img.parentElement.addEventListener("click", () => {
        imgEl.src = img.src;
        overlay.style.display = "flex";
      });
    });
    overlay.addEventListener("click", () => overlay.style.display = "none");
  }

  /* ---------- Form validation (contact / booking) ---------- */
  document.querySelectorAll("form[data-validate]").forEach(form => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll("[required]").forEach(field => {
        const group = field.closest(".form-group");
        if (!field.value.trim()) {
          valid = false;
          group && group.classList.add("error");
        } else {
          group && group.classList.remove("error");
        }
      });

      if (!valid) return;

      const submitBtn = form.querySelector("button[type='submit']");
      const originalText = submitBtn ? submitBtn.innerHTML : "";
      const successBox = form.querySelector(".form-success");
      const errorBox = form.querySelector(".form-error") || document.createElement("p");

      if (!form.querySelector(".form-error")) {
        errorBox.className = "form-error";
        errorBox.style.display = "none";
        errorBox.style.marginTop = "12px";
        errorBox.style.color = "var(--c-accent)";
        form.appendChild(errorBox);
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
      }

      try {
        const payload = {
          name: form.querySelector('[name="name"]').value.trim(),
          email: form.querySelector('[name="email"]').value.trim(),
          phone: form.querySelector('[name="phone"]').value.trim(),
          travelDates: form.querySelector('[name="travelDates"]').value.trim(),
          message: form.querySelector('[name="message"]').value.trim()
        };

        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Unable to send enquiry");
        }

        form.style.display = "none";
        if (successBox) successBox.style.display = "block";
        errorBox.style.display = "none";
      } catch (error) {
        errorBox.textContent = error.message || "Unable to send enquiry";
        errorBox.style.display = "block";
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    });
  });

  /* ---------- Newsletter forms (footer) ---------- */
  document.querySelectorAll(".foot-newsletter-form").forEach(f => {
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = f.querySelector("button");
      const original = btn ? btn.textContent : "Subscribe";
      const emailInput = f.querySelector("input[type='email']");
      const email = emailInput ? emailInput.value.trim() : "";

      if (!email) return;

      if (btn) {
        btn.disabled = true;
        btn.textContent = "…";
      }

      try {
        const response = await fetch("/api/newsletter", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Unable to subscribe");
        }

        if (btn) btn.textContent = "✓";
        f.reset();
      } catch (error) {
        if (btn) btn.textContent = "Try again";
      } finally {
        setTimeout(() => {
          if (btn) {
            btn.disabled = false;
            btn.textContent = original;
          }
        }, 2200);
      }
    });
  });

  /* ---------- Cookie consent banner ---------- */
  const cookieBanner = document.querySelector(".cookie-banner");
  if (cookieBanner) {
    setTimeout(() => cookieBanner.classList.add("show"), 900);
    cookieBanner.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => cookieBanner.classList.remove("show"));
    });
  }

  /* ---------- Back to top ---------- */
  const backTop = document.querySelector(".fab-top");
  backTop && backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Mobile-only: reveal floating buttons only once the
     hero has scrolled out of view (CSS hides them by default on
     phones via .has-tall-hero, so there's no race/flash — this just
     adds "hero-passed" once the hero is no longer in view). ---------- */
  if (document.body.classList.contains("has-tall-hero") && "IntersectionObserver" in window) {
    const heroEl = document.querySelector(".hero");
    if (heroEl) {
      const heroIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          document.body.classList.toggle("hero-passed", !entry.isIntersecting);
        });
      }, { threshold: 0.15 });
      heroIO.observe(heroEl);
    }
  }

});
