(() => {
  "use strict";

  const story = document.getElementById("story");
  if (story) {
    const blocks = [...story.querySelectorAll(".story__block")];
    const media = story.querySelector(".story__media");
    const countEl = document.getElementById("storyCount");
    const stacked = window.matchMedia("(max-width: 767px)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let ticking = false;

    const shown = blocks.map(() => ({ o: 0, y: 0 }));
    const targets = blocks.map(() => ({ o: 0, y: 0 }));
    let raf = 0;

    const video = story.querySelector("video");
    if (video) {
      const startVideo = () => {
        video.muted = true;
        video.defaultMuted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");
        const attempt = video.play();
        if (attempt) attempt.catch(() => {});
      };
      startVideo();
      video.addEventListener("loadeddata", startVideo);
      video.addEventListener("canplay", startVideo);
      window.addEventListener("pageshow", startVideo);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") startVideo();
      });
      const resume = () => {
        startVideo();
        window.removeEventListener("pointerdown", resume);
        window.removeEventListener("keydown", resume);
      };
      window.addEventListener("pointerdown", resume);
      window.addEventListener("keydown", resume);
    }

    const measure = () => {
      const vh = window.innerHeight;
      const top = stacked.matches ? media.offsetHeight : 0;
      const ref = top + (vh - top) / 2;
      const range = (vh - top) / 2;
      const fadeStart = range * 0.18;
      const fadeEnd = range * 1.45;
      let best = 0;
      let bestDist = Infinity;

      blocks.forEach((b, i) => {
        const r = b.getBoundingClientRect();
        const offset = r.top + r.height / 2 - ref;
        const dist = Math.abs(offset);
        const t = Math.min(
          1,
          Math.max(0, (dist - fadeStart) / (fadeEnd - fadeStart)),
        );
        targets[i].o = 1 - t * t;
        targets[i].y = reduce.matches ? 0 : offset * 0.045;
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      if (countEl) countEl.textContent = String(best + 1).padStart(2, "0");
    };

    const paint = () => {
      raf = 0;
      let moving = false;
      const ease = reduce.matches ? 1 : 0.085;
      blocks.forEach((b, i) => {
        shown[i].o += (targets[i].o - shown[i].o) * ease;
        shown[i].y += (targets[i].y - shown[i].y) * ease;
        if (
          Math.abs(targets[i].o - shown[i].o) > 0.008 ||
          Math.abs(targets[i].y - shown[i].y) > 0.3
        ) {
          moving = true;
        }
        b.style.opacity = shown[i].o.toFixed(3);
        b.style.transform = reduce.matches
          ? ""
          : `translateY(${shown[i].y.toFixed(1)}px)`;
      });
      if (moving) raf = requestAnimationFrame(paint);
    };

    const update = () => {
      ticking = false;
      measure();
      if (!raf) raf = requestAnimationFrame(paint);
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  const counters = document.querySelectorAll("[data-count]");
  const run = (el) => {
    const target = +el.dataset.count;
    const start = performance.now();
    const dur = 1400;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            run(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.6 },
    );
    counters.forEach((c) => io.observe(c));
  } else {
    counters.forEach((c) => (c.textContent = c.dataset.count));
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
