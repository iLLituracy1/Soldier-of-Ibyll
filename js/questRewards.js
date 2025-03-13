// questRewards.js - Enhanced Quest Reward System
// Adds detailed quest rewards, reward screen, and improved narrative integration

// Enhanced quest rewards with expanded item definitions
window.enhancedQuestRewards = {
  // Enhanced rewards for the Raid the Frontier quest
  raid_frontier: {
    // Basic rewards defined in the original quest template
    experience: 100,
    taelors: 50,
    
    // Enhanced items with more variety and thematic connection to the mission
    items: [
      { id: 'health_potion', quantity: 2, message: 'Medicinal supplies recovered from the outpost' },
      { id: 'arrasi_blade', quantity: 1, message: 'An ornate Arrasi officer\'s blade' }, 
      { id: 'arrasi_pendant', quantity: 1, message: 'Intelligence: A pendant with Arrasi military markings' },
      { id: 'captured_maps', quantity: 1, message: 'Intelligence: Arrasi patrol routes and supply lines' }
    ],
    
    // Conditional rewards based on player performance during the quest
    conditionalRewards: {
      // If player completes the quest with high formation cohesion in the final battle
      highCohesion: {
        experience: 25, // Bonus XP
        taelors: 20,    // Bonus pay
        items: [
          { id: 'druskari_helm', quantity: 1, message: 'Elite Arrasi helmet from the enemy commander' }
        ]
      },
      
      // If player completes the quest without taking casualties in the patrol encounter
      noPatrolCasualties: {
        experience: 15,
        items: [
          { id: 'repairKit', quantity: 1, message: 'Bonus field supplies for minimizing casualties' }
        ]
      }
    },
    
    // Final dialogue from the Sarkein that mentions the rewards
    completionDialogue: 'The maps and intelligence you recovered will be invaluable for future operations in this sector. Your unit\'s performance was commendable, and you\'ve earned these spoils. The Arrasi blade is particularly fine - a mark of an officer. Keep it as a trophy of your victory.'
  },
  
  // Template for additional quests to be added later
  /* 
  future_quest_id: {
    experience: 0,
    taelors: 0,
    items: [],
    conditionalRewards: {},
    completionDialogue: ''
  }
  */
};

// Custom item definitions for quest rewards
window.createQuestRewardItems = function() {
  // Don't redefine items if they already exist
  if (window.itemTemplates.arrasi_blade) return;
  
  // Create Arrasi Blade - officer's weapon as a trophy
  window.itemTemplates.arrasi_blade = window.createWeapon({
    id: 'arrasi_blade',
    name: 'Arrasi Officer\'s Blade',
    description: 'A finely crafted sword taken from an Arrasi officer during the raid. Its ornate hilt bears the insignia of an Arrasi military house.',
    weaponType: window.WEAPON_TYPES.SWORD,
    rarity: window.ITEM_RARITIES.RARE,
    damage: 12,
    value: 150,
    stats: {
      damage: 12,
      speed: 5,
      critChance: 8,
      intimidation: 5
    },
    maxDurability: 100
  });
  
  // Create Arrasi Pendant - intelligence item
  window.itemTemplates.arrasi_pendant = window.createItemTemplate({
    id: 'arrasi_pendant',
    name: 'Arrasi Military Pendant',
    description: 'A metal pendant with Arrasi military markings. It appears to be a unit identifier or rank insignia. Intelligence officers will want to examine this.',
    category: window.ITEM_CATEGORIES.QUEST,
    rarity: window.ITEM_RARITIES.UNCOMMON,
    value: 30,
    weight: 0.1,
    symbol: '📿',
    stackable: false
  });
  
  // Create Captured Maps - intelligence item
  window.itemTemplates.captured_maps = window.createItemTemplate({
    id: 'captured_maps',
    name: 'Captured Arrasi Maps',
    description: 'Maps showing Arrasi patrol routes and supply lines. This intelligence will be extremely valuable for future operations in the region.',
    category: window.ITEM_CATEGORIES.QUEST,
    rarity: window.ITEM_RARITIES.RARE,
    value: 75,
    weight: 0.2,
    symbol: '🗺️',
    stackable: false
  });
  
  console.log("Quest reward items created");
};

