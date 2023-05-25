// Performance Notes: We can estimate the total limit for units to be <200ms blocking time around 5k.

const factoryUnitsTable = document.getElementById("factory-units-table");
const biterUnitsTable = document.getElementById("biter-units-table");
const ammunitionElement = document.getElementById("ammunition");
//const battleLog = document.getElementById("battle-log");
const startBattleButton = document.getElementById("start-battle");
const inputValues = {};
let battle = {};
let battleOngoing = false;
let factoryUnits = [];
let defeatedBiterUnits = [];
let defeatedFactoryUnits = [];
let startingAmmunitionCopy;
let ammoUsedInBattle;

const startingAmmunition = {};

document.addEventListener("DOMContentLoaded", () => {
  // Update the ammunition element
  ammunitionElement.innerText = battle.ammunition;

  updateUI(factoryUnits, factorUnitCatalogue, biterUnits, ammunition, []);

  // // Update the battle log
  // battle.logs.forEach((log) => {
  //   const logDiv = document.createElement("div");
  //   logDiv.innerText = log;
  //   battleLog.appendChild(logDiv);
  // });

  // Add event listener for the start battle button
  startBattleButton.addEventListener("click", async () => {
    // Deduct the army cost from resources
    const selectedParcel = parcels.getParcel(ui.getSelectedParcelIndex());
    const armyCost = calculateTotalArmyCost(factoryUnits);
    deductArmyCost(selectedParcel, armyCost, factoryUnits);
    // Prepare ammunition and deduct it from the parcels
    prepareAmmunition();

    // Sort factoryUnits so that Walls are first, followed by Reinforced Walls
    factoryUnits.sort((a, b) => {
      const getPriority = (name) => {
        if (name === "Wall") {
          return 1;
        } else if (name === "Reinforced Wall") {
          return 2;
        } else {
          return 3;
        }
      };

      const aPriority = getPriority(a.name);
      const bPriority = getPriority(b.name);
      return aPriority - bPriority;
    });
    startBattleButton.disabled = true;
    battleOngoing = true;
    await battle.run();
    battleOngoing = false;
    // Return the remaining ammunition to the parcels
    returnRemainingAmmunition(battle);

    // Re-enable the start battle button after the battle is finished
    startBattleButton.disabled = false;

    // Update the UI to reflect the changes
    updateAmmunitionDisplay();
  });
});

class Unit {
  constructor(name, health, attack, armor) {
    this.name = name;
    this.health = health;
    this.maxHealth = health;
    this.attack = attack;
    this.armor = armor;
  }
}

class FactoryUnit extends Unit {
  constructor(name, health, attack, armor, consumesAmmo, cost) {
    super(name, health, attack, armor);
    this.consumesAmmo = consumesAmmo;
    this.cost = cost;
    this.payedFor = false;
    this.faction = "factory";
  }
}

// Initialize your factoryUnits and biterUnits here
const factorUnitCatalogue = [
  new FactoryUnit("Wall", 120, 0, 0, 0, { wall: 1 }),
  new FactoryUnit("Reinforced Wall", 150, 0, 10, 0, { steel: 10, wall: 5 }),
  new FactoryUnit("Turret", 100, 30, 5, 1, { turret: 1 }),
  // ... additional factory unit types ...
];


class BiterUnit extends Unit {
  constructor(name, health, attack, armor, reward) {
    super(name, health, attack, armor);
    this.reward = reward;
    this.faction = "biter";
  }
}

class Ammunition {
  constructor(name, damage, armorPenetration, piercing) {
    this.name = name;
    this.damage = damage;
    this.armorPenetration = armorPenetration;
    this.piercing = piercing;
  }
}

const ammunitionTypes = [
  new Ammunition("Melee", 0,0,false),
  new Ammunition("Standard", 10, 0, false),
  new Ammunition("Armor Penetrating", 25, 0.25, false),
  new Ammunition("Piercing", 50, 0.5, true),
];

class Battle {
  constructor(factoryUnits, biterUnits, ammunition, updateUI) {
    this.factoryUnits = factoryUnits;
    this.biterUnits = biterUnits;
    this.ammunition = ammunition;
    this.ticks = 120;
    this.currentTick = 0;
    this.logs = [];
    this.updateUI = updateUI;
  }

