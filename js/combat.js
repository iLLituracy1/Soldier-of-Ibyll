// SIMPLIFIED COMBAT SYSTEM
// Weapon-based turn-based combat system with terrain and distance elements

// Define getCombatActions function if it doesn't exist
if (typeof window.getCombatActions !== 'function') {
  window.getCombatActions = function() {
    // Default combat actions if no weapon is equipped
    const defaultActions = [
      {
        id: "unarmed_strike",
        name: "Unarmed Strike",
        damage: [2, 4],
        toHit: 0,
        actionPoints: 4,
        range: 0,
        description: "A basic unarmed attack"
      },
      {
        id: "dodge",
        name: "Dodge",
        actionPoints: 3,
        description: "Attempt to dodge an incoming attack",
        isSpecial: true,
        effectType: "defense"
      },
      {
        id: "brace",
        name: "Brace",
        actionPoints: 2,
        description: "Brace yourself to reduce incoming damage",
        isSpecial: true,
        effectType: "defense"
      }
    ];
    
    // Check if player has equipment
    if (!window.player || !window.player.equipment) {
      return defaultActions;
    }
    
    // Get the player's weapon
    const weapon = window.player.equipment.weapon;
    if (!weapon) {
      return defaultActions;
    }
    
    // Generate actions based on weapon type
    let weaponActions = [];
    
    // Create weapon-specific actions based on weapon type
    switch(weapon.type) {
      case "SWORD":
        weaponActions = [
          {
            id: "sword_slash",
            name: "Slash",
            damage: [weapon.stats?.damage?.[0] || 4, weapon.stats?.damage?.[1] || 7],
            toHit: (weapon.stats?.toHit || 0) + 5,
            actionPoints: 4,
            range: 1,
            description: "A slashing attack with your sword"
          },
          {
            id: "sword_stab",
            name: "Stab",
            damage: [weapon.stats?.damage?.[0] - 1 || 3, weapon.stats?.damage?.[1] - 1 || 6],
            toHit: (weapon.stats?.toHit || 0) + 10,
            actionPoints: 3,
            range: 1,
            description: "A precise stab with your sword"
          },
          {
            id: "sword_parry",
            name: "Parry",
            actionPoints: 2,
            description: "Enter a defensive stance to parry incoming attacks",
            isSpecial: true,
            effectType: "defense"
          }
        ];
        break;
        
      // Additional cases for CLEAVER, BOW, MATCHLOCK, etc.
      // (full code in the artifact)
    }
    
    // Add defensive options
    const defensiveActions = [
      {
        id: "dodge",
        name: "Dodge",
        actionPoints: 3,
        description: "Attempt to dodge an incoming attack",
        isSpecial: true,
        effectType: "defense"
      },
      {
        id: "brace",
        name: "Brace",
        actionPoints: 2,
        description: "Brace yourself to reduce incoming damage",
        isSpecial: true,
        effectType: "defense"
      }
    ];
    
    // Check for shield
    if (window.player.equipment.offhand && window.player.equipment.offhand.category === "SHIELD") {
      // Add shield actions (shown in full code)
    }
    
    return [...weaponActions, ...defensiveActions];
  };
  
  console.log("Added inline getCombatActions function");
}

// Also define getWeaponActions and getShieldActions
if (typeof window.getWeaponActions !== 'function') {
  window.getWeaponActions = function() {
    const actions = window.getCombatActions();
    return actions.filter(action => !action.isSpecial && action.id !== 'shield_bash');
  };
}

if (typeof window.getShieldActions !== 'function') {
  window.getShieldActions = function() {
    if (!window.player.equipment.offhand || window.player.equipment.offhand.category !== "SHIELD") {
      return [];
    }
    
    return window.getCombatActions().filter(action => 
      action.id === 'shield_block' || action.id === 'shield_bash'
    );
  };
}

// Combat state template
const combatStateTemplate = {
  inBattle: false,
  currentEnemy: null,
  combatTurn: 1,  // Track number of turns for effect duration
  activeCharacter: null, // 'player' or 'enemy'
  combatDistance: 2, // 0-close, 1-medium, 2-far
  playerAP: 0,  // Action Points for player
  enemyAP: 0,   // Action Points for enemy
  maxAP: 10,    // Maximum AP per turn
  terrain: "normal", // normal, rocky, slippery, confined, etc.
  weather: "clear", // clear, rain, fog, wind, heat
  combatLog: [],
  combatEffects: [], // Active effects like bleeding, stun, etc.
  playerBuffs: [],   // Active buffs on player
  enemyBuffs: [],    // Active buffs on enemy
  ambushAdvantage: null // 'player' or 'enemy' if there was an ambush
};

// Initialize combat with a specific enemy type
window.startCombat = function(enemyType, options = {}) {
  // Create enemy
  const enemy = createEnemy(enemyType);
  if (!enemy) {
    console.error(`Failed to create enemy of type: ${enemyType}`);
    return;
  }
  
  // Determine environmental factors
  const environment = determineEnvironmentalFactors();
  
  // Initialize combat state
  window.gameState.combat = JSON.parse(JSON.stringify(combatStateTemplate));
  window.gameState.combat.inBattle = true;
  window.gameState.combat.currentEnemy = enemy;
  window.gameState.combat.terrain = environment.terrain;
  window.gameState.combat.weather = environment.weather;
  
  // Determine starting distance based on environment and enemy type
  if (environment.terrain === "confined") {
    window.gameState.combat.combatDistance = 1; // Medium in confined spaces
  } else if (enemyType.includes("archer") || enemyType.includes("scout")) {
    window.gameState.combat.combatDistance = 2; // Far for ranged enemies
  }
  
  // Check for ambush situation
  if (options.ambush) {
    window.gameState.combat.ambushAdvantage = options.ambush;
  }
  
  // Store original health values
  window.gameState.combat.originalPlayerHealth = window.gameState.health;
  window.gameState.combat.originalEnemyHealth = enemy.health;
  
  // Setup combat UI
  setupCombatUI(enemy, environment);
  
  // Determine who goes first (initiative)
  determineInitiative(enemy);
  
  // Start combat
  beginCombatTurn();
};

// Create an enemy based on enemy type
function createEnemy(enemyType) {
  // Enemy templates
  const enemyTemplates = {
    "arrasi_scout": {
      name: "Arrasi Scout",
      phy: 3,
      men: 3,
      health: 35,
      maxHealth: 35,
      stamina: 70,
      maxStamina: 70,
      skills: {
        melee: 2,
        marksmanship: 3,
        tactics: 2,
        survival: 3
      },
      equipment: {
        weapon: {
          id: "arrasi_shortbow",
          name: "Arrasi Short Bow",
          category: "WEAPON",
          type: "BOW",
          stats: {
            damage: [4, 7],
            toHit: 5,
            critChance: 10
          }
        },
        armor: {
          id: "light_leather",
          name: "Light Leather Armor",
          category: "ARMOR",
          stats: {
            defense: 20
          }
        }
      },
      preferredDistance: 2, // Prefers ranged combat
      tactics: {
        aggressive: 0.2,  // Rarely aggressive
        defensive: 0.3,   // Sometimes defensive
        cautious: 0.5     // Often cautious
      },
      description: "A lightly armored scout from the Arrasi tribes. Quick and precise with a preference for ranged attacks."
    },
    
    "arrasi_warrior": {
      name: "Arrasi Warrior",
      phy: 5,
      men: 2,
      health: 50,
      maxHealth: 50,
      stamina: 80,
      maxStamina: 80,
      skills: {
        melee: 4,
        marksmanship: 1,
        tactics: 1,
        survival: 2
      },
      equipment: {
        weapon: {
          id: "arrasi_axe",
          name: "Arrasi War Axe",
          category: "WEAPON",
          type: "AXE",
          stats: {
            damage: [6, 10],
            toHit: 0,
            critChance: 10
          }
        },
        armor: {
          id: "arrasi_mail",
          name: "Arrasi Mail",
          category: "ARMOR",
          stats: {
            defense: 30
          }
        },
        shield: {
          id: "tribal_shield",
          name: "Tribal Shield",
          category: "SHIELD",
          stats: {
            defense: 15,
            blockChance: 25
          }
        }
      },
      preferredDistance: 0, // Prefers close combat
      tactics: {
        aggressive: 0.6,  // Often aggressive
        defensive: 0.3,   // Sometimes defensive
        cautious: 0.1     // Rarely cautious
      },
      description: "A hardened tribal warrior wielding an axe and shield. Prefers to close distance and engage in melee combat."
    },
    
    "imperial_deserter": {
      name: "Imperial Deserter",
      phy: 4,
      men: 3,
      health: 40,
      maxHealth: 40,
      stamina: 75,
      maxStamina: 75,
      skills: {
        melee: 3,
        marksmanship: 2,
        tactics: 2,
        survival: 2
      },
      equipment: {
        weapon: {
          id: "imperial_sword",
          name: "Imperial Sword",
          category: "WEAPON",
          type: "SWORD",
          stats: {
            damage: [5, 8],
            toHit: 5,
            critChance: 5
          }
        },
        armor: {
          id: "worn_mail",
          name: "Worn Mail Shirt",
          category: "ARMOR",
          stats: {
            defense: 25
          }
        }
      },
      preferredDistance: 1, // Comfortable at medium range
      tactics: {
        aggressive: 0.3,  // Sometimes aggressive
        defensive: 0.4,   // Often defensive
        cautious: 0.3     // Sometimes cautious
      },
      description: "A former soldier who abandoned their post. Desperate and dangerous, but has military training."
    },
    
    "wild_beast": {
      name: "Wild Beast",
      phy: 6,
      men: 1,
      health: 45,
      maxHealth: 45,
      stamina: 90,
      maxStamina: 90,
      skills: {
        melee: 3,
        survival: 4
      },
      equipment: {
        // Natural weapons
        weapon: {
          id: "beast_claws",
          name: "Sharp Claws",
          category: "WEAPON",
          type: "CLEAVER", // Using cleaver mechanics for natural weapons
          stats: {
            damage: [5, 9],
            toHit: 0,
            critChance: 15
          }
        },
        // Natural armor
        armor: {
          id: "thick_hide",
          name: "Thick Hide",
          category: "ARMOR",
          stats: {
            defense: 15
          }
        }
      },
      preferredDistance: 0, // Must be in close range
      tactics: {
        aggressive: 0.8,  // Very aggressive
        defensive: 0.1,   // Rarely defensive
        cautious: 0.1     // Rarely cautious
      },
      description: "A large predator native to these lands, driven to attack by hunger. Extremely aggressive in close combat."
    }
  };
  
  // Get the template
  const template = enemyTemplates[enemyType];
  if (!template) return null;
  
  // Create a copy to avoid modifying the template
  return JSON.parse(JSON.stringify(template));
}

