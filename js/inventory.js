// INVENTORY SYSTEM MODULE
// Manages player inventory, equipment, and currency

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
      accessory: null,
      ammunition: null // Explicitly initialize ammunition slot
    };
    
    // Add mount slot only for Castellan Cavalry
    if (window.player.career && (window.player.career.title === "Castellan Cavalry")) {
      window.player.equipment.mount = null;
      console.log("Added mount slot for Castellan Cavalry");
    }
  }
  
  // Ensure ammunition slot exists
  if (window.player.equipment && !window.player.equipment.hasOwnProperty('ammunition')) {
    window.player.equipment.ammunition = null;
    console.log("Added missing ammunition slot");
  }
  
  // Initialize currency if it doesn't exist
  if (!window.player.taelors) {
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
  
  // Initialize ammunition system if needed
  if (typeof window.initializeAmmunition === 'function') {
    window.initializeAmmunition();
  }
  
  console.log("Inventory system initialized");
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
    if (window.player.equipment.offHand) {
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
    window.player.inventory.push(oldItem);
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
  if (!category) {
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

// FIX 2: Improved career-specific starting equipment with ammunition
window.addStartingItems = function() {
  console.log("Adding starting items function called");
  
  // Only run if the player object and career exist
  if (!window.player || !window.player.career) {
    console.error("Cannot add starting items - player or career is not initialized!");
    return;
  }
  
  console.log("Adding starting equipment for career:", window.player.career.title);
  
  // Add career-specific starting equipment
  switch(window.player.career.title) {
    case "Regular":
    case "Paanic Regular":
      window.addItemToInventory(window.itemTemplates.basicSword);
      window.addItemToInventory(window.itemTemplates.legionShield);
      window.addItemToInventory(window.itemTemplates.legionHelmet);
      window.addItemToInventory(window.itemTemplates.legionArmor);
      
      // Auto-equip items - with slight delay to ensure inventory updates
      setTimeout(() => {
        try {
          const basicSword = window.player.inventory.find(i => i.templateId === 'basic_sword');
          if (basicSword) window.equipItem(basicSword.instanceId);
          
          const legionShield = window.player.inventory.find(i => i.templateId === 'legion_shield');
          if (legionShield) window.equipItem(legionShield.instanceId);
          
          const legionHelmet = window.player.inventory.find(i => i.templateId === 'legion_helmet');
          if (legionHelmet) window.equipItem(legionHelmet.instanceId);
          
          const legionArmor = window.player.inventory.find(i => i.templateId === 'legion_armor');
          if (legionArmor) window.equipItem(legionArmor.instanceId);
        } catch (err) {
          console.error("Error equipping Regular items:", err);
        }
      }, 100);
      break;
      
    case "Castellan Cavalry":
      window.addItemToInventory(window.itemTemplates.nobleSword);
      window.addItemToInventory(window.itemTemplates.cavalryArmor);
      window.addItemToInventory(window.itemTemplates.standardWarhorse);
      
      // Make sure we have a mount slot
      if (!window.player.equipment.mount) {
        window.player.equipment.mount = null;
        console.log("Added mount equipment slot for Cavalry character");
      }
      
      // Auto-equip items
      setTimeout(() => {
        try {
          const nobleSword = window.player.inventory.find(i => i.templateId === 'noble_sword');
          if (nobleSword) window.equipItem(nobleSword.instanceId);
          
          const cavalryArmor = window.player.inventory.find(i => i.templateId === 'cavalry_armor');
          if (cavalryArmor) window.equipItem(cavalryArmor.instanceId);
          
          const standardWarhorse = window.player.inventory.find(i => i.templateId === 'standard_warhorse');
          if (standardWarhorse) window.equipItem(standardWarhorse.instanceId);
        } catch (err) {
          console.error("Error equipping Cavalry items:", err);
        }
      }, 100);
      break;
    
    case "Scout":
    case "Nesian Scout":
      // Add appropriate equipment for a scout with ranged weapon
      console.log("Adding Nesian Scout starting equipment...");
      
      // Verify templates exist
      if (!window.itemTemplates.matchlockRifle) {
        console.error("Matchlock rifle template missing!");
        return;
      }
      if (!window.itemTemplates.scoutArmor) {
        console.error("Scout armor template missing!");
        return;
      }
      if (!window.itemTemplates.cartridgePouch) {
        console.error("Cartridge pouch template missing!");
        return;
      }
      
      // Add items with error checking
      if (!window.addItemToInventory(window.itemTemplates.matchlockRifle)) {
        console.error("Failed to add matchlock rifle");
        return;
      }
      if (!window.addItemToInventory(window.itemTemplates.scoutArmor)) {
        console.error("Failed to add scout armor");
        return;
      }
      if (!window.addItemToInventory(window.itemTemplates.cartridgePouch)) {
        console.error("Failed to add cartridge pouch");
        return;
      }
      
      console.log("Successfully added all Nesian Scout items to inventory");
      
      // Auto-equip items with better error handling
      setTimeout(() => {
        try {
          const matchlockRifle = window.player.inventory.find(i => i.templateId === 'matchlock_rifle');
          if (matchlockRifle) {
            console.log("Found matchlock rifle, attempting to equip...");
            window.equipItem(matchlockRifle.instanceId);
          } else {
            console.error("Could not find matchlock rifle in inventory");
          }
          
          const scoutArmor = window.player.inventory.find(i => i.templateId === 'scout_armor');
          if (scoutArmor) {
            console.log("Found scout armor, attempting to equip...");
            window.equipItem(scoutArmor.instanceId);
          } else {
            console.error("Could not find scout armor in inventory");
          }
          
          const cartridgePouch = window.player.inventory.find(i => i.templateId === 'cartridge_pouch');
          if (cartridgePouch) {
            console.log("Found cartridge pouch, attempting to equip...");
            window.equipItem(cartridgePouch.instanceId);
          } else {
            console.error("Could not find cartridge pouch in inventory");
          }
          
          // Verify equipment after equipping
          console.log("Final equipment state:", window.player.equipment);
        } catch (err) {
          console.error("Error equipping Nesian Scout items:", err);
        }
      }, 100);
      break;
      
    case "Noble Youth":
    case "Paanic Noble Youth":
      window.addItemToInventory(window.itemTemplates.nobleSword);
      window.addItemToInventory(window.itemTemplates.legionArmor);
      window.addCurrency(50); // Extra starting money
      
      // Auto-equip items
      setTimeout(() => {
        try {
          const nobleSword = window.player.inventory.find(i => i.templateId === 'noble_sword');
          if (nobleSword) window.equipItem(nobleSword.instanceId);
          
          const legionArmor = window.player.inventory.find(i => i.templateId === 'legion_armor');
          if (legionArmor) window.equipItem(legionArmor.instanceId);
        } catch (err) {
          console.error("Error equipping Noble Youth items:", err);
        }
      }, 100);
      break;
      
    case "Plains Huntsman":
      // Hunter with a bow - makes thematic sense
      window.addItemToInventory(window.itemTemplates.hunterBow);
      window.addItemToInventory(window.itemTemplates.scoutArmor);
      window.addItemToInventory(window.itemTemplates.quiver); // Add ammunition
      
      // Auto-equip items
      setTimeout(() => {
        try {
          const hunterBow = window.player.inventory.find(i => i.templateId === 'hunter_bow');
          if (hunterBow) window.equipItem(hunterBow.instanceId);
          
          const scoutArmor = window.player.inventory.find(i => i.templateId === 'scout_armor');
          if (scoutArmor) window.equipItem(scoutArmor.instanceId);
          
          const quiver = window.player.inventory.find(i => i.templateId === 'quiver');
          if (quiver) window.equipItem(quiver.instanceId);
        } catch (err) {
          console.error("Error equipping Huntsman items:", err);
        }
      }, 100);
      break;
      
    case "Berserker":
      // Berserker should have an axe, not a bow!
      // Using basic_axe template if available, or could fall back to sword
      if (window.itemTemplates.battleaxe) {
        window.addItemToInventory(window.itemTemplates.battleaxe);
      } else {
        // Create a basic axe if it doesn't exist
        window.itemTemplates.basicAxe = window.createWeapon({
          id: 'basic_axe',
          name: 'Wyrd Battleaxe',
          description: 'A brutal axe favored by Wyrdman berserkers. Ideal for cleaving through enemies in a rage.',
          weaponType: window.WEAPON_TYPES.BATTLEAXE,
          damage: 15,
          value: 40,
          stats: {
            damage: 15,
            speed: -5,
            critChance: 10
          },
          maxDurability: 180
        });
        window.addItemToInventory(window.itemTemplates.basicAxe);
      }
      window.addItemToInventory(window.itemTemplates.scoutArmor);
      
      // Auto-equip items
      setTimeout(() => {
        try {
          const axe = window.player.inventory.find(i => 
            i.templateId === 'basic_axe' || i.templateId === 'battleaxe');
          if (axe) window.equipItem(axe.instanceId);
          
          const scoutArmor = window.player.inventory.find(i => i.templateId === 'scout_armor');
          if (scoutArmor) window.equipItem(scoutArmor.instanceId);
        } catch (err) {
          console.error("Error equipping Berserker items:", err);
        }
      }, 100);
      break;
      
    case "Wyrdman":
      // Default Wyrdman gets simpler equipment
      window.addItemToInventory(window.itemTemplates.basicSword);
      window.addItemToInventory(window.itemTemplates.scoutArmor);
      
      // Auto-equip items
      setTimeout(() => {
        try {
          const basicSword = window.player.inventory.find(i => i.templateId === 'basic_sword');
          if (basicSword) window.equipItem(basicSword.instanceId);
          
          const scoutArmor = window.player.inventory.find(i => i.templateId === 'scout_armor');
          if (scoutArmor) window.equipItem(scoutArmor.instanceId);
        } catch (err) {
          console.error("Error equipping Wyrdman items:", err);
        }
      }, 100);
      break;
      
    case "Marauder":
      // Create a one-handed axe if it doesn't exist
      if (!window.itemTemplates.oneHandedAxe) {
        window.itemTemplates.oneHandedAxe = window.createWeapon({
          id: 'one_handed_axe',
          name: 'Wyrd Raider Axe',
          description: 'A vicious single-handed axe favored by Wyrdman raiders. Balanced for both combat and throwing.',
          weaponType: window.WEAPON_TYPES.AXE, // One-handed axe
          damage: 12,
          value: 35,
          stats: {
            damage: 12,
            speed: 0,
            critChance: 7
          },
          maxDurability: 185
        });
      }
      
      // Add equipment for Marauder: One-handed axe, shield, javelin pack
      window.addItemToInventory(window.itemTemplates.oneHandedAxe);
      window.addItemToInventory(window.itemTemplates.legionShield); // Using legion shield or create a specific one
      window.addItemToInventory(window.itemTemplates.scoutArmor); // Light armor fitting for a raider
      window.addItemToInventory(window.itemTemplates.javelinPack); // Throwing javelins
      
      // Auto-equip items
      setTimeout(() => {
        try {
          const oneHandedAxe = window.player.inventory.find(i => i.templateId === 'one_handed_axe');
          if (oneHandedAxe) window.equipItem(oneHandedAxe.instanceId);
          
          const legionShield = window.player.inventory.find(i => i.templateId === 'legion_shield');
          if (legionShield) window.equipItem(legionShield.instanceId);
          
          const scoutArmor = window.player.inventory.find(i => i.templateId === 'scout_armor');
          if (scoutArmor) window.equipItem(scoutArmor.instanceId);
          
          const javelinPack = window.player.inventory.find(i => i.templateId === 'javelin_pack');
          if (javelinPack) window.equipItem(javelinPack.instanceId);
        } catch (err) {
          console.error("Error equipping Marauder items:", err);
        }
      }, 100);
      break;

    case "Lunarine Marine":
    case "Marine":
      // Add equipment for Marine: Paanic Sword, Shield, and javelin pack
      window.addItemToInventory(window.itemTemplates.basicSword); // Paanic Military Sword
      window.addItemToInventory(window.itemTemplates.buckler); // Marine Buckler
      window.addItemToInventory(window.itemTemplates.legionArmor); // Standard armor
      window.addItemToInventory(window.itemTemplates.javelinPack); // Throwing javelins
      
      // Auto-equip items
      setTimeout(() => {
        try {
          const basicSword = window.player.inventory.find(i => i.templateId === 'basic_sword');
          if (basicSword) window.equipItem(basicSword.instanceId);
          
          const legionShield = window.player.inventory.find(i => i.templateId === 'buckler');
          if (legionShield) window.equipItem(legionShield.instanceId);
          
          const legionArmor = window.player.inventory.find(i => i.templateId === 'legion_armor');
          if (legionArmor) window.equipItem(legionArmor.instanceId);
          
          const javelinPack = window.player.inventory.find(i => i.templateId === 'javelin_pack');
          if (javelinPack) window.equipItem(javelinPack.instanceId);
        } catch (err) {
          console.error("Error equipping Marine items:", err);
        }
      }, 100);
      break;
      
    default:
      // Default equipment
      window.addItemToInventory(window.itemTemplates.basicSword);
      window.addItemToInventory(window.itemTemplates.legionArmor);
      
      // Auto-equip items
      setTimeout(() => {
        try {
          const basicSword = window.player.inventory.find(i => i.templateId === 'basic_sword');
          if (basicSword) window.equipItem(basicSword.instanceId);
          
          const legionArmor = window.player.inventory.find(i => i.templateId === 'legion_armor');
          if (legionArmor) window.equipItem(legionArmor.instanceId);
        } catch (err) {
          console.error("Error equipping default items:", err);
        }
      }, 100);
      break;
  }

  // Everyone gets a health potion
  window.addItemToInventory(window.itemTemplates.healthPotion);

  console.log("Starting items added. Player inventory:", window.player.inventory);
};

// Helper function to ensure proper item equipping
window.forceEquipItem = function(templateId) {
  try {
    const item = window.player.inventory.find(i => i.templateId === templateId);
    if (item) {
      console.log(`Force equipping ${templateId}:`, item);
      return window.equipItem(item.instanceId);
    } else {
      console.warn(`Cannot find item ${templateId} in inventory`);
      return false;
    }
  } catch (err) {
    console.error(`Error force equipping ${templateId}:`, err);
    return false;
  }
};

// Improved ammunition initialization - ensures ammunition objects have proper values
window.initializeAmmunition = function() {
  console.log("Initializing ammunition system...");
  
  // Make sure all ammunition items have proper values
  if (window.itemTemplates) {
    Object.values(window.itemTemplates).forEach(template => {
      if (template.category === window.ITEM_CATEGORIES.AMMUNITION) {
        // Ensure these values are set
        if (template.capacity === undefined) template.capacity = 20;
        if (template.ammoType === undefined) template.ammoType = "arrow";
        console.log(`Verified ammunition template: ${template.name}, capacity: ${template.capacity}`);
      }
    });
  }
  
  // Fix existing ammunition in inventory
  if (window.player && window.player.inventory) {
    window.player.inventory.forEach(item => {
      if (item.getTemplate && item.getTemplate().category === window.ITEM_CATEGORIES.AMMUNITION) {
        // Fix null values
        if (item.capacity === null) item.capacity = item.getTemplate().capacity || 20;
        if (item.currentAmount === null) item.currentAmount = item.capacity;
        console.log(`Fixed ammunition item: ${item.getName()}, amount: ${item.currentAmount}/${item.capacity}`);
      }
    });
  }
  
  // Fix equipped ammunition
  if (window.player && window.player.equipment && window.player.equipment.ammunition) {
    const ammo = window.player.equipment.ammunition;
    if (ammo && ammo !== "occupied" && ammo.getTemplate) {
      // Fix null values
      if (ammo.capacity === null) ammo.capacity = ammo.getTemplate().capacity || 20;
      if (ammo.currentAmount === null) ammo.currentAmount = ammo.capacity;
      console.log(`Fixed equipped ammunition: ${ammo.getName()}, amount: ${ammo.currentAmount}/${ammo.capacity}`);
    }
  }
};

// Enhanced ammunition compatibility check
window.checkWeaponAmmoCompatibility = function() {
  // Get equipped weapon and ammo
  const weapon = window.player.equipment?.mainHand;
  const ammo = window.player.equipment?.ammunition;
  
  if (!weapon || !ammo || ammo === "occupied") return false;
  
  const weaponTemplate = weapon.getTemplate();
  const ammoTemplate = ammo.getTemplate();
  
  // Get weapon type and ammo type
  const weaponType = weaponTemplate.weaponType?.name;
  const ammoType = ammoTemplate.ammoType;
  
  // If ammo has explicit compatibility list, use that
  if (ammo.compatibleWeapons && ammo.compatibleWeapons.length > 0) {
    return ammo.compatibleWeapons.includes(weaponTemplate.id);
  }
  
  // Default compatibility rules
  if (weaponType === "Bow" && ammoType === "arrow") return true;
  if (weaponType === "Crossbow" && ammoType === "bolt") return true;
  if (weaponType === "Rifle" && ammoType === "shot") return true;
  if (weaponType === "Thrown" && ammoType === "javelin") return true;
  
  return false;
};

// Fix thrown weapons functionality
window.initializeThrownWeapons = function() {
  console.log("Initializing thrown weapons system...");
  
  // Check if we have throwing javelins defined
  if (!window.itemTemplates.throwingJavelin) {
    // Create throwing javelin template if missing
    window.itemTemplates.throwingJavelin = window.createWeapon({
      id: 'throwing_javelin',
      name: 'Throwing Javelin',
      description: 'A lightweight spear designed to be thrown at enemies from a distance.',
      weaponType: window.WEAPON_TYPES.THROWN,
      rarity: window.ITEM_RARITIES.COMMON,
      damage: 10,
      value: 15,
      stats: {
        damage: 10,
        range: 2,
        armorPenetration: 10
      },
      maxDurability: 50
    });
    
    console.log("Created throwing javelin template");
  }
  
  // Check if javelin pack exists
  if (!window.itemTemplates.javelinPack) {
    window.itemTemplates.javelinPack = window.createAmmunition({
      id: 'javelin_pack',
      name: 'Javelin Pack',
      description: 'A harness designed to carry up to 6 throwing javelins.',
      ammoType: 'javelin',
      capacity: 6,
      symbol: '🔱',
      value: 30,
      compatibleWeapons: ['throwing_javelin']
    });
    
    console.log("Created javelin pack template");
  }
  
  // Make sure WEAPON_TYPES.THROWN has proper range
  if (window.WEAPON_TYPES.THROWN && !window.WEAPON_TYPES.THROWN.range) {
    window.WEAPON_TYPES.THROWN.range = 2;
    console.log("Fixed THROWN weapon type range");
  }
};

// Create a global initialization function for the entire inventory system
window.initializeFullInventorySystem = function() {
  console.log("Initializing full inventory system...");
  
  // Make sure item templates are initialized first
  if (!window.itemTemplates || Object.keys(window.itemTemplates).length === 0) {
    window.initializeItemTemplates();
  }
  
  // Initialize the inventory system
  window.initializeInventorySystem();
  
  // Initialize ammunition and thrown weapons systems
  window.initializeAmmunition();
  window.initializeThrownWeapons();
  
  // Initialize the UI
  if (typeof window.initializeInventoryUI === 'function') {
    window.initializeInventoryUI();
  }
  
  console.log("Full inventory system initialized!");
};

// Attach initialization to window load
window.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, inventory system ready");
});