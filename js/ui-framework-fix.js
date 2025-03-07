// UI FRAMEWORK FIX
// Provides a complete overhaul of UI initialization and transition handling

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("UI Framework Fix initializing...");
  
  // Only run once
  if (!window.uiFrameworkFixed) {
    window.uiFrameworkFixed = true;
    fixUIFramework();
  }
});

// Main fix function
function fixUIFramework() {
  // 1. Fix game initialization sequence
  patchGameInit();
  
  // 2. Fix UI transitions
  patchUITransitions();
  
  // 3. Fix button conflicts
  resolveButtonConflicts();
  
  // 4. Ensure proper element visibility
  fixElementVisibility();
  
  console.log("UI Framework Fix applied");
}

// Fix the game initialization sequence
function patchGameInit() {
  if (typeof window.initializeGame === 'function') {
    const originalInitGame = window.initializeGame;
    
    window.initializeGame = function() {
      console.log("Running patched game initialization");
      
      // Run original init
      originalInitGame();
      
      // Add missing initialization steps
      ensureUICleanup();
      
      console.log("Patched game initialization complete");
    };
    
    console.log("Game initialization patched");
  }
}

// Fix transitions between character creation and game
function patchUITransitions() {
  // First fix startAdventure - the transition from char creation to game
  if (typeof window.startAdventure === 'function') {
    const originalStartAdventure = window.startAdventure;
    
    window.startAdventure = function() {
      console.log("Running patched startAdventure");
      
      // Ensure clean UI state before transition
      cleanupBeforeTransition();
      
      // Run original function
      originalStartAdventure();
      
      // Additional post-transition cleanup
      setTimeout(fixPostTransitionState, 100);
      
      console.log("Patched startAdventure complete");
    };
    
    console.log("startAdventure patched");
  }
  
  // Then fix startGameAdventure - the main implementation function
  if (typeof window.startGameAdventure === 'function') {
    const originalStartGameAdventure = window.startGameAdventure;
    
    window.startGameAdventure = function() {
      console.log("Running patched startGameAdventure");
      
      // Store current visibility states
      const creatorVisible = !document.getElementById('creator').classList.contains('hidden');
      const gameContainerVisible = !document.getElementById('gameContainer').classList.contains('hidden');
      
      console.log(`Before transition - Creator visible: ${creatorVisible}, Game container visible: ${gameContainerVisible}`);
      
      // Clean up any existing UI to prevent duplicates
      ensureUICleanup();
      
      try {
        // Call original function but catch any errors
        originalStartGameAdventure();
      } catch (error) {
        console.error("Error in original startGameAdventure:", error);
        // Fallback manual implementation
        manualStartGameImplementation();
      }
      
      // Double-check visibility states
      setTimeout(() => {
        const creatorVisibleAfter = !document.getElementById('creator').classList.contains('hidden');
        const gameContainerVisibleAfter = !document.getElementById('gameContainer').classList.contains('hidden');
        
        console.log(`After transition - Creator visible: ${creatorVisibleAfter}, Game container visible: ${gameContainerVisibleAfter}`);
        
        // Force correct visibility if needed
        if (creatorVisibleAfter) {
          document.getElementById('creator').classList.add('hidden');
          console.log("Forced creator to be hidden");
        }
        
        if (!gameContainerVisibleAfter) {
          document.getElementById('gameContainer').classList.remove('hidden');
          console.log("Forced game container to be visible");
        }
        
        // Ensure sidebar is properly set up
        enhanceGameContainerSafely();
        
        // Initialize status bars one final time
        if (typeof window.updateStatusBars === 'function') {
          window.updateStatusBars();
        }
        
        // Update action buttons
        if (typeof window.updateActionButtons === 'function') {
          window.updateActionButtons();
        }
      }, 200);
      
      console.log("Patched startGameAdventure complete");
    };
    
    console.log("startGameAdventure patched");
  }
}

