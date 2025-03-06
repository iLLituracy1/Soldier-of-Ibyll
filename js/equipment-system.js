// EQUIPMENT UI MODULE
// Provides visual representation of equipment and equipment-related UI functions

// Constants for equipment layout
const EQUIPMENT_SLOTS = {
  weapon: {
    name: "Weapon",
    description: "Main hand weapon",
    icon: "⚔️"
  },
  offhand: {
    name: "Off Hand",
    description: "Shield or secondary weapon",
    icon: "🛡️"
  },
  armor: {
    name: "Armor",
    description: "Body armor",
    icon: "🥋"
  },
  helmet: {
    name: "Helmet",
    description: "Head protection",
    icon: "⛑️"
  },
  amulet: {
    name: "Amulet",
    description: "Accessory item",
    icon: "📿"
  },
  ammo: {
    name: "Ammunition",
    description: "Arrows, bolts, powder",
    icon: "🏹"
  }
};

// Initialize equipment panel in UI
window.initializeEquipmentUI = function() {
  // Create equipment panel if it doesn't exist
  if (!document.getElementById('equipment')) {
    createEquipmentPanel();
  }
  
  // Add equipment panel toggle button
  addEquipmentButton();
  
  // Set up event listeners
  setupEquipmentEvents();
};

// Create the equipment panel in the DOM
function createEquipmentPanel() {
  // Create main equipment container
  const equipmentPanel = document.createElement('div');
  equipmentPanel.id = 'equipment';
  equipmentPanel.className = 'hidden';
  equipmentPanel.style.border = '1px solid #444';
  equipmentPanel.style.background = '#1a1a1a';
  equipmentPanel.style.padding = '15px';
  equipmentPanel.style.marginTop = '20px';
  equipmentPanel.style.borderRadius = '8px';
  equipmentPanel.style.boxShadow = '0 3px 6px rgba(0, 0, 0, 0.2)';
  equipmentPanel.style.maxHeight = '70vh';
  equipmentPanel.style.overflowY = 'auto';
  
  // Add title
  const title = document.createElement('h3');
  title.textContent = 'Equipment';
  equipmentPanel.appendChild(title);
  
  // Create character silhouette container
  const silhouetteContainer = document.createElement('div');
  silhouetteContainer.className = 'silhouette-container';
  silhouetteContainer.style.display = 'flex';
  silhouetteContainer.style.justifyContent = 'center';
  silhouetteContainer.style.marginBottom = '20px';
  
  // Create character silhouette
  const silhouette = document.createElement('div');
  silhouette.className = 'character-silhouette';
  silhouette.style.width = '150px';
  silhouette.style.height = '300px';
  silhouette.style.background = '#2a2a2a';
  silhouette.style.borderRadius = '5px';
  silhouette.style.position = 'relative';
  
  // Add silhouette to container
  silhouetteContainer.appendChild(silhouette);
  equipmentPanel.appendChild(silhouetteContainer);
  
  // Create equipment slots
  const slotsContainer = document.createElement('div');
  slotsContainer.className = 'equipment-slots';
  slotsContainer.style.display = 'grid';
  slotsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
  slotsContainer.style.gap = '10px';
  
  // Add each equipment slot
  for (const [slotKey, slotInfo] of Object.entries(EQUIPMENT_SLOTS)) {
    const slotElement = document.createElement('div');
    slotElement.className = 'equipment-slot';
    slotElement.dataset.slot = slotKey;
    slotElement.style.padding = '10px';
    slotElement.style.border = '1px solid #444';
    slotElement.style.borderRadius = '4px';
    slotElement.style.display = 'flex';
    slotElement.style.alignItems = 'center';
    slotElement.style.cursor = 'pointer';
    
    // Slot icon
    const slotIcon = document.createElement('div');
    slotIcon.className = 'slot-icon';
    slotIcon.textContent = slotInfo.icon;
    slotIcon.style.marginRight = '10px';
    slotIcon.style.fontSize = '1.5em';
    slotElement.appendChild(slotIcon);
    
    // Slot info
    const slotInfoElement = document.createElement('div');
    slotInfoElement.style.flexGrow = '1';
    
    // Slot name
    const slotName = document.createElement('div');
    slotName.className = 'slot-name';
    slotName.textContent = slotInfo.name;
    slotName.style.fontWeight = 'bold';
    slotInfoElement.appendChild(slotName);
    
    // Slot content (initially empty)
    const slotContent = document.createElement('div');
    slotContent.className = 'slot-content';
    slotContent.textContent = 'None';
    slotContent.style.color = '#888';
    slotInfoElement.appendChild(slotContent);
    
    slotElement.appendChild(slotInfoElement);
    
    // Add to slots container
    slotsContainer.appendChild(slotElement);
  }
  
  equipmentPanel.appendChild(slotsContainer);
  
  // Equipment stats section
  const statsSection = document.createElement('div');
  statsSection.id = 'equipment-stats';
  statsSection.style.marginTop = '20px';
  statsSection.style.padding = '10px';
  statsSection.style.border = '1px solid #444';
  statsSection.style.borderRadius = '4px';
  
  // Stats title
  const statsTitle = document.createElement('h4');
  statsTitle.textContent = 'Equipment Stats';
  statsTitle.style.marginTop = '0';
  statsSection.appendChild(statsTitle);
  
  // Stats content
  const statsContent = document.createElement('div');
  statsContent.id = 'equipment-stats-content';
  statsSection.appendChild(statsContent);
  
  equipmentPanel.appendChild(statsSection);
  
  // Close button
  const closeButton = document.createElement('button');
  closeButton.className = 'menu-button equipment-close';
  closeButton.textContent = 'Close';
  closeButton.style.marginTop = '15px';
  equipmentPanel.appendChild(closeButton);
  
  // Add to page
  const gameContainer = document.getElementById('gameContainer');
  if (gameContainer) {
    gameContainer.appendChild(equipmentPanel);
  }
}

