// questRewards.js - Enhanced Quest Reward System
// Adds detailed quest rewards, reward screen, and improved narrative integration

// Define enhanced quest rewards - allows for more complex reward structures
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
      // If player completes the quest without taking too much damage in combat
      flawlessCombat: {
        experience: 25, // Bonus XP
        taelors: 20,    // Bonus pay
        items: [
          { id: 'druskari_helm', quantity: 1, message: 'Elite Arrasi helmet from the enemy commander' }
        ]
      },
      
      // If player completes the quest quickly
      timeEfficient: {
        experience: 15,
        items: [
          { id: 'repairKit', quantity: 1, message: 'Bonus field supplies for quick operation' }
        ]
      }
    },
    
    // Final dialogue from the Sarkein that mentions the rewards
    completionDialogue: 'The maps and intelligence you recovered will be invaluable for future operations in this sector. Your unit\'s performance was commendable, and you\'ve earned these spoils. The Arrasi blade is particularly fine - a mark of an officer. Keep it as a trophy of your victory.'
  },
  
  // Enhanced rewards for the Patrol Duty quest
  patrol_duty: {
    experience: 75,
    taelors: 30,
    
    items: [
      { id: 'health_potion', quantity: 1, message: 'Field medical supplies' },
      { id: 'arrasi_dagger', quantity: 1, message: 'A small dagger taken from an Arrasi scout' }
    ],
    
    conditionalRewards: {
      // If player reports the ambush quickly
      quickReport: {
        experience: 15,
        taelors: 10,
        items: [
          { id: 'scouting_map', quantity: 1, message: 'Updated patrol routes with marked danger zones' }
        ]
      }
    },
    
    completionDialogue: 'Your patrol has provided valuable intelligence about Arrasi movements in the area. The speed of your report has helped us prepare defenses against their probing attacks. Good work, soldier.'
  }
};

// Custom item definitions for quest rewards
window.createQuestRewardItems = function() {
  // Don't redefine items if they already exist
  if (window.itemTemplates && window.itemTemplates.arrasi_blade) return;
  
  // Ensure we have item templates
  if (!window.itemTemplates) {
    console.error("Item templates not initialized. Cannot create quest reward items.");
    return;
  }
  
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
  
  // Create Arrasi Dagger for patrol quest
  window.itemTemplates.arrasi_dagger = window.createWeapon({
    id: 'arrasi_dagger',
    name: 'Arrasi Scout Dagger',
    description: 'A lightweight dagger used by Arrasi scouts. The blade is thin and sharp, designed for silent kills rather than combat.',
    weaponType: window.WEAPON_TYPES.DAGGER,
    rarity: window.ITEM_RARITIES.UNCOMMON,
    damage: 6,
    value: 45,
    stats: {
      damage: 6,
      speed: 9,
      critChance: 10,
      intimidation: 2
    },
    maxDurability: 80
  });
  
  // Create Scouting Map for patrol quest conditional reward
  window.itemTemplates.scouting_map = window.createItemTemplate({
    id: 'scouting_map',
    name: 'Annotated Scouting Map',
    description: 'A detailed map of local terrain with patrol routes and danger zones marked. Useful for avoiding Arrasi scouts in the future.',
    category: window.ITEM_CATEGORIES.QUEST,
    rarity: window.ITEM_RARITIES.UNCOMMON,
    value: 40,
    weight: 0.1,
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
      // Example conditional rewards
      
      // For flawless combat condition - check if player maintained high health
      if (enhancedRewards.conditionalRewards.flawlessCombat && 
          window.gameState.health > window.gameState.maxHealth * 0.8) {
        
        applyConditionalReward(
          enhancedRewards.conditionalRewards.flawlessCombat, 
          rewardSummary, 
          'Flawless Combat Bonus'
        );
      }
      
      // For time efficient condition - check if quest completed quickly
      const questDuration = window.gameDay - quest.assignmentDay;
      if (enhancedRewards.conditionalRewards.timeEfficient && 
          questDuration <= 1) {
        
        applyConditionalReward(
          enhancedRewards.conditionalRewards.timeEfficient, 
          rewardSummary, 
          'Efficiency Bonus'
        );
      }
      
      // For quick report in patrol quest
      if (questId === 'patrol_duty' && 
          enhancedRewards.conditionalRewards.quickReport &&
          quest.userData && 
          quest.userData.reportTime && 
          quest.userData.reportTime < 120) { // Less than 2 hours
        
        applyConditionalReward(
          enhancedRewards.conditionalRewards.quickReport, 
          rewardSummary, 
          'Quick Report Bonus'
        );
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

// Initialize quest reward system
window.initializeQuestRewardSystem = function() {
  console.log("Initializing enhanced quest reward system...");
  
  // Create quest reward items
  window.createQuestRewardItems();
  
  console.log("Quest reward system initialized");
};

// Initialize when document is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.initializeQuestRewardSystem();
});