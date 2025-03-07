// js/missionEvents.js - Mission event handlers with Time Management

// Add missing items if not already defined
window.items = window.items || {};
window.items.map_fragment = window.items.map_fragment || {
  name: "Map Fragment",
  type: "quest_item",
  value: 10,
  effect: "Shows surrounding region"
};

window.items.rations = window.items.rations || {
  name: "Field Rations", 
  type: "consumable",
  value: 5,
  effect: "Restores 10 stamina"
};

window.items.medical_supplies = window.items.medical_supplies || {
  name: "Medical Supplies", 
  type: "consumable",
  value: 8,
  effect: "Heals 15 health"
};

// Mission event handling function
window.handleMissionAction = function(action) {
    const mission = window.gameState.currentMission;
    if (!mission) return;
    
    // Function to get current mission time context
    const getMissionTime = () => mission.missionTimeContext.currentTime;
    
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

// Scouting action
function performScoutingAction(mission) {
    // Consume stamina
    if (window.gameState.stamina < 20) {
      window.showNotification("You're too exhausted to scout effectively.", 'warning');
      return;
    }
    window.gameState.stamina -= 20;
    
    // Get mission time context
    const missionTime = mission.missionTimeContext.currentTime;
    
    // Add scouting event
    const scoutEvent = {
      day: mission.currentDay,
      time: missionTime.minute,
      type: 'scout',
      description: `You carefully scout the surrounding ${mission.terrain}, gathering information about the terrain and potential threats.`
    };
    
    mission.events.push(scoutEvent);
    window.addToNarrative(scoutEvent.description);
    
    // Random outcomes
    const roll = Math.random();
    
    if (roll < 0.3) {
        // Discover an encounter
        const undiscoveredEncounters = mission.encounters.filter(e => 
            e.day === mission.currentDay && !e.discovered && !e.completed);
            
        if (undiscoveredEncounters.length > 0) {
            const encounter = undiscoveredEncounters[0];
            encounter.discovered = true;
            window.addToNarrative(`You spot signs of enemy activity ahead: ${encounter.count} ${encounter.enemyType.replace('_', ' ')}(s).`);
        } else {
            window.addToNarrative("The area appears clear of immediate threats.");
        }
    } else if (roll < 0.5) {
        // Find resources
        if (window.player.inventory.length < 20) {
            const items = [
                { chance: 0.5, item: window.items.rations },
                { chance: 0.3, item: window.items.medical_supplies },
                { chance: 0.2, item: window.items.map_fragment }
            ];
            
            for (const itemData of items) {
                if (Math.random() < itemData.chance) {
                    window.player.inventory.push(itemData.item);
                    window.addToNarrative(`You found: ${itemData.item.name}`);
                    break;
                }
            }
        }
    }
    
    // Update time using mission time tracking
    window.TimeManager.advanceMissionTime(mission.missionTimeContext, 60);
    
    // Check for encounters
    checkForMissionEncounters(mission);
}

// Similar modifications for other action functions:
// performCampAction, performPatrolAction, etc.
// Use mission.missionTimeContext for time tracking
function performCampAction(mission) {
    // Add camp event
    const campEvent = {
        day: mission.currentDay,
        type: 'camp',
        description: "You set up a small camp to rest and recover."
    };
    mission.events.push(campEvent);
    window.addToNarrative(campEvent.description);
    
    // Recovery effects
    const recoveryAmount = 30;
    window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + recoveryAmount);
    window.gameState.health = Math.min(window.gameState.maxHealth, window.gameState.health + Math.floor(recoveryAmount / 2));
    
    // Time passage
    window.TimeManager.advanceMissionTime(mission.missionTimeContext, 120); // 2 hours
    
    // Chance for random events while camping
    const eventRoll = Math.random();
    if (eventRoll < 0.2) {
        // Negative event
        window.gameState.morale = Math.max(0, window.gameState.morale - 5);
        window.addToNarrative("The night is cold and uncomfortable. Your rest is disturbed by distant howls.");
    } else if (eventRoll < 0.4) {
        // Positive event
        window.gameState.morale = Math.min(100, window.gameState.morale + 5);
        window.addToNarrative("You manage to get some good rest. The weather is favorable and your spirits are lifted.");
    }
    
    // Update UI
    window.updateStatusBars();
    if (typeof window.updateMissionUI === 'function') {
        window.updateMissionUI(mission);
    }
    
    // Check for encounters after resting
    checkForMissionEncounters(mission);
}

