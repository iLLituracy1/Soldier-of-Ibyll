// featsSystem.js - Feats, Deeds, and Ranks system
// Handles deed tracking, commendation awards, rank progression, and feat achievements

// Rank definitions (from lowest to highest)
window.RANKS = [
  { id: 'sai_lun', title: 'Sai\'Lun', description: 'Recruit', deedsRequired: 0 },
  { id: 'marin', title: 'Marin', description: 'Trooper', deedsRequired: 100 },
  { id: 'marin_chei', title: 'Marin\'Chei', description: 'Senior Trooper', deedsRequired: 250 },
  { id: 'sey_na', title: 'Sey\'na', description: 'Sergeant', deedsRequired: 500 },
  { id: 'vayren', title: 'Vayren', description: 'Squad Leader', deedsRequired: 1000 },
  { id: 'sarkein', title: 'Sarkein', description: 'Company Leader', deedsRequired: 2000 },
  { id: 'sen_vaorin', title: 'Sen\'Vaorin', description: 'Senior Line Commander', deedsRequired: 4000 },
  { id: 'kas_taal', title: 'Kas\'Taal', description: 'Banner Captain', deedsRequired: 8000 },
  { id: 'taal_veyar', title: 'Taal\'Veyar', description: 'Regimental Lord', deedsRequired: 16000 }
];

// Deeds sources tracking
window.DEEDS_SOURCES = {
  COMBAT: 'combat',
  QUEST: 'quest',
  SPECIAL: 'special'
};

// Initialize feats system
window.initializeFeatsSystem = function() {
  console.log("Initializing feats system...");
  
  // Initialize gameState properties if needed
  if (!window.gameState.deeds) window.gameState.deeds = 0;
  if (!window.gameState.commendations) window.gameState.commendations = 0;
  if (!window.gameState.rankIndex) window.gameState.rankIndex = 0;
  if (!window.gameState.feats) {
    window.gameState.feats = {
      // Combat feats
      enemiesDefeated: 0,
      enemiesByType: {},
      
      // Quest feats
      questsCompleted: 0,
      questsByType: {},
      
      // Special feats
      specialActions: [],
      
      // Deeds history
      deedsHistory: []
    };
  }
  
  // Add button to UI for feats panel if not already there
  window.addFeatsButton();
  
  console.log("Feats system initialized");
};

// Award deeds to the player
window.awardDeeds = function(amount, source, details) {
  if (!amount || amount <= 0) return false;
  
  // Add deeds
  window.gameState.deeds += amount;
  
  // Record in history
  window.gameState.feats.deedsHistory.push({
    amount: amount,
    source: source,
    details: details,
    date: window.gameDay,
    time: window.gameTime
  });
  
  // Check for commendation
  window.checkCommendation();
  
  // Show notification
  window.showNotification(`+${amount} deeds earned`, 'success');
  
  // Update UI if open
  window.updateFeatsUIIfVisible();
  window.updateProfileIfVisible();
  
  return true;
};

// Check if player has earned a new commendation
window.checkCommendation = function() {
  const currentRank = window.RANKS[window.gameState.rankIndex];
  const nextRankIndex = window.gameState.rankIndex + 1;
  
  // Check if there's a next rank
  if (nextRankIndex >= window.RANKS.length) return false;
  
  const nextRank = window.RANKS[nextRankIndex];
  
  // Check if player has enough deeds for next rank
  if (nextRank.deedsRequired && window.gameState.deeds >= nextRank.deedsRequired) {
    // Award commendation
    window.gameState.commendations++;
    window.gameState.rankIndex = nextRankIndex;
    
    // Award rank-up benefits (health, stamina, etc.)
    window.gameState.maxHealth += 10;
    window.gameState.maxStamina += 5;
 
    
    // Replenish health and stamina
    window.gameState.health = window.gameState.maxHealth;
    window.gameState.stamina = window.gameState.maxStamina;
    
    // Show rank-up notification
    window.showNotification(`Due to your outstanding performance, you have been promoted to ${nextRank.title} (${nextRank.description})!`, 'rank-up');
    
    // Update UI
    window.updateStatusBars();
    
    return true;
  }
  
  return false;
};

// Record a combat victory feat
window.recordCombatFeat = function(enemyType) {
  window.gameState.feats.enemiesDefeated++;
  
  // Track by enemy type
  if (!window.gameState.feats.enemiesByType[enemyType]) {
    window.gameState.feats.enemiesByType[enemyType] = 1;
  } else {
    window.gameState.feats.enemiesByType[enemyType]++;
  }
  
  // Update UI if open
  window.updateFeatsUIIfVisible();
};

// Record a quest completion feat
window.recordQuestFeat = function(questId, questTitle) {
  window.gameState.feats.questsCompleted++;
  
  // Track by quest type
  if (!window.gameState.feats.questsByType[questId]) {
    window.gameState.feats.questsByType[questId] = 1;
  } else {
    window.gameState.feats.questsByType[questId]++;
  }
  
  // Update UI if open
  window.updateFeatsUIIfVisible();
};

