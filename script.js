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

async function animateStandardRoll(finalRoll) {
  renderRollingShell(ctContainer, 1);
  renderRollingShell(tContainer, 1);

  const ctCards = ctContainer.querySelectorAll(".loadout-item");
  const tCards = tContainer.querySelectorAll(".loadout-item");

  const animations = [];

  getCategoryKeys().forEach((category, index) => {
    const ctFinal = finalRoll.ct[category]?.[0] || null;
    const tFinal = finalRoll.t[category]?.[0] || null;

    if (ctFinal && ctCards[index]) {
      const seq = buildCaseRollSequence(
        "ct",
        category,
        ctFinal,
        16 + Math.floor(Math.random() * 6)
      );
      animations.push(animateCaseRollCard(ctCards[index], seq, 1));
    }

    if (tFinal && tCards[index]) {
      const seq = buildCaseRollSequence(
        "t",
        category,
        tFinal,
        16 + Math.floor(Math.random() * 6)
      );
      animations.push(animateCaseRollCard(tCards[index], seq, 1));
    }
  });

  await Promise.all(animations);
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

  const finalRoll = {
    ct: rollStandardTeam("ct"),
    t: rollStandardTeam("t")
  };

  currentRoll = null;
  updatePoolStatus();

  await animateStandardRoll(finalRoll);

  currentRoll = finalRoll;
  renderStandardTeam(ctContainer, currentRoll.ct);
  renderStandardTeam(tContainer, currentRoll.t);
}

async function generateMatchPool() {
  const finalPool = {
    ct: buildMatchPoolTeam("ct"),
    t: buildMatchPoolTeam("t")
  };

  currentMode = "pool";
  selectedFromPool = null;
  savedPool = null;
  currentRoll = null;

  updatePoolStatus();
  await animateMatchPoolRoll(finalPool);

  savedPool = finalPool;
  currentRoll = JSON.parse(JSON.stringify(savedPool));

  updatePoolStatus();
  renderCurrentView();
}

function getPoolEntryElements(container, categoryIndex) {
  const categoryCards = container.querySelectorAll(".loadout-item");
  const card = categoryCards[categoryIndex];
  if (!card) return [];
  return [...card.querySelectorAll(".weapon-entry")];
}

function clearEntryStates(entries) {
  entries.forEach(entry => {
    entry.classList.remove("selected", "dimmed", "pool-scan");
  });
}

async function animateSingleCategoryPoolSelection(container, categoryIndex, selectedName) {
  if (!selectedName) return;

  const entries = getPoolEntryElements(container, categoryIndex);
  if (!entries.length) return;

  const finalIndex = entries.findIndex(
    entry => entry.dataset.itemName === selectedName
  );

  if (finalIndex === -1) return;

  clearEntryStates(entries);

  const totalSteps = entries.length * 2 + finalIndex + Math.floor(Math.random() * 2);
  let currentIndex = 0;

  for (let step = 0; step < totalSteps; step++) {
    clearEntryStates(entries);

    const activeEntry = entries[currentIndex % entries.length];
    activeEntry.classList.add("pool-scan");

    const isNearEnd = step > totalSteps - 4;
    await wait(isNearEnd ? 170 : 90);

    activeEntry.classList.remove("pool-scan");
    currentIndex++;
  }

  clearEntryStates(entries);

  entries.forEach((entry, index) => {
    if (index === finalIndex) {
      entry.classList.add("selected", "select-flash");
    } else {
      entry.classList.add("dimmed");
    }
  });

  await wait(180);

  const finalEntry = entries[finalIndex];
  if (finalEntry) {
    finalEntry.classList.remove("select-flash");
  }
}

async function animateSmoothPoolSelection(container, selectedRoll) {
  const categories = getCategoryKeys();

  const animations = categories.map((category, categoryIndex) => {
    const selectedName = selectedRoll[category]?.[0]?.name || null;
    return animateSingleCategoryPoolSelection(container, categoryIndex, selectedName);
  });

  await Promise.all(animations);
}