  checkBattleStatus() {
    const factoryUnitsAlive = this.factoryUnits.some((unit) => unit.health > 0);
    const biterUnitsAlive = this.biterUnits.some((unit) => unit.health > 0);

    if (!factoryUnitsAlive) {
      return "lose";
    }

    if (!biterUnitsAlive) {
      return "win";
    }

    if (this.currentTick >= this.ticks) {
      return "draw";
    }

    return null;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async run() {
    let battleStatus = null;
    defeatedBiterUnits = [];
    defeatedFactoryUnits = [];
    for (let i = 0; i < this.ticks; i++) {
      if (this.factoryUnits.length === 0 || this.biterUnits.length === 0) {
        break;
      }

      this.fight();
      await this.sleep(1000);

      // Deep copy the factoryUnits and biterUnits arrays
      const factoryUnitsCopy = JSON.parse(JSON.stringify(this.factoryUnits));
      const biterUnitsCopy = JSON.parse(JSON.stringify(this.biterUnits));

      // Update the UI
      this.updateUI(factoryUnitsCopy, factorUnitCatalogue, biterUnitsCopy, this.ammunition, this.logs, true);

      this.currentTick++;
      battleStatus = this.checkBattleStatus();
      if (battleStatus) {
        break;
      }


    }

    await this.afterBattle(battleStatus);
  }

  async afterBattle(battleStatus) {
    let ammunitionUsed = {};

    ammunitionTypes.forEach((ammoType) => {
      if (startingAmmunitionCopy.hasOwnProperty(ammoType.name)) {
        const ammoUsed = startingAmmunitionCopy[ammoType.name] - (this.ammunition[ammoType.name] || 0);
        if (ammoUsed > 0) {
          ammunitionUsed[ammoType.name] = ammoUsed;
        }
      }
    });


    // Process defeated units
    const defeatedBiterUnitCount = countDefeatedUnits(defeatedBiterUnits);
    const defeatedFactoryUnitCount = countDefeatedUnits(defeatedFactoryUnits);

    const rewards = calculateRewards(defeatedBiterUnits);

    switch (battleStatus) {
      case "win":
        this.result = "Victory 🎖";
        addRewardsToMilitaryHQParcel(window.parcels.parcelList, rewards);
        resolveBattle(this.result, rewards)

        // Increment pollution factor, for example
        gameState.pollution.pollutionBiterFactor += 0.005;
        gameState.pollution.pollutionBiterFactor = Math.min(gameState.pollution.pollutionBiterFactor, 1);
        updatePollutionValues();

        // Set the next biter army

        break;
      case "lose":
        this.result = "Defeat 💀";
        resolveBattle(this.result)
        break;
      case "draw":
        this.result = "Draw 🤷";
        resolveBattle(this.result)
        break;
      default:
        this.result = "Inconclusive (This should not happen)";
        resolveBattle(this.result)
        break;
    }


    async function resolveBattle(result, rewards) {
        displayBattleResult(result, ammunitionUsed, defeatedFactoryUnitCount, defeatedBiterUnitCount, rewards);

        biterUnits = await generateBiterArmy(gameState.pollution.pollutionFactor);
        battle = new Battle(factoryUnits, biterUnits, startingAmmunition, updateUI);
        window.battle = battle;
        updateUI(factoryUnits, factorUnitCatalogue, biterUnits, ammunition, [], false);
    }
  }

  fight() {
    let factoryDamages = [];
    let ammoConsumed = {};

    for (const factoryUnit of this.factoryUnits) {
      if (factoryUnit.attack > 0) {
        // Reverse the ammunitionTypes array to pick the strongest first
        const reversedAmmunitionTypes = [...ammunitionTypes].reverse();

        // Choose the first ammunition type with at least 1 ammunition left
        const selectedAmmo = reversedAmmunitionTypes.find(ammoType => this.ammunition[ammoType.name] && this.ammunition[ammoType.name] >= factoryUnit.consumesAmmo);

        if (selectedAmmo && this.ammunition[selectedAmmo.name] >= factoryUnit.consumesAmmo) {
          const totalDamage = factoryUnit.attack + selectedAmmo.damage;
          factoryDamages.push({ damage: totalDamage, ammo: selectedAmmo });
          this.ammunition[selectedAmmo.name] -= factoryUnit.consumesAmmo;
          ammoConsumed[selectedAmmo.name] = (ammoConsumed[selectedAmmo.name] || 0) + factoryUnit.consumesAmmo;
        }
      }
    }

    let biterDamages = [];
    for (const biterUnit of this.biterUnits) {
      biterDamages.push({ damage: biterUnit.attack, ammo: ammunitionTypes[0] });
    }

    this.attackUnits("Biters",this.biterUnits, this.factoryUnits, biterDamages);
    this.attackUnits("Factory",this.factoryUnits, this.biterUnits, factoryDamages);

  }

  attackUnits(faction, attackingUnits, defendingUnits, damages) {
    const killCounts = {};

    for (const damageObj of damages) {
      let remainingDamage = damageObj.damage;
      for (let i = 0; i < defendingUnits.length && remainingDamage > 0; i++) {
        const unit = defendingUnits[i];
        if (unit) {
          const armorPenetration = unit.armor * (1 - damageObj.ammo.armorPenetration);
          const damageToDeal = Math.max(remainingDamage - armorPenetration, 0);

          unit.health -= damageToDeal;

          if (damageObj.ammo.piercing && unit.health <= 0) {
            remainingDamage -= (damageToDeal + armorPenetration + unit.health);
          } else {
            remainingDamage -= (damageToDeal + armorPenetration);
          }


          if (unit.health <= 0) {
            // Increment the kill count for this unit type
            killCounts[unit.name] = (killCounts[unit.name] || 0) + 1;

            console.log(unit.faction);

            if (unit.faction === "factory") {
              // Add defeated unit to defeatedFactoryUnits array
              defeatedFactoryUnits.push(unit);
            } else if (unit.faction === "biter"){
              // Add defeated unit to defeatedBiterUnits array
              defeatedBiterUnits.push(unit);
            }

            // Remove defeated unit from defendingUnits array
            defendingUnits.splice(i, 1);
            i--;

            // If the ammunition has the piercing property, apply remaining damage to the next unit
            if (damageObj.ammo.piercing) {
              i--;
            }
          }
        }
      }
    }

    // Update the logs with the grouped kill events
    for (const [unitName, killCount] of Object.entries(killCounts)) {
      this.logs.push(`${faction} Units kill ${killCount} ${unitName}.`);
    }
  }

  exportData() {
    return {
      factoryUnits: this.factoryUnits,
      biterUnits: this.biterUnits,
      ammunition: this.ammunition,
    };
  }
}

biterUnits = generateBiterArmy(0);
battle = new Battle(factoryUnits, biterUnits, startingAmmunition, updateUI);
window.battle = battle


/* Fight Setup */
function createUnits(unitType, unitClass, count, ...unitArgs) {
  const units = [];

  for (let i = 0; i < count; i++) {
    units.push(new unitClass(unitType, ...unitArgs));
  }

  return units;
}

function prepareAmmunition() {
  ammunitionTypes.forEach((ammoType) => {
    const ammoQuantity = buildingManager.getAmmunitionFromMilitaryHQ(window.parcels.parcelList, ammoType.name);
    if (ammoQuantity > 0) {
      startingAmmunition[ammoType.name] = ammoQuantity;
      buildingManager.deductAmmunitionFromMilitaryHQ(window.parcels.parcelList, ammoType.name, ammoQuantity);
    }
  });
  startingAmmunitionCopy = deepCopyAmmunition(startingAmmunition);
}

function returnRemainingAmmunition(battleInstance) {


  ammunitionTypes.forEach((ammoType) => {
    if (battleInstance.ammunition[ammoType.name] > 0) {
      buildingManager.addAmmunitionToMilitaryHQ(window.parcels.parcelList, ammoType.name, battleInstance.ammunition[ammoType.name]);
    }
  });
}

function deepCopyAmmunition(ammunition) {
  const copy = {};
  for (const key in ammunition) {
    copy[key] = ammunition[key];
  }
  return copy;
}

function countDefeatedUnits(defeatedUnits) {
  const unitCount = {};

  defeatedUnits.forEach((unit) => {
    if (unit.health <= 0) {
      unitCount[unit.name] = (unitCount[unit.name] || 0) + 1;
    }
  });

  return unitCount;
}

function generateBiterArmy(pollutionFactor) {
  const biterWave = waveData.find((wave) => wave.pollutionFactor >= pollutionFactor) || waveData[waveData.length - 1];

  const smallBiterAmount = biterWave.smallBiterAmount;
  const mediumBiterAmount = biterWave.mediumBiterAmount;
  const bigBiterAmount = biterWave.bigBiterAmount;

  const biterUnits = [
    ...createUnits("Small Biter", BiterUnit, smallBiterAmount, 80, 15, 5, {alienArtefacts: 0.005}),
    ...createUnits("Medium Biter", BiterUnit, mediumBiterAmount, 160, 35, 22, {alienArtefacts: 0.01}),
    ...createUnits("Big Biter", BiterUnit, bigBiterAmount, 320, 100, 38, {alienArtefacts: 0.032}),
  ];

  return biterUnits;
}

function calculateRewards(defeatedBiters) {
  const rewards = {};

  defeatedBiters.forEach((biter) => {
    if (biter.reward) {
      for (const [resource, amount] of Object.entries(biter.reward)) {
        rewards[resource] = (rewards[resource] || 0) + amount;
      }
    }
  });

  // Add a flat +0.5 to each reward
  for (const resource in rewards) {
    rewards[resource] += 0.5;
  }

  return rewards;
}

function addRewardsToMilitaryHQParcel(parcels, rewards) {
  const militaryHQParcel = parcels.find((parcel) => parcel.buildings.militaryHQ > 0);

  if (militaryHQParcel) {
    for (const [resource, amount] of Object.entries(rewards)) {
      militaryHQParcel.resources[resource] = (militaryHQParcel.resources[resource] || 0) + amount;
    }
  }
}

/* UI */
function updateUI(factoryUnits, factorUnitCatalogue, biterUnits, ammunition, logs, battleStarted = false) {
  // Clear the tables
  factoryUnitsTable.innerHTML = "";
  biterUnitsTable.innerHTML = "";

  // Add headers to the tables
  const factoryHeader = document.createElement("tr");
  const biterHeader = document.createElement("tr");

  ["Type", "Health", "Count"].forEach((headerText) => {
    const factoryTh = document.createElement("th");
    const biterTh = document.createElement("th");
    factoryTh.innerText = headerText;
    biterTh.innerText = headerText;
    factoryHeader.appendChild(factoryTh);
    biterHeader.appendChild(biterTh);
  });

  if (!battleStarted) {
    const setupTh = document.createElement("th");
    setupTh.innerText = "Setup";
    setupTh.colSpan = 3;
    factoryHeader.appendChild(setupTh);
  }

  factoryUnitsTable.appendChild(factoryHeader);
  biterUnitsTable.appendChild(biterHeader);

  // Group the factory units
  const displayFactoryUnits = battleStarted ? Object.values(groupUnits(factoryUnits)) : factorUnitCatalogue;
  // Update the factory units table
  for (const unitData of displayFactoryUnits) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const unitName = unitData.name;
    nameCell.innerText = unitName;
    nameCell.dataset.unitName = unitName;
    nameCell.classList.add("unit-tooltip");
    row.appendChild(nameCell);

    const healthCell = document.createElement("td");
    const progressBar = createHealthProgressBar(unitData.health, unitData.maxHealth);
    healthCell.appendChild(progressBar);
    row.appendChild(healthCell);

    const countCell = document.createElement("td");
    const unitCount = factoryUnits.filter((u) => u.name === unitName).length;
    countCell.innerText = unitCount;
    row.appendChild(countCell);
    startBattleButton.style.display = "none";
    //Pre Battle Setup
    if (!battleStarted) {
      startBattleButton.style.display = "";

      const buyArmyController = createQuantityInput(unitName, inputValues);

      const buyArmyControllerCell = document.createElement("td");
      buyArmyControllerCell.appendChild(buyArmyController);
      row.appendChild(buyArmyControllerCell);

      const buyCell = document.createElement("td");
      const buyButton = document.createElement("button");
      buyButton.innerText = "Add";
      buyButton.classList.add("buy-unit");
      buyButton.dataset.unitName = unitName;
      buyCell.appendChild(buyButton);
      row.appendChild(buyCell);

      const sellCell = document.createElement("td");
      const sellButton = document.createElement("button");
      sellButton.innerText = "Remove";
      sellButton.classList.add("sell-unit");
      sellButton.dataset.unitName = unitName;
      sellCell.appendChild(sellButton);
      row.appendChild(sellCell);
    }


    factoryUnitsTable.appendChild(row);
  }

