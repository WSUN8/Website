(function () {
  const root = document.querySelector(".history");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const yearsEl = document.getElementById("years");
  const bar = document.getElementById("progress-bar");
  const playBtn = document.getElementById("play");
  const live = document.getElementById("live");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const interval = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--slide-ms"), 10) || 7000;

  let index = 0;
  let timer = null;
  let remaining = interval;
  let startedAt = 0;
  let userPaused = reducedMotion; // don't auto-advance for reduced-motion users
  let hoverPaused = false;

  // Build the year strip from the slides themselves.
  const yearBtns = slides.map((slide, i) => {
    const btn = document.createElement("button");
    btn.className = "year-btn";
    btn.type = "button";
    btn.setAttribute("role", "tab");
    btn.textContent = slide.dataset.year;
    btn.addEventListener("click", () => go(i));
    yearsEl.appendChild(btn);
    slide.setAttribute("aria-roledescription", "slide");
    slide.setAttribute("aria-label", `${i + 1} of ${slides.length}: ${slide.dataset.year}`);
    return btn;
  });

  function render() {
    slides.forEach((s, i) => {
      const active = i === index;
      s.classList.toggle("is-active", active);
      s.setAttribute("aria-hidden", String(!active));
      yearBtns[i].setAttribute("aria-selected", String(active));
      yearBtns[i].tabIndex = active ? 0 : -1;
    });
    // Center the active year in the strip without scrolling the page.
    const b = yearBtns[index];
    yearsEl.scrollTo({ left: b.offsetLeft - (yearsEl.clientWidth - b.offsetWidth) / 2, behavior: reducedMotion ? "auto" : "smooth" });
    const title = slides[index].querySelector(".slide-title").textContent;
    live.textContent = `${slides[index].dataset.year}: ${title}`;
  }

  function restartBar() {
    bar.classList.remove("run");
    void bar.offsetWidth; // reflow so the animation restarts
    if (!userPaused) bar.classList.add("run");
  }

  function schedule(ms) {
    clearTimeout(timer);
    if (userPaused || hoverPaused) return;
    startedAt = performance.now();
    remaining = ms;
    timer = setTimeout(() => go(index + 1), ms);
  }

  function go(i) {
    index = (i + slides.length) % slides.length;
    render();
    restartBar();
    schedule(interval);
  }

  function pauseForHover() {
    if (hoverPaused || userPaused) return;
    hoverPaused = true;
    clearTimeout(timer);
    remaining -= performance.now() - startedAt;
    root.classList.add("paused");
  }

  function resumeFromHover() {
    if (!hoverPaused) return;
    hoverPaused = false;
    root.classList.remove("paused");
    schedule(Math.max(remaining, 300));
  }

  function setUserPaused(p) {
    userPaused = p;
    playBtn.setAttribute("aria-pressed", String(p));
    playBtn.setAttribute("aria-label", p ? "Play slideshow" : "Pause slideshow");
    if (p) {
      clearTimeout(timer);
      bar.classList.remove("run");
    } else {
      hoverPaused = false;
      root.classList.remove("paused");
      restartBar();
      schedule(interval);
    }
  }

  document.getElementById("prev").addEventListener("click", () => go(index - 1));
  document.getElementById("next").addEventListener("click", () => go(index + 1));
  playBtn.addEventListener("click", () => setUserPaused(!userPaused));

  // Pause while the pointer is over the controls, or keyboard focus is inside.
  const controls = root.querySelector(".history-controls");
  controls.addEventListener("mouseenter", pauseForHover);
  controls.addEventListener("mouseleave", resumeFromHover);
  root.addEventListener("focusin", pauseForHover);
  root.addEventListener("focusout", (e) => { if (!root.contains(e.relatedTarget)) resumeFromHover(); });

  // Arrow keys on the year strip.
  yearsEl.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      go(index + (e.key === "ArrowRight" ? 1 : -1));
      yearBtns[index].focus();
    }
  });

  // Swipe on touch screens.
  let touchX = null;
  root.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  root.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  // Don't burn through slides in a background tab.
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTimeout(timer);
    else if (!userPaused && !hoverPaused) go(index);
  });

  setUserPaused(userPaused);
  render();
  restartBar();
  schedule(interval);
})();
