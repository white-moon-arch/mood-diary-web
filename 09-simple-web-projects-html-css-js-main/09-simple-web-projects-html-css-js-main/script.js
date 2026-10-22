// Notes App (Vanilla JS) — localStorage + search + sort + pin + modal edit + toasts
(() => {
  "use strict";

  // ---------- Config ----------
  const STORAGE_KEY = "notes_app_v1";
  const AUTOSAVE_DELAY = 420; // ms (debounced)
  const SEARCH_DELAY = 160;   // ms (debounced)

  // ---------- DOM ----------
  const topbar = document.getElementById("topbar");
  const titleInput = document.getElementById("titleInput");
  const contentInput = document.getElementById("contentInput");
  const addBtn = document.getElementById("addBtn");

  const searchInput = document.getElementById("searchInput");
  const sortSelect = document.getElementById("sortSelect");
  const clearAllBtn = document.getElementById("clearAllBtn");
  const notesGrid = document.getElementById("notesGrid");
  const emptyState = document.getElementById("emptyState");
  const notesMeta = document.getElementById("notesMeta");
  const scrollToComposer = document.getElementById("scrollToComposer");

  const modal = document.getElementById("modal");
  const modalClose = document.getElementById("modalClose");
  const cancelEdit = document.getElementById("cancelEdit");
  const saveEdit = document.getElementById("saveEdit");
  const editTitle = document.getElementById("editTitle");
  const editContent = document.getElementById("editContent");
  const editChips = document.getElementById("editChips");
  const autosaveText = document.getElementById("autosaveText");

  const toasts = document.getElementById("toasts");
  const backToTop = document.getElementById("backToTop");
  const themeToggle = document.getElementById("themeToggle");

  // composer chips (color tags)
  const composerChips = Array.from(document.querySelectorAll(".composer .chip"));

  // ---------- State ----------
  /** @type {{id:string,title:string,content:string,createdAt:number,updatedAt:number,pinned?:boolean,colorTag?:string}[]} */
  let notes = [];
  let query = "";
  let sortMode = "newest";
  let composerTag = "none";

  let editingId = null;
  let editingTag = "none";
  let lastFocused = null;

  // ---------- Utilities ----------
  const prefersReducedMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function uid() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return String(Date.now()) + "-" + Math.random().toString(16).slice(2);
  }

  function now() { return Date.now(); }

  function formatTime(ts) {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { year:"numeric", month:"short", day:"2-digit", hour:"2-digit", minute:"2-digit" });
  }

  function debounce(fn, delay) {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), delay);
    };
  }

  function clampText(s = "", max = 180) {
    const str = String(s);
    if (str.length <= max) return str;
    return str.slice(0, max - 1) + "…";
  }

  // ---------- Storage ----------
  function loadNotes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      notes = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(notes)) notes = [];
    } catch {
      notes = [];
    }
  }

  function saveNotes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }

  // ---------- Theme ----------
  function getTheme() {
    return localStorage.getItem("notes_theme") || "dark";
  }
  function setTheme(mode) {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem("notes_theme", mode);
    themeToggle.setAttribute("aria-pressed", mode === "light" ? "true" : "false");
  }

  // ---------- Rendering ----------
  function applyFiltersAndSort(list) {
    // search
    const q = query.trim().toLowerCase();
    let filtered = list;
    if (q) {
      filtered = list.filter(n =>
        (n.title || "").toLowerCase().includes(q) ||
        (n.content || "").toLowerCase().includes(q)
      );
    }

    // sort compare
    const compare = {
      newest: (a,b) => b.createdAt - a.createdAt,
      oldest: (a,b) => a.createdAt - b.createdAt,
      updated:(a,b) => b.updatedAt - a.updatedAt
    }[sortMode] || ((a,b) => b.createdAt - a.createdAt);

    // pin rule: pinned first
    filtered.sort((a,b) => {
      const ap = !!a.pinned;
      const bp = !!b.pinned;
      if (ap !== bp) return ap ? -1 : 1;
      return compare(a,b);
    });

    return filtered;
  }

  function updateMeta(total, shown) {
    const a = total === 1 ? "note" : "notes";
    const b = shown === 1 ? "note" : "notes";
    if (query.trim()) notesMeta.textContent = `${shown} ${b} (filtered) • ${total} total`;
    else notesMeta.textContent = `${total} ${a}`;
  }

  function render() {
    const total = notes.length;
    const visible = applyFiltersAndSort([...notes]);

    // empty state
    emptyState.hidden = total !== 0 || query.trim().length !== 0;
    notesGrid.innerHTML = "";

    updateMeta(total, visible.length);

    if (total === 0 && !query.trim()) return;

    if (visible.length === 0) {
      const msg = document.createElement("div");
      msg.className = "empty card";
      msg.innerHTML = `
        <div class="empty__icon" aria-hidden="true">🔎</div>
        <h3 class="empty__title">No matches</h3>
        <p class="empty__text">Try a different search phrase.</p>
      `;
      notesGrid.appendChild(msg);
      return;
    }

    const frag = document.createDocumentFragment();
    for (const n of visible) frag.appendChild(noteCard(n));
    notesGrid.appendChild(frag);
  }

  function noteCard(note) {
    const el = document.createElement("article");
    el.className = "note";
    el.dataset.id = note.id;
    el.dataset.tag = note.colorTag || "none";
    if (note.pinned) el.classList.add("is-pinned");

    el.innerHTML = `
      <div class="note__head">
        <h3 class="note__title"></h3>
        <div class="note__actions">
          <button class="action action--pin" type="button" aria-label="${note.pinned ? "Unpin" : "Pin"} note" data-action="pin" title="${note.pinned ? "Unpin" : "Pin"}">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 9V4h-4v5L7 12v2h10v-2l-3-3Zm-2 6v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>
          </button>
          <button class="action" type="button" aria-label="Edit note" data-action="edit" title="Edit">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
          </button>
          <button class="action action--danger" type="button" aria-label="Delete note" data-action="delete" title="Delete">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V4h6v2m-7 4v10m4-10v10m4-10v10M7 6l1 16h8l1-16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>

      <p class="note__content"></p>

      <div class="note__meta">
        <span class="note__badge">
          ${note.pinned ? "📌 Pinned" : "🗂️ Note"}
          ${note.colorTag && note.colorTag !== "none" ? `• ${note.colorTag}` : ""}
        </span>
        <span title="Updated time">Updated: ${formatTime(note.updatedAt)}</span>
      </div>
    `;

    el.querySelector(".note__title").textContent = note.title || "";
    el.querySelector(".note__content").textContent = clampText(note.content || "", 220);

    // enter animation only when we mark it so
    return el;
  }

  // ---------- Toasts ----------
  function showToast(title, message, type = "info", ttl = 1900) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.dataset.type = type;

    toast.innerHTML = `
      <div class="toast__body">
        <p class="toast__title"></p>
        <p class="toast__msg"></p>
      </div>
      <button class="toast__close" type="button" aria-label="Dismiss">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    `;
    toast.querySelector(".toast__title").textContent = title;
    toast.querySelector(".toast__msg").textContent = message;

    toasts.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("is-in"));

    const remove = () => {
      toast.classList.remove("is-in");
      const done = () => toast.remove();
      if (prefersReducedMotion()) return done();
      setTimeout(done, 260);
    };

    toast.querySelector(".toast__close").addEventListener("click", remove);
    setTimeout(remove, ttl);
  }

  // ---------- Note actions ----------
  function setAddButtonState() {
    const hasText = (titleInput.value.trim().length + contentInput.value.trim().length) > 0;
    addBtn.disabled = !hasText;
  }

  function addNote() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title && !content) return;

    const t = now();
    const newNote = {
      id: uid(),
      title,
      content,
      createdAt: t,
      updatedAt: t,
      pinned: false,
      colorTag: composerTag || "none"
    };

    notes.push(newNote);
    saveNotes();
    render();

    // Animate the new card if visible
    const card = notesGrid.querySelector(`[data-id="${newNote.id}"]`);
    if (card && !prefersReducedMotion()) card.classList.add("enter");

    // clear inputs
    titleInput.value = "";
    contentInput.value = "";
    setAddButtonState();

    showToast("Note added", "Saved to localStorage.", "success");

    // Optional: on small screens, scroll note into view
    if (window.matchMedia("(max-width: 480px)").matches && card) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function requestDelete(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    // simple confirm (fast + clear)
    const ok = confirm("Delete this note? This cannot be undone.");
    if (!ok) return;

    const card = notesGrid.querySelector(`[data-id="${noteId}"]`);
    if (card && !prefersReducedMotion()) {
      card.classList.add("removing");
      setTimeout(() => performDelete(noteId), 240);
    } else {
      performDelete(noteId);
    }
  }

  function performDelete(noteId) {
    notes = notes.filter(n => n.id !== noteId);
    saveNotes();
    render();
    showToast("Note deleted", "Removed from localStorage.", "danger");
  }

  function togglePin(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    note.pinned = !note.pinned;
    note.updatedAt = now();
    saveNotes();
    render();
    showToast(note.pinned ? "Pinned" : "Unpinned", note.pinned ? "Pinned to the top." : "Back to normal order.", "info");
  }

  // ---------- Modal editing ----------
  const tagOptions = ["none", "violet", "cyan", "green", "amber", "red"];

  function renderEditChips() {
    editChips.innerHTML = "";
    for (const t of tagOptions) {
      const b = document.createElement("button");
      b.className = "chip" + (t === editingTag ? " is-active" : "");
      b.type = "button";
      b.textContent = t === "none" ? "None" : (t[0].toUpperCase() + t.slice(1));
      b.dataset.tag = t;
      b.addEventListener("click", () => {
        editingTag = t;
        renderEditChips();
        debouncedAutosave();
      });
      editChips.appendChild(b);
    }
  }

  function openModal(noteId) {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    editingId = noteId;
    editingTag = note.colorTag || "none";
    editTitle.value = note.title || "";
    editContent.value = note.content || "";
    renderEditChips();

    lastFocused = document.activeElement;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    // focus
    setTimeout(() => editTitle.focus(), 0);

    autosaveText.textContent = "Autosave is on";
    autosaveText.style.opacity = "1";
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    editingId = null;

    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  function saveEditNow(showToastAfter = true) {
    if (!editingId) return;
    const note = notes.find(n => n.id === editingId);
    if (!note) return;

    note.title = editTitle.value.trim();
    note.content = editContent.value.trim();
    note.colorTag = editingTag || "none";
    note.updatedAt = now();

    saveNotes();
    render();

    if (showToastAfter) showToast("Note saved", "Changes updated.", "success");
  }

  const debouncedAutosave = debounce(() => {
    if (!editingId) return;
    autosaveText.textContent = "Saving…";
    autosaveText.style.opacity = "0.95";

    saveEditNow(false);

    setTimeout(() => {
      autosaveText.textContent = "Autosaved";
      autosaveText.style.opacity = "0.9";
      setTimeout(() => {
        autosaveText.textContent = "Autosave is on";
        autosaveText.style.opacity = "1";
      }, 650);
    }, 120);
  }, AUTOSAVE_DELAY);

  // ---------- Clear all ----------
  function clearAll() {
    if (notes.length === 0) return;
    const ok = confirm("Clear ALL notes? This will remove everything from localStorage.");
    if (!ok) return;
    notes = [];
    saveNotes();
    render();
    showToast("All cleared", "Your notes were removed.", "danger");
  }

  // ---------- Events ----------
  // Scroll effects
  function onScroll() {
    const y = window.scrollY || 0;
    topbar.classList.toggle("is-scrolled", y > 8);
    backToTop.classList.toggle("is-show", y > 420);
  }

  window.addEventListener("scroll", onScroll, { passive: true });

  backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  scrollToComposer.addEventListener("click", () => {
    document.querySelector(".composer")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => titleInput.focus(), 250);
  });

  // Add
  addBtn.addEventListener("click", addNote);

  titleInput.addEventListener("input", setAddButtonState);
  contentInput.addEventListener("input", setAddButtonState);

  // Ctrl+Enter to add
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      // only add if not in modal
      if (!modal.classList.contains("is-open")) addNote();
    }
    // Ctrl+F focuses search (avoid browser find if you prefer)
    if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "F")) {
      e.preventDefault();
      searchInput.focus();
    }
    // Esc closes modal
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  // Search
  const debouncedSearch = debounce(() => {
    query = searchInput.value || "";
    render();
  }, SEARCH_DELAY);
  searchInput.addEventListener("input", debouncedSearch);

  // Sort
  sortSelect.addEventListener("change", () => {
    sortMode = sortSelect.value;
    render();
  });

  // Notes actions (event delegation)
  notesGrid.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const card = e.target.closest(".note");
    if (!card) return;

    const id = card.dataset.id;
    const action = btn.dataset.action;

    if (action === "edit") openModal(id);
    if (action === "delete") requestDelete(id);
    if (action === "pin") togglePin(id);
  });

  // Modal close handlers
  modal.addEventListener("click", (e) => {
    const t = e.target;
    if (t && t.dataset && t.dataset.close) closeModal();
  });
  modalClose.addEventListener("click", closeModal);
  cancelEdit.addEventListener("click", closeModal);

  saveEdit.addEventListener("click", () => {
    saveEditNow(true);
    closeModal();
  });

  editTitle.addEventListener("input", debouncedAutosave);
  editContent.addEventListener("input", debouncedAutosave);

  // Clear all
  clearAllBtn.addEventListener("click", clearAll);

  // Composer chips
  composerChips.forEach(ch => {
    ch.addEventListener("click", () => {
      composerChips.forEach(x => {
        x.classList.toggle("is-active", x === ch);
        x.setAttribute("aria-selected", x === ch ? "true" : "false");
      });
      composerTag = ch.dataset.tag || "none";
    });
  });

  // Theme toggle
  themeToggle.addEventListener("click", () => {
    const current = getTheme();
    setTheme(current === "dark" ? "light" : "dark");
    showToast("Theme", `Switched to ${getTheme()} mode.`, "info", 1500);
  });

  // ---------- Init ----------
  function init() {
    // Theme first
    setTheme(getTheme());

    loadNotes();
    render();
    onScroll();
    setAddButtonState();

    // Populate initial sort state
    sortMode = sortSelect.value;

    if (notes.length === 0) {
      // friendly first-time hint
      showToast("Welcome", "Create a note — it will save automatically.", "info", 2100);
    }
  }

  init();
})();
