// Complete combatUI.js with enhanced status indicators

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

/* Enhanced equipment status section */
.combat-equipment-status {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 8px;
  background: rgba(0,0,0,0.2);
  border-radius: 6px;
}

.equipment-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px;
  border-radius: 4px;
  background: #232c3f;
  min-width: 100px;
}

.equipment-name {
  font-size: 0.8em;
  color: #c9aa71;
  margin-bottom: 3px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.equipment-stat {
  font-size: 0.75em;
  color: #aaa;
}

.durability-bar-mini {
  width: 100%;
  height: 3px;
  background: #444;
  border-radius: 1px;
  margin-top: 3px;
  overflow: hidden;
}

.durability-fill {
  height: 100%;
  background: linear-gradient(to right, #ff5f6d, #ffc371);
}

.durability-good { background: linear-gradient(to right, #56ab2f, #a8e063); }
.durability-ok { background: linear-gradient(to right, #a8e063, #ffc371); }
.durability-worn { background: linear-gradient(to right, #ffc371, #ff9966); }
.durability-poor { background: linear-gradient(to right, #ff9966, #ff5f6d); }
.durability-critical { background: #ff5f6d; }

@media (max-width: 600px) {
  .combat-actions {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .combat-equipment-status {
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px;
  }
  
  .equipment-item {
    min-width: 80px;
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

/* Ammunition status styles */
#ammo-indicator {
  border-left: 2px solid #c9aa71;
  padding-left: 10px;
}

#ammo-indicator .status-value {
  font-size: 1.2em;
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

/* Enhanced combat log */
#combatLog {
  background: #1a1a1a;
  border: 1px solid #333;
  padding: 10px;
  max-height: 150px;
  overflow-y: auto;
  margin: 15px 0;
  border-radius: 4px;
  line-height: 1.4;
}

#combatLog p {
  margin: 4px 0;
  padding-left: 10px;
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

/* Enhanced action buttons */
.action-btn {
  background: #2a2a2a;
  color: #e0e0e0;
  border: none;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9em;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50px;
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
  font-size: 0.75em;
  color: #888;
  margin-top: 3px;
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
    
    // Add equipment status section
    this.addEquipmentStatusSection(combatInterface);
  }
  
  // Show the combat interface
  const combatInterface = document.getElementById('combatInterface');
  combatInterface.classList.remove('hidden');
  modalContainer.style.display = 'flex';
  
  // Call original function to handle the rest
  // Not calling original function directly as we've replaced some of its functionality
  this.updateCombatInterface();
};

// Add equipment status section
window.combatSystem.addEquipmentStatusSection = function(combatInterface) {
  // Create equipment status section if it doesn't exist
  if (!document.querySelector('.combat-equipment-status')) {
    const equipmentStatus = document.createElement('div');
    equipmentStatus.className = 'combat-equipment-status';
    equipmentStatus.id = 'equipmentStatus';
    
    // Insert after combat header
    const combatHeader = document.getElementById('combatHeader');
    if (combatHeader) {
      combatHeader.parentNode.insertBefore(equipmentStatus, combatHeader.nextSibling);
    }
  }
  
  // Update equipment status
  this.updateEquipmentStatus();
};

// Update equipment status display
window.combatSystem.updateEquipmentStatus = function() {
  const equipmentStatus = document.getElementById('equipmentStatus');
  if (!equipmentStatus) return;
  
  equipmentStatus.innerHTML = '';
  
  // Get all equipped items
  const equippedItems = [];
  
  for (const slot in window.player.equipment) {
    const item = window.player.equipment[slot];
    if (item && item !== 'occupied') {
      equippedItems.push({
        slot: slot,
        item: item
      });
    }
  }
  
  // If no items, show message
  if (equippedItems.length === 0) {
    equipmentStatus.innerHTML = '<div class="equipment-item">No equipment</div>';
    return;
  }
  
  // Add each item
  equippedItems.forEach(equipped => {
    const item = equipped.item;
    const template = item.getTemplate();
    const slot = equipped.slot;
    
    // Create item element
    const itemElement = document.createElement('div');
    itemElement.className = 'equipment-item';
    
    // Item name
    const nameElement = document.createElement('div');
    nameElement.className = 'equipment-name';
    nameElement.textContent = template.name;
    itemElement.appendChild(nameElement);
    
    // Add appropriate stats based on item type
    if (template.category === window.ITEM_CATEGORIES.WEAPON) {
      // For weapons, show damage and armor penetration
      const damage = template.stats.damage || 0;
      const armorPen = template.stats.armorPenetration || 0;
      
      // Show damage
      const damageElement = document.createElement('div');
      damageElement.className = 'equipment-stat';
      damageElement.textContent = `DMG: ${damage}`;
      if (armorPen > 0) {
        damageElement.textContent += ` (AP: ${armorPen})`;
      }
      itemElement.appendChild(damageElement);
      
      // For shields, show block chance
      if (template.weaponType?.name === 'Shield') {
        const blockChance = template.blockChance || 0;
        const defStanceBonus = this.state.playerStance === 'defensive' ? 15 : 0;
        
        const blockElement = document.createElement('div');
        blockElement.className = 'equipment-stat';
        blockElement.textContent = `Block: ${blockChance + defStanceBonus}%`;
        itemElement.appendChild(blockElement);
      }
    } 
    else if (template.category === window.ITEM_CATEGORIES.ARMOR) {
      // For armor, show defense
      const defense = template.stats.defense || 0;
      
      const defenseElement = document.createElement('div');
      defenseElement.className = 'equipment-stat';
      defenseElement.textContent = `DEF: ${defense}`;
      itemElement.appendChild(defenseElement);
    }
    
    // Show durability if applicable
    if (item.durability !== undefined) {
      const durability = item.durability;
      const maxDurability = template.maxDurability || 100;
      const durabilityPercent = Math.round((durability / maxDurability) * 100);
      
      // Durability text
      const durabilityElement = document.createElement('div');
      durabilityElement.className = 'equipment-stat';
      durabilityElement.textContent = `Dur: ${durabilityPercent}%`;
      itemElement.appendChild(durabilityElement);
      
      // Durability bar
      const durabilityBarElement = document.createElement('div');
      durabilityBarElement.className = 'durability-bar-mini';
      
      const durabilityFillElement = document.createElement('div');
      durabilityFillElement.className = 'durability-fill';
      
      // Add class based on durability percentage
      if (durabilityPercent >= 80) {
        durabilityFillElement.classList.add('durability-good');
      } else if (durabilityPercent >= 60) {
        durabilityFillElement.classList.add('durability-ok');
      } else if (durabilityPercent >= 40) {
        durabilityFillElement.classList.add('durability-worn');
      } else if (durabilityPercent >= 20) {
        durabilityFillElement.classList.add('durability-poor');
      } else {
        durabilityFillElement.classList.add('durability-critical');
      }
      
      durabilityFillElement.style.width = `${durabilityPercent}%`;
      durabilityBarElement.appendChild(durabilityFillElement);
      itemElement.appendChild(durabilityBarElement);
    }
    
    equipmentStatus.appendChild(itemElement);
  });
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
  
  // Update equipment status
  this.updateEquipmentStatus();
  
  // Add or update status indicators
  let statusContainer = document.querySelector('.combat-status-indicators');
  
  if (!statusContainer) {
    statusContainer = document.createElement('div');
    statusContainer.className = 'combat-status-indicators';
    
    // Insert after the equipment status or combat header
    const equipmentStatus = document.getElementById('equipmentStatus');
    if (equipmentStatus) {
      equipmentStatus.parentNode.insertBefore(statusContainer, equipmentStatus.nextSibling);
    } else {
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
                     weaponTemplate.weaponType?.name === "Rifle";
    
    if (isRanged) {
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
