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
  
  // Phase 2: Initialize UI elements
  if (typeof window.initializeUIFix === 'function') {
    console.log("Initializing UI elements");
    window.initializeUIFix();
  }
  
  // Phase 3: Wait for DOM and UI elements to be ready before setting up event handlers
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Small delay to ensure UI elements are created
      setTimeout(setupEventHandlers, 100);
    });
  } else {
    // Small delay to ensure UI elements are created
    setTimeout(setupEventHandlers, 100);
  }
  
  console.log("Game initialization sequence started");
};

// Function to set up all event listeners
function setupEventHandlers() {
  console.log("Setting up event handlers...");
  
  // Helper function to safely add event listener
  function safeAddEventListener(id, event, handler) {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener(event, handler);
      console.log(`Event listener added for ${id}`);
    } else {
      console.warn(`Element with id '${id}' not found for event listener`);
    }
  }

  // Helper function to safely add event listener by selector
  function safeAddEventListenerBySelector(selector, event, handler) {
    const element = document.querySelector(selector);
    if (element) {
      element.addEventListener(event, handler);
      console.log(`Event listener added for ${selector}`);
    } else {
      console.warn(`Element with selector '${selector}' not found for event listener`);
    }
  }
  
  // Set up event listeners for character creation buttons
  safeAddEventListener('paanic-button', 'click', () => window.selectOrigin('Paanic'));
  safeAddEventListener('nesian-button', 'click', () => window.selectOrigin('Nesian'));
  safeAddEventListener('lunarine-button', 'click', () => window.selectOrigin('Lunarine'));
  safeAddEventListener('wyrdman-button', 'click', () => window.selectOrigin('Wyrdman'));
  
  safeAddEventListener('back-to-intro-button', 'click', window.backToIntro);
  safeAddEventListener('back-to-origin-button', 'click', window.backToOrigin);
  safeAddEventListener('confirm-name-button', 'click', window.setName);
  safeAddEventListener('back-to-name-button', 'click', window.backToName);
  safeAddEventListener('confirm-character-button', 'click', window.confirmCharacter);
  safeAddEventListener('continue-to-empire-button', 'click', window.showEmpireUpdate);
  
  // MODIFIED: Properly handle the startAdventure button to ensure inventory items
  safeAddEventListener('start-adventure-button', 'click', window.startGameAdventure);
  
  // Add event listeners for panel close buttons - with safety checks
  const panels = ['profile', 'inventory', 'questLog'];
  panels.forEach(panelId => {
    // Try both class naming conventions for maximum compatibility
    const closeSelectors = [
      `.${panelId}-close`,
      `.${panelId.toLowerCase()}-close`,
      `#${panelId} .close-button`
    ];
    
    let buttonFound = false;
    closeSelectors.forEach(selector => {
      const closeButton = document.querySelector(selector);
      if (closeButton && !buttonFound) {
        closeButton.addEventListener('click', function() {
          const panel = document.getElementById(panelId);
          if (panel) {
            panel.classList.add('hidden');
          }
        });
        console.log(`Event listener added for ${selector}`);
        buttonFound = true;
      }
    });
    
    if (!buttonFound) {
      console.warn(`No close button found for ${panelId} panel`);
    }
  });
  
  console.log("Event handlers setup complete");
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
  
  // Phase 5: Ensure UI elements exist before updating
  if (typeof window.ensureStatusBars === 'function') {
    console.log("Ensuring status bars exist");
    window.ensureStatusBars();
  }
  
  // Phase 6: Update UI with a small delay to ensure elements are created
  setTimeout(() => {
    console.log("Updating UI elements");
    if (typeof window.updateStatusBars === 'function') {
      window.updateStatusBars();
    }
    if (typeof window.updateTimeAndDay === 'function') {
      window.updateTimeAndDay(0); // Start at the initial time
    }
    if (typeof window.updateActionButtons === 'function') {
      window.updateActionButtons();
    }
  }, 100);
  
  // Phase 7: Set initial narrative
  window.setNarrative(`${window.player.name}, a ${window.player.career.title} of ${window.player.origin} heritage, the road has been long. Nearly a season has passed since you departed the heartlands of Paan'eun, the distant spires of Cennen giving way to the endless hinterlands of the empire. Through the great riverlands and the mountain passes, across the dust-choked roads of the interior, and finally westward into the feudalscape of the Hierarchate, you have traveled. Each step has carried you further from home, deeper into the shadow of war.<br><br>
  Now, you stand at the edge of your Kasvaari's Camp, the flickering lanterns and distant clang of the forges marking the heartbeat of an army in preparation. Here, amidst the hardened warriors and the banners of noble Charters, you are no longer a traveler—you are a soldier, bound to duty, drawn by the call of empire.<br><br>
  The Western Hierarchate is a land of towering fortresses and ancient battlefields, a realm where the scars of past campaigns linger in the earth itself. The Arrasi Peninsula lies beyond the western horizon, its crystalline plains an enigma even to those who have fought there before. Soon, you will march upon those lands, crossing the vast Wall of Nesia, where the empire's dominion falters against the unknown.<br><br>
  For now, your place is here, among your kin and comrades, within the Kasvaari's Camp, where the scent of oiled steel and the murmur of hushed war councils fill the air. What will you do first?`);

  // Phase 8: Update inventory panel if needed
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

// Initialize game when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initializeGame);
} else {
  window.initializeGame();
}
