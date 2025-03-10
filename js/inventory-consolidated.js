// CONSOLIDATED INVENTORY SYSTEM
// Combines inventory.js, inventory-ui.js, and inventory-fix.js into a single robust system

/**
 * This file consolidates all inventory functionality including:
 * - Core inventory management (previously in inventory.js)
 * - Inventory UI rendering (previously in inventory-ui.js)
 * - Fixes for mount equipment and initialization (previously in inventory-fix.js)
 * 
 * It eliminates timing issues and patches by providing a clear initialization sequence
 * and proper handling of special cases like mounts.
 */

// ================= CORE INVENTORY MANAGEMENT =================

// Item Categories, Equipment Slots, etc. are defined in items.js

// Initialize the inventory system
window.initializeInventorySystem = function() {
  console.log("Initializing inventory system...");
  
  // Initialize inventory if it doesn't exist
  if (!window.player.inventory) {
    window.player.inventory = [];
  }
  
  // Initialize equipment slots based on career
  if (!window.player.equipment) {
    window.player.equipment = {
      head: null,
      body: null,
      mainHand: null,
      offHand: null,
      accessory: null
    };
    
    // Add mount slot only for Castellan Cavalry
    if (window.player.career && (window.player.career.title === "Castellan Cavalry")) {
      window.player.equipment.mount = null;
      console.log("Added mount slot for Castellan Cavalry");
    }
  }
  
  // Initialize currency if it doesn't exist
  if (!window.player.taelors === undefined) {
    window.player.taelors = 25;
  }
  
  // Set inventory capacity
  window.player.inventoryCapacity = 20;
  
  // Initialize inventory stats system
  window.player.equipmentStats = {
    damage: 0,
    defense: 0,
    speed: 0,
    critChance: 0,
    blockChance: 0,
    ranged: 0,
    stealth: 0,
    intimidation: 0,
    charisma: 0,
    command: 0,
    armorPenetration: 0,
    mobility: 0,
    durability: 0
  };
  
  // Update equipment stats
  window.recalculateEquipmentStats();
  
  console.log("Inventory system initialized");
  return true; // Return success for chaining
};

// Add item to inventory
window.addItemToInventory = function(itemTemplate, quantity = 1) {
  if (!itemTemplate) {
    console.error("Cannot add null item template to inventory");
    return false;
  }
  
  // Create a new item instance from the template
  const newItem = window.createItemInstance(itemTemplate, quantity);
  
  // Check if inventory has space
  if (window.player.inventory.length >= window.player.inventoryCapacity) {
    window.showNotification("Your inventory is full!", "warning");
    return false;
  }
  
  // If item is stackable, check if we already have it
  if (itemTemplate.stackable) {
    const existingItem = window.player.inventory.find(item => 
      item.templateId === itemTemplate.id && item.quantity < itemTemplate.maxStack
    );
    
    if (existingItem) {
      // Calculate how many we can add to the stack
      const spaceInStack = itemTemplate.maxStack - existingItem.quantity;
      const amountToAdd = Math.min(spaceInStack, quantity);
      
      existingItem.quantity += amountToAdd;
      
      // If we added all, return success
      if (amountToAdd === quantity) {
        window.showNotification(`Added ${quantity} ${itemTemplate.name} to inventory`, "success");
        return true;
      }
      
      // Otherwise, create a new stack with the remainder
      quantity -= amountToAdd;
    }
  }
  
  // Add the new item to inventory
  window.player.inventory.push(newItem);
  window.showNotification(`Added ${newItem.getName()} to inventory`, "success");
  
  return true;
};

// Remove item from inventory
window.removeItemFromInventory = function(instanceId, quantity = 1) {
  const itemIndex = window.player.inventory.findIndex(item => item.instanceId === instanceId);
  
  if (itemIndex === -1) {
    console.error(`Item with instanceId ${instanceId} not found in inventory`);
    return false;
  }
  
  const item = window.player.inventory[itemIndex];
  
  // If stackable, reduce quantity
  if (item.getTemplate().stackable) {
    if (item.quantity > quantity) {
      item.quantity -= quantity;
      return true;
    }
  }
  
  // Remove the item completely
  window.player.inventory.splice(itemIndex, 1);
  return true;
};