// Enhanced function to apply all quest rewards
window.applyQuestRewards = function(quest) {
  if (!quest) {
    console.error("Cannot apply rewards to undefined quest");
    return false;
  }
  
  console.log(`Applying rewards for quest: ${quest.id}`);
  
  // Get enhanced rewards if available
  const questId = quest.templateId;
  let rewardsToApply = quest.rewards || {};
  let enhancedRewards = window.enhancedQuestRewards[questId];
  
  // Collect all rewards that will be displayed
  const rewardSummary = {
    experience: 0,
    taelors: 0,
    items: []
  };
  
  // Apply base experience
  if (rewardsToApply.experience) {
    const expAmount = rewardsToApply.experience;
    window.gameState.experience += expAmount;
    rewardSummary.experience += expAmount;
    console.log(`Added ${expAmount} experience`);
  }
  
  // Apply base currency
  if (rewardsToApply.taelors) {
    const taelorsAmount = rewardsToApply.taelors;
    window.player.taelors += taelorsAmount;
    rewardSummary.taelors += taelorsAmount;
    console.log(`Added ${taelorsAmount} taelors`);
  }
  
  // Apply base items
  if (rewardsToApply.items && rewardsToApply.items.length > 0) {
    rewardsToApply.items.forEach(itemId => {
      // Simple format from original reward system
      if (typeof itemId === 'string') {
        const itemTemplate = window.itemTemplates[itemId];
        if (itemTemplate) {
          window.addItemToInventory(itemTemplate);
          rewardSummary.items.push({
            id: itemId,
            name: itemTemplate.name,
            quantity: 1,
            message: ''
          });
        }
      }
    });
  }
  
  // Apply enhanced rewards if available
  if (enhancedRewards) {
    // Ensure quest reward items are created
    window.createQuestRewardItems();
    
    // Apply enhanced experience
    if (enhancedRewards.experience) {
      const enhancedExp = enhancedRewards.experience;
      window.gameState.experience += enhancedExp;
      rewardSummary.experience += enhancedExp;
      console.log(`Added ${enhancedExp} enhanced experience`);
    }
    
    // Apply enhanced currency
    if (enhancedRewards.taelors) {
      const enhancedTaelors = enhancedRewards.taelors;
      window.player.taelors += enhancedTaelors;
      rewardSummary.taelors += enhancedTaelors;
      console.log(`Added ${enhancedTaelors} enhanced taelors`);
    }
    
    // Apply enhanced items
    if (enhancedRewards.items && enhancedRewards.items.length > 0) {
      enhancedRewards.items.forEach(item => {
        const itemTemplate = window.itemTemplates[item.id];
        if (itemTemplate) {
          // Add the item to inventory, respecting quantity
          for (let i = 0; i < (item.quantity || 1); i++) {
            window.addItemToInventory(itemTemplate);
          }
          
          // Add to reward summary
          rewardSummary.items.push({
            id: item.id,
            name: itemTemplate.name,
            quantity: item.quantity || 1,
            message: item.message || ''
          });
          
          console.log(`Added ${item.quantity || 1}x ${itemTemplate.name} to inventory`);
        } else {
          console.error(`Item template not found: ${item.id}`);
        }
      });
    }
    
    // Apply conditional rewards based on quest-specific conditions
    if (enhancedRewards.conditionalRewards) {
      // Check for high cohesion in formation battles
      if (enhancedRewards.conditionalRewards.highCohesion && 
          window.shieldwallSystem && 
          window.shieldwallSystem.state && 
          window.shieldwallSystem.state.cohesion && 
          window.shieldwallSystem.state.cohesion.current > 60) {
        
        applyConditionalReward(enhancedRewards.conditionalRewards.highCohesion, rewardSummary, 'Formation Cohesion Bonus');
      }
      
      // Check for no casualties during patrol encounter
      if (enhancedRewards.conditionalRewards.noPatrolCasualties && 
          quest.userData && 
          quest.userData.patrolCasualties === 0) {
        
        applyConditionalReward(enhancedRewards.conditionalRewards.noPatrolCasualties, rewardSummary, 'Perfect Patrol Bonus');
      }
    }
  }
  
  // Display the reward summary screen
  window.showQuestRewardScreen(quest, rewardSummary);
  
  // Check for level up after applying all rewards
  window.checkLevelUp();
  
  return true;
};

