// COMBAT SYSTEM MODULE
// Functions related to combat mechanics

// Function to create enemy for combat encounters
window.createEnemy = function(enemyType) {
  const enemies = {
    "arrasi_scout": {
      name: "Arrasi Scout",
      health: 30,
      attack: 4,
      defense: 2,
      description: "A lightly armored scout from the Arrasi tribes. Fast and precise.",
      tactics: ["Quick Strike", "Retreat", "Aimed Shot"]
    },
    "arrasi_warrior": {
      name: "Arrasi Warrior",
      health: 45,
      attack: 6,
      defense: 3,
      description: "A hardened tribal warrior wielding a curved blade and buckler.",
      tactics: ["Heavy Slash", "Shield Block", "War Cry"]
    },
    "imperial_deserter": {
      name: "Imperial Deserter",
      health: 35,
      attack: 5,
      defense: 3,
      description: "A former soldier who abandoned their post. Desperate and dangerous.",
      tactics: ["Standard Attack", "Desperate Lunge", "Defensive Stance"]
    },
    "wild_beast": {
      name: "Wild Beast",
      health: 40,
      attack: 7,
      defense: 1,
      description: "A large predator native to these lands, driven to attack by hunger.",
      tactics: ["Claw Swipe", "Pounce", "Intimidating Roar"]
    }
  };
  
  return enemies[enemyType] || enemies.arrasi_scout;
};

// Function to check for combat encounters
window.checkForCombatEncounters = function(action) {
  // Don't trigger combat if already in a story encounter or battle
  if (window.gameState.inStoryEncounter || window.gameState.inBattle || window.gameState.inMission) return;
  
  // Only certain actions have a chance for combat
  if (action === 'patrol' || action === 'scout') {
    // Base chance depends on action
    let combatChance = action === 'patrol' ? 0.15 : 0.25;
    
    // Adjust for day/night and weather
    const hours = Math.floor(window.gameTime / 60);
    if (hours < 6 || hours >= 20) {
      combatChance += 0.1; // More dangerous at night
    }
    
    if (window.gameState.weather === 'foggy') {
      combatChance += 0.05;
    }
    
    // Check for combat
    if (Math.random() < combatChance) {
      // Determine enemy type
      const enemyOptions = ['arrasi_scout', 'wild_beast'];
      if (action === 'patrol' && window.gameState.mainQuest.stage > 1) {
        enemyOptions.push('arrasi_warrior');
      }
      if (window.gameDay > 3) {
        enemyOptions.push('imperial_deserter');
      }
      
      const enemyType = enemyOptions[Math.floor(Math.random() * enemyOptions.length)];
      
      // Initiate combat
      window.startCombat(enemyType);
    }
  }
};

// Function to start combat
window.startCombat = function(enemyType) {
  // Create enemy
  const enemy = window.createEnemy(enemyType);
  if (!enemy) {
    console.error("Failed to create enemy of type: " + enemyType);
    return;
  }
  
  // Store enemy in game state
  window.gameState.currentEnemy = enemy;
  window.gameState.inBattle = true;
  
  // Setup combat UI
  document.getElementById('enemyName').textContent = enemy.name;
  document.getElementById('enemyHealthDisplay').textContent = `${enemy.health} HP`;
  document.getElementById('playerHealthDisplay').textContent = `${Math.round(window.gameState.health)} HP`;
  
  // Store original health for percentage calculations
  enemy.originalHealth = enemy.health;
  
  // Update health bars
  document.getElementById('enemyCombatHealth').style.width = '100%';
  document.getElementById('playerCombatHealth').style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
  
  // Show combat interface
  document.getElementById('combatInterface').classList.remove('hidden');
  
  // Add combat actions
  const combatActions = document.getElementById('combatActions');
  combatActions.innerHTML = '';
  
  // Standard combat options
  window.addCombatButton('attack', 'Attack', combatActions);
  window.addCombatButton('defend', 'Defend', combatActions);
  
  // Career-specific actions
  if (window.player.career && window.player.career.title) {
    if (window.player.career.title.includes('Berserker')) {
      window.addCombatButton('rage', 'Berserker Rage', combatActions);
    } else if (window.player.career.title.includes('Scout') || window.player.career.title.includes('Marksman')) {
      window.addCombatButton('aimed_shot', 'Aimed Shot', combatActions);
    } else if (window.player.career.title.includes('Geister')) {
      window.addCombatButton('banish', 'Spectral Banishment', combatActions);
    }
  }
  
  // Retreat option
  window.addCombatButton('retreat', 'Retreat', combatActions);
  
  // Set combat log
  document.getElementById('combatLog').innerHTML = `<p>You are engaged in combat with a ${enemy.name}. ${enemy.description}</p>`;
  
  // Disable regular action buttons during combat
  document.getElementById('actions').style.display = 'none';
};

