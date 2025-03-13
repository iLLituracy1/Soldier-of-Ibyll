// shieldwallQuestIntegration.js
// Integrates the shieldwall battle system with the quest system

// Queue to store battle outcomes when returning to quests
window.shieldwallOutcomeQueue = [];

// Define battle types to make it explicit when each combat system should be used
window.BATTLE_TYPES = {
  INDIVIDUAL: 'individual',   // Regular one-on-one combat
  FORMATION: 'formation',     // Shieldwall formation combat
  NARRATIVE: 'narrative'      // No actual combat, just narrative description
};

// Define quest stages that should use shieldwall battles with enhanced metadata
window.shieldwallQuestBattles = {
  'raid_frontier': {
    // Define stages that should use shieldwall instead of normal combat
    'stage_assault': {
      battleType: window.BATTLE_TYPES.FORMATION,
      enemyName: "Arrasi Forces",
      unitStrength: 40,
      startingCohesion: 85,
      startingMomentum: 10, // Slight advantage to player
      startingPhase: "engagement",
      order: "advance",
      description: "A full-scale assault on the Arrasi outpost with your unit in formation.",
      successStage: "stage_return", // Stage to progress to on victory
      failureAction: "failQuest" // Action to take on defeat
    },
    // For comparison, this specifies the patrol encounter as individual combat
    'stage_ambush': {
      battleType: window.BATTLE_TYPES.INDIVIDUAL,
      enemyType: "ARRASI_VAELGORR",
      description: "A small patrol encounter requiring individual combat."
    }
  },
  // Add other quests here as needed
};

// This function checks if a stage should use the shieldwall system
window.shouldUseShieldwall = function(questId, stageId) {
  // Get the configuration for this quest
  const questConfig = window.shieldwallQuestBattles[questId];
  if (!questConfig) return false;
  
  // Get the configuration for this stage
  const stageConfig = questConfig[stageId];
  if (!stageConfig) return false;
  
  // Check if the stage is configured for formation combat
  return stageConfig.battleType === window.BATTLE_TYPES.FORMATION;
};

// Get battle configuration for a stage
window.getBattleConfig = function(questId, stageId) {
  // Get the configuration for this quest
  const questConfig = window.shieldwallQuestBattles[questId];
  if (!questConfig) return null;
  
  // Get the configuration for this stage
  return questConfig[stageId] || null;
};

// Common function to handle battles based on battle type
window.handleQuestBattle = function(quest, stage) {
  console.log(`Handling battle for quest: ${quest.templateId}, stage: ${stage.id}`);
  
  // Get battle configuration for this stage
  const battleConfig = window.getBattleConfig(quest.templateId, stage.id);
  
  if (!battleConfig) {
    console.warn(`No battle configuration found for quest: ${quest.templateId}, stage: ${stage.id}`);
    return false;
  }
  
  // Handle based on battle type
  switch (battleConfig.battleType) {
    case window.BATTLE_TYPES.FORMATION:
      return handleFormationBattle(quest, stage, battleConfig);
      
    case window.BATTLE_TYPES.INDIVIDUAL:
      return handleIndividualBattle(quest, stage, battleConfig);
      
    case window.BATTLE_TYPES.NARRATIVE:
      return handleNarrativeBattle(quest, stage, battleConfig);
      
    default:
      console.warn(`Unknown battle type: ${battleConfig.battleType}`);
      return false;
  }
};

// Handle formation (shieldwall) battle
function handleFormationBattle(quest, stage, battleConfig) {
  console.log(`Starting formation battle for ${quest.id}, stage: ${stage.id}`);
  
  window.setNarrative(`
    <p>${battleConfig.description || "Your unit forms into a shieldwall as you prepare to engage the enemy forces."}</p>
    <p>The commander calls out orders as your formation advances, shields locked and weapons ready.</p>
  `);
  
  // Set callback for when battle ends
  battleConfig.onBattleEnd = function(outcome) {
    // Store the outcome for when we return to the quest
    window.shieldwallOutcomeQueue.push({
      questId: quest.id,
      stageId: stage.id,
      outcome: outcome
    });
  };
  
  // Start the shieldwall battle after a short delay
  setTimeout(() => {
    if (!window.shieldwallSystem.initialized) {
      window.shieldwallSystem.initialize();
    }
    window.startShieldwallBattle(battleConfig);
  }, 2000);
  
  return true;
}

// Handle individual (regular) battle
function handleIndividualBattle(quest, stage, battleConfig) {
  console.log(`Starting individual battle for ${quest.id}, stage: ${stage.id}`);
  
  window.setNarrative(`
    <p>${battleConfig.description || "You face your opponent in single combat."}</p>
  `);
  
  // Store the original end combat function so we can override it
  const originalEndCombat = window.combatSystem.endCombat;
  
  // Override the endCombat function to continue the quest after combat
  window.combatSystem.endCombat = function(outcome) {
    // Call the original function first
    originalEndCombat.call(window.combatSystem, outcome);
    
    // Restore the original function
    window.combatSystem.endCombat = originalEndCombat;
    
    // Continue the quest based on outcome
    handleCombatOutcome(quest, stage, outcome);
  };
  
  // Start the combat
  setTimeout(() => {
    window.combatSystem.initiateCombat(battleConfig.enemyType);
  }, 1000);
  
  return true;
}

