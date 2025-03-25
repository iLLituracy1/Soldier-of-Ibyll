// Quest System Integration Module
// This module ties together the quest components and ensures proper initialization order

// The main integration function - called after all components are loaded
window.initializeQuestSubsystems = function() {
  console.log("Initializing quest subsystems...");
  
  // Step 1: Initialize main quest system
  if (typeof window.initializeQuestSystem === 'function') {
    window.initializeQuestSystem();
  } else {
    console.error("Quest system initialization function not found");
    return false;
  }
  
  // Step 2: Initialize reward system
  if (typeof window.initializeQuestRewardSystem === 'function') {
    window.initializeQuestRewardSystem();
  } else {
    console.warn("Quest reward system initialization function not found, using basic rewards");
  }
  
  console.log("Quest subsystems initialized successfully");
  return true;
};

// Call initialization when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Quest subsystems are initialized after a short delay to ensure dependencies are loaded
  setTimeout(window.initializeQuestSubsystems, 500);
});

// Debug helper for testing quests
window.debugQuests = {
  listTemplates: function() {
    console.log("Available quest templates:");
    for (const id in window.questTemplates) {
      console.log(`- ${id}: ${window.questTemplates[id].title}`);
    }
  },
  
  assign: function(questId) {
    if (!window.questTemplates[questId]) {
      console.error(`Quest template "${questId}" not found`);
      console.log("Available templates:");
      this.listTemplates();
      return false;
    }
    
    return window.assignQuest(questId);
  },
  
  listActive: function() {
    if (!window.quests || window.quests.length === 0) {
      console.log("No active quests");
      return;
    }
    
    console.log("Active quests:");
    window.quests.forEach(quest => {
      const currentStage = quest.stages[quest.currentStageIndex];
      console.log(`- ${quest.id}: ${quest.title} (${quest.status})`);
      console.log(`  Current stage: ${currentStage.id} - ${currentStage.objective}`);
    });
  },
  
  reset: function() {
    window.quests = [];
    console.log("All quests reset");
  }
};

// Add automatic quest assignment debug options to main menu
window.addQuestDebugOptions = function() {
  // Check if we're on the main menu and debug mode is enabled
  if (!window.gameState || !window.gameState.debugMode) return;
  
  const menuOptions = document.querySelector('.menu-options');
  if (!menuOptions) return;
  
  // Check if debug button already exists
  if (document.getElementById('questDebugBtn')) return;
  
  // Create debug button
  const debugBtn = document.createElement('button');
  debugBtn.id = 'questDebugBtn';
  debugBtn.className = 'main-menu-btn debug-btn';
  debugBtn.textContent = 'Quest Debug';
  debugBtn.onclick = function() {
    // Create simple debug menu
    window.debugQuests.listTemplates();
    const questId = prompt("Enter quest ID to force assignment, or leave blank to cancel:");
    if (questId && window.questTemplates[questId]) {
      alert(`Assigning quest: ${window.questTemplates[questId].title}`);
      // Will be assigned when game starts
      window.gameState.debugQuestToAssign = questId;
    }
  };
  
  menuOptions.appendChild(debugBtn);
};

// Check for debug quest assignment when game starts
const originalStartGameAdventure = window.startGameAdventure;
window.startGameAdventure = function() {
  // Call original function
  originalStartGameAdventure();
  
  // Check if there's a debug quest to assign
  if (window.gameState.debugQuestToAssign) {
    const questId = window.gameState.debugQuestToAssign;
    delete window.gameState.debugQuestToAssign;
    
    // Wait a moment for game initialization to complete
    setTimeout(() => {
      window.forceAssignQuest(questId);
    }, 1000);
  }
};

// Add debug mode toggle when double-clicking game version
document.addEventListener('DOMContentLoaded', function() {
  const versionElement = document.querySelector('.game-version p');
  if (versionElement) {
    versionElement.addEventListener('dblclick', function() {
      if (!window.gameState) window.gameState = {};
      window.gameState.debugMode = !window.gameState.debugMode;
      alert(`Debug mode ${window.gameState.debugMode ? 'enabled' : 'disabled'}`);
      
      if (window.gameState.debugMode) {
        window.addQuestDebugOptions();
      }
    });
  }
});