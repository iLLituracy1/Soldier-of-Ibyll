// GAME TRANSITIONS FIX
// Completely overhauls the transitions between screens to prevent UI overlapping

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("Game Transitions Fix initializing...");
  
  // Only run once
  if (!window.gameTransitionsFixed) {
    window.gameTransitionsFixed = true;
    fixGameTransitions();
  }
});

// Main fix function for game transitions
function fixGameTransitions() {
  // Override startAdventure - transition from char creation to main game
  replaceStartAdventure();
  
  // Wait for all game elements to load, then apply fixes
  const gameElementsCheck = setInterval(() => {
    // Check for essential game elements and functions
    if (document.getElementById('gameContainer') && 
        document.getElementById('creator') && 
        typeof window.startAdventure === 'function' &&
        typeof window.updateStatusBars === 'function') {
      
      clearInterval(gameElementsCheck);
      console.log("Essential game elements detected, applying fixes");
      
      // Apply button fixes
      fixTransitionButtons();
      
      // Fix character creation section display
      fixCharacterCreationDisplay();
      
      // Apply initial visibility state
      setInitialVisibilityState();
    }
  }, 500);
  
  // Timeout after 10 seconds
  setTimeout(() => clearInterval(gameElementsCheck), 10000);
}

// Replace the startAdventure function completely
function replaceStartAdventure() {
  console.log("Replacing startAdventure function");
  
  // Store reference to original function
  const originalStartAdventure = window.startAdventure;
  
  // Create our improved version
  window.startAdventure = function() {
    console.log("Running completely new startAdventure implementation");
    
    try {
      // PHASE 1: PRE-TRANSITION CLEANUP
      console.log("Phase 1: Pre-transition cleanup");
      
      // Hide all panels to avoid UI conflicts
      hideAllPanels();
      
      // Remove any existing enhanced UI elements
      cleanupEnhancedUI();
      
      // PHASE 2: CHARACTER CREATION COMPLETION
      console.log("Phase 2: Completing character creation");
      
      // Ensure character data is complete
      if (!validatePlayerData()) {
        console.error("Player data incomplete - cannot start adventure");
        alert("Error: Character creation incomplete. Please complete all steps.");
        return;
      }
      
      // PHASE 3: TRANSITION VISIBILITY
      console.log("Phase 3: Transition visibility");
      
      // Fade out character creation
      document.getElementById('creator').classList.add('hidden');
      
      // Show game container
      document.getElementById('gameContainer').classList.remove('hidden');
      
      // PHASE 4: GAME STATE SETUP
      console.log("Phase 4: Game state setup");
      
      // Initialize game state
      if (typeof window.initializeGameState === 'function') {
        window.initializeGameState();
      } else {
        console.error("initializeGameState function not found - game may not work correctly");
      }
      
      // PHASE 5: INVENTORY SYSTEM INITIALIZATION
      console.log("Phase 5: Inventory system initialization");
      
      // Initialize inventory
      if (typeof window.initializeInventorySystem === 'function') {
        window.initializeInventorySystem();
      }
      
      if (typeof window.initializeInventoryUI === 'function') {
        window.initializeInventoryUI();
      }
      
      // Add starter items based on career
      if (typeof window.addStartingItems === 'function') {
        window.addStartingItems();
      }
      
      // PHASE 6: UI SETUP
      console.log("Phase 6: UI setup");
      
      // Set up enhanced UI if the function exists
      if (typeof window.enhanceGameContainerSafely === 'function') {
        window.enhanceGameContainerSafely();
      } else if (typeof window.enhanceGameContainer === 'function') {
        window.enhanceGameContainer();
      }
      
      // Update status display
      if (typeof window.updateStatusBars === 'function') {
        window.updateStatusBars();
      }
      
      // Set time display
      if (typeof window.updateTimeAndDay === 'function') {
        window.updateTimeAndDay(0);
      }
      
      // Set action buttons
      if (typeof window.updateActionButtons === 'function') {
        window.updateActionButtons();
      }
      
      // PHASE 7: SET NARRATIVE
      console.log("Phase 7: Setting initial narrative");
      
      // Set initial narrative content
      if (typeof window.setNarrative === 'function') {
        const initialNarrative = generateInitialNarrative();
        window.setNarrative(initialNarrative);
      }
      
      console.log("Game successfully started");
    } catch (error) {
      console.error("Error during game start:", error);
      
      // Fallback to original function
      try {
        console.log("Attempting to use original startAdventure as fallback");
        if (typeof originalStartAdventure === 'function') {
          originalStartAdventure();
        }
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        alert("Error starting game. Please refresh the page and try again.");
      }
    }
  };
}