// Patrol action
function performPatrolAction(mission) {
    // Check stamina requirement
    if (window.gameState.stamina < 25) {
        window.showNotification("You're too exhausted to patrol effectively.", 'warning');
        return;
    }
    
    // Consume stamina
    window.gameState.stamina -= 25;
    
    // Add patrol event
    const patrolEvent = {
        day: mission.currentDay,
        type: 'patrol',
        description: `You conduct a thorough patrol of the ${mission.terrain} area.`
    };
    mission.events.push(patrolEvent);
    window.addToNarrative(patrolEvent.description);
    
    // Update patrol objective if exists
    const patrolObjective = mission.objectives.find(obj => obj.type === 'patrol');
    if (patrolObjective && !patrolObjective.completed) {
        patrolObjective.progress++;
        if (patrolObjective.progress >= patrolObjective.count) {
            patrolObjective.completed = true;
            window.addToNarrative("Patrol objective completed!");
        } else {
            window.addToNarrative(`Patrol progress: ${patrolObjective.progress}/${patrolObjective.count}`);
        }
    }
    
    // Random patrol outcomes
    const roll = Math.random();
    if (roll < 0.4) {
        // Encounter chance
        const undiscoveredEncounters = mission.encounters.filter(e => 
            e.day === mission.currentDay && !e.completed);
            
        if (undiscoveredEncounters.length > 0) {
            const encounter = undiscoveredEncounters[0];
            encounter.triggered = true;
            window.addToNarrative(`During your patrol, you encounter hostile forces!`);
            processMissionEncounter(encounter);
        }
    } else if (roll < 0.6) {
        // Find resources
        if (window.player.inventory.length < 20) {
            window.player.inventory.push(window.items.rations);
            window.addToNarrative("You find some abandoned supplies during your patrol.");
        }
    }
    
    // Advance time
    window.TimeManager.advanceMissionTime(mission.missionTimeContext, 180); // 3 hours
    
    // Update UI
    window.updateStatusBars();
    if (typeof window.updateMissionUI === 'function') {
        window.updateMissionUI(mission);
    }
    
    // Check mission completion
    if (typeof window.checkMissionCompletion === 'function') {
        window.checkMissionCompletion(mission);
    }
}

// Forage action
function performForageAction(mission) {
    if (window.gameState.stamina < 15) {
        window.showNotification("You're too exhausted to forage effectively.", 'warning');
        return;
    }
    
    window.gameState.stamina -= 15;
    
    const forageEvent = {
        day: mission.currentDay,
        type: 'forage',
        description: "You search the area for useful supplies."
    };
    mission.events.push(forageEvent);
    window.addToNarrative(forageEvent.description);
    
    // Foraging results
    if (window.player.inventory.length < 20) {
        const roll = Math.random();
        if (roll < 0.7) {
            window.player.inventory.push(window.items.rations);
            window.addToNarrative("You find some edible provisions.");
        }
        if (roll < 0.3) {
            window.player.inventory.push(window.items.medical_supplies);
            window.addToNarrative("You discover some useful medical herbs.");
        }
    }
    
    window.TimeManager.advanceMissionTime(mission.missionTimeContext, 90);
    window.updateStatusBars();
    if (typeof window.updateMissionUI === 'function') {
        window.updateMissionUI(mission);
    }
}

// Survey action
function performSurveyAction(mission) {
    if (window.gameState.stamina < 20) {
        window.showNotification("You're too exhausted to survey effectively.", 'warning');
        return;
    }
    
    window.gameState.stamina -= 20;
    
    const surveyEvent = {
        day: mission.currentDay,
        type: 'survey',
        description: "From high ground, you survey the surrounding area."
    };
    mission.events.push(surveyEvent);
    window.addToNarrative(surveyEvent.description);
    
    // Reveal all encounters for the current day
    const todaysEncounters = mission.encounters.filter(e => 
        e.day === mission.currentDay && !e.discovered && !e.completed);
    
    todaysEncounters.forEach(encounter => {
        encounter.discovered = true;
        window.addToNarrative(`You spot enemy movement: ${encounter.count} ${encounter.enemyType.replace('_', ' ')}(s) in the area.`);
    });
    
    window.TimeManager.advanceMissionTime(mission.missionTimeContext, 60);
    window.updateStatusBars();
    if (typeof window.updateMissionUI === 'function') {
        window.updateMissionUI(mission);
    }
}

