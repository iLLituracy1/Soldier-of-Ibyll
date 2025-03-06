// GAME STATE MODULE
// Core game state variables and management with integrated time tracking

// Time Manager (simplified for direct replacement)
window.TimeManager = {
  _currentTime: {
    minute: 480,  // Start at 8:00 AM
    hour: 8,
    day: 1,
    month: 1,
    year: 1,
    season: 'spring'
  },
  
  _calendar: {
    daysPerMonth: 30,
    monthsPerYear: 12,
    monthNames: [
      'Firstmelt', 'Stormrise', 'Greenbloom', 'Highsun', 
      'Goldenharvest', 'Rustleaf', 'Thundermarch', 'Deepchill', 
      'Frostbound', 'Whitemoon', 'Lastlight', 'Winterheart'
    ],
    seasonMonths: {
      'spring': [1, 2, 3],
      'summer': [4, 5, 6],
      'autumn': [7, 8, 9],
      'winter': [10, 11, 12]
    }
  },
  
  advanceTime: function(minutesToAdd) {
    this._currentTime.minute += minutesToAdd;
    
    // Handle day change
    while (this._currentTime.minute >= 1440) {
      this._currentTime.minute -= 1440;
      this._currentTime.day++;
      
      // Handle month change
      if (this._currentTime.day > this._calendar.daysPerMonth) {
        this._currentTime.day = 1;
        this._currentTime.month++;
        
        // Handle year change
        if (this._currentTime.month > this._calendar.monthsPerYear) {
          this._currentTime.month = 1;
          this._currentTime.year++;
        }
        
        // Update season
        this._updateSeason();
      }
    }
    
    // Update hour
    this._currentTime.hour = Math.floor(this._currentTime.minute / 60);
    
    return this.getCurrentTime();
  },
  
  _updateSeason: function() {
    for (const [season, months] of Object.entries(this._calendar.seasonMonths)) {
      if (months.includes(this._currentTime.month)) {
        this._currentTime.season = season;
        break;
      }
    }
  },
  
  getCurrentTime: function() {
    return {
      minute: this._currentTime.minute,
      hour12: this._formatHour(),
      hourOfDay: this._currentTime.hour,
      day: this._currentTime.day,
      month: this._currentTime.month,
      monthName: this._calendar.monthNames[this._currentTime.month - 1],
      year: this._currentTime.year,
      season: this._currentTime.season
    };
  },
  
  _formatHour: function() {
    const hour = this._currentTime.hour;
    const minutes = this._currentTime.minute % 60;
    const ampm = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }
};

// Game time and day tracking now managed by TimeManager
window.gameTime = 480; // Starting at 8:00 AM
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

// Initialize game state function
window.initializeGameState = function() {
  // Set additional game state values
  window.gameState.trainingProgress = 0;
  window.gameState.dailyTrainingCount = 0;
  
  // Add initial quests - one training quest and one random quest
  window.gameState.sideQuests = [
    window.createQuest("training")
  ];
  
  // Add a second random quest (different from training)
  const questTypes = ["patrol", "scout"];
  const randomType = questTypes[Math.floor(Math.random() * questTypes.length)];
  window.gameState.sideQuests.push(window.createQuest(randomType));
  
  console.log("Initial quests created:", window.gameState.sideQuests);

  // Set up campaign introduction after a few days
  if (!window.gameState.currentCampaign && window.gameState.mainQuest.stage === 0) {
    // Start with some camp time before first campaign
    window.gameState.mainQuest.stage = 0.5;
    
    // Flag to track if campaign has been introduced
    window.gameState.campaignIntroduced = false;
    
    console.log("Game state initialized, campaign will trigger after day 3");
  }
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
