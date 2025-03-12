// QUEST SYSTEM MODULE - Scene-Based Approach
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
window.initializeQuestTemplates = function() {
  // Raid the Frontier quest template
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
        nextStage: 'stage_preparation'
      },
      {
        id: 'stage_preparation',
        description: 'The raid will commence tomorrow at dawn. You have one day to prepare your equipment and rest.',
        objective: 'Prepare for the raid (1 day).',
        action: null, // Auto-advances after a day
        nextStage: 'stage_march'
      },
      {
        id: 'stage_march',
        description: 'Your unit marches toward the frontier, a half-day\'s journey through increasingly rough terrain.',
        objective: 'March to the frontier.',
        action: 'begin_march',
        nextStage: 'stage_scout'
      },
      {
        id: 'stage_scout',
        description: 'As you approach the outpost, the Sarkein orders a scouting party to assess the enemy\'s defenses.',
        objective: 'Participate in scouting the outpost.',
        action: 'scout_outpost',
        nextStage: 'stage_ambush'
      },
      {
        id: 'stage_ambush',
        description: 'While scouting, you encounter an Arrasi patrol. The element of surprise is compromised.',
        objective: 'Deal with the patrol.',
        action: 'combat_patrol',
        nextStage: 'stage_assault'
      },
      {
        id: 'stage_assault',
        description: 'With the patrol eliminated, your unit must now assault the outpost before reinforcements arrive.',
        objective: 'Assault the Arrasi outpost.',
        action: 'assault_outpost',
        nextStage: 'stage_return'
      },
      {
        id: 'stage_return',
        description: 'The raid was successful. Time to return to camp with the spoils and report to the Sarkein.',
        objective: 'Return to camp and report success.',
        action: 'return_to_camp',
        nextStage: null
      }
    ],
    baseReward: {
      experience: 100,
      taelors: 50,
      items: ['healthPotion']
    },
    requiredPreparationDays: 1,
    chanceTrigger: 0.99, // 15% chance per day when eligible
    minDayToTrigger: 1, // Only available after day 3
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
  
  // Add a special action button to report to the Sarkein
  window.updateActionButtons();
  window.addActionButton('Report to Sarkein', 'report_to_sarkein_action', document.getElementById('actions'));
  
  return true;
};