// Record a special action feat
window.recordSpecialFeat = function(action, description) {
  window.gameState.feats.specialActions.push({
    action: action,
    description: description,
    date: window.gameDay,
    time: window.gameTime
  });
  
  // Update UI if open
  window.updateFeatsUIIfVisible();
};

// Get current rank information
window.getCurrentRank = function() {
  return window.RANKS[window.gameState.rankIndex];
};

// Get next rank information
window.getNextRank = function() {
  const nextRankIndex = window.gameState.rankIndex + 1;
  if (nextRankIndex >= window.RANKS.length) return null;
  return window.RANKS[nextRankIndex];
};

// Get deeds needed for next rank
window.getDeedsForNextRank = function() {
  const nextRank = window.getNextRank();
  if (!nextRank) return null;
  return nextRank.deedsRequired - window.gameState.deeds;
};

// Add feats button to the UI
window.addFeatsButton = function() {
  const gameControls = document.querySelector('.game-controls');
  if (!gameControls) return;
  
  // Check if button already exists
  if (document.querySelector('.control-btn[onclick="handleAction(\'feats\')"]')) return;
  
  // Create button
  const featsButton = document.createElement('button');
  featsButton.className = 'control-btn';
  featsButton.innerHTML = '<i class="fas fa-medal"></i>Feats & Rank';
  featsButton.onclick = function() {
    window.handleAction('feats');
  };
  
  // Add to controls
  gameControls.appendChild(featsButton);
};

// Show feats panel
window.showFeatsPanel = function() {
  // Create or get the feats panel
  let featsPanel = document.getElementById('featsPanel');
  
  if (!featsPanel) {
    featsPanel = document.createElement('div');
    featsPanel.id = 'featsPanel';
    featsPanel.className = 'panel hidden';
    
    // Create panel header
    const panelHeader = document.createElement('div');
    panelHeader.className = 'panel-header';
    panelHeader.innerHTML = `
      <h3>Feats & Rank</h3>
      <button class="panel-close" onclick="document.getElementById('featsPanel').classList.add('hidden')">×</button>
    `;
    
    // Create panel content
    const panelContent = document.createElement('div');
    panelContent.id = 'featsPanelContent';
    panelContent.className = 'panel-content';
    
    // Assemble panel
    featsPanel.appendChild(panelHeader);
    featsPanel.appendChild(panelContent);
    
    // Add to body
    document.body.appendChild(featsPanel);
  }
  
  // Update panel content
  window.updateFeatsUI();
  
  // Show panel
  featsPanel.classList.remove('hidden');
};

// Update feats UI if visible
window.updateFeatsUIIfVisible = function() {
  const featsPanel = document.getElementById('featsPanel');
  if (featsPanel && !featsPanel.classList.contains('hidden')) {
    window.updateFeatsUI();
  }
};

// Update feats UI content
window.updateFeatsUI = function() {
  const contentElement = document.getElementById('featsPanelContent');
  if (!contentElement) return;
  
  // Get player rank info
  const currentRank = window.getCurrentRank();
  const nextRank = window.getNextRank();
  
  // Build HTML for the panel
  let html = `
    <div class="feats-container">
      <div class="rank-section">
        <h4>Current Rank</h4>
        <div class="current-rank">
          <div class="rank-title">${currentRank.title}</div>
          <div class="rank-desc">${currentRank.description}</div>
        </div>
        
        <div class="rank-progress">
          <div class="deeds-count">Deeds: ${window.gameState.deeds}</div>
          <div class="commendations-count">Commendations: ${window.gameState.commendations}</div>
        </div>
        
        ${nextRank ? `
          <div class="next-rank">
            <h4>Next Rank</h4>
            <div class="rank-title">${nextRank.title} (${nextRank.description})</div>
            <div class="deeds-required">Deeds Required: ${nextRank.deedsRequired}</div>
            <div class="deeds-remaining">Remaining: ${nextRank.deedsRequired - window.gameState.deeds}</div>
            <div class="rank-progress-bar">
              <div class="progress" style="width: ${Math.min(100, (window.gameState.deeds / nextRank.deedsRequired) * 100)}%"></div>
            </div>
          </div>
        ` : '<div class="max-rank">Maximum rank achieved</div>'}
      </div>
      
      <div class="feats-section">
        <h4>Combat Feats</h4>
        <div class="feat-stat">Total Enemies Defeated: ${window.gameState.feats.enemiesDefeated}</div>
        <div class="enemies-by-type">
          ${Object.entries(window.gameState.feats.enemiesByType).map(([type, count]) => 
            `<div class="enemy-type">${type}: ${count}</div>`).join('')}
        </div>
        
        <h4>Quest Feats</h4>
        <div class="feat-stat">Quests Completed: ${window.gameState.feats.questsCompleted}</div>
        <div class="quests-by-type">
          ${Object.entries(window.gameState.feats.questsByType).map(([questId, count]) => {
            const questTitle = window.questTemplates[questId]?.title || questId;
            return `<div class="quest-type">${questTitle}: ${count}</div>`;
          }).join('')}
        </div>
        
        <h4>Special Feats</h4>
        <div class="special-feats">
          ${window.gameState.feats.specialActions.map(action => 
            `<div class="special-feat">
              <div class="feat-desc">${action.description}</div>
              <div class="feat-date">Day ${action.date}</div>
            </div>`).join('')}
        </div>
      </div>
      
      <div class="deeds-history">
        <h4>Recent Deeds</h4>
        <div class="deeds-list">
          ${window.gameState.feats.deedsHistory.slice(-10).reverse().map(deed => 
            `<div class="deed-entry">
              <div class="deed-amount">+${deed.amount} deeds</div>
              <div class="deed-source">${deed.source}: ${deed.details}</div>
              <div class="deed-date">Day ${deed.date}</div>
            </div>`).join('')}
        </div>
      </div>
    </div>
  `;
  
  contentElement.innerHTML = html;
};

