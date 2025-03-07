// INVENTORY UI MODULE
// Handles all inventory interface elements

// Initialize inventory UI
window.initializeInventoryUI = function() {
  console.log("Initializing inventory UI...");
  
  // Ensure we have the inventory container
  const inventoryContainer = document.getElementById('inventory');
  if (!inventoryContainer) {
    console.error("Inventory container not found!");
    return;
  }
  
  // Check if player is cavalry for mount slot
  const isCavalry = window.player && window.player.career && 
                    window.player.career.title === "Castellan Cavalry";
  
  // Create the structure for the inventory UI
  inventoryContainer.innerHTML = `
    <h3>Inventory</h3>
    <div class="inventory-header">
      <div class="inventory-currency">
        <span id="currency-display">${window.player.taelors} Taelors</span>
      </div>
      <div class="inventory-capacity">
        <span id="capacity-display">0/${window.player.inventoryCapacity}</span>
      </div>
    </div>
    
    <div class="inventory-tabs">
      <button class="inventory-tab active" data-category="all">All</button>
      <button class="inventory-tab" data-category="${window.ITEM_CATEGORIES.WEAPON}">Weapons</button>
      <button class="inventory-tab" data-category="${window.ITEM_CATEGORIES.ARMOR}">Armor</button>
      <button class="inventory-tab" data-category="${window.ITEM_CATEGORIES.CONSUMABLE}">Consumables</button>
      <button class="inventory-tab" data-category="${window.ITEM_CATEGORIES.MATERIAL}">Materials</button>
      ${isCavalry ? `<button class="inventory-tab" data-category="mount">Mounts</button>` : ''}
    </div>
    
    <div class="inventory-content">
      <div class="equipment-panel">
        <h4>Equipment</h4>
        <div class="paperdoll ${isCavalry ? 'has-mount' : ''}">
          <div class="equipment-slot" data-slot="head" id="head-slot">
            <div class="slot-icon">👒</div>
            <div class="slot-name">Head</div>
          </div>
          <div class="equipment-slot" data-slot="body" id="body-slot">
            <div class="slot-icon">👕</div>
            <div class="slot-name">Body</div>
          </div>
          <div class="equipment-slot" data-slot="mainHand" id="main-hand-slot">
            <div class="slot-icon">🗡️</div>
            <div class="slot-name">Main Hand</div>
          </div>
          <div class="equipment-slot" data-slot="offHand" id="off-hand-slot">
            <div class="slot-icon">🛡️</div>
            <div class="slot-name">Off Hand</div>
          </div>
          <div class="equipment-slot" data-slot="accessory" id="accessory-slot">
            <div class="slot-icon">📿</div>
            <div class="slot-name">Accessory</div>
          </div>
          ${isCavalry ? `
          <div class="equipment-slot mount-slot" data-slot="mount" id="mount-slot">
            <div class="slot-icon">🐎</div>
            <div class="slot-name">Mount</div>
          </div>` : ''}
        </div>
        <div class="equipment-stats">
          <h4>Stats</h4>
          <div id="equipment-stats-display">
            No equipment stats
          </div>
        </div>
      </div>
      
      <div class="items-panel">
        <div class="item-sort">
          <label>Sort by: </label>
          <select id="sort-select">
            <option value="category">Category</option>
            <option value="value">Value</option>
            <option value="name">Name</option>
          </select>
        </div>
        <div class="items-grid" id="items-grid">
          <!-- Items will be dynamically populated here -->
        </div>
      </div>
    </div>
    
    <div class="item-details-panel hidden" id="item-details-panel">
      <div class="item-details-close">✕</div>
      <div class="item-details-content" id="item-details-content">
        <!-- Item details will be displayed here -->
      </div>
      <div class="item-details-actions" id="item-details-actions">
        <!-- Action buttons will be added here -->
      </div>
    </div>
    
    <div class="inventory-footer">
      <button class="menu-button inventory-close">Close</button>
    </div>
  `;
  
  // Add event listeners
  const closeBtn = inventoryContainer.querySelector('.inventory-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      inventoryContainer.classList.add('hidden');
    });
  }
  
  // Tab switching
  const tabs = inventoryContainer.querySelectorAll('.inventory-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      tabs.forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const category = this.getAttribute('data-category');
      window.renderInventoryItems(category);
    });
  });
  
  // Sort selection
  const sortSelect = inventoryContainer.querySelector('#sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      const activeTab = inventoryContainer.querySelector('.inventory-tab.active');
      const category = activeTab ? activeTab.getAttribute('data-category') : 'all';
      window.renderInventoryItems(category, this.value);
    });
  }
  
  // Equipment slot clicks
  const equipmentSlots = inventoryContainer.querySelectorAll('.equipment-slot');
  equipmentSlots.forEach(slot => {
    slot.addEventListener('click', function() {
      const slotName = this.getAttribute('data-slot');
      const equippedItem = window.player.equipment[slotName];
      if (equippedItem && equippedItem !== "occupied") {
        window.showItemDetails(equippedItem);
      }
    });
  });
  
  // Close item details panel
  const detailsCloseBtn = inventoryContainer.querySelector('.item-details-close');
  if (detailsCloseBtn) {
    detailsCloseBtn.addEventListener('click', function() {
      const detailsPanel = document.getElementById('item-details-panel');
      if (detailsPanel) {
        detailsPanel.classList.add('hidden');
      }
    });
  }
  
  // Initialize drag and drop if available
  if (typeof window.implementDragAndDrop === 'function') {
    window.implementDragAndDrop();
  }
  
  // Render initial inventory state
  window.renderInventoryItems();
  window.updateEquipmentDisplay();
  
  console.log("Inventory UI initialized");
};

