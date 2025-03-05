// ENHANCED GAME STATE MODULE
// Centralized state management with improved type safety and error handling

// GameState constructor
window.GameState = {
  // State data
  data: {
    // Time and day tracking
    time: 480, // Start at 8:00 AM (in minutes)
    day: 1,
    
    // Character progression 
    experience: 0,
    level: 1,
    skillPoints: 0,
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    morale: 75, // 0-100 scale
    
    // Quest & Story Tracking
    mainQuest: { stage: 0, completed: false },
    sideQuests: [],
    discoveredLocations: ["Kasvaari Camp"],
    
    // Environmental conditions
    weather: "clear", // clear, rainy, foggy, etc.
    campMorale: 70, // 0-100 scale
    
    // Flags for special events
    arrivalProcessed: false,
    firstBriefingCompleted: false,
    trainingProgress: 0,
    dailyTrainingCount: 0,
    inStoryEncounter: false,
    
    // Action tracking
    dailyPatrolDone: false,
    dailyScoutDone: false,
    
    // Battle system
    inBattle: false,
    currentEnemy: null,
    
    // Enhanced combat system properties
    combatPhase: "neutral", // neutral, preparation, execution, reaction
    combatDistance: 2, // 0-close, 1-medium, 2-far
    combatStance: "neutral", // neutral, aggressive, defensive, evasive
    enemyStance: "neutral",
    initiativeOrder: [],
    currentInitiative: 0,
    playerQueuedAction: null,
    enemyQueuedAction: null,
    counterAttackAvailable: false,
    playerMomentum: 0, // -5 to 5, affects damage and success chances
    enemyMomentum: 0,
    consecutiveHits: 0,
    perfectParries: 0,
    dodgeCount: 0,
    playerStaggered: false,
    playerInjuries: [],
    terrain: "normal", // normal, rocky, slippery, confined
    originalWeather: null, // store original weather during combat
    allowInterrupts: true,
    staminaPerAction: {
      attack: 5,
      defend: 3,
      dodge: 4,
      advance: 3,
      retreat: 3,
      aim: 2,
      special: 7
    },
    actionWindUpTime: {
      quickAttack: 1,
      attack: 2,
      heavyAttack: 4,
      defend: 1,
      dodge: 1,
      advance: 1,
      retreat: 2,
      aim: 3,
      special: 3,
      feint: 2
    },
    actionRecoveryTime: {
      quickAttack: 1,
      attack: 2,
      heavyAttack: 3,
      defend: 1,
      dodge: 2,
      advance: 1,
      retreat: 1,
      aim: 2, 
      special: 3,
      feint: 1
    },
    
    // Mission system flags
    inMission: false,
    currentMission: null,
    missionStage: 0,
    inMissionCombat: false,
    
    // Achievement tracking
    combatVictoryAchieved: false,
    
    // Discovered locations
    discoveredBrawlerPits: false,
    discoveredGamblingTent: false
  },
  
  // Observer pattern implementation
  observers: [],
  
  // Function to register an observer (callback function)
  subscribe: function(callback) {
    if (typeof callback !== 'function') {
      console.error("[GameState] Cannot subscribe with non-function callback");
      return -1;
    }
    
    this.observers.push(callback);
    return this.observers.length - 1; // Return index for unsubscribing
  },
  
  // Function to unsubscribe an observer
  unsubscribe: function(index) {
    if (index < 0 || index >= this.observers.length) {
      console.warn("[GameState] Invalid observer index:", index);
      return;
    }
    
    this.observers.splice(index, 1);
  },
  
  // Notify all observers of state change
  notify: function(property, value, oldValue) {
    for (let callback of this.observers) {
      try {
        callback(property, value, oldValue);
      } catch (error) {
        console.error("[GameState] Error in observer callback:", error);
      }
    }
  },
  
  // Get a property value with improved error handling
  get: function(property) {
    if (!property) {
      console.error("[GameState] Cannot get property: No property name provided");
      return undefined;
    }
    
    // Use property path to get nested values
    try {
      return this.getNestedProperty(this.data, property);
    } catch (error) {
      console.error(`[GameState] Error getting property '${property}':`, error);
      return undefined;
    }
  },
  
  // Set a property value with type safety and validation
  set: function(property, value) {
    if (!property) {
      console.error("[GameState] Cannot set property: No property name provided");
      return null;
    }
    
    // Get the old value first
    const oldValue = this.get(property);
    
    // Handle numeric properties with explicit conversion
    const numericProperties = [
      'health', 'maxHealth', 'stamina', 'maxStamina', 'morale',
      'experience', 'level', 'skillPoints', 'playerMomentum', 'enemyMomentum'
    ];
    
    if (numericProperties.includes(property)) {
      // Force numeric conversion
      value = Number(value);
      
      // Validate ranges for critical values
      if (property === 'health') {
        const maxHealth = this.get('maxHealth') || 100;
        value = Math.max(0, Math.min(maxHealth, value));
      } else if (property === 'stamina') {
        const maxStamina = this.get('maxStamina') || 100;
        value = Math.max(0, Math.min(maxStamina, value));
      } else if (property === 'morale') {
        value = Math.max(0, Math.min(100, value));
      } else if (property === 'playerMomentum' || property === 'enemyMomentum') {
        value = Math.max(-5, Math.min(5, value));
      }
    }
    
    // Set the new value
    try {
      this.setNestedProperty(this.data, property, value);
    } catch (error) {
      console.error(`[GameState] Error setting property '${property}' to:`, value, error);
      return null;
    }
    
    // Notify observers if value changed
    if (oldValue !== value) {
      this.notify(property, value, oldValue);
    }
    
    return value;
  },
  
  // Helper to get a nested property using a path string
  getNestedProperty: function(obj, path) {
    if (!path) return obj;
    
    const parts = path.split('.');
    let value = obj;
    
    for (let part of parts) {
      if (value === null || value === undefined) return undefined;
      value = value[part];
    }
    
    return value;
  },
  
  // Helper to set a nested property using a path string
  setNestedProperty: function(obj, path, value) {
    if (!path) return;
    
    const parts = path.split('.');
    const lastKey = parts.pop();
    let current = obj;
    
    for (let part of parts) {
      // Create empty objects for missing parts
      if (!(part in current) || current[part] === null || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part];
    }
    
    current[lastKey] = value;
  },
  
  // Validate the current state for inconsistencies
  validateState: function() {
    const issues = [];
    
    // Check for combat state issues
    if (this.data.inBattle && !this.data.currentEnemy) {
      issues.push("Combat flag set but no enemy object present");
      // Auto-fix this issue
      this.data.inBattle = false;
    }
    
    // Check for mission state issues
    if (this.data.inMission && !this.data.currentMission) {
      issues.push("Mission flag set but no mission object present");
      // Auto-fix this issue
      this.data.inMission = false;
    }
    
    // Check for mission combat state issues
    if (this.data.inMissionCombat && !this.data.inBattle) {
      issues.push("Mission combat flag set but not in battle");
      // Auto-fix this issue
      this.data.inMissionCombat = false;
    }
    
    // Check stat consistency
    if (this.data.health > this.data.maxHealth) {
      issues.push("Health exceeds maxHealth");
      // Auto-fix this issue
      this.data.health = this.data.maxHealth;
    }
    
    if (this.data.stamina > this.data.maxStamina) {
      issues.push("Stamina exceeds maxStamina");
      // Auto-fix this issue
      this.data.stamina = this.data.maxStamina;
    }
    
    // Log detected issues
    if (issues.length > 0) {
      console.warn("[GameState] State validation found issues:", issues);
    }
    
    return issues;
  },
  
  // Initialize game state function with enhanced error handling
  init: function() {
    console.log("[GameState] Initializing game state...");
    
    try {
      // Set additional game state values
      this.set('trainingProgress', 0);
      this.set('dailyTrainingCount', 0);
      this.set('combatPhase', 'neutral');
      this.set('combatDistance', 2);
      this.set('combatStance', 'neutral');
      
      // Set activity discovery flags based on origin
      if (window.player && window.player.origin === 'Lunarine') {
        this.set('discoveredBrawlerPits', true);
        this.set('discoveredGamblingTent', true);
      } else {
        this.set('discoveredBrawlerPits', false);
        this.set('discoveredGamblingTent', false);
      }
      
      // Add initial quests - one training quest and one random quest
      if (window.createQuest) {
        try {
          const trainingQuest = window.createQuest("training");
          const questTypes = ["patrol", "scout"];
          const randomType = questTypes[Math.floor(Math.random() * questTypes.length)];
          const randomQuest = window.createQuest(randomType);
          
          this.set('sideQuests', [trainingQuest, randomQuest]);
          
          console.log("[GameState] Initial quests created:", this.get('sideQuests'));
        } catch (error) {
          console.error("[GameState] Error creating initial quests:", error);
        }
      }
      
      console.log("[GameState] Game state initialized successfully");
    } catch (error) {
      console.error("[GameState] Initialization error:", error);
    }
  },
  
  // Function to check for level up with improved error handling
  checkLevelUp: function() {
    try {
      // Experience required for next level = current level * 100
      const currentLevel = Number(this.get('level'));
      const currentExp = Number(this.get('experience'));
      const requiredExp = currentLevel * 100;
      
      if (currentExp >= requiredExp) {
        // Level up!
        const newLevel = currentLevel + 1;
        this.set('level', newLevel);
        this.set('experience', currentExp - requiredExp);
        this.set('skillPoints', (Number(this.get('skillPoints')) || 0) + 1);
        
        // Increase max health and stamina
        this.set('maxHealth', Number(this.get('maxHealth')) + 10);
        this.set('maxStamina', Number(this.get('maxStamina')) + 5);
        
        // Restore health and stamina
        this.set('health', this.get('maxHealth'));
        this.set('stamina', this.get('maxStamina'));
        
        // Update UI
        if (window.UI && typeof window.UI.updateStatusBars === 'function') {
          window.UI.updateStatusBars();
        } else if (typeof window.updateStatusBars === 'function') {
          window.updateStatusBars();
        }
        
        // Show notification
        if (window.UI && typeof window.UI.showNotification === 'function') {
          window.UI.showNotification(`Level up! You are now level ${newLevel}!`, 'level-up');
        } else if (typeof window.showNotification === 'function') {
          window.showNotification(`Level up! You are now level ${newLevel}!`, 'level-up');
        }
        
        // Check for veteran achievement
        if (newLevel >= 5) {
          this.updateAchievementProgress('veteran');
        }
        
        // Check if there are more levels to gain
        this.checkLevelUp();
      }
    } catch (error) {
      console.error("[GameState] Error during level up check:", error);
    }
  },
  
  // Update achievement progress with improved error handling
  updateAchievementProgress: function(achievementId, amount = 1) {
    if (!window.achievements) {
      console.warn("[GameState] No achievements array available");
      return;
    }
    
    try {
      const achievement = window.achievements.find(a => a.id === achievementId);
      if (!achievement) {
        console.warn(`[GameState] Achievement '${achievementId}' not found`);
        return;
      }
      
      if (achievement.unlocked) {
        return; // Already unlocked
      }
      
      // Update progress if it's a progress-based achievement
      if ('progress' in achievement) {
        achievement.progress += amount;
        
        // Check if achievement is complete
        if (achievement.progress >= achievement.target) {
          this.showAchievement(achievementId);
        }
      } else {
        // Direct unlock for non-progress achievements
        this.showAchievement(achievementId);
      }
    } catch (error) {
      console.error(`[GameState] Error updating achievement '${achievementId}':`, error);
    }
  },
  
  // Show achievement with improved error handling
  showAchievement: function(achievementId) {
    if (!window.achievements) {
      console.warn("[GameState] No achievements array available");
      return;
    }
    
    try {
      const achievement = window.achievements.find(a => a.id === achievementId);
      if (!achievement) {
        console.warn(`[GameState] Achievement '${achievementId}' not found`);
        return;
      }
      
      if (achievement.unlocked) {
        return; // Already unlocked
      }
      
      // Mark achievement as unlocked
      achievement.unlocked = true;
      
      // Display achievement notification
      if (window.UI && typeof window.UI.showAchievement === 'function') {
        window.UI.showAchievement(achievementId);
      } else if (typeof window.showAchievement === 'function') {
        window.showAchievement(achievementId);
      }
    } catch (error) {
      console.error(`[GameState] Error showing achievement '${achievementId}':`, error);
    }
  },
  
  // Emergency recovery function
  emergencyRecovery: function() {
    console.warn("[GameState] Performing emergency state recovery");
    
    try {
      // Reset critical state flags
      this.set('inBattle', false);
      this.set('currentEnemy', null);
      this.set('inMission', false);
      this.set('currentMission', null);
      this.set('missionStage', 0);
      this.set('inMissionCombat', false);
      
      // Validate the state to fix any other inconsistencies
      this.validateState();
      
      // Show notification if UI is available
      if (typeof window.showNotification === 'function') {
        window.showNotification("Game state has been reset.", "info");
      }
      
      // Update UI if available
      if (typeof window.updateStatusBars === 'function') {
        window.updateStatusBars();
      }
      
      if (typeof window.updateActionButtons === 'function') {
        window.updateActionButtons();
      }
      
      return true;
    } catch (error) {
      console.error("[GameState] Error during emergency recovery:", error);
      return false;
    }
  }
};

