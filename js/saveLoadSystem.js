// SAVE & LOAD SYSTEM MODULE
// Handles game saving, loading, and main menu functionality

// Define constants for localStorage
const SAVE_KEY_PREFIX = 'soldierOfIbyll_save_';
const SAVE_LIST_KEY = 'soldierOfIbyll_saveList';
const MAX_SAVES = 5;  // Maximum number of save slots

// Initialize the save/load system
window.initializeSaveLoadSystem = function() {
  console.log("Initializing save/load system...");
  
  // Check for existing saves and enable/disable load button
  updateLoadButtonState();
  
  // Attach event listeners to main menu buttons
  document.getElementById('newGameBtn').addEventListener('click', startNewGame);
  document.getElementById('loadGameBtn').addEventListener('click', showLoadGameMenu);
  document.getElementById('creditsBtn').addEventListener('click', showCreditsScreen);
  
  // Attach event listeners to save/load menu buttons
  document.getElementById('closeSaveMenuBtn').addEventListener('click', hideSaveGameMenu);
  document.getElementById('closeLoadMenuBtn').addEventListener('click', hideLoadGameMenu);
  document.getElementById('closeCreditsBtn').addEventListener('click', hideCreditsScreen);
  document.getElementById('createNewSaveBtn').addEventListener('click', createNewSave);
  
  console.log("Save/load system initialized");
};

// Update load button state based on available saves
function updateLoadButtonState() {
  const saveList = getSaveList();
  const loadButton = document.getElementById('loadGameBtn');
  
  if (saveList && saveList.length > 0) {
    loadButton.disabled = false;
  } else {
    loadButton.disabled = true;
  }
}

// Get the list of saves from localStorage
function getSaveList() {
  const saveListJSON = localStorage.getItem(SAVE_LIST_KEY);
  return saveListJSON ? JSON.parse(saveListJSON) : [];
}

// Update the save list in localStorage
function updateSaveList(saveList) {
  localStorage.setItem(SAVE_LIST_KEY, JSON.stringify(saveList));
  updateLoadButtonState();
}

// Start a new game
function startNewGame() {
  console.log("Starting new game...");
  
  // Hide main menu
  document.getElementById('mainMenuScreen').classList.add('hidden');
  
  // Show character creator
  document.getElementById('creator').classList.remove('hidden');
  
  // Reset game state
  resetGameState();
}

// Reset the game state for a new game
function resetGameState() {
  // Reset player object
  window.player = {
    origin: null,
    career: null,
    name: "",
    phy: 0,
    men: 0,
    skills: {
      melee: 0,
      marksmanship: 0,
      survival: 0,
      command: 0,
      discipline: 0,
      tactics: 0,
      organization: 0,
      arcana: 0
    },
    inventory: [],
    taelors: 25,
    events: []
  };
  
  // Reset game state object
  window.gameState = {
    experience: 0,
    level: 1,
    skillPoints: 0,
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    morale: 75,
    weather: "clear",
    campMorale: 70,
    arrivalProcessed: false,
    firstBriefingCompleted: false,
    trainingProgress: 0,
    dailyTrainingCount: 0,
    inStoryEncounter: false,
    inQuestSequence: false,
    awaitingQuestResponse: false,
    dailyPatrolDone: false,
    dailyScoutDone: false,
    inBattle: false,
    currentEnemy: null,
    inMission: false,
    currentMission: null,
    missionStage: 0,
    combatVictoryAchieved: false,
    discoveredBrawlerPits: false,
    discoveredGamblingTent: false
  };
  
  // Reset time and day
  window.gameTime = 480; // 8:00 AM
  window.gameDay = 1;
  
  console.log("Game state reset for new game");
}

// Show the load game menu
function showLoadGameMenu() {
  console.log("Showing load game menu");
  
  // Populate save slots
  populateLoadSlots();
  
  // Show the load game menu
  document.getElementById('loadGameMenu').classList.remove('hidden');
}