// Manual implementation for game transition as fallback
function manualStartGameImplementation() {
  console.log("Using manual game start implementation");
  
  // 1. Hide character creator
  document.getElementById('creator').classList.add('hidden');
  
  // 2. Show game container
  document.getElementById('gameContainer').classList.remove('hidden');
  
  // 3. Initialize game state
  if (typeof window.initializeGameState === 'function') {
    window.initializeGameState();
  }
  
  // 4. Initialize inventory system
  if (typeof window.initializeInventorySystem === 'function') {
    window.initializeInventorySystem();
  }
  
  // 5. Update UI elements
  if (typeof window.updateStatusBars === 'function') {
    window.updateStatusBars();
  }
  
  if (typeof window.updateTimeAndDay === 'function') {
    window.updateTimeAndDay(0);
  }
  
  // 6. Set initial narrative
  if (typeof window.setNarrative === 'function' && window.player) {
    let narrativeText = "Your journey begins...";
    
    if (window.player.name && window.player.career && window.player.origin) {
      narrativeText = `${window.player.name}, a ${window.player.career.title} of ${window.player.origin} heritage, the road has been long...`;
    }
    
    window.setNarrative(narrativeText);
  }
  
  // 7. Update action buttons
  if (typeof window.updateActionButtons === 'function') {
    window.updateActionButtons();
  }
}

// Clean up UI elements before transition
function cleanupBeforeTransition() {
  console.log("Cleaning up UI before transition");
  
  // Remove any duplicate status bars
  const mainStatusBars = document.querySelectorAll('.status-bars:not(:first-child)');
  mainStatusBars.forEach(bar => {
    if (bar && bar.parentNode) {
      bar.parentNode.removeChild(bar);
    }
  });
  
  // Clear any enhanced container elements
  const existingSidebar = document.querySelector('.game-sidebar');
  if (existingSidebar && existingSidebar.parentNode) {
    existingSidebar.parentNode.removeChild(existingSidebar);
  }
  
  const existingMainContent = document.querySelector('.game-main');
  if (existingMainContent && existingMainContent.parentNode) {
    existingMainContent.parentNode.removeChild(existingMainContent);
  }
}

// Fix remaining UI issues after transition
function fixPostTransitionState() {
  console.log("Fixing post-transition state");
  
  // Ensure character creator is hidden
  const creator = document.getElementById('creator');
  if (creator && !creator.classList.contains('hidden')) {
    creator.classList.add('hidden');
  }
  
  // Ensure game container is visible
  const gameContainer = document.getElementById('gameContainer');
  if (gameContainer && gameContainer.classList.contains('hidden')) {
    gameContainer.classList.remove('hidden');
  }
  
  // Apply enhanced UI
  enhanceGameContainerSafely();
}

// Resolve conflicts with duplicate buttons
function resolveButtonConflicts() {
  console.log("Resolving button conflicts");
  
  // Patch handleAction function to deduplicate button behavior
  if (typeof window.handleAction === 'function') {
    const originalHandleAction = window.handleAction;
    
    window.handleAction = function(action) {
      console.log(`Handling action: ${action} (patched)`);
      
      // Special handling for profile, inventory, and questLog
      if (action === 'profile' || action === 'inventory' || action === 'questLog') {
        // Find the target panel
        const panelId = action === 'profile' ? 'profile' : 
                        action === 'inventory' ? 'inventory' : 'questLog';
        
        const panel = document.getElementById(panelId);
        
        if (panel) {
          // Toggle visibility
          if (panel.classList.contains('hidden')) {
            // Hide other panels first
            ['profile', 'inventory', 'questLog'].forEach(id => {
              const p = document.getElementById(id);
              if (p && !p.classList.contains('hidden')) {
                p.classList.add('hidden');
              }
            });
            
            // Show this panel
            panel.classList.remove('hidden');
            
            // Additional panel-specific initialization
            if (action === 'inventory' && typeof window.renderInventoryItems === 'function') {
              window.renderInventoryItems();
            }
          } else {
            // Hide this panel if it's already visible
            panel.classList.add('hidden');
          }
          
          return;
        }
      }
      
      // For other actions, call the original handler
      return originalHandleAction(action);
    };
    
    console.log("handleAction patched");
  }
  
  // Override updateActionButtons to prevent duplicate buttons
  if (typeof window.updateActionButtons === 'function') {
    const originalUpdateActionButtons = window.updateActionButtons;
    
    window.updateActionButtons = function() {
      console.log("Updating action buttons (patched)");
      
      // Clear the actions container first
      const actionsContainer = document.getElementById('actions');
      if (actionsContainer) {
        actionsContainer.innerHTML = '';
      }
      
      // Call original function
      originalUpdateActionButtons();
      
      // Remove duplicate panel buttons if they exist in sidebar
      if (document.querySelector('.sidebar-nav')) {
        const actionBtns = actionsContainer.querySelectorAll('[data-action]');
        actionBtns.forEach(btn => {
          const action = btn.getAttribute('data-action');
          if (action === 'profile' || action === 'inventory' || action === 'questLog') {
            btn.parentNode.removeChild(btn);
          }
        });
      }
    };
    
    console.log("updateActionButtons patched");
  }
}

