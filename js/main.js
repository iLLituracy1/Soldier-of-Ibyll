// MAIN ENTRY POINT
// Initializes the game and sets up event listeners with Time Management integration



// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Game initializing...");

  // Initialize player object with default values
window.player = {
  name: "",
  origin: "",
  career: {
    title: "",
    description: ""
  },
  phy: 1,
  men: 1,
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
  relationships: {},
  inventory: [],
  taelors: 10, // Starting currency
  isVeteran: false,
  veteranTitle: ""
};

  // Set up event listeners for character creation buttons
  document.getElementById('paanic-button').addEventListener('click', function() {
    window.selectOrigin('Paanic');
  });
  
  document.getElementById('nesian-button').addEventListener('click', function() {
    window.selectOrigin('Nesian');
  });
  
  document.getElementById('lunarine-button').addEventListener('click', function() {
    window.selectOrigin('Lunarine');
  });
  
  document.getElementById('wyrdman-button').addEventListener('click', function() {
    window.selectOrigin('Wyrdman');
  });
  
  document.getElementById('back-to-intro-button').addEventListener('click', window.backToIntro);
  document.getElementById('back-to-origin-button').addEventListener('click', window.backToOrigin);
  document.getElementById('confirm-name-button').addEventListener('click', window.setName);
  document.getElementById('back-to-name-button').addEventListener('click', window.backToName);
  document.getElementById('confirm-character-button').addEventListener('click', window.confirmCharacter);
  document.getElementById('continue-to-empire-button').addEventListener('click', window.showEmpireUpdate);
  document.getElementById('start-adventure-button').addEventListener('click', window.startAdventure);
  
  // Add event listeners for panel close buttons
  document.querySelector('.profile-close').addEventListener('click', function() {
    document.getElementById('profile').classList.add('hidden');
  });
  
  document.querySelector('.inventory-close').addEventListener('click', function() {
    document.getElementById('inventory').classList.add('hidden');
  });
  
  document.querySelector('.quest-log-close').addEventListener('click', function() {
    document.getElementById('questLog').classList.add('hidden');
  });
  
  console.log("Game initialized and ready to play!");
});

// Campaign and mission system initialization
document.addEventListener('DOMContentLoaded', function() {
  console.log("Initializing campaign and mission systems...");
  
  // Ensure the campaign system is initialized and available
  if (typeof window.initiateCampaign !== 'function') {
    console.log("Setting up campaign system");
    
    // Campaign initialization function (based on previous implementation)
    window.initiateCampaign = function(campaignType) {
      // Get campaign template
      const template = window.campaignTemplates[campaignType];
      if (!template) {
        console.error(`Campaign type ${campaignType} not found`);
        return false;
      }
      
      // Create campaign instance
      const campaign = {
        id: 'c' + Date.now().toString(36),
        type: campaignType,
        name: template.name,
        description: template.description,
        currentStage: 1,
        completedMissions: [],
        state: "active", // active, completed, failed
      };
      
      // Store in game state
      window.gameState.currentCampaign = campaign;
      window.gameState.mainQuest.stage = 1;
      
      // Show campaign briefing
      window.showCampaignBriefing(campaign);
      
      return true;
    };
    
    // Campaign briefing function
    window.showCampaignBriefing = function(campaign) {
      // Display campaign information to the player
      window.addToNarrative(`
        <h3>Campaign Briefing: ${campaign.name}</h3>
        <p>${campaign.description}</p>
        <p>You are now at Stage ${campaign.currentStage} of the campaign. Report to the command tent for mission assignments.</p>
      `);
    };
    
    // Campaign progress update function
    window.updateCampaignProgress = function(completedMissionType) {
      const campaign = window.gameState.currentCampaign;
      if (!campaign) return;
      
      // Add to completed missions
      campaign.completedMissions.push(completedMissionType);
      
      // Get current stage
      const currentStageTemplate = window.campaignTemplates[campaign.type]
        .missionProgression.find(stage => stage.stage === campaign.currentStage);
      
      if (!currentStageTemplate) return;
      
      // Count completed missions for this stage
      const completedForStage = campaign.completedMissions.filter(mission => 
        currentStageTemplate.availableMissions.includes(mission)).length;
      
      // Check if stage is complete
      if (completedForStage >= currentStageTemplate.requiredCompletions) {
        // Advance to next stage
        campaign.currentStage++;
        window.gameState.mainQuest.stage = campaign.currentStage;
        
        // Check if campaign is complete
        const nextStage = window.campaignTemplates[campaign.type]
          .missionProgression.find(stage => stage.stage === campaign.currentStage);
        
        if (!nextStage) {
          // Campaign complete!
          window.completeCampaign(campaign);
        } else {
          // Show new stage briefing
          window.showCampaignStageBriefing(campaign, nextStage);
        }
      }
    };
    
    // Campaign completion function
    window.completeCampaign = function(campaign) {
      campaign.state = "completed";
      
      // Award campaign rewards
      const rewards = window.campaignTemplates[campaign.type].victoryRewards;
      
      window.gameState.experience += rewards.experience;
      window.player.taelors += rewards.taelors;
      
      // Add special item if inventory has space
      if (rewards.specialItem && window.player.inventory.length < 20) {
        window.player.inventory.push(window.items[rewards.specialItem]);
      }
      
      // Grant veteran status
      if (rewards.veteranStatus) {
        window.player.isVeteran = true;
        window.player.veteranTitle = rewards.veteranTitle;
        window.unlockVeteranFeatures();
      }
      
      // Update main quest
      window.gameState.mainQuest.completed = true;
      
      // Show victory screen
      window.showCampaignVictory(campaign);
    };
    
    // Show campaign victory function
    window.showCampaignVictory = function(campaign) {
      window.setNarrative(`
        <h3>Campaign Victory!</h3>
        <p>Congratulations! You have successfully completed the ${campaign.name}.</p>
        <p>Your service to the Paanic Empire has been recognized, and your reputation grows.</p>
        <p>New opportunities await you as a veteran of this campaign.</p>
      `);
      
      // Update UI to show celebration
      window.showNotification("Campaign completed successfully!", "success");
    };
    
    // Unlock veteran features function
    window.unlockVeteranFeatures = function() {
      // Store in localStorage for persistence across sessions
      const unlockedFeatures = JSON.parse(localStorage.getItem('unlockedFeatures') || '{}');
      
      // Update unlocked features
      unlockedFeatures.veteranStatus = true;
      unlockedFeatures.veteranTitle = window.player.veteranTitle;
      unlockedFeatures.completedCampaigns = unlockedFeatures.completedCampaigns || [];
      unlockedFeatures.completedCampaigns.push(window.gameState.currentCampaign.type);
      
      // Save to localStorage
      localStorage.setItem('unlockedFeatures', JSON.stringify(unlockedFeatures));
    };
  }
  
  console.log("Campaign and mission systems initialized successfully");
});
