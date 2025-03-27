// SAVE & LOAD SYSTEM MODULE
// Handles game saving, loading, and main menu functionality

// Define constants for localStorage
const SINGLE_SAVE_KEY = 'soldierOfIbyll_currentGame';
const HAS_SAVE_KEY = 'soldierOfIbyll_hasSave';
let currentGameSaved = false;

// Initialize the save/load system
window.initializeSaveLoadSystem = function() {
  console.log("Initializing roguelike save/load system...");
  
  // Check for existing save and update continue button
  updateContinueButton();
  
  // Attach event listeners to main menu buttons
  document.getElementById('newGameBtn').addEventListener('click', startNewGame);
  document.getElementById('continueBtn').addEventListener('click', window.continueGame);
  document.getElementById('creditsBtn').addEventListener('click', showCreditsScreen);
  
  // Attach event listener to credits close button
  document.getElementById('closeCreditsBtn').addEventListener('click', hideCreditsScreen);
  
  console.log("Roguelike save/load system initialized");
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
  
  // Ask for confirmation if we have a saved game
  if (window.hasSavedGame()) {
    if (!confirm('Starting a new game will delete your current saved game. Continue?')) {
      return;
    }
    
    // Delete current save
    window.deleteSavedGame();
  }
  
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

/**
 * Creates a complete serializable copy of an item
 * Captures all necessary properties to fully recreate the item
 */
function createSerializableItem(item) {
  if (!item || item === "occupied") return item;
  
  try {
    // Get the template
    const template = item.getTemplate();
    
    // Create a complete item record
    const serializedItem = {
      // Basic item identification
      templateId: item.templateId,
      instanceId: item.instanceId,
      
      // Item state
      quantity: item.quantity || 1,
      durability: item.durability,
      equipped: item.equipped || false,
      
      // Ammunition properties
      ammoType: item.ammoType,
      capacity: item.capacity,
      currentAmount: item.currentAmount,
      compatibleWeapons: item.compatibleWeapons,
      
      // Template properties (complete data to rebuild without matching)
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        rarity: template.rarity,
        value: template.value,
        weight: template.weight,
        symbol: template.symbol,
        stackable: template.stackable,
        maxStack: template.maxStack,
        
        // Equipment properties
        equipSlot: template.equipSlot,
        hands: template.hands,
        
        // Stats and effects
        stats: template.stats || {},
        effects: template.effects || [],
        
        // Weapon/armor specific
        weaponType: template.weaponType,
        armorType: template.armorType,
        damageType: template.damageType,
        maxDurability: template.maxDurability,
        blockChance: template.blockChance,
        
        // Requirements
        requirements: template.requirements || {}
      }
    };
    
    return serializedItem;
  } catch (error) {
    console.error("Error creating serializable item:", error);
    return null;
  }
}

/**
 * Prepares player inventory for saving by creating complete serializable copies
 */
function prepareInventoryForSave(inventory) {
  if (!inventory || !Array.isArray(inventory)) return [];
  
  const serializedInventory = [];
  
  inventory.forEach(item => {
    const serializedItem = createSerializableItem(item);
    if (serializedItem) {
      serializedInventory.push(serializedItem);
    }
  });
  
  return serializedInventory;
}

/**
 * Prepares player equipment for saving by creating complete serializable copies
 */
function prepareEquipmentForSave(equipment) {
  if (!equipment) return {};
  
  const serializedEquipment = {};
  
  for (const slot in equipment) {
    const item = equipment[slot];
    
    // Special "occupied" marker for off-hand with two-handed weapon
    if (item === "occupied") {
      serializedEquipment[slot] = "occupied";
    } else if (item) {
      const serializedItem = createSerializableItem(item);
      if (serializedItem) {
        serializedEquipment[slot] = serializedItem;
      } else {
        serializedEquipment[slot] = null;
      }
    } else {
      serializedEquipment[slot] = null;
    }
  }
  
  return serializedEquipment;
}

/**
 * Updated player save function that stores complete item data
 */
function savePlayerData(player) {
  // Create deep copy of basic player data
  const playerData = JSON.parse(JSON.stringify({
    origin: player.origin,
    career: player.career,
    name: player.name,
    phy: player.phy,
    men: player.men,
    skills: player.skills,
    taelors: player.taelors,
    events: player.events,
    inventoryCapacity: player.inventoryCapacity
  }));
  
  // Add fully serialized inventory and equipment
  playerData.inventory = prepareInventoryForSave(player.inventory);
  playerData.equipment = prepareEquipmentForSave(player.equipment);
  
  return playerData;
}

