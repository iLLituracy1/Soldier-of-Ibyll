// js/missionSystem.js - Core mission functionality

// Initialize a mission from a template
window.initializeMission = function(missionType) {
    // Get the template
    const template = window.missionTypes[missionType];
    if (!template) {
      console.error(`Mission type ${missionType} not found`);
      return null;
    }
    
    // Create a new mission instance
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
      
      // Player state during mission
      playerStatusEffects: [],
      temporaryInjuries: []
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
      time: window.gameTime,
      day: window.gameDay,
      injuries: [...window.gameState.playerInjuries]
    };
    
    // Set game state
    window.gameState.inMission = true;
    window.gameState.currentMission = mission;
    window.gameState.missionDay = 1;
    window.gameState.missionTime = 480; // Start at 8 AM
    
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
    
    // Get encounters for current day
    const todaysEncounters = mission.encounters.filter(e => e.day === window.gameState.missionDay && !e.completed);
    
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
    
    // Advance to next day if mission is still active
    if (mission.state === "active") {
      window.gameState.missionDay++;
      mission.currentDay++;
      
      // If we've reached the end of the mission duration, end mission
      if (window.gameState.missionDay > mission.duration) {
        mission.state = "failed";
        handleMissionFailure(mission, "time_expired");
      } else {
        // Start the new day
        window.gameState.missionTime = 480; // 8 AM
        updateMissionUI(mission);
      }
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
  
  // Handle mission failure
  window.handleMissionFailure = function(mission, reason = "defeat") {
    mission.state = "failed";
    mission.failureReason = reason;
    
    // Check if player is dead
    if (window.gameState.health <= 0) {
      // Permanent death
      handlePlayerDeath(mission);
    } else {
      // Retreating with wounds
      applyMissionFailureConsequences(mission);
      returnToCamp(false);
      showMissionFailureSummary(mission);
    }
  };
  
  // Return from mission to camp
  window.returnToCamp = function(success) {
    // Restore camp state
    window.gameTime = window.gameState.savedCampState.time;
    window.gameDay = window.gameState.savedCampState.day;
    
    // If mission was a success, keep gained experience
    // If mission failed, restore previous camp state more fully
    if (!success) {
      window.gameState.health = Math.max(20, window.gameState.savedCampState.health * 0.5); // Half health
      window.gameState.stamina = Math.max(20, window.gameState.savedCampState.stamina * 0.5); // Half stamina
      window.gameState.morale = Math.max(30, window.gameState.morale - 20); // Reduce morale further
    }
    
    // Clear mission state
    window.gameState.inMission = false;
    window.gameState.currentMission = null;
    window.gameState.missionDay = 0;
    window.gameState.savedCampState = null;
    
    // Update UI
    window.updateActionButtons();
    window.updateStatusBars();
    document.getElementById('location').textContent = "Location: Kasvaari Camp, somewhere in the Western Hierarchate of Nesia";
  };
  
  // Handle permanent death
  window.handlePlayerDeath = function(mission) {
    // Game over screen
    const narrativeDiv = document.getElementById('narrative');
    narrativeDiv.innerHTML = `
      <h2>You Have Fallen in Battle</h2>
      <p>Your journey ends here, on the bloody fields of the ${mission.terrain}.</p>
      <p>You survived for ${window.gameDay} days and reached level ${window.gameState.level}.</p>
      <p>Your body will be returned to the Empire, your name added to the rolls of the fallen.</p>
      <button id="new-recruit-button" class="menu-button">Enlist a New Recruit</button>
    `;
    
    // Hide all other UI elements
    document.getElementById('actions').innerHTML = '';
    document.getElementById('status-bars').style.display = 'none';
    
    // Add button to restart
    document.getElementById('new-recruit-button').addEventListener('click', function() {
      window.location.reload(); // Simple reload for now, could be more sophisticated
    });
  };
  
  // Helper functions
  function generateMissionId() {
    return 'm' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // Show mission summary
window.showMissionSummary = function(mission) {
  let summaryHTML = `
    <h3>Mission Complete: ${mission.name}</h3>
    <p>You have successfully completed your mission!</p>
    <p><strong>Rewards:</strong></p>
    <ul>
      <li>Experience: ${mission.rewards.experience} XP</li>
      <li>Payment: ${mission.rewards.taelors} taelors</li>
  `;
  
  // Add item rewards if any
  if (mission.rewards.itemAwarded) {
    summaryHTML += `<li>Item: ${mission.rewards.itemAwarded.name}</li>`;
  }
  
  summaryHTML += `</ul>`;
  
  // Show objectives completed
  summaryHTML += `<p><strong>Objectives Completed:</strong></p><ul>`;
  mission.objectives.forEach(obj => {
    summaryHTML += `<li>${obj.description}</li>`;
  });
  summaryHTML += `</ul>`;
  
  // Show summary
  window.setNarrative(summaryHTML);
};

// Show mission failure summary
window.showMissionFailureSummary = function(mission) {
  let failureHTML = `
    <h3>Mission Failed: ${mission.name}</h3>
    <p>You were unable to complete your mission and have been forced to return to camp.</p>
    <p><strong>Reason:</strong> `;
  
  // Different failure reasons
  if (mission.failureReason === "time_expired") {
    failureHTML += `You ran out of time before completing all objectives.`;
  } else if (mission.failureReason === "retreat") {
    failureHTML += `You had to retreat from a difficult situation.`;
  } else {
    failureHTML += `You were unable to overcome the challenges of the mission.`;
  }
  
  failureHTML += `</p>`;
  
  // Show incomplete objectives
  failureHTML += `<p><strong>Incomplete Objectives:</strong></p><ul>`;
  mission.objectives.filter(obj => !obj.completed).forEach(obj => {
    failureHTML += `<li>${obj.description} (Progress: ${obj.progress}/${obj.count})</li>`;
  });
  failureHTML += `</ul>`;
  
  // Show summary
  window.setNarrative(failureHTML);
};

// Apply failure consequences
window.applyMissionFailureConsequences = function(mission) {
  // Morale loss
  window.gameState.morale = Math.max(25, window.gameState.morale - 15);
  
  // Random injury
  if (Math.random() < 0.5 && window.gameState.playerInjuries.length < 3) {
    // Apply a random minor injury
    const possibleInjuries = ["twisted_ankle", "fractured_arm", "concussion"];
    const randomInjury = possibleInjuries[Math.floor(Math.random() * possibleInjuries.length)];
    
    if (typeof window.applyInjury === 'function') {
      window.applyInjury("player", randomInjury);
    }
  }
  
  // Loss of some resources
  if (window.player.inventory.length > 0 && Math.random() < 0.3) {
    // Lose a random item
    const randomIndex = Math.floor(Math.random() * window.player.inventory.length);
    const lostItem = window.player.inventory.splice(randomIndex, 1)[0];
    window.addToNarrative(`In your retreat, you lost your ${lostItem.name}.`);
  }
};