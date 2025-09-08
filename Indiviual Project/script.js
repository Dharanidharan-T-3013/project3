/* ======== Simple Student Task Manager ======== */
/* Data shape:
   { id, title, description, deadline (ISO or ''), status, createdAt (ISO) }
*/

const els = {
  form: document.getElementById("taskForm"),
  title: document.getElementById("title"),
  description: document.getElementById("description"),
  deadline: document.getElementById("deadline"),
  status: document.getElementById("status"),
  submitBtn: document.getElementById("submitBtn"),
  clearAllBtn: document.getElementById("clearAllBtn"),

  list: document.getElementById("taskList"),
  filter: document.getElementById("filterSelect"),
  sort: document.getElementById("sortSelect"),
  progressText: document.getElementById("progressText"),
  progressBar: document.getElementById("progressBar"),
};

let tasks = loadTasks();
let editingId = null;

/* ---------- Utilities ---------- */
function saveTasks() {
  localStorage.setItem("stm_tasks", JSON.stringify(tasks));
}
function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem("stm_tasks")) || [];
  } catch {
    return [];
  }
}
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function nowISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* ---------- Rendering ---------- */
function render() {
  const filterValue = els.filter.value;
  const sortValue = els.sort.value;

  let data = [...tasks];

  // Filter
  if (filterValue !== "All") {
    data = data.filter(t => t.status === filterValue);
  }

  // Sort
  const byDeadline = (a, b) => (a.deadline || "9999-12-31").localeCompare(b.deadline || "9999-12-31");
  const byCreated = (a, b) => a.createdAt.localeCompare(b.createdAt);
  const byTitle = (a, b) => a.title.localeCompare(b.title);

  switch (sortValue) {
    case "deadline-asc": data.sort(byDeadline); break;
    case "deadline-desc": data.sort((a,b)=> byDeadline(b,a)); break;
    case "created-desc": data.sort((a,b)=> byCreated(b,a)); break;
    case "created-asc": data.sort(byCreated); break;
    case "title-asc": data.sort(byTitle); break;
    case "title-desc": data.sort((a,b)=> byTitle(b,a)); break;
  }

  // List
  els.list.innerHTML = "";
  if (data.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No tasks yet.";
    els.list.appendChild(empty);
  } else {
    data.forEach(addTaskCard);
  }

  updateProgress();
}

function addTaskCard(task) {
  const item = document.createElement("div");
  item.className = "task";

  const top = document.createElement("div");
  top.className = "task-top";

  const title = document.createElement("div");
  title.className = "task-title";
  title.textContent = task.title;

  top.appendChild(title);
  item.appendChild(top);

  const meta = document.createElement("div");
  meta.className = "task-meta";
  meta.innerHTML = `
    <span>Deadline: <strong>${formatDate(task.deadline)}</strong></span>
    <span>Added: <strong>${formatDate(task.createdAt)}</strong></span>
  `;
  item.appendChild(meta);

  if (task.description?.trim()) {
    const desc = document.createElement("div");
    desc.className = "task-desc";
    desc.textContent = task.description;
    item.appendChild(desc);
  }

  const actions = document.createElement("div");
  actions.className = "task-actions";

  // Status select
  const select = document.createElement("select");
  select.className = "status-select";
  ["Pending", "In Progress", "Completed"].forEach(v => {
    const opt = document.createElement("option");
    opt.value = v; opt.textContent = v;
    if (task.status === v) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener("change", () => {
    task.status = select.value;
    saveTasks();
    render();
  });

  // Edit button
  const editBtn = document.createElement("button");
  editBtn.className = "action-link edit";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", () => {
    editingId = task.id;
    els.title.value = task.title;
    els.description.value = task.description || "";
    els.deadline.value = task.deadline || "";
    els.status.value = task.status;
    els.submitBtn.textContent = "Update Task";
    els.title.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Delete button
  const delBtn = document.createElement("button");
  delBtn.className = "action-link delete";
  delBtn.textContent = "Delete";
  delBtn.addEventListener("click", () => {
    tasks = tasks.filter(t => t.id !== task.id);
    saveTasks(); render();
  });

  actions.append(select, editBtn, delBtn);
  item.appendChild(actions);

  els.list.appendChild(item);
}

function updateProgress() {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "Completed").length;
  els.progressText.textContent = `${done}/${total} tasks completed`;

  const pct = total ? Math.round((done / total) * 100) : 0;
  els.progressBar.style.width = `${pct}%`;
}

/* ---------- Events ---------- */
els.form.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = els.title.value.trim();
  if (!title) return;

  const newData = {
    title,
    description: els.description.value.trim(),
    deadline: els.deadline.value || "",
    status: els.status.value,
  };

  if (editingId) {
    // update
    tasks = tasks.map(t => t.id === editingId ? { ...t, ...newData } : t);
    editingId = null;
    els.submitBtn.textContent = "Add Task";
  } else {
    // add
    const t = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()+Math.random()),
      ...newData,
      createdAt: nowISO(),
    };
    tasks.push(t);
  }

  saveTasks();
  els.form.reset();
  render();
});

els.clearAllBtn.addEventListener("click", () => {
  if (!tasks.length) return;
  if (confirm("Clear all tasks?")) {
    tasks = [];
    saveTasks(); render();
  }
});

els.filter.addEventListener("change", render);
els.sort.addEventListener("change", render);

/* ---------- Init ---------- */
render();
