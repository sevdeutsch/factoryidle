class Research {
  constructor(id, name, cost) {
    this.id = id;
    this.name = name;
    this.cost = cost;
  }
}

class ResearchManager {
  constructor() {
    this.researchList = [];
    this.completedResearch = new Set(); // Store completed researches here
  }

  addResearch(research) {
    if (!this.researchExists(research.id)) {
      this.researchList.push(research);
    }
  }

  getResearch(id) {
    return this.researchList.find(research => research.id === id);
  }

  populateResearchDropdown() {
    const researchSelect = document.getElementById("researchSelect");

    // Clear the existing options from the dropdown
    while (researchSelect.firstChild) {
      researchSelect.removeChild(researchSelect.firstChild);
    }

    const researchList = window.researchManager.researchList;
    researchList.forEach(research => {
      if (!window.researchManager.isResearchCompleted(research.id)) {
        const optionElement = document.createElement("option");
        optionElement.value = research.id;
        optionElement.textContent = `${research.name} - ${ui.formatResourceCost(research.cost)}`;
        researchSelect.appendChild(optionElement);
      }
    });
  }

  isResearchCompleted(researchId) {
    return this.completedResearch.has(researchId);
  }

  completeResearch(researchId) {
    this.completedResearch.add(researchId);

    // Check if the completed research is "clusterTech"
    if (researchId === "clusterTech") {
      // Remove all parcel tabs from the UI
      const clusterContainers = document.querySelectorAll(".cluster-container");
      clusterContainers.forEach(clusterContainer => {
        clusterContainer.remove();
      });

      // Re-add all parcels with updated cluster headers
      window.parcels.parcelList.forEach(parcel => {
        ui.addParcelToUI(parcel);
      });
    }
  }

  saveResearchData() {
    const completedResearchData = Array.from(this.completedResearch);
    return JSON.stringify(completedResearchData);
  }

  loadResearchData(savedData) {
    const completedResearchData = JSON.parse(savedData);
    this.completedResearch = new Set(completedResearchData);
    this.populateResearchDropdown();
  }

  researchExists(researchKey) {
    return this.researchList.some(research => research.id === researchKey);
  }
}



// Initialize the research manager
window.researchManager = new ResearchManager();

// Add research options here

window.researchManager.addResearch(new Research('expansionTech', 'Expansion Tech', { redScience: 4}));
window.researchManager.addResearch(new Research('remoteConstruction', 'Remote Construction', { redScience: 16}));
window.researchManager.addResearch(new Research('steelMaking', 'Steel Making', { redScience: 16, greenScience: 16}));
window.researchManager.addResearch(new Research('clusterTech', 'Cluster Expansion', { redScience: 24, greenScience: 24}));
window.researchManager.addResearch(new Research('militaryTech', 'Military Tech', { redScience: 16, greenScience: 16, steel: 100}));
window.researchManager.addResearch(new Research('trains', 'Trains', { redScience: 20, greenScience: 20, darkScience: 20}));
window.researchManager.addResearch(new Research('oilProcessing', 'Oil Processing', { redScience: 30, darkScience: 30 }));
window.researchManager.addResearch(new Research('batteryTech', 'Battery Tech', { redScience: 16, greenScience: 16, petroleumBarrel: 100}));
window.researchManager.addResearch(new Research('solarTech', 'Solar Tech', { redScience: 16, greenScience: 16, battery: 100}));
window.researchManager.addResearch(new Research('blueprintTech', 'Blueprint Tech', { redScience: 40, greenScience: 40, darkScience: 40 }));
window.researchManager.addResearch(new Research('advancedElectronics', 'Advanced Electronics I', { redScience: 36, greenScience: 36, darkScience: 36 }));
window.researchManager.addResearch(new Research('advancedMaterialProcessing', 'Advanced Material Processing', { redScience: 50, greenScience: 50, darkScience: 50 }));
window.researchManager.addResearch(new Research('basicEngineUnits', 'Basic Engine Tech', { redScience: 30, greenScience: 30, darkScience: 30 }));
window.researchManager.addResearch(new Research('trainsMax1', 'Upgrade Train Limit to 2', { redScience: 60, greenScience: 60, darkScience: 60}));
window.researchManager.addResearch(new Research('challengeTech', 'Production Challenges', { redScience: 60, greenScience: 60, darkScience: 60}));
window.researchManager.addResearch(new Research('beaconTech', 'Beacon Tech', { redScience: 100, greenScience: 100, darkScience: 100, blueScience: 100}));
window.researchManager.addResearch(new Research('clustersMax1', 'Upgrade Cluster Limit to 3', { redScience: 60, greenScience: 60, darkScience: 60, blueScience: 60}));
window.researchManager.addResearch(new Research('challengeMax1', 'Upgrade Challenge Limit to 2', { redScience: 100, greenScience: 100, darkScience: 100, blueScience: 100}));
window.researchManager.addResearch(new Research('militaryTech2', 'Armor Penetrating Ammunition', { redScience: 150, greenScience: 150, darkScience: 150, blueScience: 150}));
window.researchManager.addResearch(new Research('advancedElectronics2', 'Advanced Electronics II', { redScience: 150, greenScience: 150, darkScience: 150, blueScience: 150, purpleScience: 150}));
window.researchManager.addResearch(new Research('advancedEngineUnits', 'Advanced Engine Units', { redScience: 150, greenScience: 150, darkScience: 150, blueScience: 150, purpleScience: 150}));
window.researchManager.addResearch(new Research('beaconTech2', 'Beacon Tech 2', { redScience: 300, greenScience: 300, darkScience: 300, blueScience: 300, purpleScience: 300}));
window.researchManager.addResearch(new Research('rocketTech', 'Rocket Tech', { redScience: 150, greenScience: 150, darkScience: 150, blueScience: 150, purpleScience: 150, yellowScience: 150}));
window.researchManager.addResearch(new Research('militaryTech3', 'Piercing Ammunition', { redScience: 600, greenScience: 600, darkScience: 600, blueScience: 600, purpleScience: 600, yellowScience: 600, whiteScience: 60}));
window.researchManager.addResearch(new Research('beaconTech3', 'Beacon Tech 3', { redScience: 900, greenScience: 900, darkScience: 900, blueScience: 900, purpleScience: 900, yellowScience: 900, whiteScience: 90}));
window.researchManager.addResearch(new Research('gameWon', 'Win', { redScience: 4000, greenScience: 4000, darkScience: 4000, blueScience: 4000, purpleScience: 4000, yellowScience: 4000, whiteScience: 400 }));
window.researchManager.addResearch(new Research('gameWon2', 'Win Harder', { redScience: 40000, greenScience: 40000, darkScience: 40000, blueScience: 40000, purpleScience: 40000, yellowScience: 40000, whiteScience: 40000 }));
window.researchManager.addResearch(new Research('gameWon3', 'Win too Hard', { redScience: 400000, greenScience: 400000, darkScience: 400000, blueScience: 400000, purpleScience: 400000, yellowScience: 400000, whiteScience: 400000 }));

