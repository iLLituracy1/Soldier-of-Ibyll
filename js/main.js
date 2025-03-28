// IMPROVED MAIN GAME MODULE
// Provides a structured initialization sequence and handles core game flow

/**
 * This file consolidates the game initialization flow and eliminates timing issues
 * by providing a clear sequence of operations. It incorporates save/load functionality
 * and main menu integration.
 */

// ================= GAME INITIALIZATION SEQUENCE =================

// Master initialization function - the single entry point for game setup
window.initializeGame = function() {
  console.log("Game initializing...");
  
  // Phase 1: Set up event handlers for UI elements
  setupEventHandlers();
  
  // Phase 2: Initialize item templates if needed
  if (!window.itemTemplates || Object.keys(window.itemTemplates).length === 0) {
    console.log("Initializing item templates");
    window.initializeItemTemplates();
  }
  
  // Phase 3: Initialize the save/load system
  if (window.initializeSaveLoadSystem) {
    console.log("Initializing save/load system");
    window.initializeSaveLoadSystem();
  }
  
  // Phase 4: Show main menu (instead of going straight to character creation)
  document.getElementById('mainMenuScreen').classList.remove('hidden');
  document.getElementById('creator').classList.add('hidden');
  document.getElementById('gameContainer').classList.add('hidden');
  
  console.log("Game initialized and ready to play!");
};

// Function to set up all event listeners
function setupEventHandlers() {
  console.log("Setting up event handlers...");
  
  // Character creation buttons
  document.getElementById('paanic-button')?.addEventListener('click', function() {
    window.selectOrigin('Paanic');
  });
  
  document.getElementById('nesian-button')?.addEventListener('click', function() {
    window.selectOrigin('Nesian');
  });
  
  document.getElementById('lunarine-button')?.addEventListener('click', function() {
    window.selectOrigin('Lunarine');
  });
  
  document.getElementById('wyrdman-button')?.addEventListener('click', function() {
    window.selectOrigin('Wyrdman');
  });
  
  // Character creation navigation
  document.getElementById('back-to-intro-button')?.addEventListener('click', window.backToIntro);
  document.getElementById('back-to-origin-button')?.addEventListener('click', window.backToOrigin);
  document.getElementById('confirm-name-button')?.addEventListener('click', window.setName);
  document.getElementById('back-to-name-button')?.addEventListener('click', window.backToName);
  document.getElementById('confirm-character-button')?.addEventListener('click', window.confirmCharacter);
  document.getElementById('continue-to-empire-button')?.addEventListener('click', window.showEmpireUpdate);
  
  // Start adventure button - properly handles game start
  document.getElementById('start-adventure-button')?.addEventListener('click', function() {
    window.startGameAdventure();
  });
  
  // Panel close buttons
  document.querySelector('#profile .panel-close')?.addEventListener('click', function() {
    document.getElementById('profile').classList.add('hidden');
  });
  
  document.querySelector('#inventory .panel-close')?.addEventListener('click', function() {
    document.getElementById('inventory').classList.add('hidden');
  });
  
  // Add return to main menu button to game controls (in side panel)
  const addMainMenuButton = function() {
    const gameControls = document.querySelectorAll('.game-controls');
    
    gameControls.forEach(controlPanel => {
      // FIXED: Check specifically for a main menu button using class and text content
      if (controlPanel.querySelector('.control-btn[data-purpose="main-menu"]')) {
        return; // Button already exists in this panel
      }
      
      // Create the button
      const menuButton = document.createElement('button');
      menuButton.className = 'control-btn';
      menuButton.setAttribute('data-purpose', 'main-menu'); // Add identifier attribute
      menuButton.innerHTML = '<i class="fas fa-home"></i>Main Menu';
      menuButton.onclick = window.returnToMainMenu;
      
      // Add to the panel
      controlPanel.appendChild(menuButton);
    });
  };
  
  // FIXED: Call only once, and if needed set a timeout for a safety check
  addMainMenuButton();
  
  // Safety check in case some elements weren't loaded yet
  setTimeout(() => {
    const gameControls = document.querySelectorAll('.game-controls');
    
    // Only add buttons to panels that don't have them yet
    gameControls.forEach(panel => {
      if (!panel.querySelector('.control-btn[data-purpose="main-menu"]')) {
        const menuButton = document.createElement('button');
        menuButton.className = 'control-btn';
        menuButton.setAttribute('data-purpose', 'main-menu');
        menuButton.innerHTML = '<i class="fas fa-home"></i>Main Menu';
        menuButton.onclick = window.returnToMainMenu;
        panel.appendChild(menuButton);
      }
    });
  }, 1000);
  
  console.log("Event handlers set up");
}