// Global player state with improved getters and setters
window.Player = {
  data: {
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
    relationships: {},
    events: []
  },
  
  // Get a player property with error handling
  get: function(property) {
    try {
      return window.GameState.getNestedProperty(this.data, property);
    } catch (error) {
      console.error(`[Player] Error getting property '${property}':`, error);
      return undefined;
    }
  },
  
  // Set a player property with type handling
  set: function(property, value) {
    try {
      const oldValue = this.get(property);
      
      // Handle numeric properties for player stats
      const numericProperties = ['phy', 'men', 'taelors'];
      const skillProperties = property.startsWith('skills.');
      
      if (numericProperties.includes(property) || skillProperties) {
        // Force numeric conversion
        value = Number(value);
      }
      
      // Set the value
      window.GameState.setNestedProperty(this.data, property, value);
      
      return value;
    } catch (error) {
      console.error(`[Player] Error setting property '${property}' to:`, value, error);
      return null;
    }
  },
  
  // Add an item to inventory with validation
  addItem: function(item) {
    if (!item || typeof item !== 'object') {
      console.error("[Player] Cannot add invalid item to inventory:", item);
      return -1;
    }
    
    try {
      // Initialize inventory if it doesn't exist
      if (!this.data.inventory) {
        this.data.inventory = [];
      }
      
      // Ensure item has all required properties
      item.name = item.name || "Unknown Item";
      item.effect = item.effect || "No effect";
      item.value = item.value !== undefined ? Number(item.value) : 0;
      
      this.data.inventory.push(item);
      return this.data.inventory.length - 1; // Return index of added item
    } catch (error) {
      console.error("[Player] Error adding item to inventory:", error);
      return -1;
    }
  },
  
  // Remove item from inventory by index with validation
  removeItem: function(index) {
    try {
      if (!this.data.inventory || index < 0 || index >= this.data.inventory.length) {
        console.warn("[Player] Cannot remove item: Invalid index or empty inventory");
        return null;
      }
      
      const removed = this.data.inventory.splice(index, 1)[0];
      return removed;
    } catch (error) {
      console.error("[Player] Error removing item from inventory:", error);
      return null;
    }
  },
  
  // Validate player data for consistency
  validatePlayerData: function() {
    const issues = [];
    
    // Check for required properties
    if (!this.data.name) {
      issues.push("Player name is missing");
    }
    
    if (!this.data.origin) {
      issues.push("Player origin is missing");
    }
    
    if (!this.data.career || typeof this.data.career !== 'object') {
      issues.push("Player career is missing or invalid");
    }
    
    // Validate numeric values
    if (typeof this.data.phy !== 'number' || isNaN(this.data.phy)) {
      issues.push("Physical attribute is not a number");
      this.data.phy = Number(this.data.phy) || 0;
    }
    
    if (typeof this.data.men !== 'number' || isNaN(this.data.men)) {
      issues.push("Mental attribute is not a number");
      this.data.men = Number(this.data.men) || 0;
    }
    
    // Validate skills
    if (!this.data.skills || typeof this.data.skills !== 'object') {
      issues.push("Skills object is missing or invalid");
      this.data.skills = {
        melee: 0,
        marksmanship: 0,
        survival: 0,
        command: 0,
        discipline: 0,
        tactics: 0,
        organization: 0,
        arcana: 0
      };
    } else {
      // Ensure all skill values are numbers
      for (const skill in this.data.skills) {
        if (typeof this.data.skills[skill] !== 'number' || isNaN(this.data.skills[skill])) {
          issues.push(`Skill '${skill}' is not a number`);
          this.data.skills[skill] = Number(this.data.skills[skill]) || 0;
        }
      }
    }
    
    // Validate inventory
    if (!Array.isArray(this.data.inventory)) {
      issues.push("Inventory is not an array");
      this.data.inventory = [];
    }
    
    // Validate taelors
    if (typeof this.data.taelors !== 'number' || isNaN(this.data.taelors)) {
      issues.push("Taelors is not a number");
      this.data.taelors = Number(this.data.taelors) || 0;
    }
    
    if (issues.length > 0) {
      console.warn("[Player] Data validation found issues:", issues);
    }
    
    return issues;
  }
};

