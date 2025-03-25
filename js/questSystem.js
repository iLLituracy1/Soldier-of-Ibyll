// QUEST SYSTEM MODULE
// Handles quest management, tracking, and progression with a clear separation of data and logic

// Quest status constants
window.QUEST_STATUS = {
  NOT_STARTED: 'not_started',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Battle types for quest stages
window.BATTLE_TYPES = {
  INDIVIDUAL: 'individual',   // Regular combat
  NARRATIVE: 'narrative'      // No actual combat, just narrative description
};

// Store all active quests
window.quests = [];

// Initialize the quest system
window.initializeQuestSystem = function() {
  console.log("Initializing quest system...");
  
  // Add inQuestSequence flag to gameState
  window.gameState.inQuestSequence = false;
  
  // Add new awaitingQuestResponse flag
  window.gameState.awaitingQuestResponse = false;
  
  // Set up quest log button handler if not already defined
  if (!window.handleQuestLog) {
    window.handleQuestLog = function() {
      console.log("Opening quest log");
      window.renderQuestLog();
      document.getElementById('questLog').classList.remove('hidden');
    };
  }
  
  // Check for quest assignments on day change
  window.addEventListener('dayChanged', window.checkForQuestAssignment);
  
  console.log("Quest system initialized");
  return true;
};

// Check for quest assignment (called each day)
window.checkForQuestAssignment = function() {
  console.log("Checking for quest assignment...");
  
  // Only check if we're not already on a time-sensitive quest
  const hasActiveTimeSensitiveQuest = window.quests.some(quest => 
    quest.status === window.QUEST_STATUS.ACTIVE && 
    quest.expiryDay !== undefined);
  
  if (hasActiveTimeSensitiveQuest) {
    console.log("Player already has an active time-sensitive quest, skipping assignment check");
    return;
  }
  
  // Check all quest templates for potential assignment
  for (const templateId in window.questTemplates) {
    const template = window.questTemplates[templateId];
    
    // Check if this quest is already active or completed
    const existingQuest = window.quests.find(q => q.templateId === templateId);
    if (existingQuest && (existingQuest.status === window.QUEST_STATUS.ACTIVE)) {
      continue;
    }
    
    // Check if this quest was recently completed (cooldown)
    const completedQuest = window.quests.find(q => 
      q.templateId === templateId && 
      q.status === window.QUEST_STATUS.COMPLETED &&
      q.completionDay !== undefined &&
      window.gameDay - q.completionDay < template.cooldownDays);
    
    if (completedQuest) {
      continue;
    }
    
    // Check if we've reached the minimum day
    if (template.minDayToTrigger && window.gameDay < template.minDayToTrigger) {
      continue;
    }
    
    // Roll the dice based on chance trigger
    if (Math.random() < template.chanceTrigger) {
      console.log(`Quest "${template.title}" triggered for assignment`);
      window.assignQuest(templateId);
      return; // Only assign one quest at a time
    }
  }
};

// Assign a quest to the player
window.assignQuest = function(templateId) {
  const template = window.questTemplates[templateId];
  if (!template) {
    console.error(`Quest template "${templateId}" not found`);
    return false;
  }
  
  // Create a new quest instance
  const quest = {
    id: `quest_${Date.now()}`,
    templateId: templateId,
    title: template.title,
    description: template.description,
    status: window.QUEST_STATUS.ACTIVE,
    currentStageIndex: 0,
    stages: JSON.parse(JSON.stringify(template.stages)), // Deep copy to avoid reference issues
    assignmentDay: window.gameDay,
    expiryDay: template.requiredPreparationDays ? window.gameDay + template.requiredPreparationDays + 3 : undefined,
    rewards: { ...template.baseReward },
    // Add userData for tracking performance metrics
    userData: {}
  };
  
  // Add to active quests
  window.quests.push(quest);
  
  // Show notification
  window.showQuestNotification(quest, 'assigned');
  
  // Add quest assignment narrative
  window.addToNarrative(`<strong>New Quest: ${quest.title}</strong><br>${quest.description}`);
  
  // Set flag to show we're awaiting quest response
  window.gameState.awaitingQuestResponse = true;
  window.gameState.inQuestSequence = false;
  
  // Clear current actions and add ONLY the quest action button
  const actionsContainer = document.getElementById('actions');
  actionsContainer.innerHTML = ''; // Clear all existing buttons
  
  // Find the first stage
  const firstStage = quest.stages[0];
  
  // Create a button with appropriate text based on the first stage's action
  const buttonText = getActionButtonText(firstStage.action);
  window.addActionButton(buttonText, 'respond_to_quest', actionsContainer);
  
  return true;
};

// Generic function to handle quest stage actions
window.handleQuestStageAction = function(quest, stage) {
  console.log(`Handling quest stage action: ${stage.id}, type: ${stage.battleType}`);
  
  // Set quest sequence flag
  window.gameState.inQuestSequence = true;
  
  switch (stage.battleType) {
    case window.BATTLE_TYPES.NARRATIVE:
      // Display the narrative
      window.setNarrative(stage.narrative || stage.description);
      
      // Advance time if specified
      if (stage.timeAdvance) {
        window.updateTimeAndDay(stage.timeAdvance);
        
        // Allow a moment for time update to register before continuing
        setTimeout(() => {
          window.addToNarrative('Time passes...');
          window.updateQuestActionButtons(quest);
        }, 1000);
      } else {
        // Update action buttons immediately
        window.updateQuestActionButtons(quest);
      }
      break;
      
    case window.BATTLE_TYPES.INDIVIDUAL:
      // Display pre-combat narrative
      window.setNarrative(stage.narrative || stage.description);
      
      // Start combat after a short delay
      setTimeout(() => {
        // Store performance data
        if (!quest.userData) quest.userData = {};
        quest.userData[`${stage.id}_start`] = true;
        
        // When initiating combat
        window.combatSystem.initiateCombat(
        stage.enemyType, 
        [], 
        stage.combatOptions || { requireDefeat: true }
      );
        
        // Store the original end combat function
        const originalEndCombat = window.combatSystem.endCombat;
        
        // Override the endCombat function to continue the quest after combat
        window.combatSystem.endCombat = function(outcome) {
          // Call the original function first
          originalEndCombat.call(window.combatSystem, outcome);
          
          // Restore the original function
          window.combatSystem.endCombat = originalEndCombat;
          
          // Continue based on outcome
          setTimeout(() => {
            if (outcome === true) {
              // Success
              window.addToNarrative(stage.successText || "You are victorious!");
              
              // Continue to next stage
              window.progressQuest(quest.id, stage.action);
            } else {
              // Failure
              window.addToNarrative(stage.failureText || "You have been defeated.");
              window.failQuest(quest.id);
            }
          }, 1500);
        };
      }, 1500);
      break;
      
    default:
      console.error(`Unknown battleType: ${stage.battleType}`);
      window.updateQuestActionButtons(quest);
  }
};

// Progress a quest to the next stage
window.progressQuest = function(questId, action) {
  console.log(`Progressing quest ${questId} with action ${action}`);
  
  const questIndex = window.quests.findIndex(q => q.id === questId);
  if (questIndex === -1) {
    console.error(`Quest "${questId}" not found`);
    return false;
  }
  
  const quest = window.quests[questIndex];
  if (quest.status !== window.QUEST_STATUS.ACTIVE) {
    console.error(`Cannot progress quest "${questId}" - not active`);
    return false;
  }
  
  const currentStage = quest.stages[quest.currentStageIndex];
  console.log(`Current stage: ${currentStage.id}, required action: ${currentStage.action}, given action: ${action}`);
  
  // Mark current stage as completed
  currentStage.completed = true;
  
  // Clear awaiting response flag - player has responded to the quest
  window.gameState.awaitingQuestResponse = false;
  
  // Advance to next stage if there is one
  if (currentStage.nextStage) {
    const nextStageIndex = quest.stages.findIndex(s => s.id === currentStage.nextStage);
    if (nextStageIndex !== -1) {
      quest.currentStageIndex = nextStageIndex;
      
      // Show notification
      window.showQuestNotification(quest, 'updated');
      
      // Update quest log if visible
      window.renderQuestLog();
      
      // Update quest UI elements
      if (!document.getElementById('questSceneContainer').classList.contains('hidden')) {
        // Update progress steps
        window.updateQuestProgressSteps(quest);
        
        // Update action buttons
        window.updateQuestActionButtons(quest);
        
        // Update quest objective
        const newCurrentStage = quest.stages[quest.currentStageIndex];
        document.getElementById('questObjective').textContent = newCurrentStage.objective;
      }
      
      // Handle the new stage
      window.handleQuestStageAction(quest, quest.stages[quest.currentStageIndex]);
      
      console.log(`Advanced to next stage: ${quest.stages[nextStageIndex].id}`);
    } else {
      console.error(`Next stage "${currentStage.nextStage}" not found`);
    }
  } else {
    // No next stage, complete the quest
    window.completeQuest(questId);
  }
  
  return true;
};

// Update quest action buttons
window.updateQuestActionButtons = function(quest) {
  const actionsContainer = document.getElementById('questActions');
  if (!actionsContainer) return;
  
  actionsContainer.innerHTML = '';
  
  // Get current stage
  const currentStage = quest.stages[quest.currentStageIndex];
  if (!currentStage) return;
  
  console.log(`Updating action buttons for stage: ${currentStage.id}`);
  
  // If the stage has an action, add the button for it
  if (currentStage.action) {
    const actionButton = document.createElement('button');
    actionButton.className = 'quest-action-btn';
    
    // Set button text based on the action
    actionButton.textContent = getActionButtonText(currentStage.action);
    
    // Set the action handler with better error logging
    actionButton.onclick = function() {
      console.log(`Button clicked: ${actionButton.textContent}, action: ${currentStage.action}`);
      try {
        window.progressQuest(quest.id, currentStage.action);
      } catch (error) {
        console.error(`Error progressing quest: ${error.message}`);
        // Add fallback recovery code if needed
      }
    };
    
    actionsContainer.appendChild(actionButton);
  }
};

// Helper function to get action button text based on action type
function getActionButtonText(action) {
  switch(action) {
    case 'report':
      return 'Report In';
    case 'prepare':
      return 'Prepare';
    case 'proceed':
      return 'Continue';
    case 'combat':
      return 'Engage';
    case 'complete':
      return 'Complete Mission';
    default:
      return 'Continue';
  }
}

// Complete a quest
window.completeQuest = function(questId) {
  const questIndex = window.quests.findIndex(q => q.id === questId);
  if (questIndex === -1) {
    console.error(`Quest "${questId}" not found`);
    return false;
  }
  
  const quest = window.quests[questIndex];
  quest.status = window.QUEST_STATUS.COMPLETED;
  quest.completionDay = window.gameDay;
  
  // Reset quest sequence flag
  window.gameState.inQuestSequence = false;
  window.gameState.awaitingQuestResponse = false;
  
  // Apply rewards - use enhanced system if available
  if (typeof window.applyQuestRewards === 'function') {
    window.applyQuestRewards(quest);
  } else {
    // Basic reward application
    applyBasicRewards(quest);
  }
  
  // Update quest log if visible
  window.renderQuestLog();
  
  // Exit quest scene if we're in it
  if (!document.getElementById('questSceneContainer').classList.contains('hidden')) {
    window.exitQuestScene();
  }
  
  // Update action buttons to show regular camp actions
  window.updateActionButtons();
  
  return true;
};

// Apply basic rewards if enhanced system is not available
function applyBasicRewards(quest) {
  if (quest.rewards) {
    // Experience
    if (quest.rewards.experience) {
      window.gameState.experience += quest.rewards.experience;
      window.showNotification(`+${quest.rewards.experience} XP`, 'success');
    }
    
    // Currency
    if (quest.rewards.taelors) {
      window.player.taelors += quest.rewards.taelors;
      window.showNotification(`+${quest.rewards.taelors} taelors`, 'success');
    }
    
    // Items
    if (quest.rewards.items && quest.rewards.items.length > 0) {
      quest.rewards.items.forEach(itemId => {
        const itemTemplate = window.itemTemplates[itemId];
        if (itemTemplate) {
          window.addItemToInventory(itemTemplate);
          window.showNotification(`Received: ${itemTemplate.name}`, 'success');
        }
      });
    }
  }
  
  // Show notification of quest completion
  window.showQuestNotification(quest, 'completed');
  
  // Check for level up
  window.checkLevelUp();
}

// Fail a quest
window.failQuest = function(questId) {
  const questIndex = window.quests.findIndex(q => q.id === questId);
  if (questIndex === -1) {
    console.error(`Quest "${questId}" not found`);
    return false;
  }
  
  const quest = window.quests[questIndex];
  quest.status = window.QUEST_STATUS.FAILED;
  quest.failureDay = window.gameDay;
  
  // Reset quest sequence flag
  window.gameState.inQuestSequence = false;
  window.gameState.awaitingQuestResponse = false;
  
  // Show failure notification
  window.showQuestNotification(quest, 'failed');
  
  // Add failure narrative
  window.addToNarrative(`<p>You have failed to complete the quest "${quest.title}". The opportunity has passed.</p>`);
  
  // Update quest log if visible
  window.renderQuestLog();
  
  // Exit quest scene if we're in it
  if (!document.getElementById('questSceneContainer').classList.contains('hidden')) {
    window.exitQuestScene();
  }
  
  // Update action buttons to show regular camp actions
  window.updateActionButtons();
  
  return true;
};

// Check quest deadlines (called on day change)
window.checkQuestDeadlines = function() {
  window.quests.forEach(quest => {
    if (quest.status === window.QUEST_STATUS.ACTIVE && quest.expiryDay !== undefined) {
      if (window.gameDay > quest.expiryDay) {
        window.failQuest(quest.id);
      }
    }
  });
};

// Show quest notification
window.showQuestNotification = function(quest, type) {
  let message = '';
  
  switch(type) {
    case 'assigned':
      message = `New Quest: ${quest.title}`;
      break;
    case 'updated':
      const currentStage = quest.stages[quest.currentStageIndex];
      message = `Quest Updated: ${quest.title} - ${currentStage.objective}`;
      break;
    case 'completed':
      message = `Quest Completed: ${quest.title}`;
      break;
    case 'failed':
      message = `Quest Failed: ${quest.title}`;
      break;
    default:
      message = `Quest: ${quest.title}`;
  }
  
  window.showNotification(message, type === 'failed' ? 'warning' : 'success');
};

// Function to transition to the quest scene
window.enterQuestScene = function(quest) {
  // Hide main game container and show quest scene
  document.getElementById('gameContainer').classList.add('hidden');
  document.getElementById('questSceneContainer').classList.remove('hidden');
  
  // Get the current stage
  const currentStage = quest.stages[quest.currentStageIndex];
  
  // Update quest UI elements
  document.getElementById('questTitle').textContent = quest.title;
  document.getElementById('questObjective').textContent = currentStage.objective;
  
  // Copy the current time and day
  document.getElementById('questTimeDisplay').textContent = document.getElementById('timeDisplay').textContent;
  document.getElementById('questDayDisplay').textContent = document.getElementById('dayDisplay').textContent;
  document.getElementById('questDayNightIndicator').className = document.getElementById('dayNightIndicator').className;
  
  // Copy status values
  document.getElementById('questHealthValue').textContent = document.getElementById('healthValue').textContent;
  document.getElementById('questHealthBar').style.width = document.getElementById('healthBar').style.width;
  
  document.getElementById('questStaminaValue').textContent = document.getElementById('staminaValue').textContent;
  document.getElementById('questStaminaBar').style.width = document.getElementById('staminaBar').style.width;
  
  document.getElementById('questMoraleValue').textContent = document.getElementById('moraleValue').textContent;
  document.getElementById('questMoraleBar').style.width = document.getElementById('moraleBar').style.width;
  
  // Update quest progress steps
  window.updateQuestProgressSteps(quest);
  
  console.log('Entered quest scene for quest:', quest.title);
  
  // Handle the current stage
  window.handleQuestStageAction(quest, currentStage);
};

// Function to exit quest scene and return to main game
window.exitQuestScene = function() {
  document.getElementById('questSceneContainer').classList.add('hidden');
  document.getElementById('gameContainer').classList.remove('hidden');
  
  console.log('Exited quest scene');
};

// Update the quest progress steps in the UI
window.updateQuestProgressSteps = function(quest) {
  const stepsContainer = document.getElementById('questProgressSteps');
  if (!stepsContainer) return;
  
  stepsContainer.innerHTML = '';
  
  quest.stages.forEach((stage, index) => {
    const stepElement = document.createElement('div');
    stepElement.className = 'quest-step';
    
    let markerClass = '';
    let contentClass = '';
    
    if (stage.completed) {
      markerClass = 'completed';
      contentClass = 'completed';
    } else if (index === quest.currentStageIndex) {
      markerClass = 'current';
      contentClass = 'current';
    }
    
    stepElement.innerHTML = `
      <div class="step-marker ${markerClass}"></div>
      <div class="step-content ${contentClass}">${stage.objective}</div>
    `;
    
    stepsContainer.appendChild(stepElement);
  });
};

// Render quest log UI
window.renderQuestLog = function() {
  const questList = document.getElementById('questList');
  if (!questList) return;
  
  questList.innerHTML = '';
  
  if (window.quests.length === 0) {
    questList.innerHTML = '<p>No quests available.</p>';
    return;
  }
  
  // Sort quests: Active first, then completed, then failed
  const sortedQuests = [...window.quests].sort((a, b) => {
    if (a.status === window.QUEST_STATUS.ACTIVE && b.status !== window.QUEST_STATUS.ACTIVE) return -1;
    if (a.status !== window.QUEST_STATUS.ACTIVE && b.status === window.QUEST_STATUS.ACTIVE) return 1;
    if (a.status === window.QUEST_STATUS.COMPLETED && b.status !== window.QUEST_STATUS.COMPLETED) return -1;
    if (a.status !== window.QUEST_STATUS.COMPLETED && b.status === window.QUEST_STATUS.COMPLETED) return 1;
    return 0;
  });
  
  sortedQuests.forEach(quest => {
    const questElement = document.createElement('div');
    questElement.className = `quest-item quest-${quest.status}`;
    
    // Quest header
    const questHeader = document.createElement('div');
    questHeader.className = 'quest-title';
    questHeader.textContent = quest.title;
    
    // Quest description
    const questDesc = document.createElement('div');
    questDesc.className = 'quest-description';
    questDesc.textContent = quest.description;
    
    // Quest status
    const questStatus = document.createElement('div');
    questStatus.className = 'quest-status';
    
    let statusText = '';
    if (quest.status === window.QUEST_STATUS.ACTIVE) {
      statusText = 'Active';
    } else if (quest.status === window.QUEST_STATUS.COMPLETED) {
      statusText = 'Completed';
    } else if (quest.status === window.QUEST_STATUS.FAILED) {
      statusText = 'Failed';
    }
    
    questStatus.textContent = statusText;
    
    // Quest objectives
    const questObjectives = document.createElement('div');
    questObjectives.className = 'quest-objectives';
    
    // Add current and completed objectives
    quest.stages.forEach((stage, index) => {
      const objectiveElement = document.createElement('div');
      objectiveElement.className = `quest-objective ${stage.completed ? 'quest-objective-complete' : ''}`;
      
      // Add checkmark for completed stages or bullet for incomplete
      const marker = stage.completed ? '✓ ' : '• ';
      objectiveElement.textContent = marker + stage.objective;
      
      questObjectives.appendChild(objectiveElement);
      
      // Only show stages up to the current active one plus completed ones
      if (index > quest.currentStageIndex && !stage.completed) {
        objectiveElement.style.display = 'none';
      }
    });
    
    // Add rewards section for active quests
    if (quest.status === window.QUEST_STATUS.ACTIVE && quest.rewards) {
      const rewardsSection = document.createElement('div');
      rewardsSection.className = 'quest-rewards';
      
      // Rewards header
      const rewardsHeader = document.createElement('div');
      rewardsHeader.className = 'rewards-header';
      rewardsHeader.textContent = 'Rewards:';
      rewardsSection.appendChild(rewardsHeader);
      
      // Rewards list
      const rewardsList = document.createElement('div');
      rewardsList.className = 'rewards-list';
      
      if (quest.rewards.experience) {
        const expReward = document.createElement('div');
        expReward.textContent = `${quest.rewards.experience} XP`;
        rewardsList.appendChild(expReward);
      }
      
      if (quest.rewards.taelors) {
        const taelorReward = document.createElement('div');
        taelorReward.textContent = `${quest.rewards.taelors} taelors`;
        rewardsList.appendChild(taelorReward);
      }
      
      if (quest.rewards.items && quest.rewards.items.length > 0) {
        const itemsReward = document.createElement('div');
        const itemNames = quest.rewards.items.map(itemId => {
          const template = window.itemTemplates[itemId];
          return template ? template.name : itemId;
        });
        itemsReward.textContent = itemNames.join(', ');
        rewardsList.appendChild(itemsReward);
      }
      
      rewardsSection.appendChild(rewardsList);
      questElement.appendChild(rewardsSection);
    }
    
    // Assemble the quest item
    questElement.appendChild(questHeader);
    questElement.appendChild(questStatus);
    questElement.appendChild(questDesc);
    questElement.appendChild(questObjectives);
    
    questList.appendChild(questElement);
  });
};

// Connect the initial quest action to the quest progression system
window.handleQuestAction = function(action) {
  // Handle quest-specific actions
  if (action === 'respond_to_quest') {
    console.log('Player responding to quest');
    
    // Find the active quest
    const activeQuest = window.quests.find(q => q.status === window.QUEST_STATUS.ACTIVE);
    
    if (!activeQuest) {
      console.error('No active quest found');
      return false;
    }
    
    // First transition to quest scene
    window.enterQuestScene(activeQuest);
    
    // Set inQuestSequence flag
    window.gameState.inQuestSequence = true;
    
    // Clear awaiting response flag
    window.gameState.awaitingQuestResponse = false;
    
    return true; // Action handled
  }
  
  return false; // Not a handled quest action
};

// Store the original action handler to call from our overrides
window._originalHandleAction = window.handleAction;

// Override the main action handler to include quest-specific actions
window.handleAction = function(action) {
  console.log('Action handled:', action);
  
  // First check if it's a quest-specific action
  if (window.handleQuestAction(action)) {
    return; // Quest action was handled
  }
  
  // Call the original handler for regular actions
  window._originalHandleAction(action);
};

// Create a custom event for day changes
window.dayChangedEvent = new Event('dayChanged');

// Override updateTimeAndDay to dispatch our custom event
const originalUpdateTimeAndDay = window.updateTimeAndDay;
window.updateTimeAndDay = function(minutesToAdd) {
  const oldDay = window.gameDay;
  
  // Call original function
  originalUpdateTimeAndDay(minutesToAdd);
  
  // Check if day changed
  if (window.gameDay > oldDay) {
    // Dispatch the day changed event
    window.dispatchEvent(window.dayChangedEvent);
    
    // Check quest deadlines
    window.checkQuestDeadlines();
  }
};

// Override the narrative functions to work in both scenes
const originalSetNarrative = window.setNarrative;
window.setNarrative = function(text) {
  // Check if we're in quest scene
  if (!document.getElementById('questSceneContainer').classList.contains('hidden')) {
    // Update quest narrative
    const questNarrative = document.getElementById('questNarrative');
    questNarrative.innerHTML = text;
    questNarrative.scrollTop = 0; // Scroll to top
  } else {
    // Use original function for main game
    originalSetNarrative(text);
  }
};

const originalAddToNarrative = window.addToNarrative;
window.addToNarrative = function(text) {
  // Check if we're in quest scene
  if (!document.getElementById('questSceneContainer').classList.contains('hidden')) {
    // Update quest narrative
    const questNarrative = document.getElementById('questNarrative');
    questNarrative.innerHTML += `<p>${text}</p>`;
    questNarrative.scrollTop = questNarrative.scrollHeight; // Scroll to bottom
  } else {
    // Use original function for main game
    originalAddToNarrative(text);
  }
};

// Manual trigger for testing
window.forceAssignQuest = function(questId) {
  window.assignQuest(questId);
};

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Initialize quest system when everything is loaded
  if (typeof window.initializeQuestSystem === 'function') {
    window.initializeQuestSystem();
  }
});