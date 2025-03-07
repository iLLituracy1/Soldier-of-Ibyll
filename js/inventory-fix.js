// This script adds proper initialization to the inventory system

// Ensure we have a central initialization function for the game
window.gameBootstrap = function() {
  console.log("Game bootstrap process starting...");
  
  // Initialize item templates if not already done
  if (!window.itemTemplates || Object.keys(window.itemTemplates).length === 0) {
    window.initializeItemTemplates();
  }
  
  // Initialize player state if needed
  if (!window.player) {
    window.player = {
      inventory: [],
      equipment: {
        head: null,
        body: null,
        mainHand: null,
        offHand: null,
        accessory: null
      },
      inventoryCapacity: 20,
      taelors: 25
    };
  }

  // Initialize equipment stats if needed
  if (!window.player.equipmentStats) {
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
  }
  
  // Run a safer version of starter items
  window.safeAddStartingItems = function() {
    console.log("Safe add starting items function called");
    
    // Check item templates are available
    if (!window.itemTemplates || Object.keys(window.itemTemplates).length === 0) {
      console.error("Cannot add items - item templates not initialized!");
      return false;
    }
    
    // Check player and career
    if (!window.player || !window.player.career) {
      console.error("Cannot add items - player or career not initialized!");
      return false;
    }
    
    // Log current career
    console.log("Adding items for career:", window.player.career.title);
    
    // Add career-specific starting equipment
    try {
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
          
          // Ensure mount slot exists in equipment
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
          // Default equipment
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
  
  // Override the original startAdventure function
  const originalStartFn = window.startAdventure;
  window.startAdventure = function() {
    console.log("Modified startAdventure called");
    
    // First call original
    if (typeof originalStartFn === 'function') {
      originalStartFn();
    } else {
      console.error("Original startAdventure not found!");
    }
    
    // Initialize inventory system
    window.initializeFullInventorySystem();
    
    // Add starting items with a slight delay to ensure state is initialized
    setTimeout(function() {
      window.safeAddStartingItems();
      
      // Update UI to show items
      if (typeof window.renderInventoryItems === 'function') {
        window.renderInventoryItems();
      }
      
      // Update equipment display
      if (typeof window.updateEquipmentDisplay === 'function') {
        window.updateEquipmentDisplay();
      }
    }, 100);
  };
  
  // Initialize inventory system
  window.initializeFullInventorySystem();
  
  console.log("Game bootstrap complete");
};

// Run bootstrap when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  window.gameBootstrap();
});