// Use an item from inventory
window.useItem = function(instanceId) {
  const item = window.player.inventory.find(item => item.instanceId === instanceId);
  
  if (!item) {
    console.error(`Item with instanceId ${instanceId} not found in inventory`);
    return false;
  }
  
  // Check if item is usable
  if (!item.getTemplate().usable) {
    window.showNotification(`${item.getName()} is not usable`, "warning");
    return false;
  }
  
  // Use the item
  const success = item.use(window.player);
  
  if (success) {
    // If stackable, decrease quantity
    if (item.getTemplate().stackable) {
      item.quantity--;
      
      // Remove if quantity is 0
      if (item.quantity <= 0) {
        window.removeItemFromInventory(instanceId);
      }
    } else {
      // Non-stackable items are removed after use
      window.removeItemFromInventory(instanceId);
    }
    
    return true;
  }
  
  return false;
};

// Equip an item
window.equipItem = function(instanceId) {
  const item = window.player.inventory.find(item => item.instanceId === instanceId);
  
  if (!item) {
    console.error(`Item with instanceId ${instanceId} not found in inventory`);
    return false;
  }
  
  const template = item.getTemplate();
  
  // Check if item is equippable
  if (!template.equipSlot) {
    window.showNotification(`${item.getName()} cannot be equipped`, "warning");
    return false;
  }
  
  // Check requirements
  if (!item.canEquip(window.player)) {
    window.showNotification(`You don't meet the requirements to equip ${item.getName()}`, "warning");
    return false;
  }
  
  // Handle two-handed weapons
  const isTwoHanded = template.category === window.ITEM_CATEGORIES.WEAPON && 
                       template.hands === 2;
  
  // Remember old items to return to inventory
  let oldItems = [];
  
  // If equipping a two-handed weapon, need to unequip both mainHand and offHand
  if (isTwoHanded) {
    if (window.player.equipment.mainHand) {
      oldItems.push(window.player.equipment.mainHand);
    }
    if (window.player.equipment.offHand && window.player.equipment.offHand !== "occupied") {
      oldItems.push(window.player.equipment.offHand);
    }
    
    // Clear both slots
    window.player.equipment.mainHand = null;
    window.player.equipment.offHand = null;
  } 
  // If equipping to mainHand and we have a two-handed weapon, unequip it
  else if (template.equipSlot === window.EQUIPMENT_SLOTS.MAIN_HAND &&
           window.player.equipment.mainHand &&
           window.player.equipment.mainHand.getTemplate().hands === 2) {
    oldItems.push(window.player.equipment.mainHand);
    window.player.equipment.mainHand = null;
    window.player.equipment.offHand = null;
  }
  // If equipping to offHand and we have a two-handed weapon, unequip it
  else if (template.equipSlot === window.EQUIPMENT_SLOTS.OFF_HAND &&
           window.player.equipment.mainHand &&
           window.player.equipment.mainHand.getTemplate().hands === 2) {
    oldItems.push(window.player.equipment.mainHand);
    window.player.equipment.mainHand = null;
    window.player.equipment.offHand = null;
  }
  // Normal case - just unequip the slot we're equipping to
  else if (window.player.equipment[template.equipSlot]) {
    oldItems.push(window.player.equipment[template.equipSlot]);
    window.player.equipment[template.equipSlot] = null;
  }
  
  // Remove item from inventory
  window.removeItemFromInventory(instanceId);
  
  // Add the old items back to inventory
  oldItems.forEach(oldItem => {
    if (oldItem && oldItem !== "occupied") {
      oldItem.equipped = false;
      window.player.inventory.push(oldItem);
    }
  });
  
  // Equip the new item
  item.equipped = true;
  window.player.equipment[template.equipSlot] = item;
  
  // If two-handed, also mark the off-hand as occupied
  if (isTwoHanded && template.equipSlot === window.EQUIPMENT_SLOTS.MAIN_HAND) {
    window.player.equipment.offHand = "occupied";
  }
  
  // Recalculate equipment stats
  window.recalculateEquipmentStats();
  
  window.showNotification(`Equipped ${item.getName()}`, "success");
  return true;
};

