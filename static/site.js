(function () {
  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    if (window.matchMedia("(max-width: 639px)").matches) {
      toggle.removeAttribute("hidden");
    }

    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function renderWeekendCalendar(containerId) {
    var root = document.getElementById(containerId);
    if (!root) return;

    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    var first = new Date(year, month, 1);
    var lastDay = new Date(year, month + 1, 0).getDate();
    var startPad = first.getDay();

    var wrap = document.createElement("div");
    wrap.className = "weekend-calendar";

    var title = document.createElement("p");
    title.className = "calendar-month-label";
    title.textContent = monthNames[month] + " " + year;
    wrap.appendChild(title);

    var grid = document.createElement("div");
    grid.className = "calendar-grid";
    grid.setAttribute("role", "grid");

    var dow = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    dow.forEach(function (label) {
      var h = document.createElement("div");
      h.className = "calendar-cell calendar-dow";
      h.textContent = label;
      grid.appendChild(h);
    });

    var i;
    for (i = 0; i < startPad; i++) {
      var empty = document.createElement("div");
      empty.className = "calendar-cell calendar-empty";
      empty.setAttribute("aria-hidden", "true");
      grid.appendChild(empty);
    }

    for (i = 1; i <= lastDay; i++) {
      var d = new Date(year, month, i);
      var dayOfWeek = d.getDay();
      var cell = document.createElement("div");
      cell.className = "calendar-cell calendar-day";
      cell.textContent = String(i);
      if (dayOfWeek === 6) {
        cell.classList.add("is-saturday");
        cell.setAttribute("title", "Saturday");
      }
      grid.appendChild(cell);
    }

    wrap.appendChild(grid);
    root.appendChild(wrap);
  }

  renderWeekendCalendar("weekend-calendar");
})();
