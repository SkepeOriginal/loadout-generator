const pools = {
  ct: {
    pistol: [
      { name: "USP-S", image: "assets/usp_s.png" },
      { name: "P2000", image: "assets/p2000.png" },
      { name: "Dual Berettas", image: "assets/dual_berettas.png" },
      { name: "Five-SeveN", image: "assets/five_seven.png" },
      { name: "CZ75-Auto", image: "assets/cz75_auto.png" },
      { name: "Desert Eagle", image: "assets/desert_eagle.png" },
      { name: "R8 Revolver", image: "assets/r8_revolver.png" }
    ],
    midTier: [
      { name: "MP9", image: "assets/mp9.png" },
      { name: "MP7", image: "assets/mp7.png" },
      { name: "UMP-45", image: "assets/ump_45.png" },
      { name: "P90", image: "assets/p90.png" },
      { name: "Nova", image: "assets/nova.png" },
      { name: "XM1014", image: "assets/xm1014.png" },
      { name: "MAG-7", image: "assets/mag_7.png" }
    ],
    rifle: [
      { name: "FAMAS", image: "assets/famas.png" },
      { name: "M4A4", image: "assets/m4a4.png" },
      { name: "M4A1-S", image: "assets/m4a1_s.png" },
      { name: "AUG", image: "assets/aug.png" },
      { name: "SSG 08", image: "assets/ssg_08.png" },
      { name: "AWP", image: "assets/awp.png" },
      { name: "SCAR-20", image: "assets/scar_20.png" }
    ],
    grenade: [
      { name: "Flashbang", image: "assets/flashbang.png" },
      { name: "HE Grenade", image: "assets/he_grenade.png" },
      { name: "Smoke Grenade", image: "assets/smoke_grenade.png" },
      { name: "Incendiary Grenade", image: "assets/incendiary_grenade.png" },
      { name: "Decoy Grenade", image: "assets/decoy_grenade.png" }
    ]
  },
  t: {
    pistol: [
      { name: "Glock-18", image: "assets/glock_18.png" },
      { name: "Dual Berettas", image: "assets/dual_berettas.png" },
      { name: "P250", image: "assets/p250.png" },
      { name: "Tec-9", image: "assets/tec_9.png" },
      { name: "CZ75-Auto", image: "assets/cz75_auto.png" },
      { name: "Desert Eagle", image: "assets/desert_eagle.png" },
      { name: "R8 Revolver", image: "assets/r8_revolver.png" }
    ],
    midTier: [
      { name: "MAC-10", image: "assets/mac_10.png" },
      { name: "MP7", image: "assets/mp7.png" },
      { name: "UMP-45", image: "assets/ump_45.png" },
      { name: "P90", image: "assets/p90.png" },
      { name: "Nova", image: "assets/nova.png" },
      { name: "XM1014", image: "assets/xm1014.png" },
      { name: "Sawed-Off", image: "assets/sawed_off.png" }
    ],
    rifle: [
      { name: "Galil AR", image: "assets/galil_ar.png" },
      { name: "AK-47", image: "assets/ak_47.png" },
      { name: "SG 553", image: "assets/sg_553.png" },
      { name: "SSG 08", image: "assets/ssg_08.png" },
      { name: "AWP", image: "assets/awp.png" },
      { name: "G3SG1", image: "assets/g3sg1.png" }
    ],
    grenade: [
      { name: "Flashbang", image: "assets/flashbang.png" },
      { name: "HE Grenade", image: "assets/he_grenade.png" },
      { name: "Smoke Grenade", image: "assets/smoke_grenade.png" },
      { name: "Molotov", image: "assets/molotov.png" },
      { name: "Decoy Grenade", image: "assets/decoy_grenade.png" }
    ]
  }
};

const categoryLabels = {
  pistol: "Pistol",
  midTier: "Mid-Tier",
  rifle: "Rifle",
  grenade: "Grenade"
};

const ctContainer = document.getElementById("ct-loadout");
const tContainer = document.getElementById("t-loadout");
const generateBtn = document.getElementById("generateBtn");
const copyBtn = document.getElementById("copyBtn");

let currentRoll = null;

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createCard(label, item) {
  return `
    <div class="loadout-item">
      <img
        class="weapon-image"
        src="${item.image}"
        alt="${item.name}"
        onerror="this.style.display='none'; this.nextElementSibling.hidden = false;"
      />
      <div class="weapon-fallback" hidden>${item.name}</div>

      <div class="item-meta">
        <span class="item-label">${label}</span>
        <div class="item-name">${item.name}</div>
      </div>
    </div>
  `;
}

function rollTeam(teamKey) {
  const teamPool = pools[teamKey];

  return {
    pistol: randomItem(teamPool.pistol),
    midTier: randomItem(teamPool.midTier),
    rifle: randomItem(teamPool.rifle),
    grenade: randomItem(teamPool.grenade)
  };
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

async function copyLoadouts() {
  if (!currentRoll) {
    return;
  }

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

generateBtn.addEventListener("click", generateLoadouts);
copyBtn.addEventListener("click", copyLoadouts);
