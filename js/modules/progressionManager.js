let clusterFlag = false;
let challengeFlag = false;
class ProgressionManager {
  constructor() {
    this.unlockedBuildings = new Set();
  }

  // Check if the building is unlocked
  isUnlocked(buildingId) {
    return this.unlockedBuildings.has(buildingId);
  }

  // Unlock a building
  unlockBuilding(buildingId) {
    this.unlockedBuildings.add(buildingId);
    console.log("hello");
    // Check if all required buildings are unlocked and update the Production header visibility
    if (
      this.isUnlocked("ironMiner") &&
      this.isUnlocked("stoneMiner") &&
      this.isUnlocked("coalMiner")
    ) {
      const productionHeader = document.getElementById(`productionHeader-${window.gameState.parcels[ui.getSelectedParcelIndex()].id}`);
      const countHeader = document.getElementById(`countHeader-${window.gameState.parcels[ui.getSelectedParcelIndex()].id}`);
      if (productionHeader) {
        console.log("UNLOCKED");
        //countHeader.style.display = "";
        //productionHeader.style.display = ""; // Unhide the Production header
      }
    }
    window.ui.updateBuildingDisplay(window.gameState.parcels[ui.getSelectedParcelIndex()]);
  }

  // Check the requirements for a building
  checkRequirements(buildingId) {
    const building = window.buildingManager.getBuilding(buildingId);
    const parcels = window.gameState.parcels;

    const trainUpgrades = [
      { researchKey: 'trainsMax1', maxTrains: 2, research: { redScience: 30, greenScience: 30, darkScience: 30} },
      { researchKey: 'trainsMax2', maxTrains: 4, research: { redScience: 60, greenScience: 60, darkScience: 60} },
      { researchKey: 'trainsMax3', maxTrains: 8, research: { redScience: 60, greenScience: 60, darkScience: 60, blueScience: 60} },
      { researchKey: 'trainsMax4', maxTrains: 12, research: { redScience: 60, greenScience: 60, darkScience: 60, blueScience: 60, purpleScience: 60} },
      { researchKey: 'trainsMax5', maxTrains: 16, research: { redScience: 60, greenScience: 60, darkScience: 60, blueScience: 60, purpleScience: 60, yellowScience: 60} },
      { researchKey: 'trainsMax6', maxTrains: 20, research: { redScience: 600, greenScience: 600, darkScience: 600, blueScience: 600, purpleScience: 600, yellowScience: 600, whiteScience: 60} },
      { researchKey: 'trainsMax7', maxTrains: 24, research: { redScience: 6000, greenScience: 6000, darkScience: 6000, blueScience: 6000, purpleScience: 6000, yellowScience: 6000, whiteScience: 600} }
    ];

    trainUpgrades.forEach((upgrade, index) => {
      if (window.gameState.research[upgrade.researchKey]) {
        gameState.maxTrains = upgrade.maxTrains;

        // Add the next research option if it exists in the array and it's not already added
        const nextUpgrade = trainUpgrades[index + 1];
        if (nextUpgrade && !window.researchManager.researchExists(nextUpgrade.researchKey)) {
          window.researchManager.addResearch(
            new Research(nextUpgrade.researchKey, `Upgrade Train Limit to ${nextUpgrade.maxTrains}`, nextUpgrade.research)
          );
          window.researchManager.populateResearchDropdown();
        }
      }
    });

    const challengeUpgrades = [
      { researchKey: 'challengeMax1', maxChallenges: 2, research: { redScience: 60, greenScience: 60, darkScience: 60} },
      { researchKey: 'challengeMax2', maxChallenges: 3, research: { redScience: 60, greenScience: 60, darkScience: 60, blueScience: 60} },
      { researchKey: 'challengeMax3', maxChallenges: 4, research: { redScience: 60, greenScience: 60, darkScience: 60, blueScience: 60, purpleScience: 60} },
      { researchKey: 'challengeMax4', maxChallenges: 5, research: { redScience: 60, greenScience: 60, darkScience: 60, blueScience: 60, purpleScience: 60, yellowScience: 60} },
      { researchKey: 'challengeMax5', maxChallenges: 6, research: { redScience: 600, greenScience: 600, darkScience: 600, blueScience: 600, purpleScience: 600, yellowScience: 600, whiteScience: 60} },
      { researchKey: 'challengeMax6', maxChallenges: 7, research: { redScience: 6000, greenScience: 6000, darkScience: 6000, blueScience: 6000, purpleScience: 6000, yellowScience: 6000, whiteScience: 600} }
    ];

    challengeUpgrades.forEach((upgrade, index) => {
      if (window.gameState.research[upgrade.researchKey]) {
        gameState.maxChallenges = upgrade.maxChallenges;


        // Add the next research option if it exists in the array and it's not already added
        const nextUpgrade = challengeUpgrades[index + 1];
        if (nextUpgrade && !window.researchManager.researchExists(nextUpgrade.researchKey)) {
          window.researchManager.addResearch(
            new Research(nextUpgrade.researchKey, `Upgrade Challenge Slot Limit to ${nextUpgrade.maxChallenges}`, nextUpgrade.research)
          );
          window.researchManager.populateResearchDropdown();
          updateChallengeView();
        } else if (index === challengeUpgrades.length - 1 && !challengeFlag) {
          // Handle edge case when the last upgrade is researched
          console.log("challengeUpgrades");
          updateChallengeView();
          challengeFlag = true;
        }
      }
    });

    const clusterUpgrades = [
      { researchKey: 'clustersMax1', maxClusters: 3, research: { redScience: 60, greenScience: 60, darkScience: 60, blueScience: 60} },
      { researchKey: 'clustersMax2', maxClusters: 4, research: { redScience: 60, greenScience: 60, darkScience: 60, blueScience: 60, purpleScience: 60} },
      { researchKey: 'clustersMax3', maxClusters: 5, research: { redScience: 60, greenScience: 60, darkScience: 60, blueScience: 60, purpleScience: 60, yellowScience: 60} },
      { researchKey: 'clustersMax4', maxClusters: 6, research: { redScience: 600, greenScience: 600, darkScience: 600, blueScience: 600, purpleScience: 600, yellowScience: 600, whiteScience: 60} },
      { researchKey: 'clustersMax5', maxClusters: 7, research: { redScience: 6000, greenScience: 6000, darkScience: 6000, blueScience: 6000, purpleScience: 6000, yellowScience: 6000, whiteScience: 600} }
    ];

    clusterUpgrades.forEach((upgrade, index) => {
      if (window.gameState.research[upgrade.researchKey]) {
        gameState.maxClusters = upgrade.maxClusters;

        // Add the next research option if it exists in the array and it's not already added
        const nextUpgrade = clusterUpgrades[index + 1];
        if (nextUpgrade && !window.researchManager.researchExists(nextUpgrade.researchKey)) {
          window.researchManager.addResearch(
            new Research(nextUpgrade.researchKey, `Upgrade Cluster Limit to ${nextUpgrade.maxClusters}`, nextUpgrade.research)
          );
          window.researchManager.populateResearchDropdown();
          ui.updateBuyParcelDropdown();
        } else if (index === clusterUpgrades.length - 1 && !clusterFlag) {
          // Handle edge case when the last upgrade is researched
          console.log("else");
          ui.updateBuyParcelDropdown();
          clusterFlag = true;
        }
      }
    });

    // Show buyParcel-dropdown when clusterTech is researched
    if (window.gameState.research.clusterTech) {
      document.getElementById("buyParcel-dropdown").style.display = "inline-block";
    }

    // Check for GameWin
    if (window.gameState.research.gameWon) {
      alert("Congrats! You won the Demo! There is a feedback button top left, sharing your perspective highly appreciated :)");
      window.gameState.research.gameWon = false;
    }

    // Check for GameWin
    if (window.gameState.research.gameWon2) {
      alert("Wow Impressive! Now I really want to see your factory! How long did it take you to get here?");
      window.gameState.research.gameWon2 = false;
    }

    // Check for GameWin
    if (window.gameState.research.gameWon3) {
      alert("This you must explain to me.");
      window.gameState.research.gameWon3 = false;
    }

    if (window.gameState.research.challengeTech) {
      gameState.sectionVisibility.challengeSection = true;
    }

    if (window.gameState.research.trains) {
      gameState.sectionVisibility.trainSection = true;
    }

    for (const parcel of parcels) {
      if (parcel.buildings.coalPowerPlant > 0) {
        gameState.sectionVisibility.energySection = true;
        gameState.sectionVisibility.pollutionSection = true;
      }

      if (parcel.buildings.militaryHQ > 0) {
        gameState.sectionVisibility.fightSection = true;
      }

      if (
        (buildingId === "ironMiner" || buildingId === "stoneMiner" || buildingId === "coalMiner") &&
        parcel.resources.ironPlates > 0 &&
        parcel.buildings.coalPowerPlant > 0
      ) {
        const shouldBeVisible = parcel.buildings.ironMiner > 0 || parcel.buildings.stoneMiner > 0 || parcel.buildings.coalMiner > 0;
        if (shouldBeVisible) {
          gameState.sectionVisibility.projectSection = true;
          gameState.sectionVisibility.researchSection = true;
        }
      }

      if (parcel.buildings.blueprintLibrary > 0) {
        gameState.sectionVisibility.blueprints = true;
      }
    }

    if (building && building.unlockConditions()) {
      return true;
    }

    return false;
  }



  // Update the progression system based on the current game state
  update(gameState) {
    // Iterate through all buildings and check if their requirements are met
    // If a building's requirements are met, unlock the building
    const buildingList = window.buildingManager.getBuildingList();
    for (const i in buildingList) {
      const buildingId = buildingList[i].id
      if (this.checkRequirements(buildingId) && !this.unlockedBuildings.has(buildingId)) {
        this.unlockBuilding(buildingId);
      }
    }
  }
}


// Initialize the progression manager
window.progressionManager = new ProgressionManager();