// Determine environmental factors for combat
function determineEnvironmentalFactors() {
  // Base the terrain and weather on current game conditions or random chance
  let terrain = "normal";
  let weather = window.gameState.weather || "clear";
  
  // 40% chance for special terrain based on location
  if (Math.random() < 0.4) {
    const terrainOptions = ["normal", "rocky", "slippery", "confined"];
    terrain = terrainOptions[Math.floor(Math.random() * terrainOptions.length)];
  }
  
  // If game already has weather, use it, otherwise randomize for combat
  if (weather === "clear" && Math.random() < 0.3) {
    const weatherOptions = ["clear", "rain", "fog", "wind", "heat"];
    weather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
  }
  
  // Special case: if weather is rainy and terrain is normal, 50% chance to make it slippery
  if (weather === "rain" && terrain === "normal" && Math.random() < 0.5) {
    terrain = "slippery";
  }
  
  return { terrain, weather };
}

// Set up the combat UI
function setupCombatUI(enemy, environment) {
  // Prepare combat interface
  document.getElementById('enemyName').textContent = enemy.name;
  
  // Update health displays
  document.getElementById('playerHealthDisplay').textContent = `${Math.round(window.gameState.health)} HP`;
  document.getElementById('enemyHealthDisplay').textContent = `${enemy.health} HP`;
  
  // Update health bars
  document.getElementById('playerCombatHealth').style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
  document.getElementById('enemyCombatHealth').style.width = '100%';
  
  // Clear combat log
  const combatLog = document.getElementById('combatLog');
  combatLog.innerHTML = '';
  
  // Add initial combat description
  addToCombatLog(`Combat begins! You face a ${enemy.name} on ${environment.terrain} terrain in ${environment.weather} weather.`);
  addToCombatLog(enemy.description);
  
  // Display terrain effects
  const terrainEffects = getTerrainEffects(environment.terrain);
  if (terrainEffects) {
    addToCombatLog(`Terrain Effects: ${terrainEffects}`);
  }
  
  // Display weather effects
  const weatherEffects = getWeatherEffects(environment.weather);
  if (weatherEffects) {
    addToCombatLog(`Weather Effects: ${weatherEffects}`);
  }
  
  // Show combat distance
  const distanceText = getDistanceText(window.gameState.combat.combatDistance);
  addToCombatLog(`Starting at ${distanceText} distance.`);
  
  // Create distance indicator
  createDistanceIndicator();
  
  // Show combat interface
  document.getElementById('combatInterface').classList.remove('hidden');
  
  // Hide regular action buttons during combat
  document.getElementById('actions').style.display = 'none';
}

// Get description of terrain effects
function getTerrainEffects(terrain) {
  switch(terrain) {
    case "rocky":
      return "Uneven ground gives a bonus to ranged attacks from high positions, but makes movement difficult.";
    case "slippery":
      return "Wet or icy ground increases chance of movement failures and makes dodging harder.";
    case "confined":
      return "Limited space restricts maximum distance and gives advantage to melee combat.";
    default:
      return null;
  }
}

// Get description of weather effects
function getWeatherEffects(weather) {
  switch(weather) {
    case "rain":
      return "Rainfall reduces visibility and may affect ranged weapons.";
    case "fog":
      return "Thick fog severely limits visibility and accuracy of ranged attacks.";
    case "wind":
      return "Strong winds affect trajectory of ranged attacks.";
    case "heat":
      return "Sweltering heat causes stamina to drain more quickly.";
    default:
      return null;
  }
}

// Create distance indicator for combat UI
function createDistanceIndicator() {
  // Check if container exists already
  let distanceContainer = document.getElementById('distanceContainer');
  
  if (!distanceContainer) {
    // Create container
    distanceContainer = document.createElement('div');
    distanceContainer.id = 'distanceContainer';
    distanceContainer.style.margin = '15px 0';
    distanceContainer.style.textAlign = 'center';
    
    // Create label
    const distanceLabel = document.createElement('div');
    distanceLabel.textContent = 'Combat Distance:';
    distanceLabel.style.marginBottom = '5px';
    distanceContainer.appendChild(distanceLabel);
    
    // Create distance bar
    const distanceBar = document.createElement('div');
    distanceBar.style.height = '20px';
    distanceBar.style.width = '100%';
    distanceBar.style.background = '#333';
    distanceBar.style.borderRadius = '10px';
    distanceBar.style.position = 'relative';
    
    // Add distance markers
    const distances = ['Close', 'Medium', 'Far'];
    distances.forEach((label, index) => {
      const marker = document.createElement('div');
      marker.textContent = label;
      marker.style.position = 'absolute';
      marker.style.top = '-20px';
      marker.style.left = `${index * 50}%`;
      marker.style.transform = 'translateX(-50%)';
      distanceBar.appendChild(marker);
    });
    
    // Add position indicator
    const positionMarker = document.createElement('div');
    positionMarker.id = 'distanceMarker';
    positionMarker.style.width = '20px';
    positionMarker.style.height = '20px';
    positionMarker.style.background = '#4b6bff';
    positionMarker.style.borderRadius = '50%';
    positionMarker.style.position = 'absolute';
    positionMarker.style.top = '0';
    positionMarker.style.left = '0';
    positionMarker.style.transform = 'translateX(-50%)';
    positionMarker.style.transition = 'left 0.3s ease';
    distanceBar.appendChild(positionMarker);
    
    distanceContainer.appendChild(distanceBar);
    
    // Insert after combat header
    const combatHeader = document.getElementById('combatHeader');
    combatHeader.parentNode.insertBefore(distanceContainer, combatHeader.nextSibling);
  }
  
  // Update position marker
  updateDistanceIndicator();
}

// Update the distance indicator
function updateDistanceIndicator() {
  const marker = document.getElementById('distanceMarker');
  if (marker) {
    // Calculate position based on distance (0 = 0%, 1 = 50%, 2 = 100%)
    const position = window.gameState.combat.combatDistance * 50;
    marker.style.left = `${position}%`;
  }
}

// Get text description for distance
function getDistanceText(distance) {
  switch(distance) {
    case 0: return "close";
    case 1: return "medium";
    case 2: return "far";
    default: return "unknown";
  }
}