// Handle narrative-only "battle" (no actual combat)
function handleNarrativeBattle(quest, stage, battleConfig) {
  console.log(`Starting narrative battle for ${quest.id}, stage: ${stage.id}`);
  
  window.setNarrative(`
    <p>${battleConfig.description || "The conflict resolves without direct combat."}</p>
  `);
  
  // Add continue button
  const actionsContainer = document.getElementById('questActions');
  if (actionsContainer) {
    actionsContainer.innerHTML = '';
    
    const continueButton = document.createElement('button');
    continueButton.className = 'quest-action-btn';
    continueButton.textContent = 'Continue';
    continueButton.onclick = function() {
      // Process narrative outcome
      if (battleConfig.narrativeOutcome === "success") {
        handleCombatOutcome(quest, stage, true);
      } else {
        handleCombatOutcome(quest, stage, false);
      }
    };
    
    actionsContainer.appendChild(continueButton);
  }
  
  return true;
}

// Handle combat outcome (for individual combat)
function handleCombatOutcome(quest, stage, outcome) {
  // Get battle configuration for this stage
  const battleConfig = window.getBattleConfig(quest.templateId, stage.id);
  
  if (!battleConfig) {
    console.warn(`No battle configuration found for quest: ${quest.templateId}, stage: ${stage.id}`);
    return;
  }
  
  // Handle based on outcome
  if (outcome === true) {
    setTimeout(() => {
      window.addToNarrative(`
        <p>${battleConfig.successText || "You emerge victorious from the battle!"}</p>
      `);
      
      // Progress to next stage if specified
      if (battleConfig.successStage) {
        const nextStageIndex = quest.stages.findIndex(s => s.id === battleConfig.successStage);
        if (nextStageIndex !== -1) {
          // Mark current stage as completed
          quest.stages[quest.currentStageIndex].completed = true;
          
          // Update to the next stage
          quest.currentStageIndex = nextStageIndex;
          
          // Show notification
          window.showQuestNotification(quest, 'updated');
          
          // Update quest UI if visible
          window.renderQuestLog();
          
          // Update action buttons
          window.updateQuestActionButtons(quest);
        }
      } else {
        // Progress normally
        window.progressQuest(quest.id, stage.action);
      }
    }, 1500);
  } else {
    // Handle failure
    setTimeout(() => {
      window.addToNarrative(`
        <p>${battleConfig.failureText || "You have been defeated in battle."}</p>
      `);
      
      // Execute failure action
      if (battleConfig.failureAction === "failQuest") {
        window.failQuest(quest.id);
      } else {
        // Default failure handling
        window.updateActionButtons();
      }
    }, 1500);
  }
}

// Function to resume quest after shieldwall battle
window.resumeQuestAfterShieldwall = function(quest, outcome) {
  console.log(`Resuming quest ${quest.id} after shieldwall battle with outcome: ${outcome}`);
  
  const currentStage = quest.stages[quest.currentStageIndex];
  
  // Get configuration for this quest/stage
  const questConfig = window.shieldwallQuestBattles[quest.templateId];
  const stageConfig = questConfig ? questConfig[currentStage.id] : null;
  
  if (!stageConfig) {
    console.error("No shieldwall configuration found for this quest/stage");
    return;
  }
  
  // Handle battle outcome
  if (outcome === "victory") {
    // Add victory narrative
    window.addToNarrative(`
      <p>${stageConfig.successText || "The formation holds strong, and the enemy forces are driven back. Victory is yours!"}</p>
      <p>The Sarkein moves efficiently through the compound, directing units to gather intelligence, supplies, and set fire to the structures. Your unit helps secure several prisoners and discovers a cache of maps showing Arrasi patrol routes and supply lines - valuable intelligence for the Paanic command.</p>
      <p>"Good work, soldiers," the Sarkein announces as the outpost burns behind him. "We've cut off their eyes in this sector and gained critical information. Now we return to camp before reinforcements arrive."</p>
    `);
    
    // Progress to success stage if specified
    if (stageConfig.successStage) {
      // Find the index of the success stage
      const nextStageIndex = quest.stages.findIndex(s => s.id === stageConfig.successStage);
      if (nextStageIndex !== -1) {
        // Mark current stage as completed
        currentStage.completed = true;
        
        // Update to the next stage
        quest.currentStageIndex = nextStageIndex;
        
        // Show notification
        window.showQuestNotification(quest, 'updated');
        
        // Update quest UI if visible
        window.renderQuestLog();
        
        // Add continue button to progress
        const actionsContainer = document.getElementById('questActions');
        if (actionsContainer) {
          actionsContainer.innerHTML = '';
          
          const continueButton = document.createElement('button');
          continueButton.className = 'quest-action-btn';
          continueButton.textContent = 'Continue';
          continueButton.onclick = function() {
            window.progressQuest(quest.id, null);
          };
          
          actionsContainer.appendChild(continueButton);
        }
      }
    }
  } else {
    // Handle defeat
    window.addToNarrative(`
      <p>${stageConfig.failureText || "Your formation breaks under the pressure, and the battle is lost."}</p>
      <p>The assault goes poorly. The Arrasi defenders are more numerous and better prepared than expected. As casualties mount, the Sarkein gives the order to withdraw.</p>
      <p>Your Spear Host retreats under covering fire, dragging wounded comrades back to safety. The mission is a failure, and the frontier will remain vulnerable to Arrasi raids.</p>
    `);
    
    // Execute failure action
    if (stageConfig.failureAction === "failQuest") {
      window.failQuest(quest.id);
    }
  }
};

