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
window.lastStatCheckResult = null;

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
  
  // Create UI for stat checks
  createStatCheckUI();
  
  // Check for quest assignments on day change
  window.addEventListener('dayChanged', window.checkForQuestAssignment);
  
  console.log("Quest system initialized");
  return true;
};

// Create the UI elements for stat checks
function createStatCheckUI() {
  if (document.getElementById('statCheckDisplay')) return;
  
  // Add CSS
  const styleElement = document.createElement('style');
  styleElement.id = 'stat-check-styles';
  styleElement.textContent = `
    .stat-check-display {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: rgba(0, 0, 0, 0.85);
      border: 2px solid #c9aa71;
      border-radius: 8px;
      padding: 15px;
      width: 300px;
      z-index: 1000;
      color: #fff;
      text-align: center;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.6);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
    }
    
    .stat-check-display.show {
      opacity: 1;
      visibility: visible;
    }
    
    .stat-check-header {
      font-size: 1.2em;
      margin-bottom: 10px;
      color: #c9aa71;
      border-bottom: 1px solid #555;
      padding-bottom: 5px;
    }
    
    .stat-check-body {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 15px;
    }
    
    .stat-check-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 10px;
      border-radius: 4px;
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    .stat-check-item.success {
      background-color: rgba(100, 200, 100, 0.2);
    }
    
    .stat-check-item.failure {
      background-color: rgba(200, 100, 100, 0.2);
    }
    
    .stat-name {
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .stat-value {
      color: #c9aa71;
    }
    
    .stat-result {
      font-weight: bold;
    }
    
    .success .stat-result {
      color: #6f6;
    }
    
    .failure .stat-result {
      color: #f66;
    }
    
    .stat-check-result {
      font-size: 1.3em;
      font-weight: bold;
      padding: 5px;
      border-radius: 4px;
    }
    
    .stat-check-result.success {
      color: #6f6;
    }
    
    .stat-check-result.failure {
      color: #f66;
    }
  `;
  
  document.head.appendChild(styleElement);

  // Create display element
  const statCheckDisplay = document.createElement('div');
  statCheckDisplay.id = 'statCheckDisplay';
  statCheckDisplay.className = 'stat-check-display';
  document.body.appendChild(statCheckDisplay);
}


// Function to check if player has a shield equipped
window.playerHasShieldEquipped = function() {
  // Check if player has equipment initialized
  if (!window.player || !window.player.equipment) {
    return false;
  }
  
  // Check if the offHand slot has an item (not "occupied" or null)
  const offHandItem = window.player.equipment.offHand;
  if (!offHandItem || offHandItem === "occupied") {
    return false;
  }
  
  // Get the template and check if it's a shield type
  const template = offHandItem.getTemplate();
  return template && 
         template.weaponType && 
         template.weaponType.name === 'Shield';
};