// REMOVED: Return to main menu function is now solely defined in saveLoadSystem.js

// ================= GAME START & ADVENTURE SEQUENCE =================

// Improved startAdventure function with proper inventory integration
window.startGameAdventure = function() {
  console.log("Starting game adventure");
  
  // Phase 1: Hide character creation, show game container
  document.getElementById('creator').classList.add('hidden');
  document.getElementById('gameContainer').classList.remove('hidden');
  
  // Phase 2: Initialize game state
  window.initializeGameState();

  // Phase 2.5: Initialize campaign system
  if (typeof window.initializeCampaignSystem === 'function') {
    console.log("Initializing campaign system");
    window.initializeCampaignSystem();
  }
  
  // Phase 3: Initialize item templates if needed
  if (!window.itemTemplates || Object.keys(window.itemTemplates).length === 0) {
    console.log("Initializing item templates");
    window.initializeItemTemplates();
  }
  
  // Phase 4: Initialize full inventory system
  if (window.initializeFullInventorySystem) {
    console.log("Initializing full inventory system");
    window.initializeFullInventorySystem();
  } else {
    console.error("Full inventory system not found - falling back to basic initialization");
    if (window.initializeInventorySystem) window.initializeInventorySystem();
    if (window.initializeInventoryUI) window.initializeInventoryUI();
  }
  
  // Phase 5: Initialize ammunition system
  if (window.initializeAmmunition) {
    console.log("Initializing ammunition system");
    window.initializeAmmunition();
  }

  // Phase 5.5: Initialize feats system
  if (window.initializeFeatsSystem) {
    console.log("Initializing feats system");
    window.initializeFeatsSystem();
  }

  // Phase 5.7: Initialize campaign system if not already done
  if (typeof window.initializeCampaignSystem === 'function') {
    console.log("Initializing campaign system");
    window.initializeCampaignSystem();
  }
  
  // Phase 6: Add and equip starting items
  if (window.addStartingItems) {
    console.log("Adding starting items based on career");
    window.addStartingItems();
  }
  
  // Phase 7: Add save game button to UI
  if (window.addSaveGameButton) {
    console.log("Adding save game button");
    window.addSaveGameButton();
  }
  
  // Phase 8: Update UI
  window.updateStatusBars();
  window.updateTimeAndDay(0); // Start at the initial time
  window.updateActionButtons();
  
  // Start camp music
  if (window.setMusicContext) {
    window.setMusicContext('camp', 'campMarch');
  }
  
  // Phase 9: Set initial narrative
  window.setNarrative(`${window.player.name}, a ${window.player.career.title} of ${window.player.origin} heritage, the road has been long. Nearly a season has passed since you departed the heartlands of Paan'eun, the distant spires of Cennen giving way to the endless hinterlands of the empire. Through the great riverlands and the mountain passes, across the dust-choked roads of the interior, and finally westward into the feudalscape of the Hierarchate, you have traveled. Each step has carried you further from home, deeper into the shadow of war.<br><br>
  Now, you stand at the edge of your Kasvaari's Camp, the flickering lanterns and distant clang of the forges marking the heartbeat of an army in preparation. Here, amidst the hardened warriors and the banners of noble Charters, you are no longer a traveler—you are a soldier, bound to duty, drawn by the call of empire.<br><br>
  The Western Hierarchate is a land of towering fortresses and ancient battlefields, a realm where the scars of past campaigns linger in the earth itself. The Arrasi Peninsula lies beyond the western horizon, its crystalline plains an enigma even to those who have fought there before. Soon, you will march upon those lands, crossing the vast Wall of Nesia, where the empire's dominion falters against the unknown.<br><br>
  For now, your place is here, among your kin and comrades, within the Kasvaari's Camp, where the scent of oiled steel and the murmur of hushed war councils fill the air. What will you do first?`);

  console.log("Game adventure started successfully");
};

