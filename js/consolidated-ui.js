// CONSOLIDATED UI SYSTEM
// This module consolidates functionality from ui.js and modernUI.js
// into a single, more organized structure with improved error handling

window.UI = {
  // UI state tracking
  state: {
    activePanel: null,
    previousNarrative: "",
    inTransition: false,
    narrativeLock: false, // Used to prevent narrative being overwritten during certain states
    
    // Keep track of UI element visibility
    visibleElements: {
      combatInterface: false,
      profile: false,
      inventory: false,
      questLog: false,
      missionInterface: false,
      npcDialog: false
    }
  },
  
  // Debug logging helper
  log: function(message, data) {
    console.log(`[UI] ${message}`, data || '');
  },
  
  // Error logging helper
  error: function(message, data) {
    console.error(`[UI] ERROR: ${message}`, data || '');
  },
  
  // Initialize the UI system
  init: function() {
    this.log("Initializing UI system...");
    
    try {
      // Convert existing panels to new format
      this.convertPanelsToModernFormat();
      
      // Create a panel overlay for modal panels
      this.createPanelOverlay();
      
      // Enhance the narrative container for improved scrolling
      this.enhanceNarrativeContainer();
      
      // Initialize responsive UI adjustments
      this.initResponsiveUI();
      
      // Add event listeners for panel closers
      this.addEventListeners();
      
      this.log("UI system initialized successfully");
    } catch (error) {
      this.error("Initialization failed:", error);
    }
  },
  
  // Add event listeners for UI elements
  addEventListeners: function() {
    // Find all panel close buttons and add listeners
    const closeButtons = document.querySelectorAll('.panel-close');
    closeButtons.forEach(btn => {
      const panelId = btn.getAttribute('data-panel');
      if (panelId) {
        btn.addEventListener('click', () => {
          this.closePanel(panelId);
        });
      }
    });
    
    // Find all elements with data-action attributes and bind actions
    document.addEventListener('click', (event) => {
      const actionElement = event.target.closest('[data-action]');
      if (actionElement) {
        const action = actionElement.getAttribute('data-action');
        
        // Handle the action through ActionSystem if available, fall back to handleAction
        if (window.ActionSystem && typeof window.ActionSystem.handleAction === 'function') {
          window.ActionSystem.handleAction(action);
        } else if (typeof window.handleAction === 'function') {
          window.handleAction(action);
        }
      }
    });
    
    // Add listener for scrolling in narrative container
    const narrative = document.getElementById('narrative');
    if (narrative) {
      narrative.addEventListener('scroll', () => {
        this.checkNarrativeScroll();
      });
    }
  },
  
  // Update status bars function with error handling
  updateStatusBars: function() {
    try {
      const healthBar = document.getElementById('healthBar');
      const healthValue = document.getElementById('healthValue');
      const staminaBar = document.getElementById('staminaBar');
      const staminaValue = document.getElementById('staminaValue');
      const moraleBar = document.getElementById('moraleBar');
      const moraleValue = document.getElementById('moraleValue');
      
      if (!healthBar || !healthValue || !staminaBar || !staminaValue || !moraleBar || !moraleValue) {
        this.error("Status bar elements not found");
        return;
      }
      
      // Get values and ensure they're numbers
      const health = Number(window.gameState.health);
      const maxHealth = Number(window.gameState.maxHealth);
      const stamina = Number(window.gameState.stamina);
      const maxStamina = Number(window.gameState.maxStamina);
      const morale = Number(window.gameState.morale);
      
      // Update health bar
      healthBar.style.width = `${(health / maxHealth) * 100}%`;
      healthValue.textContent = `${Math.round(health)}/${maxHealth}`;
      
      // Update stamina bar
      staminaBar.style.width = `${(stamina / maxStamina) * 100}%`;
      staminaValue.textContent = `${Math.round(stamina)}/${maxStamina}`;
      
      // Update morale bar
      moraleBar.style.width = `${morale}%`;
      moraleValue.textContent = `${Math.round(morale)}/100`;
    } catch (error) {
      this.error("Failed to update status bars:", error);
    }
  },
  
  // Function to update time and day display with error handling
  updateTimeAndDay: function(minutesToAdd) {
    try {
      if (typeof minutesToAdd !== 'number') {
        minutesToAdd = Number(minutesToAdd) || 0;
      }
      
      // Add time
      window.gameState.time += minutesToAdd;
      
      // Check for day change
      while (window.gameState.time >= 1440) { // 24 hours * 60 minutes
        window.gameState.time -= 1440;
        window.gameState.day++;
        
        // Reset daily flags
        window.gameState.dailyTrainingCount = 0;
        window.gameState.dailyPatrolDone = false;
        window.gameState.dailyScoutDone = false;
        
        // Update mission cooldowns if mission system exists
        if (window.missionSystem && typeof window.missionSystem.updateCooldowns === 'function') {
          window.missionSystem.updateCooldowns();
        }
      }
      
      // Format time for display
      const hours = Math.floor(window.gameState.time / 60);
      const minutes = window.gameState.time % 60;
      const ampm = hours < 12 ? 'AM' : 'PM';
      const displayHours = hours % 12 || 12; // Convert 0 to 12 for display
      
      const timeDisplay = document.getElementById('timeDisplay');
      const dayDisplay = document.getElementById('dayDisplay');
      const dayNightIndicator = document.getElementById('dayNightIndicator');
      
      if (timeDisplay) {
        timeDisplay.textContent = `Time: ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      }
      
      if (dayDisplay) {
        dayDisplay.textContent = `Day ${window.gameState.day}`;
      }
      
      // Update day/night indicator
      if (dayNightIndicator) {
        const timeOfDay = this.getTimeOfDay();
        dayNightIndicator.className = 'day-night-indicator time-' + timeOfDay;
      }
      
      // Update action buttons based on time
      this.updateActionButtons();
    } catch (error) {
      this.error("Failed to update time and day:", error);
    }
  },
  
  // Function to get time of day
  getTimeOfDay: function() {
    try {
      const hours = Math.floor(window.gameState.time / 60);
      
      if (hours >= 5 && hours < 8) return 'dawn';
      if (hours >= 8 && hours < 18) return 'day';
      if (hours >= 18 && hours < 21) return 'evening';
      return 'night';
    } catch (error) {
      this.error("Failed to get time of day:", error);
      return 'day'; // Default to day as a fallback
    }
  },
  
  // Function to update action buttons with error handling
  updateActionButtons: function() {
    try {
      // Get actions container
      const actionsContainer = document.getElementById('actions');
      if (!actionsContainer) {
        this.error("Actions container not found");
        return;
      }
      
      // Clear existing buttons to prevent duplicates
      actionsContainer.innerHTML = '';
      
      // Don't update during combat or when container is hidden
      if (window.gameState.inBattle || actionsContainer.style.display === 'none') {
        return;
      }
      
      // Get current time and location
      const timeOfDay = this.getTimeOfDay();
      const hours = Math.floor(window.gameState.time / 60);
      
      // Standard actions available in camp (not in mission)
      if (!window.gameState.inMission) {
        // Training available during the day
        if (timeOfDay === 'day' || timeOfDay === 'dawn') {
          this.addActionButton('Train', 'train', actionsContainer);
        }
        
        // Rest always available
        this.addActionButton('Rest', 'rest', actionsContainer);
        
        // Patrol available during day and evening
        if (timeOfDay === 'day' || timeOfDay === 'evening') {
          this.addActionButton('Patrol', 'patrol', actionsContainer);
        }
        
        // Mess hall available during meal times
        if ((hours >= 7 && hours <= 9) || (hours >= 12 && hours <= 14) || (hours >= 18 && hours <= 20)) {
          this.addActionButton('Mess Hall', 'mess', actionsContainer);
        }
        
        // Guard duty available all times
        this.addActionButton('Guard Duty', 'guard', actionsContainer);
        
        // Gambling and Brawler Pits availability logic
        if (timeOfDay === 'evening' || timeOfDay === 'night') {
          // Only show if player has discovered it or has the right background
          if (window.gameState.discoveredGamblingTent) {
            this.addActionButton('Gambling Tent', 'gambling', actionsContainer);
          }
          
          if (window.gameState.discoveredBrawlerPits) {
            this.addActionButton('Brawler Pits', 'brawler_pits', actionsContainer);
          }
        }
        
        // Add mission-related NPC interactions if mission system exists
        if (window.missionSystem && typeof window.missionSystem.canGetMissionsFrom === 'function') {
          if (window.missionSystem.canGetMissionsFrom('commander')) {
            this.addActionButton('Talk to Commander', 'talk_commander', actionsContainer);
          }
          
          if (window.missionSystem.canGetMissionsFrom('sergeant')) {
            this.addActionButton('Talk to Sergeant', 'talk_sergeant', actionsContainer);
          }
          
          if (window.missionSystem.canGetMissionsFrom('quartermaster')) {
            this.addActionButton('Talk to Quartermaster', 'talk_quartermaster', actionsContainer);
          }
        }
      }
      
      // Menu buttons - always available
      this.addActionButton('Profile', 'profile', actionsContainer);
      this.addActionButton('Inventory', 'inventory', actionsContainer);
      this.addActionButton('Quest Log', 'questLog', actionsContainer);
    } catch (error) {
      this.error("Failed to update action buttons:", error);
      
      // Emergency fallback - add at least some basic buttons
      try {
        const actionsContainer = document.getElementById('actions');
        if (actionsContainer && actionsContainer.childElementCount === 0) {
          this.log("Adding emergency fallback buttons");
          
          // Add basic buttons for emergency recovery
          this.addActionButton('Rest', 'rest', actionsContainer);
          this.addActionButton('Profile', 'profile', actionsContainer);
          this.addActionButton('Inventory', 'inventory', actionsContainer);
        }
      } catch (e) {
        this.error("Emergency button fallback failed:", e);
      }
    }
  },
  
  // Function to add action button with error handling and duplicate prevention
  addActionButton: function(label, action, container) {
    try {
      if (!container) {
        this.error("Container not provided when adding action button");
        return;
      }
      
      // Check if button with this action already exists
      const existingButton = container.querySelector(`[data-action="${action}"]`);
      if (existingButton) {
        return; // Prevent duplicates
      }
      
      const btn = document.createElement('button');
      btn.className = 'action-btn';
      btn.textContent = label;
      btn.setAttribute('data-action', action);
      
      container.appendChild(btn);
    } catch (error) {
      this.error(`Failed to add action button '${action}':`, error);
    }
  },
  
  // Function to set narrative text with improved handling
  setNarrative: function(text) {
    try {
      // Don't update narrative if it's locked
      if (this.state.narrativeLock) {
        this.log("Narrative is locked, not updating main narrative");
        return;
      }
      
      // Replace the narrative with new text
      const narrativeDiv = document.getElementById('narrative');
      if (!narrativeDiv) {
        this.error("Narrative element not found");
        return;
      }
      
      // Save previous narrative text
      this.state.previousNarrative = narrativeDiv.innerHTML;
      
      narrativeDiv.innerHTML = `<p>${text}</p>`;
      
      // Ensure scroll to top
      requestAnimationFrame(() => {
        narrativeDiv.scrollTop = 0;
      });
      
      // Check if scroll indicator should be shown
      this.checkNarrativeScroll();
    } catch (error) {
      this.error("Failed to set narrative:", error);
    }
  },
  
  // Function to add to narrative text with improved handling
  addToNarrative: function(text) {
    try {
      // Don't update narrative if it's locked
      if (this.state.narrativeLock) {
        this.log("Narrative is locked, not adding to narrative");
        return;
      }
      
      // Append to existing narrative
      const narrativeDiv = document.getElementById('narrative');
      if (!narrativeDiv) {
        this.error("Narrative element not found");
        return;
      }
      
      narrativeDiv.innerHTML += `<p>${text}</p>`;
      
      // Auto-scroll to bottom with requestAnimationFrame for better performance
      requestAnimationFrame(() => {
        narrativeDiv.scrollTop = narrativeDiv.scrollHeight;
      });
      
      // Check if scroll indicator should be shown
      this.checkNarrativeScroll();
    } catch (error) {
      this.error("Failed to add to narrative:", error);
    }
  },
  
  // Show notification function with improved handling
  showNotification: function(text, type = 'info') {
    try {
      const notification = document.getElementById('notification');
      if (!notification) {
        this.error("Notification element not found");
        return;
      }
      
      // Clear any existing notification timer
      if (notification._timer) {
        clearTimeout(notification._timer);
      }
      
      notification.textContent = text;
      notification.className = `notification ${type} show`;
      
      // Set timeout to hide notification
      notification._timer = setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    } catch (error) {
      this.error("Failed to show notification:", error);
    }
  },
  
  // Show achievement notification function with improved handling
  showAchievement: function(achievementId) {
    try {
      const achievement = window.achievements.find(a => a.id === achievementId);
      if (!achievement) {
        this.error(`Achievement '${achievementId}' not found`);
        return;
      }
      
      // Mark achievement as unlocked
      achievement.unlocked = true;
      
      // Check if there's an existing notification to avoid duplicates
      const existingNotification = document.querySelector('.achievement-notification');
      if (existingNotification) {
        document.body.removeChild(existingNotification);
      }
      
      // Create achievement notification
      const notificationElement = document.createElement('div');
      notificationElement.className = 'achievement-notification';
      
      notificationElement.innerHTML = `
        <div class="achievement-icon">${achievement.icon || '🏆'}</div>
        <div class="achievement-content">
          <div class="achievement-title">Achievement Unlocked</div>
          <div class="achievement-name">${achievement.title}</div>
          <div class="achievement-description">${achievement.description}</div>
        </div>
      `;
      
      document.body.appendChild(notificationElement);
      
      // Remove after animation completes
      setTimeout(() => {
        if (notificationElement.parentNode) {
          document.body.removeChild(notificationElement);
        }
      }, 5000);
    } catch (error) {
      this.error(`Failed to show achievement '${achievementId}':`, error);
    }
  },
  
  // Check if narrative scroll indicator should be shown
  checkNarrativeScroll: function() {
    try {
      const narrative = document.getElementById('narrative');
      const scrollIndicator = document.querySelector('.scroll-indicator');
      if (!narrative || !scrollIndicator) return;
      
      // Show indicator if content is scrollable and not at bottom
      const isScrollable = narrative.scrollHeight > narrative.clientHeight;
      const isNotAtBottom = narrative.scrollHeight - narrative.scrollTop - narrative.clientHeight > 50;
      
      if (isScrollable && isNotAtBottom) {
        scrollIndicator.style.display = 'block';
      } else {
        scrollIndicator.style.display = 'none';
      }
    } catch (error) {
      this.error("Failed to check narrative scroll:", error);
    }
  },
  
  // Panel Management
  openPanel: function(panelId) {
    try {
      this.closeActivePanel(); // Close any other open panel
      
      const panel = document.getElementById(panelId);
      if (!panel) {
        this.error(`Panel '${panelId}' not found`);
        return;
      }
      
      // Update UI state
      this.state.activePanel = panelId;
      this.state.visibleElements[panelId] = true;
      
      // Show the panel and overlay
      panel.classList.add('active');
      
      const overlay = document.getElementById('panelOverlay');
      if (overlay) {
        overlay.classList.add('active');
      }
      
      // Update content if needed (for dynamic panels)
      this.updatePanelContent(panelId);
    } catch (error) {
      this.error(`Failed to open panel '${panelId}':`, error);
    }
  },
  
  closePanel: function(panelId) {
    try {
      const panel = document.getElementById(panelId);
      if (!panel) {
        this.error(`Panel '${panelId}' not found`);
        return;
      }
      
      // Update UI state
      if (this.state.activePanel === panelId) {
        this.state.activePanel = null;
      }
      this.state.visibleElements[panelId] = false;
      
      // Hide the panel and overlay
      panel.classList.remove('active');
      
      const overlay = document.getElementById('panelOverlay');
      if (overlay) {
        overlay.classList.remove('active');
      }
    } catch (error) {
      this.error(`Failed to close panel '${panelId}':`, error);
    }
  },
  
  // Close the currently active panel
  closeActivePanel: function() {
    try {
      if (this.state.activePanel) {
        this.closePanel(this.state.activePanel);
      }
    } catch (error) {
      this.error("Failed to close active panel:", error);
    }
  },
  
  // Update panel content for dynamic panels
  updatePanelContent: function(panelId) {
    try {
      // Handle specific panel updates
      if (panelId === 'profile') {
        this.updateProfileContent();
      } else if (panelId === 'inventory') {
        this.updateInventoryContent();
      } else if (panelId === 'questLog') {
        this.updateQuestLogContent();
      }
    } catch (error) {
      this.error(`Failed to update panel '${panelId}' content:`, error);
    }
  },
  
  // Update profile panel content
  updateProfileContent: function() {
    try {
      const profileContent = document.querySelector('#profile .panel-content');
      if (!profileContent) {
        this.error("Profile content element not found");
        return;
      }
      
      // Calculate skill caps based on attributes
      const phy = Number(window.player.phy) || 0;
      const men = Number(window.player.men) || 0;
      
      const meleeCap = Math.floor(phy / 1.5);
      const marksmanshipCap = Math.floor((phy + men) / 3);
      const survivalCap = Math.floor((phy + men) / 3);
      const commandCap = Math.floor((men * 0.8 + phy * 0.2) / 1.5);
      const mentalSkillCap = Math.floor(men / 1.5);
      
      // Get skills object safely
      const skills = window.player.skills || {};
      
      profileContent.innerHTML = `
        <p><strong>Name:</strong> ${window.player.name || 'Unknown'}</p>
        <p><strong>Heritage:</strong> ${window.player.origin || 'Unknown'}</p>
        <p><strong>Career:</strong> ${window.player.career ? window.player.career.title : 'Unknown'}</p>
        <p><strong>Level:</strong> ${window.gameState.level || 1}</p>
        <p><strong>Experience:</strong> ${window.gameState.experience || 0}/${(window.gameState.level || 1) * 100}</p>
        <p><strong>Skill Points:</strong> ${window.gameState.skillPoints || 0}</p>
        <p><strong>Physical (PHY):</strong> ${phy.toFixed(2)} / 15</p>
        <p><strong>Mental (MEN):</strong> ${men.toFixed(2)} / 15</p>
        <p><strong>Skills:</strong> (Capped by attributes)</p>
        <ul>
          <li>Melee Combat: ${(skills.melee || 0).toFixed(2)} / ${meleeCap} (PHY based)</li>
          <li>Marksmanship: ${(skills.marksmanship || 0).toFixed(2)} / ${marksmanshipCap} (PHY+MEN based)</li>
          <li>Survival: ${(skills.survival || 0).toFixed(2)} / ${survivalCap} (PHY+MEN based)</li>
          <li>Command: ${(skills.command || 0).toFixed(2)} / ${commandCap} (MEN+some PHY based)</li>
          <li>Discipline: ${(skills.discipline || 0).toFixed(2)} / ${mentalSkillCap} (MEN based)</li>
          <li>Tactics: ${(skills.tactics || 0).toFixed(2)} / ${mentalSkillCap} (MEN based)</li>
          <li>Organization: ${(skills.organization || 0).toFixed(2)} / ${mentalSkillCap} (MEN based)</li>
          <li>Arcana: ${(skills.arcana || 0).toFixed(2)} / ${mentalSkillCap} (MEN based)</li>
        </ul>
      `;
      
      // Add relationships
      const relationships = window.player.relationships || {};
      profileContent.innerHTML += `<p><strong>Relationships:</strong></p><ul>`;
      
      if (Object.keys(relationships).length === 0) {
        profileContent.innerHTML += `<li>No established relationships yet.</li>`;
      } else {
        for (const id in relationships) {
          const relationship = relationships[id];
          let dispositionText = "Neutral";
          if (relationship.disposition >= 30) dispositionText = "Friendly";
          if (relationship.disposition >= 60) dispositionText = "Trusted Ally";
          if (relationship.disposition <= -30) dispositionText = "Distrustful";
          if (relationship.disposition <= -60) dispositionText = "Hostile";
          
          profileContent.innerHTML += `<li>${relationship.name}: ${dispositionText} (${relationship.disposition})</li>`;
        }
      }
      
      profileContent.innerHTML += `</ul>`;
    } catch (error) {
      this.error("Failed to update profile content:", error);
    }
  },
  
  // Update inventory panel content
  updateInventoryContent: function() {
    try {
      const inventoryContent = document.querySelector('#inventory .panel-content');
      if (!inventoryContent) {
        this.error("Inventory content element not found");
        return;
      }
      
      inventoryContent.innerHTML = `<div class="inventory-coins">${window.player.taelors || 0} Taelors</div>`;
      
      const inventory = window.player.inventory || [];
      
      if (inventory.length === 0) {
        inventoryContent.innerHTML += `<p>Your inventory is empty.</p>`;
      } else {
        inventory.forEach((item, index) => {
          inventoryContent.innerHTML += `
            <div class="inventory-item">
              <div>
                <div class="inventory-item-name">${item.name || 'Unknown Item'}</div>
                <div>${item.effect || 'No effect'}</div>
              </div>
              <div>${item.value || 0} taelors</div>
            </div>
          `;
        });
      }
    } catch (error) {
      this.error("Failed to update inventory content:", error);
    }
  },
  
  // Update quest log panel content
  updateQuestLogContent: function() {
    try {
      const questContent = document.querySelector('#questLog .panel-content');
      if (!questContent) {
        this.error("Quest log content element not found");
        return;
      }
      
      questContent.innerHTML = '';
      
      // Add main quest
      questContent.innerHTML += `
        <div class="quest-item">
          <div class="quest-title">Main Quest: The Campaign</div>
          <div>Progress: Stage ${window.gameState.mainQuest ? window.gameState.mainQuest.stage : 0}/5</div>
        </div>
      `;
      
      // Add side quests
      const sideQuests = window.gameState.sideQuests || [];
      if (sideQuests.length === 0) {
        questContent.innerHTML += `<p>No active side quests.</p>`;
      } else {
        sideQuests.forEach(quest => {
          questContent.innerHTML += `
            <div class="quest-item">
              <div class="quest-title">${quest.title || 'Unnamed Quest'}</div>
              <div>${quest.description || 'No description'}</div>
              <div>Objectives:</div>
              <ul>
          `;
          
          if (quest.objectives && quest.objectives.length > 0) {
            quest.objectives.forEach(objective => {
              const className = objective.completed ? 'quest-objective-complete' : '';
              questContent.innerHTML += `
                <li class="quest-objective ${className}">
                  ${objective.text || 'Unnamed objective'}: ${objective.count || 0}/${objective.target || 1}
                </li>
              `;
            });
          } else {
            questContent.innerHTML += `<li>No objectives set</li>`;
          }
          
          questContent.innerHTML += `</ul></div>`;
        });
      }
      
      // Add mission history if available
      if (window.missionSystem && window.missionSystem.missionHistory && window.missionSystem.missionHistory.length > 0) {
        questContent.innerHTML += `<h3>Mission History</h3>`;
        
        window.missionSystem.missionHistory.forEach((mission, index) => {
          questContent.innerHTML += `
            <div class="mission-log-entry">
              <div class="mission-log-title">${mission.title || 'Unnamed Mission'}</div>
              <div class="mission-log-status ${mission.success ? 'completed' : 'failed'}">
                ${mission.success ? 'Completed' : 'Failed'} on Day ${mission.completedOn || '?'}
              </div>
            </div>
          `;
        });
      }
    } catch (error) {
      this.error("Failed to update quest log content:", error);
    }
  },
  
  // Update profile if it's currently visible
  updateProfileIfVisible: function() {
    try {
      if (this.state.visibleElements.profile) {
        this.updateProfileContent();
      }
    } catch (error) {
      this.error("Failed to update visible profile:", error);
    }
  },
  
  // Modern UI setup functions
  createPanelOverlay: function() {
    try {
      // Check if overlay already exists
      if (document.getElementById('panelOverlay')) {
        return;
      }
      
      const overlay = document.createElement('div');
      overlay.className = 'panel-overlay';
      overlay.id = 'panelOverlay';
      document.body.appendChild(overlay);
      
      // Click on overlay to close active panel
      overlay.addEventListener('click', () => {
        this.closeActivePanel();
      });
    } catch (error) {
      this.error("Failed to create panel overlay:", error);
    }
  },
  
  convertPanelsToModernFormat: function() {
    try {
      // Convert profile panel
      this.convertToModernPanel('profile', 'Your Profile');
      
      // Convert inventory panel
      this.convertToModernPanel('inventory', 'Inventory');
      
      // Convert quest log panel
      this.convertToModernPanel('questLog', 'Quest Log');
    } catch (error) {
      this.error("Failed to convert panels to modern format:", error);
    }
  },
  
  convertToModernPanel: function(panelId, title) {
    try {
      const oldPanel = document.getElementById(panelId);
      if (!oldPanel) {
        this.error(`Panel '${panelId}' not found`);
        return;
      }
      
      // Only convert if not already in modern format
      if (oldPanel.classList.contains('game-panel')) {
        return;
      }
      
      // Save the original content
      const originalContent = oldPanel.innerHTML;
      
      // Update the panel structure
      oldPanel.className = 'game-panel';
      oldPanel.innerHTML = `
        <h3>${title}</h3>
        <button class="panel-close" data-panel="${panelId}">&times;</button>
        <div class="panel-content">${originalContent}</div>
      `;
      
      // Remove old close buttons
      const oldCloseButtons = oldPanel.querySelectorAll('.profile-close, .inventory-close, .quest-log-close');
      oldCloseButtons.forEach(btn => btn.remove());
      
      // Add event listener to the new close button
      const closeBtn = oldPanel.querySelector('.panel-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          this.closePanel(panelId);
        });
      }
    } catch (error) {
      this.error(`Failed to convert panel '${panelId}' to modern format:`, error);
    }
  },
  
  enhanceNarrativeContainer: function() {
    try {
      const narrative = document.getElementById('narrative');
      if (!narrative) {
        this.error("Narrative element not found");
        return;
      }
      
      // Check if it's already in a container
      if (narrative.parentNode.id === 'narrative-container') {
        return;
      }
      
      // Create a container for the narrative
      const parent = narrative.parentNode;
      const narrativeContainer = document.createElement('div');
      narrativeContainer.id = 'narrative-container';
      parent.insertBefore(narrativeContainer, narrative);
      narrativeContainer.appendChild(narrative);
      
      // Add scroll indicator
      const scrollIndicator = document.createElement('div');
      scrollIndicator.className = 'scroll-indicator';
      scrollIndicator.textContent = '↓ New content below ↓';
      scrollIndicator.style.display = 'none';
      scrollIndicator.onclick = function() {
        if (narrative) {
          narrative.scrollTop = narrative.scrollHeight;
          scrollIndicator.style.display = 'none';
        }
      };
      narrativeContainer.appendChild(scrollIndicator);
    } catch (error) {
      this.error("Failed to enhance narrative container:", error);
    }
  },
  
  initResponsiveUI: function() {
    try {
      // Adjust UI based on screen size
      const adjustUI = () => {
        const windowWidth = window.innerWidth;
        
        if (windowWidth < 768) {
          // Mobile/small screen adjustments
          document.body.classList.add('small-screen');
        } else {
          document.body.classList.remove('small-screen');
        }
      };
      
      // Initial adjustment
      adjustUI();
      
      // Listen for window resize
      window.addEventListener('resize', adjustUI);
    } catch (error) {
      this.error("Failed to initialize responsive UI:", error);
    }
  },
  
  // Combat UI Functions
  combat: {
    // Setup combat UI
    setup: function(enemy, environment) {
      try {
        // First clean up any previous combat UI
        this.cleanup();
        
        // Hide the regular game containers for fullscreen combat
        const elementsToHide = [
          { id: 'narrative-container' },
          { selector: '.status-bars' },
          { id: 'location' },
          { id: 'timeDisplay' },
          { id: 'dayDisplay' },
          { id: 'dayNightIndicator' },
          { id: 'actions' }
        ];
        
        elementsToHide.forEach(item => {
          const element = item.id 
            ? document.getElementById(item.id) 
            : document.querySelector(item.selector);
            
          if (element) {
            element.style.display = 'none';
          }
        });
        
        // Setup combat interface elements
        const enemyNameElement = document.getElementById('enemyName');
        const enemyHealthDisplay = document.getElementById('enemyHealthDisplay');
        const playerHealthDisplay = document.getElementById('playerHealthDisplay');
        const enemyCombatHealth = document.getElementById('enemyCombatHealth');
        const playerCombatHealth = document.getElementById('playerCombatHealth');
        const combatInterface = document.getElementById('combatInterface');
        const combatLog = document.getElementById('combatLog');
        
        if (!combatInterface) {
          window.UI.error("Combat interface element not found");
          return;
        }
        
        // Update enemy and player info with null checks
        if (enemyNameElement) enemyNameElement.textContent = enemy.name;
        if (enemyHealthDisplay) enemyHealthDisplay.textContent = `${enemy.health} HP`;
        if (playerHealthDisplay) playerHealthDisplay.textContent = `${Math.round(window.gameState.health)} HP`;
        
        // Update health bars
        if (enemyCombatHealth) enemyCombatHealth.style.width = '100%';
        if (playerCombatHealth) playerCombatHealth.style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
        
        // Show combat interface
        combatInterface.classList.remove('hidden');
        combatInterface.classList.add('combat-fullscreen');
        
        // Add combat indicators
        this.addDistanceIndicator();
        this.addStanceIndicator();
        this.addEnvironmentIndicator(environment);
        this.addMomentumIndicator();
        this.addStaminaIndicator();
        
        // Set combat log
        if (combatLog) {
          combatLog.innerHTML = `<p>You are engaged in combat with a ${enemy.name}. ${enemy.description || ''}</p>`;
          combatLog.innerHTML += `<p>Combat begins at ${this.getDistanceText(window.gameState.combatDistance)} range on ${environment.terrain} terrain in ${environment.weather} weather.</p>`;
          
          // Add initiative order if available
          const initiativeOrder = window.gameState.initiativeOrder;
          if (initiativeOrder && initiativeOrder.length > 0) {
            combatLog.innerHTML += `<p>Initiative order: ${initiativeOrder[0]} first, then ${initiativeOrder[1]}.</p>`;
          }
          
          // Ensure scroll to bottom
          combatLog.scrollTop = combatLog.scrollHeight;
        }
        
        // Update combat actions
        if (window.CombatSystem && typeof window.CombatSystem.updateCombatActions === 'function') {
          window.CombatSystem.updateCombatActions();
        }
      } catch (error) {
        window.UI.error("Failed to setup combat UI:", error);
      }
    },
    
    // Clean up the combat UI
    cleanup: function() {
      try {
        // Remove combat indicators
        const containersToRemove = [
          'distanceContainer',
          'stanceContainer',
          'environmentContainer',
          'momentumContainer',
          'staminaContainer'
        ];
        
        containersToRemove.forEach(id => {
          const container = document.getElementById(id);
          if (container) {
            container.remove();
          }
        });
        
        // Restore UI elements hidden during combat
        const elementsToRestore = [
          { id: 'narrative-container', style: 'block' },
          { selector: '.status-bars', style: 'flex' },
          { id: 'location', style: 'block' },
          { id: 'timeDisplay', style: 'block' },
          { id: 'dayDisplay', style: 'block' },
          { id: 'dayNightIndicator', style: 'block' },
          { id: 'actions', style: 'flex' }
        ];
        
        elementsToRestore.forEach(item => {
          const element = item.id 
            ? document.getElementById(item.id) 
            : document.querySelector(item.selector);
            
          if (element) {
            element.style.display = item.style;
          }
        });
        
        // Hide combat interface and remove fullscreen class
        const combatInterface = document.getElementById('combatInterface');
        if (combatInterface) {
          combatInterface.classList.add('hidden');
          combatInterface.classList.remove('combat-fullscreen');
        }
      } catch (error) {
        window.UI.error("Failed to cleanup combat UI:", error);
      }
    },
    
    // Add distance indicator to combat UI
    addDistanceIndicator: function() {
      try {
        // First, remove any existing distance container to prevent duplication
        const existingContainer = document.getElementById('distanceContainer');
        if (existingContainer) {
          existingContainer.remove();
        }
      
        const combatHeader = document.getElementById('combatHeader');
        if (!combatHeader) {
          window.UI.error("Combat header not found");
          return;
        }
        
        const distanceContainer = document.createElement('div');
        distanceContainer.id = 'distanceContainer';
        distanceContainer.style.width = '100%';
        distanceContainer.style.display = 'flex';
        distanceContainer.style.justifyContent = 'space-between';
        distanceContainer.style.alignItems = 'center';
        distanceContainer.style.margin = '10px 0';
        
        const distanceLabel = document.createElement('div');
        distanceLabel.textContent = 'Combat Distance:';
        distanceLabel.style.marginRight = '10px';
        
        const distanceIndicator = document.createElement('div');
        distanceIndicator.id = 'distanceIndicator';
        distanceIndicator.style.flex = '1';
        distanceIndicator.style.height = '20px';
        distanceIndicator.style.background = '#333';
        distanceIndicator.style.borderRadius = '4px';
        distanceIndicator.style.position = 'relative';
        
        // Add distance markers
        const markerLabels = ['Close', 'Medium', 'Far'];
        for (let i = 0; i < 3; i++) {
          const marker = document.createElement('div');
          marker.style.position = 'absolute';
          marker.style.top = '-20px';
          marker.style.left = `${i * 50}%`;
          marker.style.transform = 'translateX(-50%)';
          marker.style.fontSize = '0.8em';
          marker.textContent = markerLabels[i];
          distanceIndicator.appendChild(marker);
        }
        
        // Add position token
        const positionToken = document.createElement('div');
        positionToken.id = 'positionToken';
        positionToken.style.position = 'absolute';
        positionToken.style.width = '24px';
        positionToken.style.height = '24px';
        positionToken.style.borderRadius = '50%';
        positionToken.style.background = '#4b6bff';
        positionToken.style.top = '-2px';
        positionToken.style.left = `${(window.gameState.combatDistance / 2) * 100}%`; // Set based on current distance
        positionToken.style.transform = 'translateX(-50%)';
        positionToken.style.transition = 'left 0.5s ease';
        distanceIndicator.appendChild(positionToken);
        
        distanceContainer.appendChild(distanceLabel);
        distanceContainer.appendChild(distanceIndicator);
        
        // Insert after combat header
        combatHeader.parentNode.insertBefore(distanceContainer, combatHeader.nextSibling);
        
        // Update position token
        this.updateDistanceIndicator();
      } catch (error) {
        window.UI.error("Failed to add distance indicator:", error);
      }
    },
    
    // Add stance indicator to combat UI
    addStanceIndicator: function() {
      try {
        // First, remove any existing stance container to prevent duplication
        const existingContainer = document.getElementById('stanceContainer');
        if (existingContainer) {
          existingContainer.remove();
        }
        
        const distanceContainer = document.getElementById('distanceContainer');
        if (!distanceContainer) {
          window.UI.error("Distance container not found");
          return;
        }
        
        const stanceContainer = document.createElement('div');
        stanceContainer.id = 'stanceContainer';
        stanceContainer.style.width = '100%';
        stanceContainer.style.display = 'flex';
        stanceContainer.style.justifyContent = 'space-between';
        stanceContainer.style.alignItems = 'center';
        stanceContainer.style.margin = '10px 0';
        
        // Player stance
        const playerStanceDiv = document.createElement('div');
        playerStanceDiv.style.width = '45%';
        
        const playerStanceLabel = document.createElement('div');
        playerStanceLabel.textContent = 'Your Stance:';
        
        const playerStanceValue = document.createElement('div');
        playerStanceValue.id = 'playerStanceValue';
        playerStanceValue.style.fontWeight = 'bold';
        playerStanceValue.style.color = '#4b6bff';
        playerStanceValue.textContent = this.capitalizeFirstLetter(window.gameState.combatStance);
        
        playerStanceDiv.appendChild(playerStanceLabel);
        playerStanceDiv.appendChild(playerStanceValue);
        
        // Enemy stance
        const enemyStanceDiv = document.createElement('div');
        enemyStanceDiv.style.width = '45%';
        enemyStanceDiv.style.textAlign = 'right';
        
        const enemyStanceLabel = document.createElement('div');
        enemyStanceLabel.textContent = 'Enemy Stance:';
        
        const enemyStanceValue = document.createElement('div');
        enemyStanceValue.id = 'enemyStanceValue';
        enemyStanceValue.style.fontWeight = 'bold';
        enemyStanceValue.style.color = '#ff4b4b';
        enemyStanceValue.textContent = this.capitalizeFirstLetter(window.gameState.enemyStance);
        
        enemyStanceDiv.appendChild(enemyStanceLabel);
        enemyStanceDiv.appendChild(enemyStanceValue);
        
        stanceContainer.appendChild(playerStanceDiv);
        stanceContainer.appendChild(enemyStanceDiv);
        
        // Insert after distance container
        distanceContainer.parentNode.insertBefore(stanceContainer, distanceContainer.nextSibling);
        
        // Update stance indicators
        this.updateStanceIndicator();
      } catch (error) {
        window.UI.error("Failed to add stance indicator:", error);
      }
    },
    
    // Add environment indicator to UI
    addEnvironmentIndicator: function(environment) {
      try {
        if (!environment) {
          environment = { terrain: 'normal', weather: 'clear' };
        }
        
        // First, remove any existing environment container to prevent duplication
        const existingContainer = document.getElementById('environmentContainer');
        if (existingContainer) {
          existingContainer.remove();
        }
        
        // Find a container to insert after
        const stanceContainer = document.getElementById('stanceContainer');
        const combatHeader = document.getElementById('combatHeader');
        
        if (!stanceContainer && !combatHeader) {
          window.UI.error("Neither stance container nor combat header found");
          return;
        }
        
        const environmentContainer = document.createElement('div');
        environmentContainer.id = 'environmentContainer';
        environmentContainer.style.width = '100%';
        environmentContainer.style.display = 'flex';
        environmentContainer.style.justifyContent = 'space-between';
        environmentContainer.style.alignItems = 'center';
        environmentContainer.style.margin = '10px 0';
        
        // Terrain indicator
        const terrainDiv = document.createElement('div');
        terrainDiv.style.width = '45%';
        
        const terrainLabel = document.createElement('div');
        terrainLabel.textContent = 'Terrain:';
        
        const terrainValue = document.createElement('div');
        terrainValue.id = 'terrainValue';
        terrainValue.style.fontWeight = 'bold';
        terrainValue.textContent = this.capitalizeFirstLetter(environment.terrain);
        
        terrainDiv.appendChild(terrainLabel);
        terrainDiv.appendChild(terrainValue);
        
        // Weather indicator
        const weatherDiv = document.createElement('div');
        weatherDiv.style.width = '45%';
        weatherDiv.style.textAlign = 'right';
        
        const weatherLabel = document.createElement('div');
        weatherLabel.textContent = 'Weather:';
        
        const weatherValue = document.createElement('div');
        weatherValue.id = 'weatherValue';
        weatherValue.style.fontWeight = 'bold';
        weatherValue.textContent = this.capitalizeFirstLetter(environment.weather);
        
        weatherDiv.appendChild(weatherLabel);
        weatherDiv.appendChild(weatherValue);
        
        environmentContainer.appendChild(terrainDiv);
        environmentContainer.appendChild(weatherDiv);
        
        // Insert after stance container if it exists, otherwise after combat header
        if (stanceContainer) {
          stanceContainer.parentNode.insertBefore(environmentContainer, stanceContainer.nextSibling);
        } else if (combatHeader) {
          combatHeader.parentNode.insertBefore(environmentContainer, combatHeader.nextSibling);
        }
      } catch (error) {
        window.UI.error("Failed to add environment indicator:", error);
      }
    },
    
    // Add momentum indicator
    addMomentumIndicator: function() {
      try {
        // First, remove any existing momentum container to prevent duplication
        const existingContainer = document.getElementById('momentumContainer');
        if (existingContainer) {
          existingContainer.remove();
        }
        
        // Find container to insert after
        const environmentContainer = document.getElementById('environmentContainer');
        const stanceContainer = document.getElementById('stanceContainer');
        const combatHeader = document.getElementById('combatHeader');
        
        const targetContainer = environmentContainer || stanceContainer || combatHeader;
        
        if (!targetContainer) {
          window.UI.error("No suitable container found for momentum indicator");
          return;
        }
        
        const momentumContainer = document.createElement('div');
        momentumContainer.id = 'momentumContainer';
        momentumContainer.style.width = '100%';
        momentumContainer.style.display = 'flex';
        momentumContainer.style.justifyContent = 'space-between';
        momentumContainer.style.alignItems = 'center';
        momentumContainer.style.margin = '10px 0';
        
        // Player momentum
        const playerMomentumDiv = document.createElement('div');
        playerMomentumDiv.style.width = '45%';
        
        const playerMomentumLabel = document.createElement('div');
        playerMomentumLabel.textContent = 'Your Momentum:';
        
        const playerMomentumValue = document.createElement('div');
        playerMomentumValue.id = 'playerMomentumValue';
        playerMomentumValue.style.fontWeight = 'bold';
        playerMomentumValue.textContent = window.gameState.playerMomentum || 0;
        
        playerMomentumDiv.appendChild(playerMomentumLabel);
        playerMomentumDiv.appendChild(playerMomentumValue);
        
        // Enemy momentum
        const enemyMomentumDiv = document.createElement('div');
        enemyMomentumDiv.style.width = '45%';
        enemyMomentumDiv.style.textAlign = 'right';
        
        const enemyMomentumLabel = document.createElement('div');
        enemyMomentumLabel.textContent = 'Enemy Momentum:';
        
        const enemyMomentumValue = document.createElement('div');
        enemyMomentumValue.id = 'enemyMomentumValue';
        enemyMomentumValue.style.fontWeight = 'bold';
        enemyMomentumValue.textContent = window.gameState.enemyMomentum || 0;
        
        enemyMomentumDiv.appendChild(enemyMomentumLabel);
        enemyMomentumDiv.appendChild(enemyMomentumValue);
        
        momentumContainer.appendChild(playerMomentumDiv);
        momentumContainer.appendChild(enemyMomentumDiv);
        
        // Insert after target container
        targetContainer.parentNode.insertBefore(momentumContainer, targetContainer.nextSibling);
        
        // Update momentum values
        this.updateMomentumIndicator();
      } catch (error) {
        window.UI.error("Failed to add momentum indicator:", error);
      }
    },
    
    // Add stamina indicator to combat UI
    addStaminaIndicator: function() {
      try {
        // Check if it already exists
        if (document.getElementById('staminaContainer')) {
          return;
        }
        
        // Find a container to insert after
        const momentumContainer = document.getElementById('momentumContainer');
        const environmentContainer = document.getElementById('environmentContainer');
        const stanceContainer = document.getElementById('stanceContainer');
        
        const targetContainer = momentumContainer || environmentContainer || stanceContainer;
        
        if (!targetContainer) {
          window.UI.error("No suitable container found for stamina indicator");
          return;
        }
        
        const staminaContainer = document.createElement('div');
        staminaContainer.id = 'staminaContainer';
        staminaContainer.style.width = '100%';
        staminaContainer.style.display = 'flex';
        staminaContainer.style.justifyContent = 'space-between';
        staminaContainer.style.alignItems = 'center';
        staminaContainer.style.margin = '10px 0';
        staminaContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        staminaContainer.style.borderRadius = '8px';
        staminaContainer.style.padding = '10px';
        staminaContainer.style.border = '1px solid rgba(75, 255, 145, 0.3)';
        
        // Player stamina
        const playerStaminaDiv = document.createElement('div');
        playerStaminaDiv.style.width = '45%';
        
        const playerStaminaLabel = document.createElement('div');
        playerStaminaLabel.textContent = 'Stamina:';
        
        const playerStaminaValue = document.createElement('div');
        playerStaminaValue.id = 'playerCombatStaminaValue';
        playerStaminaValue.style.fontWeight = 'bold';
        playerStaminaValue.style.color = '#4bff91'; // Green color
        playerStaminaValue.textContent = Math.round(window.gameState.stamina);
        
        playerStaminaDiv.appendChild(playerStaminaLabel);
        playerStaminaDiv.appendChild(playerStaminaValue);
        
        // Stamina regen indicator
        const staminaRegenDiv = document.createElement('div');
        staminaRegenDiv.style.width = '45%';
        staminaRegenDiv.style.textAlign = 'right';
        
        const staminaRegenLabel = document.createElement('div');
        staminaRegenLabel.textContent = 'Regen Per Turn:';
        
        const staminaRegenValue = document.createElement('div');
        staminaRegenValue.id = 'staminaRegenValue';
        staminaRegenValue.style.fontWeight = 'bold';
        staminaRegenValue.textContent = '+3';
        
        staminaRegenDiv.appendChild(staminaRegenLabel);
        staminaRegenDiv.appendChild(staminaRegenValue);
        
        staminaContainer.appendChild(playerStaminaDiv);
        staminaContainer.appendChild(staminaRegenDiv);
        
        // Insert after momentum container
        targetContainer.parentNode.insertBefore(staminaContainer, targetContainer.nextSibling);
        
        // Update stamina display
        this.updateStaminaDisplay();
      } catch (error) {
        window.UI.error("Failed to add stamina indicator:", error);
      }
    },
    
    // Update stamina display in combat
    updateStaminaDisplay: function() {
      try {
        const playerStaminaValue = document.getElementById('playerCombatStaminaValue');
        if (playerStaminaValue) {
          const stamina = Math.round(window.gameState.stamina);
          playerStaminaValue.textContent = stamina;
          
          // Change color based on stamina level
          if (stamina < 10) {
            playerStaminaValue.style.color = '#ff4b4b'; // Red when low
            playerStaminaValue.className = 'stamina-low';
          } else if (stamina < 20) {
            playerStaminaValue.style.color = '#ffb74b'; // Orange when medium
            playerStaminaValue.className = 'stamina-medium';
          } else {
            playerStaminaValue.style.color = '#4bff91'; // Green when high
            playerStaminaValue.className = 'stamina-high';
          }
        }
      } catch (error) {
        window.UI.error("Failed to update stamina display:", error);
      }
    },
    
    // Update distance indicator
    updateDistanceIndicator: function() {
      try {
        const positionToken = document.getElementById('positionToken');
        if (positionToken) {
          // Calculate position percentage based on distance
          // 0 = close = 0%, 1 = medium = 50%, 2 = far = 100%
          const percentage = (window.gameState.combatDistance / 2) * 100;
          positionToken.style.left = `${percentage}%`;
        }
      } catch (error) {
        window.UI.error("Failed to update distance indicator:", error);
      }
    },
    
    // Update stance indicator
    updateStanceIndicator: function() {
      try {
        const playerStanceValue = document.getElementById('playerStanceValue');
        const enemyStanceValue = document.getElementById('enemyStanceValue');
        
        if (playerStanceValue) {
          playerStanceValue.textContent = this.capitalizeFirstLetter(window.gameState.combatStance);
          
          // Update colors based on stance
          if (window.gameState.combatStance === 'aggressive') {
            playerStanceValue.style.color = '#ff4b4b'; // Red
          } else if (window.gameState.combatStance === 'defensive') {
            playerStanceValue.style.color = '#4bbfff'; // Blue
          } else if (window.gameState.combatStance === 'evasive') {
            playerStanceValue.style.color = '#4bff91'; // Green
          } else {
            playerStanceValue.style.color = '#4b6bff'; // Default
          }
        }
        
        if (enemyStanceValue) {
          enemyStanceValue.textContent = this.capitalizeFirstLetter(window.gameState.enemyStance);
          
          // Update colors based on stance
          if (window.gameState.enemyStance === 'aggressive') {
            enemyStanceValue.style.color = '#ff4b4b'; // Red
          } else if (window.gameState.enemyStance === 'defensive') {
            enemyStanceValue.style.color = '#4bbfff'; // Blue
          } else if (window.gameState.enemyStance === 'evasive') {
            enemyStanceValue.style.color = '#4bff91'; // Green
          } else {
            enemyStanceValue.style.color = '#ff4b4b'; // Default
          }
        }
      } catch (error) {
        window.UI.error("Failed to update stance indicator:", error);
      }
    },
    
    // Update the momentum indicator
    updateMomentumIndicator: function() {
      try {
        const playerMomentumValue = document.getElementById('playerMomentumValue');
        const enemyMomentumValue = document.getElementById('enemyMomentumValue');
        
        if (playerMomentumValue && enemyMomentumValue) {
          playerMomentumValue.textContent = window.gameState.playerMomentum || 0;
          enemyMomentumValue.textContent = window.gameState.enemyMomentum || 0;
          
          // Update colors based on momentum value
          if (window.gameState.playerMomentum > 0) {
            playerMomentumValue.style.color = '#4bff91'; // Green for positive momentum
          } else if (window.gameState.playerMomentum < 0) {
            playerMomentumValue.style.color = '#ff4b4b'; // Red for negative momentum
          } else {
            playerMomentumValue.style.color = '#e0e0e0'; // Default for neutral
          }
          
          if (window.gameState.enemyMomentum > 0) {
            enemyMomentumValue.style.color = '#ff4b4b'; // Red for enemy's positive momentum (bad for player)
          } else if (window.gameState.enemyMomentum < 0) {
            enemyMomentumValue.style.color = '#4bff91'; // Green for enemy's negative momentum (good for player)
          } else {
            enemyMomentumValue.style.color = '#e0e0e0'; // Default for neutral
          }
        }
      } catch (error) {
        window.UI.error("Failed to update momentum indicator:", error);
      }
    },
    
    // Add combat button to UI
    addCombatButton: function(action, label, container) {
      try {
        if (!container) {
          window.UI.error("Container not provided when adding combat button");
          return;
        }
        
        // Check stamina requirements
        let disabled = false;
        const staminaCost = (window.gameState.staminaPerAction && window.gameState.staminaPerAction[action]) || 0;
        const currentStamina = window.gameState.stamina || 0;
        
        if (staminaCost > currentStamina) {
          disabled = true;
        }
        
        const btn = document.createElement('button');
        btn.className = 'action-btn' + (disabled ? ' stamina-disabled' : '');
        btn.textContent = label;
        
        // Add stamina cost indicator if applicable
        if (staminaCost > 0) {
          const staminaSpan = document.createElement('span');
          staminaSpan.className = 'stamina-cost';
          staminaSpan.textContent = `-${staminaCost}`;
          btn.appendChild(staminaSpan);
        }
        
        btn.setAttribute('data-action', action);
        
        if (!disabled) {
          btn.onclick = function() {
            if (window.CombatSystem && typeof window.CombatSystem.handleCombatAction === 'function') {
              window.CombatSystem.handleCombatAction(action);
            }
          };
        } else {
          btn.title = `Not enough stamina (Requires ${staminaCost})`;
        }
        
        container.appendChild(btn);
      } catch (error) {
        window.UI.error(`Failed to add combat button '${action}':`, error);
      }
    },
    
    // Get text description of distance
    getDistanceText: function(distance) {
      switch(distance) {
        case 0: return "close";
        case 1: return "medium";
        case 2: return "far";
        default: return "unknown";
      }
    },
    
    // Helper function to capitalize first letter
    capitalizeFirstLetter: function(string) {
      if (!string) return "";
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
  },
  
  // Emergency recovery functions
  emergencyRecovery: function() {
    this.log("Performing emergency UI recovery");
    
    try {
      // Ensure narrative container is visible
      const narrativeContainer = document.getElementById('narrative-container');
      if (narrativeContainer) narrativeContainer.style.display = 'block';
      
      // Ensure status bars are visible
      const statusBars = document.querySelector('.status-bars');
      if (statusBars) statusBars.style.display = 'flex';
      
      // Ensure action buttons are visible
      const actions = document.getElementById('actions');
      if (actions) {
        actions.style.display = 'flex';
        
        // Regenerate action buttons
        this.updateActionButtons();
      }
      
      // Hide combat interface
      const combatInterface = document.getElementById('combatInterface');
      if (combatInterface) {
        combatInterface.classList.add('hidden');
        combatInterface.classList.remove('combat-fullscreen');
      }
      
      // Close any open panels
      this.closeActivePanel();
      
      // Unlock narrative if it was locked
      this.state.narrativeLock = false;
      
      // Show notification
      this.showNotification("UI has been recovered", "info");
      
      return true;
    } catch (error) {
      this.error("Failed during emergency UI recovery:", error);
      return false;
    }
  },
  
  // Add emergency recovery button
  addEmergencyRecoveryButton: function() {
    this.log("Adding emergency recovery button");
    
    try {
      // Check if already exists
      if (document.getElementById('emergency-recovery-btn')) {
        return;
      }
      
      // Create button
      const button = document.createElement('button');
      button.id = 'emergency-recovery-btn';
      button.textContent = '🛟 Emergency Recovery';
      button.style.position = 'fixed';
      button.style.bottom = '10px';
      button.style.right = '10px';
      button.style.zIndex = '9999';
      button.style.backgroundColor = '#ff4b4b';
      button.style.color = 'white';
      button.style.padding = '10px';
      button.style.border = 'none';
      button.style.borderRadius = '5px';
      
      // Add click handler
      button.onclick = () => {
        this.emergencyRecovery();
        
        // Reset game state if available
        if (window.GameState && typeof window.GameState.emergencyRecovery === 'function') {
          window.GameState.emergencyRecovery();
        }
        
        // Reset mission-combat integration if available
        if (window.CombatMissionIntegration && typeof window.CombatMissionIntegration.emergencyRecovery === 'function') {
          window.CombatMissionIntegration.emergencyRecovery();
        }
        
        // Remove button after use
        if (button.parentNode) {
          button.parentNode.removeChild(button);
        }
      };
      
      document.body.appendChild(button);
    } catch (error) {
      this.error("Failed to add emergency recovery button:", error);
    }
  },
  
  // NPC Dialog UI functions
  dialog: {
    // Show NPC dialog
    show: function(npc, options) {
      try {
        // Create dialog container if doesn't exist
        let dialogContainer = document.getElementById('npcDialog');
        if (!dialogContainer) {
          dialogContainer = document.createElement('div');
          dialogContainer.id = 'npcDialog';
          dialogContainer.className = 'npc-dialog';
          document.body.appendChild(dialogContainer);
        }
        
        // Update UI state
        window.UI.state.visibleElements.npcDialog = true;
        window.UI.state.narrativeLock = true; // Lock narrative while dialog is open
        
        // Clear existing dialog content
        dialogContainer.innerHTML = '';
        
        // Create dialog header
        const header = document.createElement('div');
        header.className = 'npc-dialog-header';
        
        // Add NPC name
        const nameEl = document.createElement('h3');
        nameEl.textContent = npc.name || 'NPC';
        header.appendChild(nameEl);
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'npc-dialog-close';
        closeBtn.textContent = '×';
        closeBtn.onclick = () => this.close();
        header.appendChild(closeBtn);
        
        dialogContainer.appendChild(header);
        
        // Add NPC portrait if available
        if (npc.portrait) {
          const portrait = document.createElement('div');
          portrait.className = 'npc-portrait';
          portrait.style.backgroundImage = `url(${npc.portrait})`;
          dialogContainer.appendChild(portrait);
        }
        
        // Add dialog content
        const content = document.createElement('div');
        content.className = 'npc-dialog-content';
        
        if (npc.greeting) {
          const greeting = document.createElement('p');
          greeting.textContent = npc.greeting;
          content.appendChild(greeting);
        }
        
        dialogContainer.appendChild(content);
        
        // Add dialog options
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'npc-dialog-options';
        
        if (options && options.length > 0) {
          options.forEach((option, index) => {
            const optionBtn = document.createElement('button');
            optionBtn.className = 'dialog-option-btn';
            optionBtn.textContent = option.text;
            
            if (option.callback && typeof option.callback === 'function') {
              optionBtn.onclick = () => {
                const response = option.callback();
                this.updateDialog(response);
              };
            }
            
            optionsContainer.appendChild(optionBtn);
          });
        } else {
          // Default "Goodbye" option if no options provided
          const goodbyeBtn = document.createElement('button');
          goodbyeBtn.className = 'dialog-option-btn';
          goodbyeBtn.textContent = 'Goodbye';
          goodbyeBtn.onclick = () => this.close();
          optionsContainer.appendChild(goodbyeBtn);
        }
        
        dialogContainer.appendChild(optionsContainer);
        
        // Show dialog
        dialogContainer.classList.add('active');
        
        // Add overlay if doesn't exist
        let overlay = document.getElementById('dialogOverlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'dialogOverlay';
          overlay.className = 'dialog-overlay';
          document.body.appendChild(overlay);
          
          // Close dialog when clicking outside
          overlay.onclick = () => this.close();
        }
        
        overlay.classList.add('active');
      } catch (error) {
        window.UI.error("Failed to show NPC dialog:", error);
        
        // Ensure narrative is unlocked in case of error
        window.UI.state.narrativeLock = false;
      }
    },
    
    // Update dialog with response text and new options
    updateDialog: function(response) {
      try {
        const dialogContent = document.querySelector('.npc-dialog-content');
        const optionsContainer = document.querySelector('.npc-dialog-options');
        
        if (!dialogContent || !optionsContainer) {
          window.UI.error("Dialog elements not found");
          return;
        }
        
        // Add response text
        if (response.text) {
          const responsePara = document.createElement('p');
          responsePara.className = 'npc-response';
          responsePara.textContent = response.text;
          dialogContent.appendChild(responsePara);
          
          // Scroll to bottom of content
          dialogContent.scrollTop = dialogContent.scrollHeight;
        }
        
        // Update options if provided
        if (response.options && response.options.length > 0) {
          // Clear existing options
          optionsContainer.innerHTML = '';
          
          // Add new options
          response.options.forEach(option => {
            const optionBtn = document.createElement('button');
            optionBtn.className = 'dialog-option-btn';
            optionBtn.textContent = option.text;
            
            if (option.callback && typeof option.callback === 'function') {
              optionBtn.onclick = () => {
                const nextResponse = option.callback();
                this.updateDialog(nextResponse);
              };
            }
            
            optionsContainer.appendChild(optionBtn);
          });
        } else if (response.close) {
          // Auto-close dialog after timeout if specified
          setTimeout(() => this.close(), 2000);
        }
      } catch (error) {
        window.UI.error("Failed to update dialog:", error);
      }
    },
    
    // Close dialog
    close: function() {
      try {
        const dialogContainer = document.getElementById('npcDialog');
        const overlay = document.getElementById('dialogOverlay');
        
        if (dialogContainer) {
          dialogContainer.classList.remove('active');
        }
        
        if (overlay) {
          overlay.classList.remove('active');
        }
        
        // Update UI state
        window.UI.state.visibleElements.npcDialog = false;
        window.UI.state.narrativeLock = false; // Unlock narrative when dialog closes
        
        // Refresh action buttons in case dialog changed game state
        window.UI.updateActionButtons();
      } catch (error) {
        window.UI.error("Failed to close dialog:", error);
        
        // Ensure narrative is unlocked in case of error
        window.UI.state.narrativeLock = false;
      }
    }
  },
  
  // Mission interface functions
  mission: {
    // Show mission interface
    show: function(mission) {
      try {
        // Create mission interface container if doesn't exist
        let missionContainer = document.getElementById('missionInterface');
        if (!missionContainer) {
          missionContainer = document.createElement('div');
          missionContainer.id = 'missionInterface';
          missionContainer.className = 'mission-interface';
          document.body.appendChild(missionContainer);
        }
        
        // Update UI state
        window.UI.state.visibleElements.missionInterface = true;
        
        // Clear existing content
        missionContainer.innerHTML = '';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'mission-header';
        
        // Add mission title
        const title = document.createElement('h3');
        title.textContent = mission.title || 'Mission';
        header.appendChild(title);
        
        // Add mission stage counter
        const stageCounter = document.createElement('div');
        stageCounter.className = 'mission-stage-counter';
        stageCounter.textContent = `Stage: ${window.gameState.missionStage + 1}/${mission.stages.length}`;
        header.appendChild(stageCounter);
        
        missionContainer.appendChild(header);
        
        // Create mission description
        const description = document.createElement('div');
        description.className = 'mission-description';
        description.textContent = mission.description || '';
        missionContainer.appendChild(description);
        
        // Current stage objectives
        const currentStage = mission.stages[window.gameState.missionStage];
        if (currentStage) {
          const objectives = document.createElement('div');
          objectives.className = 'mission-objectives';
          
          const objectivesTitle = document.createElement('h4');
          objectivesTitle.textContent = 'Current Objectives:';
          objectives.appendChild(objectivesTitle);
          
          const objectivesList = document.createElement('ul');
          
          if (currentStage.objectives && currentStage.objectives.length > 0) {
            currentStage.objectives.forEach(objective => {
              const objectiveItem = document.createElement('li');
              objectiveItem.textContent = objective.text;
              
              if (objective.completed) {
                objectiveItem.className = 'completed';
                objectiveItem.textContent += ' ✓';
              }
              
              objectivesList.appendChild(objectiveItem);
            });
          } else {
            const defaultObjective = document.createElement('li');
            defaultObjective.textContent = 'Complete the current mission stage';
            objectivesList.appendChild(defaultObjective);
          }
          
          objectives.appendChild(objectivesList);
          missionContainer.appendChild(objectives);
        }
        
        // Add mission actions container
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'mission-actions';
        actionsContainer.id = 'missionActions';
        missionContainer.appendChild(actionsContainer);
        
        // Add button to leave mission if not in combat
        if (!window.gameState.inBattle && !window.gameState.inMissionCombat) {
          const abandonButton = document.createElement('button');
          abandonButton.className = 'mission-btn abandon-mission';
          abandonButton.textContent = 'Abandon Mission';
          abandonButton.onclick = () => this.abandonMission();
          actionsContainer.appendChild(abandonButton);
        }
        
        // Show the interface
        missionContainer.classList.add('active');
      } catch (error) {
        window.UI.error("Failed to show mission interface:", error);
      }
    },
    
    // Hide mission interface
    hide: function() {
      try {
        const missionContainer = document.getElementById('missionInterface');
        if (missionContainer) {
          missionContainer.classList.remove('active');
        }
        
        // Update UI state
        window.UI.state.visibleElements.missionInterface = false;
      } catch (error) {
        window.UI.error("Failed to hide mission interface:", error);
      }
    },
    
    // Add a mission action button
    addActionButton: function(text, callback) {
      try {
        const actionsContainer = document.getElementById('missionActions');
        if (!actionsContainer) {
          window.UI.error("Mission actions container not found");
          return;
        }
        
        const button = document.createElement('button');
        button.className = 'mission-btn';
        button.textContent = text;
        
        if (callback && typeof callback === 'function') {
          button.onclick = callback;
        }
        
        actionsContainer.appendChild(button);
      } catch (error) {
        window.UI.error("Failed to add mission action button:", error);
      }
    },
    
    // Update mission progress
    updateProgress: function(stage) {
      try {
        const stageCounter = document.querySelector('.mission-stage-counter');
        if (stageCounter) {
          const mission = window.gameState.currentMission;
          const totalStages = mission && mission.stages ? mission.stages.length : 0;
          stageCounter.textContent = `Stage: ${stage + 1}/${totalStages}`;
        }
        
        // Refresh mission interface with new stage
        if (window.gameState.currentMission) {
          this.show(window.gameState.currentMission);
        }
      } catch (error) {
        window.UI.error("Failed to update mission progress:", error);
      }
    },
    
    // Abandon current mission
    abandonMission: function() {
      try {
        // Confirm with user
        if (confirm("Are you sure you want to abandon this mission? You may lose any progress.")) {
          // Hide mission interface
          this.hide();
          
          // Reset mission flags
          window.gameState.inMission = false;
          window.gameState.currentMission = null;
          window.gameState.missionStage = 0;
          window.gameState.inMissionCombat = false;
          
          // Update UI
          window.UI.updateActionButtons();
          
          // Show notification
          window.UI.showNotification("You've abandoned the mission and returned to camp.", "info");
          
          // Update narrative
          window.UI.setNarrative("You've abandoned your mission and returned to camp. The commander might not be pleased, but sometimes discretion is the better part of valor.");
        }
      } catch (error) {
        window.UI.error("Failed to abandon mission:", error);
      }
    }
  }
};

// Initialize UI system when document is ready
document.addEventListener('DOMContentLoaded', function() {
  window.UI.init();
});

// Add backward compatibility layer for older code
// These functions ensure that older code calling the global functions still works
window.updateStatusBars = function() {
  if (window.UI && typeof window.UI.updateStatusBars === 'function') {
    window.UI.updateStatusBars();
  } else {
    console.warn("UI system not initialized, can't update status bars");
  }
};

window.setNarrative = function(text) {
  if (window.UI && typeof window.UI.setNarrative === 'function') {
    window.UI.setNarrative(text);
  } else {
    console.warn("UI system not initialized, can't set narrative");
    
    // Fallback direct approach
    const narrativeDiv = document.getElementById('narrative');
    if (narrativeDiv) {
      narrativeDiv.innerHTML = `<p>${text}</p>`;
    }
  }
};

window.addToNarrative = function(text) {
  if (window.UI && typeof window.UI.addToNarrative === 'function') {
    window.UI.addToNarrative(text);
  } else {
    console.warn("UI system not initialized, can't add to narrative");
    
    // Fallback direct approach
    const narrativeDiv = document.getElementById('narrative');
    if (narrativeDiv) {
      narrativeDiv.innerHTML += `<p>${text}</p>`;
    }
  }
};

window.showNotification = function(text, type) {
  if (window.UI && typeof window.UI.showNotification === 'function') {
    window.UI.showNotification(text, type);
  } else {
    console.warn("UI system not initialized, can't show notification");
    
    // Fallback alert for critical messages
    if (type === 'error') {
      alert(text);
    }
  }
};

window.showAchievement = function(achievementId) {
  if (window.UI && typeof window.UI.showAchievement === 'function') {
    window.UI.showAchievement(achievementId);
  } else {
    console.warn("UI system not initialized, can't show achievement");
  }
};

window.updateActionButtons = function() {
  if (window.UI && typeof window.UI.updateActionButtons === 'function') {
    window.UI.updateActionButtons();
  } else {
    console.warn("UI system not initialized, can't update action buttons");
  }
};

window.openPanel = function(panelId) {
  if (window.UI && typeof window.UI.openPanel === 'function') {
    window.UI.openPanel(panelId);
  } else {
    console.warn(`UI system not initialized, can't open panel '${panelId}'`);
    
    // Fallback direct approach
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.remove('hidden');
    }
  }
};

window.closePanel = function(panelId) {
  if (window.UI && typeof window.UI.closePanel === 'function') {
    window.UI.closePanel(panelId);
  } else {
    console.warn(`UI system not initialized, can't close panel '${panelId}'`);
    
    // Fallback direct approach
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('hidden');
    }
  }
};

