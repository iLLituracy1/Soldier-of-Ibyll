// campaignSystem.js - Campaign progression system
// Handles campaign parts, progression, location changes, and main story quests

// Campaign state constants
window.CAMPAIGN_STATUS = {
    NOT_STARTED: 'not_started',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    FAILED: 'failed'
  };
  
  // Location constants - Define all possible locations in the campaign
  window.CAMPAIGN_LOCATIONS = {
    KASVAARI_CAMP: {
      id: 'kasvaari_camp',
      name: 'Kasvaari Camp',
      description: 'Your regiment\'s military encampment in the Western Hierarchate of Nesia.'
    },
    ARRASI_FRONTIER: {
      id: 'arrasi_frontier',
      name: 'Arrasi Frontier',
      description: 'The contested borderlands between the Empire and the Arrasi territories.'
    },
    WALL_OF_NESIA: {
      id: 'wall_of_nesia',
      name: 'Wall of Nesia',
      description: 'A massive fortified wall, spanning the length of the western border of Nesia. This divides the Nesian state from the Arrasi Peninsula.'
    },
    // Add more locations as needed
  };
  
  // Campaign parts definitions - The overall structure of the campaign
  window.CAMPAIGN_PARTS = [
    {
      id: 'part_1',
      title: 'Advance to the Frontier',
      description: 'March with your unit to the Arrasi Frontier.',
      location: window.CAMPAIGN_LOCATIONS.WALL_OF_NESIA,
      startDay: 2, 
      mainQuestId: 'frontier_campaign', // This quest needs to be created
      requiredForProgression: true,
      nextPartId: 'part_2',
    },
    // Add more campaign parts...
  ];
  
  // Campaign state tracking
  window.campaignState = {
    currentPartId: null,
    completedParts: [],
    failedParts: [],
    currentLocation: window.CAMPAIGN_LOCATIONS.KASVAARI_CAMP.id,
    campaignStatus: window.CAMPAIGN_STATUS.NOT_STARTED,
    specialFlags: {} // For campaign-specific flags
  };
  
  // Initialize the campaign system
  window.initializeCampaignSystem = function() {
    console.log("Initializing campaign system...");
    
    // Set up default state if not already in gameState
    if (!window.gameState.campaignState) {
      window.gameState.campaignState = JSON.parse(JSON.stringify(window.campaignState));
    }
    
    // Register event listener for day changes to check campaign triggers
    window.addEventListener('dayChanged', window.checkCampaignTriggers);
    
    // Check if any campaign parts should be active based on current day
    window.checkCampaignTriggers();
    
    console.log("Campaign system initialized");
  };
  
  // Check for campaign triggers based on day or conditions
  window.checkCampaignTriggers = function() {
    console.log("Checking campaign triggers for day " + window.gameDay);
    
    // If campaign hasn't started, check for start condition
    if (window.gameState.campaignState.campaignStatus === window.CAMPAIGN_STATUS.NOT_STARTED) {
      const firstPart = window.CAMPAIGN_PARTS[0];
      if (window.gameDay >= firstPart.startDay) {
        window.startCampaignPart(firstPart.id);
      }
      return;
    }
    
    // If campaign is in progress, check for next part trigger
    if (window.gameState.campaignState.campaignStatus === window.CAMPAIGN_STATUS.IN_PROGRESS) {
      const currentPartId = window.gameState.campaignState.currentPartId;
      const currentPart = window.CAMPAIGN_PARTS.find(part => part.id === currentPartId);
      
      // If current part is completed, check for next part
      if (window.gameState.campaignState.completedParts.includes(currentPartId)) {
        const nextPartId = currentPart.nextPartId;
        
        if (nextPartId) {
          const nextPart = window.CAMPAIGN_PARTS.find(part => part.id === nextPartId);
          
          // Check if we need to wait before starting next part
          const completionDay = window.gameState.campaignState.completedParts[currentPartId + '_day'] || window.gameDay;
          const requiredDay = completionDay + (nextPart.startDelay || 0);
          
          if (window.gameDay >= requiredDay) {
            window.startCampaignPart(nextPartId);
          }
        }
      }
    }
  };
  
  // Start a specific campaign part
  window.startCampaignPart = function(partId) {
    const part = window.CAMPAIGN_PARTS.find(p => p.id === partId);
    
    if (!part) {
      console.error(`Campaign part "${partId}" not found`);
      return false;
    }
    
    console.log(`Starting campaign part: ${part.title}`);
    
    // Update campaign state
    window.gameState.campaignState.currentPartId = partId;
    window.gameState.campaignState.campaignStatus = window.CAMPAIGN_STATUS.IN_PROGRESS;
    
    // Change location if needed
    if (part.location && part.location.id !== window.gameState.campaignState.currentLocation) {
      window.changeCampaignLocation(part.location.id);
    }
    
    // Assign the main quest for this part
    if (part.mainQuestId) {
      window.forceAssignQuest(part.mainQuestId);
    }
    
    // Show notification to player
    window.showNotification(`Campaign: ${part.title}`, 'campaign');
    
    // Add narrative introduction
    window.setNarrative(`<strong>${part.title}</strong><br>${part.description}`);
    
    return true;
  };
  
  // Complete a campaign part
  window.completeCampaignPart = function(partId) {
    const part = window.CAMPAIGN_PARTS.find(p => p.id === partId);
    
    if (!part) {
      console.error(`Campaign part "${partId}" not found`);
      return false;
    }
    
    console.log(`Completing campaign part: ${part.title}`);
    
    // Add to completed parts
    if (!window.gameState.campaignState.completedParts.includes(partId)) {
      window.gameState.campaignState.completedParts.push(partId);
      
      // Store completion day for delay calculations
      window.gameState.campaignState.completedParts[partId + '_day'] = window.gameDay;
    }
    
    // Show notification
    window.showNotification(`Campaign part completed: ${part.title}`, 'success');
    
    // Check for end of campaign
    if (!part.nextPartId) {
      window.gameState.campaignState.campaignStatus = window.CAMPAIGN_STATUS.COMPLETED;
      window.showNotification('You have completed the campaign!', 'campaign');
    } else {
      // Check if we can start next part immediately
      if (!part.startDelay || part.startDelay === 0) {
        window.startCampaignPart(part.nextPartId);
      }
    }
    
    return true;
  };
  
  // Fail a campaign part
  window.failCampaignPart = function(partId) {
    const part = window.CAMPAIGN_PARTS.find(p => p.id === partId);
    
    if (!part) {
      console.error(`Campaign part "${partId}" not found`);
      return false;
    }
    
    console.log(`Failed campaign part: ${part.title}`);
    
    // Add to failed parts
    if (!window.gameState.campaignState.failedParts.includes(partId)) {
      window.gameState.campaignState.failedParts.push(partId);
    }
    
    // If this part is required for progression, end the campaign
    if (part.requiredForProgression) {
      window.gameState.campaignState.campaignStatus = window.CAMPAIGN_STATUS.FAILED;
      window.showNotification('Campaign failed!', 'warning');
    } else {
      // Otherwise, try to proceed to next part
      if (part.nextPartId) {
        window.startCampaignPart(part.nextPartId);
      }
    }
    
    return true;
  };
  
  // Change the player's location
