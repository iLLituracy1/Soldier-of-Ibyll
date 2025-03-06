// js/missionEvents.js - Mission event handlers

// First, define an items object for mission rewards
window.items = window.items || {};

// Add missing items
window.items.map_fragment = {
  name: "Map Fragment",
  type: "quest_item",
  value: 10,
  effect: "Shows surrounding region"
};

window.items.rations = {
  name: "Field Rations",
  type: "consumable",
  value: 5,
  effect: "Restores 10 stamina"
};

window.items.medical_supplies = {
  name: "Medical Supplies", 
  type: "consumable",
  value: 8,
  effect: "Heals 15 health"
};

// Handle mission action
window.handleMissionAction = function(action) {
    const mission = window.gameState.currentMission;
    if (!mission) return;
    
    switch (action) {
      case 'mission_scout':
        performScoutingAction(mission);
        break;
      case 'mission_camp':
        performCampAction(mission);
        break;
      case 'mission_objectives':
        window.showMissionObjectives(mission);
        break;
      case 'mission_patrol':
        performPatrolAction(mission);
        break;
      case 'mission_forage':
        performForageAction(mission);
        break;
      case 'mission_survey':
        performSurveyAction(mission);
        break;
      case 'mission_defend':
        performDefendAction(mission);
        break;
      case 'mission_ambush':
        performAmbushAction(mission);
        break;
      case 'mission_reconnoiter':
        performReconnoiterAction(mission);
        break;
      case 'mission_log':
        window.showMissionLog(mission);
        break;
        case 'engage_encounter':
        case 'avoid_encounter':
        case 'back_to_mission':
        window.handleEncounterOption(action);
        break;
        case 'show_encounters':
        showEncounterOptions(mission);
        break;
      default:
        // Pass to regular action handler for standard actions
        if (!action.startsWith('mission_')) {
          window.handleAction(action);
        }
    }
  };
  
  // Scout action
  function performScoutingAction(mission) {
    // Consume stamina
    if (window.gameState.stamina < 20) {
      window.showNotification("You're too exhausted to scout effectively.", 'warning');
      return;
    }
    window.gameState.stamina -= 20;
    
    // Add scouting event
    const scoutEvent = {
      day: mission.currentDay,
      time: window.gameState.missionTime || 480, // Default to morning if not set
      type: 'scout',
      description: `You carefully scout the surrounding ${mission.terrain}, gathering information about the terrain and potential threats.`
    };
    
    mission.events.push(scoutEvent);
    
    // Update narrative
    window.addToNarrative(scoutEvent.description);
    
    // Random outcomes
    const roll = Math.random();
    
    if (roll < 0.3) {
      // Discover an encounter
      const nearbyEncounter = mission.encounters.find(e => 
        e.day === mission.currentDay && !e.completed && !e.discovered);
      
      if (nearbyEncounter) {
        nearbyEncounter.discovered = true;
        
        const discoveryEvent = {
          day: mission.currentDay,
          time: window.gameState.missionTime || 480,
          type: 'discovery',
          description: `Your scouting has revealed the presence of ${nearbyEncounter.count} ${nearbyEncounter.enemyType.replace('_', ' ')}s nearby. You can now prepare for this encounter.`
        };
        
        mission.events.push(discoveryEvent);
        window.addToNarrative(discoveryEvent.description);
      } else {
        window.addToNarrative("Your scouting reveals no immediate threats in the area.");
      }
    } else if (roll < 0.5) {
      // Find useful item or resource
      const itemEvent = {
        day: mission.currentDay,
        time: window.gameState.missionTime || 480,
        type: 'item_find',
        description: "While scouting, you discover a stash of supplies hidden among the rocks."
      };
      
      mission.events.push(itemEvent);
      window.addToNarrative(itemEvent.description);
      
      // Add random item to inventory
      const possibleItems = ['rations', 'medical_supplies', 'map_fragment'];
      const foundItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
      
      if (window.player.inventory.length < 20 && window.items[foundItem]) {
        window.player.inventory.push(window.items[foundItem]);
        window.addToNarrative(`You've acquired: ${window.items[foundItem].name}`);
      } else {
        window.addToNarrative("Unfortunately, your inventory is full and you can't carry any more items.");
      }
    } else if (roll < 0.7) {
      // Advance an objective
      const objectiveToAdvance = mission.objectives.find(o => 
        o.type === 'patrol' && !o.completed);
      
      if (objectiveToAdvance) {
        objectiveToAdvance.progress++;
        
        const objectiveEvent = {
          day: mission.currentDay,
          time: window.gameState.missionTime || 480,
          type: 'objective_progress',
          description: `Your scouting contributes to the patrol objective. Progress: ${objectiveToAdvance.progress}/${objectiveToAdvance.count}`
        };
        
        mission.events.push(objectiveEvent);
        window.addToNarrative(objectiveEvent.description);
        
        // Check for completion
        if (objectiveToAdvance.progress >= objectiveToAdvance.count) {
          objectiveToAdvance.completed = true;
          window.addToNarrative("You've completed this objective!");
          
          // Check if all objectives are complete
          checkMissionCompletion(mission);
        }
      } else {
        window.addToNarrative("Your thorough scouting gives you a better understanding of the area.");
      }
    } else {
      // Improve a skill
      const skillImprovement = parseFloat((Math.random() * 0.03 + 0.02).toFixed(2));
      const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
      
      if (window.player.skills.survival < survivalCap) {
        window.player.skills.survival = Math.min(survivalCap, window.player.skills.survival + skillImprovement);
        
        const skillEvent = {
          day: mission.currentDay,
          time: window.gameState.missionTime || 480,
          type: 'skill_improvement',
          description: `Your scouting experience improves your survival skills. (Survival +${skillImprovement})`
        };
        
        mission.events.push(skillEvent);
        window.addToNarrative(skillEvent.description);
      } else {
        window.addToNarrative("You move through the territory with practiced ease.");
      }
    }
    
    // Update time
    window.gameState.missionTime = (window.gameState.missionTime || 480) + 60; // 1 hour
    if (window.gameState.missionTime >= 1440) {
      if (typeof window.processMissionDay === 'function') {
        window.processMissionDay();
      } else {
        console.error("processMissionDay not defined");
      }
    }
    
    // Update UI
    window.updateStatusBars();
    
    // Check for encounters based on new time
    checkForMissionEncounters(mission);
  }
  
  // Camp action 
  function performCampAction(mission) {
    // Rest and recover at camp
    if (window.gameState.stamina >= 80) {
      window.showNotification("You're already well-rested and don't need to make camp yet.", 'info');
      return;
    }
    
    window.addToNarrative(`You set up a small camp in a defensible position. After setting watch rotations, you take the opportunity to rest and recover.`);
    
    // Recovery amounts
    const staminaRecovery = 30;
    const healthRecovery = 15;
    
    // Apply recovery
    window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + staminaRecovery);
    window.gameState.health = Math.min(window.gameState.maxHealth, window.gameState.health + healthRecovery);
    
    // Add camp event
    const campEvent = {
      day: mission.currentDay,
      time: window.gameState.missionTime || 480,
      type: 'camp',
      description: `You make camp and recover ${healthRecovery} health and ${staminaRecovery} stamina.`
    };
    mission.events.push(campEvent);
    
    // Update time
    window.gameState.missionTime = (window.gameState.missionTime || 480) + 120; // 2 hours
    if (window.gameState.missionTime >= 1440) {
      if (typeof window.processMissionDay === 'function') {
        window.processMissionDay();
      } else {
        console.error("processMissionDay not defined");
      }
    }
    
    // Update UI
    window.updateStatusBars();
    window.showNotification(`Rested and recovered ${healthRecovery} health and ${staminaRecovery} stamina`, 'success');
    
    // Check for encounters
    checkForMissionEncounters(mission);
  }
  
  // Patrol action
  function performPatrolAction(mission) {
    // Consume stamina
    if (window.gameState.stamina < 25) {
      window.showNotification("You're too exhausted to patrol effectively.", 'warning');
      return;
    }
    window.gameState.stamina -= 25;
    
    window.addToNarrative(`You lead a patrol through the surrounding area, mapping the terrain and watching for threats.`);
    
    // Add patrol event
    const patrolEvent = {
      day: mission.currentDay,
      time: window.gameState.missionTime || 480,
      type: 'patrol',
      description: `You complete a patrol circuit.`
    };
    mission.events.push(patrolEvent);
    
    // Advance patrol objectives
    const patrolObjective = mission.objectives.find(o => o.type === 'patrol' && !o.completed);
    if (patrolObjective) {
      patrolObjective.progress++;
      window.addToNarrative(`Patrol objective progress: ${patrolObjective.progress}/${patrolObjective.count}`);
      
      if (patrolObjective.progress >= patrolObjective.count) {
        patrolObjective.completed = true;
        window.addToNarrative(`<strong>Objective completed:</strong> ${patrolObjective.description}`);
        
        // Check for mission completion
        checkMissionCompletion(mission);
      }
    }
    
    // Update time
    window.gameState.missionTime = (window.gameState.missionTime || 480) + 90; // 1.5 hours
    if (window.gameState.missionTime >= 1440) {
      if (typeof window.processMissionDay === 'function') {
        window.processMissionDay();
      } else {
        console.error("processMissionDay not defined");
      }
    }
    
    // Update UI
    window.updateStatusBars();
    
    // Check for encounters
    checkForMissionEncounters(mission);
  }
  
  // Forage action
  function performForageAction(mission) {
    // Consume stamina
    if (window.gameState.stamina < 15) {
      window.showNotification("You're too exhausted to forage effectively.", 'warning');
      return;
    }
    window.gameState.stamina -= 15;
    
    window.addToNarrative("You search the forest for useful supplies and food.");
    
    // Random forage success chance
    const forageSuccess = Math.random();
    
    if (forageSuccess < 0.7) { // 70% success rate
      // Find useful supplies
      const forageEvent = {
        day: mission.currentDay,
        time: window.gameState.missionTime || 480,
        type: 'forage',
        description: "Your foraging is successful. You gather edible plants, medicinal herbs, and other useful materials."
      };
      mission.events.push(forageEvent);
      window.addToNarrative(forageEvent.description);
      
      // Recover some stamina from food found
      const staminaRecovery = 10;
      window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + staminaRecovery);
      window.addToNarrative(`The food you found restores ${staminaRecovery} stamina.`);
      
      // Chance to find an item
      if (Math.random() < 0.3 && window.player.inventory.length < 20) {
        window.player.inventory.push(window.items.medical_supplies);
        window.addToNarrative(`You also found some ${window.items.medical_supplies.name}.`);
      }
      
      // Improve survival skill
      const skillImprovement = parseFloat((Math.random() * 0.03 + 0.01).toFixed(2));
      const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
      
      if (window.player.skills.survival < survivalCap) {
        window.player.skills.survival = Math.min(survivalCap, window.player.skills.survival + skillImprovement);
        window.addToNarrative(`Your foraging improves your survival skills. (Survival +${skillImprovement})`);
      }
    } else {
      // Unsuccessful foraging
      window.addToNarrative("You spend time searching but find little of value. The forest yields few rewards today.");
    }
    
    // Update time
    window.gameState.missionTime = (window.gameState.missionTime || 480) + 60; // 1 hour
    if (window.gameState.missionTime >= 1440) {
      if (typeof window.processMissionDay === 'function') {
        window.processMissionDay();
      } else {
        console.error("processMissionDay not defined");
      }
    }
    
    // Update UI
    window.updateStatusBars();
    
    // Check for encounters
    checkForMissionEncounters(mission);
  }
  
  // Survey action
  function performSurveyAction(mission) {
    // Consume stamina
    if (window.gameState.stamina < 15) {
      window.showNotification("You're too exhausted to climb to a high vantage point.", 'warning');
      return;
    }
    window.gameState.stamina -= 15;
    
    window.addToNarrative("You climb to a high vantage point in the hills, giving you a clear view of the surrounding region.");
    
    // Add survey event
    const surveyEvent = {
      day: mission.currentDay,
      time: window.gameState.missionTime || 480,
      type: 'survey',
      description: "From this elevation, you can see far across the landscape, noting landmarks and potential dangers."
    };
    mission.events.push(surveyEvent);
    window.addToNarrative(surveyEvent.description);
    
    // Reveal all encounters for current day
    let encountersRevealed = 0;
    mission.encounters.forEach(encounter => {
      if (encounter.day === mission.currentDay && !encounter.completed && !encounter.discovered) {
        encounter.discovered = true;
        encountersRevealed++;
      }
    });
    
    if (encountersRevealed > 0) {
      window.addToNarrative(`Your survey reveals ${encountersRevealed} potential encounters in the area.`);
    } else {
      window.addToNarrative("Your survey shows the area is relatively clear of immediate threats.");
    }
    
    // Chance to advance an objective
    const objectiveToAdvance = mission.objectives.find(o => o.type === 'patrol' && !o.completed);
    if (objectiveToAdvance) {
      objectiveToAdvance.progress++;
      window.addToNarrative(`Your survey contributes to the patrol objective. Progress: ${objectiveToAdvance.progress}/${objectiveToAdvance.count}`);
      
      if (objectiveToAdvance.progress >= objectiveToAdvance.count) {
        objectiveToAdvance.completed = true;
        window.addToNarrative(`<strong>Objective completed:</strong> ${objectiveToAdvance.description}`);
        
        // Check for mission completion
        checkMissionCompletion(mission);
      }
    }
    
    // Update time
    window.gameState.missionTime = (window.gameState.missionTime || 480) + 60; // 1 hour
    if (window.gameState.missionTime >= 1440) {
      if (typeof window.processMissionDay === 'function') {
        window.processMissionDay();
      } else {
        console.error("processMissionDay not defined");
      }
    }
    
    // Update UI
    window.updateStatusBars();
    
    // Check for encounters
    checkForMissionEncounters(mission);
  }
  
  // Defend action
  function performDefendAction(mission) {
    // Consume stamina
    if (window.gameState.stamina < 20) {
      window.showNotification("You're too exhausted to properly secure a position.", 'warning');
      return;
    }
    window.gameState.stamina -= 20;
    
    window.addToNarrative("You locate and secure a defensible position among the rocky terrain, making preparations in case of attack.");
    
    // Add defend event
    const defendEvent = {
      day: mission.currentDay,
      time: window.gameState.missionTime || 480,
      type: 'defend',
      description: "Your strategic position gives you both cover and a good view of the surrounding area."
    };
    mission.events.push(defendEvent);
    window.addToNarrative(defendEvent.description);
    
    // Strategic advantage for upcoming encounters
    window.gameState.defenseBonus = true;
    window.addToNarrative("If you encounter enemies while in this position, you'll have a tactical advantage.");
    
    // Improve tactics skill
    const skillImprovement = parseFloat((Math.random() * 0.03 + 0.01).toFixed(2));
    const tacticsCap = Math.floor(window.player.men / 1.5);
    
    if (window.player.skills.tactics < tacticsCap) {
      window.player.skills.tactics = Math.min(tacticsCap, window.player.skills.tactics + skillImprovement);
      window.addToNarrative(`Your defensive preparations improve your tactical thinking. (Tactics +${skillImprovement})`);
    }
    
    // Update time
    window.gameState.missionTime = (window.gameState.missionTime || 480) + 60; // 1 hour
    if (window.gameState.missionTime >= 1440) {
      if (typeof window.processMissionDay === 'function') {
        window.processMissionDay();
      } else {
        console.error("processMissionDay not defined");
      }
    }
    
    // Update UI
    window.updateStatusBars();
    
    // Check for encounters
    checkForMissionEncounters(mission);
  }
  
  // Ambush action
  function performAmbushAction(mission) {
    // Consume stamina
    if (window.gameState.stamina < 25) {
      window.showNotification("You're too exhausted to set up an effective ambush.", 'warning');
      return;
    }
    window.gameState.stamina -= 25;
    
    window.addToNarrative("You carefully prepare an ambush position along a likely route for enemy movement.");
    
    // Check if there are any discovered but uncompleted encounters
    const targetEncounter = mission.encounters.find(e => 
      e.day === mission.currentDay && !e.completed && e.discovered);
    
    if (targetEncounter) {
      // Set ambush advantage
      window.gameState.ambushAdvantage = true;
      
      const ambushEvent = {
        day: mission.currentDay,
        time: window.gameState.missionTime || 480,
        type: 'ambush',
        description: "Your ambush is ready. When you engage the enemy, you'll have the element of surprise."
      };
      mission.events.push(ambushEvent);
      window.addToNarrative(ambushEvent.description);
      
      // Force encounter after ambush setup
      window.addToNarrative("You wait patiently as your targets approach...");
      
      // Trigger the encounter
      targetEncounter.triggered = true;
      processMissionEncounter(targetEncounter);
    } else {
      window.addToNarrative("You set up the perfect ambush position, but no enemies pass through during your watch.");
      
      // Improve tactics skill anyway
      const skillImprovement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
      const tacticsCap = Math.floor(window.player.men / 1.5);
      
      if (window.player.skills.tactics < tacticsCap) {
        window.player.skills.tactics = Math.min(tacticsCap, window.player.skills.tactics + skillImprovement);
        window.addToNarrative(`The practice still improves your tactical thinking. (Tactics +${skillImprovement})`);
      }
    }
    
    // Update time
    window.gameState.missionTime = (window.gameState.missionTime || 480) + 90; // 1.5 hours
    if (window.gameState.missionTime >= 1440) {
      if (typeof window.processMissionDay === 'function') {
        window.processMissionDay();
      } else {
        console.error("processMissionDay not defined");
      }
    }
    
    // Update UI
    window.updateStatusBars();
  }
  
  // Reconnoiter action
  function performReconnoiterAction(mission) {
    // Consume stamina
    if (window.gameState.stamina < 25) {
      window.showNotification("You're too exhausted to properly reconnoiter.", 'warning');
      return;
    }
    window.gameState.stamina -= 25;
    
    window.addToNarrative("You carefully observe enemy defenses from concealment, looking for weaknesses and gathering intelligence.");
    
    // Add reconnoiter event
    const reconEvent = {
      day: mission.currentDay,
      time: window.gameState.missionTime || 480,
      type: 'reconnoiter',
      description: "Your reconnaissance provides valuable information for the siege operations."
    };
    mission.events.push(reconEvent);
    window.addToNarrative(reconEvent.description);
    
    // Advance siege objectives
    const siegeObjective = mission.objectives.find(o => o.type === 'sabotage' && !o.completed);
    if (siegeObjective) {
      siegeObjective.progress++;
      window.addToNarrative(`Siege objective progress: ${siegeObjective.progress}/${siegeObjective.count}`);
      
      if (siegeObjective.progress >= siegeObjective.count) {
        siegeObjective.completed = true;
        window.addToNarrative(`<strong>Objective completed:</strong> ${siegeObjective.description}`);
        
        // Check for mission completion
        checkMissionCompletion(mission);
      }
    }
    
    // Improve tactics skill
    const skillImprovement = parseFloat((Math.random() * 0.04 + 0.02).toFixed(2));
    const tacticsCap = Math.floor(window.player.men / 1.5);
    
    if (window.player.skills.tactics < tacticsCap) {
      window.player.skills.tactics = Math.min(tacticsCap, window.player.skills.tactics + skillImprovement);
      window.addToNarrative(`Your reconnaissance improves your tactical thinking. (Tactics +${skillImprovement})`);
    }
    
    // Update time
    window.gameState.missionTime = (window.gameState.missionTime || 480) + 90; // 1.5 hours
    if (window.gameState.missionTime >= 1440) {
      if (typeof window.processMissionDay === 'function') {
        window.processMissionDay();
      } else {
        console.error("processMissionDay not defined");
      }
    }
    
    // Update UI
    window.updateStatusBars();
    
    // Check for encounters
    checkForMissionEncounters(mission);
  }
  
  // Check for mission encounters
  function checkForMissionEncounters(mission) {
    // If the game is already in battle, don't check for new encounters
    if (window.gameState.inBattle || window.gameState.inMissionCombat) return;
    
    // Get encounters for current day that haven't been triggered
    const pendingEncounters = mission.encounters.filter(e => 
      e.day === mission.currentDay && !e.completed && !e.triggered);
    
    // If there are pending encounters and time is right, trigger the first one
    if (pendingEncounters.length > 0) {
      // Time-based trigger chance
      const hourOfDay = Math.floor((window.gameState.missionTime || 480) / 60);
      let encounterChance = 0.05; // Base 5% chance per hour
      
      // Night is more dangerous
      if (hourOfDay < 6 || hourOfDay > 20) {
        encounterChance = 0.15;
      }
      
      // Check for random trigger
      if (Math.random() < encounterChance) {
        // Mark encounter as triggered
        pendingEncounters[0].triggered = true;
        
        // Process the encounter
        processMissionEncounter(pendingEncounters[0]);
      }
    }
  }
  
  // Process a mission encounter
