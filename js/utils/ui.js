const ui = (() => {
  const parcelContainer = document.getElementById("parcels");
  const buildingDisplay = document.getElementById("buildings");
  let selectedParcelIndex = 0;
  let createRowCounter = 0;

  class ResourceTable {
    constructor(parcel) {
      this.parcel = parcel;
      this.tableElement = document.getElementById("resourceTable");
      this.eventListeners = new WeakMap();
      this.columns = [
        {
          label: "Resource",
          id: "resource",
        },
        {
          label: "Amount",
          id: "amount"
        },
        {
          label: "Ø Production",
          id: "productionRate",
          display: "none"
        },
        {
          label: "Active Buildings",
          id: "activeBuildings",
          display: "none"
        },
        {
          label: "Total Building",
          id: "totalBuildings",
          display: "none"
        },
        {
          label: "Backward 0/0",
          id: "backwardBelt",
          display: "none"
        },
        {
          label: "Forward 0/0",
          id: "forwardBelt",
          display: "none"
        }
      ];
    }

    update() {
      // If the table is empty, create the header row
      if (this.tableElement.innerHTML === "") {
        this.createHeader();
      }

      // Update the Parcel Name Display
      const parcelTitle = document.getElementById("parcelNameDisplay");
      if (parcels.parcelList[selectedParcelIndex].name) {
        parcelTitle.textContent = parcels.parcelList[selectedParcelIndex].name;
      } else {
        parcelTitle.textContent = parcels.parcelList[selectedParcelIndex].id;
      }

      // Update the header row
      this.updateHeader();

      // Iterate over each resource in the parcel
      for (const category of window.resourceMetadata) {
        for (const resource of category.resources) {
          const resourceName = resource.name;
          if (this.parcel.resources.hasOwnProperty(resourceName)) {
            const rowId = `resourceRow-${resourceName}`;
            let row = document.getElementById(rowId);
            this.updateRow(resource, row);
          }
        }
      }

      // Add tooltips to the Buy buttons
      this.addTooltipToButtons(".buy-building-resource", this.parcel);

      // Add tooltips to the resource names
      this.addResourceTooltips(this.parcel);
    }

    addEventListenerToButtons(buttonClass, actionFunction, buttonElement = null) {
      const buttons = buttonElement ? [buttonElement] : this.tableElement.querySelectorAll(buttonClass);
      buttons.forEach((button) => {
        // Create a new event listener
        const newListener = (event) => {
          const buildingId = event.target.dataset.buildingId;
          actionFunction(this.parcel, buildingId, event);
        };

        // Add the new event listener and store it in the WeakMap
        button.addEventListener("click", newListener);
        this.eventListeners.set(button, newListener);

        // Mark the button as having an event listener attached
        button.dataset.listenerAttached = 'true';
      });
    }

    addTooltipToButtons(buttonClass, parcel) {
      const buttons = this.tableElement.querySelectorAll(buttonClass);
      buttons.forEach((button) => {

        // Show tooltip on mouseover for Buy buttons only
        if (buttonClass.includes("buy-building") && button.dataset.tooltipListenerAttached !== 'true') {
          button.addEventListener("mouseover", (event) => {
            const buildingId = event.target.dataset.buildingId;
            const building = buildingManager.getBuilding(buildingId);
            const costText = Object.entries(building.cost)
              .map(([resource, cost]) => `${cost} ${resource}`)
              .join("<br>");
            const buyText = `Cost:<br>${costText}`;

            tooltip.innerHTML = buyText;
            tooltip.style.display = "block";
            tooltip.style.left = event.pageX + 10 + "px";
            tooltip.style.top = event.pageY + 10 + "px";
          });

          // Hide tooltip on mouseout
          button.addEventListener("mouseout", () => {
            tooltip.style.display = "none";
          });

          // Update tooltip position on mousemove
          button.addEventListener("mousemove", (event) => {
            tooltip.style.left = event.pageX + 10 + "px";
            tooltip.style.top = event.pageY + 10 + "px";
          });

          // Mark the button as having tooltip event listeners attached
          button.dataset.tooltipListenerAttached = 'true';
        }
      });
    }

    addResourceTooltips(parcel) {
      const resourceNames = this.tableElement.querySelectorAll(".resource-name");
      resourceNames.forEach((resourceName) => {
        if (resourceName.dataset.tooltipListenerAttached !== 'true') {
          resourceName.addEventListener("mouseover", (event) => {
            if (event.target.classList.contains('exclude')) {
                return;
            }
            const name = resourceName.parentNode.id.split('-')[1];
            const resource = buildingManager.getBuildingByResourceName(name);
            if (resource) {
              const buildingCount = parcel.buildings[resource.id];
              const buildingCountChecked = buildingCount || 0;

              const inputText = Object.entries(resource.inputs || {})
                .map(([inputResource, amount]) => `${amount} ${inputResource}`)
                .join("<br>");
              const outputText = Object.entries(resource.outputs || {})
                .map(([outputResource, amount]) => `${amount} ${outputResource}`)
                .join("<br>");

              const totalInputText = Object.entries(resource.inputs || {})
                .map(([inputResource, amount]) => `${amount * buildingCountChecked} ${inputResource}`)
                .join("<br>");
              const totalOutputText = Object.entries(resource.outputs || {})
                .map(([outputResource, amount]) => `${amount * buildingCountChecked} ${outputResource}`)
                .join("<br>");

              const productionRateModifier = gameLoop.calculateProductionRateModifier(parcel, resource, buildingCount);
              const consumptionRateModifier = gameLoop.calculateConsumptionRateModifier(parcel, resource, buildingCount);

              const modifiedInputText = Object.entries(resource.inputs || {})
                .map(([inputResource, amount]) => `${(amount * (consumptionRateModifier)).toFixed(2)} ${inputResource}`)
                .join("<br>");
              const modifiedOutputText = Object.entries(resource.outputs || {})
                .map(([outputResource, amount]) => `${(amount * (productionRateModifier)).toFixed(2)} ${outputResource}`)
                .join("<br>");



              const totalModifiedInputText = Object.entries(resource.inputs || {})
                .map(([inputResource, amount]) => `${(amount * buildingCountChecked * (consumptionRateModifier)).toFixed(2)} ${inputResource}`)
                .join("<br>");
              const totalModifiedOutputText = Object.entries(resource.outputs || {})
                .map(([outputResource, amount]) => `${(amount * buildingCountChecked * (productionRateModifier)).toFixed(2)} ${outputResource}`)
                .join("<br>");
              const tooltipText = `
              <table>
              <tbody>

              <thead>
                <tr>
                  <th colspan="3" style="text-align: left;"><b>Total (Modified)</b></th>
                </tr>
              </thead>
              <tr>
                <td>${totalModifiedInputText || "-"}</td>
                <td> &#x2192; </td>
                <td>${totalModifiedOutputText || "-"}</td>
              </tr>

                <thead>
                  <tr>
                    <th colspan="3" style="text-align: left;"><b>Modified</b></th>
                  </tr>
                </thead>

                  <tr>
                    <td>${modifiedInputText || "-"}</td>
                    <td> &#x2192; </td>
                    <td>${modifiedOutputText || "-"}</td>
                  </tr>

                  <tr>
                    <td>${consumptionRateModifier !== undefined
                  ? (consumptionRateModifier > 1 ? "+" : "") + Math.round((consumptionRateModifier - 1) * 100) + "%"
                  : ""
                }</td>
                    <td></td>
                    <td>${productionRateModifier !== undefined
                  ? (productionRateModifier > 1 ? "+" : "") + Math.round((productionRateModifier - 1) * 100) + "%"
                  : ""
                }</td>
                  </tr>

                  <thead>
                    <tr>
                      <th colspan="3" style="text-align: left;"><b>Total (Default)</b></th>
                    </tr>
                  </thead>
                  <tr>
                    <td>${totalInputText || "-"}</td>
                    <td> &#x2192; </td>
                    <td>${totalOutputText || "-"}</td>
                  </tr>

                  <thead>
                    <tr>
                      <th colspan="3" style="text-align: left;"><b>Default</b></th>
                    </tr>
                  </thead>
                    <tr>
                      <td>${inputText || "-"}</td>
                      <td> &#x2192; </td>
                      <td>${outputText || "-"}</td>
                    </tr>
                </tbody>
              </table>`;

              tooltip.innerHTML = tooltipText;
              tooltip.style.display = "block";
              tooltip.style.left = event.pageX + 10 + "px";
              tooltip.style.top = event.pageY + 10 + "px";
            }
          });

          resourceName.addEventListener("mouseout", () => {
            tooltip.style.display = "none";
          });

          resourceName.addEventListener("mousemove", (event) => {
            tooltip.style.left = event.pageX + 10 + "px";
            tooltip.style.top = event.pageY + 10 + "px";
          });
          // Mark the resourceName as having tooltip event listeners attached
          resourceName.dataset.tooltipListenerAttached = 'true';
        }
      });
    }

    createHeader() {
      const headerRow = document.createElement("tr");
      this.columns.forEach((column) => {
        const headerCell = document.createElement("th");
        headerCell.textContent = column.label;
        headerCell.id = `${column.id}-header`;
        headerCell.classList.add("header");
        if (column.display === "none") {
          headerCell.style.display = "none";
        }
        headerRow.appendChild(headerCell);
      });
      this.tableElement.appendChild(headerRow);
    }

    updateHeader() {
      // Function to create an img element with the given src
      const createIcon = (src) => {
        const img = document.createElement("img");
        img.src = src;
        img.style.width = "24px";
        img.style.height = "24px";
        img.style.marginLeft = "4px";
        img.style.marginRight = "4px";
        img.style.verticalAlign = "middle";
        return img;
      };

      const headerRow = document.createElement("tr");
      this.columns.forEach((column) => {
        if (column.id === "forwardBelt") {
          let forwardHeader = document.querySelector("[id^='forwardBelt-header']");
          if (forwardHeader) {
            const forwardIcon = createIcon("assets/forwardBelt-48.png");
            const forwardBeltCount = this.parcel.beltUsage?.forwardBelt ?? 0;
            const totalForwardBeltCount = window.parcels.parcelList.reduce((sum, parcel) => sum + ((parcel.cluster === this.parcel.cluster) ? (parcel.buildings["beltBus"] || 0) : 0), 0);
            forwardHeader.innerHTML = "";
            forwardHeader.appendChild(forwardIcon);
            forwardHeader.appendChild(document.createTextNode(`Forward ${forwardBeltCount}/${totalForwardBeltCount}`));
            if (forwardHeader.style.display === "none" && totalForwardBeltCount !== 0) {
              forwardHeader.style.display = "";
            }
          }
        } else if (column.id === "backwardBelt") {
          let backwardHeader = document.querySelector("[id^='backwardBelt-header']");
          if (backwardHeader) {
            const backwardIcon = createIcon("assets/backwardBelt-48.png");
            const backwardBeltCount = this.parcel.beltUsage?.backwardBelt ?? 0;
            const totalBackwardBeltCount = window.parcels.parcelList.reduce((sum, parcel) => sum + ((parcel.cluster === this.parcel.cluster) ? (parcel.buildings["beltBus"] || 0) : 0), 0);

            backwardHeader.innerHTML = "";
            backwardHeader.appendChild(backwardIcon);
            backwardHeader.appendChild(document.createTextNode(`Backward ${backwardBeltCount}/${totalBackwardBeltCount}`));
            if (backwardHeader.style.display === "none" && totalBackwardBeltCount !== 0) {
              backwardHeader.style.display = "";
            }
          }
        } else if (column.id === "productionRate" || column.id === "activeBuildings" || column.id === "totalBuildings") {
          let selector = `[id^='${column.id}-header']`;
          const header = document.querySelector(selector);
          if (
            (progressionManager.isUnlocked("ironMiner") ||
              progressionManager.isUnlocked("stoneMiner") ||
              progressionManager.isUnlocked("coalMiner")) &&
            header.style.display === "none"
          ) {
            header.style.display = "";
          }
        }
      });
      this.tableElement.appendChild(headerRow);
    }

    createRow(resourceName) {
      /*const building = buildingManager.getBuildingByResourceName(resourceName);
      const row = document.createElement("tr");
      row.id = `resourceRow-${this.parcel.id}-${resourceName}`;

      // Create the resource name cell
      const nameCell = document.createElement("td");
      nameCell.classList.add("resource-name");
      nameCell.style.whiteSpace = "nowrap";

      const textWrapper = document.createElement("div");

      // Create the icon element
      const resourceData = resourceMetadata[resourceName];
      const icon = document.createElement("img");
      icon.src = resourceData.icon48;
      icon.style.width = "24px"; // Adjust the size as needed
      icon.style.height = "24px"; // Adjust the size as needed
      icon.style.verticalAlign = "middle";
      icon.style.marginRight = "5px"; // Add some margin between the icon and the text
      textWrapper.appendChild(icon);

      // Insert the text after the icon
      textWrapper.insertAdjacentText('beforeend', resourceName);

      textWrapper.style.display = "inline-block";
      textWrapper.style.verticalAlign = "-webkit-baseline-middle";
      nameCell.appendChild(textWrapper);

      // Create button inside name cell
      if (building && building.minable) {
        const mineButton = this.createMineButton(resourceName);
        mineButton.style.display = "inline-block";
        mineButton.style.verticalAlign = "-webkit-baseline-middle";
        mineButton.style.float = "right";
        mineButton.style.marginLeft = "1em"
        nameCell.appendChild(mineButton);
      }

      row.appendChild(nameCell);

      //row.appendChild(this.createCell(resourceName));

      // Get the color from getResourceRateColor and apply it to the resource amount cell
      const color = getResourceRateColor(this.parcel, resourceName);
      const resourceCell = this.createCell(Math.round(this.parcel.resources[resourceName] * 10) / 10, color);
      row.appendChild(resourceCell);
      //
      // // Create the utilization cell
      // const utilization = this.parcel.utilization && this.parcel.utilization[building.id] ? this.parcel.utilization[building.id].percentage : 0;
      // const roundedUtilization = Math.ceil(utilization);
      // const utilizationCell = this.createCell(`${roundedUtilization}%`);
      // row.appendChild(utilizationCell);

      // Get a reference to the tooltip element
      const tooltip = document.getElementById("tooltip");

      // Display bottleneck information on mouseover
      resourceCell.addEventListener("mouseover", (event) => {
        if (this.parcel.utilization && this.parcel.utilization[building.id]) {
          const bottleneckInfo = this.parcel.utilization[building.id].bottlenecks;
          const bottleneckText = Object.entries(bottleneckInfo)
            .map(([resource, amount]) => `${resource}: ${amount.toFixed(2)}`)
            .join(", ");

          if(bottleneckText === "") {
            tooltip.innerHTML = `✅`;
          } else {
            tooltip.innerHTML = `⏳: ${bottleneckText}`;
          }

          tooltip.style.display = "block";
          tooltip.style.left = event.pageX + 10 + "px";
          tooltip.style.top = event.pageY + 10 + "px";
        }
      });

      // Hide the tooltip on mouseout
      resourceCell.addEventListener("mouseout", () => {
        tooltip.style.display = "none";
      });

      // Update the tooltip position on mousemove
      resourceCell.addEventListener("mousemove", (event) => {
        tooltip.style.left = event.pageX + 10 + "px";
        tooltip.style.top = event.pageY + 10 + "px";
      });

      //Create productionRate cells
      const productionRateCell = document.createElement("td");
      row.appendChild(productionRateCell);

      const countCell = document.createElement("td"); // Create a new cell for the building count
      if (building) {
        if (
          progressionManager.isUnlocked("ironMiner") &&
          progressionManager.isUnlocked("stoneMiner") &&
          progressionManager.isUnlocked("coalMiner")
        ) {
          countCell.textContent = this.parcel.buildings[building.id] || 0; // Display the number of built buildings
        } else {
          countCell.textContent = ""; // Hide the content if the required buildings are not unlocked
        }
      }
      row.appendChild(countCell);

      const productionCell = document.createElement("td");
      if (building) {
        const buildingCount = this.parcel.buildings[building.id] || 0;
        if (
          buildingCount > 0 &&
          progressionManager.isUnlocked("ironMiner") &&
          progressionManager.isUnlocked("stoneMiner") &&
          progressionManager.isUnlocked("coalMiner")
        ) {
          productionCell.innerHTML = `
            <button data-building-id="${building.id}" class="buy-building-resource">Buy</button>
            <button data-building-id="${building.id}" class="sell-building-resource">Sell</button>
          `;
        } else {
          productionCell.textContent = ""; // Hide the content if the required buildings are not unlocked
        }
      }
      row.appendChild(productionCell);

      // Create input fields for forward and backward belts
      const beltTypes = ["backwardBelt", "forwardBelt"];
      beltTypes.forEach((beltId, index) => {
        const beltController = this.createDirectionInput(beltId, resourceName);
        const beltUsage = this.parcel.beltUsage ? this.parcel.beltUsage[beltId] || 0 : 0;
        const beltCount = window.parcels.parcelList.reduce((sum, parcel) => sum + (parcel.buildings["beltBus"] || 0), 0);
        //const beltCount = this.parcel.buildings[beltId] * 2 || 0;

        const cell = this.createCell(beltController);
        cell.style.display = "none"; // Initially hide the Forward and Backward cells
        row.appendChild(cell);

        if (beltCount > 0) {
          const headerId = `${beltId === "forwardBelt" ? "forward" : "backward"}BeltHeader-${this.parcel.id}`;
          const headerElement = document.getElementById(headerId);
          headerElement.style.display = ""; // Unhide the header if the belt has been built

          const labelId = `${beltId === "forwardBelt" ? "forward" : "backward"}BeltHeader-${this.parcel.id}`;
          const labelElement = document.getElementById(labelId);
          labelElement.textContent = `${beltId === "forwardBelt" ? "Forward" : "Backward"} ${beltUsage}/${beltCount}`;

          cell.style.display = ""; // Unhide the cell if the belt has been built
        }
      });

      return row;
      */
    }



    createResourceName(resource, cell) {
      cell.classList.add("resource-name");
      cell.style.whiteSpace = "nowrap";

      const textWrapper = document.createElement("div");
      const icon = document.createElement("img");
      icon.src = resource.icon48;
      icon.style.width = "24px"; // Adjust the size as needed
      icon.style.height = "24px"; // Adjust the size as needed
      icon.style.verticalAlign = "middle";
      icon.style.marginRight = "5px"; // Add some margin between the icon and the text
      icon.classList.add("resource-icon")
      textWrapper.appendChild(icon);

      textWrapper.insertAdjacentText('beforeend', resource.name);
      textWrapper.style.display = "contents";
      textWrapper.style.verticalAlign = "-webkit-baseline-middle";

      cell.appendChild(textWrapper);



      return cell;
    }

    getColorFromPercentage(pct) {
      const percentColors = [
        { pct: 0.0, color: { r: 128, g: 0, b: 0 } },
        { pct: 0.5, color: { r: 128, g: 80, b: 0 } },
        { pct: 1.0, color: { r: 0, g: 128, b: 0 } }];

      for (var i = 1; i < percentColors.length - 1; i++) {
        if (pct < percentColors[i].pct) {
          break;
        }
      }
      var lower = percentColors[i - 1];
      var upper = percentColors[i];
      var range = upper.pct - lower.pct;
      var rangePct = (pct - lower.pct) / range;
      var pctLower = 1 - rangePct;
      var pctUpper = rangePct;
      var color = {
        r: Math.floor(lower.color.r * pctLower + upper.color.r * pctUpper),
        g: Math.floor(lower.color.g * pctLower + upper.color.g * pctUpper),
        b: Math.floor(lower.color.b * pctLower + upper.color.b * pctUpper)
      };
      return 'rgba(' + [color.r, color.g, color.b, 0.5].join(',') + ')';
    }

    updateRow(resource, row) {
      const resourceName = resource.name;
      const building = buildingManager.getBuildingByResourceName(resourceName);
      if (row === null) {
        row = document.createElement("tr");
        row.id = `resourceRow-${resourceName}`;
        this.tableElement.appendChild(row);
      }
      this.columns.forEach((column) => {
        let cell = document.getElementById(`${resourceName}-${column.id}-cell-resourceName`);
        const header = document.getElementById(`${column.id}-header`);
        let isInit = false;
        if (cell === null && header) {
          isInit = true;
          cell = document.createElement("td");
          cell.id = `${resourceName}-${column.id}-cell-resourceName`;
          if (header.style.display === "none") {
            cell.style.display = "none";
          }
          row.appendChild(cell);
        }
        if (header.style.display !== "none" && cell.style.display === "none") {
          cell.style.display = "";
        }
        if (header.style.display != "none") {
          // update the cell only if the header is displayed
          if (column.id === 'resource') {
            if (isInit) {
              //init
              cell = this.createResourceName(resource, cell)




              if (building && building.minable) {
                const mineButton = this.createMineButton(resourceName);
                cell.appendChild(mineButton);
              }
            }
            //update
          } else if (column.id === 'amount') {
            if (isInit) {
              //init
              const tooltip = document.getElementById("tooltip");

              // Display bottleneck information on mouseover
              cell.addEventListener("mouseover", (event) => {
                if (this.parcel.utilization && this.parcel.utilization[building.id]) {
                  const bottleneckInfo = this.parcel.utilization[building.id].bottlenecks;
                  const bottleneckText = Object.entries(bottleneckInfo)
                    .map(([resource, amount]) => `${resource}: ${amount.toFixed(2)}`)
                    .join(", ");

                  if (bottleneckText === "") {
                    tooltip.innerHTML = `✅`;
                  } else {
                    tooltip.innerHTML = `⏳: ${bottleneckText}`;
                  }

                  tooltip.style.display = "block";
                  tooltip.style.left = event.pageX + 10 + "px";
                  tooltip.style.top = event.pageY + 10 + "px";
                }
              });

              // Hide the tooltip on mouseout
              cell.addEventListener("mouseout", () => {
                tooltip.style.display = "none";
              });

              // Update the tooltip position on mousemove
              cell.addEventListener("mousemove", (event) => {
                tooltip.style.left = event.pageX + 10 + "px";
                tooltip.style.top = event.pageY + 10 + "px";
              });
            }
            // update
            const currentAmount = Math.round(this.parcel.resources[resourceName] * 10) / 10;
            cell.textContent = currentAmount;
            const maxResourceValue = this.parcel.maxResources * (1 / getResourceDensity(resourceName));
            const progressPercentage = Math.min(currentAmount / maxResourceValue, 1) * 100;

            // Get the color from getResourceRateColor and apply it to the resource amount cell
            const rateColor = getResourceRateColor(this.parcel, resourceName);

            // Get the color from getColorFromPercentage
            let colorPercent = this.getColorFromPercentage(progressPercentage / 100);

            // Blend the rateColor with the colorPercent, preserving the transparency in the progress bar
            cell.style.background = `
              linear-gradient(90deg,
                ${colorPercent} ${progressPercentage}%,
                ${rateColor} ${progressPercentage}%,
                ${rateColor} 100%)`;

            //console.log(rateColor);

          } else if (column.id === 'productionRate') {
            //update
            let targetInterval = 7;
            let buildingCount = 0;
            let buildingCountChecked = 0;
            let productionRateModifier = 0;
            let amount = 0;

            if (building) {
              if (building.id.includes("lab") || building.id === "rocketPartAssembly" || building.id === "sateliteAssembly" || building.id === "expansionCenter" || building.id === "researchCenter") {
                targetInterval = 300;
              }

              buildingCount = this.parcel.activeBuildings[building.id];
              buildingCountChecked = buildingCount || 0;
              productionRateModifier = gameLoop.calculateProductionRateModifier(this.parcel, building, buildingCount);
              amount = building.outputs[resourceName];
            }
            const averageValue = this.parcel.productionHistory[resourceName].getAverage(targetInterval);

            const maxValue = amount * buildingCountChecked * productionRateModifier;
            const progressPercentage = Math.min(averageValue / maxValue, 1) * 100;

            if (averageValue) {
              if (averageValue < 0.1) {
                cell.textContent = "+" + averageValue.toFixed(3) + "/s";
              } else if (averageValue < 1) {
                cell.textContent = "+" + averageValue.toFixed(2) + "/s";
              } else {
                cell.textContent = "+" + averageValue.toFixed(1) + "/s";
              }
              let colorPercent = this.getColorFromPercentage(progressPercentage/100);
              cell.style.background = `linear-gradient(90deg, ${colorPercent} ${progressPercentage}%, transparent ${progressPercentage}%)`;
            } else {
              cell.textContent = "";
              cell.style.background = "transparent";
            }
          } else if (column.id === 'activeBuildings') {
            if (
              building &&
              progressionManager.isUnlocked("ironMiner") &&
              progressionManager.isUnlocked("stoneMiner") &&
              progressionManager.isUnlocked("coalMiner")
            ) {
              const buildingCount = this.parcel.buildings[building.id] || 0;
              const activeBuildingCount = this.parcel.activeBuildings[building.id] || 0;
              const buildingDisplay = document.getElementById(`building-active-${resourceName}`);
              const activeBuildingsCell = document.getElementById(`${resourceName}-activeBuildings-cell-resourceName`);
              activeBuildingsCell.style.textAlign = "left";
              if (buildingDisplay) {
                if (buildingCount === 0) {
                  buildingDisplay.textContent = 0;
                } else {
                  buildingDisplay.textContent = `${activeBuildingCount}`;
                }

              } else {
                cell.innerHTML = `<span id="building-active-${resourceName}" style="display: inline-block; vertical-align: -webkit-baseline-middle;">${activeBuildingCount}</span>`;
              }
              const activateButton = row.querySelector(`#activate-${building.id}`);
              const deactivateButton = row.querySelector(`#deactivate-${building.id}`);
              if (!activateButton && !deactivateButton && buildingCount > 0) {
                cell.innerHTML += `
                  <div class="buttonWrapper">
                  <button id="deactivate-${building.id}" data-building-id="${building.id}" class="deactivate-building-resource">-</button>
                  <button id="activate-${building.id}" data-building-id="${building.id}" class="activate-building-resource">+</button>
                  </div>
                `;
              }
              if (activateButton && deactivateButton) {
                if (activateButton.dataset.listenerAttached !== 'true') {
                  this.addEventListenerToButtons(`#activate-${building.id}`, activateBuilding, activateButton);
                }
                if (deactivateButton.dataset.listenerAttached !== 'true') {
                  this.addEventListenerToButtons(`#deactivate-${building.id}`, deactivateBuilding, deactivateButton);
                }
              }
            }
          } else if (column.id === 'totalBuildings') {
            if (
              building &&
              progressionManager.isUnlocked("ironMiner") &&
              progressionManager.isUnlocked("stoneMiner") &&
              progressionManager.isUnlocked("coalMiner")
            ) {
              const buildingCount = this.parcel.buildings[building.id] || 0;
              const buildingDisplay = document.getElementById(`building-amount-${resourceName}`);
              const buildingUnlocked = window.progressionManager.unlockedBuildings.has(building.id);
              const totalBuildingsCell = document.getElementById(`${resourceName}-totalBuildings-cell-resourceName`);
              totalBuildingsCell.style.textAlign = "left";
              if (buildingDisplay) {
                buildingDisplay.textContent = buildingCount;
              } else {
                cell.innerHTML = `<span id="building-amount-${resourceName}" style="display: inline-block; vertical-align: -webkit-baseline-middle;">${buildingCount}</span>`;
              }
              const buyButton = row.querySelector(`#buy-${building.id}`);
              const sellButton = row.querySelector(`#sell-${building.id}`);
              if (!buyButton && !sellButton && buildingUnlocked) {
                cell.innerHTML += `
                  <div class="buttonWrapper">
                  <button id="sell-${building.id}" data-building-id="${building.id}" class="sell-building-resource">-</button>
                  <button id="buy-${building.id}" data-building-id="${building.id}" class="buy-building-resource">+</button>
                  </div>
                `;
              }
              if (buyButton && sellButton) {
                if (buyButton.dataset.listenerAttached !== 'true') {
                  this.addEventListenerToButtons(`#buy-${building.id}`, buyBuilding, buyButton);
                }
                if (sellButton.dataset.listenerAttached !== 'true') {
                  this.addEventListenerToButtons(`#sell-${building.id}`, sellBuilding, sellButton);
                }
              }
            }
          } else if (column.id === 'forwardBelt') {
            if (isInit) {
              const beltController = this.createDirectionInput(column.id, resourceName);
              cell.style = "text-align: center;";
              cell.appendChild(beltController);
            } else if (cell.innerHTML === "") {
              const beltController = this.createDirectionInput(column.id, resourceName);
              cell.style = "text-align: center;";
              cell.appendChild(beltController);
            }
          } else if (column.id === 'backwardBelt') {
            if (isInit) {
              const beltController = this.createDirectionInput(column.id, resourceName);
              cell.style = "text-align: center;";
              cell.appendChild(beltController);
            } else if (cell.innerHTML === "") {
              const beltController = this.createDirectionInput(column.id, resourceName);
              cell.style = "text-align: center;";
              cell.appendChild(beltController);
            }
          }
        }
      });
    }

    createDirectionInput(beltId, resourceName) {
      // Create elements
      const beltController = document.createElement("div");
      const minusBtn = document.createElement("div");
      const directionInput = document.createElement("input");
      const plusBtn = document.createElement("div");

      // Set properties and attributes
      beltController.className = "input-controller";

      minusBtn.className = "input-btn";
      minusBtn.innerText = "-";

      directionInput.type = "text";
      directionInput.className = "input-display";
      const inputValue = this.parcel.inputValues && this.parcel.inputValues[resourceName] && this.parcel.inputValues[resourceName][beltId] ? this.parcel.inputValues[resourceName][beltId] : 0;
      directionInput.value = inputValue;
      directionInput.dataset.belt = beltId;
      directionInput.dataset.resource = resourceName;
      directionInput.dataset.currentval = directionInput.value;

      plusBtn.className = "input-btn";
      plusBtn.innerText = "+";

      // Append elements
      beltController.append(minusBtn, directionInput, plusBtn);

      // Function to handle button clicks
      const handleButtonClick = (increment) => {
        const currentVal = parseInt(directionInput.value, 10) || 0;
        const newVal = currentVal + increment;

        directionInput.value = newVal;
        directionInput.dispatchEvent(new Event("input"));
      };

      // Attach event listeners
      minusBtn.addEventListener("click", (event) => {
        const amount = event.shiftKey ? -5 : -1;
        handleButtonClick(amount);
      });

      plusBtn.addEventListener("click", (event) => {
        const amount = event.shiftKey ? 5 : 1;
        handleButtonClick(amount);
      });

      directionInput.addEventListener("input", (event) => {
        const inputVal = parseInt(event.target.value, 10) || 0;
        const maxVal = window.parcels.parcelList.reduce((sum, parcel) => sum + ((parcel.cluster === this.parcel.cluster) ? (parcel.buildings["beltBus"] || 0) : 0), 0);
        const currentVal = parseInt(event.target.dataset.currentval, 10) || 0;
        const beltUsage = parseInt(this.parcel.beltUsage[beltId], 10) || 0;
        const maxCellVal = maxVal - (beltUsage - currentVal);

        if (inputVal > maxCellVal) {
          //Check for the edge case of selling belts where maxCellVal can get negative
          if (maxCellVal < 0) {
            event.target.value = 0;
          } else {
            event.target.value = maxCellVal;
          }
        } else if (inputVal <= 0 || isNaN(inputVal) || inputVal === null || inputVal === "") {
          event.target.value = 0;
        }

        if (inputVal <= 0 || isNaN(inputVal) || inputVal === null || inputVal === "") {
          event.target.classList.add('zero-value');
        } else {
          event.target.classList.remove('zero-value');
        }

        event.target.dataset.currentval = event.target.value;

        // Save the input field value for the parcel, resource, and beltId
        this.updateBeltUsage(beltId, resourceName, event.target.value, true);

        this.update();
      });

      // Check initial input value and add 'zero-value' class if necessary
      if (inputValue === 0) {
        directionInput.classList.add('zero-value');
      }

      return beltController;
    }

    createMineButton(resourceName) {
      const mineButton = document.createElement("button");
      mineButton.textContent = "Mine";
      mineButton.style.display = "inline-block";
      mineButton.classList.add("exclude");
      mineButton.style.verticalAlign = "-webkit-baseline-middle";
      mineButton.style.float = "right";
      mineButton.style.marginLeft = "1em"
      mineButton.addEventListener("click", () => {
        this.parcel.resources[resourceName] += 1;
        this.update();
      });

      return mineButton;
    }

    createCell(content, bgColor = "#eee") {
      const cell = document.createElement("td");

      if (typeof content === "string" || typeof content === "number") {
        cell.textContent = content;
      } else if (content instanceof Node) {
        cell.appendChild(content);
      }

      if (localStorage.getItem('darkMode') === 'true') {

      } else {
        cell.style.backgroundColor = bgColor;
      }



      if (bgColor === "green") {
        cell.style.color = "white";
      }

      return cell;
    }

    updateBeltUsage(beltId, resourceName, value, saveInputValue = false) {
      let totalBeltUsage = 0;
      const beltInputs = this.tableElement.querySelectorAll(`input[data-belt="${beltId}"]`);

      beltInputs.forEach((input) => {
        const inputVal = parseInt(input.value, 10);
        totalBeltUsage += inputVal;
      });

      if (!this.parcel.beltUsage) {
        this.parcel.beltUsage = {};
      }

      this.parcel.beltUsage[beltId] = totalBeltUsage;

      // Save the input field values for the parcel, resource, and beltId
      if (saveInputValue) {
        if (!this.parcel.inputValues) {
          this.parcel.inputValues = {};
        }
        if (!this.parcel.inputValues[resourceName]) {
          this.parcel.inputValues[resourceName] = {};
        }
        this.parcel.inputValues[resourceName][beltId] = parseInt(value, 10) || 0;
      }
    }

    refreshTable() {
      const resourceTable = document.getElementById("resourceTable");
      for (let i = 1; i < resourceTable.rows.length; i++) {
        const row = resourceTable.rows[i];
        const resourceName = row.cells[0].textContent;
        this.updateRow(resourceName, row);
      }
    }

  }

  function updateClusterHeadersVisibility() {
    const showClusterHeader = window.gameState.research.clusterTech;
    const clusterHeaders = document.getElementsByClassName("cluster-header");
    for (const clusterHeader of clusterHeaders) {
      clusterHeader.style.display = showClusterHeader ? "block" : "none";
    }
  }

  function addParcelToUI(parcel, callback) {
    const clusterId = parcel.cluster || 0;
    const clusterContainerId = `cluster-${clusterId}`;

    let clusterContainer = document.getElementById(clusterContainerId);

    // Create a new cluster container if it doesn't exist
    if (!clusterContainer) {
      const showClusterHeader = window.gameState.research.clusterTech;
      clusterContainer = document.createElement("div");
      clusterContainer.className = "cluster-container";
      clusterContainer.id = clusterContainerId;
      clusterContainer.style.display = "block";

      const clusterHeader = document.createElement("button");
      clusterHeader.className = "cluster-header";
      clusterHeader.textContent = `Cluster ${clusterId}`;
      clusterHeader.style.display = showClusterHeader ? "block" : "none"; // control visibility here
      clusterHeader.addEventListener("click", () => {
        clusterContent.classList.toggle("active");
        clusterContent.style.display = clusterContent.style.display === "none" ? "block" : "none";
        clusterContainer.style.display = clusterContainer.style.display === "inline-block" ? "block" : "inline-block";
      });

      const clusterContent = document.createElement("div");
      clusterContent.className = "cluster-content";
      clusterContent.id = `cluster-content-${clusterId}`;
      clusterContent.style.display = "block";

      // Always append the clusterHeader but control its visibility
      clusterContainer.appendChild(clusterHeader);

      clusterContainer.appendChild(clusterContent);

      // Find the correct position for the new cluster container
      const existingClusterContainers = Array.from(parcelContainer.children).filter(child => child.className === "cluster-container");
      let insertPosition = existingClusterContainers.length;

      for (let i = 0; i < existingClusterContainers.length; i++) {
        const currentClusterId = parseInt(existingClusterContainers[i].id.split('-')[1], 10);

        if (clusterId < currentClusterId) {
          insertPosition = i;
          break;
        }
      }

      if (insertPosition < existingClusterContainers.length) {
        parcelContainer.insertBefore(clusterContainer, existingClusterContainers[insertPosition]);
      } else {
        parcelContainer.appendChild(clusterContainer);
      }
    }

    const clusterContent = document.getElementById(`cluster-content-${clusterId}`);
    const parcelTab = document.createElement("button");
    const selectedParcel = parcels.getParcel(selectedParcelIndex);
    parcelTab.className = "parcel-tab";
    parcelTab.id = `tab-${parcel.id}`;
    parcelTab.textContent = parcel.id;

    if (parcel === selectedParcel) {
      parcelTab.classList.add("selected");
    }

    // Add event listener for selecting the parcel
    addParcelClickListener(parcelTab);

    clusterContent.appendChild(parcelTab);

    // Update the parcel tab with color and name if available
    const parcelIndex = window.parcels.parcelList.findIndex((p) => p.id === parcel.id);
    parcelManipulation.updateParcelTab(parcelIndex);

    updateClusterHeadersVisibility();

    // Simulate async operation with setTimeout
    setTimeout(() => {
      if (callback) {
        callback();
      }
    }, 0);
  }

  function addParcelClickListener(parcelTab) {
    parcelTab.addEventListener("click", () => {
      const prevSelected = document.querySelector(".parcel-tab.selected");
      if (prevSelected) {
        prevSelected.classList.remove("selected");
      }
      parcelTab.classList.add("selected");
      selectedParcelIndex = parseInt(parcelTab.id.split("-")[2]) - 1;
      updateResourceDisplay(parcels.getParcel(selectedParcelIndex));
      updateBuildingDisplay(parcels.getParcel(selectedParcelIndex));
    });
  }

  let previousParcel = null;

  function updateResourceDisplay(parcel) {

    const resourceTable = new ResourceTable(parcel);

    // Check if the parcel has changed
    if (previousParcel !== parcel) {
      // Clear the existing rows
      while (resourceTable.tableElement.rows.length > 1) {
        resourceTable.tableElement.deleteRow(-1);
      }

      // Update the previousParcel variable with the new parcel
      previousParcel = parcel;
    }

    // Update the resource table with the given parcel
    resourceTable.update();
    return resourceTable;
  }

  function getTotalBeltUsage(parcel, beltId) {
    let totalBeltUsage = 0;
    for (const resourceName in parcel.resources) {
      const beltUsage = parcel.beltUsage ? parcel.beltUsage[beltId] || {} : {};
      const resourceBeltUsage = beltUsage[resourceName] || 0;
      totalBeltUsage += resourceBeltUsage;
    }
    return totalBeltUsage;
  }

  let selectedTab = "All";

  function updateBuildingDisplay(parcel) {

    // Helper function to update the class of the tabs
    function updateTabClasses() {
      const allTabs = document.querySelectorAll(".building-tab");
      allTabs.forEach(tab => {
        tab.classList.remove("selected");
        if ((tab.id === `tab-${selectedTab}`) || (selectedTab === "All" && tab.id === "tab-all")) {
          tab.classList.add("selected");
        }
      });
    }

    // Create / update the tabs
    const categories = window.buildingManager.getCateories()
    const mapCategoryToBuildings = new Map();

    const onlyBuiltCheckbox = document.getElementById("only-built");
    if (onlyBuiltCheckbox.dataset.listenerAttached !== 'true') {
      onlyBuiltCheckbox.dataset.listenerAttached = 'true';
      onlyBuiltCheckbox.addEventListener("click", () => {
        updateBuildingDisplay(parcels.getParcel(selectedParcelIndex));
      });
    }

    for (let i in categories) {
      mapCategoryToBuildings.set(categories[i].name, []);
    }

    for (const buildingId of window.progressionManager.unlockedBuildings) {
      const building = window.buildingManager.getBuilding(buildingId);
      mapCategoryToBuildings.get(building.category).push(building);
    }
    const tabContainer = document.getElementById("building-tabs");
    let allTab = document.getElementById("tab-all");
    if(!allTab){
      allTab = document.createElement("button");
      allTab.className = (selectedTab === "All" ? "building-tab selected" : "building-tab");
      allTab.textContent = "All";
      allTab.id ="tab-all";
      allTab.addEventListener("click", () => {
        selectedTab = "All";
        console.log("2", selectedTab);
        updateBuildingDisplay(parcels.getParcel(selectedParcelIndex));
        updateTabClasses();
      });
      tabContainer.appendChild(allTab);
    }


    mapCategoryToBuildings.forEach((value, key) => {
      if(value.length > 0){
        // display the tab
        let buildingTab = document.getElementById(`tab-${key}`);
        if(!buildingTab){
          buildingTab = document.createElement("button");
          buildingTab.className = (selectedTab === key ? "building-tab selected" : "building-tab");
          console.log(buildingTab.className);
          buildingTab.textContent = key;
          buildingTab.id = `tab-${key}`;
          buildingTab.addEventListener("click", () => {
            selectedTab = key;
            console.log("1", selectedTab);
            updateBuildingDisplay(parcels.getParcel(selectedParcelIndex));
            updateTabClasses();
          });
          tabContainer.appendChild(buildingTab);
        }
      }
    })

    buildingDisplay.innerHTML = `
      <tr>
          <th class = "header">Building</th>
          <th class = "header">Count</th>
          <th class = "header">Action</th>
      </tr>
    `;

    const onlyBuilt = document.getElementById("only-built").checked;
    for (const buildingId of window.progressionManager.unlockedBuildings) {
      const building = window.buildingManager.getBuilding(buildingId);
      if(building.category === selectedTab || selectedTab === "All"){
        const buildingCount = parcel.buildings[building.id] || 0;
        if(onlyBuilt && buildingCount === 0){
          continue;
        }
        let buildingElement = document.getElementById(`building-row-${building.id}`);
        if(!buildingElement){
          buildingElement = document.createElement("tr");
          buildingElement.id = `building-row-${building.id}`;
          buildingElement.innerHTML = `
                  <td data-building-id="${buildingId}" class="building-nameCell">${building.name}</td>
                  <td>${buildingCount}</td>
                  <td>
                      <button data-building-id="${buildingId}" class="buy-building">Buy</button>
                      <button data-building-id="${buildingId}" class="sell-building">Sell</button>
                  </td>
              `;
          buildingDisplay.appendChild(buildingElement);
        }
      }
    }

    const totalBuildings = Object.values(parcel.buildings).reduce((a, b) => a + b, 0);
    const buildingHeader = document.getElementById("buildingHeader");
    buildingHeader.textContent = `Buildings (${totalBuildings} / ${parcel.maxBuildings}) `;

    // Add Upgrade button
    const upgradeButton = document.createElement("button");
    upgradeButton.textContent = "Upgrade";
    upgradeButton.classList.add("upgrade-button");
    buildingHeader.appendChild(upgradeButton);

    // Get a reference to the tooltip element
    const tooltip = document.getElementById("tooltip");

    // Display upgrade information on mouseover
    upgradeButton.addEventListener("mouseover", (event) => {
      const upgradeType = "maxBuildingLimit";
      const upgradeCost = parcels.getUpgradeCost(parcel, upgradeType);
      const upgradeInfo = parcels.getUpgradeInfo(parcel, upgradeType);
      const costText = Object.entries(upgradeCost)
        .map(([resource, cost]) => `${cost} ${resource}`)
        .join(", ");
      const upgradeText = upgradeInfo
        ? `Upgrade cost: ${costText}. New limit: ${upgradeInfo.maxBuildingLimit}`
        : "Max level reached.";

      tooltip.innerHTML = upgradeText;
      tooltip.style.display = "block";
      tooltip.style.left = event.pageX + 10 + "px";
      tooltip.style.top = event.pageY + 10 + "px";
    });

    // Hide the tooltip on mouseout
    upgradeButton.addEventListener("mouseout", () => {
      tooltip.style.display = "none";
    });

    // Update the tooltip position on mousemove
    upgradeButton.addEventListener("mousemove", (event) => {
      tooltip.style.left = event.pageX + 10 + "px";
      tooltip.style.top = event.pageY + 10 + "px";
    });

    // Add event listener for Upgrade button
    upgradeButton.addEventListener("click", (event) => {
      const upgradeSuccess = parcels.upgradeParcel(parcel, "maxBuildingLimit");
      if (!upgradeSuccess) {
        const missingResources = parcels.getMissingUpgradeResources(parcel, "maxBuildingLimit");
        showMissingResourceOverlay(missingResources, event);
      }
      updateBuildingDisplay(parcel);
    });

    // Add event listeners to buy buttons
    addEventListenerToButtons(parcel, ".buy-building", buyBuilding);

    // Add event listeners to sell buttons
    addEventListenerToButtons(parcel, ".sell-building", sellBuilding);

    // Add tooltips for buildings
    addBuildingTooltips(parcel);
  }

  function addBuildingTooltips(parcel) {
    const buildingNames = buildingDisplay.querySelectorAll("tr td:first-child");
    buildingNames.forEach((buildingName) => {
      buildingName.addEventListener("mouseover", (event) => {
        const buildingId = event.target.dataset.buildingId;
        const building = buildingManager.getBuilding(buildingId);
        const inputText = Object.entries(building.inputs || {})
          .map(([inputResource, amount]) => `${amount} ${inputResource}`)
          .join("<br>");
        const outputText = Object.entries(building.outputs || {})
          .map(([outputResource, amount]) => `${amount} ${outputResource}`)
          .join("<br>");
        const energyInputText = building.energyInput ? `Energy Consumption: ${building.energyInput}` : "";
        const energyOutputText = building.energyOutput ? `Energy Production: ${building.energyOutput}` : "";
        const descriptionText = building.description ? `Description:<br>${building.description}` : "";

        const ariaLabelElements = [
          inputText ? `Input: ${inputText}` : "",
          outputText ? `Output: ${outputText}` : "",
          energyInputText,
          energyOutputText,
          descriptionText
        ];

        const ariaLabelText = ariaLabelElements.filter(el => el !== "").join(". ");

        const tooltipElements = [
          inputText ? `Input:<br>${inputText}` : "",
          outputText ? `Output:<br>${outputText}` : "",
          energyInputText,
          energyOutputText,
          descriptionText
        ];

        const tooltipText = tooltipElements.filter(el => el !== "").join("<br><br>");
        tooltip.setAttribute("aria-live", ariaLabelText);

        tooltip.innerHTML = tooltipText;
        tooltip.style.display = "block";
        tooltip.style.left = event.pageX + 10 + "px";
        tooltip.style.top = event.pageY + 10 + "px";
      });

      buildingName.addEventListener("mouseout", () => {
        tooltip.style.display = "none";
      });

      buildingName.addEventListener("mousemove", (event) => {
        tooltip.style.left = event.pageX + 10 + "px";
        tooltip.style.top = event.pageY + 10 + "px";
      });
    });
  }

  function addEventListenerToButtons(parcel, buttonClass, actionFunction) {
    const buttons = buildingDisplay.querySelectorAll(buttonClass);
    buttons.forEach((button) => {
      button.addEventListener("click", (event) => {
        const buildingId = event.target.dataset.buildingId;
        actionFunction(parcel, buildingId, event);
        updateBuildingDisplay(parcel);
      });

      // Show tooltip on mouseover for Buy buttons only
      if (actionFunction === buyBuilding) {
        button.addEventListener("mouseover", (event) => {
          const buildingId = event.target.dataset.buildingId;
          const building = buildingManager.getBuilding(buildingId);
          const costText = Object.entries(building.cost)
            .map(([resource, cost]) => `${cost} ${resource}`)
            .join("<br>");
          const buyText = `Cost:<br>${costText}`;

          tooltip.innerHTML = buyText;
          tooltip.style.display = "block";
          tooltip.style.left = event.pageX + 10 + "px";
          tooltip.style.top = event.pageY + 10 + "px";
        });

        // Hide tooltip on mouseout
        button.addEventListener("mouseout", () => {
          tooltip.style.display = "none";
        });

        // Update tooltip position on mousemove
        button.addEventListener("mousemove", (event) => {
          tooltip.style.left = event.pageX + 10 + "px";
          tooltip.style.top = event.pageY + 10 + "px";
        });
      }
    });
  }

  function activateBuilding(parcel, buildingId) {
    if (parcel.buildings[buildingId] !== undefined) {
      if (parcel.activeBuildings[buildingId] === undefined) {
        parcel.activeBuildings[buildingId] = 0;
      }
      if (parcel.activeBuildings[buildingId] < parcel.buildings[buildingId]) {
        parcel.activeBuildings[buildingId]++;
      }
    }
  }

  function deactivateBuilding(parcel, buildingId) {
    if (parcel.buildings[buildingId] !== undefined) {
      if (parcel.activeBuildings[buildingId] === undefined) {
        parcel.activeBuildings[buildingId] = 0;
      }
      if (parcel.activeBuildings[buildingId] > 0) {
        parcel.activeBuildings[buildingId]--;
        if (parcel.activeBuildings[buildingId] === 0) {
          const firstKey = Object.keys(buildingManager.getBuilding(buildingId).outputs)[0];
          if (firstKey) {
            parcel.productionHistory[firstKey] = new CircularBuffer(300)
          }
        }
      }
    }
  }
  function buyBuilding(parcel, buildingId, event) {
    const totalBuildings = Object.values(parcel.buildings).reduce((a, b) => a + b, 0);
    if (totalBuildings < parcel.maxBuildings) {
      const building = buildingManager.getBuilding(buildingId);

      const resourceCost = Object.entries(building.cost);

      let canAfford = true;
      for (const [resourceName, cost] of resourceCost) {
        const totalResource = (parcel.resources[resourceName] || 0) + buildingManager.getResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resourceName);
        if (totalResource < cost) {
          canAfford = false;
          break;
        }
      }

      if (canAfford) {
        if (parcel.buildings[buildingId] === undefined) {
          parcel.buildings[buildingId] = 0;
        }
        parcel.buildings[buildingId]++;
        if (parcel.activeBuildings[buildingId] === undefined) {
          parcel.activeBuildings[buildingId] = 0;
        }
        parcel.activeBuildings[buildingId]++;

        for (const [resourceName, cost] of resourceCost) {
          if (parcel.resources[resourceName] >= cost) {
            parcel.resources[resourceName] -= cost;
          } else {
            const parcelResource = parcel.resources[resourceName] || 0;
            const remainingResource = cost - parcelResource;
            parcel.resources[resourceName] = 0;
            buildingManager.deductResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resourceName, remainingResource);
          }
        }

        buildingManager.initializeResourceOutput(parcel, building);

        if (buildingId === "kiln" && !parcel.resources.coal) {
          parcel.resources = { coal: 0, ...parcel.resources };
        }

        if (buildingId === "ironSmelter" && !parcel.resources.ironOre) {
          parcel.resources = { ironOre: 0, ...parcel.resources };
        }

        updateBuildingDisplay(parcel);
      } else {
        const missingResources = resourceCost
          .filter(([resourceName, cost]) => {
            const totalResource = (parcel.resources[resourceName] || 0) + buildingManager.getResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resourceName);
            return totalResource < cost;
          })
          .map(([resourceName, cost]) => {
            const totalResource = (parcel.resources[resourceName] || 0) + buildingManager.getResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resourceName);
            return { resourceName, amount: cost - totalResource };
          });

        showMissingResourceOverlay(missingResources, event);
      }
    }
  }

  function showMissingResourceOverlay(missingResources, event, descriptionText = "", timer = 5000) {
    // Remove any existing popup
    const existingPopup = document.querySelector("#missing-resource-overlay");
    if (existingPopup) {
      document.body.removeChild(existingPopup);
    }

    if (accessibilityMode) {
      timer = 120000
    }

    const overlay = document.createElement("div");
    overlay.id = "missing-resource-overlay";
    overlay.classList.add("notification-popup");

    // Create the live region container
    const liveRegion = document.createElement("div");
    liveRegion.setAttribute("aria-live", "assertive");
    overlay.appendChild(liveRegion);

    const title = document.createElement("h3");
    title.textContent = "Missing Resources";
    title.classList.add("notification-popup-content");
    liveRegion.appendChild(title);
    overlay.appendChild(title);

    const resourceTable = document.createElement("table");
    const tableHeader = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const resourceHeader = document.createElement("th");
    resourceHeader.textContent = "Resource";
    headerRow.appendChild(resourceHeader);
    const amountHeader = document.createElement("th");
    amountHeader.textContent = "Amount";
    headerRow.appendChild(amountHeader);
    tableHeader.appendChild(headerRow);
    resourceTable.appendChild(tableHeader);
    const tableBody = document.createElement("tbody");
    resourceTable.classList.add("notification-popup-content");
    missingResources.forEach((resource) => {
      const tableRow = document.createElement("tr");

      const resourceNameCell = document.createElement("td");
      resourceNameCell.textContent = resource.resourceName;
      tableRow.appendChild(resourceNameCell);

      const amountCell = document.createElement("td");
      amountCell.textContent = resource.amount;
      tableRow.appendChild(amountCell);

      tableBody.appendChild(tableRow);
    });
    resourceTable.appendChild(tableBody);
    overlay.appendChild(resourceTable);

    if (descriptionText) {
      const description = document.createElement("p");
      description.textContent = descriptionText;
      description.classList.add("notification-popup-content");
      description.style.maxWidth = "15em";
      overlay.appendChild(description);
    }

    document.body.appendChild(overlay);

    // Position the overlay next to the mouse pointer
    overlay.style.left = event.pageX + 10 + "px";
    overlay.style.top = event.pageY + 10 + "px";

    // Stop event propagation to prevent triggering the document click event listener
    event.stopPropagation();

    // Automatically close the overlay after 2 seconds
    const closeOverlay = () => {
      // Check if the overlay is defined and in the document body
      if (document.body.contains(overlay)) {
        document.body.removeChild(overlay);
      }
    };
    setTimeout(closeOverlay, timer);

    // Add an event listener to close the overlay when clicking anywhere on the page
    document.addEventListener("click", closeOverlay, { once: true });
  }

  function createResourceTable(missingResources) {
    const table = document.createElement("table");
    const tableHeader = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const resourceHeader = document.createElement("th");
    resourceHeader.textContent = "Resource";
    const amountHeader = document.createElement("th");
    amountHeader.textContent = "Amount";
    headerRow.appendChild(resourceHeader);
    headerRow.appendChild(amountHeader);
    tableHeader.appendChild(headerRow);
    table.appendChild(tableHeader);

    const tableBody = document.createElement("tbody");
    missingResources.forEach((resource) => {
      const row = document.createElement("tr");
      const resourceNameCell = document.createElement("td");
      resourceNameCell.textContent = resource.resourceName;
      const amountCell = document.createElement("td");
      amountCell.textContent = resource.amount;
      row.appendChild(resourceNameCell);
      row.appendChild(amountCell);
      tableBody.appendChild(row);
    });
    table.appendChild(tableBody);

    return table;
  }

  function sellBuilding(parcel, buildingId) {
    if (parcel.buildings[buildingId] && parcel.buildings[buildingId] > 0) {
      const building = buildingManager.getBuilding(buildingId);

      // Refund 100% of the cost rounded down
      for (const [resource, cost] of Object.entries(building.cost)) {
        parcel.resources[resource] = (parcel.resources[resource] || 0) + Math.floor(cost * 1);
      }

      if (parcel.buildings[buildingId] == parcel.activeBuildings[buildingId]) {
        parcel.activeBuildings[buildingId]--;
      }

      // Update building count
      parcel.buildings[buildingId]--;

      if (parcel.buildings[buildingId] === 0) {
        const firstKey = Object.keys(buildingManager.getBuilding(buildingId).outputs)[0];
        if (firstKey) {
          parcel.productionHistory[firstKey] = new CircularBuffer(300)
        }
        delete parcel.buildings[buildingId];
      }
      // Update building display
      updateBuildingDisplay(parcel);
    }
  }

  function updateParcelBuildingCount(parcelIndex, buildingCount) {
    const selectedParcel = document.getElementById(`parcel-${parcelIndex + 1}`);
    const buildingHeader = document.getElementById("buildingHeader");
    buildingHeader.textContent = `Buildings (${buildingCount} / ${parcels.maxBuildingsPerParcel}) `;
  }

  function getSelectedParcelIndex() {
    return selectedParcelIndex;
  }

  function setSelectedParcelIndex(newSelectedParcelIndex) {
    selectedParcelIndex = newSelectedParcelIndex;
  }

  function selectParcel(parcelIndex) {
    const parcelButtons = document.querySelectorAll(".parcel-button");
    selectedParcelIndex = parcelIndex;
    parcelButtons.forEach((button, index) => {
      button.classList.toggle("selected", index === parcelIndex);
    });
  }

  function formatResourceCost(cost) {
    return Object.entries(cost)
      .map(([resource, amount]) => `${resource}: ${amount}`)
      .join(", ");
  }

  function getResourceRateColor(parcel, resourceName) {
    const currentResourceCount = parcel.resources[resourceName] || 0;
    const previousResourceCount = parcel.previousResources[resourceName] || 0;
    const productionRate = currentResourceCount - previousResourceCount;
    if (productionRate > 0) {
      return "green";
    } else if (productionRate < 0) {
      return "red";
    } else {
      if (localStorage.getItem('darkMode') === 'true') {
        return "#222426";
      } else {
        return "#eee";
      }
    }
  }

  function updateSectionVisibility(sectionId, shouldBeVisible) {
    const section = document.getElementById(sectionId);
    section.style.display = shouldBeVisible ? "block" : "none";
  }

  function updateParcelsSectionVisibility() {
    const expansionTech = window.gameState.research.expansionTech;

    updateSectionVisibility("parcels-section", expansionTech);
    updateSectionVisibility("parcels-header", expansionTech);
    updateSectionVisibility("parcelManipulationMenuButton", expansionTech);
    updateSectionVisibility("global-header", expansionTech);
    updateSectionVisibility("energy-section", gameState.sectionVisibility.energySection);
    updateSectionVisibility("pollution-section", gameState.sectionVisibility.pollutionSection);
    updateSectionVisibility("fight-container", gameState.sectionVisibility.fightSection);
    updateSectionVisibility("military-header", gameState.sectionVisibility.fightSection);
    updateSectionVisibility("project-section", gameState.sectionVisibility.projectSection);
    updateSectionVisibility("research-section", gameState.sectionVisibility.researchSection);
    updateSectionVisibility("copyDropdownItem", gameState.sectionVisibility.blueprints);
    updateSectionVisibility("pasteDropdownItem", gameState.sectionVisibility.blueprints);
    updateSectionVisibility("train-management", gameState.sectionVisibility.trainSection)
    updateSectionVisibility("train-header", gameState.sectionVisibility.trainSection)

    // //Hide Project Section when all projects are done: Object.values(window.projects.projects).every(array => array.length === 0);
    // updateSectionVisibility("project-section", Object.values(window.projects.projects).length != 0);
  }

  function calculateFulfillmentAndModifier(energyDemand, energyProduction) {
    let fulfillment = (energyProduction / energyDemand) * 100;
    let modifier;
    let emoji;

    if (energyDemand === 0 && energyProduction === 0) {
      fulfillment = 100;
      fulfillmentModifier = 0;
    } else if (energyDemand === 0) {
      fulfillment = 100;
      fulfillmentModifier = 0;
    }


    if (fulfillment >= 200) {
      emoji = '🟢';
      modifier = 0;
    } else if (fulfillment > 120) {
      emoji = '🟢';
      modifier = 0;
    } else if (fulfillment >= 100) {
      emoji = '🟢';
      modifier = 0;
    } else {
      emoji = fulfillment < 40 ? '🔴' : '🟠';
      modifier = fulfillment - 100;
    }

    return {
      fulfillment: fulfillment.toFixed(2),
      fulfillmentModifier: `${emoji} ${modifier.toFixed(2)}%`,
    };
  }

  function updateEnergyDisplay() {
    const energyDemandElement = document.getElementById("energy-demand");
    const energyProductionElement = document.getElementById("energy-production");
    const fulfillmentElement = document.getElementById("fulfillment");
    const fulfillmentModifierElement = document.getElementById("fulfillment-modifier");

    const energyDemand = energyManager.calculateGlobalEnergyUsage();
    const energyProduction = energyManager.calculateGlobalEnergyProduction();
    let modifier = 0;
    energyDemandElement.textContent = energyDemand;
    energyProductionElement.textContent = energyProduction;

    const { fulfillment, fulfillmentModifier } = calculateFulfillmentAndModifier(energyDemand, energyProduction);
    fulfillmentElement.textContent = `${fulfillment}%`;
    fulfillmentModifierElement.textContent = fulfillmentModifier;

    if (fulfillment >= 100) {
      modifier = 0;
      if (fulfillment >= 200) {
        modifier = 0
      }
      parcels.globalProductionRateModifiers.energyModifier = modifier;
      parcels.globalConsumptionRateModifiers.energyModifier = modifier;
      // Reset energy modifier for buildings with energyInput > 0
      for (const parcel of window.parcels.parcelList) {
        for (const buildingId in parcel.buildings) {
          const building = window.buildingManager.getBuilding(buildingId);
          if (building.energyInput > 0) {
            if (parcel.buildingProductionRateModifiers[buildingId]) {
              delete parcel.buildingProductionRateModifiers[buildingId].energyModifier;
            }
            if (parcel.buildingConsumptionRateModifiers[buildingId]) {
              delete parcel.buildingConsumptionRateModifiers[buildingId].energyModifier;
            }
          }
        }
      }
    } else {
      // Reset global modifiers for energy
      parcels.globalProductionRateModifiers.energyModifier = 0;
      parcels.globalConsumptionRateModifiers.energyModifier = 0;

      // Apply negative energy modifier to buildings with energyInput > 0
      const energyModifier = Math.max((fulfillment - 100) / 100, -1);
      for (const parcel of window.parcels.parcelList) {
        for (const buildingId in parcel.buildings) {
          const building = window.buildingManager.getBuilding(buildingId);
          if (building.energyInput > 0) {
            parcel.buildingProductionRateModifiers[buildingId] = parcel.buildingProductionRateModifiers[buildingId] || {};
            parcel.buildingProductionRateModifiers[buildingId].energyModifier = energyModifier;

            parcel.buildingConsumptionRateModifiers[buildingId] = parcel.buildingConsumptionRateModifiers[buildingId] || {};
            parcel.buildingConsumptionRateModifiers[buildingId].energyModifier = energyModifier;
          } else {
            // Remove energy modifier for buildings without energy input
            if (parcel.buildingProductionRateModifiers[buildingId]) {
              delete parcel.buildingProductionRateModifiers[buildingId].energyModifier;
            }
            if (parcel.buildingConsumptionRateModifiers[buildingId]) {
              delete parcel.buildingConsumptionRateModifiers[buildingId].energyModifier;
            }
          }
        }
      }
    }
  }