// Function to add combat button
window.addCombatButton = function(action, label, container) {
  const btn = document.createElement('button');
  btn.className = 'action-btn';
  btn.textContent = label;
  btn.setAttribute('data-action', action);
  btn.onclick = function() {
    window.combatAction(action);
  };
  container.appendChild(btn);
};

// Function to handle combat action
window.combatAction = function(action) {
  const enemy = window.gameState.currentEnemy;
  if (!enemy) return;
  
  // Process the combat action
  const result = window.processCombatAction(action, enemy);
  if (!result) return;
  
  // Update the combat log
  const combatLog = document.getElementById('combatLog');
  combatLog.innerHTML += `<p>${result.narrative}</p>`;
  
  // Show skill improvements if any
  if (result.skillImprovement && Object.keys(result.skillImprovement).length > 0) {
    let skillText = "<p>Skills improved: ";
    for (const [skill, value] of Object.entries(result.skillImprovement)) {
      skillText += `${skill} +${value}, `;
    }
    skillText = skillText.slice(0, -2) + "</p>"; // Remove last comma and space
    combatLog.innerHTML += skillText;
  }
  
  combatLog.scrollTop = combatLog.scrollHeight;
  
  // Update health displays
  document.getElementById('enemyHealthDisplay').textContent = `${Math.max(0, enemy.health)} HP`;
  document.getElementById('playerHealthDisplay').textContent = `${Math.max(0, Math.round(window.gameState.health))} HP`;
  
  // Update combat health bars
  document.getElementById('enemyCombatHealth').style.width = `${Math.max(0, (enemy.health / enemy.originalHealth) * 100)}%`;
  document.getElementById('playerCombatHealth').style.width = `${Math.max(0, (window.gameState.health / window.gameState.maxHealth) * 100)}%`;
  
  // Check for end of combat
  if (result.battleOver) {
    // Wait a moment before ending combat to show the result
    setTimeout(() => {
      if (window.gameState.inMissionCombat) {
        window.endMissionCombat(result);
      } else {
        window.endCombat(result);
      }
    }, 1500);
  }
};

