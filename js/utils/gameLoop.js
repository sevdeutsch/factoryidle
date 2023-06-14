class CircularBuffer {
  constructor(capacity) {
    this.buffer = new Array(capacity);
    this.capacity = capacity;
    this.start = 0;
    this.end = 0;
    this.size = 0;
    this.sum = 0;
  }

  insert(value) {
    if (this.size === this.capacity) {
      this.sum -= this.buffer[this.start];
      this.start = (this.start + 1) % this.capacity;
    } else {
      this.size++;
    }

    this.buffer[this.end] = value;
    this.sum += value;
    this.end = (this.end + 1) % this.capacity;
  }

  getAverage(lastNValues) {
    if (lastNValues >= this.size) {
      return this.sum / this.size;
    }

    let sum = 0;
    let index = (this.end - 1 + this.capacity) % this.capacity;
    for (let i = 0; i < lastNValues; i++) {
      sum += this.buffer[index];
      index = (index - 1 + this.capacity) % this.capacity;
    }

    return sum / lastNValues;
  }

  // Add the getSize method
  getSize() {
    return this.size;
  }
}

let currentTable;

const gameLoop = (() => {
    let gameInterval;
    const tickRate = 1000;
    let tickCounter = 0;

    function start() {
        window.loadGame();
        projects.renderProjects();
        ui.updateBuildingDisplay(window.parcels.getParcel(window.ui.getSelectedParcelIndex()));
        updateClusterParcels();
        updateScheduleListUI();
        updateTrainListUI();
        updateChallengeView();
        updateChallengeCards();
        ui.updateBuyParcelDropdown();
        addParcelNavigationKeyListener();
        initAutoSaveButton();
        ui.addExplainerTooltip('pollution-section', `
        <div>
            <ul>
                <li>
                    <strong>Pollution:</strong> Every energy consuming building generates pollution. The pollution generated is equal to the energy it consumes. Energy Producing Buildings: Coal Power Plants generate 48 pollution, while Solar plants do not generate any pollution.
                </li>
                <li>
                    <strong>Biter Anger:</strong> Defeating Biters in the game will increase their anger. The more Biters you defeat, the angrier they get. Slowly cools off over time.
                </li>
                <li>
                    <strong>Evolution Factor:</strong> This is a value that determines how many enemies you will face. It increases with increased pollution and Biter Anger. The higher your pollution and Biter Anger values, the more enemies you will have to face.
                </li>
            </ul>
        </div>
        `);
        // initializeAnalytics();
        gameInterval = setInterval(() => {
            updateResources();
            updateBeltLogistics();
            ui.updateParcelsSectionVisibility();
            const selectedParcel = window.parcels.getParcel(window.ui.getSelectedParcelIndex());
            currentTable = window.ui.updateResourceDisplay(selectedParcel);
            updateAllParcels();
            updateAmmunitionDisplay(battleOngoing);
            displayArmyCost(factoryUnits);
            updateStartBattleButtonState();
            updatePollutionValues();
            updatePollutionDisplay();
            reduceBiterFactor();
            ui.updateEnergyDisplay();
            moveAllTrains();
            updateTrainListUI();
            window.progressionManager.update(gameState);
            tickCounter++;

        }, tickRate);
    }

    function updateAllParcels() {
      // Iterate through all parcels
      for (const parcel of window.parcels.parcelList) {
        // Update parcel modifiers
        parcel.productionRateModifier = 0;
        parcel.consumptionRateModifier = 0;

        if (parcel.buildings.speedBeaconT1) {
          parcel.productionRateModifier += parcel.buildings.speedBeaconT1 * 0.02;
          parcel.consumptionRateModifier += parcel.buildings.speedBeaconT1 * 0.025;
        }

        if (parcel.buildings.productivityBeaconT1) {
          parcel.productionRateModifier += parcel.buildings.productivityBeaconT1 * 0.01;
          parcel.consumptionRateModifier += parcel.buildings.productivityBeaconT1 * 0.005;
        }

        if (parcel.buildings.speedBeaconT2) {
          parcel.productionRateModifier += parcel.buildings.speedBeaconT2 * 0.04;
          parcel.consumptionRateModifier += parcel.buildings.speedBeaconT2 * 0.05;
        }

        if (parcel.buildings.productivityBeaconT2) {
          parcel.productionRateModifier += parcel.buildings.productivityBeaconT2 * 0.02;
          parcel.consumptionRateModifier += parcel.buildings.productivityBeaconT2 * 0.01;
        }

        if (parcel.buildings.speedBeaconT3) {
          parcel.productionRateModifier += parcel.buildings.speedBeaconT3 * 0.08;
          parcel.consumptionRateModifier += parcel.buildings.speedBeaconT3 * 0.010;
        }

        if (parcel.buildings.productivityBeaconT3) {
          parcel.productionRateModifier += parcel.buildings.productivityBeaconT3 * 0.06;
          parcel.consumptionRateModifier += parcel.buildings.productivityBeaconT3 * 0.03;
        }

        // Call updatePreviousResources method for each parcel
        parcel.updatePreviousResources();
        parcel.updatePreviousResourceHistory();
      }
    }

    function updateResources() {
      // Helper function to calculate bottlenecks
      function calculateBottlenecks(parcel, building, buildingCount, totalConsumptionRateModifier) {
        const bottlenecks = {};
        for (const [key, value] of Object.entries(building.inputs)) {
          const requiredResourcesForFullProduction = value * buildingCount * (totalConsumptionRateModifier);
          const availableResources = parcel.resources[key];
          const missingResources = requiredResourcesForFullProduction - availableResources;

          if (missingResources > 0) {
            bottlenecks[key] = missingResources;
          }
        }
        return bottlenecks;
      }

      // Iterate through all the parcels
      for (const parcel of window.parcels.parcelList) {
        // Iterate through each building type in the current parcel
        for (const buildingId in parcel.activeBuildings) {
          const buildingCount = parcel.activeBuildings[buildingId];

          // Check if there's at least one building of the current type
          if (buildingCount && buildingCount > 0) {
            const building = window.buildingManager.getBuilding(buildingId);

            const totalProductionRateModifier = calculateProductionRateModifier(parcel, building, buildingCount);
            const totalConsumptionRateModifier = calculateConsumptionRateModifier(parcel, building, buildingCount);

            // Check if the building has any input resources required for production
            if (building.inputs && !(building.energyOutput > 0)) {
              let maxProducingBuildings = buildingCount;

              // Check if the parcel has enough resources to meet the input requirements
              for (const [key,value] of Object.entries(building.inputs)) {
                if (parcel.resources[key]) {
                  const availableBuildings = Math.floor(parcel.resources[key] / (value * (totalConsumptionRateModifier)));
                  maxProducingBuildings = Math.min(maxProducingBuildings, availableBuildings);
                } else {
                  maxProducingBuildings = 0;
                  break;
                }
              }

              // Calculate utilization as a percentage
              const utilization = (maxProducingBuildings / buildingCount) * 100;

              // Calculate bottlenecks
              const bottlenecks = calculateBottlenecks(parcel, building, buildingCount, totalConsumptionRateModifier);

              // Store the utilization and bottleneck information in the parcel
              if (!parcel.utilization) {
                parcel.utilization = {};
              }
              parcel.utilization[buildingId] = {
                percentage: utilization,
                bottlenecks: bottlenecks
              };
              let actualProductionFactor;
              // If there are buildings that can produce, consume the input resources and produce output resources
              if (maxProducingBuildings > 0) {
                for (const [key, value] of Object.entries(building.outputs)) {
                  if (!parcel.resources[key]) {
                    parcel.resources[key] = 0;
                  }
                  const potentialUpdatedValue = parcel.resources[key] + value * maxProducingBuildings * building.rate * (totalProductionRateModifier);
                  const maxResourceValue = parcel.maxResources * (1 / getResourceDensity(key));
                  const finalUpdatedValue = Math.min(potentialUpdatedValue, maxResourceValue);
                  actualProductionFactor = (finalUpdatedValue - parcel.resources[key]) / (value * maxProducingBuildings * building.rate * (totalProductionRateModifier));

                  parcel.resources[key] = Math.round(finalUpdatedValue * 10) / 10;

                  for (const [inputKey, inputValue] of Object.entries(building.inputs)) {
                    const updatedValue = parcel.resources[inputKey] - inputValue * maxProducingBuildings * building.rate * (totalConsumptionRateModifier) * actualProductionFactor;
                    parcel.resources[inputKey] = Math.round(updatedValue * 10) / 10;
                  }
                }
              }

              // Insert the new production rate into the circular buffer for each output resource
              for (const [key, value] of Object.entries(building.outputs)) {
                const productionRate = maxProducingBuildings > 0 ? value * maxProducingBuildings * building.rate * (totalProductionRateModifier) * actualProductionFactor : 0;
                parcel.productionHistory[key].insert(productionRate);
              }

            } else {
              for (const [key, value] of Object.entries(building.outputs)) {
                if (!parcel.resources[key]) {
                  parcel.resources[key] = 0;
                }
                const updatedValue = parcel.resources[key] + value * buildingCount * building.rate * (totalProductionRateModifier);
                parcel.resources[key] = Math.round(updatedValue * 10) / 10;

                // Insert the new production rate into the circular buffer
                parcel.productionHistory[key].insert(value * buildingCount * building.rate * (totalProductionRateModifier));
              }
            }
          }
        }
      }
      // Update the resource display for the currently selected parcel
      const selectedParcel = parcels.getParcel(ui.getSelectedParcelIndex());
      ui.updateResourceDisplay(selectedParcel);
    }

    const SAME_TYPE_BONUS = 0.5; // 50% bonus

    function calculateProductionRateModifier(parcel, building, buildingCount) {
        const energyBasedModifier = parcel.buildingProductionRateModifiers[building.id] && parcel.buildingProductionRateModifiers[building.id].energyModifier || 0;
        const buildingProductionRateModifier = (parcel.buildingProductionRateModifiers[building.id] && parcel.buildingProductionRateModifiers[building.id].energyModifier) || 0;
        const remoteConstructionFacilityModifier = (parcel.buildings.remoteConstructionFacility && parcel.buildings.remoteConstructionFacility > 0) ? 0.3 : 0;

        let sameTypeBonus = 0;
        if (building.category === "Basics" && allSameTypeAndBasics(parcel.buildings)) {
            sameTypeBonus = SAME_TYPE_BONUS;
        }

        const calc = (1 + energyBasedModifier + sameTypeBonus) * (1 + parcels.getGlobalProductionRateModifier() + building.productionRateModifier + parcel.productionRateModifier + buildingProductionRateModifier - remoteConstructionFacilityModifier) || 0;
        return calc;
    }

    function calculateConsumptionRateModifier(parcel, building, buildingCount) {
        const energyBasedModifier = parcel.buildingProductionRateModifiers[building.id] && parcel.buildingConsumptionRateModifiers[building.id].energyModifier || 0;
        const buildingConsumptionRateModifier = (parcel.buildingConsumptionRateModifiers[building.id] && parcel.buildingConsumptionRateModifiers[building.id].energyModifier) || 0;
        const remoteConstructionFacilityModifier = (parcel.buildings.remoteConstructionFacility && parcel.buildings.remoteConstructionFacility > 0) ? 0.3 : 0;
        return (1 + energyBasedModifier) * (1 + parcels.getGlobalConsumptionRateModifier() + building.consumptionRateModifier + parcel.consumptionRateModifier + buildingConsumptionRateModifier + remoteConstructionFacilityModifier) || 0;
    }

    let clusterParcels = {};

    function updateClusterParcels() {
      const parcelList = parcels.parcelList;
      clusterParcels = {};

      for (let i = 0; i < parcelList.length; i++) {
        const currentParcel = parcelList[i];
        const currentCluster = currentParcel.cluster || 0;

        if (!clusterParcels[currentCluster]) {
          clusterParcels[currentCluster] = [];
        }

        clusterParcels[currentCluster].push(currentParcel);
      }
      console.log(clusterParcels);
    }

    function updateBeltLogistics() {
      for (const cluster in clusterParcels) {
        const parcelList = clusterParcels[cluster];

        for (let i = 0; i < parcelList.length; i++) {
          const currentParcel = parcelList[i];

          const nextParcelIndex = (i + 1) % parcelList.length;
          const previousParcelIndex = (i - 1 + parcelList.length) % parcelList.length;

          const nextParcel = parcelList[nextParcelIndex];
          const previousParcel = parcelList[previousParcelIndex];

          for (const resourceName in currentParcel.resources) {
            if (currentParcel.inputValues && currentParcel.inputValues[resourceName]) {
              const forwardValue = currentParcel.inputValues[resourceName].forwardBelt || 0;
              const backwardValue = currentParcel.inputValues[resourceName].backwardBelt || 0;

              // Transfer resources using forward belts
              if (forwardValue > 0) {
                const availableResources = currentParcel.resources[resourceName];
                const transferAmount = Math.min(availableResources, forwardValue);

                const nextParcelMaxResourceValue = nextParcel.maxResources * (1 / getResourceDensity(resourceName));
                const nextParcelAvailableSpace = nextParcelMaxResourceValue - (nextParcel.resources[resourceName] || 0);
                const finalTransferAmount = Math.min(transferAmount, nextParcelAvailableSpace);

                currentParcel.resources[resourceName] -= finalTransferAmount;
                nextParcel.resources[resourceName] = (nextParcel.resources[resourceName] || 0) + finalTransferAmount;
              }

              // Transfer resources using backward belts
              if (backwardValue > 0) {
                const availableResources = currentParcel.resources[resourceName];
                const transferAmount = Math.min(availableResources, backwardValue);

                const previousParcelMaxResourceValue = previousParcel.maxResources * (1 / getResourceDensity(resourceName));
                const previousParcelAvailableSpace = previousParcelMaxResourceValue - (previousParcel.resources[resourceName] || 0);
                const finalTransferAmount = Math.min(transferAmount, previousParcelAvailableSpace);

                currentParcel.resources[resourceName] -= finalTransferAmount;
                previousParcel.resources[resourceName] = (previousParcel.resources[resourceName] || 0) + finalTransferAmount;
              }
            }
          }
        }
      }
    }

    function stop() {
        clearInterval(gameInterval);
    }

    // function initializeAnalytics() {
    //   // Cookie Consent
    //   var cookieBotScript = document.createElement('script');
    //   cookieBotScript.src = 'https://consent.cookiebot.com/uc.js';
    //   cookieBotScript.setAttribute('data-cbid', 'cc57599e-a483-42fd-9b14-380f6c566317');
    //   cookieBotScript.setAttribute('data-blockingmode', 'auto');
    //   cookieBotScript.type = 'text/javascript';
    //   document.head.appendChild(cookieBotScript);
    //
    //   // Google Analytics
    //   var gaScript = document.createElement('script');
    //   gaScript.async = true;
    //   gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-7EH8S2NR6P';
    //   document.head.appendChild(gaScript);
    //
    //   window.dataLayer = window.dataLayer || [];
    //   function gtag(){dataLayer.push(arguments);}
    //   gtag('consent', 'default', {ad_storage:'denied', analytics_storage:'denied'});
    //   gtag('set', 'ads_data_redaction', true);
    //   gtag('set', 'url_passthrough', true);
    //   gtag('js', new Date());
    //   gtag('config', 'G-7EH8S2NR6P', {'anonymize_ip': true});
    // }

    return {
        start,
        stop,
        calculateProductionRateModifier,
        calculateConsumptionRateModifier,
        clusterParcels,
        updateClusterParcels,
    };
})();

window.gameLoop = gameLoop;
