const gameState = {
  get parcels() {
    return window.parcels.parcelList;
  },
  buyParcelCost: {
      expansionPoints: 2,
      alienArtefacts: 1,
  },
  clusterBuyParcelCosts: [
    { expansionPoints: 2, alienArtefacts: 1 },
    { expansionPoints: 2, alienArtefacts: 1 },
    { expansionPoints: 2, alienArtefacts: 1 },
    { expansionPoints: 2, alienArtefacts: 1 },
    { expansionPoints: 2, alienArtefacts: 1 },
    { expansionPoints: 2, alienArtefacts: 1 },
    { expansionPoints: 2, alienArtefacts: 1 },
    { expansionPoints: 2, alienArtefacts: 1 },
    { expansionPoints: 2, alienArtefacts: 1 },
  ],
  research: {}, // Fill with your research data
  progression: {
    unlockedBuildings: new Set(), // Store the unlocked buildings here
  },
  sectionVisibility: {
    energySection: false,
    pollutionSection: false,
    fightSection: false,
    projectSection: false,
    researchSection: false,
    blueprints: false,
    trainSection: false,
    challengeSection: false,
  },
  battle: null,
  pollution: {
    pollutionFactor: 0,
    pollutionBiterFactor: 0,
    pollutionValue: 0,
    pollutionEnergyValue: 0,
    pollutionBuildingValue: 0,
  },
  scheduleList: [],
  trainList: [],
  maxTrains: 1,
  maxClusters: 2,
  maxChallenges: 1,
  activeChallenges: [],
  currentChallengeCards: [],
  autoSave: true,
  // Add other relevant game state data as needed
};

window.gameState = gameState;

window.saveGame = function() {
  console.log('Saving game...');
  // Save the battle object
  if (window.battle) {
    window.gameState.battle = window.battle.exportData();
  }

  // Convert unlockedBuildings Set to an Array before saving
  const unlockedBuildingsArray = Array.from(window.progressionManager.unlockedBuildings);
  const gameStateCopy = { ...window.gameState, progression: { ...window.gameState.progression, unlockedBuildings: unlockedBuildingsArray } };

  localStorage.setItem('gameState', LZString.compress(JSON.stringify(gameStateCopy)));
  const projectsJSON = LZString.compress(JSON.stringify(projectsModule.projects));
  localStorage.setItem("savedProjects", projectsJSON);
  localStorage.setItem("researchData", LZString.compress(window.researchManager.saveResearchData()));
  console.log('Game Saved.');
};