// Progress a quest to the next stage
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
  
  // Handle stage-specific actions
  window.handleQuestStageAction(quest, currentStage);
  
  // Advance to next stage if there is one
  if (currentStage.nextStage) {
    const nextStageIndex = quest.stages.findIndex(s => s.id === currentStage.nextStage);
    if (nextStageIndex !== -1) {
      quest.currentStageIndex = nextStageIndex;
      
      // Show notification
      window.showQuestNotification(quest, 'updated');
      
      // Update quest UI if in quest scene
      window.updateQuestSceneUI(quest);
      
      // Update quest log if visible
      window.renderQuestLog();
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
window.handleQuestStageAction = function(quest, stage) {
  console.log(`Handling quest stage action: ${stage.action}`);
  
  // Branch based on the action
  switch(stage.action) {
    case 'report_to_sarkein':
      window.handleReportToSarkein(quest);
      break;
      
    case 'begin_march':
      window.handleBeginMarch(quest);
      break;
      
    case 'scout_outpost':
      window.handleScoutOutpost(quest);
      break;
      
    case 'combat_patrol':
      window.handleCombatPatrol(quest);
      break;
      
    case 'assault_outpost':
      window.handleAssaultOutpost(quest);
      break;
      
    case 'return_to_camp':
      window.handleReturnToCamp(quest);
      break;
      
    default:
      console.log(`No special handling for action: ${stage.action}`);
  }
};

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
  
  // Return to regular game view
  window.exitQuestScene();
  
  // Check for level up
  window.checkLevelUp();
  
  return true;
};

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
  
  // Show failure notification
  window.showQuestNotification(quest, 'failed');
  
  // Update quest log if visible
  window.renderQuestLog();
  
  // Return to regular game view
  window.exitQuestScene();
  
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

// QUEST SCENE FUNCTIONS

// Enter quest scene with the specified quest
window.enterQuestScene = function(quest) {
  console.log("Entering quest scene for:", quest.title);
  
  // Hide game container and show quest scene
  document.getElementById('gameContainer').classList.add('hidden');
  document.getElementById('questSceneContainer').classList.remove('hidden');
  
  // Set up quest scene UI
  document.getElementById('questTitle').textContent = quest.title;
  
  // Update objective
  const currentStage = quest.stages[quest.currentStageIndex];
  document.getElementById('questObjective').textContent = currentStage.objective;
  
  // Copy over time and day display
  document.getElementById('questTimeDisplay').textContent = document.getElementById('timeDisplay').textContent;
  document.getElementById('questDayDisplay').textContent = document.getElementById('dayDisplay').textContent;
  
  // Copy day/night indicator class
  document.getElementById('questDayNightIndicator').className = document.getElementById('dayNightIndicator').className;
  
  // Update status bars
  document.getElementById('questHealthValue').textContent = document.getElementById('healthValue').textContent;
  document.getElementById('questHealthBar').style.width = document.getElementById('healthBar').style.width;
  
  document.getElementById('questStaminaValue').textContent = document.getElementById('staminaValue').textContent;
  document.getElementById('questStaminaBar').style.width = document.getElementById('staminaBar').style.width;
  
  document.getElementById('questMoraleValue').textContent = document.getElementById('moraleValue').textContent;
  document.getElementById('questMoraleBar').style.width = document.getElementById('moraleBar').style.width;
  
  // Create progress steps visualization
  updateQuestProgressSteps(quest);
  
  // Update action buttons
  updateQuestActionButtons(quest);
};

// Exit quest scene
window.exitQuestScene = function() {
  console.log("Exiting quest scene");
  
  // Hide quest scene and show game container
  document.getElementById('questSceneContainer').classList.add('hidden');
  document.getElementById('gameContainer').classList.remove('hidden');
  
  // Update regular game UI
  window.updateStatusBars();
  window.updateActionButtons();
};

// Update quest scene UI based on current quest state
window.updateQuestSceneUI = function(quest) {
  console.log("Updating quest scene UI");
  
  // Update objective
  const currentStage = quest.stages[quest.currentStageIndex];
  document.getElementById('questObjective').textContent = currentStage.objective;
  
  // Update progress steps
  updateQuestProgressSteps(quest);
  
  // Update quest action buttons
  updateQuestActionButtons(quest);
  
  // Update status bars
  updateQuestStatusBars();
};

// Update quest progress steps visualization
function updateQuestProgressSteps(quest) {
  const progressSteps = document.getElementById('questProgressSteps');
  progressSteps.innerHTML = '';
  
  quest.stages.forEach((stage, index) => {
    // Only show completed stages and the current one
    if (index <= quest.currentStageIndex || stage.completed) {
      const stepElement = document.createElement('div');
      stepElement.className = 'quest-step';
      
      const markerElement = document.createElement('div');
      markerElement.className = 'step-marker';
      
      if (stage.completed) {
        markerElement.classList.add('completed');
        markerElement.innerHTML = '✓';
      } else if (index === quest.currentStageIndex) {
        markerElement.classList.add('current');
      }
      
      const contentElement = document.createElement('div');
      contentElement.className = 'step-content';
      
      if (stage.completed) {
        contentElement.classList.add('completed');
      } else if (index === quest.currentStageIndex) {
        contentElement.classList.add('current');
      }
      
      contentElement.textContent = stage.objective;
      
      stepElement.appendChild(markerElement);
      stepElement.appendChild(contentElement);
      progressSteps.appendChild(stepElement);
    }
  });
}

// Update quest status bars
function updateQuestStatusBars() {
  // Copy from main status bars
  document.getElementById('questHealthValue').textContent = document.getElementById('healthValue').textContent;
  document.getElementById('questHealthBar').style.width = document.getElementById('healthBar').style.width;
  
  document.getElementById('questStaminaValue').textContent = document.getElementById('staminaValue').textContent;
  document.getElementById('questStaminaBar').style.width = document.getElementById('staminaBar').style.width;
  
  document.getElementById('questMoraleValue').textContent = document.getElementById('moraleValue').textContent;
  document.getElementById('questMoraleBar').style.width = document.getElementById('moraleBar').style.width;
}

// Update quest action buttons
function updateQuestActionButtons(quest) {
  const actionsContainer = document.getElementById('questActions');
  actionsContainer.innerHTML = '';
  
  const currentStage = quest.stages[quest.currentStageIndex];
  
  // Add appropriate action button based on current stage
  if (currentStage.action) {
    switch (currentStage.action) {
      case 'report_to_sarkein':
        addQuestActionButton('Meet with the Sarkein', 'report_to_sarkein_action', actionsContainer);
        break;
        
      case 'begin_march':
        addQuestActionButton('Begin the March', 'begin_march_action', actionsContainer);
        break;
        
      case 'scout_outpost':
        addQuestActionButton('Scout the Outpost', 'scout_outpost_action', actionsContainer);
        break;
        
      case 'combat_patrol':
        addQuestActionButton('Deal with the Patrol', 'combat_patrol_action', actionsContainer);
        break;
        
      case 'assault_outpost':
        addQuestActionButton('Begin the Assault', 'assault_outpost_action', actionsContainer);
        break;
        
      case 'return_to_camp':
        addQuestActionButton('Return to Camp', 'return_to_camp_action', actionsContainer);
        break;
        
      default:
        addQuestActionButton('Continue Quest', 'continue_quest_action', actionsContainer);
    }
  } else if (currentStage.id === 'stage_preparation') {
    // Special case for preparation stage
    addQuestActionButton('Prepare for Raid', 'prepare_for_raid', actionsContainer);
  }
}

// Add a quest action button
function addQuestActionButton(label, action, container) {
  const btn = document.createElement('button');
  btn.className = 'quest-action-btn';
  btn.textContent = label;
  btn.setAttribute('data-action', action);
  btn.onclick = function() {
    window.handleQuestAction(action);
  };
  container.appendChild(btn);
}

// Handle quest action button click
window.handleQuestAction = function(action) {
  console.log('Quest action handled:', action);
  
  // Find the active quest
  const activeQuest = window.quests.find(q => q.status === window.QUEST_STATUS.ACTIVE);
  if (!activeQuest) {
    console.error("No active quest found");
    return;
  }
  
  const currentStage = activeQuest.stages[activeQuest.currentStageIndex];
  
  switch(action) {
    case 'report_to_sarkein_action':
      // First action of the quest - enter quest scene
      window.enterQuestScene(activeQuest);
      window.setQuestNarrative(`
        <p>You make your way to Sarkein Reval's command tent. The interior is sparse but organized, with maps of the frontier spread across a sturdy wooden table. The Sarkein, a weathered veteran with a scar crossing his left eye, looks up as you enter.</p>
        
        <p>"Ah, good. You're here," he says, gesturing for you to approach the table. "I have a mission for your spear host. Our scouts have identified an Arrasi outpost near the frontier that's been a staging ground for raids on our supply lines. We need to neutralize it."</p>
        
        <p>He points to a location on the map. "The outpost is here, a half-day's march to the west. It's lightly garrisoned - perhaps twenty men - but they have good visibility of the surrounding area. We'll need to move quickly and quietly."</p>
        
        <p>"Your objective is to disable the outpost - eliminate the garrison, destroy any supplies, and burn the structures. We move out at dawn tomorrow. Use today to prepare."</p>
        
        <p>The Sarkein fixes you with a steady gaze. "Any questions?"</p>
      `);
      window.progressQuest(activeQuest.id, 'report_to_sarkein');
      break;
      
    case 'prepare_for_raid':
      window.setQuestNarrative(`
        <p>You spend the day preparing for tomorrow's raid. You inspect your equipment, carefully checking your armor for weak spots and ensuring your weapons are in good condition. You also visit the quartermaster to procure any necessary supplies.</p>
        
        <p>Around camp, other soldiers are similarly engaged in preparation. Some practice formations, others sharpen blades or repair armor. There's a quiet tension in the air - the anticipation of combat.</p>
        
        <p>You take time to rest and mentally prepare yourself for what lies ahead. Tomorrow will bring danger, but also an opportunity to prove your worth to the Kasvaari.</p>
      `);
      
      // Advance time by a full day
      window.updateTimeAndDay(1440); // 24 hours
      
      // Progress to the next stage
      window.progressQuest(activeQuest.id, null); // null action as this auto-advances
      break;
      
    case 'begin_march_action':
      window.setQuestNarrative(`
        <p>Dawn breaks with a blood-red sun as your unit assembles at the camp's edge. The Sarkein inspects the troops briefly, then gives the order to move out. The column of soldiers winds its way westward, shields and spears glinting in the early morning light.</p>
        
        <p>The terrain grows increasingly rugged as you approach the frontier. The column moves in practiced silence, with scouts ranging ahead and to the flanks. Dust clings to your armor and throat as the hours pass.</p>
        
        <p>By midday, you've reached a ridge overlooking a shallow valley. The Sarkein calls for a halt and gathers the squad leaders.</p>
        
        <p>"The outpost is just beyond that next rise," he says, pointing westward. "We'll need to scout it properly before we commit to an attack. I need a small team to approach from the north and assess their defenses."</p>
        
        <p>He turns to you. "Take two others and circle around. I want to know guard positions, routines, and any weak points. Report back within the hour."</p>
      `);
      window.progressQuest(activeQuest.id, 'begin_march');
      break;
      
    case 'scout_outpost_action':
      window.setQuestNarrative(`
        <p>You select two experienced soldiers - Fen, a quiet Nesian with sharp eyes, and Dorrel, a burly Paanic veteran - and begin circling wide around the valley to approach the outpost from the north.</p>
        
        <p>Moving from cover to cover, you gradually work your way closer to the Arrasi position. The outpost comes into view: a wooden palisade surrounding several structures, with a larger central building that appears to be the command post. Two watchtowers stand at opposite corners, each manned by a single guard.</p>
        
        <p>You signal Fen and Dorrel to hold position while you crawl forward to a better vantage point. From here, you can see movement within the compound - perhaps fifteen to twenty soldiers moving with the casual confidence of men who don't expect trouble.</p>
        
        <p>As you're about to retreat and report your findings, you hear voices approaching. An Arrasi patrol is coming your way, following a path that will take them directly past your position!</p>
      `);
      window.progressQuest(activeQuest.id, 'scout_outpost');
      break;
      
    case 'combat_patrol_action':
      window.setQuestNarrative(`
        <p>You signal urgently to Fen and Dorrel as the patrol approaches. There are four Arrasi soldiers - too many to let pass, too many to ambush without risk of raising the alarm.</p>
        
        <p>You ready your weapons as the patrol draws closer, hearts pounding, knowing that the success of the entire mission now hinges on silencing these men quickly and quietly...</p>
      `);
      
      // Initiate combat with an Arrasi patrol
      setTimeout(() => {
        // Store quest narrative for safe keeping
        const narrativeElement = document.getElementById('questNarrative');
        const originalNarrative = narrativeElement.innerHTML;
        
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
          
          // Restore the quest narrative that was there before combat
          document.getElementById('questNarrative').innerHTML = originalNarrative;
          
          // Continue the quest only if player won
          if (outcome === true) {
            setTimeout(() => {
              window.addToQuestNarrative(`
                <p>The last Arrasi soldier falls, and you quickly drag the bodies into the underbrush. Fen checks the trail in both directions, then gives the all-clear sign.</p>
                
                <p>"That was too close," Dorrel mutters, cleaning his blade. "The outpost will notice they're missing soon."</p>
                
                <p>"We need to report back and move quickly. Our element of surprise won't last long."</p>
              `);
              
              setTimeout(() => {
                window.addToQuestNarrative(`
                  <p>You hurry back to the main force and report your findings to the Sarkein, including the patrol you eliminated.</p>
                  
                  <p>"Good work handling that patrol," he says grimly, "but we've lost the luxury of time. We attack now, before they realize something's wrong."</p>
                  
                  <p>He rapidly issues orders, dividing the force into three groups for the assault.</p>
                `);
                
                // Progress to the assault stage
                window.progressQuest(activeQuest.id, 'combat_patrol');
              }, 2000);
            }, 1000);
          }
          else {
            // Player lost the combat - fail the quest
            setTimeout(() => {
              window.addToQuestNarrative(`
                <p>You find yourself overwhelmed by the Arrasi patrol. As consciousness fades, you hear shouts of alarm being raised.</p>
                
                <p>Hours later, you awaken, having been dragged back to safety by Fen and Dorrel, who managed to escape. The mission is a failure, and the Sarkein's disappointment is palpable.</p>
              `);
              
              // Fail the quest after a short delay
              setTimeout(() => {
                window.failQuest(activeQuest.id);
              }, 3000);
            }, 1500);
          }
        };
      }, 1500);
      break;
      
    case 'assault_outpost_action':
      window.setQuestNarrative(`
        <p>The Sarkein divides your forces into three groups. "First group will create a diversion at the main gate. Second group will scale the eastern wall. Third group, with me, will breach from the west once their attention is divided."</p>
        
        <p>You're assigned to the second group, tasked with scaling the eastern wall. The plan is set, and with grim determination, your forces move into position.</p>
        
        <p>The attack begins with a barrage of flaming arrows arcing toward the front gate. Shouts of alarm erupt from within the outpost. As the Arrasi soldiers rush to defend the main entrance, your group hurries toward the eastern wall with scaling ladders.</p>
      `);
      
      // Initiate the assault combat
      setTimeout(() => {
        // Store quest narrative for safe keeping
        const narrativeElement = document.getElementById('questNarrative');
        const originalNarrative = narrativeElement.innerHTML;
        
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
          
          // Restore the quest narrative that was there before combat
          document.getElementById('questNarrative').innerHTML = originalNarrative;
          
          // Continue the quest only if player won
          if (outcome === true) {
            setTimeout(() => {
              window.addToQuestNarrative(`
                <p>The fighting is intense but brief. The Arrasi garrison, caught between three attacking forces, is quickly overwhelmed. Within minutes, the outpost is secured.</p>
                
                <p>The Sarkein moves efficiently through the compound, directing soldiers to gather intelligence, supplies, and set fire to the structures. You help secure several prisoners and discover a cache of maps showing Arrasi patrol routes and supply lines - valuable intelligence for the Paanic command.</p>
                
                <p>"Good work, all of you," the Sarkein says as the outpost burns behind him. "We've cut off their eyes in this sector and gained critical information. Now we return to camp before reinforcements arrive."</p>
                
                <p>The march back is swift but cautious. Your mission is a clear success, and you feel a surge of pride at having contributed to the Paanic cause.</p>
              `);
              
              // Update quest UI
              window.progressQuest(activeQuest.id, 'assault_outpost');
            }, 1500);
          }
          else {
            // Player lost the combat - fail the quest
            setTimeout(() => {
              window.addToQuestNarrative(`
                <p>The assault goes poorly. The Arrasi defenders are more numerous and better prepared than expected. As casualties mount, the Sarkein gives the order to withdraw.</p>
                
                <p>Your force retreats under covering fire, dragging wounded comrades back to safety. The mission is a failure, and the frontier will remain vulnerable to Arrasi raids.</p>
                
                <p>Back at camp, the Sarkein is somber. "We'll have another opportunity," he says, though the disappointment in his voice is clear. "Rest and recover. The Empire still needs its soldiers."</p>
              `);
              
              // Fail the quest after a short delay
              setTimeout(() => {
                window.failQuest(activeQuest.id);
              }, 3000);
            }, 1500);
          }
        };
      }, 1500);
      break;
      
    case 'return_to_camp_action':
      window.setQuestNarrative(`
        <p>Your unit returns to camp victorious, bearing captured supplies and valuable intelligence. The elimination of the Arrasi outpost represents a significant blow to enemy operations in the region.</p>
        
        <p>Later that evening, the Sarkein summons you to his tent. "Your performance today was exemplary," he says, sliding a small pouch of taelors across the table toward you. "The intelligence we recovered will help us plan our next moves in this sector."</p>
        
        <p>He studies you thoughtfully. "I'll remember your initiative when it comes time to assign future missions. The Empire needs soldiers who can think and act decisively."</p>
        
        <p>As you leave the Sarkein's tent, there's a new respect in the eyes of your fellow soldiers. Your actions today have made a difference, and your reputation within the Kasvaari has grown.</p>
      `);
      
      // Complete the quest with a short delay
      setTimeout(() => {
        window.progressQuest(activeQuest.id, 'return_to_camp');
      }, 5000);
      break;
      
    case 'continue_quest_action':
      // Generic continue button - find the current stage and use its action
      if (currentStage.action) {
        window.progressQuest(activeQuest.id, currentStage.action);
      } else {
        console.error('Current stage has no action to continue');
      }
      break;
  }
};

