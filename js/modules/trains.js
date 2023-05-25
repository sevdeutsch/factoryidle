// trains.js
const interClusterDistance = 10;
const LOADING_TIME = 5000; // Value to default to
const TICK_INTERVAL = 1000;

const trainCost = {
  ironPlates: 100,
  copperPlates: 50,
};

const addStationButtonListeners = new WeakMap();
const saveScheduleButtonListeners = new WeakMap();
const deleteScheduleButtonListeners = new WeakMap();
const closeScheduleOverlayButtonListeners = new WeakMap();
const saveEditStationButtonListeners = new Map();
const cancelEditStationButtonListeners = new Map();
let sliderEventListeners = new Map();



document.addEventListener("DOMContentLoaded", function () {
  initTrainUi();
});

function initTrainUi () {
  const scheduleOverlay = document.getElementById("schedule-overlay");
  const addScheduleButton = document.getElementById("add-schedule");

  // Add an event listener for the "Buy Train" button
  const buyTrainButton = document.getElementById("buy-train-button");
  buyTrainButton.addEventListener("click", buyTrain);

  // Click event listener to close the train menu when clicking outside of it
  document.addEventListener("click", (event) => {
    const trainMenu = document.getElementById("trainMenu");
    const trainMenuButton = document.querySelector(`[id^="edit-train-"]`);

    // Check if both trainMenu and trainMenuButton are defined
    if (trainMenu && trainMenuButton) {
      if (
        !trainMenu.contains(event.target) &&
        !trainMenuButton.contains(event.target)
      ) {
        trainMenu.classList.add("hidden");
      }
    }
  });

  // Sell Train Listener
  const sellTrainButton = document.getElementById("sellTrainDropdownItem");
  sellTrainButton.addEventListener("click", () => {
    const trainMenu = document.getElementById("trainMenu");
    const trainId = parseInt(trainMenu.getAttribute("data-train-id"));

    if (trainId) {
      sellTrain(trainId);
      trainMenu.classList.add("hidden");
      updateTrainListUI();
    }
  });

  // Show Assign Schedule Overlay
  const assignScheduleDropdownItem = document.getElementById("assignScheduleDropdownItem");
  assignScheduleDropdownItem.addEventListener("click", () => {
    const trainMenu = document.getElementById("trainMenu");
    const trainId = trainMenu.getAttribute("data-train-id");
    trainMenu.classList.add("hidden");
    showAssignScheduleOverlay(trainId);
  });

  //Show Rename Overlay
  const renameDropdownItem = document.getElementById("renameTrainDropdownItem");
  renameDropdownItem.addEventListener("click", () => {
    const trainMenu = document.getElementById("trainMenu");
    const trainId = parseInt(trainMenu.getAttribute("data-train-id"), 10);
    showRenameTrainOverlay(trainId);
    trainMenu.classList.add("hidden");
  });

  addScheduleButton.addEventListener("click", () => {
    const newScheduleId = findAvailableScheduleId();
    const name = `Schedule ${newScheduleId}`;
    addSchedule(name, []);
  });
}

// Train constructor
function Train(id, name, scheduleId) {
  this.id = id;
  this.name = name;
  this.scheduleId = scheduleId;
  this.currentLocation = "parcel-1"; //a parcelId
  this.timeSpentAtStation = 0;
  this.interClusterTravel = 0;
  this.nextStop;        //a parcelId
  this.currentAction = "Waiting";
  this.status = "";
  this.acceleration = 1;
  this.maxSpeed = 10;
  this.speed = 1;
  this.cargo = [
    /*
    stone: 100,
    ironOre: 150,
    */
  ];
  this.maxCargo = 8000;
  this.loadRate = 200;
}

// Schedule constructor
function Schedule(id, name, stations) {
  this.id = id;
  this.name = name;
  this.stations = stations;
  this.reserveSpace = 0;
}

function createStation(parcelId, load, unload, condition) {
  return {
    parcelId: parcelId,
    load: load,
    unload: unload,
    condition: condition,
  };
}

function generateUniqueTrainId() {
  let id = 1;
  while (gameState.trainList.find((train) => train.id === id)) {
    id++;
  }
  return id;
}

function addTrain(name, scheduleId) {
  // Add a new train to the train list
  const id = generateUniqueTrainId();
  const newTrain = new Train(id, name, scheduleId);
  gameState.trainList.push(newTrain);
  // Update the UI to display the new train
  updateTrainListUI()
}

function removeTrain(trainId) {
  // Remove a train from the train list
  gameState.trainList = gameState.trainList.filter((train) => train.id !== trainId);
  // Update the UI to remove the train
  // This could involve updating a table, list, or other HTML elements
}

function addSchedule(name, stations) {
  // Add a new schedule to the schedule list
  const newScheduleId = findAvailableScheduleId();
  const newSchedule = new Schedule(newScheduleId, name, stations);
  gameState.scheduleList.push(newSchedule);
  // Update the UI to display the new schedule
  updateScheduleListUI();
}

function findAvailableScheduleId() {
  let availableId = 0;
  const usedIds = new Set(gameState.scheduleList.map((schedule) => schedule.id));

  while (usedIds.has(availableId)) {
    availableId++;
  }

  return availableId;
}

function removeSchedule(scheduleId) {
  // Remove a schedule from the schedule list
  gameState.scheduleList = gameState.scheduleList.filter((schedule) => schedule.id !== scheduleId);

  // Remove the references to the removed schedule from any trains
  gameState.trainList.forEach((train) => {
    if (train.scheduleId === scheduleId) {
      train.scheduleId = null;
    }
  });

  // Update the UI to remove the schedule
  // This could involve updating a table, list, or other HTML elements
}

function addStationToSchedule(scheduleId, station) {
  // Add a station to the given schedule
  // Find the schedule in your schedule list data structure
  const schedule = gameState.scheduleList.find((schedule) => schedule.id === scheduleId);
  if (schedule) {
    // Add the station to the schedule's stations array
    schedule.stations.push(station);
    // Update the UI to display the new station in the schedule
    // This could involve updating a table, list, or other HTML elements
  }
}

function removeStationFromSchedule(scheduleId, parcelId, position) {
  // Remove a station from the given schedule
  // Find the schedule in your schedule list data structure
  const schedule = gameState.scheduleList.find((schedule) => schedule.id === scheduleId);
  if (schedule) {
    // Remove the station at the specified position in the schedule's stations array
    if (position >= 0 && position < schedule.stations.length) {
      schedule.stations.splice(position, 1);
    }
    // Update the UI to remove the station from the schedule
    // This could involve updating a table, list, or other HTML elements
  }
}

function updateSchedule(scheduleId, newScheduleData) {
  // Update a schedule with new data
  // Find the schedule in your schedule list data structure
  const schedule = gameState.scheduleList.find((schedule) => schedule.id === scheduleId);
  if (schedule) {
    // Update the schedule's properties with the new data
    schedule.name = newScheduleData.name;
    schedule.parcelIds = newScheduleData.parcelIds;
    // Update the UI to reflect the changes
    // This could involve updating a table, list, or other HTML elements
  }
}

function updateTrain(trainId, newName = null, newScheduleId = null) {
  // Find the train in your train list data structure
  if (typeof trainId === "string") {
    trainId = parseInt(trainId);
  }
  const train = gameState.trainList.find((t) => t.id === trainId);

  if (!train) {
    console.error(`Train with ID ${trainId} not found.`);
    return;
  }

  // Update the train's properties with the new data
  if (newName !== null) {
    train.name = newName;
  }

  if (newScheduleId !== null) {
    const newSchedule = gameState.scheduleList.find((s) => s.id === newScheduleId);

    if (!newSchedule) {
      console.error(`Schedule with ID ${newScheduleId} not found.`);
      return;
    }

    train.scheduleId = newScheduleId;
  }

  // Update the UI to reflect the changes
  updateTrainListUI();
}

