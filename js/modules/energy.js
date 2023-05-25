window.energyManager = {
  calculateGlobalEnergyUsage: function() {
    let totalEnergyUsage = 0;

    for (const parcel of window.parcels.parcelList) {
      for (const buildingId in parcel.buildings) {
        const buildingCount = parcel.buildings[buildingId];
        const building = window.buildingManager.getBuilding(buildingId);

        if (building.energyInput) {
          totalEnergyUsage += building.energyInput * buildingCount;
        }
      }
    }
    gameState.pollution.pollutionEnergyValue = totalEnergyUsage;
    return totalEnergyUsage;
  },

  calculateGlobalEnergyProduction: function() {
    let totalEnergyProduction = 0;

    for (const parcel of window.parcels.parcelList) {
      for (const buildingId in parcel.buildings) {
        const buildingCount = parcel.buildings[buildingId];
        const building = window.buildingManager.getBuilding(buildingId);

        if (building.energyOutput) {
          let productionRatio = 1;

          if (building.inputs) {
            let minProductionRatio = Infinity;

            for (const [key, value] of Object.entries(building.inputs)) {
              if (parcel.resources[key] === undefined) {
                parcel.resources[key] = 0;
              }
              if (!parcel.resources[key] || parcel.resources[key] < value * buildingCount) {
                const availableRatio = parcel.resources[key] / (value * buildingCount);
                minProductionRatio = Math.min(minProductionRatio, availableRatio);
              }
            }

            productionRatio = minProductionRatio === Infinity ? 1 : minProductionRatio;
          }

          const energyProduced = building.energyOutput * buildingCount * productionRatio;
          totalEnergyProduction += energyProduced;

          // Consume the input resources for energy production
          if (building.inputs) {
            for (const [key, value] of Object.entries(building.inputs)) {
              parcel.resources[key] -= value * buildingCount * productionRatio;
            }
          }
        }
      }
    }

    return totalEnergyProduction;
  },
};