// Render the player's inventory items
window.renderInventoryItems = function(categoryFilter = 'all', sortBy = 'category') {
  console.log(`Rendering inventory items: category=${categoryFilter}, sort=${sortBy}`);
  
  // Before rendering, verify player inventory exists
  if (!window.player.inventory) {
    console.error("Player inventory not initialized!");
    window.player.inventory = [];
  }
  
  if (!window.player.inventoryCapacity) {
    console.warn("Inventory capacity not set, defaulting to 20");
    window.player.inventoryCapacity = 20;
  }
  
  // Sort the inventory
  window.sortInventory(sortBy);
  
  // Get items based on filter
  let items = [];
  if (categoryFilter === 'all') {
    items = window.player.inventory;
  } else {
    items = window.filterInventory(categoryFilter);
  }
  
  // Get the grid container
  const itemsGrid = document.getElementById('items-grid');
  if (!itemsGrid) {
    console.error("Items grid container not found!");
    return;
  }
  
  // Clear existing items
  itemsGrid.innerHTML = '';
  
  // Debug info about current inventory
  console.log(`Player has ${items.length} items in inventory (${window.player.inventory.length} total)`);
  
  // If no items
  if (items.length === 0) {
    itemsGrid.innerHTML = '<div class="no-items">No items found</div>';
  } else {
    // Create item cards
    items.forEach(item => {
      if (!item) {
        console.warn("Found null item in inventory, skipping");
        return;
      }
      
      // Get template - handle potential errors
      let template;
      try {
        template = item.getTemplate();
        if (!template) throw new Error("Template not found");
      } catch (e) {
        console.error("Error getting item template:", e);
        return;
      }
      
      const rarityClass = `rarity-${template.rarity.name.toLowerCase()}`;
      const borderClass = `border-${template.rarity.name.toLowerCase()}`;
      const categoryClass = `category-${template.category}`;
      const equippedClass = item.equipped ? 'item-equipped' : '';
      
      const itemCard = document.createElement('div');
      itemCard.className = `item-card ${borderClass} ${equippedClass}`;
      itemCard.setAttribute('data-instance-id', item.instanceId);
      
      // Generate HTML for item card
      itemCard.innerHTML = `
        <div class="item-icon ${rarityClass} ${categoryClass}">${template.symbol}</div>
        <div class="item-name">${template.name}</div>
        ${template.stackable ? `<div class="item-quantity">x${item.quantity}</div>` : ''}
        <div class="item-rarity-indicator" style="color: ${template.rarity.color}">${template.rarity.symbol}</div>
      `;
      
      // Add click event to show item details
      itemCard.addEventListener('click', function() {
        window.showItemDetails(item);
      });
      
      // Add the card to the grid
      itemsGrid.appendChild(itemCard);
    });
  }
  
  // Update the capacity display
  const capacityDisplay = document.getElementById('capacity-display');
  if (capacityDisplay) {
    capacityDisplay.textContent = `${window.player.inventory.length}/${window.player.inventoryCapacity}`;
  }
  
  // Update the currency display
  const currencyDisplay = document.getElementById('currency-display');
  if (currencyDisplay) {
    currencyDisplay.textContent = `${window.player.taelors} Taelors`;
  }
  
  // Now update the equipment display as well
  window.updateEquipmentDisplay();
};

