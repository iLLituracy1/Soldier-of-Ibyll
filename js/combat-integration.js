// ENHANCED COMBAT-MISSION INTEGRATION
// This module provides a clean, consolidated integration point between
// the combat system and mission system, fixing transition issues

window.CombatMissionIntegration = (function() {
  // Private state
  let _missionCombatCallback = null;  // Callback for after combat
  let _pendingCombatResult = null;    // Store result when UI isn't ready
  let _originalStates = {};           // Store original states for restoration
  
  // Debug logging helper
  function _log(message, data) {
    console.log(`[CombatMissionIntegration] ${message}`, data || '');
  }
  
  // Error logging helper
  function _error(message, data) {
    console.error(`[CombatMissionIntegration] ERROR: ${message}`, data || '');
  }
  
  // Save original state before combat
  function _saveOriginalState() {
    _originalStates = {
      weather: window.gameState.weather,
      narrativeLock: window.UI && window.UI.state ? window.UI.state.narrativeLock : false
    };
    
    _log("Saved original state", _originalStates);
  }
  
  // Restore UI elements after combat
  function _ensureUIRestored() {
    _log("Ensuring UI elements are restored");
    
    // List of elements to restore with their display style
    const elementsToRestore = [
      {id: 'narrative-container', style: 'block'},
      {selector: '.status-bars', style: 'flex'},
      {id: 'actions', style: 'flex'},
      {id: 'location', style: 'block'},
      {id: 'timeDisplay', style: 'block'},
      {id: 'dayDisplay', style: 'block'},
      {id: 'dayNightIndicator', style: 'block'}
    ];
    
    // Restore each element
    elementsToRestore.forEach(item => {
      const element = item.id 
        ? document.getElementById(item.id) 
        : document.querySelector(item.selector);
        
      if (element) {
        element.style.display = item.style;
      }
    });
    
    // Ensure combat interface is hidden
    const combatInterface = document.getElementById('combatInterface');
    if (combatInterface) {
      combatInterface.classList.add('hidden');
      combatInterface.classList.remove('combat-fullscreen');
    }
    
    // Restore original states
    if (_originalStates.weather) {
      window.gameState.weather = _originalStates.weather;
    }
    
    // Unlock narrative if it was locked during mission
    if (window.UI && window.UI.state) {
      window.UI.state.narrativeLock = false;
    }
  }
  
  // Clean up combat UI elements
  function _cleanupCombatUI() {
    _log("Cleaning up combat UI elements");
    
    // First try the CombatSystem's cleanup if available
    if (window.CombatSystem && typeof window.CombatSystem.cleanupCombatUI === 'function') {
      try {
        window.CombatSystem.cleanupCombatUI();
      } catch (error) {
        _error("Error in CombatSystem.cleanupCombatUI", error);
        // Continue with manual cleanup
      }
    }
    
    // Backup manual cleanup for combat containers
    const combatContainers = [
      'distanceContainer', 
      'stanceContainer', 
      'environmentContainer',
      'momentumContainer', 
      'combatActions', 
      'combatLog',
      'staminaContainer'
    ];
    
    for (const id of combatContainers) {
      const element = document.getElementById(id);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
    
    // Ensure other UI is restored
    _ensureUIRestored();
  }
  
  // Process combat end event
  function _handleCombatEnd(result) {
    _log("Handling combat end with result:", result);
    
    // Clear mission combat flag first to prevent duplicate calls
    window.gameState.inMissionCombat = false;
    
    // Clean up UI
    _cleanupCombatUI();
    
    // If there's a mission callback, call it after a short delay
    if (_missionCombatCallback && typeof _missionCombatCallback === 'function') {
      // Use setTimeout to ensure UI has time to update
      setTimeout(() => {
        try {
          _log("Executing mission combat callback");
          _missionCombatCallback(result);
          _missionCombatCallback = null; // Clear after use
        } catch (error) {
          _error("Error in mission combat callback", error);
          _emergencyRecovery();
        }
      }, 300);
    } else {
      _log("No callback registered for mission combat");
    }
  }
  
  // Emergency recovery function for critical failures
  function _emergencyRecovery() {
    _log("Performing emergency recovery");
    
    // Reset all critical state flags
    window.gameState.inBattle = false;
    window.gameState.currentEnemy = null;
    window.gameState.inMission = false;
    window.gameState.currentMission = null;
    window.gameState.missionStage = 0;
    window.gameState.inMissionCombat = false;
    
    // Clear internal state
    _missionCombatCallback = null;
    _pendingCombatResult = null;
    
    // Restore UI elements
    _ensureUIRestored();
    
    // Set an emergency recovery message
    if (typeof window.setNarrative === 'function') {
      window.setNarrative("You've returned to camp after a momentary disorientation.");
    }
    
    // Show notification
    if (typeof window.showNotification === 'function') {
      window.showNotification("Emergency recovery completed. Game state has been reset.", "info");
    }
    
    // Update action buttons
    if (typeof window.updateActionButtons === 'function') {
      window.updateActionButtons();
    }
    
    return true;
  }
  
  // Public API
  return {
    // Start mission combat with enhanced error handling
    startMissionCombat: function(enemyType, environment, callback) {
      _log("Starting mission combat", { enemyType, environment });
      
      // Validate parameters
      if (!enemyType) {
        _error("Missing enemy type");
        return false;
      }
      
      // Set mission combat flag
      window.gameState.inMissionCombat = true;
      
      // Save original state
      _saveOriginalState();
      
      // Store callback for after combat
      if (typeof callback === 'function') {
        _missionCombatCallback = callback;
      }
      
      // Start combat with appropriate system
      if (window.CombatSystem && typeof window.CombatSystem.startCombat === 'function') {
        window.CombatSystem.startCombat(enemyType, environment || null);
      } else if (typeof window.startCombat === 'function') {
        window.startCombat(enemyType, environment || null);
      } else {
        _error("No combat system available to start combat");
        window.gameState.inMissionCombat = false;
        return false;
      }
      
      return true;
    },
    
    // Handle end of combat for mission integration
    handleCombatEnd: function(result) {
      _handleCombatEnd(result);
    },
    
    // Register a callback for after mission combat
    registerCallback: function(callback) {
      if (typeof callback !== 'function') {
        _error("Invalid callback provided", callback);
        return false;
      }
      
      _missionCombatCallback = callback;
      return true;
    },
    
    // Continue mission after combat
    continueMissionAfterCombat: function(result) {
      _log("Continuing mission after combat", { result });
      
      // Check if we're in a mission
      if (!window.gameState.inMission) {
        _error("Not in a mission when continueMissionAfterCombat was called");
        return false;
      }
      
      // Clear mission combat flag
      window.gameState.inMissionCombat = false;
      
      // Handle based on mission system
      if (window.MissionSystem && typeof window.MissionSystem.continueMissionAfterCombat === 'function') {
        try {
          window.MissionSystem.continueMissionAfterCombat(result);
          return true;
        } catch (error) {
          _error("Error in MissionSystem.continueMissionAfterCombat", error);
          _emergencyRecovery();
          return false;
        }
      } else if (window.missionSystem && typeof window.missionSystem.continueMissionAfterCombat === 'function') {
        try {
          window.missionSystem.continueMissionAfterCombat(result);
          return true;
        } catch (error) {
          _error("Error in missionSystem.continueMissionAfterCombat", error);
          _emergencyRecovery();
          return false;
        }
      } else {
        _error("No mission system available to continue mission after combat");
        _emergencyRecovery();
        return false;
      }
    },
    
    // Emergency recovery function
    emergencyRecovery: function() {
      return _emergencyRecovery();
    },
    
    // Check if in mission combat
    isInMissionCombat: function() {
      return window.gameState.inMissionCombat;
    },
    
    // Add emergency recovery button to the UI
    addEmergencyRecoveryButton: function() {
      _log("Adding emergency recovery button");
      
      // Check if it already exists
      if (document.getElementById('emergency-recovery-btn')) {
        return;
      }
      
      // Create button
      const button = document.createElement('button');
      button.id = 'emergency-recovery-btn';
      button.textContent = '🛟 Emergency Recovery';
      button.style.position = 'fixed';
      button.style.bottom = '10px';
      button.style.right = '10px';
      button.style.zIndex = '9999';
      button.style.backgroundColor = '#ff4b4b';
      button.style.color = 'white';
      button.style.padding = '10px';
      button.style.border = 'none';
      button.style.borderRadius = '5px';
      
      // Add click handler
      button.onclick = function() {
        _emergencyRecovery();
        
        // Remove button after use
        if (this.parentNode) this.parentNode.removeChild(this);
      };
      
      document.body.appendChild(button);
    }
  };
})();

// Hook into CombatSystem if available
(function integrateCombatSystem() {
  if (window.CombatSystem) {
    console.log("Enhancing CombatSystem with mission integration");
    
    // Store original functions
    const originalEndCombat = window.CombatSystem.endCombat;
    
    // Enhance endCombat method with mission integration
    window.CombatSystem.endCombat = function(result) {
      console.log("[CombatSystem] Enhanced endCombat called with:", result);
      
      // Store mission combat state before calling original
      const wasInMissionCombat = window.gameState.inMissionCombat;
      
      // Call original function
      originalEndCombat.call(this, result);
      
      // Handle mission integration if needed
      if (wasInMissionCombat) {
        window.CombatMissionIntegration.handleCombatEnd(result);
      }
    };
    
    // Add startMissionCombat function if not already present
    if (!window.CombatSystem.startMissionCombat) {
      window.CombatSystem.startMissionCombat = function(enemyType, environment, callback) {
        return window.CombatMissionIntegration.startMissionCombat(enemyType, environment, callback);
      };
    }
  }
})();

// Enhanced retreat functionality
(function enhanceRetreatFunctionality() {
  // Store original function
  const originalAttemptRetreat = window.attemptRetreat || function() {};
  
  // Replace with enhanced version
  window.attemptRetreat = function() {
    console.log("Enhanced retreat function called");
    
    // Special handling for mission combat
    if (window.gameState.inMissionCombat) {
      console.log("Handling retreat during mission combat");
      
      // Show retreat message
      const combatLog = document.getElementById('combatLog');
      if (combatLog) {
        combatLog.innerHTML += `<p>You attempt to retreat from combat...</p>`;
        combatLog.scrollTop = combatLog.scrollHeight;
      }
      
      // Force UI cleanup
      if (typeof window.cleanupCombatUI === 'function') {
        window.cleanupCombatUI();
      }
      
      // End combat with retreat result after a slight delay
      setTimeout(() => {
        // Clear combat state
        window.gameState.inBattle = false;
        window.gameState.currentEnemy = null;
        
        // End combat with retreat result
        if (typeof window.endCombatWithResult === 'function') {
          window.endCombatWithResult('retreat');
        } else if (window.CombatSystem && typeof window.CombatSystem.endCombat === 'function') {
          window.CombatSystem.endCombat('retreat');
        }
      }, 500);
      
      return;
    }
    
    // For non-mission combat, use the original function
    originalAttemptRetreat();
  };
})();

// Enhanced endCombatWithResult function that works with both systems
(function enhanceEndCombatWithResult() {
  // Store original function
  const originalEndCombatWithResult = window.endCombatWithResult || function() {};
  
  // Replace with enhanced version
  window.endCombatWithResult = function(result) {
    console.log("Enhanced endCombatWithResult called with:", result);
    
    try {
      // Call original function
      originalEndCombatWithResult(result);
    } catch (error) {
      console.error("Error in original endCombatWithResult:", error);
      
      // Fallback implementation
      if (window.CombatSystem && typeof window.CombatSystem.endCombat === 'function') {
        window.CombatSystem.endCombat(result);
      } else {
        // Clear combat state as a final fallback
        window.gameState.inBattle = false;
        window.gameState.currentEnemy = null;
        
        // Update UI
        if (typeof window.cleanupCombatUI === 'function') {
          window.cleanupCombatUI();
        }
      }
    }
    
    // Check for mission combat state
    if (window.gameState.inMissionCombat) {
      // Use our integrated handler
      window.CombatMissionIntegration.handleCombatEnd(result);
    }
  };
})();

// Global function to fix mission state after combat
window.fixMissionStateAfterCombat = function() {
  console.log("Checking and fixing mission state after combat");
  
  // Check if combat has ended but mission combat flag is still set
  if (!window.gameState.inBattle && window.gameState.inMissionCombat) {
    console.log("Found stale mission combat flag! Clearing it...");
    window.gameState.inMissionCombat = false;
    
    // If we're in a mission, try to continue
    if (window.gameState.inMission) {
      console.log("Attempting to continue mission after combat fix");
      
      // Default to victory result if we're in a stuck state
      window.CombatMissionIntegration.continueMissionAfterCombat('victory');
    }
    
    return true;
  }
  
  return false; // No fix was needed
};

// Automatically check for mission combat state issues on load
(function checkMissionCombatStateOnLoad() {
  console.log("Setting up automatic mission combat state checker");
  
  // Run after DOM is ready
  function performCheck() {
    // Use setTimeout to allow other scripts to initialize first
    setTimeout(() => {
      if (window.gameState) {
        // Check for inconsistent state
        if (window.gameState.inMissionCombat && !window.gameState.inBattle) {
          console.log("Detected inconsistent mission-combat state on page load!");
          
          // Try to fix it
          window.fixMissionStateAfterCombat();
          
          // Add emergency button if still in a bad state
          if (window.gameState.inMission && !window.gameState.inBattle) {
            window.CombatMissionIntegration.addEmergencyRecoveryButton();
          }
        }
      }
    }, 1000);
  }
  
  // Check if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performCheck);
  } else {
    performCheck();
  }
})();
