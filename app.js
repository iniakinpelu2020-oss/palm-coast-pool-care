/* Palm Coast Pool Care — estimates and deck */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var PHONE = "+15617849320";
  var TZ = "America/New_York";

  var boot = $("#boot");
  if (boot) { window.setTimeout(function () { if (boot.parentNode) { boot.parentNode.removeChild(boot); } }, 2600); }

  /* ---------- today ---------- */
  (function today() {
    var rows = $$(".hours tr[data-day]");
    if (!rows.length) { return; }
    var label = "Mon";
    try { label = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: TZ }).format(new Date()); }
    catch (e) { label = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()]; }
    rows.forEach(function (row) {
      if (row.getAttribute("data-day") === label) {
        row.classList.add("is-today");
        var cell = $(".hours__now", row);
        if (cell) { cell.textContent = "Today"; }
      }
    });
  })();

  /* ---------- estimate ---------- */
  var tallyNum = $("#tallyNum"), tallyList = $("#tallyList");
  var drawerTotal = $("#drawerTotal"), drawerList = $("#drawerList");
  var drawerCall = $("#drawerCall"), drawerText = $("#drawerText");
  var timingGroup = $("#timingGroup");
  var money = function (n) { return "$" + n; };

  function picked(group) {
    var wrap = $('.pills[data-group="' + group + '"]');
    if (!wrap) { return null; }
    var btn = $('button[aria-pressed="true"]', wrap);
    if (!btn) { return null; }
    var label = btn.getAttribute("data-label") || (btn.firstChild ? btn.firstChild.textContent.trim() : "");
    var amount = parseInt(btn.hasAttribute("data-price") ? btn.getAttribute("data-price") : (btn.getAttribute("data-add") || "0"), 10);
    return {
      label: label,
      amount: isNaN(amount) ? 0 : amount,
      monthly: btn.getAttribute("data-monthly") === "1"
    };
  }

  function calc() {
    var service = picked("service");
    var volume = picked("volume");
    var timing = picked("timing");
    var monthly = !!(service && service.monthly);
    var rows = [];
    if (service) { rows.push({ label: service.label, amount: service.amount, base: true }); }
    if (volume) { rows.push({ label: volume.label, amount: volume.amount }); }
    if (timing && !monthly) { rows.push({ label: timing.label, amount: timing.amount }); }
    var total = rows.reduce(function (s, r) { return s + r.amount; }, 0);
    return { rows: rows, total: total, monthly: monthly, service: service, volume: volume, timing: monthly ? null : timing };
  }

  function render(pop) {
    var est = calc();
    var suffix = est.monthly ? "<em>/mo</em>" : "";
    if (tallyNum) {
      tallyNum.innerHTML = money(est.total) + suffix;
      if (pop) {
        tallyNum.classList.add("pop");
        window.setTimeout(function () { tallyNum.classList.remove("pop"); }, 240);
      }
    }
    var html = est.rows.map(function (r) {
      return "<li><span>" + r.label + "</span><span>" + (r.base ? "" : "+") + money(r.amount) + "</span></li>";
    }).join("");
    if (tallyList) { tallyList.innerHTML = html; }
    if (drawerTotal) { drawerTotal.innerHTML = money(est.total) + suffix; }
    if (drawerList) { drawerList.innerHTML = html; }
    if (timingGroup) { timingGroup.classList.toggle("is-off", est.monthly); }

    var parts = est.rows.map(function (r) { return r.label + " " + (r.base ? money(r.amount) : "+" + money(r.amount)); });
    var body = encodeURIComponent("Hi Palm Coast — estimate from your site: " + parts.join(" · ") + " = " + money(est.total) + (est.monthly ? " per month" : "") + ". Can you confirm?");
    if (drawerCall) { drawerCall.href = "tel:" + PHONE; }
    if (drawerText) { drawerText.href = "sms:" + PHONE + "?&body=" + body; }
  }

  $$(".pills").forEach(function (wrap) {
    wrap.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("button") : null;
      if (!btn || !wrap.contains(btn)) { return; }
      $$("button", wrap).forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      render(true);
    });
  });

  render(false);

  /* ---------- deck cards carry into the estimate ---------- */
  $$(".ripple").forEach(function (card, i) {
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    function carry() {
      var wrap = $('.pills[data-group="service"]');
      if (!wrap) { return; }
      var buttons = $$("button", wrap);
      var target = buttons[i];
      if (!target) { return; }
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", b === target ? "true" : "false"); });
      render(true);
      var section = $("#estimate");
      if (section) {
        var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      }
    }
    card.addEventListener("click", carry);
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); carry(); }
    });
  });

  /* ---------- drawer ---------- */
  var drawer = $("#drawer"), scrim = $("#scrim"), drawerClose = $("#drawerClose"), lastFocus = null;

  function openDrawer() {
    if (!drawer) { return; }
    lastFocus = document.activeElement;
    render(false);
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    if (scrim) { scrim.hidden = false; scrim.classList.add("is-open"); }
    document.body.style.overflow = "hidden";
    if (drawerClose) { drawerClose.focus(); }
  }

  function closeDrawer() {
    if (!drawer) { return; }
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (scrim) {
      scrim.classList.remove("is-open");
      window.setTimeout(function () { if (!drawer.classList.contains("is-open")) { scrim.hidden = true; } }, 400);
    }
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  $$("[data-open-estimate]").forEach(function (b) { b.addEventListener("click", openDrawer); });
  if (drawerClose) { drawerClose.addEventListener("click", closeDrawer); }
  if (scrim) { scrim.addEventListener("click", closeDrawer); }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) { closeDrawer(); }
  });
})();