// ================= ACTION HANDLING =================

// Add missing handleInventoryClick function
window.handleInventoryClick = function() {
  console.log("Opening inventory");
  
  // Make sure inventory system is initialized
  if (!window.player.equipment) {
    console.log("Initializing inventory system on first open");
    window.initializeInventorySystem();
  }
  
  // Display the inventory panel
  const inventoryPanel = document.getElementById('inventory');
  inventoryPanel.classList.remove('hidden');
  
  // Ensure inventory UI is initialized
  if (!document.querySelector('.paperdoll')) {
    console.log("Initializing inventory UI on first open");
    window.initializeInventoryUI();
  }
  
  // Render inventory items
  window.renderInventoryItems();
  window.updateEquipmentDisplay();
};

// Improved action handler with inventory support
window.handleAction = function(action) {
  console.log('Action handled:', action);
  
  // Special panel actions
  if (action === 'profile') {
    window.handleProfile();
    return;
  } else if (action === 'inventory') {
    window.handleInventoryClick();
    return;
  } else if (action === 'feats') {
    window.showFeatsPanel();
    return;
  }
  
  // Show submenu actions
  if (action === 'train') {
    window.showTrainingOptions();
    return;
  } else if (action === 'gambling') {
    window.showGamblingOptions();
    return;
  } else if (action === 'brawler_pits') {
    window.showBrawlerPitOptions();
    return;
  }
  
  // Handle specific training types
  if (action === 'physical_training' || action === 'mental_training' || 
      action === 'melee_drill' || action === 'ranged_drill' || action === 'squad_exercises') {
    window.handleTraining(action);
    return;
  }
  
  // Handle specific gambling activities
  if (action === 'play_cards' || action === 'play_dice') {
    window.handleGambling(action);
    return;
  }
  
  // Handle specific brawler pit activities
  if (action === 'novice_match' || action === 'standard_match' || action === 'veteran_match') {
    window.handleBrawl(action);
    return;
  }
  
  // Handle going back from submenus
  if (action === 'back_from_training' || action === 'back_from_gambling' || action === 'back_from_brawler') {
    // Show main action buttons again
    window.updateActionButtons();
    return;
  }
  
  // Handle core camp actions
  if (action === 'rest') {
    handleRestAction();
  } else if (action === 'patrol') {
    handlePatrolAction();
  } else if (action === 'mess') {
    handleMessAction();
  } else if (action === 'guard') {
    handleGuardAction();
  }
  
  // Check for level up after actions
  window.checkLevelUp();
};

