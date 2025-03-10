// IMPROVED CHARACTER CREATION MODULE
// Functions related to character creation with type safety and validation

/**
 * This file improves the character creation process by:
 * - Ensuring numeric types for attributes and skills
 * - Adding validation to prevent type conversion issues
 * - Properly handling skill caps and calculations
 */

// Function to select origin (heritage)
window.selectOrigin = function(origin) {
  // Set the selected origin - force as string
  window.player.origin = String(origin);
  
  // Update the UI to show origin description
  document.getElementById('originDescription').innerHTML = window.origins[origin].description;
  
  // Clear and populate career options based on the selected origin
  const careerOptionsDiv = document.getElementById('careerOptions');
  careerOptionsDiv.innerHTML = '';
  
  // Add career buttons for the selected origin
  window.origins[origin].careers.forEach(career => {
    const careerButton = document.createElement('button');
    careerButton.className = 'menu-button';
    careerButton.textContent = career.title;
    careerButton.onclick = function() {
      window.selectCareer(career.title);
    };
    careerOptionsDiv.appendChild(careerButton);
    
    // Add career description paragraph below the button
    const careerDesc = document.createElement('p');
    careerDesc.textContent = career.description;
    careerOptionsDiv.appendChild(careerDesc);
  });
  
  // Transition from intro to origin section
  document.getElementById('intro').classList.add('hidden');
  document.getElementById('originSection').classList.remove('hidden');
};

window.backToIntro = function() {
  // Return to the heritage selection screen
  document.getElementById('originSection').classList.add('hidden');
  document.getElementById('intro').classList.remove('hidden');
};

window.selectCareer = function(career) {
  // Set the selected career - force career title as string
  window.player.career = {
    title: String(career),
    description: window.prologues[career] || "A skilled professional ready for battle."
  };
  
  // Update attributes based on origin - use explicit Number conversion
  const statRange = window.statRanges[window.player.origin];
  if (statRange) {
    const physValue = Math.floor(Math.random() * (statRange.phy[1] - statRange.phy[0] + 1)) + statRange.phy[0];
    const menValue = Math.floor(Math.random() * (statRange.men[1] - statRange.men[0] + 1)) + statRange.men[0];
    
    // Force conversion to number to avoid string/type issues
    window.player.phy = Number(physValue);
    window.player.men = Number(menValue);
    
    console.log("Initial attributes set:", {
      origin: window.player.origin,
      phy: window.player.phy,
      men: window.player.men,
      phyRange: statRange.phy,
      menRange: statRange.men
    });
  } else {
    console.error("No stat range found for origin:", window.player.origin);
    window.player.phy = 2;
    window.player.men = 2;
  }
  
  // Set initial skills based on career
  window.setInitialSkills(career);
  
  // Move to the name entry screen
  document.getElementById('originSection').classList.add('hidden');
  document.getElementById('nameSection').classList.remove('hidden');
};

window.backToOrigin = function() {
  // Return to the career selection screen
  document.getElementById('nameSection').classList.add('hidden');
  document.getElementById('originSection').classList.remove('hidden');
};

window.setName = function() {
  // Get the name from the input field
  const nameInput = document.getElementById('nameInput');
  const name = nameInput.value.trim();
  
  // Validate name (not empty)
  if (name === '') {
    window.showNotification('Please enter a name for your character.', 'warning');
    return;
  }
  
  // Set the character name
  window.player.name = name;
  
  // Generate character summary
  const summary = window.generateCharacterSummary();
  document.getElementById('characterSummary').innerHTML = summary;
  
  // Move to the final character summary screen
  document.getElementById('nameSection').classList.add('hidden');
  document.getElementById('finalOutput').classList.remove('hidden');
};

window.backToName = function() {
  // Return to the name entry screen
  document.getElementById('finalOutput').classList.add('hidden');
  document.getElementById('nameSection').classList.remove('hidden');
};

window.confirmCharacter = function() {
  // Create the character and prepare for prologue
  document.getElementById('finalOutput').classList.add('hidden');
  document.getElementById('prologueSection').classList.remove('hidden');
  
  // Set prologue text based on selected career
  const prologueText = window.prologues[window.player.career.title] || "Your journey begins...";
  document.getElementById('prologueText').innerHTML = prologueText;
};