function moveUpStation(scheduleId, parcelId, index) {
  // Move a station up in the given schedule
  // Find the schedule in your schedule list data structure
  const schedule = gameState.scheduleList.find((schedule) => schedule.id === scheduleId);
  if (schedule && index > 0) {
    // Swap the station with the one above it in the schedule's stations array
    const temp = schedule.stations[index - 1];
    schedule.stations[index - 1] = schedule.stations[index];
    schedule.stations[index] = temp;

    // Update the UI to reflect the changes
    showScheduleOverlay(scheduleId);
  }
}

function moveDownStation(scheduleId, parcelId, index) {
  // Move a station down in the given schedule
  // Find the schedule in your schedule list data structure
  const schedule = gameState.scheduleList.find((schedule) => schedule.id === scheduleId);
  if (schedule && index < schedule.stations.length - 1) {
    // Swap the station with the one below it in the schedule's stations array
    const temp = schedule.stations[index + 1];
    schedule.stations[index + 1] = schedule.stations[index];
    schedule.stations[index] = temp;

    // Update the UI to reflect the changes
    showScheduleOverlay(scheduleId);
  }
}


function saveSchedule(scheduleId) {
// Save changes made to a schedule
// Perform any necessary validation on the schedule data
// Update the schedule data in your schedule list data structure
// Update the UI to reflect the changes
// Close the schedule overlay
}

function buyTrain() {
  if (gameState.trainList.length >= gameState.maxTrains) {
    alert("Max train limit reached. Research upgrades to add more trains to the network.");
    return;
  }

  const selectedParcel = parcels.getParcel(ui.getSelectedParcelIndex());

  if (window.projects.hasEnoughResources(selectedParcel, trainCost)) {
    // Deduct the train cost from the player's resources
    for (const resource in trainCost) {
      const totalResource = (selectedParcel.resources[resource] || 0) + buildingManager.getResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resource);

      if (selectedParcel.resources[resource] >= trainCost[resource]) {
        selectedParcel.resources[resource] -= trainCost[resource];
      } else {
        const parcelResource = selectedParcel.resources[resource] || 0;
        const remainingResource = trainCost[resource] - parcelResource;
        selectedParcel.resources[resource] = 0;
        buildingManager.deductResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resource, remainingResource);
      }
    }

    // Add a new train to the train list
    const id = generateUniqueTrainId();
    const name = `Train ${id}`;
    const emptySchedule = [];
    addTrain(name, emptySchedule);

    // Update the UI to reflect the changes (handled by addTrain function)
    ui.updateResourceDisplay(selectedParcel);
  } else {
    alert("You don't have enough resources to buy a train.");
  }
}


function sellTrain(trainId) {
  const train = gameState.trainList.find((t) => t.id === trainId);

  if (train) {
    // Calculate total resources for the train
    const refundResources = train.cargo.map(cargoItem => ({
      resource: cargoItem.resource,
      amount: cargoItem.amount
    }));

    // Add the train cost to refundResources
    for (const resource in trainCost) {
      const existingResourceIndex = refundResources.findIndex(refundResource => refundResource.resource === resource);
      if (existingResourceIndex !== -1) {
        refundResources[existingResourceIndex].amount += trainCost[resource];
      } else {
        refundResources.push({ resource, amount: trainCost[resource] });
      }
    }

    // Loop through each resource and refund accordingly
    refundResources.forEach((refundResource) => {
      let remainingRefund = refundResource.amount;
      const resourceDensity = resourceMetadata[refundResource.resource]?.density || 1;

      // Find parcels with remote construction facilities that have space
      const remoteConstructionParcels = parcels.parcelList.filter(
        (parcel) => parcel.buildings.remoteConstructionFacility &&
          (parcel.maxResources / resourceDensity) - parcel.resources[refundResource.resource] >= remainingRefund
      );
        console.log(remoteConstructionParcels);
      // Refund resources to remote construction facility parcels with available space
      for (const parcel of remoteConstructionParcels) {
        if (remainingRefund <= 0) break;

        if (!parcel.resources.hasOwnProperty(refundResource.resource)) {
          parcel.resources[refundResource.resource] = 0;
        }

        const parcelSpace = (parcel.maxResources / resourceDensity) - parcel.resources[refundResource.resource];
        const actualRefund = Math.min(remainingRefund, parcelSpace);
        parcel.resources[refundResource.resource] += actualRefund;
        remainingRefund -= actualRefund;
      }

      // Refund remaining resources to the active parcel if there's available space
      if (remainingRefund > 0) {
        const activeParcel = parcels.getParcel(ui.getSelectedParcelIndex());

        if (!activeParcel.resources.hasOwnProperty(refundResource.resource)) {
          activeParcel.resources[refundResource.resource] = 0;
        }

        const activeParcelSpace = (activeParcel.maxResources / resourceDensity) - activeParcel.resources[refundResource.resource];
        const actualRefund = Math.min(remainingRefund, activeParcelSpace);
        activeParcel.resources[refundResource.resource] += actualRefund;
        remainingRefund -= actualRefund;
      }
    });

    // Remove the train from the train list
    removeTrain(trainId);
  }
}

//---------------------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------- Game Logic Functions -------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------
function getScheduleById(scheduleId) {
  return gameState.scheduleList.find(schedule => schedule.id === scheduleId);
}

function getTrainById(trainId) {
  return gameState.trainList.find(train => train.id === trainId);
}

function calculateCargoSpace(cargo) {
  let totalSpace = 0;

  for (const cargoItem of cargo) {
    const resourceAmount = cargoItem.amount;
    const resourceDensity = resourceMetadata[cargoItem.resource]?.density || 1;
    totalSpace += resourceAmount * resourceDensity;
  }

  return totalSpace;
}

function calculateDistance(startParcelId, endParcelId) {
  const startParcel = parcels.parcelList.find(parcel => parcel.id === startParcelId);
  const endParcel = parcels.parcelList.find(parcel => parcel.id === endParcelId);

  if (startParcel.cluster === endParcel.cluster) {
    // Same cluster
    return Math.abs(parcels.parcelList.indexOf(startParcel) - parcels.parcelList.indexOf(endParcel));
  } else {
    // Different clusters
    const startClusterParcels = parcels.parcelList.filter(parcel => parcel.cluster === startParcel.cluster);
    const endClusterParcels = parcels.parcelList.filter(parcel => parcel.cluster === endParcel.cluster);

    const distances = [];

    // Scenario 1: Leave via the first parcel of the start cluster and enter via the first parcel of the end cluster
    const distanceScenario1 =
      startClusterParcels.indexOf(startParcel) +
      endClusterParcels.indexOf(endParcel) +
      Math.abs(endParcel.cluster - startParcel.cluster) * interClusterDistance;
    distances.push(distanceScenario1);

    // Scenario 2: Leave via the first parcel of the start cluster and enter via the last parcel of the end cluster
    const distanceScenario2 =
      startClusterParcels.indexOf(startParcel) +
      (endClusterParcels.length - 1 - endClusterParcels.indexOf(endParcel)) +
      Math.abs(endParcel.cluster - startParcel.cluster) * interClusterDistance;
    distances.push(distanceScenario2);

    // Scenario 3: Leave via the last parcel of the start cluster and enter via the first parcel of the end cluster
    const distanceScenario3 =
      (startClusterParcels.length - 1 - startClusterParcels.indexOf(startParcel)) +
      endClusterParcels.indexOf(endParcel) +
      Math.abs(endParcel.cluster - startParcel.cluster) * interClusterDistance;
    distances.push(distanceScenario3);

    // Scenario 4: Leave via the last parcel of the start cluster and enter via the last parcel of the end cluster
    const distanceScenario4 =
      (startClusterParcels.length - 1 - startClusterParcels.indexOf(startParcel)) +
      (endClusterParcels.length - 1 - endClusterParcels.indexOf(endParcel)) +
      Math.abs(endParcel.cluster - startParcel.cluster) * interClusterDistance;
    distances.push(distanceScenario4);

    return Math.min(...distances);
  }
}