// Determine initiative (who goes first)
function determineInitiative(enemy) {
  // Base player initiative on skills and PHY/MEN
  let playerInitiative = (window.player.skills.tactics || 0) * 2 + 
                         (window.player.phy || 0) + 
                         (window.player.men || 0);
  
  // Base enemy initiative on similar calculations                     
  let enemyInitiative = (enemy.skills.tactics || 0) * 2 +
                        (enemy.phy || 0) +
                        (enemy.men || 0);
  
  // Add randomness element
  playerInitiative += Math.floor(Math.random() * 6); // d6 roll
  enemyInitiative += Math.floor(Math.random() * 6);  // d6 roll
  
  // Apply ambush advantage if applicable
  if (window.gameState.combat.ambushAdvantage === 'player') {
    playerInitiative += 10; // Huge advantage for ambusher
    addToCombatLog("You've caught the enemy by surprise!");
  } else if (window.gameState.combat.ambushAdvantage === 'enemy') {
    enemyInitiative += 10;
    addToCombatLog("The enemy has ambushed you!");
  }
  
  // Determine who goes first
  if (playerInitiative >= enemyInitiative) {
    window.gameState.combat.activeCharacter = 'player';
    addToCombatLog("You have the initiative!");
  } else {
    window.gameState.combat.activeCharacter = 'enemy';
    addToCombatLog("The enemy has the initiative!");
  }
  
  // Store initiative values for potential future use
  window.gameState.combat.playerInitiative = playerInitiative;
  window.gameState.combat.enemyInitiative = enemyInitiative;
}

// Begin a new combat turn
function beginCombatTurn() {
  // Process ongoing effects
  processCombatEffects();
  
  // Determine action points for both sides
  calculateActionPoints();
  
  // Update combat log
  addToCombatLog(`Turn ${window.gameState.combat.combatTurn}: ${window.gameState.combat.activeCharacter === 'player' ? 'Your' : 'Enemy\'s'} turn.`);
  
  if (window.gameState.combat.activeCharacter === 'player') {
    // Player's turn - show available actions
    addToCombatLog(`You have ${window.gameState.combat.playerAP} action points.`);
    showPlayerActions();
  } else {
    // Enemy's turn - process AI decision
    addToCombatLog(`Enemy has ${window.gameState.combat.enemyAP} action points.`);
    setTimeout(() => {
      processEnemyTurn();
    }, 500); // Small delay for UI
  }
}

// Process ongoing combat effects
function processCombatEffects() {
  // Process each active effect
  const effects = window.gameState.combat.combatEffects;
  const newEffects = [];
  
  for (let i = 0; i < effects.length; i++) {
    const effect = effects[i];
    
    // Check if effect has expired
    if (effect.duration <= 1) {
      addToCombatLog(`${effect.name} effect has expired.`);
    } else {
      // Process effect
      if (effect.type === 'bleed') {
        // Apply bleeding damage
        const target = effect.target;
        const damage = effect.value;
        
        if (target === 'player') {
          window.gameState.health = Math.max(1, window.gameState.health - damage);
          document.getElementById('playerHealthDisplay').textContent = `${Math.round(window.gameState.health)} HP`;
          document.getElementById('playerCombatHealth').style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
          addToCombatLog(`You take ${damage} bleeding damage.`);
        } else if (target === 'enemy') {
          const enemy = window.gameState.combat.currentEnemy;
          enemy.health = Math.max(0, enemy.health - damage);
          document.getElementById('enemyHealthDisplay').textContent = `${enemy.health} HP`;
          document.getElementById('enemyCombatHealth').style.width = `${(enemy.health / enemy.maxHealth) * 100}%`;
          addToCombatLog(`Enemy takes ${damage} bleeding damage.`);
        }
      }
      
      // Decrease duration and keep effect if it's still active
      effect.duration--;
      newEffects.push(effect);
    }
  }
  
  // Update combat effects
  window.gameState.combat.combatEffects = newEffects;
  
  // Check combat end conditions
  checkCombatEndConditions();
}

// Calculate action points for combat turns
function calculateActionPoints() {
  const player = window.player;
  const enemy = window.gameState.combat.currentEnemy;
  const maxAP = window.gameState.combat.maxAP;
  
  // Base AP on PHY and MEN attributes
  let playerAP = 5 + Math.floor((player.phy + player.men) / 3);
  let enemyAP = 5 + Math.floor((enemy.phy + enemy.men) / 3);
  
  // Apply stamina modifiers
  const playerStaminaPercent = window.gameState.stamina / window.gameState.maxStamina;
  const enemyStaminaPercent = enemy.stamina / enemy.maxStamina;
  
  // Reduce AP if low on stamina
  if (playerStaminaPercent < 0.5) {
    playerAP -= Math.floor((0.5 - playerStaminaPercent) * 10);
  }
  
  if (enemyStaminaPercent < 0.5) {
    enemyAP -= Math.floor((0.5 - enemyStaminaPercent) * 10);
  }
  
  // Apply stun effects
  if (hasEffect('player', 'stun')) {
    playerAP = Math.floor(playerAP / 2);
    addToCombatLog("You are stunned and have reduced action points.");
  }
  
  if (hasEffect('enemy', 'stun')) {
    enemyAP = Math.floor(enemyAP / 2);
    addToCombatLog("The enemy is stunned and has reduced action points.");
  }
  
  // Weather effects - heat reduces AP
  if (window.gameState.combat.weather === 'heat') {
    playerAP -= 1;
    enemyAP -= 1;
  }
  
  // Ensure minimum AP
  playerAP = Math.max(2, playerAP);
  enemyAP = Math.max(2, enemyAP);
  
  // Cap maximum AP
  playerAP = Math.min(maxAP, playerAP);
  enemyAP = Math.min(maxAP, enemyAP);
  
  // Store calculated AP
  window.gameState.combat.playerAP = playerAP;
  window.gameState.combat.enemyAP = enemyAP;
}

// Check if a combatant has a specific effect
function hasEffect(target, effectType) {
  return window.gameState.combat.combatEffects.some(
    effect => effect.target === target && effect.type === effectType
  );
}

// Add an effect to a combatant
function addEffect(target, effectType, value, duration, name) {
  // Check if effect already exists
  const existingEffectIndex = window.gameState.combat.combatEffects.findIndex(
    effect => effect.target === target && effect.type === effectType
  );
  
  if (existingEffectIndex !== -1) {
    // Update existing effect
    const effect = window.gameState.combat.combatEffects[existingEffectIndex];
    // Either extend duration or use the longer duration
    effect.duration = Math.max(effect.duration, duration);
    // Use the higher value
    effect.value = Math.max(effect.value, value);
  } else {
    // Add new effect
    window.gameState.combat.combatEffects.push({
      target: target,
      type: effectType,
      value: value,
      duration: duration,
      name: name
    });
  }
  
  addToCombatLog(`${target === 'player' ? 'You are' : 'Enemy is'} affected by ${name}.`);
}

// Show available player actions
function showPlayerActions() {
  const combatActions = document.getElementById('combatActions');
  combatActions.innerHTML = '';
  
  // Get remaining AP
  const remainingAP = window.gameState.combat.playerAP;
  
  // If no AP left, add end turn button
  if (remainingAP <= 0) {
    addCombatButton('End Turn', 'end_turn', combatActions);
    return;
  }
  
  // Get all available combat actions
  const availableActions = window.getCombatActions();
  
  // Filter actions based on AP and distance
  const currentDistance = window.gameState.combat.combatDistance;
  const filteredActions = availableActions.filter(action => {
    // Check if enough AP
    if (action.actionPoints > remainingAP) return false;
    
    // Check if valid at current distance
    if (action.range !== undefined && action.range < currentDistance) return false;
    
    return true;
  });
  
  // Distance change options
  if (currentDistance < 2) {
    addCombatButton('Retreat (2 AP)', 'retreat', combatActions);
  }
  
  if (currentDistance > 0) {
    addCombatButton('Advance (2 AP)', 'advance', combatActions);
  }
  
  // Movement then attack combination button if enough AP
  if (currentDistance === 2 && remainingAP >= 6) {
    const playerWeapon = window.player.equipment.weapon;
    if (playerWeapon && window.WEAPON_TYPES[playerWeapon.type].range < 2) {
      addCombatButton('Charge Attack (6 AP)', 'charge_attack', combatActions);
    }
  }
  
  // Sort actions by type
  const attackActions = filteredActions.filter(action => !action.isSpecial);
  const specialActions = filteredActions.filter(action => action.isSpecial);
  
  // Add attack actions
  if (attackActions.length > 0) {
    attackActions.forEach(action => {
      let buttonText = `${action.name} (${action.actionPoints} AP)`;
      if (action.damage) {
        buttonText += ` [${action.damage[0]}-${action.damage[1]}]`;
      }
      addCombatButton(buttonText, action.id, combatActions);
    });
  }
  
  // Add special actions
  if (specialActions.length > 0) {
    specialActions.forEach(action => {
      addCombatButton(`${action.name} (${action.actionPoints} AP)`, action.id, combatActions);
    });
  }
  
  // Add utility buttons
  addCombatButton('End Turn', 'end_turn', combatActions);
  
  // Add retreat from battle button
  if (currentDistance === 2) {
    addCombatButton('Flee Battle', 'flee_battle', combatActions);
  }
}

