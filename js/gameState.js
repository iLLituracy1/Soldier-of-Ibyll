// GAME STATE MODULE
// Core game state variables and management

// Game time and day tracking
window.gameTime = 480; // Start at 8:00 AM (in minutes)
window.gameDay = 1;

// Game state object
window.gameState = {
  // Character progression 
  deeds: 0,                     // Renamed from experience
  commendations: 0,             // New property for tracking rank achievements
  rankIndex: 0,                 // Index into RANKS array
  level: 1,                     // Keep level for backward compatibility
  skillPoints: 0,
  health: 100,
  maxHealth: 100,
  stamina: 100,
  maxStamina: 100,
  morale: 75, // 0-100 scale
  
  // Environmental conditions
  weather: "clear", // clear, rainy, foggy, etc.
  campMorale: 70, // 0-100 scale
  
  // Flags for special events
  arrivalProcessed: false,
  firstBriefingCompleted: false,
  trainingProgress: 0,
  dailyTrainingCount: 0, // Added training limit
  inStoryEncounter: false,
  
  // Quest state tracking
  inQuestSequence: false,
  awaitingQuestResponse: false, // Added for mandatory quest response
  
  // Action tracking
  dailyPatrolDone: false,
  dailyScoutDone: false,
  
  // Battle system - keeping state variables but removing functionality
  inBattle: false,
  currentEnemy: null,
  
  // Mission system flags
  inMission: false,
  currentMission: null,
  missionStage: 0,
  
  // Achievement tracking
  combatVictoryAchieved: false,
  
  // Discovered locations
  discoveredBrawlerPits: false,
  discoveredGamblingTent: false,
  
  // Feats system storage
  feats: null // Will be initialized by featsSystem.js
};

// Initialize game state function
window.initializeGameState = function() {
  // Set additional game state values
  window.gameState.trainingProgress = 0;
  window.gameState.dailyTrainingCount = 0; // Initialize training count
  window.gameState.inQuestSequence = false;
  window.gameState.awaitingQuestResponse = false;
  
  // Set activity discovery flags based on origin
  if (window.player.origin === 'Lunarine') {
    window.gameState.discoveredBrawlerPits = true;
    window.gameState.discoveredGamblingTent = true;
  } else {
    window.gameState.discoveredBrawlerPits = false;
    window.gameState.discoveredGamblingTent = false;
  }
  
  console.log("Game state initialized");
};

// Function to check for level up
window.checkLevelUp = function() {
  // Use the new commendation system if available
  if (typeof window.checkCommendation === 'function') {
    return window.checkCommendation();
  }
  
  // Fallback legacy code if featsSystem is not loaded
  const requiredExp = window.gameState.level * 100;
  
  if (window.gameState.deeds >= requiredExp) {
    // Level up!
    window.gameState.level++;
    window.gameState.deeds -= requiredExp;
    
    // Increase max health and stamina
    window.gameState.maxHealth += 10;
    window.gameState.maxStamina += 5;
    
    // Restore health and stamina
    window.gameState.health = window.gameState.maxHealth;
    window.gameState.stamina = window.gameState.maxStamina;
    
    // Update UI
    window.updateStatusBars();
    
    // Show notification
    window.showNotification(`Level up! You are now level ${window.gameState.level}!`, 'level-up');
    
    // Check for veteran achievement
    if (window.achievements && window.gameState.level >= 25 && !window.achievements.find(a => a.id === 'veteran').unlocked) {
      window.showAchievement('veteran');
    }
    
    // Check if there are more levels to gain
    window.checkLevelUp();
  }
};