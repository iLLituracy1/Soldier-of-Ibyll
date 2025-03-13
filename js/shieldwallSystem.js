// shieldwallSystem.js - Formation-based combat system for large-scale battles
// Fixes critical bugs and improves functionality

// Main shieldwall system object - contains all state and methods
window.shieldwallSystem = {
  // System state
  initialized: false,
  state: {
    active: false,
    battlePhase: "preparation", // preparation, skirmish, engagement, main, breaking, pursuit
    timePassed: 0, // Time elapsed in battle (seconds)
    enemyName: "Arrasi Forces", // Name of enemy force
    
    // Formation state
    unitStrength: {
      current: 40,
      max: 40,
      casualties: 0
    },
    
    // Cohesion represents formation integrity (0-100)
    cohesion: {
      current: 85,
      status: "holding firm" // holding firm, wavering, breaking
    },
    
    // Momentum shows which side is winning (-100 to 100, positive = player advantage)
    momentum: {
      value: 0,
      advantage: "none" // enemy, none, player
    },
    
    // Current orders from commander
    currentOrder: "hold the line", // hold the line, advance, shift, reform, rotate
    
    // Player positioning
    position: {
      rank: "front", // front, middle, rear
      file: "center" // left, center, right
    },
    
    // Player stance and shield
    playerStance: "balanced", // balanced, aggressive, defensive
    shieldPosition: "center", // high, center, low
    
    // Track events and threats
    currentThreat: null,
    reactionTimeRemaining: 0, // Time to react to current threat
    reactionNeeded: false,
    reactionSuccess: false,
    
    // Battle log for narrative
    battleLog: [],
    
    // Callback for when battle ends
    onBattleEnd: null
  },
  
  // Initialize the system
  initialize: function() {
    console.log("Shieldwall system initializing...");
    
    // Flag to prevent multiple initialization
    this.initialized = true;
    
    // Add styles if they don't exist
    if (!document.getElementById('shieldwall-styles')) {
      this.addShieldwallStyles();
    }
    
    console.log("Shieldwall system initialized");
  },
  
  // Start a shieldwall battle
  initiateBattle: function(config = {}) {
    console.log("Initiating shieldwall battle with config:", config);
    
    // Reset state for new battle
    this.resetState();
    
    // Apply configuration
    if (config) {
      // Apply top-level properties
      for (const key in config) {
        if (typeof config[key] !== 'object' || config[key] === null) {
          this.state[key] = config[key];
        }
      }
      
      // Apply nested objects carefully to avoid undefined properties
      if (config.unitStrength) {
        this.state.unitStrength = {
          ...this.state.unitStrength,
          ...config.unitStrength
        };
      }
      
      if (config.cohesion) {
        this.state.cohesion = {
          ...this.state.cohesion,
          ...config.cohesion
        };
      }
      
      if (config.momentum) {
        this.state.momentum = {
          ...this.state.momentum,
          ...config.momentum
        };
      }
      
      if (config.position) {
        this.state.position = {
          ...this.state.position,
          ...config.position
        };
      }
    }
    
    this.state.active = true;
    
    // Set default values if not provided
    if (!this.state.unitStrength.current) this.state.unitStrength.current = 40;
    if (!this.state.unitStrength.max) this.state.unitStrength.max = 40;
    if (!this.state.cohesion.current) this.state.cohesion.current = 85;
    
    // Calculate advantage based on momentum
    this.updateMomentumAdvantage();
    
    // Render the interface
    this.renderBattleInterface();
    
    // Start with an introduction message
    const enemyName = this.state.enemyName || "Enemy forces";
    this.addBattleMessage(`The ${enemyName} advance in formation across the field. Your unit forms a shieldwall in response, weapons at the ready.`);
    
    const order = this.state.currentOrder || "hold the line";
    this.addBattleMessage(`Your commander calls out: "${order.toUpperCase()}!" The soldiers around you brace themselves, shields locked.`);
    
    // Sync player stats with main game
    this.syncPlayerStats();
    
    // Start the battle loop
    this.battleLoop();
    
    console.log("Shieldwall battle initiated");
  },
  
  // Reset state for a new battle
  resetState: function() {
    this.state = {
      active: false,
      battlePhase: "preparation",
      timePassed: 0,
      enemyName: "Arrasi Forces",
      
      unitStrength: {
        current: 40,
        max: 40,
        casualties: 0
      },
      
      cohesion: {
        current: 85,
        status: "holding firm"
      },
      
      momentum: {
        value: 0,
        advantage: "none"
      },
      
      currentOrder: "hold the line",
      
      position: {
        rank: "front",
        file: "center"
      },
      
      playerStance: "balanced",
      shieldPosition: "center",
      
      currentThreat: null,
      reactionTimeRemaining: 0,
      reactionNeeded: false,
      reactionSuccess: false,
      
      battleLog: [],
      
      onBattleEnd: null
    };
  },
  
  // Sync player stats with the main game state
  syncPlayerStats: function() {
    if (window.gameState) {
      // Create a reference to player stats for easier updates
      this.playerStats = {
        health: window.gameState.health || 100,
        maxHealth: window.gameState.maxHealth || 100,
        stamina: window.gameState.stamina || 100,
        maxStamina: window.gameState.maxStamina || 100,
        morale: window.gameState.morale || 75
      };
      
      console.log("Synced player stats:", this.playerStats);
    } else {
      // Fallback values if gameState isn't available
      this.playerStats = {
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        morale: 75
      };
      
      console.warn("gameState not found, using default stats");
    }
  },
  
  // Update player stats from main game state (called periodically)
  updatePlayerStats: function() {
    if (window.gameState) {
      this.playerStats.health = window.gameState.health || this.playerStats.health;
      this.playerStats.maxHealth = window.gameState.maxHealth || this.playerStats.maxHealth;
      this.playerStats.stamina = window.gameState.stamina || this.playerStats.stamina;
      this.playerStats.maxStamina = window.gameState.maxStamina || this.playerStats.maxStamina;
      this.playerStats.morale = window.gameState.morale || this.playerStats.morale;
    }
  },
  
  // Main battle loop
  battleLoop: function() {
    if (!this.state.active) return;
    
    // Update battle time
    this.state.timePassed += 1;
    
    // Update player stats periodically
    if (this.state.timePassed % 5 === 0) {
      this.updatePlayerStats();
    }
    
    // Update UI
    this.updateBattleInterface();
    
    // Generate threat if no current threat and no reaction needed
    if (!this.state.currentThreat && !this.state.reactionNeeded) {
      if (Math.random() < 0.2) { // 20% chance of new threat each second
        this.generateThreat();
      }
    }
    
    // Handle reaction timing
    if (this.state.reactionNeeded) {
      this.state.reactionTimeRemaining -= 0.1; // Decrease time (if called every 100ms)
      
      // Out of time to react
      if (this.state.reactionTimeRemaining <= 0) {
        this.handleReactionTimeout();
      }
    }
    
    // Check for battle phase transitions
    this.checkPhaseTransition();
    
    // Check for battle end conditions
    if (this.checkBattleEndConditions()) {
      return; // Battle has ended
    }
    
    // Continue battle loop
    setTimeout(() => this.battleLoop(), 100); // 10 updates per second
  },
  
  // Generate a new threat that requires player reaction
  generateThreat: function() {
    const threats = [
      {
        type: "projectiles",
        description: "A volley of arrows darkens the sky, arcing toward your position!",
        target: "formation",
        bestReaction: "brace",
        bestShieldPosition: "high",
        timeToReact: 5
      },
      {
        type: "charge",
        description: "Enemy warriors charge toward your section of the line!",
        target: "player",
        bestReaction: "brace",
        bestShieldPosition: "center",
        timeToReact: 4
      },
      {
        type: "gap",
        description: "A gap is forming in the line as soldiers to your left fall!",
        target: "formation",
        bestReaction: "step to gap",
        bestShieldPosition: "center",
        timeToReact: 3
      },
      {
        type: "flanking",
        description: "Enemy soldiers are attempting to flank your unit!",
        target: "formation",
        bestReaction: "adjust position",
        bestShieldPosition: "center",
        timeToReact: 4
      }
    ];
    
    // Select a random threat based on battle phase
    const availableThreats = threats.filter(threat => {
      if (this.state.battlePhase === "skirmish" && threat.type === "projectiles") return true;
      if (this.state.battlePhase === "engagement" && (threat.type === "charge" || threat.type === "gap")) return true;
      if (this.state.battlePhase === "main" || this.state.battlePhase === "breaking") return true;
      return false;
    });
    
    // If no applicable threats, don't generate one
    if (availableThreats.length === 0) return;
    
    // Select a random threat from the filtered list
    const threat = availableThreats[Math.floor(Math.random() * availableThreats.length)];
    this.state.currentThreat = threat;
    this.state.reactionNeeded = true;
    this.state.reactionTimeRemaining = threat.timeToReact;
    
    // Show the threat in the battle log
    this.addBattleMessage(threat.description);
    
    // Show reaction options
    this.updateReactionOptions();
    
    console.log("Generated threat:", threat);
  },
  
  // Handle player reaction to threat
  handleReaction: function(reactionType) {
    if (!this.state.reactionNeeded || !this.state.currentThreat) {
      console.error("No reaction needed or no current threat");
      return;
    }
    
    const threat = this.state.currentThreat;
    console.log(`Player reacted with ${reactionType} to ${threat.type}`);
    
    // Check if player reaction was correct
    const correctReaction = threat.bestReaction === reactionType;
    const correctShieldPosition = threat.bestShieldPosition === this.state.shieldPosition;
    
    // Calculate success based on reaction and shield position
    let successChance = 0.5; // Base 50% chance
    
    if (correctReaction) successChance += 0.3; // +30% for correct reaction
    if (correctShieldPosition) successChance += 0.2; // +20% for correct shield position
    
    // Modify based on player skills (if available in game state)
    if (window.player && window.player.skills) {
      successChance += (window.player.skills.discipline || 0) * 0.02; // +2% per discipline point
    }
    
    // Cap success chance
    successChance = Math.min(0.95, Math.max(0.05, successChance));
    
    // Roll for success
    const success = Math.random() < successChance;
    this.state.reactionSuccess = success;
    
    // Generate response narrative based on success or failure
    let responseMessage = "";
    
    if (success) {
      switch (reactionType) {
        case "brace":
          responseMessage = `You brace firmly, your shield positioned perfectly against the ${threat.type === "projectiles" ? "incoming volley" : "enemy charge"}. Your section of the line holds strong!`;
          break;
        case "step to gap":
          responseMessage = "You quickly step to fill the gap in the formation. Your swift action prevents the enemy from exploiting the weakness!";
          break;
        case "adjust position":
          responseMessage = "You adjust your position, helping your unit maintain formation against the flanking maneuver!";
          break;
        case "attack":
          responseMessage = "You strike at the perfect moment, catching an enemy soldier off-guard! Your counterattack drives them back.";
          break;
        default:
          responseMessage = "Your quick reaction succeeds!";
      }
      
      // Update cohesion and momentum
      this.adjustCohesion(+5);
      this.adjustMomentum(+10);
    } else {
      switch (reactionType) {
        case "brace":
          responseMessage = `Your bracing is too late or poorly positioned. The ${threat.type === "projectiles" ? "volley strikes hard" : "enemy charge impacts"}, causing your section to falter!`;
          break;
        case "step to gap":
          responseMessage = "You move to fill the gap, but stumble against a fellow soldier. The gap widens as enemy soldiers press the advantage!";
          break;
        case "adjust position":
          responseMessage = "Your adjustment is too slow, leaving a vulnerable point that the enemy quickly exploits!";
          break;
        case "attack":
          responseMessage = "Your attack is poorly timed, leaving you exposed. An enemy soldier counters, forcing you back into the line!";
          break;
        default:
          responseMessage = "Your reaction fails!";
      }
      
      // Update cohesion and momentum negatively
      this.adjustCohesion(-10);
      this.adjustMomentum(-15);
      
      // If it's a personal attack, reduce health
      if (threat.target === "player" && this.playerStats) {
        const damageTaken = Math.floor(Math.random() * 8) + 5; // 5-12 damage
        this.playerStats.health = Math.max(1, this.playerStats.health - damageTaken);
        
        // Sync with main game state
        if (window.gameState) {
          window.gameState.health = this.playerStats.health;
        }
        
        responseMessage += ` You take ${damageTaken} damage in the process!`;
        
        // Update main game UI health if possible
        if (typeof window.updateStatusBars === 'function') {
          window.updateStatusBars();
        }
      }
      
      // Unit may take casualties on failed reactions
      if (Math.random() < 0.3) {
        const casualtiesLost = Math.floor(Math.random() * 3) + 1;
        this.state.unitStrength.current = Math.max(1, this.state.unitStrength.current - casualtiesLost);
        this.state.unitStrength.casualties += casualtiesLost;
        responseMessage += ` Your unit loses ${casualtiesLost} ${casualtiesLost === 1 ? 'soldier' : 'soldiers'} in the chaos!`;
      }
    }
    
    // Add response to battle log
    this.addBattleMessage(responseMessage);
    
    // Clear current threat and reaction needed
    this.state.currentThreat = null;
    this.state.reactionNeeded = false;
    this.state.reactionTimeRemaining = 0;
    
    // Update UI
    this.updateBattleInterface();
    this.clearReactionOptions();
  },
  
  // Handle reaction timeout (player didn't react in time)
  handleReactionTimeout: function() {
    // Safety check to ensure we have a threat
    if (!this.state.currentThreat) return;
    
    const threat = this.state.currentThreat;
    
    // Generate timeout message
    let timeoutMessage = `You hesitate, failing to react in time to the ${threat.type || "threat"}!`;
    
    // Harsh consequences for inaction
    this.adjustCohesion(-15);
    this.adjustMomentum(-20);
    
    // Unit takes automatic casualties
    const casualtiesLost = Math.floor(Math.random() * 4) + 2;
    this.state.unitStrength.current = Math.max(1, this.state.unitStrength.current - casualtiesLost);
    this.state.unitStrength.casualties += casualtiesLost;
    timeoutMessage += ` Your unit loses ${casualtiesLost} soldiers as the formation buckles!`;
    
    // Damage to player
    if ((threat.target === "player" || Math.random() < 0.5) && this.playerStats) {
      const damageTaken = Math.floor(Math.random() * 15) + 10;
      this.playerStats.health = Math.max(1, this.playerStats.health - damageTaken);
      
      // Sync with main game state
      if (window.gameState) {
        window.gameState.health = this.playerStats.health;
      }
      
      timeoutMessage += ` You take ${damageTaken} damage from the enemy!`;
      
      // Update main game UI health if possible
      if (typeof window.updateStatusBars === 'function') {
        window.updateStatusBars();
      }
    }
    
    // Add response to battle log
    this.addBattleMessage(timeoutMessage);
    
    // Clear current threat and reaction needed
    this.state.currentThreat = null;
    this.state.reactionNeeded = false;
    this.state.reactionTimeRemaining = 0;
    
    // Update UI
    this.updateBattleInterface();
    this.clearReactionOptions();
  },
  
  // Change shield position
  changeShieldPosition: function(position) {
    if (!position || typeof position !== 'string') {
      console.error("Invalid shield position:", position);
      return;
    }
    
    // Validate position
    if (!['high', 'center', 'low'].includes(position.toLowerCase())) {
      console.error("Invalid shield position:", position);
      return;
    }
    
    this.state.shieldPosition = position.toLowerCase();
    
    // Add narrative
    let message = "";
    switch (position.toLowerCase()) {
      case "high":
        message = "You raise your shield high, providing better protection against airborne threats.";
        break;
      case "center":
        message = "You adjust your shield to center position, providing balanced protection.";
        break;
      case "low":
        message = "You lower your shield, better protecting against low attacks and charges.";
        break;
      default:
        message = "You adjust your shield position.";
    }
    
    this.addBattleMessage(message);
    
    // Update UI
    this.updateBattleInterface();
  },
  
  // Change stance
  changeStance: function(stance) {
    if (!stance || typeof stance !== 'string') {
      console.error("Invalid stance:", stance);
      return;
    }
    
    // Validate stance
    if (!['aggressive', 'balanced', 'defensive'].includes(stance.toLowerCase())) {
      console.error("Invalid stance:", stance);
      return;
    }
    
    this.state.playerStance = stance.toLowerCase();
    
    // Add narrative
    let message = "";
    switch (stance.toLowerCase()) {
      case "aggressive":
        message = "You adopt an aggressive stance, ready to strike at opportunities.";
        break;
      case "balanced":
        message = "You maintain a balanced stance, ready to adapt to changing situations.";
        break;
      case "defensive":
        message = "You take a defensive stance, focusing on survival and protection.";
        break;
      default:
        message = "You adjust your combat stance.";
    }
    
    this.addBattleMessage(message);
    
    // Update UI
    this.updateBattleInterface();
  },
  
  // Adjust formation cohesion
  adjustCohesion: function(amount) {
    this.state.cohesion.current = Math.max(0, Math.min(100, this.state.cohesion.current + amount));
    
    // Update cohesion status
    if (this.state.cohesion.current >= 60) {
      this.state.cohesion.status = "holding firm";
    } else if (this.state.cohesion.current >= 30) {
      this.state.cohesion.status = "wavering";
    } else {
      this.state.cohesion.status = "breaking";
    }
    
    // Cohesion affects momentum
    if (amount < 0) {
      this.adjustMomentum(amount / 2); // Losing cohesion affects momentum
    }
    
    console.log(`Cohesion adjusted by ${amount} to ${this.state.cohesion.current} (${this.state.cohesion.status})`);
  },
  
  // Adjust battle momentum
  adjustMomentum: function(amount) {
    this.state.momentum.value = Math.max(-100, Math.min(100, this.state.momentum.value + amount));
    this.updateMomentumAdvantage();
    
    console.log(`Momentum adjusted by ${amount} to ${this.state.momentum.value} (${this.state.momentum.advantage})`);
  },
  
  // Update momentum advantage based on value
  updateMomentumAdvantage: function() {
    if (this.state.momentum.value > 20) {
      this.state.momentum.advantage = "Paanic Forces";
    } else if (this.state.momentum.value < -20) {
      this.state.momentum.advantage = "Enemy Forces";
    } else {
      this.state.momentum.advantage = "Even";
    }
  },
  
  // Check for phase transitions
  checkPhaseTransition: function() {
    // Phase transitions based on time, cohesion and momentum
    switch (this.state.battlePhase) {
      case "preparation":
        if (this.state.timePassed > 30) {
          this.changeBattlePhase("skirmish");
        }
        break;
        
      case "skirmish":
        if (this.state.timePassed > 90) {
          this.changeBattlePhase("engagement");
        }
        break;
        
      case "engagement":
        if (this.state.timePassed > 180 || Math.abs(this.state.momentum.value) > 70) {
          this.changeBattlePhase("main");
        }
        break;
        
      case "main":
        if (this.state.cohesion.current < 30 || this.state.momentum.value < -60 || this.state.momentum.value > 60) {
          this.changeBattlePhase("breaking");
        }
        break;
        
      case "breaking":
        if (this.state.cohesion.current < 10 || this.state.momentum.value < -75 || this.state.momentum.value > 75) {
          this.changeBattlePhase("resolution");
        }
        break;
    }
  },
  
  // Change battle phase
  changeBattlePhase: function(newPhase) {
    if (!newPhase || typeof newPhase !== 'string') {
      console.error("Invalid battle phase:", newPhase);
      return;
    }
    
    const oldPhase = this.state.battlePhase;
    this.state.battlePhase = newPhase.toLowerCase();
    
    // Add phase transition narrative
    let transitionMessage = "";
    
    switch (newPhase.toLowerCase()) {
      case "skirmish":
        transitionMessage = "The battle begins with skirmishers exchanging missiles. Arrows and javelins fill the air!";
        break;
      case "engagement":
        transitionMessage = "The skirmishers fall back as the main lines advance toward each other. Prepare for contact!";
        break;
      case "main":
        transitionMessage = "The battle lines clash with the crash of shields and weapons! The main battle phase begins!";
        break;
      case "breaking":
        if (this.state.momentum.value > 40) {
          transitionMessage = "The enemy line begins to waver and break under your unit's pressure!";
        } else {
          transitionMessage = "Your line is struggling to maintain formation as the enemy presses hard!";
        }
        break;
      case "resolution":
        if (this.state.momentum.value > 40) {
          transitionMessage = "The enemy breaks and runs! Your forces pursue the routing enemies!";
        } else {
          transitionMessage = "Your commander orders a retreat! Fall back in formation to avoid being cut down!";
        }
        break;
      default:
        transitionMessage = `Battle phase changes to ${newPhase}.`;
    }
    
    this.addBattleMessage(transitionMessage);
    console.log(`Battle phase changed: ${oldPhase} -> ${newPhase}`);
    
    // Update UI
    this.updateBattleInterface();
  },
  
  // Check if battle has reached an end condition
  checkBattleEndConditions: function() {
    // Battle ends with victory when in resolution phase with positive momentum
    if (this.state.battlePhase === "resolution" && this.state.momentum.value > 0) {
      this.endBattle("victory");
      return true;
    }
    
    // Battle ends with defeat when in resolution phase with negative momentum
    if (this.state.battlePhase === "resolution" && this.state.momentum.value <= 0) {
      this.endBattle("defeat");
      return true;
    }
    
    // Battle ends with defeat if unit strength is critically low
    if (this.state.unitStrength.current <= this.state.unitStrength.max * 0.2) {
      this.endBattle("defeat");
      return true;
    }
    
    // Battle also ends if player's health reaches critical levels
    if (this.playerStats && this.playerStats.health <= 20) {
      this.endBattle("withdrawal");
      return true;
    }
    
    return false;
  },
  
  // End the battle and handle outcome
  endBattle: function(outcome) {
    this.state.active = false;
    
    // Generate end of battle narrative
    let endMessage = "";
    
    switch (outcome) {
      case "victory":
        endMessage = `Victory! The ${this.state.enemyName} break and flee the field. Your unit has held the line and emerged victorious!`;
        break;
      case "defeat":
        endMessage = `Defeat! Your unit breaks under the pressure from the ${this.state.enemyName}. The shieldwall has collapsed and the battle is lost.`;
        break;
      case "withdrawal":
        endMessage = "You're wounded and pulled back from the front line by your comrades. The battle continues without you.";
        break;
      default:
        endMessage = "The battle ends.";
    }
    
    this.addBattleMessage(endMessage);
    this.updateBattleInterface();
    
    // Add complete button at battle end
    this.showBattleEndButton(outcome);
    
    console.log(`Battle ended with ${outcome}`);
    
    // Call the battle end callback if provided
    if (typeof this.state.onBattleEnd === 'function') {
      setTimeout(() => {
        this.state.onBattleEnd(outcome);
      }, 2000);
    }
  },
  
  // Show a button to complete the battle
  showBattleEndButton: function(outcome) {
    const actionsContainer = document.getElementById('shieldwallActions');
    if (!actionsContainer) return;
    
    actionsContainer.innerHTML = '';
    
    const completeButton = document.createElement('button');
    completeButton.className = 'shieldwall-btn large-btn';
    completeButton.textContent = 'Complete Battle';
    completeButton.onclick = () => {
      this.hideBattleInterface();
      
      // Return to quest if we're in quest mode
      if (window.gameState && window.gameState.inQuestSequence && window.quests) {
        // Find the active quest
        const activeQuest = window.quests.find(q => q.status === window.QUEST_STATUS.ACTIVE);
        if (activeQuest && window.resumeQuestAfterShieldwall) {
          window.resumeQuestAfterShieldwall(activeQuest, outcome);
        } else {
          // Fallback: return to main game
          window.updateActionButtons();
        }
      } else {
        // Otherwise return to main game
        if (typeof window.updateActionButtons === 'function') {
          window.updateActionButtons();
        }
      }
    };
    
    actionsContainer.appendChild(completeButton);
  },
  
  // Add message to battle log
  addBattleMessage: function(message) {
    if (!message) return;
    
    // Add to battle log array
    this.state.battleLog.push(message);
    
    // Update UI if log element exists
    const battleLog = document.getElementById('shieldwallLog');
    if (battleLog) {
      const messageElement = document.createElement('p');
      messageElement.innerHTML = message;
      battleLog.appendChild(messageElement);
      battleLog.scrollTop = battleLog.scrollHeight;
    }
  },
  
  // Render the battle interface
  renderBattleInterface: function() {
    // Create modal container if needed
    let modalContainer = document.querySelector('.shieldwall-modal');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.className = 'shieldwall-modal';
      document.body.appendChild(modalContainer);
      
      // Create the interface HTML structure
      modalContainer.innerHTML = `
        <div id="shieldwallInterface" class="shieldwall-interface">
          <h2 class="battle-title">BATTLE OF NESIAN FRONTIER</h2>
          
          <div class="formation-overview">
            <div class="formation-label">FORMATION OVERVIEW:</div>
            <div class="enemy-line">
              Enemy Line
              <div class="formation-units enemy-units">
                ${this.renderFormationUnits('r', 16)}
              </div>
              <div class="spacing-line"></div>
            </div>
            
            <div class="player-line">
              <div class="formation-units player-units">
                ${this.renderFormationUnits('b', 15)}
              </div>
              
              <div id="gapIndicator" class="gap-indicator">
                <span class="gap-label">Gap forming in line</span>
                <div class="arrow-down"></div>
              </div>
              
              <div id="playerPosition" class="player-position-marker">X</div>
            </div>
          </div>
          
          <div class="battle-status-panel">
            <div class="battle-phase">
              <div class="status-label">BATTLE PHASE:</div>
              <div id="battlePhaseDisplay" class="status-value">MAIN BATTLE</div>
              <div id="battleTimeDisplay" class="time-display">Time Elapsed: 00:14:32</div>
            </div>
            
            <div class="unit-status">
              <div class="status-label">Unit Strength:</div>
              <div id="unitStrengthDisplay" class="status-value">34/40</div>
              <div class="strength-bar-container">
                <div id="unitStrengthBar" class="strength-bar"></div>
              </div>
            </div>
            
            <div class="momentum-indicator">
              <div class="status-label">MOMENTUM:</div>
              <div class="momentum-bar-container">
                <div id="momentumBarNegative" class="momentum-bar negative"></div>
                <div id="momentumBarPositive" class="momentum-bar positive"></div>
              </div>
              <div id="momentumAdvantage" class="advantage-indicator">[Advantage: Paanic Forces]</div>
            </div>
            
            <div class="order-display">
              <div class="status-label">CURRENT ORDER:</div>
              <div id="currentOrderDisplay" class="order-value">HOLD THE LINE</div>
              <div class="order-progress-bar"></div>
            </div>
          </div>
          
          <div class="battle-log-container">
            <div id="shieldwallLog" class="shieldwall-log"></div>
          </div>
          
          <div class="battle-controls">
            <div class="player-stance">
              <div class="control-label">YOUR STANCE</div>
              <div id="stanceDisplay" class="stance-display balanced">
                Balanced<br>Stance
              </div>
              <div class="stance-buttons">
                <button class="shieldwall-btn stance-btn" onclick="window.shieldwallSystem.changeStance('aggressive')">Aggressive</button>
                <button class="shieldwall-btn stance-btn" onclick="window.shieldwallSystem.changeStance('balanced')">Balanced</button>
                <button class="shieldwall-btn stance-btn" onclick="window.shieldwallSystem.changeStance('defensive')">Defensive</button>
              </div>
            </div>
            
            <div id="reactionContainer" class="reaction-container">
              <div class="control-label">REACTION OPTIONS (5s)</div>
              <div id="reactionOptions" class="reaction-options">
                <!-- Will be dynamically populated -->
              </div>
            </div>
            
            <div class="shield-position">
              <div class="control-label">SHIELD POSITION:</div>
              <div class="shield-buttons">
                <button id="highShield" class="shieldwall-btn shield-btn" onclick="window.shieldwallSystem.changeShieldPosition('high')">HIGH</button>
                <button id="centerShield" class="shieldwall-btn shield-btn active" onclick="window.shieldwallSystem.changeShieldPosition('center')">CENTER</button>
                <button id="lowShield" class="shieldwall-btn shield-btn" onclick="window.shieldwallSystem.changeShieldPosition('low')">LOW</button>
              </div>
            </div>
          </div>
          
          <div class="unit-status-bars">
            <div class="status-bar-item">
              <div class="status-label">UNIT COHESION: <span id="cohesionValue">68%</span></div>
              <div class="status-label-small">[HOLDING FIRM]</div>
              <div class="unit-bar-container">
                <div id="cohesionBar" class="unit-bar cohesion-bar"></div>
              </div>
            </div>
            
            <div class="status-bar-item">
              <div class="status-label">HEALTH: <span id="shieldwallHealthValue">87/100</span></div>
              <div class="unit-bar-container">
                <div id="shieldwallHealthBar" class="unit-bar health-bar"></div>
              </div>
            </div>
            
            <div class="status-bar-item">
              <div class="status-label">STAMINA: <span id="shieldwallStaminaValue">71/100</span></div>
              <div class="unit-bar-container">
                <div id="shieldwallStaminaBar" class="unit-bar stamina-bar"></div>
              </div>
            </div>
            
            <div class="status-bar-item">
              <div class="status-label">MORALE: <span id="shieldwallMoraleValue">84/100</span></div>
              <div class="unit-bar-container">
                <div id="shieldwallMoraleBar" class="unit-bar morale-bar"></div>
              </div>
            </div>
          </div>
          
          <div id="shieldwallActions" class="shieldwall-actions">
            <button class="shieldwall-btn action-btn" onclick="window.shieldwallSystem.adjustPosition('left')">ADJUST LEFT</button>
            <button class="shieldwall-btn action-btn" onclick="window.shieldwallSystem.adjustPosition('right')">ADJUST RIGHT</button>
            <button class="shieldwall-btn action-btn" onclick="window.shieldwallSystem.generateThreat()">TEST THREAT</button>
            <button class="shieldwall-btn action-btn" onclick="window.shieldwallSystem.endBattle('victory')">END BATTLE</button>
          </div>
        </div>
      `;
    }
    
    // Show the interface
    modalContainer.style.display = 'flex';
    
    // Update initial UI elements
    this.updateBattleInterface();
    
    // Show / hide gap indicator
    const gapIndicator = document.getElementById('gapIndicator');
    if (gapIndicator) {
      gapIndicator.style.display = 'none'; // Hide initially
    }
    
    // Clear reaction options
    this.clearReactionOptions();
  },
  
  // Render formation units
  renderFormationUnits: function(type, count) {
    if (!type || typeof type !== 'string' || !count || count <= 0) {
      return '';
    }
    
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `<div class="unit-marker ${type}">${type.toUpperCase()}</div>`;
    }
    return html;
  },
  
  // Update the battle interface
  updateBattleInterface: function() {
    try {
      // Update battle title
      const battleTitle = document.querySelector('.battle-title');
      if (battleTitle) {
        battleTitle.textContent = `BATTLE OF NESIAN FRONTIER`;
      }
      
      // Update unit strength display
      const unitStrengthDisplay = document.getElementById('unitStrengthDisplay');
      if (unitStrengthDisplay) {
        unitStrengthDisplay.textContent = `${this.state.unitStrength.current}/${this.state.unitStrength.max}`;
      }
      
      // Update unit strength bar
      const unitStrengthBar = document.getElementById('unitStrengthBar');
      if (unitStrengthBar) {
        const strengthPercentage = (this.state.unitStrength.current / this.state.unitStrength.max) * 100;
        unitStrengthBar.style.width = `${strengthPercentage}%`;
        
        // Change color based on percentage
        if (strengthPercentage < 30) {
          unitStrengthBar.style.backgroundColor = '#ff5f6d';
        } else if (strengthPercentage < 60) {
          unitStrengthBar.style.backgroundColor = '#ffc371';
        } else {
          unitStrengthBar.style.backgroundColor = '#a8e063';
        }
      }
      
      // Update momentum display
      const momentumBarPositive = document.getElementById('momentumBarPositive');
      const momentumBarNegative = document.getElementById('momentumBarNegative');
      const momentumAdvantage = document.getElementById('momentumAdvantage');
      
      if (momentumBarPositive && momentumBarNegative && momentumAdvantage) {
        if (this.state.momentum.value >= 0) {
          momentumBarPositive.style.width = `${this.state.momentum.value}%`;
          momentumBarNegative.style.width = '0%';
        } else {
          momentumBarPositive.style.width = '0%';
          momentumBarNegative.style.width = `${-this.state.momentum.value}%`;
        }
        
        momentumAdvantage.textContent = `[Advantage: ${this.state.momentum.advantage}]`;
      }
      
      // Update battle phase display
      const battlePhaseDisplay = document.getElementById('battlePhaseDisplay');
      if (battlePhaseDisplay && this.state.battlePhase) {
        const phase = this.state.battlePhase.toUpperCase();
        battlePhaseDisplay.textContent = phase;
      }
      
      // Update battle time display
      const battleTimeDisplay = document.getElementById('battleTimeDisplay');
      if (battleTimeDisplay) {
        const minutes = Math.floor(this.state.timePassed / 60);
        const seconds = Math.floor(this.state.timePassed % 60);
        battleTimeDisplay.textContent = `Time Elapsed: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      // Update order display
      const currentOrderDisplay = document.getElementById('currentOrderDisplay');
      if (currentOrderDisplay && this.state.currentOrder) {
        currentOrderDisplay.textContent = this.state.currentOrder.toUpperCase();
      }
      
      // Update stance display
      const stanceDisplay = document.getElementById('stanceDisplay');
      if (stanceDisplay && this.state.playerStance) {
        // First convert to proper case
        const stance = this.state.playerStance.charAt(0).toUpperCase() + this.state.playerStance.slice(1).toLowerCase();
        
        // Update class and text content
        stanceDisplay.className = `stance-display ${this.state.playerStance.toLowerCase()}`;
        stanceDisplay.innerHTML = `${stance}<br>Stance`;
      }
      
      // Update shield position buttons
      ['high', 'center', 'low'].forEach(pos => {
        const button = document.getElementById(`${pos}Shield`);
        if (button) {
          if (this.state.shieldPosition === pos) {
            button.classList.add('active');
          } else {
            button.classList.remove('active');
          }
        }
      });
      
      // Update cohesion display
      const cohesionValue = document.getElementById('cohesionValue');
      const cohesionBar = document.getElementById('cohesionBar');
      
      if (cohesionValue && cohesionBar) {
        cohesionValue.textContent = `${Math.round(this.state.cohesion.current)}%`;
        cohesionBar.style.width = `${this.state.cohesion.current}%`;
        
        // Update cohesion status text
        const cohesionStatusLabel = document.querySelector('.status-label-small');
        if (cohesionStatusLabel && this.state.cohesion.status) {
          cohesionStatusLabel.textContent = `[${this.state.cohesion.status.toUpperCase()}]`;
        }
        
        // Change color based on status
        if (this.state.cohesion.status === "breaking") {
          cohesionBar.style.backgroundColor = '#ff5f6d';
        } else if (this.state.cohesion.status === "wavering") {
          cohesionBar.style.backgroundColor = '#ffc371';
        } else {
          cohesionBar.style.backgroundColor = '#a8e063';
        }
      }
      
      // Update player stats from main game
      this.updatePlayerStatusBars();
      
      // Update reaction timer if active
      if (this.state.reactionNeeded) {
        const reactionContainer = document.getElementById('reactionContainer');
        if (reactionContainer) {
          const label = reactionContainer.querySelector('.control-label');
          if (label) {
            label.textContent = `REACTION OPTIONS (${Math.max(0, Math.ceil(this.state.reactionTimeRemaining))}s)`;
          }
        }
      }
    } catch (error) {
      console.error("Error updating battle interface:", error);
    }
  },
  
  // Update player status bars from stored playerStats
  updatePlayerStatusBars: function() {
    if (!this.playerStats) return;
    
    // Update health display
    const healthValue = document.getElementById('shieldwallHealthValue');
    const healthBar = document.getElementById('shieldwallHealthBar');
    if (healthValue && healthBar) {
      healthValue.textContent = `${Math.round(this.playerStats.health)}/${this.playerStats.maxHealth}`;
      healthBar.style.width = `${(this.playerStats.health / this.playerStats.maxHealth) * 100}%`;
    }
    
    // Update stamina display
    const staminaValue = document.getElementById('shieldwallStaminaValue');
    const staminaBar = document.getElementById('shieldwallStaminaBar');
    if (staminaValue && staminaBar) {
      staminaValue.textContent = `${Math.round(this.playerStats.stamina)}/${this.playerStats.maxStamina}`;
      staminaBar.style.width = `${(this.playerStats.stamina / this.playerStats.maxStamina) * 100}%`;
    }
    
    // Update morale display
    const moraleValue = document.getElementById('shieldwallMoraleValue');
    const moraleBar = document.getElementById('shieldwallMoraleBar');
    if (moraleValue && moraleBar) {
      moraleValue.textContent = `${Math.round(this.playerStats.morale)}/100`;
      moraleBar.style.width = `${this.playerStats.morale}%`;
    }
  },
  
  // Hide the battle interface
  hideBattleInterface: function() {
    const modalContainer = document.querySelector('.shieldwall-modal');
    if (modalContainer) {
      modalContainer.style.display = 'none';
    }
  },
  
  // Update reaction options based on current threat
  updateReactionOptions: function() {
    const reactionOptions = document.getElementById('reactionOptions');
    if (!reactionOptions) return;
    
    // Customize available reactions based on threat
    const threat = this.state.currentThreat;
    if (!threat) return;
    
    // Show the reaction container
    const reactionContainer = document.getElementById('reactionContainer');
    if (reactionContainer) {
      reactionContainer.style.display = 'block';
    }
    
    // Update the label to show time remaining
    const label = reactionContainer.querySelector('.control-label');
    if (label) {
      label.textContent = `REACTION OPTIONS (${Math.ceil(threat.timeToReact)}s)`;
    }
    
    // Clear previous options
    reactionOptions.innerHTML = '';
    
    // Add appropriate reaction buttons
    let availableReactions = [];
    
    switch (threat.type) {
      case "projectiles":
        availableReactions = ["brace", "shield cover"];
        break;
      case "charge":
        availableReactions = ["brace", "attack"];
        break;
      case "gap":
        availableReactions = ["step to gap", "brace"];
        break;
      case "flanking":
        availableReactions = ["adjust position", "brace"];
        break;
      default:
        availableReactions = ["brace", "shield cover", "step to gap", "attack"];
    }
    
    // Create buttons for each reaction
    availableReactions.forEach(reaction => {
      const button = document.createElement('button');
      button.className = 'shieldwall-btn reaction-btn';
      button.textContent = reaction.toUpperCase();
      button.onclick = () => this.handleReaction(reaction);
      reactionOptions.appendChild(button);
    });
  },
  
  // Clear reaction options
  clearReactionOptions: function() {
    const reactionContainer = document.getElementById('reactionContainer');
    if (reactionContainer) {
      reactionContainer.style.display = 'none';
    }
  },
  
  // Position adjustment function (left/right)
  adjustPosition: function(direction) {
    if (!direction || typeof direction !== 'string') {
      console.error("Invalid position adjustment direction:", direction);
      return;
    }
    
    // Validate direction
    direction = direction.toLowerCase();
    if (direction !== 'left' && direction !== 'right') {
      console.error("Invalid position adjustment direction:", direction);
      return;
    }
    
    // Update position
    if (direction === 'left') {
      if (this.state.position.file === 'center') {
        this.state.position.file = 'left';
        this.addBattleMessage("You adjust your position to the left side of the formation.");
      } else if (this.state.position.file === 'right') {
        this.state.position.file = 'center';
        this.addBattleMessage("You adjust your position toward the center of the formation.");
      } else {
        this.addBattleMessage("You're already at the left edge of the formation.");
      }
    } else { // right
      if (this.state.position.file === 'center') {
        this.state.position.file = 'right';
        this.addBattleMessage("You adjust your position to the right side of the formation.");
      } else if (this.state.position.file === 'left') {
        this.state.position.file = 'center';
        this.addBattleMessage("You adjust your position toward the center of the formation.");
      } else {
        this.addBattleMessage("You're already at the right edge of the formation.");
      }
    }
    
    // Update UI
    this.updateBattleInterface();
  },
  
  // Add CSS styles for shieldwall system
  addShieldwallStyles: function() {
    const styleElement = document.createElement('style');
    styleElement.id = 'shieldwall-styles';
    styleElement.textContent = `
      /* Shieldwall System Styles */
      .shieldwall-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      
      .shieldwall-interface {
        width: 95%;
        max-width: 1200px;
        height: 95vh;
        max-height: 900px;
        background: #1a1a1a;
        border: 2px solid #444;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
        display: grid;
        grid-template-rows: auto auto 1fr auto auto;
        grid-template-columns: 1fr 300px;
        grid-template-areas:
          "title title"
          "formation status"
          "log log"
          "controls controls"
          "unit-status unit-status"
          "actions actions";
        gap: 15px;
        color: #e0e0e0;
        overflow: hidden;
      }
      
      .battle-title {
        grid-area: title;
        text-align: center;
        margin: 0 0 10px 0;
        color: #c9aa71;
        font-size: 1.4em;
      }
      
      /* Formation overview */
      .formation-overview {
        grid-area: formation;
        background: #1e293b;
        padding: 15px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .formation-label {
        font-weight: bold;
        margin-bottom: 5px;
        color: #aaa;
        font-size: 0.85em;
      }
      
      .enemy-line, .player-line {
        margin: 10px 0;
        position: relative;
      }
      
      .formation-units {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        justify-content: center;
      }
      
      .unit-marker {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7em;
        font-weight: bold;
        color: white;
      }
      
      .unit-marker.r {
        background-color: #8E0E00;
      }
      
      .unit-marker.b {
        background-color: #4682B4;
      }
      
      .spacing-line {
        border-top: 1px dotted #666;
        margin: 10px 0;
      }
      
      .gap-indicator {
        position: absolute;
        top: -10px;
        left: 40%;
        color: #ff5f6d;
        font-size: 0.8em;
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: blink 1s infinite;
      }
      
      .arrow-down {
        width: 0; 
        height: 0; 
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid #ff5f6d;
      }
      
      .player-position-marker {
        position: absolute;
        bottom: -10px;
        left: 50%;
        font-weight: bold;
        color: #c9aa71;
      }
      
      /* Battle status panel */
      .battle-status-panel {
        grid-area: status;
        background: #1e293b;
        padding: 15px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .battle-phase {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .status-label {
        font-weight: bold;
        color: #888;
        font-size: 0.8em;
      }
      
      .status-label-small {
        font-size: 0.7em;
        color: #aaa;
      }
      
      .status-value {
        font-weight: bold;
        color: #c9aa71;
        font-size: 1.1em;
      }
      
      .time-display {
        font-size: 0.8em;
        color: #aaa;
      }
      
      .strength-bar-container, .momentum-bar-container {
        width: 100%;
        height: 10px;
        background: #333;
        border-radius: 5px;
        overflow: hidden;
        margin-top: 5px;
      }
      
      .strength-bar {
        height: 100%;
        width: 85%;
        background-color: #a8e063;
        border-radius: 5px;
      }
      
      .momentum-bar-container {
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
      }
      
      .momentum-bar {
        height: 100%;
        width: 0%;
        transition: width 0.3s ease-out;
      }
      
      .momentum-bar.positive {
        background-color: #a8e063;
        margin-left: 50%;
      }
      
      .momentum-bar.negative {
        background-color: #ff5f6d;
        margin-right: 50%;
      }
      
      .advantage-indicator {
        text-align: center;
        font-size: 0.8em;
        color: #aaa;
        margin-top: 5px;
      }
      
      .order-display {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .order-value {
        font-weight: bold;
        color: #c9aa71;
        font-size: 1.1em;
        text-align: center;
      }
      
      .order-progress-bar {
        width: 100%;
        height: 5px;
        background: #a8e063;
        border-radius: 5px;
        margin-top: 5px;
      }
      
      /* Battle log */
      .battle-log-container {
        grid-area: log;
        width: 100%;
        max-height: 200px;
      }
      
      .shieldwall-log {
        height: 100%;
        overflow-y: auto;
        padding: 10px;
        background: #1e293b;
        border-radius: 8px;
        font-size: 0.9em;
        line-height: 1.4;
      }
      
      .shieldwall-log p {
        margin: 5px 0;
        padding-left: 10px;
        border-left: 2px solid #444;
      }
      
      /* Battle controls */
      .battle-controls {
        grid-area: controls;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 15px;
      }
      
      .player-stance, .reaction-container, .shield-position {
        background: #1e293b;
        padding: 10px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .control-label {
        font-weight: bold;
        color: #888;
        font-size: 0.8em;
        text-align: center;
      }
      
      .stance-display {
        text-align: center;
        padding: 10px;
        border-radius: 5px;
        font-weight: bold;
        margin: 0 auto;
        width: 80%;
      }
      
      .stance-display.balanced {
        background: rgba(160, 160, 255, 0.2);
        color: #a0a0ff;
      }
      
      .stance-display.aggressive {
        background: rgba(255, 95, 109, 0.2);
        color: #ff5f6d;
      }
      
      .stance-display.defensive {
        background: rgba(168, 224, 99, 0.2);
        color: #a8e063;
      }
      
      .stance-buttons, .reaction-options, .shield-buttons {
        display: flex;
        justify-content: center;
        gap: 5px;
        flex-wrap: wrap;
      }
      
      .shieldwall-btn {
        background: #2a2a2a;
        color: #e0e0e0;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        font-size: 0.85em;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .shieldwall-btn:hover {
        background: #3a3a3a;
        transform: translateY(-2px);
      }
      
      .shieldwall-btn:active {
        transform: translateY(1px);
      }
      
      .shieldwall-btn.active {
        background: #3a3a3a;
        border: 1px solid #c9aa71;
      }
      
      .stance-btn {
        flex: 1;
      }
      
      .shield-btn {
        flex: 1;
      }
      
      .reaction-btn {
        margin: 5px;
        min-width: 100px;
      }
      
      /* Unit status bars */
      .unit-status-bars {
        grid-area: unit-status;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        background: #1e293b;
        padding: 10px;
        border-radius: 8px;
      }
      
      .status-bar-item {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      
      .unit-bar-container {
        width: 100%;
        height: 10px;
        background: #333;
        border-radius: 5px;
        overflow: hidden;
      }
      
      .unit-bar {
        height: 100%;
        width: 85%;
        border-radius: 5px;
        transition: width 0.3s ease-out;
      }
      
      .cohesion-bar {
        background-color: #a8e063;
      }
      
      .health-bar {
        background-color: #ff5f6d;
      }
      
      .stamina-bar {
        background-color: #a8e063;
      }
      
      .morale-bar {
        background-color: #4776E6;
      }
      
      /* Actions section */
      .shieldwall-actions {
        grid-area: actions;
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 10px;
      }
      
      .action-btn {
        font-size: 0.9em;
        padding: 10px 15px;
      }
      
      .large-btn {
        font-size: 1.1em;
        padding: 12px 24px;
        background: #2a623d;
      }
      
      /* Animations */
      @keyframes blink {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
      
      /* Responsive adjustments */
      @media (max-width: 1000px) {
        .battle-controls {
          grid-template-columns: 1fr 1fr;
        }
        
        .unit-status-bars {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      
      @media (max-width: 768px) {
        .shieldwall-interface {
          grid-template-columns: 1fr;
          grid-template-areas:
            "title"
            "formation"
            "status"
            "log"
            "controls"
            "unit-status"
            "actions";
        }
        
        .battle-controls {
          grid-template-columns: 1fr;
        }
      }
    `;
    
    document.head.appendChild(styleElement);
  }
};

// Function to start a shieldwall battle from a quest
window.startShieldwallBattle = function(config) {
  console.log("Starting shieldwall battle with config:", config);
  
  // Make sure the system is initialized
  if (!window.shieldwallSystem.initialized) {
    window.shieldwallSystem.initialize();
  }
  
  // Configure default battle parameters
  const battleConfig = {
    enemyName: config.enemyName || "Enemy Forces",
    unitStrength: {
      current: config.unitStrength || 40,
      max: config.unitStrength || 40
    },
    cohesion: {
      current: config.startingCohesion || 85
    },
    momentum: {
      value: config.startingMomentum || 0
    },
    battlePhase: config.startingPhase || "preparation",
    currentOrder: config.order || "hold the line",
    
    // Callback function when battle ends
    onBattleEnd: config.onBattleEnd || null
  };
  
  // Start the shieldwall battle
  window.shieldwallSystem.initiateBattle(battleConfig);
};

// Helper function to resume a quest after a shieldwall battle
window.resumeQuestAfterShieldwall = function(quest, outcome) {
  console.log(`Resuming quest after shieldwall battle with outcome: ${outcome}`);
  
  // Find the current stage
  if (!quest || !quest.stages || !quest.currentStageIndex) {
    console.error("Invalid quest object:", quest);
    return;
  }
  
  const currentStage = quest.stages[quest.currentStageIndex];
  const nextStage = currentStage.nextStage;
  
  // Different handling based on outcome
  if (outcome === "victory") {
    // Add success narrative and progress quest
    window.addToNarrative("Your unit has successfully held the line against the enemy forces. The battle is won!");
    
    // Progress to next stage if specified
    if (nextStage) {
      window.progressQuest(quest.id, currentStage.action);
    }
  } else {
    // Fail quest on defeat
    window.addToNarrative("Your unit has been overwhelmed by the enemy forces. The battle is lost.");
    window.failQuest(quest.id);
  }
};

// Initialize the shieldwall system when the page loads
document.addEventListener('DOMContentLoaded', function() {
  window.shieldwallSystem.initialize();
});