// Add a button to the combat actions area
function addCombatButton(text, action, container) {
  const button = document.createElement('button');
  button.className = 'action-btn';
  button.textContent = text;
  button.onclick = function() {
    handleCombatAction(action);
  };
  container.appendChild(button);
}

// Handle player combat action
function handleCombatAction(action) {
  // Get current state
  const combat = window.gameState.combat;
  const remainingAP = combat.playerAP;
  
  // Check if this is a system action
  if (action === 'end_turn') {
    endPlayerTurn();
    return;
  }
  
  if (action === 'flee_battle') {
    attemptToFlee();
    return;
  }
  
  // Distance change actions
  if (action === 'retreat') {
    if (remainingAP >= 2 && combat.combatDistance < 2) {
      // Check for potential terrain failures
      if (combat.terrain === 'slippery' && Math.random() < 0.3) {
        addToCombatLog("You slip while trying to retreat!");
        combat.playerAP -= 2; // Still costs AP
        
        // Check for enemy opportunity attack
        if (combat.combatDistance === 0 && Math.random() < 0.5) {
          addToCombatLog("The enemy takes advantage of your stumble!");
          executeOpportunityAttack('enemy');
        }
      } else {
        combat.combatDistance += 1;
        combat.playerAP -= 2;
        addToCombatLog(`You move back to ${getDistanceText(combat.combatDistance)} distance.`);
        updateDistanceIndicator();
      }
      
      // Update available actions
      showPlayerActions();
      return;
    }
  }
  
  if (action === 'advance') {
    if (remainingAP >= 2 && combat.combatDistance > 0) {
      // Check for potential terrain failures
      if (combat.terrain === 'slippery' && Math.random() < 0.3) {
        addToCombatLog("You slip while trying to advance!");
        combat.playerAP -= 2; // Still costs AP
      } else {
        combat.combatDistance -= 1;
        combat.playerAP -= 2;
        addToCombatLog(`You move forward to ${getDistanceText(combat.combatDistance)} distance.`);
        updateDistanceIndicator();
      }
      
      // Update available actions
      showPlayerActions();
      return;
    }
  }
  
  // Charge attack (move then attack combo)
  if (action === 'charge_attack') {
    if (remainingAP >= 6 && combat.combatDistance === 2) {
      // Move to close distance then attack
      combat.combatDistance = 0;
      combat.playerAP -= 4; // 4 AP for movement
      addToCombatLog("You charge forward into melee range!");
      updateDistanceIndicator();
      
      // Execute an attack with bonus damage
      const weapon = window.player.equipment.weapon;
      if (weapon) {
        const weaponType = window.WEAPON_TYPES[weapon.type];
        if (weaponType && weaponType.attacks && weaponType.attacks.length > 0) {
          // Use first attack of weapon with +25% damage bonus
          const attackType = weaponType.attacks[0];
          executePlayerAttack(attackType, 2, 1.25); // 2 AP for the attack, 25% damage bonus
          return;
        }
      }
      
      // Fallback if no weapon
      executePlayerAttack('unarmed_strike', 2);
      return;
    }
  }
  
  // Find the action data
  const availableActions = window.getCombatActions();
  const actionData = availableActions.find(a => a.id === action);
  
  if (!actionData) {
    console.error(`Action not found: ${action}`);
    return;
  }
  
  // Check if enough AP
  if (actionData.actionPoints > remainingAP) {
    addToCombatLog("Not enough action points for this action.");
    return;
  }
  
  // Process different action types
  if (actionData.isSpecial) {
    // Special abilities
    executePlayerSpecialAbility(actionData);
  } else {
    // Regular attacks
    executePlayerAttack(action, actionData.actionPoints);
  }
}

// Execute a player attack
function executePlayerAttack(attackType, apCost, damageMultiplier = 1) {
  const combat = window.gameState.combat;
  const enemy = combat.currentEnemy;
  
  // Check for ranged attack with no ammo
  const weapon = window.player.equipment.weapon;
  const isRangedWeapon = weapon && weapon.type && 
                         ['BOW', 'CROSSBOW', 'MATCHLOCK'].includes(weapon.type);
  
  if (isRangedWeapon && !window.hasEnoughAmmo()) {
    addToCombatLog("You don't have enough ammunition!");
    return;
  }
  
  // Get attack details
  const attackDetails = getAttackDetails(attackType);
  
  // Reduce AP
  combat.playerAP -= apCost;
  
  // If ranged, consume ammo
  if (isRangedWeapon) {
    window.consumeAmmo();
  }
  
  // Calculate to-hit chance
  let toHitChance = 65 + attackDetails.toHitMod; // Base 65% chance
  
  // Apply skill bonuses
  if (attackType.includes('stab') || attackType.includes('slash')) {
    toHitChance += (window.player.skills.melee || 0) * 3;
  } else if (attackType.includes('shot')) {
    toHitChance += (window.player.skills.marksmanship || 0) * 3;
  }
  
  // Apply stance and distance modifiers
  if (combat.combatDistance > 1 && !attackType.includes('shot')) {
    toHitChance -= 20; // Hard to hit at range with melee
  }
  
  // Apply terrain and weather modifiers
  if (combat.weather === 'fog' && combat.combatDistance > 0) {
    toHitChance -= 15; // Hard to see at range in fog
  }
  
  if (combat.weather === 'rain' && isRangedWeapon) {
    toHitChance -= 10; // Rain affects ranged weapons
  }
  
  if (combat.terrain === 'rocky' && combat.combatDistance > 0) {
    toHitChance += 5; // Slight bonus for ranged from rocky terrain
  }
  
  // Apply enemy defense from equipment
  const enemyDefense = calculateEnemyDefense();
  toHitChance -= Math.floor(enemyDefense / 5); // Reduce hit chance based on armor
  
  // Apply stagger effect
  if (hasEffect('enemy', 'stun')) {
    toHitChance += 15; // Easier to hit stunned enemy
  }
  
  // Cap hit chance
  toHitChance = Math.max(5, Math.min(95, toHitChance));
  
  // Roll to hit
  const hitRoll = Math.floor(Math.random() * 100) + 1;
  
  if (hitRoll <= toHitChance) {
    // Hit! Calculate damage
    let damage = attackDetails.damage;
    
    // Apply damage multiplier
    damage = Math.round(damage * damageMultiplier);
    
    // Apply enemy defense reduction
    const defenseReduction = Math.min(damage - 1, Math.floor(enemyDefense / 3));
    damage -= defenseReduction;
    
    // Check for critical hit (10% base chance)
    let critChance = 10;
    if (weapon && weapon.stats && weapon.stats.critChance) {
      critChance = weapon.stats.critChance;
    }
    
    const critRoll = Math.floor(Math.random() * 100) + 1;
    let isCrit = false;
    
    if (critRoll <= critChance) {
      damage = Math.floor(damage * 1.5);
      isCrit = true;
    }
    
    // Apply damage to enemy
    enemy.health = Math.max(0, enemy.health - damage);
    
    // Update enemy health display
    document.getElementById('enemyHealthDisplay').textContent = `${enemy.health} HP`;
    document.getElementById('enemyCombatHealth').style.width = `${Math.max(0, (enemy.health / enemy.maxHealth) * 100)}%`;
    
    // Log the attack
    if (isCrit) {
      addToCombatLog(`Critical hit! Your ${attackDetails.name} deals ${damage} damage.`);
    } else {
      addToCombatLog(`Your ${attackDetails.name} hits for ${damage} damage.`);
    }
    
    // Apply special effects based on weapon/attack type
    applyAttackEffects(attackType, 'enemy');
    
    // Use stamina
    window.gameState.stamina = Math.max(0, window.gameState.stamina - 5);
  } else {
    // Miss
    addToCombatLog(`Your ${attackDetails.name} misses.`);
    
    // Use less stamina for a miss
    window.gameState.stamina = Math.max(0, window.gameState.stamina - 3);
  }
  
  // Update UI
  window.updateStatusBars();
  
  // After attack, show updated actions
  showPlayerActions();
  
  // Check combat end conditions
  checkCombatEndConditions();
}

