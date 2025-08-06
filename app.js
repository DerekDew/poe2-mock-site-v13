// ----- Config & State -----
const DEFAULT_SETTINGS = {
  autoRefresh: false,
  intervalSec: 30,
};
const store = {
  settings: loadJson("settings_v13", DEFAULT_SETTINGS),
  watchlist: loadJson("watch_v13", []),
  timer: null,
};
const API_BASE = window.__API_BASE__; // preset in index.html

// ----- Utilities -----
function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function saveJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function fmtPct(n) { return (n ?? 0).toFixed(1) + "%"; }
function fmtNum(n) { return (n ?? 0).toFixed(1); }
function fromNow(iso) {
  if (!iso) return "-";
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); return `${d}d`;
}

// Simple debounce
function debounce(fn, ms = 350) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// ----- Tabs -----
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    if (btn.dataset.tab === "watchlist") renderWatchlist();
  });
});

// ----- Settings init -----
const apiBaseEl = document.getElementById("apiBase");
const autoRefreshEl = document.getElementById("autoRefresh");
const intervalSecEl = document.getElementById("intervalSec");
const saveSettingsBtn = document.getElementById("saveSettings");
const saveStatus = document.getElementById("saveStatus");

apiBaseEl.value = API_BASE;
autoRefreshEl.checked = !!store.settings.autoRefresh;
intervalSecEl.value = store.settings.intervalSec;

saveSettingsBtn.addEventListener("click", () => {
  store.settings.autoRefresh = autoRefreshEl.checked;
  store.settings.intervalSec = Math.max(5, parseInt(intervalSecEl.value || "30", 10));
  saveJson("settings_v13", store.settings);
  saveStatus.textContent = "Saved";
  setupAutoRefresh();
  setTimeout(() => (saveStatus.textContent = "Not saved"), 1500);
});

// ----- Controls -----
const qEl = document.getElementById("q");
const minScoreEl = document.getElementById("minScore");
const minMarginEl = document.getElementById("minMargin");
const limitEl = document.getElementById("limit");
const refreshBtn = document.getElementById("refresh");
const statusEl = document.getElementById("status");
const footStatus = document.getElementById("footStatus");
const dealsBody = document.getElementById("dealsBody");

refreshBtn.addEventListener("click", () => loadDeals());

[qEl, minScoreEl, minMarginEl, limitEl].forEach(el => {
  el.addEventListener("input", debounce(() => loadDeals(), 500));
});

// ----- Fetch & Render Deals -----
async function loadDeals() {
  try {
    statusEl.textContent = "Loading…";
    const params = new URLSearchParams();
    const limit = Math.max(1, parseInt(limitEl.value || "30", 10));
    params.set("limit", limit.toString());

    const url = `${API_BASE}/deals?${params.toString()}`;
    const res = await fetch(url, { headers: { "Accept": "application/json" }});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json(); // { items: [...] } expected
    const items = Array.isArray(data?.items) ? data.items : [];

    // In-browser filters
    const q = (qEl.value || "").toLowerCase();
    const minScore = parseFloat(minScoreEl.value || "0");
    const minMargin = parseFloat(minMarginEl.value || "0");

    const filtered = items.filter(it => {
      const name = (it.name || it.baseType || "").toLowerCase();
      const score = Number(it.score ?? 0);
      const margin = Number(it.marginPct ?? 0);
      const textMatch = q ? name.includes(q) : true;
      return textMatch && score >= minScore && margin >= minMargin;
    });

    renderDeals(filtered);
    statusEl.textContent = `Showing ${filtered.length}/${items.length}`;
    footStatus.textContent = `Last refresh: ${new Date().toLocaleTimeString()}`;
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error";
    footStatus.textContent = `Error: ${err.message}`;
    dealsBody.innerHTML = `<tr><td colspan="8">Failed to load deals. Check CORS and API URL.</td></tr>`;
  }
}

function renderDeals(items) {
  if (!items.length) {
    dealsBody.innerHTML = `<tr><td colspan="8">No items match filters right now.</td></tr>`;
    return;
  }

  dealsBody.innerHTML = items.map(it => {
    const name = it.name || it.baseType || "Unknown";
    const price = it.priceStr || `${fmtNum(it.price ?? 0)}c`;
    const est = it.estimateStr || `${fmtNum(it.estimate ?? 0)}c`;
    const margin = Number(it.marginPct ?? 0);
    const score = Number(it.score ?? 0);
    const seller = it.seller || "-";
    const age = fromNow(it.listedAt || it.seenAt);

    const marginClass = margin >= 0 ? "green" : "red";
    const tradeUrl = it.tradeUrl || it.url || "#";

    const id = it.id || `${name}-${price}-${seller}`;

    return `
      <tr>
        <td>${name}</td>
        <td>${price}</td>
        <td>${est}</td>
        <td><span class="badge ${marginClass}">${fmtPct(margin)}</span></td>
        <td>${score.toFixed(0)}</td>
        <td>${seller}</td>
        <td>${age}</td>
        <td>
          <a href="${tradeUrl}" target="_blank" rel="noopener" class="btn" style="padding:6px 10px">Trade</a>
          <button class="btn" data-watch="${encodeURIComponent(id)}" style="padding:6px 10px;margin-left:6px">Watch</button>
        </td>
      </tr>
    `;
  }).join("");

  // attach watch buttons
  document.querySelectorAll("[data-watch]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = decodeURIComponent(btn.dataset.watch);
      addToWatchlist(id);
    });
  });
}

// ----- Watchlist -----
function addToWatchlist(id) {
  if (!store.watchlist.includes(id)) {
    store.watchlist.push(id);
    saveJson("watch_v13", store.watchlist);
    renderWatchlist();
  }
}
function removeFromWatchlist(id) {
  store.watchlist = store.watchlist.filter(x => x !== id);
  saveJson("watch_v13", store.watchlist);
  renderWatchlist();
}
function renderWatchlist() {
  const tbody = document.getElementById("watchBody");
  if (!store.watchlist.length) {
    tbody.innerHTML = `<tr><td colspan="4">No items in watchlist.</td></tr>`;
    return;
  }
  tbody.innerHTML = store.watchlist.map(id => {
    return `
      <tr>
        <td>${id}</td>
        <td>${new Date().toLocaleString()}</td>
        <td contenteditable="true" data-note="${encodeURIComponent(id)}"></td>
        <td><button class="btn" data-remove="${encodeURIComponent(id)}" style="padding:6px 10px;background:#7a1f1f">Remove</button></td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => removeFromWatchlist(decodeURIComponent(btn.dataset.remove)));
  });
}

// ----- Auto-refresh -----
function setupAutoRefresh() {
  if (store.timer) { clearInterval(store.timer); store.timer = null; }
  if (store.settings.autoRefresh) {
    store.timer = setInterval(() => loadDeals(), Math.max(5, store.settings.intervalSec) * 1000);
  }
}

// First load
loadDeals();
setupAutoRefresh();
