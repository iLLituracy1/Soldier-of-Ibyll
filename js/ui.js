// UI FUNCTIONS MODULE
// Functions related to UI updates and rendering

// Update status bars function
window.updateStatusBars = function() {
  try {
    console.log("Updating status bars...");
    
    // Update health bar
    const healthBar = document.getElementById('sidebarHealthBar');
    const healthValue = document.getElementById('sidebarHealthValue');
    
    if (healthBar && healthValue && window.gameState) {
      const healthPercent = (window.gameState.health / window.gameState.maxHealth) * 100;
      healthBar.style.width = `${healthPercent}%`;
      healthValue.textContent = `${Math.round(window.gameState.health)}/${window.gameState.maxHealth}`;
    } else {
      console.warn("Health bar elements or gameState not found");
    }
    
    // Update stamina bar
    const staminaBar = document.getElementById('sidebarStaminaBar');
    const staminaValue = document.getElementById('sidebarStaminaValue');
    
    if (staminaBar && staminaValue && window.gameState) {
      const staminaPercent = (window.gameState.stamina / window.gameState.maxStamina) * 100;
      staminaBar.style.width = `${staminaPercent}%`;
      staminaValue.textContent = `${Math.round(window.gameState.stamina)}/${window.gameState.maxStamina}`;
    } else {
      console.warn("Stamina bar elements or gameState not found");
    }
    
    // Update morale bar
    const moraleBar = document.getElementById('sidebarMoraleBar');
    const moraleValue = document.getElementById('sidebarMoraleValue');
    
    if (moraleBar && moraleValue && window.gameState) {
      moraleBar.style.width = `${window.gameState.morale}%`;
      moraleValue.textContent = `${Math.round(window.gameState.morale)}/100`;
    } else {
      console.warn("Morale bar elements or gameState not found");
    }
    
    console.log("Status bars updated successfully");
  } catch (error) {
    console.error("Error updating status bars:", error);
  }
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
window.updateActionButtons = function() {
  // Update action buttons based on time of day, location, etc.
  const actionsContainer = document.getElementById('actions');
  actionsContainer.innerHTML = '';
  
  const timeOfDay = window.getTimeOfDay();
  const hours = Math.floor(window.gameTime / 60);
  
  // Standard actions available in camp
  if (!window.gameState.inBattle && !window.gameState.inMission) {
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
    
    // Add more actions based on game progression
    if (window.gameState.mainQuest.stage >= 1) {
      // Add more mission options as the game progresses
    }
  }
};

// Function to add action button
window.addActionButton = function(label, action, container) {
  const btn = document.createElement('button');
  btn.className = 'action-btn';
  btn.textContent = label;
  btn.setAttribute('data-action', action);
  
  // Add tooltip with hotkey information if applicable
  let tooltip = label;
  switch(action) {
    case 'train': tooltip += ' [T]'; break;
    case 'rest': tooltip += ' [R]'; break;
    case 'patrol': tooltip += ' [P]'; break;
    case 'mess': tooltip += ' [M]'; break;
    case 'guard': tooltip += ' [G]'; break;
  }
  btn.setAttribute('title', tooltip);
  
  btn.onclick = function() {
    window.handleAction(action);
  };
  
  container.appendChild(btn);
};

// Function to handle profile panel display
window.handleProfile = function() {
  try {
    // Get the profile div and panel
    const profilePanel = document.getElementById('profile');
    const profileDiv = document.getElementById('profileText');
    if (!profileDiv || !profilePanel) {
      console.error('Profile elements not found');
      return;
    }

    // Safety check for required player data
    if (!window.player || !window.gameState) {
      console.error('Player or game state not initialized');
      return;
    }

    // Calculate skill caps based on attributes
    const meleeCap = Math.floor((window.player.phy || 0) / 1.5);
    const marksmanshipCap = Math.floor(((window.player.phy || 0) + (window.player.men || 0)) / 3);
    const survivalCap = Math.floor(((window.player.phy || 0) + (window.player.men || 0)) / 3);
    const commandCap = Math.floor(((window.player.men || 0) * 0.8 + (window.player.phy || 0) * 0.2) / 1.5);
    const mentalSkillCap = Math.floor((window.player.men || 0) / 1.5);

    // Determine character avatar and badge
    let avatarEmoji = '👤';
    let badgeEmoji = '⚔️';
    
    // Set badge based on career
    if (window.player.career) {
      if (window.player.career.title.includes('Geister')) badgeEmoji = '✨';
      if (window.player.career.title.includes('Marine')) badgeEmoji = '⚓';
      if (window.player.career.title.includes('Corsair')) badgeEmoji = '⛵';
      if (window.player.career.title.includes('Berserker')) badgeEmoji = '🪓';
    }

    // Build the profile HTML with all character information
    let profileHtml = `
      <div class="character-header">
        <div class="character-avatar">
          ${avatarEmoji}
          <div class="character-badge">${badgeEmoji}</div>
        </div>
        <div class="character-info">
          <h2>${window.player.name || 'Unknown'}</h2>
          <div class="character-title">${window.player.origin || 'Unknown Origin'} ${window.player.career?.title || 'Unknown Career'}</div>
          <div class="character-stats">
            <div class="stat-pill">Level ${window.gameState.level || 1}</div>
            <div class="stat-pill">XP: ${window.gameState.experience || 0}/${(window.gameState.level || 1) * 100}</div>
            <div class="stat-pill">SP: ${window.gameState.skillPoints || 0}</div>
          </div>
        </div>
      </div>

      <div class="attributes-section">
        <div class="attribute-card">
          <h3>Physical (PHY)</h3>
          <div class="attribute-value">${((window.player.phy || 0)).toFixed(1)} / 15</div>
          <div class="attribute-description">Strength, endurance, and raw physical ability</div>
        </div>

        <div class="attribute-card">
          <h3>Mental (MEN)</h3>
          <div class="attribute-value">${((window.player.men || 0)).toFixed(1)} / 15</div>
          <div class="attribute-description">Intelligence, willpower, and mental acuity</div>
        </div>
      </div>

      <div class="skills-section">
        <h3>Skills</h3>
        <div class="skills-grid">`;

    // Add skills with proper error handling
    const skills = {
      'Melee Combat': { value: window.player.skills?.melee || 0, cap: meleeCap, base: 'PHY' },
      'Marksmanship': { value: window.player.skills?.marksmanship || 0, cap: marksmanshipCap, base: 'PHY+MEN' },
      'Survival': { value: window.player.skills?.survival || 0, cap: survivalCap, base: 'PHY+MEN' },
      'Command': { value: window.player.skills?.command || 0, cap: commandCap, base: 'MEN+PHY' },
      'Discipline': { value: window.player.skills?.discipline || 0, cap: mentalSkillCap, base: 'MEN' },
      'Tactics': { value: window.player.skills?.tactics || 0, cap: mentalSkillCap, base: 'MEN' },
      'Organization': { value: window.player.skills?.organization || 0, cap: mentalSkillCap, base: 'MEN' },
      'Arcana': { value: window.player.skills?.arcana || 0, cap: mentalSkillCap, base: 'MEN' }
    };

    for (const [skillName, skillData] of Object.entries(skills)) {
      profileHtml += `
        <div class="skill-card">
          <div class="skill-name">${skillName}</div>
          <div class="skill-value">${skillData.value.toFixed(1)} / ${skillData.cap}</div>
          <div class="skill-base">${skillData.base} based</div>
        </div>
      `;
    }

    profileHtml += `</div>`; // Close skills-grid

    // Add relationships if they exist
    if (window.player.relationships && Object.keys(window.player.relationships).length > 0) {
      profileHtml += `
        <div class="relationships-section">
          <h3>Relationships</h3>
          <div class="relationship-cards">
      `;

      for (const [id, relationship] of Object.entries(window.player.relationships)) {
        let dispositionText = "Neutral";
        if (relationship.disposition >= 30) dispositionText = "Friendly";
        if (relationship.disposition >= 60) dispositionText = "Trusted Ally";
        if (relationship.disposition <= -30) dispositionText = "Distrustful";
        if (relationship.disposition <= -60) dispositionText = "Hostile";

        profileHtml += `
          <div class="relationship-card">
            <div class="relationship-name">${relationship.name}</div>
            <div class="relationship-status">${dispositionText}</div>
            <div class="relationship-value">(${relationship.disposition})</div>
          </div>
        `;
      }

      profileHtml += `</div></div>`;
    }

    // Update the profile content
    profileDiv.innerHTML = profileHtml;

    // Show the profile panel
    profilePanel.classList.remove('hidden');
    
    console.log("Profile displayed successfully");
  } catch (error) {
    console.error('Error displaying profile:', error);
  }
};

// Function to update profile if it's currently visible
window.updateProfileIfVisible = function() {
  const profilePanel = document.getElementById('profile');
  if (profilePanel && !profilePanel.classList.contains('hidden')) {
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