  // ======== Biter Units Table Setup ========= //

  // Group the biter units
  const groupedBiterUnits = groupUnits(biterUnits);
  let totalBiterHealth = 0;
  let totalBiterCount = 0;

  // Update the biter units table
  for (const [unitName, unitData] of Object.entries(groupedBiterUnits)) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.innerText = unitName;
    nameCell.dataset.unitName = unitName;
    nameCell.classList.add("unit-tooltip");
    row.appendChild(nameCell);

    const healthCell = document.createElement("td");
    const progressBar = createHealthProgressBar(unitData.health, unitData.maxHealth);
    totalBiterHealth += unitData.health;
    healthCell.appendChild(progressBar);
    row.appendChild(healthCell);

    const countCell = document.createElement("td");
    countCell.innerText = unitData.count;
    totalBiterCount += unitData.count;
    row.appendChild(countCell);

    biterUnitsTable.appendChild(row);
  }

  // Create biter totals
  const totalsRow  = document.createElement("tr");
  const nameCell   = document.createElement("td");
  const healthCell = document.createElement("td");
  const countCell  = document.createElement("td");

  nameCell.innerText  = 'Total';
  countCell.innerText = totalBiterCount;
  const progressBar   = createHealthProgressBar(totalBiterHealth, totalBiterHealth);

  totalsRow .appendChild(nameCell);
  healthCell.appendChild(progressBar);
  totalsRow .appendChild(healthCell);
  totalsRow .appendChild(countCell)
  biterUnitsTable.appendChild(totalsRow)


  // Update the ammunition element
  updateAmmunitionDisplay(battleStarted);


  // // Update the battle log
  // logs.forEach((log) => {
  //   const logElement = document.createElement("li");
  //   logElement.innerText = log;
  //   battleLog.appendChild(logElement);
  // });

  // Pre Battle
  if (!battleStarted) {
    // Add event listeners to buy and sell buttons
    document.querySelectorAll(".buy-unit").forEach((button, index) => {
      button.addEventListener("click", (event) => {
        const unitName = event.target.dataset.unitName;
        const quantityInput = document.querySelectorAll(".unit-quantity")[index];
        const quantity = parseInt(quantityInput.value);
        inputValues[unitName] = quantity;
        buyFactoryUnit(unitName, factoryUnits, factorUnitCatalogue, quantity);
        updateUI(factoryUnits, factorUnitCatalogue, biterUnits, ammunition, logs, battleStarted, inputValues);
      });
    });

    document.querySelectorAll(".sell-unit").forEach((button, index) => {
      button.addEventListener("click", (event) => {
        const unitName = event.target.dataset.unitName;
        const quantityInput = document.querySelectorAll(".unit-quantity")[index];
        const quantity = parseInt(quantityInput.value);
        inputValues[unitName] = quantity;
        sellFactoryUnit(unitName, factoryUnits, quantity);
        updateUI(factoryUnits, factorUnitCatalogue, biterUnits, ammunition, logs, battleStarted, inputValues);
      });
    });

    // Calculate and display the total cost for the army
    displayArmyCost(factoryUnits);
    addTooltipToUnits(".unit-tooltip", [...factorUnitCatalogue, ...biterUnits]);
  }
}