// old
// window.researchManager.addResearch(new Research('expansionTech', 'Expansion Tech', { researchPoints: 4 }));
// window.researchManager.addResearch(new Research('remoteConstruction', 'Remote Construction', { researchPoints: 12 }));
// window.researchManager.addResearch(new Research('militaryTech', 'Military Tech', { researchPoints: 16 })); // needed in dark science
// window.researchManager.addResearch(new Research('steelMaking', 'Steel Making', { researchPoints: 24 }));
// window.researchManager.addResearch(new Research('oilProcessing', 'Oil Processing', { researchPoints: 30 })); //needed in blue
//
//
// window.researchManager.addResearch(new Research('solarTech', 'Solar Tech', { researchPoints: 16 }));
// window.researchManager.addResearch(new Research('batteryTech', 'Battery Tech', { researchPoints: 16 })); // needed in yellow
//
//
//
// window.researchManager.addResearch(new Research('advancedElectronics', 'Advanced Electronics I', { researchPoints: 36 })); // needed in blue
// window.researchManager.addResearch(new Research('advancedMaterialProcessing', 'Advanced Material Processing', { researchPoints: 50 })); //needed in Purple // needed blue
//
// window.researchManager.addResearch(new Research('basicEngineUnits', 'Basic Engine Tech', { researchPoints: 30 })); //needed in blue
//
// window.researchManager.addResearch(new Research('blueprintTech', 'Blueprint Tech', { researchPoints: 40 }));
// window.researchManager.addResearch(new Research('clusterTech', 'Cluster Expansion', { researchPoints: 45 }));
// window.researchManager.addResearch(new Research('trains', 'Trains', { researchPoints: 50 })); // needed in purple
//
//
//
//
//
// window.researchManager.addResearch(new Research('trainsMax1', 'Upgrade Train Limit 2', { researchPoints: 60 }));
// window.researchManager.addResearch(new Research('clustersMax1', 'Upgrade Cluster Limit 3', { researchPoints: 60 }));
// window.researchManager.addResearch(new Research('beaconTech', 'Beacon Tech', { researchPoints: 100 }));
// window.researchManager.addResearch(new Research('militaryTech2', 'Armor Penetrating Ammunition', { researchPoints: 150 }));
// window.researchManager.addResearch(new Research('advancedElectronics2', 'Advanced Electronics II', { researchPoints: 150 })); // needed in yellow
//
// window.researchManager.addResearch(new Research('advancedEngineUnits', 'Advanced Engine Units', { researchPoints: 150 })); // needed in yellow
//
//
// window.researchManager.addResearch(new Research('beaconTech2', 'Beacon Tech 2', { researchPoints: 300 }));
// window.researchManager.addResearch(new Research('militaryTech3', 'Piercing Ammunition', { researchPoints: 600 }));
// window.researchManager.addResearch(new Research('beaconTech3', 'Beacon Tech 3', { researchPoints: 900 }));
// window.researchManager.addResearch(new Research('rocketTech', 'Rocket Tech', { researchPoints: 150 })); // needed in white
//
//
// window.researchManager.addResearch(new Research('gameWon', 'Win the Demo', { researchPoints: 4000 }));
// window.researchManager.addResearch(new Research('gameWon2', 'Win Harder', { researchPoints: 40000 }));
// window.researchManager.addResearch(new Research('gameWon3', 'Win too Hard', { researchPoints: 400000 }));
// //window.researchManager.addResearch(new Research('militaryTech', 'Military (Not Implemented Yet)', { researchPoints: 200000 }));
// // Add more research options as needed

window.researchManager = researchManager;