// Show item details in the details panel
window.showItemDetails = function(item) {
  console.log("Showing item details for:", item);
  
  // Ensure we have the panels
  let detailsPanel = document.getElementById('item-details-panel');
  let modalOverlay = document.getElementById('inventory-modal-overlay');
  let detailsContent = document.getElementById('item-details-content');
  let actionsContainer = document.getElementById('item-details-actions');
  
  // Create overlay if it doesn't exist
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'inventory-modal-overlay';
    modalOverlay.className = 'modal-overlay hidden';
    document.getElementById('inventory').appendChild(modalOverlay);
  }
  
  // Create panels if they don't exist
  if (!detailsPanel) {
    console.log("Creating new details panel");
    detailsPanel = document.createElement('div');
    detailsPanel.id = 'item-details-panel';
    detailsPanel.className = 'item-details-panel hidden';
    
    // Create content div
    detailsContent = document.createElement('div');
    detailsContent.id = 'item-details-content';
    detailsPanel.appendChild(detailsContent);
    
    // Create actions container
    actionsContainer = document.createElement('div');
    actionsContainer.id = 'item-details-actions';
    detailsPanel.appendChild(actionsContainer);
    
    // Add to inventory container
    const inventoryContainer = document.getElementById('inventory');
    if (!inventoryContainer) {
      console.error("Inventory container not found!");
      return;
    }
    inventoryContainer.appendChild(detailsPanel);
  }
  
  // Function to hide the panel and overlay
  const hidePanel = () => {
    detailsPanel.classList.add('hidden');
    modalOverlay.classList.add('hidden');
  };
  
  // Get the template
  const template = item.getTemplate();
  console.log("Item template:", template);
  
  const rarityClass = `rarity-${template.rarity.name.toLowerCase()}`;
  const categoryClass = `category-${template.category}`;
  
  // Create the content HTML
  let contentHTML = `
    <div class="item-details-header">
      <div class="item-details-icon ${rarityClass} ${categoryClass}">${template.symbol}</div>
      <div class="item-details-title">
        <div class="item-details-name">${template.name}</div>
        <div class="item-details-type">${template.category} ${template.weaponType ? `- ${template.weaponType.name}` : ''} ${template.armorType ? `- ${template.armorType.name}` : ''}</div>
      </div>
      <div class="item-details-close">✕</div>
    </div>
    
    <div class="item-details-rarity" style="color: ${template.rarity.color}">${template.rarity.name}</div>
    
    <div class="item-details-description">${template.description.replace(/\n/g, '<br>')}</div>
  `;
  
  // Add stats if applicable
  if (template.stats && Object.keys(template.stats).length > 0) {
    contentHTML += '<div class="item-details-stats">';
    
    for (const [stat, value] of Object.entries(template.stats)) {
      const displayStat = stat.charAt(0).toUpperCase() + stat.slice(1);
      const sign = value >= 0 ? '+' : '';
      contentHTML += `<div>${displayStat}: ${sign}${value}</div>`;
    }
    
    contentHTML += '</div>';
  }
  
  // Add value and weight
  contentHTML += `
    <div>
      <div>Value: ${template.value} taelors</div>
      <div>Weight: ${template.weight} kg</div>
    </div>
  `;
  
  // Add comparison if this is an equippable item
  if (template.equipSlot && !item.equipped) {
    const currentEquipped = window.player.equipment[template.equipSlot];
    
    if (currentEquipped && currentEquipped !== "occupied") {
      const comparison = window.compareItems(item, currentEquipped);
      
      if (comparison && comparison.comparable) {
        contentHTML += `
          <div class="item-comparison">
            <h4>Compare with ${currentEquipped.getTemplate().name}</h4>
        `;
        
        for (const [stat, values] of Object.entries(comparison.stats)) {
          const displayStat = stat.charAt(0).toUpperCase() + stat.slice(1);
          const betterClass = values.diff > 0 ? 'stat-better' : values.diff < 0 ? 'stat-worse' : '';
          
          contentHTML += `
            <div class="stat-comparison">
              <div class="stat-label">${displayStat}</div>
              <div class="stat-current">${values.a}</div>
              <div class="stat-new ${betterClass}">${values.b} ${values.diff > 0 ? `(+${values.diff})` : values.diff < 0 ? `(${values.diff})` : ''}</div>
            </div>
          `;
        }
        
        contentHTML += '</div>';
      }
    }
  }
  
  // Set the content
  detailsContent.innerHTML = contentHTML;
  
  // Clear and add action buttons
  actionsContainer.innerHTML = '';
  
  // Item is in inventory
  if (!item.equipped) {
    // Use button for consumables
    if (template.usable) {
      const useButton = document.createElement('button');
      useButton.className = 'item-action-btn use';
      useButton.textContent = 'Use';
      useButton.addEventListener('click', async function() {
        try {
          await window.useItem(item.instanceId);
          hidePanel();
          window.renderInventoryItems(document.querySelector('.inventory-tab.active').getAttribute('data-category'));
          window.updateEquipmentDisplay();
        } catch (error) {
          console.error("Error using item:", error);
        }
      });
      actionsContainer.appendChild(useButton);
    }
    
    // Equip button for equipment
    if (template.equipSlot) {
      const equipButton = document.createElement('button');
      equipButton.className = 'item-action-btn equip';
      equipButton.textContent = 'Equip';
      equipButton.addEventListener('click', async function() {
        try {
          await window.equipItem(item.instanceId);
          hidePanel();
          window.renderInventoryItems(document.querySelector('.inventory-tab.active').getAttribute('data-category'));
          window.updateEquipmentDisplay();
        } catch (error) {
          console.error("Error equipping item:", error);
        }
      });
      actionsContainer.appendChild(equipButton);
    }
  } 
  // Item is equipped
  else {
    // Unequip button
    const unequipButton = document.createElement('button');
    unequipButton.className = 'item-action-btn unequip';
    unequipButton.textContent = 'Unequip';
    unequipButton.addEventListener('click', async function() {
      try {
        await window.unequipItem(template.equipSlot);
        hidePanel();
        window.renderInventoryItems(document.querySelector('.inventory-tab.active').getAttribute('data-category'));
        window.updateEquipmentDisplay();
      } catch (error) {
        console.error("Error unequipping item:", error);
      }
    });
    actionsContainer.appendChild(unequipButton);
  }
  
  // Close button
  const closeButton = document.createElement('button');
  closeButton.className = 'item-action-btn';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', hidePanel);
  actionsContainer.appendChild(closeButton);
  
  // Add close handler to the X button
  const closeX = detailsPanel.querySelector('.item-details-close');
  if (closeX) {
    closeX.addEventListener('click', hidePanel);
  }
  
  // Add click handler to overlay to close panel
  modalOverlay.addEventListener('click', (event) => {
    if (event.target === modalOverlay) {
      hidePanel();
    }
  });
  
  // Show the overlay and panel
  requestAnimationFrame(() => {
    modalOverlay.classList.remove('hidden');
    detailsPanel.classList.remove('hidden');
    console.log("Item details panel and overlay shown");
  });
};