function createQuantityInput(unitName, inputValues) {
  const buyArmyController = document.createElement("div");
  const minusBtn = document.createElement("div");
  const plusBtn = document.createElement("div");
  const quantityInput = document.createElement("input");

  // Set properties and attributes
  buyArmyController.className = "input-controller";

  minusBtn.className = "input-btn";
  minusBtn.innerText = "-";

  plusBtn.className = "input-btn";
  plusBtn.innerText = "+";

  quantityInput.type = "number";
  quantityInput.className = "input-display";

  quantityInput.value = inputValues[unitName] || 1;
  quantityInput.min = 1;
  quantityInput.classList.add("unit-quantity");

  // Append elements
  buyArmyController.append(minusBtn, quantityInput, plusBtn);

  // Function to handle button clicks
  const handleButtonClick = (increment) => {
    const currentVal = parseInt(quantityInput.value, 10) || 0;
    const newVal = currentVal + increment;

    if (newVal >= 1) {
      quantityInput.value = newVal;
    }
  };

  // Attach event listeners
  minusBtn.addEventListener("click", () => handleButtonClick(-1));
  plusBtn.addEventListener("click", () => handleButtonClick(1));

  return buyArmyController;
}

function groupUnits(units) {
  const groupedUnits = {};

  for (const unit of units) {
    const unitKey = unit.health === unit.maxHealth ? unit.name : `${unit.name}`;

    if (!groupedUnits[unitKey]) {
      groupedUnits[unitKey] = {
        name: unit.name,
        health: unit.health,
        maxHealth: unit.maxHealth,
        count: 0,
      };
    }

    groupedUnits[unitKey].count++;
  }

  return groupedUnits;
}

