// ====== Configuration ======
const API_BASE = window.__API_BASE__ || "";
const dealsBody = document.querySelector("#deals-body");
const searchInput = document.querySelector("#search");
const minScoreInput = document.querySelector("#minScore");
const minMarginInput = document.querySelector("#minMargin");
const limitInput = document.querySelector("#limit");
const refreshBtn = document.querySelector("#refresh");
const lastRefreshEl = document.querySelector("#last-refresh");

// ====== Utility: format price ======
function formatPrice(amount, currency) {
  if (amount == null || currency == null) return "";
  return `${amount} ${currency}`;
}

// ====== Utility: format age ======
function formatAge(listedAt) {
  if (!listedAt) return "";
  const listedDate = new Date(listedAt);
  const now = new Date();
  const diffMs = now - listedDate;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// ====== Render Deals Table ======
function renderDealsTable(items) {
  dealsBody.innerHTML = "";

  if (!items || items.length === 0) {
    dealsBody.innerHTML = `<tr><td colspan="8">No items found.</td></tr>`;
    return;
  }

  for (const item of items) {
    const tr = document.createElement("tr");

    // Item name + base type
    const nameCell = document.createElement("td");
    nameCell.textContent = item.name
      ? `${item.name} (${item.baseType})`
      : item.baseType;
    tr.appendChild(nameCell);

    // Price
    const priceCell = document.createElement("td");
    priceCell.textContent = formatPrice(item.price, item.currency);
    tr.appendChild(priceCell);

    // Estimated value (if exists)
    const estCell = document.createElement("td");
    estCell.textContent = item.estimate || "";
    tr.appendChild(estCell);

    // Margin %
    const marginCell = document.createElement("td");
    marginCell.textContent = item.marginPct != null ? `${item.marginPct}%` : "";
    tr.appendChild(marginCell);

    // Score
    const scoreCell = document.createElement("td");
    scoreCell.textContent = item.score != null ? item.score : "";
    tr.appendChild(scoreCell);

    // Seller
    const sellerCell = document.createElement("td");
    sellerCell.textContent = item.seller || "";
    tr.appendChild(sellerCell);

    // Age
    const ageCell = document.createElement("td");
    ageCell.textContent = formatAge(item.listedAt);
    tr.appendChild(ageCell);

    // Actions
    const actionsCell = document.createElement("td");
    if (item.tradeUrl) {
      const a = document.createElement("a");
      a.href = item.tradeUrl;
      a.target = "_blank";
      a.textContent = "View";
      actionsCell.appendChild(a);
    }
    tr.appendChild(actionsCell);

    dealsBody.appendChild(tr);
  }
}

// ====== Fetch Deals ======
async function fetchDeals() {
  const itemName = (searchInput.value || "").trim();
  const limit = parseInt(limitInput.value, 10) || 30;

  if (!itemName) {
    alert("Please enter an item name or base type.");
    return;
  }

  const url = `${API_BASE}/deals?item=${encodeURIComponent(
    itemName
  )}&limit=${limit}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const items = Array.isArray(data.items) ? data.items : [];
    renderDealsTable(items);

    lastRefreshEl.textContent = new Date().toLocaleTimeString();
  } catch (err) {
    console.error("Error fetching deals:", err);
    dealsBody.innerHTML = `<tr><td colspan="8">Error loading data.</td></tr>`;
  }
}

// ====== Event Listeners ======
refreshBtn.addEventListener("click", fetchDeals);

// Optional: Auto-load default item on page load
window.addEventListener("DOMContentLoaded", () => {
  if (!searchInput.value) {
    searchInput.value = "Sapphire Ring"; // default
  }
  fetchDeals();
});