// Fix buttons related to game transitions
function fixTransitionButtons() {
  console.log("Fixing transition buttons");
  
  // Fix start-adventure-button
  const startAdventureBtn = document.getElementById('start-adventure-button');
  if (startAdventureBtn) {
    // Remove all existing event listeners by cloning the button
    const newStartAdventureBtn = startAdventureBtn.cloneNode(true);
    startAdventureBtn.parentNode.replaceChild(newStartAdventureBtn, startAdventureBtn);
    
    // Add our event listener
    newStartAdventureBtn.addEventListener('click', function(event) {
      event.preventDefault();
      window.startAdventure();
    });
    
    console.log("start-adventure-button fixed");
  }
  
  // Similar fixes for other critical buttons
  fixCriticalButton('confirm-character-button', window.confirmCharacter);
  fixCriticalButton('continue-to-empire-button', window.showEmpireUpdate);
}

// Helper function to fix critical buttons
function fixCriticalButton(buttonId, handlerFunction) {
  const button = document.getElementById(buttonId);
  if (button && typeof handlerFunction === 'function') {
    // Remove all existing handlers by cloning
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // Add the handler
    newButton.addEventListener('click', function(event) {
      event.preventDefault();
      handlerFunction();
    });
    
    console.log(`${buttonId} fixed`);
  }
}

// Fix character creation display issues
function fixCharacterCreationDisplay() {
  // Fix the display sequence to ensure proper progression
  const sections = [
    'intro',
    'originSection',
    'nameSection',
    'finalOutput',
    'prologueSection',
    'empireSection'
  ];
  
  // Ensure only one section is visible at a time
  const showSection = function(sectionId) {
    sections.forEach(id => {
      const section = document.getElementById(id);
      if (section) {
        if (id === sectionId) {
          section.classList.remove('hidden');
        } else {
          section.classList.add('hidden');
        }
      }
    });
  };
  
  // Override section navigation functions
  if (typeof window.selectOrigin === 'function') {
    const originalSelectOrigin = window.selectOrigin;
    window.selectOrigin = function(origin) {
      originalSelectOrigin(origin);
      showSection('originSection');
    };
  }
  
  if (typeof window.backToIntro === 'function') {
    const originalBackToIntro = window.backToIntro;
    window.backToIntro = function() {
      originalBackToIntro();
      showSection('intro');
    };
  }
  
  if (typeof window.selectCareer === 'function') {
    const originalSelectCareer = window.selectCareer;
    window.selectCareer = function(career) {
      originalSelectCareer(career);
      showSection('nameSection');
    };
  }
  
  if (typeof window.backToOrigin === 'function') {
    const originalBackToOrigin = window.backToOrigin;
    window.backToOrigin = function() {
      originalBackToOrigin();
      showSection('originSection');
    };
  }
  
  if (typeof window.setName === 'function') {
    const originalSetName = window.setName;
    window.setName = function() {
      originalSetName();
      showSection('finalOutput');
    };
  }
  
  if (typeof window.backToName === 'function') {
    const originalBackToName = window.backToName;
    window.backToName = function() {
      originalBackToName();
      showSection('nameSection');
    };
  }
  
  if (typeof window.confirmCharacter === 'function') {
    const originalConfirmCharacter = window.confirmCharacter;
    window.confirmCharacter = function() {
      originalConfirmCharacter();
      showSection('prologueSection');
    };
  }
  
  if (typeof window.showEmpireUpdate === 'function') {
    const originalShowEmpireUpdate = window.showEmpireUpdate;
    window.showEmpireUpdate = function() {
      originalShowEmpireUpdate();
      showSection('empireSection');
    };
  }
  
  console.log("Character creation display progression fixed");
}

