// MAIN ENTRY POINT
// This is the main entry point that initializes the game and sets up event listeners

// Game initialization sequence
window.initializeGame = function() {
  console.log("Game initializing...");
  
  // Phase 1: Initialize item system first
  if (!window.itemTemplates || Object.keys(window.itemTemplates).length === 0) {
    console.log("Initializing item templates");
    window.initializeItemTemplates();
  }
  
  // Phase 2: Set up event handlers
  setupEventHandlers();
  
  console.log("Game initialized and ready to play!");
};

// Function to set up all event listeners
function setupEventHandlers() {
  // Set up event listeners for character creation buttons
  document.getElementById('paanic-button').addEventListener('click', function() {
    window.selectOrigin('Paanic');
  });
  
  document.getElementById('nesian-button').addEventListener('click', function() {
    window.selectOrigin('Nesian');
  });
  
  document.getElementById('lunarine-button').addEventListener('click', function() {
    window.selectOrigin('Lunarine');
  });
  
  document.getElementById('wyrdman-button').addEventListener('click', function() {
    window.selectOrigin('Wyrdman');
  });
  
  document.getElementById('back-to-intro-button').addEventListener('click', window.backToIntro);
  document.getElementById('back-to-origin-button').addEventListener('click', window.backToOrigin);
  document.getElementById('confirm-name-button').addEventListener('click', window.setName);
  document.getElementById('back-to-name-button').addEventListener('click', window.backToName);
  document.getElementById('confirm-character-button').addEventListener('click', window.confirmCharacter);
  document.getElementById('continue-to-empire-button').addEventListener('click', window.showEmpireUpdate);
  
  // MODIFIED: Properly handle the startAdventure button to ensure inventory items
  document.getElementById('start-adventure-button').addEventListener('click', function() {
    window.startGameAdventure();
  });
  
  // Add event listeners for panel close buttons
  document.querySelector('.profile-close').addEventListener('click', function() {
    document.getElementById('profile').classList.add('hidden');
  });
  
  document.querySelector('.inventory-close').addEventListener('click', function() {
    document.getElementById('inventory').classList.add('hidden');
  });
  
  document.querySelector('.quest-log-close').addEventListener('click', function() {
    document.getElementById('questLog').classList.add('hidden');
  });
  
  console.log("Event handlers set up");
}

// ADDED: Improved startAdventure function with proper inventory integration
window.startGameAdventure = function() {
  console.log("Starting game adventure");
  
  // Phase 1: Original startAdventure functionality
  // Hide character creation, show game container
  document.getElementById('creator').classList.add('hidden');
  document.getElementById('gameContainer').classList.remove('hidden');
  
  // Phase 2: Initialize game state
  window.initializeGameState();
  
  // Phase 3: Set up inventory system
  console.log("Initializing inventory system");
  window.initializeInventorySystem();
  window.initializeInventoryUI();
  
  // Phase 4: Add starting items based on career
  console.log(`Adding starting items for ${window.player.career.title}`);
  window.addStartingItems();
  
  // Verify inventory has items
  console.log(`Player inventory now has ${window.player.inventory.length} items`);
  
  // Phase 5: Update UI
  window.updateStatusBars();
  window.updateTimeAndDay(0); // Start at the initial time
  window.updateActionButtons();
  
  // Phase 6: Set initial narrative
  window.setNarrative(`${window.player.name}, a ${window.player.career.title} of ${window.player.origin} heritage, the road has been long. Nearly a season has passed since you departed the heartlands of Paan'eun, the distant spires of Cennen giving way to the endless hinterlands of the empire. Through the great riverlands and the mountain passes, across the dust-choked roads of the interior, and finally westward into the feudalscape of the Hierarchate, you have traveled. Each step has carried you further from home, deeper into the shadow of war.<br><br>
  Now, you stand at the edge of your Kasvaari's Camp, the flickering lanterns and distant clang of the forges marking the heartbeat of an army in preparation. Here, amidst the hardened warriors and the banners of noble Charters, you are no longer a traveler—you are a soldier, bound to duty, drawn by the call of empire.<br><br>
  The Western Hierarchate is a land of towering fortresses and ancient battlefields, a realm where the scars of past campaigns linger in the earth itself. The Arrasi Peninsula lies beyond the western horizon, its crystalline plains an enigma even to those who have fought there before. Soon, you will march upon those lands, crossing the vast Wall of Nesia, where the empire's dominion falters against the unknown.<br><br>
  For now, your place is here, among your kin and comrades, within the Kasvaari's Camp, where the scent of oiled steel and the murmur of hushed war councils fill the air. What will you do first?`);

  // Phase 7: Update inventory panel if needed
  if (!document.getElementById('inventory').classList.contains('hidden')) {
    console.log("Updating inventory display");
    window.renderInventoryItems();
    window.updateEquipmentDisplay();
  }
  
  console.log("Game adventure started successfully");
};

// Handle inventory button click - fixed version
window.handleInventoryClick = function() {
  console.log("Opening inventory");
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

// Override the inventory action handler
window.originalHandleAction = window.handleAction;
window.handleAction = function(action) {
  if (action === 'inventory') {
    window.handleInventoryClick();
    return;
  }
  
  // Call the original handler for other actions
  return window.originalHandleAction(action);
};

// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  window.initializeGame();
});