/**
 * Creates a complete item instance from serialized data
 */
function createItemFromSerialized(serializedItem) {
  if (!serializedItem || serializedItem === "occupied") return serializedItem;
  
  try {
    // First, ensure the template exists in our system
    let template = window.itemTemplates[serializedItem.templateId];
    
    // If template doesn't exist, create it from the saved data
    if (!template && serializedItem.template) {
      // Create appropriate template based on category
      if (serializedItem.template.category === window.ITEM_CATEGORIES.WEAPON) {
        template = window.createWeapon(serializedItem.template);
      } else if (serializedItem.template.category === window.ITEM_CATEGORIES.ARMOR) {
        template = window.createArmor(serializedItem.template);
      } else if (serializedItem.template.category === window.ITEM_CATEGORIES.CONSUMABLE) {
        template = window.createConsumable(serializedItem.template);
      } else if (serializedItem.template.category === window.ITEM_CATEGORIES.MOUNT) {
        template = window.createMount(serializedItem.template);
      } else if (serializedItem.template.category === window.ITEM_CATEGORIES.AMMUNITION) {
        template = window.createAmmunition(serializedItem.template);
      } else {
        template = window.createItemTemplate(serializedItem.template);
      }
      
      // Add to item templates if it doesn't exist
      if (template && !window.itemTemplates[template.id]) {
        window.itemTemplates[template.id] = template;
      }
    }
    
    // If we still don't have a template (neither found nor created), use fallbacks
    if (!template) {
      console.warn(`Could not find or create template for ${serializedItem.templateId}, using fallback`);
      
      // Use appropriate fallback based on category
      if (serializedItem.template && serializedItem.template.category === window.ITEM_CATEGORIES.WEAPON) {
        // For weapons, try to match the general type
        if (serializedItem.template.weaponType && 
            serializedItem.template.weaponType.name === "Battle Axe") {
          template = window.itemTemplates.battleaxe || window.itemTemplates.basicAxe;
        } else if (serializedItem.template.weaponType && 
                  serializedItem.template.weaponType.name === "Bow") {
          template = window.itemTemplates.hunterBow;
        } else {
          // Default to basic sword
          template = window.itemTemplates.basicSword;
        }
      } else if (serializedItem.template && serializedItem.template.category === window.ITEM_CATEGORIES.ARMOR) {
        template = window.itemTemplates.legionArmor;
      } else if (serializedItem.template && serializedItem.template.category === window.ITEM_CATEGORIES.AMMUNITION) {
        // Choose ammunition based on type
        if (serializedItem.ammoType === "arrow") {
          template = window.itemTemplates.quiver;
        } else if (serializedItem.ammoType === "shot") {
          template = window.itemTemplates.cartridgePouch;
        } else {
          template = window.itemTemplates.javelinPack;
        }
      } else {
        // Generic item as last resort
        template = window.createItemTemplate({
          id: 'generic_item',
          name: serializedItem.template ? serializedItem.template.name : 'Unknown Item',
          description: 'A replacement item.',
          category: serializedItem.template ? serializedItem.template.category : window.ITEM_CATEGORIES.MATERIAL,
          equipSlot: serializedItem.template ? serializedItem.template.equipSlot : null
        });
        window.itemTemplates[template.id] = template;
      }
    }
    
    // Create new item instance
    const newItem = window.createItemInstance(template, serializedItem.quantity || 1);
    
    // Copy saved state
    if (serializedItem.durability !== undefined) newItem.durability = serializedItem.durability;
    if (serializedItem.equipped) newItem.equipped = true;
    
    // Copy ammunition properties
    if (serializedItem.capacity !== undefined) newItem.capacity = serializedItem.capacity;
    if (serializedItem.currentAmount !== undefined) newItem.currentAmount = serializedItem.currentAmount;
    if (serializedItem.compatibleWeapons) newItem.compatibleWeapons = serializedItem.compatibleWeapons;
    
    return newItem;
  } catch (error) {
    console.error("Error creating item from serialized data:", error);
    return null;
  }
}

/**
 * Rebuilds player inventory from saved data
 */
function rebuildInventoryFromSaved(savedInventory) {
  if (!savedInventory || !Array.isArray(savedInventory)) return [];
  
  const rebuiltInventory = [];
  
  savedInventory.forEach((serializedItem, index) => {
    try {
      const newItem = createItemFromSerialized(serializedItem);
      if (newItem) {
        rebuiltInventory.push(newItem);
      }
    } catch (error) {
      console.error(`Error rebuilding inventory item ${index}:`, error);
    }
  });
  
  return rebuiltInventory;
}