// Set the quest narrative content
window.setQuestNarrative = function(text) {
  const questNarrative = document.getElementById('questNarrative');
  questNarrative.innerHTML = text;
  questNarrative.scrollTop = 0; // Scroll to top
};

// Add to the quest narrative content
window.addToQuestNarrative = function(text) {
  const questNarrative = document.getElementById('questNarrative');
  questNarrative.innerHTML += text;
  questNarrative.scrollTop = questNarrative.scrollHeight; // Scroll to bottom to show new content
};

// Override for updateTimeAndDay to update quest scene time display too
const originalUpdateTimeAndDay = window.updateTimeAndDay;
window.updateTimeAndDay = function(minutesToAdd) {
  const oldDay = window.gameDay;
  
  // Call original function
  originalUpdateTimeAndDay(minutesToAdd);
  
  // Update quest scene time display if visible
  if (!document.getElementById('questSceneContainer').classList.contains('hidden')) {
    document.getElementById('questTimeDisplay').textContent = document.getElementById('timeDisplay').textContent;
    document.getElementById('questDayDisplay').textContent = document.getElementById('dayDisplay').textContent;
    document.getElementById('questDayNightIndicator').className = document.getElementById('dayNightIndicator').className;
    
    updateQuestStatusBars();
  }
  
  // Check if day changed
  if (window.gameDay > oldDay) {
    // Dispatch the day changed event
    window.dispatchEvent(window.dayChangedEvent || new Event('dayChanged'));
    
    // Check for quest assignment
    window.checkForQuestAssignment();
    
    // Check quest deadlines
    window.checkQuestDeadlines();
  }
};

// Override handleAction to support quest actions
const originalHandleAction = window.handleAction;
window.handleAction = function(action) {
  console.log('Action handled:', action);
  
  // Handle quest-specific actions
  if (action === 'report_to_sarkein_action') {
    // Find the active quest
    const activeQuest = window.quests.find(q => 
      q.status === window.QUEST_STATUS.ACTIVE && 
      q.stages[q.currentStageIndex].action === 'report_to_sarkein');
    
    if (activeQuest) {
      window.handleQuestAction('report_to_sarkein_action');
      return;
    }
  }
  
  // Pass to original handler for regular actions
  originalHandleAction(action);
};

// Create a custom event for day changes if it doesn't exist
if (!window.dayChangedEvent) {
  window.dayChangedEvent = new Event('dayChanged');
}

// Manual trigger for testing - will assign the raid quest regardless of chance
window.forceAssignRaidQuest = function() {
  window.assignQuest('raid_frontier');
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.initializeQuestSystem();
});