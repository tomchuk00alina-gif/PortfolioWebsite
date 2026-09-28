// Alina Tomchuk — portfolio site behavior.
// No frameworks, no build step: plain static HTML so it can be hosted
// anywhere and search crawlers see real content, not client-rendered output.

(function () {
  "use strict";

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  function initYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  // Mobile nav — the button previously did nothing at all.
  function initMobileNav() {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("navLinks");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var isHidden = nav.hasAttribute("hidden");
      if (isHidden) {
        nav.removeAttribute("hidden");
        toggle.setAttribute("aria-expanded", "true");
      } else {
        nav.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.setAttribute("hidden", "");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ---------------------------------------------------------------------
  // Visitor stats — GoatCounter (free, no cookies, no consent banner needed).
  // Sign up at goatcounter.com, then put your code here, e.g. "alina-tomchuk".
  // Left empty, nothing loads.
  // ---------------------------------------------------------------------
  var GOATCOUNTER_CODE = "";

  function initAnalytics() {
    if (!GOATCOUNTER_CODE || location.protocol === "file:") return;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", "https://" + GOATCOUNTER_CODE + ".goatcounter.com/count");
    document.head.appendChild(s);
  }

  // Contact form — sends to Formspree without leaving the page.
  function initContactForm() {
    var form = document.getElementById("contactForm");
    var status = document.getElementById("cfStatus");
    if (!form || !status) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
        status.className = "cf-status";
        status.textContent = "The form isn't connected yet — please email tomchuk00alina@gmail.com.";
        return;
      }
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      status.className = "cf-status";
      status.textContent = "Sending…";

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        form.reset();
        status.className = "cf-status is-ok";
        status.textContent = "Thanks — your message is on its way. I'll get back to you soon.";
      }).catch(function () {
        status.className = "cf-status";
        status.textContent = "Something went wrong. Please email tomchuk00alina@gmail.com instead.";
      }).then(function () {
        btn.disabled = false;
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initReveal();
    initYear();
    initMobileNav();
    initContactForm();
    initAnalytics();
  });
})();