function addTooltipToBuyParcelButton(buyParcelButton) {
  const tooltip = document.getElementById("tooltip");

  buyParcelButton.addEventListener("mouseover", (event) => {
    const selectedCluster = parseInt(document.getElementById("buyParcel-dropdown").value.split("-")[1]);
    const costText = Object.entries(gameState.clusterBuyParcelCosts[selectedCluster])
      .map(([resource, cost]) => `${cost} ${resource}`)
      .join("<br>");
    const parcelText = `Cost:<br>${costText}`;

    tooltip.innerHTML = parcelText;
    tooltip.style.display = "block";
    tooltip.style.left = event.pageX + 10 + "px";
    tooltip.style.top = event.pageY + 10 + "px";
  });

  // Hide tooltip on mouseout
  buyParcelButton.addEventListener("mouseout", () => {
    tooltip.style.display = "none";
  });

  // Update tooltip position on mousemove
  buyParcelButton.addEventListener("mousemove", (event) => {
    tooltip.style.left = event.pageX + 10 + "px";
    tooltip.style.top = event.pageY + 10 + "px";
  });
}

  function updateBuyParcelDropdown() {
    const dropdown = document.getElementById("buyParcel-dropdown");

    // Clear the existing options
    dropdown.innerHTML = "";

    // Rebuild the dropdown based on gameState.maxClusters
    for (let i = 0; i < gameState.maxClusters; i++) {
      const option = document.createElement("option");
      option.value = `cluster-${i}`;
      option.textContent = `Cluster ${i}`;
      dropdown.appendChild(option);
    }
  }

  function addExplainerTooltip(explainedElementId, explanationHTML) {
      // Get the element with the specified ID
      const explainedElement = document.getElementById(explainedElementId);

      // Create a div for the tooltip and set its content
      const tooltip = document.createElement('div');
      tooltip.innerHTML = explanationHTML;
      tooltip.classList.add('explainerTooltip');

      // Append the tooltip to the document body
      document.body.appendChild(tooltip);

      // Position the tooltip and make it visible when the explained element is hovered over
      explainedElement.addEventListener('mouseenter', function(event) {
          // Position the tooltip below the explained element
          const rect = explainedElement.getBoundingClientRect();
          tooltip.style.left = rect.left + 'px';
          tooltip.style.top = (rect.bottom + window.scrollY) + 'px'; // Adjust for page scroll

          // Make the tooltip visible
          tooltip.classList.add('tooltip-visible');
      });

      // Hide the tooltip when the mouse leaves the explained element
      explainedElement.addEventListener('mouseleave', function() {
          tooltip.classList.remove('tooltip-visible');
      });
  }


  return {
    updateClusterHeadersVisibility,
    addParcelToUI,
    updateResourceDisplay,
    updateBuildingDisplay,
    updateParcelBuildingCount,
    getSelectedParcelIndex,
    setSelectedParcelIndex,
    selectParcel,
    updateParcelsSectionVisibility,
    updateEnergyDisplay,
    updateSectionVisibility,
    buyBuilding,
    sellBuilding,
    addParcelClickListener,
    addTooltipToBuyParcelButton,
    formatResourceCost,
    showMissingResourceOverlay,
    activateBuilding,
    deactivateBuilding,
    updateBuyParcelDropdown,
    addExplainerTooltip
  };
})();

window.ui = ui;
