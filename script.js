const ctContainer = document.getElementById("ct-loadout");
const tContainer = document.getElementById("t-loadout");
const generateBtn = document.getElementById("generateBtn");
const generateFullBtn = document.getElementById("generateFullBtn");
const rollFromPoolBtn = document.getElementById("rollFromPoolBtn");
const copyBtn = document.getElementById("copyBtn");
const toggleFiltersBtn = document.getElementById("toggleFiltersBtn");
const clearBansBtn = document.getElementById("clearBansBtn");
const filtersPanel = document.getElementById("filtersPanel");
const filterGrid = document.getElementById("filterGrid");
const poolStatusText = document.getElementById("poolStatusText");

let currentRoll = null;
let currentMode = "standard";
let savedPool = null;
let selectedFromPool = null;

const bannedItems = loadBans();

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffleArray(items) {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function pickMultipleRandom(items, count) {
  return shuffleArray(items).slice(0, Math.min(count, items.length));
}

function normalizeName(name) {
  return name.toLowerCase().trim();
}

function getBanKey(teamKey, category, itemName) {
  return `${teamKey}::${category}::${normalizeName(itemName)}`;
}

function loadBans() {
  try {
    const saved = JSON.parse(localStorage.getItem("wingmanBans") || "[]");
    return new Set(saved);
  } catch {
    return new Set();
  }
}

function saveBans() {
  localStorage.setItem("wingmanBans", JSON.stringify([...bannedItems]));
}

function isBanned(teamKey, category, itemName) {
  return bannedItems.has(getBanKey(teamKey, category, itemName));
}

function getAvailableItems(teamKey, category) {
  return pools[teamKey][category].filter(
    item => !isBanned(teamKey, category, item.name)
  );
}

function createWeaponEntry(item, options = {}) {
  const { selected = false, dimmed = false, rolling = false } = options;

  const classes = [
    "weapon-entry",
    selected ? "selected" : "",
    dimmed ? "dimmed" : "",
    rolling ? "rolling" : ""
  ].filter(Boolean).join(" ");

  return `
    <div class="${classes}" data-item-name="${item.name}">
      ${
        item.image
          ? `<img class="weapon-thumb" src="${item.image}" alt="${item.name}" onerror="this.style.display='none';" />`
          : ``
      }
      <div class="weapon-name">${item.name}</div>
    </div>
  `;
}

function createCategoryCard(label, items, selectedName = null) {
  return `
    <div class="loadout-item">
      <span class="category-title">${label}</span>
      <div class="category-items">
        ${items.map(item => {
          const isSelected = selectedName === item.name;
          const isDimmed = selectedName && !isSelected;
          return createWeaponEntry(item, {
            selected: isSelected,
            dimmed: isDimmed
          });
        }).join("")}
      </div>
    </div>
  `;
}

function createFallbackCategory(label) {
  return `
    <div class="loadout-item">
      <span class="category-title">${label}</span>
      <div class="category-items">
        <div class="weapon-entry">
          <div class="weapon-name">No items available</div>
        </div>
      </div>
    </div>
  `;
}

function createRollingCategoryCard(label, item) {
  return `
    <div class="loadout-item">
      <span class="category-title">${label}</span>
      <div class="category-items">
        ${createWeaponEntry(item, { rolling: true })}
      </div>
    </div>
  `;
}

function renderStandardTeam(container, teamRoll) {
  container.innerHTML = Object.entries(teamRoll)
    .map(([category, items]) => {
      if (!items.length) return createFallbackCategory(categoryLabels[category]);
      return createCategoryCard(categoryLabels[category], items);
    })
    .join("");
}

function renderPoolTeam(container, teamPool, selectedRoll = null) {
  container.innerHTML = Object.entries(teamPool)
    .map(([category, items]) => {
      if (!items.length) return createFallbackCategory(categoryLabels[category]);
      const selectedName = selectedRoll?.[category]?.[0]?.name || null;
      return createCategoryCard(categoryLabels[category], items, selectedName);
    })
    .join("");
}

function renderRollingTeam(container, rollingTeam) {
  container.innerHTML = Object.entries(rollingTeam)
    .map(([category, item]) => {
      if (!item) return createFallbackCategory(categoryLabels[category]);
      return createRollingCategoryCard(categoryLabels[category], item);
    })
    .join("");
}

function renderCurrentView() {
  if (currentMode === "pool" || currentMode === "pool-roll") {
    renderPoolTeam(ctContainer, savedPool.ct, selectedFromPool?.ct);
    renderPoolTeam(tContainer, savedPool.t, selectedFromPool?.t);
    return;
  }

  renderStandardTeam(ctContainer, currentRoll.ct);
  renderStandardTeam(tContainer, currentRoll.t);
}

function updatePoolStatus() {
  if (!savedPool) {
    poolStatusText.textContent = "No saved match pool yet.";
    return;
  }

  if (currentMode === "pool") {
    poolStatusText.textContent = "Saved match pool active. You are viewing the full pool.";
    return;
  }

  if (currentMode === "pool-roll") {
    poolStatusText.textContent = "Saved match pool active. Green items are the current roll from the locked pool.";
    return;
  }

  poolStatusText.textContent = "Saved match pool exists, but you are currently viewing a standard roll.";
}

function rollStandardTeam(teamKey) {
  const result = {};

  for (const category of Object.keys(pools[teamKey])) {
    const availableItems = getAvailableItems(teamKey, category);
    result[category] = availableItems.length ? [randomItem(availableItems)] : [];
  }

  return result;
}

function buildMatchPoolTeam(teamKey) {
  const result = {};

  for (const category of Object.keys(pools[teamKey])) {
    const availableItems = getAvailableItems(teamKey, category);
    result[category] = availableItems.length ? pickMultipleRandom(availableItems, 5) : [];
  }

  return result;
}

function rollFromSavedPoolTeam(teamPool) {
  const result = {};

  for (const category of Object.keys(teamPool)) {
    const poolItems = teamPool[category];
    result[category] = poolItems.length ? [randomItem(poolItems)] : [];
  }

  return result;
}

function getRandomPreviewTeam(teamKey) {
  const preview = {};

  for (const category of Object.keys(pools[teamKey])) {
    const availableItems = getAvailableItems(teamKey, category);
    preview[category] = availableItems.length ? randomItem(availableItems) : null;
  }

  return preview;
}

function getRandomPreviewFromPool(teamPool) {
  const preview = {};

  for (const category of Object.keys(teamPool)) {
    const items = teamPool[category];
    preview[category] = items.length ? randomItem(items) : null;
  }

  return preview;
}

async function animateStandardRoll() {
  const steps = 8;

  for (let i = 0; i < steps; i++) {
    renderRollingTeam(ctContainer, getRandomPreviewTeam("ct"));
    renderRollingTeam(tContainer, getRandomPreviewTeam("t"));
    await wait(70 + i * 12);
  }
}

async function animatePoolRoll() {
  const steps = 10;

  for (let i = 0; i < steps; i++) {
    renderPoolTeam(ctContainer, savedPool.ct, rollFromSavedPoolTeam(savedPool.ct));
    renderPoolTeam(tContainer, savedPool.t, rollFromSavedPoolTeam(savedPool.t));
    await wait(65 + i * 10);
  }
}

async function generateStandardLoadouts() {
  currentMode = "standard";
  selectedFromPool = null;
  currentRoll = null;

  updatePoolStatus();
  await animateStandardRoll();

  currentRoll = {
    ct: rollStandardTeam("ct"),
    t: rollStandardTeam("t")
  };

  renderStandardTeam(ctContainer, currentRoll.ct);
  renderStandardTeam(tContainer, currentRoll.t);
}

function generateMatchPool() {
  savedPool = {
    ct: buildMatchPoolTeam("ct"),
    t: buildMatchPoolTeam("t")
  };

  currentMode = "pool";
  selectedFromPool = null;
  currentRoll = JSON.parse(JSON.stringify(savedPool));

  updatePoolStatus();
  renderCurrentView();

  document.querySelectorAll(".loadout-item").forEach((card, index) => {
    card.classList.remove("roll-anim-pool");
    void card.offsetWidth;
    card.style.animationDelay = `${index * 50}ms`;
    card.classList.add("roll-anim-pool");
  });
}

async function rollFromSavedPool() {
  if (!savedPool) {
    alert("Generate a match pool first.");
    return;
  }

  currentMode = "pool-roll";
  selectedFromPool = null;
  updatePoolStatus();

  await animatePoolRoll();

  selectedFromPool = {
    ct: rollFromSavedPoolTeam(savedPool.ct),
    t: rollFromSavedPoolTeam(savedPool.t)
  };

  currentRoll = selectedFromPool;
  renderPoolTeam(ctContainer, savedPool.ct, selectedFromPool.ct);
  renderPoolTeam(tContainer, savedPool.t, selectedFromPool.t);
}

function buildFilters() {
  filterGrid.innerHTML = ["ct", "t"]
    .map(teamKey => {
      const teamName = teamKey === "ct" ? "CT bans" : "T bans";

      const sections = Object.entries(pools[teamKey])
        .map(([category, items]) => {
          const chips = items
            .map(item => {
              const bannedClass = bannedItems.has(getBanKey(teamKey, category, item.name)) ? "banned" : "";

              return `
                <button
                  type="button"
                  class="filter-chip ${bannedClass}"
                  data-team="${teamKey}"
                  data-category="${category}"
                  data-name="${item.name}"
                >
                  ${item.name}
                </button>
              `;
            })
            .join("");

          return `
            <div class="filter-section">
              <h3>${categoryLabels[category]}</h3>
              <div class="filter-list">${chips}</div>
            </div>
          `;
        })
        .join("");

      return `
        <div class="filter-column">
          <span class="eyebrow">${teamName}</span>
          <div class="filter-stack">${sections}</div>
        </div>
      `;
    })
    .join("");

  filterGrid.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const team = chip.dataset.team;
      const category = chip.dataset.category;
      const name = chip.dataset.name;
      const key = getBanKey(team, category, name);

      if (bannedItems.has(key)) {
        bannedItems.delete(key);
      } else {
        bannedItems.add(key);
      }

      saveBans();
      buildFilters();

      savedPool = null;
      selectedFromPool = null;
      currentMode = "standard";
      generateStandardLoadouts();
    });
  });
}

