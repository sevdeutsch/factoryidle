document.addEventListener("DOMContentLoaded", () => {
  const parcelManipulationMenuButton = document.getElementById("parcelManipulationMenuButton");
  const parcelManipulationMenu = document.getElementById("parcelManipulationMenu");

  parcelManipulationMenuButton.addEventListener("click", () => {
    parcelManipulationMenu.classList.toggle("hidden");
  });

  document.addEventListener("click", (event) => {
    // Check if the click is outside the menu and its button
    if (
      !parcelManipulationMenuButton.contains(event.target) &&
      !parcelManipulationMenu.contains(event.target)
    ) {
      parcelManipulationMenu.classList.add("hidden");
    }
  });

  // Rename
  document.getElementById('renameDropdownItem').addEventListener('click', () => {
      document.getElementById('renameParcelOverlay').style.display = 'flex';
      const input = document.getElementById('parcelNameInput')
      input.value = "";
      input.focus();
      input.addEventListener("keypress", (event) => {
        if (event.key === "Enter")
          document.getElementById("renameParcelButton").click();
      });
  });

  document.getElementById('renameParcelButton').addEventListener('click', () => {
      document.getElementById('parcelNameInput').removeEventListener("keypress", event)
      parcelManipulation.renameParcel();
      document.getElementById('renameParcelOverlay').style.display = 'none';
  });

  document.getElementById('closeRenameParcelOverlay').addEventListener('click', () => {
      document.getElementById('renameParcelOverlay').style.display = 'none';
  });

  // Change Color
  document.getElementById('changeColorDropdownItem').addEventListener('click', () => {
      document.getElementById('colorPickerOverlay').style.display = 'flex';
  });

  document.getElementById('applyColorButton').addEventListener('click', () => {
      parcelManipulation.changeParcelColor();
      document.getElementById('colorPickerOverlay').style.display = 'none';
  });

  document.getElementById('closeColorPickerOverlay').addEventListener('click', () => {
      document.getElementById('colorPickerOverlay').style.display = 'none';
  });

  document.getElementById('reset-color-btn').addEventListener('click', () => {
    parcelManipulation.resetColor();
    document.getElementById('colorPickerOverlay').style.display = 'none';
  });

  // Move
  document.getElementById('moveDropdownItem').addEventListener('click', () => {
      document.getElementById('moveParcelOverlay').style.display = 'flex';
  });

  document.getElementById('moveParcelButton').addEventListener('click', () => {
      parcelManipulation.moveParcel();
  });

  document.getElementById('closeMoveParcelOverlay').addEventListener('click', () => {
      document.getElementById('moveParcelOverlay').style.display = 'none';
  });

  // Handle increase and decrease move amount button clicks
  document.getElementById('decreaseMoveAmount').addEventListener('click', () => {
      const moveInput = document.getElementById('parcelMoveInput');
      const currentValue = parseInt(moveInput.value, 10);
      moveInput.value = currentValue - 1;
  });

  document.getElementById('increaseMoveAmount').addEventListener('click', () => {
      const moveInput = document.getElementById('parcelMoveInput');
      const currentValue = parseInt(moveInput.value, 10);
      moveInput.value = currentValue + 1;
  });

  // Copy & paste
  document.getElementById("copyDropdownItem").addEventListener("click", () => {
    const selectedParcelIndex = ui.getSelectedParcelIndex();
    clipboard.copyParcel(selectedParcelIndex);
    parcelManipulationMenu.classList.add("hidden");
  });

  document.getElementById("pasteDropdownItem").addEventListener("click", () => {
    if (clipboard.isParcelCopied()) {
      const selectedParcelIndex = ui.getSelectedParcelIndex();
      clipboard.showPasteSummary(selectedParcelIndex);
      parcelManipulationMenu.classList.add("hidden");
    } else {
      alert("No parcel has been copied. Please copy a parcel before pasting.");
      parcelManipulationMenu.classList.add("hidden");
    }
  });

});