function createHealthProgressBar(currentHealth, maxHealth) {
  const progressBarContainer = document.createElement("div");
  progressBarContainer.style.width = "100%";
  progressBarContainer.style.backgroundColor = "#c00";
  progressBarContainer.style.position = "relative";

  const progressBar = document.createElement("div");
  progressBar.style.width = `${(currentHealth / maxHealth) * 100}%`;
  progressBar.style.height = "20px";
  progressBar.style.backgroundColor = "#4cb43c";

  const healthText = document.createElement("span");
  healthText.innerText = Math.round(currentHealth);
  healthText.style.position = "absolute";
  healthText.style.left = "50%";
  healthText.style.top = "50%";
  healthText.style.transform = "translate(-50%, -50%)";

  progressBarContainer.appendChild(progressBar);
  progressBarContainer.appendChild(healthText);
  return progressBarContainer;
}

function addTooltipToUnits(selector, unitsData) {
  const elements = document.querySelectorAll(selector);
  elements.forEach((element) => {
    element.addEventListener("mouseover", (event) => {
      const unitName = event.target.dataset.unitName;
      const unitData = unitsData.find((unit) => unit.name === unitName);
      let tooltipText = `
        Name: ${unitData.name}<br>
        Health: ${unitData.health}<br>
        Attack: ${unitData.attack}<br>
        Armor: ${unitData.armor}<br>
      `;

      if (unitData instanceof FactoryUnit) {
        tooltipText += `Consumes Ammo: ${unitData.consumesAmmo}<br><br>`;
        const costText = Object.entries(unitData.cost)
          .map(([resource, cost]) => `${cost} ${resource}`)
          .join("<br>");
        tooltipText += `Cost:<br>${costText}`;
      } else if (unitData instanceof BiterUnit) {
        const rewardText = Object.entries(unitData.reward)
          .map(([resource, reward]) => `${reward} ${resource}`)
          .join("<br>");
        tooltipText += `Reward:<br>${rewardText}`;
      }

      tooltip.innerHTML = tooltipText;
      tooltip.style.display = "block";
      tooltip.style.left = event.pageX + 10 + "px";
      tooltip.style.top = event.pageY + 10 + "px";
    });

    // Hide tooltip on mouseout
    element.addEventListener("mouseout", () => {
      tooltip.style.display = "none";
    });

    // Update tooltip position on mousemove
    element.addEventListener("mousemove", (event) => {
      tooltip.style.left = event.pageX + 10 + "px";
      tooltip.style.top = event.pageY + 10 + "px";
    });
  });
}