// Helper function to apply a conditional reward
function applyConditionalReward(conditionalReward, rewardSummary, bonusLabel) {
  // Apply bonus experience
  if (conditionalReward.experience) {
    window.gameState.experience += conditionalReward.experience;
    rewardSummary.experience += conditionalReward.experience;
    console.log(`Added ${conditionalReward.experience} bonus experience (${bonusLabel})`);
  }
  
  // Apply bonus currency
  if (conditionalReward.taelors) {
    window.player.taelors += conditionalReward.taelors;
    rewardSummary.taelors += conditionalReward.taelors;
    console.log(`Added ${conditionalReward.taelors} bonus taelors (${bonusLabel})`);
  }
  
  // Apply bonus items
  if (conditionalReward.items && conditionalReward.items.length > 0) {
    conditionalReward.items.forEach(item => {
      const itemTemplate = window.itemTemplates[item.id];
      if (itemTemplate) {
        // Add the item to inventory, respecting quantity
        for (let i = 0; i < (item.quantity || 1); i++) {
          window.addItemToInventory(itemTemplate);
        }
        
        // Add to reward summary with bonus label
        rewardSummary.items.push({
          id: item.id,
          name: itemTemplate.name,
          quantity: item.quantity || 1,
          message: `${item.message || ''} (${bonusLabel})`,
          isBonus: true
        });
        
        console.log(`Added ${item.quantity || 1}x ${itemTemplate.name} to inventory (${bonusLabel})`);
      }
    });
  }
}

