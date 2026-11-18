(() => {
  "use strict";
  document.documentElement.classList.add("js");

  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const canHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  $$(".reveal").forEach((el) => io.observe(el));

  if (canHover) {
    $$(".don").forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    });
  }

  const prefetched = new Set();
  const prefetch = (url) => {
    if (prefetched.has(url)) return;
    prefetched.add(url);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    document.head.append(link);
  };

  $$("[data-tipe]").forEach((btn) => {
    ["pointerenter", "focus", "touchstart"].forEach((ev) =>
      btn.addEventListener(ev, () => prefetch(btn.href), {
        once: true,
        passive: true,
      }),
    );
    btn.addEventListener("click", () => {
      try {
        sessionStorage.setItem("suaka:donasi-tipe", btn.dataset.tipe);
      } catch {

      }
    });
  });
})();