async function rollFromSavedPool() {
  if (!savedPool) {
    alert("Generate a match pool first.");
    return;
  }

  currentMode = "pool-roll";

  const finalSelection = {
    ct: rollFromSavedPoolTeam(savedPool.ct),
    t: rollFromSavedPoolTeam(savedPool.t)
  };

  selectedFromPool = null;
  currentRoll = null;

  updatePoolStatus();
  renderPoolTeam(ctContainer, savedPool.ct, null);
  renderPoolTeam(tContainer, savedPool.t, null);

  await Promise.all([
    animateSmoothPoolSelection(ctContainer, finalSelection.ct),
    animateSmoothPoolSelection(tContainer, finalSelection.t)
  ]);

  selectedFromPool = finalSelection;
  currentRoll = finalSelection;

  updatePoolStatus();
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

function createCaseRollItem(item) {
  return `
    <div class="case-roll-item">
      ${
        item.image
          ? `<img src="${item.image}" alt="${item.name}" onerror="this.style.display='none';" />`
          : ``
      }
      <div class="case-roll-item-name">${item.name}</div>
    </div>
  `;
}

function createCaseRollCard(label, visibleWinners = 1) {
  const multiClass = visibleWinners > 1 ? "multi" : "";

  return `
    <div class="loadout-item">
      <span class="category-title">${label}</span>
      <div class="case-roll-window ${multiClass}" data-visible-winners="${visibleWinners}">
        <div class="case-roll-center-line"></div>
        <div class="case-roll-track"></div>
      </div>
    </div>
  `;
}

function renderRollingShell(container, visibleWinners = 1) {
  container.innerHTML = getCategoryKeys()
    .map(category => createCaseRollCard(categoryLabels[category], visibleWinners))
    .join("");
}

function buildCaseRollSequence(teamKey, category, finalItem, totalItems = 18) {
  const availableItems = getAvailableItems(teamKey, category);

  if (!availableItems.length || !finalItem) {
    return [];
  }

  const sequence = [];

  for (let i = 0; i < totalItems - 1; i++) {
    sequence.push(randomItem(availableItems));
  }

  sequence.push(finalItem);
  return sequence;
}

async function animateCaseRollCard(cardElement, sequence, visibleWinners = 1) {
  const windowEl = cardElement.querySelector(".case-roll-window");
  const track = cardElement.querySelector(".case-roll-track");

  if (!windowEl || !track || !sequence.length) return;

  const itemHeight = 58;

  windowEl.classList.toggle("multi", visibleWinners > 1);
  windowEl.style.height = `${itemHeight * visibleWinners}px`;

  track.innerHTML = sequence.map(createCaseRollItem).join("");

  const finalIndex = Math.max(0, sequence.length - visibleWinners);

  track.style.transition = "none";
  track.style.transform = "translateY(0px)";
  void track.offsetHeight;

  track.style.transition = "transform 1.2s cubic-bezier(0.16, 0.84, 0.24, 1)";
  track.style.transform = `translateY(-${finalIndex * itemHeight}px)`;

  await wait(1220);
}

async function generateStandardLoadouts() {
  currentMode = "standard";
  selectedFromPool = null;

  const finalRoll = {
    ct: rollStandardTeam("ct"),
    t: rollStandardTeam("t")
  };

  currentRoll = null;
  updatePoolStatus();

  await animateStandardRoll(finalRoll);

  currentRoll = finalRoll;
  renderStandardTeam(ctContainer, currentRoll.ct);
  renderStandardTeam(tContainer, currentRoll.t);
}

function getCategoryKeys() {
  return ["pistol", "midTier", "rifle", "grenade"];
}

function createCaseRollItem(item) {
  return `
    <div class="case-roll-item">
      ${
        item.image
          ? `<img src="${item.image}" alt="${item.name}" onerror="this.style.display='none';" />`
          : ``
      }
      <div class="case-roll-item-name">${item.name}</div>
    </div>
  `;
}

function createCaseRollCard(label) {
  return `
    <div class="loadout-item">
      <span class="category-title">${label}</span>
      <div class="case-roll-window">
        <div class="case-roll-center-line"></div>
        <div class="case-roll-track"></div>
      </div>
    </div>
  `;
}

function renderStandardRollingShell(container) {
  container.innerHTML = getCategoryKeys()
    .map(category => createCaseRollCard(categoryLabels[category]))
    .join("");
}

function buildCaseRollSequence(teamKey, category, finalItem, totalItems = 18) {
  const availableItems = getAvailableItems(teamKey, category);

  if (!availableItems.length || !finalItem) {
    return [];
  }

  const sequence = [];

  for (let i = 0; i < totalItems - 1; i++) {
    sequence.push(randomItem(availableItems));
  }

  sequence.push(finalItem);
  return sequence;
}

async function animateMatchPoolRoll(finalPool) {
  renderRollingShell(ctContainer, 5);
  renderRollingShell(tContainer, 5);

  const ctCards = ctContainer.querySelectorAll(".loadout-item");
  const tCards = tContainer.querySelectorAll(".loadout-item");

  const animations = [];

  getCategoryKeys().forEach((category, index) => {
    const ctFinalItems = finalPool.ct[category] || [];
    const tFinalItems = finalPool.t[category] || [];

    if (ctFinalItems.length && ctCards[index]) {
      const seq = buildMultiCaseRollSequence("ct", category, ctFinalItems, 24 + Math.floor(Math.random() * 6));
      animations.push(animateCaseRollCard(ctCards[index], seq, 5));
    }

    if (tFinalItems.length && tCards[index]) {
      const seq = buildMultiCaseRollSequence("t", category, tFinalItems, 24 + Math.floor(Math.random() * 6));
      animations.push(animateCaseRollCard(tCards[index], seq, 5));
    }
  });

  await Promise.all(animations);
}

function buildMultiCaseRollSequence(teamKey, category, finalItems, totalItems = 26) {
  const availableItems = getAvailableItems(teamKey, category);

  if (!availableItems.length || !finalItems.length) {
    return [];
  }

  const sequence = [];

  for (let i = 0; i < totalItems - finalItems.length; i++) {
    sequence.push(randomItem(availableItems));
  }

  sequence.push(...finalItems);
  return sequence;
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