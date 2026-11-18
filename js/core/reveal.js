(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const nodes = [
    ...document.querySelectorAll(
      "main > section, main section, main .head, main .pkg, main .card, main .don, main .step, main .cta, main .included",
    ),
  ].filter((el) => !el.closest("#story") && !el.closest(".dlg, dialog"));

  const seen = new Set();
  const first = nodes.filter((el) => {
    const box = el.getBoundingClientRect();
    return box.bottom > 0 && box.top < window.innerHeight * 0.96;
  });

  first
    .sort(
      (a, b) =>
        a.getBoundingClientRect().top - b.getBoundingClientRect().top ||
        a.getBoundingClientRect().left - b.getBoundingClientRect().left,
    )
    .forEach((el) => {
      if (seen.has(el)) return;
      const parent = el.parentElement && el.parentElement.closest("section, .pkg, .card, .don, .cta");
      if (parent && first.includes(parent)) return;
      seen.add(el);
    });

  [...seen].forEach((el, index) => {
    el.animate(
      [
        { opacity: 0, transform: "translateY(16px)" },
        { opacity: 1, transform: "none" },
      ],
      {
        duration: 620,
        delay: Math.min(index, 7) * 90,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "backwards",
      },
    );
  });
})();