function getClosestClusterExitParcel(currentParcel) {
  const clusterParcels = parcels.parcelList.filter(parcel => parcel.cluster === currentParcel.cluster);
  const firstParcel = clusterParcels[0];
  const lastParcel = clusterParcels[clusterParcels.length - 1];

  const distanceToFirst = calculateDistance(currentParcel.id, firstParcel.id);
  const distanceToLast = calculateDistance(currentParcel.id, lastParcel.id);

  return distanceToFirst <= distanceToLast ? firstParcel : lastParcel;
}

function getClosestClusterEntryParcel(destinationCluster, currentLocationId) {
  const destinationClusterParcels = parcels.parcelList.filter(parcel => parcel.cluster === destinationCluster);
  const firstParcel = destinationClusterParcels[0];
  const lastParcel = destinationClusterParcels[destinationClusterParcels.length - 1];

  const distanceToFirst = calculateDistance(currentLocationId, firstParcel.id);
  const distanceToLast = calculateDistance(currentLocationId, lastParcel.id);

  return distanceToFirst <= distanceToLast ? firstParcel : lastParcel;
}

function getNextParcel(currentParcelId, direction) {
  const currentParcel = parcels.parcelList.find(parcel => parcel.id === currentParcelId);
  const currentClusterParcels = parcels.parcelList.filter(parcel => parcel.cluster === currentParcel.cluster);
  const currentClusterParcelIndex = currentClusterParcels.findIndex(parcel => parcel.id === currentParcelId);

  const nextClusterParcelIndex = currentClusterParcelIndex + direction;

  if (nextClusterParcelIndex >= 0 && nextClusterParcelIndex < currentClusterParcels.length) {
    return currentClusterParcels[nextClusterParcelIndex];
  } else {
    return null;
  }
}

function getClusterTravelDistance(currentCluster, destinationCluster) {
  const clusterDistance = Math.abs(destinationCluster - currentCluster);
  return interClusterDistance * clusterDistance;
}

function getCurrentStationCondition(train) {
  const schedule = getScheduleById(train.scheduleId);
  if (!schedule) return null;

  const currentStation = schedule.stations[train.nextStop];
  if (!currentStation) return null;

  return currentStation.condition;
}

function executeLoading(train) {
  const schedule = getScheduleById(train.scheduleId);
  let currentStation = schedule.stations[train.nextStop];
  const currentParcel = parcels.parcelList.find(parcel => parcel.id === train.currentLocation);

  //There can be a situation where a nextStop of a train is not avaialbel in the schedule anymore.
  let correctionValue = 1;
  while (currentStation === undefined) {
    console.log("while", correctionValue, currentStation);
    currentStation = schedule.stations[train.nextStop - correctionValue]
    correctionValue++;
    if (correctionValue === 1000) {
      return true;
    }
  }

  const loading = currentStation.load;
  const unloading = currentStation.unload;
  const allResources = loading.concat(unloading);

  const reserveSpace = schedule.reserveSpace;

  // Calculate the reserved and unreserved spaces for each item type
  let uniqueItems = new Set();
  for (let station of schedule.stations) {
    station.load.forEach(item => uniqueItems.add(item));
  }
  // Calculate the reserved space for each item type
  let reservedSpacePerItem = (train.maxCargo * reserveSpace) / (100 * uniqueItems.size);

  // Calculate the unreserved space
  let unreservedSpace = train.maxCargo;
  for (let resource of uniqueItems) {
    const resourceSpaceInTrain = train.cargo.find(cargoItem => cargoItem.resource === resource)?.amount || 0;
    if (resourceSpaceInTrain < reservedSpacePerItem) {
      unreservedSpace -= reservedSpacePerItem;
    } else {
      unreservedSpace -= resourceSpaceInTrain;
    }
  }

  let remainingRate = 100;
  let prevRemainingRate = remainingRate;
  let iteration = 0;
  const maxIterations = 10;
  const minChangeThreshold = 0.01;

  // Add a new property to store the inactivity timer
  if (!train.hasOwnProperty("inactivityTimer")) {
    train.inactivityTimer = 0;
  }

  let activityOccurred = false;

  while (iteration < maxIterations) {
    let activeResources = allResources.filter(resource => {
      const canLoad = loading.includes(resource) && currentParcel.resources[resource] > 0;
      const canUnload = unloading.includes(resource) && train.cargo.some(cargoItem => cargoItem.resource === resource && cargoItem.amount > 0);
      return canLoad || canUnload;
    });

    const ratePerResource = remainingRate / activeResources.length;
    remainingRate = 0;

    for (let resource of activeResources) {
      const rate = ratePerResource;
      const resourceDensity = resourceMetadata[resource]?.density || 1;

      if (unloading.includes(resource)) {
        const cargoIndex = train.cargo.findIndex(cargoItem => cargoItem.resource === resource);

        if (cargoIndex !== -1) {
          // Initialize the resource in the parcel if it doesn't exist
          if (!currentParcel.resources.hasOwnProperty(resource)) {
            currentParcel.resources[resource] = 0;
          }

          const parcelSpace = (currentParcel.maxResources / resourceDensity) - currentParcel.resources[resource];

          const actualUnload = Math.min(train.cargo[cargoIndex].amount, parcelSpace, rate);
          currentParcel.resources[resource] += actualUnload;
          remainingRate += rate - actualUnload;

          // Update the train's cargo
          train.cargo[cargoIndex].amount -= actualUnload;
          if (train.cargo[cargoIndex].amount === 0) {
            train.cargo.splice(cargoIndex, 1);
          }
          if (actualUnload > 0) {
            activityOccurred = activityOccurred || true;
          }
        }
      }
      if (loading.includes(resource)) {
        const availableResource = currentParcel.resources[resource];
        const resourceSpaceInTrain = train.cargo.find(cargoItem => cargoItem.resource === resource)?.amount || 0;

        const reservedSpaceAvailable = Math.max(0, reservedSpacePerItem - resourceSpaceInTrain);
        const unreservedSpaceAvailable = Math.max(0, unreservedSpace);
        const totalSpaceAvailable = (reservedSpaceAvailable + unreservedSpaceAvailable) / resourceDensity;
        let actualLoad = Math.min(reservedSpaceAvailable / resourceDensity, availableResource, rate);
        const totalCargoSpaceAfterLoading = calculateCargoSpace(train.cargo) + (actualLoad * resourceDensity);

        // Check if the reserved space is fully utilized
        if (actualLoad < rate) {
          // Load the remaining available space from the unreserved space
          const remainingLoad = Math.min(unreservedSpaceAvailable / resourceDensity, availableResource - actualLoad, rate - actualLoad);
          actualLoad += remainingLoad;
          unreservedSpace -= remainingLoad * resourceDensity; // Update the unreserved space
        }

        // Check if the total cargo space after loading exceeds the maxCargo limit of the train
        let cargoExceeded = false;
        if (totalCargoSpaceAfterLoading > train.maxCargo) {
          // Adjust the actual load amount to ensure the total cargo space does not exceed the maxCargo limit
          const excessCargoSpace = totalCargoSpaceAfterLoading - train.maxCargo;
          const excessLoad = excessCargoSpace / resourceDensity;
          actualLoad -= excessLoad;
          cargoExceeded = true;
          unreservedSpace += excessLoad * resourceDensity; // Update the unreserved space
        }

        currentParcel.resources[resource] -= actualLoad;
        remainingRate += rate - actualLoad;

        // Update the train's cargo
        const cargoIndex = train.cargo.findIndex(cargoItem => cargoItem.resource === resource);
        if (cargoIndex === -1) {
          train.cargo.push({ resource, amount: actualLoad });
        } else {
          train.cargo[cargoIndex].amount += actualLoad;
        }

        // Register activity only if actualLoad is greater than zero
        if (actualLoad > 0) {
          if (cargoExceeded) {
            activityOccurred = false;
          } else {
            activityOccurred = activityOccurred || true;
          }
        }
      }

    }

    // Break the loop if the change in remainingRate is below the threshold
    if (Math.abs(prevRemainingRate - remainingRate) < minChangeThreshold) {
      break;
    }

    prevRemainingRate = remainingRate;
    iteration += 1;
  }

  // Update the timeSpentAtStation
  train.timeSpentAtStation += 1;

  // Update inactivityTimer based on activity
  if (activityOccurred) {
    train.inactivityTimer = 0;
  } else {
    train.inactivityTimer += 1;
  }

  // Check if the loading/unloading process is done based on the station's condition
  if (
    (currentStation.condition.type === "time" && train.timeSpentAtStation >= currentStation.condition.amount) ||
    (currentStation.condition.type === "inactivity" && train.inactivityTimer >= currentStation.condition.amount)
  ) {
    train.timeSpentAtStation = 0; // Reset the time spent at the station
    train.inactivityTimer = 0; // Reset the inactivity timer
    return true;
  }

  return false;
  }