// Hide all UI panels
function hideAllPanels() {
  const panels = ['profile', 'inventory', 'questLog', 'combatInterface'];
  
  panels.forEach(id => {
    const panel = document.getElementById(id);
    if (panel && !panel.classList.contains('hidden')) {
      panel.classList.add('hidden');
    }
  });
}

// Clean up any enhanced UI elements
function cleanupEnhancedUI() {
  // Remove sidebar and main content containers if they exist
  const sidebar = document.querySelector('.game-sidebar');
  if (sidebar && sidebar.parentNode) {
    sidebar.parentNode.removeChild(sidebar);
  }
  
  const mainContent = document.querySelector('.game-main');
  if (mainContent && mainContent.parentNode) {
    mainContent.parentNode.removeChild(mainContent);
  }
  
  const sidebarToggle = document.querySelector('.sidebar-toggle');
  if (sidebarToggle && sidebarToggle.parentNode) {
    sidebarToggle.parentNode.removeChild(sidebarToggle);
  }
}

// Set initial visibility state
function setInitialVisibilityState() {
  // Show character creation, hide game container
  const creator = document.getElementById('creator');
  const gameContainer = document.getElementById('gameContainer');
  
  if (creator) {
    creator.classList.remove('hidden');
  }
  
  if (gameContainer) {
    gameContainer.classList.add('hidden');
  }
  
  // Only show intro section, hide others
  const sections = [
    'intro',
    'originSection',
    'nameSection',
    'finalOutput',
    'prologueSection',
    'empireSection'
  ];
  
  sections.forEach(id => {
    const section = document.getElementById(id);
    if (section) {
      if (id === 'intro') {
        section.classList.remove('hidden');
      } else {
        section.classList.add('hidden');
      }
    }
  });
  
  console.log("Initial visibility state set");
}

// Validate player data
function validatePlayerData() {
  if (!window.player) {
    console.error("Player object not found");
    return false;
  }
  
  // Check required properties
  if (!window.player.name || !window.player.origin || 
      !window.player.career || !window.player.career.title) {
    console.error("Missing critical player data", window.player);
    return false;
  }
  
  // Check attribute values
  if (typeof window.player.phy !== 'number' || typeof window.player.men !== 'number') {
    console.error("Invalid player attributes", window.player);
    return false;
  }
  
  // Check skills
  if (!window.player.skills) {
    console.error("Player skills object not found");
    return false;
  }
  
  return true;
}

// Generate initial narrative
function generateInitialNarrative() {
  if (!window.player || !window.player.name || !window.player.career || !window.player.origin) {
    return "Your journey begins...";
  }
  
  return `${window.player.name}, a ${window.player.career.title} of ${window.player.origin} heritage, the road has been long. Nearly a season has passed since you departed the heartlands of Paan'eun, the distant spires of Cennen giving way to the endless hinterlands of the empire. Through the great riverlands and the mountain passes, across the dust-choked roads of the interior, and finally westward into the feudalscape of the Hierarchate, you have traveled. Each step has carried you further from home, deeper into the shadow of war.

Now, you stand at the edge of your Kasvaari's Camp, the flickering lanterns and distant clang of the forges marking the heartbeat of an army in preparation. Here, amidst the hardened warriors and the banners of noble Charters, you are no longer a traveler—you are a soldier, bound to duty, drawn by the call of empire.

The Western Hierarchate is a land of towering fortresses and ancient battlefields, a realm where the scars of past campaigns linger in the earth itself. The Arrasi Peninsula lies beyond the western horizon, its crystalline plains an enigma even to those who have fought there before. Soon, you will march upon those lands, crossing the vast Wall of Nesia, where the empire's dominion falters against the unknown.

For now, your place is here, among your kin and comrades, within the Kasvaari's Camp, where the scent of oiled steel and the murmur of hushed war councils fill the air. What will you do first?`;
}

// Run the fixes
fixGameTransitions();
