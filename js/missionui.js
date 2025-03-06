// js/missionUI.js - UI components for mission system

// Mission Selection Screen
window.showMissionSelectionScreen = function() {
    const campaign = window.gameState.currentCampaign;
    if (!campaign) return;
    
    // Get current stage
    const currentStage = window.campaignTemplates[campaign.type]
      .missionProgression.find(stage => stage.stage === campaign.currentStage);
    
    if (!currentStage) return;
    
    // Build mission selection UI
    const actionsContainer = document.getElementById('actions');
    actionsContainer.innerHTML = '';
    
    // Add title
    const title = document.createElement('h3');
    title.textContent = `Campaign Stage ${campaign.currentStage}: ${currentStage.name}`;
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    actionsContainer.appendChild(title);
    
    // Add description of current stage
    const stageDescription = document.createElement('p');
    stageDescription.textContent = `Select a mission to advance the campaign. You need to complete ${currentStage.requiredCompletions} missions at this stage.`;
    stageDescription.style.marginBottom = '20px';
    actionsContainer.appendChild(stageDescription);
    
    // Available missions
    currentStage.availableMissions.forEach(missionType => {
      // Check if already completed
      const alreadyCompleted = campaign.completedMissions.includes(missionType);
      
      // Get mission template
      const missionTemplate = window.missionTypes[missionType];
      if (!missionTemplate) return;
      
      // Create mission card
      const missionCard = document.createElement('div');
      missionCard.className = 'mission-card';
      missionCard.style.border = '1px solid #444';
      missionCard.style.borderRadius = '8px';
      missionCard.style.padding = '15px';
      missionCard.style.marginBottom = '15px';
      missionCard.style.background = alreadyCompleted ? '#2a3b2a' : '#1a1a1a';
      
      // Mission title
      const missionTitle = document.createElement('h4');
      missionTitle.textContent = missionTemplate.name;
      missionTitle.style.marginTop = '0';
      missionCard.appendChild(missionTitle);
      
      // Mission description
      const missionDesc = document.createElement('p');
      missionDesc.textContent = missionTemplate.description;
      missionCard.appendChild(missionDesc);
      
      // Mission details
      const missionDetails = document.createElement('div');
      missionDetails.innerHTML = `
        <strong>Difficulty:</strong> ${'★'.repeat(missionTemplate.difficulty)}<br>
        <strong>Duration:</strong> ${missionTemplate.duration} days<br>
        <strong>Reward:</strong> ${missionTemplate.rewards.experience} XP, ${missionTemplate.rewards.taelors} taelors
      `;
      missionCard.appendChild(missionDetails);
      
      // Mission button
      const missionButton = document.createElement('button');
      missionButton.className = 'action-btn';
      missionButton.textContent = alreadyCompleted ? 'Completed' : 'Start Mission';
      missionButton.disabled = alreadyCompleted;
      missionButton.style.marginTop = '10px';
      
      if (!alreadyCompleted) {
        missionButton.onclick = function() {
          window.startMission(missionType);
        };
      }
      
      missionCard.appendChild(missionButton);
      
      // Add to container
      actionsContainer.appendChild(missionCard);
    });
    
    // Back to camp button
    const backButton = document.createElement('button');
    backButton.className = 'action-btn';
    backButton.textContent = 'Return to Camp';
    backButton.style.marginTop = '20px';
    backButton.onclick = function() {
      window.updateActionButtons();
    };
    actionsContainer.appendChild(backButton);
  };
  
  // Update mission UI
  window.updateMissionUI = function(mission) {
    // Update location display
    document.getElementById('location').textContent = `Location: ${mission.name}, ${capitalizeFirstLetter(mission.terrain)} terrain`;
    
    // Update day/time display
    document.getElementById('dayDisplay').textContent = `Mission Day ${mission.currentDay}/${mission.duration}`;
    
    // Update weather indicator
    const weatherClass = mission.weather.toLowerCase().replace(' ', '-');
    document.getElementById('dayNightIndicator').className = `day-night-indicator weather-${weatherClass}`;
    
    // Update action buttons
    updateMissionActionButtons(mission);
    
    // Set narrative based on mission state
    if (mission.currentDay === 1 && mission.events.length === 0) {
      // First day, no events yet
      window.setNarrative(`You begin your mission in ${mission.terrain} terrain under ${mission.weather} conditions. Your objectives are clear, and the weight of imperial expectations rests upon your shoulders.`);
    } else {
      // Update with latest event
      if (mission.events.length > 0) {
        const latestEvent = mission.events[mission.events.length - 1];
        window.addToNarrative(latestEvent.description);
      }
    }
  };
  
  // Update mission action buttons
  window.updateMissionActionButtons = function(mission) {
    const actionsContainer = document.getElementById('actions');
    actionsContainer.innerHTML = '';
    
    // Basic mission actions
    window.addActionButton('Scout Ahead', 'mission_scout', actionsContainer);
    window.addActionButton('Make Camp', 'mission_camp', actionsContainer);
    window.addActionButton('Check Objectives', 'mission_objectives', actionsContainer);

    // Check if there are discovered encounters to add a special button
    const hasDiscoveredEncounters = mission.encounters.some(e => 
    e.day === mission.currentDay && !e.completed && e.discovered && !e.triggered);
    if (hasDiscoveredEncounters) {
    window.addActionButton('Check Known Encounters', 'show_encounters', actionsContainer);
    }
    
    // Terrain-specific actions
    if (mission.terrain === 'forest') {
      window.addActionButton('Forage for Supplies', 'mission_forage', actionsContainer);
    } else if (mission.terrain === 'hills') {
      window.addActionButton('Survey from High Ground', 'mission_survey', actionsContainer);
    } else if (mission.terrain === 'rocky') {
      window.addActionButton('Find Defensible Position', 'mission_defend', actionsContainer);
    }
    
    // Special mission-type actions
    if (mission.type === 'patrol') {
      window.addActionButton('Patrol Area', 'mission_patrol', actionsContainer);
    } else if (mission.type === 'skirmish') {
      window.addActionButton('Set Ambush', 'mission_ambush', actionsContainer);
    } else if (mission.type === 'siege') {
      window.addActionButton('Reconnoiter Defenses', 'mission_reconnoiter', actionsContainer);
    }
    
    // Add menu buttons
    window.addActionButton('Profile', 'profile', actionsContainer);
    window.addActionButton('Inventory', 'inventory', actionsContainer);
    window.addActionButton('Mission Log', 'mission_log', actionsContainer);
  };
  
  // Show mission briefing
  window.showMissionBriefing = function(mission) {
    const narrativeDiv = document.getElementById('narrative');
    narrativeDiv.innerHTML = `
      <h3>${mission.name}</h3>
      <p>${mission.description}</p>
      <p><strong>Terrain:</strong> ${capitalizeFirstLetter(mission.terrain)}</p>
      <p><strong>Weather:</strong> ${capitalizeFirstLetter(mission.weather)}</p>
      <p><strong>Duration:</strong> ${mission.duration} days</p>
      <p><strong>Objectives:</strong></p>
      <ul>
        ${mission.objectives.map(obj => `<li>${obj.description}</li>`).join('')}
      </ul>
      <p>You set out from camp with your orders. The fate of the Empire's expansion rests on your success.</p>
    `;
  };
  
  // Show mission objectives
  window.showMissionObjectives = function(mission) {
    const narrativeDiv = document.getElementById('narrative');
    let objectivesHTML = '<h3>Mission Objectives</h3><ul>';
    
    mission.objectives.forEach(obj => {
      const status = obj.completed ? 'Completed' : `Progress: ${obj.progress}/${obj.count}`;
      objectivesHTML += `<li>${obj.description} - <em>${status}</em></li>`;
    });
    
    objectivesHTML += '</ul>';
    
    window.addToNarrative(objectivesHTML);
  };
  
  // Show mission log
  window.showMissionLog = function(mission) {
    const logContainer = document.getElementById('questLog');
    logContainer.innerHTML = `<h3>Mission Log: ${mission.name}</h3>`;
    
    // Day by day events
    let currentLogDay = 0;
    
    mission.events.forEach(event => {
      if (event.day !== currentLogDay) {
        logContainer.innerHTML += `<h4>Day ${event.day}</h4>`;
        currentLogDay = event.day;
      }
      
      logContainer.innerHTML += `<p>${event.description}</p>`;
    });
    
    // Add objectives status
    logContainer.innerHTML += `<h4>Objectives</h4><ul>`;
    mission.objectives.forEach(obj => {
      const status = obj.completed ? 'Completed' : `Progress: ${obj.progress}/${obj.count}`;
      logContainer.innerHTML += `<li>${obj.description} - <em>${status}</em></li>`;
    });
    logContainer.innerHTML += `</ul>`;
    
    // Add close button
    logContainer.innerHTML += `<button class="menu-button mission-log-close">Close</button>`;
    
    // Add event listener
    document.querySelector('.mission-log-close').addEventListener('click', function() {
      document.getElementById('questLog').classList.add('hidden');
    });
    
    // Show the log
    logContainer.classList.remove('hidden');
  };
  
  // Helper function to capitalize first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }