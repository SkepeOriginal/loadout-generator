const ctContainer = document.getElementById("ct-loadout");
const tContainer = document.getElementById("t-loadout");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");
const toggleFiltersBtn = document.getElementById("toggleFiltersBtn");
const clearBansBtn = document.getElementById("clearBansBtn");
const filtersPanel = document.getElementById("filtersPanel");
const filterGrid = document.getElementById("filterGrid");

let currentRoll = null;
const bannedItems = loadBans();

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createCard(label, item) {
  return `
    <div class="loadout-item">
      ${
        item.image
          ? `
            <img
              class="weapon-image"
              src="${item.image}"
              alt="${item.name}"
              onerror="this.style.display='none'; this.nextElementSibling.hidden = false;"
            />
            <div class="weapon-fallback" hidden>${item.name}</div>
          `
          : `
            <div class="weapon-fallback">${item.name}</div>
          `
      }

      <div class="item-meta">
        <span class="item-label">${label}</span>
        <div class="item-name">${item.name}</div>
      </div>
    </div>
  `;
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

function rollTeam(teamKey) {
  const result = {};

  for (const category of Object.keys(pools[teamKey])) {
    const availableItems = getAvailableItems(teamKey, category);

    if (availableItems.length === 0) {
      result[category] = {
        name: "No items available",
        image: ""
      };
      continue;
    }

    result[category] = randomItem(availableItems);
  }

  return result;
}

function renderTeam(container, teamRoll) {
  container.innerHTML = Object.entries(teamRoll)
    .map(([category, item]) => createCard(categoryLabels[category], item))
    .join("");
}

function generateLoadouts() {
  currentRoll = {
    ct: rollTeam("ct"),
    t: rollTeam("t")
  };

  renderTeam(ctContainer, currentRoll.ct);
  renderTeam(tContainer, currentRoll.t);
}

function buildFilters() {
  filterGrid.innerHTML = ["ct", "t"]
    .map(teamKey => {
      const teamName = teamKey === "ct" ? "CT bans" : "T bans";

      const sections = Object.entries(pools[teamKey])
        .map(([category, items]) => {
          const chips = items
            .map(item => {
              const bannedClass = isBanned(teamKey, category, item.name) ? "banned" : "";

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
      generateLoadouts();
    });
  });
}

async function copyLoadouts() {
  if (!currentRoll) return;

  const formatTeam = (name, roll) => {
    return `${name}
Pistol: ${roll.pistol.name}
Mid-Tier: ${roll.midTier.name}
Rifle: ${roll.rifle.name}
Grenade: ${roll.grenade.name}`;
  };

  const text = `${formatTeam("CT", currentRoll.ct)}

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
  generateLoadouts();
});

generateBtn.addEventListener("click", generateLoadouts);
copyBtn.addEventListener("click", copyLoadouts);

buildFilters();
generateLoadouts();