function processMissionEncounter(encounter) {
  const mission = window.gameState.currentMission;
  
  // Create encounter event
  const encounterEvent = {
    day: mission.currentDay,
    time: window.gameState.missionTime || 480,
    type: 'encounter',
    description: `You encounter ${encounter.count} ${encounter.enemyType.replace('_', ' ')}s! Prepare for combat!`
  };
  
  mission.events.push(encounterEvent);
  window.addToNarrative(encounterEvent.description);
  
  // Apply any combat advantages
  if (window.gameState.ambushAdvantage) {
    window.addToNarrative("You have the element of surprise!");
    // This would be implemented in the combat system
    window.gameState.ambushAdvantage = false;
  }
  
  if (window.gameState.defenseBonus) {
    window.addToNarrative("Your defensive position gives you a tactical advantage!");
    // This would be implemented in the combat system
    window.gameState.defenseBonus = false;
  }
  
  // Store encounter in gameState for combat system to access
  window.gameState.currentMissionEncounter = encounter;
  
  // Start mission combat
  window.gameState.inMissionCombat = true;
  
  try {
    // Start combat for this enemy type
    if (typeof window.startCombat === 'function') {
      window.startCombat(encounter.enemyType);
    } else {
      console.error("startCombat function not defined");
      // When combat system isn't available, simulate the result
      simulateCombatResult(encounter);
    }
  } catch (error) {
    console.error("Error starting combat:", error);
    // Simulate combat when an error occurs
    simulateCombatResult(encounter);
  }
  
  // DO NOT mark encounter as completed here
  // This will be done by the combat system when combat ends
}

    
    // Update objectives if this was an elimination objective
    const eliminationObjective = mission.objectives.find(o => 
      o.type === 'eliminate' && !o.completed);
    
    if (eliminationObjective) {
      eliminationObjective.progress += encounter.count;
      
      const objectiveEvent = {
        day: mission.currentDay,
        time: window.gameState.missionTime || 480,
        type: 'objective_progress',
        description: `You've eliminated ${encounter.count} enemies. Progress: ${eliminationObjective.progress}/${eliminationObjective.count}`
      };
      
      mission.events.push(objectiveEvent);
      window.addToNarrative(objectiveEvent.description);
      
      // Check for completion
      if (eliminationObjective.progress >= eliminationObjective.count) {
        eliminationObjective.completed = true;
        window.addToNarrative("You've completed this objective!");
        
        // Check if all objectives are complete
        checkMissionCompletion(mission);
      }
    }
  
  // Simulate a combat result when the combat system isn't available
  function simulateCombatResult(encounter) {
    // Simple simulation - 80% chance of victory
    const victory = Math.random() < 0.8;
    
    if (victory) {
      window.addToNarrative("After a fierce battle, you emerge victorious!");
      // Take some damage
      const damageTaken = Math.floor(Math.random() * 15) + 5;
      window.gameState.health = Math.max(1, window.gameState.health - damageTaken);
      window.gameState.stamina = Math.max(10, window.gameState.stamina - 20);
      window.updateStatusBars();
    } else {
      window.addToNarrative("The battle goes poorly, and you are forced to retreat!");
      // Take more damage
      const damageTaken = Math.floor(Math.random() * 25) + 15;
      window.gameState.health = Math.max(1, window.gameState.health - damageTaken);
      window.gameState.stamina = Math.max(5, window.gameState.stamina - 30);
      window.gameState.morale = Math.max(30, window.gameState.morale - 10);
      window.updateStatusBars();
    }
    
    // Reset combat flags
    window.gameState.inMissionCombat = false;
    encounter.result = victory ? 'victory' : 'defeat';
  }
  
  // Check for mission completion
  function checkMissionCompletion(mission) {
    // Check if all objectives are complete
    const allObjectivesComplete = mission.objectives.every(obj => obj.completed);
    
    if (allObjectivesComplete && typeof window.completeMission === 'function') {
      // Mission complete!
      window.completeMission(mission);
    } else if (allObjectivesComplete) {
      // Fallback if the completeMission function isn't available
      mission.state = "completed";
      window.addToNarrative("<h3>Mission Complete!</h3><p>You have successfully completed all objectives.</p>");
      
      // Return to camp with success
      if (typeof window.returnToCamp === 'function') {
        window.returnToCamp(true);
      } else {
        // Fallback camp return
        window.gameState.inMission = false;
        window.gameState.currentMission = null;
        window.updateActionButtons();
      }
    }
  }

  // Function to show strategic options for a discovered encounter