// Unequip an item
window.unequipItem = function(slot) {
  // Check if the slot has an item
  if (!window.player.equipment[slot] || window.player.equipment[slot] === "occupied") {
    return false;
  }
  
  // Check if inventory has space
  if (window.player.inventory.length >= window.player.inventoryCapacity) {
    window.showNotification("Your inventory is full! Cannot unequip.", "warning");
    return false;
  }
  
  const item = window.player.equipment[slot];
  
  // Add item to inventory
  window.player.inventory.push(item);
  
  // Clear the equipment slot
  window.player.equipment[slot] = null;
  item.equipped = false;
  
  // If this was a two-handed weapon, also clear the off-hand "occupied" marker
  if (item.getTemplate().hands === 2 && slot === window.EQUIPMENT_SLOTS.MAIN_HAND) {
    window.player.equipment.offHand = null;
  }
  
  // Recalculate equipment stats
  window.recalculateEquipmentStats();
  
  window.showNotification(`Unequipped ${item.getName()}`, "success");
  return true;
};

// Recalculate all equipment stats
window.recalculateEquipmentStats = function() {
  // Reset all stats
  for (const stat in window.player.equipmentStats) {
    window.player.equipmentStats[stat] = 0;
  }
  
  // Loop through equipped items
  for (const slot in window.player.equipment) {
    const item = window.player.equipment[slot];
    
    // Skip empty slots or "occupied" marker
    if (!item || item === "occupied") continue;
    
    const template = item.getTemplate();
    
    // Add stats from item
    if (template.stats) {
      for (const stat in template.stats) {
        if (window.player.equipmentStats.hasOwnProperty(stat)) {
          window.player.equipmentStats[stat] += template.stats[stat];
        }
      }
    }
  }
  
  // Update derived stats if needed (e.g., total attack power, defense, etc.)
  console.log("Equipment stats recalculated:", window.player.equipmentStats);
};

// Add currency
window.addCurrency = function(amount) {
  window.player.taelors += amount;
  window.showNotification(`Gained ${amount} taelors`, "success");
};

// Remove currency
window.removeCurrency = function(amount) {
  if (window.player.taelors >= amount) {
    window.player.taelors -= amount;
    return true;
  }
  
  window.showNotification("Not enough taelors!", "warning");
  return false;
};

// Get current inventory weight
window.getInventoryWeight = function() {
  let totalWeight = 0;
  
  window.player.inventory.forEach(item => {
    const template = item.getTemplate();
    totalWeight += template.weight * (template.stackable ? item.quantity : 1);
  });
  
  return parseFloat(totalWeight.toFixed(1));
};

// Sort inventory by category, rarity, and name
window.sortInventory = function(criteria = 'category') {
  window.player.inventory.sort((a, b) => {
    const templateA = a.getTemplate();
    const templateB = b.getTemplate();
    
    if (criteria === 'category') {
      // First sort by category
      if (templateA.category !== templateB.category) {
        // Define category sort order
        const categoryOrder = [
          window.ITEM_CATEGORIES.WEAPON,
          window.ITEM_CATEGORIES.ARMOR,
          window.ITEM_CATEGORIES.ACCESSORY,
          window.ITEM_CATEGORIES.CONSUMABLE,
          window.ITEM_CATEGORIES.MATERIAL,
          window.ITEM_CATEGORIES.QUEST
        ];
        
        return categoryOrder.indexOf(templateA.category) - categoryOrder.indexOf(templateB.category);
      }
      
      // Then by rarity (higher rarity first)
      const rarityValueA = templateA.rarity.multiplier;
      const rarityValueB = templateB.rarity.multiplier;
      
      if (rarityValueA !== rarityValueB) {
        return rarityValueB - rarityValueA;
      }
      
      // Finally by name
      return templateA.name.localeCompare(templateB.name);
    } 
    else if (criteria === 'value') {
      // Sort by value (higher first)
      const valueA = templateA.value * templateA.rarity.multiplier;
      const valueB = templateB.value * templateB.rarity.multiplier;
      
      return valueB - valueA;
    }
    else if (criteria === 'name') {
      // Sort alphabetically
      return templateA.name.localeCompare(templateB.name);
    }
    
    return 0;
  });
  
  return window.player.inventory;
};

