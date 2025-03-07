// INVENTORY UI MODULE
// Handles all inventory interface elements

// Initialize inventory UI
window.initializeInventoryUI = function() {
  console.log("Initializing inventory UI...");
  
  // Get the inventory container
  const inventoryContainer = document.getElementById('inventory');
  
  // Check if it exists
  if (!inventoryContainer) {
    console.error("Inventory container not found!");
    return;
  }
  
  // Determine if player is cavalry for mount slot
  const isCavalry = window.player.career && window.player.career.title === "Castellan Cavalry";
  
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
          <div class="equipment-slot" data-slot="${window.EQUIPMENT_SLOTS.HEAD}" id="head-slot">
            <div class="slot-icon">👒</div>
            <div class="slot-name">Head</div>
          </div>
          <div class="equipment-slot" data-slot="${window.EQUIPMENT_SLOTS.BODY}" id="body-slot">
            <div class="slot-icon">👕</div>
            <div class="slot-name">Body</div>
          </div>
          <div class="equipment-slot" data-slot="${window.EQUIPMENT_SLOTS.MAIN_HAND}" id="main-hand-slot">
            <div class="slot-icon">🗡️</div>
            <div class="slot-name">Main Hand</div>
          </div>
          <div class="equipment-slot" data-slot="${window.EQUIPMENT_SLOTS.OFF_HAND}" id="off-hand-slot">
            <div class="slot-icon">🛡️</div>
            <div class="slot-name">Off Hand</div>
          </div>
          <div class="equipment-slot" data-slot="${window.EQUIPMENT_SLOTS.ACCESSORY}" id="accessory-slot">
            <div class="slot-icon">📿</div>
            <div class="slot-name">Accessory</div>
          </div>
          ${isCavalry ? `
          <div class="equipment-slot mount-slot" data-slot="${window.EQUIPMENT_SLOTS.MOUNT}" id="mount-slot">
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
  
  // Add additional CSS for mount slot
  const mountStyle = document.createElement('style');
  mountStyle.textContent = `
    .paperdoll.has-mount {
      grid-template-areas:
        ". head ."
        "mainHand body offHand"
        ". accessory ."
        ". mount .";
      gap: 10px;
    }
    
    .mount-slot {
      grid-area: mount;
      background-color: rgba(139, 69, 19, 0.2) !important;
      border: 1px dashed #8B4513 !important;
    }
    
    .mount-slot:hover {
      background-color: rgba(139, 69, 19, 0.3) !important;
    }
    
    .category-mount {
      background-color: rgba(139, 69, 19, 0.2) !important;
    }
  `;
  document.head.appendChild(mountStyle);
  
  // Add event listeners
  document.querySelector('.inventory-close').addEventListener('click', function() {
    document.getElementById('inventory').classList.add('hidden');
  });
  
  // Tab switching
  const tabs = document.querySelectorAll('.inventory-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', function() {
      // Remove active class from all tabs
      tabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Filter items based on selected category
      const category = this.getAttribute('data-category');
      window.renderInventoryItems(category);
    });
  });
  
    // Sort selection
    document.getElementById('sort-select').addEventListener('change', function() {
      const category = document.querySelector('.inventory-tab.active').getAttribute('data-category');
      window.renderInventoryItems(category, this.value);
    });

    // Equipment slot clicks
    const equipmentSlots = document.querySelectorAll('.equipment-slot');
    equipmentSlots.forEach(slot => {
      slot.addEventListener('click', function() {
        const slotName = this.getAttribute('data-slot');
        const equippedItem = window.player.equipment[slotName];
        
        // Only show details if an item is equipped
        if (equippedItem && equippedItem !== "occupied") {
          window.showItemDetails(equippedItem);
        }
      });
    });
  
  // Close item details panel when clicking the X
  document.querySelector('.item-details-close').addEventListener('click', function() {
    document.getElementById('item-details-panel').classList.add('hidden');
  });
  

  
  // Add stylesheet
  const style = document.createElement('style');
  style.textContent = `
    #inventory {
      max-width: 900px;
      margin: 0 auto;
    }
    
    .inventory-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      padding: 10px;
      background: #222;
      border-radius: 4px;
    }
    
    .inventory-currency {
      font-weight: bold;
      color: gold;
    }
    
    .inventory-tabs {
      display: flex;
      margin-bottom: 15px;
      border-bottom: 1px solid #444;
    }
    
    .inventory-tab {
      background: none;
      border: none;
      padding: 8px 15px;
      color: #aaa;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .inventory-tab:hover {
      color: #fff;
      background: #333;
    }
    
    .inventory-tab.active {
      color: #fff;
      border-bottom: 2px solid #a0a0ff;
    }
    
    .inventory-content {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .equipment-panel {
      flex: 0 0 250px;
      background: #222;
      border-radius: 8px;
      padding: 15px;
    }
    
    .paperdoll {
      display: grid;
      grid-template-areas:
        ". head ."
        "mainHand body offHand"
        ". accessory .";
      gap: 10px;
      margin-bottom: 20px;
    }
    
    .equipment-slot {
      background: #333;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;
      min-height: 60px;
      position: relative;
    }
    
    .equipment-slot:hover {
      background: #3a3a3a;
      transform: translateY(-2px);
    }
    
    .equipment-slot[data-slot="head"] { grid-area: head; }
    .equipment-slot[data-slot="body"] { grid-area: body; }
    .equipment-slot[data-slot="mainHand"] { grid-area: mainHand; }
    .equipment-slot[data-slot="offHand"] { grid-area: offHand; }
    .equipment-slot[data-slot="accessory"] { grid-area: accessory; }
    
    .slot-icon {
      font-size: 24px;
      margin-bottom: 5px;
    }
    
    .slot-name {
      font-size: 12px;
      color: #888;
    }
    
    .equipment-stats {
      background: #2a2a2a;
      border-radius: 8px;
      padding: 10px;
    }
    
    .items-panel {
      flex: 1;
      background: #222;
      border-radius: 8px;
      padding: 15px;
      overflow: hidden;
    }
    
    .item-sort {
      margin-bottom: 10px;
      display: flex;
      align-items: center;
    }
    
    .item-sort select {
      background: #333;
      color: #e0e0e0;
      border: 1px solid #444;
      padding: 5px;
      margin-left: 10px;
      border-radius: 4px;
    }
    
    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 10px;
      max-height: 450px;
      overflow-y: auto;
      padding-right: 5px;
    }
    
    .item-card {
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: all 0.3s;
      position: relative;
    }
    
    .item-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
    }
    
    .item-icon {
      font-size: 28px;
      margin-bottom: 5px;
      padding: 5px;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .item-name {
      font-size: 12px;
      text-align: center;
      word-break: break-word;
      line-height: 1.2;
    }
    
    .item-quantity {
      position: absolute;
      bottom: 5px;
      right: 5px;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 10px;
      padding: 2px 5px;
      font-size: 10px;
      font-weight: bold;
    }
    
    .item-rarity-indicator {
      position: absolute;
      top: 5px;
      right: 5px;
      font-size: 14px;
    }
    
    .item-details-panel {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #222;
      border: 2px solid #444;
      border-radius: 8px;
      padding: 20px;
      width: 90%;
      max-width: 400px;
      z-index: 1000;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    }
    
    .item-details-close {
      position: absolute;
      top: 10px;
      right: 10px;
      cursor: pointer;
      font-size: 18px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #333;
    }
    
    .item-details-close:hover {
      background: #444;
    }
    
    .item-details-content {
      margin-bottom: 20px;
    }
    
    .item-details-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    
    .item-details-icon {
      font-size: 36px;
      margin-right: 15px;
      padding: 10px;
      border-radius: 8px;
    }
    
    .item-details-title {
      flex: 1;
    }
    
    .item-details-name {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .item-details-type {
      font-size: 14px;
      color: #888;
    }
    
    .item-details-rarity {
      margin-bottom: 10px;
      font-style: italic;
    }
    
    .item-details-description {
      margin-bottom: 15px;
      line-height: 1.4;
    }
    
    .item-details-stats {
      background: #2a2a2a;
      border-radius: 8px;
      padding: 10px;
      margin-bottom: 15px;
    }
    
    .item-details-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
    }
    
    .item-action-btn {
      background: #333;
      color: #e0e0e0;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .item-action-btn:hover {
      background: #444;
      transform: translateY(-2px);
    }
    
    .item-action-btn.use {
      background: #2a623d;
    }
    
    .item-action-btn.equip {
      background: #2a3d62;
    }
    
    .item-action-btn.unequip {
      background: #623d2a;
    }
    
    .item-comparison {
      background: #2a2a2a;
      border-radius: 8px;
      padding: 10px;
      margin-top: 15px;
    }
    
    .stat-comparison {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    
    .stat-label {
      flex: 1;
    }
    
    .stat-current {
      color: #888;
      margin-right: 10px;
    }
    
    .stat-new {
      text-align: right;
    }
    
    .stat-better {
      color: #4CAF50;
    }
    
    .stat-worse {
      color: #F44336;
    }
    
    /* Common rarity colors */
    .rarity-common { color: #aaaaaa; background-color: rgba(170, 170, 170, 0.1); }
    .rarity-uncommon { color: #00aa00; background-color: rgba(0, 170, 0, 0.1); }
    .rarity-rare { color: #0066ff; background-color: rgba(0, 102, 255, 0.1); }
    .rarity-epic { color: #aa00aa; background-color: rgba(170, 0, 170, 0.1); }
    .rarity-legendary { color: #ff9900; background-color: rgba(255, 153, 0, 0.1); }
    .rarity-unique { color: #aa0000; background-color: rgba(170, 0, 0, 0.1); }
    
    /* Item border colors by rarity */
    .border-common { border: 1px solid #aaaaaa; }
    .border-uncommon { border: 1px solid #00aa00; }
    .border-rare { border: 1px solid #0066ff; }
    .border-epic { border: 1px solid #aa00aa; }
    .border-legendary { border: 1px solid #ff9900; }
    .border-unique { border: 1px solid #aa0000; }
    
    /* Category background colors */
    .category-weapon { background-color: rgba(255, 0, 0, 0.1); }
    .category-armor { background-color: rgba(0, 0, 255, 0.1); }
    .category-accessory { background-color: rgba(255, 0, 255, 0.1); }
    .category-consumable { background-color: rgba(0, 255, 0, 0.1); }
    .category-material { background-color: rgba(255, 255, 0, 0.1); }
    .category-quest { background-color: rgba(0, 255, 255, 0.1); }
    
    /* Add a subtle glow to equipped items */
    .item-equipped {
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
    }
    
    /* Animation for when items are used/equipped */
    @keyframes item-action {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
    
    .item-action-animation {
      animation: item-action 0.5s ease;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
      .inventory-content {
        flex-direction: column;
      }
      
      .equipment-panel {
        flex: none;
        width: 100%;
      }
    }
  `;
  document.head.appendChild(style);
  
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
  const detailsPanel = document.getElementById('item-details-panel');
  const detailsContent = document.getElementById('item-details-content');
  const actionsContainer = document.getElementById('item-details-actions');
  
  // Get the template
  const template = item.getTemplate();
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
      useButton.addEventListener('click', function() {
        window.useItem(item.instanceId);
        detailsPanel.classList.add('hidden');
        window.renderInventoryItems(document.querySelector('.inventory-tab.active').getAttribute('data-category'));
        window.updateEquipmentDisplay();
      });
      actionsContainer.appendChild(useButton);
    }
    
    // Equip button for equipment
    if (template.equipSlot) {
      const equipButton = document.createElement('button');
      equipButton.className = 'item-action-btn equip';
      equipButton.textContent = 'Equip';
      equipButton.addEventListener('click', function() {
        window.equipItem(item.instanceId);
        detailsPanel.classList.add('hidden');
        window.renderInventoryItems(document.querySelector('.inventory-tab.active').getAttribute('data-category'));
        window.updateEquipmentDisplay();
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
    unequipButton.addEventListener('click', function() {
      window.unequipItem(template.equipSlot);
      detailsPanel.classList.add('hidden');
      window.renderInventoryItems(document.querySelector('.inventory-tab.active').getAttribute('data-category'));
      window.updateEquipmentDisplay();
    });
    actionsContainer.appendChild(unequipButton);
  }
  
  // Close button
  const closeButton = document.createElement('button');
  closeButton.className = 'item-action-btn';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', function() {
    detailsPanel.classList.add('hidden');
  });
  actionsContainer.appendChild(closeButton);
  
  // Show the panel
  detailsPanel.classList.remove('hidden');
};

// Update the equipment display in the paperdoll
window.updateEquipmentDisplay = function() {
  console.log("Updating equipment display");
  
  // Map of slot keys to HTML element IDs
  const slotIdMap = {
    'head': 'head-slot',
    'body': 'body-slot',
    'mainHand': 'main-hand-slot',  // Changed from mainHand-slot to main-hand-slot
    'offHand': 'off-hand-slot',    // Changed from offHand-slot to off-hand-slot
    'accessory': 'accessory-slot'
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
  }
  
 // Update each equipment slot
 for (const slot in window.player.equipment) {
  // Use the mapped ID instead of directly constructing it
  const slotElementId = slotIdMap[slot] || `${slot}-slot`;
  const slotElement = document.getElementById(slotElementId);
  
  if (!slotElement) {
    console.warn(`Slot element '${slotElementId}' not found in DOM`);
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
  
  // Also fix slot interaction with the correct IDs
  window.fixEquipmentSlotInteraction = function() {
    // Use the same ID mapping for consistency
    const slotIdMap = {
      'head': 'head-slot',
      'body': 'body-slot',
      'mainHand': 'main-hand-slot',
      'offHand': 'off-hand-slot',
      'accessory': 'accessory-slot'
    };
    
    // Get all equipment slots
    const equipmentSlots = document.querySelectorAll('.equipment-slot');
    
    // Remove any existing click listeners
    equipmentSlots.forEach(slot => {
      const newSlot = slot.cloneNode(true);
      slot.parentNode.replaceChild(newSlot, slot);
      
      // Add new click listener
      newSlot.addEventListener('click', function() {
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
          window.showItemDetails(equippedItem);
        } else {
          console.log("No item in this slot or slot is occupied by two-handed weapon");
        }
      });
    });
  };
  
  // Fix the equipment slot interactions
  window.fixEquipmentSlotInteraction();
};

// Override the inventory button handler in UI.js
document.addEventListener('DOMContentLoaded', function() {
  // Create a new style element for draggable functionality
  const dragStyle = document.createElement('style');
  dragStyle.textContent = `
    .draggable {
      cursor: grab;
    }
    
    .dragging {
      opacity: 0.8;
      cursor: grabbing;
      z-index: 1000;
      position: absolute;
      pointer-events: none;
    }
    
    .drop-target {
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
      transform: scale(1.05);
    }
  `;
  document.head.appendChild(dragStyle);
  
  // Initialize the inventory UI
  window.initializeInventoryUI();
  
  // Override inventory button
  const originalHandleAction = window.handleAction;
  
  window.handleAction = function(action) {
    if (action === 'inventory') {
      // Open inventory and render items
      document.getElementById('inventory').classList.remove('hidden');
      window.renderInventoryItems();
      window.updateEquipmentDisplay();
      return;
    }
    
    // Call the original handler for other actions
    originalHandleAction(action);
  };
});

// Implement drag and drop functionality
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

// Call the drag and drop implementation
document.addEventListener('DOMContentLoaded', function() {
  // Initialize drag and drop after a slight delay to ensure DOM is ready
  setTimeout(window.implementDragAndDrop, 500);
});