const clipboard = (() => {
  let copiedParcelIndex = null;
  let isCopied = false;

  function copyParcel(index) {
    copiedParcelIndex = index;
    isCopied = true;
  }

  function isParcelCopied() {
    return isCopied;
  }

  function calculatePasteCosts(sourceParcel, targetParcel) {
    const requiredUpgrades = calculateRequiredBuildingLimitUpgrades(sourceParcel, targetParcel);
    const netBuildingCosts = calculateNetBuildingCosts(sourceParcel, targetParcel);
    return {
      requiredUpgrades,
      netBuildingCosts,
    };
  }

  function calculateRequiredBuildingLimitUpgrades(sourceParcel, targetParcel) {
    const requiredBuildings = Object.values(sourceParcel.buildings).reduce((a, b) => a + b, 0);
    let requiredUpgradeLevel = -1;

    for (const [index, upgrade] of parcels.upgradeCosts.maxBuildingLimit.entries()) {
      if (upgrade.maxBuildingLimit >= requiredBuildings) {
        requiredUpgradeLevel = index+1;
        break;
      }
    }

    if (requiredUpgradeLevel < 0 || targetParcel.upgrades.maxBuildingLimit >= requiredUpgradeLevel) {
      return [];
    }

    return parcels.upgradeCosts.maxBuildingLimit.slice(targetParcel.upgrades.maxBuildingLimit, requiredUpgradeLevel);
  }

  function calculateNetBuildingCosts(sourceParcel, targetParcel) {
    const buildingManager = window.buildingManager;
    const netCosts = {};

    for (const buildingId in sourceParcel.buildings) {
      const required = sourceParcel.buildings[buildingId];
      const existing = targetParcel.buildings[buildingId] || 0;
      const difference = required - existing;

      if (difference > 0) {
        const building = buildingManager.getBuilding(buildingId);
        for (const [resourceName, cost] of Object.entries(building.cost)) {
          if (!netCosts[resourceName]) {
            netCosts[resourceName] = 0;
          }
          netCosts[resourceName] += cost * difference;
        }
      }
    }
    return netCosts;
  }

  function calculateTotalCost(pasteCosts) {
    const totalCost = {};

    // Handle requiredUpgrades
    for (const upgrade of pasteCosts.requiredUpgrades) {
      for (const resourceName in upgrade.cost) {
        if (upgrade.cost.hasOwnProperty(resourceName) && typeof resourceName === "string") {
          if (totalCost[resourceName] === undefined) {
            totalCost[resourceName] = 0;
          }
          totalCost[resourceName] += upgrade.cost[resourceName];
        }
      }
    }

    // Handle netBuildingCosts
    for (const resourceName in pasteCosts.netBuildingCosts) {
      if (pasteCosts.netBuildingCosts.hasOwnProperty(resourceName) && typeof resourceName === "string") {
        if (totalCost[resourceName] === undefined) {
          totalCost[resourceName] = 0;
        }
        totalCost[resourceName] += pasteCosts.netBuildingCosts[resourceName];
      }
    }
    return totalCost;
  }


  function canAffordPaste(targetParcel, totalCost) {
    const buildingManager = window.buildingManager;
    for (const [resourceName, cost] of Object.entries(totalCost)) {
      const totalResource = (targetParcel.resources[resourceName] || 0) + buildingManager.getResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resourceName);
      if (totalResource < cost) {
        return false;
      }
    }
    return true;
  }

  function showPasteSummary(targetParcelIndex) {
    const sourceParcel = window.parcels.parcelList[copiedParcelIndex];
    const targetParcel = window.parcels.parcelList[targetParcelIndex];

    const pasteCosts = calculatePasteCosts(sourceParcel, targetParcel);
    const totalCost = calculateTotalCost(pasteCosts);
    const canAfford = canAffordPaste(targetParcel, totalCost);

    // Update the paste summary content
    const pasteSummaryContent = document.getElementById("pasteSummaryContent");
    pasteSummaryContent.innerHTML = generatePasteSummaryHtml(pasteCosts, totalCost, canAfford, targetParcelIndex);

    // Show the paste summary overlay
    const pasteSummaryOverlay = document.getElementById("pasteSummaryOverlay");
    pasteSummaryOverlay.style.display = "flex";

    // Set up the "Confirm" and "Cancel" buttons
    const confirmButton = document.getElementById("confirmPasteButton");
    const cancelButton = document.getElementById("cancelPasteButton");

    // Add new event listeners
    confirmButton.disabled = !canAfford;
    confirmButton.addEventListener("click", onConfirmButtonClick);

    cancelButton.addEventListener("click", onCancelButtonClick);

    function onConfirmButtonClick() {
      executePaste(sourceParcel, targetParcel, pasteCosts);
      copyCustomizations(sourceParcel, targetParcel);
      pasteSummaryOverlay.style.display = "none";
      // Remove event listeners to avoid multiple executions
      confirmButton.removeEventListener("click", onConfirmButtonClick);
      cancelButton.removeEventListener("click", onCancelButtonClick);
    }

    function onCancelButtonClick() {
      pasteSummaryOverlay.style.display = "none";
      // Remove event listeners to avoid multiple executions
      confirmButton.removeEventListener("click", onConfirmButtonClick);
      cancelButton.removeEventListener("click", onCancelButtonClick);
    }
  }

  function generatePasteSummaryHtml(pasteCosts, totalCost, canAfford, targetParcelIndex) {
    let html = `
      <h2>Paste Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Resource</th>
            <th>Amount Needed</th>
            <th>Amount Stored</th>
            <th>Amount Stored After</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Combine resource costs from required upgrades and net building costs
    const combinedCosts = {};

    for (const [resource, amount] of Object.entries(totalCost)) {
      if (!combinedCosts[resource]) {
        combinedCosts[resource] = 0;
      }
      combinedCosts[resource] += amount;
    }

    // Add combined resource costs to the table
    for (const [resource, amountNeeded] of Object.entries(combinedCosts)) {
      const amountStored = (parcels.parcelList[targetParcelIndex].resources[resource] || 0) + buildingManager.getResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resource);
      html += `
        <tr>
          <td>${resource}</td>
          <td>${parseFloat(amountNeeded).toFixed(1)}</td>
          <td>${parseFloat(amountStored).toFixed(1)}</td>
          <td>${parseFloat(amountStored - amountNeeded).toFixed(1)}</td>
        </tr>
      `;
    }

    html += `
        </tbody>
      </table>
      <p>${canAfford ? "You can afford this paste operation." : "You cannot afford this paste operation."}</p>
    `;

    return html;
  }

  function executePaste(sourceParcel, targetParcel, pasteCosts) {
    // Buy the required building limit upgrades
    for (const upgrade of pasteCosts.requiredUpgrades) {
      parcels.upgradeParcel(targetParcel, 'maxBuildingLimit');
    }

    // Sell the unnecessary buildings
    for (const buildingId in targetParcel.buildings) {
      if (!sourceParcel.buildings[buildingId]) {
        const buildingCount = targetParcel.buildings[buildingId];
        for (let i = 0; i < buildingCount; i++) {
          ui.sellBuilding(targetParcel, buildingId);
        }
      }
    }

    // Buy the necessary buildings
    for (const buildingId in sourceParcel.buildings) {
      const required = sourceParcel.buildings[buildingId];
      const existing = targetParcel.buildings[buildingId] || 0;
      const difference = required - existing;

      for (let i = 0; i < difference; i++) {
        ui.buyBuilding(targetParcel, buildingId);
      }
    }

    // Set the inputValues of the target parcel
    targetParcel.inputValues = Object.keys(sourceParcel.inputValues).reduce((acc, key) => {
      acc[key] = { ...sourceParcel.inputValues[key] };
      return acc;
    }, {});

    // Update the UI
    ui.updateBuildingDisplay(targetParcel);
  }

    function copyCustomizations(sourceParcel, targetParcel) {
      targetParcel.name = sourceParcel.name;
      targetParcel.color = sourceParcel.color;
      targetParcel.beltUsage = JSON.parse(JSON.stringify(sourceParcel.beltUsage));

      // Update UI
      for (let i = 0; i < parcels.parcelList.length; i++) {
        parcelManipulation.updateParcelTab(i);
      }
    }

  return {
    copyParcel,
    isParcelCopied,
    showPasteSummary,
    executePaste,
    // Other functions to be implemented
  };
})();

const parcelManipulation = (() => {

/* Update Parcel Tab Function */
function updateParcelTab(index) {
    const parcel = window.parcels.parcelList[index];
    const parcelTab = document.getElementById(`tab-${parcel.id}`);
    if (parcelTab) {
        const displayName = parcel.name || `parcel-${index + 1}`;
        parcelTab.textContent = displayName;

        // Update the color of the parcel tab
        if (parcel.color) {
            parcelTab.style.setProperty("background", parcel.color, "important");
        } else {
            parcelTab.style.removeProperty("background");
            parcelTab.style.removeProperty("background", "important");
        }
    }
}

/* Move Parcel Functions */
function moveParcel() {
  const moveAmount = parseInt(document.getElementById('parcelMoveInput').value);
  if (!isNaN(moveAmount)) {
    const selectedParcelIndex = ui.getSelectedParcelIndex();
    const selectedParcel = window.parcels.parcelList[selectedParcelIndex];
    const selectedParcelId = selectedParcel.id;
    const clusterId = selectedParcel.cluster || 0;

    // Filter the parcelList to get an array of parcels belonging to the same cluster
    const filteredParcelList = window.parcels.parcelList.filter(parcel => parcel.cluster === clusterId);

    const selectedIndexInFiltered = filteredParcelList.findIndex(parcel => parcel.id === selectedParcel.id);
    const newIndexInFiltered = selectedIndexInFiltered + moveAmount;

    // Check if the new index is within the bounds of the filtered list
    if (newIndexInFiltered >= 0 && newIndexInFiltered < filteredParcelList.length) {
      // Remove the selected parcel from its current position in the filtered list
      filteredParcelList.splice(selectedIndexInFiltered, 1);

      // Insert the selected parcel at the new index, shifting other parcels as needed
      filteredParcelList.splice(newIndexInFiltered, 0, selectedParcel);

      // Update the parcelList to reflect the new order
      let newIndex = 0;
      for (let i = 0; i < window.parcels.parcelList.length; i++) {
        const parcel = window.parcels.parcelList[i];
        if (parcel.cluster === clusterId) {
          window.parcels.parcelList[i] = filteredParcelList[newIndex];
          newIndex++;
        }
      }

      // Update the parcel IDs in the parcelList
      for (let i = 0; i < window.parcels.parcelList.length; i++) {
        window.parcels.parcelList[i].id = `parcel-${i + 1}`;
      }

      // After updating the parcel IDs, update the schedules
      window.gameState.scheduleList.forEach(schedule => {
        schedule.stations.forEach(station => {
          if (station.parcelId === selectedParcelId) {
            // update the parcelId to the new id
            station.parcelId = selectedParcel.id;
          }
        });
      });

      // Update the parcel tabs in the UI
      for (let i = 0; i < window.parcels.parcelList.length; i++) {
        const parcel = window.parcels.parcelList[i];
        const parcelTab = document.getElementById(`tab-${parcel.id}`);
        if (parcelTab) {
          parcelTab.id = `tab-${parcel.id}`;

          // Remove the old event listener
          const newParcelTab = parcelTab.cloneNode(true);
          parcelTab.parentNode.replaceChild(newParcelTab, parcelTab);

          // Attach the new event listener with the updated parcel id
          ui.addParcelClickListener(newParcelTab);

          parcelManipulation.updateParcelTab(i);
        }
      }

      // Select the moved parcel in its new position
      const newSelectedParcelIndex = window.parcels.parcelList.findIndex(parcel => parcel.id === selectedParcel.id);
      selectParcel(newSelectedParcelIndex);
      ui.updateResourceDisplay(parcels.getParcel(newSelectedParcelIndex));
      console.log(newSelectedParcelIndex);
      console.log(selectedParcelIndex);
      ui.updateBuildingDisplay(parcels.getParcel(newSelectedParcelIndex));
      gameLoop.updateClusterParcels();
    } else {
      alert('Invalid move amount. Please enter a valid number.');
    }
  } else {
    alert('Please enter a valid move amount.');
  }
}


function setSelectedParcelIndex(index) {
    selectedParcelIndex = index;
}

function selectParcel(index) {
    const parcelTab = document.getElementById(`tab-${window.parcels.parcelList[index].id}`);
    if (parcelTab) {
        const prevSelected = document.querySelector(".parcel-tab.selected");
        if (prevSelected) {
            prevSelected.classList.remove("selected");
        }
        parcelTab.classList.add("selected");
        setSelectedParcelIndex(index);
        ui.selectParcel(index);
        ui.updateResourceDisplay(parcels.getParcel(index));
        ui.updateBuildingDisplay(parcels.getParcel(index));
    }
}

/* Change Color Functions */
function changeParcelColor() {
    const selectedColor = document.getElementById('colorPickerInput').value;
    if (selectedColor) {
        const selectedParcelIndex = ui.getSelectedParcelIndex();
        window.parcels.parcelList[selectedParcelIndex].color = selectedColor;
        updateParcelTab(selectedParcelIndex);
    } else {
        alert('Please select a valid color for the parcel.');
    }
}

function resetColor() {
  // Remove the color attribute from the selected parcel
  const selectedParcelIndex = ui.getSelectedParcelIndex();
  delete window.parcels.parcelList[selectedParcelIndex].color;
  updateParcelTab(selectedParcelIndex);
}

/* Rename Parcel Functions */
function renameParcel() {
    const newName = document.getElementById('parcelNameInput').value;
    if (newName) {
        const selectedParcelIndex = ui.getSelectedParcelIndex();
        window.parcels.parcelList[selectedParcelIndex].name = newName;
        updateParcelTab(selectedParcelIndex);
    } else {
        alert('Please enter a valid name for the parcel.');
    }
}

return {
    updateParcelTab,
    moveParcel,
    renameParcel,
    resetColor,
    changeParcelColor,
    selectParcel,
};

})();
