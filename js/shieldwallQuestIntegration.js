// shieldwallQuestIntegration.js
// Integrates the shieldwall battle system with the quest system

// Queue to store battle outcomes when returning to quests
window.shieldwallOutcomeQueue = [];

// Define quest stages that should use shieldwall battles
window.shieldwallQuestBattles = {
  'raid_frontier': {
    // Define stages that should use shieldwall instead of normal combat
    'stage_assault': {
      enemyName: "Arrasi Forces",
      unitStrength: 40,
      startingCohesion: 85,
      startingMomentum: 10, // Slight advantage to player
      startingPhase: "engagement",
      order: "advance",
      successStage: "stage_return", // Stage to progress to on victory
      failureAction: "failQuest" // Action to take on defeat
    }
  },
  // Add other quests here as needed
};

// Override specific quest progression functions to use shieldwall battles
// Store original handleAssaultOutpost function
const originalHandleAssaultOutpost = window.handleAssaultOutpost;

// Override with new function that uses shieldwall
window.handleAssaultOutpost = function(quest) {
  // Only use shieldwall if it should be used for this quest/stage
  const questConfig = window.shieldwallQuestBattles[quest.templateId];
  
  if (questConfig && questConfig['stage_assault']) {
    // Use shieldwall battle system
    window.setNarrative(`
      <p>The Sarkein divides your Spear Host into three assault groups. "First group will create a diversion at the main gate. Second group will scale the eastern wall. Third group, with me, will breach from the west once their attention is divided."</p>
      
      <p>Your Squad is assigned to the second group, tasked with scaling the eastern wall. The plan is set, and with grim determination, your forces move into position.</p>
      
      <p>The attack begins with a barrage of flaming arrows arcing toward the front gate. Shouts of alarm erupt from within the outpost. As the Arrasi soldiers rush to defend the main entrance, your group hurries toward the eastern wall with scaling ladders.</p>
      
      <p>You take your position in the formation. "Shields up!" calls your Vayren. "We advance on my signal!"</p>
    `);
    
    // Configure the shieldwall battle
    const battleConfig = questConfig['stage_assault'];
    
    // Set callback for when battle ends
    battleConfig.onBattleEnd = function(outcome) {
      // Store the outcome for when we return to the quest
      window.shieldwallOutcomeQueue.push({
        questId: quest.id,
        stageId: 'stage_assault',
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
    
    return;
  }
  
  // If not configured for shieldwall, use original function
  originalHandleAssaultOutpost(quest);
};

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
      <p>The fighting is intense but brief. The Arrasi garrison, caught between three attacking forces, is quickly overwhelmed. Within minutes, the outpost is secured.</p>
      
      <p>The Sarkein moves efficiently through the compound, directing units to gather intelligence, supplies, and set fire to the structures. Your unit helps secure several prisoners and discovers a cache of maps showing Arrasi patrol routes and supply lines - valuable intelligence for the Paanic command.</p>
      
      <p>"Good work, soldiers," the Sarkein announces as the outpost burns behind him. "We've cut off their eyes in this sector and gained critical information. Now we return to camp before reinforcements arrive."</p>
      
      <p>The march back is swift but cautious. Your mission is a clear success, and you feel a surge of pride at having contributed to the Paanic cause, even as a lowly soldier in the Spear Host.</p>
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
      <p>The assault goes poorly. The Arrasi defenders are more numerous and better prepared than expected. As casualties mount, the Sarkein gives the order to withdraw.</p>
      
      <p>Your Spear Host retreats under covering fire, dragging wounded comrades back to safety. The mission is a failure, and the frontier will remain vulnerable to Arrasi raids.</p>
      
      <p>Back at camp, the Sarkein addresses the soldiers with a somber voice. "We'll have another opportunity," he says, though the disappointment in his voice is clear. "Rest and recover. The Empire still needs its soldiers."</p>
    `);
    
    // Execute failure action
    if (stageConfig.failureAction === "failQuest") {
      window.failQuest(quest.id);
    }
  }
};

// Create an example shieldwall battle test function
window.testShieldwallBattle = function() {
  // Simple test configuration
  const testConfig = {
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

// Initialize integration when the document is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("Shieldwall quest integration initialized");
});