/* Unit Cost */
function buyFactoryUnit(unitName, factoryUnits, factorUnitCatalogue, quantity) {
  const unitTemplate = factorUnitCatalogue.find((u) => u.name === unitName);

  if (unitTemplate) {
    for (let i = 0; i < quantity; i++) {
      const newUnit = new FactoryUnit(
        unitTemplate.name,
        unitTemplate.health,
        unitTemplate.attack,
        unitTemplate.armor,
        unitTemplate.consumesAmmo,
        unitTemplate.cost
      );
      factoryUnits.push(newUnit);
    }
  }
}

function sellFactoryUnit(unitName, factoryUnits, quantity) {
  for (let i = 0; i < quantity; i++) {
    const index = factoryUnits.findIndex((u) => u.name === unitName && !u.payedFor);

    if (index !== -1) {
      factoryUnits.splice(index, 1);
    } else {
      // If no unpaid unit is found, sell any available unit
      const anyUnitIndex = factoryUnits.findIndex((u) => u.name === unitName);
      if (anyUnitIndex !== -1) {
        factoryUnits.splice(anyUnitIndex, 1);
      } else {
        break;
      }
    }
  }
}

function displayArmyCost(factoryUnits) {
  const resourceCostTable = document.getElementById("resource-cost-table");
  resourceCostTable.innerHTML = "";

  const costs = calculateTotalArmyCost(factoryUnits);

  if (Object.entries(costs).length > 0) {
    const headerRow = document.createElement("tr");

    const resourceHeader = document.createElement("th");
    resourceHeader.innerText = "Resource";
    resourceHeader.colSpan = 1;
    headerRow.appendChild(resourceHeader);

    const costHeader = document.createElement("th");
    costHeader.innerText = "Cost";
    costHeader.colSpan = 1;
    headerRow.appendChild(costHeader);

    const missingHeader = document.createElement("th");
    missingHeader.innerText = "Missing";
    missingHeader.colSpan = 1;
    headerRow.appendChild(missingHeader);

    resourceCostTable.appendChild(headerRow);
  }

  for (const [resource, cost] of Object.entries(costs)) {
    const row = document.createElement("tr");

    const resourceNameCell = document.createElement("td");
    resourceNameCell.innerText = resource;
    row.appendChild(resourceNameCell);

    const costCell = document.createElement("td");
    costCell.innerText = cost;
    row.appendChild(costCell);

    // Calculate missing resources
    const selectedParcel = parcels.parcelList[ui.getSelectedParcelIndex()];
    const totalResource = (selectedParcel.resources[resource] || 0) + buildingManager.getResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resource);
    const missing = Math.max(cost - totalResource, 0).toFixed(0);

    const missingCell = document.createElement("td");
    missingCell.innerText = missing;
    row.appendChild(missingCell);

    resourceCostTable.appendChild(row);
  }
}