function moveTrain(trainId) {
  const train = getTrainById(trainId);
  if (!train) return;

  const schedule = getScheduleById(train.scheduleId);
  if (!schedule) return;

  if (train.nextStop === undefined || Number.isNaN(train.nextStop)) {
    train.nextStop = 0;
  }
  if (!train || !schedule) {
    console.error(`Could not find train or schedule for trainId: ${trainId}`);
    return;
  }

  const currentLocation = parcels.parcelList.find(parcel => parcel.id === train.currentLocation);
  const destinationParcelId = schedule.stations[train.nextStop] ? schedule.stations[train.nextStop].parcelId : "parcel-1";
  let destinationParcel = parcels.parcelList.find(parcel => parcel.id === destinationParcelId);

  if (currentLocation === destinationParcel) {
    // Train has arrived at its destination

    // Check if the loading process is done
    if (executeLoading(train)) {
      train.nextStop = (train.nextStop + 1) % schedule.stations.length;
      train.status = `↑ "${destinationParcel.name ? destinationParcel.name : destinationParcel.id}"`;
    } else {
      train.status = `↓ "${destinationParcel.name ? destinationParcel.name : destinationParcel.id}"`;
    }
    return;
  }

  let distanceToDestination = 0;
  if (currentLocation.cluster === destinationParcel.cluster) {
    distanceToDestination = calculateDistance(train.currentLocation, destinationParcelId)
  } else {
    if (train.interClusterTravel > 0) {
      distanceToDestination = calculateDistance(train.currentLocation, destinationParcelId) - (interClusterDistance - train.interClusterTravel);
    } else {
      distanceToDestination = calculateDistance(train.currentLocation, destinationParcelId);
    }
  }


  const currentCluster = currentLocation.cluster;
  const destinationCluster = destinationParcel.cluster;

  // Check if the train is at the cluster entrance/exit parcel
  const isAtClusterEntranceExit = (parcel) => {
    const clusterParcels = parcels.parcelList.filter(p => p.cluster === parcel.cluster);
    return parcel.id === clusterParcels[0].id || parcel.id === clusterParcels[clusterParcels.length - 1].id;
  };

  if (currentCluster === destinationCluster) {
    train.interClusterTravel = 0; // Reset interClusterTravel
  } else if (train.interClusterTravel === 0) {
    if (!isAtClusterEntranceExit(currentLocation)) {
      const clusterExitParcel = getClosestClusterExitParcel(currentLocation);
      destinationParcel = clusterExitParcel;
      distanceToDestination = calculateDistance(train.currentLocation, destinationParcel.id);
    } else {
      const clusterTravelDistance = getClusterTravelDistance(currentCluster, destinationCluster);
      train.interClusterTravel = clusterTravelDistance; // Initialize interClusterTravel
    }
  }

  // Handle inter-cluster travel
  if (train.interClusterTravel > 0) {
    train.interClusterTravel -= train.speed;

    const remainingDistance = interClusterDistance * Math.abs(destinationParcel.cluster - currentLocation.cluster) - train.interClusterTravel;
    const totalDistance = interClusterDistance * Math.abs(destinationParcel.cluster - currentLocation.cluster);

    train.status = `→ cluster ${destinationParcel.cluster} (${remainingDistance}/${totalDistance})`;

    if (train.interClusterTravel <= 0) {
      const closestClusterEntryParcel = getClosestClusterEntryParcel(destinationParcel.cluster, train.currentLocation);
      train.currentLocation = closestClusterEntryParcel.id;

      // Animation Stuff // Store the starting position, destination position, and total inter-cluster distance in the train object
      // const sourceClusterCenter = getClusterCenter(currentCluster);
      // const destinationClusterCenter = getClusterCenter(destinationCluster);
      // train.startPosition = { x: sourceClusterCenter.x, y: sourceClusterCenter.y };
      // train.destinationPosition = { x: destinationClusterCenter.x, y: destinationClusterCenter.y };
      // train.totalInterClusterDistance = interClusterDistance * Math.abs(destinationParcel.cluster - currentLocation.cluster);
    }
    return;
  }

  if (train.speed <= distanceToDestination) {
    // Train can move towards the destination without overshooting
    const currentParcelIndex = parcels.parcelList.findIndex(parcel => parcel.id === train.currentLocation);
    const destinationParcelIndex = parcels.parcelList.findIndex(parcel => parcel.id === destinationParcel.id);
    const direction = (destinationParcelIndex > currentParcelIndex) ? 1 : -1;
    const nextParcel = getNextParcel(train.currentLocation, direction);

    if (nextParcel) {
      train.currentLocation = nextParcel.id;
      train.status = `→ "${destinationParcel.name ? destinationParcel.name : destinationParcel.id}"`;
    }
  } else {
    // Train overshoots the destination
    train.currentLocation = destinationParcel.id;
  }
}

function moveAllTrains() {
  gameState.trainList.forEach((train) => {
    // Check if the train has a schedule assigned
    if (train.scheduleId.length === 0) {
      //console.log(`Train ${train.id} does not have a schedule assigned.`);
      return; // skip this iteration
    }

    // Get the schedule
    const trainSchedule = gameState.scheduleList.find(schedule => schedule.id === train.scheduleId);

    // Check if the schedule exists and has at least 2 stations
    if (!trainSchedule || trainSchedule.stations.length < 2) {
      //console.log(`Train ${train.id}'s schedule does not exist or has less than 2 stations.`);
      return; // skip this iteration
    }

    // Now move the train
    moveTrain(train.id);
  });
}


//---------------------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------- UI Functions -------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------

