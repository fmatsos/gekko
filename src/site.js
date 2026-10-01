/* The custom scrollbars and section-by-section scrolling on pages with [data-part].
   Fine pointer, wide screen: a vertical rail; the wheel goes from stop to stop and the rail settles
   on the nearest stop after a drag or a click (motion on only: reduced motion and the Animations
   switch keep native wheel scrolling). Touch or narrow screen: a bar at the bottom of the screen,
   a node per part to tap and a strip to scrub, settling on the nearest stop; touch scrolling of
   the page itself stays native. */
(() => {
  const html = document.documentElement, rail = document.querySelector("[data-rail]");
  const thumb = rail && rail.querySelector("[data-rail-thumb]"), nav = document.querySelector(".rail-nav");
  const hbar = document.querySelector("[data-hbar]"), hthumb = hbar && hbar.querySelector(".hbar-thumb");
  const parts = [...document.querySelectorAll("[data-part]")];
  const fine = matchMedia("(min-width: 40em) and (pointer: fine)");
  const header = document.querySelector("[data-header]");
  // the header only covers the page while it is sticky (not on narrow screens)
  const hh = () => header && getComputedStyle(header).position === "sticky" ? parseFloat(html.style.getPropertyValue("--hh")) || 0 : 0;
  const max = () => html.scrollHeight - innerHeight;
  const topOf = el => el.getBoundingClientRect().top + scrollY - hh();
  const sectioned = () => parts.length > 0 && fine.matches && html.dataset.motion === "on";

  // stops: each part's top; inside a part taller than the screen, one every 80% of a screen
  const stops = () => {
    const vh = innerHeight - hh(), out = new Set([0, Math.round(max())]);
    parts.forEach(p => {
      const top = Math.max(0, topOf(p)), end = top + p.offsetHeight - vh;
      for (let y = top; y < end; y += vh * .8) out.add(Math.round(y));
      out.add(Math.round(Math.max(top, end)));
    });
    // a stop within a quarter screen of the previous one is a wasted wheel step: merge them, and keep
    // the one that matters, a part's top or the page's end (two of those are both kept)
    const end = Math.round(max()), firm = new Set([...parts.map(p => Math.round(Math.max(0, topOf(p)))), 0, end]);
    return [...out].filter(y => y >= 0 && y <= end).sort((a, b) => a - b).reduce((kept, y) => {
      if (!kept.length || y - kept.at(-1) >= vh / 4 || firm.has(y) && firm.has(kept.at(-1))) kept.push(y);
      else if (firm.has(y)) kept[kept.length - 1] = y;
      return kept;
    }, []);
  };

  // the thumb is as tall as the screen is to the page; a node sits where the thumb's middle is at its part
  const layout = () => {
    if (rail) html.style.setProperty("--th", Math.max(40, rail.clientHeight * innerHeight / html.scrollHeight) + "px");
    if (hbar) html.style.setProperty("--tw", Math.max(32, hbar.clientWidth * innerHeight / html.scrollHeight) + "px");
    if (nav) nav.querySelectorAll("a[href^='#']").forEach(a => {
      const el = document.getElementById(a.getAttribute("href").slice(1));
      if (el) a.parentElement.style.setProperty("--at", Math.min(1, Math.max(0, topOf(el) / Math.max(1, max()))).toFixed(4));
    });
  };
  ["load", "resize"].forEach(e => addEventListener(e, layout));
  new ResizeObserver(layout).observe(document.body);
  layout();

  let lock = 0, last = 0, unlock;
  const go = y => {
    lock = Infinity;
    clearTimeout(unlock); unlock = setTimeout(() => { lock = 0; }, 1500);   // scrollend may never come
    // any step into another part travels, up into a tall part's last screen as well as down to a top
    const part = partAt(y);
    if (part !== partAt(scrollY)) travel(y, part);
    else scrollTo({ top: y, behavior: "smooth" });
  };

  // between parts, a transition of the site's own: it covers the screen, the page jumps under it,
  // then it uncovers the new part; each part has its own (the moon's iris, a terminal scan, the
  // circuit grid, a dune rising, a terminal window opening and closing)
  const veil = document.querySelector(".veil"), veilLine = veil && veil.querySelector(".veil-line");
  const partAt = y => parts.findLast(p => Math.max(0, topOf(p)) <= y + 2) || parts[0];
  const shapes = {
    iris: [["circle(0% at 50% 50%)", "circle(75% at 50% 50%)"], ["circle(75% at 50% 50%)", "circle(0% at 50% 50%)"]],
    scan: [["inset(100% 0 0 0)", "inset(0 0 0 0)"], ["inset(0 0 0 0)", "inset(0 0 100% 0)"]],
    circuit: [["inset(0 100% 0 0)", "inset(0 0 0 0)"], ["inset(0 0 0 0)", "inset(0 0 0 100%)"]],
    dune: [["ellipse(160% 0% at 50% 100%)", "ellipse(160% 140% at 50% 100%)"], ["ellipse(160% 140% at 50% 0%)", "ellipse(160% 0% at 50% 0%)"]],
    window: [["inset(0 50% 0 50% round 24px)", "inset(0 0 0 0 round 0px)"], ["inset(0 0 0 0 round 0px)", "inset(50% 0 50% 0 round 24px)"]],
  };
  const kinds = Object.keys(shapes);
  const travel = (y, part) => {
    if (!veil || html.dataset.motion !== "on") { scrollTo({ top: y, behavior: "instant" }); lock = 0; return; }
    const kind = kinds[parts.indexOf(part) % kinds.length], [inn, out] = shapes[kind];
    veil.dataset.kind = kind;
    veilLine.textContent = "$ cd " + (part === parts[0] ? "~" : part.id);
    veil.classList.add("on");
    const ease = "cubic-bezier(.65, 0, .35, 1)";
    // timers drive the steps, the animations only draw them: a hidden tab holds animation events back
    const cover = veil.animate({ clipPath: inn }, { duration: 420, easing: ease, fill: "forwards" });
    setTimeout(() => scrollTo({ top: y, behavior: "instant" }), 420);
    setTimeout(() => {
      const reveal = veil.animate({ clipPath: out }, { duration: 480, easing: ease, fill: "forwards" });
      cover.cancel();
      setTimeout(() => { reveal.cancel(); veil.classList.remove("on"); lock = 0; }, 480);
    }, 580);
  };
  // the in-page links to a part (the nodes, "Get Gekko") travel the same way
  document.querySelectorAll("a[href^='#']").forEach(a => {
    const part = parts.find(p => "#" + p.id === a.getAttribute("href"));
    if (part) a.addEventListener("click", e => {
      if (!veil || html.dataset.motion !== "on" || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      history.pushState(null, "", "#" + part.id);
      const y = Math.round(Math.max(0, topOf(part)));
      if (Math.abs(scrollY - y) > 2) { lock = Infinity; travel(y, part); }
    });
  });
  // one step per gesture: a trackpad's inertia and a fast-spun wheel count once, until a 200 ms pause
  addEventListener("wheel", e => {
    if (!sectioned() || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    const now = performance.now(), fresh = now - last > 200;
    last = now;
    if (!fresh || now < lock) return;
    step(Math.sign(e.deltaY));
  }, { passive: false });
  const step = dir => {
    const y = scrollY, s = stops();
    const to = dir > 0 ? s.find(v => v > y + 4) : s.findLast(v => v < y - 4);
    if (to !== undefined) go(to);
  };
  // the arrow keys step the same way, except in a form field or a region that scrolls on its own
  addEventListener("keydown", e => {
    if (!parts.length || html.dataset.motion !== "on" || !["ArrowDown", "ArrowUp"].includes(e.key)) return;
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.target.closest("input, textarea, select, [contenteditable], .table")) return;
    e.preventDefault();
    if (performance.now() >= lock) step(e.key === "ArrowDown" ? 1 : -1);
  });

  let fromRail = false;
  const settle = () => {
    if (!fromRail || html.classList.contains("dragging") || !sectioned()) return;
    fromRail = false;
    const y = scrollY, near = stops().reduce((a, b) => Math.abs(b - y) < Math.abs(a - y) ? b : a);
    if (Math.abs(near - y) > 2) go(near);
  };
  if (rail) {
    rail.addEventListener("pointerdown", () => { fromRail = true; });
    rail.addEventListener("pointerup", () => setTimeout(settle));
  }
  addEventListener("scrollend", () => { if (!veil || !veil.classList.contains("on")) lock = 0; settle(); });

  // the nodes' labels show on hover and focus; Escape hides them (WCAG 1.4.13)
  if (nav) {
    addEventListener("keydown", e => { if (e.key === "Escape") nav.classList.add("quiet"); });
    ["pointerleave", "focusout"].forEach(ev => nav.addEventListener(ev, () => nav.classList.remove("quiet")));
  }

  // the bottom bar, where the rail is not shown: the thumb follows the scroll; a finger anywhere on
  // the bar scrubs through the page and, on release, settles on the nearest stop
  if (hbar) {
    const span = () => hbar.clientWidth - hthumb.offsetWidth;
    const follow = () => { hthumb.style.transform = `translateX(${scrollY / Math.max(1, max()) * span()}px)`; };
    const toY = e => {
      const r = hbar.getBoundingClientRect();
      return Math.min(1, Math.max(0, (e.clientX - r.left - hthumb.offsetWidth / 2) / Math.max(1, span()))) * max();
    };
    let scrubbing = false;
    hbar.addEventListener("pointerdown", e => {
      scrubbing = true; hbar.setPointerCapture(e.pointerId); html.classList.add("dragging");
      scrollTo({ top: toY(e), behavior: "instant" });
    });
    hbar.addEventListener("pointermove", e => { if (scrubbing) scrollTo({ top: toY(e), behavior: "instant" }); });
    const release = () => {
      if (!scrubbing) return;
      scrubbing = false; html.classList.remove("dragging");
      const y = scrollY, near = stops().reduce((a, b) => Math.abs(b - y) < Math.abs(a - y) ? b : a);
      scrollTo({ top: near, behavior: html.dataset.motion === "on" ? "smooth" : "instant" });
    };
    ["pointerup", "pointercancel"].forEach(ev => hbar.addEventListener(ev, release));
    addEventListener("scroll", () => requestAnimationFrame(follow), { passive: true });
    ["load", "resize"].forEach(ev => addEventListener(ev, follow));
    follow();
  }
})();