// Populate the load slots with saved games
function populateLoadSlots() {
  const loadSlotsContainer = document.getElementById('loadSlots');
  loadSlotsContainer.innerHTML = '';
  
  const saveList = getSaveList();
  
  if (!saveList || saveList.length === 0) {
    loadSlotsContainer.innerHTML = '<div class="empty-slots-message">No saved games found.</div>';
    return;
  }
  
  // Sort saves by date (newest first)
  saveList.sort((a, b) => b.timestamp - a.timestamp);
  
  // Create a slot for each save
  saveList.forEach(save => {
    const saveSlot = document.createElement('div');
    saveSlot.className = 'save-slot';
    
    // Format date
    const saveDate = new Date(save.timestamp);
    const formattedDate = saveDate.toLocaleDateString() + ' ' + saveDate.toLocaleTimeString();
    
    saveSlot.innerHTML = `
      <div class="save-slot-info">
        <div class="save-slot-title">${save.title}</div>
        <div class="save-slot-details">
          ${save.playerName}, ${save.career} - Day ${save.day}
          <br>
          Saved: ${formattedDate}
        </div>
      </div>
      <div class="save-slot-actions">
        <button class="slot-btn load-btn" title="Load Game"><i class="fas fa-play"></i></button>
        <button class="slot-btn delete-btn" title="Delete Save"><i class="fas fa-trash"></i></button>
      </div>
    `;
    
    // Add event listeners
    saveSlot.querySelector('.load-btn').addEventListener('click', () => {
      loadGame(save.id);
    });
    
    saveSlot.querySelector('.delete-btn').addEventListener('click', () => {
      deleteSave(save.id);
    });
    
    loadSlotsContainer.appendChild(saveSlot);
  });
}

// Hide the load game menu
function hideLoadGameMenu() {
  document.getElementById('loadGameMenu').classList.add('hidden');
}

// Completely reset and reinitialize the game environment
function resetAndReinitializeGame() {
  console.log("Performing complete game system reinitialization");
  
  // Reset all templates
  window.itemTemplates = {};
  
  // Initialize templates
  if (typeof window.initializeItemTemplates === 'function') {
    window.initializeItemTemplates();
    console.log(`Initialized ${Object.keys(window.itemTemplates).length} item templates`);
  }
  
  // Initialize all core systems
  if (typeof window.initializeFullInventorySystem === 'function') {
    window.initializeFullInventorySystem();
  } else {
    // Fallback initializations
    if (typeof window.initializeInventorySystem === 'function') {
      window.initializeInventorySystem();
    }
    if (typeof window.initializeInventoryUI === 'function') {
      window.initializeInventoryUI();
    }
    if (typeof window.initializeAmmunition === 'function') {
      window.initializeAmmunition();
    }
  }
  
  // Initialize other systems as needed
  if (typeof window.initializeQuestSystem === 'function') {
    window.initializeQuestSystem();
  }
  
  console.log("Game systems reinitialized");
}

