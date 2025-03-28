// UI FUNCTIONS MODULE
// Functions related to UI updates and rendering

// Update status bars function
window.updateStatusBars = function() {
  // Update health bar
  document.getElementById('healthBar').style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
  document.getElementById('healthValue').textContent = `${Math.round(window.gameState.health)}/${window.gameState.maxHealth}`;
  
  // Update stamina bar
  document.getElementById('staminaBar').style.width = `${(window.gameState.stamina / window.gameState.maxStamina) * 100}%`;
  document.getElementById('staminaValue').textContent = `${Math.round(window.gameState.stamina)}/${window.gameState.maxStamina}`;
  
  // Update morale bar
  document.getElementById('moraleBar').style.width = `${window.gameState.morale}%`;
  document.getElementById('moraleValue').textContent = `${Math.round(window.gameState.morale)}/100`;
};

// Function to update time and day display
window.updateTimeAndDay = function(minutesToAdd) {
  // Add time
  window.gameTime += minutesToAdd;
  
  // Check for day change
  while (window.gameTime >= 1440) { // 24 hours * 60 minutes
    window.gameTime -= 1440;
    window.gameDay++;
    
    // Reset daily flags
    window.gameState.dailyTrainingCount = 0;
    window.gameState.dailyPatrolDone = false;
    window.gameState.dailyScoutDone = false;
  }
  
  // Format time for display
  const hours = Math.floor(window.gameTime / 60);
  const minutes = window.gameTime % 60;
  const ampm = hours < 12 ? 'AM' : 'PM';
  const displayHours = hours % 12 || 12; // Convert 0 to 12 for display
  
  document.getElementById('timeDisplay').textContent = `Time: ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  document.getElementById('dayDisplay').textContent = `Day ${window.gameDay}`;
  
  // Update day/night indicator
  const timeOfDay = window.getTimeOfDay();
  document.getElementById('dayNightIndicator').className = 'day-night-indicator time-' + timeOfDay;
  
  // Update action buttons based on time
  window.updateActionButtons();
};

// Function to get time of day
window.getTimeOfDay = function() {
  const hours = Math.floor(window.gameTime / 60);
  
  if (hours >= 5 && hours < 8) return 'dawn';
  if (hours >= 8 && hours < 18) return 'day';
  if (hours >= 18 && hours < 21) return 'evening';
  return 'night';
};

// Function to update action buttons
// Modify the updateActionButtons function to consider current location
window.updateActionButtons = function() {
  // Update action buttons based on time of day, location, etc.
  const actionsContainer = document.getElementById('actions');
  actionsContainer.innerHTML = '';
  
  // If player is awaiting quest response, only show the quest-related button
  if (window.gameState.awaitingQuestResponse) {
    // Check for active quest
    const activeQuest = window.quests.find(q => q.status === window.QUEST_STATUS.ACTIVE);
    if (activeQuest) {
      window.addActionButton('Report to Sarkein', 'respond_to_quest', actionsContainer);
      console.log("Showing only 'Report to Sarkein' button due to awaiting quest response");
      return; // Don't show any other buttons
    }
  }
  
  // If already in a quest sequence or battle, don't show regular actions
  if (window.gameState.inBattle || window.gameState.inMission || window.gameState.inQuestSequence) {
    return;
  }
  
  const timeOfDay = window.getTimeOfDay();
  const hours = Math.floor(window.gameTime / 60);
  
  // Get current location
  const currentLocationId = window.gameState.campaignState ? 
    window.gameState.campaignState.currentLocation : 
    window.CAMPAIGN_LOCATIONS.KASVAARI_CAMP.id;
  
  // Location-specific actions
  if (currentLocationId === window.CAMPAIGN_LOCATIONS.KASVAARI_CAMP.id) {
    // Standard actions available in Kasvaari Camp
    // Training available during the day
    if (timeOfDay === 'day' || timeOfDay === 'dawn') {
      window.addActionButton('Train', 'train', actionsContainer);
    }
    
    // Rest always available
    window.addActionButton('Rest', 'rest', actionsContainer);
    
    // Patrol available during day and evening
    if (timeOfDay === 'day' || timeOfDay === 'evening') {
      window.addActionButton('Patrol', 'patrol', actionsContainer);
    }
    
    // Mess hall available during meal times
    if ((hours >= 7 && hours <= 9) || (hours >= 12 && hours <= 14) || (hours >= 18 && hours <= 20)) {
      window.addActionButton('Mess Hall', 'mess', actionsContainer);
    }
    
    // Guard duty available all times
    window.addActionButton('Guard Duty', 'guard', actionsContainer);
    
    // Gambling and Brawler Pits visibility logic
    if (timeOfDay === 'evening' || timeOfDay === 'night') {
      // Only show if player has discovered it or has the right background
      if (window.gameState.discoveredGamblingTent) {
        window.addActionButton('Gambling Tent', 'gambling', actionsContainer);
      }
      
      if (window.gameState.discoveredBrawlerPits) {
        window.addActionButton('Brawler Pits', 'brawler_pits', actionsContainer);
      }
    }
  }
  else if (currentLocationId === window.CAMPAIGN_LOCATIONS.ARRASI_FRONTIER.id) {
    // Actions available at the Arrasi Frontier
    // Frontier-specific actions
    window.addActionButton('Rest', 'rest', actionsContainer);
    
    if (timeOfDay === 'day' || timeOfDay === 'dawn') {
      window.addActionButton('Scout', 'frontier_scout', actionsContainer);
    }
    
    if (timeOfDay === 'day' || timeOfDay === 'evening') {
      window.addActionButton('Patrol Border', 'frontier_patrol', actionsContainer);
    }
    
    // Mess available at different times at frontier
    if ((hours >= 6 && hours <= 8) || (hours >= 18 && hours <= 20)) {
      window.addActionButton('Field Kitchen', 'mess', actionsContainer);
    }
    
    // Guard duty always available
    window.addActionButton('Guard Post', 'guard', actionsContainer);
    
    // Frontier-specific activities
    if (timeOfDay === 'day') {
      window.addActionButton('Repair Fortifications', 'repair_fort', actionsContainer);
    }
    
    if (timeOfDay === 'evening' || timeOfDay === 'night') {
      window.addActionButton('Evening Drills', 'frontier_train', actionsContainer);
    }
  }
  // Add more location-specific actions as needed
};

// Function to add action button
window.addActionButton = function(label, action, container) {
  const btn = document.createElement('button');
  btn.className = 'action-btn';
  btn.textContent = label;
  btn.setAttribute('data-action', action);
  btn.onclick = function() {
    window.handleAction(action);
  };
  container.appendChild(btn);
};

// Function to handle profile panel display
// Updated handleProfile function with rank display
window.handleProfile = function() {
  const profileDiv = document.getElementById('profile');
  const profileText = document.getElementById('profileText');
  
  // Get career and origin info for styling
  const career = window.player.career.title;
  const origin = window.player.origin;
  
  // Calculate skill caps based on attributes
  const meleeCap = Math.floor(window.player.phy / 1.5);
  const marksmanshipCap = Math.floor((window.player.phy + window.player.men) / 3);
  const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
  const commandCap = Math.floor((window.player.men * 0.8 + window.player.phy * 0.2) / 1.5);
  const mentalSkillCap = Math.floor(window.player.men / 1.5);
  
  // Generate career-specific icon
  let careerIcon = "⚔️"; // Default icon
  
  if (career.includes("Marine") || career.includes("Corsair")) {
    careerIcon = "⚓";
  } else if (career.includes("Scout")) {
    careerIcon = "🏹";
  } else if (career.includes("Cavalry")) {
    careerIcon = "🐎";
  } else if (career.includes("Geister")) {
    careerIcon = "✨";
  } else if (career.includes("Berserker")) {
    careerIcon = "🪓";
  }
  
  // Generate color based on origin
  let originColor = "#a0a0ff"; // Default blue
  
  if (origin === "Paanic") {
    originColor = "#ff9966"; // Orange
  } else if (origin === "Nesian") {
    originColor = "#66ccff"; // Light blue
  } else if (origin === "Lunarine") {
    originColor = "#ffcc66"; // Gold
  } else if (origin === "Wyrdman") {
    originColor = "#99cc66"; // Green
  }
  
  // Get rank information
  const currentRank = window.getCurrentRank ? window.getCurrentRank() : { title: 'Sai\'Lun', description: 'Recruit' };
  const nextRank = window.getNextRank ? window.getNextRank() : null;
  
  // Create the modern profile UI - simplified for better fit
  profileText.innerHTML = `
    <div class="profile-container">
      <div class="profile-header">
        <div class="profile-avatar" style="background-color: rgba(${parseInt(originColor.slice(1, 3), 16)}, ${parseInt(originColor.slice(3, 5), 16)}, ${parseInt(originColor.slice(5, 7), 16)}, 0.2)">
          <div class="avatar-icon">${careerIcon}</div>
          <div class="secondary-icon" style="background-color: ${originColor}">
            <span>${origin.charAt(0)}</span>
          </div>
        </div>
        
        <div class="profile-title">
          <h2>${window.player.name}</h2>
          <div class="profile-subtitle">${origin} ${career}</div>
          
              <div class="profile-rank">
      <span>${currentRank.title}</span> 
      <small>(${currentRank.description})</small>
    </div>

    <div class="profile-stats">
      <div class="stat-pill">Commendations: ${window.gameState.commendations}</div>
      <div class="stat-pill">Deeds: ${window.gameState.deeds}${nextRank ? '/' + nextRank.deedsRequired : ''}</div>
    </div>
      
      <div class="profile-attributes">
        <div class="attribute-box">
          <div class="attribute-title">Physical (PHY)</div>
          <div class="attribute-max">Max: 15</div>
          <div class="attribute-value">${window.player.phy.toFixed(1)}</div>
          <div class="attribute-desc">Strength, endurance, agility, and raw physical ability.</div>
        </div>
        
        <div class="attribute-box">
          <div class="attribute-title">Mental (MEN)</div>
          <div class="attribute-max">Max: 15</div>
          <div class="attribute-value">${window.player.men.toFixed(1)}</div>
          <div class="attribute-desc">Intelligence, willpower, leadership, perception, and adaptability.</div>
        </div>
      </div>
      
      <h3 class="skills-header">Skills</h3>
      
      <div class="skills-grid">
        <div class="skill-card">
          <div class="skill-name">Melee Combat</div>
          <div class="skill-meter">
            <div class="skill-circle" style="--skill-value: ${Math.min(100, window.player.skills.melee / meleeCap * 100)}%;">
              <span class="skill-value">${window.player.skills.melee.toFixed(1)}</span>
            </div>
          </div>
          <div class="skill-cap">Cap: ${meleeCap}</div>
        </div>
        
        <div class="skill-card">
          <div class="skill-name">Marksmanship</div>
          <div class="skill-meter">
            <div class="skill-circle" style="--skill-value: ${Math.min(100, window.player.skills.marksmanship / marksmanshipCap * 100)}%;">
              <span class="skill-value">${window.player.skills.marksmanship.toFixed(1)}</span>
            </div>
          </div>
          <div class="skill-cap">Cap: ${marksmanshipCap}</div>
        </div>
        
        <div class="skill-card">
          <div class="skill-name">Survival</div>
          <div class="skill-meter">
            <div class="skill-circle" style="--skill-value: ${Math.min(100, window.player.skills.survival / survivalCap * 100)}%;">
              <span class="skill-value">${window.player.skills.survival.toFixed(1)}</span>
            </div>
          </div>
          <div class="skill-cap">Cap: ${survivalCap}</div>
        </div>
        
        <div class="skill-card">
          <div class="skill-name">Command</div>
          <div class="skill-meter">
            <div class="skill-circle" style="--skill-value: ${Math.min(100, window.player.skills.command / commandCap * 100)}%;">
              <span class="skill-value">${window.player.skills.command.toFixed(1)}</span>
            </div>
          </div>
          <div class="skill-cap">Cap: ${commandCap}</div>
        </div>
        
        <div class="skill-card">
          <div class="skill-name">Discipline</div>
          <div class="skill-meter">
            <div class="skill-circle" style="--skill-value: ${Math.min(100, window.player.skills.discipline / mentalSkillCap * 100)}%;">
              <span class="skill-value">${window.player.skills.discipline.toFixed(1)}</span>
            </div>
          </div>
          <div class="skill-cap">Cap: ${mentalSkillCap}</div>
        </div>
        
        <div class="skill-card">
          <div class="skill-name">Tactics</div>
          <div class="skill-meter">
            <div class="skill-circle" style="--skill-value: ${Math.min(100, window.player.skills.tactics / mentalSkillCap * 100)}%;">
              <span class="skill-value">${window.player.skills.tactics.toFixed(1)}</span>
            </div>
          </div>
          <div class="skill-cap">Cap: ${mentalSkillCap}</div>
        </div>
        
        <div class="skill-card">
          <div class="skill-name">Organization</div>
          <div class="skill-meter">
            <div class="skill-circle" style="--skill-value: ${Math.min(100, window.player.skills.organization / mentalSkillCap * 100)}%;">
              <span class="skill-value">${window.player.skills.organization.toFixed(1)}</span>
            </div>
          </div>
          <div class="skill-cap">Cap: ${mentalSkillCap}</div>
        </div>
        
        <div class="skill-card">
          <div class="skill-name">Arcana</div>
          <div class="skill-meter">
            <div class="skill-circle" style="--skill-value: ${Math.min(100, window.player.skills.arcana / mentalSkillCap * 100)}%;">
              <span class="skill-value">${window.player.skills.arcana.toFixed(1)}</span>
            </div>
          </div>
          <div class="skill-cap">Cap: ${mentalSkillCap}</div>
        </div>
      </div>
    </div>
  `;
  
  // Show the profile panel
  profileDiv.classList.remove('hidden');
};

// Update profile if it's currently visible
window.updateProfileIfVisible = function() {
  if (!document.getElementById('profile').classList.contains('hidden')) {
    window.handleProfile();
  }
};

// Function to set narrative text
window.setNarrative = function(text) {
  // Replace the narrative with new text instead of appending
  const narrativeDiv = document.getElementById('narrative');
  narrativeDiv.innerHTML = `<p>${text}</p>`;
  narrativeDiv.scrollTop = 0; // Scroll to top
};

// Function to add to narrative text
window.addToNarrative = function(text) {
  // Append to existing narrative
  const narrativeDiv = document.getElementById('narrative');
  narrativeDiv.innerHTML += `<p>${text}</p>`;
  narrativeDiv.scrollTop = narrativeDiv.scrollHeight; // Scroll to bottom
};

// Show notification function
window.showNotification = function(text, type = 'info') {
  const notification = document.getElementById('notification');
  notification.textContent = text;
  notification.className = `notification ${type} show`;
  
  // Set timeout to hide notification
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
};

// Show achievement notification function
window.showAchievement = function(achievementId) {
  const achievement = window.achievements.find(a => a.id === achievementId);
  if (!achievement || achievement.unlocked) return;
  
  // Mark achievement as unlocked
  achievement.unlocked = true;
  
  // Create achievement notification
  const notificationElement = document.createElement('div');
  notificationElement.className = 'achievement-notification';
  
  notificationElement.innerHTML = `
    <div class="achievement-icon">${achievement.icon}</div>
    <div class="achievement-content">
      <div class="achievement-title">Achievement Unlocked</div>
      <div class="achievement-name">${achievement.title}</div>
      <div class="achievement-description">${achievement.description}</div>
    </div>
  `;
  
  document.body.appendChild(notificationElement);
  
  // Remove after animation completes
  setTimeout(() => {
    document.body.removeChild(notificationElement);
  }, 5000);
};