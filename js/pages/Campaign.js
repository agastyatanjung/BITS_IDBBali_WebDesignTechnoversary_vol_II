(() => {
  "use strict";
  document.documentElement.classList.add("js");

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const toast = (msg) => {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast.id);
    toast.id = setTimeout(() => t.classList.remove("show"), 2400);
  };

  const row = $("#galleryRow");
  const dlg = $("#speciesDialog");
  if (
    row &&
    dlg &&
    typeof SPECIES !== "undefined" &&
    typeof MAIN !== "undefined"
  ) {
    row.innerHTML = SPECIES.map((sp, i) => {
      const d = i - MAIN;
      return `<button class="frame${i === MAIN ? " frame--main" : ""}" type="button"
      style="--d:${d};--a:${Math.abs(d)}" data-i="${i}" aria-label="Lihat profil ${sp.name}">
      <span class="media" data-label="Lukisan: ${sp.name}"></span></button>`;
    }).join("");

    if (matchMedia("(max-width: 899px)").matches) row.scrollLeft = 0;

    row.addEventListener("click", (e) => {
      const btn = e.target.closest(".frame");
      if (!btn) return;
      const sp = SPECIES[+btn.dataset.i];
      $("#dlgName").textContent = sp.name;
      $("#dlgText").textContent = sp.t;
      const st = $("#dlgStatus");
      st.textContent = STATUS[sp.s];
      st.dataset.s = sp.s;
      $("#dlgMedia").dataset.label = `Foto: ${sp.name}`;
      dlg.showModal();
    });
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) dlg.close();
    });
  }

  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          reveal.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  $$(".reveal").forEach((el) => reveal.observe(el));

  const count = (el) => {
    const target = +el.dataset.count;
    const fmt = (n) => n.toLocaleString("id-ID");
    if (reduce) {
      el.textContent = fmt(target);
      return;
    }
    const start = performance.now(),
      dur = 1800;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const counter = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          count(e.target);
          counter.unobserve(e.target);
        }
      });
    },
    { threshold: 0.6 },
  );
  $$("[data-count]").forEach((el) => counter.observe(el));

  $$("[data-remind]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const on = btn.classList.toggle("is-on");
      btn.textContent = on ? "Pengingat aktif ✓" : "Ingatkan saya";
      btn.setAttribute("aria-pressed", on);
      toast(on ? "Pengingat disimpan (demo)" : "Pengingat dibatalkan");
    }),
  );

  const form = $("#pledgeForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const who = form.elements.who.value.trim();
    const pledge = form.elements.pledge.value;
    if (!who || !pledge) return;
    const li = document.createElement("li");
    const b = document.createElement("b");
    b.textContent = who;
    li.append(b, ` berjanji: ${pledge}`);
    $("#wall").prepend(li);
    form.reset();
    toast("Janjimu tertulis di dinding (demo)");
  });

  $("#shareBtn").addEventListener("click", async () => {
    const data = {
      title: "Suaka — #JagaRumahMereka",
      text: "Sebagian dari mereka kini tinggal lukisan. Ayo #JagaRumahMereka",
      url: location.href,
    };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(`${data.text} ${data.url}`);
        toast("Teks dan tautan disalin");
      }
    } catch {

    }
  });
})();