function displayStatCheck(results, difficulty, overallSuccess) {
  const statCheckDisplay = document.getElementById('statCheckDisplay');
  
  let statsContent = '';
  
  results.forEach(result => {
    statsContent += `<div class="stat-check-item ${result.success ? 'success' : 'failure'}">
      <span class="stat-name">${result.name}</span>
      <span class="stat-value">${result.value.toFixed(1)} ${result.randomFactor >= 0 ? '+' : ''}${result.randomFactor.toFixed(1)}</span>
      <span class="stat-result">${result.success ? '✓' : '✗'}</span>
    </div>`;
  });
  
  statCheckDisplay.innerHTML = `
    <div class="stat-check-header">Skill Check (DC: ${difficulty})</div>
    <div class="stat-check-body">
      ${statsContent}
    </div>
    <div class="stat-check-result ${overallSuccess ? 'success' : 'failure'}">
      ${overallSuccess ? 'SUCCESS' : 'FAILURE'}
    </div>
  `;
  
  statCheckDisplay.classList.add('show');
  
  // Store the result for reference in progressQuest
  window.lastStatCheckResult = {
    success: overallSuccess,
    timestamp: Date.now()
  };
  
  console.log("Stat check display shown, result:", overallSuccess ? "SUCCESS" : "FAILURE");
  
  // Don't auto-hide - we'll hide it when user clicks Continue
  // The progressQuest function will handle hiding this
}



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
  
  // Get quest actions container and ensure it's empty
  const questActionsContainer = document.getElementById('questActions');
  if (questActionsContainer) {
    questActionsContainer.innerHTML = '';
    console.log("Cleared questActions container");
  } else {
    console.error("questActions container not found!");
  }
  
  switch (stage.battleType) {
    case window.BATTLE_TYPES.NARRATIVE:
      // Display the narrative with typewriter effect
      window.setNarrative(stage.narrative || stage.description);
      console.log("Set narrative for stage:", stage.id);
      
      // Advance time if specified
      if (stage.timeAdvance) {
        console.log(`Advancing time by ${stage.timeAdvance} minutes`);
        window.updateTimeAndDay(stage.timeAdvance);
        
        // Allow a moment for time update to register before continuing
        setTimeout(() => {
          window.updateQuestActionButtons(quest);
        }, 1500); // Reduced from 5000ms to 1500ms for better flow
      } else {
        // Wait briefly for typewriter to start before updating buttons
        setTimeout(() => {
          window.updateQuestActionButtons(quest);
        }, 500);
      }
      break;
      
    case window.BATTLE_TYPES.INDIVIDUAL:
      // Display pre-combat narrative
      window.setNarrative(stage.narrative || stage.description);
      
      // Mark this stage as a combat stage in quest userData
      if (!quest.userData) quest.userData = {};
      quest.userData.currentCombatStage = stage.id;
      
      // Wait briefly for typewriter to start before updating buttons
      setTimeout(() => {
        window.updateQuestActionButtons(quest);
      }, 500);
      break;
      
    default:
      console.error(`Unknown battleType: ${stage.battleType}`);
      setTimeout(() => {
        window.updateQuestActionButtons(quest);
      }, 500);
  }
};

