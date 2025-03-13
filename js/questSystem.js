// QUEST SYSTEM MODULE
// Handles quest management, tracking, and progression

// Quest status constants
window.QUEST_STATUS = {
  NOT_STARTED: 'not_started',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Store all active quests
window.quests = [];

// Store all quest templates
window.questTemplates = {
  // Will be populated in initializeQuestTemplates
};

// Initialize the quest system
window.initializeQuestSystem = function() {
  console.log("Initializing quest system...");
  
  // Initialize quest templates
  window.initializeQuestTemplates();
  
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

// Initialize quest templates
// Enhanced quest templates with explicit battle type specifications
window.initializeQuestTemplates = function() {
  // Raid the Frontier quest template with enhanced battle type metadata
  window.questTemplates.raid_frontier = {
    id: 'raid_frontier',
    title: 'Raid the Frontier',
    description: 'The Sarkein has ordered a raid on an Arrasi outpost near the frontier. Prepare your gear and be ready to march at dawn.',
    stages: [
      {
        id: 'stage_dispatch',
        description: 'You\'ve received orders from Sarkein Reval to prepare for a raid on an Arrasi outpost.',
        objective: 'Report to the Sarkein\'s tent for briefing.',
        action: 'report_to_sarkein',
        nextStage: 'stage_preparation',
        // This is just a conversation stage - no combat needed
        battleType: window.BATTLE_TYPES.NARRATIVE
      },
      {
        id: 'stage_preparation',
        description: 'The raid will commence tomorrow at dawn. You have one day to prepare your equipment and rest.',
        objective: 'Prepare for the raid (1 day).',
        action: null, // Auto-advances after a day
        nextStage: 'stage_march',
        // No combat in this preparation stage
        battleType: window.BATTLE_TYPES.NARRATIVE
      },
      {
        id: 'stage_march',
        description: 'Your unit marches toward the frontier, a half-day\'s journey through increasingly rough terrain.',
        objective: 'March to the frontier.',
        action: 'begin_march',
        nextStage: 'stage_scout',
        // Just narrative travel - no combat
        battleType: window.BATTLE_TYPES.NARRATIVE
      },
      {
        id: 'stage_scout',
        description: 'As you approach the outpost, the Sarkein orders a scouting party to assess the enemy\'s defenses.',
        objective: 'Participate in scouting the outpost.',
        action: 'scout_outpost',
        nextStage: 'stage_ambush',
        // Scouting mission - no combat yet
        battleType: window.BATTLE_TYPES.NARRATIVE
      },
      {
        id: 'stage_ambush',
        description: 'While scouting, you encounter an Arrasi patrol. The element of surprise is compromised.',
        objective: 'Deal with the patrol.',
        action: 'combat_patrol',
        nextStage: 'stage_assault',
        // This is a small patrol encounter - use individual combat
        battleType: window.BATTLE_TYPES.INDIVIDUAL,
        enemyType: "ARRASI_VAELGORR",
        successText: "The last Arrasi soldier falls, and your scouting party quickly drags the bodies into the underbrush. The three of you need to report back to the Sarkein quickly.",
        failureText: "You find yourself overwhelmed by the Arrasi patrol. As consciousness fades, you hear shouts of alarm being raised."
      },
      {
        id: 'stage_assault',
        description: 'With the patrol eliminated, your unit must now assault the outpost before reinforcements arrive.',
        objective: 'Assault the Arrasi outpost.',
        action: 'assault_outpost',
        nextStage: 'stage_return',
        // This is a large-scale battle - use formation/shieldwall combat
        battleType: window.BATTLE_TYPES.FORMATION, 
        enemyName: "Arrasi Garrison",
        unitStrength: 80,
        startingCohesion: 85,
        startingMomentum: 10,
        startingPhase: "engagement",
        order: "advance",
        successText: "Your formation holds strong as you breach the outpost walls. The battle is won with minimal casualties!",
        failureText: "Your formation breaks under the sustained assault. The Sarkein orders a retreat as casualties mount."
      },
      {
        id: 'stage_return',
        description: 'The raid was successful. Time to return to camp with the spoils and report to the Sarkein.',
        objective: 'Return to camp and report success.',
        action: 'return_to_camp',
        nextStage: null,
        // No combat in this return stage
        battleType: window.BATTLE_TYPES.NARRATIVE
      }
    ],
    baseReward: {
      experience: 100,
      taelors: 50,
      items: ['healthPotion']
    },
    requiredPreparationDays: 1,
    chanceTrigger: 0.99, // High chance for testing purposes
    minDayToTrigger: 1, // Only available after day 1
    cooldownDays: 5 // Must wait 5 days between assignments of this quest
  };
  
  console.log("Quest templates initialized");
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
    if (existingQuest && (existingQuest.status === window.QUEST_STATUS.ACTIVE || 
                          existingQuest.status === window.QUEST_STATUS.COMPLETED)) {
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
    stages: template.stages.map(stage => ({
      ...stage,
      completed: false
    })),
    assignmentDay: window.gameDay,
    expiryDay: template.requiredPreparationDays ? window.gameDay + template.requiredPreparationDays + 3 : undefined,
    rewards: { ...template.baseReward }
  };
  
  // Add to active quests
  window.quests.push(quest);
  
  // Show notification
  window.showQuestNotification(quest, 'assigned');
  
  // Add quest assignment narrative
  window.addToNarrative(`<strong>New Quest: ${quest.title}</strong><br>${quest.description}`);
  window.addToNarrative(`A messenger approaches you with orders from Sarkein Reval. "The Sarkein requests your presence at once. There's a mission that requires your attention."`);
  
  // Set flag to show we're awaiting quest response
  window.gameState.awaitingQuestResponse = true;
  window.gameState.inQuestSequence = false;
  
  // Clear current actions and add ONLY the quest action button
  const actionsContainer = document.getElementById('actions');
  actionsContainer.innerHTML = ''; // Clear all existing buttons
  window.addActionButton('Report to Sarkein', 'report_to_sarkein_action', actionsContainer);
  
  return true;
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
  updateQuestProgressSteps(quest);
  
  console.log('Entered quest scene for quest:', quest.title);
};

// Function to exit quest scene and return to main game
window.exitQuestScene = function() {
  document.getElementById('questSceneContainer').classList.add('hidden');
  document.getElementById('gameContainer').classList.remove('hidden');
  
  console.log('Exited quest scene');
};

// Update the quest progress steps in the UI
function updateQuestProgressSteps(quest) {
  const stepsContainer = document.getElementById('questProgressSteps');
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
}

// Override the narrative functions to work in both scenes
const originalSetNarrative = window.setNarrative;
window.setNarrative = function(text) {
  // Check if we're in quest scene
  if (!document.getElementById('questSceneContainer').classList.contains('hidden')) {
    // Update quest narrative
    const questNarrative = document.getElementById('questNarrative');
    questNarrative.innerHTML = `<p>${text}</p>`;
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

// Update the quest action buttons
window.updateQuestActionButtons = function(quest) {
  const actionsContainer = document.getElementById('questActions');
  actionsContainer.innerHTML = '';
  
  // Get current stage
  const currentStage = quest.stages[quest.currentStageIndex];
  
  // Special case for preparation stage which doesn't have an action field
  if (currentStage.id === 'stage_preparation') {
    const prepareButton = document.createElement('button');
    prepareButton.className = 'quest-action-btn';
    prepareButton.textContent = 'Prepare for Raid';
    prepareButton.onclick = function() {
      window.handlePrepareForRaid();
    };
    actionsContainer.appendChild(prepareButton);
    return;
  }
  
  // If the stage has an action, add the button for it
  if (currentStage.action) {
    const actionButton = document.createElement('button');
    actionButton.className = 'quest-action-btn';
    
    // Set button text based on the action
    switch(currentStage.action) {
      case 'report_to_sarkein':
        actionButton.textContent = 'Speak with Sarkein';
        break;
      case 'begin_march':
        actionButton.textContent = 'Begin March';
        break;
      case 'scout_outpost':
        actionButton.textContent = 'Scout the Outpost';
        break;
      case 'combat_patrol':
        actionButton.textContent = 'Engage the Patrol';
        break;
      case 'assault_outpost':
        actionButton.textContent = 'Join the Assault';
        break;
      case 'return_to_camp':
        actionButton.textContent = 'Return to Camp';
        break;
      default:
        actionButton.textContent = 'Continue';
    }
    
    // Set the action handler
    actionButton.onclick = function() {
      window.progressQuest(quest.id, currentStage.action);
    };
    
    actionsContainer.appendChild(actionButton);
  }
};

// Progress a quest to the next stage
const originalProgressQuest = window.progressQuest;
window.progressQuest = function(questId, action) {
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
  
  // Verify action matches the current stage's required action
  if (currentStage.action && currentStage.action !== action) {
    console.error(`Action "${action}" does not match required action "${currentStage.action}" for current stage`);
    return false;
  }
  
  // Mark current stage as completed
  currentStage.completed = true;
  
  // Set quest sequence flag to true when player is in an action-required stage
  if (quest.stages[quest.currentStageIndex].action) {
    window.gameState.inQuestSequence = true;
  }
  
  // Clear the awaiting response flag - player has responded to the quest
  window.gameState.awaitingQuestResponse = false;
  
  // Handle stage-specific actions
  window.handleQuestStageAction(quest, currentStage);
  
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
        updateQuestProgressSteps(quest);
        
        // Update action buttons
        window.updateQuestActionButtons(quest);
        
        // Update quest objective
        const newCurrentStage = quest.stages[quest.currentStageIndex];
        document.getElementById('questObjective').textContent = newCurrentStage.objective;
      }
    } else {
      console.error(`Next stage "${currentStage.nextStage}" not found`);
    }
  } else {
    // No next stage, complete the quest
    window.completeQuest(questId);
  }
  
  return true;
};

// Handle quest stage actions
// Function to handle quest stage actions with action matching fix
window.handleQuestStageAction = function(quest, stage) {
  console.log(`Handling quest stage action: ${stage.action}`);
  
  // Set quest sequence flag based on stage
  if (stage.action) {
    // If stage requires a specific action, we're in a quest sequence
    window.gameState.inQuestSequence = true;
  } else {
    // For stages like preparation that don't require immediate action
    window.gameState.inQuestSequence = false;
  }
  
  // Branch based on the stage ID instead of the action
  // This fixes the action mismatch error
  switch(stage.id) {
    case 'stage_dispatch':
      window.handleReportToSarkein(quest);
      break;
      
    case 'stage_march':
      window.handleBeginMarch(quest);
      break;
      
    case 'stage_scout':
      window.handleScoutOutpost(quest);
      break;
      
    case 'stage_ambush':
      window.handleCombatPatrol(quest);
      break;
      
    case 'stage_assault':
      window.handleAssaultOutpost(quest);
      break;
      
    case 'stage_return':
      window.handleReturnToCamp(quest);
      break;
      
    default:
      console.log(`No special handling for stage: ${stage.id}`);
      
      // Check if we have a generic action handler for this stage action
      if (stage.action && typeof window[`handle${stage.action.charAt(0).toUpperCase() + stage.action.slice(1)}`] === 'function') {
        window[`handle${stage.action.charAt(0).toUpperCase() + stage.action.slice(1)}`](quest);
      }
  }
};

// Complete a quest
const originalCompleteQuest = window.completeQuest;
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
  
  // Apply rewards
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
        }
      });
    }
  }
  
  // Show completion notification
  window.showQuestNotification(quest, 'completed');
  
  // Update quest log if visible
  window.renderQuestLog();
  
  // Check for level up
  window.checkLevelUp();
  
  // Exit quest scene if we're in it
  if (!document.getElementById('questSceneContainer').classList.contains('hidden')) {
    window.exitQuestScene();
  }
  
  // Update action buttons to show regular camp actions
  window.updateActionButtons();
  
  return true;
};

