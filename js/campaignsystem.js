// js/campaignSystem.js - Complete implementation of the campaign system

// Initialize a campaign
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

// Show campaign briefing
window.showCampaignBriefing = function(campaign) {
  // Display campaign information to the player
  window.addToNarrative(`
    <h3>Campaign Briefing: ${campaign.name}</h3>
    <p>${campaign.description}</p>
    <p>You are now at Stage ${campaign.currentStage} of the campaign. Report to the command tent for mission assignments.</p>
  `);
};

// Show campaign stage briefing
window.showCampaignStageBriefing = function(campaign, stageInfo) {
  window.addToNarrative(`
    <h3>Campaign Stage ${stageInfo.stage}: ${stageInfo.name}</h3>
    <p>You have progressed to a new stage in the campaign.</p>
    <p>New missions are now available. Visit the command tent to select your next assignment.</p>
  `);
};

// Show campaign victory
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

// Update campaign progress after mission completion
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

// Complete a campaign
window.completeCampaign = function(campaign) {
  campaign.state = "completed";
  
  // Award campaign rewards
  const rewards = window.campaignTemplates[campaign.type].victoryRewards;
  
  window.gameState.experience += rewards.experience;
  window.player.taelors += rewards.taelors;
  
  // Add special item
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

// Unlock veteran features for subsequent playthroughs
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

// Load veteran features when starting a new game
window.loadVeteranFeatures = function() {
  const unlockedFeatures = JSON.parse(localStorage.getItem('unlockedFeatures') || '{}');
  
  if (unlockedFeatures.veteranStatus) {
    // Apply veteran bonuses to new character
    // - Higher starting stats
    // - Access to special veteran dialogue options
    // - Unlock leadership abilities
    
    // Veteran-specific starting equipment
    if (window.player.inventory.length < 20) {
      window.player.inventory.push(window.items.veteran_medal);
    }
    
    // This function would be called during character creation
  }
  
  return unlockedFeatures;
};

// Initialize the items object if it doesn't exist
if (!window.items) {
  window.items = {
    "veteran_medal": {
      name: "Veteran's Medal of Honor",
      type: "accessory",
      value: 50,
      effect: "Grants +5% to all skill gains"
    },
    "arrasi_campaign_medal": {
      name: "Arrasi Campaign Medal",
      type: "accessory",
      value: 40,
      effect: "Grants +10% to command skill checks"
    },
    // Add more items as needed
  };
}

console.log("Campaign System loaded successfully");