// Process combat action with stat improvements
window.processCombatAction = function(action, enemy) {
  if (!enemy) return null;
  
  let result = {
    playerDamage: 0,
    enemyDamage: 0,
    narrative: "",
    battleOver: false,
    victory: false,
    retreatSuccess: false,
    skillImprovement: {}
  };
  
  // Process player action
  switch(action) {
    case "attack":
      // Calculate player damage based on physical attribute and melee skill
      const baseDamage = (window.player.phy * 0.6) + (window.player.skills.melee * 0.4) + Math.floor(Math.random() * 3);
      const effectiveDamage = Math.max(1, Math.round(baseDamage - enemy.defense));
      result.enemyDamage = effectiveDamage;
      result.narrative = `You strike at the ${enemy.name}, dealing ${effectiveDamage} damage.`;
      
      // Small chance to improve melee skill during combat
      const meleeImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
      const meleeCap = Math.floor(window.player.phy / 1.5);
      
      if (Math.random() < 0.3 && window.player.skills.melee < meleeCap) {
        window.player.skills.melee = Math.min(meleeCap, window.player.skills.melee + meleeImprovement);
        result.skillImprovement.melee = meleeImprovement;
      }
      break;
      
    case "defend":
      // Increase defense for this round
      result.playerDefenseBonus = 2;
      result.narrative = `You take a defensive stance, preparing to ward off the next attack.`;
      
      // Small chance to improve discipline
      const disciplineImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
      const mentalSkillCap = Math.floor(window.player.men / 1.5);
      
      if (Math.random() < 0.3 && window.player.skills.discipline < mentalSkillCap) {
        window.player.skills.discipline = Math.min(mentalSkillCap, window.player.skills.discipline + disciplineImprovement);
        result.skillImprovement.discipline = disciplineImprovement;
      }
      break;
      
    case "rage":
      // Berserker special - high damage but take damage yourself
      const rageDamage = (window.player.phy * 0.9) + (window.player.skills.melee * 0.3) + Math.floor(Math.random() * 5);
      result.enemyDamage = Math.max(1, Math.round(rageDamage - enemy.defense));
      result.playerDamage = 2; // Self-damage from rage
      result.narrative = `With a primal roar, you unleash a devastating attack, dealing ${result.enemyDamage} damage, but straining yourself in the process.`;
      
      // Chance to improve physical attribute slightly from pushing limits
      if (Math.random() < 0.2) {
        const phyImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
        const maxPhy = window.player.men > 0 ? Math.min(15, Math.ceil(window.player.men / 0.6)) : 15;
        
        if (window.player.phy < maxPhy) {
          window.player.phy = Math.min(maxPhy, window.player.phy + phyImprovement);
          result.skillImprovement.phy = phyImprovement;
        }
      }
      break;
      
    case "aimed_shot":
      // Scout/Marksman special - chance for critical hit
      const critChance = 0.2 + (window.player.skills.marksmanship * 0.05);
      const isCritical = Math.random() < critChance;
      
      const aimDamage = (window.player.men * 0.4) + (window.player.skills.marksmanship * 0.6) + Math.floor(Math.random() * 3);
      result.enemyDamage = isCritical ? Math.round(aimDamage * 2) : Math.round(aimDamage);
      
      if (isCritical) {
        result.narrative = `You take careful aim and find a vulnerable spot, scoring a critical hit for ${result.enemyDamage} damage!`;
      } else {
        result.narrative = `Your aimed shot strikes true, dealing ${result.enemyDamage} damage.`;
      }
      
      // Chance to improve marksmanship
      const marksImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
      const marksmanshipCap = Math.floor((window.player.phy + window.player.men) / 3);
      
      if (Math.random() < 0.3 && window.player.skills.marksmanship < marksmanshipCap) {
        window.player.skills.marksmanship = Math.min(marksmanshipCap, window.player.skills.marksmanship + marksImprovement);
        result.skillImprovement.marksmanship = marksImprovement;
      }
      break;
      
    case "banish":
      // Geister special - effective against certain enemies
      const baseBanishDamage = (window.player.men * 0.7) + (window.player.skills.arcana * 0.3) + Math.floor(Math.random() * 4);
      result.enemyDamage = Math.round(baseBanishDamage);
      result.narrative = `You perform a quick ritual gesture, channeling mystical energies to harm your enemy for ${result.enemyDamage} damage.`;
      
      // Chance to improve arcana
      const arcanaImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
      const arcanaCap = Math.floor(window.player.men / 1.5);
      
      if (Math.random() < 0.3 && window.player.skills.arcana < arcanaCap) {
        window.player.skills.arcana = Math.min(arcanaCap, window.player.skills.arcana + arcanaImprovement);
        result.skillImprovement.arcana = arcanaImprovement;
      }
      break;
      
    case "retreat":
      // Attempt to flee - survival skill affects success chance
      const retreatChance = 0.3 + (window.player.skills.survival * 0.05);
      result.retreatSuccess = Math.random() < retreatChance;
      
      if (result.retreatSuccess) {
        result.narrative = `You successfully disengage from combat and retreat to safety.`;
        result.battleOver = true;
        
        // Chance to improve survival
        const survivalImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
        const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
        
        if (Math.random() < 0.4 && window.player.skills.survival < survivalCap) {
          window.player.skills.survival = Math.min(survivalCap, window.player.skills.survival + survivalImprovement);
          result.skillImprovement.survival = survivalImprovement;
        }
      } else {
        result.narrative = `Your attempt to retreat fails! The ${enemy.name} blocks your escape.`;
        // Enemy gets a free attack in the next step
      }
      break;
  }
  
  // Process enemy action (if player didn't successfully retreat)
  if (!result.retreatSuccess && !result.battleOver) {
    // Select random enemy tactic
    const tactic = enemy.tactics[Math.floor(Math.random() * enemy.tactics.length)];
    
    // Calculate enemy damage
    let enemyAttackDamage = enemy.attack + Math.floor(Math.random() * 3);
    
    // Apply defense bonus if player defended
    if (result.playerDefenseBonus) {
      enemyAttackDamage = Math.max(0, enemyAttackDamage - result.playerDefenseBonus);
    }
    
    // Apply player's base defense from stats
    enemyAttackDamage = Math.max(0, Math.round(enemyAttackDamage - (window.player.phy * 0.2)));
    
    result.playerDamage += enemyAttackDamage;
    result.narrative += ` The ${enemy.name} responds with ${tactic}, dealing ${enemyAttackDamage} damage.`;
  }
  
  // Update health
  enemy.health -= result.enemyDamage;
  window.gameState.health -= result.playerDamage;
  
  // Check for battle end conditions
  if (enemy.health <= 0) {
    result.battleOver = true;
    result.victory = true;
    result.narrative += ` With a final strike, you defeat the ${enemy.name}!`;
    
    // Log combat victory in player events
    window.player.events.push({
      day: window.gameDay,
      time: window.gameTime,
      action: "combat",
      outcome: "combat_victory",
      enemy: enemy.name
    });
    
    // Calculate rewards
    const expReward = 20 + (window.gameState.level * 5);
    window.gameState.experience += expReward;
    
    result.narrative += ` You gain ${expReward} experience.`;
    
    // Chance for loot
    if (Math.random() < 0.4) {
      const loot = window.generateLoot(enemy);
      if (window.player.inventory.length < 9) {
        window.player.inventory.push(loot);
        result.narrative += ` You find ${loot.name}.`;
      } else {
        result.narrative += ` You spotted ${loot.name} but couldn't carry it.`;
      }
    }
    
    // Unlock achievement if this is the first victory
    if (!window.gameState.combatVictoryAchieved) {
      window.gameState.combatVictoryAchieved = true;
      window.showAchievement("first_blood");
    }
  } else if (window.gameState.health <= 0) {
    result.battleOver = true;
    result.victory = false;
    result.narrative += ` You collapse from your wounds, unable to continue fighting.`;
    
    // Log combat defeat in player events
    window.player.events.push({
      day: window.gameDay,
      time: window.gameTime,
      action: "combat",
      outcome: "combat_defeat",
      enemy: enemy.name
    });
    
    // Prevent actual death, just severe consequences
    window.gameState.health = 1;
  }
  
  // Update profile if it's open
  window.updateProfileIfVisible();
  
  return result;
};

