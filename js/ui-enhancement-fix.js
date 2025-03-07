// UI ENHANCEMENT FIX
// Adds more safety checks to prevent null reference errors

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("UI Enhancement Fix initializing...");
  
  // Only run if we're not in a bundled environment (prevents duplicate initialization)
  if (!window.uiEnhancementsInitialized) {
    initializeUIEnhancements();
  }
});

// Main initialization function
function initializeUIEnhancements() {
  window.uiEnhancementsInitialized = true;
  
  // Add font link to document head
  addGoogleFont();
  
  // Add additional safety to updateTimeAndDay function
  fixUpdateTimeAndDayFunction();
  
  // Wait for game to be ready
  const gameReadyCheck = setInterval(() => {
    // More thorough checks for game initialization
    if (document.getElementById('gameContainer') && 
        window.player && 
        window.player.career && 
        window.player.career.title && 
        window.player.origin &&
        window.player.name &&
        document.getElementById('dayNightIndicator')) {
      
      clearInterval(gameReadyCheck);
      console.log("Game state detected, applying UI enhancements");
      
      // Apply enhancements
      enhanceGameContainer();
      enhanceNarrativeDisplay();
      enhanceTimeDisplay();
      enhanceActionButtons();
      enhanceCharacterProfile();
      setupEventListeners();
      
      // Override functions
      extendUIFunctions();
    } else {
      console.log("Waiting for game state to fully initialize...");
    }
  }, 500);
  
  // Only run for 10 seconds to avoid infinite checks
  setTimeout(() => clearInterval(gameReadyCheck), 10000);
  
  console.log("UI Enhancement Fix initialized");
}

// Add Google Font for better typography
function addGoogleFont() {
  if (!document.getElementById('google-fonts')) {
    const fontLink = document.createElement('link');
    fontLink.id = 'google-fonts';
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap';
    document.head.appendChild(fontLink);
    console.log("Added Google Font: Crimson Text");
  }
}

