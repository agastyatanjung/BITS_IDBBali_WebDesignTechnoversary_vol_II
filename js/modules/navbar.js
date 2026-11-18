(() => {
  "use strict";

  const mount = document.getElementById("navbar-container");
  if (!mount) return;

  const navbarUrl = new URL(
    "../../partials/navbar.html",
    document.currentScript.src,
  );

  const start = () => {
    fetch(navbarUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Gagal memuat navbar");
        }
        return response.text();
      })
      .then((html) => {
        mount.innerHTML = html;
        initNavbar();
      })
      .catch((error) => console.error("Error:", error));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  function initNavbar() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;

    const toggle = navbar.querySelector(".navbar__toggle");
    const list = navbar.querySelector(".navbar__links");
    const indicator = list.querySelector(".navbar__indicator");
    const links = [...list.querySelectorAll(".navbar__link")];

    const STORAGE_KEY = "suaka:nav-prev";
    const SCROLL_THRESHOLD = 24;
    const isMobile = window.matchMedia("(max-width: 767px)");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const slugOf = (url) => {
      const { pathname } = new URL(url, location.href);
      if (pathname.endsWith("/")) return "index";
      return pathname.split("/").pop().replace(/\.html$/, "");
    };

    const readPrev = () => {
      try {
        return sessionStorage.getItem(STORAGE_KEY);
      } catch {
        return null;
      }
    };
    const savePrev = (slug) => {
      try {
        sessionStorage.setItem(STORAGE_KEY, slug);
      } catch {

      }
    };

    const currentLink =
      links.find((l) => slugOf(l.href) === slugOf(location.href)) || null;

    const setActive = (link) => {
      links.forEach((l) => l.classList.toggle("is-active", l === link));
    };

    const place = (link, animate) => {
      if (!indicator) return;
      if (!link || isMobile.matches) {
        indicator.style.opacity = "0";
        return;
      }
      indicator.style.transition =
        animate && !reduceMotion.matches ? "" : "none";
      indicator.style.width = `${link.offsetWidth}px`;
      indicator.style.transform = `translateX(${link.offsetLeft}px)`;
      indicator.style.opacity = "1";
    };

    const initActive = () => {
      links.forEach((l) => l.removeAttribute("aria-current"));
      if (currentLink) currentLink.setAttribute("aria-current", "page");

      const prevSlug = readPrev();
      const prevLink = links.find((l) => slugOf(l.href) === prevSlug) || null;

      const shouldSlide =
        !isMobile.matches &&
        !reduceMotion.matches &&
        prevLink &&
        currentLink &&
        prevLink !== currentLink;

      if (shouldSlide) {
        setActive(prevLink);
        place(prevLink, false);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            setActive(currentLink);
            place(currentLink, true);
          }),
        );
      } else {
        setActive(currentLink);
        place(currentLink, false);
      }

      if (currentLink) savePrev(slugOf(currentLink.href));
    };

    const resync = () => {
      setActive(currentLink);
      place(currentLink, false);
    };

    let ticking = false;
    const updateScrolled = () => {
      navbar.classList.toggle(
        "is-scrolled",
        window.scrollY > SCROLL_THRESHOLD,
      );
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateScrolled);
    };

    const setMenu = (open) => {
      navbar.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
    };

    toggle.addEventListener("click", () =>
      setMenu(!navbar.classList.contains("is-open")),
    );

    navbar.addEventListener("click", (e) => {
      if (e.target.closest(".navbar__nav a")) setMenu(false);
    });
    document.addEventListener("click", (e) => {
      if (!navbar.contains(e.target)) setMenu(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        setMenu(false);
        toggle.focus();
      }
    });

    initActive();
    updateScrolled();

    window.addEventListener("scroll", onScroll, { passive: true });

    let resizeFrame;
    window.addEventListener("resize", () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(resync);
    });

    isMobile.addEventListener("change", () => {
      setMenu(false);
      resync();
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(resync);
    }
  }
})();