/* ---------------------------------------- Visualization World ---------------------------------------- */
function createGameWorldVisualization() {
  const svg = document.getElementById("game-world-svg");
  const svgns = "http://www.w3.org/2000/svg";

  // Create cluster and parcel representations
  const clusterSet = new Set(parcels.parcelList.map(parcel => parcel.cluster));
  const clusterHeight = 60;
  const parcelSize = 20;

  clusterSet.forEach((cluster, index) => {
    const clusterGroup = document.createElementNS(svgns, "g");
    clusterGroup.setAttribute("class", "clusterViz");

    const clusterParcels = parcels.parcelList.filter(parcel => parcel.cluster === cluster);
    const clusterX = 50;
    const clusterY = 50 + index * (clusterHeight + 50);

    clusterParcels.forEach((parcel, parcelIndex) => {
      // Create parcel rectangles
      const parcelRect = document.createElementNS(svgns, "rect");
      parcelRect.setAttribute("class", "parcelViz");
      parcelRect.setAttribute("x", clusterX + parcelIndex * parcelSize);
      parcelRect.setAttribute("y", clusterY);
      parcelRect.setAttribute("width", parcelSize);
      parcelRect.setAttribute("height", parcelSize);
      parcelRect.setAttribute("data-parcel-id", parcel.id);

      clusterGroup.appendChild(parcelRect);
    });

    svg.appendChild(clusterGroup);
  });

  // Create train circles
  gameState.trainList.forEach((train) => {
    const trainCircle = document.createElementNS(svgns, "circle");
    trainCircle.classList.add("trainViz");
    trainCircle.setAttribute("data-train-id", train.id);

    const parcel = parcels.parcelList.find(parcel => parcel.id === train.currentLocation);
    const parcelRect = svg.querySelector(`.parcelViz[data-parcel-id="${parcel.id}"]`);

    if (parcelRect) {
      const initialX = parseFloat(parcelRect.getAttribute("x")) + parcelSize / 2;
      const initialY = parseFloat(parcelRect.getAttribute("y")) + parcelSize / 2;

      trainCircle.setAttribute("cx", initialX);
      trainCircle.setAttribute("cy", initialY);
    }

    trainCircle.setAttribute("r", 5);
    trainCircle.setAttribute("fill", "blue");

    svg.appendChild(trainCircle);
  });

  // Initial train positions
  updateTrainPositions();
}

function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}

function getClusterCenter(clusterId) {
  const svg = document.getElementById("game-world-svg");
  const firstParcelInCluster = parcels.parcelList.find(parcel => parcel.cluster === clusterId);
  const parcelRect = svg.querySelector(`.parcelViz[data-parcel-id="${firstParcelInCluster.id}"]`);

  if (parcelRect) {
    const clusterX = parseFloat(parcelRect.getAttribute("x")) - 10;
    const clusterY = parseFloat(parcelRect.getAttribute("y")) + parseFloat(parcelRect.getAttribute("height")) / 2;
    return { x: clusterX, y: clusterY };
  }

  return null;
}

