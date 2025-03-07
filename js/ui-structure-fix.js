// UI STRUCTURE FIX
// This fixes the DOM insertion error in robust-ui-fix.js

(function() {
  console.log("UI Structure Fix initializing...");
  
  // Wait for DOM to be loaded
  document.addEventListener('DOMContentLoaded', function() {
    // We need to patch the ensureStatusBars function in robust-ui-fix.js
    window.fixEnsureStatusBars = function() {
      // Define a fixed version of the ensureStatusBars function
      const fixedEnsureStatusBars = function() {
        // Check if status bars container exists
        let statusBars = document.querySelector('.status-bars');
        
        if (!statusBars) {
          console.log("Creating missing status bars");
          
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
          
          // Find proper parent to add it to
          const gameContainer = document.getElementById('gameContainer');
          
          // SAFE INSERTION: Instead of using insertBefore (which is failing),
          // we'll just append to the game container if the standard approach fails
          try {
            const narrative = document.getElementById('narrative');
            
            if (gameContainer && narrative && narrative.parentNode === gameContainer) {
              // This was the original approach - insert before narrative
              gameContainer.insertBefore(statusBars, narrative);
              console.log("Status bars added before narrative");
            } else if (gameContainer) {
              // Safer fallback - just append to game container
              gameContainer.appendChild(statusBars);
              console.log("Status bars appended to game container");
            } else {
              // Last resort - append to body
              document.body.appendChild(statusBars);
              console.log("Status bars appended to document body");
            }
          } catch (error) {
            console.error("Error adding status bars:", error);
            
            // Emergency fallback - just add to body
            try {
              document.body.appendChild(statusBars);
              console.log("Status bars added to body after error");
            } catch (e) {
              console.error("Critical error adding status bars:", e);
            }
          }
        }
      };
      
      // Check if we can safely override the original function in window.UI_STATE
      if (window.UI_STATE && window.ensureStatusBars) {
        // Store original and patch
        window.originalEnsureStatusBars = window.ensureStatusBars;
        window.ensureStatusBars = fixedEnsureStatusBars;
        console.log("ensureStatusBars function patched");
      } else {
        // If not, set a global ensureStatusBars function
        window.ensureStatusBars = fixedEnsureStatusBars;
        console.log("Global ensureStatusBars function created");
      }
      
      // Apply the fix immediately
      fixedEnsureStatusBars();
    };
    
    // Wait a short time for robust-ui-fix.js to load first
    setTimeout(function() {
      // Apply our fix
      window.fixEnsureStatusBars();
      
      // Make sure profile system also works
      if (window.handleProfile && document.getElementById('profile')) {
        // Ensure profile can be opened
        const profileButton = document.querySelector('[data-action="profile"]');
        if (profileButton) {
          profileButton.addEventListener('click', function() {
            document.getElementById('profile').classList.remove('hidden');
          });
        }
      }
    }, 500);
  });
  
  console.log("UI Structure Fix initialized");
})();