// Override specific quest stage handlers to use the common battle handling

// Store original handleAssaultOutpost function
const originalHandleAssaultOutpost = window.handleAssaultOutpost;

// Override with new function that uses the common battle handler
window.handleAssaultOutpost = function(quest) {
  // Check if this quest/stage should use the enhanced battle system
  if (window.shieldwallQuestBattles[quest.templateId] && 
      window.shieldwallQuestBattles[quest.templateId]['stage_assault']) {
      
    // Get the current stage
    const currentStage = quest.stages[quest.currentStageIndex];
    
    // Set up the narrative
    window.setNarrative(`
      <p>The Sarkein divides your Spear Host into three assault groups. "First group will create a diversion at the main gate. Second group will scale the eastern wall. Third group, with me, will breach from the west once their attention is divided."</p>
      <p>Your Squad is assigned to the second group, tasked with scaling the eastern wall. The plan is set, and with grim determination, your forces move into position.</p>
      <p>The attack begins with a barrage of flaming arrows arcing toward the front gate. Shouts of alarm erupt from within the outpost. As the Arrasi soldiers rush to defend the main entrance, your group hurries toward the eastern wall with scaling ladders.</p>
    `);
    
    // Handle the battle based on the battle type
    return window.handleQuestBattle(quest, currentStage);
  }
  
  // If not configured for enhanced battle, use original function
  return originalHandleAssaultOutpost(quest);
};

// Store original handleCombatPatrol function
const originalHandleCombatPatrol = window.handleCombatPatrol;

// Override with new function that uses the common battle handler
window.handleCombatPatrol = function(quest) {
  // Check if this quest/stage should use the enhanced battle system
  if (window.shieldwallQuestBattles[quest.templateId] && 
      window.shieldwallQuestBattles[quest.templateId]['stage_ambush']) {
      
    // Get the current stage
    const currentStage = quest.stages[quest.currentStageIndex];
    
    // Set up the narrative
    window.setNarrative(`
      <p>Your scouting party exchanges urgent signals as the patrol approaches. There are four Arrasi soldiers - too many to let pass, too many to ambush without risk of raising the alarm.</p>
      <p>You ready your weapons as the patrol draws closer, hearts pounding, knowing that the success of the entire mission now hinges on silencing these men quickly and quietly...</p>
    `);
    
    // Handle the battle based on the battle type
    return window.handleQuestBattle(quest, currentStage);
  }
  
  // If not configured for enhanced battle, use original function
  return originalHandleCombatPatrol(quest);
};

// Create an example shieldwall battle test function
window.testShieldwallBattle = function() {
  // Simple test configuration
  const testConfig = {
    battleType: window.BATTLE_TYPES.FORMATION,
    enemyName: "Test Enemy Forces",
    unitStrength: 40,
    startingCohesion: 85,
    startingMomentum: 0,
    startingPhase: "preparation",
    order: "hold the line",
    onBattleEnd: function(outcome) {
      console.log("Test battle ended with outcome:", outcome);
      alert(`Test battle ended with outcome: ${outcome}`);
    }
  };
  
  // Initialize if needed
  if (!window.shieldwallSystem.initialized) {
    window.shieldwallSystem.initialize();
  }
  
  // Start the battle
  window.startShieldwallBattle(testConfig);
};

// Helper function to determine appropriate combat system for a quest stage
window.getQuestStageCombatType = function(questId, stageId) {
  // Check if we have configuration for this quest/stage
  const questConfig = window.shieldwallQuestBattles[questId];
  if (!questConfig) return window.BATTLE_TYPES.INDIVIDUAL; // Default to individual
  
  const stageConfig = questConfig[stageId];
  if (!stageConfig) return window.BATTLE_TYPES.INDIVIDUAL; // Default to individual
  
  return stageConfig.battleType || window.BATTLE_TYPES.INDIVIDUAL;
};

// Initialize integration when the document is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("Enhanced Shieldwall quest integration initialized");
});