function showEncounterOptions(mission) {
  // Check if there are any discovered but uncompleted encounters
  const discoveredEncounters = mission.encounters.filter(e => 
    e.day === mission.currentDay && !e.completed && e.discovered && !e.triggered);
  
  if (discoveredEncounters.length === 0) {
    window.addToNarrative("There are no known enemy groups in the area right now.");
    return;
  }
  
  // Add narrative about the encountered enemies
  window.addToNarrative(`<h3>Strategic Options</h3>
    <p>You know of ${discoveredEncounters.length} enemy ${discoveredEncounters.length > 1 ? 'groups' : 'group'} in the area:</p>`);
  
  let encounterListHTML = "<ul>";
  discoveredEncounters.forEach((encounter, index) => {
    encounterListHTML += `<li>${encounter.count} ${encounter.enemyType.replace('_', ' ')}s</li>`;
  });
  encounterListHTML += "</ul>";
  
  window.addToNarrative(encounterListHTML);
  window.addToNarrative("<p>How would you like to proceed?</p>");
  
  // Generate strategic options
  const actionsContainer = document.getElementById('actions');
  actionsContainer.innerHTML = '';
  
  // Option 1: Set up an ambush for tactical advantage
  window.addActionButton('Set Ambush', 'mission_ambush', actionsContainer);
  
  // Option 2: Engage directly
  window.addActionButton('Engage Directly', 'engage_encounter', actionsContainer);
  
  // Option 3: Attempt to avoid
  window.addActionButton('Attempt to Avoid', 'avoid_encounter', actionsContainer);
  
  // Option 4: Return to regular mission actions
  window.addActionButton('Continue Mission', 'back_to_mission', actionsContainer);
  
  // Store the fact that we're showing encounter options
  window.gameState.showingEncounterOptions = true;
}

