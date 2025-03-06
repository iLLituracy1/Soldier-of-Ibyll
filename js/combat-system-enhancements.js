// ENHANCED COMBAT SYSTEM - PHASE 5
// This module enhances the existing combat system with improved balance,
// advanced UI feedback, and smarter enemy AI

(function enhanceCombatSystem() {
  console.log("Initializing Phase 5 Combat System Enhancements...");

  // Store reference to original combat system
  const originalCombatSystem = window.CombatSystem || {};

  // =======================================================
  // 1. BALANCE REFINEMENTS - STAMINA SYSTEM
  // =======================================================
  
  // Enhanced stamina costs for different actions
  const ENHANCED_STAMINA_COSTS = {
    attack: 5,
    heavyAttack: 9,
    quickAttack: 3,
    defend: 2,
    dodge: 4,
    advance: 2,
    retreat: 3,
    aim: 1,
    shoot: 4,
    feint: 6,
    grapple: 7,
    special: 8,
    rest_combat: 0 // Rest actually recovers stamina
  };

  // Enhanced stamina regeneration rates based on stance
  const STAMINA_REGEN_BY_STANCE = {
    aggressive: 2,  // Less regeneration in aggressive stance
    defensive: 4,   // More regeneration in defensive stance
    evasive: 3,     // Medium regeneration in evasive stance
    neutral: 3      // Default regeneration in neutral stance
  };

  // Fatigue system - longer combats reduce stamina regeneration
  let combatFatigue = 0;
  const FATIGUE_REGEN_PENALTY = 0.2; // Each point of fatigue reduces regen by 0.2
  const MAX_FATIGUE = 5; // Cap fatigue at 5 points
  
  // Function to get actual stamina cost based on current conditions
  function getAdjustedStaminaCost(action) {
    const baseCost = ENHANCED_STAMINA_COSTS[action] || 0;
    let adjustedCost = baseCost;
    
    // Adjust for player momentum (positive momentum reduces cost slightly)
    const playerMomentum = window.gameState.playerMomentum || 0;
    if (playerMomentum > 0) {
      adjustedCost = Math.max(1, adjustedCost - Math.floor(playerMomentum/2));
    }
    
    // Adjust for stamina recovery perks from player skills if needed
    // Example: If player has "Efficient Combatant" perk
    const hasEfficiencyStat = window.player && window.player.skills && 
                             window.player.skills.discipline >= 4;
    if (hasEfficiencyStat) {
      adjustedCost = Math.max(1, Math.floor(adjustedCost * 0.9));
    }
    
    return adjustedCost;
  }
  
  // Function to calculate stamina regeneration rate
  function calculateStaminaRegen() {
    const stance = window.gameState.combatStance || 'neutral';
    const baseRegen = STAMINA_REGEN_BY_STANCE[stance] || 3;
    
    // Reduce regen based on fatigue
    const fatigueReduction = combatFatigue * FATIGUE_REGEN_PENALTY;
    
    // Apply any player skills that might enhance stamina regen
    let skillBonus = 0;
    if (window.player && window.player.skills) {
      if (window.player.skills.discipline > 0) {
        skillBonus += Math.floor(window.player.skills.discipline / 2);
      }
    }
    
    return Math.max(1, baseRegen + skillBonus - fatigueReduction);
  }
  
  // =======================================================
  // 2. BALANCE REFINEMENTS - STANCE ADVANTAGE SYSTEM
  // =======================================================
  
  // Enhanced stance advantage system (rock-paper-scissors style)
  const STANCE_ADVANTAGES = {
    // Format: [attack_bonus, defense_bonus, dodge_bonus, counter_chance]
    aggressive: {
      vsAggressive: [0, -10, -5, 0],
      vsDefensive: [-15, -10, -5, 20],  // Defensive counters Aggressive
      vsEvasive: [10, -10, -5, 0],      // Aggressive beats Evasive
      vsNeutral: [5, -5, -5, 0]
    },
    defensive: {
      vsAggressive: [5, 15, 5, 10],     // Defensive counters Aggressive
      vsDefensive: [0, 5, 0, 0],
      vsEvasive: [-5, 5, 0, 0],
      vsNeutral: [0, 10, 0, 5]
    },
    evasive: {
      vsAggressive: [-10, 5, 15, 0],
      vsDefensive: [5, 0, 15, 5],       // Evasive counters Defensive
      vsEvasive: [0, 0, 5, 0],
      vsNeutral: [0, 0, 10, 0]
    },
    neutral: {
      vsAggressive: [-5, 0, 0, 0],
      vsDefensive: [0, 0, 0, 0],
      vsEvasive: [5, 0, -5, 0],         // Neutral is slightly effective vs Evasive
      vsNeutral: [0, 0, 0, 0]
    }
  };
  
  // Function to get stance matchup bonuses 
  function getStanceMatchup(attackerStance, defenderStance) {
    const matchupKey = `vs${defenderStance.charAt(0).toUpperCase() + defenderStance.slice(1)}`;
    return STANCE_ADVANTAGES[attackerStance][matchupKey] || [0, 0, 0, 0];
  }
  
  // Stance transition costs and benefits
  const STANCE_TRANSITION = {
    toAggressive: { staminaCost: 2, momentumChange: 1 },
    toDefensive: { staminaCost: 1, momentumChange: -1 },
    toEvasive: { staminaCost: 2, momentumChange: 0 },
    toNeutral: { staminaCost: 0, momentumChange: 0 }
  };
  
  // Function to apply stance transition effects
  function applyStanceTransition(oldStance, newStance) {
    // Skip if it's the same stance
    if (oldStance === newStance) return;
    
    let transitionKey;
    switch(newStance) {
      case 'aggressive': transitionKey = 'toAggressive'; break;
      case 'defensive': transitionKey = 'toDefensive'; break;
      case 'evasive': transitionKey = 'toEvasive'; break;
      default: transitionKey = 'toNeutral';
    }
    
    const transition = STANCE_TRANSITION[transitionKey];
    
    // Apply stamina cost
    if (transition.staminaCost > 0) {
      const currentStamina = window.gameState.stamina || 0;
      window.gameState.stamina = Math.max(0, currentStamina - transition.staminaCost);
    }
    
    // Apply momentum change
    if (transition.momentumChange !== 0) {
      const currentMomentum = window.gameState.playerMomentum || 0;
      window.gameState.playerMomentum = Math.max(-5, Math.min(5, currentMomentum + transition.momentumChange));
    }
    
    // Update UI if needed
    if (window.UI && window.UI.combat) {
      window.UI.combat.updateStanceIndicator();
      window.UI.combat.updateStaminaDisplay();
      window.UI.combat.updateMomentumIndicator();
    }
  }

  // =======================================================
  // 3. BALANCE REFINEMENTS - ENVIRONMENTAL EFFECTS
  // =======================================================
  
  // Enhanced environmental effects on combat
  const ENVIRONMENT_EFFECTS = {
    // Format: [attack_mod, defense_mod, dodge_mod, stamina_regen_mod]
    terrain: {
      normal: [0, 0, 0, 0],
      rocky: [-5, 5, -10, -1],  // Hard to dodge on rocky terrain, good for defense
      muddy: [-10, -5, -5, -2], // Everything is harder in mud, more fatiguing
      confined: [5, -5, -15, 0], // Close quarters favor attack but limit dodging
      elevated: [10, 0, 5, 0]    // Height advantage improves attack and dodge
    },
    weather: {
      clear: [0, 0, 0, 0],
      rainy: [-5, 0, -10, -1],   // Wet conditions affect attack and dodge
      foggy: [-10, -5, 5, 0],    // Fog makes attacking harder but helps dodging
      windy: [0, 0, -5, 0],      // Wind affects dodge slightly
      stormy: [-10, -10, -15, -2] // Everything is harder in a storm
    },
    time: {
      day: [0, 0, 0, 0],
      dawn: [0, 0, 0, 0],
      evening: [-5, 0, -5, 0],   // Reduced visibility at evening
      night: [-10, -5, -10, -1]  // Significant penalties at night
    }
  };
  
  // Function to calculate environmental modifiers
  function calculateEnvironmentModifiers() {
    const terrain = window.gameState.terrain || 'normal';
    const weather = window.gameState.weather || 'clear';
    const time = window.getTimeOfDay ? window.getTimeOfDay() : 'day';
    
    const terrainMods = ENVIRONMENT_EFFECTS.terrain[terrain] || [0, 0, 0, 0];
    const weatherMods = ENVIRONMENT_EFFECTS.weather[weather] || [0, 0, 0, 0];
    const timeMods = ENVIRONMENT_EFFECTS.time[time] || [0, 0, 0, 0];
    
    // Combine all modifiers
    return [
      terrainMods[0] + weatherMods[0] + timeMods[0], // Attack modifier
      terrainMods[1] + weatherMods[1] + timeMods[1], // Defense modifier
      terrainMods[2] + weatherMods[2] + timeMods[2], // Dodge modifier
      terrainMods[3] + weatherMods[3] + timeMods[3]  // Stamina regen modifier
    ];
  }
  
  // Generate environment description for combat log
  function generateEnvironmentDescription() {
    const terrain = window.gameState.terrain || 'normal';
    const weather = window.gameState.weather || 'clear';
    
    let description = `You're fighting on ${terrain} terrain`;
    
    if (weather !== 'clear') {
      description += ` in ${weather} weather`;
    }
    
    // Add time of day effects
    const time = window.getTimeOfDay ? window.getTimeOfDay() : 'day';
    if (time === 'evening') {
      description += ` as the light fades to evening`;
    } else if (time === 'night') {
      description += ` in the darkness of night`;
    } else if (time === 'dawn') {
      description += ` in the early dawn light`;
    }
    
    // Add environmental tactical tips
    switch(terrain) {
      case 'rocky':
        description += `. The rocky surface provides good defensive positions but makes dodging difficult.`;
        break;
      case 'muddy':
        description += `. The mud slows movement and increases fatigue.`;
        break;
      case 'confined':
        description += `. The confined space limits mobility but makes attacks more effective at close range.`;
        break;
      case 'elevated':
        description += `. The elevated position gives you an advantage in both attacks and visibility.`;
        break;
      default:
        description += `. The terrain offers no special advantages or disadvantages.`;
    }
    
    return description;
  }

  // =======================================================
  // 4. ADVANCED COMBAT UI - VISUAL FEEDBACK
  // =======================================================
  
  // Enhanced visual feedback for combat UI
  function enhanceCombatUI() {
    // Add or improve momentum indicator
    function enhanceMomentumIndicator() {
      const momentumContainer = document.getElementById('momentumContainer');
      if (!momentumContainer) return;
      
      // Add momentum shift arrows
      const playerMomentumValue = document.getElementById('playerMomentumValue');
      const enemyMomentumValue = document.getElementById('enemyMomentumValue');
      
      if (playerMomentumValue) {
        const playerMomentum = window.gameState.playerMomentum || 0;
        let momentumText = playerMomentum.toString();
        
        // Add visual indicators based on momentum value
        if (playerMomentum > 3) {
          momentumText = '↑↑ ' + momentumText + ' (Excellent)';
          playerMomentumValue.style.color = '#4bff91'; // Bright green
        } else if (playerMomentum > 0) {
          momentumText = '↑ ' + momentumText + ' (Good)';
          playerMomentumValue.style.color = '#4bbfff'; // Blue
        } else if (playerMomentum < -3) {
          momentumText = '↓↓ ' + momentumText + ' (Poor)';
          playerMomentumValue.style.color = '#ff4b4b'; // Red
        } else if (playerMomentum < 0) {
          momentumText = '↓ ' + momentumText + ' (Weak)';
          playerMomentumValue.style.color = '#ffb74b'; // Orange
        } else {
          momentumText = '= ' + momentumText + ' (Neutral)';
          playerMomentumValue.style.color = '#e0e0e0'; // White
        }
        
        playerMomentumValue.textContent = momentumText;
      }
      
      if (enemyMomentumValue) {
        const enemyMomentum = window.gameState.enemyMomentum || 0;
        let momentumText = enemyMomentum.toString();
        
        // Add visual indicators based on momentum value
        if (enemyMomentum > 3) {
          momentumText = momentumText + ' ↑↑ (Dangerous)';
          enemyMomentumValue.style.color = '#ff4b4b'; // Red for enemy advantage
        } else if (enemyMomentum > 0) {
          momentumText = momentumText + ' ↑ (Threatening)';
          enemyMomentumValue.style.color = '#ffb74b'; // Orange
        } else if (enemyMomentum < -3) {
          momentumText = momentumText + ' ↓↓ (Faltering)';
          enemyMomentumValue.style.color = '#4bff91'; // Green
        } else if (enemyMomentum < 0) {
          momentumText = momentumText + ' ↓ (Vulnerable)';
          enemyMomentumValue.style.color = '#4bbfff'; // Blue
        } else {
          momentumText = momentumText + ' = (Neutral)';
          enemyMomentumValue.style.color = '#e0e0e0'; // White
        }
        
        enemyMomentumValue.textContent = momentumText;
      }
    }
    
    // Add stance matchup indicator
    function enhanceStanceIndicator() {
      const stanceContainer = document.getElementById('stanceContainer');
      if (!stanceContainer) return;
      
      // Remove any existing matchup indicator
      const existingMatchup = document.getElementById('stanceMatchupIndicator');
      if (existingMatchup) {
        existingMatchup.remove();
      }
      
      // Create stance matchup indicator
      const matchupIndicator = document.createElement('div');
      matchupIndicator.id = 'stanceMatchupIndicator';
      matchupIndicator.style.width = '100%';
      matchupIndicator.style.padding = '5px';
      matchupIndicator.style.margin = '5px 0';
      matchupIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
      matchupIndicator.style.borderRadius = '4px';
      matchupIndicator.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      
      // Get current stances
      const playerStance = window.gameState.combatStance || 'neutral';
      const enemyStance = window.gameState.enemyStance || 'neutral';
      
      // Calculate stance advantage
      const [attackBonus, defenseBonus, dodgeBonus, counterChance] = 
            getStanceMatchup(playerStance, enemyStance);
      
      // Determine overall advantage
      let advantageText, advantageColor;
      
      const totalAdvantage = attackBonus + defenseBonus + dodgeBonus + (counterChance / 2);
      
      if (totalAdvantage > 15) {
        advantageText = 'Strong Advantage';
        advantageColor = '#4bff91'; // Green
      } else if (totalAdvantage > 5) {
        advantageText = 'Advantage';
        advantageColor = '#4bbfff'; // Blue
      } else if (totalAdvantage < -15) {
        advantageText = 'Strong Disadvantage';
        advantageColor = '#ff4b4b'; // Red
      } else if (totalAdvantage < -5) {
        advantageText = 'Disadvantage';
        advantageColor = '#ffb74b'; // Orange
      } else {
        advantageText = 'Neutral';
        advantageColor = '#e0e0e0'; // White
      }
      
      // Create matchup display
      matchupIndicator.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <div>Stance Matchup:</div>
          <div style="color: ${advantageColor}; font-weight: bold;">${advantageText}</div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.9em;">
          <div>Attack: <span style="color: ${attackBonus > 0 ? '#4bff91' : (attackBonus < 0 ? '#ff4b4b' : '#e0e0e0')}">
            ${attackBonus > 0 ? '+' + attackBonus : attackBonus}%</span>
          </div>
          <div>Defense: <span style="color: ${defenseBonus > 0 ? '#4bff91' : (defenseBonus < 0 ? '#ff4b4b' : '#e0e0e0')}">
            ${defenseBonus > 0 ? '+' + defenseBonus : defenseBonus}%</span>
          </div>
          <div>Dodge: <span style="color: ${dodgeBonus > 0 ? '#4bff91' : (dodgeBonus < 0 ? '#ff4b4b' : '#e0e0e0')}">
            ${dodgeBonus > 0 ? '+' + dodgeBonus : dodgeBonus}%</span>
          </div>
        </div>
      `;
      
      // Insert after stance container
      stanceContainer.parentNode.insertBefore(matchupIndicator, stanceContainer.nextSibling);
    }
    
    // Add environmental effect indicator
    function addEnvironmentEffectsIndicator() {
      const environmentContainer = document.getElementById('environmentContainer');
      if (!environmentContainer) return;
      
      // Remove any existing effects indicator
      const existingEffects = document.getElementById('environmentEffectsIndicator');
      if (existingEffects) {
        existingEffects.remove();
      }
      
      // Create environment effects indicator
      const effectsIndicator = document.createElement('div');
      effectsIndicator.id = 'environmentEffectsIndicator';
      effectsIndicator.style.width = '100%';
      effectsIndicator.style.padding = '5px';
      effectsIndicator.style.margin = '5px 0';
      effectsIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
      effectsIndicator.style.borderRadius = '4px';
      effectsIndicator.style.border = '1px solid rgba(255, 255, 255, 0.1)';
      
      // Calculate environmental modifiers
      const [attackMod, defenseMod, dodgeMod, staminaMod] = calculateEnvironmentModifiers();
      
      // Create effects display
      effectsIndicator.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">Environmental Effects:</div>
        <div style="display: flex; justify-content: space-between; font-size: 0.9em;">
          <div>Attack: <span style="color: ${attackMod > 0 ? '#4bff91' : (attackMod < 0 ? '#ff4b4b' : '#e0e0e0')}">
            ${attackMod > 0 ? '+' + attackMod : attackMod}%</span>
          </div>
          <div>Defense: <span style="color: ${defenseMod > 0 ? '#4bff91' : (defenseMod < 0 ? '#ff4b4b' : '#e0e0e0')}">
            ${defenseMod > 0 ? '+' + defenseMod : defenseMod}%</span>
          </div>
          <div>Dodge: <span style="color: ${dodgeMod > 0 ? '#4bff91' : (dodgeMod < 0 ? '#ff4b4b' : '#e0e0e0')}">
            ${dodgeMod > 0 ? '+' + dodgeMod : dodgeMod}%</span>
          </div>
        </div>
      `;
      
      // Add stamina regen effect if applicable
      if (staminaMod !== 0) {
        const staminaEffectDiv = document.createElement('div');
        staminaEffectDiv.style.marginTop = '5px';
        staminaEffectDiv.style.fontSize = '0.9em';
        staminaEffectDiv.innerHTML = `Stamina Regen: <span style="color: ${staminaMod > 0 ? '#4bff91' : (staminaMod < 0 ? '#ff4b4b' : '#e0e0e0')}">
          ${staminaMod > 0 ? '+' + staminaMod : staminaMod}</span> per turn`;
        effectsIndicator.appendChild(staminaEffectDiv);
      }
      
      // Insert after environment container
      environmentContainer.parentNode.insertBefore(effectsIndicator, environmentContainer.nextSibling);
    }
    
    // Apply all UI enhancements
    enhanceMomentumIndicator();
    enhanceStanceIndicator();
    addEnvironmentEffectsIndicator();
  }
  
  // =======================================================
  // 5. ADVANCED COMBAT UI - MOVE PREVIEW INDICATORS
  // =======================================================
  
  // Enhanced action button with success probability and damage preview
  function createEnhancedActionButton(action, label, container) {
    if (!container) return;
    
    // Check if action should be disabled based on stamina
    let disabled = false;
    const staminaCost = getAdjustedStaminaCost(action);
    
    if (staminaCost > window.gameState.stamina) {
      disabled = true;
    }
    
    // Create button with advanced styling
    const btn = document.createElement('button');
    btn.className = 'action-btn' + (disabled ? ' disabled' : '');
    btn.setAttribute('data-action', action);
    
    // Get current stances for calculations
    const playerStance = window.gameState.combatStance || 'neutral';
    const enemyStance = window.gameState.enemyStance || 'neutral';
    
    // Calculate success probability and potential damage where applicable
    let successProbability = 0;
    let damageRange = null;
    let counterProbability = 0;
    
    // Get stance matchup bonuses
    const [attackBonus, defenseBonus, dodgeBonus, counterChance] = 
          getStanceMatchup(playerStance, enemyStance);
    
    // Get environmental modifiers
    const [envAttackMod, envDefenseMod, envDodgeMod] = calculateEnvironmentModifiers();
    
    if (action === 'attack' || action === 'heavyAttack' || action === 'quickAttack') {
      // Calculate hit chance
      const playerSkill = window.player.skills.melee || 0;
      const enemyDefense = window.gameState.currentEnemy?.defense || 5;
      const playerMomentum = window.gameState.playerMomentum || 0;
      
      let hitChance = 60 + playerSkill * 3 - enemyDefense * 2;
      
      // Add momentum bonus
      if (playerMomentum > 0) {
        hitChance += playerMomentum * 5;
      }
      
      // Add stance bonus
      hitChance += attackBonus;
      
      // Add environmental modifier
      hitChance += envAttackMod;
      
      // Clamp hit chance
      successProbability = Math.min(95, Math.max(5, hitChance));
      
      // Calculate damage range
      const playerStrength = window.player.phy || 0;
      let baseDamage = 3 + playerSkill * 0.5 + playerStrength * 0.7;
      
      // Adjust for specific attack types
      if (action === 'heavyAttack') {
        baseDamage *= 1.7;
      } else if (action === 'quickAttack') {
        baseDamage *= 0.7;
      }
      
      // Add momentum bonus
      if (playerMomentum > 0) {
        baseDamage += playerMomentum;
      }
      
      // Add stance modifications
      if (playerStance === 'aggressive') {
        baseDamage *= 1.3;
      }
      
      if (enemyStance === 'defensive') {
        baseDamage *= 0.7;
      }
      
      // Calculate damage range
      const minDamage = Math.round(baseDamage * 0.8);
      const maxDamage = Math.round(baseDamage * 1.2);
      damageRange = [minDamage, maxDamage];
      
      // Counter probability based on stance matchup
      counterProbability = counterChance;
      
    } else if (action === 'defend') {
      // Success probability for defend is always high
      successProbability = 95;
      
      // Counter probability based on stance
      if (playerStance === 'defensive') {
        const playerSkill = window.player.skills.melee || 0;
        counterProbability = 10 + playerSkill * 2 + counterChance;
        counterProbability = Math.min(50, counterProbability);
      }
      
    } else if (action === 'dodge') {
      // Calculate dodge success chance
      const playerDexterity = (window.player.phy || 0) * 0.5;
      const enemySpeed = window.gameState.currentEnemy?.speed || 5;
      
      let dodgeChance = 50 + playerDexterity * 2 - enemySpeed;
      
      // Add stance bonus
      dodgeChance += dodgeBonus;
      
      // Add environmental modifier
      dodgeChance += envDodgeMod;
      
      // Evasive stance significantly helps dodge
      if (playerStance === 'evasive') {
        dodgeChance += 20;
      }
      
      // Clamp dodge chance
      successProbability = Math.min(95, Math.max(5, dodgeChance));
      
    } else if (action === 'advance' || action === 'retreat') {
      // Movement actions have high success rates
      successProbability = 95;
      
    } else if (action === 'aim') {
      // Aiming always succeeds
      successProbability = 100;
      
    } else if (action === 'shoot') {
      // Calculate shooting success chance
      const playerSkill = window.player.skills.marksmanship || 0;
      const enemySpeed = window.gameState.currentEnemy?.speed || 5;
      const distance = window.gameState.combatDistance || 2;
      
      let shootChance = 50 + playerSkill * 3 - enemySpeed;
      
      // Distance affects accuracy
      if (distance === 1) { // Medium range
        shootChance += 10;
      } else if (distance === 0) { // Close range
        shootChance -= 15; // Harder to use ranged weapons at close range
      }
      
      // Add environmental modifier
      shootChance += envAttackMod;
      
      // Evasive enemy stance makes them harder to hit
      if (enemyStance === 'evasive') {
        shootChance -= 15;
      }
      
      // Apply aim bonus if any
      if (window.gameState.aimBonus) {
        shootChance += window.gameState.aimBonus;
      }
      
      // Clamp shoot chance
      successProbability = Math.min(95, Math.max(5, shootChance));
      
      // Calculate damage range
      const baseDamage = 5 + playerSkill * 0.8;
      const minDamage = Math.round(baseDamage * 0.8);
      const maxDamage = Math.round(baseDamage * 1.5); // Higher variance for shooting
      damageRange = [minDamage, maxDamage];
      
    } else if (action === 'feint') {
      // Calculate feint success chance
      const tacticsSkill = window.player.skills.tactics || 0;
      const enemySkill = window.gameState.currentEnemy?.skill || 5;
      
      let feintChance = 50 + tacticsSkill * 5 - enemySkill * 2;
      
      // Aggressive stance helps feints
      if (playerStance === 'aggressive') {
        feintChance += 10;
      }
      
      // Defensive enemies are harder to feint
      if (enemyStance === 'defensive') {
        feintChance -= 15;
      }
      
      // Clamp feint chance
      successProbability = Math.min(90, Math.max(10, feintChance));
    }
    
    // Create button content with stamina cost and success probability
    const buttonContent = document.createElement('div');
    buttonContent.style.display = 'flex';
    buttonContent.style.flexDirection = 'column';
    buttonContent.style.alignItems = 'center';
    
    // Add main label
    const mainLabel = document.createElement('span');
    mainLabel.textContent = label;
    buttonContent.appendChild(mainLabel);
    
    // Add stamina cost
    if (staminaCost > 0) {
      const staminaSpan = document.createElement('span');
      staminaSpan.className = 'stamina-cost';
      staminaSpan.textContent = `Stamina: -${staminaCost}`;
      staminaSpan.style.fontSize = '0.8em';
      staminaSpan.style.margin = '2px 0';
      buttonContent.appendChild(staminaSpan);
    }
    
    // Add success probability if applicable
    if (successProbability > 0) {
      const probabilitySpan = document.createElement('span');
      probabilitySpan.style.fontSize = '0.8em';
      
      // Color based on probability
      let colorClass;
      if (successProbability >= 75) {
        colorClass = 'high-chance';
        probabilitySpan.style.color = '#4bff91'; // Green
      } else if (successProbability >= 50) {
        colorClass = 'medium-chance';
        probabilitySpan.style.color = '#4bbfff'; // Blue
      } else if (successProbability >= 25) {
        colorClass = 'low-chance';
        probabilitySpan.style.color = '#ffb74b'; // Orange
      } else {
        colorClass = 'very-low-chance';
        probabilitySpan.style.color = '#ff4b4b'; // Red
      }
      
      probabilitySpan.textContent = `Success: ${Math.round(successProbability)}%`;
      buttonContent.appendChild(probabilitySpan);
    }
    
    // Add damage range if applicable
    if (damageRange) {
      const damageSpan = document.createElement('span');
      damageSpan.style.fontSize = '0.8em';
      damageSpan.style.color = '#ff8c4b'; // Orange-red for damage
      damageSpan.textContent = `Damage: ${damageRange[0]}-${damageRange[1]}`;
      buttonContent.appendChild(damageSpan);
    }
    
    // Add counter probability if applicable
    if (counterProbability > 0) {
      const counterSpan = document.createElement('span');
      counterSpan.style.fontSize = '0.8em';
      counterSpan.style.color = '#ca4bff'; // Purple for counter
      counterSpan.textContent = `Counter: ${Math.round(counterProbability)}%`;
      buttonContent.appendChild(counterSpan);
    }
    
    // Add content to button
    btn.appendChild(buttonContent);
    
    // Add tooltip with description
    btn.title = getActionDescription(action);
    
    // Add click handler
    if (!disabled) {
      btn.onclick = function() {
        if (window.CombatSystem && typeof window.CombatSystem.handleCombatAction === 'function') {
          window.CombatSystem.handleCombatAction(action);
        }
      };
    } else {
      // Show tooltip explaining why button is disabled
      btn.title = `Not enough stamina (Requires ${staminaCost})`;
    }
    
    container.appendChild(btn);
  }
  
  // Get detailed action description for tooltips
  function getActionDescription(action) {
    switch(action) {
      case 'attack':
        return "A balanced attack with moderate damage and stamina cost.";
      case 'heavyAttack':
        return "A powerful attack that deals high damage but costs more stamina and has a lower hit chance.";
      case 'quickAttack':
        return "A fast attack with high accuracy but lower damage. Good for building momentum.";
      case 'defend':
        return "Take a defensive stance, reducing incoming damage and increasing counter chances.";
      case 'dodge':
        return "Attempt to evade an attack completely. More effective in evasive stance.";
      case 'advance':
        return "Move closer to your opponent. Especially effective when aggressive.";
      case 'retreat':
        return "Increase distance from your opponent. Useful for ranged attacks or catching your breath.";
      case 'aim':
        return "Take time to aim, greatly increasing the accuracy of your next shot.";
      case 'shoot':
        return "Fire your ranged weapon. Most effective at medium range.";
      case 'feint':
        return "Fake an attack to bait a response, potentially creating an opening and reducing enemy momentum.";
      case 'grapple':
        return "Attempt to grab your opponent, limiting their movement and setting up follow-up attacks.";
      case 'rest_combat':
        return "Take a moment to catch your breath, recovering stamina at the cost of positioning.";
      default:
        return "Combat action";
    }
  }
  
  // =======================================================
  // 6. ADVANCED COMBAT UI - ENHANCED COMBAT LOG
  // =======================================================
  
  // Enhanced combat log with color-coding and critical event highlights
  function enhanceCombatLog(message, type = 'normal') {
    const combatLog = document.getElementById('combatLog');
    if (!combatLog) return;
    
    // Create log entry
    const logEntry = document.createElement('p');
    
    // Style based on message type
    switch(type) {
      case 'critical-hit':
        logEntry.innerHTML = `<span style="color: #ff4b4b; font-weight: bold; font-size: 1.1em;">CRITICAL HIT!</span> ${message}`;
        logEntry.style.borderLeft = '3px solid #ff4b4b';
        logEntry.style.paddingLeft = '7px';
        break;
      case 'critical-miss':
        logEntry.innerHTML = `<span style="color: #ffb74b; font-weight: bold;">CRITICAL MISS!</span> ${message}`;
        logEntry.style.borderLeft = '3px solid #ffb74b';
        logEntry.style.paddingLeft = '7px';
        break;
      case 'player-hit':
        logEntry.innerHTML = `<span style="color: #4bff91; font-weight: bold;">HIT!</span> ${message}`;
        logEntry.style.borderLeft = '3px solid #4bff91';
        logEntry.style.paddingLeft = '7px';
        break;
      case 'player-miss':
        logEntry.innerHTML = `<span style="color: #ffb74b;">MISS!</span> ${message}`;
        break;
      case 'enemy-hit':
        logEntry.innerHTML = `<span style="color: #ff4b4b; font-weight: bold;">HIT!</span> ${message}`;
        logEntry.style.borderLeft = '3px solid #ff4b4b';
        logEntry.style.paddingLeft = '7px';
        break;
      case 'enemy-miss':
        logEntry.innerHTML = `<span style="color: #4bff91;">MISS!</span> ${message}`;
        break;
      case 'counter':
        logEntry.innerHTML = `<span style="color: #ca4bff; font-weight: bold;">COUNTER!</span> ${message}`;
        logEntry.style.borderLeft = '3px solid #ca4bff';
        logEntry.style.paddingLeft = '7px';
        break;
      case 'stance':
        logEntry.innerHTML = `<span style="color: #4bbfff;">STANCE:</span> ${message}`;
        break;
      case 'movement':
        logEntry.innerHTML = `<span style="color: #4bbfff;">MOVEMENT:</span> ${message}`;
        break;
      case 'stamina':
        logEntry.innerHTML = `<span style="color: #4bff91;">STAMINA:</span> ${message}`;
        break;
      case 'environment':
        logEntry.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        logEntry.style.padding = '5px';
        logEntry.style.borderRadius = '4px';
        logEntry.innerHTML = `<span style="color: #4bbfff; font-weight: bold;">ENVIRONMENT:</span> ${message}`;
        break;
      case 'victory':
        logEntry.style.backgroundColor = 'rgba(75, 255, 145, 0.2)';
        logEntry.style.padding = '10px';
        logEntry.style.borderRadius = '4px';
        logEntry.style.textAlign = 'center';
        logEntry.innerHTML = `<span style="color: #4bff91; font-weight: bold; font-size: 1.2em;">VICTORY!</span><br>${message}`;
        break;
      case 'defeat':
        logEntry.style.backgroundColor = 'rgba(255, 75, 75, 0.2)';
        logEntry.style.padding = '10px';
        logEntry.style.borderRadius = '4px';
        logEntry.style.textAlign = 'center';
        logEntry.innerHTML = `<span style="color: #ff4b4b; font-weight: bold; font-size: 1.2em;">DEFEAT!</span><br>${message}`;
        break;
      case 'tip':
        logEntry.style.fontStyle = 'italic';
        logEntry.style.borderLeft = '3px solid #4bbfff';
        logEntry.style.paddingLeft = '7px';
        logEntry.style.color = '#aaa';
        logEntry.innerHTML = `<span style="color: #4bbfff;">TIP:</span> ${message}`;
        break;
      default:
        logEntry.innerHTML = message;
    }
    
    // Add to combat log
    combatLog.appendChild(logEntry);
    
    // Scroll to bottom
    combatLog.scrollTop = combatLog.scrollHeight;
  }
  
  // Generate tactical tips based on combat state
  function generateCombatTip() {
    const playerStance = window.gameState.combatStance || 'neutral';
    const enemyStance = window.gameState.enemyStance || 'neutral';
    const playerMomentum = window.gameState.playerMomentum || 0;
    const enemyMomentum = window.gameState.enemyMomentum || 0;
    const distance = window.gameState.combatDistance || 2;
    
    // Array of possible tips
    const tips = [];
    
    // Stance-based tips
    if (playerStance === 'aggressive' && enemyStance === 'defensive') {
      tips.push("Against a defensive opponent, consider changing to evasive or neutral stance. Aggressive is countered by defensive.");
    } else if (playerStance === 'defensive' && enemyStance === 'evasive') {
      tips.push("Your defensive stance is less effective against an evasive opponent. Consider aggressive to counter them.");
    } else if (playerStance === 'evasive' && enemyStance === 'aggressive') {
      tips.push("Your evasive stance is vulnerable to aggressive attacks. Consider switching to defensive.");
    }
    
    // Momentum-based tips
    if (playerMomentum >= 3) {
      tips.push("You have strong momentum! Press your advantage with attacks while your hit chance is increased.");
    } else if (playerMomentum <= -3) {
      tips.push("Your momentum is low. Consider defensive or evasive actions to recover before attacking again.");
    }
    
    if (enemyMomentum >= 3) {
      tips.push("The enemy has strong momentum. Be cautious and consider defensive or evasive actions.");
    }
    
    // Distance-based tips
    if (distance === 2 && !window.Player.skills.marksmanship) {
      tips.push("You're at long range without ranged weapons. Consider advancing to engage effectively.");
    } else if (distance === 0 && playerStance === 'evasive') {
      tips.push("Evasive stance is less effective at close range. Consider retreating or switching stance.");
    }
    
    // Stamina management tips
    const stamina = window.gameState.stamina || 0;
    const maxStamina = window.gameState.maxStamina || 100;
    
    if (stamina < maxStamina * 0.3) {
      tips.push("Your stamina is low. Consider defensive stance for better regeneration or use Rest to recover.");
    }
    
    // Select a random tip if we have any
    if (tips.length > 0) {
      const tipIndex = Math.floor(Math.random() * tips.length);
      return tips[tipIndex];
    }
    
    return null;
  }
  
  // =======================================================
  // 7. COMBAT AI IMPROVEMENTS
  // =======================================================
  
  // Enhanced enemy decision-making logic
  function enhancedEnemyDecisionMaking() {
    const enemy = window.gameState.currentEnemy;
    if (!enemy) return 'attack'; // Default fallback
    
    const distance = window.gameState.combatDistance || 2;
    const playerHealth = window.gameState.health || 0;
    const playerMaxHealth = window.gameState.maxHealth || 100;
    const playerStance = window.gameState.combatStance || 'neutral';
    const enemyStance = window.gameState.enemyStance || 'neutral';
    const playerMomentum = window.gameState.playerMomentum || 0;
    const enemyMomentum = window.gameState.enemyMomentum || 0;
    const playerStamina = window.gameState.stamina || 0;
    const playerHealthPercent = (playerHealth / playerMaxHealth) * 100;
    const enemyHealthPercent = (enemy.health / enemy.maxHealth) * 100;
    
    // Get enemy type-specific strategy
    const strategy = getEnemyStrategy(enemy);
    
    // Calculate decision weights for each possible action
    let weights = {
      'attack': 30,
      'heavyAttack': 15,
      'quickAttack': 20,
      'defend': 15,
      'dodge': 15,
      'advance': 20,
      'retreat': 15,
      'aim': 10,
      'shoot': 15,
      'feint': 10,
      'stance_aggressive': 15,
      'stance_defensive': 15,
      'stance_evasive': 15,
      'stance_neutral': 10
    };
    
    // Apply enemy type preferences from strategy
    if (strategy.preferences) {
      Object.keys(strategy.preferences).forEach(action => {
        weights[action] = (weights[action] || 10) + strategy.preferences[action];
      });
    }
    
    // Apply enemy type stance preferences
    if (strategy.preferredStance && enemyStance !== strategy.preferredStance) {
      weights[`stance_${strategy.preferredStance}`] += 30;
    }
    
    // Apply current state modifiers to weights
    
    // Distance considerations
    if (distance === 2) {
      // At far distance
      weights.advance += 20; // Strong preference to close distance
      weights.attack = 0;    // Can't melee attack at far range
      weights.heavyAttack = 0;
      weights.quickAttack = 0;
      weights.grapple = 0;
      
      // Ranged attack modifiers
      if (enemy.hasRanged) {
        weights.shoot += 20;
        weights.aim += 15;
      } else {
        weights.advance += 20; // Even stronger preference to close distance if no ranged weapon
      }
    } else if (distance === 1) {
      // At medium distance
      if (strategy.preferredRange === 'close') {
        weights.advance += 15;
      } else if (strategy.preferredRange === 'far' && enemy.hasRanged) {
        weights.retreat += 15;
        weights.shoot += 10;
      }
    } else {
      // At close distance
      if (strategy.preferredRange === 'far') {
        weights.retreat += 20;
      } else {
        weights.attack += 10;
        weights.heavyAttack += 5;
        weights.quickAttack += 10;
        
        // Special handling for grapple if enemy has it
        if (strategy.canGrapple) {
          weights.grapple = 20;
        }
      }
    }
    
    // Health considerations
    if (enemyHealthPercent < 30) {
      // Enemy is badly hurt, be more cautious
      weights.defend += 15;
      weights.dodge += 10;
      weights.retreat += 10;
      weights.heavyAttack -= 10;
      weights.stance_defensive += 20;
      weights.stance_aggressive -= 10;
    } else if (playerHealthPercent < 30) {
      // Player is badly hurt, press advantage
      weights.attack += 15;
      weights.heavyAttack += 15;
      weights.advance += 10;
      weights.stance_aggressive += 20;
    }
    
    // Momentum considerations
    if (enemyMomentum >= 3) {
      // Strong momentum, press advantage
      weights.attack += 20;
      weights.heavyAttack += 15;
      weights.stance_aggressive += 10;
    } else if (enemyMomentum <= -3) {
      // Low momentum, be more defensive
      weights.defend += 15;
      weights.dodge += 10;
      weights.stance_defensive += 15;
    }
    
    if (playerMomentum >= 3) {
      // Player has momentum, be careful
      weights.defend += 10;
      weights.dodge += 15;
      weights.stance_defensive += 10;
    }
    
    // Stance countering - try to counter player's stance
    if (playerStance === 'aggressive') {
      weights.stance_defensive += 20; // Defensive counters aggressive
    } else if (playerStance === 'defensive') {
      weights.stance_evasive += 20;   // Evasive counters defensive
    } else if (playerStance === 'evasive') {
      weights.stance_aggressive += 20; // Aggressive counters evasive
    }
    
    // Player stamina considerations
    if (playerStamina < 20) {
      // Player is low on stamina, press advantage
      weights.attack += 10;
      weights.advance += 10;
      weights.feint += 10; // Force player to spend more stamina
    }
    
    // Special attack patterns from strategy
    if (strategy.combos && enemyMomentum > 0) {
      // Use attack combos when enemy has some momentum
      // Add weight to follow-up actions in the combo
      const lastAction = window.gameState.lastEnemyAction;
      if (lastAction && strategy.combos[lastAction]) {
        strategy.combos[lastAction].forEach(followUpAction => {
          weights[followUpAction] += 25; // Strongly prefer combo follow-ups
        });
      }
    }
    
    // Add some randomness based on enemy intelligence
    const intelligence = strategy.intelligence || 5;
    const randomFactor = 11 - intelligence; // Less randomness for more intelligent enemies
    
    Object.keys(weights).forEach(action => {
      weights[action] += Math.floor(Math.random() * randomFactor);
    });
    
    // Remove actions with zero weight
    Object.keys(weights).forEach(action => {
      if (weights[action] <= 0) {
        delete weights[action];
      }
    });
    
    // Choose action based on weights
    return chooseWeightedRandom(weights);
  }
  
  // Helper function to choose a random option based on weights
  function chooseWeightedRandom(weights) {
    // Calculate total weight
    let totalWeight = 0;
    Object.values(weights).forEach(weight => {
      totalWeight += weight;
    });
    
    // Get a random value within the total weight
    let random = Math.random() * totalWeight;
    
    // Find the selected action
    for (const [action, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        return action;
      }
    }
    
    // Fallback - return first action
    return Object.keys(weights)[0];
  }
  
  // Get enemy strategy based on enemy type
  function getEnemyStrategy(enemy) {
    const strategies = {
      // Default basic strategy
      default: {
        intelligence: 5,
        preferences: {
          attack: 10,
          defend: 5,
          dodge: 5,
          advance: 5,
          retreat: 5
        },
        preferredStance: 'neutral',
        preferredRange: 'medium',
        canGrapple: false
      },
      
      // Strategy for Arrasi Scout
      arrasi_scout: {
        intelligence: 7,
        preferences: {
          quickAttack: 15,
          dodge: 15,
          aim: 20,
          shoot: 25,
          retreat: 10
        },
        preferredStance: 'evasive',
        preferredRange: 'medium',
        canGrapple: false,
        combos: {
          aim: ['shoot'],
          retreat: ['aim', 'shoot'],
          dodge: ['quickAttack', 'retreat']
        }
      },
      
      // Strategy for Arrasi Warrior
      arrasi_warrior: {
        intelligence: 8,
        preferences: {
          attack: 20,
          heavyAttack: 15,
          feint: 10,
          advance: 15
        },
        preferredStance: 'aggressive',
        preferredRange: 'close',
        canGrapple: true,
        combos: {
          advance: ['attack', 'heavyAttack', 'grapple'],
          feint: ['heavyAttack'],
          attack: ['attack', 'heavyAttack', 'grapple'],
          quickAttack: ['heavyAttack', 'grapple']
        }
      },
      
      // Strategy for Wolf
      wolf: {
        intelligence: 4,
        preferences: {
          attack: 25,
          quickAttack: 20,
          advance: 20,
          dodge: 10
        },
        preferredStance: 'aggressive',
        preferredRange: 'close',
        canGrapple: false,
        combos: {
          advance: ['attack', 'quickAttack'],
          dodge: ['quickAttack', 'attack'],
          quickAttack: ['attack', 'quickAttack']
        }
      }
    };
    
    // Return specific strategy or default
    if (enemy.type && strategies[enemy.type]) {
      return strategies[enemy.type];
    } else if (enemy.name) {
      // Try to match by name
      const lowerName = enemy.name.toLowerCase();
      
      if (lowerName.includes('scout')) {
        return strategies.arrasi_scout;
      } else if (lowerName.includes('warrior')) {
        return strategies.arrasi_warrior;
      } else if (lowerName.includes('wolf')) {
        return strategies.wolf;
      }
    }
    
    // Default strategy
    return strategies.default;
  }
  
  // =======================================================
  // 8. DIFFICULTY SCALING
  // =======================================================
  
  // Scale enemy difficulty based on player level
  function scaleEnemyForPlayerLevel(enemy) {
    if (!enemy) return null;
    
    // Get player level
    const playerLevel = window.gameState.level || 1;
    
    // Only scale if player is above level 1
    if (playerLevel <= 1) return enemy;
    
    // Clone the enemy to avoid modifying the original
    const scaledEnemy = JSON.parse(JSON.stringify(enemy));
    
    // Calculate scaling factor (increases with player level but with diminishing returns)
    const scalingFactor = 1 + ((playerLevel - 1) * 0.2);
    
    // Scale enemy attributes
    scaledEnemy.health = Math.round(enemy.health * scalingFactor);
    scaledEnemy.maxHealth = scaledEnemy.health;
    scaledEnemy.damage = Math.round((enemy.damage || 5) * scalingFactor);
    scaledEnemy.skill = Math.min(10, (enemy.skill || 5) + Math.floor((playerLevel - 1) / 2));
    scaledEnemy.defense = Math.min(10, (enemy.defense || 5) + Math.floor((playerLevel - 1) / 3));
    
    // Increase loot and experience with level
    if (scaledEnemy.expValue) {
      scaledEnemy.expValue = Math.round(enemy.expValue * scalingFactor);
    }
    
    if (scaledEnemy.loot && scaledEnemy.loot.taelors) {
      if (typeof scaledEnemy.loot.taelors === 'number') {
        scaledEnemy.loot.taelors = Math.round(scaledEnemy.loot.taelors * scalingFactor);
      } else if (scaledEnemy.loot.taelors.min && scaledEnemy.loot.taelors.max) {
        scaledEnemy.loot.taelors.min = Math.round(scaledEnemy.loot.taelors.min * scalingFactor);
        scaledEnemy.loot.taelors.max = Math.round(scaledEnemy.loot.taelors.max * scalingFactor);
      }
    }
    
    // Add level suffix to the name
    if (playerLevel >= 5) {
      scaledEnemy.name = scaledEnemy.name + ' Champion';
    } else if (playerLevel >= 3) {
      scaledEnemy.name = scaledEnemy.name + ' Veteran';
    }
    
    // Add additional abilities for higher levels
    if (playerLevel >= 4) {
      // Enhanced versions get special abilities
      scaledEnemy.specialAbilities = scaledEnemy.specialAbilities || [];
      
      // Add special abilities based on enemy type
      if (enemy.type === 'arrasi_scout') {
        scaledEnemy.specialAbilities.push('precise_shot');
      } else if (enemy.type === 'arrasi_warrior') {
        scaledEnemy.specialAbilities.push('war_cry');
      } else if (enemy.type === 'wolf') {
        scaledEnemy.specialAbilities.push('pack_tactics');
      }
    }
    
    return scaledEnemy;
  }
  
  // Process enemy special abilities
  function processEnemySpecialAbility(ability, enemy) {
    // Return false if the ability should not be used
    if (!enemy || !enemy.specialAbilities || !enemy.specialAbilities.includes(ability)) {
      return false;
    }
    
    // Check cooldown for this ability
    if (!window.gameState.enemyAbilityCooldowns) {
      window.gameState.enemyAbilityCooldowns = {};
    }
    
    if (window.gameState.enemyAbilityCooldowns[ability] > 0) {
      window.gameState.enemyAbilityCooldowns[ability]--;
      return false;
    }
    
    // Process specific abilities
    switch(ability) {
      case 'precise_shot':
        // Guaranteed critical hit with ranged attack
        enhanceCombatLog("The Arrasi Scout takes careful aim and fires a PRECISE SHOT!", 'critical-hit');
        
        // Deal critical damage
        const damage = Math.round((enemy.damage || 5) * 1.5);
        window.gameState.health = Math.max(0, window.gameState.health - damage);
        
        enhanceCombatLog(`The shot strikes a vital area for ${damage} damage!`, 'enemy-hit');
        
        // Update UI
        if (window.UI && window.UI.combat) {
          window.UI.combat.updateHealthDisplay();
        }
        
        // Set cooldown
        window.gameState.enemyAbilityCooldowns[ability] = 3;
        return true;
        
      case 'war_cry':
        // Intimidating shout that increases damage and reduces player dodge
        enhanceCombatLog("The Arrasi Warrior lets out a deafening WAR CRY!", 'critical-hit');
        enhanceCombatLog("The warrior's attack power increases while your dodge chance is reduced!", 'enemy-hit');
        
        // Apply effects
        window.gameState.enemyMomentum = Math.min(5, (window.gameState.enemyMomentum || 0) + 3);
        window.gameState.playerMomentum = Math.max(-5, (window.gameState.playerMomentum || 0) - 2);
        
        // Set temporary effect
        window.gameState.enemyDamageBonus = 0.3; // 30% damage boost
        window.gameState.playerDodgePenalty = 15; // -15% dodge chance
        
        // Update UI
        if (window.UI && window.UI.combat) {
          window.UI.combat.updateMomentumIndicator();
          window.UI.combat.updateStanceIndicator();
        }
        
        // Set cooldown
        window.gameState.enemyAbilityCooldowns[ability] = 4;
        return true;
        
      case 'pack_tactics':
        // Wolf calls allies for a coordinated attack
        enhanceCombatLog("The Wolf howls, summoning PACK TACTICS!", 'critical-hit');
        
        // Multiple quick attacks
        let totalDamage = 0;
        const attacks = 3;
        
        for (let i = 0; i < attacks; i++) {
          const damage = Math.round((enemy.damage || 5) * 0.6);
          window.gameState.health = Math.max(0, window.gameState.health - damage);
          totalDamage += damage;
          
          if (i < attacks - 1) {
            enhanceCombatLog(`A quick bite for ${damage} damage!`, 'enemy-hit');
          }
        }
        
        enhanceCombatLog(`The coordinated attacks deal a total of ${totalDamage} damage!`, 'enemy-hit');
        
        // Update UI
        if (window.UI && window.UI.combat) {
          window.UI.combat.updateHealthDisplay();
        }
        
        // Set cooldown
        window.gameState.enemyAbilityCooldowns[ability] = 4;
        return true;
        
      default:
        return false;
    }
  }
  
  // =======================================================
  // INTEGRATION WITH EXISTING COMBAT SYSTEM
  // =======================================================
  
  // Override CombatSystem functions with enhanced versions
  if (window.CombatSystem) {
    console.log("Enhancing CombatSystem with Phase 5 features...");
    
    // Store original functions
    const originalStartCombat = window.CombatSystem.startCombat;
    const originalEndCombat = window.CombatSystem.endCombat;
    const originalUpdateCombatActions = window.CombatSystem.updateCombatActions;
    const originalHandleCombatAction = window.CombatSystem.handleCombatAction;
    const originalProcessEnemyTurn = window.CombatSystem.processEnemyTurn;
    const originalProcessEnemyAction = window.CombatSystem.processEnemyAction;
    const originalProcessEnemyAttack = window.CombatSystem.processEnemyAttack;
    const originalResolveEnemySuccessfulAttack = window.CombatSystem.resolveEnemySuccessfulAttack;
    const originalResolveSuccessfulAttack = window.CombatSystem.resolveSuccessfulAttack;
    const originalAddCombatAction = window.CombatSystem.addCombatAction;
    const originalGetEnemyByType = window.CombatSystem.getEnemyByType;
    
    // Enhanced startCombat with difficulty scaling and environment
    window.CombatSystem.startCombat = function(enemyType, environment = null) {
      console.log("Enhanced startCombat called", { enemyType, environment });
      
      // Reset fatigue and ability cooldowns
      combatFatigue = 0;
      window.gameState.enemyAbilityCooldowns = {};
      window.gameState.lastEnemyAction = null;
      
      // Get enemy with proper difficulty scaling
      let enemy = this.getEnemyByType(enemyType);
      if (!enemy) {
        console.error("Enemy type not found:", enemyType);
        return;
      }
      
      // Apply difficulty scaling based on player level
      enemy = scaleEnemyForPlayerLevel(enemy);
      
      // Generate environment if not provided
      if (!environment) {
        environment = this.generateCombatEnvironment();
      }
      
      // Call original startCombat with scaled enemy
      originalStartCombat.call(this, enemyType, environment);
      
      // Override the current enemy with our scaled version
      window.gameState.currentEnemy = enemy;
      
      // Apply environment effects
      window.gameState.terrain = environment.terrain || 'normal';
      window.gameState.weather = environment.weather || 'clear';
      
      // Add environment description to combat log
      const environmentDesc = generateEnvironmentDescription();
      enhanceCombatLog(environmentDesc, 'environment');
      
      // Add a combat tip
      const tip = generateCombatTip();
      if (tip) {
        enhanceCombatLog(tip, 'tip');
      }
      
      // Enhanced UI updates
      enhanceCombatUI();
    };
    
    // Enhanced endCombat that cleans up additional state
    window.CombatSystem.endCombat = function(result) {
      console.log("Enhanced endCombat called with result:", result);
      
      // Clear enhanced state variables
      window.gameState.enemyDamageBonus = 0;
      window.gameState.playerDodgePenalty = 0;
      window.gameState.enemyAbilityCooldowns = {};
      window.gameState.lastEnemyAction = null;
      
      // Handle the result with enhanced log
      if (result === 'victory') {
        enhanceCombatLog(`You have emerged victorious against the ${window.gameState.currentEnemy?.name || 'enemy'}!`, 'victory');
      } else if (result === 'defeat') {
        enhanceCombatLog(`You have been defeated by the ${window.gameState.currentEnemy?.name || 'enemy'}, but manage to escape with your life.`, 'defeat');
      } else if (result === 'retreat') {
        enhanceCombatLog(`You have successfully retreated from combat.`, 'movement');
      }
      
      // Call original endCombat
      originalEndCombat.call(this, result);
    };
    
    // Replace updateCombatActions with enhanced version
    window.CombatSystem.updateCombatActions = function() {
      console.log("Enhanced updateCombatActions called");
      
      // Get the combat actions container
      const actionsContainer = document.getElementById('combatActions');
      if (!actionsContainer) {
        console.warn("Combat actions container not found");
        return;
      }
      
      // Clear previous actions
      actionsContainer.innerHTML = '';
      
      // Get current combat state
      const distance = window.gameState.combatDistance || 2;
      const playerStance = window.gameState.combatStance || 'neutral';
      
      // Basic movement actions always available
      if (distance < 2) {
        createEnhancedActionButton('retreat', 'Retreat', actionsContainer);
      }
      if (distance > 0) {
        createEnhancedActionButton('advance', 'Advance', actionsContainer);
      }
      
      // Rest action always available
      createEnhancedActionButton('rest_combat', 'Rest', actionsContainer);
      
      // Actions based on distance
      if (distance === 0) { // Close range
        createEnhancedActionButton('attack', 'Attack', actionsContainer);
        createEnhancedActionButton('heavyAttack', 'Heavy Attack', actionsContainer);
        createEnhancedActionButton('quickAttack', 'Quick Attack', actionsContainer);
        createEnhancedActionButton('grapple', 'Grapple', actionsContainer);
        createEnhancedActionButton('defend', 'Defend', actionsContainer);
        createEnhancedActionButton('dodge', 'Dodge', actionsContainer);
        createEnhancedActionButton('feint', 'Feint', actionsContainer);
      } else if (distance === 1) { // Medium range
        createEnhancedActionButton('attack', 'Attack', actionsContainer);
        createEnhancedActionButton('quickAttack', 'Quick Attack', actionsContainer);
        createEnhancedActionButton('defend', 'Defend', actionsContainer);
        createEnhancedActionButton('dodge', 'Dodge', actionsContainer);
        
        // If player has ranged weapon
        if (this.playerHasRangedWeapon()) {
          createEnhancedActionButton('aim', 'Aim', actionsContainer);
          createEnhancedActionButton('shoot', 'Shoot', actionsContainer);
        }
        
        createEnhancedActionButton('feint', 'Feint', actionsContainer);
      } else { // Far range
        // Only ranged options at far range
        if (this.playerHasRangedWeapon()) {
          createEnhancedActionButton('aim', 'Aim', actionsContainer);
          createEnhancedActionButton('shoot', 'Shoot', actionsContainer);
        }
        
        // Can observe enemy
        createEnhancedActionButton('observe', 'Observe', actionsContainer);
        
        // Can also feint at distance to bait movement
        createEnhancedActionButton('feint', 'Feint', actionsContainer);
      }
      
      // Stance change options
      if (playerStance !== 'aggressive') {
        createEnhancedActionButton('stance_aggressive', 'Aggressive Stance', actionsContainer);
      }
      
      if (playerStance !== 'defensive') {
        createEnhancedActionButton('stance_defensive', 'Defensive Stance', actionsContainer);
      }
      
      if (playerStance !== 'evasive') {
        createEnhancedActionButton('stance_evasive', 'Evasive Stance', actionsContainer);
      }
      
      if (playerStance !== 'neutral') {
        createEnhancedActionButton('stance_neutral', 'Neutral Stance', actionsContainer);
      }
      
      // Retreat from battle option
      createEnhancedActionButton('retreat_combat', 'Retreat from Battle', actionsContainer);
    };
    
    // Enhanced handleCombatAction
    window.CombatSystem.handleCombatAction = function(action) {
      console.log("Enhanced handleCombatAction called with:", action);
      
      // Get the current combat state
      const staminaCost = getAdjustedStaminaCost(action);
      const oldStance = window.gameState.combatStance || 'neutral';
      
      // Deduct stamina if applicable
      if (staminaCost > 0) {
        window.gameState.stamina = Math.max(0, window.gameState.stamina - staminaCost);
        
        // Update stamina display
        if (window.UI && window.UI.combat) {
          window.UI.combat.updateStaminaDisplay();
        }
      }
      
      // Handle stance changes specially
      if (action.startsWith('stance_')) {
        const stance = action.replace('stance_', '');
        window.gameState.combatStance = stance;
        
        // Apply stance transition effects
        applyStanceTransition(oldStance, stance);
        
        enhanceCombatLog(`You switch to a ${stance} stance.`, 'stance');
        
        // Update available actions after stance change
        this.updateCombatActions();
        
        // Update UI feedback
        enhanceCombatUI();
        return;
      }
      
      // Handle retreat from combat separately
      if (action === 'retreat_combat') {
        this.attemptRetreat();
        return;
      }
      
      // Handle rest action separately
      if (action === 'rest_combat') {
        this.performRest();
        return;
      }
      
      // Process special actions
      if (action === 'heavyAttack') {
        this.performHeavyAttack();
      } else if (action === 'quickAttack') {
        this.performQuickAttack();
      } else {
        // Use original handler for other actions
        originalHandleCombatAction.call(this, action);
      }
      
      // Increment combat fatigue slightly
      combatFatigue = Math.min(MAX_FATIGUE, combatFatigue + 0.2);
      
      // Update UI feedback
      enhanceCombatUI();
    };
    
    // Add new combat actions
    
    // Heavy attack function
    window.CombatSystem.performHeavyAttack = function() {
      // Get combat state
      const playerStance = window.gameState.combatStance || 'neutral';
      const enemyStance = window.gameState.enemyStance || 'neutral';
      const playerSkill = window.player.skills.melee || 0;
      const enemyDefense = window.gameState.currentEnemy?.defense || 5;
      const playerMomentum = window.gameState.playerMomentum || 0;
      
      // Calculate hit chance (lower than regular attack)
      let hitChance = 50 + playerSkill * 2 - enemyDefense * 2 + playerMomentum * 5;
      
      // Add stance matchup bonus
      const [attackBonus] = getStanceMatchup(playerStance, enemyStance);
      hitChance += attackBonus;
      
      // Add environmental modifier
      const [envAttackMod] = calculateEnvironmentModifiers();
      hitChance += envAttackMod;
      
      // Aggressive stance helps heavy attacks
      if (playerStance === 'aggressive') {
        hitChance += 10;
      }
      
      // Clamp hit chance
      hitChance = Math.min(95, Math.max(5, hitChance));
      
      // Roll for hit
      const roll = Math.random() * 100;
      
      // Log attack
      enhanceCombatLog(`You wind up for a heavy attack against the ${window.gameState.currentEnemy?.name}...`);
      
      setTimeout(() => {
        if (roll <= hitChance) {
          // Hit success - calculate heavy damage
          this.resolveHeavyAttackSuccess();
        } else {
          // Miss with consequences (opponent may counter)
          enhanceCombatLog(`Miss! Your heavy attack leaves you exposed.`, 'player-miss');
          
          // Lose momentum after miss
          window.gameState.playerMomentum = Math.max(-5, window.gameState.playerMomentum - 2);
          window.gameState.consecutiveHits = 0;
          
          // Check for counter attack based on enemy stance
          if (enemyStance === 'defensive') {
            enhanceCombatLog(`The ${window.gameState.currentEnemy?.name} sees an opening for a counter attack!`, 'enemy-hit');
            
            setTimeout(() => {
              this.processEnemyAttack("counter");
            }, 1000);
          }
        }
        
        // Update UI feedback
        enhanceCombatUI();
      }, 1000);
    };
    
    // Heavy attack success resolution
    window.CombatSystem.resolveHeavyAttackSuccess = function() {
      // Calculate heavy damage
      const playerSkill = window.player.skills.melee || 0;
      const playerStrength = window.player.phy || 0;
      const baseDamage = 5 + playerSkill * 0.5 + playerStrength * 0.9;
      const momentum = window.gameState.playerMomentum || 0;
      const momentumBonus = momentum > 0 ? momentum : 0;
      
      let damage = baseDamage + momentumBonus;
      
      // Aggressive stance increases damage
      if (window.gameState.combatStance === 'aggressive') {
        damage *= 1.5;
      }
      
      // Enemy defensive stance reduces damage
      if (window.gameState.enemyStance === 'defensive') {
        damage *= 0.6;
      }
      
      // Critical hit chance (higher for heavy attacks)
      const critChance = 15 + playerSkill * 0.5 + (window.gameState.consecutiveHits * 3);
      const critRoll = Math.random() * 100;
      
      let isCritical = false;
      if (critRoll <= critChance) {
        isCritical = true;
        damage *= 1.8; // Higher critical multiplier for heavy attacks
      }
      
      // Apply final damage
      damage = Math.round(damage);
      window.gameState.currentEnemy.health -= damage;
      
      // Update enemy health display
      const enemyHealthDisplay = document.getElementById('enemyHealthDisplay');
      const enemyCombatHealth = document.getElementById('enemyCombatHealth');
      
      if (enemyHealthDisplay) {
        enemyHealthDisplay.textContent = `${Math.max(0, window.gameState.currentEnemy.health)} HP`;
      }
      
      if (enemyCombatHealth) {
        const healthPercent = Math.max(0, (window.gameState.currentEnemy.health / window.gameState.currentEnemy.maxHealth) * 100);
        enemyCombatHealth.style.width = `${healthPercent}%`;
      }
      
      // Update combat log
      if (isCritical) {
        enhanceCombatLog(`Your heavy attack lands with devastating force for ${damage} damage!`, 'critical-hit');
      } else {
        enhanceCombatLog(`Your heavy attack strikes the ${window.gameState.currentEnemy.name} for ${damage} damage.`, 'player-hit');
      }
      
      // Update momentum and consecutive hits
      window.gameState.playerMomentum = Math.min(5, window.gameState.playerMomentum + 2);
      window.gameState.enemyMomentum = Math.max(-5, window.gameState.enemyMomentum - 2);
      window.gameState.consecutiveHits += 1;
      
      // Check for enemy defeat
      if (window.gameState.currentEnemy.health <= 0) {
        setTimeout(() => {
          enhanceCombatLog(`Victory! You have defeated the ${window.gameState.currentEnemy.name}!`, 'victory');
          
          // End combat with victory
          setTimeout(() => {
            this.endCombat('victory');
          }, 1500);
        }, 1000);
      }
    };
    
    // Quick attack function
    window.CombatSystem.performQuickAttack = function() {
      // Get combat state
      const playerStance = window.gameState.combatStance || 'neutral';
      const enemyStance = window.gameState.enemyStance || 'neutral';
      const playerSkill = window.player.skills.melee || 0;
      const enemyDefense = window.gameState.currentEnemy?.defense || 5;
      const playerMomentum = window.gameState.playerMomentum || 0;
      
      // Calculate hit chance (higher than regular attack)
      let hitChance = 70 + playerSkill * 3 - enemyDefense * 1.5 + playerMomentum * 5;
      
      // Add stance matchup bonus
      const [attackBonus] = getStanceMatchup(playerStance, enemyStance);
      hitChance += attackBonus;
      
      // Add environmental modifier
      const [envAttackMod] = calculateEnvironmentModifiers();
      hitChance += envAttackMod;
      
      // Evasive stance helps quick attacks
      if (playerStance === 'evasive') {
        hitChance += 10;
      }
      
      // Clamp hit chance
      hitChance = Math.min(95, Math.max(5, hitChance));
      
      // Roll for hit
      const roll = Math.random() * 100;
      
      // Log attack
      enhanceCombatLog(`You make a quick attack against the ${window.gameState.currentEnemy?.name}...`);
      
      setTimeout(() => {
        if (roll <= hitChance) {
          // Hit success - calculate quick attack damage
          this.resolveQuickAttackSuccess();
        } else {
          // Miss
          enhanceCombatLog(`Miss! Your quick attack fails to connect.`, 'player-miss');
          
          // Lose less momentum after quick attack miss
          window.gameState.playerMomentum = Math.max(-5, window.gameState.playerMomentum - 0.5);
          window.gameState.consecutiveHits = 0;
        }
        
        // Update UI feedback
        enhanceCombatUI();
      }, 1000);
    };
    
    // Quick attack success resolution
    window.CombatSystem.resolveQuickAttackSuccess = function() {
      // Calculate quick attack damage (lower than regular attack)
      const playerSkill = window.player.skills.melee || 0;
      const playerStrength = window.player.phy || 0;
      const baseDamage = 2 + playerSkill * 0.5 + playerStrength * 0.5;
      const momentum = window.gameState.playerMomentum || 0;
      const momentumBonus = momentum > 0 ? momentum * 0.5 : 0;
      
      let damage = baseDamage + momentumBonus;
      
      // Evasive stance increases quick attack damage
      if (window.gameState.combatStance === 'evasive') {
        damage *= 1.2;
      }
      
      // Enemy defensive stance reduces damage
      if (window.gameState.enemyStance === 'defensive') {
        damage *= 0.8;
      }
      
      // Critical hit chance 
      const critChance = 10 + playerSkill * 0.5 + (window.gameState.consecutiveHits * 5);
      const critRoll = Math.random() * 100;
      
      let isCritical = false;
      if (critRoll <= critChance) {
        isCritical = true;
        damage *= 1.5;
      }
      
      // Apply final damage
      damage = Math.round(damage);
      window.gameState.currentEnemy.health -= damage;
      
      // Update enemy health display
      const enemyHealthDisplay = document.getElementById('enemyHealthDisplay');
      const enemyCombatHealth = document.getElementById('enemyCombatHealth');
      
      if (enemyHealthDisplay) {
        enemyHealthDisplay.textContent = `${Math.max(0, window.gameState.currentEnemy.health)} HP`;
      }
      
      if (enemyCombatHealth) {
        const healthPercent = Math.max(0, (window.gameState.currentEnemy.health / window.gameState.currentEnemy.maxHealth) * 100);
        enemyCombatHealth.style.width = `${healthPercent}%`;
      }
      
      // Update combat log
      if (isCritical) {
        enhanceCombatLog(`Your quick attack finds a weak spot for ${damage} damage!`, 'critical-hit');
      } else {
        enhanceCombatLog(`Your quick attack strikes the ${window.gameState.currentEnemy.name} for ${damage} damage.`, 'player-hit');
      }
      
      // Update momentum and consecutive hits
      window.gameState.playerMomentum = Math.min(5, window.gameState.playerMomentum + 1);
      window.gameState.enemyMomentum = Math.max(-5, window.gameState.enemyMomentum - 0.5);
      window.gameState.consecutiveHits += 1;
      
      // Check for enemy defeat
      if (window.gameState.currentEnemy.health <= 0) {
        setTimeout(() => {
          enhanceCombatLog(`Victory! You have defeated the ${window.gameState.currentEnemy.name}!`, 'victory');
          
          // End combat with victory
          setTimeout(() => {
            this.endCombat('victory');
          }, 1500);
        }, 1000);
      }
    };
    
    // Rest action for stamina recovery in combat
    window.CombatSystem.performRest = function() {
      // Gain stamina
      const staminaRegen = calculateStaminaRegen() + 10; // Additional recovery for dedicated rest
      window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + staminaRegen);
      
      // Reduce fatigue
      combatFatigue = Math.max(0, combatFatigue - 2);
      
      // Log the action
      enhanceCombatLog(`You take a moment to catch your breath, recovering ${staminaRegen} stamina.`, 'stamina');
      
      // Update UI
      if (window.UI && window.UI.combat) {
        window.UI.combat.updateStaminaDisplay();
      }
      
      // Process enemy turn after a short delay
      setTimeout(() => {
        this.processEnemyTurn();
      }, 1000);
    };
    
    // Enhanced process enemy turn with improved AI
    window.CombatSystem.processEnemyTurn = function() {
      // Check if enemy is already defeated
      if (window.gameState.currentEnemy.health <= 0) return;
      
      // Wait a moment before processing enemy action
      setTimeout(() => {
        enhanceCombatLog(`The ${window.gameState.currentEnemy.name} prepares to act...`);
        
        // See if enemy uses a special ability
        const enemy = window.gameState.currentEnemy;
        if (enemy.specialAbilities && enemy.specialAbilities.length > 0) {
          // Try to use a random special ability
          const ability = enemy.specialAbilities[Math.floor(Math.random() * enemy.specialAbilities.length)];
          const abilityUsed = processEnemySpecialAbility(ability, enemy);
          if (abilityUsed) {
            // Special ability was used, store last action and return
            window.gameState.lastEnemyAction = 'special_' + ability;
            return;
          }
        }
        
        // Determine enemy action based on enhanced AI
        const enemyAction = enhancedEnemyDecisionMaking();
        
        // Store last action for combo tracking
        window.gameState.lastEnemyAction = enemyAction;
        
        // Process the enemy action
        setTimeout(() => {
          this.processEnemyAction(enemyAction);
        }, 1000);
      }, 1500);
    };
    
    // Enhanced process enemy attack with improved hit calculations
    window.CombatSystem.processEnemyAttack = function(type = "normal") {
      // Get combat state
      const playerStance = window.gameState.combatStance || 'neutral';
      const enemyStance = window.gameState.enemyStance || 'neutral';
      const enemySkill = window.gameState.currentEnemy?.skill || 5;
      const playerDefense = (window.player.skills.melee || 0) * 0.5;
      const playerEvasion = (window.player.phy || 0) * 0.3;
      const enemyMomentum = window.gameState.enemyMomentum || 0;
      
      // Calculate hit chance
      let hitChance = 60 + enemySkill * 3 - playerDefense * 2 - playerEvasion + enemyMomentum * 5;
      
      // Add stance matchup effects
      const [, defenseBonus, dodgeBonus] = getStanceMatchup(playerStance, enemyStance);
      hitChance -= (defenseBonus + dodgeBonus) / 2;
      
      // Get environmental modifiers
      const [, envDefenseMod, envDodgeMod] = calculateEnvironmentModifiers();
      hitChance -= (envDefenseMod + envDodgeMod) / 2;
      
      // Adjust based on stances
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
      
      // Add bonus for opportunity attacks
      if (type === "opportunity") {
        hitChance += 10;
      }
      
      // Apply player dodge penalty if any
      if (window.gameState.playerDodgePenalty) {
        hitChance += window.gameState.playerDodgePenalty;
      }
      
      // Apply player defense bonus if any
      if (window.gameState.playerDefenseBonus) {
        hitChance -= window.gameState.playerDefenseBonus;
        window.gameState.playerDefenseBonus = 0; // Reset bonus after use
      }
      
      // Apply player evasion bonus if any
      if (window.gameState.playerEvasionBonus) {
        hitChance -= window.gameState.playerEvasionBonus;
        window.gameState.playerEvasionBonus = 0; // Reset bonus after use
      }
      
      // Clamp hit chance
      hitChance = Math.min(95, Math.max(5, hitChance));
      
      // Roll for hit
      const roll = Math.random() * 100;
      
      if (type === "opportunity") {
        enhanceCombatLog(`The ${window.gameState.currentEnemy?.name} takes advantage of your failed retreat with an attack...`);
      } else {
        enhanceCombatLog(`The ${window.gameState.currentEnemy?.name} attacks you...`);
      }
      
      setTimeout(() => {
        if (roll <= hitChance) {
          // Hit success - enhanced damage calculation
          this.resolveEnhancedEnemySuccessfulAttack();
        } else {
          // Miss
          enhanceCombatLog(`Miss! The ${window.gameState.currentEnemy?.name}'s attack fails to connect.`, 'enemy-miss');
          
          // Enemy loses momentum after miss
          window.gameState.enemyMomentum = Math.max(-5, window.gameState.enemyMomentum - 1);
          
          // Player gains a small momentum boost from successful dodge/block
          window.gameState.playerMomentum = Math.min(5, window.gameState.playerMomentum + 0.5);
        }
      }, 1000);
    };
    
    // Enhanced enemy attack success resolution
    window.CombatSystem.resolveEnhancedEnemySuccessfulAttack = function() {
      // Calculate damage with enhanced formula
      const enemy = window.gameState.currentEnemy;
      const enemySkill = enemy?.skill || 5;
      const enemyStrength = enemy?.strength || 5;
      const baseDamage = 3 + enemySkill * 0.3 + enemyStrength * 0.5;
      const momentum = window.gameState.enemyMomentum || 0;
      const momentumBonus = momentum > 0 ? momentum : 0;
      
      let damage = baseDamage + momentumBonus;
      
      // Apply enemy damage bonus if any
      if (window.gameState.enemyDamageBonus) {
        damage *= (1 + window.gameState.enemyDamageBonus);
      }
      
      // Aggressive stance increases damage
      if (window.gameState.enemyStance === 'aggressive') {
        damage *= 1.3;
      }
      
      // Player defensive stance reduces damage
      if (window.gameState.combatStance === 'defensive') {
        damage *= 0.7;
      }
      
      // Critical hit chance
      const critChance = 5 + enemySkill * 0.3;
      const critRoll = Math.random() * 100;
      
      let isCritical = false;
      if (critRoll <= critChance) {
        isCritical = true;
        damage *= 1.5;
      }
      
      // Apply final damage
      damage = Math.round(damage);
      window.gameState.health = Math.max(0, window.gameState.health - damage);
      
      // Update player health display
      const playerHealthDisplay = document.getElementById('playerHealthDisplay');
      const playerCombatHealth = document.getElementById('playerCombatHealth');
      
      if (playerHealthDisplay) {
        playerHealthDisplay.textContent = `${Math.max(0, window.gameState.health)} HP`;
      }
      
      if (playerCombatHealth) {
        const healthPercent = Math.max(0, (window.gameState.health / window.gameState.maxHealth) * 100);
        playerCombatHealth.style.width = `${healthPercent}%`;
      }
      
      // Update combat log
      if (isCritical) {
        enhanceCombatLog(`<span class="critical-hit">Critical hit!</span> The ${enemy.name} lands a powerful blow on you for ${damage} damage!`, 'critical-hit');
      } else {
        enhanceCombatLog(`Hit! The ${enemy.name} strikes you for ${damage} damage.`, 'enemy-hit');
      }
      
      // Update momentum
      window.gameState.enemyMomentum = Math.min(5, window.gameState.enemyMomentum + 1);
      window.gameState.playerMomentum = Math.max(-5, window.gameState.playerMomentum - 1);
      
      // Check for player defeat
      if (window.gameState.health <= 0) {
        setTimeout(() => {
          enhanceCombatLog(`Defeat! You have been overwhelmed by the ${enemy.name}!`, 'defeat');
          
          // End combat with defeat
          setTimeout(() => {
            this.endCombat('defeat');
          }, 1500);
        }, 1000);
      }
    };
    
    // Replace original enemy attack resolution
    window.CombatSystem.resolveEnemySuccessfulAttack = function() {
      this.resolveEnhancedEnemySuccessfulAttack();
    };
    
    // Replace original enemy action processing with enhanced version
    window.CombatSystem.processEnemyAction = function(action) {
      // Handle stance changes separately
      if (action.startsWith('stance_')) {
        const stance = action.replace('stance_', '');
        window.gameState.enemyStance = stance;
        
        enhanceCombatLog(`The ${window.gameState.currentEnemy.name} switches to a ${stance} stance.`, 'stance');
        
        // Update UI feedback
        enhanceCombatUI();
        return;
      }
      
      // Process normal actions
      switch(action) {
        case 'attack':
          this.processEnemyAttack();
          break;
        case 'heavyAttack':
          enhanceCombatLog(`The ${window.gameState.currentEnemy.name} prepares a powerful attack!`);
          setTimeout(() => {
            this.processEnemyAttack("heavy");
          }, 1000);
          break;
        case 'quickAttack':
          enhanceCombatLog(`The ${window.gameState.currentEnemy.name} lunges with a quick attack!`);
          setTimeout(() => {
            this.processEnemyAttack("quick");
          }, 750);
          break;
        case 'defend':
          enhanceCombatLog(`The ${window.gameState.currentEnemy.name} takes a defensive position.`, 'stance');
          window.gameState.enemyStance = 'defensive';
          enhanceCombatUI();
          break;
        case 'dodge':
          enhanceCombatLog(`The ${window.gameState.currentEnemy.name} becomes more evasive.`, 'stance');
          window.gameState.enemyStance = 'evasive';
          enhanceCombatUI();
          break;
        case 'advance':
          const currentDistance = window.gameState.combatDistance;
          if (currentDistance > 0) {
            window.gameState.combatDistance = currentDistance - 1;
            const newDistance = currentDistance - 1 === 0 ? 'close' : 'medium';
            enhanceCombatLog(`The ${window.gameState.currentEnemy.name} advances toward you, closing to ${newDistance} range.`, 'movement');
            
            // Update UI
            if (window.UI && window.UI.combat) {
              window.UI.combat.updateDistanceIndicator();
            }
            
            // Gain momentum if advancing aggressively
            if (window.gameState.enemyStance === 'aggressive') {
              window.gameState.enemyMomentum = Math.min(5, window.gameState.enemyMomentum + 1);
              if (window.UI && window.UI.combat) {
                window.UI.combat.updateMomentumIndicator();
              }
            }
          } else {
            enhanceCombatLog(`The ${window.gameState.currentEnemy.name} is already at close range with you.`);
          }
          break;
        case 'retreat':
          const distanceCurrent = window.gameState.combatDistance;
          if (distanceCurrent < 2) {
            window.gameState.combatDistance = distanceCurrent + 1;
            const newDistance = distanceCurrent + 1 === 1 ? 'medium' : 'far';
            enhanceCombatLog(`The ${window.gameState.currentEnemy.name} retreats from you, moving to ${newDistance} range.`, 'movement');
            
            // Update UI
            if (window.UI && window.UI.combat) {
              window.UI.combat.updateDistanceIndicator();
            }
            
            // Potentially lose momentum when retreating
            if (window.gameState.enemyStance !== 'evasive') {
              window.gameState.enemyMomentum = Math.max(-5, window.gameState.enemyMomentum - 1);
              if (window.UI && window.UI.combat) {
                window.UI.combat.updateMomentumIndicator();
              }
            }
          } else {
            enhanceCombatLog(`The ${window.gameState.currentEnemy.name} is already at far range from you.`);
          }
          break;
        case 'aim':
          enhanceCombatLog(`The ${window.gameState.currentEnemy.name} takes careful aim.`);
          window.gameState.enemyAimBonus = 20;
          break;
        case 'shoot':
          this.processEnemyRangedAttack();
          break;
        case 'feint':
          this.processEnemyFeint();
          break;
        case 'grapple':
          this.processEnemyGrapple();
          break;
        default:
          enhanceCombatLog(`The ${window.gameState.currentEnemy.name} observes you carefully.`);
      }
      
      // Update combat UI after enemy action
      this.updateCombatActions();
    };
    
    // Enhanced enemy ranged attack
    window.CombatSystem.processEnemyRangedAttack = function() {
      const enemy = window.gameState.currentEnemy;
      const distance = window.gameState.combatDistance;
      const playerStance = window.gameState.combatStance;
      
      // Calculate hit chance
      let hitChance = 50 + (enemy.skill || 5) * 2;
      
      // Apply aim bonus if any
      if (window.gameState.enemyAimBonus) {
        hitChance += window.gameState.enemyAimBonus;
        window.gameState.enemyAimBonus = 0; // Reset after use
      }
      
      // Distance affects accuracy
      if (distance === 1) { // Medium range
        hitChance += 10;
      } else if (distance === 0) { // Close range
        hitChance -= 10;
      }
      
      // Evasive stance helps dodge
      if (playerStance === 'evasive') {
        hitChance -= 15;
      }
      
      // Clamp hit chance
      hitChance = Math.min(95, Math.max(5, hitChance));
      
      // Roll for hit
      const roll = Math.random() * 100;
      
      enhanceCombatLog(`The ${enemy.name} fires at you...`);
      
      setTimeout(() => {
        if (roll <= hitChance) {
          // Calculate damage (typically higher than melee but less affected by strength)
          const damage = Math.round(4 + (enemy.skill || 5) * 0.7);
          
          // Apply damage
          window.gameState.health = Math.max(0, window.gameState.health - damage);
          
          // Update player health display
          const playerHealthDisplay = document.getElementById('playerHealthDisplay');
          const playerCombatHealth = document.getElementById('playerCombatHealth');
          
          if (playerHealthDisplay) {
            playerHealthDisplay.textContent = `${Math.max(0, window.gameState.health)} HP`;
          }
          
          if (playerCombatHealth) {
            const healthPercent = Math.max(0, (window.gameState.health / window.gameState.maxHealth) * 100);
            playerCombatHealth.style.width = `${healthPercent}%`;
          }
          
          enhanceCombatLog(`Hit! The ${enemy.name}'s shot strikes you for ${damage} damage.`, 'enemy-hit');
          
          // Check for player defeat
          if (window.gameState.health <= 0) {
            setTimeout(() => {
              enhanceCombatLog(`Defeat! You have been overwhelmed by the ${enemy.name}!`, 'defeat');
              
              // End combat with defeat
              setTimeout(() => {
                this.endCombat('defeat');
              }, 1500);
            }, 1000);
          }
        } else {
          enhanceCombatLog(`Miss! The ${enemy.name}'s shot goes wide.`, 'enemy-miss');
        }
      }, 1000);
    };
    
    // Process enemy feint
    window.CombatSystem.processEnemyFeint = function() {
      enhanceCombatLog(`The ${window.gameState.currentEnemy.name} attempts to feint...`);
      
      // Calculate success chance
      const enemySkill = window.gameState.currentEnemy.skill || 5;
      const playerSkill = (window.player.skills.tactics || 0) + (window.player.skills.melee || 0) / 2;
      
      let feintChance = 50 + enemySkill * 3 - playerSkill * 2;
      
      // Adjust for stances
      if (window.gameState.enemyStance === 'aggressive') {
        feintChance += 10;
      }
      
      if (window.gameState.combatStance === 'defensive') {
        feintChance -= 15;
      }
      
      // Clamp chance
      feintChance = Math.min(90, Math.max(10, feintChance));
      
      // Roll for success
      const roll = Math.random() * 100;
      
      setTimeout(() => {
        if (roll <= feintChance) {
          // Success
          enhanceCombatLog(`Success! The ${window.gameState.currentEnemy.name}'s feint catches you off guard.`, 'enemy-hit');
          
          // Reduce player momentum and increase enemy momentum
          window.gameState.playerMomentum = Math.max(-5, window.gameState.playerMomentum - 2);
          window.gameState.enemyMomentum = Math.min(5, window.gameState.enemyMomentum + 2);
          
          // Update UI
          if (window.UI && window.UI.combat) {
            window.UI.combat.updateMomentumIndicator();
          }
          
          // Enemy may follow up with an attack
          if (Math.random() < 0.5) {
            setTimeout(() => {
              enhanceCombatLog(`The ${window.gameState.currentEnemy.name} follows up with a quick attack!`);
              this.processEnemyAttack("quick");
            }, 1000);
          }
        } else {
          // Failure
          enhanceCombatLog(`Failed! You see through the ${window.gameState.currentEnemy.name}'s feint.`, 'enemy-miss');
          
          // Reduce enemy momentum
          window.gameState.enemyMomentum = Math.max(-5, window.gameState.enemyMomentum - 1);
          
          // Update UI
          if (window.UI && window.UI.combat) {
            window.UI.combat.updateMomentumIndicator();
          }
        }
      }, 1000);
    };
    
    // Process enemy grapple
    window.CombatSystem.processEnemyGrapple = function() {
      enhanceCombatLog(`The ${window.gameState.currentEnemy.name} attempts to grapple you...`);
      
      // Calculate success chance
      const enemyStrength = window.gameState.currentEnemy.strength || 5;
      const playerStrength = window.player.phy || 5;
      
      let grappleChance = 50 + enemyStrength * 3 - playerStrength * 2;
      
      // Adjust for stances
      if (window.gameState.enemyStance === 'aggressive') {
        grappleChance += 10;
      }
      
      if (window.gameState.combatStance === 'evasive') {
        grappleChance -= 15;
      }
      
      // Clamp chance
      grappleChance = Math.min(90, Math.max(10, grappleChance));
      
      // Roll for success
      const roll = Math.random() * 100;
      
      setTimeout(() => {
        if (roll <= grappleChance) {
          // Success
          enhanceCombatLog(`Success! The ${window.gameState.currentEnemy.name} grabs you in a tight hold.`, 'enemy-hit');
          
          // Apply effects - reduce player dodge chance, add damage
          window.gameState.playerGrappled = true;
          window.gameState.playerMomentum = Math.max(-5, window.gameState.playerMomentum - 2);
          window.gameState.enemyMomentum = Math.min(5, window.gameState.enemyMomentum + 2);
          
          // Deal some damage from the grapple
          const damage = Math.round(2 + enemyStrength * 0.3);
          window.gameState.health = Math.max(0, window.gameState.health - damage);
          
          // Update player health display
          if (window.UI && window.UI.combat) {
            window.UI.combat.updateHealthDisplay();
          }
          
          enhanceCombatLog(`The grapple inflicts ${damage} damage and limits your movement.`, 'enemy-hit');
          
          // Check for player defeat
          if (window.gameState.health <= 0) {
            setTimeout(() => {
              enhanceCombatLog(`Defeat! You have been overwhelmed by the ${window.gameState.currentEnemy.name}!`, 'defeat');
              
              // End combat with defeat
              setTimeout(() => {
                this.endCombat('defeat');
              }, 1500);
            }, 1000);
          }
        } else {
          // Failure
          enhanceCombatLog(`Failed! You break free from the ${window.gameState.currentEnemy.name}'s grapple attempt.`, 'enemy-miss');
          
          // Reduce enemy momentum
          window.gameState.enemyMomentum = Math.max(-5, window.gameState.enemyMomentum - 1);
        }
        
        // Update UI
        if (window.UI && window.UI.combat) {
          window.UI.combat.updateMomentumIndicator();
        }
      }, 1000);
    };
    
    // Enhanced getEnemyByType with difficulty scaling
    window.CombatSystem.getEnemyByType = function(enemyType) {
      // Call original function to get base enemy
      const baseEnemy = originalGetEnemyByType.call(this, enemyType);
      
      // Apply difficulty scaling
      return scaleEnemyForPlayerLevel(baseEnemy);
    };
    
    // Initialize enhanced UI elements when combat starts
    const originalSetupCombatUI = window.UI && window.UI.combat && window.UI.combat.setup;
    if (originalSetupCombatUI) {
      window.UI.combat.setup = function(enemy, environment) {
        // Call original function
        originalSetupCombatUI.call(this, enemy, environment);
        
        // Add enhanced UI elements
        enhanceCombatUI();
      };
    }
    
    // Install enhanced combat action buttons
    if (window.UI && window.UI.combat) {
      window.UI.combat.addEnhancedActionButton = createEnhancedActionButton;
    }
    
    console.log("Combat enhancements successfully integrated with CombatSystem");
  } else {
    console.warn("CombatSystem not found, combat enhancements waiting for system to load");
    
    // Try to hook in after a delay
    setTimeout(() => {
      if (window.CombatSystem) {
        console.log("CombatSystem found after delay, initializing enhancements");
        enhanceCombatSystem();
      } else {
        console.error("CombatSystem not available, combat enhancements could not be installed");
      }
    }, 2000);
  }
})();

