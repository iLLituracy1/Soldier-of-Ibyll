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
  else if (currentLocationId === window.CAMPAIGN_LOCATIONS.WALL_OF_NESIA.id) {
    // Actions available at the Wall of Nesia
    window.addActionButton('Rest', 'rest', actionsContainer);
    
    if (timeOfDay === 'day' || timeOfDay === 'evening') {
      window.addActionButton('Patrol Border', 'frontier_patrol', actionsContainer);
    }
    
    // Mess available at different times at frontier
    if ((hours >= 6 && hours <= 8) || (hours >= 18 && hours <= 20)) {
      window.addActionButton('Field Kitchen', 'mess', actionsContainer);
    }
    
    // Guard duty always available
    window.addActionButton('Guard Post', 'guard', actionsContainer);

    
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

// Function to set narrative text with typewriter effect
window.setNarrative = function(text) {
  // Cancel any ongoing typewriter animation
  if (window.currentTypewriterCancelFn) {
    window.currentTypewriterCancelFn();
    window.currentTypewriterCancelFn = null;
  }
  
  // Save reference to the full content for skipping
  window.currentNarrativeContent = text;
  
  // Get narrative div
  const narrativeDiv = document.getElementById('narrative');
  
  // Use typewriter effect and store the cancel function
  window.currentTypewriterCancelFn = window.typewriterEffect(text, narrativeDiv, function() {
    // Enable any disabled buttons after typewriter completes
    if (typeof window.enableQuestButtons === 'function') {
      window.enableQuestButtons();
    }
    // Clear the cancel function when complete
    window.currentTypewriterCancelFn = null;
  });
  
  // Disable buttons until typewriter completes
  if (typeof window.disableQuestButtons === 'function') {
    window.disableQuestButtons();
  }
};

// Replace both implementations of addToNarrative
window.addToNarrative = function(text) {
  // Get narrative div
  const narrativeDiv = document.getElementById('narrative');
  
  // Cancel any ongoing typewriter animation
  if (window.currentTypewriterCancelFn) {
    window.currentTypewriterCancelFn();
    window.currentTypewriterCancelFn = null;
  }
  
  // If typewriter is currently active or was just interrupted, just append normally
  if (window.typewriterConfig.isActive) {
    narrativeDiv.innerHTML += `<p>${text}</p>`;
    narrativeDiv.scrollTop = narrativeDiv.scrollHeight;
    window.typewriterConfig.isActive = false;
    return;
  }
  
  // Create a temporary element to hold the typewriter output
  const tempElement = document.createElement('div');
  
  // Use typewriter effect and store the cancel function
  window.currentTypewriterCancelFn = window.typewriterEffect(text, tempElement, function() {
    // After typewriter completes, append the full text to the narrative
    narrativeDiv.innerHTML += `<p>${text}</p>`;
    narrativeDiv.scrollTop = narrativeDiv.scrollHeight;
    
    // Enable buttons if function is available
    if (typeof window.enableQuestButtons === 'function') {
      window.enableQuestButtons();
    }
    
    // Clear the cancel function
    window.currentTypewriterCancelFn = null;
  });
  
  // Disable buttons until typewriter completes
  if (typeof window.disableQuestButtons === 'function') {
    window.disableQuestButtons();
  }
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

 // Typewriter effect configuration
 window.typewriterConfig = {
  isActive: false,         // Flag to track if typewriter is currently running
  speed: 15,               // Milliseconds per character (adjust for faster/slower)
  buttonDelay: 500,        // Minimum delay before enabling buttons (milliseconds)
  paragraphPause: 200,     // Pause between paragraphs
  shouldAnimate: true      // Toggle to enable/disable animation globally
};

// Improved typewriter effect that properly handles HTML
window.typewriterEffect = function(htmlContent, element, onComplete) {
  // If animation is disabled, just set the HTML immediately
  if (!window.typewriterConfig.shouldAnimate) {
    element.innerHTML = htmlContent;
    if (onComplete) setTimeout(onComplete, window.typewriterConfig.buttonDelay);
    return function() {}; // Return empty cancel function
  }
  
  // Set state to active
  window.typewriterConfig.isActive = true;
  
  // Create a temporary element to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Get all child nodes (elements, text nodes, etc.)
  const nodes = Array.from(tempDiv.childNodes);
  
  // Clear target element
  element.innerHTML = '';
  
  // Track whether we're done
  let isComplete = false;
  
  // Store all timeout IDs for proper cancellation
  const timeoutIds = [];
  
  // Process nodes sequentially
  function processNextNode(index = 0) {
    if (index >= nodes.length) {
      if (!isComplete) {
        isComplete = true;
        window.typewriterConfig.isActive = false;
        if (onComplete) {
          const timeoutId = setTimeout(onComplete, window.typewriterConfig.buttonDelay);
          timeoutIds.push(timeoutId);
        }
      }
      return;
    }
    
    const currentNode = nodes[index];
    
    // Handle different node types
    if (currentNode.nodeType === Node.TEXT_NODE) {
      // For text nodes, process character by character
      const text = currentNode.textContent;
      let charIndex = 0;
      
      // Create a text node in the target element
      const newTextNode = document.createTextNode('');
      element.appendChild(newTextNode);
      
      // Function to type characters
      function typeNextChar() {
        if (!window.typewriterConfig.isActive) {
          // Animation was skipped, complete immediately
          newTextNode.textContent = text;
          processNextNode(index + 1);
          return;
        }
        
        if (charIndex >= text.length) {
          // Finished with this text node
          const timeoutId = setTimeout(() => processNextNode(index + 1), 
            text.endsWith('\n') ? window.typewriterConfig.paragraphPause : 0);
          timeoutIds.push(timeoutId);
          return;
        }
        
        // Add next character
        newTextNode.textContent += text[charIndex++];
        
        // Scroll container as needed
        element.scrollTop = element.scrollHeight;
        
        // Schedule next character
        const timeoutId = setTimeout(typeNextChar, window.typewriterConfig.speed);
        timeoutIds.push(timeoutId);
      }
      
      // Start typing this text node
      typeNextChar();
    }
    else if (currentNode.nodeType === Node.ELEMENT_NODE) {
      // For element nodes (like <p>, <strong>, etc.)
      const newElement = document.createElement(currentNode.tagName);
      
      // Copy attributes
      Array.from(currentNode.attributes).forEach(attr => {
        newElement.setAttribute(attr.name, attr.value);
      });
      
      // Add the empty element to the target
      element.appendChild(newElement);
      
      // If it's a <br> or other empty element, move to next node
      if (currentNode.childNodes.length === 0 || currentNode.tagName === 'BR') {
        // Slight pause after paragraph breaks
        const timeoutId = setTimeout(() => processNextNode(index + 1), 
          currentNode.tagName === 'BR' ? window.typewriterConfig.paragraphPause : 0);
        timeoutIds.push(timeoutId);
        return;
      }
      
      // Otherwise, need to recursively process its children
      const childNodes = Array.from(currentNode.childNodes);
      let childIndex = 0;
      
      function processChildNode() {
        if (childIndex >= childNodes.length) {
          // All children processed, move to next sibling
          const timeoutId = setTimeout(() => processNextNode(index + 1), 0);
          timeoutIds.push(timeoutId);
          return;
        }
        
        const childNode = childNodes[childIndex++];
        
        if (childNode.nodeType === Node.TEXT_NODE) {
          // Process text inside elements character by character
          const text = childNode.textContent;
          let innerCharIndex = 0;
          
          // Create text node inside the element
          const newTextNode = document.createTextNode('');
          newElement.appendChild(newTextNode);
          
          function typeInnerChar() {
            if (!window.typewriterConfig.isActive) {
              // Animation was skipped
              newTextNode.textContent = text;
              processChildNode();
              return;
            }
            
            if (innerCharIndex >= text.length) {
              // Move to next child
              const timeoutId = setTimeout(processChildNode, 0);
              timeoutIds.push(timeoutId);
              return;
            }
            
            // Add next character
            newTextNode.textContent += text[innerCharIndex++];
            
            // Scroll container
            element.scrollTop = element.scrollHeight;
            
            // Schedule next character
            const timeoutId = setTimeout(typeInnerChar, window.typewriterConfig.speed);
            timeoutIds.push(timeoutId);
          }
          
          // Start typing this text
          typeInnerChar();
        }
        else {
          // Handle nested elements (simplification: add immediately)
          newElement.appendChild(childNode.cloneNode(true));
          const timeoutId = setTimeout(processChildNode, 0);
          timeoutIds.push(timeoutId);
        }
      }
      
      // Start processing element's children
      processChildNode();
    }
    else {
      // Skip other node types
      const timeoutId = setTimeout(() => processNextNode(index + 1), 0);
      timeoutIds.push(timeoutId);
    }
  }
  
  // Start processing from the first node
  processNextNode(0);
  
  // Return a function that can force-complete the animation
  return function forceComplete() {
    if (window.typewriterConfig.isActive) {
      // Clear all pending timeouts
      timeoutIds.forEach(id => clearTimeout(id));
      
      // Set flag to inactive and complete the animation
      window.typewriterConfig.isActive = false;
      isComplete = true;
      
      // Immediately update element with complete content
      element.innerHTML = htmlContent;
      element.scrollTop = element.scrollHeight;
      
      // Call completion callback if provided
      if (onComplete) onComplete();
    }
  };
};