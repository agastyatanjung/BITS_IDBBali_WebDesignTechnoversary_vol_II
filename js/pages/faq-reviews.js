(() => {
  "use strict";
  document.documentElement.classList.add("js"); // tanpa JS, semua jawaban FAQ tetap terbuka

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- FAQ: akordeon, satu terbuka dalam satu waktu ---------- */
  const items = $$(".faq__item");

  const setOpen = (item, open) => {
    item.classList.toggle("is-open", open);
    $(".faq__q", item).setAttribute("aria-expanded", String(open));
    $(".faq__a", item).inert = !open; // tautan di jawaban tertutup tidak bisa difokus
  };

  items.forEach((item) => {
    setOpen(item, false);
    $(".faq__q", item).addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");
      items.forEach((i) => setOpen(i, false));
      setOpen(item, willOpen);
    });
  });

  /* ---------- Testimoni: ketuk untuk membuka (layar sentuh tidak punya hover) ---------- */
  const cards = $$(".rcard");
  const closeAll = () => cards.forEach((c) => c.classList.remove("is-open"));

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasOpen = card.classList.contains("is-open");
      closeAll();
      card.classList.toggle("is-open", !wasOpen);
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAll();
        card.blur();
      }
    });
  });
  document.addEventListener("click", closeAll);
})();