function animateTrain(train, trainCircle, startX, startY, endX, endY, duration) {
  const startTime = performance.now();

  function animate(timestamp) {
    const progress = Math.min((timestamp - startTime) / duration, 1);
    trainCircle.setAttribute("cx", lerp(startX, endX, progress));
    trainCircle.setAttribute("cy", lerp(startY, endY, progress));

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

function updateTrainPositions() {
  const svg = document.getElementById("game-world-svg");
  const duration = TICK_INTERVAL; // Duration of the animation in milliseconds

  gameState.trainList.forEach((train) => {
    const trainCircle = svg.querySelector(`.trainViz[data-train-id="${train.id}"]`);
    let nextProgress;
    if (train.status.startsWith("→ cluster")) {
      if (train.startPosition && train.destinationPosition && train.totalInterClusterDistance) {
        const remainingDistance = train.totalInterClusterDistance - train.interClusterTravel;
        const startProgress = 1 - (remainingDistance / train.totalInterClusterDistance);

        const startX = (nextProgress === 1 && train.nextPosition)
          ? train.nextPosition.x
          : lerp(train.startPosition.x, train.destinationPosition.x, startProgress);
        const startY = (nextProgress === 1 && train.nextPosition)
          ? train.nextPosition.y
          : lerp(train.startPosition.y, train.destinationPosition.y, startProgress);

        nextProgress = Math.min(startProgress + train.speed / train.totalInterClusterDistance, 1);
        let endX = lerp(train.startPosition.x, train.destinationPosition.x, nextProgress);
        let endY = lerp(train.startPosition.y, train.destinationPosition.y, nextProgress);

        // If the train is on the last step of the inter-cluster travel, update endX and endY to the target entry parcel position
        const schedule = getScheduleById(train.scheduleId);
        const destinationParcelId = schedule.stations[train.nextStop] ? schedule.stations[train.nextStop].parcelId : "parcel-1";
        const destinationParcel = parcels.parcelList.find(parcel => parcel.id === destinationParcelId);
        if (nextProgress === 1) {
          const targetEntryParcel = getClosestClusterEntryParcel(destinationParcel.cluster, train.currentLocation);
          const targetEntryParcelSquare = svg.querySelector(`.parcelViz[data-parcel-id="${targetEntryParcel.id}"]`);
          endX = parseFloat(targetEntryParcelSquare.getAttribute("x")) + parseFloat(targetEntryParcelSquare.getAttribute("width")) / 2;
          endY = parseFloat(targetEntryParcelSquare.getAttribute("y")) + parseFloat(targetEntryParcelSquare.getAttribute("height")) / 2;
        } else {
          endX = lerp(train.startPosition.x, train.destinationPosition.x, nextProgress);
          endY = lerp(train.startPosition.y, train.destinationPosition.y, nextProgress);
        }
        // Swap startX with endX and startY with endY to reverse the direction of the animation
        animateTrain(train, trainCircle, endX, endY, startX, startY, duration);
      }
    } else {
      const parcel = parcels.parcelList.find(parcel => parcel.id === train.currentLocation);
      const parcelSquare = svg.querySelector(`.parcelViz[data-parcel-id="${parcel.id}"]`);

      if (parcelSquare) {
        const startX = parseFloat(trainCircle.getAttribute("cx"));
        const startY = parseFloat(trainCircle.getAttribute("cy"));
        const endX = parseFloat(parcelSquare.getAttribute("x")) + parseFloat(parcelSquare.getAttribute("width")) / 2;
        const endY = parseFloat(parcelSquare.getAttribute("y")) + parseFloat(parcelSquare.getAttribute("height")) / 2;
        animateTrain(train, trainCircle, startX, startY, endX, endY, duration);
      }
    }
  });
}

/* ---------------------------------------- Train Table ---------------------------------------- */

function updateTrainListUI() {
  const trainTableBody = document.querySelector("#train-table tbody");

  // Clear the existing table rows
  trainTableBody.innerHTML = "";

  // Loop through the train list and create new table rows
  gameState.trainList.forEach((train) => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const scheduleCell = document.createElement("td");
    const statusCell = document.createElement("td");
    const currentLocationCell = document.createElement("td");
    const cargoCell = document.createElement("td");

    // Assign the class
    nameCell.className = "fixed-width-cell";
    scheduleCell.className = "fixed-width-cell";
    statusCell.className = "fixed-width-cell";
    currentLocationCell.className = "fixed-width-cell";
    cargoCell.className = "fixed-width-cell";

    // Assuming the train object is named 'train'
    const currentCargoSpace = calculateCargoSpace(train.cargo);

    //Create Name Cell Name
    nameCell.innerHTML = `${train.name}`;

    // Create a menu button for each train
    const menuButton = document.createElement("button");
    menuButton.id = `edit-train-${train.id}`;
    menuButton.classList.add("menu-button");
    menuButton.textContent = "⚙";
    menuButton.addEventListener("click", (event) => {
      const trainMenu = document.getElementById("trainMenu");
      trainMenu.setAttribute("data-train-id", train.id);

      // Set the position of the dropdown menu
      const rect = event.target.getBoundingClientRect();
      trainMenu.style.left = `${rect.left}px`;
      trainMenu.style.top = `${rect.bottom}px`;

      trainMenu.classList.toggle("hidden");

      // Stop event propagation to prevent triggering the document click event listener
      event.stopPropagation();
    });

    nameCell.appendChild(menuButton);

    // Find the schedule by its ID
    const schedule = gameState.scheduleList.find((s) => s.id === train.scheduleId);

    // Check if the schedule exists before trying to access its name
    if (schedule) {
      scheduleCell.textContent = schedule.name;
    } else {
      scheduleCell.textContent = "No Schedule";
    }

    statusCell.textContent = train.status;
    const currentParcel = parcels.parcelList.find(parcel => parcel.id === train.currentLocation);
    currentLocationCell.textContent = currentParcel.name ? currentParcel.name : currentParcel.id;
    cargoCell.textContent = `${currentCargoSpace.toFixed(0)} / ${train.maxCargo}`;

    // Attach tooltip event listeners
    cargoCell.addEventListener("mouseover", (event) => {
      const cargoText = train.cargo
        .map((cargoItem) => `${cargoItem.amount.toFixed(1)} ${cargoItem.resource}`)
        .join("<br>");

      tooltip.innerHTML = cargoText || "Empty";
      tooltip.style.display = "block";
      tooltip.style.left = event.pageX + 10 + "px";
      tooltip.style.top = event.pageY + 10 + "px";
    });

    cargoCell.addEventListener("mouseout", () => {
      tooltip.style.display = "none";
    });

    cargoCell.addEventListener("mousemove", (event) => {
      tooltip.style.left = event.pageX + 10 + "px";
      tooltip.style.top = event.pageY + 10 + "px";
    });

    row.appendChild(nameCell);
    row.appendChild(scheduleCell);
    row.appendChild(currentLocationCell);
    row.appendChild(statusCell);
    row.appendChild(cargoCell);

    trainTableBody.appendChild(row);
  });
  // Add the buyTrainButton event listener if not already initialized
  const buyTrainButton = document.getElementById("buy-train-button");

  if (buyTrainButton.getAttribute("data-tooltip-initialized") !== "true") {
    addTooltipToBuyTrainButton(buyTrainButton);
    buyTrainButton.setAttribute("data-tooltip-initialized", "true");
  }
}


function showAssignScheduleOverlay(trainId) {
  const overlay = document.createElement("div");
  overlay.id = "assign-schedule-overlay";
  overlay.classList.add("train-manipulation-overlay");

  const overlayContainer = document.createElement("div");
  overlayContainer.classList.add("overlay-container");

  const dropdown = document.createElement("select");
  dropdown.id = "schedule-dropdown";
  dropdown.classList.add("overlay-element");

  // Loop through available schedules and add them to the dropdown
  gameState.scheduleList.forEach((schedule) => {
    const option = document.createElement("option");
    option.value = schedule.id;
    option.textContent = schedule.name;
    dropdown.appendChild(option);
  });

  const submitButton = document.createElement("button");
  submitButton.textContent = "Assign Schedule";
  submitButton.classList.add("overlay-element");
  submitButton.addEventListener("click", () => {
    const selectedScheduleId = parseInt(dropdown.value, 10);
    updateTrain(trainId, null, selectedScheduleId);
    updateScheduleListUI();
    document.body.removeChild(overlay);
  });

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.classList.add("overlay-element");
  cancelButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  overlayContainer.appendChild(dropdown);
  overlayContainer.appendChild(submitButton);
  overlayContainer.appendChild(cancelButton);
  overlay.appendChild(overlayContainer);
  document.body.appendChild(overlay);
}

function showRenameTrainOverlay(trainId) {
  const overlay = document.createElement("div");
  overlay.id = "rename-train-overlay";
  overlay.classList.add("train-manipulation-overlay");

  const container = document.createElement("div");
  container.classList.add("overlay-container");

  const input = document.createElement("input");
  input.id = "rename-train-input";
  input.type = "text";
  input.placeholder = "New Train Name";

  const renameButton = document.createElement("button");
  renameButton.textContent = "Rename";
  renameButton.addEventListener("click", () => {
    const newName = input.value;
    updateTrain(trainId, newName);
    document.body.removeChild(overlay);
  });

  const cancelButton = document.createElement("button");
  cancelButton.textContent = "Cancel";
  cancelButton.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  container.appendChild(input);
  container.appendChild(renameButton);
  container.appendChild(cancelButton);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  // Close the overlay when clicking outside the form
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
}

function addTooltipToBuyTrainButton(button) {
  const tooltip = document.getElementById("tooltip");

  button.addEventListener("mouseover", (event) => {
    const costText = Object.entries(trainCost)
      .map(([resource, cost]) => `${cost} ${resource}`)
      .join("<br>");
    const tooltipText = `Cost:<br>${costText}`;

    tooltip.innerHTML = tooltipText;
    tooltip.style.display = "block";
    tooltip.style.left = event.pageX + 10 + "px";
    tooltip.style.top = event.pageY + 10 + "px";
  });

  button.addEventListener("mouseout", () => {
    tooltip.style.display = "none";
  });

  button.addEventListener("mousemove", (event) => {
    tooltip.style.left = event.pageX + 10 + "px";
    tooltip.style.top = event.pageY + 10 + "px";
  });
}

/* ---------------------------------------- Schedule Table ---------------------------------------- */

function createScheduleRow(schedule) {
  const row = document.createElement("tr");

  const nameCell = document.createElement("td");
  const nameText = document.createTextNode(`${schedule.name} `);
  nameCell.appendChild(nameText);

  const editButton = document.createElement("button");
  editButton.textContent = "⚙";
  editButton.classList.add("edit-schedule-button");
  editButton.id = `edit-schedule-${schedule.id}`;
  nameCell.appendChild(editButton);

  const trainCountCell = document.createElement("td");
  const trainCount = gameState.trainList.filter(train => train.scheduleId === schedule.id).length;
  const trainCountText = document.createTextNode(trainCount);
  trainCountCell.appendChild(trainCountText);

  row.appendChild(nameCell);
  row.appendChild(trainCountCell);

  return row;
}

function updateScheduleListUI() {
  const scheduleTableBody = document.getElementById("schedule-table").tBodies[0];

  // Remove existing rows
  while (scheduleTableBody.firstChild) {
    scheduleTableBody.removeChild(scheduleTableBody.firstChild);
  }

  // Add updated schedule rows
  gameState.scheduleList.forEach(schedule => {
    const row = createScheduleRow(schedule);
    scheduleTableBody.appendChild(row);
  });

  // Add event listeners for edit schedule buttons
  gameState.scheduleList.forEach(schedule => {
    const editButton = document.getElementById(`edit-schedule-${schedule.id}`);
    editButton.addEventListener("click", () => {
      showScheduleOverlay(schedule.id);
    });
  });
}

/* ---------------------------------------- Schedule Overlay ---------------------------------------- */

function showScheduleOverlay(scheduleId) {
  const schedule = gameState.scheduleList.find((s) => s.id === scheduleId);
  console.log(schedule);
  // Create the overlay and its content
  const overlay = document.getElementById("schedule-overlay");
  overlay.style.display = "block";

  const scheduleNameInput = document.getElementById("schedule-name");
  scheduleNameInput.value = schedule.name;

  // Initialize the reserve space slider and value display
  const reserveSpaceSlider = document.getElementById('reserve-space-slider');
  const reserveSpaceValue = document.getElementById('reserve-space-value');

  reserveSpaceSlider.value = schedule.reserveSpace;
  reserveSpaceValue.textContent = schedule.reserveSpace + '%';

  // Define the new slider event listener
  const sliderEventListener = function() {
    schedule.reserveSpace = this.value;
    reserveSpaceValue.textContent = this.value + '%';
  };

  // Remove the old slider event listener
  if (sliderEventListeners.has(reserveSpaceSlider)) {
    reserveSpaceSlider.removeEventListener('input', sliderEventListeners.get(reserveSpaceSlider));
  }

  // Add the new slider event listener
  reserveSpaceSlider.addEventListener('input', sliderEventListener);

  // Store the new slider event listener
  sliderEventListeners.set(reserveSpaceSlider, sliderEventListener);

  // Populate the Dropdown with available Stations
  populateStationsDropdown();

  // Populate the stations table with data from the schedule
  const stationsTableBody = document.getElementById("stations-table").querySelector("tbody");
  stationsTableBody.innerHTML = "";

  schedule.stations.forEach((station, index) => {
    // Get parcel and cluster data (replace with your actual data retrieval methods)
    const parcel = parcels.parcelList.find(p => p.id === station.parcelId);
    console.log(parcel)
    const cluster = parcel.cluster;

    // Create a table row for each parcel in the schedule
    const row = document.createElement("tr");

    // Add the table cells and their content
    const nameCell = document.createElement("td");
    nameCell.textContent = parcel.name ? parcel.name : parcel.id;
    nameCell.classList.add("left-cell");
    row.appendChild(nameCell);

    const clusterCell = document.createElement("td");
    clusterCell.textContent = cluster;
    clusterCell.classList.add("left-cell");
    row.appendChild(clusterCell);

    // Add Distance to Next Stop cell
    const distanceCell = document.createElement("td");
    distanceCell.classList.add("left-cell");
    if (index < schedule.stations.length - 1) {
      const nextParcelId = schedule.stations[index + 1].parcelId;
      const distance = calculateDistance(station.parcelId, nextParcelId);
      distanceCell.textContent = distance + " units";
    } else {
      const firstParcelId = schedule.stations[0].parcelId;
      const distance = calculateDistance(station.parcelId, firstParcelId);
      distanceCell.textContent = distance + " units (to first station)";
    }
    row.appendChild(distanceCell);

    // Add Load cell
    const loadCell = document.createElement("td");
    loadCell.classList.add("left-cell");
    station.load.forEach(resource => {
      const resourceMetadataItem = resourceMetadata[resource];
      if (resourceMetadataItem) {
        const loadContainer = document.createElement("div");
        loadContainer.style.display = "inline-flex";
        loadContainer.style.alignItems = "center";
        loadContainer.style.whiteSpace = "nowrap";
        loadCell.appendChild(loadContainer);

        const loadIcon = document.createElement("img");
        loadIcon.src = resourceMetadataItem.icon48;
        loadIcon.alt = resourceMetadataItem.name;
        loadIcon.style.width = "18px"; // Adjust the size of the icon as needed
        loadContainer.appendChild(loadIcon);

        const loadText = document.createElement("span");
        loadText.textContent = resourceMetadataItem.name;
        loadContainer.appendChild(loadText);
      }
    });
    row.appendChild(loadCell);

    // Add Unload cell
    const unloadCell = document.createElement("td");
    unloadCell.classList.add("left-cell");
    station.unload.forEach(resource => {
      const resourceMetadataItem = resourceMetadata[resource];
      if (resourceMetadataItem) {
        const unloadContainer = document.createElement("div");
        unloadContainer.style.display = "inline-flex";
        unloadContainer.style.alignItems = "center";
        unloadContainer.style.whiteSpace = "nowrap";
        unloadCell.appendChild(unloadContainer);

        const unloadIcon = document.createElement("img");
        unloadIcon.src = resourceMetadataItem.icon48;
        unloadIcon.alt = resourceMetadataItem.name;
        unloadIcon.style.width = "18px"; // Adjust the size of the icon as needed
        unloadContainer.appendChild(unloadIcon);

        const unloadText = document.createElement("span");
        unloadText.textContent = resourceMetadataItem.name;
        unloadContainer.appendChild(unloadText);
      }
    });
    row.appendChild(unloadCell);

    // Add Condition cell
    const conditionCell = document.createElement("td");
    conditionCell.classList.add("left-cell");

    // Create a container for the type element
    const typeContainer = document.createElement("div");
    typeContainer.style.display = "inline-flex";
    typeContainer.style.alignItems = "center";
    typeContainer.style.whiteSpace = "nowrap";
    conditionCell.appendChild(typeContainer);

    const typeLabel = document.createElement("span");
    typeLabel.textContent = "Type: ";
    typeContainer.appendChild(typeLabel);

    const typeValue = document.createElement("span");
    typeValue.textContent = station.condition.type;
    typeContainer.appendChild(typeValue);

    // Add a line break between the elements
    conditionCell.appendChild(document.createElement("br"));

    // Create a container for the amount element
    const amountContainer = document.createElement("div");
    amountContainer.style.display = "inline-flex";
    amountContainer.style.alignItems = "center";
    amountContainer.style.whiteSpace = "nowrap";
    conditionCell.appendChild(amountContainer);

    const amountLabel = document.createElement("span");
    amountLabel.textContent = "Amount: ";
    amountContainer.appendChild(amountLabel);

    const amountValue = document.createElement("span");
    amountValue.textContent = station.condition.amount;
    amountContainer.appendChild(amountValue);

    row.appendChild(conditionCell);

    // Add the action buttons
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.addEventListener("click", () => {
      openEditStationOverlay(scheduleId, index);
    });

    const actionCell = document.createElement("td");
    actionCell.classList.add("action-cell");
    const moveUpButton = document.createElement("button");
    moveUpButton.textContent = "Move Up";
    moveUpButton.addEventListener("click", () => moveUpStation(scheduleId, station.parcelId, index));

    const moveDownButton = document.createElement("button");
    moveDownButton.textContent = "Move Down";
    moveDownButton.addEventListener("click", () => moveDownStation(scheduleId, station.parcelId, index));

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => {
      removeStationFromSchedule(scheduleId, station.parcelId, index);
      showScheduleOverlay(scheduleId);
    });

    actionCell.appendChild(editButton);
    actionCell.appendChild(moveUpButton);
    actionCell.appendChild(moveDownButton);
    actionCell.appendChild(removeButton);
    row.appendChild(actionCell);

    stationsTableBody.appendChild(row);
  });

  // Hook up the remaining buttons and dropdowns for adding stations, saving the schedule, etc.
  const addStationButton = document.getElementById("add-station");
  const addStationClickListener = onAddStationClick(scheduleId);
  if (addStationButtonListeners.has(addStationButton)) {
    addStationButton.removeEventListener("click", addStationButtonListeners.get(addStationButton));
  }
  addStationButton.addEventListener("click", addStationClickListener);
  addStationButtonListeners.set(addStationButton, addStationClickListener);

  const saveScheduleButton = document.getElementById("save-schedule");
  const saveScheduleClickListener = onSaveScheduleClick(scheduleId, scheduleNameInput, schedule, overlay);
  if (saveScheduleButtonListeners.has(saveScheduleButton)) {
    saveScheduleButton.removeEventListener("click", saveScheduleButtonListeners.get(saveScheduleButton));
  }
  saveScheduleButton.addEventListener("click", saveScheduleClickListener);
  saveScheduleButtonListeners.set(saveScheduleButton, saveScheduleClickListener);

  const deleteScheduleButton = document.getElementById("delete-schedule");
  const deleteScheduleClickListener = onDeleteScheduleClick(scheduleId, overlay);
  if (deleteScheduleButtonListeners.has(deleteScheduleButton)) {
    deleteScheduleButton.removeEventListener("click", deleteScheduleButtonListeners.get(deleteScheduleButton));
  }
  deleteScheduleButton.addEventListener("click", deleteScheduleClickListener);
  deleteScheduleButtonListeners.set(deleteScheduleButton, deleteScheduleClickListener);

  const closeScheduleOverlayButton = document.getElementById("close-schedule-overlay");
  const closeScheduleOverlayClickListener = onCloseScheduleOverlayClick(overlay);
  if (closeScheduleOverlayButtonListeners.has(closeScheduleOverlayButton)) {
    closeScheduleOverlayButton.removeEventListener("click", closeScheduleOverlayButtonListeners.get(closeScheduleOverlayButton));
  }
  closeScheduleOverlayButton.addEventListener("click", closeScheduleOverlayClickListener);
  closeScheduleOverlayButtonListeners.set(closeScheduleOverlayButton, closeScheduleOverlayClickListener);
}