function formatCategory(label, items) {
  if (!items.length) return `${label}: No items available`;
  return `${label}: ${items.map(item => item.name).join(", ")}`;
}

async function copyLoadouts() {
  if (!currentRoll) return;

  let modeLabel = "STANDARD ROLL";
  if (currentMode === "pool") modeLabel = "MATCH POOL";
  if (currentMode === "pool-roll") modeLabel = "ROLL FROM SAVED POOL";

  const formatTeam = (name, roll) => {
    return `${name}
${formatCategory("Pistol", roll.pistol)}
${formatCategory("Mid-Tier", roll.midTier)}
${formatCategory("Rifle", roll.rifle)}
${formatCategory("Grenade", roll.grenade)}`;
  };

  const text = `${modeLabel}

${formatTeam("CT", currentRoll.ct)}

${formatTeam("T", currentRoll.t)}`;

  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy Result";
    }, 1200);
  } catch {
    copyBtn.textContent = "Copy Failed";
    setTimeout(() => {
      copyBtn.textContent = "Copy Result";
    }, 1200);
  }
}

toggleFiltersBtn.addEventListener("click", () => {
  filtersPanel.classList.toggle("hidden");
});

clearBansBtn.addEventListener("click", () => {
  bannedItems.clear();
  saveBans();
  buildFilters();
  savedPool = null;
  selectedFromPool = null;
  generateStandardLoadouts();
});

generateBtn.addEventListener("click", generateStandardLoadouts);
generateFullBtn.addEventListener("click", generateMatchPool);
rollFromPoolBtn.addEventListener("click", rollFromSavedPool);
copyBtn.addEventListener("click", copyLoadouts);

buildFilters();
generateStandardLoadouts();