// Add equipment button to main UI
function addEquipmentButton() {
  // Check if there's an actions container
  const actionsContainer = document.getElementById('actions');
  if (!actionsContainer) return;
  
  // Check if button already exists in updateActionButtons function
  if (typeof window.updateActionButtons === 'function') {
    // We'll hook into the existing function later
    console.log("Will hook into updateActionButtons for equipment button");
  } else {
    // Direct add if no function exists
    const equipButton = document.createElement('button');
    equipButton.className = 'action-btn';
    equipButton.textContent = 'Equipment';
    equipButton.onclick = function() {
      document.getElementById('equipment').classList.remove('hidden');
    };
    actionsContainer.appendChild(equipButton);
  }
}

// Set up event listeners for equipment panel
function setupEquipmentEvents() {
  // Close button functionality
  document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('equipment-close')) {
      document.getElementById('equipment').classList.add('hidden');
    }
  });
  
  // Equipment slot click handlers
  document.addEventListener('click', function(e) {
    const slotElement = e.target.closest('.equipment-slot');
    if (slotElement) {
      const slotKey = slotElement.dataset.slot;
      
      // If player has the slot equipped, show unequip option
      if (window.player.equipment[slotKey]) {
        // Check if we should show a context menu
        showEquipmentContextMenu(slotElement, slotKey);
      } else {
        // Open inventory with filter for this slot type
        document.getElementById('equipment').classList.add('hidden');
        document.getElementById('inventory').classList.remove('hidden');
        // Future: add filtering/highlighting of relevant items
      }
    }
  });
}