// Function to end combat
window.endCombat = function(result) {
  // Hide combat interface
  document.getElementById('combatInterface').classList.add('hidden');
  
  // Re-enable action buttons
  document.getElementById('actions').style.display = 'flex';
  
  // Add outcome narrative
  if (result.victory) {
    window.setNarrative(`You have defeated the ${window.gameState.currentEnemy.name}! ${result.narrative}`);
    
    // Update any combat-related quests
    window.gameState.sideQuests.forEach(quest => {
      if (quest.completed) return;
      
      quest.objectives.forEach(objective => {
        if (objective.completed) return;
        
        if (objective.text.toLowerCase().includes("defeat") || 
            objective.text.toLowerCase().includes("combat") || 
            objective.text.toLowerCase().includes("enemies")) {
          objective.count++;
          
          // Check if objective is completed
          if (objective.count >= objective.target) {
            objective.completed = true;
            window.showNotification(`Objective completed: ${objective.text}!`, 'success');
          } else {
            window.showNotification(`Objective progress: ${objective.count}/${objective.target}`, 'info');
          }
        }
      });
      
      // Check if quest is completed
      if (quest.objectives.every(obj => obj.completed)) {
        window.completeQuest(quest);
      }
    });
    
    // Apply rewards
    window.checkLevelUp();
  } else if (result.retreatSuccess) {
    window.setNarrative(`You managed to escape from the ${window.gameState.currentEnemy.name}.`);
    window.gameState.stamina = Math.max(0, window.gameState.stamina - 20);
  } else {
    window.setNarrative(`You were defeated by the ${window.gameState.currentEnemy.name}. You wake up later, having been dragged back to camp by a patrol. Your wounds have been treated, but you've lost some items and morale.`);
    
    // Penalties for defeat
    window.gameState.morale = Math.max(20, window.gameState.morale - 15);
    
    // Lose a random item
    if (window.player.inventory.length > 0) {
      const lostIndex = Math.floor(Math.random() * window.player.inventory.length);
      const lostItem = window.player.inventory.splice(lostIndex, 1)[0];
      window.addToNarrative(`You lost your ${lostItem.name} in the struggle.`);
    }
    
    // Recover some health but lose a full day for recovery
    window.gameState.health = Math.ceil(window.gameState.maxHealth * 0.3);
    
    // Skip ahead a full day to represent recovery time
    window.updateTimeAndDay(24 * 60); // 24 hours (1 day) in minutes
  }
  
  // Reset battle state
  window.gameState.inBattle = false;
  window.gameState.currentEnemy = null;
  
  // Update UI
  window.updateStatusBars();
  window.updateProfileIfVisible();
};

