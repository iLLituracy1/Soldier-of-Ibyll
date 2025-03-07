// ROBUST UI FIX
// A single, reliable fix for UI issues with proper timing controls

// Set up global debug mode
window.DEBUG_UI = true;

// Global state management
window.UI_STATE = {
  initialized: false,
  gameStarted: false,
  fixAttempted: false,
  fixesApplied: false,
  elementCheckInterval: null,
  lastUpdate: {
    statusBars: 0,
    timeDisplay: 0,
    actionButtons: 0
  },
  updateDebounceTimeout: null
};

// Log helper with timestamp
function debugLog(...args) {
  if (window.DEBUG_UI) {
    const timestamp = new Date().toISOString().substring(11, 23);
    console.log(`[${timestamp}] UI-FIX:`, ...args);
  }
}

// Debounce function to prevent multiple rapid updates
function debounceUpdate(fn, delay = 100) {
  if (window.UI_STATE.updateDebounceTimeout) {
    clearTimeout(window.UI_STATE.updateDebounceTimeout);
  }
  window.UI_STATE.updateDebounceTimeout = setTimeout(fn, delay);
}

// Wait for DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
  debugLog("DOM loaded, initializing UI fix");
  
  // Only initialize once
  if (!window.UI_STATE.initialized) {
    initializeUIFix();
  }
});

// Main initialization function
function initializeUIFix() {
  debugLog("Initializing Robust UI Fix");
  
  // Prevent multiple initializations
  if (window.UI_STATE.initialized) {
    debugLog("UI Fix already initialized");
    return;
  }
  
  window.UI_STATE.initialized = true;
  
  // Apply CSS fixes
  applyCSS();
  
  // Apply fixes in the correct sequence
  const startupSequence = [
    patchStartAdventureFunction,
    fixButtonConflicts,
    waitForElementsAndApplyFixes
  ];
  
  // Run the sequence
  startupSequence.forEach(step => step());
  
  // Final check after a delay to catch any issues
  setTimeout(verifyUIState, 1000);
  
  debugLog("Robust UI Fix initialized");
}

