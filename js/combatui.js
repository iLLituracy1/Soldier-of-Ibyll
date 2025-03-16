// Complete combatUI.js with enhanced status indicators but without equipment status display
// All elements made more compact to fit more content

// Combat modal and layout styles
const combatStyles = `
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

// Add styles to document
if (!document.getElementById('combat-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'combat-styles';
  styleElement.textContent = combatStyles;
  document.head.appendChild(styleElement);
}

// Modify the combat system's renderCombatInterface function
const originalRenderCombatInterface = window.combatSystem.renderCombatInterface;
window.combatSystem.renderCombatInterface = function() {
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
};

// Also modify the endCombat function to handle modal closing
const originalEndCombat = window.combatSystem.endCombat;
window.combatSystem.endCombat = function(outcome) {
  // Call original function first
  originalEndCombat.call(this, outcome);
  
  // Hide modal container
  const modalContainer = document.querySelector('.combat-modal');
  if (modalContainer) {
    modalContainer.style.display = 'none';
  }
};

// Override updateCombatInterface to add status indicators
const originalUpdateCombatInterface = window.combatSystem.updateCombatInterface;
window.combatSystem.updateCombatInterface = function() {
  // Call the original function first
  originalUpdateCombatInterface.call(this);

    // Add knocked down indicator if applicable
    if (this.state.enemy.knockedDown) {
      document.getElementById('enemyName').textContent += " (Knocked Down)";
    }
  
  // Add or update status indicators
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
        <div class="distance-dot ${this.state.distance === 0 ? 'active' : ''}"></div>
        <div class="distance-dot ${this.state.distance === 1 ? 'active' : ''}"></div>
        <div class="distance-dot ${this.state.distance === 2 ? 'active' : ''}"></div>
        <div class="distance-dot ${this.state.distance === 3 ? 'active' : ''}"></div>
      </div>
      <div class="status-value">${this.distanceLabels[this.state.distance]}</div>
    </div>
    
    <!-- Player stance -->
    <div class="combat-status-item">
      <div class="status-label">Your Stance</div>
      <div class="stance-indicator stance-${this.state.playerStance}">
        ${this.state.playerStance.charAt(0).toUpperCase() + this.state.playerStance.slice(1)}
      </div>
    </div>
    
    <!-- Enemy stance -->
    <div class="combat-status-item">
      <div class="status-label">Enemy Stance</div>
      <div class="stance-indicator stance-${this.state.enemyStance}">
        ${this.state.enemyStance.charAt(0).toUpperCase() + this.state.enemyStance.slice(1)}
      </div>
    </div>
    
    <!-- Target area -->
    <div class="combat-status-item">
      <div class="status-label">Target</div>
      <div class="status-value">
        ${this.targetLabels[this.state.targetArea]}
      </div>
    </div>
  `;
  
  // Add ammunition status if player has ranged weapon
  const weapon = window.player.equipment?.mainHand;
  const ammo = window.player.equipment?.ammunition;
  
  if (weapon && ammo) {
    const weaponTemplate = weapon.getTemplate();
    const isRanged = weaponTemplate.weaponType?.name === "Bow" || 
                     weaponTemplate.weaponType?.name === "Crossbow" ||
                     weaponTemplate.weaponType?.name === "Rifle" ||
                     weaponTemplate.weaponType?.name === "Thrown";
    
    // Check if weapon is compatible with ammunition
    const isCompatible = window.checkWeaponAmmoCompatibility();
    
    if (isRanged && isCompatible) {
      // Create or update ammo indicator
      let ammoIndicator = document.getElementById('ammo-indicator');
      
      if (!ammoIndicator) {
        ammoIndicator = document.createElement('div');
        ammoIndicator.id = 'ammo-indicator';
        ammoIndicator.className = 'combat-status-item';
        
        // Add to status container
        const statusContainer = document.querySelector('.combat-status-indicators');
        if (statusContainer) {
          statusContainer.appendChild(ammoIndicator);
        }
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
        <div class="status-label">Ammunition</div>
        <div class="status-value">${ammo.currentAmount}/${ammo.capacity}</div>
        <div class="status-value">${ammoStatus}</div>
      `;
    }
  }
};

// Override add combat button to include stat indicators
const originalAddCombatButton = window.combatSystem.addCombatButton;
window.combatSystem.addCombatButton = function(label, onClick, container, disabled = false) {
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
};

// Override add combat message to add message types
const originalAddCombatMessage = window.combatSystem.addCombatMessage;
window.combatSystem.addCombatMessage = function(message) {
  // Add to state log
  this.state.combatLog.push(message);
  
  // Update UI log with message types
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
  
  console.log("Combat Log:", message);
};