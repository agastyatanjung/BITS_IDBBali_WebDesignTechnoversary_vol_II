(() => {
  "use strict";
  document.documentElement.classList.add("js");

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const rimba = $(".pkg--green");
  const cta = $(".pkg__cta", rimba);
  const base = cta.getAttribute("href");

  const syncLink = () => {
    const choice = $("input[name=rimba]:checked", rimba).value;
    const url = new URL(base, location.origin);
    url.searchParams.set("alokasi", choice);
    cta.href = url.pathname + url.search;
  };
  rimba.addEventListener("change", syncLink);
  syncLink();

  const prefetched = new Set();
  const prefetch = (url) => {
    if (prefetched.has(url)) return;
    prefetched.add(url);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    document.head.append(link);
  };

  $$(".pkg").forEach((card) => {
    const link = $(".pkg__cta", card);
    ["pointerenter", "touchstart"].forEach((ev) =>
      card.addEventListener(ev, () => prefetch(link.href), {
        once: true,
        passive: true,
      }),
    );
    link.addEventListener("click", () => {
      const url = new URL(link.href, location.origin);
      const order = {
        tipe: url.searchParams.get("tipe") || "sekali",
        paket: card.dataset.paket,
        nama: $(".pkg__tag", card).textContent.replace(/\s+/g, " ").trim(),
        nominal: url.searchParams.get("nominal"),
        alokasi: url.searchParams.get("alokasi") || "",
        ringkas: $(".pkg__lead", card).textContent.replace(/\s+/g, " ").trim(),
      };
      try {
        sessionStorage.setItem("suaka:bayar", JSON.stringify(order));
      } catch {}
    });
  });
})();
