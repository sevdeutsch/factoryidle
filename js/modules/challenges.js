/* --------------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ----------------------------------------------------------------------------- UI ------------------------------------------------------------------------ */
/* --------------------------------------------------------------------------------------------------------------------------------------------------------- */

function showChallengeOverlay() {
    document.getElementById("challenge-overlay").style.display = "block";
}

function hideChallengeOverlay() {
    document.getElementById("challenge-overlay").style.display = "none";
}

function initActiveChallenge(resource) {
    // Get the challenge slots
    const challengeSlots = document.querySelectorAll('.challenge-slot');

    // Check if there are any slots to fill
    if (challengeSlots.length > 0) {
        // Get the first available slot
        const firstSlot = challengeSlots[0];

        // Replace the slot with an active challenge slot
        firstSlot.outerHTML = buildChallengeSlot(resource);

        // Remove the onclick event
        firstSlot.onclick = null;

        // Change the class name
        firstSlot.className = 'active-challenge-slot';
    }
}

function updateChallengeView() {
    // Get the challenge slots container
    const challengeSlotsContainer = document.querySelector('.challenge-slots');

    // Clear current slots
    challengeSlotsContainer.innerHTML = '';

    // Create new slots based on the gameState.maxChallenges
    const challengeSlots = gameState.maxChallenges;
    for (let i = 0; i < challengeSlots; i++) {
        // Create a new challenge slot
        const challengeSlot = document.createElement('div');
        challengeSlot.className = 'challenge-slot';
        challengeSlot.onclick = function() { showChallengeOverlay(); };

        // Create the slot content
        const slotContent = document.createElement('p');
        slotContent.innerText = 'Pick Challenge';

        // Add the content to the slot and the slot to the slots container
        challengeSlot.appendChild(slotContent);
        challengeSlotsContainer.appendChild(challengeSlot);
    };

    // Initialize active challenges
    gameState.activeChallenges.forEach(initActiveChallenge);
}

function updateChallengeCards() {
  // Get the challenge overlay content container
  const overlayContent = document.querySelector('.challenge-overlay-content');

  // Clear current challenge cards
  overlayContent.innerHTML = '';

  let selectedResources;
  // Check if currentChallengeCards is not empty
  if (gameState.currentChallengeCards && gameState.currentChallengeCards.length > 0) {
    selectedResources = gameState.currentChallengeCards;
  } else {
    // Get all unique resources
    const resources = [];
    parcels.parcelList.forEach(parcel => {
      Object.keys(parcel.resources).forEach(resource => {
        if (!resources.includes(resource)) {
          if (buildingManager.getBuildingByResourceName(resource)) {
            resources.push(resource);
          }
        }
      });
    });

    // Randomly select 3 resources
    selectedResources = [];
    while (selectedResources.length < 3) {
      const resource = resources[Math.floor(Math.random() * resources.length)];
      if (!selectedResources.includes(resource)) {
        selectedResources.push(resource);
      }
    }

    // Save the selected resources in gameState
    gameState.currentChallengeCards = selectedResources;
  }

  // Create challenge cards for the selected resources
  selectedResources.forEach(resource => {
    const rewardBase = allResourceFactors[resource].rewardBase;
    const milestone = allResourceFactors[resource].milestones[0];

    // Create a new challenge card
    const challengeCard = document.createElement('div');
    challengeCard.className = 'challenge-card';
    challengeCard.onclick = function() {
      // Remove 'selected' class from all other challenge cards
      document.querySelectorAll('.challenge-card').forEach(card => {
        card.classList.remove('selected');
      });
      // Add 'selected' class to this challenge card
      this.classList.add('selected');
    };

    // Create the card content
    const resourceTitle = document.createElement('h2');
    resourceTitle.innerText = resource;
    const milestoneText = document.createElement('p');
    milestoneText.innerText = `Level 1: ${milestone} items/s`;
    const rewardText = document.createElement('p');
    rewardText.innerText = `Reward: ${rewardBase}`;

    // Add the content to the card and the card to the overlay content
    challengeCard.appendChild(resourceTitle);
    challengeCard.appendChild(milestoneText);
    challengeCard.appendChild(rewardText);
    overlayContent.appendChild(challengeCard);
  });

  // Add a close button to the overlay content
  const closeButton = document.createElement('button');
  closeButton.onclick = function() { hideChallengeOverlay(); };
  closeButton.innerText = 'Close';
  overlayContent.appendChild(closeButton);

  // Add a confirm button to the overlay content
  const confirmButton = document.createElement('button');
  confirmButton.onclick = function() { pickChallenge(); };
  confirmButton.innerText = 'Confirm';
  overlayContent.appendChild(confirmButton);
}

function buildChallengeSlot(chosenResourceChallenge) {
    // This is a simple function that returns a placeholder HTML string
    return `<div class="active-challenge-slot">This is the ${chosenResourceChallenge} Challenge</div>`;
}