function onAddStationClick(scheduleId) {
  return () => {
    const selectedParcelId = document.getElementById("stations-dropdown").value;
    const load = [];
    const unload = [];
    const condition = {};
    const station = createStation(selectedParcelId, load, unload, condition);
    addStationToSchedule(scheduleId, station);
    showScheduleOverlay(scheduleId);
  };
}

function onSaveScheduleClick(scheduleId, scheduleNameInput, schedule, overlay) {
  return () => {
    updateSchedule(scheduleId, {
      name: scheduleNameInput.value,
      parcelIds: schedule.parcelIds
    });
    overlay.style.display = "none";
    updateScheduleListUI();
    updateTrainListUI();
  };
}

function onDeleteScheduleClick(scheduleId, overlay) {
  return () => {
    removeSchedule(scheduleId);
    overlay.style.display = "none";
    updateScheduleListUI();
    updateTrainListUI();
  };
}

function onCloseScheduleOverlayClick(overlay) {
  return () => {
    overlay.style.display = "none";
    updateScheduleListUI();
    updateTrainListUI();
  };
}

function populateStationsDropdown() {
  const stationsDropdown = document.getElementById("stations-dropdown");

  // Clear the existing options
  stationsDropdown.innerHTML = "";

  // Filter parcels with at least one train station building
  const stationParcels = parcels.parcelList
    .filter(parcel => {
      return parcel.buildings && parcel.buildings.trainStation && parcel.buildings.trainStation > 0;
    })
    .sort((a, b) => {
      if (a.cluster === b.cluster) {
        return parcels.parcelList.indexOf(a) - parcels.parcelList.indexOf(b);
      }
      return a.cluster - b.cluster;
    });

  // Add station parcels as options to the dropdown
  stationParcels.forEach(stationParcel => {
    const option = document.createElement("option");
    option.value = stationParcel.id;
    option.textContent = `Cluster ${stationParcel.cluster} - ${stationParcel.name ? stationParcel.name : stationParcel.id}`;
    stationsDropdown.appendChild(option);
  });
}

