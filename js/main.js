// MAIN ENTRY POINT
// This is the main entry point that initializes the game and sets up event listeners

// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Game initializing...");

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

// Add this code to the bottom of js/main.js to ensure campaign and mission systems
// are properly initialized and available when needed

document.addEventListener('DOMContentLoaded', function() {
  // Original main.js initialization code remains above this

  // Load campaign and mission systems
  console.log("Initializing campaign and mission systems...");
  
  // Ensure the campaign system is initialized and available
  if (typeof window.initiateCampaign !== 'function') {
    console.log("Setting up campaign system");
    
    // Campaign initialization function (based on js/campaignSystem.js)
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
    
    // Show campaign stage briefing
    window.showCampaignStageBriefing = function(campaign, stageInfo) {
      window.addToNarrative(`
        <h3>Campaign Stage ${stageInfo.stage}: ${stageInfo.name}</h3>
        <p>You have progressed to a new stage in the campaign.</p>
        <p>New missions are now available. Visit the command tent to select your next assignment.</p>
      `);
    };
    
    // Complete campaign function
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
  
  // Ensure mission system is initialized and available
  if (typeof window.showMissionSelectionScreen !== 'function') {
    console.log("Setting up mission selection system");
    
    // Mission selection screen function
    window.showMissionSelectionScreen = function() {
      const campaign = window.gameState.currentCampaign;
      if (!campaign) {
        console.error("No active campaign found");
        window.addToNarrative("There are no missions available at this time.");
        return;
      }
      
      // Get current stage
      const currentStage = window.campaignTemplates[campaign.type]
        .missionProgression.find(stage => stage.stage === campaign.currentStage);
      
      if (!currentStage) {
        console.error("No stage found for current campaign");
        window.addToNarrative("There are no missions available at this time.");
        return;
      }
      
      // Build mission selection UI
      const actionsContainer = document.getElementById('actions');
      actionsContainer.innerHTML = '';
      
      // Add title
      const title = document.createElement('h3');
      title.textContent = `Campaign Stage ${campaign.currentStage}: ${currentStage.name}`;
      title.style.textAlign = 'center';
      title.style.marginBottom = '20px';
      actionsContainer.appendChild(title);
      
      // Add description of current stage
      const stageDescription = document.createElement('p');
      stageDescription.textContent = `Select a mission to advance the campaign. You need to complete ${currentStage.requiredCompletions} missions at this stage.`;
      stageDescription.style.marginBottom = '20px';
      actionsContainer.appendChild(stageDescription);
      
      // Available missions
      currentStage.availableMissions.forEach(missionType => {
        // Check if already completed
        const alreadyCompleted = campaign.completedMissions.includes(missionType);
        
        // Get mission template
        const missionTemplate = window.missionTypes[missionType];
        if (!missionTemplate) return;
        
        // Create mission card
        const missionCard = document.createElement('div');
        missionCard.className = 'mission-card';
        missionCard.style.border = '1px solid #444';
        missionCard.style.borderRadius = '8px';
        missionCard.style.padding = '15px';
        missionCard.style.marginBottom = '15px';
        missionCard.style.background = alreadyCompleted ? '#2a3b2a' : '#1a1a1a';
        
        // Mission title
        const missionTitle = document.createElement('h4');
        missionTitle.textContent = missionTemplate.name;
        missionTitle.style.marginTop = '0';
        missionCard.appendChild(missionTitle);
        
        // Mission description
        const missionDesc = document.createElement('p');
        missionDesc.textContent = missionTemplate.description;
        missionCard.appendChild(missionDesc);
        
        // Mission details
        const missionDetails = document.createElement('div');
        missionDetails.innerHTML = `
          <strong>Difficulty:</strong> ${'★'.repeat(missionTemplate.difficulty)}<br>
          <strong>Duration:</strong> ${missionTemplate.duration} days<br>
          <strong>Reward:</strong> ${missionTemplate.rewards.experience} XP, ${missionTemplate.rewards.taelors} taelors
        `;
        missionCard.appendChild(missionDetails);
        
        // Mission button
        const missionButton = document.createElement('button');
        missionButton.className = 'action-btn';
        missionButton.textContent = alreadyCompleted ? 'Completed' : 'Start Mission';
        missionButton.disabled = alreadyCompleted;
        missionButton.style.marginTop = '10px';
        
        if (!alreadyCompleted) {
          missionButton.onclick = function() {
            if (typeof window.startMission === 'function') {
              window.startMission(missionType);
            } else {
              window.addToNarrative(`Mission system is not fully loaded. You cannot start the ${missionTemplate.name} mission at this time.`);
              window.updateActionButtons();
            }
          };
        }
        
        missionCard.appendChild(missionButton);
        
        // Add to container
        actionsContainer.appendChild(missionCard);
      });
      
      // Back to camp button
      const backButton = document.createElement('button');
      backButton.className = 'action-btn';
      backButton.textContent = 'Return to Camp';
      backButton.style.marginTop = '20px';
      backButton.onclick = function() {
        window.updateActionButtons();
      };
      actionsContainer.appendChild(backButton);
    };
    
    // Basic mission start placeholder if mission system isn't fully loaded
    if (typeof window.startMission !== 'function') {
      window.startMission = function(missionType) {
        const missionTemplate = window.missionTypes[missionType];
        if (!missionTemplate) {
          window.addToNarrative("Mission type not found.");
          return false;
        }
        
        window.addToNarrative(`
          <h3>${missionTemplate.name}</h3>
          <p>${missionTemplate.description}</p>
          <p>You set out on the mission...</p>
          <p>After several days of hard work, you complete your objectives and return to camp.</p>
        `);
        
        // Add mission to completed missions
        const campaign = window.gameState.currentCampaign;
        if (campaign && !campaign.completedMissions.includes(missionType)) {
          campaign.completedMissions.push(missionType);
          
          // Reward player
          window.gameState.experience += missionTemplate.rewards.experience;
          window.player.taelors += missionTemplate.rewards.taelors;
          
          window.addToNarrative(`
            <p>Mission completed successfully!</p>
            <p>Rewards: ${missionTemplate.rewards.experience} XP, ${missionTemplate.rewards.taelors} taelors</p>
          `);
          
          // Update campaign progress
          window.updateCampaignProgress(missionType);
        }
        
        // Restore regular camp actions
        window.updateActionButtons();
        
        return true;
      };
    }
  }
  
  console.log("Campaign and mission systems initialized successfully");
});