const $ = (sel, el = document) => el.querySelector(sel);

function showMsg(text) {
  const m = $("#msg");
  m.textContent = text;
  m.classList.add("visible");
  clearTimeout(showMsg._t);
  showMsg._t = setTimeout(() => m.classList.remove("visible"), 5000);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body && typeof options.body === "string"
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!res.ok) {
    const detail =
      data && typeof data === "object" && data.detail != null
        ? JSON.stringify(data.detail)
        : res.statusText;
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return data;
}

async function refreshHealth() {
  const el = $("#health");
  try {
    const data = await fetchJson("/health");
    el.textContent = data.status === "ok" ? "API healthy" : "Unknown";
    el.className = "badge ok";
  } catch {
    el.textContent = "Unreachable";
    el.className = "badge bad";
  }
}

function renderItems(items) {
  const ul = $("#items-list");
  if (!items.length) {
    ul.innerHTML = '<p class="empty">No items yet.</p>';
    return;
  }
  ul.innerHTML = "";
  items.forEach((it) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="item-body">
        <strong>${escapeHtml(it.name)}</strong>
        <small>${it.description ? escapeHtml(it.description) : "—"}</small>
      </div>
      <button type="button" class="danger" data-del-item="${it.id}">Delete</button>
    `;
    ul.appendChild(li);
  });
  ul.querySelectorAll("[data-del-item]").forEach((btn) => {
    btn.addEventListener("click", () => deleteItem(btn.getAttribute("data-del-item")));
  });
}

function renderTasks(tasks) {
  const ul = $("#tasks-list");
  if (!tasks.length) {
    ul.innerHTML = '<p class="empty">No tasks yet.</p>';
    return;
  }
  ul.innerHTML = "";
  tasks.forEach((t) => {
    const li = document.createElement("li");
    li.className = "task-row" + (t.done ? " done" : "");
    li.innerHTML = `
      <div class="item-body">
        <strong>${escapeHtml(t.title)}</strong>
        <small>${t.done ? "Done" : "Open"}</small>
      </div>
      <div class="task-actions">
        <button type="button" class="secondary" data-toggle-task="${t.id}">${t.done ? "Undo" : "Done"}</button>
        <button type="button" class="danger" data-del-task="${t.id}">Delete</button>
      </div>
    `;
    ul.appendChild(li);
  });
  ul.querySelectorAll("[data-toggle-task]").forEach((btn) => {
    btn.addEventListener("click", () => toggleTask(btn.getAttribute("data-toggle-task")));
  });
  ul.querySelectorAll("[data-del-task]").forEach((btn) => {
    btn.addEventListener("click", () => deleteTask(btn.getAttribute("data-del-task")));
  });
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

async function loadItems() {
  const items = await fetchJson("/items");
  renderItems(items);
}

async function loadTasks() {
  const tasks = await fetchJson("/tasks");
  renderTasks(tasks);
}

async function deleteItem(id) {
  try {
    await fetchJson(`/items/${id}`, { method: "DELETE" });
    await loadItems();
  } catch (e) {
    showMsg(e.message);
  }
}

async function deleteTask(id) {
  try {
    await fetchJson(`/tasks/${id}`, { method: "DELETE" });
    await loadTasks();
  } catch (e) {
    showMsg(e.message);
  }
}

async function toggleTask(id) {
  try {
    const t = await fetchJson(`/tasks/${id}`);
    await fetchJson(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ done: !t.done }),
    });
    await loadTasks();
  } catch (e) {
    showMsg(e.message);
  }
}

$("#form-item").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = $("#item-name").value.trim();
  const description = $("#item-desc").value.trim() || null;
  if (!name) return;
  try {
    await fetchJson("/items", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
    $("#item-name").value = "";
    $("#item-desc").value = "";
    await loadItems();
  } catch (err) {
    showMsg(err.message);
  }
});

$("#form-task").addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = $("#task-title").value.trim();
  const done = $("#task-done").checked;
  if (!title) return;
  try {
    await fetchJson("/tasks", {
      method: "POST",
      body: JSON.stringify({ title, done }),
    });
    $("#task-title").value = "";
    $("#task-done").checked = false;
    await loadTasks();
  } catch (err) {
    showMsg(err.message);
  }
});

$("#btn-refresh").addEventListener("click", async () => {
  try {
    await refreshHealth();
    await loadItems();
    await loadTasks();
  } catch (e) {
    showMsg(e.message);
  }
});

function placeClouds() {
  const host = document.getElementById("clouds");
  if (!host) return;
  host.innerHTML = "";
  const count = 11 + Math.floor(Math.random() * 7);
  for (let i = 0; i < count; i++) {
    const el = document.createElement("div");
    el.className = "cloud";
    const w = 64 + Math.random() * 150;
    const aspect = 0.3 + Math.random() * 0.14;
    el.style.width = `${w}px`;
    el.style.height = `${w * aspect}px`;
    el.style.left = `${4 + Math.random() * 92}%`;
    el.style.top = `${3 + Math.random() * 90}%`;
    el.style.opacity = `${0.05 + Math.random() * 0.14}`;
    el.style.animationDelay = `${-Math.random() * 85}s`;
    el.style.animationDuration = `${65 + Math.random() * 55}s`;
    host.appendChild(el);
  }
}

(async function init() {
  placeClouds();
  await refreshHealth();
  try {
    await loadItems();
    await loadTasks();
  } catch (e) {
    showMsg(e.message);
  }
})();