// Fix visibility of UI elements
function fixElementVisibility() {
  console.log("Fixing element visibility");
  
  // Find all UI panels
  const panels = ['profile', 'inventory', 'questLog'];
  
  // Add close buttons to panels if missing
  panels.forEach(panelId => {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    
    // Get or create close button
    let closeBtn = panel.querySelector(`.${panelId}-close`);
    
    if (!closeBtn) {
      closeBtn = document.createElement('button');
      closeBtn.className = `menu-button ${panelId}-close`;
      closeBtn.textContent = 'Close';
      panel.appendChild(closeBtn);
    }
    
    // Ensure close button has event listener
    closeBtn.addEventListener('click', function() {
      panel.classList.add('hidden');
    });
  });
}

// Safer version of enhanceGameContainer
function enhanceGameContainerSafely() {
  console.log("Enhancing game container safely");
  
  // Check if game container exists
  const gameContainer = document.getElementById('gameContainer');
  if (!gameContainer) {
    console.error("Game container not found");
    return;
  }
  
  // Check if already enhanced
  if (gameContainer.querySelector('.game-sidebar') && gameContainer.querySelector('.game-main')) {
    console.log("Game container already enhanced");
    return;
  }
  
  // Verify player data
  if (!window.player || !window.player.name || !window.player.origin || 
      !window.player.career || !window.player.career.title) {
    console.error("Player data not fully initialized - cannot enhance container");
    return;
  }
  
  console.log("Creating enhanced container layout");
  
  // Create sidebar
  const sidebar = document.createElement('div');
  sidebar.className = 'game-sidebar';
  
  // Create character summary for sidebar
  sidebar.innerHTML = `
    <div class="character-summary">
      <div class="character-name">${window.player.name}</div>
      <div class="character-details">${window.player.origin} ${window.player.career.title}</div>
    </div>
    
    <div class="quick-status">
      <div class="status-bar">
        <div class="status-label">Health</div>
        <div class="bar-container">
          <div id="sidebarHealthBar" class="bar health-bar" style="width: 100%;"></div>
        </div>
        <div id="sidebarHealthValue" class="bar-value">100/100</div>
      </div>
      <div class="status-bar">
        <div class="status-label">Stamina</div>
        <div class="bar-container">
          <div id="sidebarStaminaBar" class="bar stamina-bar" style="width: 100%;"></div>
        </div>
        <div id="sidebarStaminaValue" class="bar-value">100/100</div>
      </div>
      <div class="status-bar">
        <div class="status-label">Morale</div>
        <div class="bar-container">
          <div id="sidebarMoraleBar" class="bar morale-bar" style="width: 75%;"></div>
        </div>
        <div id="sidebarMoraleValue" class="bar-value">75/100</div>
      </div>
    </div>
    
    <div class="sidebar-nav">
      <button class="sidebar-nav-button" data-action="profile">
        <span class="nav-icon">👤</span> Profile
      </button>
      <button class="sidebar-nav-button" data-action="inventory">
        <span class="nav-icon">🎒</span> Inventory
      </button>
      <button class="sidebar-nav-button" data-action="questLog">
        <span class="nav-icon">📜</span> Quest Log
      </button>
    </div>
  `;
  
  // Create main content container
  const mainContent = document.createElement('div');
  mainContent.className = 'game-main';
  
  // Save original elements to move
  const header = gameContainer.querySelector('header');
  const narrative = document.getElementById('narrative');
  const actions = document.getElementById('actions');
  const statusBars = document.querySelector('.status-bars');
  
  // Remove old status bars - we'll use the sidebar ones instead
  if (statusBars && statusBars.parentNode) {
    statusBars.parentNode.removeChild(statusBars);
  }
  
  // Clear game container
  gameContainer.innerHTML = '';
  
  // Add header back
  if (header) {
    gameContainer.appendChild(header);
  } else {
    console.warn("Header not found, creating a new one");
    const newHeader = document.createElement('header');
    newHeader.innerHTML = `
      <h1>Kasvaari Camp</h1>
      <div id="location">Location: Kasvaari Camp, somewhere in the Western Hierarchate of Nesia</div>
      <div class="day-night-indicator" id="dayNightIndicator"></div>
      <div id="timeDisplay">Time: 8:00 AM</div>
      <div id="dayDisplay">Day 1</div>
    `;
    gameContainer.appendChild(newHeader);
  }
  
  // Add new structure
  gameContainer.appendChild(sidebar);
  gameContainer.appendChild(mainContent);
  
  // Add narrative and actions back to main content
  if (narrative && actions) {
    const narrativeContainer = document.createElement('div');
    narrativeContainer.className = 'narrative-container';
    
    // Create wrapper for actions
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'actions-container';
    
    // Move to new structure
    if (narrative.parentNode) {
      narrative.parentNode.removeChild(narrative);
    }
    
    if (actions.parentNode) {
      actions.parentNode.removeChild(actions);
    }
    
    actionsContainer.appendChild(actions);
    narrativeContainer.appendChild(narrative);
    narrativeContainer.appendChild(actionsContainer);
    mainContent.appendChild(narrativeContainer);
  } else {
    console.error("Narrative or actions not found");
  }
  
  // Add mobile sidebar toggle
  const sidebarToggle = document.createElement('div');
  sidebarToggle.className = 'sidebar-toggle';
  sidebarToggle.innerHTML = '☰';
  sidebarToggle.addEventListener('click', function() {
    sidebar.classList.toggle('show');
  });
  
  gameContainer.appendChild(sidebarToggle);
  
  // Set up sidebar nav buttons
  const navButtons = sidebar.querySelectorAll('.sidebar-nav-button');
  navButtons.forEach(button => {
    button.addEventListener('click', function() {
      const action = this.getAttribute('data-action');
      if (typeof window.handleAction === 'function') {
        window.handleAction(action);
      }
    });
  });
  
  console.log("Enhanced game container layout created");
  
  // Update status bars
  if (typeof window.updateStatusBars === 'function') {
    window.updateStatusBars();
  }
}