// Get attack details based on attack type
function getAttackDetails(attackType) {
  // Default values
  let toHitMod = 0;
  let damage = 3;
  let name = "Attack";
  
  // Check if this is an unarmed attack
  if (attackType === 'unarmed_strike') {
    return {
      name: "Unarmed Strike",
      damage: 2,
      toHitMod: 0
    };
  }
  
  // Check if it's a weapon attack
  const weapon = window.player.equipment.weapon;
  if (!weapon) {
    return {
      name: "Unarmed Strike",
      damage: 2,
      toHitMod: 0
    };
  }
  
  // Base damage on weapon
  const baseDamageLow = weapon.stats.damage[0];
  const baseDamageHigh = weapon.stats.damage[1];
  
  // Attack-specific modifications
  if (attackType.includes('slash')) {
    name = "Slash";
    toHitMod = 5;
    damage = Math.floor(Math.random() * (baseDamageHigh - baseDamageLow + 1)) + baseDamageLow;
  } else if (attackType.includes('stab')) {
    name = "Stab";
    toHitMod = 10;
    damage = Math.floor(Math.random() * (baseDamageHigh - baseDamageLow)) + baseDamageLow;
  } else if (attackType.includes('chop')) {
    name = "Chop";
    toHitMod = 0;
    damage = Math.floor(Math.random() * (baseDamageHigh - baseDamageLow + 1)) + baseDamageLow + 1;
  } else if (attackType.includes('heft')) {
    name = "Hefty Swing";
    toHitMod = -10;
    damage = Math.floor(Math.random() * (baseDamageHigh - baseDamageLow + 1)) + baseDamageLow + 2;
  } else if (attackType.includes('quick_shot')) {
    name = "Quick Shot";
    toHitMod = -5;
    damage = Math.floor(Math.random() * (baseDamageHigh - baseDamageLow)) + baseDamageLow;
  } else if (attackType.includes('aimed_shot')) {
    name = "Aimed Shot";
    toHitMod = 10;
    damage = Math.floor(Math.random() * (baseDamageHigh - baseDamageLow + 1)) + baseDamageLow + 1;
  } else if (attackType.includes('shield_bash')) {
    name = "Shield Bash";
    toHitMod = 0;
    // Shield bash uses shield stats + some base damage
    const shield = window.player.equipment.offhand;
    if (shield && shield.category === "SHIELD") {
      damage = 2 + Math.floor(shield.stats.defense / 5);
    } else {
      damage = 2;
    }
  }
  
  return {
    name,
    damage,
    toHitMod
  };
}

// Calculate enemy defense from equipment
function calculateEnemyDefense() {
  const enemy = window.gameState.combat.currentEnemy;
  let defense = 0;
  
  // Add armor defense
  if (enemy.equipment.armor) {
    defense += enemy.equipment.armor.stats.defense || 0;
  }
  
  // Add shield defense if at appropriate distance
  if (enemy.equipment.shield && window.gameState.combat.combatDistance <= 1) {
    defense += enemy.equipment.shield.stats.defense || 0;
  }
  
  // Apply any defense buffs/debuffs
  if (hasEffect('enemy', 'defense_up')) {
    defense = Math.floor(defense * 1.25);
  }
  
  if (hasEffect('enemy', 'defense_down')) {
    defense = Math.floor(defense * 0.75);
  }
  
  return defense;
}

// Apply special effects based on attack type
function applyAttackEffects(attackType, target) {
  // Weapon-specific effects
  if (attackType.includes('cleaver') || attackType.includes('chop')) {
    // Cleavers have chance to cause bleeding
    if (Math.random() < 0.25) {
      addEffect(target, 'bleed', 2, 3, 'Bleeding');
    }
  } else if (attackType.includes('mace') || attackType.includes('shield_bash')) {
    // Maces and shield bashes have chance to stun
    if (Math.random() < 0.20) {
      addEffect(target, 'stun', 0, 1, 'Stunned');
    }
  } else if (attackType.includes('axe') && target === 'enemy') {
    // Axes have chance to break shields
    const enemy = window.gameState.combat.currentEnemy;
    if (enemy.equipment.shield && Math.random() < 0.15) {
      addToCombatLog("Your axe damages the enemy's shield!");
      enemy.equipment.shield.stats.defense = Math.max(0, enemy.equipment.shield.stats.defense - 5);
    }
  }
}

// Execute a player special ability
function executePlayerSpecialAbility(actionData) {
  const combat = window.gameState.combat;
  const enemy = combat.currentEnemy;
  
  // Reduce AP
  combat.playerAP -= actionData.actionPoints;
  
  // Process different special abilities
  switch (actionData.id) {
    case 'dodge':
      // Increase dodge chance for next enemy attack
      addEffect('player', 'dodge_up', 25, 1, 'Evasive Stance');
      addToCombatLog("You prepare to dodge the next attack.");
      break;
      
    case 'brace':
      // Reduce incoming damage
      addEffect('player', 'damage_resist', 30, 1, 'Braced Stance');
      addToCombatLog("You brace yourself, reducing incoming damage.");
      break;
      
    case 'shield_block':
      // Increase block chance
      addEffect('player', 'block_up', 30, 1, 'Shield Block');
      addToCombatLog("You raise your shield, preparing to block incoming attacks.");
      break;
      
    case 'sword_parry':
      // Parry has chance to counter
      addEffect('player', 'parry', 20, 1, 'Parry Stance');
      addToCombatLog("You prepare to parry the next attack.");
      break;
      
    case 'axe_shield_break':
      // Special shield break attack
      if (enemy.equipment.shield) {
        const damage = 10;
        enemy.equipment.shield.stats.defense = Math.max(0, enemy.equipment.shield.stats.defense - damage);
        addToCombatLog(`Your powerful strike damages the enemy's shield, reducing its defense by ${damage}.`);
      } else {
        // If no shield, deal damage instead
        const damage = 5;
        enemy.health = Math.max(0, enemy.health - damage);
        document.getElementById('enemyHealthDisplay').textContent = `${enemy.health} HP`;
        document.getElementById('enemyCombatHealth').style.width = `${Math.max(0, (enemy.health / enemy.maxHealth) * 100)}%`;
        addToCombatLog(`Your attack strikes the enemy for ${damage} damage.`);
      }
      break;
      
    case 'cleaver_bleed':
      // Guaranteed bleeding attack
      executePlayerAttack('cleaver_chop', 0); // 0 additional AP cost
      addEffect('enemy', 'bleed', 3, 3, 'Severe Bleeding');
      break;
      
    default:
      // Generic special ability
      addToCombatLog(`You use ${actionData.name}.`);
      break;
  }
  
  // Use stamina
  window.gameState.stamina = Math.max(0, window.gameState.stamina - 5);
  
  // Update UI
  window.updateStatusBars();
  
  // After ability, show updated actions
  showPlayerActions();
  
  // Check combat end conditions
  checkCombatEndConditions();
}

// End player turn and start enemy turn
function endPlayerTurn() {
  // Reset player AP
  window.gameState.combat.playerAP = 0;
  
  // Switch active character
  window.gameState.combat.activeCharacter = 'enemy';
  
  // Add turn end to combat log
  addToCombatLog("You end your turn.");
  
  // Process enemy turn after a short delay
  setTimeout(() => {
    processEnemyTurn();
  }, 500);
}

