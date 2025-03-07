// PROFILE DISPLAY FIX
// This script fixes the profile display issues by ensuring proper initialization
// and display of the profile panel

(function() {
  console.log("Profile Display Fix initializing...");
  
  // Wait for DOM to be loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Wait for the player object to be available
    const checkInterval = setInterval(() => {
      if (window.player && window.gameState) {
        clearInterval(checkInterval);
        applyProfileFix();
      }
    }, 500);
    
    // Safety timeout after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
  });
  
  // Apply the profile fix
  function applyProfileFix() {
    console.log("Applying profile display fix");
    
    // First, ensure the profile panel exists with the correct structure
    ensureProfilePanelExists();
    
    // Fix the handleProfile function
    fixHandleProfileFunction();
    
    // Fix the profile button in the sidebar
    fixProfileButton();
    
    console.log("Profile display fix applied");
  }
  
  // Ensure the profile panel exists and has the necessary structure
  function ensureProfilePanelExists() {
    let profilePanel = document.getElementById('profile');
    
    // If the panel doesn't exist, create it
    if (!profilePanel) {
      profilePanel = document.createElement('div');
      profilePanel.id = 'profile';
      profilePanel.className = 'hidden';
      document.body.appendChild(profilePanel);
      console.log("Created missing profile panel");
    }
    
    // Ensure the panel has the correct content structure
    if (!profilePanel.querySelector('#profileText')) {
      // Clear any existing content
      profilePanel.innerHTML = `
        <h3>Your Profile</h3>
        <div id="profileText"></div>
        <button class="menu-button profile-close">Close</button>
      `;
      
      // Add close button event listener
      const closeButton = profilePanel.querySelector('.profile-close');
      if (closeButton) {
        closeButton.addEventListener('click', function() {
          profilePanel.classList.add('hidden');
        });
      }
      
      console.log("Restored profile panel structure");
    }
    
    // Make sure the CSS for the profile panel is correct
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      #profile {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 80%;
        max-width: 800px;
        max-height: 80vh;
        background: #1a1a1a;
        border: 2px solid #c9a959;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        z-index: 1000;
        overflow-y: auto;
      }
      
      #profile.hidden {
        display: none !important;
      }
      
      #profile h3 {
        color: #c9a959;
        margin-top: 0;
        border-bottom: 1px solid #3a2e40;
        padding-bottom: 10px;
      }
      
      .profile-close {
        margin-top: 15px;
      }
      
      /* Enhanced styling for character info */
      .character-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 20px;
      }
      
      .character-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: #3a2e40;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2.5em;
        position: relative;
      }
      
      .character-badge {
        position: absolute;
        bottom: -5px;
        right: -5px;
        background: #1a1a1a;
        border: 1px solid #c9a959;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .skill-card {
        background: #2a2a2a;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 10px;
      }
      
      .skills-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 15px;
      }
    `;
    document.head.appendChild(styleElement);
  }
  
  // Fix the handleProfile function to properly display character info
  function fixHandleProfileFunction() {
    // Store original function if it exists
    const originalHandleProfile = window.handleProfile;
    
    // Create a new implementation that won't conflict with others
    window.handleProfile = function() {
      console.log("Running fixed handleProfile function");
      
      // Get the profile panel and ensure it's visible
      const profilePanel = document.getElementById('profile');
      if (!profilePanel) {
        console.error("Profile panel not found!");
        return;
      }
      
      // Show the panel
      profilePanel.classList.remove('hidden');
      
      // Get the profile content container
      const profileText = document.getElementById('profileText');
      if (!profileText) {
        console.error("Profile content container not found!");
        return;
      }
      
      try {
        // Check if we have valid player data
        if (!window.player || !window.player.name || !window.player.origin || 
            !window.player.career || !window.player.career.title) {
          profileText.innerHTML = "<p>Player data not fully initialized.</p>";
          return;
        }
        
        // Calculate skill caps
        const meleeCap = Math.floor(window.player.phy / 1.5);
        const marksmanshipCap = Math.floor((window.player.phy + window.player.men) / 3);
        const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
        const commandCap = Math.floor((window.player.men * 0.8 + window.player.phy * 0.2) / 1.5);
        const mentalSkillCap = Math.floor(window.player.men / 1.5);
        
        // Create avatar emoji based on origin
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
        
        // Build enhanced profile with styled content
        profileText.innerHTML = `
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
            <h3>Attributes</h3>
            <div>
              <p><strong>Physical (PHY):</strong> ${window.player.phy.toFixed(1)} / 15</p>
              <p><strong>Mental (MEN):</strong> ${window.player.men.toFixed(1)} / 15</p>
            </div>
          </div>
          
          <div class="skills-section">
            <h3>Skills</h3>
            <div class="skills-grid">
              <div class="skill-card">
                <div class="skill-name">Melee Combat</div>
                <div class="skill-value">${window.player.skills.melee.toFixed(1)} / ${meleeCap}</div>
                <div class="skill-desc">PHY based</div>
              </div>
              <div class="skill-card">
                <div class="skill-name">Marksmanship</div>
                <div class="skill-value">${window.player.skills.marksmanship.toFixed(1)} / ${marksmanshipCap}</div>
                <div class="skill-desc">PHY+MEN based</div>
              </div>
              <div class="skill-card">
                <div class="skill-name">Survival</div>
                <div class="skill-value">${window.player.skills.survival.toFixed(1)} / ${survivalCap}</div>
                <div class="skill-desc">PHY+MEN based</div>
              </div>
              <div class="skill-card">
                <div class="skill-name">Command</div>
                <div class="skill-value">${window.player.skills.command.toFixed(1)} / ${commandCap}</div>
                <div class="skill-desc">MEN+some PHY based</div>
              </div>
              <div class="skill-card">
                <div class="skill-name">Discipline</div>
                <div class="skill-value">${window.player.skills.discipline.toFixed(1)} / ${mentalSkillCap}</div>
                <div class="skill-desc">MEN based</div>
              </div>
              <div class="skill-card">
                <div class="skill-name">Tactics</div>
                <div class="skill-value">${window.player.skills.tactics.toFixed(1)} / ${mentalSkillCap}</div>
                <div class="skill-desc">MEN based</div>
              </div>
              <div class="skill-card">
                <div class="skill-name">Organization</div>
                <div class="skill-value">${window.player.skills.organization.toFixed(1)} / ${mentalSkillCap}</div>
                <div class="skill-desc">MEN based</div>
              </div>
              <div class="skill-card">
                <div class="skill-name">Arcana</div>
                <div class="skill-value">${window.player.skills.arcana.toFixed(1)} / ${mentalSkillCap}</div>
                <div class="skill-desc">MEN based</div>
              </div>
            </div>
          </div>
        `;
        
        // Add relationships section
        if (window.player.relationships) {
          let relationshipsHTML = `<div class="relationships-section"><h3>Relationships</h3><ul>`;
          
          for (const id in window.player.relationships) {
            const relationship = window.player.relationships[id];
            let dispositionText = "Neutral";
            if (relationship.disposition >= 30) dispositionText = "Friendly";
            if (relationship.disposition >= 60) dispositionText = "Trusted Ally";
            if (relationship.disposition <= -30) dispositionText = "Distrustful";
            if (relationship.disposition <= -60) dispositionText = "Hostile";
            
            relationshipsHTML += `<li>${relationship.name}: ${dispositionText} (${relationship.disposition})</li>`;
          }
          
          relationshipsHTML += `</ul></div>`;
          profileText.innerHTML += relationshipsHTML;
        }
        
        console.log("Profile content updated successfully");
      } catch (error) {
        console.error("Error updating profile content:", error);
        profileText.innerHTML = `<p>Error displaying profile: ${error.message}</p>`;
        
        // Try to fall back to original function if available
        if (typeof originalHandleProfile === 'function') {
          try {
            console.log("Attempting to fall back to original handleProfile");
            originalHandleProfile();
          } catch (fallbackError) {
            console.error("Error in original handleProfile:", fallbackError);
          }
        }
      }
    };
  }
  
  // Fix the profile button in sidebar to properly open the profile panel
  function fixProfileButton() {
    // Check for the sidebar profile button
    const profileButton = document.querySelector('.sidebar-nav-button[data-action="profile"]');
    
    if (profileButton) {
      // Remove any existing click handlers
      const newButton = profileButton.cloneNode(true);
      profileButton.parentNode.replaceChild(newButton, profileButton);
      
      // Add a direct click handler
      newButton.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        
        // Directly call our fixed handler instead of going through handleAction
        window.handleProfile();
      });
      
      console.log("Profile button fixed");
    } else {
      console.log("Sidebar profile button not found");
    }
    
    // Add keyboard shortcut for profile
    document.addEventListener('keydown', function(event) {
      // Press 'P' key for profile
      if (event.key === 'p' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        window.handleProfile();
      }
    });
  }
})();