// Improved function to perform a stat check
window.performStatCheck = function(statCheck) {
  console.log("Performing stat check:", statCheck);
  
  // Arrays to track individual checks
  const checkResults = [];
  let statDescription = [];
  
  // Process different types of checks
  if (statCheck.type === 'attribute') {
    // Single attribute check
    const attrValue = window.player[statCheck.stat] || 0;
    const randomFactor = (Math.random() * 10) - 2; // -5 to +5
    const checkTotal = attrValue + randomFactor;
    const success = checkTotal >= statCheck.difficulty;
    
    statDescription.push(statCheck.stat.toUpperCase());
    
    checkResults.push({
      name: statCheck.stat.toUpperCase(),
      value: attrValue,
      randomFactor: randomFactor,
      total: checkTotal,
      difficulty: statCheck.difficulty,
      success: success
    });
  } 
  else if (statCheck.type === 'skill') {
    // For skill + attribute checks, we need to check each component separately
    if (statCheck.attribute) {
      // Check attribute
      const attrValue = window.player[statCheck.attribute] || 0;
      const attrRandomFactor = (Math.random() * 10) - 2; // -5 to +5
      const attrTotal = attrValue + attrRandomFactor;
      const attrSuccess = attrTotal >= statCheck.difficulty;
      
      statDescription.push(statCheck.attribute.toUpperCase());
      
      checkResults.push({
        name: statCheck.attribute.toUpperCase(),
        value: attrValue,
        randomFactor: attrRandomFactor,
        total: attrTotal,
        difficulty: statCheck.difficulty,
        success: attrSuccess
      });
      
      // Check skill
      const skillValue = window.player.skills[statCheck.stat] || 0;
      const skillRandomFactor = (Math.random() * 10) - 2; // -5 to +5
      const skillTotal = skillValue + skillRandomFactor;
      const skillSuccess = skillTotal >= statCheck.difficulty;
      
      statDescription.push(statCheck.stat);
      
      checkResults.push({
        name: statCheck.stat,
        value: skillValue,
        randomFactor: skillRandomFactor,
        total: skillTotal,
        difficulty: statCheck.difficulty,
        success: skillSuccess
      });
      
      // Both need to succeed for overall success
      const overallSuccess = attrSuccess && skillSuccess;
      
      // Build the UI display
      displayStatCheck(checkResults, statCheck.difficulty, overallSuccess);
      
      // Return the combined result
      return {
        success: overallSuccess,
        results: checkResults,
        difficulty: statCheck.difficulty,
        description: statDescription.join(' | ')
      };
    } 
    else {
      // Just a single skill check
      const skillValue = window.player.skills[statCheck.stat] || 0;
      const randomFactor = (Math.random() * 10) - 2; // -5 to +5
      const checkTotal = skillValue + randomFactor;
      const success = checkTotal >= statCheck.difficulty;
      
      statDescription.push(statCheck.stat);
      
      checkResults.push({
        name: statCheck.stat,
        value: skillValue,
        randomFactor: randomFactor,
        total: checkTotal,
        difficulty: statCheck.difficulty,
        success: success
      });
    }
  } 
  else if (statCheck.type === 'combined') {
    // Handle multiple attributes/skills
    if (statCheck.attributes) {
      statCheck.attributes.forEach(attr => {
        const attrValue = window.player[attr] || 0;
        const randomFactor = (Math.random() * 10) - 2;
        const checkTotal = attrValue + randomFactor;
        const success = checkTotal >= statCheck.difficulty;
        
        statDescription.push(attr.toUpperCase());
        
        checkResults.push({
          name: attr.toUpperCase(),
          value: attrValue,
          randomFactor: randomFactor,
          total: checkTotal,
          difficulty: statCheck.difficulty,
          success: success
        });
      });
    }
    
    if (statCheck.skills) {
      statCheck.skills.forEach(skill => {
        const skillValue = window.player.skills[skill] || 0;
        const randomFactor = (Math.random() * 10) - 2;
        const checkTotal = skillValue + randomFactor;
        const success = checkTotal >= statCheck.difficulty;
        
        statDescription.push(skill);
        
        checkResults.push({
          name: skill,
          value: skillValue,
          randomFactor: randomFactor,
          total: checkTotal,
          difficulty: statCheck.difficulty,
          success: success
        });
      });
    }
  }
  
  // Determine overall success - all checks must succeed
  const overallSuccess = checkResults.every(result => result.success);
  
  // Display the stat check UI
  displayStatCheck(checkResults, statCheck.difficulty, overallSuccess);
  
  // Show notification about the check
  window.showNotification(`${statDescription.join(' | ')} check (DC ${statCheck.difficulty}): ${overallSuccess ? 'Success!' : 'Failed!'}`, 
    overallSuccess ? 'success' : 'warning');
  
  console.log(`Stat check: ${statDescription.join(' | ')} vs difficulty ${statCheck.difficulty} - ${overallSuccess ? 'SUCCESS' : 'FAILURE'}`);
  
  // Return the result
  return {
    success: overallSuccess,
    results: checkResults,
    difficulty: statCheck.difficulty,
    description: statDescription.join(' | ')
  };
};

// Function to apply rewards from a successful outcome
function applyOutcomeRewards(rewards) {
  if (rewards.experience) {
    window.gameState.experience += rewards.experience;
    window.showNotification(`+${rewards.experience} XP for successful check`, 'success');
  }
  
  if (rewards.taelors) {
    window.player.taelors += rewards.taelors;
    window.showNotification(`+${rewards.taelors} taelors for successful check`, 'success');
  }
  
  if (rewards.health) {
    window.gameState.health = Math.min(window.gameState.maxHealth, window.gameState.health + rewards.health);
    window.showNotification(`+${rewards.health} health for successful check`, 'success');
  }
  
  if (rewards.stamina) {
    window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + rewards.stamina);
    window.showNotification(`+${rewards.stamina} stamina for successful check`, 'success');
  }
  
  // Handle skill improvements
  if (rewards.skillImprovements) {
    for (const [skill, value] of Object.entries(rewards.skillImprovements)) {
      if (window.player.skills[skill] !== undefined) {
        window.player.skills[skill] += value;
        window.showNotification(`+${value} to ${skill} skill for successful check`, 'success');
      }
    }
  }
  
  // Update UI
  window.updateStatusBars();
  window.updateProfileIfVisible();
};