/* ---------------------------------------- Edit Station Overlay ---------------------------------------- */

function openEditStationOverlay(scheduleId, stationIndex) {
  const schedule = gameState.scheduleList.find((schedule) => schedule.id === scheduleId);
  const station = schedule.stations[stationIndex];
  const overlay = document.getElementById("edit-station-overlay");
  overlay.style.display = "block";

  populateResourceCheckboxes("load-section", station.load);
  populateResourceCheckboxes("unload-section", station.unload);

  const conditionTypeSelect = document.getElementById("condition-type");
  conditionTypeSelect.value = station.condition.type;

  const conditionAmountInput = document.getElementById("condition-amount");
  conditionAmountInput.value = station.condition.amount;



  // Add event listeners for Save and Cancel buttons
  const saveEditStationButton = document.getElementById("save-edit-station");
  const saveEditStationClickListener = () => {
    saveEditStation(scheduleId, stationIndex);
    overlay.style.display = "none";
  };
  if (saveEditStationButtonListeners.has(saveEditStationButton)) {
    saveEditStationButton.removeEventListener("click", saveEditStationButtonListeners.get(saveEditStationButton));
  }
  saveEditStationButton.addEventListener("click", saveEditStationClickListener);
  saveEditStationButtonListeners.set(saveEditStationButton, saveEditStationClickListener);

  const cancelEditStationButton = document.getElementById("cancel-edit-station");
  const cancelEditStationClickListener = () => {
    overlay.style.display = "none";
  };
  if (cancelEditStationButtonListeners.has(cancelEditStationButton)) {
    cancelEditStationButton.removeEventListener("click", cancelEditStationButtonListeners.get(cancelEditStationButton));
  }
  cancelEditStationButton.addEventListener("click", cancelEditStationClickListener);
  cancelEditStationButtonListeners.set(cancelEditStationButton, cancelEditStationClickListener);
}

function populateResourceCheckboxes(sectionId, selectedResources) {
  const section = document.getElementById(sectionId);
  section.innerHTML = "";

  const resources = Object.keys(resourceMetadata);
  const resourcesPerColumn = Math.ceil(resources.length / 3);

  const containers = [document.createElement("div"), document.createElement("div"), document.createElement("div")];
  containers.forEach((container) => {
    container.style.display = "flex";
    container.style.flexDirection = "column";
    section.appendChild(container);
  });

  let currentContainerIndex = 0;
  let currentResourceCount = 0;

  for (const resourceId in resourceMetadata) {
    const resource = resourceMetadata[resourceId];

    const label = document.createElement("label");
    label.style.display = "flex";
    label.style.alignItems = "left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = resourceId;
    checkbox.checked = selectedResources.includes(resourceId);
    checkbox.style.marginRight = "8px"; // Add some space after the checkbox
    label.appendChild(checkbox);

    const icon = document.createElement("img");
    icon.src = resource.icon48;
    icon.alt = resource.name;
    icon.style.width = "24px";
    icon.style.marginRight = "4px"; // Add some space after the icon
    label.appendChild(icon);

    const text = document.createElement("span");
    text.textContent = resource.name;
    text.style.alignSelf = "end";
    label.appendChild(text); // Add the text after the icon

    containers[currentContainerIndex].appendChild(label);

    currentResourceCount++;
    if (currentResourceCount >= resourcesPerColumn) {
      currentResourceCount = 0;
      currentContainerIndex++;
    }
  }
}

function saveEditStation(scheduleId, stationIndex) {
  const schedule = gameState.scheduleList.find((schedule) => schedule.id === scheduleId);
  const station = schedule.stations[stationIndex];

  station.load = getSelectedResources("load-section");
  station.unload = getSelectedResources("unload-section");

  const conditionTypeSelect = document.getElementById("condition-type");
  station.condition.type = conditionTypeSelect.value;

  const conditionAmountInput = document.getElementById("condition-amount");
  station.condition.amount = parseInt(conditionAmountInput.value);

  // Update the UI to reflect the changes
  showScheduleOverlay(scheduleId);
}

function getSelectedResources(sectionId) {
  const section = document.getElementById(sectionId);
  const checkboxes = section.getElementsByTagName("input");
  const selectedResources = [];

  for (const checkbox of checkboxes) {
    if (checkbox.checked) {
      selectedResources.push(checkbox.value);
    }
  }

  return selectedResources;
}