// Apply CSS fixes
function applyCSS() {
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    /* Fix visibility issues */
    #gameContainer.hidden,
    #creator.hidden {
      display: none !important;
      opacity: 0 !important;
      visibility: hidden !important;
    }
    
    /* Properly hide panels */
    #profile.hidden,
    #inventory.hidden,
    #questLog.hidden,
    #combatInterface.hidden {
      display: none !important;
    }
    
    /* Fix panel layouts */
    #profile, #inventory, #questLog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      max-width: 90vw;
      max-height: 90vh;
      width: 800px;
      overflow: auto;
      z-index: 1000;
      background: #1a1a1a;
      border: 2px solid #c9a959;
      border-radius: 8px;
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
      padding: 20px;
    }
    
    /* Fix panel close buttons */
    .profile-close, .inventory-close, .quest-log-close {
      margin-top: 20px;
    }
    
    /* Ensure buttons are visible */
    .action-btn {
      z-index: 10;
    }
  `;
  document.head.appendChild(styleElement);
  debugLog("Applied CSS fixes");
}

// Patch the startAdventure function
function patchStartAdventureFunction() {
  if (typeof window.startAdventure !== 'function') {
    debugLog("startAdventure function not found, will check again later");
    setTimeout(patchStartAdventureFunction, 500);
    return;
  }
  
  debugLog("Patching startAdventure function");
  
  // Get original function
  const originalStartAdventure = window.startAdventure;
  
  // Replace with our fixed version
  window.startAdventure = function() {
    debugLog("Fixed startAdventure called");
    
    try {
      // Set game started flag
      window.UI_STATE.gameStarted = true;
      
      // Hide character creation
      const creator = document.getElementById('creator');
      if (creator) {
        creator.classList.add('hidden');
        debugLog("Creator hidden");
      } else {
        debugLog("Creator element not found");
      }
      
      // Show game container
      const gameContainer = document.getElementById('gameContainer');
      if (gameContainer) {
        gameContainer.classList.remove('hidden');
        debugLog("Game container shown");
      } else {
        debugLog("Game container element not found");
      }
      
      // Make sure initialization happens first
      if (typeof window.initializeGameState === 'function') {
        window.initializeGameState();
        debugLog("Game state initialized");
      }
      
      // Safely call original function
      try {
        originalStartAdventure();
        debugLog("Original startAdventure executed");
      } catch (error) {
        debugLog("Error in original startAdventure:", error);
        
        // Fallback initialization
        if (typeof window.updateStatusBars === 'function') {
          safeUpdateStatusBars();
        }
        
        if (typeof window.updateTimeAndDay === 'function') {
          safeUpdateTimeAndDay(0);
        }
        
        if (typeof window.updateActionButtons === 'function') {
          safeUpdateActionButtons();
        }
      }
      
      // Ensure all panels are hidden
      ['profile', 'inventory', 'questLog', 'combatInterface'].forEach(id => {
        const panel = document.getElementById(id);
        if (panel) panel.classList.add('hidden');
      });
      
      // Force check for enhancements after a slight delay
      setTimeout(waitForElementsAndApplyFixes, 200);
    } catch (error) {
      debugLog("Critical error in fixed startAdventure:", error);
      alert("An error occurred starting the game. Please refresh the page.");
    }
  };
  
  debugLog("startAdventure function patched");
}

// Safe version of status bar update function
function safeUpdateStatusBars() {
  // Prevent too frequent updates
  const now = Date.now();
  if (now - window.UI_STATE.lastUpdate.statusBars < 50) {
    return;
  }
  window.UI_STATE.lastUpdate.statusBars = now;

  try {
    // Get elements first to avoid null reference
    const healthBar = document.getElementById('sidebarHealthBar');
    const staminaBar = document.getElementById('sidebarStaminaBar');
    const moraleBar = document.getElementById('sidebarMoraleBar');
    const healthValue = document.getElementById('sidebarHealthValue');
    const staminaValue = document.getElementById('sidebarStaminaValue');
    const moraleValue = document.getElementById('sidebarMoraleValue');
    
    // Check game state
    if (!window.gameState) {
      debugLog("Game state not initialized for status bars");
      return;
    }
    
    // Update if elements exist using debounce
    debounceUpdate(() => {
      if (healthBar && healthValue) {
        healthBar.style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
        healthValue.textContent = `${Math.round(window.gameState.health)}/${window.gameState.maxHealth}`;
      }
      
      if (staminaBar && staminaValue) {
        staminaBar.style.width = `${(window.gameState.stamina / window.gameState.maxStamina) * 100}%`;
        staminaValue.textContent = `${Math.round(window.gameState.stamina)}/${window.gameState.maxStamina}`;
      }
      
      if (moraleBar && moraleValue) {
        moraleBar.style.width = `${window.gameState.morale}%`;
        moraleValue.textContent = `${Math.round(window.gameState.morale)}/100`;
      }
      
      debugLog("Status bars safely updated");
    });
  } catch (error) {
    debugLog("Error in safe status bar update:", error);
  }
}

// Safe version of time update
function safeUpdateTimeAndDay(minutesToAdd) {
  try {
    // Update game time if it exists
    if (typeof window.gameTime !== 'undefined') {
      window.gameTime += minutesToAdd;
      
      // Check for day change
      if (typeof window.gameDay !== 'undefined') {
        while (window.gameTime >= 1440) {
          window.gameTime -= 1440;
          window.gameDay++;
        }
      }
    }
    
    // Format time
    const hours = Math.floor(window.gameTime / 60);
    const minutes = window.gameTime % 60;
    const ampm = hours < 12 ? 'AM' : 'PM';
    const displayHours = hours % 12 || 12;
    
    // Update UI elements if they exist
    const timeDisplay = document.getElementById('timeDisplay');
    if (timeDisplay) {
      timeDisplay.textContent = `Time: ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    const dayDisplay = document.getElementById('dayDisplay');
    if (dayDisplay) {
      dayDisplay.textContent = `Day ${window.gameDay}`;
    }
    
    // Update indicator if it exists
    const dayNightIndicator = document.getElementById('dayNightIndicator');
    if (dayNightIndicator && typeof window.getTimeOfDay === 'function') {
      const timeOfDay = window.getTimeOfDay();
      dayNightIndicator.className = 'day-night-indicator time-' + timeOfDay;
    }
    
    debugLog("Time and day safely updated");
  } catch (error) {
    debugLog("Error in safe time update:", error);
  }
}

