"use strict";
/* The decomposition figure.

   The series are built by tools/make_decomposition.py from the Lehman-ICE and
   TRACE monthly panel, value-weighted on the previous month's market value -- the weighting
   that reproduces the published bond market factor, corr 0.99996 in the TRACE era. The CSV
   beside this chart is exactly what is plotted, which is the rule FactorViz holds too.

   The sample control RE-CUMULATES from the chosen first month. It is a window on the data,
   not a crop of a fixed picture, so every line starts at zero wherever the reader puts it.

   Two range inputs share one track, which is how a two-handled slider is built without a
   library -- the track is drawn once, the inputs sit transparently on top of it, and only
   their thumbs take pointer events. */
(function () {
  // ❗The data file sits beside this script. Found from the script's own address, not the page's,
  // so the figure draws the same on github.io and inside a WordPress page on the domain.
  const CSV = new URL("decomposition.csv", document.currentScript.src).href;
  const COLORS = {market: "#1f4e79", treasury: "#bc6c25", credit: "#2a9d8f", rf: "#8d99ae"};
  // "All three" draws the three credit components side by side, one colour each.
  const CREDIT = {bns: "#2a9d8f", cls: "#7b4fa3", apr: "#c2410c"};
  const NAMES = {bns: "BNS", cls: "CLS", apr: "APR"};
  const PRESETS = [["Full", null], ["1985+", "1985-01"], ["2002+", "2002-08"],
                   ["Last 20y", -240], ["Last 10y", -120]];
  let ROWS = null, chart = null;

  const $ = (id) => document.getElementById(id);

  function cum(xs) {          // cumulative log return in percent, from zero
    let a = 0;
    return xs.map((x) => { a += Math.log(1 + x); return a * 100; });
  }

  function bounds() {
    let i = Number($("dec-from").value), j = Number($("dec-to").value);
    if (i > j) { const t = i; i = j; j = t; }
    if (j - i < 11) j = Math.min(ROWS.length - 1, i + 11);   // a year is the shortest window
    return [i, j];
  }

  function window_() {
    const [i, j] = bounds();
    return ROWS.slice(i, j + 1);
  }

  function paintTrack() {
    const [i, j] = bounds();
    const n = ROWS.length - 1;
    $("dec-fill").style.left = (100 * i / n) + "%";
    $("dec-fill").style.width = (100 * (j - i) / n) + "%";
  }

  function draw() {
    const b = $("dec-bench").value;
    const rows = window_();
    const dates = rows.map((r) => r.date);
    const mk = (label, data, color) => ({
      label, data, borderColor: color, backgroundColor: color,
      borderWidth: 1.9, pointRadius: 0, tension: 0,
    });
    const credit = (k) => cum(rows.map((r) => r.market - r["treasury_" + k]));
    const datasets = [mk("Bond market, total return", cum(rows.map((r) => r.market)), COLORS.market)];
    if (b === "all") {
      for (const k of ["bns", "cls", "apr"]) {
        datasets.push(mk("Credit component (" + NAMES[k] + ")", credit(k), CREDIT[k]));
      }
    } else {
      datasets.push(
        mk("Duration-matched Treasuries (" + NAMES[b] + ")",
           cum(rows.map((r) => r["treasury_" + b])), COLORS.treasury),
        mk("Credit component", credit(b), COLORS.credit));
    }
    datasets.push(mk("One-month T-bill", cum(rows.map((r) => r.rf)), COLORS.rf));
    $("dec-span").textContent = dates[0].slice(0, 7) + " to "
      + dates[dates.length - 1].slice(0, 7) + ", " + dates.length + " months";
    paintTrack();
    if (chart) chart.destroy();
    chart = new Chart($("dec-chart"), {
      type: "line",
      data: {labels: dates, datasets},
      options: {
        responsive: true, maintainAspectRatio: false, animation: false,
        interaction: {mode: "index", intersect: false},
        scales: {
          // The axis shows years, flat. A month-end date on a slant (1973-02-28) is noise at
          // this scale; the tooltip still names the month.
          x: {ticks: {maxTicksLimit: window.innerWidth < 640 ? 6 : 12, autoSkip: true, maxRotation: 0,
                      callback: function (v) { return this.getLabelForValue(v).slice(0, 4); }},
              grid: {display: false}},
          y: {title: {display: true, text: "Cumulative log return (%)"},
              grid: {color: "rgba(128,128,128,.18)"}},
        },
        plugins: {
          legend: {position: "bottom", labels: {boxWidth: 10, font: {size: 11}}},
          tooltip: {callbacks: {title: (items) => items[0].label.slice(0, 7),
                                label: (c) => c.dataset.label + ", " + c.parsed.y.toFixed(1) + "%"}},
        },
      },
    });
  }

  function applyPreset(spec) {
    const last = ROWS.length - 1;
    let i = 0;
    if (typeof spec === "string") {
      i = ROWS.findIndex((r) => r.date >= spec + "-01");
      if (i < 0) i = 0;
    } else if (typeof spec === "number") {
      i = Math.max(0, last + 1 + spec);
    }
    $("dec-from").value = String(i);
    $("dec-to").value = String(last);
    draw();
  }

  fetch(CSV).then((r) => {
    // ❗A 404 is not data. Without this the parser turned GitHub's 404 page into rows of
    // NaN, the filter emptied them, and the chart died on dates[0] with a TypeError that
    // said nothing about the real problem, a wrong URL.
    if (!r.ok) throw new Error("the data file returned " + r.status);
    return r.text();
  }).then((text) => {
    const lines = text.trim().split(/\r?\n/);
    const head = lines[0].split(",");
    ROWS = lines.slice(1).map((line) => {
      const p = line.split(",");
      const o = {};
      head.forEach((h, i) => { o[h] = h === "date" ? p[i] : Number(p[i]); });
      return o;
    }).filter((r) => Number.isFinite(r.market) && Number.isFinite(r.rf));
    if (!ROWS.length) throw new Error("the data file parsed to no usable rows");

    const last = ROWS.length - 1;
    for (const id of ["dec-from", "dec-to"]) $(id).max = String(last);
    $("dec-from").value = "0";
    $("dec-to").value = String(last);
    for (const id of ["dec-from", "dec-to", "dec-bench"]) $(id).oninput = draw;

    $("dec-presets").innerHTML = PRESETS
      .map((p, k) => `<button type="button" data-k="${k}">${p[0]}</button>`).join("");
    $("dec-presets").querySelectorAll("button").forEach((b) => {
      b.onclick = () => applyPreset(PRESETS[Number(b.dataset.k)][1]);
    });

    const pop = $("dec-pop"), info = $("dec-info");
    info.onclick = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const open = pop.classList.toggle("hidden");
      info.setAttribute("aria-expanded", String(!open));
    };
    pop.onclick = (ev) => ev.stopPropagation();
    document.addEventListener("click", () => {
      pop.classList.add("hidden");
      info.setAttribute("aria-expanded", "false");
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        pop.classList.add("hidden");
        info.setAttribute("aria-expanded", "false");
      }
    });

    draw();
  }).catch((e) => {
    $("dec-note").textContent = "The figure data could not be loaded. " + e;
  });
})();