// Defend action
function performDefendAction(mission) {
    if (window.gameState.stamina < 30) {
        window.showNotification("You're too exhausted to set up defenses.", 'warning');
        return;
    }
    
    window.gameState.stamina -= 30;
    
    const defendEvent = {
        day: mission.currentDay,
        type: 'defend',
        description: "You prepare defensive positions in the rocky terrain."
    };
    mission.events.push(defendEvent);
    window.addToNarrative(defendEvent.description);
    
    // Add defensive bonus for next combat
    mission.defensiveBonus = true;
    window.addToNarrative("You'll have an advantage in the next combat encounter.");
    
    window.TimeManager.advanceMissionTime(mission.missionTimeContext, 120);
    window.updateStatusBars();
    if (typeof window.updateMissionUI === 'function') {
        window.updateMissionUI(mission);
    }
}

// Ambush action
function performAmbushAction(mission) {
    if (window.gameState.stamina < 35) {
        window.showNotification("You're too exhausted to set up an ambush.", 'warning');
        return;
    }
    
    window.gameState.stamina -= 35;
    
    const ambushEvent = {
        day: mission.currentDay,
        type: 'ambush',
        description: "You prepare an ambush position."
    };
    mission.events.push(ambushEvent);
    window.addToNarrative(ambushEvent.description);
    
    // Set ambush advantage for next combat
    mission.ambushAdvantage = 'player';
    window.addToNarrative("You'll have the initiative in the next combat encounter.");
    
    window.TimeManager.advanceMissionTime(mission.missionTimeContext, 90);
    window.updateStatusBars();
    if (typeof window.updateMissionUI === 'function') {
        window.updateMissionUI(mission);
    }
}

// Reconnoiter action
function performReconnoiterAction(mission) {
    if (window.gameState.stamina < 25) {
        window.showNotification("You're too exhausted to reconnoiter effectively.", 'warning');
        return;
    }
    
    window.gameState.stamina -= 25;
    
    const reconEvent = {
        day: mission.currentDay,
        type: 'reconnoiter',
        description: "You carefully observe enemy positions and movements."
    };
    mission.events.push(reconEvent);
    window.addToNarrative(reconEvent.description);
    
    // Reveal encounters and gain tactical advantage
    const todaysEncounters = mission.encounters.filter(e => 
        e.day === mission.currentDay && !e.discovered && !e.completed);
    
    todaysEncounters.forEach(encounter => {
        encounter.discovered = true;
        encounter.reconnoitered = true; // Gives advantage in combat
        window.addToNarrative(`You learn valuable tactical information about the ${encounter.enemyType.replace('_', ' ')}s in the area.`);
    });
    
    window.TimeManager.advanceMissionTime(mission.missionTimeContext, 120);
    window.updateStatusBars();
    if (typeof window.updateMissionUI === 'function') {
        window.updateMissionUI(mission);
    }
}

// Helper function to check for mission encounters
function checkForMissionEncounters(mission) {
    const pendingEncounters = mission.encounters.filter(e => 
        e.day === mission.currentDay && !e.completed && !e.triggered);
    
    if (pendingEncounters.length > 0 && Math.random() < 0.3) {
        const encounter = pendingEncounters[0];
        encounter.triggered = true;
        processMissionEncounter(encounter);
    }
}

// Process a mission encounter
function processMissionEncounter(encounter) {
    const mission = window.gameState.currentMission;
    
    const encounterEvent = {
        day: mission.currentDay,
        type: 'encounter',
        description: `You encounter ${encounter.count} ${encounter.enemyType.replace('_', ' ')}(s)! Prepare for combat!`
    };
    
    mission.events.push(encounterEvent);
    window.addToNarrative(encounterEvent.description);
    
    // Start combat with the encountered enemies
    if (typeof window.startCombat === 'function') {
        window.startCombat(encounter.enemyType, {
            count: encounter.count,
            ambush: mission.ambushAdvantage,
            reconnoitered: encounter.reconnoitered,
            defensiveBonus: mission.defensiveBonus
        });
    }
}

// Expose functions globally
window.processMissionEncounter = processMissionEncounter;
window.checkForMissionEncounters = checkForMissionEncounters;
window.handleMissionAction = window.handleMissionAction || function() {};

console.log("Mission Events System loaded successfully");