// Function to apply penalties from a failed outcome
function applyOutcomePenalties(penalties) {
  if (penalties.health) {
    window.gameState.health = Math.max(0, window.gameState.health + penalties.health); // penalties should be negative
    window.showNotification(`${penalties.health} health from failed check`, 'warning');
  }
  
  if (penalties.stamina) {
    window.gameState.stamina = Math.max(0, window.gameState.stamina + penalties.stamina); // penalties should be negative
    window.showNotification(`${penalties.stamina} stamina from failed check`, 'warning');
  }
  
  if (penalties.morale) {
    window.gameState.morale = Math.max(0, window.gameState.morale + penalties.morale);
    window.showNotification(`${penalties.morale} morale from failed check`, 'warning');
  }
  
  // Update UI
  window.updateStatusBars();
  window.updateProfileIfVisible();
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
  
 // Check if the stage has a statCheck and hasn't been processed yet
if (currentStage.statCheck && currentStage.outcomes && !quest.userData?.statCheckProcessed) {
  console.log(`Processing stat check for stage ${currentStage.id}`);
  
  // Set a flag to show we've started processing this stat check
  if (!quest.userData) quest.userData = {};
  quest.userData.statCheckProcessed = true;
  
  // Perform the stat check and show UI
  const checkResult = window.performStatCheck(currentStage.statCheck);
  console.log(`Stat check result for ${currentStage.id}:`, checkResult.success ? "SUCCESS" : "FAILURE");
  
  // Store the check result
  quest.userData[`${currentStage.id}_check`] = checkResult;
  
  // Show appropriate narrative text based on the outcome
  const narrativeText = checkResult.success ? 
    currentStage.statCheck.successText || "You succeed!" :
    currentStage.statCheck.failureText || "You fail.";
  
  // Set narrative with typewriter effect
  window.setNarrative(narrativeText);
  
  // Get the actions container
  const actionsContainer = document.getElementById('questActions');
  
  // Make sure UI is updated after narrative is set (with delay for typewriter)
  setTimeout(() => {
    // First, clear the container
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      
      // Add continue button to show the outcome narrative
      const continueButton = document.createElement('button');
      continueButton.id = 'statCheckContinueBtn';
      continueButton.className = 'quest-action-btn';
      continueButton.textContent = 'Continue';
      
      continueButton.onclick = function() {
        // Hide the stat check display when continue is clicked
        const statCheckDisplay = document.getElementById('statCheckDisplay');
        if (statCheckDisplay) {
          statCheckDisplay.classList.remove('show');
        }
        
        // Get the appropriate outcome
        const outcome = checkResult.success ? currentStage.outcomes.success : currentStage.outcomes.failure;
        
        // Show the outcome narrative addition if it exists
        if (outcome.narrativeAddition) {
          // Use setNarrative for clearer transition
          window.setNarrative(narrativeText + "\n\n" + outcome.narrativeAddition);
        }
        
        // Apply rewards or penalties
        if (checkResult.success && outcome.rewards) {
          applyOutcomeRewards(outcome.rewards);
        } else if (!checkResult.success && outcome.penalties) {
          applyOutcomePenalties(outcome.penalties);
        }
        
        // Apply any timeAdvance from the outcome
        if (outcome.timeAdvance) {
          window.updateTimeAndDay(outcome.timeAdvance);
        }
        
        // Update UI for next step (after typewriter completes)
        setTimeout(() => {
          if (actionsContainer) {
            actionsContainer.innerHTML = '';
            
            // Add continue button to proceed to next stage
            const nextButton = document.createElement('button');
            nextButton.className = 'quest-action-btn';
            nextButton.textContent = 'Continue';
            nextButton.onclick = function() {
              // Determine next stage from outcome
              const nextStageId = outcome.nextStage;
              
              if (nextStageId) {
                const nextStageIndex = quest.stages.findIndex(s => s.id === nextStageId);
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
                    
                    // Update quest objective
                    const newCurrentStage = quest.stages[quest.currentStageIndex];
                    document.getElementById('questObjective').textContent = newCurrentStage.objective;
                  }
                  
                  // Clear the stat check processing flag so we can handle future stat checks
                  delete quest.userData.statCheckProcessed;
                  
                  // Handle the new stage
                  window.handleQuestStageAction(quest, quest.stages[quest.currentStageIndex]);
                  
                  console.log(`Advanced to next stage: ${quest.stages[nextStageIndex].id}`);
                } else {
                  console.error(`Next stage "${nextStageId}" not found`);
                }
              } else {
                // No next stage, complete the quest
                window.completeQuest(questId);
              }
            };
            
            actionsContainer.appendChild(nextButton);
          } else {
            console.error("questActions container not found for next stage button!");
          }
        }, 1000); // Delay to ensure typewriter effect has started
      };
      
      actionsContainer.appendChild(continueButton);
      console.log("Added continue button after stat check");
    } else {
      console.error("questActions container not found!");
    }
  }, 500); // Short delay to ensure narrative is set
  
  return true; // Stat check handled
}
  
  // COMBAT HANDLING - Special handling for combat actions
  if (action === 'combat' && currentStage.battleType === window.BATTLE_TYPES.INDIVIDUAL) {
    console.log("Initiating combat for stage:", currentStage.id);
    
    // Store performance data
    if (!quest.userData) quest.userData = {};
    quest.userData[`${currentStage.id}_start`] = true;
    
    // Initiate combat with the enemy type from the stage
    window.combatSystem.initiateCombat(
      currentStage.enemyType,
      Array.isArray(currentStage.allies) ? currentStage.allies : (currentStage.allies ? [currentStage.allies] : []),
      {
        requireDefeat: currentStage.combatOptions?.requireDefeat || true,
        enemySequence: currentStage.enemySequence,
        ...(currentStage.combatOptions || {})
      }
    );
    
    // Store the original end combat function
    const originalEndCombat = window.combatSystem.endCombat;
    
    // Override the endCombat function to continue the quest after combat
    window.combatSystem.endCombat = function(outcome) {
      // Call the original function first
      originalEndCombat.call(window.combatSystem, outcome);
      
      // Restore the original function
      window.combatSystem.endCombat = originalEndCombat;
      
      // Continue based on outcome after a delay
      setTimeout(() => {
        // Consider both true victory and "draw" (turn timeout) as success
        if (outcome === true || outcome === "draw") {
          // Success - either through victory or timeout
          window.addToNarrative(currentStage.successText || "You survived the encounter!");
          
          // Find and proceed to the next stage
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
            }
          }
        } else {
          // Only treat defeat and retreat as failure
          window.addToNarrative(currentStage.failureText || "You have been defeated.");
          window.failQuest(quest.id);
        }
      }, 1500);
    };
    
    return true; // Combat initiated
  }
  
  // CHOICE HANDLING
  if (currentStage.choices && currentStage.choices.length > 0) {
    // Find the choice that matches the given action
    const choice = currentStage.choices.find(c => c.action === action);
    
    if (choice && choice.nextStage) {
      const nextStageIndex = quest.stages.findIndex(s => s.id === choice.nextStage);
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
        
        console.log(`Advanced to chosen stage: ${quest.stages[nextStageIndex].id}`);
        
        return true;
      } else {
        console.error(`Next stage "${choice.nextStage}" not found`);
      }
    }
  }
  
  // LINEAR PROGRESSION
  else if (currentStage.nextStage) {
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
  if (!actionsContainer) {
    console.error("questActions container not found!");
    return;
  }
  
  // Clear existing buttons
  actionsContainer.innerHTML = '';
  
  // Get current stage
  const currentStage = quest.stages[quest.currentStageIndex];
  if (!currentStage) {
    console.error("No current stage found!");
    return;
  }
  
  console.log(`Updating action buttons for stage: ${currentStage.id}`);
  
  // Don't add buttons if we're still animating narrative
  if (window.typewriterConfig.isActive) {
    console.log("Typewriter active, delaying buttons");
    setTimeout(() => window.updateQuestActionButtons(quest), 500);
    return;
  }
  
  // If there's a recent stat check that hasn't been processed with a Continue button
  if (window.lastStatCheckResult && 
      (Date.now() - window.lastStatCheckResult.timestamp < 2000) && 
      !document.getElementById('statCheckContinueBtn')) {
    console.log("Recent stat check detected, buttons will be handled by progressQuest");
    return;
  }
  
  // Check if stage has choices
  if (currentStage.choices && currentStage.choices.length > 0) {
    // Filter choices based on equipment requirements
    const validChoices = currentStage.choices.filter(choice => {
      // If the choice requires a shield, check if player has one equipped
      if (choice.requiresShield && !window.playerHasShieldEquipped()) {
        console.log(`Choice "${choice.text}" requires a shield, but player doesn't have one equipped`);
        return false;
      }
      return true;
    });
    
    // If no valid choices remain after filtering, create a default choice
    if (validChoices.length === 0 && currentStage.defaultChoice) {
      validChoices.push(currentStage.defaultChoice);
    }
    
    // Create a button for each valid choice
    validChoices.forEach(choice => {
      const choiceButton = document.createElement('button');
      choiceButton.className = 'quest-action-btn';
      choiceButton.textContent = choice.text;
      
      choiceButton.onclick = function() {
        console.log(`Choice selected: ${choice.text}, action: ${choice.action}`);
        try {
          // Store choice in quest userData for reference
          if (!quest.userData) quest.userData = {};
          quest.userData.lastChoice = choice.action;
          
          window.progressQuest(quest.id, choice.action);
        } catch (error) {
          console.error(`Error progressing quest: ${error.message}`);
        }
      };
      
      actionsContainer.appendChild(choiceButton);
    });
    
    console.log(`Added ${validChoices.length} choice buttons`);
  }
  // Original code for single action button
  else if (currentStage.action) {
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
      }
    };
    
    actionsContainer.appendChild(actionButton);
    console.log(`Added action button: ${actionButton.textContent}`);
  } else {
    console.log("No action or choices defined for this stage");
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
    case 'protect':
      return 'Protect';
    case 'combat':
      return 'Engage';
    case 'selfpreserve':
      return 'Stay alive';
    case 'complete':
      return 'Complete Mission';
    case 'volunteer':
      return 'Volunteer';
    case 'remain_silent':
      return 'Remain silent';
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
  
  // Check if this is a campaign quest
  const template = window.questTemplates[quest.templateId];
  const isCampaignQuest = template && template.isCampaignQuest === true;
  
  // Apply rewards - use enhanced system if available
  if (typeof window.applyQuestRewards === 'function') {
    window.applyQuestRewards(quest);
  } else {
    // Basic reward application
    applyBasicRewards(quest);
  }
  
  // Handle campaign quest completion
  if (isCampaignQuest && template.campaignPartId) {
    console.log("Completing campaign quest:", quest.templateId);
    
    // Call custom onComplete callback if exists
    if (typeof template.onComplete === 'function') {
      template.onComplete();
    } else {
      // Default behavior
      window.completeCampaignPart(template.campaignPartId);
    }
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

// Similarly, extend failQuest to handle campaign quests
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
  
  // Check if this is a campaign quest
  const template = window.questTemplates[quest.templateId];
  const isCampaignQuest = template && template.isCampaignQuest === true;
  
  // Show failure notification
  window.showNotification(`Quest Failed: ${quest.title}`, 'warning');
  
  // Add failure narrative
  window.addToNarrative(`<p>You have failed to complete the quest "${quest.title}". The opportunity has passed.</p>`);
  
  // Handle campaign quest failure
  if (isCampaignQuest && template.campaignPartId) {
    console.log("Failed campaign quest:", quest.templateId);
    
    // Call custom onFail callback if exists
    if (typeof template.onFail === 'function') {
      template.onFail();
    } else {
      // Default behavior
      window.failCampaignPart(template.campaignPartId);
    }
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
    // Experience/Deeds
    if (quest.rewards.deeds || quest.rewards.experience) {
      const deedsAmount = quest.rewards.deeds || quest.rewards.experience || 0;
      window.gameState.deeds += deedsAmount;
      window.showNotification(`+${deedsAmount} deeds`, 'success');
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

    // Function to disable quest buttons during typewriter effect
    window.disableQuestButtons = function() {
      // Disable all quest action buttons
      const buttons = document.querySelectorAll('.quest-action-btn');
      buttons.forEach(button => {
        button.disabled = true;
        button.classList.add('disabled');
      });
    };

    // Function to enable quest buttons after typewriter effect
    window.enableQuestButtons = function() {
      // After a short delay, enable all quest action buttons
      setTimeout(() => {
        const buttons = document.querySelectorAll('.quest-action-btn');
        buttons.forEach(button => {
          button.disabled = false;
          button.classList.remove('disabled');
        });
      }, window.typewriterConfig.buttonDelay);
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

// Override updateTimeAndDay to dispatch our custom event and update quest UI
const originalUpdateTimeAndDay = window.updateTimeAndDay;
window.updateTimeAndDay = function(minutesToAdd) {
  const oldDay = window.gameDay;
  
  // Call original function
  originalUpdateTimeAndDay(minutesToAdd);
  
  // Also update quest UI if we're in the quest scene
  if (!document.getElementById('questSceneContainer').classList.contains('hidden')) {
    // Format time for display (same logic as in the original function)
    const hours = Math.floor(window.gameTime / 60);
    const minutes = window.gameTime % 60;
    const ampm = hours < 12 ? 'AM' : 'PM';
    const displayHours = hours % 12 || 12; // Convert 0 to 12 for display
    
    // Update quest time display
    document.getElementById('questTimeDisplay').textContent = `Time: ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    document.getElementById('questDayDisplay').textContent = `Day ${window.gameDay}`;
    
    // Update day/night indicator
    const timeOfDay = window.getTimeOfDay();
    document.getElementById('questDayNightIndicator').className = 'day-night-indicator time-' + timeOfDay;
    
    console.log(`Updated quest UI time display to: Day ${window.gameDay}, ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`);
  }
  
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
    // Update quest narrative with typewriter effect
    const questNarrative = document.getElementById('questNarrative');
    window.typewriterEffect(text, questNarrative, function() {
      window.enableQuestButtons();
    });
    
    // Disable buttons during typewriter
    window.disableQuestButtons();
  } else {
    // Use original function for main game (which now has typewriter built in)
    originalSetNarrative(text);
  }
};

const originalAddToNarrative = window.addToNarrative;
window.addToNarrative = function(text) {
  // Check if we're in quest scene
  if (!document.getElementById('questSceneContainer').classList.contains('hidden')) {
    // If typewriter is already active, just append normally
    if (window.typewriterConfig.isActive) {
      const questNarrative = document.getElementById('questNarrative');
      questNarrative.innerHTML += `<p>${text}</p>`;
      questNarrative.scrollTop = questNarrative.scrollHeight;
      return;
    }
    
    // Update quest narrative with typewriter effect
    const questNarrative = document.getElementById('questNarrative');
    const currentContent = questNarrative.innerHTML;
    
    window.typewriterEffect(text, document.createElement('div'), function() {
      questNarrative.innerHTML += `<p>${text}</p>`;
      questNarrative.scrollTop = questNarrative.scrollHeight;
      window.enableQuestButtons();
    });
    
    // Disable buttons during typewriter
    window.disableQuestButtons();
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