// Update the equipment display in the paperdoll
window.updateEquipmentDisplay = function() {
  console.log("Updating equipment display");
  
  // Map of slot keys to HTML element IDs
  const slotIdMap = {
    'head': 'head-slot',
    'body': 'body-slot',
    'mainHand': 'main-hand-slot',
    'offHand': 'off-hand-slot',
    'accessory': 'accessory-slot',
    'mount': 'mount-slot'
  };
  
  // Verify equipment object exists
  if (!window.player.equipment) {
    console.error("Player equipment not initialized!");
    window.player.equipment = {
      head: null,
      body: null,
      mainHand: null,
      offHand: null,
      accessory: null
    };
    
    // Add mount for cavalry
    if (window.player.career && window.player.career.title === "Castellan Cavalry") {
      window.player.equipment.mount = null;
    }
  }
  
  // Update each equipment slot
  for (const slot in window.player.equipment) {
    // Use the mapped ID instead of directly constructing it
    const slotElementId = slotIdMap[slot];
    const slotElement = document.getElementById(slotElementId);
    
    if (!slotElement) {
      console.warn(`Slot element '${slotElementId}' not found in DOM for slot ${slot}`);
      continue;
    }
    
    // Clear existing content except for the slot name
    const slotName = slotElement.querySelector('.slot-name') ? 
      slotElement.querySelector('.slot-name').textContent : 
      slot.replace(/([A-Z])/g, ' $1').trim(); // Convert camelCase to words

    const item = window.player.equipment[slot];

    if (item && item !== "occupied") {
      // Check if item has getTemplate method
      if (typeof item.getTemplate !== 'function') {
        console.error(`Item in slot ${slot} is missing getTemplate function:`, item);

        // Create a minimal placeholder display
        slotElement.innerHTML = `
          <div class="item-icon" style="color: red;">❓</div>
          <div class="slot-name">${slotName}</div>
        `;
        continue;
      }

      // Get template
      try {
        const template = item.getTemplate();
        if (!template) throw new Error("Template not found");

        const rarityClass = `rarity-${template.rarity.name.toLowerCase()}`;
        const categoryClass = `category-${template.category}`;

        slotElement.innerHTML = `
          <div class="item-icon ${rarityClass} ${categoryClass}">${template.symbol}</div>
          <div class="slot-name">${slotName}</div>
        `;
      } catch (e) {
        console.error(`Error displaying item in slot ${slot}:`, e);
        slotElement.innerHTML = `
          <div class="item-icon" style="color: red;">❓</div>
          <div class="slot-name">${slotName}</div>
        `;
      }
    } else if (item === "occupied") {
      // This slot is occupied by a two-handed weapon
      slotElement.innerHTML = `
        <div class="item-icon" style="opacity: 0.5;">⛔</div>
        <div class="slot-name">${slotName}</div>
      `;
    } else {
      // Empty slot
      slotElement.innerHTML = `
        <div class="slot-icon">⬚</div>
        <div class="slot-name">${slotName}</div>
      `;
    }
  }
  
  // Update equipment stats display
  const statsDisplay = document.getElementById('equipment-stats-display');
  
  if (statsDisplay) {
    let statsHTML = '';
    
    // Ensure equipmentStats exists
    if (!window.player.equipmentStats) {
      window.player.equipmentStats = {
        damage: 0,
        defense: 0,
        speed: 0,
        critChance: 0,
        blockChance: 0
      };
      window.recalculateEquipmentStats();
    }
    
    // Check if any equipment is equipped
    let hasEquipment = false;
    for (const slot in window.player.equipment) {
      if (window.player.equipment[slot] && window.player.equipment[slot] !== "occupied") {
        hasEquipment = true;
        break;
      }
    }
    
    if (hasEquipment) {
      for (const [stat, value] of Object.entries(window.player.equipmentStats)) {
        // Skip zero values
        if (value === 0) continue;
        
        const displayStat = stat.charAt(0).toUpperCase() + stat.slice(1);
        const sign = value >= 0 ? '+' : '';
        
        statsHTML += `<div>${displayStat}: ${sign}${value}</div>`;
      }
    }
    
    if (statsHTML === '') {
      statsHTML = 'No equipment stats';
    }
    
    statsDisplay.innerHTML = statsHTML;
  }
  
  // Fix slot interaction with the correct IDs
  window.fixEquipmentSlotInteraction();
};