// Show context menu for equipped items
function showEquipmentContextMenu(slotElement, slotKey) {
  // Remove any existing context menus
  const existingMenu = document.querySelector('.equipment-context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }
  
  // Get the equipped item
  const equippedItem = window.player.equipment[slotKey];
  if (!equippedItem) return;
  
  // Create context menu
  const contextMenu = document.createElement('div');
  contextMenu.className = 'equipment-context-menu';
  contextMenu.style.position = 'absolute';
  contextMenu.style.background = '#2a2a2a';
  contextMenu.style.border = '1px solid #555';
  contextMenu.style.borderRadius = '4px';
  contextMenu.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
  contextMenu.style.zIndex = '100';
  
  // Position the menu
  const rect = slotElement.getBoundingClientRect();
  contextMenu.style.left = `${rect.left + window.pageXOffset}px`;
  contextMenu.style.top = `${rect.bottom + window.pageYOffset + 5}px`;
  
  // Add menu options
  // Unequip option
  const unequipOption = document.createElement('div');
  unequipOption.className = 'context-menu-option';
  unequipOption.textContent = 'Unequip';
  unequipOption.style.padding = '8px 12px';
  unequipOption.style.cursor = 'pointer';
  unequipOption.style.transition = 'background 0.2s';
  
  unequipOption.addEventListener('mouseover', function() {
    this.style.background = '#444';
  });
  
  unequipOption.addEventListener('mouseout', function() {
    this.style.background = 'transparent';
  });
  
  unequipOption.addEventListener('click', function() {
    window.unequipItem(equippedItem.id);
    updateEquipmentDisplay();
    contextMenu.remove();
  });
  
  contextMenu.appendChild(unequipOption);
  
  // Inspect option
  const inspectOption = document.createElement('div');
  inspectOption.className = 'context-menu-option';
  inspectOption.textContent = 'Inspect';
  inspectOption.style.padding = '8px 12px';
  inspectOption.style.cursor = 'pointer';
  inspectOption.style.transition = 'background 0.2s';
  
  inspectOption.addEventListener('mouseover', function() {
    this.style.background = '#444';
  });
  
  inspectOption.addEventListener('mouseout', function() {
    this.style.background = 'transparent';
  });
  
  inspectOption.addEventListener('click', function() {
    showItemDetails(equippedItem);
    contextMenu.remove();
  });
  
  contextMenu.appendChild(inspectOption);
  
  // Add to page
  document.body.appendChild(contextMenu);
  
  // Close menu when clicking elsewhere
  function closeContextMenu(e) {
    if (!contextMenu.contains(e.target) && !slotElement.contains(e.target)) {
      contextMenu.remove();
      document.removeEventListener('click', closeContextMenu);
    }
  }
  
  // Delay adding the event listener to prevent immediate closure
  setTimeout(() => {
    document.addEventListener('click', closeContextMenu);
  }, 10);
}

// Show detailed item information
function showItemDetails(item) {
  // Create modal for item details
  const modal = document.createElement('div');
  modal.className = 'item-details-modal';
  modal.style.position = 'fixed';
  modal.style.top = '50%';
  modal.style.left = '50%';
  modal.style.transform = 'translate(-50%, -50%)';
  modal.style.background = '#1a1a1a';
  modal.style.border = '1px solid #444';
  modal.style.borderRadius = '8px';
  modal.style.padding = '20px';
  modal.style.maxWidth = '400px';
  modal.style.width = '90%';
  modal.style.maxHeight = '80vh';
  modal.style.overflowY = 'auto';
  modal.style.zIndex = '1000';
  modal.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
  
  // Modal content
  const content = document.createElement('div');
  
  // Item title
  const title = document.createElement('h3');
  title.textContent = item.name;
  title.style.marginTop = '0';
  title.style.borderBottom = '1px solid #444';
  title.style.paddingBottom = '10px';
  content.appendChild(title);
  
  // Item description
  const description = document.createElement('p');
  description.textContent = item.description;
  description.style.fontStyle = 'italic';
  description.style.color = '#aaa';
  content.appendChild(description);
  
  // Item stats
  const stats = document.createElement('div');
  stats.style.marginTop = '15px';
  
  // Different stats based on item category
  if (item.category === "WEAPON") {
    // Weapon stats
    stats.innerHTML = `
      <div><strong>Type:</strong> ${item.type}</div>
      <div><strong>Damage:</strong> ${item.stats.damage[0]}-${item.stats.damage[1]}</div>
      <div><strong>To Hit:</strong> ${item.stats.toHit > 0 ? '+' : ''}${item.stats.toHit}%</div>
      <div><strong>Critical Chance:</strong> ${item.stats.critChance}%</div>
      <div><strong>Durability:</strong> ${item.condition}/${item.maxCondition}</div>
      <div><strong>Weight:</strong> ${item.weight} kg</div>
      <div><strong>Value:</strong> ${item.value} taelors</div>
    `;
    
    // Add weapon type details
    const weaponType = window.WEAPON_TYPES[item.type];
    if (weaponType) {
      stats.innerHTML += `
        <div><strong>Hands:</strong> ${weaponType.hands}-handed</div>
        <div><strong>Range:</strong> ${weaponType.range}</div>
        <div><strong>Attacks:</strong> ${weaponType.attacks.map(a => a.charAt(0).toUpperCase() + a.slice(1)).join(', ')}</div>
      `;
      
      if (weaponType.special) {
        stats.innerHTML += `<div><strong>Special:</strong> ${weaponType.special.charAt(0).toUpperCase() + weaponType.special.slice(1)}</div>`;
      }
      
      if (weaponType.requiresAmmo) {
        stats.innerHTML += `<div><strong>Requires:</strong> ${weaponType.requiresAmmo.charAt(0).toUpperCase() + weaponType.requiresAmmo.slice(1)} ammo</div>`;
      }
    }
  } else if (item.category === "ARMOR" || item.category === "HELMET") {
    // Armor stats
    stats.innerHTML = `
      <div><strong>Defense:</strong> ${item.stats.defense}</div>
      <div><strong>Stamina Penalty:</strong> ${item.stats.staminaPenalty || 0}</div>
      <div><strong>Durability:</strong> ${item.condition}/${item.maxCondition}</div>
      <div><strong>Weight:</strong> ${item.weight} kg</div>
      <div><strong>Value:</strong> ${item.value} taelors</div>
    `;
  } else if (item.category === "SHIELD") {
    // Shield stats
    stats.innerHTML = `
      <div><strong>Defense:</strong> ${item.stats.defense}</div>
      <div><strong>Block Chance:</strong> ${item.stats.blockChance}%</div>
      <div><strong>Stamina Penalty:</strong> ${item.stats.staminaPenalty || 0}</div>
      <div><strong>Durability:</strong> ${item.condition}/${item.maxCondition}</div>
      <div><strong>Weight:</strong> ${item.weight} kg</div>
      <div><strong>Value:</strong> ${item.value} taelors</div>
    `;
  } else if (item.category === "AMMUNITION") {
    // Ammo stats
    stats.innerHTML = `
      <div><strong>Type:</strong> ${item.ammoType}</div>
      <div><strong>Quantity:</strong> ${item.quantity}/${item.maxQuantity}</div>
      <div><strong>Weight (total):</strong> ${(item.weight * item.quantity).toFixed(1)} kg</div>
      <div><strong>Value (total):</strong> ${item.value * item.quantity} taelors</div>
    `;
  } else {
    // Generic item stats
    stats.innerHTML = `
      <div><strong>Type:</strong> ${item.category}</div>
      <div><strong>Weight:</strong> ${item.weight} kg</div>
      <div><strong>Value:</strong> ${item.value} taelors</div>
    `;
    
    if (item.quantity) {
      stats.innerHTML += `<div><strong>Quantity:</strong> ${item.quantity}</div>`;
    }
  }
  
  content.appendChild(stats);
  
  // Effects section if item has effects
  if (item.effects && item.effects.length > 0) {
    const effectsTitle = document.createElement('h4');
    effectsTitle.textContent = 'Effects';
    effectsTitle.style.marginTop = '15px';
    effectsTitle.style.borderBottom = '1px solid #444';
    effectsTitle.style.paddingBottom = '5px';
    content.appendChild(effectsTitle);
    
    const effectsList = document.createElement('ul');
    effectsList.style.paddingLeft = '20px';
    
    item.effects.forEach(effect => {
      const effectItem = document.createElement('li');
      effectItem.textContent = effect.description;
      effectsList.appendChild(effectItem);
    });
    
    content.appendChild(effectsList);
  }
  
  // Requirements section if item has requirements
  if (item.requirements && (item.requirements.phy || (item.requirements.skills && Object.keys(item.requirements.skills).length > 0))) {
    const reqTitle = document.createElement('h4');
    reqTitle.textContent = 'Requirements';
    reqTitle.style.marginTop = '15px';
    reqTitle.style.borderBottom = '1px solid #444';
    reqTitle.style.paddingBottom = '5px';
    content.appendChild(reqTitle);
    
    const reqList = document.createElement('ul');
    reqList.style.paddingLeft = '20px';
    
    if (item.requirements.phy) {
      const phyReq = document.createElement('li');
      phyReq.textContent = `Physical (PHY): ${item.requirements.phy}`;
      
      // Highlight if requirement not met
      if (window.player.phy < item.requirements.phy) {
        phyReq.style.color = '#ff6b6b';
      }
      
      reqList.appendChild(phyReq);
    }
    
    if (item.requirements.skills) {
      for (const [skill, value] of Object.entries(item.requirements.skills)) {
        const skillReq = document.createElement('li');
        skillReq.textContent = `${skill.charAt(0).toUpperCase() + skill.slice(1)}: ${value}`;
        
        // Highlight if requirement not met
        if (window.player.skills[skill] < value) {
          skillReq.style.color = '#ff6b6b';
        }
        
        reqList.appendChild(skillReq);
      }
    }
    
    content.appendChild(reqList);
  }
  
  // Close button
  const closeButton = document.createElement('button');
  closeButton.className = 'menu-button';
  closeButton.textContent = 'Close';
  closeButton.style.marginTop = '15px';
  closeButton.style.width = '100%';
  
  closeButton.addEventListener('click', function() {
    modal.remove();
  });
  
  content.appendChild(closeButton);
  
  // Add content to modal
  modal.appendChild(content);
  
  // Add modal to page
  document.body.appendChild(modal);
  
  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.style.position = 'fixed';
  backdrop.style.top = '0';
  backdrop.style.left = '0';
  backdrop.style.width = '100%';
  backdrop.style.height = '100%';
  backdrop.style.background = 'rgba(0, 0, 0, 0.5)';
  backdrop.style.zIndex = '999';
  
  backdrop.addEventListener('click', function() {
    modal.remove();
    backdrop.remove();
  });
  
  document.body.appendChild(backdrop);
}

// Update equipment display to reflect current equipped items
window.updateEquipmentDisplay = function() {
  // Check if equipment panel exists
  const equipmentPanel = document.getElementById('equipment');
  if (!equipmentPanel) return;
  
  // Update each slot
  for (const [slotKey, slotInfo] of Object.entries(EQUIPMENT_SLOTS)) {
    const slotElement = equipmentPanel.querySelector(`.equipment-slot[data-slot="${slotKey}"]`);
    if (!slotElement) continue;
    
    const slotContent = slotElement.querySelector('.slot-content');
    if (!slotContent) continue;
    
    // Get the equipped item
    const equippedItem = window.player.equipment[slotKey];
    
    if (equippedItem) {
      slotContent.textContent = equippedItem.name;
      slotContent.style.color = '#e0e0e0';
      
      // Add quantity for ammo
      if (slotKey === 'ammo' && equippedItem.quantity) {
        slotContent.textContent += ` (${equippedItem.quantity})`;
      }
      
      // Highlight slot
      slotElement.style.background = '#2a3b2a';
    } else {
      slotContent.textContent = 'None';
      slotContent.style.color = '#888';
      slotElement.style.background = 'transparent';
    }
  }
  
  // Update equipment stats
  updateEquipmentStats();
};

// Update equipment stats display
function updateEquipmentStats() {
  const statsContent = document.getElementById('equipment-stats-content');
  if (!statsContent) return;
  
  // Calculate total stats from equipment
  const stats = {
    defense: window.gameState.equipmentDefense || 0,
    blockChance: window.gameState.blockChance || 0,
    staminaPenalty: window.gameState.staminaPenalty || 0,
    visionPenalty: window.gameState.visionPenalty || 0,
    moraleBonus: window.gameState.moraleBonus || 0
  };
  
  // Display stats
  let statsHTML = `
    <div><strong>Total Defense:</strong> ${stats.defense}</div>
    <div><strong>Block Chance:</strong> ${stats.blockChance}%</div>
  `;
  
  // Only show penalties/bonuses if they exist
  if (stats.staminaPenalty > 0) {
    statsHTML += `<div><strong>Stamina Penalty:</strong> -${stats.staminaPenalty}</div>`;
  }
  
  if (stats.visionPenalty > 0) {
    statsHTML += `<div><strong>Vision Penalty:</strong> -${stats.visionPenalty}</div>`;
  }
  
  if (stats.moraleBonus > 0) {
    statsHTML += `<div><strong>Morale Bonus:</strong> +${stats.moraleBonus}</div>`;
  }
  
  // Get weight calculation
  const totalWeight = calculateTotalEquipmentWeight();
  statsHTML += `<div><strong>Total Weight:</strong> ${totalWeight} kg</div>`;
  
  // Display encumbrance status
  const encumbranceStatus = getEncumbranceStatus(totalWeight);
  statsHTML += `<div><strong>Encumbrance:</strong> <span style="color: ${encumbranceStatus.color};">${encumbranceStatus.level}</span></div>`;
  
  // Update the content
  statsContent.innerHTML = statsHTML;
}

// Calculate total equipment weight
function calculateTotalEquipmentWeight() {
  let totalWeight = 0;
  
  // Add weight from equipped items
  for (const slot of Object.keys(EQUIPMENT_SLOTS)) {
    const item = window.player.equipment[slot];
    if (item) {
      if (item.category === 'AMMUNITION' && item.quantity) {
        totalWeight += item.weight * item.quantity;
      } else {
        totalWeight += item.weight || 0;
      }
    }
  }
  
  return totalWeight.toFixed(1);
}

// Get encumbrance status based on weight
function getEncumbranceStatus(weight) {
  const physicalStat = window.player.phy || 10;
  
  // Weight limits based on physical attribute
  const lightLimit = physicalStat * 2;
  const mediumLimit = physicalStat * 4;
  const heavyLimit = physicalStat * 6;
  
  if (weight <= lightLimit) {
    return { level: 'Light', color: '#56ab2f' };
  } else if (weight <= mediumLimit) {
    return { level: 'Medium', color: '#f9d423' };
  } else if (weight <= heavyLimit) {
    return { level: 'Heavy', color: '#ff6b6b' };
  } else {
    return { level: 'Overburdened', color: '#ff0000' };
  }
}

// Patch updateActionButtons to include equipment button
window.originalUpdateActionButtons = window.updateActionButtons;
window.updateActionButtons = function() {
  // Call the original function
  if (typeof window.originalUpdateActionButtons === 'function') {
    window.originalUpdateActionButtons();
  }
  
  // Add equipment button if not in combat
  if (!window.gameState.inBattle) {
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      window.addActionButton('Equipment', 'equipment', actionsContainer);
    }
  }
};

// Patch handleAction to handle equipment button
window.originalHandleAction = window.handleAction;
window.handleAction = function(action) {
  if (action === 'equipment') {
    document.getElementById('equipment').classList.remove('hidden');
    updateEquipmentDisplay();
    return;
  }
  
  // Call the original function for other actions
  if (typeof window.originalHandleAction === 'function') {
    window.originalHandleAction(action);
  }
};

// Export functions for external use
window.equipmentUI = {
  initializeEquipmentUI,
  updateEquipmentDisplay,
  showItemDetails
};

console.log("Equipment UI System loaded successfully");