function pickChallenge() {
    // Get the selected challenge
    const selectedChallenge = document.querySelector('.challenge-card.selected');
    if (!selectedChallenge) {
        alert('Please select a challenge before confirming.');
        return;
    }

    // Add the selected challenge to active challenges
    const chosenResourceChallenge = selectedChallenge.querySelector('h2').innerText;
    gameState.activeChallenges.push(chosenResourceChallenge);

    // Reset current challenge cards
    gameState.currentChallengeCards = [];

    // Initialize the new active challenge
    initActiveChallenge(chosenResourceChallenge);

    // Hide the challenge overlay
    hideChallengeOverlay();

    // Generate new Challenge cards
    updateChallengeCards();
}



/* --------------------------------------------------------------------------------------------------------------------------------------------------------- */
/* --------------------------------------------------------------- Calculate Challenge Cards --------------------------------------------------------------- */
/* --------------------------------------------------------------------------------------------------------------------------------------------------------- */

function calculateTotalCycles(buildingsData) {
  let totalCycles = 0;
  for (let building in buildingsData) {
    totalCycles += buildingsData[building].cycles;
  }
  return totalCycles;
}

function countUniqueBuildings(buildingsData) {
  return Object.keys(buildingsData).length;
}

function calculateStatsForAllResources(resourceMetadata) {
  let stats = {};

  for (let resource in resourceMetadata) {
    if (buildingManager.getBuildingByResourceName(resource)) {
      let buildingsData = calculateTotalBuildings(calculateSupplyChain(resource, 1));

      let totalCycles = calculateTotalCycles(buildingsData);
      let uniqueBuildings = countUniqueBuildings(buildingsData);

      stats[resource] = {
        totalCycles: totalCycles,
        uniqueBuildings: uniqueBuildings
      };
    }
  }

  return stats;
}

let allResourceStats = calculateStatsForAllResources(resourceMetadata);

function calculateFactorsForAllResources(allResourceStats) {
  let targetChallengeRates = [10, 1, 0.1, 0.01, 0.001];
  let factors = {};

  for (let resource in allResourceStats) {
    let inverseTotalCycles = 1 / allResourceStats[resource].totalCycles;
    let minRelDifRate = targetChallengeRates.reduce((prev, curr) =>
      Math.abs((curr - inverseTotalCycles) / curr) < Math.abs((prev - inverseTotalCycles) / prev) ? curr : prev
    );

    let relativeDifference = (inverseTotalCycles - minRelDifRate) / minRelDifRate;

    let scoreA = Math.log(1/(1+relativeDifference));

    factors[resource] = {
      //totalCycles: allResourceStats[resource].totalCycles,
      //inverseFactor1: 1/minRelDifRate,
      //inverseTotalCycles: inverseTotalCycles,
      //factor1: minRelDifRate,
      rewardBase: Math.round(5*(1 + scoreA)+allResourceStats[resource].uniqueBuildings),
      milestones:
      [
        1000*minRelDifRate,
        10000*minRelDifRate,
        100000*minRelDifRate,
        1000000*minRelDifRate,
        10000000*minRelDifRate,
        100000000*minRelDifRate,
        1000000000*minRelDifRate,
      ],
    };
  }

  return factors;
}

let allResourceFactors = calculateFactorsForAllResources(allResourceStats);
console.log(allResourceFactors);

/* --------------------------------------------------------------------------------------------------------------------------------------------------------- */
/* --------------------------------------------------------------- Helper Functions for GameDesign Analytics------------------------------------------------ */
/* --------------------------------------------------------------------------------------------------------------------------------------------------------- */

function sortStatsByTotalCycles(stats) {
  // Convert the stats object into an array
  let statsArray = Object.keys(stats).map(resource => {
    return {
      resource: resource,
      totalCycles: stats[resource].totalCycles,
      uniqueBuildings: stats[resource].uniqueBuildings
    };
  });

  // Sort the array by total cycles in descending order
  statsArray.sort((a, b) => b.totalCycles - a.totalCycles);

  return statsArray;
}

let sortedResourceStats = sortStatsByTotalCycles(allResourceStats);
console.log(sortedResourceStats);

function sortStatsByUniqueBuildings(stats) {
  // Convert the stats object into an array
  let statsArray = Object.keys(stats).map(resource => {
    return {
      resource: resource,
      totalCycles: stats[resource].totalCycles,
      uniqueBuildings: stats[resource].uniqueBuildings
    };
  });

  // Sort the array by number of unique buildings in descending order
  statsArray.sort((a, b) => b.uniqueBuildings - a.uniqueBuildings);

  return statsArray;
}

let sortedByUniqueBuildings = sortStatsByUniqueBuildings(allResourceStats);
console.log(sortedByUniqueBuildings);