window.showEmpireUpdate = function() {
  // Show the empire update screen (second part of prologue)
  document.getElementById('prologueSection').classList.add('hidden');
  document.getElementById('empireSection').classList.remove('hidden');
  
  // Set empire update text
  document.getElementById('empireText').innerHTML = window.empireUpdateText;
};

// This function is replaced by startGameAdventure in main.js
window.startAdventure = function() {
  console.log("Legacy startAdventure called - rerouting to startGameAdventure");
  if (typeof window.startGameAdventure === 'function') {
    window.startGameAdventure();
  } else {
    // Fallback to original implementation
    document.getElementById('creator').classList.add('hidden');
    document.getElementById('gameContainer').classList.remove('hidden');
    
    // Initialize game state
    window.initializeGameState();
    
    // Update status bars and action buttons
    window.updateStatusBars();
    window.updateTimeAndDay(0); // Start at the initial time
    window.updateActionButtons();
    
    // Set initial narrative
    window.setNarrative(`${window.player.name}, a ${window.player.career.title} of ${window.player.origin} heritage, the road has been long. Nearly a season has passed since you departed the heartlands of Paan'eun, the distant spires of Cennen giving way to the endless hinterlands of the empire. Through the great riverlands and the mountain passes, across the dust-choked roads of the interior, and finally westward into the feudalscape of the Hierarchate, you have traveled. Each step has carried you further from home, deeper into the shadow of war.`);
  }
};

window.generateCharacterSummary = function() {
  // Calculate skill caps for display
  const meleeCap = Math.floor(window.player.phy / 1.5);
  const marksmanshipCap = Math.floor((window.player.phy + window.player.men) / 3);
  const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
  const commandCap = Math.floor((window.player.men * 0.8 + window.player.phy * 0.2) / 1.5);
  const mentalSkillCap = Math.floor(window.player.men / 1.5);
  
  let summary = `<p><strong>Name:</strong> ${window.player.name}</p>`;
  summary += `<p><strong>Heritage:</strong> ${window.player.origin}</p>`;
  summary += `<p><strong>Career:</strong> ${window.player.career.title}</p>`;
  summary += `<p><strong>Physical (PHY):</strong> ${window.player.phy.toFixed(2)} (Max: ${window.player.men > 0 ? Math.min(15, Math.ceil(window.player.men / 0.6)) : 15})</p>`;
  summary += `<p><strong>Mental (MEN):</strong> ${window.player.men.toFixed(2)} (Max: ${window.player.phy > 0 ? Math.min(15, Math.ceil(window.player.phy / 0.6)) : 15})</p>`;
  
  // Add career description if available
  const careerInfo = window.origins[window.player.origin].careers.find(c => c.title === window.player.career.title);
  if (careerInfo && careerInfo.description) {
    summary += `<p>${careerInfo.description}</p>`;
  }
  
  // Add skills with caps
  summary += `<p><strong>Skills:</strong></p><ul>`;
  
  // Display skills with their caps
  summary += `<li>Melee Combat: ${window.player.skills.melee.toFixed(1)} / ${meleeCap} (PHY based)</li>`;
  summary += `<li>Marksmanship: ${window.player.skills.marksmanship.toFixed(1)} / ${marksmanshipCap} (PHY+MEN based)</li>`;
  summary += `<li>Survival: ${window.player.skills.survival.toFixed(1)} / ${survivalCap} (PHY+MEN based)</li>`;
  summary += `<li>Command: ${window.player.skills.command.toFixed(1)} / ${commandCap} (MEN+some PHY based)</li>`;
  summary += `<li>Discipline: ${window.player.skills.discipline.toFixed(1)} / ${mentalSkillCap} (MEN based)</li>`;
  summary += `<li>Tactics: ${window.player.skills.tactics.toFixed(1)} / ${mentalSkillCap} (MEN based)</li>`;
  summary += `<li>Organization: ${window.player.skills.organization.toFixed(1)} / ${mentalSkillCap} (MEN based)</li>`;
  summary += `<li>Arcana: ${window.player.skills.arcana.toFixed(1)} / ${mentalSkillCap} (MEN based)</li>`;
  
  summary += `</ul>`;
  
  return summary;
};