// Process the enemy's turn
function processEnemyTurn() {
  const combat = window.gameState.combat;
  const enemy = combat.currentEnemy;
  const currentDistance = combat.combatDistance;
  
  // If this function is called multiple times, prevent it
  if (combat.activeCharacter !== 'enemy') return;
  
  // If enemy has no AP left, end their turn
  if (combat.enemyAP <= 0) {
    endEnemyTurn();
    return;
  }
  
  // Get enemy preferred distance and tactics
  const preferredDistance = enemy.preferredDistance;
  const tactics = enemy.tactics;
  
  // Determine enemy action based on situation
  let action = null;
  
  // Move to preferred distance if needed and possible
  if (currentDistance !== preferredDistance && combat.enemyAP >= 2) {
    if (currentDistance < preferredDistance) {
      // Try to retreat
      action = 'retreat';
    } else if (currentDistance > preferredDistance) {
      // Try to advance
      action = 'advance';
    }
  } 
  // If already at preferred distance or can't move, attack or use special
  else {
    // Determine action based on tactics
    let tactic = 'aggressive';
    const roll = Math.random();
    let cumulative = 0;
    
    for (const [t, chance] of Object.entries(tactics)) {
      cumulative += chance;
      if (roll < cumulative) {
        tactic = t;
        break;
      }
    }
    
    // Choose action based on tactic
    if (tactic === 'aggressive') {
      // Prefer attack
      if (canEnemyAttack()) {
        action = 'attack';
      } else if (combat.enemyAP >= 2) {
        action = 'advance';
      }
    } else if (tactic === 'defensive') {
      // Prefer defense if health is low
      if (enemy.health < enemy.maxHealth * 0.4 && combat.enemyAP >= 2) {
        action = 'defend';
      } else if (canEnemyAttack()) {
        action = 'attack';
      }
    } else if (tactic === 'cautious') {
      // Mix of advance, attack, and retreat based on health
      if (enemy.health < enemy.maxHealth * 0.3 && currentDistance < 2 && combat.enemyAP >= 2) {
        action = 'retreat';
      } else if (canEnemyAttack()) {
        action = 'attack';
      } else if (combat.enemyAP >= 2) {
        action = 'advance';
      }
    }
  }
  
  // If no action determined or not enough AP, end turn
  if (!action || (action === 'attack' && !canEnemyAttack())) {
    endEnemyTurn();
    return;
  }
  
  // Execute the chosen action
  executeEnemyAction(action);
}

// Check if enemy can attack at current distance
function canEnemyAttack() {
  const combat = window.gameState.combat;
  const enemy = combat.currentEnemy;
  const currentDistance = combat.combatDistance;
  
  // Check if enemy has a weapon
  if (!enemy.equipment.weapon) return false;
  
  // Get weapon type
  const weaponType = enemy.equipment.weapon.type;
  
  // Determine weapon range based on type
  let range = 0;
  
  if (weaponType === 'BOW' || weaponType === 'CROSSBOW') {
    range = 2; // Bows and crossbows can attack at any distance
  } else if (weaponType === 'SPEAR' || weaponType === 'POLEARM') {
    range = 1; // Spears and polearms can attack at close and medium
  } else {
    range = 0; // Most weapons are melee only
  }
  
  // Check if current distance is within weapon range
  return currentDistance <= range;
}

// Execute an enemy action
function executeEnemyAction(action) {
  const combat = window.gameState.combat;
  const enemy = combat.currentEnemy;
  
  // Process based on action type
  if (action === 'retreat') {
    // Try to retreat
    if (combat.enemyAP >= 2 && combat.combatDistance < 2) {
      // Check for terrain failures
      if (combat.terrain === 'slippery' && Math.random() < 0.3) {
        addToCombatLog("The enemy slips while trying to retreat!");
        combat.enemyAP -= 2; // Still costs AP
        
        // Player opportunity attack
        if (combat.combatDistance === 0 && Math.random() < 0.5) {
          addToCombatLog("You take advantage of the enemy's stumble!");
          executeOpportunityAttack('player');
        }
      } else {
        combat.combatDistance += 1;
        combat.enemyAP -= 2;
        addToCombatLog(`The enemy moves back to ${getDistanceText(combat.combatDistance)} distance.`);
        updateDistanceIndicator();
      }
      
      // Continue processing enemy turn
      setTimeout(() => {
        processEnemyTurn();
      }, 500);
      return;
    }
  } else if (action === 'advance') {
    // Try to advance
    if (combat.enemyAP >= 2 && combat.combatDistance > 0) {
      // Check for terrain failures
      if (combat.terrain === 'slippery' && Math.random() < 0.3) {
        addToCombatLog("The enemy slips while trying to advance!");
        combat.enemyAP -= 2; // Still costs AP
      } else {
        combat.combatDistance -= 1;
        combat.enemyAP -= 2;
        addToCombatLog(`The enemy moves forward to ${getDistanceText(combat.combatDistance)} distance.`);
        updateDistanceIndicator();
      }
      
      // Continue processing enemy turn
      setTimeout(() => {
        processEnemyTurn();
      }, 500);
      return;
    }
  } else if (action === 'attack') {
    // Execute attack
    executeEnemyAttack();
    return;
  } else if (action === 'defend') {
    // Defensive action
    addEffect('enemy', 'defense_up', 25, 1, 'Defensive Stance');
    addToCombatLog("The enemy takes a defensive posture.");
    combat.enemyAP -= 2;
    
    // Continue processing enemy turn
    setTimeout(() => {
      processEnemyTurn();
    }, 500);
    return;
  }
  
  // If we get here, the action failed or wasn't processed
  endEnemyTurn();
}

// Defensive enemy attack implementation
function executeEnemyAttack(type = "normal") {
  // Ensure all required game state objects exist
  const player = window.player || window.Player.data || {};
  const equipment = player.equipment || {};
  const gameState = window.gameState || {};
  
  // Default values
  const defaultShieldCategory = 'SHIELD';
  const defaultDistance = 2;
  
  // Check if offhand exists and is a shield
  const isShieldEquipped = equipment.offhand && 
    equipment.offhand.category === (defaultShieldCategory) && 
    ((gameState.combatDistance || defaultDistance) <= 1);
  
  // Calculate shield defense with null checks
  const shieldDefense = isShieldEquipped ? 
    (equipment.offhand.stats?.defense || 0) : 0;
  
  // Rest of the enemy attack logic with robust checks
  const playerStance = gameState.combatStance || 'neutral';
  const enemyStance = gameState.enemyStance || 'neutral';
  
  // Defensive calculation of player defense
  const calculatePlayerDefense = () => {
    let defense = 0;
    
    // Armor defense
    if (equipment.armor && equipment.armor.stats) {
      defense += equipment.armor.stats.defense || 0;
    }
    
    // Helmet defense
    if (equipment.helmet && equipment.helmet.stats) {
      defense += equipment.helmet.stats.defense || 0;
    }
    
    // Shield defense
    if (isShieldEquipped) {
      defense += shieldDefense;
    }
    
    // Base defense from attributes
    const baseDefense = Math.floor(
      (player.phy || 0) * 0.2 + 
      ((player.skills?.discipline || 0) * 0.1)
    );
    
    return Math.max(0, defense + baseDefense);
  };
  
  // Calculate hit chance with robust checks
  const calculateHitChance = () => {
    const baseHitChance = 60;
    const enemy = window.gameState.combat.currentEnemy;
    const enemySkill = enemy.skill || 5;
    const playerDefense = calculatePlayerDefense();
    
    let hitChance = baseHitChance + enemySkill * 3 - playerDefense * 2;
    
    // Stance modifiers
    if (enemyStance === 'aggressive') {
        hitChance += 15;
    } else if (enemyStance === 'defensive') {
        hitChance -= 5;
    }
    
    if (playerStance === 'defensive') {
        hitChance -= 15;
    } else if (playerStance === 'evasive') {
        hitChance -= 20;
    }
    
    // Clamp hit chance
    return Math.min(95, Math.max(5, hitChance));
  };
  
  // Calculate damage with robust checks
  const calculateDamage = () => {
    const enemy = window.gameState.combat.currentEnemy;
    const enemySkill = enemy.skill || 5;
    const enemyStrength = enemy.strength || 5;
    const baseDamage = 3 + enemySkill * 0.3 + enemyStrength * 0.5;
    const momentum = gameState.enemyMomentum || 0;
    const momentumBonus = momentum > 0 ? momentum : 0;
    
    let damage = baseDamage + momentumBonus;
    
    // Stance and damage modifiers
    if (enemyStance === 'aggressive') {
        damage *= 1.3;
    }
    
    if (playerStance === 'defensive') {
        damage *= 0.7;
    }
    
    return Math.round(damage);
  };
  
  // Perform attack logic
  const hitChance = calculateHitChance();
  const rollResult = Math.random() * 100;
  
  const combatLog = document.getElementById('combatLog');
  const enemy = window.gameState.combat.currentEnemy;
  
  if (combatLog) {
    combatLog.innerHTML += `<p>The ${enemy.name} attacks you...</p>`;
    combatLog.scrollTop = combatLog.scrollHeight;
  }
  
  // Determine attack success
  if (rollResult <= hitChance) {
    const damage = calculateDamage();
    
    // Apply damage with health checks
    const currentHealth = gameState.health || 100;
    const newHealth = Math.max(0, currentHealth - damage);
    gameState.health = newHealth;
    
    // Update health display
    const playerHealthDisplay = document.getElementById('playerHealthDisplay');
    const playerCombatHealth = document.getElementById('playerCombatHealth');
    
    if (playerHealthDisplay) {
        playerHealthDisplay.textContent = `${Math.round(newHealth)} HP`;
    }
    
    if (playerCombatHealth) {
        const healthPercent = Math.max(0, (newHealth / (gameState.maxHealth || 100)) * 100);
        playerCombatHealth.style.width = `${healthPercent}%`;
    }
    
    // Log attack details
    if (combatLog) {
        combatLog.innerHTML += `<p>Hit! The ${enemy.name} strikes you for ${damage} damage.</p>`;
        combatLog.scrollTop = combatLog.scrollHeight;
    }
    
    // Check for player defeat
    if (newHealth <= 0) {
        setTimeout(() => {
            if (combatLog) {
                combatLog.innerHTML += `<p>Defeat! You have been overwhelmed by the ${enemy.name}!</p>`;
                combatLog.scrollTop = combatLog.scrollHeight;
            }
            
            // End combat with defeat
            setTimeout(() => {
                endCombatWithResult('defeat');
            }, 1500);
        }, 1000);
    }
  } else {
    // Miss
    if (combatLog) {
        combatLog.innerHTML += `<p>Miss! The ${enemy.name}'s attack fails to connect.</p>`;
        combatLog.scrollTop = combatLog.scrollHeight;
    }
  }
}