// Fix the updateTimeAndDay function to handle null elements
function fixUpdateTimeAndDayFunction() {
  // Only patch if the function exists
  if (typeof window.updateTimeAndDay === 'function') {
    console.log("Patching updateTimeAndDay function to be more resilient");
    
    // Store the original function
    const originalUpdateTimeAndDay = window.updateTimeAndDay;
    
    // Create safer version
    window.updateTimeAndDay = function(minutesToAdd) {
      try {
        // Add time
        window.gameTime += minutesToAdd;
        
        // Check for day change
        while (window.gameTime >= 1440) { // 24 hours * 60 minutes
          window.gameTime -= 1440;
          window.gameDay++;
          
          // Reset daily flags
          if (window.gameState) {
            window.gameState.dailyTrainingCount = 0;
            window.gameState.dailyPatrolDone = false;
            window.gameState.dailyScoutDone = false;
          }
        }
        
        // Format time for display
        const hours = Math.floor(window.gameTime / 60);
        const minutes = window.gameTime % 60;
        const ampm = hours < 12 ? 'AM' : 'PM';
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for display
        
        // Safely update time display
        const timeDisplay = document.getElementById('timeDisplay');
        if (timeDisplay) {
          timeDisplay.textContent = `Time: ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        }
        
        // Safely update day display
        const dayDisplay = document.getElementById('dayDisplay');
        if (dayDisplay) {
          dayDisplay.textContent = `Day ${window.gameDay}`;
        }
        
        // Safely update day/night indicator
        const timeOfDay = typeof window.getTimeOfDay === 'function' ? window.getTimeOfDay() : 'day';
        const dayNightIndicator = document.getElementById('dayNightIndicator');
        if (dayNightIndicator) {
          dayNightIndicator.className = 'day-night-indicator time-' + timeOfDay;
        }
        
        // Update UI time-based elements
        updateNarrativeTimeClass();
        
        // Update weather indicator
        updateWeatherIndicator(timeOfDay);
        
        // Update action buttons based on time
        if (typeof window.updateActionButtons === 'function') {
          window.updateActionButtons();
        }
        
        console.log(`Time updated to ${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`);
      } catch (error) {
        console.error("Error in updateTimeAndDay:", error);
      }
    };
    
    console.log("Successfully patched updateTimeAndDay function");
  }
}

// Safely update weather indicator
function updateWeatherIndicator(timeOfDay) {
  const weatherIndicator = document.querySelector('.weather-indicator');
  if (weatherIndicator && window.gameState) {
    const weatherIcon = weatherIndicator.querySelector('.weather-icon');
    const weatherText = weatherIndicator.querySelector('.weather-text');
    
    if (weatherIcon && weatherText) {
      // Get current weather from game state
      const currentWeather = window.gameState.weather || 'clear';
      weatherText.textContent = currentWeather.charAt(0).toUpperCase() + currentWeather.slice(1);
      
      // Update weather icon
      switch (currentWeather) {
        case 'clear':
          weatherIcon.textContent = '☀️';
          break;
        case 'cloudy':
          weatherIcon.textContent = '☁️';
          break;
        case 'rainy':
          weatherIcon.textContent = '🌧️';
          break;
        case 'foggy':
          weatherIcon.textContent = '🌫️';
          break;
        case 'stormy':
          weatherIcon.textContent = '⛈️';
          break;
        default:
          weatherIcon.textContent = '☀️';
      }
    }
  }
}

// Update narrative class based on time of day - with safety checks
function updateNarrativeTimeClass() {
  const narrative = document.getElementById('narrative');
  if (!narrative) return;
  
  // Remove existing time classes
  narrative.classList.remove('narrative-dawn', 'narrative-day', 'narrative-evening', 'narrative-night');
  
  // Add class based on time of day
  if (typeof window.getTimeOfDay === 'function') {
    const timeOfDay = window.getTimeOfDay();
    narrative.classList.add(`narrative-${timeOfDay}`);
  } else {
    // Default to day if getTimeOfDay isn't available
    narrative.classList.add('narrative-day');
  }
}

// Enhance the main game container with sidebar layout - with better safety checks
function enhanceGameContainer() {
  const gameContainer = document.getElementById('gameContainer');
  if (!gameContainer) {
    console.error("Game container not found. Skipping enhancement.");
    return;
  }
  
  // Safety check the player object more thoroughly
  if (!window.player || !window.player.name || !window.player.origin || 
      !window.player.career || !window.player.career.title) {
    console.error("Player data not fully initialized. Skipping game container enhancement.");
    return;
  }
  
  console.log("Enhancing game container for player:", window.player.name);
  
  // Create sidebar
  const sidebar = document.createElement('div');
  sidebar.className = 'game-sidebar';
  
  // Create character summary for sidebar - with safety checks
  sidebar.innerHTML = `
    <div class="character-summary">
      <div class="character-name">${window.player.name || 'Unknown'}</div>
      <div class="character-details">${window.player.origin || ''} ${window.player.career ? window.player.career.title || '' : ''}</div>
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
  
  // Move existing elements
  const children = Array.from(gameContainer.children);
  for (const child of children) {
    // Skip header which will be handled separately
    if (child.tagName === 'HEADER') continue;
    
    // Move to main content
    gameContainer.removeChild(child);
    mainContent.appendChild(child);
  }
  
  // Add new structure to game container
  const header = gameContainer.querySelector('header');
  gameContainer.innerHTML = '';
  if (header) gameContainer.appendChild(header);
  gameContainer.appendChild(sidebar);
  gameContainer.appendChild(mainContent);
  
  // Group narrative and actions
  const narrative = document.getElementById('narrative');
  const actions = document.getElementById('actions');
  
  if (narrative && actions) {
    const narrativeContainer = document.createElement('div');
    narrativeContainer.className = 'narrative-container';
    
    // Create wrapper for actions
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'actions-container';
    actionsContainer.appendChild(actions);
    
    // Move to narrative container
    narrative.parentNode.insertBefore(narrativeContainer, narrative);
    narrativeContainer.appendChild(narrative);
    narrativeContainer.appendChild(actionsContainer);
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
      } else {
        console.error("handleAction function not found");
      }
    });
  });
  
  console.log("Enhanced game container with sidebar layout");
}

// Enhance the narrative display with time-based styling
function enhanceNarrativeDisplay() {
  const narrative = document.getElementById('narrative');
  if (!narrative) {
    console.error("Narrative element not found. Skipping enhancement.");
    return;
  }
  
  // Add class based on time of day
  updateNarrativeTimeClass();
  
  // Add location class (based on current location, defaults to camp)
  narrative.classList.add('location-camp');
  
  console.log("Enhanced narrative display");
}

// Enhance time display with icons and formatted UI
function enhanceTimeDisplay() {
  const timeDisplay = document.getElementById('timeDisplay');
  const dayDisplay = document.getElementById('dayDisplay');
  const indicator = document.getElementById('dayNightIndicator');
  
  if (!timeDisplay || !dayDisplay || !indicator) {
    console.error("Time display elements not found. Skipping enhancement.");
    return;
  }
  
  // Get parent header
  const header = timeDisplay.parentNode;
  if (!header) {
    console.error("Header element not found. Skipping time display enhancement.");
    return;
  }
  
  // Create container for time display
  const timeContainer = document.createElement('div');
  timeContainer.className = 'time-display-container';
  
  // Move elements
  header.removeChild(timeDisplay);
  header.removeChild(dayDisplay);
  header.removeChild(indicator);
  
  // Create structure
  timeContainer.innerHTML = `
    <div class="day-night-indicator ${indicator.className.split(' ')[1] || ''}"></div>
    <div class="time-info">
      <div id="timeDisplay">${timeDisplay.textContent || ''}</div>
      <div id="dayDisplay">${dayDisplay.textContent || ''}</div>
    </div>
    <div class="weather-indicator">
      <span class="weather-icon">☀️</span>
      <span class="weather-text">Clear</span>
    </div>
  `;
  
  // Add to header
  header.appendChild(timeContainer);
  
  console.log("Enhanced time display");
}

// Enhance action buttons with icons
function enhanceActionButtons() {
  if (typeof window.addActionButton !== 'function') {
    console.error("addActionButton function not found. Skipping action button enhancement.");
    return;
  }
  
  // Override the addActionButton function
  const originalAddButton = window.addActionButton;
  
  window.addActionButton = function(label, action, container) {
    if (!container) {
      console.error("Action button container is null");
      return;
    }
    
    // Get icon for this action
    const icon = getActionIcon(action);
    
    // Create button with icon
    const btn = document.createElement('button');
    btn.className = 'action-btn';
    
    if (icon) {
      btn.innerHTML = `<span class="action-icon">${icon}</span> ${label}`;
    } else {
      btn.textContent = label;
    }
    
    btn.setAttribute('data-action', action);
    btn.onclick = function() {
      if (typeof window.handleAction === 'function') {
        window.handleAction(action);
      } else {
        console.error("handleAction function not found");
      }
    };
    
    container.appendChild(btn);
  };
  
  // Force refresh of action buttons
  const actionsContainer = document.getElementById('actions');
  if (actionsContainer && typeof window.updateActionButtons === 'function') {
    window.updateActionButtons();
  }
  
  console.log("Enhanced action buttons with icons");
}

// Get appropriate icon for action
function getActionIcon(action) {
  const icons = {
    'train': '🏋️',
    'rest': '💤',
    'patrol': '👁️',
    'mess': '🍲',
    'guard': '⚔️',
    'gambling': '🎲',
    'brawler_pits': '👊',
    'physical_training': '💪',
    'mental_training': '🧠',
    'melee_drill': '⚔️',
    'ranged_drill': '🏹',
    'squad_exercises': '👥',
    'profile': '👤',
    'inventory': '🎒',
    'questLog': '📜',
    'play_cards': '🃏',
    'play_dice': '🎲',
    'novice_match': '🥊',
    'standard_match': '🥊',
    'veteran_match': '🥊'
  };
  
  return icons[action] || null;
}

// Enhanced character profile display
function enhanceCharacterProfile() {
  if (typeof window.handleProfile !== 'function') {
    console.error("handleProfile function not found. Skipping profile enhancement.");
    return;
  }
  
  // Override the handleProfile function
  const originalHandleProfile = window.handleProfile;
  
  window.handleProfile = function() {
    // Safety check the player object
    if (!window.player || !window.player.name || !window.player.origin || 
        !window.player.career || !window.player.career.title) {
      console.error("Player data not fully initialized. Using original profile handler.");
      return originalHandleProfile();
    }
    
    // Get the profile div
    const profileDiv = document.getElementById('profileText');
    if (!profileDiv) {
      // Call original if our container doesn't exist
      return originalHandleProfile();
    }
    
    try {
      // Calculate skill caps based on attributes
      const meleeCap = Math.floor(window.player.phy / 1.5);
      const marksmanshipCap = Math.floor((window.player.phy + window.player.men) / 3);
      const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
      const commandCap = Math.floor((window.player.men * 0.8 + window.player.phy * 0.2) / 1.5);
      const mentalSkillCap = Math.floor(window.player.men / 1.5);
      
      // Create character avatar emoji based on origin
      let avatarEmoji = '👤';
      if (window.player.origin === 'Paanic') avatarEmoji = '⚔️';
      if (window.player.origin === 'Nesian') avatarEmoji = '🏹';
      if (window.player.origin === 'Lunarine') avatarEmoji = '⚓';
      if (window.player.origin === 'Wyrdman') avatarEmoji = '🏞️';
      
      // Create badge emoji based on career
      let badgeEmoji = '👤';
      if (window.player.career.title.includes('Regular')) badgeEmoji = '⚔️';
      if (window.player.career.title.includes('Scout')) badgeEmoji = '🏹';
      if (window.player.career.title.includes('Cavalry')) badgeEmoji = '🐎';
      if (window.player.career.title.includes('Geister')) badgeEmoji = '✨';
      if (window.player.career.title.includes('Marine')) badgeEmoji = '⚓';
      if (window.player.career.title.includes('Corsair')) badgeEmoji = '⛵';
      if (window.player.career.title.includes('Berserker')) badgeEmoji = '🪓';
      
      // Build enhanced profile
      profileDiv.innerHTML = `
        <div class="character-header">
          <div class="character-avatar">
            ${avatarEmoji}
            <div class="character-badge">${badgeEmoji}</div>
          </div>
          <div class="character-info">
            <h2>${window.player.name}</h2>
            <div class="character-title">${window.player.origin} ${window.player.career.title}</div>
            <div class="character-stats">
              <div class="stat-pill">Level ${window.gameState.level || 1}</div>
              <div class="stat-pill">XP: ${window.gameState.experience || 0}/${(window.gameState.level || 1) * 100}</div>
              <div class="stat-pill">Skill Points: ${window.gameState.skillPoints || 0}</div>
            </div>
          </div>
        </div>
        
        <div class="attributes-section">
          <div class="attribute-card">
            <h3>Physical (PHY)</h3>
            <div class="attribute-cap">Max: 15</div>
            <div class="attribute-value">${(window.player.phy || 0).toFixed(1)}</div>
            <div class="attribute-description">Strength, endurance, agility, and raw physical ability.</div>
          </div>
          
          <div class="attribute-card">
            <h3>Mental (MEN)</h3>
            <div class="attribute-cap">Max: 15</div>
            <div class="attribute-value">${(window.player.men || 0).toFixed(1)}</div>
            <div class="attribute-description">Intelligence, willpower, leadership, perception, and adaptability.</div>
          </div>
        </div>
        
        <div class="skills-section">
          <h3>Skills</h3>
          <div class="skills-grid">
            ${createSkillCard('Melee Combat', window.player.skills?.melee || 0, meleeCap)}
            ${createSkillCard('Marksmanship', window.player.skills?.marksmanship || 0, marksmanshipCap)}
            ${createSkillCard('Survival', window.player.skills?.survival || 0, survivalCap)}
            ${createSkillCard('Command', window.player.skills?.command || 0, commandCap)}
            ${createSkillCard('Discipline', window.player.skills?.discipline || 0, mentalSkillCap)}
            ${createSkillCard('Tactics', window.player.skills?.tactics || 0, mentalSkillCap)}
            ${createSkillCard('Organization', window.player.skills?.organization || 0, mentalSkillCap)}
            ${createSkillCard('Arcana', window.player.skills?.arcana || 0, mentalSkillCap)}
          </div>
        </div>
        
        <div class="relationships-section">
          <h3>Relationships</h3>
          <div class="relationship-cards">
            ${createRelationshipCards()}
          </div>
        </div>
      `;
      
      // Show profile panel
      document.getElementById('profile').classList.remove('hidden');
      
      console.log("Enhanced character profile display");
    } catch (error) {
      console.error("Error in enhanced profile:", error);
      // Fallback to original implementation
      return originalHandleProfile();
    }
  };
}

// Helper function to create skill cards with SVG circle
function createSkillCard(skillName, skillValue, skillCap) {
  try {
    // Ensure values are numbers with defaults
    skillValue = Number(skillValue || 0);
    skillCap = Number(skillCap || 1);
    
    // Calculate percentage for circle
    const percentage = skillCap > 0 ? (skillValue / skillCap) * 100 : 0;
    const circumference = 2 * Math.PI * 36; // radius * 2PI
    const offset = circumference - (percentage / 100) * circumference;
    
    return `
      <div class="skill-card">
        <div class="skill-name">${skillName}</div>
        <div class="skill-radial">
          <svg width="80" height="80" viewBox="0 0 100 100">
            <circle class="skill-circle" cx="50" cy="50" r="36"/>
            <circle class="skill-circle-filled" cx="50" cy="50" r="36" 
              stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="skill-value">${skillValue.toFixed(1)}</div>
        </div>
        <div class="skill-cap">Cap: ${skillCap}</div>
      </div>
    `;
  } catch (error) {
    console.error("Error creating skill card:", error);
    return `<div class="skill-card">Error: Could not display ${skillName}</div>`;
  }
}

// Helper function to create relationship cards
function createRelationshipCards() {
  try {
    if (!window.player || !window.player.relationships) {
      return '<div class="relationship-card">No relationships established yet.</div>';
    }
    
    let cards = '';
    
    for (const id in window.player.relationships) {
      const relationship = window.player.relationships[id];
      let dispositionText = "Neutral";
      let barWidth = 50; // Default is neutral (50%)
      
      if (relationship.disposition >= 30) {
        dispositionText = "Friendly";
        barWidth = 65;
      }
      if (relationship.disposition >= 60) {
        dispositionText = "Trusted Ally";
        barWidth = 80;
      }
      if (relationship.disposition <= -30) {
        dispositionText = "Distrustful";
        barWidth = 35;
      }
      if (relationship.disposition <= -60) {
        dispositionText = "Hostile";
        barWidth = 20;
      }
      
      cards += `
        <div class="relationship-card">
          <div class="relationship-name">${relationship.name || id}</div>
          <div class="relationship-status">${dispositionText}</div>
          <div class="relationship-bar">
            <div class="relationship-fill" style="width: ${barWidth}%;"></div>
          </div>
        </div>
      `;
    }
    
    return cards || '<div class="relationship-card">No relationships established yet.</div>';
  } catch (error) {
    console.error("Error creating relationship cards:", error);
    return '<div class="relationship-card">Error displaying relationships</div>';
  }
}

// Set up enhanced event listeners
function setupEventListeners() {
  // Listen for window resize
  window.addEventListener('resize', function() {
    // Update sidebar visibility on resize
    const sidebar = document.querySelector('.game-sidebar');
    if (window.innerWidth > 768 && sidebar) {
      sidebar.classList.remove('show');
    }
  });
  
  console.log("Set up UI enhancement event listeners");
}

// Extend UI functions for better integration
function extendUIFunctions() {
  // Fix for startGameAdventure in main.js
  if (typeof window.startGameAdventure === 'function') {
    console.log("Applying safety fix to startGameAdventure");
    
    const originalStartAdventure = window.startGameAdventure;
    window.startGameAdventure = function() {
      try {
        console.log("Starting game adventure (patched version)");
        
        // Phase 1: Original startAdventure functionality
        // Hide character creation, show game container
        const creator = document.getElementById('creator');
        const gameContainer = document.getElementById('gameContainer');
        
        if (creator) creator.classList.add('hidden');
        if (gameContainer) gameContainer.classList.remove('hidden');
        
        // Phase 2: Initialize game state
        if (typeof window.initializeGameState === 'function') {
          window.initializeGameState();
        }
        
        // Create dayNightIndicator if missing
        createMissingElements();
        
        // Phase 3: Set up inventory system
        console.log("Initializing inventory system");
        if (typeof window.initializeInventorySystem === 'function') {
          window.initializeInventorySystem();
        }
        
        if (typeof window.initializeInventoryUI === 'function') {
          window.initializeInventoryUI();
        }
        
        // Phase 4: Add starting items based on career
        if (window.player && window.player.career && window.player.career.title) {
          console.log(`Adding starting items for ${window.player.career.title}`);
          if (typeof window.addStartingItems === 'function') {
            window.addStartingItems();
          }
        } else {
          console.warn("Player career not initialized, skipping starting items");
        }
        
        // Verify inventory has items
        console.log(`Player inventory now has ${window.player.inventory ? window.player.inventory.length : 0} items`);
        
        // Phase 5: Update UI
        if (typeof window.updateStatusBars === 'function') {
          window.updateStatusBars();
        }
        
        // Set initial time safely
        if (typeof window.updateTimeAndDay === 'function') {
          window.updateTimeAndDay(0);
        }
        
        if (typeof window.updateActionButtons === 'function') {
          window.updateActionButtons();
        }
        
        // Phase 6: Set initial narrative
        if (typeof window.setNarrative === 'function' && window.player) {
          let narrativeText = "Your journey begins...";
          
          if (window.player.name && window.player.career && window.player.career.title && window.player.origin) {
            narrativeText = `${window.player.name}, a ${window.player.career.title} of ${window.player.origin} heritage, the road has been long. Nearly a season has passed since you departed the heartlands of Paan'eun, the distant spires of Cennen giving way to the endless hinterlands of the empire. Through the great riverlands and the mountain passes, across the dust-choked roads of the interior, and finally westward into the feudalscape of the Hierarchate, you have traveled. Each step has carried you further from home, deeper into the shadow of war.<br><br>
            Now, you stand at the edge of your Kasvaari's Camp, the flickering lanterns and distant clang of the forges marking the heartbeat of an army in preparation. Here, amidst the hardened warriors and the banners of noble Charters, you are no longer a traveler—you are a soldier, bound to duty, drawn by the call of empire.<br><br>
            The Western Hierarchate is a land of towering fortresses and ancient battlefields, a realm where the scars of past campaigns linger in the earth itself. The Arrasi Peninsula lies beyond the western horizon, its crystalline plains an enigma even to those who have fought there before. Soon, you will march upon those lands, crossing the vast Wall of Nesia, where the empire's dominion falters against the unknown.<br><br>
            For now, your place is here, among your kin and comrades, within the Kasvaari's Camp, where the scent of oiled steel and the murmur of hushed war councils fill the air. What will you do first?`;
          }
          
          window.setNarrative(narrativeText);
        }
        
        // Phase 7: Update inventory panel if needed
        if (document.getElementById('inventory') && 
            !document.getElementById('inventory').classList.contains('hidden')) {
          console.log("Updating inventory display");
          if (typeof window.renderInventoryItems === 'function') {
            window.renderInventoryItems();
          }
          
          if (typeof window.updateEquipmentDisplay === 'function') {
            window.updateEquipmentDisplay();
          }
        }
        
        console.log("Game adventure started successfully");
      } catch (error) {
        console.error("Error in startGameAdventure:", error);
        // Still try to call original function as fallback
        try {
          originalStartAdventure();
        } catch (fallbackError) {
          console.error("Error in original startGameAdventure:", fallbackError);
        }
      }
    };
  }

  // Only extend other UI functions if they exist
  if (typeof window.updateStatusBars === 'function') {
    // Override updateStatusBars to update sidebar status as well
    const originalUpdateStatusBars = window.updateStatusBars;
    window.updateStatusBars = function() {
      try {
        // Call original function
        originalUpdateStatusBars();
        
        // Update sidebar status bars if they exist
        const sidebarHealthBar = document.getElementById('sidebarHealthBar');
        const sidebarStaminaBar = document.getElementById('sidebarStaminaBar');
        const sidebarMoraleBar = document.getElementById('sidebarMoraleBar');
        
        if (sidebarHealthBar && window.gameState) {
          sidebarHealthBar.style.width = `${(window.gameState.health / window.gameState.maxHealth) * 100}%`;
          document.getElementById('sidebarHealthValue').textContent = `${Math.round(window.gameState.health)}/${window.gameState.maxHealth}`;
        }
        
        if (sidebarStaminaBar && window.gameState) {
          sidebarStaminaBar.style.width = `${(window.gameState.stamina / window.gameState.maxStamina) * 100}%`;
          document.getElementById('sidebarStaminaValue').textContent = `${Math.round(window.gameState.stamina)}/${window.gameState.maxStamina}`;
        }
        
        if (sidebarMoraleBar && window.gameState) {
          sidebarMoraleBar.style.width = `${window.gameState.morale}%`;
          document.getElementById('sidebarMoraleValue').textContent = `${Math.round(window.gameState.morale)}/100`;
        }
      } catch (error) {
        console.error("Error in enhanced updateStatusBars:", error);
      }
    };
  }
  
  if (typeof window.setNarrative === 'function') {
    // Enhanced setNarrative for animations
    const originalSetNarrative = window.setNarrative;
    window.setNarrative = function(text) {
      try {
        const narrative = document.getElementById('narrative');
        if (narrative) {
          // Add fade out effect
          narrative.classList.add('fade-out');
          
          // After animation, update content and fade back in
          setTimeout(() => {
            originalSetNarrative(text);
            narrative.classList.remove('fade-out');
          }, 300);
        } else {
          // Fallback to original if narrative element isn't found
          originalSetNarrative(text);
        }
      } catch (error) {
        console.error("Error in enhanced setNarrative:", error);
        // Fallback to original
        originalSetNarrative(text);
      }
    };
  }
  
  if (typeof window.showNotification === 'function') {
    // Enhanced showNotification with different styles
    const originalShowNotification = window.showNotification;
    window.showNotification = function(text, type = 'info') {
      try {
        const notification = document.getElementById('notification');
        if (!notification) {
          return originalShowNotification(text, type);
        }
        
        // Add icon based on type
        let icon = '📢';
        if (type === 'success') icon = '✅';
        if (type === 'warning') icon = '⚠️';
        if (type === 'error') icon = '❌';
        if (type === 'info') icon = 'ℹ️';
        if (type === 'level-up') icon = '⭐';
        
        notification.innerHTML = `<span class="notification-icon">${icon}</span> ${text}`;
        notification.className = `notification ${type} show`;
        
        // Set timeout to hide notification
        setTimeout(() => {
          notification.classList.remove('show');
        }, 3000);
      } catch (error) {
        console.error("Error in enhanced showNotification:", error);
        // Fallback to original
        return originalShowNotification(text, type);
      }
    };
  }
  
  console.log("Extended UI functions for enhanced behavior");
}

// Create any missing elements required for the game
function createMissingElements() {
  // Check for dayNightIndicator
  if (!document.getElementById('dayNightIndicator')) {
    console.log("Creating missing dayNightIndicator element");
    
    const header = document.querySelector('header');
    if (header) {
      const indicator = document.createElement('div');
      indicator.id = 'dayNightIndicator';
      indicator.className = 'day-night-indicator';
      header.appendChild(indicator);
    }
  }
  
  // Check for other critical elements
  if (!document.getElementById('timeDisplay')) {
    console.log("Creating missing timeDisplay element");
    
    const header = document.querySelector('header');
    if (header) {
      const timeDisplay = document.createElement('div');
      timeDisplay.id = 'timeDisplay';
      timeDisplay.textContent = 'Time: 8:00 AM';
      header.appendChild(timeDisplay);
    }
  }
  
  if (!document.getElementById('dayDisplay')) {
    console.log("Creating missing dayDisplay element");
    
    const header = document.querySelector('header');
    if (header) {
      const dayDisplay = document.createElement('div');
      dayDisplay.id = 'dayDisplay';
      dayDisplay.textContent = 'Day 1';
      header.appendChild(dayDisplay);
    }
  }
}

// Export functions for external use
window.uiEnhancements = {
  updateNarrativeTimeClass,
  enhanceActionButtons,
  createSkillCard,
  createRelationshipCards,
  fixUpdateTimeAndDayFunction
};

// Start initialization
initializeUIEnhancements();