function calculateTotalArmyCost(factoryUnits) {
  const costs = {};

  factoryUnits.forEach((unit) => {
    if (!unit.payedFor) {
      for (const [resource, cost] of Object.entries(unit.cost)) {
        costs[resource] = (costs[resource] || 0) + cost;
      }
    }
  });

  return costs;
}

function canAffordArmy(selectedParcel, armyCost) {
  for (const resource in armyCost) {
    const totalResource = (selectedParcel.resources[resource] || 0) + buildingManager.getResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resource);

    if (totalResource < armyCost[resource]) {
      return false;
    }
  }
  return true;
}

function updateAmmunitionDisplay(battleStarted = false) {
  const ammunitionElement = document.getElementById("ammunition");

  // Clear the innerHTML
  ammunitionElement.innerHTML = "";

  // Iterate over the ammunitionTypes array and create an ammoInfo element for each ammunition type
  ammunitionTypes.forEach((ammoType) => {
    let ammoQuantity;

    if (battleStarted) {
      ammoQuantity = battle.ammunition[ammoType.name] ? battle.ammunition[ammoType.name].toFixed(0) : 0;
    } else {
      ammoQuantity = buildingManager.getAmmunitionFromMilitaryHQ(window.parcels.parcelList, ammoType.name) ? buildingManager.getAmmunitionFromMilitaryHQ(window.parcels.parcelList, ammoType.name).toFixed(0) : 0;
    }

    // Only display ammunition types with a quantity greater than 0
    if (ammoQuantity > 0) {
      const ammoInfo = document.createElement("span");
      ammoInfo.innerText = `${'\xa0'.repeat(10)} ${ammoType.name}: ${ammoQuantity}          `;
      ammunitionElement.appendChild(ammoInfo);

      // Add tooltip to the ammoInfo element
      ammoInfo.addEventListener("mouseover", (event) => {
        const tooltipText = `
          Damage: ${ammoType.damage}<br>
          Armor Penetration: ${(ammoType.armorPenetration * 100).toFixed(0)}%<br>
          Piercing: ${ammoType.piercing ? "Yes" : "No"}`;
        tooltip.innerHTML = tooltipText;
        tooltip.style.display = "block";
        tooltip.style.left = event.pageX + 10 + "px";
        tooltip.style.top = event.pageY + 10 + "px";
      });

      // Hide tooltip on mouseout
      ammoInfo.addEventListener("mouseout", () => {
        tooltip.style.display = "none";
      });

      // Update tooltip position on mousemove
      ammoInfo.addEventListener("mousemove", (event) => {
        tooltip.style.left = event.pageX + 10 + "px";
        tooltip.style.top = event.pageY + 10 + "px";
      });
    }
  });
}


function updateStartBattleButtonState() {
  const selectedParcel = parcels.getParcel(ui.getSelectedParcelIndex());
  const armyCost = calculateTotalArmyCost(factoryUnits);

  if (factoryUnits.length === 0) {
    startBattleButton.disabled = true;
  } else if (canAffordArmy(selectedParcel, armyCost)) {
    startBattleButton.disabled = false;
  } else {
    startBattleButton.disabled = true;
  }
}