window.getTimeOfDay = function() {
  if (window.UI && typeof window.UI.getTimeOfDay === 'function') {
    return window.UI.getTimeOfDay();
  } else {
    console.warn("UI system not initialized, using fallback for getTimeOfDay");
    
    // Fallback calculation
    const hours = Math.floor(window.gameState.time / 60);
    
    if (hours >= 5 && hours < 8) return 'dawn';
    if (hours >= 8 && hours < 18) return 'day';
    if (hours >= 18 && hours < 21) return 'evening';
    return 'night';
  }
};

// Clean up combat UI compatibility function
window.cleanupCombatUI = function() {
  if (window.UI && window.UI.combat && typeof window.UI.combat.cleanup === 'function') {
    window.UI.combat.cleanup();
  } else {
    console.warn("UI combat system not initialized, using fallback for cleanupCombatUI");
    
    // Fallback cleanup
    try {
      // Restore typical UI elements
      const narrativeContainer = document.getElementById('narrative-container');
      if (narrativeContainer) narrativeContainer.style.display = 'block';
      
      const statusBars = document.querySelector('.status-bars');
      if (statusBars) statusBars.style.display = 'flex';
      
      const actions = document.getElementById('actions');
      if (actions) actions.style.display = 'flex';
      
      // Hide combat interface
      const combatInterface = document.getElementById('combatInterface');
      if (combatInterface) combatInterface.classList.add('hidden');
    } catch (error) {
      console.error("Error in combat UI cleanup fallback:", error);
    }
  }
};

