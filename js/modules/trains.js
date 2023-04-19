// trains.js
const addStationButtonListeners = new WeakMap();
const saveScheduleButtonListeners = new WeakMap();
const deleteScheduleButtonListeners = new WeakMap();
const closeScheduleOverlayButtonListeners = new WeakMap();
const saveEditStationButtonListeners = new Map();
const cancelEditStationButtonListeners = new Map();

document.addEventListener("DOMContentLoaded", function () {
  const scheduleOverlay = document.getElementById("schedule-overlay");
  const addScheduleButton = document.getElementById("add-schedule");

  // Add an event listener for the "Buy Train" button
  const buyTrainButton = document.getElementById("buy-train-button");
  buyTrainButton.addEventListener("click", buyTrain);

  // Click event listener to close the train menu when clicking outside of it
  document.addEventListener("click", (event) => {
    const trainMenu = document.getElementById("trainMenu");
    const trainMenuButton = document.querySelector(`[id^="edit-train-"]`);

    if (
      !trainMenu.contains(event.target) &&
      !trainMenuButton.contains(event.target)
    ) {
      trainMenu.classList.add("hidden");
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
    console.log("open with id", trainId);
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
});

// Train constructor
function Train(id, name, scheduleId) {
  this.id = id;
  this.name = name;
  this.scheduleId = scheduleId;
  this.currentAction = "Waiting";
  this.acceleration = 1;
  this.maxSpeed = 10;
  this.cargo = [
    /*
    stone: 100,
    ironOre: 150,
    */
  ];
  this.maxCargo = 1000;
}

// Schedule constructor
function Schedule(id, name, stations) {
  this.id = id;
  this.name = name;
  this.stations = stations;
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
  console.log(scheduleId);
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
  console.log(train);

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
  // Buy a new train
  // Deduct the train cost from the player's resources (skip cost logic for now)

  // Add a new train to the train list
  const id = generateUniqueTrainId();
  const name = `Train ${id}`;
  const emptySchedule = [];
  addTrain(name, emptySchedule);

  // Update the UI to reflect the changes (handled by addTrain function)
}

function sellTrain(trainId) {
  // Sell a train
  // Add the train's value to the player's resources (skip cost logic for now)

  // Remove the train from the train list
  removeTrain(trainId);

  // Update the UI to reflect the changes (handled by removeTrain function)
}

//---------------------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------- Game Logic Functions -------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------


function calculateCargoSpace(cargo) {
  let totalSpace = 0;

  for (const resource in cargo) {
    const resourceAmount = cargo[resource];
    const resourceDensity = resourceMetadata[resource]?.density || 1;
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
      Math.abs(endParcel.cluster - startParcel.cluster) * 20;
    distances.push(distanceScenario1);

    // Scenario 2: Leave via the last parcel of the start cluster and enter via the last parcel of the end cluster
    const distanceScenario2 =
      (startClusterParcels.length - 1 - startClusterParcels.indexOf(startParcel)) +
      (endClusterParcels.length - 1 - endClusterParcels.indexOf(endParcel)) +
      Math.abs(endParcel.cluster - startParcel.cluster) * 20;
    distances.push(distanceScenario2);

    return Math.min(...distances);
  }
}

//---------------------------------------------------------------------------------------------------------------------------------------
// ----------------------------------------------------------- UI Functions -------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------

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
    const currentActionCell = document.createElement("td");
    const cargoCell = document.createElement("td");

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

    currentActionCell.textContent = train.currentAction;
    cargoCell.textContent = `${currentCargoSpace} / ${train.maxCargo}`;

    row.appendChild(nameCell);
    row.appendChild(scheduleCell);
    row.appendChild(currentActionCell);
    row.appendChild(cargoCell);

    trainTableBody.appendChild(row);
  });
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
    console.log(selectedScheduleId);
    updateTrain(trainId, null, selectedScheduleId);
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
  const trainCount = gameState.trainList.filter(train => train.schedule === schedule.id).length;
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

  // Create the overlay and its content
  const overlay = document.getElementById("schedule-overlay");
  overlay.style.display = "block";

  const scheduleNameInput = document.getElementById("schedule-name");
  scheduleNameInput.value = schedule.name;

  // Populate the Dropdown with available Stations
  populateStationsDropdown();

  // Populate the stations table with data from the schedule
  const stationsTableBody = document.getElementById("stations-table").querySelector("tbody");
  stationsTableBody.innerHTML = "";

  schedule.stations.forEach((station, index) => {
    // Get parcel and cluster data (replace with your actual data retrieval methods)
    console.log(station);
    const parcel = parcels.parcelList.find(p => p.id === station.parcelId);
    const cluster = parcel.cluster;

    // Create a table row for each parcel in the schedule
    const row = document.createElement("tr");

    // Add the table cells and their content
    const nameCell = document.createElement("td");
    nameCell.textContent = parcel.name;
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
  const stationParcels = parcels.parcelList.filter(parcel => {
    return parcel.buildings && parcel.buildings.trainStation && parcel.buildings.trainStation > 0;
  });

  // Add station parcels as options to the dropdown
  stationParcels.forEach(stationParcel => {
    const option = document.createElement("option");
    option.value = stationParcel.id;
    option.textContent = stationParcel.name;
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
