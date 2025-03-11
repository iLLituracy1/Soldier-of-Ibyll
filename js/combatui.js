// Complete combatUI.js with status indicators

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
  padding: 20px;
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
}

.combat-title {
  text-align: center;
  margin-bottom: 10px;
  color: #c9aa71;
  font-size: 1.4em;
}

.combat-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 15px;
}

@media (max-width: 600px) {
  .combat-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Status indicators styles */
.combat-status-indicators {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 15px 0;
  padding: 10px;
  background: rgba(0,0,0,0.2);
  border-radius: 6px;
}

.combat-status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.status-label {
  font-size: 0.8em;
  color: #888;
  margin-bottom: 5px;
}

.status-value {
  font-weight: bold;
  color: #c9aa71;
}

.distance-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
}

.distance-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #333;
}

.distance-dot.active {
  background: #c9aa71;
}

.stance-indicator {
  font-size: 1.2em;
  padding: 3px 8px;
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
  
  // Call original function to handle the rest
  // Not calling original function directly as we've replaced some of its functionality
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
};
