// combatUI.js - COMBAT USER INTERFACE MODULE
// Handles all UI rendering and interaction for the combat system

// Combat UI object with interface methods for the core combat system
window.combatUI = {
  // Initialize the UI system
  initialize: function() {
    console.log("Combat UI system initialized");
    this.applyStyles();
  },
  
  // Called when combat system initializes
  onCombatSystemInitialized: function() {
    console.log("Combat UI notified of combat system initialization");
  },
  
  // Called when combat phase changes
  onPhaseChanged: function(newPhase, oldPhase) {
    console.log(`UI notified of phase change: ${oldPhase} -> ${newPhase}`);
    this.updateCombatInterface();
  },
  
  // Apply CSS styles for combat UI
  applyStyles: function() {
    // Check if styles already exist
    if (document.getElementById('combat-styles')) {
      return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'combat-styles';
    styleElement.textContent = `
    .combat-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    
    #combatInterface {
      width: 90%;
      max-width: 800px;
      background: #1a1a1a;
      border: 2px solid #444;
      border-radius: 8px;
      padding: 12px; /* Reduced padding */
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
    }
    
    .combat-title {
      text-align: center;
      margin-bottom: 6px; /* Reduced margin */
      color: #c9aa71;
      font-size: 1.2em; /* Smaller font */
    }
    
    #combatHeader {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px; /* Reduced margin */
    }
    
    .combat-health-container {
      width: 45%;
      display: flex;
      flex-direction: column;
    }
    
    .combat-health-bar {
      height: 12px; /* Smaller height */
      background: #333;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 2px; /* Reduced margin */
    }
    
    #playerCombatHealth, #enemyCombatHealth {
      height: 100%;
      width: 100%;
      transition: width 0.5s;
    }
    
    #playerCombatHealth {
      background: linear-gradient(to right, #ff5f6d, #ffc371);
    }
    
    #enemyCombatHealth {
      background: linear-gradient(to right, #8E0E00, #1F1C18);
    }
    
    .combat-actions {
      display: grid;
      grid-template-columns: repeat(4, 1fr); /* 4 columns instead of 3 */
      gap: 5px; /* Smaller gap */
      margin-top: 10px; /* Reduced margin */
    }
    
    /* Status indicators styles - more compact */
    .combat-status-indicators {
      display: flex;
      justify-content: center;
      flex-wrap: wrap; /* Allow wrapping */
      gap: 10px; /* Reduced gap */
      margin: 8px 0; /* Reduced margin */
      padding: 6px; /* Reduced padding */
      background: rgba(0,0,0,0.2);
      border-radius: 6px;
    }
    
    .combat-status-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 70px; /* Smaller min-width */
    }
    
    .status-label {
      font-size: 0.7em; /* Smaller font */
      color: #888;
      margin-bottom: 2px; /* Reduced margin */
    }
    
    .status-value {
      font-weight: bold;
      color: #c9aa71;
      font-size: 0.9em; /* Smaller font */
    }
    
    .distance-indicator {
      display: flex;
      align-items: center;
      gap: 3px; /* Reduced gap */
    }
    
    .distance-dot {
      width: 8px; /* Smaller dots */
      height: 8px;
      border-radius: 50%;
      background: #333;
    }
    
    .distance-dot.active {
      background: #c9aa71;
    }
    
    .stance-indicator {
      font-size: 1em; /* Smaller font */
      padding: 2px 6px; /* Reduced padding */
      border-radius: 4px;
    }
    
    .stance-neutral {
      background: #444;
    }
    
    .stance-aggressive {
      background: rgba(255, 87, 87, 0.3);
    }
    
    .stance-defensive {
      background: rgba(87, 127, 255, 0.3);
    }
    
    /* Ammunition status styles */
    #ammo-indicator {
      border-left: 2px solid #c9aa71;
      padding-left: 5px; /* Reduced padding */
    }
    
    #ammo-indicator .status-value {
      font-size: 1em; /* Smaller font */
    }
    
    .ammo-counter {
      position: absolute;
      bottom: 2px;
      right: 2px;
      background: rgba(0,0,0,0.7);
      color: white;
      font-size: 0.7em;
      padding: 1px 3px;
      border-radius: 3px;
    }
    
    /* Enhanced combat log - Much taller */
    #combatLog {
      background: #1a1a1a;
      border: 1px solid #333;
      padding: 8px; /* Reduced padding */
      height: 350px; /* Fixed height instead of max-height for more consistent display */
      overflow-y: auto;
      margin: 10px 0; /* Reduced margin */
      border-radius: 4px;
      line-height: 1.3; /* Tighter line height */
      font-size: 0.9em; /* Slightly smaller text */
    }
    
    #combatLog p {
      margin: 3px 0; /* Reduced margin */
      padding-left: 8px; /* Reduced padding */
      border-left: 2px solid #333;
    }
    
    #combatLog p.hit {
      border-left-color: #ff5f6d;
    }
    
    #combatLog p.miss {
      border-left-color: #888;
    }
    
    #combatLog p.block {
      border-left-color: #4682B4;
    }
    
    #combatLog p.counter {
      border-left-color: #a8e063;
    }
    
    /* Enhanced action buttons - smaller and more compact */
    .action-btn {
      background: #2a2a2a;
      color: #e0e0e0;
      border: none;
      padding: 6px 8px; /* Reduced padding */
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.85em; /* Smaller font */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 40px; /* Reduced height */
      text-align: center;
      line-height: 1.2; /* Tighter line height */
    }
    
    .action-btn:hover {
      background: #3a3a3a;
      transform: translateY(-2px);
    }
    
    .action-btn:active {
      transform: translateY(1px);
    }
    
    .action-btn.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .action-btn.disabled:hover {
      transform: none;
    }
    
    .action-btn .stat-indicator {
      font-size: 0.7em; /* Smaller font */
      color: #888;
      margin-top: 2px; /* Reduced margin */
    }
    
    .action-btn.stance-aggressive {
      border-left: 2px solid rgba(255, 87, 87, 0.8);
    }
    
    .action-btn.stance-defensive {
      border-left: 2px solid rgba(87, 127, 255, 0.8);
    }
    
    .action-btn.targeting {
      border-left: 2px solid #c9aa71;
    }
    
    .enemy-container, .ally-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 10px;
    }
    
    .active-combatant {
      border-left: 3px solid #c9aa71;
      padding-left: 5px;
    }
    
    .inactive-combatant {
      opacity: 0.8;
      cursor: pointer;
    }
    
    .defeated {
      opacity: 0.5;
      text-decoration: line-through;
    }
    
    .enemy-selector {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 10px;
      align-items: center;
      padding: 5px;
      background: rgba(0,0,0,0.3);
      border-radius: 4px;
    }
    
    .selector-label {
      color: #c9aa71;
      font-size: 0.9em;
      margin-right: 5px;
    }
    
    .enemy-select-btn {
      background: #2a2a2a;
      color: #e0e0e0;
      border: 1px solid #444;
      padding: 3px 8px;
      border-radius: 3px;
      cursor: pointer;
      font-size: 0.85em;
    }
    
    .enemy-select-btn.selected {
      background: #c9aa71;
      color: #000;
    }
    
    .enemy-health-bar {
      background: linear-gradient(to right, #8E0E00, #1F1C18);
    }
    
    .ally-health-bar {
      background: linear-gradient(to right, #4B79A1, #283E51);
    }
    
    .turn-tracker {
      text-align: center;
      padding: 5px;
      background: rgba(0,0,0,0.2);
      border-radius: 4px;
      margin: 5px 0;
      font-size: 0.9em;
      color: #c9aa71;
    }
    
    .ammo-indicator {
      font-size: 0.8em;
      color: #aaa;
      margin-top: 2px;
    }
    
    @media (max-width: 700px) {
      .combat-actions {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    
    @media (max-width: 500px) {
      .combat-actions {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    `;
    
    document.head.appendChild(styleElement);
  },
  
  // Render the combat interface
  renderCombatInterface: function() {
    // Create modal container if needed
    let modalContainer = document.querySelector('.combat-modal');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.className = 'combat-modal';
      document.body.appendChild(modalContainer);
      
      // Move combat interface into modal
      const combatInterface = document.getElementById('combatInterface');
      modalContainer.appendChild(combatInterface);
      
      // Add a title to the combat interface
      const titleElement = document.createElement('h2');
      titleElement.className = 'combat-title';
      titleElement.textContent = 'Combat Encounter';
      combatInterface.insertBefore(titleElement, combatInterface.firstChild);
      
      // Create containers for enemies and allies
      this.createCombatantContainers();
      
      // Add turn counter display
      this.createTurnCounter();
      
      // Adjust the actions container class for better styling
      const actionsContainer = document.getElementById('combatActions');
      actionsContainer.className = 'combat-actions';
    }
    
    // Show the combat interface
    const combatInterface = document.getElementById('combatInterface');
    combatInterface.classList.remove('hidden');
    modalContainer.style.display = 'flex';
    
    // Update initial UI elements
    this.updateCombatInterface();
    this.updateTurnCounter();
  },
  
  // Hide combat interface
  hideCombatInterface: function() {
    // Hide combat interface
    document.getElementById('combatInterface').classList.add('hidden');
    
    // Hide modal container
    const modalContainer = document.querySelector('.combat-modal');
    if (modalContainer) {
      modalContainer.style.display = 'none';
    }
  },
  
  // Show a dramatic battle conclusion modal
  showBattleConclusionModal: function(outcome, narrativeText) {
    // Create modal container if it doesn't exist
    let conclusionModal = document.getElementById('battle-conclusion-modal');
    if (!conclusionModal) {
      conclusionModal = document.createElement('div');
      conclusionModal.id = 'battle-conclusion-modal';
      conclusionModal.className = 'combat-conclusion-modal';
      document.body.appendChild(conclusionModal);
    }
    
    // Determine title based on outcome
    let title = "Battle Concluded";
    let titleClass = "";
    
    switch (outcome) {
      case "victory":
        title = "Victory!";
        titleClass = "victory-title";
        break;
      case "defeat":
        title = "Defeat";
        titleClass = "defeat-title";
        break;
      case "retreat":
        title = "Tactical Retreat";
        titleClass = "retreat-title";
        break;
      case "draw":
        title = "Battle Shifts";
        titleClass = "draw-title";
        break;
    }
    
    // Build the modal content
    let modalContent = `
      <div class="conclusion-content">
        <h2 class="conclusion-title ${titleClass}">${title}</h2>
        <div class="conclusion-narrative">
          ${narrativeText.map(text => `<p>${text}</p>`).join('')}
        </div>
        <button id="return-to-game" class="conclusion-button">Continue</button>
      </div>
    `;
    
    // Set the content
    conclusionModal.innerHTML = modalContent;
    
    // Apply CSS styling
    this.applyBattleConclusionStyles();
    
    // Show the modal
    conclusionModal.style.display = 'flex';
    
    // Hide the combat interface
    this.hideCombatInterface();
    
    // Add event listener to the continue button
    document.getElementById('return-to-game').addEventListener('click', () => {
      conclusionModal.style.display = 'none';
      
      // Show appropriate notification based on outcome
      if (outcome === "victory") {
        const expMatch = narrativeText.find(text => text.includes('experience'));
        const exp = expMatch ? expMatch.match(/\d+/) : '0';
        window.showNotification(`Victory! +${exp} XP`, 'success');
      } else if (outcome === "draw") {
        window.showNotification(`Combat ended in a draw.`, 'info');
      } else if (outcome === "retreat") {
        window.showNotification("You managed to escape combat.", 'info');
      } else {
        window.showNotification("You were defeated but survived.", 'warning');
      }
    });
  },
  
  // Apply styles for battle conclusion modal
  applyBattleConclusionStyles: function() {
    // Check if styles already exist
    if (document.getElementById('battle-conclusion-styles')) {
      return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.id = 'battle-conclusion-styles';
    styleElement.textContent = `
      .combat-conclusion-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.9);
        display: none;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        font-family: serif;
      }
      
      .conclusion-content {
        width: 90%;
        max-width: 600px;
        background: #1a1a1a;
        background-image: url('data:image/png;base64,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');
        border: 2px solid #c9aa71;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 0 40px rgba(201, 170, 113, 0.4);
        position: relative;
        color: #e0e0e0;
      }
      
      .conclusion-title {
        text-align: center;
        margin-bottom: 16px;
        font-size: 1.8em;
        letter-spacing: 1px;
        font-weight: normal;
        text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
      }
      
      .victory-title {
        color: #ffd700;
      }
      
      .defeat-title {
        color: #ff6b6b;
      }
      
      .retreat-title {
        color: #4da6ff;
      }
      
      .draw-title {
        color: #c9aa71;
      }
      
      .conclusion-narrative {
        margin-bottom: 20px;
        line-height: 1.5;
        font-size: 1.1em;
      }
      
      .conclusion-narrative p {
        margin-bottom: 12px;
        text-align: center;
      }
      
      .conclusion-button {
        display: block;
        margin: 0 auto;
        padding: 10px 30px;
        background: #734d26;
        color: #e0e0e0;
        border: 1px solid #c9aa71;
        border-radius: 4px;
        font-size: 1.1em;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .conclusion-button:hover {
        background: #8c5e30;
        transform: translateY(-2px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }
      
      .conclusion-button:active {
        transform: translateY(1px);
      }
      
      @media (max-width: 600px) {
        .conclusion-content {
          width: 95%;
          padding: 15px;
        }
        
        .conclusion-title {
          font-size: 1.5em;
        }
        
        .conclusion-narrative {
          font-size: 1em;
        }
      }
    `;
    
    document.head.appendChild(styleElement);
  },
  
  // Create containers for enemies and allies
  createCombatantContainers: function() {
    const combatHeader = document.getElementById('combatHeader');
    
    // Create enemy container
    if (!document.getElementById('enemyContainer')) {
      const enemyContainer = document.createElement('div');
      enemyContainer.id = 'enemyContainer';
      enemyContainer.className = 'enemy-container';
      combatHeader.appendChild(enemyContainer);
    }
    
    // Create ally container if needed
    if (!document.getElementById('allyContainer') && window.combatSystem.state.allies.length > 0) {
      const allyContainer = document.createElement('div');
      allyContainer.id = 'allyContainer';
      allyContainer.className = 'ally-container';
      combatHeader.appendChild(allyContainer);
    }
  },
  
  // Create turn counter display
  createTurnCounter: function() {
    if (!document.getElementById('turnCounter')) {
      const turnCounter = document.createElement('div');
      turnCounter.id = 'turnCounter';
      turnCounter.className = 'turn-tracker';
      
      // Insert after combat header
      const combatHeader = document.getElementById('combatHeader');
      combatHeader.parentNode.insertBefore(turnCounter, combatHeader.nextSibling);
    }
  },
  
  // Update turn counter display
  updateTurnCounter: function() {
    const turnCounter = document.getElementById('turnCounter');
    if (turnCounter) {
      turnCounter.textContent = `Turn ${window.combatSystem.state.turn + 1} of ${window.combatSystem.state.maxTurns}`;
    }
  },
  
  // Update combat UI elements
  updateCombatInterface: function() {
    if (!window.combatSystem.state.active) return;
    
    // Update player health display
    document.getElementById('playerHealthDisplay').textContent = `${Math.round(window.gameState.health)} HP`;
    document.getElementById('playerCombatHealth').style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
    
    // Update enemy containers
    this.updateEnemyDisplay();
    
    // Update ally containers if any
    if (window.combatSystem.state.allies.length > 0) {
      this.updateAllyDisplay();
    }
    
    // Update combat status indicators
    this.updateCombatStatusIndicators();
    
    // Update action buttons based on phase and counter state
    if (window.combatSystem.state.phase === "player") {
      if (window.combatSystem.state.counterWindowOpen && window.combatSystem.state.lastCounterActor === "enemy") {
        this.updateCounterOptions();
      } else {
        this.updateCombatOptions();
      }
    }
    
    // Update turn counter
    this.updateTurnCounter();
  },
  
  // Show get up option when player is knocked down
  showGetUpOption: function() {
    const actionsContainer = document.getElementById('combatActions');
    actionsContainer.innerHTML = '';
    
    // Add get up button
    this.addCombatButton("Get Up", () => window.combatSystem.executePlayerGetUp(), actionsContainer);
  },
  
  // Update enemy display
  updateEnemyDisplay: function() {
    const enemyContainer = document.getElementById('enemyContainer');
    if (!enemyContainer) {
      console.error("Enemy container not found");
      return;
    }
    
    // Clear the container
    enemyContainer.innerHTML = '';
    
    // Add each enemy to the display
    window.combatSystem.state.enemies.forEach((enemy, index) => {
      const enemyDiv = document.createElement('div');
      enemyDiv.className = 'combat-health-container';
      enemyDiv.classList.add(index === window.combatSystem.state.activeEnemyIndex ? 'active-combatant' : 'inactive-combatant');
      
      // Add click handler to select this enemy
      enemyDiv.addEventListener('click', () => {
        window.combatSystem.handleCombatAction('select_enemy', { enemyIndex: index });
      });
      
      // Enemy name and health text
      const enemyNameDisplay = document.createElement('div');
      let nameText = enemy.name;
      
      // Add status indicators
      if (enemy.stunned) nameText += " (Stunned)";
      if (enemy.knockedDown) nameText += " (Knocked Down)";
      
      // Add defeated indicator
      if (enemy.health <= 0) {
        nameText += " (Defeated)";
        enemyDiv.classList.add('defeated');
      }
      
      enemyNameDisplay.innerHTML = `<span class="enemy-name">${nameText}</span>: <span id="enemy${index}HealthDisplay">${Math.round(enemy.health)} HP</span>`;
      enemyDiv.appendChild(enemyNameDisplay);
      
      // Enemy health bar
      const healthBarContainer = document.createElement('div');
      healthBarContainer.className = 'combat-health-bar';
      
      const healthBar = document.createElement('div');
      healthBar.id = `enemy${index}CombatHealth`;
      healthBar.style.width = `${(enemy.health / enemy.maxHealth) * 100}%`;
      healthBar.className = 'enemy-health-bar';
      
      healthBarContainer.appendChild(healthBar);
      enemyDiv.appendChild(healthBarContainer);
      
      // Add stance indicator
      const stanceIndicator = document.createElement('div');
      stanceIndicator.className = `stance-indicator stance-${enemy.currentStance}`;
      stanceIndicator.textContent = enemy.currentStance.charAt(0).toUpperCase() + enemy.currentStance.slice(1);
      enemyDiv.appendChild(stanceIndicator);
      
      // Add javelin count if enemy has javelins
      if (enemy.ammunition && enemy.ammunition.javelin) {
        const javelinCount = document.createElement('div');
        javelinCount.className = 'ammo-indicator';
        javelinCount.textContent = `Javelins: ${enemy.ammunition.javelin.current}`;
        enemyDiv.appendChild(javelinCount);
      }
      
      // Add to container
      enemyContainer.appendChild(enemyDiv);
    });
  },
  
  // Update ally display
  updateAllyDisplay: function() {
    const allyContainer = document.getElementById('allyContainer');
    if (!allyContainer) {
      console.error("Ally container not found");
      return;
    }
    
    // Clear the container
    allyContainer.innerHTML = '';
    
    // Add each ally to the display
    window.combatSystem.state.allies.forEach((ally, index) => {
      const allyDiv = document.createElement('div');
      allyDiv.className = 'combat-health-container ally-container';
      allyDiv.classList.add(index === window.combatSystem.state.activeAllyIndex ? 'active-combatant' : 'inactive-combatant');
      
      // Ally name and health text
      const allyNameDisplay = document.createElement('div');
      let nameText = ally.name;
      
      // Add status indicators
      if (ally.stunned) nameText += " (Stunned)";
      if (ally.knockedDown) nameText += " (Knocked Down)";
      
      // Add defeated indicator
      if (ally.health <= 0) {
        nameText += " (Defeated)";
        allyDiv.classList.add('defeated');
      }
      
      allyNameDisplay.innerHTML = `<span class="ally-name">${nameText}</span>: <span id="ally${index}HealthDisplay">${Math.round(ally.health)} HP</span>`;
      allyDiv.appendChild(allyNameDisplay);
      
      // Ally health bar
      const healthBarContainer = document.createElement('div');
      healthBarContainer.className = 'combat-health-bar';
      
      const healthBar = document.createElement('div');
      healthBar.id = `ally${index}CombatHealth`;
      healthBar.style.width = `${(ally.health / ally.maxHealth) * 100}%`;
      healthBar.className = 'ally-health-bar';
      
      healthBarContainer.appendChild(healthBar);
      allyDiv.appendChild(healthBarContainer);
      
      // Add stance indicator
      const stanceIndicator = document.createElement('div');
      stanceIndicator.className = `stance-indicator stance-${ally.currentStance}`;
      stanceIndicator.textContent = ally.currentStance.charAt(0).toUpperCase() + ally.currentStance.slice(1);
      allyDiv.appendChild(stanceIndicator);
      
      // Add javelin count if ally has javelins
      if (ally.ammunition && ally.ammunition.javelin) {
        const javelinCount = document.createElement('div');
        javelinCount.className = 'ammo-indicator';
        javelinCount.textContent = `Javelins: ${ally.ammunition.javelin.current}`;
        allyDiv.appendChild(javelinCount);
      }
      
      // Add to container
      allyContainer.appendChild(allyDiv);
    });
  },
  
  // Update UI for counter options
  updateCounterOptions: function() {
    const actionsContainer = document.getElementById('combatActions');
    actionsContainer.innerHTML = '';
    
    // Get equipped weapon
    const weapon = window.player.equipment?.mainHand;
    const weaponTemplate = weapon ? weapon.getTemplate() : null;
    
    // In a counter situation, only show attack options
    if (weaponTemplate && weapon.durability > 0) {
      // Get available attacks for weapon
      const attacks = window.combatSystem.getWeaponAttacks(weaponTemplate);
      
      // Add button for each counter attack
      for (const attack of attacks) {
        this.addCombatButton(`Counter: ${attack}`, () => window.combatSystem.handleCombatAction("counter", {attackType: attack}), actionsContainer);
      }
    } else {
      // No weapon or broken weapon - just basic counter
      this.addCombatButton("Counter Punch", () => window.combatSystem.handleCombatAction("counter", {attackType: "Punch"}), actionsContainer);
    }
  },
  
  // Update available combat options based on current state
  updateCombatOptions: function() {
    const actionsContainer = document.getElementById('combatActions');
    actionsContainer.innerHTML = '';
    
    // Add enemy selection buttons if multiple enemies
    if (window.combatSystem.state.enemies.length > 1) {
      const enemySelectorDiv = document.createElement('div');
      enemySelectorDiv.className = 'enemy-selector';
      enemySelectorDiv.innerHTML = '<span class="selector-label">Target:</span>';
      
      window.combatSystem.state.enemies.forEach((enemy, index) => {
        if (enemy.health > 0) { // Only show living enemies
          const enemyButton = document.createElement('button');
          enemyButton.className = 'enemy-select-btn';
          if (index === window.combatSystem.state.activeEnemyIndex) {
            enemyButton.classList.add('selected');
          }
          enemyButton.textContent = enemy.name;
          enemyButton.onclick = () => window.combatSystem.handleCombatAction("select_enemy", {enemyIndex: index});
          enemySelectorDiv.appendChild(enemyButton);
        }
      });
      
      actionsContainer.appendChild(enemySelectorDiv);
    }
    
    // Get equipped weapon
    const weapon = window.player.equipment?.mainHand;
    const weaponTemplate = weapon ? weapon.getTemplate() : null;
    
    // Add distance buttons
    if (window.combatSystem.state.distance > 0) {
      this.addCombatButton("Approach", () => window.combatSystem.handleCombatAction("change_distance", {change: -1}), actionsContainer);
    }
    if (window.combatSystem.state.distance < 3) {
      this.addCombatButton("Retreat", () => window.combatSystem.handleCombatAction("change_distance", {change: 1}), actionsContainer);
    }
    
    // Add stance buttons
    if (window.combatSystem.state.playerStance !== "aggressive") {
      this.addCombatButton("Aggressive Stance", () => window.combatSystem.handleCombatAction("change_stance", {stance: "aggressive"}), actionsContainer);
    }
    if (window.combatSystem.state.playerStance !== "defensive") {
      this.addCombatButton("Defensive Stance", () => window.combatSystem.handleCombatAction("change_stance", {stance: "defensive"}), actionsContainer);
    }
    if (window.combatSystem.state.playerStance !== "neutral") {
      this.addCombatButton("Neutral Stance", () => window.combatSystem.handleCombatAction("change_stance", {stance: "neutral"}), actionsContainer);
    }
    
    // Add target area buttons
    this.addCombatButton("Target Head", () => window.combatSystem.handleCombatAction("change_target", {target: "head"}), actionsContainer);
    this.addCombatButton("Target Body", () => window.combatSystem.handleCombatAction("change_target", {target: "body"}), actionsContainer);
    this.addCombatButton("Target Legs", () => window.combatSystem.handleCombatAction("change_target", {target: "legs"}), actionsContainer);
    
    // Add shield status if player has shield
    const shield = window.player.equipment?.offHand;
    if (shield && shield !== "occupied") {
      const shieldTemplate = shield.getTemplate();
      if (shieldTemplate.weaponType?.name === "Shield") {
        let blockChance = shieldTemplate.blockChance || 0;
        if (window.combatSystem.state.playerStance === "defensive") {
          blockChance += 15; // +15% in defensive stance
        }
        this.addCombatButton(`Shield Block: ${blockChance}%`, () => {}, actionsContainer, true);
        
        // Shield attack options
        if (window.combatSystem.state.distance <= 1) {
          // Shield bash is only available at close range (0 or 1)
          this.addCombatButton("Shield Bash", () => window.combatSystem.handleCombatAction("attack", {attackType: "Shield Bash"}), actionsContainer);
        }
        
        if (window.combatSystem.state.distance === 0) {
          // Shove is only available at grappling range (0)
          this.addCombatButton("Shove", () => window.combatSystem.handleCombatAction("attack", {attackType: "Shove"}), actionsContainer);
        }
      }
    }
    
    // Show weapon durability if it has it
    if (weapon && weapon.durability !== undefined) {
      // Calculate durability percentage
      const durabilityPercent = Math.round((weapon.durability / weaponTemplate.maxDurability) * 100);
      let durabilityStatus = ""; 
      
      // Add status text based on percentage
      if (durabilityPercent <= 0) durabilityStatus = " (Broken)";
      else if (durabilityPercent < 20) durabilityStatus = " (Very Poor)";
      else if (durabilityPercent < 40) durabilityStatus = " (Poor)";
      else if (durabilityPercent < 60) durabilityStatus = " (Worn)";
      
      // Only show status if not in excellent condition
      if (durabilityStatus) {
        this.addCombatButton(`Weapon: ${durabilityPercent}%${durabilityStatus}`, () => {}, actionsContainer, true);
      }
      
      // Disable attacks if weapon is broken
      if (weapon.durability <= 0) {
        this.addCombatButton("Weapon Broken!", () => {}, actionsContainer, true);
        // Early return to skip attack options
        this.addCombatButton("Attempt to Flee", () => window.combatSystem.handleCombatAction("flee"), actionsContainer);
        return;
      }
    }
    
    // Get the effective weapon range
    const weaponRange = weaponTemplate ? window.combatSystem.getWeaponRange(weaponTemplate) : 1;
    
    // Get all available attacks considering current weapon, ammo, and distance
    let attacks = [];
    
    // If within weapon range, add weapon attacks
    if (weaponTemplate && window.combatSystem.state.distance <= weaponRange) {
      attacks = attacks.concat(window.combatSystem.getWeaponAttacks(weaponTemplate));
    } else if (weaponTemplate) {
      // Weapon out of range
      this.addCombatButton(`Too far for ${weaponTemplate.name}`, () => {}, actionsContainer, true);
    }
    
    // Always check for javelin attacks separately from main weapon
    if (window.combatSystem.hasCompatibleAmmo(null, "javelin") && 
        window.combatSystem.state.distance >= 1 && 
        window.combatSystem.state.distance <= 2) {
      // If no weapon or weapon is one-handed
      if (!weaponTemplate || (weaponTemplate.hands && weaponTemplate.hands === 1)) {
        if (!attacks.includes("Throw Javelin")) {
          attacks.push("Throw Javelin");
        }
      }
    }
    
    // Default to punch if no weapon and at melee range
    if (attacks.length === 0 && window.combatSystem.state.distance === 0) {
      attacks = ["Punch"];
    }
    
    // Add buttons for each available attack
    for (const attack of attacks) {
      // Skip "No Arrows" etc. which are just informational
      if (attack.startsWith("No ")) {
        this.addCombatButton(attack, () => {}, actionsContainer, true);
      } else {
        this.addCombatButton(attack, () => window.combatSystem.handleCombatAction("attack", {attackType: attack}), actionsContainer);
      }
    }
    
    // Always add flee button
    this.addCombatButton("Attempt to Flee", () => window.combatSystem.handleCombatAction("flee"), actionsContainer);
  },
  
  // Update combat status indicators
  updateCombatStatusIndicators: function() {
    let statusContainer = document.querySelector('.combat-status-indicators');
    
    if (!statusContainer) {
      statusContainer = document.createElement('div');
      statusContainer.className = 'combat-status-indicators';
      
      // Insert after the combat header
      const combatHeader = document.getElementById('combatHeader');
      if (combatHeader && combatHeader.nextSibling) {
        combatHeader.parentNode.insertBefore(statusContainer, combatHeader.nextSibling);
      } else {
        const combatInterface = document.getElementById('combatInterface');
        if (combatInterface) {
          combatInterface.insertBefore(statusContainer, combatInterface.querySelector('#combatLog'));
        }
      }
    }
    
    // Update the content
    statusContainer.innerHTML = `
      <!-- Distance indicator -->
      <div class="combat-status-item">
        <div class="status-label">Distance</div>
        <div class="distance-indicator">
          <div class="distance-dot ${window.combatSystem.state.distance === 0 ? 'active' : ''}"></div>
          <div class="distance-dot ${window.combatSystem.state.distance === 1 ? 'active' : ''}"></div>
          <div class="distance-dot ${window.combatSystem.state.distance === 2 ? 'active' : ''}"></div>
          <div class="distance-dot ${window.combatSystem.state.distance === 3 ? 'active' : ''}"></div>
        </div>
        <div class="status-value">${window.combatSystem.distanceLabels[window.combatSystem.state.distance]}</div>
      </div>
      
      <!-- Player stance -->
      <div class="combat-status-item">
        <div class="status-label">Your Stance</div>
        <div class="stance-indicator stance-${window.combatSystem.state.playerStance}">
          ${window.combatSystem.state.playerStance.charAt(0).toUpperCase() + window.combatSystem.state.playerStance.slice(1)}
        </div>
      </div>
      
      <!-- Enemy stance -->
      <div class="combat-status-item">
        <div class="status-label">Enemy Stance</div>
        <div class="stance-indicator stance-${window.combatSystem.state.enemyStance}">
          ${window.combatSystem.state.enemyStance.charAt(0).toUpperCase() + window.combatSystem.state.enemyStance.slice(1)}
        </div>
      </div>
      
      <!-- Target area -->
      <div class="combat-status-item">
        <div class="status-label">Target</div>
        <div class="status-value">
          ${window.combatSystem.targetLabels[window.combatSystem.state.targetArea]}
        </div>
      </div>
      
      <!-- Turn counter -->
      <div class="combat-status-item">
        <div class="status-label">Turn</div>
        <div class="status-value">
          ${window.combatSystem.state.turn + 1}/${window.combatSystem.state.maxTurns}
        </div>
      </div>
    `;
    
    // Add ammunition status if player has javelins
    const ammo = window.player.equipment?.ammunition;
    
    if (ammo && ammo !== "occupied" && ammo.ammoType === "javelin" && ammo.currentAmount > 0) {
      // Create or update ammo indicator
      let ammoIndicator = document.getElementById('ammo-indicator');
      
      if (!ammoIndicator) {
        ammoIndicator = document.createElement('div');
        ammoIndicator.id = 'ammo-indicator';
        ammoIndicator.className = 'combat-status-item';
        
        // Add to status container
        statusContainer.appendChild(ammoIndicator);
      }
      
      // Update content
      const ammoPercent = Math.round((ammo.currentAmount / ammo.capacity) * 100);
      let ammoStatus = "Ready";
      
      if (ammoPercent <= 0) {
        ammoStatus = "Empty";
      } else if (ammoPercent <= 25) {
        ammoStatus = "Low";
      }
      
      ammoIndicator.innerHTML = `
        <div class="status-label">Javelins</div>
        <div class="status-value">${ammo.currentAmount}/${ammo.capacity}</div>
        <div class="status-value">${ammoStatus}</div>
      `;
    }
  },
  
  // Add a button to the combat interface
  addCombatButton: function(label, onClick, container, disabled = false) {
    // Parse the label to see if it contains stats like "Shield Block: 30%"
    const isShieldBlock = label.includes('Shield Block:');
    const isDurability = label.includes('Weapon:') && label.includes('%');
    
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    
    // Add special classes for stance buttons
    if (label.includes('Aggressive Stance')) {
      btn.classList.add('stance-aggressive');
    } else if (label.includes('Defensive Stance')) {
      btn.classList.add('stance-defensive');
    } else if (label.includes('Target')) {
      btn.classList.add('targeting');
    }
    
    if (disabled) btn.className += ' disabled';
    
    // For buttons with stats, split into main label and stat indicator
    if (isShieldBlock || isDurability) {
      const parts = label.split(':');
      const mainLabel = parts[0] + ':';
      const statValue = parts.slice(1).join(':');
      
      // Create main label
      const labelSpan = document.createElement('span');
      labelSpan.textContent = mainLabel;
      btn.appendChild(labelSpan);
      
      // Create stat indicator
      const statSpan = document.createElement('span');
      statSpan.className = 'stat-indicator';
      statSpan.textContent = statValue;
      btn.appendChild(statSpan);
    } else {
      btn.textContent = label;
    }
    
    if (!disabled) btn.onclick = onClick;
    container.appendChild(btn);
  },
  
  // Add a message to the combat log
  addCombatMessage: function(message) {
    const combatLog = document.getElementById('combatLog');
    const newMessage = document.createElement('p');
    
    // Add class based on message content
    if (message.includes('block') || message.includes('shield')) {
      newMessage.classList.add('block');
    } else if (message.includes('counter')) {
      newMessage.classList.add('counter');
    } else if (message.includes('damage') || message.includes('lands')) {
      newMessage.classList.add('hit');
    } else if (message.includes('miss') || message.includes('evades') || message.includes('avoid')) {
      newMessage.classList.add('miss');
    }
    
    newMessage.textContent = message;
    combatLog.appendChild(newMessage);
    
    // Scroll to bottom
    combatLog.scrollTop = combatLog.scrollHeight;
  }
};

// Initialize the combat UI system when DOM is ready
window.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, initializing combat UI");
  window.combatUI.initialize();
});