// Safe version of action buttons update
function safeUpdateActionButtons() {
  try {
    const actionsContainer = document.getElementById('actions');
    if (!actionsContainer) {
      debugLog("Actions container not found");
      return;
    }
    
    // Clear existing buttons
    actionsContainer.innerHTML = '';
    
    // Add basic actions that are always safe
    if (typeof window.addActionButton === 'function') {
      // Get current actions from gameState
      const actions = window.gameState?.actions || [];
      
      // Filter out UI panel actions that are now in sidebar
      const sidebarActions = ['profile', 'inventory', 'questLog'];
      const gameActions = actions.filter(action => !sidebarActions.includes(action.action));
      
      // Add remaining game actions
      gameActions.forEach(action => {
        window.addActionButton(action.label, action.action, actionsContainer);
      });
      
      // If no actions available, add basic actions
      if (gameActions.length === 0) {
        // Rest is always available
        window.addActionButton('Rest', 'rest', actionsContainer);
        
        // Basic activity buttons based on time of day
        const timeOfDay = typeof window.getTimeOfDay === 'function' ? window.getTimeOfDay() : 'day';
        
        if (timeOfDay === 'day' || timeOfDay === 'dawn') {
          window.addActionButton('Train', 'train', actionsContainer);
        }
      }
    }
    
    debugLog("Action buttons safely updated");
  } catch (error) {
    debugLog("Error in safe action buttons update:", error);
  }
}

// Fix button conflicts
function fixButtonConflicts() {
  if (typeof window.handleAction !== 'function') {
    debugLog("handleAction function not found, will check again later");
    setTimeout(fixButtonConflicts, 500);
    return;
  }
  
  debugLog("Fixing button conflicts");
  
  // Get original function
  const originalHandleAction = window.handleAction;
  
  // Replace with fixed version
  window.handleAction = function(action) {
    debugLog(`Handling action: ${action}`);
    
    // Special handling for UI panels
    if (action === 'profile' || action === 'inventory' || action === 'questLog') {
      const panelId = action;
      const panel = document.getElementById(panelId);
      
      if (panel) {
        // Hide other panels first
        ['profile', 'inventory', 'questLog'].forEach(id => {
          const otherPanel = document.getElementById(id);
          if (otherPanel && id !== panelId) {
            otherPanel.classList.add('hidden');
          }
        });
        
        // Toggle this panel
        if (panel.classList.contains('hidden')) {
          panel.classList.remove('hidden');
          
          // Special handling for inventory
          if (action === 'inventory') {
            try {
              if (typeof window.renderInventoryItems === 'function') {
                window.renderInventoryItems();
                debugLog("Inventory items rendered");
              }
            } catch (error) {
              debugLog("Error rendering inventory:", error);
            }
          }
        } else {
          panel.classList.add('hidden');
        }
        
        debugLog(`Panel ${panelId} toggled`);
        return;
      }
    }
    
    // For other actions, call original handler
    return originalHandleAction(action);
  };
  
  debugLog("Button conflicts fixed");
}

// Wait for elements and apply fixes
function waitForElementsAndApplyFixes() {
  // Skip if fixes already applied completely
  if (window.UI_STATE.fixesApplied === true) {
    debugLog("Fixes already applied, skipping");
    return;
  }

  // Clear any existing interval first
  if (window.UI_STATE.elementCheckInterval) {
    clearInterval(window.UI_STATE.elementCheckInterval);
    window.UI_STATE.elementCheckInterval = null;
  }
  
  debugLog("Starting to look for elements to fix");
  
  // Set up interval to check for elements
  window.UI_STATE.elementCheckInterval = setInterval(() => {
    const gameContainer = document.getElementById('gameContainer');
    const narrative = document.getElementById('narrative');
    const actions = document.getElementById('actions');
    
    // Check if we have the main elements
    if (gameContainer && narrative && actions && !gameContainer.classList.contains('hidden')) {
      // Clear interval immediately to prevent multiple calls
      clearInterval(window.UI_STATE.elementCheckInterval);
      window.UI_STATE.elementCheckInterval = null;
      
      debugLog("Key elements found, applying fixes");
      
      // Ensure status bars exist
      ensureStatusBars();
      
      // Ensure time display elements exist
      ensureTimeDisplay();
      
      // Ensure panels have close buttons
      ensurePanelCloseButtons();
      
      // Update UI state
      if (typeof window.updateStatusBars === 'function') {
        safeUpdateStatusBars();
      }
      
      if (typeof window.updateTimeAndDay === 'function') {
        safeUpdateTimeAndDay(0);
      }
      
      if (typeof window.updateActionButtons === 'function') {
        safeUpdateActionButtons();
      }
      
      // Mark fixes as applied to prevent future attempts
      window.UI_STATE.fixAttempted = true;
      window.UI_STATE.fixesApplied = true;
      debugLog("Fixes successfully applied - COMPLETED");
    } else if (window.UI_STATE.gameStarted && !window.UI_STATE.fixAttempted) {
      debugLog("Game started but elements not found yet, still waiting");
    }
  }, 200);
  
  // Safety timeout after 10 seconds
  setTimeout(() => {
    if (window.UI_STATE.elementCheckInterval) {
      clearInterval(window.UI_STATE.elementCheckInterval);
      window.UI_STATE.elementCheckInterval = null;
      debugLog("Element check timed out");
    }
  }, 10000);
}