function deductArmyCost(selectedParcel, armyCost, factoryUnits) {
  for (const resource in armyCost) {
    const totalResource = (selectedParcel.resources[resource] || 0) + buildingManager.getResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resource);

    if (selectedParcel.resources[resource] >= armyCost[resource]) {
      selectedParcel.resources[resource] -= armyCost[resource];
    } else {
      const parcelResource = selectedParcel.resources[resource] || 0;
      const remainingResource = armyCost[resource] - parcelResource;
      selectedParcel.resources[resource] = 0;
      buildingManager.deductResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resource, remainingResource);
    }
  }

  // Set payedFor to true for each unit
  factoryUnits.forEach((unit) => {
    if (!unit.payedFor) {
      unit.payedFor = true;
    }
  });
}

function displayBattleResult(result, ammunitionUsed = {}, defeatedFactoryUnits = [], defeatedBiterUnits = [], reward = {alienArtefacts: 0}) {
  const fightContainer = document.getElementById("fight-container");

  // Create overlay
  const overlay = document.createElement("div");
  const darkMode = localStorage.getItem('darkMode');

  overlay.style.position = "absolute";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.minHeight = "100%";

  overlay.id = "battle-result-overlay";

  if (darkMode === null || darkMode === 'true') {
    overlay.style.backgroundColor = "rgba(0, 2, 4, 0.8)";
    overlay.style.outline = "1px solid rgb(131, 122, 108)";
  } else {
    overlay.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
    overlay.style.outline = "1px solid";
  }


  // Create result text
  const resultText = document.createElement("h1");
  resultText.innerText = result;
  resultText.style.textAlign = "center";

  // Create reward text
  const rewardText = document.createElement("h3");
  const rewardValue = (reward.alienArtefacts ?? 0).toFixed(2);
  rewardText.innerText = "Alien Artefacts Gained: " + rewardValue;
  rewardText.style.textAlign = "center";

  // Create continue button
  const continueButton = document.createElement("button");
  continueButton.innerText = "Continue";
  continueButton.style.display = "block";
  continueButton.style.margin = "0 auto 2em";
  continueButton.addEventListener("click", hideBattleResult);

  // Create used ammunition table
  const ammunitionTable = createTableFromObject("Used Ammunition", ammunitionUsed);
  ammunitionTable.style.marginTop = "0px";

  // Create defeated factory units table
  const factoryUnitsTable = createTableFromObject("Factory Units Lost", defeatedFactoryUnits);
  factoryUnitsTable.style.marginTop = "0px";

  // Create defeated biter units table
  const biterUnitsTable = createTableFromObject("Biter Units Defeated", defeatedBiterUnits);
  biterUnitsTable.style.marginTop = "0px";

  // Append elements to the overlay and then to the fight container
  overlay.appendChild(resultText);
  overlay.appendChild(rewardText);
  overlay.appendChild(ammunitionTable);
  overlay.appendChild(factoryUnitsTable);
  overlay.appendChild(biterUnitsTable);
  overlay.appendChild(continueButton);
  fightContainer.appendChild(overlay);
}

function createTableFromObject(title, object) {
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const tbody = document.createElement("tbody");

  const headerRow = document.createElement("tr");
  const headerTitle = document.createElement("th");
  const headerValue = document.createElement("th");
  headerTitle.innerText = title;
  headerTitle.classList.add("header");
  headerValue.innerText = "Value";
  headerRow.appendChild(headerTitle);
  headerRow.appendChild(headerValue);
  thead.appendChild(headerRow);

  Object.entries(object).forEach(([key, value]) => {
    const row = document.createElement("tr");
    const cellKey = document.createElement("td");
    const cellValue = document.createElement("td");
    cellKey.innerText = key;
    cellValue.innerText = value;
    cellKey.classList.add("resource-name");
    row.appendChild(cellKey);
    row.appendChild(cellValue);
    tbody.appendChild(row);
  });
  table.appendChild(thead);
  table.appendChild(tbody);
  table.style.minWidth = "25%";
  table.style.margin = "0px auto 2em";
  table.style.borderCollapse = "collapse";
  table.style.textAlign = "center";

  // Set table header style
  thead.style.fontWeight = "bold";

  // Set table row and cell styles
  tbody.querySelectorAll("tr, td").forEach((el) => {
    el.style.border = "1px solid";
    el.style.padding = "5px";
  });

  return table;
}

function hideBattleResult() {
  updateUI(factoryUnits, factorUnitCatalogue, biterUnits, ammunition, [], false)
  const overlay = document.getElementById("battle-result-overlay");
  if (overlay) {
    overlay.remove();
  }
}