// Create new items from saved data instead of trying to restore references
function rebuildInventoryItems(savedInventory) {
  if (!savedInventory || !Array.isArray(savedInventory) || savedInventory.length === 0) {
    console.log("No inventory items to rebuild");
    return [];
  }
  
  console.log(`Rebuilding ${savedInventory.length} inventory items from save data`);
  
  const newInventory = [];
  
  // Process each saved item
  savedInventory.forEach((savedItem, index) => {
    try {
      if (!savedItem || !savedItem.templateId) {
        console.warn(`Invalid item at index ${index}, skipping`);
        return;
      }
      
      // Find matching template by ID
      const templateId = savedItem.templateId;
      let template = window.itemTemplates[templateId];
      
      // If direct match fails, try to find a similar template
      if (!template) {
        // Try without underscores
        const noUnderscoreId = templateId.replace(/_/g, '');
        
        for (const id in window.itemTemplates) {
          const cleanId = id.replace(/_/g, '');
          if (cleanId.toLowerCase() === noUnderscoreId.toLowerCase()) {
            template = window.itemTemplates[id];
            console.log(`Found alternative template for ${templateId}: ${id}`);
            break;
          }
        }
        
        // Try by category and name keywords
        if (!template) {
          // Find default template based on item type
          if (templateId.includes('potion')) {
            template = window.itemTemplates.healthPotion || window.itemTemplates['health_potion'];
          } else if (templateId.includes('sword')) {
            template = window.itemTemplates.basicSword || window.itemTemplates['basic_sword'];
          } else if (templateId.includes('armor')) {
            template = window.itemTemplates.legionArmor || window.itemTemplates['legion_armor'];
          } else if (templateId.includes('javelin') || templateId.includes('pack')) {
            template = window.itemTemplates.javelinPack || window.itemTemplates['javelin_pack'];
          }
        }
      }
      
      // If we still can't find a template, create a generic one
      if (!template) {
        console.warn(`Could not find template for ${templateId}, creating placeholder`);
        
        // Create a generic template based on category hints in the ID
        if (templateId.includes('potion')) {
          template = window.createConsumable({
            id: 'generic_potion',
            name: 'Generic Potion',
            description: 'A replacement potion.',
            value: 20
          });
        } else if (templateId.includes('sword') || templateId.includes('weapon')) {
          template = window.createWeapon({
            id: 'generic_weapon',
            name: 'Generic Weapon',
            description: 'A replacement weapon.',
            damage: 8
          });
        } else if (templateId.includes('armor')) {
          template = window.createArmor({
            id: 'generic_armor',
            name: 'Generic Armor',
            description: 'A replacement armor piece.',
            defense: 8
          });
        } else {
          // Last resort - generic item
          template = window.createItemTemplate({
            id: 'generic_item',
            name: 'Generic Item',
            description: 'A replacement item.',
            category: window.ITEM_CATEGORIES.MATERIAL
          });
        }
      }
      
      // Create new item instance from template
      const newItem = window.createItemInstance(template, savedItem.quantity || 1);
      
      // Copy over critical properties from the saved item
      if (savedItem.equipped) newItem.equipped = true;
      if (savedItem.durability !== undefined) newItem.durability = savedItem.durability;
      
      // Special handling for ammunition
      if (savedItem.capacity !== undefined) newItem.capacity = savedItem.capacity;
      if (savedItem.currentAmount !== undefined) newItem.currentAmount = savedItem.currentAmount;
      
      // Add to new inventory
      newInventory.push(newItem);
      
    } catch (error) {
      console.error(`Error rebuilding inventory item ${index}:`, error);
    }
  });
  
  console.log(`Successfully rebuilt ${newInventory.length} out of ${savedInventory.length} inventory items`);
  return newInventory;
}