// Function to end mission combat (placeholder for now)
window.endMissionCombat = function(result) {
  // Similar to endCombat but with mission-specific outcomes
  window.endCombat(result);
  window.gameState.inMissionCombat = false;
};

// Generate loot function
window.generateLoot = function(enemy) {
  const lootTables = {
    arrasi_scout: [
      { name: "Arrasi Dagger", type: "weapon", value: 15, effect: "+1 melee damage" },
      { name: "Scout's Map Fragment", type: "quest_item", value: 5, effect: "Reveals part of surrounding area" },
      { name: "Medicinal Herbs", type: "consumable", value: 8, effect: "Heals 15 health" }
    ],
    arrasi_warrior: [
      { name: "Crystalline Amulet", type: "accessory", value: 25, effect: "+5% damage resistance" },
      { name: "Warrior's Blade", type: "weapon", value: 20, effect: "+2 melee damage" },
      { name: "Tribal Armor Fragment", type: "material", value: 12, effect: "Crafting material" }
    ],
    imperial_deserter: [
      { name: "Imperial Medallion", type: "accessory", value: 18, effect: "+1 to command skill" },
      { name: "Standard Issue Rations", type: "consumable", value: 5, effect: "Restores 10 stamina" },
      { name: "Stolen Military Plans", type: "quest_item", value: 30, effect: "Could be valuable to command" }
    ],
    wild_beast: [
      { name: "Beast Pelt", type: "material", value: 10, effect: "Crafting material" },
      { name: "Sharp Fang", type: "material", value: 8, effect: "Crafting material" },
      { name: "Fresh Meat", type: "consumable", value: 7, effect: "Restores 5 health and 10 stamina" }
    ]
  };
  
  // Select appropriate loot table
  const lootTable = lootTables[enemy.name.toLowerCase().replace(' ', '_')] || lootTables.arrasi_scout;
  
  // Randomly select an item
  return lootTable[Math.floor(Math.random() * lootTable.length)];
};