// Ensure status bars exist
function ensureStatusBars() {
  // Check if status bars container exists
  let statusBars = document.querySelector('.status-bars');
  
  if (!statusBars) {
    debugLog("Creating missing status bars");
    
    // Create status bars container
    statusBars = document.createElement('div');
    statusBars.className = 'status-bars';
    
    // Create HTML structure
    statusBars.innerHTML = `
      <div class="status-bar">
        <div class="status-label">Health</div>
        <div class="bar-container">
          <div id="healthBar" class="bar health-bar" style="width: 100%;"></div>
        </div>
        <div id="healthValue" class="bar-value">100/100</div>
      </div>
      <div class="status-bar">
        <div class="status-label">Stamina</div>
        <div class="bar-container">
          <div id="staminaBar" class="bar stamina-bar" style="width: 100%;"></div>
        </div>
        <div id="staminaValue" class="bar-value">100/100</div>
      </div>
      <div class="status-bar">
        <div class="status-label">Morale</div>
        <div class="bar-container">
          <div id="moraleBar" class="bar morale-bar" style="width: 75%;"></div>
        </div>
        <div id="moraleValue" class="bar-value">75/100</div>
      </div>
    `;
    
    // Add to game container before narrative
    const gameContainer = document.getElementById('gameContainer');
    const narrative = document.getElementById('narrative');
    
    if (gameContainer && narrative) {
      gameContainer.insertBefore(statusBars, narrative);
      debugLog("Status bars created and added");
    }
  }
}

// Ensure time display elements exist
function ensureTimeDisplay() {
  const header = document.querySelector('header');
  if (!header) {
    debugLog("Header not found, cannot create time display");
    return;
  }
  
  // Check for time display elements
  if (!document.getElementById('timeDisplay')) {
    const timeDisplay = document.createElement('div');
    timeDisplay.id = 'timeDisplay';
    timeDisplay.textContent = 'Time: 8:00 AM';
    header.appendChild(timeDisplay);
    debugLog("Created timeDisplay element");
  }
  
  if (!document.getElementById('dayDisplay')) {
    const dayDisplay = document.createElement('div');
    dayDisplay.id = 'dayDisplay';
    dayDisplay.textContent = 'Day 1';
    header.appendChild(dayDisplay);
    debugLog("Created dayDisplay element");
  }
  
  if (!document.getElementById('dayNightIndicator')) {
    const indicator = document.createElement('div');
    indicator.id = 'dayNightIndicator';
    indicator.className = 'day-night-indicator time-day';
    header.appendChild(indicator);
    debugLog("Created dayNightIndicator element");
  }
}

// Ensure panels have close buttons
function ensurePanelCloseButtons() {
  const panels = ['profile', 'inventory', 'questLog'];
  
  panels.forEach(panelId => {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    
    // Check for close button
    let closeButton = panel.querySelector(`.${panelId}-close`);
    
    if (!closeButton) {
      closeButton = document.createElement('button');
      closeButton.className = `menu-button ${panelId}-close`;
      closeButton.textContent = 'Close';
      
      // Add close handler
      closeButton.addEventListener('click', () => {
        panel.classList.add('hidden');
      });
      
      panel.appendChild(closeButton);
      debugLog(`Added close button to ${panelId} panel`);
    }
  });
}

// Final verification of UI state
function verifyUIState() {
  debugLog("Verifying UI state");
  
  // If game hasn't started yet, nothing to verify
  if (!window.UI_STATE.gameStarted) {
    debugLog("Game not started yet, skipping verification");
    return;
  }
  
  // Check character creation is hidden
  const creator = document.getElementById('creator');
  if (creator && !creator.classList.contains('hidden')) {
    creator.classList.add('hidden');
    debugLog("Fixed: Creator was still visible");
  }
  
  // Check game container is visible
  const gameContainer = document.getElementById('gameContainer');
  if (gameContainer && gameContainer.classList.contains('hidden')) {
    gameContainer.classList.remove('hidden');
    debugLog("Fixed: Game container was hidden");
  }
  
  // Check for missing UI elements
  if (!document.querySelector('.status-bars')) {
    debugLog("Status bars still missing in final check");
    ensureStatusBars();
  }
  
  // Force update action buttons
  if (typeof window.updateActionButtons === 'function') {
    safeUpdateActionButtons();
  }
  
  debugLog("UI state verification complete");
}

