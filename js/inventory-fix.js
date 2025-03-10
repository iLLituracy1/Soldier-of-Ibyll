// This script adds proper initialization to the inventory system

// Ensure we have a central initialization function for the game
window.gameBootstrap = function() {
  console.log("Game bootstrap process starting...");
  
  // Initialize item templates if not already done
  if (!window.itemTemplates || Object.keys(window.itemTemplates).length === 0) {
    window.initializeItemTemplates();
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
          console.log("Using default equipment for career:", window.player.career.title);
          if (window.itemTemplates.basicSword) window.addItemToInventory(window.itemTemplates.basicSword);
          if (window.itemTemplates.legionArmor) window.addItemToInventory(window.itemTemplates.legionArmor);
          break;
      }
      
      // Everyone gets a health potion
      if (window.itemTemplates.healthPotion) window.addItemToInventory(window.itemTemplates.healthPotion);
      
      // Log inventory state
      console.log("Starting items added. Current inventory:", window.player.inventory.length, "items");
      console.log("Equipment state:", window.player.equipment);
      
      return true;
    } catch (err) {
      console.error("Error adding starting items:", err);
      return false;
    }
  };
  
  // Override startAdventure safely
  const originalStartFn = window.startAdventure;
  window.startAdventure = function() {
    console.log("Modified startAdventure called");
    // First call original
    if (typeof originalStartFn === 'function') {
      originalStartFn();
    } else {
      console.error("Original startAdventure not found!");
    }
    
    // Make sure inventory UI is properly initialized
    if (typeof window.initializeInventoryUI === 'function') {
      window.initializeInventoryUI();
    }
    
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
      
      // Auto-equip items after a delay
      setTimeout(function() {
        try {
          const basicSword = window.player.inventory.find(i => i.templateId === 'basic_sword');
          if (basicSword) window.equipItem(basicSword.instanceId);
          
          const legionShield = window.player.inventory.find(i => i.templateId === 'legion_shield');
          if (legionShield) window.equipItem(legionShield.instanceId);
          
          const legionHelmet = window.player.inventory.find(i => i.templateId === 'legion_helmet');
          if (legionHelmet) window.equipItem(legionHelmet.instanceId);
          
          const legionArmor = window.player.inventory.find(i => i.templateId === 'legion_armor');
          if (legionArmor) window.equipItem(legionArmor.instanceId);
          
          const standardWarhorse = window.player.inventory.find(i => i.templateId === 'standard_warhorse');
          if (standardWarhorse && window.player.career && window.player.career.title === "Castellan Cavalry") {
            window.equipItem(standardWarhorse.instanceId);
          }
          
          console.log("Starting equipment equipped");
        } catch (err) {
          console.error("Error auto-equipping items:", err);
        }
      }, 200);
    }, 100);
  };
  
  // Fix inventory UI initialization to properly handle mounts
  const originalInitInventoryUI = window.initializeInventoryUI;
  window.initializeInventoryUI = function() {
    console.log("Enhanced inventory UI initialization");
    
    // Call original initialization
    if (typeof originalInitInventoryUI === 'function') {
      originalInitInventoryUI();
    }
    
    // Add mount slot check with proper debug info
    const isCavalry = window.player && window.player.career && 
                      window.player.career.title === "Castellan Cavalry";
    
    console.log("Mount slot check - isCavalry:", isCavalry);
    console.log("Current career:", window.player && window.player.career ? 
                window.player.career.title : "Not set");
    
    // Force mount slot for cavalry
    if (isCavalry) {
      console.log("Adding mount slot for cavalry character");
      
      // Ensure equipment has mount slot
      if (window.player.equipment && !window.player.equipment.mount) {
        window.player.equipment.mount = null;
        console.log("Added mount slot to equipment object");
      }
      
      // Add mount slot to paperdoll if it doesn't exist
      const paperdoll = document.querySelector('.paperdoll');
      if (paperdoll && !document.getElementById('mount-slot')) {
        paperdoll.classList.add('has-mount');
        
        const mountSlot = document.createElement('div');
        mountSlot.className = 'equipment-slot mount-slot';
        mountSlot.id = 'mount-slot';
        mountSlot.setAttribute('data-slot', 'mount');
        
        mountSlot.innerHTML = `
          <div class="slot-icon">🐎</div>
          <div class="slot-name">Mount</div>
        `;
        
        paperdoll.appendChild(mountSlot);
        console.log("Mount slot added to paperdoll UI");
        
        // Update slot interaction
        if (typeof window.fixEquipmentSlotInteraction === 'function') {
          window.fixEquipmentSlotInteraction();
        }
      }
    }
  };
  
  console.log("Game bootstrap complete!");
};

// Execute the bootstrap when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, running game bootstrap");
  setTimeout(window.gameBootstrap, 500);
});