// Setup combat UI compatibility function
window.setupCombatUI = function(enemy, environment) {
  if (window.UI && window.UI.combat && typeof window.UI.combat.setup === 'function') {
    window.UI.combat.setup(enemy, environment);
  } else {
    console.warn("UI combat system not initialized, can't setup combat UI");
  }
};

// NPC Dialog compatibility functions
window.showNpcDialog = function(npc, options) {
  if (window.UI && window.UI.dialog && typeof window.UI.dialog.show === 'function') {
    window.UI.dialog.show(npc, options);
  } else {
    console.warn("UI dialog system not initialized, can't show NPC dialog");
  }
};

window.closeNpcDialog = function() {
  if (window.UI && window.UI.dialog && typeof window.UI.dialog.close === 'function') {
    window.UI.dialog.close();
  } else {
    console.warn("UI dialog system not initialized, can't close NPC dialog");
  }
};

// Mission interface compatibility functions
window.showMissionInterface = function(mission) {
  if (window.UI && window.UI.mission && typeof window.UI.mission.show === 'function') {
    window.UI.mission.show(mission);
  } else {
    console.warn("UI mission system not initialized, can't show mission interface");
  }
};

window.hideMissionInterface = function() {
  if (window.UI && window.UI.mission && typeof window.UI.mission.hide === 'function') {
    window.UI.mission.hide();
  } else {
    console.warn("UI mission system not initialized, can't hide mission interface");
  }
};

window.addMissionActionButton = function(text, callback) {
  if (window.UI && window.UI.mission && typeof window.UI.mission.addActionButton === 'function') {
    window.UI.mission.addActionButton(text, callback);
  } else {
    console.warn("UI mission system not initialized, can't add mission action button");
  }
};

// Run emergency check for stuck UI state on load
(function checkUIStateOnLoad() {
  document.addEventListener('DOMContentLoaded', function() {
    // Use setTimeout to allow everything else to initialize first
    setTimeout(function() {
      // Check for stuck state - visible combat with no action buttons
      if (document.getElementById('combatInterface') && 
          !document.getElementById('combatInterface').classList.contains('hidden')) {
        
        const actionsContainer = document.getElementById('actions');
        if (!actionsContainer || actionsContainer.children.length === 0 || 
            actionsContainer.style.display === 'none') {
          
          console.warn("Detected stuck combat UI state at page load!");
          
          // Try to add emergency recovery button
          if (window.UI && typeof window.UI.addEmergencyRecoveryButton === 'function') {
            window.UI.addEmergencyRecoveryButton();
          }
        }
      }
    }, 2000);
  });
})();