window.loadGame = function() {
  const savedState = LZString.decompress(localStorage.getItem('gameState'));
  if (savedState) {
    const parsedState = JSON.parse(savedState);

    // Ensure parcels object is properly linked and updated
    const updatedParcelList = parsedState.parcels.map((parcelData, index) => {
      // Create a new parcel object using the saved parcel data
      const parcel = new Parcel(
        parcelData.id,
        parcelData.maxBuildings,
        parcelData.cluster ?? 0,
        parcelData.continent ?? 0,
        parcelData.planet ?? 0,
      );

      // Assign the properties from the saved parcel data
      Object.assign(parcel.buildings, parcelData.buildings);
      Object.assign(parcel.activeBuildings, parcelData.activeBuildings);
      Object.assign(parcel.resources, parcelData.resources);
      Object.assign(parcel.beltUsage, parcelData.beltUsage);
      Object.assign(parcel.previousResources, parcelData.previousResources);
      Object.assign(parcel.upgrades, parcelData.upgrades);
      parcel.productionRateModifier = parcelData.productionRateModifier;
      parcel.consumptionRateModifier = parcelData.consumptionRateModifier;
      Object.assign(parcel.buildingProductionRateModifiers, parcelData.buildingProductionRateModifiers);
      Object.assign(parcel.buildingConsumptionRateModifiers, parcelData.buildingConsumptionRateModifiers);
      parcel.maxResources = parcels.calcParcelMaxResources(parcelData.maxBuildings);



      // Assign the inputValues property from the saved parcel data
      Object.assign(parcel.inputValues, parcelData.inputValues);

      // Assign custom color and name if they exist
      if (parcelData.color) {
        parcel.color = parcelData.color;
        //parcelManipulation.updateParcelTab(index);
      }
      if (parcelData.name) {
        parcel.name = parcelData.name;
        //parcelManipulation.updateParcelTab(index);
      }

      // Update the existing parcel object with the new one
      window.parcels.parcelList[index] = parcel;

      return parcel;
    });

    // Assign the Parcel Costs
    if (parsedState.clusterBuyParcelCosts) {
      window.gameState.clusterBuyParcelCosts = parsedState.clusterBuyParcelCosts;
    }

    // Assign the Parcel Costs
    if (parsedState.buyParcelCost) {
      window.gameState.buyParcelCost = parsedState.buyParcelCost;

      // Check if buyParcelCost is higher than the first element of clusterBuyParcelCosts array
      if (
        !parsedState.clusterBuyParcelCosts ||
        (parsedState.buyParcelCost.expansionPoints > window.gameState.clusterBuyParcelCosts[0].expansionPoints) ||
        (parsedState.buyParcelCost.alienArtefacts > window.gameState.clusterBuyParcelCosts[0].alienArtefacts)
      ) {
        window.gameState.clusterBuyParcelCosts[0] = parsedState.buyParcelCost;
      }
    }

    // Assign the research data
    if (parsedState.research) {
      window.gameState.research = parsedState.research;
    }

    // Assign section visibility
    if (parsedState.sectionVisibility) {
      window.gameState.sectionVisibility = parsedState.sectionVisibility;
    }

    // Assign section visibility
    if (parsedState.pollution) {
      window.gameState.pollution = parsedState.pollution;
    }

    const researchData = LZString.decompress(localStorage.getItem("researchData"));
    if (researchData) {
      window.researchManager.loadResearchData(researchData);
    }

    // Check for the existence of progression and unlockedBuildings in parsedState
    if (
      parsedState.progression &&
      parsedState.progression.unlockedBuildings &&
      Array.isArray(parsedState.progression.unlockedBuildings)
    ) {
      window.progressionManager.unlockedBuildings = new Set(parsedState.progression.unlockedBuildings);
    } else {
      window.progressionManager.unlockedBuildings = new Set();
    }

    // Assign scheduleList
    if (parsedState.scheduleList) {
      window.gameState.scheduleList = parsedState.scheduleList;
    }

    // Assign scheduleList
    if (parsedState.trainList) {
      window.gameState.trainList = parsedState.trainList;
    }

    if (parsedState.maxTrains) {
      window.gameState.maxTrains = parsedState.maxTrains;
    }

    if (parsedState.maxClusters) {
      window.gameState.maxClusters = parsedState.maxClusters;
    }

    if (parsedState.maxChallenges) {
      window.gameState.maxChallenges = parsedState.maxChallenges;
    }

    if (parsedState.activeChallenges) {
      window.gameState.activeChallenges = parsedState.activeChallenges;
    }

    if (parsedState.currentChallengeCards) {
      window.gameState.currentChallengeCards = parsedState.currentChallengeCards;
    }


    // Add parcels to the UI
    window.gameState.parcels.forEach((parcel, index) => {
      if (index > 0) {
        ui.addParcelToUI(parcel);
      }
    });

    //Update First Parcel
    parcelManipulation.updateParcelTab(0);

    //Load saved Projects
    const savedProjects = LZString.decompress(localStorage.getItem("savedProjects"));

    if (savedProjects) {
      const parsedProjects = JSON.parse(savedProjects);
      projectsModule.setProjects(parsedProjects);
    }

    // Load the battle data if it exists
    if (parsedState.battle) {
      const battleData = parsedState.battle;
      battle = new Battle(
        battleData.factoryUnits,
        battleData.biterUnits,
        startingAmmunition,
        updateUI
      );
      factoryUnits = battle.factoryUnits;
      biterUnits = battle.biterUnits;
      window.battle = battle;
      updateUI(factoryUnits, factorUnitCatalogue, biterUnits, ammunition, []);
    }

    // Add other relevant game state data assignments as needed
    window.researchManager.populateResearchDropdown();
  }
};

  // Autosave
  function saveGameT() {
    if (gameState.autoSave) {
      console.log("initiating Game Saving")
      window.saveGame();
    }
  }

  setInterval(saveGameT, 120 * 1000);

  function toggleAutoSave() {
    gameState.autoSave = !gameState.autoSave;

    // Update the button text to reflect the new state
    const saveTextElement = document.querySelector('#autoSaveToggle .autoSave-text');
    saveTextElement.textContent = `Auto Save (${gameState.autoSave ? 'On' : 'Off'})`;
  }

  function initAutoSaveButton() {
    // Find the save text element
    const saveTextElement = document.querySelector('#autoSaveToggle .autoSave-text');

    // Check if the autoSave property exists in the gameState
    // If it does not exist, initialize it to true
    if (typeof gameState.autoSave === 'undefined') {
      gameState.autoSave = true;
    }

    // Set the initial text based on the current state
    saveTextElement.textContent = `Auto Save (${gameState.autoSave ? 'On' : 'Off'})`;
  }