// Function to handle encounter option actions
window.handleEncounterOption = function(action) {
  const mission = window.gameState.currentMission;
  if (!mission) return;
  
  // Get discovered encounters
  const discoveredEncounters = mission.encounters.filter(e => 
    e.day === mission.currentDay && !e.completed && e.discovered && !e.triggered);
  
  if (discoveredEncounters.length === 0) {
    window.updateMissionActionButtons(mission);
    return;
  }
  
  // Target the first discovered encounter
  const targetEncounter = discoveredEncounters[0];
  
  switch(action) {
    case 'engage_encounter':
      // Direct engagement - no advantage but player's choice
      window.addToNarrative("You decide to engage the enemy directly.");
      targetEncounter.triggered = true;
      processMissionEncounter(targetEncounter);
      break;
      
    case 'avoid_encounter':
      // Try to avoid the encounter
      const survivalSkill = window.player.skills.survival || 0;
      const avoidChance = 0.4 + (survivalSkill * 0.1); // Base 40% + 10% per survival skill point
      
      if (Math.random() < avoidChance) {
        // Successfully avoided
        window.addToNarrative("Using your knowledge of the terrain, you successfully avoid the enemy patrol without being detected.");
        
        // Mark as completed but not fought
        targetEncounter.completed = true;
        targetEncounter.result = 'avoided';
        
        // Small XP gain and skill improvement
        window.gameState.experience += 5;
        
        // Improve survival skill
        const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
        if (window.player.skills.survival < survivalCap) {
          const improvement = parseFloat((Math.random() * 0.02 + 0.01).toFixed(2));
          window.player.skills.survival = Math.min(survivalCap, window.player.skills.survival + improvement);
          window.addToNarrative(`Your stealth tactics improve your survival skills. (Survival +${improvement})`);
        }
      } else {
        // Failed to avoid - surprise attack from enemy
        window.addToNarrative("Despite your efforts to remain hidden, the enemy spots you! They have the advantage of surprise.");
        
        // Enemy gets combat advantage (implemented in combat system)
        window.gameState.enemyAmbushAdvantage = true;
        
        targetEncounter.triggered = true;
        processMissionEncounter(targetEncounter);
      }
      break;
      
    case 'back_to_mission':
      // Return to normal mission actions
      window.addToNarrative("You decide to continue your mission tasks and deal with the enemy if your paths cross.");
      break;
  }
  
  // Clear encounter options flag
  window.gameState.showingEncounterOptions = false;
  
  // If not in combat, return to mission actions
  if (!window.gameState.inBattle && !window.gameState.inMissionCombat) {
    window.updateMissionActionButtons(mission);
  }
};