// Calculate player defense
function calculatePlayerDefense() {
  let defense = 0;
  
  // Ensure equipment object exists
  const equipment = (window.player && window.player.equipment) || 
                    (window.Player && window.Player.data && window.Player.data.equipment) || 
                    {};
  
  // Add armor defense with null checks
  if (equipment.armor && equipment.armor.stats) {
    defense += equipment.armor.stats.defense || 0;
  }
  
  // Add helmet defense with null checks
  if (equipment.helmet && equipment.helmet.stats) {
    defense += equipment.helmet.stats.defense || 0;
  }
  
  // Add shield defense with multiple null checks
  const combatDistance = (window.gameState && window.gameState.combatDistance) || 
                         (window.gameState && window.gameState.combat && window.gameState.combat.combatDistance) || 2;
  
  if (equipment.offhand && 
      equipment.offhand.category === 'SHIELD' && 
      combatDistance <= 1) {
    defense += equipment.offhand.stats?.defense || 0;
  }
  
  // Add a base defense from attributes
  const baseDefense = Math.floor(
    ((window.player && window.player.phy) || 
     (window.Player && window.Player.data && window.Player.data.phy) || 0) * 0.2
  );
  defense += baseDefense;
  
  return Math.max(0, defense);
}

// Execute opportunity attack
function executeOpportunityAttack(attacker) {
  if (attacker === 'player') {
    // Player opportunity attack (simplified)
    const weapon = window.player.equipment.weapon;
    let damage = 3; // Base damage
    
    if (weapon && weapon.stats && weapon.stats.damage) {
      damage = Math.floor(weapon.stats.damage[0] * 0.7); // 70% of minimum weapon damage
    }
    
    // Apply to enemy
    const enemy = window.gameState.combat.currentEnemy;
    enemy.health = Math.max(0, enemy.health - damage);
    
    // Update enemy health display
    document.getElementById('enemyHealthDisplay').textContent = `${enemy.health} HP`;
    document.getElementById('enemyCombatHealth').style.width = `${Math.max(0, (enemy.health / enemy.maxHealth) * 100)}%`;
    
    addToCombatLog(`Your opportunity attack deals ${damage} damage.`);
  } else {
    // Enemy opportunity attack (simplified)
    const enemy = window.gameState.combat.currentEnemy;
    const weapon = enemy.equipment.weapon;
    let damage = 3; // Base damage
    
    if (weapon && weapon.stats && weapon.stats.damage) {
      damage = Math.floor(weapon.stats.damage[0] * 0.7); // 70% of minimum weapon damage
    }
    
    // Apply to player
    window.gameState.health = Math.max(1, window.gameState.health - damage);
    
    // Update player health display
    document.getElementById('playerHealthDisplay').textContent = `${Math.round(window.gameState.health)} HP`;
    document.getElementById('playerCombatHealth').style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
    
    addToCombatLog(`The enemy's opportunity attack deals ${damage} damage.`);
    
    // Update status bars
    window.updateStatusBars();
  }
  
  // Check combat end conditions
  checkCombatEndConditions();
}

// End enemy turn and start new combat turn
function endEnemyTurn() {
  // Reset enemy AP
  window.gameState.combat.enemyAP = 0;
  
  // Increment combat turn counter
  window.gameState.combat.combatTurn++;
  
  // Switch active character
  window.gameState.combat.activeCharacter = 'player';
  
  // Add turn end to combat log
  addToCombatLog("Enemy ends their turn.");
  
  // Begin new combat turn
  beginCombatTurn();
}

// Add message to combat log
function addToCombatLog(message) {
  const combatLog = document.getElementById('combatLog');
  
  // Store combat log message
  window.gameState.combat.combatLog.push(message);
  
  // Trim combat log if too long
  if (window.gameState.combat.combatLog.length > 50) {
    window.gameState.combat.combatLog.shift();
  }
  
  // Add message to UI
  const messageElement = document.createElement('p');
  messageElement.innerHTML = message;
  combatLog.appendChild(messageElement);
  
  // Scroll to bottom
  combatLog.scrollTop = combatLog.scrollHeight;
}

// Attempt to flee from battle
function attemptToFlee() {
  // Can only flee from far distance
  if (window.gameState.combat.combatDistance < 2) {
    addToCombatLog("You need to be at far distance to attempt to flee.");
    return;
  }
  
  // Calculate flee chance based on various factors
  let fleeChance = 50; // Base 50% chance
  
  // Skill bonuses
  fleeChance += (window.player.skills.survival || 0) * 5;
  
  // Stamina penalty
  const staminaPercent = window.gameState.stamina / window.gameState.maxStamina;
  if (staminaPercent < 0.5) {
    fleeChance -= Math.floor((0.5 - staminaPercent) * 50);
  }
  
  // Terrain modifiers
  if (window.gameState.combat.terrain === 'slippery') {
    fleeChance -= 10;
  } else if (window.gameState.combat.terrain === 'rocky') {
    fleeChance += 10; // Easier to escape in rocky terrain
  }
  
  // Weather modifiers
  if (window.gameState.combat.weather === 'fog') {
    fleeChance += 15; // Easier to escape in fog
  }
  
  // Roll for success
  const roll = Math.floor(Math.random() * 100) + 1;
  
  if (roll <= fleeChance) {
    // Successful escape
    addToCombatLog("You successfully disengage and escape from combat!");
    
    // End combat with retreat result
    endCombatWithResult({
      victory: false,
      retreat: true,
      message: "You successfully retreated from combat."
    });
  } else {
    // Failed escape
    addToCombatLog("Your attempt to flee fails! The enemy cuts off your escape.");
    
    // Use up player's AP
    window.gameState.combat.playerAP = 0;
    
    // Enemy might get an opportunity attack
    if (Math.random() < 0.5) {
      addToCombatLog("The enemy lunges at you as you try to escape!");
      executeOpportunityAttack('enemy');
    }
    
    // End player turn
    endPlayerTurn();
  }
}

// Check for end of combat conditions
function checkCombatEndConditions() {
  // Check if player is defeated
  if (window.gameState.health <= 0) {
    // Ensure health doesn't go below 1 (no perma-death)
    window.gameState.health = 1;
    
    // End combat with defeat result
    endCombatWithResult({
      victory: false,
      defeat: true,
      message: "You are defeated and barely escape with your life."
    });
    return true;
  }
  
  // Check if enemy is defeated
  const enemy = window.gameState.combat.currentEnemy;
  if (enemy && enemy.health <= 0) {
    // End combat with victory result
    endCombatWithResult({
      victory: true,
      message: `You have defeated the ${enemy.name}!`
    });
    return true;
  }
  
  return false;
}