// CSS styles for enhanced combat feedback
(function() {
  // Create stylesheet for combat enhancements
  const style = document.createElement('style');
  style.textContent = `
    .action-btn {
      position: relative;
    }
    
    .action-btn.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .stamina-cost {
      color: #4bbfff;
      font-size: 0.8em;
      display: block;
    }
    
    .high-chance {
      color: #4bff91;
    }
    
    .medium-chance {
      color: #4bbfff;
    }
    
    .low-chance {
      color: #ffb74b;
    }
    
    .very-low-chance {
      color: #ff4b4b;
    }
    
    .critical-hit {
      color: #ff4b4b;
      font-weight: bold;
    }
    
    .stance-advantage {
      background-color: rgba(75, 255, 145, 0.2);
      border-left: 3px solid #4bff91;
      padding-left: 5px;
    }
    
    .stance-disadvantage {
      background-color: rgba(255, 75, 75, 0.2);
      border-left: 3px solid #ff4b4b;
      padding-left: 5px;
    }
    
    #stanceMatchupIndicator, #environmentEffectsIndicator {
      margin: 5px 0;
      padding: 5px;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .stamina-high {
      color: #4bff91;
    }
    
    .stamina-medium {
      color: #ffb74b;
    }
    
    .stamina-low {
      color: #ff4b4b;
    }
  `;
  
  document.head.appendChild(style);
})();

// Register enhanced combat log with UI system
if (window.UI && window.UI.combat) {
  window.UI.combat.enhancedCombatLog = enhanceCombatLog;
}

// Add initialization for combat phase 5 enhancements
document.addEventListener('DOMContentLoaded', function() {
  console.log("Combat Phase 5 enhancements initialized");
  
  // Create a small notification to show the system is active
  setTimeout(() => {
    if (typeof window.showNotification === 'function') {
      window.showNotification("Combat Enhancements Activated", "info");
    }
  }, 2000);
});
