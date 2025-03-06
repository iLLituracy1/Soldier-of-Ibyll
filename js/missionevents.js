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
    
    // Rest of the function remains mostly the same as before
    // Just replace direct time manipulation with mission time context
    
    // Update time using mission time tracking
    window.TimeManager.advanceMissionTime(mission.missionTimeContext, 60);
    
    // Check for encounters
    checkForMissionEncounters(mission);
}

// Similar modifications for other action functions:
// performCampAction, performPatrolAction, etc.
// Use mission.missionTimeContext for time tracking
function performCampAction(mission) {
    // Existing logic, but use mission time context
    const missionTime = mission.missionTimeContext.currentTime;
    
    // Time progression via TimeManager
    window.TimeManager.advanceMissionTime(mission.missionTimeContext, 120);
    
    // Rest of the function remains similar
    checkForMissionEncounters(mission);
}

// Placeholder implementations for other functions
function performPatrolAction(mission) { /* Similar to existing implementation */ }
function performForageAction(mission) { /* Similar to existing implementation */ }
function performSurveyAction(mission) { /* Similar to existing implementation */ }
function performDefendAction(mission) { /* Similar to existing implementation */ }
function performAmbushAction(mission) { /* Similar to existing implementation */ }
function performReconnoiterAction(mission) { /* Similar to existing implementation */ }

// Existing helper functions can remain mostly the same
function checkForMissionEncounters(mission) {
    // Use mission time context for encounter checks
    const missionTime = mission.missionTimeContext.currentTime;
    
    // Existing logic with mission-specific time tracking
    const pendingEncounters = mission.encounters.filter(e => 
        e.day === mission.currentDay && !e.completed && !e.triggered);
    
    // Encounter triggering logic remains similar
}

function processMissionEncounter(encounter) {
    const mission = window.gameState.currentMission;
    
    // Add encounter event with mission time
    const missionTime = mission.missionTimeContext.currentTime;
    const encounterEvent = {
        day: mission.currentDay,
        time: missionTime.minute,
        type: 'encounter',
        description: `You encounter ${encounter.count} ${encounter.enemyType.replace('_', ' ')}s! Prepare for combat!`
    };
    
    mission.events.push(encounterEvent);
    window.addToNarrative(encounterEvent.description);
    
    // Rest of the encounter processing remains the same
}

// Expose functions globally
window.processMissionEncounter = processMissionEncounter;
window.checkForMissionEncounters = checkForMissionEncounters;
