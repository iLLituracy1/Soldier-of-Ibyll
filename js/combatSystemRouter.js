// combatSystemRouter.js
// Routes to the appropriate combat system based on battle type

// Initialize the combat router
window.initializeCombatRouter = function() {
  console.log("Initializing combat router system...");
  
  // Make sure we have battle types defined
  if (!window.BATTLE_TYPES) {
    window.BATTLE_TYPES = {
      INDIVIDUAL: 'individual',   // Regular one-on-one combat
      FORMATION: 'formation',     // Shieldwall formation combat
      NARRATIVE: 'narrative'      // No actual combat, just narrative description
    };
  }
  
  // Override quest progression function to use the router
  if (window.handleQuestStageAction) {
    // Store the original function
    const originalHandleQuestStageAction = window.handleQuestStageAction;
    
    // Override with our routing version
    window.handleQuestStageAction = function(quest, stage) {
      console.log(`Handling quest stage action: ${stage.action}`);
      
      // Check if this stage has a battle type specified
      const battleType = getBattleTypeForStage(quest, stage);
      
      // If we have a battle, handle it through the router
      if (battleType && battleType !== window.BATTLE_TYPES.NARRATIVE) {
        // If the stage specifically needs battle handling
        if (stage.action === 'combat_patrol' || stage.action === 'assault_outpost' || 
            stage.action === 'handle_scout' || stage.action === 'defend_crossing') {
          
          console.log(`Routing to ${battleType} combat for ${stage.action}`);
          
          // Get battle config
          const battleConfig = getBattleConfigForStage(quest, stage);
          
          // Start appropriate combat
          startCombat(battleType, quest, stage, battleConfig);
          
          // We've handled the combat routing
          return;
        }
      }
      
      // For non-combat stages or stages without specific battle handling,
      // use the original function
      originalHandleQuestStageAction(quest, stage);
    };
  }
  
  console.log("Combat router initialized");
};

// Get the battle type for a quest stage
function getBattleTypeForStage(quest, stage) {
  // First check if the stage has battleType property directly
  if (stage.battleType) {
    return stage.battleType;
  }
  
  // Check the quest templates
  if (window.questTemplates && window.questTemplates[quest.templateId]) {
    const template = window.questTemplates[quest.templateId];
    
    // Find the stage in the template
    const templateStage = template.stages.find(s => s.id === stage.id);
    if (templateStage && templateStage.battleType) {
      return templateStage.battleType;
    }
  }
  
  // Check the shieldwall battle configs
  if (window.shieldwallQuestBattles && window.shieldwallQuestBattles[quest.templateId]) {
    const stageConfig = window.shieldwallQuestBattles[quest.templateId][stage.id];
    if (stageConfig && stageConfig.battleType) {
      return stageConfig.battleType;
    }
  }
  
  // Default to individual combat if no specific type is found
  return window.BATTLE_TYPES.INDIVIDUAL;
}

// Get the battle configuration for a quest stage
function getBattleConfigForStage(quest, stage) {
  // First check shieldwall battle configs
  if (window.shieldwallQuestBattles && window.shieldwallQuestBattles[quest.templateId]) {
    const stageConfig = window.shieldwallQuestBattles[quest.templateId][stage.id];
    if (stageConfig) {
      return stageConfig;
    }
  }
  
  // Check the quest templates
  if (window.questTemplates && window.questTemplates[quest.templateId]) {
    const template = window.questTemplates[quest.templateId];
    
    // Find the stage in the template
    const templateStage = template.stages.find(s => s.id === stage.id);
    if (templateStage) {
      // Extract battle-related properties
      return {
        battleType: templateStage.battleType || window.BATTLE_TYPES.INDIVIDUAL,
        enemyType: templateStage.enemyType,
        enemyName: templateStage.enemyName,
        unitStrength: templateStage.unitStrength,
        startingCohesion: templateStage.startingCohesion,
        startingMomentum: templateStage.startingMomentum,
        startingPhase: templateStage.startingPhase,
        order: templateStage.order,
        successText: templateStage.successText,
        failureText: templateStage.failureText
      };
    }
  }
  
  // Create a default configuration
  return {
    battleType: window.BATTLE_TYPES.INDIVIDUAL,
    enemyType: "ARRASI_VAELGORR" // Default enemy
  };
}

// Start the appropriate combat based on type
function startCombat(battleType, quest, stage, config) {
  switch (battleType) {
    case window.BATTLE_TYPES.FORMATION:
      startFormationCombat(quest, stage, config);
      break;
      
    case window.BATTLE_TYPES.INDIVIDUAL:
      startIndividualCombat(quest, stage, config);
      break;
      
    default:
      console.warn(`Unknown battle type: ${battleType}`);
      break;
  }
}

// Start formation (shieldwall) combat
function startFormationCombat(quest, stage, config) {
  console.log(`Starting formation combat for quest ${quest.id}, stage ${stage.id}`);
  
  // Set appropriate narrative
  window.setNarrative(`
    <p>${config.description || "Your unit forms into a shieldwall as you prepare to engage the enemy forces."}</p>
    <p>The commander calls out orders as your formation advances, shields locked and weapons ready.</p>
  `);
  
  // Set callback for when battle ends
  config.onBattleEnd = function(outcome) {
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
    window.startShieldwallBattle(config);
  }, 2000);
}

// Start individual combat
function startIndividualCombat(quest, stage, config) {
  console.log(`Starting individual combat for quest ${quest.id}, stage ${stage.id}`);
  
  // Set appropriate narrative
  window.setNarrative(`
    <p>${config.description || "You ready your weapon as you face your opponent."}</p>
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
    handleCombatOutcome(quest, stage, outcome, config);
  };
  
  // Start the combat
  setTimeout(() => {
    window.combatSystem.initiateCombat(config.enemyType);
  }, 1000);
}

// Handle the outcome of individual combat
function handleCombatOutcome(quest, stage, outcome, config) {
  if (outcome === true) {
    setTimeout(() => {
      window.addToNarrative(`
        <p>${config.successText || "You emerge victorious from the battle!"}</p>
      `);
      
      // Progress to next stage - FIXED: Use the stage's own action instead of hardcoding it
      // This ensures we pass the correct action that the stage expects
      if (stage && stage.action) {
        console.log(`Progressing quest with correct action: ${stage.action}`);
        window.progressQuest(quest.id, stage.action);
      } else {
        // Fallback if no action found
        console.warn("No action found for current stage - using default progression");
        window.progressQuest(quest.id);
      }
    }, 1500);
  } else {
    setTimeout(() => {
      window.addToNarrative(`
        <p>${config.failureText || "You have been defeated in battle."}</p>
      `);
      
      // Execute failure action
      if (config.failureAction === "failQuest") {
        window.failQuest(quest.id);
      } else {
        // Default failure handling
        window.updateActionButtons();
      }
    }, 1500);
  }
}

// Initialize the combat router when the document is ready
document.addEventListener('DOMContentLoaded', function() {
  if (window.initializeCombatRouter) {
    window.initializeCombatRouter();
  }
});