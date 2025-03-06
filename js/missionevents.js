// js/missionEvents.js - Mission event handlers

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
        showMissionObjectives(mission);
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
        showMissionLog(mission);
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
      time: window.gameState.missionTime,
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
          time: window.gameState.missionTime,
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
        time: window.gameState.missionTime,
        type: 'item_find',
        description: "While scouting, you discover a stash of supplies hidden among the rocks."
      };
      
      mission.events.push(itemEvent);
      window.addToNarrative(itemEvent.description);
      
      // Add random item to inventory
      const possibleItems = ['rations', 'medical_supplies', 'map_fragment'];
      const foundItem = possibleItems[Math.floor(Math.random() * possibleItems.length)];
      
      if (window.player.inventory.length < 20) {
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
          time: window.gameState.missionTime,
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
          time: window.gameState.missionTime,
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
    window.gameState.missionTime += 60; // 1 hour
    if (window.gameState.missionTime >= 1440) {
      processMissionDay();
    }
    
    // Update UI
    window.updateStatusBars();
    
    // Check for encounters based on new time
    checkForMissionEncounters(mission);
  };
  
  // More mission action handlers would be defined here...
  
  // Process an encounter
  function processMissionEncounter(encounter) {
    const mission = window.gameState.currentMission;
    
    // Create encounter event
    const encounterEvent = {
      day: mission.currentDay,
      time: window.gameState.missionTime,
      type: 'encounter',
      description: `You encounter ${encounter.count} ${encounter.enemyType.replace('_', ' ')}s! Prepare for combat!`
    };
    
    mission.events.push(encounterEvent);
    window.addToNarrative(encounterEvent.description);
    
    // Start combat for each enemy in the encounter
    let allEnemiesDefeated = true;
    
    for (let i = 0; i < encounter.count; i++) {
      // If previous battle resulted in player death, exit early
      if (window.gameState.health <= 0) {
        allEnemiesDefeated = false;
        break;
      }
      
      // Start combat with this enemy
      window.gameState.inMissionCombat = true;
      window.startCombat(encounter.enemyType);
      
      // Combat is handled by the existing combat system, which will call
      // endMissionCombat() when finished, updating player state
      
      // After combat ends, check if player survived
      if (window.gameState.health <= 0) {
        allEnemiesDefeated = false;
        break;
      }
    }
    
    // Mark encounter as completed
    encounter.completed = true;
    encounter.result = allEnemiesDefeated ? 'victory' : 'defeat';
    
    // If player died, fail mission
    if (window.gameState.health <= 0) {
      mission.state = 'failed';
      return;
    }
    
    // Update objectives if this was an elimination objective
    const eliminationObjective = mission.objectives.find(o => 
      o.type === 'eliminate' && !o.completed);
    
    if (eliminationObjective && allEnemiesDefeated) {
      eliminationObjective.progress += encounter.count;
      
      const objectiveEvent = {
        day: mission.currentDay,
        time: window.gameState.missionTime,
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
    
    // Record outcome in mission events
    const outcomeEvent = {
      day: mission.currentDay,
      time: window.gameState.missionTime,
      type: 'encounter_outcome',
      description: allEnemiesDefeated ? 
        "You emerged victorious from the encounter!" : 
        "You were forced to retreat from the encounter."
    };
    
    mission.events.push(outcomeEvent);
    window.addToNarrative(outcomeEvent.description);
  }
  
  // Check for mission completion
  function checkMissionCompletion(mission) {
    // Check if all objectives are complete
    const allObjectivesComplete = mission.objectives.every(obj => obj.completed);
    
    if (allObjectivesComplete) {
      // Mission complete!
      window.completeMission(mission);
    }
  }
  
  // Check for random encounters based on time and progress
  function checkForMissionEncounters(mission) {
    // Get encounters for current day that haven't been triggered
    const pendingEncounters = mission.encounters.filter(e => 
      e.day === mission.currentDay && !e.completed && !e.triggered);
    
    // If there are pending encounters and time is right, trigger the first one
    if (pendingEncounters.length > 0) {
      // Time-based trigger chance
      const hourOfDay = Math.floor(window.gameState.missionTime / 60);
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