// Filter inventory by category
window.filterInventory = function(category) {
  if (!category || category === 'all') {
    return window.player.inventory;
  }
  
  return window.player.inventory.filter(item => 
    item.getTemplate().category === category
  );
};

// Get itemTemplate by ID
window.getItemTemplateById = function(templateId) {
  return window.itemTemplates[templateId] || null;
};

// ================= CAREER-SPECIFIC EQUIPMENT =================

// Add starting items based on character career
window.addStartingItems = function() {
  console.log("Adding starting items for career:", window.player.career?.title);
  
  // Make sure player and career exist
  if (!window.player || !window.player.career) {
    console.error("Cannot add starting items - player or career not initialized!");
    return false;
  }
  
  // Make sure item templates are initialized
  if (!window.itemTemplates || Object.keys(window.itemTemplates).length === 0) {
    console.error("Cannot add starting items - item templates not initialized!");
    return false;
  }
  
  try {
    // Add career-specific starting equipment
    switch(window.player.career.title) {
      case "Regular":
      case "Paanic Regular":
        if (window.itemTemplates.basicSword) window.addItemToInventory(window.itemTemplates.basicSword);
        if (window.itemTemplates.legionShield) window.addItemToInventory(window.itemTemplates.legionShield);
        if (window.itemTemplates.legionHelmet) window.addItemToInventory(window.itemTemplates.legionHelmet);
        if (window.itemTemplates.legionArmor) window.addItemToInventory(window.itemTemplates.legionArmor);
        break;
        
      case "Castellan Cavalry":
        if (window.itemTemplates.nobleSword) window.addItemToInventory(window.itemTemplates.nobleSword);
        if (window.itemTemplates.cavalryArmor) window.addItemToInventory(window.itemTemplates.cavalryArmor);
        if (window.itemTemplates.standardWarhorse) window.addItemToInventory(window.itemTemplates.standardWarhorse);
        
        // Ensure mount slot exists
        if (!window.player.equipment.mount) {
          window.player.equipment.mount = null;
        }
        break;
        
      case "Nesian Scout":
        if (window.itemTemplates.matchlockRifle) window.addItemToInventory(window.itemTemplates.matchlockRifle);
        if (window.itemTemplates.scoutArmor) window.addItemToInventory(window.itemTemplates.scoutArmor);
        break;
        
      case "Noble Youth":
      case "Paanic Noble Youth":
        if (window.itemTemplates.nobleSword) window.addItemToInventory(window.itemTemplates.nobleSword);
        if (window.itemTemplates.legionArmor) window.addItemToInventory(window.itemTemplates.legionArmor);
        window.addCurrency(50); // Extra starting money
        break;
        
      case "Wyrdman":
      case "Plains Huntsman":
      case "Berserker":
        if (window.itemTemplates.hunterBow) window.addItemToInventory(window.itemTemplates.hunterBow);
        if (window.itemTemplates.scoutArmor) window.addItemToInventory(window.itemTemplates.scoutArmor);
        break;
        
      default:
        console.log("Using default equipment for career:", window.player.career.title);
        if (window.itemTemplates.basicSword) window.addItemToInventory(window.itemTemplates.basicSword);
        if (window.itemTemplates.legionArmor) window.addItemToInventory(window.itemTemplates.legionArmor);
        break;
    }

    // Everyone gets a health potion
    if (window.itemTemplates.healthPotion) window.addItemToInventory(window.itemTemplates.healthPotion);
    
    console.log("Starting items added successfully");
    return true;
  } catch (error) {
    console.error("Error adding starting items:", error);
    return false;
  }
};

