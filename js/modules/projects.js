const projectsModule = (() => {

  class Project {
    constructor(name, category, cost, reward) {
      this.name = name;
      this.category = category;
      this.cost = cost;
      this.reward = reward;
      this.completed = false;
    }
  }

  const projectCategories = {
    exploration: "Exploration",
    scouting: "Scouting",
  };

  const projects = {
    exploration: [
      new Project("Exploration Contract 1/16", "exploration", { ironPlates: 50 }, { expansionPoints: 1}),
      new Project("Exploration Contract 2/16", "exploration", { ironPlates: 75 }, { expansionPoints: 2}),
      new Project("Exploration Contract 3/16", "exploration", { ironPlates: 125, redScience: 1 }, { expansionPoints: 10}),
      new Project("Exploration Contract 4/16", "exploration", { ironPlates: 200, redScience: 5 }, { expansionPoints: 10}),
      new Project("Exploration Contract 5/16", "exploration", { ironPlates: 300, redScience: 10 }, { expansionPoints: 10}),
      new Project("Exploration Contract 6/16", "exploration", { ironPlates: 450, greenScience: 1 }, { expansionPoints: 12}),
      new Project("Exploration Contract 7/16", "exploration", { ironPlates: 675, greenScience: 5 }, { expansionPoints: 12}),
      new Project("Exploration Contract 8/16", "exploration", { ironPlates: 1025, darkScience: 1 }, { expansionPoints: 16}),
      new Project("Exploration Contract 9/16", "exploration", { ironPlates: 1550, darkScience: 25 }, { expansionPoints: 16}),
      new Project("Exploration Contract 10/16", "exploration", { ironPlates: 2325, blueScience: 1 }, { expansionPoints: 25}),
      new Project("Exploration Contract 11/16", "exploration", { ironPlates: 3500, blueScience: 25 }, { expansionPoints: 25}),
      new Project("Exploration Contract 12/16", "exploration", { ironPlates: 5250, purpleScience: 1 }, { expansionPoints: 40}),
      new Project("Exploration Contract 13/16", "exploration", { ironPlates: 7875, purpleScience: 25 }, { expansionPoints: 40}),
      new Project("Exploration Contract 14/16", "exploration", { ironPlates: 7875, yellowScience: 1 }, { expansionPoints: 50}),
      new Project("Exploration Contract 15/16", "exploration", { ironPlates: 7875, yellowScience: 25 }, { expansionPoints: 50}),
      new Project("Exploration Contract 16/16", "exploration", { ironPlates: 7875, whiteScience: 20 }, { expansionPoints: 100}),
    ],
    scouting: [
      new Project("Defense Contract 1/6", "scouting", { copperPlates: 50 }, { alienArtefacts: 2 }),
      new Project("Defense Contract 2/6", "scouting", { copperPlates: Math.round(50 * 1.5) }, { alienArtefacts: Math.round(2 * 1.25) }),
      new Project("Defense Contract 3/6", "scouting", { copperPlates: Math.round(100 * 1.5 * 1.5) }, { alienArtefacts: Math.round(2 * 1.25 * 1.25) }),
      new Project("Defense Contract 4/6", "scouting", { copperPlates: Math.round(150 * 1.5 * 1.5 * 1.5) }, { alienArtefacts: Math.round(2 * 1.25 * 1.25 * 1.25) }),
      new Project("Defense Contract 5/6", "scouting", { copperPlates: Math.round(150 * 1.5 * 1.5 * 1.5) }, { alienArtefacts: Math.round(2 * 1.25 * 1.25 * 1.25 * 1.25) }),
      new Project("Defense Contract 6/6", "scouting", { copperPlates: Math.round(150 * 1.5 * 1.5 * 1.5 * 1.5) }, { alienArtefacts: Math.round(2 * 1.25 * 1.25 * 1.25 * 1.25 * 1.25) }),
    ],
  };

  function renderProjects() {
    const projectsContainer = document.getElementById("projects-container");
    projectsContainer.style.display = "flex";
    projectsContainer.innerHTML = ""; // Clear the container before rendering projects

    for (const category in projects) {
      const categoryDiv = document.createElement("div");
      categoryDiv.classList.add("project-category");

      const project = projects[category][0]; // Display only the next project
      if (project && !project.completed) { // Check if project exists before checking the 'completed' property
        const projectDetails = document.createElement("div"); // Create a new div for project details
        projectDetails.classList.add("project-box"); // Add the border style to the project details div

        const projectName = document.createElement("p");
        projectName.textContent = project.name;
        projectDetails.appendChild(projectName);

        const startProjectButton = document.createElement("button");
        startProjectButton.textContent = "Start Project";
        startProjectButton.addEventListener("click", (event) => {
          startProject(project, event);
        });
        projectDetails.appendChild(startProjectButton);

        addTooltipToProjectButtons(startProjectButton, project);

        categoryDiv.appendChild(projectDetails); // Append project details div to the category div
      }

      projectsContainer.appendChild(categoryDiv);
    }
  }

  function addTooltipToProjectButtons(projectButton, project) {
    const tooltip = document.getElementById("tooltip");

    // Show tooltip on mouseover
    projectButton.addEventListener("mouseover", (event) => {
      const costText = Object.entries(project.cost)
        .map(([resource, cost]) => `${cost} ${resource}`)
        .join("<br>");
      const rewardText = Object.entries(project.reward)
        .map(([resource, reward]) => `${reward} ${resource}`)
        .join("<br>");
      const projectText = `Cost:<br>${costText}<br>Reward:<br>${rewardText}`;

      tooltip.innerHTML = projectText;
      tooltip.style.display = "block";
      tooltip.style.left = event.pageX + 10 + "px";
      tooltip.style.top = event.pageY + 10 + "px";
    });

    // Hide tooltip on mouseout
    projectButton.addEventListener("mouseout", () => {
      tooltip.style.display = "none";
    });

    // Update tooltip position on mousemove
    projectButton.addEventListener("mousemove", (event) => {
      tooltip.style.left = event.pageX + 10 + "px";
      tooltip.style.top = event.pageY + 10 + "px";
    });
  }

  function hasEnoughResources(parcel, cost) {
    for (const resource in cost) {
      const totalResource = (parcel.resources[resource] || 0) + buildingManager.getResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resource);

      if (!totalResource || totalResource < cost[resource]) {
        return false;
      }
    }
    return true;
  }

  function startProject(project, event) {
      const selectedParcel = parcels.getParcel(ui.getSelectedParcelIndex());

      if (hasEnoughResources(selectedParcel, project.cost)) {
          for (const resource in project.cost) {
              const totalResource = (selectedParcel.resources[resource] || 0) + buildingManager.getResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resource);

              if (selectedParcel.resources[resource] >= project.cost[resource]) {
                  selectedParcel.resources[resource] -= project.cost[resource];
              } else {
                  const parcelResource = selectedParcel.resources[resource] || 0;
                  const remainingResource = project.cost[resource] - parcelResource;
                  selectedParcel.resources[resource] = 0;
                  buildingManager.deductResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resource, remainingResource);
              }
          }

          for (const resource in project.reward) {
              if (!selectedParcel.resources[resource]) {
                  selectedParcel.resources[resource] = 0;
              }
              selectedParcel.resources[resource] += project.reward[resource];
          }

          project.completed = true;
          // Remove the completed project and add the next project in the category (if any)
          projects[project.category].shift();

          // Hide the tooltip
          const tooltip = document.getElementById("tooltip");
          tooltip.style.display = "none";

          // Update the UI to reflect the changes
          ui.updateResourceDisplay(selectedParcel);
          //projectsContainer.innerHTML = ""; // Remove this line
          renderProjects();
      } else {
        const missingResources = Object.entries(project.cost)
          .filter(([resourceName, cost]) => {
            const totalResource = (selectedParcel.resources[resourceName] || 0) + buildingManager.getResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resourceName);
            return totalResource < cost;
          })
          .map(([resourceName, cost]) => {
            const totalResource = (selectedParcel.resources[resourceName] || 0) + buildingManager.getResourcesFromRemoteConstructionFacilities(window.parcels.parcelList, resourceName);
            return { resourceName, amount: cost - totalResource };
          });

        ui.showMissingResourceOverlay(missingResources, event);
      }
  }

  function setProjects(newProjects) {
    for (const category in projects) {
      if (newProjects.hasOwnProperty(category)) {
        projects[category] = newProjects[category];
      }
    }
    renderProjects();
  }


  return {
    renderProjects,
    startProject,
    projects,
    setProjects,
    hasEnoughResources,
  };
})();

window.projects = projectsModule;
