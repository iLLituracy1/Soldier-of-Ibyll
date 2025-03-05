// COMBAT-MISSION INTEGRATION
// This module enhances the integration between the combat system and mission system

(function() {
  // Store original functions for backward compatibility
  const originalEndCombatWithResult = window.endCombatWithResult || function() {};
  const originalCleanupCombatUI = window.cleanupCombatUI || function() {};
  
  // Enhanced combat end function with robust mission integration
  window.endCombatWithResult = function(result) {
    console.log("[Combat Integration] Ending combat with result:", result);
    
    // First, ensure UI is cleaned up properly
    try {
      if (typeof window.cleanupCombatUI === 'function') {
        window.cleanupCombatUI();
      }
    } catch (error) {
      console.error("[Combat Integration] Error during combat UI cleanup:", error);
    }
    
    // Determine if we're in a mission combat
    const inMissionCombat = window.gameState.inMissionCombat;
    
    // Clear combat state
    window.gameState.inBattle = false;
    window.gameState.currentEnemy = null;
    
    // Process result based on context
    if (inMissionCombat) {
      console.log("[Combat Integration] Handling mission combat result:", result);
      
      // First, try the modern mission system
      if (window.MissionSystem && typeof window.MissionSystem.continueMissionAfterCombat === 'function') {
        try {
          // Set flag to false before continuing to avoid duplicate calls
          window.gameState.inMissionCombat = false;
          
          // Continue mission with the result
          setTimeout(() => {
            window.MissionSystem.continueMissionAfterCombat(result);
          }, 500);
        } catch (error) {
          console.error("[Combat Integration] Error continuing mission after combat:", error);
          
          // Fallback to legacy behavior
          handleCombatResultLegacy(result);
          
          // Reset mission state in case of error
          safelyResetMissionState();
        }
      } 
      // Try the legacy mission system
      else if (window.missionSystem && typeof window.missionSystem.continueMissionAfterCombat === 'function') {
        try {
          // Set flag to false before continuing to avoid duplicate calls
          window.gameState.inMissionCombat = false;
          
          // Continue mission with the result
          setTimeout(() => {
            window.missionSystem.continueMissionAfterCombat(result);
          }, 500);
        } catch (error) {
          console.error("[Combat Integration] Error continuing mission (legacy) after combat:", error);
          
          // Fallback to legacy behavior
          handleCombatResultLegacy(result);
          
          // Reset mission state in case of error
          safelyResetMissionState();
        }
      }
      // No mission system available, use direct fallback
      else {
        console.warn("[Combat Integration] No mission system available to continue mission after combat");
        
        // Fallback to legacy behavior
        handleCombatResultLegacy(result);
        
        // Reset mission state as a last resort
        safelyResetMissionState();
      }
    } 
    // Not in a mission combat, handle normally
    else {
      handleCombatResultLegacy(result);
    }
    
    // Always restore UI elements that should be visible
    restoreUIAfterCombat();
    
    // Update UI after ending combat
    setTimeout(updateUIAfterCombat, 300);
  };
  
  // Enhanced combat cleanup with better UI restoration
  window.cleanupCombatUI = function() {
    console.log("[Combat Integration] Cleaning up combat UI elements");
    
    try {
      // First try the original cleanup
      originalCleanupCombatUI();
    } catch (error) {
      console.error("[Combat Integration] Error in original combat UI cleanup:", error);
    }
    
    // Do our own cleanup as a backup
    try {
      // Clean up any combat-specific UI elements
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
      
      // Hide combat interface
      const combatInterface = document.getElementById('combatInterface');
      if (combatInterface) {
        combatInterface.classList.add('hidden');
        combatInterface.classList.remove('combat-fullscreen');
      }
    } catch (error) {
      console.error("[Combat Integration] Error in enhanced combat UI cleanup:", error);
    }
  };
  
  // Legacy combat result handler
  function handleCombatResultLegacy(result) {
    // Process based on result
    if (result === 'victory') {
      if (typeof window.setNarrative === 'function') {
        window.setNarrative("You have defeated your opponent!");
      }
      
      // Add experience reward for victory if not in a mission
      if (!window.gameState.inMission) {
        const expGain = 25;
        window.gameState.experience += expGain;
        
        if (typeof window.showNotification === 'function') {
          window.showNotification(`You gained ${expGain} experience!`, 'success');
        }
        
        // Check for level up
        if (typeof window.checkLevelUp === 'function') {
          window.checkLevelUp();
        }
      }
    } 
    else if (result === 'defeat') {
      if (typeof window.setNarrative === 'function') {
        window.setNarrative("You have been defeated, but manage to escape with your life.");
      }
      
      // Apply health and stamina penalties for defeat
      const healthReduction = Math.floor(window.gameState.maxHealth * 0.5);
      const staminaReduction = Math.floor(window.gameState.maxStamina * 0.5);
      
      window.gameState.health = Math.max(1, window.gameState.health - healthReduction);
      window.gameState.stamina = Math.max(0, window.gameState.stamina - staminaReduction);
      
      // Add time (unconscious for 2 hours)
      if (typeof window.updateTimeAndDay === 'function') {
        window.updateTimeAndDay(120);
      }
    } 
    else if (result === 'retreat') {
      if (typeof window.setNarrative === 'function') {
        window.setNarrative("You've managed to retreat from combat and return to safety, though you're exhausted from running.");
      }
      
      // Reduce stamina from running
      const staminaLoss = Math.floor(window.gameState.maxStamina * 0.3);
      window.gameState.stamina = Math.max(0, window.gameState.stamina - staminaLoss);
      
      // Add some time (30 minutes of running/recovery)
      if (typeof window.updateTimeAndDay === 'function') {
        window.updateTimeAndDay(30);
      }
    }
  }
  
  // Safely reset mission state in case of errors
  function safelyResetMissionState() {
    console.warn("[Combat Integration] Performing emergency mission state reset");
    
    // Reset all mission-related state flags
    window.gameState.inMission = false;
    window.gameState.currentMission = null;
    window.gameState.missionStage = 0;
    window.gameState.inMissionCombat = false;
    
    // Try the mission system's emergency recovery if available
    if (window.MissionSystem && typeof window.MissionSystem.emergencyRecover === 'function') {
      window.MissionSystem.emergencyRecover();
    }
  }
  
  // Restore UI elements after combat
  function restoreUIAfterCombat() {
    // Show the narrative container
    const narrativeContainer = document.getElementById('narrative-container');
    if (narrativeContainer) {
      narrativeContainer.style.display = 'block';
    }
    
    // Show status bars
    const statusBars = document.querySelector('.status-bars');
    if (statusBars) {
      statusBars.style.display = 'flex';
    }
    
    // Show game header elements
    const elementsToRestore = [
      'location',
      'timeDisplay',
      'dayDisplay',
      'dayNightIndicator'
    ];
    
    for (const id of elementsToRestore) {
      const element = document.getElementById(id);
      if (element) {
        element.style.display = 'block';
      }
    }
    
    // Ensure action buttons container is visible
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      actionsContainer.style.display = 'flex';
    }
  }
  
  // Update UI after combat ends
  function updateUIAfterCombat() {
    // Update status bars
    if (typeof window.updateStatusBars === 'function') {
      window.updateStatusBars();
    }
    
    // Update action buttons
    if (typeof window.updateActionButtons === 'function') {
      window.updateActionButtons();
    }
    
    // Double check action buttons appeared
    setTimeout(() => {
      const actionsContainer = document.getElementById('actions');
      if (actionsContainer && actionsContainer.children.length === 0) {
        console.warn("[Combat Integration] No action buttons found after combat! Running safeguard...");
        
        // Force action buttons update
        if (typeof window.updateActionButtons === 'function') {
          window.updateActionButtons();
        }
        
        // If we're in a mission but have no action buttons, there's likely a problem
        if (window.gameState.inMission && actionsContainer.children.length === 0) {
          console.warn("[Combat Integration] Still no action buttons in mission! Attempting recovery...");
          safelyResetMissionState();
        }
      }
    }, 600);
  }
  
  // Enhanced combat system integration for missions - with delayed initialization
  function extendCombatSystem() {
    // Check if CombatSystem exists now
    if (!window.CombatSystem) {
      console.log("[Combat Integration] CombatSystem not initialized yet, will try again later");
      // Try again in 500ms
      setTimeout(extendCombatSystem, 500);
      return;
    }
    
    console.log("[Combat Integration] Extending CombatSystem with mission integration");
    
    // Save original startMissionCombat if it exists
    const originalStartMissionCombat = window.CombatSystem.startMissionCombat;
    
    // Replace with enhanced version
    window.CombatSystem.startMissionCombat = function(enemyType, environment, callbackOnCompletion) {
      console.log("[Combat Integration] Starting mission combat with:", enemyType);
      
      // Set mission combat flag
      window.gameState.inMissionCombat = true;
      
      // Start combat either using the original method or direct combat start
      if (typeof originalStartMissionCombat === 'function') {
        originalStartMissionCombat(enemyType, environment, callbackOnCompletion);
      } else {
        // Fallback to direct combat start
        this.startCombat(enemyType, environment);
        
        // Register one-time event listener for combat end if callback provided
        if (callbackOnCompletion && typeof this.on === 'function') {
          this.on('combatEnd', function handleMissionCombatEnd(data) {
            // Call the mission callback with the result
            callbackOnCompletion(data.result);
            
            // Remove this event listener
            if (typeof window.CombatSystem.off === 'function') {
              window.CombatSystem.off('combatEnd', handleMissionCombatEnd);
            }
          });
        }
      }
    };
  }
  
  // Start the extension process
  extendCombatSystem();
  
  console.log("[Combat Integration] Combat-Mission integration module initialized");
})();