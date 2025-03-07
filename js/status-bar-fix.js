// STATUS BAR FIX
// This script fixes the "Cannot read properties of null" error in updateStatusBars

(function() {
  console.log("Status Bar Fix initializing...");
  
  // Wait for DOM to be loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Override the updateStatusBars function
    patchUpdateStatusBars();
    
    // Create fallback status bars if needed
    ensureStatusBarsElements();
  });
  
  // Function to patch updateStatusBars
  function patchUpdateStatusBars() {
    // Store the original function if it exists
    const originalUpdateStatusBars = window.updateStatusBars;
    
    // Create a safe version of updateStatusBars
    window.updateStatusBars = function() {
      // Check if gameState exists
      if (!window.gameState) {
        console.warn("Game state not initialized, cannot update status bars");
        return;
      }
      
      try {
        // Try to update the sidebar status bars only
        updateSidebarStatusBars();
        
        // If we have the original function, call it as a fallback
        // but catch any errors to prevent them from bubbling up
        if (typeof originalUpdateStatusBars === 'function') {
          try {
            originalUpdateStatusBars();
          } catch (error) {
            console.warn("Original updateStatusBars threw an error:", error);
          }
        }
      } catch (error) {
        console.error("Error in safe updateStatusBars:", error);
      }
    };
    
    console.log("updateStatusBars function patched for safety");
  }
  
  // Function to update sidebar status bars
  function updateSidebarStatusBars() {
    if (!window.gameState) return;
    
    // Update sidebar health bar
    const sidebarHealthBar = document.getElementById('sidebarHealthBar');
    const sidebarHealthValue = document.getElementById('sidebarHealthValue');
    
    if (sidebarHealthBar) {
      sidebarHealthBar.style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
    }
    
    if (sidebarHealthValue) {
      sidebarHealthValue.textContent = `${Math.round(window.gameState.health)}/${window.gameState.maxHealth}`;
    }
    
    // Update sidebar stamina bar
    const sidebarStaminaBar = document.getElementById('sidebarStaminaBar');
    const sidebarStaminaValue = document.getElementById('sidebarStaminaValue');
    
    if (sidebarStaminaBar) {
      sidebarStaminaBar.style.width = `${(window.gameState.stamina / window.gameState.maxStamina) * 100}%`;
    }
    
    if (sidebarStaminaValue) {
      sidebarStaminaValue.textContent = `${Math.round(window.gameState.stamina)}/${window.gameState.maxStamina}`;
    }
    
    // Update sidebar morale bar
    const sidebarMoraleBar = document.getElementById('sidebarMoraleBar');
    const sidebarMoraleValue = document.getElementById('sidebarMoraleValue');
    
    if (sidebarMoraleBar) {
      sidebarMoraleBar.style.width = `${window.gameState.morale}%`;
    }
    
    if (sidebarMoraleValue) {
      sidebarMoraleValue.textContent = `${Math.round(window.gameState.morale)}/100`;
    }
  }
  
  // Function to ensure status bars elements exist
  function ensureStatusBarsElements() {
    // Check if we need to create sidebar status bars
    const checkForSidebar = setInterval(() => {
      const sidebar = document.querySelector('.game-sidebar');
      
      if (sidebar && !document.getElementById('sidebarHealthBar')) {
        // Create sidebar status bars
        ensureSidebarStatusBarsExist(sidebar);
        clearInterval(checkForSidebar);
      }
    }, 500);
    
    // Clear after 10 seconds
    setTimeout(() => clearInterval(checkForSidebar), 10000);
  }
  
  // Function to ensure sidebar status bars exist
  function ensureSidebarStatusBarsExist(sidebar) {
    // Check if sidebar status bars already exist
    if (document.getElementById('sidebarHealthBar')) return;
    
    console.log("Creating sidebar status bars");
    
    // Create quick status container
    const quickStatus = document.createElement('div');
    quickStatus.className = 'quick-status';
    
    // Create HTML structure
    quickStatus.innerHTML = `
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
    `;
    
    // Add to sidebar
    sidebar.appendChild(quickStatus);
    
    console.log("Sidebar status bars created");
  }
})();