function getSaveStateString() {
  const saveData = {
    gameState: JSON.parse(LZString.decompress(localStorage.getItem('gameState'))),
    savedProjects: JSON.parse(LZString.decompress(localStorage.getItem('savedProjects'))),
    researchData: LZString.decompress(localStorage.getItem('researchData')),
  };
  return JSON.stringify(saveData);
}

function loadSaveStateFromString(saveStateString) {
  try {
    const saveData = JSON.parse(saveStateString);
    localStorage.setItem('gameState', LZString.compress(JSON.stringify(saveData.gameState)));
    localStorage.setItem('savedProjects', LZString.compress(JSON.stringify(saveData.savedProjects)));
    localStorage.setItem('researchData', LZString.compress(saveData.researchData));

    // Reload the page to apply the changes
    location.reload();
  } catch (error) {
    console.error("Invalid save state string:", error);
    alert("Invalid save state string. Please check the input and try again.");
  }
}

// function loadSaveStateFromStringLegacy(saveStateString) {
//   try {
//     const saveData = JSON.parse(saveStateString);
//     localStorage.setItem('gameState', LZString.compress(JSON.stringify(saveData.gameState)));
//     localStorage.setItem('savedProjects', LZString.compress(JSON.stringify(saveData.savedProjects)));
//     localStorage.setItem('researchData', LZString.compress(saveData.researchData));
//
//     // Reload the page to apply the changes
//     location.reload();
//   } catch (error) {
//     console.error("Invalid save state string:", error);
//     alert("Invalid save state string. Please check the input and try again.");
//   }
// }

document.getElementById("exportButton").addEventListener("click", function () {
  const saveStateString = getSaveStateString();
  document.getElementById("exportTextarea").value = saveStateString;
  document.getElementById("exportContainer").style.display = "block";
  document.getElementById("importContainer").style.display = "none";
  // document.getElementById("importLegacyContainer").style.display = "none";

});

document.getElementById("importButton").addEventListener("click", function () {
  document.getElementById("exportContainer").style.display = "none";
  document.getElementById("importContainer").style.display = "block";
  // document.getElementById("importLegacyContainer").style.display = "none";
});

document.getElementById("loadSaveStateButton").addEventListener("click", function () {
  const saveStateString = document.getElementById("importTextarea").value;
  loadSaveStateFromString(saveStateString);
});

// document.getElementById("importLegacyButton").addEventListener("click", function () {
//   document.getElementById("exportContainer").style.display = "none";
//   document.getElementById("importContainer").style.display = "none";
//   document.getElementById("importLegacyContainer").style.display = "block";
// });
//
// document.getElementById("loadLegacySaveStateButton").addEventListener("click", function () {
//   const saveStateStringLegacy = document.getElementById("importLegacyTextarea").value;
//   loadSaveStateFromStringLegacy(saveStateStringLegacy);
// });

function showResetConfirmation() {
  const resetConfirmation = document.getElementById('resetConfirmation');
  resetConfirmation.style.display = 'flex';
}

function hideResetConfirmation() {
  const resetConfirmation = document.getElementById('resetConfirmation');
  resetConfirmation.style.display = 'none';
}

function resetGameAndHideConfirmation() {
  resetGame();
  hideResetConfirmation();
}

function resetGame() {
  // Clear the saved game state from local storage
  localStorage.removeItem('gameState');

  // Reload the page
  location.reload();
}