// Rebuild equipment slots from saved data
function rebuildEquipment(savedEquipment) {
  if (!savedEquipment) {
    console.log("No equipment to rebuild");
    return {};
  }
  
  console.log("Rebuilding equipment from save data");
  
  const newEquipment = {};
  
  // Check if player is cavalry to handle mount slot
  const isCavalry = window.player.career && window.player.career.title === "Castellan Cavalry";
  console.log(`Rebuilding equipment for ${isCavalry ? 'cavalry' : 'non-cavalry'} character`);
  
  // Track which slots we need to fill
  const requiredSlots = ['head', 'body', 'mainHand', 'offHand', 'accessory', 'ammunition'];
  
  // Add mount slot if player is cavalry
  if (isCavalry) {
    requiredSlots.push('mount');
  }
  
  // Process each slot
  for (const slot in savedEquipment) {
    const savedItem = savedEquipment[slot];
    
    // Skip empty slots or "occupied" marker
    if (!savedItem || savedItem === "occupied") {
      newEquipment[slot] = savedItem; // Copy as is
      continue;
    }
    
    try {
      // Find matching template by ID
      const templateId = savedItem.templateId;
      let template = window.itemTemplates[templateId];
      
      // If direct match fails, try to find a similar template
      if (!template) {
        // Try without underscores
        const noUnderscoreId = templateId.replace(/_/g, '');
        
        for (const id in window.itemTemplates) {
          const cleanId = id.replace(/_/g, '');
          if (cleanId.toLowerCase() === noUnderscoreId.toLowerCase()) {
            template = window.itemTemplates[id];
            console.log(`Found alternative template for ${templateId}: ${id}`);
            break;
          }
        }
        
        // Find by slot type if still not found
        if (!template) {
          // Find a template that fits this slot
          for (const id in window.itemTemplates) {
            const testTemplate = window.itemTemplates[id];
            if (testTemplate.equipSlot === slot) {
              template = testTemplate;
              console.log(`Using alternative template ${id} for ${slot} slot`);
              break;
            }
          }
        }
      }
      
      // If we found a template, create a new item
      if (template) {
        const newItem = window.createItemInstance(template);
        newItem.equipped = true;
        
        // Copy over critical properties from the saved item
        if (savedItem.durability !== undefined) newItem.durability = savedItem.durability;
        
        // Special handling for ammunition
        if (slot === 'ammunition') {
          newItem.capacity = savedItem.capacity || template.capacity || 20;
          newItem.currentAmount = savedItem.currentAmount !== undefined ? 
            savedItem.currentAmount : newItem.capacity;
        }
        
        // Add to equipment
        newEquipment[slot] = newItem;
      } else {
        console.warn(`Could not find template for ${slot} equipment, leaving empty`);
        newEquipment[slot] = null;
      }
    } catch (error) {
      console.error(`Error rebuilding equipment in slot ${slot}:`, error);
      newEquipment[slot] = null;
    }
  }
  
  // Ensure all required slots exist
  requiredSlots.forEach(slot => {
    if (newEquipment[slot] === undefined) {
      newEquipment[slot] = null;
    }
  });
  
  console.log("Equipment rebuilt successfully");
  return newEquipment;
}

