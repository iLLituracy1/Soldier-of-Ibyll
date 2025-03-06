// js/missionSystem.js - Core mission functionality with Time Management

// Initialize a mission from a template
window.initializeMission = function(missionType) {
    // Get the template
    const template = window.missionTypes[missionType];
    if (!template) {
      console.error(`Mission type ${missionType} not found`);
      return null;
    }
    
    // Create a mission instance
    const mission = {
      id: generateMissionId(),
      type: missionType,
      name: template.name,
      description: template.description,
      difficulty: template.difficulty,
      duration: template.duration,
      
      // Select random terrain and weather from options
      terrain: template.terrainOptions[Math.floor(Math.random() * template.terrainOptions.length)],
      weather: template.weatherOptions[Math.floor(Math.random() * template.weatherOptions.length)],
      
      // Clone objectives
      objectives: template.objectives.map(obj => ({
        type: obj.type,
        count: obj.count,
        description: obj.description,
        progress: 0,
        completed: false
      })),
      
      // Copy rewards
      rewards: { ...template.rewards },
      
      // Mission state
      currentDay: 1,
      state: "active", // active, completed, failed
      events: [], // History of events during mission
      encounters: [], // Generated encounters
      
      // Mission-specific time tracking
      missionTimeContext: window.TimeManager.startMissionTime(this)
    };
    
    // Generate encounters based on template chances
    generateMissionEncounters(mission, template);
    
    // Call the setup function if defined
    if (template.setupFunction && window[template.setupFunction]) {
      window[template.setupFunction](mission);
    }
    
    return mission;
};

// Generate random encounters for a mission
function generateMissionEncounters(mission, template) {
    // Clear existing encounters
    mission.encounters = [];
    
    // Number of days determines base number of encounters
    const baseEncounters = mission.duration;
    const variance = Math.floor(baseEncounters * 0.3); // 30% variance
    
    // Calculate final number of encounters
    const numEncounters = baseEncounters + Math.floor(Math.random() * (variance * 2 + 1)) - variance;
    
    // Create encounters
    for (let i = 0; i < numEncounters; i++) {
      // Assign to a random day in the mission
      const day = 1 + Math.floor(Math.random() * mission.duration);
      
      // Determine encounter type based on template chances
      const possibleEncounters = template.enemyEncounters.filter(e => Math.random() < e.chance);
      
      if (possibleEncounters.length > 0) {
        // Select random encounter from possibilities
        const selectedEncounter = possibleEncounters[Math.floor(Math.random() * possibleEncounters.length)];
        
        // Determine number of enemies
        const count = selectedEncounter.min + Math.floor(Math.random() * (selectedEncounter.max - selectedEncounter.min + 1));
        
        // Create encounter
        mission.encounters.push({
          day: day,
          enemyType: selectedEncounter.type,
          count: count,
          completed: false,
          result: null
        });
      }
    }
    
    // Sort encounters by day
    mission.encounters.sort((a, b) => a.day - b.day);
}

// Start a mission
window.startMission = function(missionType) {
    // Check if already in a mission
    if (window.gameState.inMission) {
      console.error("Already in a mission");
      return false;
    }
    
    // Initialize the mission
    const mission = window.initializeMission(missionType);
    if (!mission) return false;
    
    // Save current camp state
    window.gameState.savedCampState = {
      health: window.gameState.health,
      stamina: window.gameState.stamina,
      morale: window.gameState.morale,
      time: window.TimeManager.getCurrentTime(),
      injuries: [...window.gameState.playerInjuries || []]
    };
    
    // Set game state
    window.gameState.inMission = true;
    window.gameState.currentMission = mission;
    
    // Update UI
    updateMissionUI(mission);
    
    // Show mission briefing
    showMissionBriefing(mission);
    
    return true;
};

// Process a mission day
window.processMissionDay = function() {
    const mission = window.gameState.currentMission;
    if (!mission) return;
    
    // Advance mission time
    const missionTime = mission.missionTimeContext.currentTime;
    window.TimeManager.advanceMissionTime(mission.missionTimeContext, 1440); // Full day
    
    // Update mission day
    mission.currentDay++;
    
    // Get encounters for current day
    const todaysEncounters = mission.encounters.filter(e => e.day === mission.currentDay && !e.completed);
    
    // Process each encounter
    for (const encounter of todaysEncounters) {
      // Handle encounter
      processMissionEncounter(encounter);
      
      // If mission failed, exit early
      if (mission.state === "failed") {
        handleMissionFailure(mission);
        return;
      }
    }
    
    // Check for mission completion
    checkMissionCompletion(mission);
    
    // If we've reached the end of the mission duration, end mission
    if (mission.currentDay > mission.duration) {
      mission.state = "failed";
      handleMissionFailure(mission, "time_expired");
    } else {
      // Update mission UI
      updateMissionUI(mission);
    }
};

// Handle mission completion
window.completeMission = function(mission) {
    // Mark mission as completed
    mission.state = "completed";
    
    // Apply rewards
    window.gameState.experience += mission.rewards.experience;
    window.player.taelors += mission.rewards.taelors;
    
    // Check for item rewards
    if (Math.random() < mission.rewards.itemChance) {
      const itemPool = mission.rewards.itemPool;
      const randomItem = itemPool[Math.floor(Math.random() * itemPool.length)];
      if (window.player.inventory.length < 20) {
        window.player.inventory.push(window.items[randomItem]);
      }
    }
    
    // Call template-specific completion function if defined
    const template = window.missionTypes[mission.type];
    if (template.completionFunction && window[template.completionFunction]) {
      window[template.completionFunction](mission);
    }
    
    // Update campaign progress
    updateCampaignProgress(mission.type);
    
    // Return to camp
    returnToCamp(true);
    
    // Show mission completion summary
    showMissionSummary(mission);
};

// Helper function for generating mission ID
function generateMissionId() {
    return 'm' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Placeholder functions - implement as needed in other files
// These are here to prevent undefined function errors
window.handleMissionFailure = function(mission, reason = "defeat") {
    console.log("Mission failed:", reason);
    returnToCamp(false);
};

window.returnToCamp = function(success) {
    // Restore camp state
    const savedTime = window.gameState.savedCampState.time;
    
    // Clear mission state
    window.gameState.inMission = false;
    window.gameState.currentMission = null;
    window.gameState.savedCampState = null;
    
    // Update UI
    window.updateActionButtons();
    window.updateStatusBars();
    document.getElementById('location').textContent = "Location: Kasvaari Camp, somewhere in the Western Hierarchate of Nesia";
};

// Placeholder functions to prevent errors
window.updateCampaignProgress = function() {};
window.showMissionSummary = function() {};
window.showMissionBriefing = function() {};
window.updateMissionUI = function() {};
window.processMissionEncounter = function() {};
window.checkMissionCompletion = function() {};