// Action handler for rest
function handleRestAction() {
  // Rest action
  const timeOfDay = window.getTimeOfDay();
  let restIndex = 0;
  
  if (timeOfDay === 'day') {
    restIndex = Math.floor(Math.random() * 2); // First two rest narratives
  } else if (timeOfDay === 'evening') {
    restIndex = 2 + Math.floor(Math.random() * 2); // Middle two rest narratives
  } else {
    restIndex = 4 + Math.floor(Math.random() * 2); // Last two rest narratives
  }
  
  const restText = window.narrativeElements.rest[restIndex];
  window.setNarrative(restText);
  
  // Recovery depends on time of day
  let healthRecovery = 5;
  let staminaRecovery = 15;
  
  if (timeOfDay === 'night') {
    healthRecovery = 15;
    staminaRecovery = 40;
  } else if (timeOfDay === 'evening') {
    healthRecovery = 10;
    staminaRecovery = 25;
  }
  
  // Update game state
  window.gameState.health = Math.min(window.gameState.maxHealth, window.gameState.health + healthRecovery);
  window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + staminaRecovery);
  
  // Update UI
  window.updateStatusBars();
  window.updateProfileIfVisible();
  
  // Time passed depends on time of day
  let timePassed = 120; // Default for daytime rest
  if (timeOfDay === 'night') {
    timePassed = 480; // 8 hours for night rest
  } else if (timeOfDay === 'evening') {
    timePassed = 120; // 2 hours for evening rest
  }
  
  window.updateTimeAndDay(timePassed);
  
  // Show notification
  window.showNotification(`Rested and recovered ${healthRecovery} health and ${staminaRecovery} stamina`, 'success');
}

// Action handler for patrol
function handlePatrolAction() {
  // Check if already patrolled today
  if (window.gameState.dailyPatrolDone) {
    window.showNotification("You've already completed your patrol duty for today.", 'warning');
    return;
  }
  
  // Check if player has enough stamina
  if (window.gameState.stamina < 25) {
    window.showNotification("You're too exhausted to patrol effectively. Rest first.", 'warning');
    return;
  }
  
  // Determine if combat occurs (30% chance)
  const combatChance = 0.3;
  const encounterRoll = Math.random();
  
  if (encounterRoll < combatChance) {
    // Begin combat sequence
    window.setNarrative("While on patrol, you encounter a hostile figure lurking near the camp perimeter. They draw their weapon when they spot you!");
    
    // Ensure combat system is initialized
    if (!window.combatSystem || !window.combatSystem.initialized) {
      console.error("Combat system not initialized properly");
      window.showNotification("Combat system error - continuing patrol", 'warning');
      proceedWithNormalPatrol();
      return;
    }
    
    // Select an appropriate enemy
    const enemyTypes = ["ARRASI_VAELGORR", "IMPERIAL_DESERTER"];
    const randomEnemy = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    // Log for debugging
    console.log("Starting combat with enemy:", randomEnemy);
    
    // Show combat interface manually in case it's hidden
    document.getElementById('combatInterface').classList.remove('hidden');
    
    // Initiate combat with slight delay for narrative flow
    setTimeout(() => {
      try {
        // Explicitly call the combat initiation function
        window.combatSystem.initiateCombat(randomEnemy);
        
        // Set game state flags
        window.gameState.stamina = Math.max(0, window.gameState.stamina - 15);
        window.gameState.dailyPatrolDone = true;
        
        // Update UI
        window.updateStatusBars();
      } catch (error) {
        console.error("Combat initiation error:", error);
        window.showNotification("Combat failed to start - continuing patrol", 'warning');
        proceedWithNormalPatrol();
      }
    }, 1000);
    
    return;
  }
  
  // If no combat, proceed with normal patrol
  proceedWithNormalPatrol();
}

// Extract normal patrol logic to reuse
function proceedWithNormalPatrol() {
  // Patrol action
  const patrolText = window.narrativeElements.patrol[Math.floor(Math.random() * window.narrativeElements.patrol.length)];
  window.setNarrative(patrolText);
  
  // Update game state
  window.gameState.stamina = Math.max(0, window.gameState.stamina - 25);
  window.gameState.dailyPatrolDone = true;

  
  // Small chance to improve survival skill
  const survivalImprovement = parseFloat((Math.random() * 0.03 + 0.02).toFixed(2));
  const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
  
  if (Math.random() < 0.3 && window.player.skills.survival < survivalCap) {
    window.player.skills.survival = Math.min(survivalCap, window.player.skills.survival + survivalImprovement);
    window.showNotification(`Your survival skills improved by ${survivalImprovement}`, 'success');
  }
  
  // Chance to discover brawler pits
  if (!window.gameState.discoveredBrawlerPits && Math.random() < 0.10) {
    window.gameState.discoveredBrawlerPits = true;
    window.addToNarrative("During your patrol, you overhear whispers about underground fighting pits where soldiers test their mettle and bet on matches. Such activities aren't officially sanctioned, but they seem to be an open secret in the camp.");
    window.showNotification("Discovered: Brawler Pits! New activity unlocked at night.", 'success');
  }
  
  // Update UI
  window.updateStatusBars();
  window.updateProfileIfVisible();
  window.updateTimeAndDay(120); // 2 hours
  
  // Show notification
  window.showNotification("Patrol complete!", 'success');
}