// Create direct references to maintain backward compatibility
window.gameState = window.GameState.data;
window.player = window.Player.data;

// Backward compatibility functions for older code
window.initializeGameState = function() {
  return window.GameState.init();
};

window.checkLevelUp = function() {
  return window.GameState.checkLevelUp();
};

window.updateAchievementProgress = function(achievementId, amount = 1) {
  return window.GameState.updateAchievementProgress(achievementId, amount);
};

window.showAchievement = function(achievementId) {
  return window.GameState.showAchievement(achievementId);
};

// Backward compatibility for time and day updates
window.updateTimeAndDay = function(minutesToAdd) {
  // Use UI function if available, otherwise fall back to direct state updates
  if (window.UI && typeof window.UI.updateTimeAndDay === 'function') {
    window.UI.updateTimeAndDay(minutesToAdd);
  } else {
    // Add time
    window.gameState.time += minutesToAdd;
    
    // Check for day change
    while (window.gameState.time >= 1440) {
      window.gameState.time -= 1440;
      window.gameState.day++;
      
      // Reset daily flags
      window.gameState.dailyTrainingCount = 0;
      window.gameState.dailyPatrolDone = false;
      window.gameState.dailyScoutDone = false;
    }
    
    // Update UI manually if needed
    if (typeof window.updateTimeDisplay === 'function') {
      window.updateTimeDisplay();
    }
  }
};

// Backward compatibility for time of day
window.getTimeOfDay = function() {
  // Use UI function if available
  if (window.UI && typeof window.UI.getTimeOfDay === 'function') {
    return window.UI.getTimeOfDay();
  } else {
    const hours = Math.floor(window.gameState.time / 60);
    
    if (hours >= 5 && hours < 8) return 'dawn';
    if (hours >= 8 && hours < 18) return 'day';
    if (hours >= 18 && hours < 21) return 'evening';
    return 'night';
  }
};

// Perform an initial state validation on script load
(function validateInitialState() {
  // Wait for DOM loaded to ensure all scripts are initialized
  document.addEventListener('DOMContentLoaded', function() {
    // Use a timeout to ensure other scripts have finished initializing
    setTimeout(function() {
      // Validate game state if it exists
      if (window.GameState) {
        window.GameState.validateState();
      }
      
      // Validate player data if it exists
      if (window.Player) {
        window.Player.validatePlayerData();
      }
    }, 1000);
  });
})();
