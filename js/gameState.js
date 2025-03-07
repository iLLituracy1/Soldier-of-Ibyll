// GAME STATE MODULE
// Core game state variables and management

// Game time and day tracking
window.gameTime = 480; // Start at 8:00 AM (in minutes)
window.gameDay = 1;

// Game state object
window.gameState = {
  // Character progression 
  experience: 0,
  level: 1,
  skillPoints: 0,
  health: 100,
  maxHealth: 100,
  stamina: 100,
  maxStamina: 100,
  morale: 75, // 0-100 scale
  
  // Quest & Story Tracking
  mainQuest: { stage: 0, completed: false },
  sideQuests: [],
  discoveredLocations: ["Kasvaari Camp"],
  
  // Environmental conditions
  weather: "clear", // clear, rainy, foggy, etc.
  campMorale: 70, // 0-100 scale
  
  // Flags for special events
  arrivalProcessed: false,
  firstBriefingCompleted: false,
  trainingProgress: 0,
  dailyTrainingCount: 0, // Added training limit
  inStoryEncounter: false,
  
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
  discoveredGamblingTent: false
};

// Global player state
window.player = {
  origin: null,
  career: null,
  name: "",
  phy: 0,
  men: 0,
  skills: {
    melee: 0,
    marksmanship: 0,
    survival: 0,
    command: 0,
    discipline: 0,
    tactics: 0,
    organization: 0,
    arcana: 0
  },
  inventory: [],
  taelors: 25, // Changed from coins to taelors
  relationships: {},
  events: []
};

// Initialize game state function
window.initializeGameState = function() {
  // Set additional game state values
  window.gameState.trainingProgress = 0;
  window.gameState.dailyTrainingCount = 0; // Initialize training count
  
  // Set activity discovery flags based on origin
  if (window.player.origin === 'Lunarine') {
    window.gameState.discoveredBrawlerPits = true;
    window.gameState.discoveredGamblingTent = true;
  } else {
    window.gameState.discoveredBrawlerPits = false;
    window.gameState.discoveredGamblingTent = false;
  }
  
  // Add initial quests - simplified since quest system is removed
  window.gameState.sideQuests = [
    {
      title: "Basic Training",
      description: "Complete your basic training at the camp.",
      type: "training",
      objectives: [
        {
          text: "Complete training sessions",
          count: 0,
          target: 5,
          completed: false
        }
      ],
      rewards: {
        experience: 50,
        taelors: 10
      },
      completed: false
    }
  ];
  
  console.log("Game state initialized");
};

// Function to check for level up
window.checkLevelUp = function() {
  // Experience required for next level = current level * 100
  const requiredExp = window.gameState.level * 100;
  
  if (window.gameState.experience >= requiredExp) {
    // Level up!
    window.gameState.level++;
    window.gameState.experience -= requiredExp;
    window.gameState.skillPoints += 1;
    
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
    if (window.gameState.level >= 5 && !window.achievements.find(a => a.id === 'veteran').unlocked) {
      window.showAchievement('veteran');
    }
    
    // Check if there are more levels to gain
    window.checkLevelUp();
  }
};

// Update achievement progress
window.updateAchievementProgress = function(achievementId, amount = 1) {
  const achievement = window.achievements.find(a => a.id === achievementId);
  if (!achievement || achievement.unlocked) return;
  
  // Update progress if it's a progress-based achievement
  if ('progress' in achievement) {
    achievement.progress += amount;
    
    // Check if achievement is complete
    if (achievement.progress >= achievement.target) {
      window.showAchievement(achievementId);
    }
  }
};