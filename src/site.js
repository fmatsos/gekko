/* The custom scroll rail's size and section nodes, and section-by-section scrolling on pages
   with [data-part]: the wheel goes from stop to stop, and the rail settles on the nearest stop
   after a drag or a click. Only with a fine pointer and motion on: touch, reduced motion and
   the Animations switch keep native scrolling. */
(() => {
  const html = document.documentElement, rail = document.querySelector("[data-rail]");
  const thumb = rail && rail.querySelector("[data-rail-thumb]"), nav = document.querySelector(".rail-nav");
  const parts = [...document.querySelectorAll("[data-part]")];
  const fine = matchMedia("(min-width: 40em) and (pointer: fine)");
  const hh = () => parseFloat(html.style.getPropertyValue("--hh")) || 0;
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
    // the one that matters, a part's top or the page's end
    const end = Math.round(max()), firm = new Set([...parts.map(p => Math.round(Math.max(0, topOf(p)))), 0, end]);
    return [...out].filter(y => y >= 0 && y <= end).sort((a, b) => a - b).reduce((kept, y) => {
      if (!kept.length || y - kept.at(-1) >= vh / 4) kept.push(y);
      else if (firm.has(y) && !firm.has(kept.at(-1)) || y === end) kept[kept.length - 1] = y;
      return kept;
    }, []);
  };

  // the thumb is as tall as the screen is to the page; a node sits where the thumb's middle is at its part
  const layout = () => {
    if (!thumb) return;
    const th = Math.max(40, rail.clientHeight * innerHeight / html.scrollHeight);
    html.style.setProperty("--th", th + "px");
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
    scrollTo({ top: y, behavior: "smooth" });
  };
  // one step per gesture: a trackpad's inertia and a fast-spun wheel count once, until a 200 ms pause
  addEventListener("wheel", e => {
    if (!sectioned() || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    const now = performance.now(), fresh = now - last > 200;
    last = now;
    if (!fresh || now < lock) return;
    const y = scrollY, s = stops();
    const to = e.deltaY > 0 ? s.find(v => v > y + 4) : s.findLast(v => v < y - 4);
    if (to !== undefined) go(to);
  }, { passive: false });

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
  addEventListener("scrollend", () => { lock = 0; settle(); });

  // the nodes' labels show on hover and focus; Escape hides them (WCAG 1.4.13)
  if (nav) {
    addEventListener("keydown", e => { if (e.key === "Escape") nav.classList.add("quiet"); });
    ["pointerleave", "focusout"].forEach(ev => nav.addEventListener(ev, () => nav.classList.remove("quiet")));
  }
})();