window.setInitialSkills = function(career) {
  // Reset all skills to base values
  for (const skill in window.player.skills) {
    window.player.skills[skill] = 0;
  }
  
  // Set skills based on career - ensuring we use numbers
  if (career.includes("Regular") || career.includes("Infantry")) {
    window.player.skills.melee = Number(2);
    window.player.skills.discipline = Number(1.5);
    window.player.skills.survival = Number(1);
  } else if (career.includes("Scout") || career.includes("Harrier")) {
    window.player.skills.marksmanship = Number(2);
    window.player.skills.survival = Number(1.5);
    window.player.skills.tactics = Number(1);
  } else if (career.includes("Geister")) {
    window.player.skills.melee = Number(1);
    window.player.skills.arcana = Number(2);
    window.player.skills.discipline = Number(1.5);
    window.player.skills.tactics = Number(1);
  } else if (career.includes("Berserker") || career.includes("Primal")) {
    window.player.skills.melee = Number(2.5);
    window.player.skills.survival = Number(1.5);
  } else if (career.includes("Sellsword") || career.includes("Marine")) {
    window.player.skills.melee = Number(1.5);
    window.player.skills.marksmanship = Number(1.5);
    window.player.skills.survival = Number(1);
  } else if (career.includes("Cavalry")) {
    window.player.skills.melee = Number(2);
    window.player.skills.command = Number(1.5);
    window.player.skills.tactics = Number(1);
    window.player.skills.survival = Number(1);
  } else if (career.includes("Marauder")) {
    window.player.skills.melee = Number(1.5);
    window.player.skills.command = Number(0.5);
    window.player.skills.tactics = Number(1);
  } else if (career.includes("Corsair")) {
    window.player.skills.melee = Number(1);
    window.player.skills.survival = Number(1);
    window.player.skills.tactics = Number(1);
    window.player.skills.organization = Number(1);
  } else if (career.includes("Squire")) {
    window.player.skills.melee = Number(0.5);
    window.player.skills.discipline = Number(0.5);
    window.player.skills.organization = Number(1);
    window.player.skills.survival = Number(0.5);
  } else {
    // Default skills for unknown careers
    window.player.skills.melee = Number(1);
    window.player.skills.survival = Number(1);
  }
  
  // Add a bit of randomness to initial skill values - ensure we use numbers
  for (const skill in window.player.skills) {
    if (window.player.skills[skill] > 0) {
      const randomBonus = Number((Math.random() * 0.5).toFixed(1));
      window.player.skills[skill] = Number(window.player.skills[skill]) + Number(randomBonus);
      
      // Ensure each skill is explicitly a number
      window.player.skills[skill] = Number(window.player.skills[skill].toFixed(1));
    }
  }
  
  // Apply skill caps by attribute
  window.applyCapsToSkills();
  
  console.log("Skills initialized:", window.player.skills);
};

// New function to enforce skill caps based on attributes
window.applyCapsToSkills = function() {
  if (!window.player || !window.player.skills) return;
  
  // Calculate caps
  const meleeCap = Math.floor(window.player.phy / 1.5);
  const marksmanshipCap = Math.floor((window.player.phy + window.player.men) / 3);
  const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
  const commandCap = Math.floor((window.player.men * 0.8 + window.player.phy * 0.2) / 1.5);
  const mentalSkillCap = Math.floor(window.player.men / 1.5);
  
  // Apply caps
  window.player.skills.melee = Math.min(window.player.skills.melee, meleeCap);
  window.player.skills.marksmanship = Math.min(window.player.skills.marksmanship, marksmanshipCap);
  window.player.skills.survival = Math.min(window.player.skills.survival, survivalCap);
  window.player.skills.command = Math.min(window.player.skills.command, commandCap);
  window.player.skills.discipline = Math.min(window.player.skills.discipline, mentalSkillCap);
  window.player.skills.tactics = Math.min(window.player.skills.tactics, mentalSkillCap);
  window.player.skills.organization = Math.min(window.player.skills.organization, mentalSkillCap);
  window.player.skills.arcana = Math.min(window.player.skills.arcana, mentalSkillCap);
  
  // Round all skills to 1 decimal place
  for (const skill in window.player.skills) {
    window.player.skills[skill] = Number(window.player.skills[skill].toFixed(1));
  }
};

// Provide a helper to validate numeric attributes - useful during development
window.validatePlayerAttributes = function() {
  if (!window.player) return false;
  
  // Force numeric types for core attributes
  window.player.phy = Number(window.player.phy);
  window.player.men = Number(window.player.men);
  
  // Force numeric types for all skills
  for (const skill in window.player.skills) {
    window.player.skills[skill] = Number(window.player.skills[skill]);
  }
  
  // Reapply skill caps
  window.applyCapsToSkills();
  
  return true;
};