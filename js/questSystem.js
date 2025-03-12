// QUEST SYSTEM MODULE
// Handles all quest-related functionality: tracking, progression, rewards

/**
 * Core quest system that manages:
 * - Quest states (available, active, completed, failed)
 * - Multi-stage quest progression
 * - Quest-specific narrative and actions
 * - Quest requirements and rewards
 * - Integration with other game systems
 */

window.QuestSystem = {
  // Collection of all quest templates
  questTemplates: {},
  
  // Current active quests
  activeQuests: [],
  
  // Completed quest history
  completedQuests: [],
  
  // Failed quest history
  failedQuests: [],
  
  // Quest that's currently in focus (for UI)
  currentFocusQuest: null,
  
  // Quest Event Hooks
  eventListeners: {},
  
  /**
   * Initialize the quest system
   */
  initialize: function() {
    console.log("Initializing quest system...");
    
    // Register quest templates
    this.registerQuestTemplates();
    
    // Setup daily quest check
    this.setupDailyTriggers();
    
    // Initialize UI components
    this.initializeQuestUI();
    
    // Load saved quest data if any
    this.loadQuestData();
    
    console.log("Quest system initialized");
  },
  
  /**
   * Register all available quest templates
   */
  registerQuestTemplates: function() {
    // Load quest data from questData.js if available
    if (window.questData) {
      Object.keys(window.questData).forEach(questId => {
        this.questTemplates[questId] = window.questData[questId];
      });
      console.log(`Registered ${Object.keys(this.questTemplates).length} quest templates`);
    } else {
      console.error("questData module not found! Quest templates cannot be loaded.");
    }
  },
  
  /**
   * Set up triggers for daily quest checks
   */
  setupDailyTriggers: function() {
    // Hook into the game's time system to check for new quests each day
    const originalUpdateTimeAndDay = window.updateTimeAndDay;
    
    window.updateTimeAndDay = function(minutesToAdd) {
      const oldDay = window.gameDay;
      
      // Call original function
      originalUpdateTimeAndDay(minutesToAdd);
      
      // Check if day changed
      if (window.gameDay > oldDay) {
        // Trigger daily quest check at 8:00 AM
        if (window.gameTime >= 480 && window.gameTime < 540) {
          window.QuestSystem.checkDailyQuests();
        }
      }
    };
  },
  
  /**
   * Initialize quest UI components
   */
  initializeQuestUI: function() {
    // Create quest log UI if it doesn't exist
    this.ensureQuestLogExists();
    
    // Add quest notification functionality
    window.showQuestNotification = function(title, text, questId) {
      // Create a special notification for quests
      const notification = document.createElement('div');
      notification.className = 'quest-notification';
      
      notification.innerHTML = `
        <div class="quest-notification-icon">⚔️</div>
        <div class="quest-notification-content">
          <div class="quest-notification-title">${title}</div>
          <div class="quest-notification-text">${text}</div>
        </div>
        <div class="quest-notification-close">×</div>
      `;
      
      document.body.appendChild(notification);
      
      // Add click handler to view quest details
      notification.addEventListener('click', function() {
        window.QuestSystem.viewQuestDetails(questId);
        document.body.removeChild(notification);
      });
      
      // Add close handler
      notification.querySelector('.quest-notification-close').addEventListener('click', function(e) {
        e.stopPropagation();
        document.body.removeChild(notification);
      });
      
      // Auto remove after 10 seconds
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 10000);
    };
    
    // Add quest indicator to UI
    this.addQuestIndicator();
  },
  
  /**
   * Make sure the quest log UI element exists
   */
  ensureQuestLogExists: function() {
    let questLog = document.getElementById('questLog');
    
    if (!questLog) {
      console.log("Creating quest log UI element");
      
      // Create quest log element
      questLog = document.createElement('div');
      questLog.id = 'questLog';
      questLog.className = 'hidden';
      
      // Create quest log header
      const header = document.createElement('div');
      header.className = 'panel-header';
      header.innerHTML = `
        <h3>Quest Log</h3>
        <button class="panel-close" onclick="document.getElementById('questLog').classList.add('hidden')">×</button>
      `;
      
      // Create quest list container
      const questList = document.createElement('div');
      questList.id = 'questList';
      
      // Assemble and add to document
      questLog.appendChild(header);
      questLog.appendChild(questList);
      document.body.appendChild(questLog);
      
      // Add quest log button to handle display
      window.handleQuestLog = function() {
        window.QuestSystem.updateQuestLog();
        document.getElementById('questLog').classList.remove('hidden');
      };
    }
  },
  
  /**
   * Add a visual indicator when quests are available
   */
  addQuestIndicator: function() {
    // Check if the indicator already exists
    if (document.getElementById('quest-indicator')) {
      return;
    }
    
    // Create the indicator
    const indicator = document.createElement('div');
    indicator.id = 'quest-indicator';
    indicator.className = 'quest-indicator hidden';
    indicator.innerHTML = `
      <div class="quest-indicator-icon" title="New Quest Available">!</div>
    `;
    
    // Add to game container
    const gameContainer = document.getElementById('gameContainer');
    if (gameContainer) {
      gameContainer.appendChild(indicator);
    }
    
    // Add click handler
    indicator.addEventListener('click', function() {
      window.QuestSystem.viewQuestDetails(window.QuestSystem.getAvailableQuests()[0].id);
      indicator.classList.add('hidden');
    });
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .quest-indicator {
        position: absolute;
        top: 100px;
        right: 20px;
        width: 32px;
        height: 32px;
        background-color: #a0a0ff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 10px rgba(160, 160, 255, 0.8);
        cursor: pointer;
        z-index: 100;
        animation: pulse 2s infinite;
      }
      
      .quest-indicator.hidden {
        display: none;
      }
      
      .quest-indicator-icon {
        color: white;
        font-weight: bold;
        font-size: 20px;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      
      .quest-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #2a3448;
        border-left: 4px solid #a0a0ff;
        border-radius: 4px;
        padding: 15px;
        width: 300px;
        display: flex;
        align-items: center;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        animation: slideIn 0.5s;
        cursor: pointer;
      }
      
      .quest-notification:hover {
        background-color: #34425e;
      }
      
      .quest-notification-icon {
        font-size: 24px;
        margin-right: 15px;
      }
      
      .quest-notification-title {
        font-weight: bold;
        margin-bottom: 5px;
        color: #a0a0ff;
      }
      
      .quest-notification-close {
        position: absolute;
        top: 5px;
        right: 8px;
        cursor: pointer;
        font-size: 16px;
        opacity: 0.7;
      }
      
      .quest-notification-close:hover {
        opacity: 1;
      }
      
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    
    document.head.appendChild(style);
  },
  
  /**
   * Load saved quest data if available
   */
  loadQuestData: function() {
    // For now, we won't implement loading from storage
    // This would be implemented when save/load functionality is added
  },
  
  /**
   * Check for quests that should be triggered each day
   */
  checkDailyQuests: function() {
    console.log("Checking for daily quests...");
    
    // Get all quest templates
    const availableQuests = this.getAvailableQuests();
    
    if (availableQuests.length > 0) {
      console.log(`Found ${availableQuests.length} available quests`);
      
      // For now, we'll just consider the first available quest
      const quest = availableQuests[0];
      
      // Check if the quest should trigger today based on its trigger chance
      const triggerChance = quest.dailyTriggerChance || 0.25; // Default 25% chance
      
      if (Math.random() < triggerChance) {
        console.log(`Quest "${quest.title}" has triggered`);
        
        // Show notification about the new quest
        window.showQuestNotification(
          "New Orders", 
          `The Sarkein has a new assignment: ${quest.title}`, 
          quest.id
        );
        
        // Show the quest indicator
        const indicator = document.getElementById('quest-indicator');
        if (indicator) {
          indicator.classList.remove('hidden');
        }
      } else {
        console.log("No quests triggered today");
      }
    } else {
      console.log("No available quests found");
    }
  },
  
  /**
   * Get quests that are available to start
   * @return {Array} List of available quest templates
   */
  getAvailableQuests: function() {
    const available = [];
    
    // Check each quest template
    Object.values(this.questTemplates).forEach(quest => {
      // Skip already completed quests
      if (this.isQuestCompleted(quest.id)) {
        return;
      }
      
      // Skip already active quests
      if (this.isQuestActive(quest.id)) {
        return;
      }
      
      // Check requirements
      if (this.checkQuestRequirements(quest)) {
        available.push(quest);
      }
    });
    
    return available;
  },
  
  /**
   * Check if the player meets all requirements for a quest
   * @param {Object} quest Quest template to check
   * @return {Boolean} Whether requirements are met
   */
  checkQuestRequirements: function(quest) {
    // Skip if no requirements
    if (!quest.requirements) {
      return true;
    }
    
    // Check level requirement
    if (quest.requirements.minLevel && window.gameState.level < quest.requirements.minLevel) {
      return false;
    }
    
    // Check skill requirements
    if (quest.requirements.skills) {
      for (const skill in quest.requirements.skills) {
        if (window.player.skills[skill] < quest.requirements.skills[skill]) {
          return false;
        }
      }
    }
    
    // Check quest prerequisites
    if (quest.requirements.completedQuests) {
      for (const questId of quest.requirements.completedQuests) {
        if (!this.isQuestCompleted(questId)) {
          return false;
        }
      }
    }
    
    return true;
  },
  
  /**
   * Check if a quest is currently active
   * @param {String} questId ID of the quest to check
   * @return {Boolean} Whether the quest is active
   */
  isQuestActive: function(questId) {
    return this.activeQuests.some(q => q.id === questId);
  },
  
  /**
   * Check if a quest has been completed
   * @param {String} questId ID of the quest to check
   * @return {Boolean} Whether the quest is completed
   */
  isQuestCompleted: function(questId) {
    return this.completedQuests.some(q => q.id === questId);
  },
  
  /**
   * Start a new quest
   * @param {String} questId ID of the quest to start
   */
  startQuest: function(questId) {
    // Get the quest template
    const questTemplate = this.questTemplates[questId];
    if (!questTemplate) {
      console.error(`Quest template not found for ID: ${questId}`);
      return false;
    }
    
    // Check if already active
    if (this.isQuestActive(questId)) {
      console.warn(`Quest ${questId} is already active`);
      return false;
    }
    
    // Create a new quest instance
    const quest = {
      id: questId,
      title: questTemplate.title,
      description: questTemplate.description,
      stages: [...questTemplate.stages], // Clone the stages
      currentStage: 0,
      startTime: window.gameDay,
      status: 'active',
      objectives: {}
    };
    
    // Initialize objectives if any
    if (questTemplate.objectives) {
      for (const key in questTemplate.objectives) {
        quest.objectives[key] = {
          description: questTemplate.objectives[key].description,
          target: questTemplate.objectives[key].target,
          current: 0,
          completed: false
        };
      }
    }
    
    // Add to active quests
    this.activeQuests.push(quest);
    
    // Set as current focus quest
    this.currentFocusQuest = quest;
    
    // Start the first stage
    this.startQuestStage(quest, 0);
    
    console.log(`Started quest: ${quest.title}`);
    return true;
  },
  
  /**
   * Start a specific stage of a quest
   * @param {Object} quest The quest object
   * @param {Number} stageIndex Index of the stage to start
   */
  startQuestStage: function(quest, stageIndex) {
    if (stageIndex >= quest.stages.length) {
      console.error(`Invalid stage index ${stageIndex} for quest ${quest.id}`);
      return;
    }
    
    const stage = quest.stages[stageIndex];
    quest.currentStage = stageIndex;
    
    console.log(`Starting quest stage: ${stage.title}`);
    
    // Show stage intro narrative
    if (stage.introNarrative) {
      window.setNarrative(stage.introNarrative);
    }
    
    // Execute stage start function if available
    if (stage.onStart) {
      stage.onStart(quest);
    }
    
    // Trigger quest updated event
    this.triggerEvent('questUpdated', quest);
    
    // Update quest log
    this.updateQuestLog();
  },
  
  /**
   * Advance to the next stage of a quest
   * @param {String} questId ID of the quest to advance
   */
  advanceQuestStage: function(questId) {
    // Find the quest
    const questIndex = this.activeQuests.findIndex(q => q.id === questId);
    if (questIndex === -1) {
      console.error(`Cannot advance quest ${questId}: not active`);
      return;
    }
    
    const quest = this.activeQuests[questIndex];
    const currentStage = quest.stages[quest.currentStage];
    
    // Execute stage completion function if available
    if (currentStage.onComplete) {
      currentStage.onComplete(quest);
    }
    
    // Move to next stage
    const nextStageIndex = quest.currentStage + 1;
    
    // Check if we're at the final stage
    if (nextStageIndex >= quest.stages.length) {
      // Complete the quest
      this.completeQuest(questId);
    } else {
      // Start the next stage
      this.startQuestStage(quest, nextStageIndex);
    }
  },
  
  /**
   * Complete a quest successfully
   * @param {String} questId ID of the quest to complete
   */
  completeQuest: function(questId) {
    // Find the quest
    const questIndex = this.activeQuests.findIndex(q => q.id === questId);
    if (questIndex === -1) {
      console.error(`Cannot complete quest ${questId}: not active`);
      return;
    }
    
    const quest = this.activeQuests[questIndex];
    const questTemplate = this.questTemplates[questId];
    
    // Mark as completed
    quest.status = 'completed';
    quest.completionDay = window.gameDay;
    
    // Move from active to completed
    this.activeQuests.splice(questIndex, 1);
    this.completedQuests.push(quest);
    
    console.log(`Completed quest: ${quest.title}`);
    
    // Show completion notification
    window.showNotification(`Quest Completed: ${quest.title}`, 'success');
    
    // Handle completion narrative
    if (questTemplate.completionNarrative) {
      window.setNarrative(questTemplate.completionNarrative);
    }
    
    // Award rewards
    if (questTemplate.rewards) {
      this.awardQuestRewards(questTemplate.rewards);
    }
    
    // Execute completion callback if available
    if (questTemplate.onComplete) {
      questTemplate.onComplete(quest);
    }
    
    // Trigger quest completed event
    this.triggerEvent('questCompleted', quest);
    
    // Update quest log
    this.updateQuestLog();
  },
  
  /**
   * Fail a quest
   * @param {String} questId ID of the quest to fail
   * @param {String} reason Optional reason for failure
   */
  failQuest: function(questId, reason) {
    // Find the quest
    const questIndex = this.activeQuests.findIndex(q => q.id === questId);
    if (questIndex === -1) {
      console.error(`Cannot fail quest ${questId}: not active`);
      return;
    }
    
    const quest = this.activeQuests[questIndex];
    const questTemplate = this.questTemplates[questId];
    
    // Mark as failed
    quest.status = 'failed';
    quest.failureDay = window.gameDay;
    quest.failureReason = reason;
    
    // Move from active to failed
    this.activeQuests.splice(questIndex, 1);
    this.failedQuests.push(quest);
    
    console.log(`Failed quest: ${quest.title}${reason ? ` - Reason: ${reason}` : ''}`);
    
    // Show failure notification
    window.showNotification(`Quest Failed: ${quest.title}`, 'warning');
    
    // Handle failure narrative
    if (questTemplate.failureNarrative) {
      window.setNarrative(questTemplate.failureNarrative);
    }
    
    // Execute failure callback if available
    if (questTemplate.onFail) {
      questTemplate.onFail(quest, reason);
    }
    
    // Trigger quest failed event
    this.triggerEvent('questFailed', quest);
    
    // Update quest log
    this.updateQuestLog();
  },
  
  /**
   * Update objective progress for a quest
   * @param {String} questId ID of the quest to update
   * @param {String} objectiveId ID of the objective to update
   * @param {Number} amount Amount to increase progress by (default: 1)
   */
  updateObjective: function(questId, objectiveId, amount = 1) {
    // Find the quest
    const quest = this.activeQuests.find(q => q.id === questId);
    if (!quest) {
      console.error(`Cannot update objective for quest ${questId}: not active`);
      return;
    }
    
    // Find the objective
    if (!quest.objectives || !quest.objectives[objectiveId]) {
      console.error(`Objective ${objectiveId} not found for quest ${questId}`);
      return;
    }
    
    const objective = quest.objectives[objectiveId];
    
    // Update progress
    objective.current = Math.min(objective.target, objective.current + amount);
    
    // Check if completed
    if (objective.current >= objective.target && !objective.completed) {
      objective.completed = true;
      
      // Show notification
      window.showNotification(`Objective Completed: ${objective.description}`, 'success');
      
      // Check if all objectives are completed
      const allCompleted = Object.values(quest.objectives).every(obj => obj.completed);
      if (allCompleted) {
        // Check if we should auto-complete the quest
        const questTemplate = this.questTemplates[questId];
        if (questTemplate && questTemplate.completeOnAllObjectives) {
          this.completeQuest(questId);
        }
      }
    }
    
    // Trigger objective updated event
    this.triggerEvent('objectiveUpdated', { quest, objectiveId });
    
    // Update quest log
    this.updateQuestLog();
  },
  
  /**
   * Award quest rewards to the player
   * @param {Object} rewards The rewards object from the quest template
   */
  awardQuestRewards: function(rewards) {
    let rewardText = "Quest Rewards:";
    
    // Experience reward
    if (rewards.experience) {
      window.gameState.experience += rewards.experience;
      rewardText += `\n- ${rewards.experience} Experience`;
    }
    
    // Currency reward
    if (rewards.taelors) {
      window.player.taelors += rewards.taelors;
      rewardText += `\n- ${rewards.taelors} Taelors`;
    }
    
    // Item rewards
    if (rewards.items && rewards.items.length > 0) {
      rewards.items.forEach(item => {
        if (window.itemTemplates[item]) {
          window.addItemToInventory(window.itemTemplates[item]);
          rewardText += `\n- ${window.itemTemplates[item].name}`;
        }
      });
    }
    
    // Skill rewards
    if (rewards.skills) {
      for (const skill in rewards.skills) {
        if (window.player.skills.hasOwnProperty(skill)) {
          window.player.skills[skill] += rewards.skills[skill];
          rewardText += `\n- ${skill} +${rewards.skills[skill]}`;
          
          // Apply skill caps
          window.applyCapsToSkills();
        }
      }
    }
    
    // Show rewards notification
    window.showNotification(rewardText, 'success');
    
    // Update UI
    window.updateStatusBars();
    window.updateProfileIfVisible();
  },
  
  /**
   * Update the quest log UI
   */
  updateQuestLog: function() {
    const questList = document.getElementById('questList');
    if (!questList) return;
    
    // Clear current content
    questList.innerHTML = '';
    
    // Show active quests first
    if (this.activeQuests.length > 0) {
      const activeHeader = document.createElement('h3');
      activeHeader.textContent = 'Active Quests';
      questList.appendChild(activeHeader);
      
      this.activeQuests.forEach(quest => {
        const questItem = this.createQuestListItem(quest);
        questList.appendChild(questItem);
      });
    }
    
    // Show completed quests
    if (this.completedQuests.length > 0) {
      const completedHeader = document.createElement('h3');
      completedHeader.textContent = 'Completed Quests';
      completedHeader.style.marginTop = '20px';
      questList.appendChild(completedHeader);
      
      this.completedQuests.forEach(quest => {
        const questItem = this.createQuestListItem(quest);
        questList.appendChild(questItem);
      });
    }
    
    // Show failed quests
    if (this.failedQuests.length > 0) {
      const failedHeader = document.createElement('h3');
      failedHeader.textContent = 'Failed Quests';
      failedHeader.style.marginTop = '20px';
      questList.appendChild(failedHeader);
      
      this.failedQuests.forEach(quest => {
        const questItem = this.createQuestListItem(quest);
        questList.appendChild(questItem);
      });
    }
  },
  
  /**
   * Create a quest item for the quest log
   * @param {Object} quest The quest object
   * @return {HTMLElement} The quest list item
   */
  createQuestListItem: function(quest) {
    const questItem = document.createElement('div');
    questItem.className = 'quest-item';
    questItem.dataset.questId = quest.id;
    
    // Build the HTML
    let html = `
      <div class="quest-title">${quest.title}</div>
      <div class="quest-description">${quest.description}</div>
    `;
    
    // Add stage information for active quests
    if (quest.status === 'active') {
      const currentStage = quest.stages[quest.currentStage];
      html += `
        <div class="quest-stage">
          <span class="quest-stage-label">Current Stage:</span>
          <span class="quest-stage-title">${currentStage.title}</span>
        </div>
      `;
    }
    
    // Add objectives if any
    if (quest.objectives && Object.keys(quest.objectives).length > 0) {
      html += `<div class="quest-objectives">`;
      
      for (const key in quest.objectives) {
        const objective = quest.objectives[key];
        const objectiveClass = objective.completed ? 'quest-objective-complete' : '';
        
        html += `
          <div class="quest-objective ${objectiveClass}">
            ${objective.description}: ${objective.current}/${objective.target}
          </div>
        `;
      }
      
      html += `</div>`;
    }
    
    // Add status info
    if (quest.status === 'completed') {
      html += `<div class="quest-status-completed">Completed on Day ${quest.completionDay}</div>`;
    } else if (quest.status === 'failed') {
      html += `<div class="quest-status-failed">Failed on Day ${quest.failureDay}${quest.failureReason ? `: ${quest.failureReason}` : ''}</div>`;
    }
    
    questItem.innerHTML = html;
    
    // Add click handler to view details
    questItem.addEventListener('click', () => {
      this.viewQuestDetails(quest.id);
    });
    
    return questItem;
  },
  
  /**
   * View detailed information about a quest
   * @param {String} questId ID of the quest to view
   */
  viewQuestDetails: function(questId) {
    // Find the quest - check active, completed, and failed quests
    let quest = this.activeQuests.find(q => q.id === questId);
    if (!quest) {
      quest = this.completedQuests.find(q => q.id === questId);
    }
    if (!quest) {
      quest = this.failedQuests.find(q => q.id === questId);
    }
    
    // If still not found, check if it's a template for a new quest
    if (!quest) {
      const template = this.questTemplates[questId];
      if (template) {
        // Show quest acceptance dialog
        this.showQuestAcceptanceDialog(template);
        return;
      } else {
        console.error(`Quest not found: ${questId}`);
        return;
      }
    }
    
    // Set as current focus
    this.currentFocusQuest = quest;
    
    // Show quest details dialog
    this.showQuestDetailsDialog(quest);
  },
  
  /**
   * Show a dialog to accept a new quest
   * @param {Object} questTemplate The quest template
   */
  showQuestAcceptanceDialog: function(questTemplate) {
    // Create modal dialog
    const dialogId = 'quest-acceptance-dialog';
    let dialog = document.getElementById(dialogId);
    
    // Create dialog if it doesn't exist
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = dialogId;
      dialog.className = 'quest-dialog';
      document.body.appendChild(dialog);
    }
    
    // Populate dialog content
    dialog.innerHTML = `
      <div class="quest-dialog-content">
        <h2 class="quest-dialog-title">${questTemplate.title}</h2>
        <div class="quest-dialog-description">${questTemplate.description}</div>
        
        <div class="quest-dialog-details">
          <h3>Orders from the Sarkein:</h3>
          <p>${questTemplate.introduction || "The Sarkein has a mission for you."}</p>
          
          ${questTemplate.rewards ? `
            <h3>Rewards:</h3>
            <ul class="quest-rewards-list">
              ${questTemplate.rewards.experience ? `<li>${questTemplate.rewards.experience} Experience</li>` : ''}
              ${questTemplate.rewards.taelors ? `<li>${questTemplate.rewards.taelors} Taelors</li>` : ''}
              ${questTemplate.rewards.items && questTemplate.rewards.items.length ? 
                questTemplate.rewards.items.map(itemId => {
                  const item = window.itemTemplates[itemId];
                  return item ? `<li>${item.name}</li>` : '';
                }).join('') : ''}
              ${questTemplate.rewards.skills ? 
                Object.entries(questTemplate.rewards.skills).map(([skill, value]) => 
                  `<li>${skill} +${value}</li>`
                ).join('') : ''}
            </ul>
          ` : ''}
        </div>
        
        <div class="quest-dialog-actions">
          <button id="accept-quest-btn" class="action-btn">Accept Assignment</button>
          <button id="decline-quest-btn" class="action-btn">Decline</button>
        </div>
      </div>
    `;
    
    // Show the dialog
    dialog.style.display = 'flex';
    
    // Add event listeners
    document.getElementById('accept-quest-btn').addEventListener('click', () => {
      // Hide the dialog
      dialog.style.display = 'none';
      
      // Start the quest
      this.startQuest(questTemplate.id);
      
      // Hide the quest indicator
      const indicator = document.getElementById('quest-indicator');
      if (indicator) {
        indicator.classList.add('hidden');
      }
    });
    
    document.getElementById('decline-quest-btn').addEventListener('click', () => {
      // Just hide the dialog
      dialog.style.display = 'none';
    });
  },
  
  /**
   * Show a dialog with quest details
   * @param {Object} quest The quest object
   */
  showQuestDetailsDialog: function(quest) {
    // Create modal dialog
    const dialogId = 'quest-details-dialog';
    let dialog = document.getElementById(dialogId);
    
    // Create dialog if it doesn't exist
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = dialogId;
      dialog.className = 'quest-dialog';
      document.body.appendChild(dialog);
    }
    
    // Get current stage for active quests
    const currentStage = quest.status === 'active' ? quest.stages[quest.currentStage] : null;
    
    // Populate dialog content
    dialog.innerHTML = `
      <div class="quest-dialog-content">
        <h2 class="quest-dialog-title">${quest.title}</h2>
        <div class="quest-dialog-description">${quest.description}</div>
        
        <div class="quest-dialog-details">
          ${quest.status === 'active' ? `
            <h3>Current Stage: ${currentStage.title}</h3>
            <p>${currentStage.description || ""}</p>
          ` : ''}
          
          ${quest.objectives && Object.keys(quest.objectives).length > 0 ? `
            <h3>Objectives:</h3>
            <ul class="quest-objectives-list">
              ${Object.values(quest.objectives).map(objective => `
                <li class="${objective.completed ? 'completed' : ''}">
                  ${objective.description}: ${objective.current}/${objective.target}
                </li>
              `).join('')}
            </ul>
          ` : ''}
          
          ${quest.status === 'completed' ? `
            <div class="quest-status-completed">Completed on Day ${quest.completionDay}</div>
          ` : quest.status === 'failed' ? `
            <div class="quest-status-failed">Failed on Day ${quest.failureDay}${quest.failureReason ? `: ${quest.failureReason}` : ''}</div>
          ` : ''}
        </div>
        
        <div class="quest-dialog-actions">
          ${quest.status === 'active' && currentStage.actions && currentStage.actions.length > 0 ? 
            currentStage.actions.map(action => 
              `<button class="action-btn quest-action-btn" data-action="${action.id}">${action.label}</button>`
            ).join('') : ''}
          <button id="close-quest-details-btn" class="action-btn">Close</button>
        </div>
      </div>
    `;
    
    // Show the dialog
    dialog.style.display = 'flex';
    
    // Add event listeners
    dialog.querySelectorAll('.quest-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const actionId = btn.dataset.action;
        this.executeQuestAction(quest.id, actionId);
        dialog.style.display = 'none';
      });
    });
    
    document.getElementById('close-quest-details-btn').addEventListener('click', () => {
      dialog.style.display = 'none';
    });
  },
  
  /**
   * Execute a quest-specific action
   * @param {String} questId ID of the quest
   * @param {String} actionId ID of the action to execute
   */
  executeQuestAction: function(questId, actionId) {
    // Find the quest
    const quest = this.activeQuests.find(q => q.id === questId);
    if (!quest) {
      console.error(`Cannot execute action for quest ${questId}: not active`);
      return;
    }
    
    // Get current stage
    const currentStage = quest.stages[quest.currentStage];
    if (!currentStage) {
      console.error(`Invalid stage for quest ${questId}`);
      return;
    }
    
    // Find the action
    const action = currentStage.actions.find(a => a.id === actionId);
    if (!action) {
      console.error(`Action ${actionId} not found for quest ${questId}`);
      return;
    }
    
    console.log(`Executing quest action: ${action.label}`);
    
    // Execute the action callback
    if (action.execute) {
      action.execute(quest);
    }
  },
  
  /**
   * Add an event listener for quest events
   * @param {String} event The event name
   * @param {Function} callback The callback function
   */
  addEventListener: function(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    
    this.eventListeners[event].push(callback);
  },
  
  /**
   * Remove an event listener
   * @param {String} event The event name
   * @param {Function} callback The callback function to remove
   */
  removeEventListener: function(event, callback) {
    if (!this.eventListeners[event]) return;
    
    const index = this.eventListeners[event].indexOf(callback);
    if (index !== -1) {
      this.eventListeners[event].splice(index, 1);
    }
  },
  
  /**
   * Trigger an event
   * @param {String} event The event name
   * @param {*} data Event data to pass to listeners
   */
  triggerEvent: function(event, data) {
    if (!this.eventListeners[event]) return;
    
    this.eventListeners[event].forEach(callback => {
      callback(data);
    });
  }
};