/**
 * Rebuilds player equipment from saved data
 */
function rebuildEquipmentFromSaved(savedEquipment) {
  if (!savedEquipment) return {};
  
  const rebuiltEquipment = {};
  
  // Track which slots we need to fill
  const requiredSlots = ['head', 'body', 'mainHand', 'offHand', 'accessory', 'ammunition'];
  
  // Add mount slot if player is cavalry
  if (window.player.career && window.player.career.title === "Castellan Cavalry") {
    requiredSlots.push('mount');
  }
  
  // Process each slot
  for (const slot in savedEquipment) {
    try {
      const serializedItem = savedEquipment[slot];
      
      // Handle special "occupied" marker
      if (serializedItem === "occupied") {
        rebuiltEquipment[slot] = "occupied";
      } else if (serializedItem) {
        const newItem = createItemFromSerialized(serializedItem);
        rebuiltEquipment[slot] = newItem;
      } else {
        rebuiltEquipment[slot] = null;
      }
    } catch (error) {
      console.error(`Error rebuilding equipment in slot ${slot}:`, error);
      rebuiltEquipment[slot] = null;
    }
  }
  
  // Ensure all required slots exist
  requiredSlots.forEach(slot => {
    if (rebuiltEquipment[slot] === undefined) {
      rebuiltEquipment[slot] = null;
    }
  });
  
  // Consistency check for two-handed weapons
  if (rebuiltEquipment.mainHand && 
      rebuiltEquipment.mainHand.getTemplate && 
      rebuiltEquipment.mainHand.getTemplate().weaponType && 
      rebuiltEquipment.mainHand.getTemplate().weaponType.hands === 2) {
    // If main hand has a two-handed weapon, make sure off-hand is marked as occupied
    rebuiltEquipment.offHand = "occupied";
  }
  
  return rebuiltEquipment;
}