// Fix equipment slots interaction
window.fixEquipmentSlotInteraction = function() {
  console.log("Fixing equipment slot interaction");
  
  // Get all equipment slots
  const equipmentSlots = document.querySelectorAll('.equipment-slot');
  
  // Remove any existing click listeners
  equipmentSlots.forEach(slot => {
    const newSlot = slot.cloneNode(true);
    slot.parentNode.replaceChild(newSlot, slot);
    
    // Add new click listener
    newSlot.addEventListener('click', function(event) {
      // Prevent event bubbling
      event.stopPropagation();
      
      const slotName = this.getAttribute('data-slot');
      console.log(`Clicked equipment slot: ${slotName}`);
      
      // Convert from DOM slot name (dash format) to JS property name (camelCase)
      // e.g., 'main-hand' → 'mainHand'
      const propertyName = slotName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      
      if (!window.player.equipment) {
        console.error("Equipment object not initialized!");
        return;
      }
      
      const equippedItem = window.player.equipment[propertyName];
      
      console.log(`Equipped item in slot ${propertyName}:`, equippedItem);
      
      // Only show details if an item is equipped
      if (equippedItem && equippedItem !== "occupied") {
        // Show the item details
        window.showItemDetails(equippedItem);
      } else {
        console.log("No item in this slot or slot is occupied by two-handed weapon");
      }
    });
  });
  
  console.log("Equipment slot interaction fixed");
};

