// UI FUNCTIONS MODULE
// Functions related to UI updates and rendering with integrated time management

// Update time and day display function
window.updateTimeAndDay = function(minutesToAdd) {
  // Use TimeManager to advance time
  const newTime = window.TimeManager.advanceTime(minutesToAdd);
  
  // Update time display
  document.getElementById('timeDisplay').textContent = `Time: ${newTime.hour12}`;
  document.getElementById('dayDisplay').textContent = `${newTime.monthName} ${newTime.day}, Year ${newTime.year}`;
  
  // Update day/night indicator
  const timeIndicator = document.getElementById('dayNightIndicator');
  timeIndicator.className = `day-night-indicator time-${window.getTimeOfDay()}`;
  
  // Update action buttons and other time-dependent systems
  window.updateActionButtons();
  
  // Check for campaign introduction if needed
  if (newTime.day >= 3 && !window.gameState.campaignIntroduced && !window.gameState.currentCampaign) {
    window.gameState.campaignIntroduced = true;
    window.showCampaignIntroduction();
  }
  
  return newTime;
};

// Function to get time of day
window.getTimeOfDay = function() {
  const hour = window.TimeManager.getCurrentTime().hourOfDay;
  
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 18) return 'day';
  if (hour >= 18 && hour < 21) return 'evening';
  return 'night';
};

// Update action buttons function
window.updateActionButtons = function() {
  // Get current time details
  const currentTime = window.TimeManager.getCurrentTime();
  const hour = currentTime.hourOfDay;
  
  // Update action buttons based on time of day, location, etc.
  const actionsContainer = document.getElementById('actions');
  actionsContainer.innerHTML = '';

  // Check for special commander report state
  if (window.gameState.awaitingCommanderReport) {
    // Create special button for campaign introduction
    const reportButton = document.createElement('button');
    reportButton.className = 'action-btn';
    reportButton.id = 'report-to-commander';
    reportButton.textContent = 'Report to Commander';
    
    reportButton.onclick = function() {
      // Clear the special state
      window.gameState.awaitingCommanderReport = false;
      
      // Show campaign briefing
      window.setNarrative(`
        <p>You enter the command tent to find Commander Valarius bent over maps of the western territories. He looks up as you enter, acknowledging you with a curt nod.</p>
        <p>"We've received orders from high command," he says, gesturing to the map. "The Empire is pushing west, into Arrasi territory. Your unit will be deployed to secure the borderlands."</p>
        <p>The commander outlines the strategic importance of the peninsula and the resources it would bring to the Empire. You can tell this is a major campaign, not just a border skirmish.</p>
        <p>"Prepare yourself," Valarius concludes. "Report back here tomorrow for your specific mission assignments. This campaign will test everything you've learned so far."</p>
      `);
      
      // Check if campaign initialization function exists
      if (typeof window.initiateCampaign === 'function') {
        window.initiateCampaign('arrasi_campaign');
      } else {
        console.error("Campaign system not loaded: window.initiateCampaign is not a function");
        // Fallback: create a simple campaign object
        window.gameState.currentCampaign = {
          id: 'c' + Date.now().toString(36),
          type: 'arrasi_campaign',
          name: "Arrasi Peninsula Campaign",
          description: "Push west into Arrasi territory to secure the peninsula.",
          currentStage: 1,
          completedMissions: [],
          state: "active"
        };
        window.gameState.mainQuest.stage = 1;
        window.addToNarrative("<p>Campaign initialized. Report back tomorrow for mission assignments.</p>");
      }
      
      // Update action buttons without the special button
      window.updateActionButtons();
    };
    
    actionsContainer.appendChild(reportButton);
    return; // Exit early so no other buttons are added
  }
  
  // No other significant changes to existing logic
  // ... (rest of the existing updateActionButtons logic remains the same)
};

// Keep other UI functions like updateStatusBars, handleProfile, etc. the same
// This is just the time-related portion of the UI functions