// Load a game by ID - COMPLETELY REWRITTEN
function loadGame(saveId) {
  console.log(`Loading game with ID: ${saveId}`);
  
  try {
    // Get the save data
    const saveJSON = localStorage.getItem(SAVE_KEY_PREFIX + saveId);
    if (!saveJSON) {
      window.showNotification('Error: Save data not found.', 'error');
      return;
    }
    
    const saveData = JSON.parse(saveJSON);
    
    if (!saveData || !saveData.player) {
      window.showNotification('Error: Save data is corrupt.', 'error');
      return;
    }
    
    // Store career for special handling
    const playerCareer = saveData.player.career ? saveData.player.career.title : '';
    const isCavalry = playerCareer === "Castellan Cavalry";
    console.log(`Loading game for ${playerCareer}${isCavalry ? ' (Cavalry with mount)' : ''}`);
    
    // STEP 1: Completely reset and initialize all game systems
    resetAndReinitializeGame();
    
    // STEP 2: Restore basic game state
    window.gameTime = saveData.gameTime;
    window.gameDay = saveData.gameDay;
    
    // Load game state object with fallbacks for missing properties
    window.gameState = {
      experience: saveData.gameState.experience || 0,
      level: saveData.gameState.level || 1,
      skillPoints: saveData.gameState.skillPoints || 0,
      health: saveData.gameState.health || 100,
      maxHealth: saveData.gameState.maxHealth || 100,
      stamina: saveData.gameState.stamina || 100,
      maxStamina: saveData.gameState.maxStamina || 100,
      morale: saveData.gameState.morale || 75,
      weather: saveData.gameState.weather || "clear",
      campMorale: saveData.gameState.campMorale || 70,
      arrivalProcessed: saveData.gameState.arrivalProcessed || false,
      firstBriefingCompleted: saveData.gameState.firstBriefingCompleted || false,
      trainingProgress: saveData.gameState.trainingProgress || 0,
      dailyTrainingCount: saveData.gameState.dailyTrainingCount || 0,
      inStoryEncounter: saveData.gameState.inStoryEncounter || false,
      inQuestSequence: saveData.gameState.inQuestSequence || false,
      awaitingQuestResponse: saveData.gameState.awaitingQuestResponse || false,
      dailyPatrolDone: saveData.gameState.dailyPatrolDone || false,
      dailyScoutDone: saveData.gameState.dailyScoutDone || false,
      inBattle: saveData.gameState.inBattle || false,
      currentEnemy: saveData.gameState.currentEnemy || null,
      inMission: saveData.gameState.inMission || false,
      currentMission: saveData.gameState.currentMission || null,
      missionStage: saveData.gameState.missionStage || 0,
      combatVictoryAchieved: saveData.gameState.combatVictoryAchieved || false,
      discoveredBrawlerPits: saveData.gameState.discoveredBrawlerPits || false,
      discoveredGamblingTent: saveData.gameState.discoveredGamblingTent || false
    };
    
    // STEP 3: Set up player core properties
    window.player = {
      origin: saveData.player.origin,
      career: saveData.player.career,
      name: saveData.player.name,
      phy: Number(saveData.player.phy || 0),
      men: Number(saveData.player.men || 0),
      skills: {
        melee: Number(saveData.player.skills.melee || 0),
        marksmanship: Number(saveData.player.skills.marksmanship || 0),
        survival: Number(saveData.player.skills.survival || 0),
        command: Number(saveData.player.skills.command || 0),
        discipline: Number(saveData.player.skills.discipline || 0),
        tactics: Number(saveData.player.skills.tactics || 0),
        organization: Number(saveData.player.skills.organization || 0),
        arcana: Number(saveData.player.skills.arcana || 0)
      },
      taelors: Number(saveData.player.taelors || 25),
      events: saveData.player.events || [],
      inventoryCapacity: Number(saveData.player.inventoryCapacity || 20) // Set inventory capacity
    };
    
    // STEP 4: Rebuild inventory with new item instances
    window.player.inventory = rebuildInventoryItems(saveData.player.inventory);
    
    // STEP 5: Rebuild equipment with new item instances
    window.player.equipment = rebuildEquipment(saveData.player.equipment);
    
    // STEP 6: Initialize additional systems with the loaded player data
    if (typeof window.initializeQuestSystem === 'function') {
      window.initializeQuestSystem();
    }
    
    // STEP 6.5: Fix mount slot if player is Cavalry
    if (window.player.career && window.player.career.title === "Castellan Cavalry") {
      // Ensure mount equipment slot exists
      if (!window.player.equipment.mount) {
        window.player.equipment.mount = null;
      }
      
      // Force mount slot to be recognized by setting a flag
      document.documentElement.classList.add('has-mount-slot');
      
      // Fix known mount template if needed
      if (!window.itemTemplates.standardWarhorse && !window.itemTemplates.standard_warhorse) {
        console.log("Creating standard warhorse template");
        window.itemTemplates.standardWarhorse = window.createMount({
          id: 'standard_warhorse',
          name: 'Standard Warhorse',
          description: 'A well-trained warhorse from the Nesian cavalry stables. Bred for endurance and courage in battle.',
          mountType: window.MOUNT_TYPES ? window.MOUNT_TYPES.WARHORSE : {
            name: 'Warhorse', symbol: '🐎', slot: 'mount'
          },
          value: 250,
          stats: {
            speed: 20,
            mobility: 15,
            durability: 50,
            intimidation: 10
          }
        });
      }
      
      // Re-initialize inventory UI to ensure mount slot is created in DOM
      if (typeof window.initializeInventoryUI === 'function') {
        console.log("Re-initializing inventory UI to ensure mount slot is created");
        window.initializeInventoryUI();
      }
    }
    
    // STEP 7: Add save game button to UI
    if (typeof window.addSaveGameButton === 'function') {
      window.addSaveGameButton();
    }
    
    // STEP 8: Update UI
    window.updateStatusBars();
    window.updateTimeAndDay(0); // Update time display without changing time
    window.updateActionButtons();
    
    // STEP 9: Hide menus, show game container
    hideLoadGameMenu();
    document.getElementById('mainMenuScreen').classList.add('hidden');
    document.getElementById('creator').classList.add('hidden');
    document.getElementById('gameContainer').classList.remove('hidden');
    
    window.showNotification('Game loaded successfully!', 'success');
    console.log("Game loaded successfully");
    
  } catch (error) {
    console.error("Error loading game:", error);
    window.showNotification(`Error loading game: ${error.message}`, 'error');
  }
}

