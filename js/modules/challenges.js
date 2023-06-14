function showChallengeOverlay() {
    document.getElementById("challenge-overlay").style.display = "block";
}

function hideChallengeOverlay() {
    document.getElementById("challenge-overlay").style.display = "none";
}

function updateChallengeView() {
  // Get the challenge slots container
  const challengeSlots = document.querySelector('.challenge-slots');

  // Clear current slots
  challengeSlots.innerHTML = '';

  // Create new slots based on the gameState.maxChallenges
  for (let i = 0; i < gameState.maxChallenges; i++) {
    // Create a new challenge slot
    const challengeSlot = document.createElement('div');
    challengeSlot.className = 'challenge-slot';
    challengeSlot.onclick = function() { showChallengeOverlay(); };

    // Create the slot content
    const slotContent = document.createElement('p');
    slotContent.innerText = 'Pick Challenge';

    // Add the content to the slot and the slot to the slots container
    challengeSlot.appendChild(slotContent);
    challengeSlots.appendChild(challengeSlot);
  }
}