// Apply feat system styles
window.applyFeatSystemStyles = function() {
  // Check if styles already exist
  if (document.getElementById('feats-system-styles')) return;
  
  // Create style element
  const styleElement = document.createElement('style');
  styleElement.id = 'feats-system-styles';
  styleElement.textContent = `
    #featsPanel {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      max-width: 800px;
      max-height: 80vh;
      background: #1a1a1a;
      border: 2px solid #c9aa71;
      border-radius: 8px;
      z-index: 1000;
      overflow-y: auto;
    }
    
    .feats-container {
      padding: 15px;
    }
    
    .rank-section {
      background: rgba(0, 0, 0, 0.2);
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .current-rank {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
    }
    
    .rank-title {
      font-size: 1.4em;
      color: #c9aa71;
      margin-right: 10px;
    }
    
    .rank-desc {
      font-size: 1em;
      color: #aaa;
    }
    
    .rank-progress {
      display: flex;
      justify-content: space-between;
      margin-bottom: 15px;
    }
    
    .deeds-count, .commendations-count {
      font-size: 1.1em;
      color: #e0e0e0;
    }
    
    .next-rank {
      background: rgba(201, 170, 113, 0.1);
      padding: 10px;
      border-radius: 6px;
    }
    
    .deeds-required, .deeds-remaining {
      margin: 5px 0;
      color: #aaa;
    }
    
    .rank-progress-bar {
      height: 8px;
      background: #333;
      border-radius: 4px;
      margin-top: 10px;
      overflow: hidden;
    }
    
    .rank-progress-bar .progress {
      height: 100%;
      background: linear-gradient(to right, #c9aa71, #e0be82);
    }
    
    .feats-section {
      margin-bottom: 20px;
    }
    
    .feats-section h4 {
      color: #c9aa71;
      border-bottom: 1px solid #444;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    
    .feat-stat {
      margin-bottom: 10px;
      color: #e0e0e0;
    }
    
    .enemies-by-type, .quests-by-type {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 5px;
      margin-bottom: 15px;
    }
    
    .enemy-type, .quest-type {
      background: rgba(0, 0, 0, 0.2);
      padding: 5px 10px;
      border-radius: 4px;
      color: #aaa;
    }
    
    .special-feats {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .special-feat {
      background: rgba(0, 0, 0, 0.2);
      padding: 10px;
      border-radius: 6px;
      border-left: 3px solid #c9aa71;
    }
    
    .feat-desc {
      color: #e0e0e0;
      margin-bottom: 5px;
    }
    
    .feat-date {
      color: #888;
      font-size: 0.9em;
    }
    
    .deeds-history {
      margin-bottom: 20px;
    }
    
    .deeds-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .deed-entry {
      background: rgba(0, 0, 0, 0.2);
      padding: 10px;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .deed-amount {
      color: #a8e063;
      font-weight: bold;
    }
    
    .deed-source {
      color: #e0e0e0;
    }
    
    .deed-date {
      color: #888;
      font-size: 0.9em;
    }
    
    /* Custom rank-up notification style */
    .notification.rank-up {
      background-color: #c9aa71;
      color: #1a1a1a;
      border-color: #e0be82;
    }
    
    /* Enhanced profile rank display */
    .profile-rank {
      background: rgba(201, 170, 113, 0.2);
      padding: 5px 10px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 5px;
      color: #c9aa71;
    }
  `;
  
  document.head.appendChild(styleElement);
};

// Initialize during load
document.addEventListener('DOMContentLoaded', function() {
  // Apply styles immediately
  window.applyFeatSystemStyles();
  
  // Initialize system after a short delay to ensure other systems are loaded
  setTimeout(window.initializeFeatsSystem, 500);
});