// Delete a save by ID
function deleteSave(saveId) {
  if (!confirm('Are you sure you want to delete this save?')) {
    return;
  }
  
  console.log(`Deleting save with ID: ${saveId}`);
  
  try {
    // Remove from localStorage
    localStorage.removeItem(SAVE_KEY_PREFIX + saveId);
    
    // Update save list
    const saveList = getSaveList();
    const updatedSaveList = saveList.filter(save => save.id !== saveId);
    updateSaveList(updatedSaveList);
    
    // Refresh load slots
    populateLoadSlots();
    
    window.showNotification('Save deleted.', 'success');
  } catch (error) {
    console.error("Error deleting save:", error);
    window.showNotification('Error deleting save.', 'error');
  }
}

// Show credits screen
function showCreditsScreen() {
  document.getElementById('creditsScreen').classList.remove('hidden');
}

// Hide credits screen
function hideCreditsScreen() {
  document.getElementById('creditsScreen').classList.add('hidden');
}

// Add save functionality to the game
window.addSaveGameButton = function() {
  // Check if the button already exists
  if (document.querySelector('.save-game-btn')) {
    return;
  }
  
  // Create save button
  const saveButton = document.createElement('button');
  saveButton.className = 'control-btn save-game-btn';
  saveButton.innerHTML = '<i class="fas fa-save"></i>Save Game';
  saveButton.onclick = showSaveGameMenu;
  
  // Add to game controls
  const gameControls = document.querySelector('.game-controls');
  gameControls.appendChild(saveButton);
  
  console.log("Save game button added to UI");
};

// Show the save game menu
function showSaveGameMenu() {
  console.log("Showing save game menu");
  
  // Populate save slots
  populateSaveSlots();
  
  // Show the save game menu
  document.getElementById('saveGameMenu').classList.remove('hidden');
}

// Hide the save game menu
function hideSaveGameMenu() {
  document.getElementById('saveGameMenu').classList.add('hidden');
}

// Populate the save slots
function populateSaveSlots() {
  const saveSlotsContainer = document.getElementById('saveSlots');
  saveSlotsContainer.innerHTML = '';
  
  const saveList = getSaveList();
  
  if (!saveList || saveList.length === 0) {
    saveSlotsContainer.innerHTML = '<div class="empty-slots-message">No saved games. Create a new save to continue.</div>';
    return;
  }
  
  // Sort saves by date (newest first)
  saveList.sort((a, b) => b.timestamp - a.timestamp);
  
  // Create a slot for each save
  saveList.forEach(save => {
    const saveSlot = document.createElement('div');
    saveSlot.className = 'save-slot';
    
    // Format date
    const saveDate = new Date(save.timestamp);
    const formattedDate = saveDate.toLocaleDateString() + ' ' + saveDate.toLocaleTimeString();
    
    saveSlot.innerHTML = `
      <div class="save-slot-info">
        <div class="save-slot-title">${save.title}</div>
        <div class="save-slot-details">
          ${save.playerName}, ${save.career} - Day ${save.day}
          <br>
          Saved: ${formattedDate}
        </div>
      </div>
      <div class="save-slot-actions">
        <button class="slot-btn save-btn" title="Overwrite Save"><i class="fas fa-save"></i></button>
        <button class="slot-btn delete-btn" title="Delete Save"><i class="fas fa-trash"></i></button>
      </div>
    `;
    
    // Add event listeners
    saveSlot.querySelector('.save-btn').addEventListener('click', () => {
      overwriteSave(save.id);
    });
    
    saveSlot.querySelector('.delete-btn').addEventListener('click', () => {
      deleteSave(save.id);
      populateSaveSlots(); // Refresh the list after deletion
    });
    
    saveSlotsContainer.appendChild(saveSlot);
  });
}