// Action handler for mess hall
function handleMessAction() {
  // Mess hall action
  const messText = window.narrativeElements.mess[Math.floor(Math.random() * window.narrativeElements.mess.length)];
  window.setNarrative(messText);
  
  // Update game state
  window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + 15);
  window.gameState.morale = Math.min(100, window.gameState.morale + 5);
  
  // Chance to discover gambling tent during mess
  if (!window.gameState.discoveredGamblingTent && Math.random() < 0.3) {
    window.gameState.discoveredGamblingTent = true;
    window.addToNarrative("As you finish your meal, you notice a group of soldiers huddled in the corner of the mess tent. The clink of coins and hushed exclamations draw your attention. One of them notices your interest and nods toward a larger tent near the edge of camp. \"Games start after dusk,\" he mutters. \"Bring your taelors if you're feeling lucky.\"");
    window.showNotification("Discovered: Gambling Tent! New activity unlocked at night.", 'success');
  }
  
  // Small chance to improve organization skill
  const organizationImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
  const mentalSkillCap = Math.floor(window.player.men / 1.5);
  
  if (Math.random() < 0.15 && window.player.skills.organization < mentalSkillCap) {
    window.player.skills.organization = Math.min(mentalSkillCap, window.player.skills.organization + organizationImprovement);
    window.showNotification(`Your organization skills improved by ${organizationImprovement}`, 'success');
  }
  
  // Update UI
  window.updateStatusBars();
  window.updateProfileIfVisible();
  window.updateTimeAndDay(45); // 45 minutes
  
  // Show notification
  window.showNotification("Meal complete! Recovered stamina and morale", 'success');
}

// Action handler for guard duty
function handleGuardAction() {
  // Check if player has enough stamina
  if (window.gameState.stamina < 20) {
    window.showNotification("You're too exhausted for guard duty. Rest first.", 'warning');
    return;
  }
  
  // Guard duty action
  const guardText = window.narrativeElements.guard[Math.floor(Math.random() * window.narrativeElements.guard.length)];
  window.setNarrative(guardText);
  
  // Update game state
  window.gameState.stamina = Math.max(0, window.gameState.stamina - 20);

  // Chance to improve discipline or tactics skill
  const skillImprovement = parseFloat((Math.random() * 0.04 + 0.06).toFixed(2));
  const mentalSkillCap = Math.floor(window.player.men / 1.5);
  
  if (Math.random() < 0.3) {
    if (Math.random() < 0.5 && window.player.skills.discipline < mentalSkillCap) {
      window.player.skills.discipline = Math.min(mentalSkillCap, window.player.skills.discipline + skillImprovement);
      window.showNotification(`Your discipline improved by ${skillImprovement}.`, 'success');
    } else if (window.player.skills.tactics < mentalSkillCap) {
      window.player.skills.tactics = Math.min(mentalSkillCap, window.player.skills.tactics + skillImprovement);
      window.showNotification(`Your tactical thinking improved by ${skillImprovement}.`, 'success');
    }
  }
  
  // Update UI
  window.updateStatusBars();
  window.updateProfileIfVisible();
  window.updateTimeAndDay(180); // 3 hours
  
  // Show notification
  window.showNotification("Guard duty complete!", 'success');
}

// ================= GAME INITIALIZATION BOOTSTRAP =================

// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, initializing game");
  window.initializeGame();
});