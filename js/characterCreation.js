// IMPROVED CHARACTER CREATION MODULE
// Functions related to character creation with enhanced type safety and skill consistency

/**
 * This file improves the character creation process by:
 * - Ensuring numeric types for attributes and skills
 * - Adding validation to prevent type conversion issues
 * - Properly handling skill caps and calculations
 * - Ensuring consistent career-based skill initialization
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
  console.log("Career selected:", career);
  
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
  
  // Reset all skills to zero before initialization
  for (const skill in window.player.skills) {
    window.player.skills[skill] = 0;
  }
  
  // Set initial skills based on career - with full career name
  window.setInitialSkills(career);
  
  // Ensure skill caps are properly applied
  window.applyCapsToSkills();
  
  // Log final skills after initialization
  console.log("Career skills initialized:", window.player.skills);
  
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
    window.setNarrative(`${window.player.name}, a ${window.player.career.title} of ${window.player.origin} heritage, the road has been long. Nearly a season has passed since you departed the heartlands of Paan'eun, the distant spires of Cennen giving way to the endless hinterlands of the empire. Through the great riverlands and the mountain passes, across the dust-choked roads of the interior, and finally westward into the feudalscape of the Hierarchate, you have traveled. Each step has carried you further from home, deeper into the shadow of war.
      
Now, you stand at the edge of your Kasvaari's Camp, the flickering lanterns and distant clang of the forges marking the heartbeat of an army in preparation. Here, amidst the hardened warriors and the banners of noble Charters, you are no longer a traveler—you are a soldier, bound to duty, drawn by the call of empire.

The Western Hierarchate is a land of towering fortresses and ancient battlefields, a realm where the scars of past campaigns linger in the earth itself. The Arrasi Peninsula lies beyond the western horizon, its crystalline plains an enigma even to those who have fought there before. Soon, you will march upon those lands, crossing the vast Wall of Nesia, where the empire's dominion falters against the unknown.

For now, your place is here, among your kin and comrades, within the Kasvaari's Camp, where the scent of oiled steel and the murmur of hushed war councils fill the air. What will you do first?`);
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

// IMPROVED: Enhanced skill initialization with better career detection
window.setInitialSkills = function(career) {
  console.log("Setting initial skills for career:", career);
  
  // Reset all skills to base values
  for (const skill in window.player.skills) {
    window.player.skills[skill] = 0;
  }
  
  // Handle career variations (with or without origin prefix)
  let careerBase = career;
  
  // Extract the base career name without origin if present (e.g., "Paanic Regular" -> "Regular")
  const careerParts = career.split(' ');
  if (careerParts.length > 1 && ["Paanic", "Nesian", "Lunarine", "Wyrdman"].includes(careerParts[0])) {
    careerBase = careerParts.slice(1).join(' ');
  }
  
  console.log("Base career detected as:", careerBase);
  
  // Set skills based on career - ensuring we use Numbers
  // Regular/Infantry careers
  if (careerBase.includes("Regular") || careerBase.includes("Infantry")) {
    window.player.skills.melee = Number(2);
    window.player.skills.discipline = Number(1.5);
    window.player.skills.survival = Number(1);
    console.log("Applied Regular/Infantry skills");
  } 
  // Scout/Harrier careers
  else if (careerBase.includes("Scout") || careerBase.includes("Harrier")) {
    window.player.skills.marksmanship = Number(2);
    window.player.skills.survival = Number(1.5);
    window.player.skills.tactics = Number(1);
    console.log("Applied Scout/Harrier skills");
  } 
  // Geister careers
  else if (careerBase.includes("Geister")) {
    window.player.skills.melee = Number(1);
    window.player.skills.arcana = Number(2);
    window.player.skills.discipline = Number(1.5);
    window.player.skills.tactics = Number(1);
    console.log("Applied Geister skills");
  } 
  // Berserker/Primal careers
  else if (careerBase.includes("Berserker") || careerBase.includes("Primal")) {
    window.player.skills.melee = Number(2.5);
    window.player.skills.survival = Number(1.5);
    console.log("Applied Berserker/Primal skills");
  } 
  // Sellsword/Marine careers
  else if (careerBase.includes("Sellsword") || careerBase.includes("Marine")) {
    window.player.skills.melee = Number(1.5);
    window.player.skills.marksmanship = Number(1.5);
    window.player.skills.survival = Number(1);
    console.log("Applied Sellsword/Marine skills");
  } 
  // Cavalry careers
  else if (careerBase.includes("Cavalry")) {
    window.player.skills.melee = Number(2);
    window.player.skills.command = Number(1.5);
    window.player.skills.tactics = Number(1);
    window.player.skills.survival = Number(1);
    console.log("Applied Cavalry skills");
  } 
  // Marauder careers
  else if (careerBase.includes("Marauder")) {
    window.player.skills.melee = Number(1.5);
    window.player.skills.command = Number(0.5);
    window.player.skills.tactics = Number(1);
    console.log("Applied Marauder skills");
  } 
  // Corsair careers
  else if (careerBase.includes("Corsair")) {
    window.player.skills.melee = Number(1);
    window.player.skills.survival = Number(1);
    window.player.skills.tactics = Number(1);
    window.player.skills.organization = Number(1);
    console.log("Applied Corsair skills");
  } 
  // Squire careers
  else if (careerBase.includes("Squire")) {
    window.player.skills.melee = Number(0.5);
    window.player.skills.discipline = Number(0.5);
    window.player.skills.organization = Number(1);
    window.player.skills.survival = Number(0.5);
    console.log("Applied Squire skills");
  } 
  // Noble Youth careers
  else if (careerBase.includes("Noble Youth")) {
    window.player.skills.melee = Number(1.5);
    window.player.skills.command = Number(1);
    window.player.skills.organization = Number(1.5);
    window.player.skills.discipline = Number(1);
    console.log("Applied Noble Youth skills");
  }
  // Plains Huntsman careers
  else if (careerBase.includes("Plains Huntsman") || careerBase.includes("Huntsman")) {
    window.player.skills.marksmanship = Number(2);
    window.player.skills.survival = Number(2);
    window.player.skills.tactics = Number(0.5);
    console.log("Applied Plains Huntsman skills");
  }
  else {
    // Default skills for unknown careers
    console.warn("Unknown career type:", career, "- applying default skills");
    window.player.skills.melee = Number(1);
    window.player.skills.survival = Number(1);
  }
  
  // Add a bit of randomness to initial skill values - ensuring we use numbers
  for (const skill in window.player.skills) {
    if (window.player.skills[skill] > 0) {
      // Generate a random bonus between 0.0 and 0.3 (less variance than before)
      const randomBonus = Number((Math.random() * 0.3).toFixed(1));
      
      // Add the bonus
      window.player.skills[skill] = Number(window.player.skills[skill]) + Number(randomBonus);
      
      // Ensure each skill is explicitly a number and rounded to 1 decimal place
      window.player.skills[skill] = Math.round(window.player.skills[skill] * 10) / 10;
    }
  }
  
  // Log the pre-capped skills
  console.log("Skills before applying caps:", {...window.player.skills});
  
  // Apply skill caps by attribute
  window.applyCapsToSkills();
  
  console.log("Final skills after initialization and caps:", {...window.player.skills});
};

// Enhanced function to enforce skill caps based on attributes
window.applyCapsToSkills = function() {
  if (!window.player || !window.player.skills) {
    console.error("Cannot apply caps - player or skills not initialized");
    return;
  }
  
  // Ensure PHY and MEN are numeric
  window.player.phy = Number(window.player.phy);
  window.player.men = Number(window.player.men);
  
  // Calculate caps
  const meleeCap = Math.floor(window.player.phy / 1.5);
  const marksmanshipCap = Math.floor((window.player.phy + window.player.men) / 3);
  const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
  const commandCap = Math.floor((window.player.men * 0.8 + window.player.phy * 0.2) / 1.5);
  const mentalSkillCap = Math.floor(window.player.men / 1.5);
  
  console.log("Calculated skill caps:", {
    meleeCap,
    marksmanshipCap,
    survivalCap,
    commandCap,
    mentalSkillCap
  });
  
  // Apply caps - using variables instead of recalculating for consistency
  window.player.skills.melee = Math.min(Number(window.player.skills.melee), meleeCap);
  window.player.skills.marksmanship = Math.min(Number(window.player.skills.marksmanship), marksmanshipCap);
  window.player.skills.survival = Math.min(Number(window.player.skills.survival), survivalCap);
  window.player.skills.command = Math.min(Number(window.player.skills.command), commandCap);
  window.player.skills.discipline = Math.min(Number(window.player.skills.discipline), mentalSkillCap);
  window.player.skills.tactics = Math.min(Number(window.player.skills.tactics), mentalSkillCap);
  window.player.skills.organization = Math.min(Number(window.player.skills.organization), mentalSkillCap);
  window.player.skills.arcana = Math.min(Number(window.player.skills.arcana), mentalSkillCap);
  
  // Round all skills to 1 decimal place
  for (const skill in window.player.skills) {
    window.player.skills[skill] = Math.round(Number(window.player.skills[skill]) * 10) / 10;
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