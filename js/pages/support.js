(() => {
  "use strict";
  document.documentElement.classList.add("js");

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

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

  const form = $("#contactForm");
  const ok = $("#formOk");
  const submitBtn = $("button[type=submit]", form);

  const rules = {
    first: (v) => (v.trim() ? "" : "Nama depan wajib diisi"),
    email: (v) =>
      !v.trim()
        ? "Email wajib diisi"
        : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
          ? ""
          : "Format email belum benar",
    phone: (v) =>
      !v.trim() || /^\+?[\d\s-]{8,18}$/.test(v.trim())
        ? ""
        : "Nomor telepon belum benar",
    org: (v) => (v.trim() ? "" : "Nama instansi wajib diisi"),
    message: (v) => (v.trim().length >= 10 ? "" : "Pesan minimal 10 karakter"),
  };

  const setError = (input, msg) => {
    const field = input.closest(".field");
    field.classList.toggle("has-error", Boolean(msg));
    input.setAttribute("aria-invalid", String(Boolean(msg)));
    $(".field__err", field).textContent = msg;
  };

  form.addEventListener("focusout", (e) => {
    const rule = rules[e.target.name];
    if (rule) setError(e.target, rule(e.target.value));
  });
  form.addEventListener("input", (e) => {
    const rule = rules[e.target.name];
    if (rule && e.target.closest(".has-error"))
      setError(e.target, rule(e.target.value));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.elements.website.value) return;

    let firstInvalid = null;
    for (const [name, rule] of Object.entries(rules)) {
      const input = form.elements[name];
      const msg = rule(input.value);
      setError(input, msg);
      if (msg && !firstInvalid) firstInvalid = input;
    }
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Mengirim…";
    try {

      await new Promise((r) => setTimeout(r, 900));

      form.hidden = true;
      ok.hidden = false;
      ok.focus();
    } catch {
      submitBtn.textContent = "Gagal, coba lagi";
    } finally {
      submitBtn.disabled = false;
      if (submitBtn.textContent === "Mengirim…")
        submitBtn.textContent = "Kirim";
    }
  });

  $("#againBtn").addEventListener("click", () => {
    form.reset();
    $$(".field", form).forEach((f) => {
      f.classList.remove("has-error");
      $(".field__err", f).textContent = "";
    });
    submitBtn.textContent = "Kirim";
    ok.hidden = true;
    form.hidden = false;
    form.elements.first.focus();
  });

  $("#applyBtn").addEventListener("click", () => {
    setTimeout(() => form.elements.first.focus({ preventScroll: true }), 700);
  });
})();