// Handle drag and drop functionality
window.implementDragAndDrop = function() {
  // Track dragged item
  let draggedItem = null;
  let draggedElement = null;
  let offsetX, offsetY;
  
  // Helper function to find the closest drop target
  const findDropTarget = function(x, y) {
    // Equipment slots
    const equipmentSlots = document.querySelectorAll('.equipment-slot');
    for (const slot of equipmentSlots) {
      const rect = slot.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return slot;
      }
    }
    
    return null;
  };
  
  // Handle dragstart
  document.addEventListener('mousedown', function(e) {
    // Check if item card
    if (e.target.closest('.item-card')) {
      const itemCard = e.target.closest('.item-card');
      
      // Get item instance ID
      const instanceId = itemCard.getAttribute('data-instance-id');
      draggedItem = window.player.inventory.find(item => item.instanceId === instanceId);
      
      if (draggedItem) {
        // Create a clone for dragging
        draggedElement = itemCard.cloneNode(true);
        draggedElement.classList.add('dragging');
        
        // Calculate offset
        const rect = itemCard.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        // Position the dragged element
        draggedElement.style.width = `${rect.width}px`;
        draggedElement.style.height = `${rect.height}px`;
        
        // Add to body
        document.body.appendChild(draggedElement);
        
        // Hide original
        itemCard.style.opacity = '0.3';
      }
    }
  });
  
  // Handle drag movement
  document.addEventListener('mousemove', function(e) {
    if (draggedElement) {
      // Move the dragged element
      draggedElement.style.left = `${e.clientX - offsetX}px`;
      draggedElement.style.top = `${e.clientY - offsetY}px`;
      
      // Check for drop targets
      const dropTarget = findDropTarget(e.clientX, e.clientY);
      
      // Clear previous drop targets
      document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
      
      // Highlight valid drop target
      if (dropTarget) {
        const slotName = dropTarget.getAttribute('data-slot');
        const template = draggedItem.getTemplate();
        
        // Only highlight if this item can be equipped in this slot
        if (template.equipSlot === slotName) {
          dropTarget.classList.add('drop-target');
        }
      }
    }
  });
  
  // Handle drop
  document.addEventListener('mouseup', function(e) {
    if (draggedElement) {
      // Check for drop target
      const dropTarget = findDropTarget(e.clientX, e.clientY);
      
      if (dropTarget) {
        const slotName = dropTarget.getAttribute('data-slot');
        const template = draggedItem.getTemplate();
        
        // Equip if valid slot
        if (template.equipSlot === slotName) {
          window.equipItem(draggedItem.instanceId);
          window.renderInventoryItems(document.querySelector('.inventory-tab.active').getAttribute('data-category'));
          window.updateEquipmentDisplay();
        }
      }
      
      // Remove the dragged element
      document.body.removeChild(draggedElement);
      draggedElement = null;
      
      // Restore original item
      const originalItem = document.querySelector(`.item-card[data-instance-id="${draggedItem.instanceId}"]`);
      if (originalItem) {
        originalItem.style.opacity = '1';
      }
      
      // Clear drag state
      draggedItem = null;
      
      // Clear drop targets
      document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    }
  });
};

// Override the inventory button handler
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, inventory UI module ready");
});