// End combat with a specific result
function endCombatWithResult(result) {
  // Hide combat interface
  document.getElementById('combatInterface').classList.add('hidden');
  
  // Show regular game actions
  document.getElementById('actions').style.display = 'flex';
  
  // Set combat state to inactive
  window.gameState.combat.inBattle = false;
  
  // Apply combat results
  if (result.victory) {
    // Victory
    window.setNarrative(result.message);
    
    // Award experience and loot
    const enemy = window.gameState.combat.currentEnemy;
    const expGained = calculateExperienceReward(enemy);
    window.gameState.experience += expGained;
    
    // Check for loot
    const loot = generateLoot(enemy);
    if (loot && window.player.inventory.length < 20) {
      window.player.inventory.push(loot);
      window.addToNarrative(`You found: ${loot.name}.`);
    }
    
    // Add reward info to narrative
    window.addToNarrative(`You gained ${expGained} experience.`);
    
    // Use some stamina from battle
    window.gameState.stamina = Math.max(0, window.gameState.stamina - 15);
    
    // Check for level up
    if (typeof window.checkLevelUp === 'function') {
      window.checkLevelUp();
    }
    
    // Improve combat skill slightly
    const skillGain = 0.1;
    
    // Determine which skill to improve based on weapon used
    const weapon = window.player.equipment.weapon;
    if (weapon && weapon.category === 'WEAPON') {
      // Ranged weapons improve marksmanship
      if (['BOW', 'CROSSBOW', 'MATCHLOCK'].includes(weapon.type)) {
        if (!window.player.skills.marksmanship) window.player.skills.marksmanship = 0;
        window.player.skills.marksmanship += skillGain;
        window.showNotification(`Marksmanship improved to ${window.player.skills.marksmanship.toFixed(1)}`, 'success');
      } else {
        // Other weapons improve melee
        if (!window.player.skills.melee) window.player.skills.melee = 0;
        window.player.skills.melee += skillGain;
        window.showNotification(`Melee combat improved to ${window.player.skills.melee.toFixed(1)}`, 'success');
      }
    }
  } else if (result.retreat) {
    // Retreat
    window.setNarrative(result.message);
    window.addToNarrative("You survived, but gained no rewards from combat.");
    
    // Use a lot of stamina from fleeing
    window.gameState.stamina = Math.max(0, window.gameState.stamina - 30);
    
    // Improve survival skill slightly
    if (!window.player.skills.survival) window.player.skills.survival = 0;
    window.player.skills.survival += 0.1;
    window.showNotification(`Survival improved to ${window.player.skills.survival.toFixed(1)}`, 'success');
  } else if (result.defeat) {
    // Defeat
    window.setNarrative(result.message);
    window.addToNarrative("You wake up later, having been dragged back to safety. Your wounds have been treated, but you've lost some items and morale.");
    
    // Lose some morale
    window.gameState.morale = Math.max(20, window.gameState.morale - 15);
    
    // Lose a random item
    if (window.player.inventory.length > 0) {
      const lostIndex = Math.floor(Math.random() * window.player.inventory.length);
      const lostItem = window.player.inventory.splice(lostIndex, 1)[0];
      window.addToNarrative(`You lost your ${lostItem.name} in the struggle.`);
    }
    
    // Very low stamina from defeat
    window.gameState.stamina = Math.max(0, window.gameState.stamina - 50);
  }
  
  // Update player status
  window.updateStatusBars();
  window.updateActionButtons();
}

// Calculate experience reward based on enemy
function calculateExperienceReward(enemy) {
  // Base experience from enemy type
  const baseExperience = {
    "arrasi_scout": 20,
    "arrasi_warrior": 30,
    "imperial_deserter": 25,
    "wild_beast": 35
  };
  
  // Get base value
  let experience = baseExperience[enemy.id] || 20;
  
  // Adjust based on player level
  if (window.gameState.level > 1) {
    experience = Math.floor(experience * (1 - ((window.gameState.level - 1) * 0.1)));
  }
  
  // Add bonus for remaining health percentage
  const playerHealthPercent = window.gameState.health / window.gameState.maxHealth;
  if (playerHealthPercent > 0.8) {
    experience = Math.floor(experience * 1.2); // 20% bonus for high health
  } else if (playerHealthPercent < 0.3) {
    experience = Math.floor(experience * 1.5); // 50% bonus for winning with low health
  }
  
  return Math.max(5, experience);
}

// Generate loot from defeated enemy
function generateLoot(enemy) {
  const lootTables = {
    "arrasi_scout": [
      { id: "arrasi_shortbow", name: "Arrasi Short Bow", category: "WEAPON", type: "BOW", stats: { damage: [4, 7], toHit: 5 }, chance: 0.2 },
      { id: "leather_scraps", name: "Leather Scraps", category: "MATERIAL", value: 5, quantity: 2, chance: 0.5 },
      { id: "healing_poultice", name: "Healing Poultice", category: "CONSUMABLE", effects: [{ type: "heal", value: 25 }], chance: 0.3 }
    ],
    "arrasi_warrior": [
      { id: "arrasi_axe", name: "Arrasi War Axe", category: "WEAPON", type: "AXE", stats: { damage: [6, 10], toHit: 0 }, chance: 0.15 },
      { id: "tribal_shield", name: "Tribal Shield", category: "SHIELD", stats: { defense: 15, blockChance: 25 }, chance: 0.2 },
      { id: "metal_fragments", name: "Metal Fragments", category: "MATERIAL", value: 8, quantity: 2, chance: 0.4 }
    ],
    "imperial_deserter": [
      { id: "imperial_sword", name: "Imperial Sword", category: "WEAPON", type: "SWORD", stats: { damage: [5, 8], toHit: 5 }, chance: 0.1 },
      { id: "stamina_draught", name: "Stamina Draught", category: "CONSUMABLE", effects: [{ type: "restoreStamina", value: 30 }], chance: 0.3 },
      { id: "imperial_medallion", name: "Imperial Medallion", category: "MATERIAL", value: 15, chance: 0.2 }
    ],
    "wild_beast": [
      { id: "beast_pelt", name: "Beast Pelt", category: "MATERIAL", value: 12, chance: 0.6 },
      { id: "beast_claws", name: "Sharp Claws", category: "MATERIAL", value: 8, quantity: 3, chance: 0.4 },
      { id: "raw_meat", name: "Raw Meat", category: "CONSUMABLE", effects: [{ type: "heal", value: 10 }, { type: "restoreStamina", value: 10 }], chance: 0.5 }
    ]
  };
  
  // Get loot table for this enemy
  const lootTable = lootTables[enemy.id] || [];
  
  // Roll for each item
  const possibleLoot = lootTable.filter(item => Math.random() < item.chance);
  
  // Return a random item from possible loot, or null if none
  if (possibleLoot.length === 0) return null;
  
  return possibleLoot[Math.floor(Math.random() * possibleLoot.length)];
}

// Set up event listeners for our custom combat actions
window.initializeCombatListeners = function() {
  // Set up delegation for combat actions
  document.addEventListener('click', function(e) {
    if (e.target && e.target.matches('#combatActions .action-btn')) {
      const action = e.target.getAttribute('data-action');
      if (action) {
        handleCombatAction(action);
      }
    }
  });
  
  // Override the original combatAction function to use our system
  window.combatAction = function(action) {
    handleCombatAction(action);
  };
};

// Add combat button helper function
function addCombatButton(text, action, container) {
  const button = document.createElement('button');
  button.className = 'action-btn';
  button.textContent = text;
  button.setAttribute('data-action', action);
  container.appendChild(button);
}

// Initialize the combat system
window.initCombatSystem = function() {
  window.initializeCombatListeners();
  console.log("Simplified Combat System initialized");
};

// Initialize on load
window.initCombatSystem();

// Instead of window.gameState, use a proper state management pattern
const GameState = (function() {
  let state = {};
  return {
    get: (key) => state[key],
    set: (key, value) => {
      state[key] = value;
      // Trigger appropriate UI updates
    }
  };
})();

// Unified time management system
const TimeSystem = {
  current: null,
  init() {
    this.current = {
      minute: 480,
      hour: 8,
      day: 1,
      month: 1,
      year: 1
    };
  },
  advance(minutes) {
    // Update all time-related states in one place
  }
};

// Add proper error handling
function updateUI() {
  try {
    const element = document.getElementById('someElement');
    if (!element) {
      throw new Error('Required UI element not found');
    }
    // Update UI
  } catch (error) {
    console.error('UI update failed:', error);
    // Handle gracefully
  }
}

// Implement proper event management
const EventSystem = {
  listeners: new Map(),
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  },
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }
};