// Ensure UI is properly cleaned up
function ensureUICleanup() {
  cleanupBeforeTransition();
  fixElementVisibility();
  
  // Hide all panels
  ['profile', 'inventory', 'questLog', 'combatInterface'].forEach(panelId => {
    const panel = document.getElementById(panelId);
    if (panel && !panel.classList.contains('hidden')) {
      panel.classList.add('hidden');
    }
  });
}

// Override updateStatusBars to handle sidebar bars too
if (typeof window.updateStatusBars === 'function') {
  const originalUpdateStatusBars = window.updateStatusBars;
  
  window.updateStatusBars = function() {
    // Call original function first
    originalUpdateStatusBars();
    
    // Also update sidebar status bars
    updateSidebarStatusBars();
  };
}

// Function to update sidebar status bars
function updateSidebarStatusBars() {
  if (!window.gameState) return;
  
  // Get sidebar bars
  const sidebarHealthBar = document.getElementById('sidebarHealthBar');
  const sidebarStaminaBar = document.getElementById('sidebarStaminaBar');
  const sidebarMoraleBar = document.getElementById('sidebarMoraleBar');
  
  // Update values
  if (sidebarHealthBar) {
    sidebarHealthBar.style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
    document.getElementById('sidebarHealthValue').textContent = 
      `${Math.round(window.gameState.health)}/${window.gameState.maxHealth}`;
  }
  
  if (sidebarStaminaBar) {
    sidebarStaminaBar.style.width = `${(window.gameState.stamina / window.gameState.maxStamina) * 100}%`;
    document.getElementById('sidebarStaminaValue').textContent = 
      `${Math.round(window.gameState.stamina)}/${window.gameState.maxStamina}`;
  }
  
  if (sidebarMoraleBar) {
    sidebarMoraleBar.style.width = `${window.gameState.morale}%`;
    document.getElementById('sidebarMoraleValue').textContent = 
      `${Math.round(window.gameState.morale)}/100`;
  }
}

// Kick off the fixes
fixUIFramework();
