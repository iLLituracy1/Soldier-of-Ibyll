// COMPREHENSIVE PROFILE FIX
// This is a completely standalone fix for profile issues
// It creates a new profile panel independent of existing code

(function() {
  // Debug mode
  const DEBUG = true;
  
  // Log helper
  function log(message) {
    if (DEBUG) {
      console.log(`%c[Profile Fix] ${message}`, 'color: #4CAF50; font-weight: bold;');
    }
  }
  
  log("Initializing comprehensive profile fix");
  
  // Create a new profile system with a different ID to avoid conflicts
  function createNewProfileSystem() {
    log("Creating new profile system");
    
    // Create new profile panel with unique ID
    const newProfilePanel = document.createElement('div');
    newProfilePanel.id = 'fixed-profile-panel';
    newProfilePanel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      max-width: 800px;
      max-height: 80vh;
      background: #1a1a1a;
      border: 3px solid #c9a959;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
      z-index: 9999;
      overflow-y: auto;
      display: none;
      font-family: 'Crimson Text', serif;
    `;
    
    // Create content
    newProfilePanel.innerHTML = `
      <h2 style="color: #c9a959; margin-top: 0; text-align: center; border-bottom: 1px solid #3a2e40; padding-bottom: 10px;">
        Character Profile
      </h2>
      <div id="fixed-profile-content"></div>
      <button id="fixed-profile-close" style="
        background: #3a2e40;
        color: #e0e0e0;
        border: 1px solid #c9a959;
        padding: 8px 16px;
        margin-top: 20px;
        cursor: pointer;
        display: block;
        margin-left: auto;
        border-radius: 4px;
      ">Close</button>
    `;
    
    // Add to document
    document.body.appendChild(newProfilePanel);
    
    // Add close handler
    document.getElementById('fixed-profile-close').addEventListener('click', function() {
      newProfilePanel.style.display = 'none';
    });
    
    // Also close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && newProfilePanel.style.display === 'block') {
        newProfilePanel.style.display = 'none';
      }
    });
    
    log("New profile panel created");
    return newProfilePanel;
  }
  
  // Create or update profile button
  function setupProfileButton() {
    log("Setting up profile button");
    
    // Try to find existing profile button in sidebar
    const existingButton = document.querySelector('.sidebar-nav-button[data-action="profile"]');
    
    if (existingButton) {
      log("Found existing profile button in sidebar");
      
      // Clone to remove existing listeners
      const newButton = existingButton.cloneNode(true);
      existingButton.parentNode.replaceChild(newButton, existingButton);
      
      // Add our own click handler
      newButton.addEventListener('click', showFixedProfile);
      
      return newButton;
    } else {
      // No sidebar button found, create a floating button
      log("Creating new floating profile button");
      
      const floatingButton = document.createElement('button');
      floatingButton.textContent = 'Profile';
      floatingButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9000;
        background: #c9a959;
        color: #000;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
      `;
      
      floatingButton.addEventListener('click', showFixedProfile);
      document.body.appendChild(floatingButton);
      
      return floatingButton;
    }
  }
  
  // Show the fixed profile panel with content
  function showFixedProfile() {
    log("Showing fixed profile");
    
    const panel = document.getElementById('fixed-profile-panel');
    if (!panel) {
      log("Panel not found, creating it");
      const newPanel = createNewProfileSystem();
      updateProfileContent();
      newPanel.style.display = 'block';
    } else {
      updateProfileContent();
      panel.style.display = 'block';
    }
  }
  
  // Update profile content with player data
  function updateProfileContent() {
    log("Updating profile content");
    
    const contentDiv = document.getElementById('fixed-profile-content');
    if (!contentDiv) {
      log("Content div not found!");
      return;
    }
    
    // Load player data with error handling
    try {
      if (!window.player) {
        contentDiv.innerHTML = '<p style="color: #ff5555;">Error: Player data not available!</p>';
        log("Player data not available");
        return;
      }
      
      // Debug output of player object
      log("Player data: " + JSON.stringify({
        name: window.player.name,
        origin: window.player.origin,
        career: window.player.career ? window.player.career.title : 'Unknown',
        phy: window.player.phy,
        men: window.player.men
      }));
      
      // Calculate skill caps
      const phy = Number(window.player.phy || 0);
      const men = Number(window.player.men || 0);
      const meleeCap = Math.floor(phy / 1.5);
      const marksmanshipCap = Math.floor((phy + men) / 3);
      const survivalCap = Math.floor((phy + men) / 3);
      const commandCap = Math.floor((men * 0.8 + phy * 0.2) / 1.5);
      const mentalSkillCap = Math.floor(men / 1.5);
      
      // Get skills safely
      const skills = window.player.skills || {};
      const melee = Number(skills.melee || 0).toFixed(1);
      const marksmanship = Number(skills.marksmanship || 0).toFixed(1);
      const survival = Number(skills.survival || 0).toFixed(1);
      const command = Number(skills.command || 0).toFixed(1);
      const discipline = Number(skills.discipline || 0).toFixed(1);
      const tactics = Number(skills.tactics || 0).toFixed(1);
      const organization = Number(skills.organization || 0).toFixed(1);
      const arcana = Number(skills.arcana || 0).toFixed(1);
      
      // Get career and origin
      const origin = window.player.origin || 'Unknown';
      const career = window.player.career?.title || 'Unknown Career';
      
      // Get gameState properties
      const gameState = window.gameState || {};
      const level = gameState.level || 1;
      const experience = gameState.experience || 0;
      const skillPoints = gameState.skillPoints || 0;
      
      // Build HTML content
      let html = `
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="width: 80px; height: 80px; background: #3a2e40; color: #c9a959; 
                      border-radius: 50%; display: flex; align-items: center; justify-content: center;
                      font-size: 2.5em; margin-right: 20px;">👤</div>
          <div>
            <h3 style="margin: 0; color: #c9a959;">${window.player.name || 'Unknown'}</h3>
            <div style="color: #a0a0a0;">${origin} ${career}</div>
            <div style="margin-top: 5px;">
              <span style="background: #3a2e40; padding: 3px 8px; border-radius: 10px; font-size: 0.8em; margin-right: 5px;">
                Level ${level}
              </span>
              <span style="background: #3a2e40; padding: 3px 8px; border-radius: 10px; font-size: 0.8em; margin-right: 5px;">
                XP: ${experience}/${level * 100}
              </span>
              <span style="background: #3a2e40; padding: 3px 8px; border-radius: 10px; font-size: 0.8em;">
                Skill Points: ${skillPoints}
              </span>
            </div>
          </div>
        </div>
        
        <h3 style="color: #c9a959; border-bottom: 1px solid #3a2e40; padding-bottom: 5px;">Attributes</h3>
        <div style="display: flex; gap: 20px; margin-bottom: 20px;">
          <div style="flex: 1; background: #2a2a2a; padding: 15px; border-radius: 8px;">
            <div style="font-weight: bold;">Physical (PHY)</div>
            <div style="font-size: 1.5em; color: #c9a959; margin: 5px 0;">${phy.toFixed(1)}</div>
            <div style="color: #a0a0a0; font-size: 0.9em;">Max: 15</div>
          </div>
          <div style="flex: 1; background: #2a2a2a; padding: 15px; border-radius: 8px;">
            <div style="font-weight: bold;">Mental (MEN)</div>
            <div style="font-size: 1.5em; color: #c9a959; margin: 5px 0;">${men.toFixed(1)}</div>
            <div style="color: #a0a0a0; font-size: 0.9em;">Max: 15</div>
          </div>
        </div>
        
        <h3 style="color: #c9a959; border-bottom: 1px solid #3a2e40; padding-bottom: 5px;">Skills</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin-bottom: 20px;">
          <div style="background: #2a2a2a; padding: 15px; border-radius: 8px;">
            <div style="font-weight: bold;">Melee Combat</div>
            <div style="color: #c9a959;">${melee} / ${meleeCap}</div>
            <div style="color: #a0a0a0; font-size: 0.8em;">PHY based</div>
          </div>
          <div style="background: #2a2a2a; padding: 15px; border-radius: 8px;">
            <div style="font-weight: bold;">Marksmanship</div>
            <div style="color: #c9a959;">${marksmanship} / ${marksmanshipCap}</div>
            <div style="color: #a0a0a0; font-size: 0.8em;">PHY+MEN based</div>
          </div>
          <div style="background: #2a2a2a; padding: 15px; border-radius: 8px;">
            <div style="font-weight: bold;">Survival</div>
            <div style="color: #c9a959;">${survival} / ${survivalCap}</div>
            <div style="color: #a0a0a0; font-size: 0.8em;">PHY+MEN based</div>
          </div>
          <div style="background: #2a2a2a; padding: 15px; border-radius: 8px;">
            <div style="font-weight: bold;">Command</div>
            <div style="color: #c9a959;">${command} / ${commandCap}</div>
            <div style="color: #a0a0a0; font-size: 0.8em;">MEN+PHY based</div>
          </div>
          <div style="background: #2a2a2a; padding: 15px; border-radius: 8px;">
            <div style="font-weight: bold;">Discipline</div>
            <div style="color: #c9a959;">${discipline} / ${mentalSkillCap}</div>
            <div style="color: #a0a0a0; font-size: 0.8em;">MEN based</div>
          </div>
          <div style="background: #2a2a2a; padding: 15px; border-radius: 8px;">
            <div style="font-weight: bold;">Tactics</div>
            <div style="color: #c9a959;">${tactics} / ${mentalSkillCap}</div>
            <div style="color: #a0a0a0; font-size: 0.8em;">MEN based</div>
          </div>
          <div style="background: #2a2a2a; padding: 15px; border-radius: 8px;">
            <div style="font-weight: bold;">Organization</div>
            <div style="color: #c9a959;">${organization} / ${mentalSkillCap}</div>
            <div style="color: #a0a0a0; font-size: 0.8em;">MEN based</div>
          </div>
          <div style="background: #2a2a2a; padding: 15px; border-radius: 8px;">
            <div style="font-weight: bold;">Arcana</div>
            <div style="color: #c9a959;">${arcana} / ${mentalSkillCap}</div>
            <div style="color: #a0a0a0; font-size: 0.8em;">MEN based</div>
          </div>
        </div>
      `;
      
      // Add relationships if available
      if (window.player.relationships) {
        html += `<h3 style="color: #c9a959; border-bottom: 1px solid #3a2e40; padding-bottom: 5px;">Relationships</h3>`;
        html += `<ul style="list-style-type: none; padding: 0; margin: 0;">`;
        
        for (const id in window.player.relationships) {
          const relationship = window.player.relationships[id];
          let dispositionText = "Neutral";
          let dispositionColor = "#aaa";
          
          if (relationship.disposition >= 30) {
            dispositionText = "Friendly";
            dispositionColor = "#4CAF50";
          }
          if (relationship.disposition >= 60) {
            dispositionText = "Trusted Ally";
            dispositionColor = "#2E7D32";
          }
          if (relationship.disposition <= -30) {
            dispositionText = "Distrustful";
            dispositionColor = "#FFC107";
          }
          if (relationship.disposition <= -60) {
            dispositionText = "Hostile";
            dispositionColor = "#F44336";
          }
          
          html += `
            <li style="background: #2a2a2a; padding: 10px 15px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between;">
              <span>${relationship.name || id}</span>
              <span style="color: ${dispositionColor};">${dispositionText}</span>
            </li>
          `;
        }
        
        html += `</ul>`;
      }
      
      // Update content
      contentDiv.innerHTML = html;
      log("Profile content updated successfully");
      
    } catch (error) {
      // Show error in profile
      contentDiv.innerHTML = `
        <p style="color: #ff5555;">Error updating profile: ${error.message}</p>
        <pre style="background: #2a2a2a; padding: 10px; overflow: auto; max-height: 200px; font-size: 12px;">${error.stack}</pre>
      `;
      log("Error updating profile: " + error.message);
      console.error(error);
    }
  }
  
  // Initialize the fix
  function init() {
    log("Initializing");
    
    // Ensure profile system exists
    createNewProfileSystem();
    
    // Set up profile button
    setupProfileButton();
    
    // Add keyboard shortcut (P key)
    document.addEventListener('keydown', function(e) {
      if (e.key === 'p' && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
        e.preventDefault();
        showFixedProfile();
      }
    });
    
    // Also ensure regular profile panel closing works
    const regularPanel = document.getElementById('profile');
    if (regularPanel) {
      const closeBtn = regularPanel.querySelector('.profile-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          regularPanel.classList.add('hidden');
        });
      }
    }
    
    log("Initialization complete");
  }
  
  // Wait for DOM to be loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already loaded
    init();
  }
})();