window.changeCampaignLocation = function(locationId) {
  const location = Object.values(window.CAMPAIGN_LOCATIONS).find(loc => loc.id === locationId);
  
  if (!location) {
    console.error(`Location "${locationId}" not found`);
    return false;
  }
  
  console.log(`Changing location to: ${location.name}`);
  
  // Update campaign state
  window.gameState.campaignState.currentLocation = locationId;
  
  // Update UI elements
  document.getElementById('location').textContent = `Location: ${location.name}`;
  document.querySelector('.game-header h1').textContent = location.name;
  
  // Reset daily activities
  window.gameState.dailyTrainingCount = 0;
  window.gameState.dailyPatrolDone = false;
  window.gameState.dailyScoutDone = false;
  
  // Update available actions
  window.updateActionButtons();
  
  // Add narrative about the new location
  window.setNarrative(`You have arrived at ${location.name}. ${location.description}`);
  
  // Show notification
  window.showNotification(`Arrived at: ${location.name}`, 'info');
  
  // Change music based on location
  if (window.setMusicContext) {
    if (locationId === window.CAMPAIGN_LOCATIONS.KASVAARI_CAMP.id) {
      window.setMusicContext('camp', 'campMarch');
    } else {
      // For other locations, use campaign music
      window.setMusicContext('campaign');
    }
  }
  
  return true;
};
  
  // Get the current campaign part data
  window.getCurrentCampaignPart = function() {
    const currentPartId = window.gameState.campaignState.currentPartId;
    return window.CAMPAIGN_PARTS.find(part => part.id === currentPartId);
  };
  
  // Get the current location data
  window.getCurrentCampaignLocation = function() {
    const currentLocationId = window.gameState.campaignState.currentLocation;
    return Object.values(window.CAMPAIGN_LOCATIONS).find(loc => loc.id === currentLocationId);
  };