// Function to show reward summary screen
window.showQuestRewardScreen = function(quest, rewards) {
  // Create a div for the reward screen if it doesn't exist
  let rewardScreen = document.getElementById('questRewardScreen');
  if (rewardScreen) {
    rewardScreen.remove();
  }
  
  rewardScreen = document.createElement('div');
  rewardScreen.id = 'questRewardScreen';
  rewardScreen.className = 'quest-reward-screen';
  
  // Create the reward screen content
  rewardScreen.innerHTML = `
    <div class="reward-content">
      <h2 class="reward-title">QUEST REWARDS</h2>
      <h3 class="quest-name">${quest.title}</h3>
      
      <div class="reward-summary">
        ${rewards.experience > 0 ? `<div class="reward-item"><span class="reward-label">Experience:</span> <span class="reward-value">+${rewards.experience} XP</span></div>` : ''}
        ${rewards.taelors > 0 ? `<div class="reward-item"><span class="reward-label">Taelors:</span> <span class="reward-value">+${rewards.taelors}</span></div>` : ''}
        
        ${rewards.items.length > 0 ? `
          <div class="reward-items-section">
            <div class="reward-label">Items Received:</div>
            <div class="reward-items-list">
              ${rewards.items.map(item => `
                <div class="reward-item ${item.isBonus ? 'bonus-reward' : ''}">
                  <div class="item-name">${item.quantity > 1 ? `${item.quantity}× ` : ''}${item.name}</div>
                  ${item.message ? `<div class="item-message">${item.message}</div>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
      
      <div class="rewards-dialogue">
        ${window.enhancedQuestRewards[quest.templateId]?.completionDialogue || ''}
      </div>
      
      <button id="rewardContinueBtn" class="reward-continue-btn">
        CONTINUE
      </button>
    </div>
  `;
  
  // Add the reward screen to the page
  document.body.appendChild(rewardScreen);
  
  // Add event listener to continue button
  document.getElementById('rewardContinueBtn').addEventListener('click', function() {
    rewardScreen.remove();
    
    // Show notification of quest completion
    window.showQuestNotification(quest, 'completed');
    
    // Resume the game
    window.updateActionButtons();
  });
  
  // Add CSS for reward screen
  addRewardScreenStyles();
};

// Function to add CSS styles for the reward screen
function addRewardScreenStyles() {
  if (document.getElementById('quest-reward-styles')) return;
  
  const styleElement = document.createElement('style');
  styleElement.id = 'quest-reward-styles';
  styleElement.textContent = `
    .quest-reward-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
    }
    
    .reward-content {
      background-color: #1a1a1a;
      border: 3px solid #c9aa71;
      border-radius: 10px;
      padding: 30px;
      max-width: 600px;
      width: 80%;
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
    }
    
    .reward-title {
      color: #c9aa71;
      font-size: 2em;
      text-align: center;
      margin: 0 0 10px 0;
      text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    }
    
    .quest-name {
      color: #e0e0e0;
      font-size: 1.4em;
      text-align: center;
      margin: 0 0 20px 0;
      border-bottom: 1px solid #444;
      padding-bottom: 10px;
    }
    
    .reward-summary {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    .reward-item {
      margin-bottom: 10px;
      padding: 8px;
      border-radius: 4px;
      background-color: rgba(255, 255, 255, 0.05);
    }
    
    .bonus-reward {
      background-color: rgba(201, 170, 113, 0.15);
      border-left: 3px solid #c9aa71;
    }
    
    .reward-label {
      color: #888;
      font-weight: bold;
      margin-bottom: 5px;
      display: block;
    }
    
    .reward-value {
      color: #a8e063;
      font-weight: bold;
    }
    
    .reward-items-section {
      margin-top: 15px;
    }
    
    .reward-items-list {
      margin-top: 10px;
    }
    
    .item-name {
      color: #e0e0e0;
      font-weight: bold;
    }
    
    .item-message {
      color: #aaa;
      font-size: 0.9em;
      font-style: italic;
      margin-top: 5px;
    }
    
    .rewards-dialogue {
      color: #e0e0e0;
      font-size: 1em;
      line-height: 1.4;
      margin-bottom: 25px;
      font-style: italic;
      border-left: 3px solid #444;
      padding-left: 15px;
    }
    
    .reward-continue-btn {
      background-color: #3a3a3a;
      color: #ffffff;
      border: none;
      padding: 12px 30px;
      font-size: 1.1em;
      font-weight: bold;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.3s;
      display: block;
      margin: 0 auto;
    }
    
    .reward-continue-btn:hover {
      background-color: #4a4a4a;
      transform: translateY(-2px);
    }
    
    .reward-continue-btn:active {
      transform: translateY(1px);
    }
  `;
  
  document.head.appendChild(styleElement);
}

// Enhanced handleReturnToCamp function to integrate better with the reward system
window.enhancedHandleReturnToCamp = function(quest) {
  // Track performance data for conditional rewards
  if (!quest.userData) quest.userData = {};
  
  // Get battle cohesion from shieldwall system if available
  if (window.shieldwallSystem && window.shieldwallSystem.state) {
    quest.userData.formationCohesion = window.shieldwallSystem.state.cohesion.current;
  }
  
  // Set narrative for the quest conclusion
  window.setNarrative(`
    <p>Your Spear Host returns to camp victorious, bearing captured supplies and valuable intelligence. The elimination of the Arrasi outpost represents a significant blow to enemy operations in the region.</p>
    
    <p>Later that evening, the Vayren calls for you. "Report to the Sarkein's tent," he orders. "Apparently, he wants to hear about the scouting mission from someone who was there."</p>
    
    <p>When you arrive at the command tent, Sarkein Reval is studying the captured maps. He acknowledges your salute with a nod.</p>
    
    <p>"Your Squad performed well today," he says. "The intelligence your unit recovered will help us plan our next moves in this sector."</p>
    
    <p>The Sarkein gestures to a collection of items laid out on a corner of the table - spoils from the raid allocated to your unit.</p>
    
    <p>"These are yours by right of conquest," he continues. "The officer's blade is particularly fine - Arrasi steel, but with a balance superior to their typical work. Take it with my compliments."</p>
    
    <p>He studies the maps thoughtfully. "Tell your Vayren that I'll be looking to his unit for future operations. The Empire needs soldiers who can think and act decisively."</p>
    
    <p>As you leave the Sarkein's tent with your share of the spoils, there's a new respect in the eyes of your fellow soldiers. Your Squad's actions today have made a difference, and your reputation within the Kasvaari has grown.</p>
  `);
  
  // Create a continue button that will trigger rewards and quest completion
  const actionsContainer = document.getElementById('questActions');
  if (actionsContainer) {
    actionsContainer.innerHTML = '';
    
    const continueButton = document.createElement('button');
    continueButton.className = 'quest-action-btn';
    continueButton.textContent = 'Collect Rewards';
    continueButton.onclick = function() {
      // Complete the quest, which will trigger our enhanced reward system
      window.completeQuest(quest.id);
    };
    
    actionsContainer.appendChild(continueButton);
  } else {
    // If actions container isn't available, complete quest directly
    setTimeout(() => {
      window.completeQuest(quest.id);
    }, 2000);
  }
};

// Function to safely modify the original completeQuest function
window.enhanceCompleteQuest = function() {
  // Store the original function safely
  if (!window._originalCompleteQuest && window.completeQuest) {
    window._originalCompleteQuest = window.completeQuest;
    
    // Create the new enhanced version that uses our reward system
    window.completeQuest = function(questId) {
      const questIndex = window.quests.findIndex(q => q.id === questId);
      if (questIndex === -1) {
        console.error(`Quest "${questId}" not found`);
        return false;
      }
      
      const quest = window.quests[questIndex];
      quest.status = window.QUEST_STATUS.COMPLETED;
      quest.completionDay = window.gameDay;
      
      // Reset quest sequence flag
      window.gameState.inQuestSequence = false;
      window.gameState.awaitingQuestResponse = false;
      
      // Apply enhanced rewards instead of original rewards
      window.applyQuestRewards(quest);
      
      // Update quest log if visible
      window.renderQuestLog();
      
      // Exit quest scene if we're in it
      if (!document.getElementById('questSceneContainer').classList.contains('hidden')) {
        window.exitQuestScene();
      }
      
      return true;
    };
    
    console.log("Enhanced completeQuest function installed");
  }
};

// Apply the enhancement to handleReturnToCamp function
window.enhanceHandleReturnToCamp = function() {
  if (!window._originalHandleReturnToCamp && window.handleReturnToCamp) {
    window._originalHandleReturnToCamp = window.handleReturnToCamp;
    window.handleReturnToCamp = window.enhancedHandleReturnToCamp;
    console.log("Enhanced handleReturnToCamp function installed");
  }
};

// Initialize quest reward system
window.initializeQuestRewardSystem = function() {
  console.log("Initializing enhanced quest reward system...");
  
  // Create quest reward items
  window.createQuestRewardItems();
  
  // Enhance quest system functions
  window.enhanceCompleteQuest();
  window.enhanceHandleReturnToCamp();
  
  console.log("Quest reward system initialized");
};

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.initializeQuestRewardSystem();
});