// Fix for inventory UI
(function fixInventoryUI() {
  // Wait for the inventory functions to exist
  const checkInventoryFunctions = setInterval(() => {
    if (typeof window.initializeInventoryUI === 'function' && 
        typeof window.renderInventoryItems === 'function') {
      
      clearInterval(checkInventoryFunctions);
      debugLog("Found inventory functions, applying fixes");
      
      // Patch initializeInventoryUI
      const originalInitUI = window.initializeInventoryUI;
      window.initializeInventoryUI = function() {
        debugLog("Safe initializeInventoryUI called");
        
        try {
          // Get inventory container first
          const inventoryContainer = document.getElementById('inventory');
          if (!inventoryContainer) {
            debugLog("Inventory container not found, creating it");
            createEmergencyInventoryUI();
          }
          
          // Now call original safely
          originalInitUI();
        } catch (error) {
          debugLog("Error in inventory UI initialization:", error);
          createEmergencyInventoryUI();
        }
      };
      
      // Patch renderInventoryItems
      const originalRenderItems = window.renderInventoryItems;
      window.renderInventoryItems = function(categoryFilter, sortBy) {
        debugLog("Safe renderInventoryItems called");
        
        try {
          // Check if items grid exists
          const itemsGrid = document.getElementById('items-grid');
          if (!itemsGrid) {
            debugLog("Items grid not found, recreating inventory UI");
            createEmergencyInventoryUI();
            return;
          }
          
          // Ensure player inventory exists
          if (!window.player || !window.player.inventory) {
            debugLog("Player inventory not initialized");
            window.player = window.player || {};
            window.player.inventory = [];
            window.player.taelors = window.player.taelors || 0;
          }
          
          // Call original function
          originalRenderItems(categoryFilter, sortBy);
        } catch (error) {
          debugLog("Error rendering inventory items:", error);
          createEmergencyInventoryUI();
        }
      };
      
      debugLog("Inventory UI functions patched");
    }
  }, 500);
  
  // Safety timeout after 10 seconds
  setTimeout(() => {
    clearInterval(checkInventoryFunctions);
  }, 10000);
})();

// Create emergency inventory UI
function createEmergencyInventoryUI() {
  debugLog("Creating emergency inventory UI");
  
  // Look for inventory container
  let inventoryContainer = document.getElementById('inventory');
  
  // Create if not found
  if (!inventoryContainer) {
    inventoryContainer = document.createElement('div');
    inventoryContainer.id = 'inventory';
    inventoryContainer.className = 'hidden';
    document.body.appendChild(inventoryContainer);
  }
  
  // Check if player is cavalry for mount slot
  const isCavalry = window.player && window.player.career && 
                    window.player.career.title === "Castellan Cavalry";
  
  // Set up full structure matching inventory-ui.js
  inventoryContainer.innerHTML = `
    <h3>Inventory</h3>
    <div class="inventory-header">
      <div class="inventory-currency">
        <span id="currency-display">${window.player?.taelors || 0} Taelors</span>
      </div>
      <div class="inventory-capacity">
        <span id="capacity-display">0/${window.player?.inventoryCapacity || 20}</span>
      </div>
    </div>
    
    <div class="inventory-tabs">
      <button class="inventory-tab active" data-category="all">All</button>
      <button class="inventory-tab" data-category="weapon">Weapons</button>
      <button class="inventory-tab" data-category="armor">Armor</button>
      <button class="inventory-tab" data-category="consumable">Consumables</button>
      <button class="inventory-tab" data-category="material">Materials</button>
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
  
  debugLog("Emergency inventory UI created with full structure");
}

// Override the original update functions to use our safe versions
function overrideUpdateFunctions() {
  if (typeof window.updateStatusBars === 'function') {
    window.originalUpdateStatusBars = window.updateStatusBars;
    window.updateStatusBars = safeUpdateStatusBars;
  }
  
  if (typeof window.updateTimeAndDay === 'function') {
    window.originalUpdateTimeAndDay = window.updateTimeAndDay;
    window.updateTimeAndDay = safeUpdateTimeAndDay;
  }
  
  if (typeof window.updateActionButtons === 'function') {
    window.originalUpdateActionButtons = window.updateActionButtons;
    window.updateActionButtons = safeUpdateActionButtons;
  }
  
  debugLog("Update functions safely overridden");
}

// Run the UI fix
initializeUIFix();
