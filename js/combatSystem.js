// combatSystem.js - COMPLETE UPDATED COMBAT SYSTEM MODULE 
// Implements a narrative-driven combat system with stances, distances, counter chains, and weapon-based actions

// Combat state and management object
window.combatSystem = {
  // Combat state variables
  state: {
    active: false,
    turn: 0,
    phase: "initial", // initial, player, enemy, resolution
    enemy: null,
    distance: 2, // 0:Grappling, 1:Close, 2:Medium, 3:Far
    playerStance: "neutral", // neutral, aggressive, defensive
    enemyStance: "neutral",
    counterWindowOpen: false,
    targetArea: "body", // head, body, legs
    combatLog: [],
    
    // Counter system properties
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
  },
  
  // Start combat with an enemy
  initiateCombat: function(enemyType) {
    // Reset combat state
    this.state = {
      active: true,
      turn: 0,
      phase: "initial",
      distance: 2,
      playerStance: "neutral",
      enemyStance: "neutral",
      counterWindowOpen: false,
      targetArea: "body",
      combatLog: [],
      
      // Counter system properties
      counterChain: 0,
      maxCounterChain: 4,
      lastCounterActor: null
    };
    
    // Create enemy instance
    this.state.enemy = this.createEnemy(enemyType);
    
    // Set up the combat interface
    this.renderCombatInterface();
    
    // Start with initial narrative
    this.addCombatMessage(`You're locked in combat with a ${this.state.enemy.name}.`);
    this.addCombatMessage(`You circle each other, feeling out the ground, prodding for weaknesses.`);
    
    // Enter player phase
    this.enterPhase("player");
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
        stats: { power: 5, defense: 5, speed: 5 }
      };
    }
    
    // Create a copy of the template with initial values
    const enemy = {
      ...template,
      id: `enemy_${Date.now()}`,
      currentStance: template.preferredStance || "neutral",
      nextAction: null
    };
    
    return enemy;
  },
  
  // Enter a specific combat phase
  enterPhase: function(phase) {
    const previousPhase = this.state.phase;
    this.state.phase = phase;
    
    // If we're in a counter window, don't change phases normally
    if (this.state.counterWindowOpen && phase !== "initial" && phase !== "resolution") {
      if (this.state.lastCounterActor === "player") {
        // Enemy should counter
        setTimeout(() => this.handleEnemyCounter(), 1000);
        return;
      } else if (this.state.lastCounterActor === "enemy") {
        // Show player counter options
        this.updateCounterOptions();
        return;
      }
    }
    
    switch(phase) {
      case "initial":
        // Handle intro narrative and setup
        setTimeout(() => this.enterPhase("player"), 1000);
        break;
        
      case "player":
        // Update UI to show player options
        this.updateCombatOptions();
        break;
        
      case "enemy":
        // Process enemy turn
        setTimeout(() => this.processEnemyTurn(), 1000);
        break;
        
      case "resolution":
        // Check if the combat is over
        if (this.state.enemy.health <= 0) {
          this.endCombat(true); // Player victory
        } else if (window.gameState.health <= 0) {
          this.endCombat(false); // Player defeat
        } else {
          // Combat continues
          this.state.turn++;
          this.enterPhase("player");
        }
        break;
    }
    
    console.log(`Combat phase changed: ${previousPhase} -> ${phase}`);
  },
  
  // Process enemy's turn
  processEnemyTurn: function() {

    // If already processed an action this turn, don't process again
    if (this._processingEnemyTurn) return;
    this._processingEnemyTurn = true;

    // If enemy can counter attack
    if (this.state.counterWindowOpen) {
      this.handleEnemyCounter();
      return;
    }
    
    // Determine enemy action based on AI
    const action = this.determineEnemyAction();
    
    // Process the chosen action
    switch(action.type) {
      case "distance":
        this.handleEnemyDistanceChange(action.value);
        break;
      
      case "stance":
        this.handleEnemyStanceChange(action.value);
        break;
      
      case "attack":
        this.handleEnemyAttack(action.attackType, action.targetArea);
        break;
    }
    
    // Move to resolution phase
    setTimeout(() => {
      this._processingEnemyTurn = false;
      this.enterPhase("resolution");
    }, 1500);
  },
  
  // Determine enemy's next action based on AI logic
  determineEnemyAction: function() {
    const enemy = this.state.enemy;
    const distanceDiff = this.state.distance - enemy.preferredDistance;
    
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
    
    if (this.state.playerStance === "aggressive" && this.state.enemyStance !== "defensive") {
      // Player is aggressive, more likely to change to defensive
      actionProbabilities.stance = 0.5;
      actionProbabilities.attack = 0.3;
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
        } else if (this.state.playerStance === "defensive" && this.state.distance <= 1) {
          newStance = "aggressive";
        }
        return {
          type: "stance",
          value: newStance
        };
      
      case "attack":
        // Can only attack if in range
        if (this.state.distance > (enemy.weaponRange || 1)) {
          // Too far, adjust distance instead
          return {
            type: "distance",
            value: -1
          };
        }
        
        // Choose attack type and target
        return {
          type: "attack",
          attackType: this.getRandomEnemyAttack(),
          targetArea: this.getRandomTargetArea()
        };
    }
  },
  
  // Process a player action during combat
  handleCombatAction: function(action, params = {}) {
    if (!this.state.active || this.state.phase !== "player") {
      console.warn("Cannot handle combat action - not in player phase");
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
    
    // Move to enemy phase unless combat has ended
    if (this.state.active && !this.state.counterWindowOpen) {
      this.enterPhase("enemy");
    }
  },
  
  // Handle player changing distance
  handleDistanceChange: function(change) {
    const oldDistance = this.state.distance;
    this.state.distance = Math.max(0, Math.min(3, this.state.distance + change));
    
    // Generate appropriate narrative
    if (change < 0) {
      this.addCombatMessage(this.generateDistanceNarrative("approach"));
    } else {
      this.addCombatMessage(this.generateDistanceNarrative("retreat"));
    }
    
    // Enemy reaction to distance change
    this.addCombatMessage(this.generateEnemyReactionToDistance());
    
    // Update UI
    this.updateCombatInterface();
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
    this.updateCombatInterface();
  },
  
  // Handle player changing target area
  handleTargetChange: function(targetArea) {
    this.state.targetArea = targetArea;
    
    // Add targeting narrative
    this.addCombatMessage(`You adjust your aim, focusing on the ${this.targetLabels[targetArea]}.`);
    
    // Update UI
    this.updateCombatInterface();
  },
  
  // Handle player attack
  handlePlayerAttack: function(attackType) {
    // Special case for javelin throws
    if (attackType === "Throw Javelin") {
      return this.handleJavelinThrow();
    }
    
    // Get player weapon
    const weapon = window.player.equipment?.mainHand;
    if (!weapon && attackType !== "Punch") {
      this.addCombatMessage("You have no weapon equipped!");
      return;
    }
    
    // Get weapon template
    const weaponTemplate = weapon ? weapon.getTemplate() : { name: "fist", category: "weapon" };
    
    // Handle ranged weapons
    const isRanged = attackType === "Shoot" || attackType === "Aimed Shot" || 
                   weaponTemplate.weaponType?.name === "Bow" ||
                   weaponTemplate.weaponType?.name === "Crossbow" ||
                   weaponTemplate.weaponType?.name === "Rifle";
    
    if (isRanged) {
      const ammo = window.player.equipment?.ammunition;
      
      if (!ammo) {
        this.addCombatMessage("You need ammunition to use this weapon!");
        return;
      }
      
      if (!window.checkWeaponAmmoCompatibility()) {
        this.addCombatMessage(`${ammo.getName()} is not compatible with your ${weaponTemplate.name}!`);
        return;
      }
      
      // Check if ammunition is depleted
      if (ammo.currentAmount <= 0) {
        this.addCombatMessage("You're out of ammunition!");
        return;
      }
      
      // Use 1 ammunition
      ammo.useAmmo(1);
      this.addCombatMessage(`You fire your ${weaponTemplate.name}. (${ammo.currentAmount}/${ammo.capacity} ${ammo.getTemplate().ammoType}s remaining)`);
    }
    
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
    if (this.checkEnemyShieldBlock()) {
      // Attack was blocked by enemy shield
      this.addCombatMessage(`Your attack is blocked by the ${this.state.enemy.name}'s shield with a resounding clang!`);
      
      // No counter chance on shield block
      setTimeout(() => this.enterPhase("enemy"), 1000);
      return;
    }
    
    // Determine hit success based on skills and stats
    const hitSuccess = this.resolveAttackSuccess(weaponTemplate, attackType);
    
    if (hitSuccess) {
      // Calculate damage
      const damage = this.calculateDamage(weaponTemplate, attackType);
      
      // Apply damage to enemy
      this.state.enemy.health = Math.max(0, this.state.enemy.health - damage);
      
      // Generate hit narrative
      this.addCombatMessage(this.generateHitNarrative(weaponTemplate, attackType, damage));
      
      // Reset counter chain after successful hit
      this.state.counterChain = 0;
      this.state.counterWindowOpen = false;
      this.state.lastCounterActor = null;
      
      // Check if enemy is defeated
      if (this.state.enemy.health <= 0) {
        this.addCombatMessage(this.generateVictoryNarrative());
        
        // End combat immediately instead of going to enemy phase
        setTimeout(() => this.endCombat(true), 1500);
        return; // Important: return here to prevent proceeding to enemy phase
      }
    } else {
      // Generate miss narrative
      this.addCombatMessage(this.generateMissNarrative(weaponTemplate, attackType));
      
      // Potential counterattack window
      if (this.shouldEnemyCounter()) {
        this.state.counterWindowOpen = true;
        this.state.counterChain = 0; // Reset counter chain at start of new exchange
        this.addCombatMessage(`The ${this.state.enemy.name} sees an opening and prepares to counter!`);
        
        // Move to enemy phase for counter
        setTimeout(() => this.handleEnemyCounter(), 1000);
        return;
      }
    }
    
    // Update UI
    this.updateCombatInterface();
    
    // Move to enemy phase if no counter
    if (!this.state.counterWindowOpen) {
      setTimeout(() => this.enterPhase("enemy"), 1000);
    }
  },
  
  // Implementation of javelin throwing as a specialized attack
  handleJavelinThrow: function() {
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
    
    this.addCombatMessage(`You throw a javelin at the ${this.state.enemy.name}. (${ammo.currentAmount}/${ammo.capacity} javelins remaining)`);
    
    // Javelins have good hit chance but moderate damage
    const hitBonus = 10;
    const hitSuccess = this.resolveAttackSuccess({
      name: "javelin",
      stats: { damage: 12, armorPenetration: 5 }
    }, "Throw", hitBonus);
    
    if (hitSuccess) {
      // Calculate damage - javelins do good damage and have armor penetration
      const damage = Math.round(10 + Math.random() * 5);
      
      // Apply damage to enemy
      this.state.enemy.health = Math.max(0, this.state.enemy.health - damage);
      
      // Generate hit narrative
      this.addCombatMessage(`Your javelin strikes true, piercing the ${this.state.enemy.name} for ${damage} damage!`);
      
      // Check if enemy is defeated
      if (this.state.enemy.health <= 0) {
        this.addCombatMessage(this.generateVictoryNarrative());
        
        // End combat immediately instead of going to enemy phase
        setTimeout(() => this.endCombat(true), 1500);
        return; // Important: return here to prevent proceeding to enemy phase
      }
    } else {
      // Generate miss narrative
      this.addCombatMessage(`Your javelin flies wide, missing the ${this.state.enemy.name}!`);
    }
    
    // Update UI
    this.updateCombatInterface();
    
    // Move to enemy phase - no counter opportunity on javelin misses
    setTimeout(() => this.enterPhase("enemy"), 1000);
  },
  
  // Handle player counter attack
  handlePlayerCounter: function(attackType) {
    this.state.counterChain++;
    this.state.lastCounterActor = "player";
    
    // Get player weapon
    const weapon = window.player.equipment?.mainHand;
    const weaponTemplate = weapon ? weapon.getTemplate() : null;
    
    // Generate counter narrative
    this.addCombatMessage(`You seize the opportunity with a lightning-fast counter-riposte!`);
    
    // Reduce weapon durability with each use (NEW)
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
      this.addCombatMessage(`After a frenzied exchange of feints and counters, both you and the ${this.state.enemy.name} back off, breathing heavily.`);
      this.state.counterChain = 0;
      this.state.counterWindowOpen = false;
      this.state.lastCounterActor = null;
      
      // Continue to resolution phase
      setTimeout(() => this.enterPhase("resolution"), 1000);
      return;
    }
    
    // Check for shield block
    if (this.checkEnemyShieldBlock()) {
      // Attack was blocked by enemy shield
      this.addCombatMessage(`Your counter-attack is blocked by the ${this.state.enemy.name}'s shield!`);
      
      // End the counter exchange
      this.state.counterChain = 0;
      this.state.counterWindowOpen = false;
      this.state.lastCounterActor = null;
      
      // Move to enemy phase
      setTimeout(() => this.enterPhase("enemy"), 1000);
      return;
    }
  
    // Counter attacks have higher hit chance
    const hitBonus = 20; // +20% hit chance on counters
    const hitSuccess = this.resolveAttackSuccess(weaponTemplate, attackType, hitBonus);
    
    if (hitSuccess) {
      // Calculate damage with bonus for counters
      const damage = this.calculateDamage(weaponTemplate, attackType) * 1.5;
      
      // Apply damage to enemy
      this.state.enemy.health = Math.max(0, this.state.enemy.health - damage);
      
      // Generate hit narrative
      this.addCombatMessage(`Your counter-riposte lands perfectly, dealing ${Math.round(damage)} damage!`);
      
      // Reset counter chain after successful hit
      this.state.counterChain = 0;
      this.state.counterWindowOpen = false;
      this.state.lastCounterActor = null;
      
      // Check if enemy is defeated
      if (this.state.enemy.health <= 0) {
        this.addCombatMessage(this.generateVictoryNarrative());
        
        // End combat immediately instead of going to enemy phase
        setTimeout(() => this.endCombat(true), 1500);
        return; // Important: return here to prevent proceeding to enemy phase
      }
      
      // Continue to next phase
      setTimeout(() => this.enterPhase("enemy"), 1000);
    } else {
      // Counter missed
      this.addCombatMessage(`Your counter-riposte misses as the ${this.state.enemy.name} deftly evades!`);
      
      // Enemy gets counter opportunity
      this.state.counterWindowOpen = true;
      
      // Go to enemy phase for counter
      setTimeout(() => this.handleEnemyCounter(), 1000);
    }
    
    // Update UI
    this.updateCombatInterface();
  },
  
  // Handle enemy changing distance
  handleEnemyDistanceChange: function(change) {
    const oldDistance = this.state.distance;
    this.state.distance = Math.max(0, Math.min(3, this.state.distance + change));
    
    // Generate appropriate narrative
    const enemy = this.state.enemy;
    
    if (change < 0) {
      this.addCombatMessage(`The ${enemy.name} advances toward you, closing the distance.`);
    } else {
      this.addCombatMessage(`The ${enemy.name} steps back, increasing the gap between you.`);
    }
    
    // Update UI
    this.updateCombatInterface();
  },
  
  // Handle enemy changing stance
  handleEnemyStanceChange: function(newStance) {
    const oldStance = this.state.enemyStance;
    this.state.enemyStance = newStance;
    
    // Generate appropriate narrative
    const enemy = this.state.enemy;
    
    if (newStance === "aggressive") {
      this.addCombatMessage(`The ${enemy.name} shifts into an aggressive posture, readying to strike.`);
    } else if (newStance === "defensive") {
      this.addCombatMessage(`The ${enemy.name} raises their guard, adopting a defensive stance.`);
    } else {
      this.addCombatMessage(`The ${enemy.name} resets to a balanced, neutral stance.`);
    }
    
    // Update UI
    this.updateCombatInterface();
  },
  
  // Handle enemy attack
  handleEnemyAttack: function(attackType, targetArea) {
    const enemy = this.state.enemy;
    
    // Generate attack narrative
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
      
      // Reduce armor durability if hit (NEW)
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
        this.updateCounterOptions();
        return;
      }
    }
    
    // Update UI
    this.updateCombatInterface();
  },
  
  // Handle enemy counterattack
  handleEnemyCounter: function() {
    const enemy = this.state.enemy;
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
      setTimeout(() => this.enterPhase("resolution"), 1000);
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
      
      // Reduce armor durability if hit (NEW)
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
      this.updateCounterOptions();
    }
  },
  
  // NEW: Reduce player armor durability when hit
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
  checkEnemyShieldBlock: function() {
    const enemy = this.state.enemy;
    
    // Check if enemy has a shield
    if (!enemy.hasShield) return false;
    
    // Get base block chance
    let blockChance = enemy.blockChance || 15; // Default 15% if not specified
    
    // Add bonus for defensive stance
    if (this.state.enemyStance === "defensive") {
      blockChance += 15; // +15% block chance in defensive stance
    }
    
    // Roll for block
    return Math.random() * 100 < blockChance;
  },
  
  // Calculate enemy damage - updated with armor durability damage reduction
  calculateEnemyDamage: function(targetArea) {
    const enemy = this.state.enemy;
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
    if (this.state.enemyStance === "aggressive") {
      damage *= 1.3; // More damage in aggressive stance
    } else if (this.state.enemyStance === "defensive") {
      damage *= 0.7; // Less damage in defensive stance
    }
    
    // Round to nearest integer
    return Math.round(damage);
  },
  
  // Calculate player damage based on weapon and attack - updated with armor penetration
  calculateDamage: function(weaponTemplate, attackType) {
    const baseDamage = weaponTemplate.stats.damage || 5;
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
    if (weaponTemplate.hasOwnProperty('durability') && weaponTemplate.durability !== undefined) {
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
    const armorPenetration = weaponTemplate.stats.armorPenetration || 0;
    const enemyDefense = this.state.enemy.defense || 0;
    const effectiveDefense = Math.max(0, enemyDefense - armorPenetration);
    
    // Reduce damage based on enemy defense
    if (effectiveDefense > 0) {
      damage = Math.max(1, damage - (effectiveDefense * 0.3));
    }
    
    // Apply enemy stance defense
    if (this.state.enemyStance === "defensive") {
      damage *= 0.7; // Enemy takes less damage in defensive stance
    }
    
    // Round to nearest integer
    return Math.round(damage);
  },
  
  // Resolve if an attack hits with optional hit bonus
  resolveAttackSuccess: function(weaponTemplate, attackType, hitBonus = 0) {
    const enemy = this.state.enemy;
    const accuracyMultiplier = this.getAttackAccuracyMultiplier(attackType);
    
    // Base chance from player skill
    let hitChance = 50 + (window.player.skills?.melee * 5 || 0);
    
    // Add any bonus hit chance (for counters)
    hitChance += hitBonus;
    
    // Apply accuracy multiplier from attack type
    hitChance *= accuracyMultiplier;
    
    // Adjust based on distance
    if (this.state.distance === 0) {
      hitChance += 20; // Easier to hit at grappling range
    } else if (this.state.distance === 3) {
      hitChance -= 20; // Harder to hit at far range
    }
    
    // Adjust based on stances
    if (this.state.playerStance === "aggressive") {
      hitChance += 10; // More accurate in aggressive stance
    } else if (this.state.playerStance === "defensive") {
      hitChance -= 10; // Less accurate in defensive stance
    }
    
    if (this.state.enemyStance === "defensive") {
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
  shouldEnemyCounter: function() {
    // Base counter chance
    let counterChance = 0.3;
    
    // Adjust based on enemy stats
    counterChance += (this.state.enemy.counterSkill || 0) * 0.05;
    
    // Adjust based on stances
    if (this.state.enemyStance === "defensive") {
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
    if (this.state.distance >= 2) {
      fleeChance += 0.3; // Easier to flee from a distance
    } else if (this.state.distance === 0) {
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
      setTimeout(() => this.handleEnemyAttack(this.getRandomEnemyAttack(), this.getRandomTargetArea()), 1000);
    }
  },
  
  // End combat and handle outcome
  endCombat: function(outcome) {
    // Set combat as inactive
    this.state.active = false;
    
    if (outcome === true) {
      // Player victory
      window.gameState.experience += this.state.enemy.experienceValue || 10;
      
      // Show victory message
      window.showNotification(`Victory! +${this.state.enemy.experienceValue || 10} XP`, 'success');
      
      // Generate loot
      this.generateLoot();
      
      // Update achievement if first combat victory
      if (!window.gameState.combatVictoryAchieved) {
        window.gameState.combatVictoryAchieved = true;
        window.showAchievement('first_blood');
      }
      
      // Slightly damage player's armor during combat
      this.applyArmorDurabilityDamage();
    } else if (outcome === "retreat") {
      // Player retreated
      window.showNotification("You managed to escape combat.", 'info');
      
      // Minor armor durability damage on retreat
      this.applyArmorDurabilityDamage(0.5); // Half damage on retreat
    } else {
      // Player defeat
      window.gameState.health = Math.max(1, window.gameState.health); // Ensure player doesn't die
      window.showNotification("You were defeated but survived.", 'warning');
      
      // Apply stamina penalty for defeat
      window.gameState.stamina = Math.max(0, window.gameState.stamina - 50);
      
      // More significant armor durability damage on defeat
      this.applyArmorDurabilityDamage(2); // Double damage on defeat
    }
    
    // Hide combat interface
    document.getElementById('combatInterface').classList.add('hidden');
    
    // Hide the modal container
    const modalContainer = document.querySelector('.combat-modal');
    if (modalContainer) {
      modalContainer.style.display = 'none';
    }
    
    // Update game UI
    window.updateStatusBars();
    window.updateActionButtons();
    window.updateProfileIfVisible();
    
    // Check for level up
    window.checkLevelUp();
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
  
  // Generate loot based on enemy
  generateLoot: function() {
    const enemy = this.state.enemy;
    
    // Check if enemy has loot table
    if (!enemy.lootTable || enemy.lootTable.length === 0) {
      return;
    }
    
    // Determine if loot drops
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
      this.addCombatMessage(`You found ${itemTemplate.name}!`);
    } else {
      // Add money if item not found
      const coins = Math.floor(Math.random() * 20) + 5;
      window.player.taelors += coins;
      this.addCombatMessage(`You found ${coins} taelors!`);
      
      // Small chance to also find repair kit
      if (Math.random() < 0.15 && window.itemTemplates.repairKit) {
        window.addItemToInventory(window.itemTemplates.repairKit);
        this.addCombatMessage(`You also found an armor repair kit!`);
      }
    }
  },
  
  // Render the combat interface
  renderCombatInterface: function() {
    // Create modal container if needed
    let modalContainer = document.querySelector('.combat-modal');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.className = 'combat-modal';
      document.body.appendChild(modalContainer);
      
      // Move combat interface into modal
      const combatInterface = document.getElementById('combatInterface');
      modalContainer.appendChild(combatInterface);
      
      // Add a title to the combat interface
      const titleElement = document.createElement('h2');
      titleElement.className = 'combat-title';
      titleElement.textContent = 'Combat Encounter';
      combatInterface.insertBefore(titleElement, combatInterface.firstChild);
      
      // Adjust the actions container class for better styling
      const actionsContainer = document.getElementById('combatActions');
      actionsContainer.className = 'combat-actions';
    }
    
    // Show the combat interface
    const combatInterface = document.getElementById('combatInterface');
    combatInterface.classList.remove('hidden');
    modalContainer.style.display = 'flex';
    
    // Add combat styles
    if (!document.getElementById('combat-styles')) {
      const combatStyles = `
      .combat-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.85);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }
      
      #combatInterface {
        width: 90%;
        max-width: 800px;
        background: #1a1a1a;
        border: 2px solid #444;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
      }
      
      .combat-title {
        text-align: center;
        margin-bottom: 10px;
        color: #c9aa71;
        font-size: 1.4em;
      }
      
      .combat-actions {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-top: 15px;
      }
      
      @media (max-width: 600px) {
        .combat-actions {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      `;
      
      const styleElement = document.createElement('style');
      styleElement.id = 'combat-styles';
      styleElement.textContent = combatStyles;
      document.head.appendChild(styleElement);
    }
    
    // Update initial UI elements
    this.updateCombatInterface();
  },
  
  // Update combat UI elements
  updateCombatInterface: function() {
    // Update health displays
    document.getElementById('playerHealthDisplay').textContent = `${Math.round(window.gameState.health)} HP`;
    document.getElementById('playerCombatHealth').style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
    
    if (this.state.enemy) {
      document.getElementById('enemyName').textContent = this.state.enemy.name;
      document.getElementById('enemyHealthDisplay').textContent = `${Math.round(this.state.enemy.health)} HP`;
      document.getElementById('enemyCombatHealth').style.width = `${(this.state.enemy.health / this.state.enemy.maxHealth) * 100}%`;
    }
    
    // Combat log is updated via addCombatMessage
    
    // Update action buttons based on phase and counter state
    if (this.state.phase === "player") {
      if (this.state.counterWindowOpen && this.state.lastCounterActor === "enemy") {
        this.updateCounterOptions();
      } else {
        this.updateCombatOptions();
      }
    }
  },
  
  // Update available combat options based on current state
  updateCombatOptions: function() {
    const actionsContainer = document.getElementById('combatActions');
    actionsContainer.innerHTML = '';
    
    // Get equipped weapon
    const weapon = window.player.equipment?.mainHand;
    const weaponTemplate = weapon ? weapon.getTemplate() : null;
    
    // Add distance buttons
    if (this.state.distance > 0) {
      this.addCombatButton("Approach", () => this.handleCombatAction("change_distance", {change: -1}), actionsContainer);
    }
    if (this.state.distance < 3) {
      this.addCombatButton("Retreat", () => this.handleCombatAction("change_distance", {change: 1}), actionsContainer);
    }
    
    // Add stance buttons
    if (this.state.playerStance !== "aggressive") {
      this.addCombatButton("Aggressive Stance", () => this.handleCombatAction("change_stance", {stance: "aggressive"}), actionsContainer);
    }
    if (this.state.playerStance !== "defensive") {
      this.addCombatButton("Defensive Stance", () => this.handleCombatAction("change_stance", {stance: "defensive"}), actionsContainer);
    }
    if (this.state.playerStance !== "neutral") {
      this.addCombatButton("Neutral Stance", () => this.handleCombatAction("change_stance", {stance: "neutral"}), actionsContainer);
    }
    
    // Add target area buttons
    this.addCombatButton("Target Head", () => this.handleCombatAction("change_target", {target: "head"}), actionsContainer);
    this.addCombatButton("Target Body", () => this.handleCombatAction("change_target", {target: "body"}), actionsContainer);
    this.addCombatButton("Target Legs", () => this.handleCombatAction("change_target", {target: "legs"}), actionsContainer);
    
    // Add shield status if player has shield
    const shield = window.player.equipment?.offHand;
    if (shield && shield !== "occupied") {
      const shieldTemplate = shield.getTemplate();
      if (shieldTemplate.weaponType?.name === "Shield") {
        let blockChance = shieldTemplate.blockChance || 0;
        if (this.state.playerStance === "defensive") {
          blockChance += 15; // +15% in defensive stance
        }
        this.addCombatButton(`Shield Block: ${blockChance}%`, () => {}, actionsContainer, true);
      }
    }
    
    // Show weapon durability if it has it
    if (weapon && weapon.durability !== undefined) {
      // Calculate durability percentage
      const durabilityPercent = Math.round((weapon.durability / weaponTemplate.maxDurability) * 100);
      let durabilityStatus = ""; 
      
      // Add status text based on percentage
      if (durabilityPercent <= 0) durabilityStatus = " (Broken)";
      else if (durabilityPercent < 20) durabilityStatus = " (Very Poor)";
      else if (durabilityPercent < 40) durabilityStatus = " (Poor)";
      else if (durabilityPercent < 60) durabilityStatus = " (Worn)";
      
      // Only show status if not in excellent condition
      if (durabilityStatus) {
        this.addCombatButton(`Weapon: ${durabilityPercent}%${durabilityStatus}`, () => {}, actionsContainer, true);
      }
      
      // Disable attacks if weapon is broken
      if (weapon.durability <= 0) {
        this.addCombatButton("Weapon Broken!", () => {}, actionsContainer, true);
        // Early return to skip attack options
        this.addCombatButton("Attempt to Flee", () => this.handleCombatAction("flee"), actionsContainer);
        return;
      }
    }
    
    // Get the effective weapon range
    const weaponRange = weaponTemplate ? this.getWeaponRange(weaponTemplate) : 1;
    
    console.log(`Weapon: ${weaponTemplate?.name || 'none'}, Range: ${weaponRange}, Distance: ${this.state.distance}`);
    
    // Get all available attacks considering current weapon, ammo, and distance
    let attacks = [];
    
    // If within weapon range, add weapon attacks
    if (weaponTemplate && this.state.distance <= weaponRange) {
      attacks = attacks.concat(this.getWeaponAttacks(weaponTemplate));
    } else if (weaponTemplate) {
      // Weapon out of range
      this.addCombatButton(`Too far for ${weaponTemplate.name}`, () => {}, actionsContainer, true);
    }
    
    // Always check for javelin attacks separately from main weapon
    if (this.hasCompatibleAmmo(null, "javelin") && this.state.distance >= 1 && this.state.distance <= 2) {
      // If no weapon or weapon is one-handed
      if (!weaponTemplate || (weaponTemplate.hands && weaponTemplate.hands === 1)) {
        if (!attacks.includes("Throw Javelin")) {
          attacks.push("Throw Javelin");
        }
      }
    }
    
    // Default to punch if no weapon and at melee range
    if (attacks.length === 0 && this.state.distance === 0) {
      attacks = ["Punch"];
    }
    
    // Add buttons for each available attack
    for (const attack of attacks) {
      // Skip "No Arrows" etc. which are just informational
      if (attack.startsWith("No ")) {
        this.addCombatButton(attack, () => {}, actionsContainer, true);
      } else {
        this.addCombatButton(attack, () => this.handleCombatAction("attack", {attackType: attack}), actionsContainer);
      }
    }
    
    // Always add flee button
    this.addCombatButton("Attempt to Flee", () => this.handleCombatAction("flee"), actionsContainer);
  },
  
  // Update UI for counter options
  updateCounterOptions: function() {
    const actionsContainer = document.getElementById('combatActions');
    actionsContainer.innerHTML = '';
    
    // Get equipped weapon
    const weapon = window.player.equipment?.mainHand;
    const weaponTemplate = weapon ? weapon.getTemplate() : null;
    
    // In a counter situation, only show attack options
    if (weaponTemplate && weapon.durability > 0) {
      // Get available attacks for weapon
      const attacks = this.getWeaponAttacks(weaponTemplate);
      
      // Add button for each counter attack
      for (const attack of attacks) {
        this.addCombatButton(`Counter: ${attack}`, () => this.handleCombatAction("counter", {attackType: attack}), actionsContainer);
      }
    } else {
      // No weapon or broken weapon - just basic counter
      this.addCombatButton("Counter Punch", () => this.handleCombatAction("counter", {attackType: "Punch"}), actionsContainer);
    }
  },
  
  // Add a button to the combat interface
  addCombatButton: function(label, onClick, container, disabled = false) {
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    if (disabled) btn.className += ' disabled';
    btn.textContent = label;
    if (!disabled) btn.onclick = onClick;
    container.appendChild(btn);
  },
  
  // Add a message to the combat log
  addCombatMessage: function(message) {
    // Add to state log
    this.state.combatLog.push(message);
    
    // Update UI log
    const combatLog = document.getElementById('combatLog');
    const newMessage = document.createElement('p');
    newMessage.textContent = message;
    combatLog.appendChild(newMessage);
    
    // Scroll to bottom
    combatLog.scrollTop = combatLog.scrollHeight;
    
    console.log("Combat Log:", message);
  },
  
  // Get weapon attacks based on weapon type
  getWeaponAttacks: function(weaponTemplate) {
    if (!weaponTemplate) return ["Punch"];
    
    // Get current combat state info
    const distance = this.state.distance;
    const ammo = window.player.equipment?.ammunition;
    
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
        case "Bow":
          // Check for arrows
          if (this.hasCompatibleAmmo(weaponTemplate, "arrow")) {
            availableAttacks = ["Shoot", "Aimed Shot"];
          } else {
            availableAttacks = ["No Arrows"];
          }
          break;
        case "Crossbow":
          // Check for bolts
          if (this.hasCompatibleAmmo(weaponTemplate, "bolt")) {
            availableAttacks = ["Shoot", "Aimed Shot"];
          } else {
            availableAttacks = ["No Bolts"];
          }
          break;
        case "Rifle":
          // Check for shot/bullets
          if (this.hasCompatibleAmmo(weaponTemplate, "shot")) {
            availableAttacks = ["Shoot", "Aimed Shot"];
          } else {
            availableAttacks = ["No Ammunition"];
          }
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
    
    // Special case: Add javelin throw option if:
    // 1. We have javelin ammunition
    // 2. Current distance is appropriate (medium)
    // 3. Main hand weapon isn't two-handed
    if (this.hasCompatibleAmmo(null, "javelin") && 
        distance >= 1 && distance <= 2 &&
        (!weaponTemplate || weaponTemplate.hands !== 2)) {
      availableAttacks.push("Throw Javelin");
    }
    
    console.log("Available attacks:", availableAttacks, "Distance:", distance);
    return availableAttacks;
  },
  
  // Get random enemy attack
  getRandomEnemyAttack: function() {
    // For now, just return a basic attack type
    const attacks = ["Strike", "Slash", "Stab"];
    return attacks[Math.floor(Math.random() * attacks.length)];
  },
  
  // Get random target area
  getRandomTargetArea: function() {
    const areas = ["head", "body", "legs"];
    return areas[Math.floor(Math.random() * areas.length)];
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
      case "Shoot": return 1.3;
      case "Aimed Shot": return 1.8;
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
      case "Shoot": return 0.8;
      case "Aimed Shot": return 0.6;
      default: return 1.0;
    }
  },
  
  // NARRATIVE GENERATION METHODS
  
  // Generate attack narrative
  generateAttackNarrative: function(weaponTemplate, attackType) {
    const enemyName = this.state.enemy.name;
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
      "Shoot": [
        `You take aim with your ${weaponName}, targeting the ${enemyName}'s ${targetArea}.`,
        `Steadying your ${weaponName}, you fire at the ${enemyName}'s ${targetArea}.`,
        `You squeeze the trigger of your ${weaponName}, sending a projectile toward the ${enemyName}'s ${targetArea}.`
      ],
      "Aimed Shot": [
        `You take careful aim with your ${weaponName}, focusing intently on the ${enemyName}'s ${targetArea}.`,
        `Drawing a breath, you steady your ${weaponName} for a precise shot at the ${enemyName}'s ${targetArea}.`,
        `With measured patience, you line up a perfect shot at the ${enemyName}'s ${targetArea}.`
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
    const enemyName = this.state.enemy.name;
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
      "Shoot": [
        `Your shot strikes true, hitting the ${enemyName}'s ${targetArea} for ${damage} damage.`,
        `The projectile finds its target, dealing ${damage} damage to the ${enemyName}.`,
        `Your aim is impeccable, your shot hitting the ${enemyName} for ${damage} damage.`
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
    const enemyName = this.state.enemy.name;
    
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
      "Shoot": [
        `Your shot goes wide, missing the ${enemyName}.`,
        `The ${enemyName} ducks just as you fire, causing your shot to miss.`,
        `The projectile whizzes past, failing to hit its target.`
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
    const enemyName = this.state.enemy.name;
    
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
    const enemyName = this.state.enemy.name;
    const distanceIndex = this.state.distance;
    
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
    const enemyName = this.state.enemy.name;
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
  
  // Generate victory narrative
  generateVictoryNarrative: function() {
    const enemyName = this.state.enemy.name;
    
    const templates = [
      `The ${enemyName} collapses before you, defeated.`,
      `With a final gasp, the ${enemyName} falls to the ground.`,
      `Your attack proves decisive, and the ${enemyName} is vanquished.`,
      `The battle ends as the ${enemyName} crumples beneath your assault.`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  },
  
  // Add getWeaponRange method to properly determine weapon range
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
  
  // Add helper function to check ammunition compatibility
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
  }
};

// Define basic enemy templates
window.ENEMY_TEMPLATES = {
  ARRASI_VAELGORR: {
    name: "Arrasi Vaelgorr",
    description: "Chainmail wearing warriors who skirmish the enemy before a charge and fill in the shield wall. Known to use axes and shields, and carry several javelins or throwing spears.",
    health: 90,
    maxHealth: 90,
    experienceValue: 20,
    lootTable: ["legionShield", "rations"],
    lootChance: 0.3,
    
    // Combat attributes
    power: 9,
    accuracy: 10,
    speed: 8,
    defense: 12,
    counterSkill: 2,
    hasShield: true,
    blockChance: 20,
    armorPenetration: 5,
    
    // Preferred tactics
    preferredDistance: 2, // Starts at medium for javelin throws, then closes in
    preferredStance: "neutral",
    weaponRange: 2, // Can attack at medium range with thrown weapons
    
    // Equipment reference (for narrative purposes)
    weapon: "War Axe and Javelin",
    armor: "Chainmail and Shield"
  },
  
  IMPERIAL_DESERTER: {
    name: "Imperial Deserter",
    description: "A former soldier of the Empire who has abandoned their post. Still equipped with military gear.",
    health: 100,
    maxHealth: 100,
    experienceValue: 25,
    lootTable: ["basic_sword", "legion_armor", "legion_helmet"],
    lootChance: 0.4,
    
    // Combat attributes
    power: 10,
    accuracy: 8,
    speed: 7,
    defense: 10,
    counterSkill: 1,
    hasShield: true,
    blockChance: 15,
    armorPenetration: 0,
    
    // Preferred tactics
    preferredDistance: 1,
    preferredStance: "defensive",
    weaponRange: 1,
    
    // Equipment reference
    weapon: "Military Sword",
    armor: "Legion Armor"
  },
  
  ARRASI_DRUSKARI: {
    name: "Arrasi Druskari",
    description: "Heavy shock infantry, often exiled or sworn clansmen who have pledged their lives to the battlefield. Wield large hewing swords. Have a reputation for fighting until they are literally hacked apart.",
    health: 140,
    maxHealth: 140,
    experienceValue: 35,
    lootTable: ["royalGreatsword", "staminaPotion"],
    lootChance: 0.35,
    
    // Combat attributes
    power: 14,
    accuracy: 7,
    speed: 6,
    defense: 8,
    counterSkill: 3,
    hasShield: false,
    armorPenetration: 20,
    
    // Preferred tactics
    preferredDistance: 1,
    preferredStance: "aggressive",
    weaponRange: 1,
    
    // Equipment reference
    weapon: "Massive Hewing Sword",
    armor: "Heavy Plate"
  }
};

// Initialize the combat system
window.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, initializing combat system");
  window.combatSystem.initialize();
});

// Combat styles are defined in combatUI.js

// Function to update weapon ranges
const updateWeaponRanges = function() {
  // Only update if not already set
  if (!window.WEAPON_TYPES.BOW.range) {
    window.WEAPON_TYPES.SWORD.range = 1;
    window.WEAPON_TYPES.GREATSWORD.range = 1;
    window.WEAPON_TYPES.SPEAR.range = 2;
    window.WEAPON_TYPES.AXE.range = 1;
    window.WEAPON_TYPES.BATTLEAXE.range = 1;
    window.WEAPON_TYPES.BOW.range = 3;
    window.WEAPON_TYPES.CROSSBOW.range = 3;
    window.WEAPON_TYPES.DAGGER.range = 1;
    window.WEAPON_TYPES.SHIELD.range = 1;
    window.WEAPON_TYPES.RIFLE.range = 3;
    window.WEAPON_TYPES.THROWN.range = 2;
    
    console.log("Weapon ranges updated.");
  }
};

// Fix initialization of ammunition to ensure correct capacity
const fixJavelinCapacity = function() {
  // Get equipped javelin pack if any
  const ammo = window.player.equipment?.ammunition;
  if (ammo && ammo.ammoType === 'javelin') {
    // Make sure capacity is correct
    const template = ammo.getTemplate();
    if (template && template.capacity === 6) {
      // Fix capacity if wrong
      if (ammo.capacity !== 6) {
        console.log(`Fixing javelin capacity from ${ammo.capacity} to 6`);
        ammo.capacity = 6;
      }
      
      // Initialize currentAmount if needed
      if (ammo.currentAmount > 6 || ammo.currentAmount === null) {
        console.log(`Fixing javelin count from ${ammo.currentAmount} to 6`);
        ammo.currentAmount = 6;
      }
    }
  }
};

// Function to apply all fixes
window.applyRangedCombatFixes = function() {
  console.log("Applying ranged combat fixes...");
  
  // Update weapon ranges
  updateWeaponRanges();
  
  // Fix javelin capacity
  fixJavelinCapacity();
  
  console.log("Ranged combat fixes applied successfully!");
};

// Automatically apply the fixes when this code runs
window.applyRangedCombatFixes();
