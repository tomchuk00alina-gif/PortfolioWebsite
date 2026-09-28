// Charts & animated stats. No libraries: each <figure class="chart"> carries its
// own data as inline JSON, and this file draws it. Every chart also gets a
// "View data" table so no value is reachable only by hover or by color.
//
//   <figure class="chart" data-chart="line|bars|split">
//     <figcaption>…</figcaption>
//     <script type="application/json">{…}</script>
//   </figure>

(function () {
  "use strict";

  var reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";
  // setTimeout-based frame: behaves like rAF but also runs in background tabs
  // and webviews that throttle rAF to zero.
  function frame(cb) { return setTimeout(function () { cb(Date.now()); }, 16); }

  function fmt(n, d) {
    return Number(n).toLocaleString("en-US", {
      minimumFractionDigits: d || 0,
      maximumFractionDigits: d || 0
    });
  }

  function el(tag, attrs, parent) {
    var node = tag.indexOf("svg:") === 0
      ? document.createElementNS(SVGNS, tag.slice(4))
      : document.createElement(tag);
    for (var k in attrs || {}) {
      if (k === "text") node.textContent = attrs[k];
      else if (k === "class") node.setAttribute("class", attrs[k]);
      else node.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(node);
    return node;
  }

  // Run fn once the element scrolls into view (immediately if unsupported).
  function onVisible(node, fn) {
    if (!("IntersectionObserver" in window)) return fn();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { io.disconnect(); fn(); }
      });
    }, { threshold: 0.25 });
    io.observe(node);
  }

  // Shared tooltip, positioned inside the figure.
  function makeTooltip(fig) {
    var tip = el("div", { class: "chart-tip", role: "status" }, fig);
    tip.hidden = true;
    return {
      show: function (html, x, y) {
        tip.innerHTML = html;
        tip.hidden = false;
        var fw = fig.clientWidth, tw = tip.offsetWidth;
        tip.style.left = Math.max(0, Math.min(fw - tw, x - tw / 2)) + "px";
        tip.style.top = (y - tip.offsetHeight - 12) + "px";
      },
      hide: function () { tip.hidden = true; }
    };
  }

  function addTable(fig, head, rows) {
    var det = el("details", { class: "chart-data" }, fig);
    el("summary", { text: "View data" }, det);
    var wrap = el("div", { class: "chart-table-wrap" }, det);
    var table = el("table", {}, wrap);
    var tr = el("tr", {}, el("thead", {}, table));
    head.forEach(function (h) { el("th", { text: h, scope: "col" }, tr); });
    var tb = el("tbody", {}, table);
    rows.forEach(function (r) {
      var row = el("tr", {}, tb);
      r.forEach(function (c) { el("td", { text: c }, row); });
    });
  }

  // ---------------------------------------------------------------------
  // Line: one series over time, area wash, crosshair tooltip.
  // data: { unit, points: [{x, label, y}], annotate: [index…] }
  // ---------------------------------------------------------------------
  // Clean tick step: the smallest 1/2/2.5/5 × 10^k that fits in <= 5 steps.
  function niceScale(v) {
    var p = Math.pow(10, Math.floor(Math.log10(v)) - 1);
    var m = [1, 2, 2.5, 5];
    for (var k = 0; k < 3; k++, p *= 10)
      for (var i = 0; i < m.length; i++)
        if (Math.ceil(v / (m[i] * p)) <= 5) return { step: m[i] * p, n: Math.ceil(v / (m[i] * p)) };
    return { step: v, n: 1 };
  }

  function renderLine(fig, data) {
    var plot = el("div", { class: "chart-plot" }, fig);
    var tip = makeTooltip(fig);
    var pts = data.points;
    var scale = niceScale(Math.max.apply(null, pts.map(function (p) { return p.y; })));
    var max = scale.step * scale.n;
    var drawn = false;

    function draw() {
      plot.innerHTML = "";
      var W = plot.clientWidth, H = 240;
      var m = { t: 28, r: 16, b: 28, l: 48 };
      var iw = W - m.l - m.r, ih = H - m.t - m.b;
      var X = function (i) { return m.l + (iw * i) / (pts.length - 1); };
      var Y = function (v) { return m.t + ih - (ih * v) / max; };

      var svg = el("svg:svg", {
        width: W, height: H, viewBox: "0 0 " + W + " " + H,
        role: "img", "aria-label": fig.querySelector(".chart-title").textContent,
        tabindex: "0"
      }, plot);

      // Recessive grid + y ticks (4 steps)
      for (var t = 0; t <= scale.n; t++) {
        var v = scale.step * t, y = Y(v);
        el("svg:line", { x1: m.l, x2: W - m.r, y1: y, y2: y, class: "grid" }, svg);
        el("svg:text", { x: m.l - 8, y: y + 4, class: "tick", "text-anchor": "end",
          text: v >= 1000 ? fmt(v / 1000, v % 1000 ? 1 : 0) + "K" : fmt(v) }, svg);
      }
      // X labels — thin out on narrow screens
      var every = W < 420 ? 3 : W < 640 ? 2 : 1;
      pts.forEach(function (p, i) {
        var last = pts.length - 1;
        if (i !== last && (i % every || last - i < every)) return;
        el("svg:text", { x: X(i), y: H - 8, class: "tick", "text-anchor": "middle", text: p.x }, svg);
      });

      var line = pts.map(function (p, i) { return (i ? "L" : "M") + X(i) + "," + Y(p.y); }).join("");
      var area = line + "L" + X(pts.length - 1) + "," + Y(0) + "L" + X(0) + "," + Y(0) + "Z";
      el("svg:path", { d: area, class: "area" }, svg);
      var path = el("svg:path", { d: line, class: "line" }, svg);

      if (!reduceMotion && !drawn) {
        var len = path.getTotalLength();
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        path.getBoundingClientRect();
        path.style.transition = "stroke-dashoffset 1.4s ease";
        path.style.strokeDashoffset = 0;
      }
      drawn = true;

      // Selective direct labels: the annotated points only
      (data.annotate || []).forEach(function (i) {
        var p = pts[i], x = X(i), y = Y(p.y);
        el("svg:circle", { cx: x, cy: y, r: 4, class: "dot" }, svg);
        var anchor = i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle";
        // Put the label below the point when a higher neighbour would cross it.
        var below = (pts[i - 1] && pts[i - 1].y > p.y) || (pts[i + 1] && pts[i + 1].y > p.y);
        el("svg:text", { x: x, y: below ? y + 20 : y - 12, class: "anno", "text-anchor": anchor, text: fmt(p.y) }, svg);
      });

      // Crosshair
      var cross = el("svg:line", { y1: m.t, y2: m.t + ih, class: "cross" }, svg);
      var cdot = el("svg:circle", { r: 5, class: "dot" }, svg);
      cross.style.display = cdot.style.display = "none";

      function focusAt(i) {
        var p = pts[i], x = X(i), y = Y(p.y);
        cross.setAttribute("x1", x); cross.setAttribute("x2", x);
        cdot.setAttribute("cx", x); cdot.setAttribute("cy", y);
        cross.style.display = cdot.style.display = "";
        tip.show("<b>" + fmt(p.y) + "</b> " + (data.unit || "") + "<br><span>" + p.label + "</span>",
          x, y);
        cur = i;
      }
      function clear() { cross.style.display = cdot.style.display = "none"; tip.hide(); }
      var cur = pts.length - 1;

      svg.addEventListener("pointermove", function (e) {
        var r = svg.getBoundingClientRect();
        var i = Math.round(((e.clientX - r.left - m.l) / iw) * (pts.length - 1));
        focusAt(Math.max(0, Math.min(pts.length - 1, i)));
      });
      svg.addEventListener("pointerleave", clear);
      svg.addEventListener("focus", function () { focusAt(cur); });
      svg.addEventListener("blur", clear);
      svg.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { focusAt(Math.min(pts.length - 1, cur + 1)); e.preventDefault(); }
        if (e.key === "ArrowLeft") { focusAt(Math.max(0, cur - 1)); e.preventDefault(); }
      });
    }

    onVisible(fig, function () {
      draw();
      if ("ResizeObserver" in window) {
        var lastW = plot.clientWidth;
        new ResizeObserver(function () {
          if (plot.clientWidth !== lastW) { lastW = plot.clientWidth; draw(); }
        }).observe(plot);
      }
    });

    addTable(fig, ["Date", data.unit ? data.unit[0].toUpperCase() + data.unit.slice(1) : "Value"],
      pts.map(function (p) { return [p.label, fmt(p.y)]; }));
  }

  // ---------------------------------------------------------------------
  // Bars: horizontal, value at the tip, optional highlight / range / note.
  // data: { rows: [{label, value, lo?, display, highlight?, note?}] }
  // ---------------------------------------------------------------------
  function renderBars(fig, data) {
    var list = el("div", { class: "hbars" }, fig);
    var tip = makeTooltip(fig);
    var max = Math.max.apply(null, data.rows.map(function (r) { return r.value; }));
    var bars = [];

    data.rows.forEach(function (r) {
      var row = el("div", { class: "hbar-row" + (r.highlight ? " is-hl" : "") }, list);
      el("div", { class: "hbar-label", text: r.label }, row);
      var track = el("div", { class: "hbar-track" }, row);
      var bar = el("div", { class: "hbar" + (r.value === 0 ? " is-zero" : "") }, track);
      el("span", { class: "hbar-val", text: r.display }, track);
      // Leave room at the end of the track for the value label.
      var left = r.lo != null ? (r.lo / max) * 78 : 0;
      var width = ((r.value - (r.lo || 0)) / max) * 78;
      bar.style.marginLeft = left + "%";
      bars.push({ bar: bar, w: width });

      if (r.note) {
        row.tabIndex = 0;
        var show = function () {
          var fr = fig.getBoundingClientRect(), br = track.getBoundingClientRect();
          tip.show("<b>" + r.display + "</b> " + r.label.toLowerCase() + "<br><span>" + r.note + "</span>",
            br.left - fr.left + Math.min(br.width / 2, 160), br.top - fr.top);
        };
        row.addEventListener("pointerenter", show);
        row.addEventListener("pointerleave", tip.hide);
        row.addEventListener("focus", show);
        row.addEventListener("blur", tip.hide);
      }
    });

    function grow() {
      bars.forEach(function (b) { b.bar.style.width = b.w + "%"; });
    }
    if (reduceMotion) grow(); else onVisible(fig, function () { frame(grow); });

    addTable(fig, ["Item", "Value", "Note"], data.rows.map(function (r) {
      return [r.label, r.display, r.note || ""];
    }));
  }

  // ---------------------------------------------------------------------
  // Split: a single 100% bar for a two-part share, with a legend.
  // data: { parts: [{label, value, highlight?}] }  (values in %)
  // ---------------------------------------------------------------------
  function renderSplit(fig, data) {
    var bar = el("div", { class: "split-bar", role: "img",
      "aria-label": data.parts.map(function (p) { return p.value + "% " + p.label; }).join(", ") }, fig);
    var segs = data.parts.map(function (p) {
      var s = el("div", { class: "split-seg" + (p.highlight ? " is-hl" : "") }, bar);
      s.style.flexGrow = reduceMotion ? p.value : 0.001;
      return s;
    });
    var legend = el("div", { class: "chart-legend" }, fig);
    data.parts.forEach(function (p) {
      var item = el("span", { class: "legend-item" }, legend);
      el("i", { class: "sw" + (p.highlight ? " is-hl" : "") }, item);
      el("b", { text: p.value + "%" }, item);
      item.appendChild(document.createTextNode(" " + p.label));
    });
    if (!reduceMotion) onVisible(fig, function () {
      frame(function () {
        segs.forEach(function (s, i) { s.style.flexGrow = data.parts[i].value; });
      });
    });
    addTable(fig, ["Segment", "Share"], data.parts.map(function (p) { return [p.label, p.value + "%"]; }));
  }

  // ---------------------------------------------------------------------
  // Count-up for headline numbers. Animates the last number inside the
  // element and keeps any prefix/suffix ("+", "%", "×", "K") intact.
  // ---------------------------------------------------------------------
  function initCountUp() {
    if (reduceMotion) return;
    document.querySelectorAll("[data-countup]").forEach(function (node) {
      var final = node.textContent;
      var m = final.match(/^(.*?)(\d[\d,]*\.?\d*)([^\d]*)$/);
      if (!m) return;
      var pre = m[1], raw = m[2], post = m[3];
      var target = parseFloat(raw.replace(/,/g, ""));
      var dec = (raw.split(".")[1] || "").length;
      var commas = raw.indexOf(",") > -1;
      var show = function (v) {
        var s = commas ? fmt(v, dec) : v.toFixed(dec);
        node.textContent = pre + s + post;
      };
      // Reserve the final width so the layout doesn't jitter while counting.
      if (getComputedStyle(node).display === "inline") node.style.display = "inline-block";
      node.style.minWidth = node.offsetWidth + "px";
      show(0);
      onVisible(node, function () {
        var t0 = null, dur = 1200;
        function step(ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / dur);
          var e = 1 - Math.pow(1 - k, 3);
          if (k < 1) { show(target * e); frame(step); }
          else node.textContent = final;
        }
        frame(step);
      });
    });
  }

  // Sparkline: a tiny line from data-spark="1,2,3".
  function initSparks() {
    document.querySelectorAll("[data-spark]").forEach(function (node) {
      var v = node.getAttribute("data-spark").split(",").map(Number);
      var W = 120, H = 28, max = Math.max.apply(null, v);
      var d = v.map(function (y, i) {
        return (i ? "L" : "M") + ((W - 4) * i / (v.length - 1) + 2).toFixed(1) + "," +
          (H - 3 - (H - 6) * y / max).toFixed(1);
      }).join("");
      var svg = el("svg:svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, "aria-hidden": "true" }, node);
      el("svg:path", { d: d, class: "spark" }, svg);
    });
  }

  var renderers = { line: renderLine, bars: renderBars, split: renderSplit };

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("figure.chart[data-chart]").forEach(function (fig) {
      var src = fig.querySelector('script[type="application/json"]');
      var fn = renderers[fig.getAttribute("data-chart")];
      if (!src || !fn) return;
      try { fn(fig, JSON.parse(src.textContent)); }
      catch (err) { console.error("chart failed", err); }
    });
    initCountUp();
    initSparks();
  });
})();