// Fail a quest
const originalFailQuest = window.failQuest;
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
        window.addToNarrative(`You have failed to complete the quest "${quest.title}" in time. The opportunity has passed.`);
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

// Render quest log UI
window.renderQuestLog = function() {
  const questList = document.getElementById('questList');
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

// Quest stage handler functions
window.handleReportToSarkein = function(quest) {
  window.setNarrative(`
    <p>Your Vayren orders you to report to the command tent with the rest of your Squad. The interior is sparse but organized, with maps of the frontier spread across a sturdy wooden table. Sarkein Reval, a weathered veteran with a scar crossing his left eye, addresses the assembled soldiers.</p>
    
    <p>"Listen well," he says, his voice carrying throughout the tent. "Our scouts have identified an Arrasi outpost near the frontier that's been a staging ground for raids on our supply lines. Our Spear Host has been selected to neutralize it."</p>
    
    <p>He points to a location on the map. "The outpost is here, a half-day's march to the west. It's lightly garrisoned - perhaps twenty men - but they have good visibility of the surrounding area. We'll need to move quickly and quietly."</p>
    
    <p>"Your objective is to disable the outpost - eliminate the garrison, destroy any supplies, and burn the structures. We move out at dawn tomorrow. Use today to prepare."</p>
    
    <p>The Sarkein looks over the gathered soldiers with a steady gaze. "Any questions?"</p>
    
    <p>When no one speaks up, he dismisses the assembly. "Prepare well. The Empire depends on it."</p>
  `);
  
  // Update action buttons to reflect preparation
  window.updateQuestActionButtons(quest);
};

window.handleBeginMarch = function(quest) {
  window.setNarrative(`
    <p>Dawn breaks with a blood-red sun as your Spear Host assembles at the camp's edge. The Sarkein inspects the units briefly, then gives the order to move out. The column of soldiers winds its way westward, shields and spears glinting in the early morning light.</p>
    
    <p>The terrain grows increasingly rugged as you approach the frontier. The column moves in practiced silence, with scouts ranging ahead and to the flanks. Dust clings to your armor and throat as the hours pass.</p>
    
    <p>By midday, you've reached a ridge overlooking a shallow valley. The Sarkein calls for a halt and gathers the Vayrens of each Squad.</p>
    
    <p>"The outpost is just beyond that next rise," he says, pointing westward. "We'll need to scout it properly before we commit to an attack."</p>
    
    <p>Your Vayren returns to your Squad with orders. "Our unit is to provide a small scouting party to circle north and assess their defenses. Three soldiers. Ready yourselves."</p>
    
    <p>The Vayren points to you and two others. "You three, move out. Circle around, observe guard positions, routines, and any weak points. Report back within the hour."</p>
  `);
  
  // Update quest action buttons
  window.updateQuestActionButtons(quest);
};

window.handleScoutOutpost = function(quest) {
  window.setNarrative(`
    <p>Your small scouting party - consisting of you and two fellow soldiers from your Squad - begins circling wide around the valley to approach the outpost from the north. One of your companions is a quiet Nesian with sharp eyes, the other a burly Paanic veteran.</p>
    
    <p>Moving from cover to cover, you gradually work your way closer to the Arrasi position. The outpost comes into view: a wooden palisade surrounding several structures, with a larger central building that appears to be the command post. Two watchtowers stand at opposite corners, each manned by a single guard.</p>
    
    <p>Your trio holds position while you take turns crawling forward to a better vantage point. From here, you can see movement within the compound - perhaps fifteen to twenty soldiers moving with the casual confidence of men who don't expect trouble.</p>
    
    <p>As you're about to retreat and report your findings, you hear voices approaching. An Arrasi patrol is coming your way, following a path that will take them directly past your position!</p>
  `);
  
  // Update quest action buttons
  window.updateQuestActionButtons(quest);
};

window.handleCombatPatrol = function(quest) {
  window.setNarrative(`
    <p>Your scouting party exchanges urgent signals as the patrol approaches. There are four Arrasi soldiers - too many to let pass, too many to ambush without risk of raising the alarm.</p>
    
    <p>You ready your weapons as the patrol draws closer, hearts pounding, knowing that the success of the entire mission now hinges on silencing these men quickly and quietly...</p>
  `);
  
  // Initiate combat with an Arrasi patrol
  setTimeout(() => {
    // Use existing combat system
    window.combatSystem.initiateCombat("ARRASI_VAELGORR");
    
    // Store the original end combat function so we can override it
    const originalEndCombat = window.combatSystem.endCombat;
    
    // Override the endCombat function to continue the quest after combat
    window.combatSystem.endCombat = function(outcome) {
      // Call the original function first
      originalEndCombat.call(window.combatSystem, outcome);
      
      // Restore the original function
      window.combatSystem.endCombat = originalEndCombat;
      
      // Continue the quest only if player won
      if (outcome === true) {
        setTimeout(() => {
          window.addToNarrative(`
            <p>The last Arrasi soldier falls, and your scouting party quickly drags the bodies into the underbrush. One soldier checks the trail in both directions, then gives the all-clear sign.</p>
            
            <p>"That was too close," mutters one of your companions as he cleans his blade. "The outpost will notice they're missing soon."</p>
            
            <p>You nod grimly. The three of you need to report back to the Sarkein quickly. Your element of surprise won't last long.</p>
          `);
          
          // Add action button to continue
          const activeQuest = window.quests.find(q => q.status === window.QUEST_STATUS.ACTIVE);
          window.updateQuestActionButtons(activeQuest);
          
          // Add the "Return to the Sarkein" action button
          const actionsContainer = document.getElementById('questActions');
          const returnButton = document.createElement('button');
          returnButton.className = 'quest-action-btn';
          returnButton.textContent = 'Return to the Main Force';
          returnButton.onclick = function() {
            window.addToNarrative(`
              <p>Your scouting party hurries back to the main force and reports your findings to the Sarkein, including the patrol you eliminated.</p>
              
              <p>"Good work handling that patrol," he says grimly, "but we've lost the luxury of time. We attack now, before they realize something's wrong."</p>
              
              <p>He rapidly issues orders, dividing the Spear Host into three assault groups.</p>
            `);
            
            // Progress to the assault stage
            window.progressQuest(activeQuest.id, 'assault_outpost');
          };
          actionsContainer.appendChild(returnButton);
          
        }, 1500);
      }
      else {
        // Player lost the combat - fail the quest
        setTimeout(() => {
          window.failQuest(quest.id);
          window.addToNarrative(`
            <p>You find yourself overwhelmed by the Arrasi patrol. As consciousness fades, you hear shouts of alarm being raised.</p>
            
            <p>Hours later, you awaken, having been dragged back to safety by your fellow scouts, who managed to escape. The mission is a failure, and the Sarkein's disappointment is palpable.</p>
          `);
          
          // Resume normal actions
          window.updateActionButtons();
        }, 1500);
      }
    };
  }, 1500);
};

window.handleAssaultOutpost = function(quest) {
  window.setNarrative(`
    <p>The Sarkein divides your Spear Host into three assault groups. "First group will create a diversion at the main gate. Second group will scale the eastern wall. Third group, with me, will breach from the west once their attention is divided."</p>
    
    <p>Your Squad is assigned to the second group, tasked with scaling the eastern wall. The plan is set, and with grim determination, your forces move into position.</p>
    
    <p>The attack begins with a barrage of flaming arrows arcing toward the front gate. Shouts of alarm erupt from within the outpost. As the Arrasi soldiers rush to defend the main entrance, your group hurries toward the eastern wall with scaling ladders.</p>
  `);
  
  // Initiate the assault combat
  setTimeout(() => {
    // Use existing combat system for a tougher enemy
    window.combatSystem.initiateCombat("ARRASI_DRUSKARI");
    
    // Store the original end combat function so we can override it
    const originalEndCombat = window.combatSystem.endCombat;
    
    // Override the endCombat function to continue the quest after combat
    window.combatSystem.endCombat = function(outcome) {
      // Call the original function first
      originalEndCombat.call(window.combatSystem, outcome);
      
      // Restore the original function
      window.combatSystem.endCombat = originalEndCombat;
      
      // Continue the quest only if player won
      if (outcome === true) {
        setTimeout(() => {
          window.addToNarrative(`
            <p>The fighting is intense but brief. The Arrasi garrison, caught between three attacking forces, is quickly overwhelmed. Within minutes, the outpost is secured.</p>
            
            <p>The Sarkein moves efficiently through the compound, directing units to gather intelligence, supplies, and set fire to the structures. Your unit helps secure several prisoners and discovers a cache of maps showing Arrasi patrol routes and supply lines - valuable intelligence for the Paanic command.</p>
            
            <p>"Good work, soldiers," the Sarkein announces as the outpost burns behind him. "We've cut off their eyes in this sector and gained critical information. Now we return to camp before reinforcements arrive."</p>
            
            <p>The march back is swift but cautious. Your mission is a clear success, and you feel a surge of pride at having contributed to the Paanic cause, even as a lowly soldier in the Spear Host.</p>
          `);
          
          // Add action button to complete mission
          const activeQuest = window.quests.find(q => q.status === window.QUEST_STATUS.ACTIVE);
          window.updateQuestActionButtons(activeQuest);
          
          // Add the "Return to Camp" action button
          const actionsContainer = document.getElementById('questActions');
          const returnButton = document.createElement('button');
          returnButton.className = 'quest-action-btn';
          returnButton.textContent = 'Return to Camp';
          returnButton.onclick = function() {
            window.progressQuest(activeQuest.id, 'return_to_camp');
          };
          actionsContainer.appendChild(returnButton);
          
        }, 1500);
      }
      else {
        // Player lost the combat - fail the quest
        setTimeout(() => {
          window.failQuest(quest.id);
          window.addToNarrative(`
            <p>The assault goes poorly. The Arrasi defenders are more numerous and better prepared than expected. As casualties mount, the Sarkein gives the order to withdraw.</p>
            
            <p>Your Spear Host retreats under covering fire, dragging wounded comrades back to safety. The mission is a failure, and the frontier will remain vulnerable to Arrasi raids.</p>
            
            <p>Back at camp, the Sarkein addresses the soldiers with a somber voice. "We'll have another opportunity," he says, though the disappointment in his voice is clear. "Rest and recover. The Empire still needs its soldiers."</p>
          `);
          
          // Resume normal actions
          window.updateActionButtons();
        }, 1500);
      }
    };
  }, 1500);
};

window.handleReturnToCamp = function(quest) {
  window.setNarrative(`
    <p>Your Spear Host returns to camp victorious, bearing captured supplies and valuable intelligence. The elimination of the Arrasi outpost represents a significant blow to enemy operations in the region.</p>
    
    <p>Later that evening, the Vayren calls for you. "Report to the Sarkein's tent," he orders. "Apparently, he wants to hear about the scouting mission from someone who was there."</p>
    
    <p>When you arrive at the command tent, Sarkein Reval is studying the captured maps. He acknowledges your salute with a nod.</p>
    
    <p>"Your Squad performed well today," he says, sliding a small pouch of taelors across the table toward you. "This is for your unit. The intelligence we recovered will help us plan our next moves in this sector."</p>
    
    <p>He studies the maps thoughtfully. "Tell your Vayren that I'll be looking to his unit for future operations. The Empire needs soldiers who can think and act decisively."</p>
    
    <p>As you leave the Sarkein's tent, there's a new respect in the eyes of your fellow soldiers. Your Squad's actions today have made a difference, and your reputation within the Kasvaari has grown.</p>
  `);
  
  // Show notification of quest completion
  window.updateActionButtons();
  
  // Complete the quest with a short delay
  setTimeout(() => {
    window.completeQuest(quest.id);
  }, 3000);
};

// Call when "prepare for raid" action is selected
window.handlePrepareForRaid = function() {
  window.setNarrative(`
    <p>You spend the day preparing for tomorrow's raid. You inspect your equipment, carefully checking your armor for weak spots and ensuring your weapons are in good condition. You also visit the quartermaster to procure any necessary supplies.</p>
    
    <p>Around camp, other soldiers are similarly engaged in preparation. Some practice formations, others sharpen blades or repair armor. There's a quiet tension in the air - the anticipation of combat.</p>
    
    <p>You take time to rest and mentally prepare yourself for what lies ahead. Tomorrow will bring danger, but also an opportunity to prove your worth to the Kasvaari.</p>
  `);
  
  // Find the raid frontier quest
  const raidQuest = window.quests.find(q => q.templateId === 'raid_frontier' && q.status === window.QUEST_STATUS.ACTIVE);
  
  if (raidQuest) {
    // Advance time by a full day
    window.updateTimeAndDay(1440); // 24 hours
    
    // Progress to the next stage
    window.progressQuest(raidQuest.id, null); // null action as this auto-advances
    
    // Add a follow-up message about the next morning
    setTimeout(() => {
      window.addToNarrative(`
        <p>The night passes quickly, and before you know it, dawn is approaching. You wake up feeling prepared for the mission ahead. The Kasvaari camp is already stirring with activity as soldiers prepare for the raid.</p>
      `);
      
      // Update action buttons for the next stage
      window.updateQuestActionButtons(raidQuest);
    }, 1000);
  }
};

// Connect the initial quest action to the quest progression system
window.handleQuestAction = function(action) {
  // Handle quest-specific actions
  if (action === 'report_to_sarkein_action') {
    console.log('Report to Sarkein action triggered');
    
    // Find the active quest (should be the raid_frontier quest)
    const activeQuest = window.quests.find(q => q.status === window.QUEST_STATUS.ACTIVE);
    
    if (!activeQuest) {
      console.error('No active quest found');
      return false;
    }
    
    // First transition to quest scene
    window.enterQuestScene(activeQuest);
    
    // Update quest action buttons
    window.updateQuestActionButtons(activeQuest);
    
    // Set inQuestSequence flag
    window.gameState.inQuestSequence = true;
    
    // Clear awaiting response flag
    window.gameState.awaitingQuestResponse = false;
    
    return true; // Action handled
  }
  
  // Add other quest action handlers here as needed
  
  return false; // Not a handled quest action
};

// Store the original action handler to call from our overrides
window.originalHandleAction = window.handleAction;

// Override the main action handler to include quest-specific actions
window.handleAction = function(action) {
  console.log('Action handled:', action);
  
  // First check if it's a quest-specific action
  if (window.handleQuestAction(action)) {
    return; // Quest action was handled
  }
  
  // Handle quest-specific actions
  if (action === 'prepare_for_raid') {
    window.handlePrepareForRaid();
    return;
  }
  
  // Call the original handler for regular actions
  window.originalHandleAction(action);
};

// Add event listeners
document.addEventListener('DOMContentLoaded', function() {
  // Initialize quest system when everything is loaded
  if (typeof window.initializeQuestSystem === 'function') {
    window.initializeQuestSystem();
  }
  
  // Add quest log button handler if it doesn't exist
  document.querySelector('.control-btn[onclick="handleQuestLog()"]')?.addEventListener('click', function() {
    window.handleQuestLog();
  });
  
  // Add day change event listener
  window.addEventListener('dayChanged', function() {
    window.checkQuestDeadlines();
  });
});

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
    
    // Check for quest assignment
    window.checkForQuestAssignment();
  }
};

// Manual trigger for testing - will assign the raid quest regardless of chance
window.forceAssignRaidQuest = function() {
  window.assignQuest('raid_frontier');
};
