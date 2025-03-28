// combatSystem.js - ENHANCED MULTI-COMBAT SYSTEM MODULE
// Implements a narrative-driven combat system with multiple combatants, stances, distances, and turn limits

// Combat state and management object
window.combatSystem = {
  // Combat state variables
  state: {
    active: false,
    turn: 0,
    maxTurns: 10, // Maximum turns before combat shifts
    phase: "initial", // initial, player, ally, enemy, resolution
    globalDistance: 2, // FOR BACKWARD COMPATIBILITY
    playerStance: "neutral", // neutral, aggressive, defensive
    targetArea: "body", // head, body, legs
    combatLog: [],
    
    // Multi-combat properties
    enemies: [], // Array of enemy objects (now includes individual distances)
    allies: [],  // Array of ally objects
    activeEnemyIndex: 0, // Current enemy taking action
    activeAllyIndex: 0,  // Current ally taking action
    
    // Counter system properties
    counterWindowOpen: false,
    counterChain: 0,          // Tracks how many counters in a row
    maxCounterChain: 4,       // Maximum number of back-and-forth exchanges
    lastCounterActor: null,   // Who performed the last counter ("player" or "enemy")
  },
  
  // Distance descriptors for UI
  distanceLabels: {
    0: "Grappling",
    1: "Close",
    2: "Medium",
    3: "Far"
  },
  
  // Stance descriptors for UI
  stanceLabels: {
    "neutral": "Balanced stance",
    "aggressive": "Aggressive stance",
    "defensive": "Defensive stance"
  },
  
  // Target area descriptors
  targetLabels: {
    "head": "Head",
    "body": "Body",
    "legs": "Legs"
  },
  
  // Initialize combat system
  initialize: function() {
    console.log("Combat system initialized");
    // Add an initialization flag for systems that need to check
    this.initialized = true;
    // Add any one-time initialization here
    
    // Tell the UI module that we're initialized
    if (window.combatUI && typeof window.combatUI.onCombatSystemInitialized === 'function') {
      window.combatUI.onCombatSystemInitialized();
    }
  },
  
  // Start combat with enemy(ies) and optional ally(ies)
  initiateCombat: function(enemyTypes, allyTypes = [], options = {}) {
    // Default options
    const combatOptions = {
      requireDefeat: false,  // Combat continues until one side is defeated by default
      maxTurns: 30,        // Maximum number of turns before combat ends
      ...options            // Allow overriding default options
    };
    
    // Reset combat state
    this.state = {
      active: true,
      turn: 0,
      maxTurns: combatOptions.maxTurns,
      requireDefeat: combatOptions.requireDefeat,
      phase: "initial",
      globalDistance: 2,  // Keep this for backward compatibility
      playerStance: "neutral",
      enemyStance: "neutral", // For backward compatibility with combatUI.js
      targetArea: "body",
      combatLog: [],
      
      // Multi-combat properties
      enemies: [],
      allies: [],
      activeEnemyIndex: 0,
      activeAllyIndex: 0,
     
      
      // Counter system properties
      counterWindowOpen: false,
      counterChain: 0,
      maxCounterChain: 4,
      lastCounterActor: null,

      // Wave-based combat properties
      currentWaveIndex: 0,
      enemySequence: options.enemySequence || null,
      remainingWaves: options.enemySequence ? options.enemySequence[0].waves : 0,

      
      // Backward compatibility
      enemy: null,
      distance: 2 // For backwards compatibility
      
    };

        // When starting combat, create allyDistances property to track relative distances
    this.state.allyDistances = {};

    // Initialize distance tracking for each ally to each enemy
    for (let allyIndex = 0; allyIndex < this.state.allies.length; allyIndex++) {
      const ally = this.state.allies[allyIndex];
      this.state.allyDistances[ally.id] = {};
      
      for (let enemyIndex = 0; enemyIndex < this.state.enemies.length; enemyIndex++) {
        const enemy = this.state.enemies[enemyIndex];
        // Initialize ally's distance to each enemy (use enemy's preferred distance as starting point)
        this.state.allyDistances[ally.id][enemy.id] = enemy.preferredDistance;
      }
    }

        this.state.playerDistances = {};

    // Initialize distance tracking for each enemy
    for (let enemyIndex = 0; enemyIndex < this.state.enemies.length; enemyIndex++) {
      const enemy = this.state.enemies[enemyIndex];
      // Initialize player's distance to each enemy (use enemy's preferred distance as starting point)
      this.state.playerDistances[enemy.id] = enemy.preferredDistance;
    }
    
    // Create enemy instances
    if (typeof enemyTypes === 'string') {
      // Single enemy (backward compatibility)
      const enemy = this.createEnemy(enemyTypes);
      this.state.enemies.push(enemy);
      this.state.enemy = enemy; // For backward compatibility
    } else {
      // Multiple enemies
      for (const enemyType of enemyTypes) {
        const enemy = this.createEnemy(enemyType);
        this.state.enemies.push(enemy);
        if (this.state.enemies.length === 1) {
          this.state.enemy = enemy; // For backward compatibility
        }
      }
    }
    
    // Create ally instances
    for (const allyType of allyTypes) {
      this.state.allies.push(this.createAlly(allyType));
    }
    
    // Tell the UI to set up the combat interface
    if (window.combatUI) {
      window.combatUI.renderCombatInterface();
    }
    
    // Generate descriptive intro based on number of combatants
    let intro;
    if (this.state.enemies.length === 1) {
      intro = `You're locked in combat with a ${this.state.enemies[0].name}.`;
    } else {
      intro = `You're locked in combat with ${this.getEnemyGroupDescription()}.`;
    }
    
    // Add ally description if present
    if (this.state.allies.length > 0) {
      const allyNames = this.state.allies.map(a => a.name);
      if (allyNames.length === 1) {
        intro += ` A ${allyNames[0]} fights alongside you.`;
      } else {
        const lastAlly = allyNames.pop();
        intro += ` ${allyNames.join(', ')} and a ${lastAlly} fight alongside you.`;
      }
    }
    
    this.addCombatMessage(intro);
    this.addCombatMessage(`You circle each other, feeling out the ground, prodding for weaknesses.`);
    
    // Enter player phase
    this.enterPhase("player");
  },
  
  // Helper function to get a description of the enemy group
  getEnemyGroupDescription: function() {
    const enemies = this.state.enemies;
    
    if (enemies.length === 1) {
      return `a ${enemies[0].name}`;
    } else if (enemies.length === 2) {
      return `a ${enemies[0].name} and a ${enemies[1].name}`;
    } else {
      // Create a comma-separated list with "and" before the last item
      const names = enemies.map(e => e.name);
      const lastEnemy = names.pop();
      return `${names.join(', ')} and a ${lastEnemy}`;
    }
  },
  
  // Create an enemy instance from template
  createEnemy: function(enemyType) {
    // Get template from enemy templates
    const template = window.ENEMY_TEMPLATES[enemyType];
    if (!template) {
      console.error("Enemy template not found:", enemyType);
      // Create a fallback enemy
      return {
        name: "Unknown Enemy",
        description: "A mysterious opponent.",
        health: 50,
        maxHealth: 50,
        stats: { power: 5, defense: 5, speed: 5 },
        distance: 2 // Default distance
      };
    }
    
    // Create a copy of the template with initial values
    const enemy = {
      ...template,
      id: `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentStance: template.preferredStance || "neutral",
      nextAction: null,
      distance: template.preferredDistance || 2 // Initialize individual distance
    };
    
    // Properly clone ammunition data if present
    if (template.ammunition) {
      enemy.ammunition = JSON.parse(JSON.stringify(template.ammunition));
    }
    
    return enemy;
  },
  
  // Create an ally instance from template
  createAlly: function(allyType) {
    // Get template from ally templates
    const template = window.ALLY_TEMPLATES[allyType];
    if (!template) {
      console.error("Ally template not found:", allyType);
      // Create a fallback ally
      return {
        name: "Unknown Ally",
        description: "A mysterious ally.",
        health: 50,
        maxHealth: 50,
        stats: { power: 5, defense: 5, speed: 5 }
      };
    }
    
    // Create a copy of the template with initial values
    const ally = {
      ...template,
      id: `ally_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      currentStance: template.preferredStance || "neutral",
      nextAction: null
    };
    
    // Properly clone ammunition data if present
    if (template.ammunition) {
      ally.ammunition = JSON.parse(JSON.stringify(template.ammunition));
    }
    
    return ally;
  },
  
  // Enter a specific combat phase
  enterPhase: function(phase) {
    const previousPhase = this.state.phase;
    
    // Store player's target when transitioning from player phase
    if (previousPhase === "player" && phase !== "player") {
      this._playerTargetIndex = this.state.activeEnemyIndex;
    }
    
    this.state.phase = phase;
    
    // If we're in a counter window, don't change phases normally
    if (this.state.counterWindowOpen && phase !== "initial" && phase !== "resolution") {
      if (this.state.lastCounterActor === "player") {
        // Check if current active enemy is defeated before counter
        const activeEnemy = this.getActiveEnemy();
        if (!activeEnemy || activeEnemy.health <= 0) {
          this.state.counterWindowOpen = false;
          this.enterPhase("resolution");
          return;
        }
        
        // Enemy should counter
        this.scheduleEnemyAction(() => this.handleEnemyCounter(), 1000);
        return;
      } else if (this.state.lastCounterActor === "enemy") {
        // Show player counter options
        if (window.combatUI) {
          window.combatUI.updateCounterOptions();
        }
        return;
      }
    }
    
    switch(phase) {
      case "initial":
        // Handle intro narrative and setup
        this.scheduleEnemyAction(() => this.enterPhase("player"), 1000);
        break;
        
        case "player":
          // Check if player is stunned
          if (window.gameState.playerStunned) {
            this.addCombatMessage(`You're still recovering from being stunned and cannot act!`);
            window.gameState.playerStunned = false; // Clear stun for next turn
            
            // Skip to ally phase if allies exist, otherwise enemy phase
            if (this.state.allies.length > 0) {
              this.enterPhase("ally");
            } else {
              setTimeout(() => this.enterPhase("enemy"), 1500);
            }
            return;
          }
          
          // Check if player is knocked down - Add this immediately after the stunned check
          if (window.gameState.knockedDown) {
            this.handlePlayerGetUp();
            return;
          }
          
          // Update UI to show player options
          if (window.combatUI) {
            window.combatUI.updateCombatOptions();
          }
          break;
        
      case "ally":
        // Check if there are any allies
        if (this.state.allies.length === 0) {
          this.enterPhase("enemy");
          return;
        }
        
        // Reset ally index if needed
        if (this.state.activeAllyIndex >= this.state.allies.length) {
          this.state.activeAllyIndex = 0;
        }
        
        // Get current ally
        const ally = this.state.allies[this.state.activeAllyIndex];
        
        // Check if ally is defeated
        if (ally.health <= 0) {
          // Skip this ally's turn
          this.state.activeAllyIndex++;
          
          // If we've processed all allies, move to enemy phase
          if (this.state.activeAllyIndex >= this.state.allies.length) {
            this.enterPhase("enemy");
          } else {
            // Otherwise, process the next ally
            this.enterPhase("ally");
          }
          return;
        }
        
        // Process ally turn (AI controlled)
        this.processAllyTurn(ally);
        break;
        
      case "enemy":
            // Reset enemy index when entering from a non-enemy phase
      if (previousPhase !== "enemy") {
        this.state.activeEnemyIndex = 0;
      } else if (this.state.activeEnemyIndex >= this.state.enemies.length) {
        // If entering from enemy phase but index is out of bounds, reset to 0
        this.state.activeEnemyIndex = 0;
      }
        
        // Check if all enemies are defeated
        if (this.areAllEnemiesDefeated()) {
          this.enterPhase("resolution");
          return;
        }
        
        // Get active enemy
        const activeEnemy = this.getActiveEnemy();
        
        // If no valid enemy, move to resolution
        if (!activeEnemy) {
          this.enterPhase("resolution");
          return;
        }
        
        // Check if current enemy is defeated
        if (activeEnemy.health <= 0) {
          // Skip this enemy's turn
          this.state.activeEnemyIndex++;
          
          // If we've processed all enemies, move to resolution
          if (this.state.activeEnemyIndex >= this.state.enemies.length) {
            this.enterPhase("resolution");
          } else {
            // Otherwise, process the next enemy
            this.enterPhase("enemy");
          }
          return;
        }
        
        // Backward compatibility with combatUI.js - update enemyStance 
        this.state.enemyStance = activeEnemy.currentStance;
        
        // Update global distance for backward compatibility
        this.updateGlobalDistance();
        
        // Process enemy turn
        this.scheduleEnemyAction(() => this.processEnemyTurn(), 1000);
        break;
        

      case "resolution":
        // Check if all enemies are defeated - regardless of requireDefeat setting
        if (this.areAllEnemiesDefeated()) {
          // Check if there are more waves to spawn - do this for both settings
          if (this.state.enemySequence && this.checkNextWave()) {
            // Spawn next wave
            this.spawnNextWave();
            
            // Continue to player phase
            setTimeout(() => this.enterPhase("player"), 1500);
            return;
          }
          
          // No more waves, end combat with victory
          this.endCombat(true); // Player victory
          return;
        }
        
        // Check if player is defeated
        if (window.gameState.health <= 0) {
          this.endCombat(false); // Player defeat
          return;
        }

        // After handling all common logic, now handle the setting-specific logic
        if (this.state.requireDefeat) {
          // When requireDefeat is true, IGNORE turn limit
          // Combat continues regardless of turns
        } else {
          // If NOT requiring defeat (default behavior)
          // Check if maximum turns reached
          if (this.state.turn >= this.state.maxTurns) {
            this.endCombatEarly();
            return;
          }
        }
        
        // Combat continues - increment turn counter
        this.state.turn++;
        
        // Restore player's target if needed
        if (this._playerTargetIndex !== undefined) {
          // Ensure the target is still valid
          if (this._playerTargetIndex < this.state.enemies.length && 
              this.state.enemies[this._playerTargetIndex] && 
              this.state.enemies[this._playerTargetIndex].health > 0) {
            this.state.activeEnemyIndex = this._playerTargetIndex;
          } else {
            // If original target is invalid, find the first valid enemy
            this.state.activeEnemyIndex = this.state.enemies.findIndex(e => e.health > 0);
            if (this.state.activeEnemyIndex === -1) this.state.activeEnemyIndex = 0;
          }
        }
        
        // Return to player phase
        this.enterPhase("player");
        break;
    }
    
    console.log(`Combat phase changed: ${previousPhase} -> ${phase}`);
    
    // Notify UI of phase change
    if (window.combatUI && typeof window.combatUI.onPhaseChanged === 'function') {
      window.combatUI.onPhaseChanged(phase, previousPhase);
    }
  },
  
  // Update global distance based on active enemy's distance (for backward compatibility)
  updateGlobalDistance: function() {
    const activeEnemy = this.getActiveEnemy();
    if (activeEnemy) {
      this.state.globalDistance = activeEnemy.distance;
      this.state.distance = activeEnemy.distance; // For backward compatibility
    }
  },
  
  // Helper function to get the active enemy
  getActiveEnemy: function() {
    return this.state.enemies[this.state.activeEnemyIndex];
  },
  
  // Helper function to get the current active enemy's distance
  getActiveEnemyDistance: function() {
    const activeEnemy = this.getActiveEnemy();
    return activeEnemy ? this.getPlayerDistanceToEnemy(activeEnemy) : 2; // Default to medium if no active enemy
  },
  
  // Helper function to check if all enemies are defeated
  areAllEnemiesDefeated: function() {
    return this.state.enemies.every(enemy => enemy.health <= 0);
  },
  
  // Helper function to check if combat should end with victory
shouldEndCombatWithVictory: function() {
  // First check if all current enemies are defeated
  const allEnemiesDefeated = this.areAllEnemiesDefeated();
  
  // If enemies are still alive, definitely not victory
  if (!allEnemiesDefeated) {
    return false;
  }
  
  // If all enemies are defeated, check if there are more waves
  if (this.state.enemySequence && this.checkNextWave()) {
    return false; // More waves available, don't end yet
  }
  
  // All enemies defeated and no more waves
  return true;
},
  
  // Helper function to check if all allies are defeated
  areAllAlliesDefeated: function() {
    return this.state.allies.every(ally => ally.health <= 0);
  },
  
  // End combat early due to turn limit
  endCombatEarly: function() {
    // Create narrative about the battle shifting
    const narrativeText = [
      "The battle shifts, forcing your engagement to end as the larger conflict swallows your skirmish!",
    ];
    
    // Add messages to combat log
    for (const line of narrativeText) {
      this.addCombatMessage(line);
    }
    
    // Show battle conclusion modal if UI exists
    if (window.combatUI && typeof window.combatUI.showBattleConclusionModal === 'function') {
      window.combatUI.showBattleConclusionModal('draw', narrativeText);
      return; // UI will handle the actual ending
    } else {
      // Fallback if UI isn't available
      setTimeout(() => this.endCombat("draw"), 2000);
    }
  },
  
  // Handle player getting up from knocked down
handlePlayerGetUp: function() {
  console.log("Player is knocked down, showing get up option");
  // Notify the UI to update for get up action
  if (window.combatUI) {
    window.combatUI.showGetUpOption();
  }
  
  // Add narrative
  this.addCombatMessage(`You're on the ground and need to get back to your feet.`);
},

// Execute player getting up action
  executePlayerGetUp: function() {
  this.addCombatMessage(`You struggle back to your feet, ready to continue the fight.`);
  
  // Clear knocked down status
  window.gameState.knockedDown = false;
  
  // Move to ally phase if allies exist, otherwise enemy phase
  if (this.state.allies.length > 0) {
    setTimeout(() => this.enterPhase("ally"), 1000);
  } else {
    setTimeout(() => this.enterPhase("enemy"), 1000);
  }
},
  
  // Process enemy's turn
  processEnemyTurn: function() {
    // Store the player's currently targeted enemy index
    const playerTargetIndex = this.state.activeEnemyIndex;
    
    // Get the enemy whose turn it is (may be different from the player's target)
    const enemy = this.state.enemies[this.state.activeEnemyIndex];
    
    // Safety check - if no enemy, move to next phase
    if (!enemy) {
      this._processingEnemyTurn = false;
      
      // Find the next valid enemy to take a turn, without changing player's target
      let nextEnemyTurnIndex = this.state.activeEnemyIndex + 1;
      if (nextEnemyTurnIndex >= this.state.enemies.length) {
        this.enterPhase("resolution");
      } else {
        // Temporarily set activeEnemyIndex to the next enemy's turn
        this.state.activeEnemyIndex = nextEnemyTurnIndex;
        this.enterPhase("enemy");
      }
      return;
    }
    
    // Check if enemy is already defeated
    if (enemy.health <= 0) {
      console.log("Enemy already defeated, skipping action");
      // Move to next enemy or resolution phase
      this._processingEnemyTurn = false;
      this.state.activeEnemyIndex++;
      
      if (this.state.activeEnemyIndex >= this.state.enemies.length) {
        this.enterPhase("resolution");
      } else {
        this.enterPhase("enemy");
      }
      return;
    }

    // Check if enemy is stunned
    if (enemy.stunned) {
      this.addCombatMessage(`The ${enemy.name} is still stunned and cannot act!`);
      // Remove stun for next turn
      enemy.stunned = false;
      
      // Move to next enemy or resolution phase
      this.scheduleEnemyAction(() => {
        this._processingEnemyTurn = false;
        this.state.activeEnemyIndex++;
        
        if (this.state.activeEnemyIndex >= this.state.enemies.length) {
          this.enterPhase("resolution");
        } else {
          this.enterPhase("enemy");
        }
      }, 1500);
      return;
    }

    // Check if enemy is knocked down
    if (enemy.knockedDown) {
      this.handleEnemyGetUp(enemy);
      return;
    }

    // If already processed an action this turn, don't process again
    if (this._processingEnemyTurn) return;
    this._processingEnemyTurn = true;

    // If enemy can counter attack
    if (this.state.counterWindowOpen) {
      this.handleEnemyCounter();
      return;
    }
    
    // Determine enemy action based on AI
    const action = this.determineEnemyAction(enemy);

      // Process the chosen action
    switch(action.type) {
      case "distance":
        this.handleEnemyDistanceChange(enemy, action.value);
        break;
      
      case "stance":
        this.handleEnemyStanceChange(enemy, action.value);
        break;
      
      case "attack":
        this.handleEnemyAttack(enemy, action.attackType, action.targetArea, action.target);
        break;
    }
    
    // Move to next enemy or resolution phase
    this.scheduleEnemyAction(() => {
      this._processingEnemyTurn = false;
      
      // Store the player's target for later restoration
      const playerTarget = playerTargetIndex;
      
      // Increment the active enemy turn counter but don't change player's target
      let nextEnemyTurnIndex = this.state.activeEnemyIndex + 1;
      
      if (nextEnemyTurnIndex >= this.state.enemies.length) {
        // Restore player's target before changing phase
        this.state.activeEnemyIndex = playerTarget;
        this.enterPhase("resolution");
      } else {
        // Set activeEnemyIndex to the next enemy's turn
        this.state.activeEnemyIndex = nextEnemyTurnIndex;
        this.enterPhase("enemy");
      }
    }, 1500);
  },

  // Add this function to combatSystem.js
findEnemyTarget: function() {
  // If no allies or all allies defeated, target player
  if (this.state.allies.length === 0 || this.areAllAlliesDefeated()) {
    return { type: "player" };
  }
  
  // 40% chance to target an ally if available
  const targetAllyChance = 0.4;
  
  if (Math.random() < targetAllyChance) {
    // Find alive allies
    const aliveAllies = this.state.allies.filter(ally => ally.health > 0);
    if (aliveAllies.length === 0) {
      return { type: "player" }; // All allies defeated, target player
    }
    
    // Pick a random alive ally
    const randomAllyIndex = Math.floor(Math.random() * aliveAllies.length);
    const targetAlly = aliveAllies[randomAllyIndex];
    const allyIndex = this.state.allies.findIndex(ally => ally.id === targetAlly.id);
    
    return { 
      type: "ally",
      index: allyIndex,
      ally: this.state.allies[allyIndex]
    };
  } else {
    // Target player
    return { type: "player" };
  }
},
  
  // Process ally turn
  processAllyTurn: function(ally) {
    this.addCombatMessage(`${ally.name} takes action.`);
    
    // Add a delay before the ally action to make it feel more natural
    this.scheduleEnemyAction(() => {
      // Determine ally action based on AI
      const action = this.determineAllyAction(ally);
      
      // Process the chosen action
      switch(action.type) {
        case "distance":
          this.handleAllyDistanceChange(ally, action.value);
          break;
        
        case "stance":
          this.handleAllyStanceChange(ally, action.value);
          break;
        
        case "attack":
          this.handleAllyAttack(ally, action.attackType, action.targetEnemyIndex, action.targetArea);
          break;
      }
    
         // Move to next ally or enemy phase with a consistent delay
         this.scheduleEnemyAction(() => {
          this.state.activeAllyIndex++;
          
          // If we've processed all allies, move to enemy phase
          if (this.state.activeAllyIndex >= this.state.allies.length) {
            this.enterPhase("enemy");
          } else {
            // Otherwise, process the next ally
            this.enterPhase("ally");
          }
        }, 1500);
      }, 1000); // 1 second delay before ally acts
  },
  
  // Handle enemy getting up from knocked down
  handleEnemyGetUp: function(enemy) {
    this.addCombatMessage(`The ${enemy.name} struggles to get back to their feet.`);
    
    // Clear knocked down status
    enemy.knockedDown = false;
    
    // Move to next enemy or resolution phase
    this.scheduleEnemyAction(() => {
      this._processingEnemyTurn = false;
      this.state.activeEnemyIndex++;
      
      if (this.state.activeEnemyIndex >= this.state.enemies.length) {
        this.enterPhase("resolution");
      } else {
        this.enterPhase("enemy");
      }
    }, 1500);
  },
  
  // Determine enemy's next action based on AI logic
determineEnemyAction: function(enemy) {
  // Find a target (player or ally)
  const target = this.findEnemyTarget();
  
  const distanceDiff = enemy.distance - enemy.preferredDistance;
  
  // Probabilities based on situation
  let actionProbabilities = {
    distance: 0.2,
    stance: 0.2,
    attack: 0.6
  };
  
  // Adjust based on current situation
  if (Math.abs(distanceDiff) > 1) {
    // Not at preferred distance, more likely to adjust distance
    actionProbabilities.distance = 0.6;
    actionProbabilities.attack = 0.2;
  }
  
  if (this.state.playerStance === "aggressive" && enemy.currentStance !== "defensive") {
    // Player is aggressive, more likely to change to defensive
    actionProbabilities.stance = 0.5;
    actionProbabilities.attack = 0.3;
  }
  
  // Prioritize javelin throws at medium range if ammo available
  if (enemy.distance === 2 && this.enemyHasAmmo(enemy, 'javelin')) {
    // At medium range with javelins, more likely to attack
    actionProbabilities.attack = 0.8;
    actionProbabilities.distance = 0.1;
    actionProbabilities.stance = 0.1;
  }
  
  // Roll for action type
  const roll = Math.random();
  let actionType = "attack"; // Default
  
  if (roll < actionProbabilities.distance) {
    actionType = "distance";
  } else if (roll < actionProbabilities.distance + actionProbabilities.stance) {
    actionType = "stance";
  }
  
  // Determine specific action details
  switch(actionType) {
    case "distance":
      // Move toward preferred distance
      return {
        type: "distance",
        value: distanceDiff > 0 ? -1 : 1
      };
    
    case "stance":
      // Choose appropriate stance
      let newStance = "neutral";
      if (this.state.playerStance === "aggressive") {
        newStance = "defensive";
      } else if (this.state.playerStance === "defensive" && enemy.distance <= 1) {
        newStance = "aggressive";
      }
      return {
        type: "stance",
        value: newStance
      };
    
    case "attack":
      // Check for javelin throw opportunity at medium range
      if (enemy.distance === 2 && this.enemyHasAmmo(enemy, 'javelin')) {
        return {
          type: "attack",
          attackType: "ThrowJavelin",
          targetArea: this.getRandomTargetArea(),
          target: target
        };
      }
      
      // Can only attack if in range
      if (enemy.distance > (enemy.weaponRange || 1)) {
        // Too far, adjust distance instead
        return {
          type: "distance",
          value: -1
        };
      }
      
      // Choose attack type and target
      return {
        type: "attack",
        attackType: this.getRandomEnemyAttack(enemy),
        targetArea: this.getRandomTargetArea(),
        target: target
      };
  }
},
  
  // Determine ally's next action based on AI logic
  determineAllyAction: function(ally) {
    // Find the best enemy to target
    const targetEnemyIndex = this.findBestEnemyTarget();
    const targetEnemy = this.state.enemies[targetEnemyIndex];
    
    // If no valid targets, just change stance
    if (!targetEnemy || targetEnemy.health <= 0) {
      return {
        type: "stance",
        value: "neutral"
      };
    }
    
    // Get the target enemy's distance to this ally
    const enemyDistance = this.getAllyDistanceToEnemy(ally, targetEnemy);
    
    // If distance is too far, close in
    if (enemyDistance > ally.weaponRange) {
      return {
        type: "distance",
        value: -1  // Move closer
      };
    }
    
    // Prioritize javelin throws at medium range if ammo available
    if (enemyDistance === 2 && this.allyHasAmmo(ally, 'javelin')) {
      return {
        type: "attack",
        attackType: "ThrowJavelin",
        targetEnemyIndex: targetEnemyIndex,
        targetArea: this.getRandomTargetArea()
      };
    }
    
    // If in preferred range, attack
    if (enemyDistance <= ally.weaponRange) {
      return {
        type: "attack",
        attackType: this.getRandomAllyAttack(ally),
        targetEnemyIndex: targetEnemyIndex,
        targetArea: this.getRandomTargetArea()
      };
    }
    
    // Default to stance change
    return {
      type: "stance",
      value: "aggressive"
    };
  },
  
  // Find the best enemy to target (lowest health)
  findBestEnemyTarget: function() {
    let lowestHealth = Infinity;
    let targetIndex = 0;
    
    this.state.enemies.forEach((enemy, index) => {
      if (enemy.health > 0 && enemy.health < lowestHealth) {
        lowestHealth = enemy.health;
        targetIndex = index;
      }
    });
    
    return targetIndex;
  },
  
  // Process a player action during combat
  handleCombatAction: function(action, params = {}) {
    // Allow counter actions during counter window regardless of phase
    if (!this.state.active || 
        (this.state.phase !== "player" && 
         !(this.state.counterWindowOpen && action === "counter"))) {
      console.warn("Cannot handle combat action - not in player phase or not a valid counter");
      return;
    }
    
    switch(action) {
      case "change_distance":
        this.handleDistanceChange(params.change);
        break;
      
      case "change_stance":
        this.handleStanceChange(params.stance);
        break;
      
      case "change_target":
        this.handleTargetChange(params.target);
        break;
        
      case "select_enemy":
        this.handleSelectEnemy(params.enemyIndex);
        break;
      
      case "attack":
        this.handlePlayerAttack(params.attackType);
        break;
      
      case "counter":
        this.handlePlayerCounter(params.attackType);
        break;
      
      case "flee":
        this.attemptFlee();
        break;
      
      default:
        console.warn("Unknown combat action:", action);
        return;
    }
    
    // Move to ally phase (if allies present) or enemy phase unless combat has ended
    if (this.state.active && !this.state.counterWindowOpen) {
      if (this.state.allies.length > 0) {
        this.enterPhase("ally");
      } else {
        this.enterPhase("enemy");
      }
    }
  },
  
  // Handle player changing target enemy
  handleSelectEnemy: function(enemyIndex) {
    this.state.activeEnemyIndex = enemyIndex;
    const enemy = this.state.enemies[enemyIndex];
    
    this.addCombatMessage(`You focus your attention on the ${enemy.name}.`);
    
    // Update global distance for backward compatibility
    this.updateGlobalDistance();
    
    // Update UI
    if (window.combatUI) {
      window.combatUI.updateCombatInterface();
    }
  },
  
  // Handle player changing distance to active enemy
  handleDistanceChange: function(change) {
    const activeEnemy = this.getActiveEnemy();
    if (!activeEnemy) return;
    
    const oldDistance = this.getPlayerDistanceToEnemy(activeEnemy);
    const newDistance = Math.max(0, Math.min(3, oldDistance + change));

// Update the player's distance to this enemy
  this.setPlayerDistanceToEnemy(activeEnemy, newDistance);
  
  // For backward compatibility
  activeEnemy.distance = newDistance;
    
     // Generate appropriate narrative
  if (change < 0) {
    this.addCombatMessage(this.generateDistanceNarrative("approach"));
  } else {
    this.addCombatMessage(this.generateDistanceNarrative("retreat"));
  }
  
  // Enemy reaction to distance change
  this.addCombatMessage(this.generateEnemyReactionToDistance());
  
  // Update UI
  if (window.combatUI) {
    window.combatUI.updateCombatInterface();
  }
},
  
    // Handle ally changing distance to active enemy
  handleAllyDistanceChange: function(ally, change) {
    // Get active enemy for this ally's action
    const targetIndex = this.findBestEnemyTarget();
    const targetEnemy = this.state.enemies[targetIndex];
    
    if (!targetEnemy) return; // No valid target
    
    // Get current distance
    const currentDistance = this.getAllyDistanceToEnemy(ally, targetEnemy);
    
    // Calculate new distance with boundaries
    const newDistance = Math.max(0, Math.min(3, currentDistance + change));
    
    // Update the ally's distance to this enemy
    this.setAllyDistanceToEnemy(ally, targetEnemy, newDistance);
    
    // Generate appropriate narrative
    if (change < 0) {
      this.addCombatMessage(`${ally.name} advances toward the ${targetEnemy.name}, closing the distance.`);
    } else {
      this.addCombatMessage(`${ally.name} falls back from the ${targetEnemy.name}, increasing the gap.`);
    }
    
    // Update UI
    if (window.combatUI) {
      window.combatUI.updateCombatInterface();
    }
  },
  
  // Handle player changing stance
  handleStanceChange: function(newStance) {
    const oldStance = this.state.playerStance;
    this.state.playerStance = newStance;
    
    // Generate appropriate narrative
    this.addCombatMessage(this.generateStanceNarrative(newStance));
    
    // Enemy reaction to stance change
    this.addCombatMessage(this.generateEnemyReactionToStance());
    
    // Update UI
    if (window.combatUI) {
      window.combatUI.updateCombatInterface();
    }
  },

    // 3. Add helper functions to get and set ally distances to enemies:
  getAllyDistanceToEnemy: function(ally, enemy) {
    // If we don't have distance tracking established, default to enemy's distance
    if (!this.state.allyDistances || !this.state.allyDistances[ally.id] || 
        this.state.allyDistances[ally.id][enemy.id] === undefined) {
      return enemy.distance;
    }
    
    return this.state.allyDistances[ally.id][enemy.id];
  },

  setAllyDistanceToEnemy: function(ally, enemy, distance) {
    // Ensure the distance structures exist
    if (!this.state.allyDistances) {
      this.state.allyDistances = {};
    }
    
    if (!this.state.allyDistances[ally.id]) {
      this.state.allyDistances[ally.id] = {};
    }
    
    // Set the distance
    this.state.allyDistances[ally.id][enemy.id] = distance;
  },
  
  // Handle ally changing stance
  handleAllyStanceChange: function(ally, newStance) {
    const oldStance = ally.currentStance;
    ally.currentStance = newStance;
    
    // Generate appropriate narrative
    if (newStance === "aggressive") {
      this.addCombatMessage(`${ally.name} shifts into an aggressive posture, readying to strike.`);
    } else if (newStance === "defensive") {
      this.addCombatMessage(`${ally.name} raises their guard, adopting a defensive stance.`);
    } else {
      this.addCombatMessage(`${ally.name} resets to a balanced, neutral stance.`);
    }
    
    // Update UI
    if (window.combatUI) {
      window.combatUI.updateCombatInterface();
    }
  },
  
  // Handle player changing target area
  handleTargetChange: function(targetArea) {
    this.state.targetArea = targetArea;
    
    // Add targeting narrative
    this.addCombatMessage(`You adjust your aim, focusing on the ${this.targetLabels[targetArea]}.`);
    
    // Update UI
    if (window.combatUI) {
      window.combatUI.updateCombatInterface();
    }
  },
  
  // Handle player attack
  handlePlayerAttack: function(attackType) {
    // Get active enemy target
    const enemy = this.getActiveEnemy();
    
    // Check if target enemy is valid
    if (!enemy || enemy.health <= 0) {
      this.addCombatMessage("Your target is no longer a threat. Choose another enemy.");
      return;
    }
    
    // Special case for javelin throws
    if (attackType === "Throw Javelin") {
      return this.handleJavelinThrow(enemy);
    }

    // Special case for shield bash
    if (attackType === "Shield Bash") {
      return this.handleShieldBash(enemy);
    }

    // Special case for shield shove
    if (attackType === "Shove") {
      return this.handleShieldShove(enemy);
    }
        
    // Get player weapon
    const weapon = window.player.equipment?.mainHand;
    if (!weapon && attackType !== "Punch") {
      this.addCombatMessage("You have no weapon equipped!");
      return;
    }
    
    // Get weapon template
    const weaponTemplate = weapon ? weapon.getTemplate() : { name: "fist", category: "weapon" };
    
    // Handle ranged weapons - intentionally disabled except for javelins
    const isRanged = false; // All ranged weapons disabled except javelin throws
    
    // Generate attack narrative
    this.addCombatMessage(this.generateAttackNarrative(weaponTemplate, attackType));
    
    // Reduce weapon durability with each use
    if (weapon && weapon.durability !== undefined) {
      // Random durability reduction between 1-2 points
      const durabilityLoss = Math.floor(Math.random() * 2) + 1;
      weapon.durability = Math.max(0, weapon.durability - durabilityLoss);
      
      // Check if weapon breaks
      if (weapon.durability <= 0) {
        this.addCombatMessage(`Your ${weaponTemplate.name} breaks during the attack!`);
        // Weapon still hits in this attack, but will be unusable after
      }
    }
    
    // Check for shield block first (before determining hit success)
    if (this.checkEnemyShieldBlock(enemy)) {
      // Attack was blocked by enemy shield
      this.addCombatMessage(`Your attack is blocked by the ${enemy.name}'s shield with a resounding clang!`);
      
      // No counter chance on shield block
      return;
    }
    
    // Determine hit success based on skills and stats
    const hitSuccess = this.resolveAttackSuccess(weaponTemplate, attackType);
    
    if (hitSuccess) {
      // Calculate damage
      const damage = this.calculateDamage(weaponTemplate, attackType, enemy);
      
      // Apply damage to enemy
      enemy.health = Math.max(0, enemy.health - damage);
      
      // Generate hit narrative
      this.addCombatMessage(this.generateHitNarrative(weaponTemplate, attackType, damage));
      
      // Update UI immediately to show health change
      if (window.combatUI) {
        window.combatUI.updateCombatInterface();
      }
      
      // Reset counter chain after successful hit
      this.state.counterChain = 0;
      this.state.counterWindowOpen = false;
      this.state.lastCounterActor = null;
      
      // Check if enemy is defeated
      if (enemy.health <= 0) {
        this.addCombatMessage(`The ${enemy.name} collapses before you, defeated.`);
        
        // Check if all enemies are defeated
        if (this.shouldEndCombatWithVictory()) {
          setTimeout(() => this.endCombat(true), 1500);
        }
      }
    } else {
      // Generate miss narrative
      this.addCombatMessage(this.generateMissNarrative(weaponTemplate, attackType));
      
      // Potential counterattack window
      if (this.shouldEnemyCounter(enemy)) {
        this.state.counterWindowOpen = true;
        this.state.counterChain = 0; // Reset counter chain at start of new exchange
        this.addCombatMessage(`The ${enemy.name} sees an opening and prepares to counter!`);
        
        // Move to enemy phase for counter
        setTimeout(() => this.handleEnemyCounter(), 1000);
        return;
      }
    }
    
    // Update UI
    if (window.combatUI) {
      window.combatUI.updateCombatInterface();
    }
  },
  
  // Handle ally attack
  handleAllyAttack: function(ally, attackType, targetEnemyIndex, targetArea) {
    const enemy = this.state.enemies[targetEnemyIndex];
    
    // Check if target enemy is still alive
    if (!enemy || enemy.health <= 0) {
      this.addCombatMessage(`${ally.name} looks for another target as their intended foe is already down.`);
      return;
    }
    
    // Special case for javelin throws
    if (attackType === "ThrowJavelin") {
      const enemyDistance = this.getAllyDistanceToEnemy(ally, enemy);
      if (!this.allyHasAmmo(ally, 'javelin') || enemyDistance !== 2) {
      } else {
        // Use a javelin
        this.useAllyAmmo(ally, 'javelin');
        
        const javelinName = ally.ammunition.javelin.name || "javelin";
        this.addCombatMessage(`${ally.name} hurls a ${javelinName} at the ${enemy.name}!`);
        
        // Check for enemy shield block
        if (this.checkEnemyShieldBlock(enemy)) {
          this.addCombatMessage(`The ${enemy.name}'s shield deflects the javelin with a loud thud!`);
          return;
        }
        
        // Calculate hit chance
        const hitChance = 60 + (ally.accuracy || 0) - (enemy.defense || 0);
        const hitRoll = Math.random() * 100;
        
        if (hitRoll < hitChance) {
          // Calculate damage
          const damage = Math.round(10 + (ally.power || 5) * 0.5 + Math.random() * 5);
          
          // Apply damage to enemy
          enemy.health = Math.max(0, enemy.health - damage);
          
          // Generate hit narrative
          this.addCombatMessage(`The javelin strikes true, dealing ${damage} damage to the ${enemy.name}!`);
          
          // Update UI immediately to show health change
          if (window.combatUI) {
            window.combatUI.updateCombatInterface();
          }
          
          // Check if enemy is defeated
          if (enemy.health <= 0) {
            this.addCombatMessage(`${ally.name} has defeated the ${enemy.name}!`);
          }
        } else {
          // Javelin misses
          this.addCombatMessage(`The javelin flies wide, missing the ${enemy.name}.`);
        }
        
        return;
      }
    }
    
    this.addCombatMessage(`${ally.name} attacks the ${enemy.name}'s ${this.targetLabels[targetArea]}!`);
    
    // Check for enemy shield block
    if (this.checkEnemyShieldBlock(enemy)) {
      this.addCombatMessage(`The attack is blocked by the ${enemy.name}'s shield with a resounding clang!`);
      return;
    }
    
    // Determine hit success
    const hitChance = 50 + (ally.accuracy || 0) - (enemy.defense || 0);
    const hitRoll = Math.random() * 100;
    
    if (hitRoll < hitChance) {
      // Calculate damage
      const damage = this.calculateAllyDamage(ally, enemy, targetArea);
      
      // Apply damage to enemy
      enemy.health = Math.max(0, enemy.health - damage);
      
      // Generate hit narrative
      this.addCombatMessage(`The attack connects, dealing ${Math.round(damage)} damage to the ${enemy.name}!`);
      
      // Update UI immediately to show health change
      if (window.combatUI) {
        window.combatUI.updateCombatInterface();
      }
      
      // Check if enemy is defeated
      if (enemy.health <= 0) {
        this.addCombatMessage(`${ally.name} has defeated the ${enemy.name}!`);
      }
    } else {
      // Attack misses
      this.addCombatMessage(`${ally.name}'s attack misses as the ${enemy.name} evades.`);
    }
    
    // Update UI
    if (window.combatUI) {
      window.combatUI.updateCombatInterface();
    }
  },

  // Add these helper functions in combatSystem.js
getPlayerDistanceToEnemy: function(enemy) {
  // If we don't have distance tracking established, default to enemy's distance
  if (!this.state.playerDistances || this.state.playerDistances[enemy.id] === undefined) {
    return enemy.distance;
  }
  
  return this.state.playerDistances[enemy.id];
},

setPlayerDistanceToEnemy: function(enemy, distance) {
  // Ensure the distance structures exist
  if (!this.state.playerDistances) {
    this.state.playerDistances = {};
  }
  
  // Set the distance
  this.state.playerDistances[enemy.id] = distance;
  
  // For backward compatibility
  if (enemy === this.getActiveEnemy()) {
    this.state.globalDistance = distance;
    this.state.distance = distance;
  }
},
  
  // Implementation of javelin throwing as a specialized attack
  handleJavelinThrow: function(enemy) {
    // Check if at correct distance for javelin throw (medium range, distance 2)
    if (enemy.distance < 2 || enemy.distance > 3) {
      this.addCombatMessage("You can only throw javelins at medium or far range!");
      return;
    }


    // Get ammunition
    const ammo = window.player.equipment?.ammunition;
    
    // Verify we have javelins
    if (!ammo || ammo === "occupied" || ammo.ammoType !== "javelin" || ammo.currentAmount <= 0) {
      this.addCombatMessage("You have no javelins to throw!");
      return;
    }
    
    // Use 1 javelin
    const oldCount = ammo.currentAmount;
    ammo.useAmmo(1);
    
    // Verify the javelin was consumed
    if (oldCount === ammo.currentAmount) {
      console.error("Failed to consume javelin ammunition!");
      // Force decrement as fallback
      ammo.currentAmount = Math.max(0, ammo.currentAmount - 1);
    }
    
    this.addCombatMessage(`You throw a javelin at the ${enemy.name}. (${ammo.currentAmount}/${ammo.capacity} javelins remaining)`);
    
    // Javelins have good hit chance but moderate damage
    const hitBonus = 10;
    const hitSuccess = this.resolveAttackSuccess({
      name: "javelin",
      stats: { damage: 22, armorPenetration: 5 }
    }, "Throw", hitBonus);
    
    if (hitSuccess) {
      // Calculate damage - javelins do good damage and have armor penetration
      const damage = Math.round(10 + Math.random() * 5);
      
      // Apply damage to enemy
      enemy.health = Math.max(0, enemy.health - damage);
      
      // Generate hit narrative
      this.addCombatMessage(`Your javelin strikes true, piercing the ${enemy.name} for ${damage} damage!`);
      
      // Update UI immediately to show health change
      if (window.combatUI) {
        window.combatUI.updateCombatInterface();
      }
      
      // Check if enemy is defeated
      if (enemy.health <= 0) {
        this.addCombatMessage(`The ${enemy.name} collapses, defeated by your well-aimed javelin.`);
        
        // Check if all enemies are defeated
        if (this.shouldEndCombatWithVictory()) {
          setTimeout(() => this.endCombat(true), 1500);
        }
      }
    } else {
      // Generate miss narrative
      this.addCombatMessage(`Your javelin flies wide, missing the ${enemy.name}!`);
    }
    
    // Update UI
    if (window.combatUI) {
      window.combatUI.updateCombatInterface();
    }
  },

  // Handle shield bash attack
  handleShieldBash: function(enemy) {
    // Get player's shield
    const shield = window.player.equipment?.offHand;
    if (!shield || shield === "occupied") {
      this.addCombatMessage("You need a shield to bash!");
      return;
    }
    
    const shieldTemplate = shield.getTemplate();
    
    // Check if it's actually a shield
    if (shieldTemplate.weaponType?.name !== "Shield") {
      this.addCombatMessage("You need a shield to bash!");
      return;
    }
    
    // Generate attack narrative
    this.addCombatMessage(`You thrust forward with your ${shieldTemplate.name}, attempting to bash the ${enemy.name}.`);
    
    // Reduce shield durability with each use
    if (shield.durability !== undefined) {
      // Random durability reduction between 1-2 points
      const durabilityLoss = Math.floor(Math.random() * 2) + 1;
      shield.durability = Math.max(0, shield.durability - durabilityLoss);
      
      // Check if shield breaks
      if (shield.durability <= 0) {
        this.addCombatMessage(`Your ${shieldTemplate.name} breaks during the bash attack!`);
        // Shield still hits in this attack, but will be unusable after
      }
    }
    
    // Determine hit success
    const hitSuccess = this.resolveAttackSuccess({
      name: shieldTemplate.name,
      stats: { damage: 5 }  // Shields do less damage but can stun
    }, "Bash");
    
    if (hitSuccess) {
      // Calculate damage - shield bashes do less damage
      const damage = Math.round(5 + Math.random() * 3);
      
      // Apply damage to enemy
      enemy.health = Math.max(0, enemy.health - damage);
      
      // Generate hit narrative
      this.addCombatMessage(`Your shield connects solidly, dealing ${damage} damage and staggering the ${enemy.name}!`);
      
      // Update UI immediately to show health change
      if (window.combatUI) {
        window.combatUI.updateCombatInterface();
      }
      
      // Special shield bash effect: chance to stun the enemy
      if (Math.random() < 0.5) {  // 50% chance to stun
        this.addCombatMessage(`The ${enemy.name} is stunned by your shield bash!`);
        // Apply stun effect (enemy misses their next turn)
        enemy.stunned = true;
      }
      
      // Reset counter chain after successful hit
      this.state.counterChain = 0;
      this.state.counterWindowOpen = false;
      this.state.lastCounterActor = null;
      
      // Check if enemy is defeated
      if (enemy.health <= 0) {
        this.addCombatMessage(`The ${enemy.name} collapses from your shield bash.`);
        
        // Check if all enemies are defeated
        if (this.shouldEndCombatWithVictory()) {
          setTimeout(() => this.endCombat(true), 1500);
        }
      }
    } else {
      // Generate miss narrative
      this.addCombatMessage(`The ${enemy.name} dodges your shield bash!`);
      
      // Potential counterattack window
      if (this.shouldEnemyCounter(enemy)) {
        this.state.counterWindowOpen = true;
        this.state.counterChain = 0; // Reset counter chain at start of new exchange
        this.addCombatMessage(`The ${enemy.name} sees an opening and prepares to counter!`);
        
        // Move to enemy phase for counter
        setTimeout(() => this.handleEnemyCounter(), 1000);
        return;
      }
    }
    
    // Update UI
    if (window.combatUI) {
      window.combatUI.updateCombatInterface();
    }
  },

  // Handle shield shove attack
  handleShieldShove: function(enemy) {
    // Get player's shield
    const shield = window.player.equipment?.offHand;
    if (!shield || shield === "occupied") {
      this.addCombatMessage("You need a shield to shove!");
      return;
    }
    
    const shieldTemplate = shield.getTemplate();
    
    // Check if it's actually a shield
    if (shieldTemplate.weaponType?.name !== "Shield") {
      this.addCombatMessage("You need a shield to shove!");
      return;
    }
    
    // Generate attack narrative
    this.addCombatMessage(`You drive your ${shieldTemplate.name} forward with force, attempting to shove the ${enemy.name} back.`);
    
    // Reduce shield durability slightly with each use
    if (shield.durability !== undefined) {
      // Minimal durability reduction for shoving (0-1 points)
      const durabilityLoss = Math.floor(Math.random() * 2);
      shield.durability = Math.max(0, shield.durability - durabilityLoss);
    }
    
    // Calculate success chance based on player's phy + melee skill vs enemy power
    const playerPush = (window.player.phy || 5) + (window.player.skills.melee || 0);
    const enemyResist = (enemy.power || 5) + (enemy.counterSkill || 0);
    const successChance = 50 + ((playerPush - enemyResist) * 5);
    
    // Roll for success
    const roll = Math.random() * 100;
    const success = roll <= successChance;
    
    if (success) {
      // Increase distance by 1
      enemy.distance = Math.min(3, enemy.distance + 1);
      
      // Update global distance for backward compatibility
      this.updateGlobalDistance();
      
      this.addCombatMessage(`You successfully push the ${enemy.name} back!`);
      
      // Check for knockdown
      const knockdownChance = 40 + ((playerPush - enemyResist) * 3);
      const knockdownRoll = Math.random() * 100;
      const knockedDown = knockdownRoll <= knockdownChance;
      
      if (knockedDown) {
        this.addCombatMessage(`The ${enemy.name} loses balance and falls to the ground!`);
        
        // Apply knocked down status
        enemy.knockedDown = true;
        // First turn they're stunned
        enemy.stunned = true;
      }
    } else {
      this.addCombatMessage(`The ${enemy.name} holds their ground against your shove.`);
      
      // Potential counterattack window
      if (this.shouldEnemyCounter(enemy)) {
        this.state.counterWindowOpen = true;
        this.state.counterChain = 0;
        this.addCombatMessage(`The ${enemy.name} sees an opening and prepares to counter!`);
        
        // Move to enemy phase for counter
        setTimeout(() => this.handleEnemyCounter(), 1000);
        return;
      }
    }
    
    // Update UI
    if (window.combatUI) {
      window.combatUI.updateCombatInterface();
    }
  },
  
  // Handle player counter attack
  handlePlayerCounter: function(attackType) {
    const enemy = this.getActiveEnemy();
    if (!enemy) {
      // Target enemy is no longer valid
      this.state.counterWindowOpen = false;
      this.state.counterChain = 0;
      this.state.lastCounterActor = null;
      return;
    }
    
    this.state.counterChain++;
    this.state.lastCounterActor = "player";
    
    // Get player weapon
    const weapon = window.player.equipment?.mainHand;
    const weaponTemplate = weapon ? weapon.getTemplate() : null;
    
    // Generate counter narrative
    this.addCombatMessage(`You seize the opportunity with a lightning-fast counter-riposte!`);
    
    // Reduce weapon durability with each use
    if (weapon && weapon.durability !== undefined) {
      // Random durability reduction between 1-2 points
      const durabilityLoss = Math.floor(Math.random() * 2) + 1;
      weapon.durability = Math.max(0, weapon.durability - durabilityLoss);
      
      // Check if weapon breaks
      if (weapon.durability <= 0) {
        this.addCombatMessage(`Your ${weaponTemplate.name} breaks during the counter-attack!`);
        // Weapon still hits in this attack, but will be unusable after
      }
    }
    
    // Check if we've reached maximum counter chain
    if (this.state.counterChain >= this.state.maxCounterChain) {
      this.addCombatMessage(`After a frenzied exchange of feints and counters, both you and the ${enemy.name} back off, breathing heavily.`);
      this.state.counterChain = 0;
      this.state.counterWindowOpen = false;
      this.state.lastCounterActor = null;
      
      // Continue to resolution phase
      setTimeout(() => this.enterPhase("resolution"), 1000);
      return;
    }
    
    // Check for shield block
    if (this.checkEnemyShieldBlock(enemy)) {
      // Attack was blocked by enemy shield
      this.addCombatMessage(`Your counter-attack is blocked by the ${enemy.name}'s shield!`);
      
      // End the counter exchange
      this.state.counterChain = 0;
      this.state.counterWindowOpen = false;
      this.state.lastCounterActor = null;
      
      // Move to enemy phase
      if (this.state.allies.length > 0) {
        setTimeout(() => this.enterPhase("ally"), 1000);
      } else {
        setTimeout(() => this.enterPhase("enemy"), 1000);
      }
      return;
    }
  
    // Counter attacks have higher hit chance
    const hitBonus = 20; // +20% hit chance on counters
    const hitSuccess = this.resolveAttackSuccess(weaponTemplate, attackType, hitBonus);
    
    if (hitSuccess) {
      // Calculate damage with bonus for counters
      const damage = this.calculateDamage(weaponTemplate, attackType, enemy) * 1.5;
      
      // Apply damage to enemy
      enemy.health = Math.max(0, enemy.health - damage);
      
      // Generate hit narrative
      this.addCombatMessage(`Your counter-riposte lands perfectly, dealing ${Math.round(damage)} damage!`);
      
      // Update UI immediately to show health change
      if (window.combatUI) {
        window.combatUI.updateCombatInterface();
      }
      
      // Reset counter chain after successful hit
      this.state.counterChain = 0;
      this.state.counterWindowOpen = false;
      this.state.lastCounterActor = null;
      
      // Check if enemy is defeated
      if (enemy.health <= 0) {
        this.addCombatMessage(`The ${enemy.name} falls before your counter-attack.`);
        
        // Check if all enemies are defeated
        if (this.shouldEndCombatWithVictory()) {
          setTimeout(() => this.endCombat(true), 1500);
        }
      }
      
      // Continue to next phase
      if (this.state.allies.length > 0) {
        setTimeout(() => this.enterPhase("ally"), 1000);
      } else {
        setTimeout(() => this.enterPhase("enemy"), 1000);
      }
    } else {
      // Counter missed
      this.addCombatMessage(`Your counter-riposte misses as the ${enemy.name} deftly evades!`);
      
      // Enemy gets counter opportunity
      this.state.counterWindowOpen = true;
      
      // Go to enemy phase for counter
      setTimeout(() => this.handleEnemyCounter(), 1000);
    }
    
    // Update UI
    if (window.combatUI) {
      window.combatUI.updateCombatInterface();
    }
  },
  
  // Handle enemy changing distance - now modifies the specific enemy's distance
  handleEnemyDistanceChange: function(enemy, change) {
    const oldDistance = enemy.distance;
    enemy.distance = Math.max(0, Math.min(3, enemy.distance + change));
    
    // Update global distance property for backward compatibility
    if (enemy === this.getActiveEnemy()) {
      this.updateGlobalDistance();
    }
    
    // Generate appropriate narrative
    if (change < 0) {
      this.addCombatMessage(`The ${enemy.name} advances toward you, closing the distance.`);
    } else {
      this.addCombatMessage(`The ${enemy.name} steps back, increasing the gap between you.`);
    }
    
    // Update UI
    if (window.combatUI) {
      window.combatUI.updateCombatInterface();
    }
  },
  
  // Handle enemy changing stance
  handleEnemyStanceChange: function(enemy, newStance) {
    const oldStance = enemy.currentStance;
    enemy.currentStance = newStance;
    
    // For backward compatibility
    if (enemy === this.getActiveEnemy()) {
      this.state.enemyStance = newStance;
    }
    
    // Generate appropriate narrative
    if (newStance === "aggressive") {
      this.addCombatMessage(`The ${enemy.name} shifts into an aggressive posture, readying to strike.`);
    } else if (newStance === "defensive") {
      this.addCombatMessage(`The ${enemy.name} raises their guard, adopting a defensive stance.`);
    } else {
      this.addCombatMessage(`The ${enemy.name} resets to a balanced, neutral stance.`);
    }
    
    // Update UI
    if (window.combatUI) {
      window.combatUI.updateCombatInterface();
    }
  },
  
  // Handle enemy attack
handleEnemyAttack: function(enemy, attackType, targetArea, target) {
  // Default to player if no target specified (for backward compatibility)
  if (!target) {
    target = { type: "player" };
  }

  // Shield Shove handling
  if (attackType === "ShieldShove") {
    if (target.type === "player") {
      this.addCombatMessage(`The ${enemy.name} lunges forward, trying to shove you back with their shield!`);
      
      // Calculate success chance based on enemy stats vs player phy + melee
      const enemyPush = (enemy.power || 5) + (enemy.counterSkill || 0);
      const playerResist = (window.player.phy || 5) + (window.player.skills?.melee || 0);
      const successChance = 50 + ((enemyPush - playerResist) * 5);
      
      // Roll for success
      const roll = Math.random() * 100;
      const success = roll <= successChance;
      
      if (success) {
        // Increase distance by 1 (enemy moving away from player)
        enemy.distance = Math.min(3, enemy.distance + 1);
        
        // Update global distance if this is active enemy
        if (enemy === this.getActiveEnemy()) {
          this.updateGlobalDistance();
        }
        
        this.addCombatMessage(`The ${enemy.name} successfully pushes you back!`);
        
        // Check for knockdown
        const knockdownChance = 40 + ((enemyPush - playerResist) * 3);
        const knockdownRoll = Math.random() * 100;
        const knockedDown = knockdownRoll <= knockdownChance;
        
        if (knockedDown) {
          this.addCombatMessage(`You lose your balance and fall to the ground!`);
          
          // Apply player knocked down status
          window.gameState.knockedDown = true;
        }
      } else {
        this.addCombatMessage(`You hold your ground against the shield shove.`);
      }
    } else if (target.type === "ally") {
      const ally = target.ally;
      this.addCombatMessage(`The ${enemy.name} lunges forward, trying to shove ${ally.name} back with their shield!`);
      
      // Calculate success chance based on enemy stats vs ally stats
      const enemyPush = (enemy.power || 5) + (enemy.counterSkill || 0);
      const allyResist = (ally.power || 5) + (ally.counterSkill || 0);
      const successChance = 50 + ((enemyPush - allyResist) * 5);
      
      // Roll for success
      const roll = Math.random() * 100;
      const success = roll <= successChance;
      
      if (success) {
        // Increase distance by 1 (ally moving away from enemy)
        const currentDistance = this.getAllyDistanceToEnemy(ally, enemy);
        this.setAllyDistanceToEnemy(ally, enemy, Math.min(3, currentDistance + 1));
        
        this.addCombatMessage(`The ${enemy.name} successfully pushes ${ally.name} back!`);
        
        // Check for knockdown
        const knockdownChance = 40 + ((enemyPush - allyResist) * 3);
        const knockdownRoll = Math.random() * 100;
        const knockedDown = knockdownRoll <= knockdownChance;
        
        if (knockedDown) {
          this.addCombatMessage(`${ally.name} loses balance and falls to the ground!`);
          
          // Apply ally knocked down status
          ally.knockedDown = true;
        }
      } else {
        this.addCombatMessage(`${ally.name} holds their ground against the shield shove.`);
      }
    }
    
    // Update UI and return
    if (window.combatUI) {
      window.combatUI.updateCombatInterface();
    }
    return;
  }
  
  // Shield Bash handling
  if (attackType === "ShieldBash") {
    if (target.type === "player") {
      this.addCombatMessage(`The ${enemy.name} swings their shield at you in a powerful bash!`);
      
      // Check for player shield block
      if (this.checkPlayerShieldBlock()) {
        this.addCombatMessage(`You raise your shield just in time, blocking the bash completely!`);
        return;
      }
      
      // Determine hit success
      const defenseBonus = this.state.playerStance === "defensive" ? 20 : 0;
      const hitChance = 45 + (enemy.accuracy || 0) - (window.player.skills?.melee * 5 || 0) - defenseBonus;
      const hitRoll = Math.random() * 100;
      
      if (hitRoll < hitChance) {
        // Attack hits - shield bashes do less damage but can stun
        const damage = Math.round(5 + Math.random() * 3);
        
        // Apply damage to player
        window.gameState.health = Math.max(0, window.gameState.health - damage);
        
        // Generate hit narrative
        this.addCombatMessage(`The shield bash connects, dealing ${damage} damage and staggering you!`);
        
        // Chance to stun player
        if (Math.random() < 0.4) {
          this.addCombatMessage(`You're momentarily stunned by the impact!`);
          window.gameState.playerStunned = true;
        }
        
        // Check if player is defeated
        if (window.gameState.health <= 0) {
          this.addCombatMessage(`You've been critically wounded and can no longer fight.`);
          setTimeout(() => this.endCombat(false), 1500);
          return;
        }
      } else {
        this.addCombatMessage(`You manage to dodge the shield bash!`);
      }
    } else if (target.type === "ally") {
      const ally = target.ally;
      this.addCombatMessage(`The ${enemy.name} swings their shield at ${ally.name} in a powerful bash!`);
      
      // Check for ally shield block if they have a shield
      if (ally.hasShield) {
        let blockChance = ally.blockChance || 15; // Default 15% if not specified
        
        // Add bonus for defensive stance
        if (ally.currentStance === "defensive") {
          blockChance += 15; // +15% block chance in defensive stance
        }
        
        // Roll for block
        if (Math.random() * 100 < blockChance) {
          this.addCombatMessage(`${ally.name} raises their shield just in time, blocking the bash completely!`);
          return;
        }
      }
      
      // Determine hit success
      const defenseBonus = ally.currentStance === "defensive" ? 20 : 0;
      const hitChance = 45 + (enemy.accuracy || 0) - ((ally.speed || 5) * 2) - defenseBonus;
      const hitRoll = Math.random() * 100;
      
      if (hitRoll < hitChance) {
        // Attack hits - shield bashes do less damage but can stun
        const damage = Math.round(5 + Math.random() * 3);
        
        // Apply damage to ally
        ally.health = Math.max(0, ally.health - damage);
        
        // Generate hit narrative
        this.addCombatMessage(`The shield bash connects, dealing ${damage} damage and staggering ${ally.name}!`);
        
        // Chance to stun ally
        if (Math.random() < 0.4) {
          this.addCombatMessage(`${ally.name} is momentarily stunned by the impact!`);
          ally.stunned = true;
        }
        
        // Check if ally is defeated
        if (ally.health <= 0) {
          this.addCombatMessage(`${ally.name} has been defeated and can no longer fight!`);
        }
      } else {
        this.addCombatMessage(`${ally.name} manages to dodge the shield bash!`);
      }
    }
    
    // Update UI and return
    if (window.combatUI) {
      window.combatUI.updateCombatInterface();
    }
    return;
  }

  // Javelin throw handling
  if (attackType === "ThrowJavelin") {
    // Check if enemy has javelins and is at a valid range
    if (!this.enemyHasAmmo(enemy, 'javelin') || enemy.distance !== 2) {
      // Fallback to standard attack if can't throw javelin
      this.addCombatMessage(`The ${enemy.name} reaches for a javelin but has none left.`);
      attackType = this.getRandomEnemyAttack(enemy);
    } else {
      // Use a javelin
      this.useEnemyAmmo(enemy, 'javelin');
      
      const javelinName = enemy.ammunition.javelin.name || "javelin";
      
      if (target.type === "player") {
        this.addCombatMessage(`The ${enemy.name} hurls a ${javelinName} at you!`);
        
        // Check for player shield block
        if (this.checkPlayerShieldBlock()) {
          // Attack was blocked by player's shield
          this.addCombatMessage(`You raise your shield just in time, deflecting the javelin completely!`);
          // No counter opportunity after successful block
          return;
        }
        
        // Calculate hit chance (javelins slightly less accurate than melee)
        const hitChance = 45 + (enemy.accuracy || 0) - (window.player.skills?.melee * 4 || 0);
        const hitRoll = Math.random() * 100;
        
        if (hitRoll < hitChance) {
          // Javelin hits - calculate damage
          const damageBonus = enemy.ammunition.javelin.damageBonus || 0;
          const baseDamage = (enemy.power || 5) + damageBonus;
          const damage = Math.round(baseDamage * (1 + Math.random() * 0.4 - 0.2));
          
          // Apply damage to player
          window.gameState.health = Math.max(0, window.gameState.health - damage);
          
          // Generate hit narrative
          this.addCombatMessage(`The javelin strikes you in the ${this.targetLabels[targetArea]}, dealing ${damage} damage!`);
          
          // Reduce armor durability if hit
          this.reducePlayerArmorDurability(targetArea, 2); // Javelins cause more armor damage
          
          // Check if player is defeated
          if (window.gameState.health <= 0) {
            this.addCombatMessage(`You've been critically wounded and can no longer fight.`);
            setTimeout(() => this.endCombat(false), 1500);
            return;
          }
        } else {
          // Javelin misses
          this.addCombatMessage(`You dodge to the side as the javelin flies past you!`);
          
          // No counter chance for ranged attacks
        }
      } else if (target.type === "ally") {
        const ally = target.ally;
        this.addCombatMessage(`The ${enemy.name} hurls a ${javelinName} at ${ally.name}!`);
        
        // Check for ally shield block if they have a shield
        if (ally.hasShield) {
          let blockChance = ally.blockChance || 15; // Default 15% if not specified
          
          // Add bonus for defensive stance
          if (ally.currentStance === "defensive") {
            blockChance += 15; // +15% block chance in defensive stance
          }
          
          // Roll for block
          if (Math.random() * 100 < blockChance) {
            this.addCombatMessage(`${ally.name} raises their shield just in time, deflecting the javelin completely!`);
            return;
          }
        }
        
        // Calculate hit chance (javelins slightly less accurate than melee)
        const hitChance = 45 + (enemy.accuracy || 0) - ((ally.speed || 5) * 2);
        const hitRoll = Math.random() * 100;
        
        if (hitRoll < hitChance) {
          // Javelin hits - calculate damage
          const damageBonus = enemy.ammunition.javelin.damageBonus || 0;
          const baseDamage = (enemy.power || 5) + damageBonus;
          const damage = Math.round(baseDamage * (1 + Math.random() * 0.4 - 0.2));
          
          // Apply damage to ally
          ally.health = Math.max(0, ally.health - damage);
          
          // Generate hit narrative
          this.addCombatMessage(`The javelin strikes ${ally.name} in the ${this.targetLabels[targetArea]}, dealing ${damage} damage!`);
          
          // Check if ally is defeated
          if (ally.health <= 0) {
            this.addCombatMessage(`${ally.name} has been defeated and can no longer fight!`);
          }
        } else {
          // Javelin misses
          this.addCombatMessage(`${ally.name} dodges to the side as the javelin flies past!`);
        }
      }
      
      // Update UI and return
      if (window.combatUI) {
        window.combatUI.updateCombatInterface();
      }
      return;
    }
  }
  
  // Standard attack handling
  if (target.type === "player") {
    this.addCombatMessage(`The ${enemy.name} attacks your ${this.targetLabels[targetArea]}!`);
    
    // Check for player shield block
    if (this.checkPlayerShieldBlock()) {
      // Attack was blocked by player's shield
      this.addCombatMessage(`You raise your shield just in time, deflecting the attack completely!`);
      
      // No counter opportunity after successful block
      return;
    }
    
    // Determine hit success
    const defenseBonus = this.state.playerStance === "defensive" ? 20 : 0;
    const hitChance = 50 + (enemy.accuracy || 0) - (window.player.skills?.melee * 5 || 0) - defenseBonus;
    const hitRoll = Math.random() * 100;
    
    if (hitRoll < hitChance) {
      // Attack hits
      // Calculate damage based on enemy power and player defense
      const damage = this.calculateEnemyDamage(targetArea);
      
      // Apply damage to player
      window.gameState.health = Math.max(0, window.gameState.health - damage);
      
      // Generate hit narrative
      this.addCombatMessage(`The attack lands, dealing ${damage} damage!`);
      
      // Reduce armor durability if hit
      this.reducePlayerArmorDurability(targetArea, 1);
      
      // Reset counter chain after successful hit
      this.state.counterChain = 0;
      this.state.counterWindowOpen = false;
      this.state.lastCounterActor = null;
      
      // Check if player is defeated
      if (window.gameState.health <= 0) {
        this.addCombatMessage(`You've been critically wounded and can no longer fight.`);
        
        // End combat
        setTimeout(() => this.endCombat(false), 1500);
        return;
      }
    } else {
      // Attack misses
      this.addCombatMessage(`You manage to avoid the attack!`);
      
      // Player gets counterattack chance if in aggressive stance
      if (this.state.playerStance === "aggressive" && Math.random() < 0.6) {
        this.addCombatMessage(`Your aggressive stance pays off, giving you a chance to counter!`);
        this.state.counterWindowOpen = true;
        this.state.counterChain = 0; // Reset counter chain at start of new exchange
        this.state.lastCounterActor = "enemy";
        
        // Update UI to show counter options
        if (window.combatUI) {
          window.combatUI.updateCounterOptions();
        }
        return;
      }
    }
  } else if (target.type === "ally") {
    const ally = target.ally;
    this.addCombatMessage(`The ${enemy.name} attacks ${ally.name}'s ${this.targetLabels[targetArea]}!`);
    
    // Check for ally shield block if they have a shield
    if (ally.hasShield) {
      let blockChance = ally.blockChance || 15; // Default 15% if not specified
      
      // Add bonus for defensive stance
      if (ally.currentStance === "defensive") {
        blockChance += 15; // +15% block chance in defensive stance
      }
      
      // Roll for block
      if (Math.random() * 100 < blockChance) {
        this.addCombatMessage(`${ally.name} raises their shield just in time, blocking the attack completely!`);
        return;
      }
    }
    
    // Determine hit success
    const defenseBonus = ally.currentStance === "defensive" ? 20 : 0;
    const hitChance = 50 + (enemy.accuracy || 0) - ((ally.speed || 5) * 2) - defenseBonus;
    const hitRoll = Math.random() * 100;
    
    if (hitRoll < hitChance) {
      // Attack hits
      // Calculate damage based on enemy power and ally defense
      const enemyPower = enemy.power || 5;
      const allyDefense = ally.defense || 0;
      const rawDamage = enemyPower - (allyDefense * 0.3);
      const damage = Math.max(1, Math.round(rawDamage * (1 + Math.random() * 0.4 - 0.2)));
      
      // Apply damage to ally
      ally.health = Math.max(0, ally.health - damage);
      
      // Generate hit narrative
      this.addCombatMessage(`The attack lands, dealing ${damage} damage to ${ally.name}!`);
      
      // Check if ally is defeated
      if (ally.health <= 0) {
        this.addCombatMessage(`${ally.name} has been defeated and can no longer fight!`);
      }
    } else {
      // Attack misses
      this.addCombatMessage(`${ally.name} manages to avoid the attack!`);
    }
  }
  
  // Update UI
  if (window.combatUI) {
    window.combatUI.updateCombatInterface();
  }
},
  
  // Handle enemy counterattack
  handleEnemyCounter: function() {
    // Get the active enemy
    const enemy = this.getActiveEnemy();
    
    // Safety check
    if (!enemy || enemy.health <= 0) {
      console.log("Enemy already defeated, cannot counter");
      this.state.counterWindowOpen = false;
      this.state.counterChain = 0;
      this.state.lastCounterActor = null;
      this.enterPhase("resolution");
      return;
    }

    this.state.counterChain++;
    this.state.lastCounterActor = "enemy";

    this.addCombatMessage(`The ${enemy.name} capitalizes on your misstep with a swift counterattack!`);
    
    // Check if we've reached maximum counter chain
    if (this.state.counterChain >= this.state.maxCounterChain) {
      this.addCombatMessage(`After a frenzied exchange of missed attacks and counters, both you and the ${enemy.name} back off to reassess.`);
      this.state.counterChain = 0;
      this.state.counterWindowOpen = false;
      this.state.lastCounterActor = null;
      
      // Continue to resolution phase
      this.scheduleEnemyAction(() => this.enterPhase("resolution"), 1000);
      return;
    }
    
    // Check for player shield block
    if (this.checkPlayerShieldBlock()) {
      // Attack was blocked by player's shield
      this.addCombatMessage(`You quickly raise your shield and block the counterattack completely!`);
      
      // End the counter exchange
      this.state.counterChain = 0;
      this.state.counterWindowOpen = false;
      this.state.lastCounterActor = null;
      
      // Continue to resolution phase
      setTimeout(() => this.enterPhase("resolution"), 1000);
      return;
    }
  
    // Counter attacks have higher chance to hit
    const hitChance = 70 + (enemy.accuracy || 0) - (window.player.skills?.melee * 3 || 0);
    const hitRoll = Math.random() * 100;
    
    if (hitRoll < hitChance) {
      // Counter hits
      const damage = this.calculateEnemyDamage('body') * 1.5; // Counters do more damage
      window.gameState.health = Math.max(0, window.gameState.health - damage);
      
      this.addCombatMessage(`The counterattack connects with devastating effect, dealing ${Math.round(damage)} damage!`);
      
      // Reduce armor durability if hit
      this.reducePlayerArmorDurability('body', 2); // Counter attacks cause more durability damage
      
      // Reset counter chain after successful hit
      this.state.counterChain = 0;
      this.state.counterWindowOpen = false;
      this.state.lastCounterActor = null;
      
      // Check if player is defeated
      if (window.gameState.health <= 0) {
        this.addCombatMessage(`You've been critically wounded and can no longer fight.`);
        
        // End combat
        setTimeout(() => this.endCombat(false), 1500);
        return;
      }
      
      // Continue to resolution phase
      setTimeout(() => this.enterPhase("resolution"), 1000);
    } else {
      this.addCombatMessage(`You narrowly avoid the counterattack, creating an opening for your own riposte!`);
      
      // Player gets counter opportunity - stay in player phase
      this.state.counterWindowOpen = true;
      
      // Update UI to show only counter attack options
      if (window.combatUI) {
        window.combatUI.updateCounterOptions();
      }
    }
  },
  
  // Reduce player armor durability when hit
  reducePlayerArmorDurability: function(targetArea, amount = 1) {
    let armorPiece = null;
    
    // Determine which armor piece is hit based on target area
    if (targetArea === 'head') {
      armorPiece = window.player.equipment?.head;
    } else if (targetArea === 'body' || targetArea === 'legs') {
      armorPiece = window.player.equipment?.body;
    }
    
    // If armor exists and has durability, reduce it
    if (armorPiece && armorPiece !== "occupied" && armorPiece.durability !== undefined) {
      const oldDurability = armorPiece.durability;
      armorPiece.durability = Math.max(0, armorPiece.durability - amount);
      
      // Log durability change for debugging
      console.log(`Armor durability reduced: ${oldDurability} -> ${armorPiece.durability}`);
      
      // Add message if armor is getting critically damaged
      const template = armorPiece.getTemplate();
      if (armorPiece.durability === 0) {
        this.addCombatMessage(`Your ${template.name} has been severely damaged and offers minimal protection!`);
      } else if (armorPiece.durability <= template.maxDurability * 0.25 && oldDurability > template.maxDurability * 0.25) {
        this.addCombatMessage(`Your ${template.name} is getting critically damaged!`);
      }
    }
  },
  
  // Check if player's shield blocks an attack
  checkPlayerShieldBlock: function() {
    // Get player's shield if equipped
    const shield = window.player.equipment?.offHand;
    if (!shield || shield === "occupied") return false;
    
    const shieldTemplate = shield.getTemplate();
    
    // Check if it's actually a shield
    if (shieldTemplate.weaponType?.name !== "Shield") return false;
    
    // Get block chance
    let blockChance = shieldTemplate.blockChance || 0;
    
    // Add bonus for defensive stance
    if (this.state.playerStance === "defensive") {
      blockChance += 15; // +15% block chance in defensive stance
    }
    
    // Roll for block
    return Math.random() * 100 < blockChance;
  },
  
  // Check if enemy's shield blocks an attack
  checkEnemyShieldBlock: function(enemy) {
    // Check if enemy has a shield
    if (!enemy.hasShield) return false;
    
    // Get base block chance
    let blockChance = enemy.blockChance || 15; // Default 15% if not specified
    
    // Add bonus for defensive stance
    if (enemy.currentStance === "defensive") {
      blockChance += 15; // +15% block chance in defensive stance
    }
    
    // Roll for block
    return Math.random() * 100 < blockChance;
  },
  
  // Calculate enemy damage
  calculateEnemyDamage: function(targetArea) {
    const enemy = this.getActiveEnemy();
    const baseDamage = enemy.power || 5;
    
    // Get player defense stats
    const bodyArmor = window.player.equipment?.body ? 
      window.player.equipment.body.getTemplate() : null;
    
    const helmet = window.player.equipment?.head ?
      window.player.equipment.head.getTemplate() : null;
    
    // Calculate defense reduction
    let defenseValue = 0;
    let armorDurabilityReduction = 0;
    
    // Body armor defense & durability reduction
    if (bodyArmor && targetArea !== 'head') {
      defenseValue += bodyArmor.stats.defense || 0;
      
      // Get current body armor piece
      const bodyArmorPiece = window.player.equipment.body;
      
      // Add durability-based damage reduction (max 50%)
      if (bodyArmorPiece && bodyArmorPiece.durability !== undefined) {
        const durabilityPercent = (bodyArmorPiece.durability / bodyArmor.maxDurability) * 100;
        armorDurabilityReduction += Math.min(50, durabilityPercent / 2); // Cap at 50%
      }
    }
    
    // Helmet defense & durability reduction (if hit area is head)
    if (helmet && targetArea === 'head') {
      defenseValue += helmet.stats.defense || 0;
      
      // Get current helmet piece
      const helmetPiece = window.player.equipment.head;
      
      // Add durability-based damage reduction (max 50%)
      if (helmetPiece && helmetPiece.durability !== undefined) {
        const durabilityPercent = (helmetPiece.durability / helmet.maxDurability) * 100;
        armorDurabilityReduction += Math.min(50, durabilityPercent / 2); // Cap at 50%
      }
    }
    
    // Calculate damage with randomness
    let damage = baseDamage * (1 + Math.random() * 0.4 - 0.2);
    
    // Apply armor penetration if enemy has it
    const enemyArmorPen = enemy.armorPenetration || 0;
    const effectiveDefense = Math.max(0, defenseValue - enemyArmorPen);
    
    // Reduce by defense, minimum 1 damage
    damage = Math.max(1, damage - effectiveDefense * 0.5);
    
    // Apply durability damage reduction (percentage-based)
    if (armorDurabilityReduction > 0) {
      damage = damage * (1 - (armorDurabilityReduction / 100));
    }
    
    // Adjust based on stance
    if (enemy.currentStance === "aggressive") {
      damage *= 1.3; // More damage in aggressive stance
    } else if (enemy.currentStance === "defensive") {
      damage *= 0.7; // Less damage in defensive stance
    }
    
    // Round to nearest integer
    return Math.round(damage);
  },
  
  // Calculate damage for ally attacks
  calculateAllyDamage: function(ally, enemy, targetArea) {
    const baseDamage = ally.power || 5;
    
    // Calculate damage with randomness
    let damage = baseDamage * (1 + Math.random() * 0.4 - 0.2);
    
    // Apply ally's armor penetration against enemy defense
    const armorPen = ally.armorPenetration || 0;
    const enemyDefense = enemy.defense || 0;
    const effectiveDefense = Math.max(0, enemyDefense - armorPen);
    
    // Reduce by defense, minimum 1 damage
    damage = Math.max(1, damage - effectiveDefense * 0.5);
    
    // Adjust based on stance
    if (ally.currentStance === "aggressive") {
      damage *= 1.3; // More damage in aggressive stance
    } else if (ally.currentStance === "defensive") {
      damage *= 0.7; // Less damage in defensive stance
    }
    
    // Apply target area modifier
    if (targetArea === "head") {
      damage *= 1.5; // Headshots do more damage
    } else if (targetArea === "legs") {
      damage *= 0.8; // Leg hits do less damage
    }
    
    // Round to nearest integer
    return Math.round(damage);
  },
  
  // Calculate player damage based on weapon and attack - now with enemy parameter
  calculateDamage: function(weaponTemplate, attackType, enemy) {
    const baseDamage = weaponTemplate ? (weaponTemplate.stats?.damage || 5) : 5;
    const damageMultiplier = this.getAttackDamageMultiplier(attackType);
    
    // Add skill bonuses
    const skillBonus = window.player.skills?.melee || 0;
    
    // Calculate damage with randomness
    let damage = baseDamage * (1 + Math.random() * 0.4 - 0.2);
    
    // Apply skill bonus
    damage += skillBonus;
    
    // Apply attack type multiplier
    damage *= damageMultiplier;
    
    // Adjust based on stance
    if (this.state.playerStance === "aggressive") {
      damage *= 1.3; // More damage in aggressive stance
    } else if (this.state.playerStance === "defensive") {
      damage *= 0.7; // Less damage in defensive stance
    }
    
    // Apply target area modifier
    if (this.state.targetArea === "head") {
      damage *= 1.5; // Headshots do more damage
    } else if (this.state.targetArea === "legs") {
      damage *= 0.8; // Leg hits do less damage
    }
    
    // Get current weapon durability and apply reduction if almost broken
    if (weaponTemplate && weaponTemplate.hasOwnProperty('durability') && weaponTemplate.durability !== undefined) {
      // Get current weapon instance
      const weapon = window.player.equipment?.mainHand;
      
      if (weapon && weapon.durability !== undefined) {
        // If weapon is below 25% durability, it's becoming dull/weak
        if (weapon.durability < weaponTemplate.maxDurability * 0.25) {
          // Reduce damage by up to 30% for nearly broken weapons
          const durabilityFactor = Math.max(0.7, weapon.durability / (weaponTemplate.maxDurability * 0.25));
          damage *= durabilityFactor;
        }
      }
    }
    
    // Apply armor penetration against enemy defense
    if (enemy) {
      const armorPenetration = weaponTemplate?.stats?.armorPenetration || 0;
      const enemyDefense = enemy.defense || 0;
      const effectiveDefense = Math.max(0, enemyDefense - armorPenetration);
      
      // Reduce damage based on enemy defense
      if (effectiveDefense > 0) {
        damage = Math.max(1, damage - (effectiveDefense * 0.3));
      }
      
      // Apply enemy stance defense
      if (enemy.currentStance === "defensive") {
        damage *= 0.7; // Enemy takes less damage in defensive stance
      }
    }
    
    // Round to nearest integer
    return Math.round(damage);
  },
  
  // Resolve if an attack hits with optional hit bonus
  resolveAttackSuccess: function(weaponTemplate, attackType, hitBonus = 0) {
    const enemy = this.getActiveEnemy();
    if (!enemy) return false;
    
    const accuracyMultiplier = this.getAttackAccuracyMultiplier(attackType);
    
    // Base chance from player skill
    let hitChance = 50 + (window.player.skills?.melee * 5 || 0);
    
    // Add any bonus hit chance (for counters)
    hitChance += hitBonus;
    
    // Apply accuracy multiplier from attack type
    hitChance *= accuracyMultiplier;
    
    // Adjust based on enemy's distance
    if (enemy.distance === 0) {
      hitChance += 20; // Easier to hit at grappling range
    } else if (enemy.distance === 3) {
      hitChance -= 20; // Harder to hit at far range
    }
    
    // Adjust based on stances
    if (this.state.playerStance === "aggressive") {
      hitChance += 10; // More accurate in aggressive stance
    } else if (this.state.playerStance === "defensive") {
      hitChance -= 10; // Less accurate in defensive stance
    }
    
    if (enemy.currentStance === "defensive") {
      hitChance -= 15; // Harder to hit defensive enemies
    }
    
    // Target area modifiers
    if (this.state.targetArea === "head") {
      hitChance -= 20; // Harder to hit head
    } else if (this.state.targetArea === "legs") {
      hitChance -= 10; // Harder to hit legs
    }
    
    // Roll to hit
    const roll = Math.random() * 100;
    console.log(`Attack roll: ${roll.toFixed(2)} vs hit chance: ${hitChance.toFixed(2)}`);
    
    return roll <= hitChance;
  },
  
  // Check if enemy should counterattack
  shouldEnemyCounter: function(enemy) {
    // Base counter chance
    let counterChance = 0.3;
    
    // Adjust based on enemy stats
    counterChance += (enemy.counterSkill || 0) * 0.05;
    
    // Adjust based on stances
    if (enemy.currentStance === "defensive") {
      counterChance += 0.2; // More likely to counter in defensive stance
    }
    
    // Roll for counter
    return Math.random() < counterChance;
  },
  
  // Attempt to flee from combat
  attemptFlee: function() {
    // Base chance to flee
    let fleeChance = 0.3;
    
    // Adjust based on distance
    const activeEnemy = this.getActiveEnemy();
    const enemyDistance = activeEnemy ? activeEnemy.distance : 2;
    
    if (enemyDistance >= 2) {
      fleeChance += 0.3; // Easier to flee from a distance
    } else if (enemyDistance === 0) {
      fleeChance -= 0.2; // Very hard to flee while grappling
    }
    
    // Adjust based on player stats
    fleeChance += (window.player.skills?.survival || 0) * 0.05;
    
    // Roll for flee
    if (Math.random() < fleeChance) {
      // Success
      this.addCombatMessage("You manage to break away from the fight!");
      
      // End combat with special retreat outcome
      setTimeout(() => this.endCombat("retreat"), 1500);
    } else {
      // Failure
      this.addCombatMessage("You try to escape but fail! The enemy gets an opening to attack!");
      
      // Enemy gets a free attack
      const activeEnemy = this.getActiveEnemy();
      if (activeEnemy) {
        setTimeout(() => this.handleEnemyAttack(activeEnemy, this.getRandomEnemyAttack(activeEnemy), this.getRandomTargetArea()), 1000);
      }
    }
  },

  // Check if there's another wave to spawn
checkNextWave: function() {
  if (!this.state.enemySequence) {
    return false;
  }
  
  // Check if there are waves remaining in the current wave type
  if (this.state.remainingWaves > 1) {
    return true;
  }
  
  // Check if there are more wave types in the sequence
  const nextWaveIndex = this.state.currentWaveIndex + 1;
  return nextWaveIndex < this.state.enemySequence.length;
},

// Spawn the next wave of enemies
spawnNextWave: function() {
  if (!this.state.enemySequence) {
    return;
  }
  
  let waveIndex = this.state.currentWaveIndex;
  let waveData = this.state.enemySequence[waveIndex];
  
  // If current wave type still has waves, decrement counter
  if (this.state.remainingWaves > 1) {
    this.state.remainingWaves--;
  } else {
    // Move to the next wave type
    waveIndex = ++this.state.currentWaveIndex;
    waveData = this.state.enemySequence[waveIndex];
    this.state.remainingWaves = waveData.waves;
  }
  
  // Add a message to the combat log
  this.addCombatMessage("New enemies approach!");
  

  // Create enemies for this wave
  for (const enemyType of waveData.type) {
    const enemy = this.createEnemy(enemyType);
    this.state.enemies.push(enemy);
  }
  
  // Update UI
  if (window.combatUI) {
    window.combatUI.updateCombatInterface();
  }
},


  
  // End combat and handle outcome
endCombat: function(outcome) {
  // Set combat as inactive
  this.state.active = false;
  
  // Prepare conclusion narrative
  let narrativeText = [];
  
  if (outcome === true) {
    // Victory
    narrativeText = [
      "The battlefield falls silent as your enemies have been defeated.",
      "You stand victorious, your weapons slick with the blood of your foes."
    ];
    
    // Calculate victory rewards and track combat feats
    let totalDeeds = 0;
    this.state.enemies.forEach(enemy => {
      if (enemy.health <= 0) {
        if (typeof window.recordCombatFeat === 'function') {
          window.recordCombatFeat(enemy.name);
        }
        totalDeeds += enemy.experienceValue || 10;
      } else {
        const damagePercent = (enemy.maxHealth - enemy.health) / enemy.maxHealth;
        totalDeeds += Math.floor((enemy.experienceValue || 10) * damagePercent * 0.5);
      }
    });
    
    if (typeof window.awardDeeds === 'function') {
      window.awardDeeds(totalDeeds, window.DEEDS_SOURCES.COMBAT, `Defeated ${this.state.enemies.length} enemies`);
    } else {
      window.gameState.deeds += totalDeeds;
    }
    
    narrativeText.push(`You've earned ${totalDeeds} deeds from this encounter.`);
    
    // Generate loot from all defeated enemies
    const lootMessage = this.generateLootFromAll();
    if (lootMessage) {
      narrativeText.push(lootMessage);
    }
    
    // Update achievement if first combat victory
    if (!window.gameState.combatVictoryAchieved) {
      window.gameState.combatVictoryAchieved = true;
      window.showAchievement('first_blood');
    }
    
    // Minor armor durability damage
    this.applyArmorDurabilityDamage(0.75);
  } else if (outcome === "retreat") {
    // Player retreated
    narrativeText = [
      "You find an opening and quickly disengage from combat.",
      "With swift footwork, you manage to escape the fight and slip away."
    ];
    
    // Minor armor durability damage on retreat
    this.applyArmorDurabilityDamage(0.5);
  } else {
    // DEATH - no survival possible
    window.gameState.playerDied = true;
    
    // Death narrative
    narrativeText = [
      "Your vision dims as the final blow strikes home.",
      "Blood seeping into the mud beneath you, your journey ends here on the battlefield.",
      "In the Paanic Empire, there is only victory or death. Today, death claimed you."
    ];
    
    // Calculate final stats for death screen
    const totalDeeds = window.gameState.deeds || 0;
    const enemiesDefeated = window.gameState.feats?.enemiesDefeated || 0;
    const questsCompleted = window.gameState.feats?.questsCompleted || 0;
    const finalScore = totalDeeds + (window.gameDay * 10) + (enemiesDefeated * 5);
    
    // Record death event if feat system is available
    if (typeof window.recordSpecialFeat === 'function') {
      window.recordSpecialFeat('death', `Died in battle on day ${window.gameDay}. Final score: ${finalScore}`);
    }
    
    // Get rank information
    const finalRank = window.getCurrentRank ? window.getCurrentRank() : { title: 'Unknown', description: 'Unknown' };
    
    // Add stats to death narrative
    narrativeText.push(`Final rank: ${finalRank.title} (${finalRank.description})`);
    narrativeText.push(`Days survived: ${window.gameDay}`);
    narrativeText.push(`Total deeds earned: ${totalDeeds}`);
    narrativeText.push(`Enemies defeated: ${enemiesDefeated}`);
    narrativeText.push(`Quests completed: ${questsCompleted}`);
    narrativeText.push(`FINAL SCORE: ${finalScore}`);
  }
  
  // Show battle conclusion through UI
  if (window.combatUI && typeof window.combatUI.showBattleConclusionModal === 'function') {
    window.combatUI.showBattleConclusionModal(outcome, narrativeText);
  } else {
    // Fallback method if UI not available
    document.getElementById('combatInterface').classList.add('hidden');
    
    // Hide modal container if it exists
    const modalContainer = document.querySelector('.combat-modal');
    if (modalContainer) {
      modalContainer.style.display = 'none';
    }
    
    // Show notification based on outcome
    if (window.gameState.playerDied) {
      window.showNotification(`You have died. Game over.`, 'error');
      window.returnToMainMenu();
    } else if (outcome === true) {
      window.showNotification(`Victory!`, 'success');
    } else if (outcome === "retreat") {
      window.showNotification("You managed to escape.", 'info');
    } else if (outcome === "draw") {
      window.showNotification(`Combat ended in a draw.`, 'info');
    }
  }
  
  // For death, don't update UI or check level
  if (window.gameState.playerDied) {
    return;
  }
  
  // Update game UI for non-death outcomes
  window.updateStatusBars();
  window.updateActionButtons();
  window.updateProfileIfVisible();
  
  // Check for level up
  window.checkLevelUp();
},
  
  // Generate loot from all defeated enemies
  generateLootFromAll: function() {
    let lootGenerated = false;
    let lootMessages = [];
    
    this.state.enemies.forEach(enemy => {
      // Only generate loot from defeated enemies
      if (enemy.health > 0) return;
      
      // Check if enemy has loot table
      if (!enemy.lootTable || enemy.lootTable.length === 0) {
        return;
      }
      
      // Determine if loot drops (once per enemy)
      const lootChance = enemy.lootChance || 0.5;
      if (Math.random() > lootChance) {
        return;
      }
      
      // Select a random item from loot table
      const lootIndex = Math.floor(Math.random() * enemy.lootTable.length);
      const lootId = enemy.lootTable[lootIndex];
      
      // Add item to inventory
      const itemTemplate = window.itemTemplates[lootId];
      if (itemTemplate) {
        window.addItemToInventory(itemTemplate);
        lootMessages.push(`You found ${itemTemplate.name}!`);
        this.addCombatMessage(`You found ${itemTemplate.name}!`);
        lootGenerated = true;
      }
    });
    
    // If no specific loot was generated, add some coins
    if (!lootGenerated) {
      // Add money
      const coins = Math.floor(Math.random() * 10 * this.state.enemies.length) + 5;
      window.player.taelors += coins;
      lootMessages.push(`You found ${coins} taelors!`);
      this.addCombatMessage(`You found ${coins} taelors!`);
      
      // Small chance to also find repair kit
      if (Math.random() < 0.15 && window.itemTemplates.repairKit) {
        window.addItemToInventory(window.itemTemplates.repairKit);
        lootMessages.push(`You also found an armor repair kit!`);
        this.addCombatMessage(`You also found an armor repair kit!`);
      }
    }
    
    // Return a combined message for the conclusion modal
    return lootMessages.join(" ");
  },
  
  // Apply durability damage to armor after combat
  applyArmorDurabilityDamage: function(modifier = 1) {
    // Get player's armor pieces
    const bodyArmor = window.player.equipment?.body;
    const helmet = window.player.equipment?.head;
    
    // Apply damage to body armor
    if (bodyArmor) {
      const template = bodyArmor.getTemplate();
      if (template.durability !== undefined) {
        // Reduce durability by 1-3 points (modified by combat outcome)
        const damage = Math.round((1 + Math.floor(Math.random() * 3)) * modifier);
        bodyArmor.durability = Math.max(0, bodyArmor.durability - damage);
        
        // Notify if armor is getting damaged
        if (bodyArmor.durability < template.maxDurability * 0.25) {
          window.showNotification("Your armor is severely damaged and needs repair!", 'warning');
        } else if (bodyArmor.durability === 0) {
          window.showNotification("Your armor is completely broken and provides minimal protection!", 'warning');
        }
      }
    }
    
    // Apply damage to helmet (less damage than body armor)
    if (helmet) {
      const template = helmet.getTemplate();
      if (template.durability !== undefined) {
        // Reduce durability by 0-2 points (modified by combat outcome)
        const damage = Math.round((Math.floor(Math.random() * 2)) * modifier);
        helmet.durability = Math.max(0, helmet.durability - damage);
      }
    }
  },
  
  // Add a message to the combat log (also notifies UI)
  addCombatMessage: function(message) {
    // Add to state log
    this.state.combatLog.push(message);
    
    // Notify UI to update
    if (window.combatUI && typeof window.combatUI.addCombatMessage === 'function') {
      window.combatUI.addCombatMessage(message);
    }
    
    console.log("Combat Log:", message);
  },
  
  // Get random enemy attack
  getRandomEnemyAttack: function(enemy) {
    // Special shield attacks if enemy has a shield and we're at appropriate distance
    if (enemy.hasShield) {
      if (enemy.distance === 0) {
        // At grappling range, chance to use shield shove
        if (Math.random() < 0.4) {
          return "ShieldShove";
        }
      }
      
      if (enemy.distance <= 1) {
        // At close range, chance to use shield bash
        if (Math.random() < 0.3) {
          return "ShieldBash";
        }
      }
    }
    
    // If no shield attack selected, use standard attacks
    // Different attack options based on distance
    if (enemy.distance <= 1) {
      // Melee range attacks
      const meleeAttacks = ["Strike", "Slash", "Stab"];
      return meleeAttacks[Math.floor(Math.random() * meleeAttacks.length)];
    } else if (enemy.distance === 2 && this.enemyHasAmmo(enemy, 'javelin')) {
      // Medium range with javelins available
      return "ThrowJavelin";
    } else {
      // Default attacks
      const basicAttacks = ["Strike", "Slash", "Stab"];
      return basicAttacks[Math.floor(Math.random() * basicAttacks.length)];
    }
  },
  
  // Get random ally attack
  getRandomAllyAttack: function(ally) {
    // Special shield attacks if ally has a shield and we're at appropriate distance
    if (ally.hasShield) {
      if (this.state.distance === 0) {
        // At grappling range, chance to use shield shove
        if (Math.random() < 0.3) {
          return "ShieldShove";
        }
      }
      
      if (this.state.distance <= 1) {
        // At close range, chance to use shield bash
        if (Math.random() < 0.3) {
          return "ShieldBash";
        }
      }
    }
    
    // If no shield attack selected, use standard attacks
    // Different attack options based on distance
    if (this.state.distance <= 1) {
      // Melee range attacks
      const meleeAttacks = ["Strike", "Slash", "Stab"];
      return meleeAttacks[Math.floor(Math.random() * meleeAttacks.length)];
    } else if (this.state.distance === 2 && this.allyHasAmmo(ally, 'javelin')) {
      // Medium range with javelins available
      return "ThrowJavelin";
    } else {
      // Default attacks
      const basicAttacks = ["Strike", "Slash", "Stab"];
      return basicAttacks[Math.floor(Math.random() * basicAttacks.length)];
    }
  },
  
  // Get random target area
  getRandomTargetArea: function() {
    const areas = ["head", "body", "legs"];
    return areas[Math.floor(Math.random() * areas.length)];
  },
  
  // Get weapon attacks based on weapon type
  getWeaponAttacks: function(weaponTemplate) {
    if (!weaponTemplate) return ["Punch"];
    
    // Get current combat state info
    const activeEnemy = this.getActiveEnemy();
    const distance = activeEnemy ? activeEnemy.distance : 2;
    
    // Initialize attacks array
    let availableAttacks = [];
    
    // Get attacks based on weapon type
    if (weaponTemplate.weaponType) {
      switch(weaponTemplate.weaponType.name) {
        case "Sword":
          availableAttacks = ["Slash", "Stab"];
          break;
        case "Greatsword":
          availableAttacks = ["Slash", "Cleave"];
          break;
        case "Spear":
          availableAttacks = ["Stab", "Sweep"];
          break;
        case "Axe":
        case "Battle Axe":
          availableAttacks = ["Cleave", "Hook"];
          break;
        case "Dagger":
          availableAttacks = ["Stab", "Slash"];
          break;
        case "Shield":
          availableAttacks = ["Bash"];
          break;
        case "Thrown":
          availableAttacks = ["Throw", "Jab"];
          break;
        default:
          // Fallback to custom attacks or basic strike
          availableAttacks = weaponTemplate.availableAttacks || ["Strike"];
      }
    } else {
      // Weapon with no type defaults to strike
      availableAttacks = ["Strike"];
    }
    
    return availableAttacks;
  },
  
  // Get weapon range
  getWeaponRange: function(weaponTemplate) {
    // Default to melee range if no weapon
    if (!weaponTemplate) return 1;
    
    // First check explicit range property on weapon template
    if (typeof weaponTemplate.range === 'number') {
      return weaponTemplate.range;
    }
    
    // Then check range from weapon type
    if (weaponTemplate.weaponType && typeof weaponTemplate.weaponType.range === 'number') {
      return weaponTemplate.weaponType.range;
    }
    
    // Default to melee range (1)
    return 1;
  },
  
  // Helper function to check ammunition compatibility
  hasCompatibleAmmo: function(weapon, ammoType) {
    const ammo = window.player.equipment?.ammunition;
    
    // No ammo equipped
    if (!ammo || ammo === "occupied" || !ammo.getTemplate) {
      return false;
    }
    
    // Ammo is empty
    if (ammo.currentAmount <= 0) {
      return false;
    }
    
    // If asking for specific ammo type
    if (ammoType) {
      return ammo.ammoType === ammoType || 
             ammo.getTemplate().ammoType === ammoType;
    }
    
    // If checking for compatibility with a weapon
    if (weapon) {
      return window.checkWeaponAmmoCompatibility();
    }
    
    // Default: ammo exists and isn't empty
    return true;
  },
  
  // Add a function to check enemy ammunition
  enemyHasAmmo: function(enemy, ammoType) {
    if (!enemy || !enemy.ammunition || !enemy.ammunition[ammoType]) {
      return false;
    }
    
    return enemy.ammunition[ammoType].current > 0;
  },
  
  // Add a function to use enemy ammunition
  useEnemyAmmo: function(enemy, ammoType) {
    if (!this.enemyHasAmmo(enemy, ammoType)) {
      return false;
    }
    
    // Reduce ammo count
    enemy.ammunition[ammoType].current--;
    
    // Log for debugging
    console.log(`Enemy used 1 ${ammoType}. Remaining: ${enemy.ammunition[ammoType].current}`);
    
    return true;
  },
  
  // Add a function to check ally ammunition
  allyHasAmmo: function(ally, ammoType) {
    if (!ally || !ally.ammunition || !ally.ammunition[ammoType]) {
      return false;
    }
    
    return ally.ammunition[ammoType].current > 0;
  },
  
  // Add a function to use ally ammunition
  useAllyAmmo: function(ally, ammoType) {
    if (!this.allyHasAmmo(ally, ammoType)) {
      return false;
    }
    
    // Reduce ammo count
    ally.ammunition[ammoType].current--;
    
    // Log for debugging
    console.log(`Ally used 1 ${ammoType}. Remaining: ${ally.ammunition[ammoType].current}`);
    
    return true;
  },
  
  // Get attack damage multiplier based on attack type
  getAttackDamageMultiplier: function(attackType) {
    switch(attackType) {
      case "Slash": return 1.0;
      case "Stab": return 1.2;
      case "Cleave": return 1.5;
      case "Sweep": return 0.8;
      case "Hook": return 1.1;
      case "Bash": return 0.7;
      case "Strike": return 1.0;
      case "Punch": return 0.5;
      default: return 1.0;
    }
  },
  
  // Get attack accuracy multiplier based on attack type
  getAttackAccuracyMultiplier: function(attackType) {
    switch(attackType) {
      case "Slash": return 1.0;
      case "Stab": return 0.9;
      case "Cleave": return 0.8;
      case "Sweep": return 1.1;
      case "Hook": return 0.85;
      case "Bash": return 0.9;
      case "Strike": return 1.0;
      case "Punch": return 1.2;
      default: return 1.0;
    }
  },
  
  // Narrative generation functions
  
  // Generate attack narrative
  generateAttackNarrative: function(weaponTemplate, attackType) {
    const enemy = this.getActiveEnemy();
    const enemyName = enemy ? enemy.name : "enemy";
    const weaponName = weaponTemplate ? weaponTemplate.name : "fist";
    const targetArea = this.targetLabels[this.state.targetArea];
    
    // Templates for different attacks
    const narratives = {
      "Slash": [
        `You swing your ${weaponName} in a wide arc, attempting to slash across the ${enemyName}'s ${targetArea}.`,
        `With a fluid motion, you slash your ${weaponName} toward the ${enemyName}'s ${targetArea}.`,
        `You execute a swift slash with your ${weaponName}, aiming for the ${enemyName}'s ${targetArea}.`
      ],
      "Stab": [
        `You thrust your ${weaponName} forward, aiming to pierce the ${enemyName}'s ${targetArea}.`,
        `With precise aim, you stab toward the ${enemyName}'s ${targetArea}.`,
        `You lunge forward, driving your ${weaponName} at the ${enemyName}'s ${targetArea}.`
      ],
      "Cleave": [
        `You raise your ${weaponName} high and bring it down in a powerful cleave toward the ${enemyName}'s ${targetArea}.`,
        `With a mighty effort, you cleave downward at the ${enemyName}'s ${targetArea}.`,
        `You execute a heavy cleaving strike, aiming to split the ${enemyName}'s ${targetArea}.`
      ],
      "Punch": [
        `You throw a quick punch at the ${enemyName}'s ${targetArea}.`,
        `With clenched fist, you aim a punch at the ${enemyName}'s ${targetArea}.`,
        `You swing your fist toward the ${enemyName}'s ${targetArea}.`
      ],
      "default": [
        `You attack the ${enemyName}'s ${targetArea} with your ${weaponName}.`,
        `You strike at the ${enemyName}'s ${targetArea}.`,
        `You target the ${enemyName}'s ${targetArea} with a swift attack.`
      ]
    };
    
    // Get appropriate templates
    const templates = narratives[attackType] || narratives.default;
    
    // Return random narrative
    return templates[Math.floor(Math.random() * templates.length)];
  },
  
  // Generate hit narrative
  generateHitNarrative: function(weaponTemplate, attackType, damage) {
    const enemy = this.getActiveEnemy();
    const enemyName = enemy ? enemy.name : "enemy";
    const weaponName = weaponTemplate ? weaponTemplate.name : "fist";
    const targetArea = this.targetLabels[this.state.targetArea];
    
    // Templates for different attacks
    const narratives = {
      "Slash": [
        `Your blade connects, cutting into the ${enemyName}'s ${targetArea} for ${damage} damage.`,
        `The edge of your ${weaponName} slices through, drawing blood and dealing ${damage} damage.`,
        `Your slash lands true, cutting a gash across the ${enemyName}'s ${targetArea} for ${damage} damage.`
      ],
      "Stab": [
        `Your point finds its mark, piercing into the ${enemyName}'s ${targetArea} for ${damage} damage.`,
        `Your thrust penetrates the ${enemyName}'s defenses, drawing blood and dealing ${damage} damage.`,
        `The tip of your ${weaponName} sinks into the ${enemyName}'s ${targetArea}, causing ${damage} damage.`
      ],
      "Cleave": [
        `Your cleave lands with devastating force, splitting the ${enemyName}'s defenses for ${damage} damage.`,
        `The weight of your blow crashes down, causing ${damage} damage.`,
        `Your cleaving strike connects, leaving a grievous wound for ${damage} damage.`
      ],
      "Punch": [
        `Your fist connects solidly with the ${enemyName}'s ${targetArea}, dealing ${damage} damage.`,
        `The impact of your punch staggers the ${enemyName}, causing ${damage} damage.`,
        `Your punch lands with a satisfying thud, dealing ${damage} damage.`
      ],
      "default": [
        `Your attack lands solidly, dealing ${damage} damage.`,
        `You strike true, hitting the ${enemyName} for ${damage} damage.`,
        `The ${enemyName} fails to dodge your attack, taking ${damage} damage.`
      ]
    };
    
    // Get appropriate templates
    const templates = narratives[attackType] || narratives.default;
    
    // Return random narrative
    return templates[Math.floor(Math.random() * templates.length)];
  },
  
  // Generate miss narrative
  generateMissNarrative: function(weaponTemplate, attackType) {
    const enemy = this.getActiveEnemy();
    const enemyName = enemy ? enemy.name : "enemy";
    
    // Templates for different attacks
    const narratives = {
      "Slash": [
        `The ${enemyName} steps back, avoiding your slash.`,
        `Your slash whistles through empty air as the ${enemyName} evades.`,
        `The ${enemyName} deflects your slash with their weapon.`
      ],
      "Stab": [
        `The ${enemyName} sidesteps your thrust.`,
        `Your stab misses as the ${enemyName} twists away.`,
        `The ${enemyName} parries your thrust with a swift move.`
      ],
      "Cleave": [
        `The ${enemyName} steps aside as your heavy cleave strikes the ground.`,
        `Your cleave is too slow, allowing the ${enemyName} to avoid it completely.`,
        `The ${enemyName} raises their weapon, catching your cleave before it lands.`
      ],
      "Punch": [
        `The ${enemyName} leans away from your punch.`,
        `Your fist swings through empty air as the ${enemyName} ducks.`,
        `The ${enemyName} blocks your punch with their arm.`
      ],
      "default": [
        `The ${enemyName} evades your attack.`,
        `Your attack fails to connect.`,
        `The ${enemyName} skillfully dodges your strike.`
      ]
    };
    
    // Get appropriate templates
    const templates = narratives[attackType] || narratives.default;
    
    // Return random narrative
    return templates[Math.floor(Math.random() * templates.length)];
  },
  
  // Generate distance change narrative
  generateDistanceNarrative: function(direction) {
    const enemy = this.getActiveEnemy();
    const enemyName = enemy ? enemy.name : "enemy";
    
    if (direction === "approach") {
      const templates = [
        `You close the distance, advancing toward the ${enemyName}.`,
        `With a swift move, you step closer to the ${enemyName}.`,
        `You press forward, reducing the gap between you and the ${enemyName}.`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    } else {
      const templates = [
        `You create more space, stepping away from the ${enemyName}.`,
        `You retreat to a safer distance from the ${enemyName}.`,
        `You increase the gap between yourself and the ${enemyName}.`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    }
  },
  
  // Generate stance change narrative
  generateStanceNarrative: function(stance) {
    if (stance === "aggressive") {
      const templates = [
        "You shift your weight forward, adopting an aggressive stance.",
        "Raising your weapon, you take a more offensive posture.",
        "You lean into an aggressive stance, ready to strike with increased power."
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    } else if (stance === "defensive") {
      const templates = [
        "You raise your guard, taking a more defensive posture.",
        "Shifting your weight back, you focus on defense and protection.",
        "You adopt a defensive stance, prioritizing safety over aggression."
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    } else {
      const templates = [
        "You reset to a balanced, neutral stance.",
        "Adjusting your position, you return to a neutral fighting stance.",
        "You adopt a balanced posture, ready to both attack and defend."
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    }
  },
  
  // Generate enemy reaction to distance change
  generateEnemyReactionToDistance: function() {
    const enemy = this.getActiveEnemy();
    const enemyName = enemy ? enemy.name : "enemy";
    const distanceIndex = enemy ? enemy.distance : 2;
    
    // Different reactions based on current distance
    if (distanceIndex === 0) {
      const templates = [
        `The ${enemyName} seems uncomfortable with your close proximity.`,
        `At this grappling range, the ${enemyName} struggles to bring their weapon to bear.`,
        `The ${enemyName} tries to create more space between you.`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    } else if (distanceIndex === 1) {
      const templates = [
        `The ${enemyName} shifts their stance, adapting to the close combat range.`,
        `Within striking distance, the ${enemyName} watches your movements carefully.`,
        `The ${enemyName} maintains their guard at this close range.`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    } else if (distanceIndex === 2) {
      const templates = [
        `At a moderate distance, the ${enemyName} seems to relax slightly.`,
        `The ${enemyName} uses the medium range to assess your movements.`,
        `The ${enemyName} shifts their weapon, comfortable at this distance.`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    } else {
      const templates = [
        `The ${enemyName} seems relieved at the increased distance between you.`,
        `From this range, the ${enemyName} watches you cautiously.`,
        `The ${enemyName} uses the distance to prepare their next move.`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    }
  },
  
  // Generate enemy reaction to stance change
  generateEnemyReactionToStance: function() {
    const enemy = this.getActiveEnemy();
    const enemyName = enemy ? enemy.name : "enemy";
    const playerStance = this.state.playerStance;
    
    if (playerStance === "aggressive") {
      const templates = [
        `The ${enemyName} tenses, noticing your more aggressive posture.`,
        `Seeing your offensive stance, the ${enemyName} appears more cautious.`,
        `The ${enemyName} readies their defenses against your aggressive stance.`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    } else if (playerStance === "defensive") {
      const templates = [
        `The ${enemyName} seems encouraged by your defensive posture.`,
        `Noticing your caution, the ${enemyName} looks for an opening.`,
        `The ${enemyName} shifts, preparing to test your defenses.`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    } else {
      const templates = [
        `The ${enemyName} resets their own stance in response to yours.`,
        `The ${enemyName} watches your balanced posture, revealing nothing.`,
        `The ${enemyName} circles cautiously, matching your neutral stance.`
      ];
      return templates[Math.floor(Math.random() * templates.length)];
    }
  },
  
  // Override setTimeout for enemy actions with a wrapper that tracks the timeout ID
  _enemyActionTimeout: null,
  
  // Schedule enemy action with timeout
  scheduleEnemyAction: function(callback, delay) {
    // Clear any existing timeout
    if (this._enemyActionTimeout) {
      clearTimeout(this._enemyActionTimeout);
    }
    
    // Create a new timeout and store its ID
    this._enemyActionTimeout = setTimeout(() => {
      // Check if enemy is defeated before executing the action
      if (this.state.enemies.every(e => e.health <= 0)) {
        console.log("All enemies already defeated, cancelling scheduled action");
        this.enterPhase("resolution");
      } else {
        callback();
      }
      this._enemyActionTimeout = null;
    }, delay);
    
    return this._enemyActionTimeout;
  },
  
  // Helper function to get the distance to an enemy for UI display
  getEnemyDistance: function(enemyIndex) {
    const enemy = this.state.enemies[enemyIndex];
    return enemy ? enemy.distance : 2; // Default to medium range if enemy not found
  },
  
  // Get a descriptive phrase for the enemy's distance
  getEnemyDistanceDescription: function(enemyIndex) {
    const enemy = this.state.enemies[enemyIndex];
    if (!enemy) return "at medium range";
    
    switch(enemy.distance) {
      case 0: return "at grappling distance";
      case 1: return "at close range";
      case 2: return "at medium range";
      case 3: return "at far range";
      default: return "at medium range";
    }
  },
  
  // Get all enemy distances for UI display
  getAllEnemyDistances: function() {
    return this.state.enemies.map((enemy, index) => ({
      index,
      name: enemy.name,
      distance: enemy.distance,
      distanceLabel: this.distanceLabels[enemy.distance],
      health: enemy.health,
      maxHealth: enemy.maxHealth,
      defeated: enemy.health <= 0,
      selected: index === this.state.activeEnemyIndex
    }));
  }
};

// Initialize the combat system
window.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, initializing combat system");
  window.combatSystem.initialize();
});