// Create a new save
function createNewSave() {
  console.log("Creating new save");
  
  // Check if we've reached max saves
  const saveList = getSaveList();
  if (saveList.length >= MAX_SAVES) {
    window.showNotification(`Maximum of ${MAX_SAVES} saves reached. Please delete a save first.`, 'warning');
    return;
  }
  
  // Create save ID
  const saveId = 'save_' + Date.now();
  
  // Create save data
  const saveTimestamp = Date.now();
  const saveTitle = `${window.player.name}'s Campaign`;
  
  // Create save object for the list
  const saveInfo = {
    id: saveId,
    title: saveTitle,
    playerName: window.player.name,
    career: window.player.career.title,
    day: window.gameDay,
    timestamp: saveTimestamp
  };
  
  // Create full save data - use clean copying to avoid circular references
  const saveData = {
    player: JSON.parse(JSON.stringify(window.player)), // Deep copy
    gameState: JSON.parse(JSON.stringify(window.gameState)), // Deep copy
    gameTime: window.gameTime,
    gameDay: window.gameDay,
    saveInfo: saveInfo
  };
  
  // Save to localStorage
  localStorage.setItem(SAVE_KEY_PREFIX + saveId, JSON.stringify(saveData));
  
  // Update save list
  saveList.push(saveInfo);
  updateSaveList(saveList);
  
  // Refresh save slots
  populateSaveSlots();
  
  window.showNotification('Game saved successfully!', 'success');
}

// Overwrite an existing save
function overwriteSave(saveId) {
  if (!confirm('Are you sure you want to overwrite this save?')) {
    return;
  }
  
  console.log(`Overwriting save with ID: ${saveId}`);
  
  // Get existing save info
  const saveList = getSaveList();
  const saveInfo = saveList.find(save => save.id === saveId);
  
  if (!saveInfo) {
    window.showNotification('Error: Save not found.', 'error');
    return;
  }
  
  // Update save info
  saveInfo.playerName = window.player.name;
  saveInfo.career = window.player.career.title;
  saveInfo.day = window.gameDay;
  saveInfo.timestamp = Date.now();
  
  // Create full save data
  const saveData = {
    player: JSON.parse(JSON.stringify(window.player)), // Deep copy
    gameState: JSON.parse(JSON.stringify(window.gameState)), // Deep copy
    gameTime: window.gameTime,
    gameDay: window.gameDay,
    saveInfo: saveInfo
  };
  
  // Save to localStorage
  localStorage.setItem(SAVE_KEY_PREFIX + saveId, JSON.stringify(saveData));
  
  // Update save list
  updateSaveList(saveList);
  
  // Refresh save slots
  populateSaveSlots();
  
  window.showNotification('Game saved successfully!', 'success');
}

// Return to main menu function
window.returnToMainMenu = function() {
  // Ask for confirmation if in a game
  if (document.getElementById('gameContainer').classList.contains('hidden') === false) {
    if (!confirm('Return to main menu? Unsaved progress will be lost.')) {
      return;
    }
  }
  
  // Hide all screens
  document.getElementById('creator').classList.add('hidden');
  document.getElementById('gameContainer').classList.add('hidden');
  document.getElementById('questSceneContainer').classList.add('hidden');
  document.getElementById('loadGameMenu').classList.add('hidden');
  document.getElementById('saveGameMenu').classList.add('hidden');
  document.getElementById('creditsScreen').classList.add('hidden');
  
  // Show main menu
  document.getElementById('mainMenuScreen').classList.remove('hidden');
  
  console.log("Returned to main menu");
};