// Auto-equip starting items
window.autoEquipStartingItems = function() {
  console.log("Auto-equipping starting items");
  
  try {
    const career = window.player.career.title;
    
    // Try to find and equip items based on career
    switch(career) {
      case "Regular":
      case "Paanic Regular":
        const basicSword = window.player.inventory.find(i => i.templateId === 'basic_sword');
        if (basicSword) window.equipItem(basicSword.instanceId);
        
        const legionShield = window.player.inventory.find(i => i.templateId === 'legion_shield');
        if (legionShield) window.equipItem(legionShield.instanceId);
        
        const legionHelmet = window.player.inventory.find(i => i.templateId === 'legion_helmet');
        if (legionHelmet) window.equipItem(legionHelmet.instanceId);
        
        const legionArmor = window.player.inventory.find(i => i.templateId === 'legion_armor');
        if (legionArmor) window.equipItem(legionArmor.instanceId);
        break;
        
      case "Castellan Cavalry":
        const nobleSword = window.player.inventory.find(i => i.templateId === 'noble_sword');
        if (nobleSword) window.equipItem(nobleSword.instanceId);
        
        const cavalryArmor = window.player.inventory.find(i => i.templateId === 'cavalry_armor');
        if (cavalryArmor) window.equipItem(cavalryArmor.instanceId);
        
        const standardWarhorse = window.player.inventory.find(i => i.templateId === 'standard_warhorse');
        if (standardWarhorse) window.equipItem(standardWarhorse.instanceId);
        break;
        
      case "Nesian Scout":
        const matchlockRifle = window.player.inventory.find(i => i.templateId === 'matchlock_rifle');
        if (matchlockRifle) window.equipItem(matchlockRifle.instanceId);
        
        const scoutArmor = window.player.inventory.find(i => i.templateId === 'scout_armor');
        if (scoutArmor) window.equipItem(scoutArmor.instanceId);
        break;
        
      case "Noble Youth":
      case "Paanic Noble Youth":
        const youthSword = window.player.inventory.find(i => i.templateId === 'noble_sword');
        if (youthSword) window.equipItem(youthSword.instanceId);
        
        const youthArmor = window.player.inventory.find(i => i.templateId === 'legion_armor');
        if (youthArmor) window.equipItem(youthArmor.instanceId);
        break;
        
      case "Wyrdman":
      case "Plains Huntsman":
      case "Berserker":
        const hunterBow = window.player.inventory.find(i => i.templateId === 'hunter_bow');
        if (hunterBow) window.equipItem(hunterBow.instanceId);
        
        const hunterArmor = window.player.inventory.find(i => i.templateId === 'scout_armor');
        if (hunterArmor) window.equipItem(hunterArmor.instanceId);
        break;
        
      default:
        const defaultSword = window.player.inventory.find(i => i.templateId === 'basic_sword');
        if (defaultSword) window.equipItem(defaultSword.instanceId);
        
        const defaultArmor = window.player.inventory.find(i => i.templateId === 'legion_armor');
        if (defaultArmor) window.equipItem(defaultArmor.instanceId);
        break;
    }
    
    console.log("Auto-equipping complete");
    return true;
  } catch (error) {
    console.error("Error auto-equipping items:", error);
    return false;
  }
};

// ================= INVENTORY UI RENDERING =================