// Add quest system styles
document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.textContent = `
    /* Quest log styles */
    #questList {
      padding: 15px;
    }
    
    .quest-item {
      background: #2a2a2a;
      border-radius: 4px;
      padding: 15px;
      margin-bottom: 15px;
      border-left: 3px solid #a0a0ff;
      cursor: pointer;
      transition: transform 0.2s;
    }
    
    .quest-item:hover {
      transform: translateX(5px);
      background: #333;
    }
    
    .quest-title {
      font-weight: bold;
      font-size: 1.1em;
      color: #a0a0ff;
      margin-bottom: 5px;
    }
    
    .quest-description {
      color: #e0e0e0;
      margin-bottom: 10px;
    }
    
    .quest-stage {
      background: #333;
      padding: 8px;
      border-radius: 4px;
      margin: 10px 0;
    }
    
    .quest-stage-label {
      color: #888;
      margin-right: 5px;
    }
    
    .quest-stage-title {
      font-weight: bold;
    }
    
    .quest-objectives {
      margin: 10px 0;
    }
    
    .quest-objective {
      padding: 4px 0;
      border-left: 2px solid #666;
      padding-left: 10px;
      margin-bottom: 3px;
    }
    
    .quest-objective-complete {
      border-left-color: #4CAF50;
      color: #4CAF50;
    }
    
    .quest-status-completed {
      color: #4CAF50;
      margin-top: 10px;
      font-style: italic;
    }
    
    .quest-status-failed {
      color: #F44336;
      margin-top: 10px;
      font-style: italic;
    }
    
    /* Quest dialog styles */
    .quest-dialog {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    .quest-dialog-content {
      background: #1a1a1a;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
    }
    
    .quest-dialog-title {
      color: #a0a0ff;
      border-bottom: 1px solid #444;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    
    .quest-dialog-description {
      margin-bottom: 20px;
    }
    
    .quest-dialog-details {
      background: #232323;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .quest-dialog-details h3 {
      margin-top: 0;
      color: #a0a0ff;
      font-size: 1.1em;
    }
    
    .quest-rewards-list {
      list-style-type: none;
      padding-left: 10px;
    }
    
    .quest-rewards-list li {
      padding: 3px 0;
    }
    
    .quest-objectives-list {
      list-style-type: none;
      padding-left: 0;
    }
    
    .quest-objectives-list li {
      padding: 5px 10px;
      margin-bottom: 5px;
      border-left: 2px solid #555;
    }
    
    .quest-objectives-list li.completed {
      border-left-color: #4CAF50;
      color: #4CAF50;
    }
    
    .quest-dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
  `;
  
  document.head.appendChild(style);
});

// Initialize the quest system when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if not already initialized
  if (window.QuestSystem && !window.QuestSystem.initialized) {
    window.QuestSystem.initialize();
  }
});
