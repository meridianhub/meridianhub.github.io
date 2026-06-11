/* Meridian site interactions: scroll reveals, hero manifest typing,
   economy graph build, saga compensation loop, cookbook filters. */
(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          ro.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { ro.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Hero: manifest typing -> economy graph ---------- */
  var manifestEl = document.getElementById("manifest-type");
  var graphEl = document.getElementById("economy-graph");

  // tokens: [cssClass, text]; a bare number marks a graph stage to trigger
  var SCRIPT = [
    ["yc", "# economy.yaml — apply it, run it\n"],
    ["yk", "instruments:"], ["", "\n  - "], ["yk", "code: "], ["ys", "GBP\n"],
    ["", "    "], ["yk", "type: "], ["yp", "CURRENCY\n"],
    ["", "  - "], ["yk", "code: "], ["ys", "BET_UNIT\n"],
    ["", "    "], ["yk", "type: "], ["yp", "VOUCHER\n"],
    1,
    ["", "\n"],
    ["yk", "accountTypes:"], ["", "\n  - "], ["yk", "code: "], ["ys", "SYNDICATE_POOL\n"],
    ["", "    "], ["yk", "normalBalance: "], ["yp", "CREDIT\n"],
    ["", "  - "], ["yk", "code: "], ["ys", "BET_POSITION\n"],
    ["", "    "], ["yk", "normalBalance: "], ["yp", "DEBIT\n"],
    ["", "  - "], ["yk", "code: "], ["ys", "PLATFORM_COMMISSION\n"],
    2,
    ["", "\n"],
    ["yk", "valuationRules:"], ["", "\n  - "], ["yk", "name: "], ["ys", "bet_unit_to_gbp\n"],
    3,
    ["", "\n"],
    ["yk", "sagas:"], ["", "\n  - "], ["yk", "name: "], ["ys", "settle_syndicate\n"],
    ["", "    "], ["yk", "trigger: "], ["ys", "market-data.observation\n"],
    4
  ];

  function setStage(stage) {
    if (!graphEl) return;
    graphEl.querySelectorAll("[data-stage]").forEach(function (el) {
      if (parseInt(el.getAttribute("data-stage"), 10) <= stage) el.classList.add("on");
    });
  }

  function runPulse(done) {
    var dot = document.getElementById("pulse-dot");
    var path = graphEl && graphEl.querySelector('path[data-stage="4"]');
    if (!dot || !path) { if (done) done(); return; }
    // travel down the saga edge, then settle at the badge
    var len = path.getTotalLength();
    var t0 = null;
    dot.classList.add("on");
    function frame(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / 700, 1);
      var pt = path.getPointAtLength(p * len);
      dot.setAttribute("cx", pt.x);
      dot.setAttribute("cy", pt.y);
      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        dot.classList.remove("on");
        if (done) done();
      }
    }
    requestAnimationFrame(frame);
  }

  function typeManifest() {
    var cursor = manifestEl.querySelector(".type-cursor");
    var ti = 0;

    function nextToken() {
      if (ti >= SCRIPT.length) {
        runPulse(function () { setStage(5); });
        return;
      }
      var tok = SCRIPT[ti++];
      if (typeof tok === "number") {
        setStage(tok);
        setTimeout(nextToken, 420);
        return;
      }
      var span = document.createElement("span");
      if (tok[0]) span.className = tok[0];
      manifestEl.insertBefore(span, cursor);
      var text = tok[1];
      var ci = 0;
      (function typeChar() {
        span.textContent = text.slice(0, ++ci);
        if (ci < text.length) {
          setTimeout(typeChar, 14);
        } else {
          setTimeout(nextToken, 30);
        }
      })();
    }
    nextToken();
  }

  if (manifestEl && graphEl) {
    if (reducedMotion) {
      // show the finished state immediately
      var all = [];
      SCRIPT.forEach(function (tok) {
        if (typeof tok !== "number") {
          all.push(tok[0] ? '<span class="' + tok[0] + '">' + tok[1].replace(/</g, "&lt;") + "</span>" : tok[1]);
        }
      });
      manifestEl.innerHTML = all.join("");
      setStage(5);
      graphEl.querySelectorAll(".econ-edge").forEach(function (e) { e.style.transition = "none"; });
    } else if ("IntersectionObserver" in window) {
      var heroSeen = false;
      var ho = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !heroSeen) {
            heroSeen = true;
            ho.disconnect();
            setTimeout(typeManifest, 350);
          }
        });
      }, { threshold: 0.25 });
      ho.observe(manifestEl);
    } else {
      typeManifest();
    }
  }

  /* ---------- Saga compensation loop ---------- */
  var sagaSvg = document.getElementById("saga-svg");

  function sagaSet(i, state) {
    var g = document.getElementById("sg-step-" + i);
    var status = document.getElementById("sg-status-" + i);
    if (!g || !status) return;
    var rect = g.querySelector("rect");
    var styles = {
      pending:     { stroke: "#2c3850", text: "pending",      fill: "#76819c" },
      done:        { stroke: "#5ddc96", text: "completed ✓",  fill: "#5ddc96" },
      failed:      { stroke: "#f0796b", text: "timeout ✗",    fill: "#f0796b" },
      compensated: { stroke: "#f2c14e", text: "compensated ↺", fill: "#f2c14e" }
    }[state];
    rect.setAttribute("stroke", styles.stroke);
    status.textContent = styles.text;
    status.setAttribute("fill", styles.fill);
  }

  function sagaBar(text) {
    var bar = document.getElementById("saga-status-bar");
    if (bar) bar.textContent = text;
  }

  function fade(id, on) {
    var el = document.getElementById(id);
    if (el) {
      el.style.transition = "opacity 0.45s ease";
      el.style.opacity = on ? "1" : "0";
    }
  }

  function sagaCycle() {
    var t = 0;
    function at(ms, fn) { setTimeout(fn, ms); t = ms; }

    // reset
    [1, 2, 3, 4].forEach(function (i) { sagaSet(i, "pending"); });
    ["sg-comp-1", "sg-comp-2", "sg-comp-3", "sg-comp-label", "sg-result"].forEach(function (id) { fade(id, false); });
    sagaBar("running");

    at(600,  function () { sagaSet(1, "done"); });
    at(1300, function () { sagaSet(2, "done"); });
    at(2000, function () { sagaSet(3, "done"); });
    at(2700, function () { sagaSet(4, "failed"); sagaBar("step 4 failed — compensating"); });
    at(3400, function () { fade("sg-comp-label", true); fade("sg-comp-3", true); sagaSet(3, "compensated"); });
    at(4000, function () { fade("sg-comp-2", true); sagaSet(2, "compensated"); });
    at(4600, function () { fade("sg-comp-1", true); sagaSet(1, "compensated"); });
    at(5300, function () { fade("sg-result", true); sagaBar("compensated — ledger balanced"); });
    at(8200, sagaCycle);
  }

  if (sagaSvg) {
    if (reducedMotion) {
      // static end state: failure compensated, ledger balanced
      [1, 2, 3].forEach(function (i) { sagaSet(i, "compensated"); });
      sagaSet(4, "failed");
      ["sg-comp-1", "sg-comp-2", "sg-comp-3", "sg-comp-label", "sg-result"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.style.opacity = "1";
      });
      sagaBar("compensated — ledger balanced");
    } else if ("IntersectionObserver" in window) {
      var sagaStarted = false;
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !sagaStarted) {
            sagaStarted = true;
            so.disconnect();
            sagaCycle();
          }
        });
      }, { threshold: 0.35 });
      so.observe(sagaSvg);
    } else {
      sagaCycle();
    }
  }

  /* ---------- Cookbook category filters ---------- */
  var filterRow = document.getElementById("pattern-filters");
  var grid = document.getElementById("pattern-grid");
  if (filterRow && grid) {
    filterRow.addEventListener("click", function (ev) {
      var chip = ev.target.closest(".chip");
      if (!chip) return;
      filterRow.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("active"); });
      chip.classList.add("active");
      var cat = chip.getAttribute("data-filter");
      grid.querySelectorAll(".pattern-card").forEach(function (card) {
        var cats = (card.getAttribute("data-categories") || "").split(" ");
        card.style.display = (!cat || cats.indexOf(cat) !== -1) ? "" : "none";
      });
    });
  }
})();