// Initialize inventory UI
window.initializeInventoryUI = function() {
  console.log("Initializing inventory UI...");
  
  // Get the inventory container
  const inventoryContainer = document.getElementById('inventory');
  
  // Check if it exists
  if (!inventoryContainer) {
    console.error("Inventory container not found!");
    return false;
  }
  
  // Check for mount slot requirement
  const isCavalry = window.player?.career?.title === "Castellan Cavalry";
  console.log("Mount slot check - isCavalry:", isCavalry);
  
  // Create the structure for the inventory UI
  inventoryContainer.innerHTML = `
    <h3>Inventory</h3>
    <div class="inventory-header">
      <div class="inventory-currency">
        <span id="currency-display">${window.player.taelors || 0} Taelors</span>
      </div>
      <div class="inventory-capacity">
        <span id="capacity-display">${window.player.inventory?.length || 0}/${window.player.inventoryCapacity || 20}</span>
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
  
  // Add required CSS for mount slot
  window.ensureInventoryStyles();
  
  // Add event listeners
  window.setupInventoryEventListeners();
  
  console.log("Inventory UI initialized");
  return true;
};

// Ensure inventory styles are added
window.ensureInventoryStyles = function() {
  // Check if styles already exist
  if (document.getElementById('inventory-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'inventory-styles';
  style.textContent = `
    .paperdoll.has-mount {
      display: grid;
      grid-template-areas:
        ". head ."
        "mainHand body offHand"
        ". accessory ."
        ". mount .";
      grid-template-columns: 1fr 1fr 1fr;
      gap: 10px;
    }
    
    .mount-slot {
      grid-area: mount;
      background-color: rgba(139, 69, 19, 0.2) !important;
      border: 1px solid #8B4513 !important;
    }
    
    .mount-slot:hover {
      background-color: rgba(139, 69, 19, 0.3) !important;
    }
    
    .category-mount {
      background-color: rgba(139, 69, 19, 0.2) !important;
    }
    
    /* Fix for equipment slots and interaction */
    .equipment-slot[data-slot="head"] { grid-area: head; }
    .equipment-slot[data-slot="body"] { grid-area: body; }
    .equipment-slot[data-slot="mainHand"] { grid-area: mainHand; }
    .equipment-slot[data-slot="offHand"] { grid-area: offHand; }
    .equipment-slot[data-slot="accessory"] { grid-area: accessory; }
    .equipment-slot[data-slot="mount"] { grid-area: mount; }
    
    /* Inventory styling */
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
      grid-template-columns: 1fr 1fr 1fr;
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
};

// Set up inventory event listeners
window.setupInventoryEventListeners = function() {
  // Click handler for close button
  const closeBtn = document.querySelector('.inventory-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      document.getElementById('inventory').classList.add('hidden');
    });
  }
  
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
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', function() {
      const category = document.querySelector('.inventory-tab.active').getAttribute('data-category');
      window.renderInventoryItems(category, this.value);
    });
  }
  
  // Fix equipment slot interaction
  window.fixEquipmentSlotInteraction();
  
  // Close item details panel when clicking the X
  const detailsCloseBtn = document.querySelector('.item-details-close');
  if (detailsCloseBtn) {
    detailsCloseBtn.addEventListener('click', function() {
      document.getElementById('item-details-panel').classList.add('hidden');
    });
  }
};

// Fix equipment slots interaction
window.fixEquipmentSlotInteraction = function() {
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
      const propertyName = slotName;
      
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
      console.log(`Slot element '${slotElementId}' not found in DOM for slot ${slot}. This may be normal if this slot type isn't available for this character.`);
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

// ================= UNIFIED INVENTORY SYSTEM INITIALIZATION =================

// Primary initialization function for the inventory system
window.initializeFullInventorySystem = function() {
  console.log("Initializing full inventory system...");
  
  // Step 1: Make sure item templates are initialized first
  if (!window.itemTemplates || Object.keys(window.itemTemplates).length === 0) {
    window.initializeItemTemplates();
  }
  
  // Step 2: Initialize the inventory data system
  window.initializeInventorySystem();
  
  // Step 3: Initialize the UI
  window.initializeInventoryUI();
  
  // Step 4: Add starting items based on character career
  window.addStartingItems();
  
  // Step 5: Auto-equip items
  window.autoEquipStartingItems();
  
  // Step 6: Update display once everything is ready
  window.renderInventoryItems();
  
  console.log("Full inventory system initialization complete!");
  return true;
};

// Handler function for opening inventory
window.handleInventoryClick = function() {
  console.log("Opening inventory");
  
  // Make sure inventory system is initialized
  if (!window.player.equipment) {
    console.log("Initializing inventory system on first open");
    window.initializeInventorySystem();
  }
  
  // Display the inventory panel
  const inventoryPanel = document.getElementById('inventory');
  inventoryPanel.classList.remove('hidden');
  
  // Ensure inventory UI is initialized
  if (!document.querySelector('.paperdoll')) {
    console.log("Initializing inventory UI on first open");
    window.initializeInventoryUI();
  }
  
  // Render inventory items
  window.renderInventoryItems();
  window.updateEquipmentDisplay();
};

// Game integration - automatically initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, inventory system ready to initialize");
});
