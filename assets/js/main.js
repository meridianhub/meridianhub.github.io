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

/* ---------- Cookbook pattern economy viewer ---------- */
(function () {
  "use strict";
  var modal = document.getElementById("pattern-modal");
  var dataEl = document.getElementById("cookbook-data");
  if (!modal || !dataEl || typeof modal.showModal !== "function") return;

  var patterns = JSON.parse(dataEl.textContent).patterns;
  var links = JSON.parse(document.getElementById("cookbook-links").textContent);

  var INK = "#1c2433", FAINT = "#8b93a8", RULE = "#c9bfa9",
      GREEN = "#1e7a4f", GREEN_BG = "#e3f0e8", AMBER = "#b07c18",
      ENGINE = "#141b29", ENGINE_GREEN = "#5ddc96", ENGINE_DIM = "#76819c",
      CARD = "#fffdf9";
  var MONO = "IBM Plex Mono, monospace";

  function nodeWidth(label) { return Math.max(label.length * 7.4 + 26, 84); }

  function layoutRow(items, widthOf, gap, maxPerLine) {
    // returns lines: [[{item, x, w}...]], each line centred later
    var lines = [], line = [];
    items.forEach(function (it) {
      if (line.length >= maxPerLine) { lines.push(line); line = []; }
      line.push(it);
    });
    if (line.length) lines.push(line);
    return lines.map(function (l) {
      var x = 0;
      return l.map(function (it) {
        var w = widthOf(it);
        var placed = { item: it, x: x, w: w };
        x += w + gap;
        return placed;
      });
    });
  }

  function svgEl(tag, attrs, text) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    if (text) el.textContent = text;
    return el;
  }

  function renderGraph(p) {
    var GAP = 18, NODE_H = 44, LINE_GAP = 14, LANE_GAP = 64;

    // instruments: provided first, then external ones referenced by accounts or valuations
    var provided = p.instruments.map(function (i) { return { code: i.code, type: i.type, external: false }; });
    var known = {};
    provided.forEach(function (i) { known[i.code] = true; });
    var refs = [];
    p.account_types.forEach(function (a) { refs = refs.concat(a.instruments); });
    p.valuation_rules.forEach(function (v) { refs.push(v.from, v.to); });
    refs.forEach(function (code) {
      if (code && !known[code]) { known[code] = true; provided.push({ code: code, type: "", external: true }); }
    });

    var lanes = [
      { key: "instruments", title: "INSTRUMENTS", items: provided, w: function (i) { return nodeWidth(i.code); } },
      { key: "accounts", title: "ACCOUNT TYPES", items: p.account_types, w: function (a) { return nodeWidth(a.code + " WW"); } },
      { key: "sagas", title: "SAGAS", items: p.sagas.map(function (s) { return { code: s + "()" }; }), w: function (s) { return nodeWidth(s.code); } }
    ].filter(function (l) { return l.items.length; });

    // layout each lane, compute extents
    var totalW = 320;
    lanes.forEach(function (lane) {
      lane.lines = layoutRow(lane.items, lane.w, GAP, 5);
      lane.lineWidths = lane.lines.map(function (l) {
        var last = l[l.length - 1];
        return last.x + last.w;
      });
      totalW = Math.max(totalW, Math.max.apply(null, lane.lineWidths) + 60);
    });

    var y = 28, positions = {};
    lanes.forEach(function (lane) {
      lane.y = y;
      y += lane.lines.length * NODE_H + (lane.lines.length - 1) * LINE_GAP + LANE_GAP;
    });
    var totalH = y - LANE_GAP + 20;

    var svg = svgEl("svg", { viewBox: "0 0 " + totalW + " " + totalH, width: Math.min(totalW, 800) });
    var defs = svgEl("defs", {});
    var marker = svgEl("marker", { id: "pm-arr", viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "5.5", markerHeight: "5.5", orient: "auto-start-reverse" });
    marker.appendChild(svgEl("path", { d: "M0 0 L10 5 L0 10 z", fill: FAINT }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    // place nodes, remember centres
    lanes.forEach(function (lane) {
      svg.appendChild(svgEl("text", { x: 16, y: lane.y - 9, "font-family": MONO, "font-size": "8.5", fill: FAINT, "letter-spacing": "2" }, lane.title));
      lane.lines.forEach(function (line, li) {
        var lw = lane.lineWidths[li];
        var offset = (totalW - lw) / 2;
        line.forEach(function (pn) {
          var x = offset + pn.x, ny = lane.y + li * (NODE_H + LINE_GAP);
          var item = pn.item;
          var cx = x + pn.w / 2;
          if (lane.key === "instruments") {
            positions["I:" + item.code] = { x: cx, top: ny, bot: ny + NODE_H };
            svg.appendChild(svgEl("rect", { x: x, y: ny, width: pn.w, height: NODE_H, rx: 9, fill: CARD, stroke: item.external ? RULE : INK, "stroke-width": 1.3, "stroke-dasharray": item.external ? "4 3" : "none" }));
            svg.appendChild(svgEl("text", { x: cx, y: ny + 19, "text-anchor": "middle", "font-family": MONO, "font-size": "11", "font-weight": "600", fill: item.external ? FAINT : INK }, item.code));
            svg.appendChild(svgEl("text", { x: cx, y: ny + 33, "text-anchor": "middle", "font-family": MONO, "font-size": "8", fill: FAINT }, item.external ? "REQUIRED" : (item.type || "INSTRUMENT")));
          } else if (lane.key === "accounts") {
            positions["A:" + item.code] = { x: cx, top: ny, bot: ny + NODE_H };
            var credit = item.side === "CR";
            svg.appendChild(svgEl("rect", { x: x, y: ny, width: pn.w, height: NODE_H, rx: 9, fill: credit ? GREEN_BG : CARD, stroke: credit ? GREEN : INK, "stroke-width": 1.3 }));
            svg.appendChild(svgEl("text", { x: cx, y: ny + 19, "text-anchor": "middle", "font-family": MONO, "font-size": "10.5", "font-weight": "600", fill: credit ? GREEN : INK }, item.code));
            svg.appendChild(svgEl("text", { x: cx, y: ny + 33, "text-anchor": "middle", "font-family": MONO, "font-size": "8", fill: credit ? GREEN : FAINT, opacity: "0.8" }, credit ? "ACCOUNT · CR" : "ACCOUNT · DR"));
          } else {
            svg.appendChild(svgEl("rect", { x: x, y: ny, width: pn.w, height: NODE_H, rx: NODE_H / 2, fill: ENGINE }));
            svg.appendChild(svgEl("text", { x: cx, y: ny + 19, "text-anchor": "middle", "font-family": MONO, "font-size": "10.5", "font-weight": "600", fill: ENGINE_GREEN }, item.code));
            svg.appendChild(svgEl("text", { x: cx, y: ny + 33, "text-anchor": "middle", "font-family": MONO, "font-size": "8", fill: ENGINE_DIM }, "SAGA"));
          }
        });
      });
    });

    // edges: account -> allowed instruments (drawn beneath nodes is fine visually here)
    p.account_types.forEach(function (a) {
      var from = positions["A:" + a.code];
      if (!from) return;
      a.instruments.forEach(function (code) {
        var to = positions["I:" + code];
        if (!to) return;
        var midY = (to.bot + from.top) / 2;
        svg.insertBefore(svgEl("path", {
          d: "M" + from.x + " " + (from.top - 1) + " C" + from.x + " " + midY + ", " + to.x + " " + midY + ", " + to.x + " " + (to.bot + 2),
          fill: "none", stroke: FAINT, "stroke-width": 1.1, "marker-end": "url(#pm-arr)", opacity: "0.75"
        }), svg.firstChild.nextSibling);
      });
    });

    // valuation edges between instruments (dashed amber arcs above the lane)
    p.valuation_rules.forEach(function (v) {
      var a = positions["I:" + v.from], b = positions["I:" + v.to];
      if (!a || !b || a.x === b.x) return;
      var lift = Math.min(Math.abs(b.x - a.x) / 4 + 8, 24);
      svg.appendChild(svgEl("path", {
        d: "M" + a.x + " " + (a.top - 2) + " C" + a.x + " " + (a.top - lift) + ", " + b.x + " " + (b.top - lift) + ", " + b.x + " " + (b.top - 2),
        fill: "none", stroke: AMBER, "stroke-width": 1.2, "stroke-dasharray": "4 3"
      }));
    });

    return svg;
  }

  function openPattern(name, push) {
    var p = patterns.find(function (x) { return x.name === name; });
    if (!p) return;
    document.getElementById("pm-name").textContent = p.name;
    document.getElementById("pm-title").textContent = p.title;
    document.getElementById("pm-desc").textContent = p.description;
    var graph = document.getElementById("pm-graph");
    graph.innerHTML = "";
    graph.appendChild(renderGraph(p));
    var trig = document.getElementById("pm-triggers");
    trig.innerHTML = "";
    (p.triggers || []).forEach(function (t) {
      var chip = document.createElement("span");
      chip.className = "trigger-chip";
      chip.textContent = t;
      trig.appendChild(chip);
    });
    document.getElementById("pm-demo").href = links.demo + "/cookbook/" + p.name;
    document.getElementById("pm-src").href = links.repo + "/tree/develop/cookbook/patterns/" + p.name;
    if (push) history.replaceState(null, "", "?pattern=" + encodeURIComponent(p.name));
    if (!modal.open) modal.showModal();
  }

  function closeModal() {
    if (modal.open) modal.close();
    history.replaceState(null, "", location.pathname);
  }

  document.addEventListener("click", function (ev) {
    var card = ev.target.closest(".pattern-card[data-pattern]");
    if (card) {
      ev.preventDefault();
      openPattern(card.getAttribute("data-pattern"), true);
    }
  });
  document.getElementById("pm-close").addEventListener("click", closeModal);
  modal.addEventListener("click", function (ev) {
    if (ev.target === modal) closeModal(); // backdrop
  });
  modal.addEventListener("cancel", function () { history.replaceState(null, "", location.pathname); });

  var deepLink = new URLSearchParams(location.search).get("pattern");
  if (deepLink) openPattern(deepLink, false);
})();
