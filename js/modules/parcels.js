function isNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

function createNumberGuard(target) {
  return new Proxy(target, {
    get(obj, prop) {
      const value = obj[prop];
      if (typeof value === 'object' && value !== null) {
        return createNumberGuard(value);
      }
      return value;
    },
    set(obj, prop, value) {
      if (!isNumber(value)) {
        console.warn(`Attempted to set a non-number value (${value}) for property '${prop}'. Ignoring the operation.`);
        return true;
      }
      value = Math.round(value * 10) / 10;
      obj[prop] = value;
      return true;
    },
  });
}

function createBuildingsHandler(target) {
  return new Proxy(target, {
    set(obj, prop, value) {
      obj[prop] = value;
      calculatePollutionBuildingValue();
      updatePollutionValues();
      updatePollutionDisplay();
      return true;
    },
  });
}

class Parcel {
    constructor(id, maxBuildings, cluster = 0, continent = 0, planet = 0) {
        this.id = id;
        this.cluster = cluster,
        this.continent = continent,
        this.planet = planet,
        this.maxBuildings = maxBuildings;
        this.maxResources = 500;
        this.buildings = createBuildingsHandler(createNumberGuard({
        }));
        this.activeBuildings = {};
        this.resources = createNumberGuard({
            stone: 0,
        });
        this.beltUsage = {
          forwards: 0,
          backwards: 0,
        };
        this.previousResources = createNumberGuard({
          coal: 0,
          stone: 0,
          ironOre: 0,
          copperOre: 0,
        });
        this.upgrades = {
          maxBuildingLimit: 1,
        };
        this.productionRateModifier = 0;
        this.consumptionRateModifier = 0;
        this.buildingProductionRateModifiers = {};
        this.buildingConsumptionRateModifiers = {};
        this.inputValues = {};
        this.productionHistory = {};
        const allResourceTypes = Object.keys(resourceMetadata);
        for (const resourceType of allResourceTypes) {
          this.productionHistory[resourceType] = new CircularBuffer(300);
        }
    }

    updatePreviousResources() {
      this.previousResources = { ...this.resources };
    }
    // Clean Up #2
    updatePreviousResourceHistory() {
      if (!this.previousResourceHistory) {
        this.previousResourceHistory = {};
      }
      if (!this.previousResourceChangeSum) {
        this.previousResourceChangeSum = {};
      }

      for (const [resourceKey, resourceValue] of Object.entries(this.resources)) {
        if (!this.previousResourceHistory[resourceKey]) {
          this.previousResourceHistory[resourceKey] = [];
        }
        if (!this.previousResourceChangeSum[resourceKey]) {
          this.previousResourceChangeSum[resourceKey] = 0;
        }

        const history = this.previousResourceHistory[resourceKey];
        const changeSum = this.previousResourceChangeSum;

        if (history.length > 0) {
          const change = resourceValue - history[history.length - 1];
          changeSum[resourceKey] += change;
        }

        history.push(resourceValue);

        // Limit the history array to 120 values and update the change sum
        if (history.length > 120) {
          const removedValue = history.shift();
          const removedChange = removedValue - history[0];
          changeSum[resourceKey] -= removedChange;
        }
      }
    }
    // Clean Up #1
    calculateAverageRateOfChange() {
      const averageRateOfChange = {};

      for (const [resourceKey, resourceHistory] of Object.entries(this.previousResourceHistory)) {
        averageRateOfChange[resourceKey] = this.previousResourceChangeSum[resourceKey] / (resourceHistory.length - 1);
      }

      return averageRateOfChange;
    }


    addBuilding(buildingType) {
        const totalBuildings = Object.values(this.buildings).reduce((a, b) => a + b, 0);
        if (totalBuildings < this.maxBuildings) {
            if (!this.buildings[buildingType]) {
                this.buildings[buildingType] = 0;
            }
            this.buildings[buildingType]++;
            console.log(this.activeBuildings[buildingType]);
            if (!this.activeBuildings[buildingType]) {
              this.activeBuildings[buildingType] = 0;
            }
            this.activeBuildings[buildingType]++;
            return true;
        }
        return false;
    }

    calculateBeltUsage(column) {
      if (column === "forwards" || column === "backwards") {
        return this.beltUsage[column];
      } else {
        throw new Error(`Invalid belt usage column: ${column}`);
      }
    }

    setBeltUsage(column, value) {
      if (column === "forwards" || column === "backwards") {
        this.beltUsage[column] = value;
      } else {
        throw new Error(`Invalid belt usage column: ${column}`);
      }
    }

}