// Create a new save with complete item data
function createNewSave() {
  console.log("Creating new save with complete item data");
  
  // Check if we've reached max saves
  const saveList = getSaveList();
  if (saveList.length >= MAX_SAVES) {
    window.showNotification(`Maximum of ${MAX_SAVES} saves reached. Please delete a save first.`, 'warning');
    return;
  }
  
  // Create save ID
  const saveId = 'save_' + Date.now();
  currentSaveId = saveId; 
  
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
  
  // Create fully serialized player data with complete item information
  const playerData = savePlayerData(window.player);
  
  // Create full save data
  const saveData = {
    player: playerData,
    gameState: JSON.parse(JSON.stringify(window.gameState)),
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

// Load a game by ID - completely rewritten to use serialized item data
function loadGame(saveId) {
  console.log(`Loading game with ID: ${saveId}`);

  
  
  try {
     // Store the current save ID for potential deletion on death
     currentSaveId = saveId;
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
      inventoryCapacity: Number(saveData.player.inventoryCapacity || 20)
    };
    
    // STEP 4: Rebuild inventory with complete item data
    window.player.inventory = rebuildInventoryFromSaved(saveData.player.inventory);
    
    // STEP 5: Rebuild equipment with complete item data
    window.player.equipment = rebuildEquipmentFromSaved(saveData.player.equipment);
    
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



// Overwrite an existing save
function overwriteSave(saveId) {
  if (!confirm('Are you sure you want to overwrite this save?')) {
    return;
  }
  
  console.log(`Overwriting save with ID: ${saveId}`);
  
  // Get existing save info
  const saveList = getSaveList();
  const saveInfo = saveList.find(save => save.id === saveId);
  currentSaveId = saveId;
  
  if (!saveInfo) {
    window.showNotification('Error: Save not found.', 'error');
    return;
  }
  
  // Update save info
  saveInfo.playerName = window.player.name;
  saveInfo.career = window.player.career.title;
  saveInfo.day = window.gameDay;
  saveInfo.timestamp = Date.now();
  
  // Create player data with full item serialization
  const playerData = savePlayerData(window.player);
  
  // Create full save data
  const saveData = {
    player: playerData,
    gameState: JSON.parse(JSON.stringify(window.gameState)),
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
  console.log("Returning to main menu");
  
  // If player died, delete the save
  if (window.gameState && window.gameState.playerDied) {
    window.deleteSavedGame();
  } 
  // Otherwise auto-save if in game
  else if (document.getElementById('gameContainer').classList.contains('hidden') === false) {
    window.saveCurrentGame();
  }
  
  // Hide all screens definitively
  const screensToHide = [
    'creator', 
    'gameContainer', 
    'questSceneContainer', 
    'combatInterface'
  ];
  
  screensToHide.forEach(screenId => {
    const element = document.getElementById(screenId);
    if (element) {
      element.classList.add('hidden');
    }
  });
  
  // Hide any modal that might be visible
  const modals = document.querySelectorAll('.modal, .panel-overlay, .combat-conclusion-modal');
  modals.forEach(modal => {
    if (modal) {
      modal.style.display = 'none';
    }
  });
  
  // Show main menu
  const mainMenu = document.getElementById('mainMenuScreen');
  if (mainMenu) {
    mainMenu.classList.remove('hidden');
  }
  
  // Update continue button to reflect save state
  updateContinueButton();
  
  console.log("Returned to main menu");
};

// Check if a save exists
window.hasSavedGame = function() {
  return localStorage.getItem(HAS_SAVE_KEY) === 'true';
};


// Save the current game - automatically called when returning to main menu
window.saveCurrentGame = function() {
  // Don't save if player has died
  if (window.gameState && window.gameState.playerDied) {
    console.log("Player died - not saving game");
    return false;
  }
  
  console.log("Auto-saving current game");
  
  try {
    // Create player data with full item serialization
    const playerData = savePlayerData(window.player);
    
    // Create save data object
    const saveData = {
      player: playerData,
      gameState: JSON.parse(JSON.stringify(window.gameState)),
      gameTime: window.gameTime,
      gameDay: window.gameDay,
      timestamp: Date.now()
    };
    
    // Save to localStorage
    localStorage.setItem(SINGLE_SAVE_KEY, JSON.stringify(saveData));
    localStorage.setItem(HAS_SAVE_KEY, 'true');
    currentGameSaved = true;
    
    console.log("Game saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving game:", error);
    return false;
  }
};

// Load the saved game
window.continueGame = function() {
  console.log("Continuing saved game");
  
  try {
    // Get the save data
    const saveJSON = localStorage.getItem(SINGLE_SAVE_KEY);
    if (!saveJSON) {
      window.showNotification('No saved game found.', 'error');
      return false;
    }
    
    const saveData = JSON.parse(saveJSON);
    
    if (!saveData || !saveData.player) {
      window.showNotification('Save data is corrupt.', 'error');
      return false;
    }
    
    // Reset and initialize game systems
    resetAndReinitializeGame();
    
    // Restore basic game state
    window.gameTime = saveData.gameTime;
    window.gameDay = saveData.gameDay;
    window.gameState = { ...saveData.gameState };
    
    // Set up player core properties
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
      inventoryCapacity: Number(saveData.player.inventoryCapacity || 20)
    };
    
    // Rebuild inventory and equipment
    window.player.inventory = rebuildInventoryFromSaved(saveData.player.inventory);
    window.player.equipment = rebuildEquipmentFromSaved(saveData.player.equipment);
    
    // Initialize additional systems
    if (typeof window.initializeQuestSystem === 'function') {
      window.initializeQuestSystem();
    }
    
    // Hide menus, show game container
    document.getElementById('mainMenuScreen').classList.add('hidden');
    document.getElementById('creator').classList.add('hidden');
    document.getElementById('gameContainer').classList.remove('hidden');
    
    // Update UI
    window.updateStatusBars();
    window.updateTimeAndDay(0);
    window.updateActionButtons();
    
    window.showNotification('Game loaded successfully!', 'success');
    console.log("Game loaded successfully");
    
    return true;
  } catch (error) {
    console.error("Error loading game:", error);
    window.showNotification(`Error loading game: ${error.message}`, 'error');
    return false;
  }
};

// Delete the saved game
window.deleteSavedGame = function() {
  console.log("Deleting saved game");
  
  try {
    localStorage.removeItem(SINGLE_SAVE_KEY);
    localStorage.setItem(HAS_SAVE_KEY, 'false');
    currentGameSaved = false;
    
    // Update continue button
    updateContinueButton();
    
    console.log("Saved game deleted");
    return true;
  } catch (error) {
    console.error("Error deleting saved game:", error);
    return false;
  }
};

// Update the continue button state
function updateContinueButton() {
  const continueButton = document.getElementById('continueBtn');
  if (!continueButton) return;
  
  const hasSave = window.hasSavedGame();
  continueButton.disabled = !hasSave;
};
  
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
