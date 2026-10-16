/* ============================================================
   Bridge page config. Edit these values only.
   ============================================================ */
var CONFIG = {
  // Where the "Continue" button sends the visitor.
  url: "https://example.com/",

  // Forward the current page's query string (e.g. ?sub=abc) to the target.
  passQuery: true,

  // Short pause so the pressed state is visible before leaving.
  delayMs: 260,

  // Seconds of inactivity before the quiet "still here" invitation.
  idleSeconds: 4,

  // How many times the invitation ring may repeat.
  idleRepeats: 3,

  // Floating hearts in the background (phone / desktop).
  heartsMobile: 22,
  heartsDesktop: 34
};

(function () {
  var body = document.body;
  var focus = document.getElementById("focus");
  var button = document.getElementById("continue");
  var label = button.querySelector(".cta__label");
  var ring = document.getElementById("ring");
  var hint = document.getElementById("hint");
  var status = document.getElementById("status");
  var heartsRoot = document.getElementById("hearts");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var wide = window.matchMedia("(min-width: 768px)").matches;
  var busy = false;

  /* ---------- Destination ---------- */
  function buildTarget() {
    var target = CONFIG.url;
    if (CONFIG.passQuery && window.location.search.length > 1) {
      var params = window.location.search.slice(1);
      target += (target.indexOf("?") === -1 ? "?" : "&") + params;
    }
    return target;
  }

  var target = buildTarget();
  button.setAttribute("href", target);

  /* ---------- Hearts ---------- */
  function rand(min, max) { return min + Math.random() * (max - min); }

  function makeHearts() {
    var count = wide ? CONFIG.heartsDesktop : CONFIG.heartsMobile;
    var frag = document.createDocumentFragment();

    for (var i = 0; i < count; i++) {
      var depth = Math.random();              // 0 = far, 1 = near
      var size = Math.round(10 + Math.pow(depth, 2.2) * (wide ? 150 : 110));
      var outline = depth > 0.55 && Math.random() < 0.35;

      // Keep big hearts away from the middle where the button lives.
      var x;
      if (size > 50) {
        x = Math.random() < 0.5 ? rand(-4, 22) : rand(72, 100);
      } else {
        x = rand(-2, 100);
      }

      var el = document.createElement("span");
      el.className = "heart" + (outline ? " heart--outline" : "");
      el.style.setProperty("--x", x.toFixed(1) + "%");
      el.style.setProperty("--y", rand(5, 90).toFixed(0) + "%");
      el.style.setProperty("--size", size + "px");
      el.style.setProperty("--blur", (depth < 0.3 ? rand(2, 4) : depth < 0.7 ? rand(0.4, 1.2) : 0).toFixed(1) + "px");
      el.style.setProperty("--alpha", (0.22 + depth * 0.55).toFixed(2));
      el.style.setProperty("--glow", (depth > 0.5 ? 0.45 : 0.15).toFixed(2));
      el.style.setProperty("--tilt", rand(-28, 28).toFixed(0) + "deg");
      el.style.setProperty("--dur", rand(26, 48).toFixed(1) + "s");
      el.style.setProperty("--delay", (-rand(0, 48)).toFixed(1) + "s");
      el.style.setProperty("--sway", rand(8, 26).toFixed(0) + "px");
      el.style.setProperty("--sway-dur", rand(4, 9).toFixed(1) + "s");

      el.innerHTML = '<svg aria-hidden="true"><use href="#heart"/></svg>';
      frag.appendChild(el);
    }
    heartsRoot.appendChild(frag);
  }

  makeHearts();

  /* ---------- Entrance ---------- */
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      body.classList.add("is-ready");
    });
  });

  if (!reduceMotion) window.setTimeout(shine, 1500);

  function shine() {
    if (busy || reduceMotion) return;
    button.classList.remove("is-shining");
    void button.offsetWidth;
    button.classList.add("is-shining");
  }

  button.addEventListener("animationend", function (e) {
    if (e.animationName === "sheen") button.classList.remove("is-shining");
  });

  if (finePointer) button.addEventListener("mouseenter", shine);

  /* ---------- Press feedback ---------- */
  button.addEventListener("pointerdown", function () {
    if (busy) return;
    button.classList.add("is-pressed");
    if (navigator.vibrate) {
      try { navigator.vibrate(8); } catch (err) { /* ignore */ }
    }
  });

  function release() { button.classList.remove("is-pressed"); }
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("pointerleave", release);

  /* ---------- Idle invitation ---------- */
  var idleTimer = null;
  var idleCount = 0;

  function pulse() {
    if (busy || reduceMotion) return;
    ring.classList.remove("is-pulsing");
    void ring.offsetWidth;
    ring.classList.add("is-pulsing");
  }

  function onIdle() {
    if (busy) return;
    idleCount += 1;
    pulse();
    if (idleCount === 2) hint.classList.add("is-whispering");
    if (idleCount < CONFIG.idleRepeats) idleTimer = window.setTimeout(onIdle, 6000);
  }

  function resetIdle() {
    if (idleTimer) window.clearTimeout(idleTimer);
    if (busy || idleCount >= CONFIG.idleRepeats) return;
    idleTimer = window.setTimeout(onIdle, CONFIG.idleSeconds * 1000);
  }

  ["pointermove", "pointerdown", "keydown", "touchstart", "scroll"].forEach(function (evt) {
    window.addEventListener(evt, resetIdle, { passive: true });
  });
  resetIdle();

  /* ---------- Magnetic lean (desktop only) ---------- */
  if (finePointer && !reduceMotion) {
    var targetX = 0, targetY = 0, curX = 0, curY = 0, raf = null;
    var RADIUS = 90, MAX = 6;

    function tick() {
      curX += (targetX - curX) * 0.12;
      curY += (targetY - curY) * 0.12;
      focus.style.transform = "translate(" + curX.toFixed(2) + "px," + curY.toFixed(2) + "px)";
      if (Math.abs(targetX - curX) > 0.05 || Math.abs(targetY - curY) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    function schedule() { if (!raf) raf = requestAnimationFrame(tick); }

    window.addEventListener("pointermove", function (e) {
      if (busy) return;
      var r = button.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      var inside = Math.abs(dx) < r.width / 2 + RADIUS && Math.abs(dy) < r.height / 2 + RADIUS;
      if (inside) {
        targetX = Math.max(-MAX, Math.min(MAX, dx / (r.width / 2 + RADIUS) * MAX));
        targetY = Math.max(-MAX, Math.min(MAX, dy / (r.height / 2 + RADIUS) * MAX));
      } else {
        targetX = 0; targetY = 0;
      }
      schedule();
    }, { passive: true });

    window.addEventListener("pointerleave", function () {
      targetX = 0; targetY = 0; schedule();
    });
  }

  /* ---------- Continue ---------- */
  button.addEventListener("click", function (event) {
    event.preventDefault();
    if (busy) return;
    busy = true;
    if (idleTimer) window.clearTimeout(idleTimer);

    button.style.minWidth = button.offsetWidth + "px";
    button.classList.remove("is-pressed", "is-shining");
    button.classList.add("is-busy");
    button.setAttribute("aria-busy", "true");
    label.textContent = "Opening";
    if (status) status.textContent = "Opening the next step.";

    window.setTimeout(function () {
      window.location.assign(target);
    }, CONFIG.delayMs);
  });
})();