const parcels = {
    parcelList: [],
    maxBuildingsPerParcel: 10,
    upgradeCosts: {
      maxBuildingLimit: [
        {
          level: 1,
          cost: {
            stone: 50,
          },
          maxBuildingLimit: 10, // Add the max building limit value for this level
        },
        {
          level: 2,
          cost: {
            expansionPoints: 1,
          },
          maxBuildingLimit: 20, // Add the max building limit value for this level
        },
        {
          level: 3,
          cost: {
            expansionPoints: 2,
          },
          maxBuildingLimit: 30, // Add the max building limit value for this level
        },
        {
          level: 4,
          cost: {
            redScience: 1,
            expansionPoints: 4,
          },
          maxBuildingLimit: 40, // Add the max building limit value for this level
        },
        {
          level: 5,
          cost: {
            greenScience: 1,
            expansionPoints: 6,
          },
          maxBuildingLimit: 50, // Add the max building limit value for this level
        },
        {
          level: 6,
          cost: {
            darkScience: 1,
            expansionPoints: 8,
          },
          maxBuildingLimit: 60, // Add the max building limit value for this level
        },
        {
          level: 7,
          cost: {
            blueScience: 1,
            expansionPoints: 16,
          },
          maxBuildingLimit: 70, // Add the max building limit value for this level
        },
        {
          level: 8,
          cost: {
            purpleScience: 1,
            expansionPoints: 32,
          },
          maxBuildingLimit: 80, // Add the max building limit value for this level
        },
        {
          level: 9,
          cost: {
            yellowScience: 1,
            expansionPoints: 64,
          },
          maxBuildingLimit: 90, // Add the max building limit value for this level
        },
        {
          level: 10,
          cost: {
            whiteScience: 1,
            expansionPoints: 128,
          },
          maxBuildingLimit: 100, // Add the max building limit value for this level
        },
        {
          level: 11,
          cost: {
            steel: 3200,
            expansionPoints: 256,
          },
          maxBuildingLimit: 110, // Add the max building limit value for this level
        },
        {
          level: 12,
          cost: {
            steel: 6400,
            expansionPoints: 512,
          },
          maxBuildingLimit: 120, // Add the max building limit value for this level
        },
        {
          level: 13,
          cost: {
            steel: 12800,
            expansionPoints: 1024,
          },
          maxBuildingLimit: 130, // Add the max building limit value for this level
        },
      ],
    },
    globalProductionRateModifiers: {
      energyModifier: 0,
      // Add more sources of modifiers here
    },
    globalConsumptionRateModifiers: {
      energyModifier: 0,
      // Add more sources of modifiers here
    },
    getGlobalProductionRateModifier: function () {
      return Object.values(this.globalProductionRateModifiers).reduce((a, b) => a + b, 0);
    },
    getGlobalConsumptionRateModifier: function () {
      return Object.values(this.globalConsumptionRateModifiers).reduce((a, b) => a + b, 0);
    },



    createNewParcel(cluster = 0) {
      const parcel = new Parcel(`parcel-${this.parcelList.length + 1}`, this.maxBuildingsPerParcel);
      parcel.cluster = cluster;
      this.parcelList.push(parcel);
      return parcel;
    },

    canBuyParcel(resources, selectedCluster) {
      return Object.entries(gameState.clusterBuyParcelCosts[selectedCluster]).every(([resource, cost]) => {
        return resources[resource] >= cost;
      });
    },

    addBuildingToParcel(parcelIndex, buildingType) {
        return this.parcelList[parcelIndex].addBuilding(buildingType);
    },

    getParcelCount() {
        return this.parcelList.length;
    },

    getParcel(parcelIndex) {
        return this.parcelList[parcelIndex];
    },

    getUpgradeInfo(parcel, upgradeType) {
        const currentLevel = parcel.upgrades[upgradeType];
        const upgradeInfo = this.upgradeCosts[upgradeType].find(
            (upgrade) => upgrade.level === currentLevel + 1
        );
        return upgradeInfo;
    },

    getUpgradeCost(parcel, upgradeType) {
      if (!parcel.upgrades[upgradeType]) {
        console.log(`Upgrade type '${upgradeType}' not found`);
        return null;
      }

      const currentLevel = parcel.upgrades[upgradeType];
      const nextLevelUpgrade = this.upgradeCosts[upgradeType].find(
        (upgrade) => upgrade.level === currentLevel + 1
      );

      return nextLevelUpgrade ? nextLevelUpgrade.cost : null;
    },

    upgradeParcel(parcel, upgradeType) {
      const upgradeCost = this.getUpgradeCost(parcel, upgradeType);

      if (!upgradeCost) {
        console.log("Max level reached");
        return false;
      }

      const canAfford = Object.keys(upgradeCost).every((resource) => {
        const totalResource = (parcel.resources[resource] || 0) + buildingManager.getResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resource);
        return totalResource >= upgradeCost[resource];
      });

      if (!canAfford) {
        console.log("Not enough resources");
        return false;
      }

      Object.keys(upgradeCost).forEach((resource) => {
        if (parcel.resources[resource] >= upgradeCost[resource]) {
          parcel.resources[resource] -= upgradeCost[resource];
        } else {
          const parcelResource = parcel.resources[resource] || 0;
          const remainingResource = upgradeCost[resource] - parcelResource;
          parcel.resources[resource] = 0;
          buildingManager.deductResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resource, remainingResource);
        }
      });

      // Find the upgrade info for the current level
      const upgradeInfo = this.upgradeCosts[upgradeType].find(
        (upgrade) => upgrade.level === parcel.upgrades[upgradeType] + 1
      );

      // Update the max building limit for the parcel
      if (upgradeInfo && upgradeInfo.maxBuildingLimit) {
        parcel.maxBuildings = upgradeInfo.maxBuildingLimit;
        parcel.maxResources = this.calcParcelMaxResources(upgradeInfo.maxBuildingLimit);
        ui.updateBuildingDisplay(parcel);
      }

      parcel.upgrades[upgradeType]++;
      console.log(`Upgraded ${upgradeType} to level ${parcel.upgrades[upgradeType]}`);
      return true;
    },

    getMissingUpgradeResources(parcel, upgradeType) {
      const upgradeCost = this.getUpgradeCost(parcel, upgradeType);
      const missingResources = [];

      for (const resource in upgradeCost) {
        const totalResource = (parcel.resources[resource] || 0) + buildingManager.getResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resource);
        if (totalResource < upgradeCost[resource]) {
          missingResources.push({ resourceName: resource, amount: upgradeCost[resource] - totalResource });
        }
      }

      return missingResources;
    },

    calcParcelMaxResources(maxBuildings) {
      return maxBuildings / 8 * 250 + 250;
    }

};

window.parcels = parcels;
