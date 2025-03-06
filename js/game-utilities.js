// GAME UTILITIES
// Debug tools and recovery utilities for the game

window.GameUtilities = (function() {
  // Show a visual debug message in the game UI
  function showDebugMessage(message, type = 'info') {
    // Create a debug message element if it doesn't exist
    let debugContainer = document.getElementById('debug-container');
    if (!debugContainer) {
      debugContainer = document.createElement('div');
      debugContainer.id = 'debug-container';
      debugContainer.style.position = 'fixed';
      debugContainer.style.bottom = '10px';
      debugContainer.style.right = '10px';
      debugContainer.style.maxWidth = '300px';
      debugContainer.style.maxHeight = '200px';
      debugContainer.style.overflow = 'auto';
      debugContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      debugContainer.style.color = 'white';
      debugContainer.style.padding = '10px';
      debugContainer.style.borderRadius = '5px';
      debugContainer.style.zIndex = '9999';
      document.body.appendChild(debugContainer);
    }
    
    // Create the message element
    const msgElement = document.createElement('div');
    msgElement.style.marginBottom = '5px';
    msgElement.style.padding = '5px';
    msgElement.style.borderLeft = `3px solid ${type === 'error' ? 'red' : type === 'warning' ? 'orange' : 'blue'}`;
    msgElement.style.paddingLeft = '5px';
    msgElement.textContent = message;
    
    // Add to container
    debugContainer.appendChild(msgElement);
    
    // Remove after 10 seconds
    setTimeout(() => {
      if (msgElement.parentNode === debugContainer) {
        debugContainer.removeChild(msgElement);
      }
      
      // Remove container if empty
      if (debugContainer.children.length === 0) {
        document.body.removeChild(debugContainer);
      }
    }, 10000);
  }
  
  // Create an emergency recovery button
  function addEmergencyButton() {
    // Check if button already exists
    if (document.getElementById('emergency-recovery-button')) {
      return;
    }
    
    const button = document.createElement('button');
    button.id = 'emergency-recovery-button';
    button.textContent = '🛟 Emergency Recovery';
    button.style.position = 'fixed';
    button.style.bottom = '10px';
    button.style.left = '10px';
    button.style.backgroundColor = '#ff4b4b';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.padding = '10px 15px';
    button.style.cursor = 'pointer';
    button.style.fontWeight = 'bold';
    button.style.zIndex = '9999';
    
    // Add hover effect
    button.style.transition = 'background-color 0.3s';
    button.onmouseover = function() {
      this.style.backgroundColor = '#ff6b6b';
    };
    button.onmouseout = function() {
      this.style.backgroundColor = '#ff4b4b';
    };
    
    // Add click handler
    button.onclick = function() {
      performEmergencyRecovery();
      
      // Remove button after use
      if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    };
    
    document.body.appendChild(button);
    
    return button;
  }
  
  // Perform emergency recovery
  function performEmergencyRecovery() {
    console.log("[GameUtilities] Performing emergency recovery");
    
    // Show debug message
    showDebugMessage("Performing emergency recovery...", "warning");
    
    // Try to fix mission state first using mission system
    let recovered = false;
    
    if (window.MissionSystem && typeof window.MissionSystem.emergencyRecover === 'function') {
      try {
        recovered = window.MissionSystem.emergencyRecover();
        if (recovered) {
          console.log("[GameUtilities] Recovery through MissionSystem successful");
        }
      } catch (error) {
        console.error("[GameUtilities] Error during MissionSystem recovery:", error);
      }
    }
    
    // If not recovered, try manual reset
    if (!recovered) {
      console.log("[GameUtilities] Performing manual state reset");
      
      // Reset all state flags
      window.gameState.inBattle = false;
      window.gameState.currentEnemy = null;
      window.gameState.inMission = false;
      window.gameState.currentMission = null;
      window.gameState.missionStage = 0;
      window.gameState.inMissionCombat = false;
      
      // Restore UI visibility
      const narrativeContainer = document.getElementById('narrative-container');
      if (narrativeContainer) narrativeContainer.style.display = 'block';
      
      const statusBars = document.querySelector('.status-bars');
      if (statusBars) statusBars.style.display = 'flex';
      
      // Location, time, day
      const elements = ['location', 'timeDisplay', 'dayDisplay', 'dayNightIndicator'];
      for (const id of elements) {
        const element = document.getElementById(id);
        if (element) element.style.display = 'block';
      }
      
      // Combat interface
      const combatInterface = document.getElementById('combatInterface');
      if (combatInterface) {
        combatInterface.classList.add('hidden');
        combatInterface.classList.remove('combat-fullscreen');
      }
      
      // Clean up any lingering combat UI
      const combatContainers = [
        'distanceContainer', 'stanceContainer', 'environmentContainer',
        'momentumContainer', 'combatActions', 'combatLog', 'staminaContainer'
      ];
      
      for (const id of combatContainers) {
        const element = document.getElementById(id);
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }
      
      // Restore action buttons
      const actionsContainer = document.getElementById('actions');
      if (actionsContainer) {
        actionsContainer.style.display = 'flex';
        actionsContainer.innerHTML = ''; // Clear any stale buttons
      }
      
      // Update action buttons
      if (typeof window.updateActionButtons === 'function') {
        window.updateActionButtons();
      }
      
      // Create a default narrative if none exists
      if (typeof window.setNarrative === 'function') {
        window.setNarrative("You return to camp, recovering from your previous encounter.");
      }
      
      // Ensure we have core UI
      if (typeof window.updateStatusBars === 'function') {
        window.updateStatusBars();
      }
      
      showDebugMessage("Emergency recovery complete", "info");
    }
    
    return true;
  }
  
  // Check game state for issues
  function checkGameState() {
    const issues = [];
    
    // Check for combat state issues
    if (window.gameState.inBattle && !window.gameState.currentEnemy) {
      issues.push("In battle state without enemy object");
    }
    
    // Check for mission state issues
    if (window.gameState.inMission && !window.gameState.currentMission) {
      issues.push("In mission state without mission object");
    }
    
    // Check for mission combat state issues
    if (window.gameState.inMissionCombat && !window.gameState.inBattle) {
      issues.push("In mission combat state but not in battle");
    }
    
    // Check for UI issues
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer && actionsContainer.style.display === 'flex' && 
        actionsContainer.children.length === 0) {
      issues.push("Empty action buttons container");
    }
    
    // If any issues found, suggest recovery
    if (issues.length > 0) {
      console.warn("[GameUtilities] Game state issues detected:", issues);
      showDebugMessage(`Game state issues detected: ${issues.join(", ")}`, "warning");
      
      // Add emergency button
      addEmergencyButton();
    }
    
    return issues.length === 0;
  }
  
  // Monitor game state
  function startGameStateMonitor() {
    // Check every 5 seconds
    const intervalId = setInterval(() => {
      checkGameState();
    }, 5000);
    
    // Store interval ID for potential cancellation
    window.GameUtilities._monitorInterval = intervalId;
    
    return intervalId;
  }
  
  // Stop monitoring
  function stopGameStateMonitor() {
    if (window.GameUtilities._monitorInterval) {
      clearInterval(window.GameUtilities._monitorInterval);
      window.GameUtilities._monitorInterval = null;
    }
  }
  
  // Public API
  return {
    // Debug functions
    showDebugMessage,
    
    // Recovery functions
    addEmergencyButton,
    performEmergencyRecovery,
    
    // State monitoring
    checkGameState,
    startGameStateMonitor,
    stopGameStateMonitor,
    
    // Initialize utilities
    init: function() {
      console.log("[GameUtilities] Initializing game utilities");
      
      // Add error handling with safer error message access
      window.addEventListener('error', (event) => {
        console.error("[GameUtilities] Caught runtime error:", event.error);
        
        // Safely get error message
        let errorMessage = "Unknown error";
        if (event.error && typeof event.error.message === 'string') {
          errorMessage = event.error.message;
        } else if (typeof event.message === 'string') {
          errorMessage = event.message;
        }
        
        showDebugMessage(`Error: ${errorMessage}`, "error");
        
        // If in game context, check for state issues
        if (window.gameState) {
          setTimeout(checkGameState, 100);
        }
      });
      
      // Start monitoring game state
      startGameStateMonitor();
      
      console.log("[GameUtilities] Game utilities initialized");
    }
  };
})();

// Initialize utilities when document is ready
document.addEventListener('DOMContentLoaded', function() {
  window.GameUtilities.init();
});