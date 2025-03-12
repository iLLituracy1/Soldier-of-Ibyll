// SHIELDWALL BATTLE SYSTEM MODULE
// Handles large-scale formation battle mechanics

/**
 * The Shieldwall System provides an immersive large-scale battle experience
 * where players participate as part of a formation. It features:
 * - Formation Cohesion: Actions affect both individual and unit integrity
 * - Dynamic Battle Flow: Narrative-driven combat with changing conditions
 * - External Hazards: Projectiles and threats requiring reaction checks
 * - Skill Integration: Uses player's Discipline and Survival skills
 * - Rich Descriptions: Creates immersion through detailed battle narration
 */

window.ShieldwallSystem = {
  // Current battle state
  state: {
    active: false,
    battleType: null,
    phase: "preparation", // preparation, engagement, combat, resolution
    round: 0,
    maxRounds: 10,
    
    // Formation status
    formation: "shieldwall",
    cohesion: 100, // 0-100 scale
    morale: 100, // 0-100 scale
    casualtyRate: 0, // 0-100 scale
    
    // Hazards and threats
    activeThreats: [],
    
    // Battle outcome tracking
    objectivesSecured: 0,
    totalObjectives: 3,
    playerWounds: 0,
    
    // Related quest info
    questId: null
  },
  
  // Formation types with their base stats
  formationTypes: {
    "shieldwall": {
      name: "Shieldwall",
      cohesionBonus: 20,
      defensiveBonus: 15,
      offensiveBonus: 0,
      mobilityPenalty: 10,
      description: "A tight wall of interlocked shields that provides excellent protection against frontal attacks, especially missile fire."
    },
    "maniple": {
      name: "Maniple",
      cohesionBonus: 10,
      defensiveBonus: 5,
      offensiveBonus: 10,
      mobilityPenalty: 5,
      description: "A flexible, checkerboard formation that allows for greater mobility while maintaining good defensive capabilities."
    },
    "wedge": {
      name: "Wedge",
      cohesionBonus: 5,
      defensiveBonus: 0,
      offensiveBonus: 20,
      mobilityPenalty: 0,
      description: "An aggressive, spearhead formation designed to break through enemy lines but vulnerable on the flanks."
    }
  },
  
  // Battle type templates
  battleTemplates: {
    "arrasi_raid": {
      name: "Raid on Arrasi Settlement",
      description: "A raid on an Arrasi settlement to secure supplies and gather intelligence.",
      objectives: [
        "Secure the granary",
        "Capture military supplies",
        "Neutralize defensive positions"
      ],
      enemyType: "arrasi_militia",
      terrainType: "settlement",
      narrativeIntro: "Your company advances toward the Arrasi settlement in formation. The sun has nearly set, casting long shadows across the fields. Ahead, sentries on the walls spot your approach and raise the alarm. Horns sound, and defenders rush to take positions."
    },
    "border_skirmish": {
      name: "Border Skirmish",
      description: "A clash with Arrasi border forces at a contested checkpoint.",
      objectives: [
        "Secure the checkpoint",
        "Hold against counterattack",
        "Destroy enemy fortifications"
      ],
      enemyType: "arrasi_border_guard",
      terrainType: "borderlands",
      narrativeIntro: "Your company approaches the border checkpoint, a wooden palisade flying Arrasi colors. The defenders have spotted you and are forming up in a hasty defensive line. The captain raises his sword, signaling your formation to advance."
    }
  },
  
  // Initialize the battle system
  initialize: function() {
    console.log("Initializing Shieldwall battle system...");
    
    // Add battle UI
    this.initializeBattleUI();
    
    console.log("Shieldwall system initialized");
  },
  
  // Initialize battle UI components
  initializeBattleUI: function() {
    // Create battle interface if it doesn't exist
    if (!document.getElementById('shieldwall-battle')) {
      const battleContainer = document.createElement('div');
      battleContainer.id = 'shieldwall-battle';
      battleContainer.className = 'battle-modal hidden';
      
      // Create battle interface HTML
      battleContainer.innerHTML = `
        <div class="battle-interface">
          <div class="battle-header">
            <h2 id="battle-title">Formation Battle</h2>
            <div class="battle-status">
              <div class="battle-phase">
                <span class="status-label">Phase:</span>
                <span id="battle-phase-display">Preparation</span>
              </div>
              <div class="battle-round">
                <span class="status-label">Progress:</span>
                <span id="battle-round-display">0/10</span>
              </div>
            </div>
          </div>
          
          <div class="battle-main">
            <div class="battle-narrative" id="battle-narrative">
              <!-- Battle narrative will appear here -->
            </div>
            
            <div class="battle-status-panel">
              <div class="formation-status">
                <h3>Formation Status</h3>
                
                <div class="status-item">
                  <div class="status-label">Formation:</div>
                  <div id="formation-type">Shieldwall</div>
                </div>
                
                <div class="status-item">
                  <div class="status-label">Cohesion:</div>
                  <div class="status-bar-container">
                    <div id="cohesion-bar" class="status-bar cohesion-bar" style="width: 100%"></div>
                  </div>
                  <div id="cohesion-value">100%</div>
                </div>
                
                <div class="status-item">
                  <div class="status-label">Morale:</div>
                  <div class="status-bar-container">
                    <div id="morale-bar" class="status-bar morale-bar" style="width: 100%"></div>
                  </div>
                  <div id="morale-value">100%</div>
                </div>
                
                <div class="status-item">
                  <div class="status-label">Casualties:</div>
                  <div class="status-bar-container">
                    <div id="casualty-bar" class="status-bar casualty-bar" style="width: 0%"></div>
                  </div>
                  <div id="casualty-value">0%</div>
                </div>
              </div>
              
              <div class="objectives-panel">
                <h3>Objectives</h3>
                <div id="objectives-list" class="objectives-list">
                  <!-- Objectives will be listed here -->
                </div>
              </div>
            </div>
          </div>
          
          <div class="battle-controls" id="battle-controls">
            <!-- Battle control buttons will appear here -->
          </div>
        </div>
      `;
      
      // Add to document body
      document.body.appendChild(battleContainer);
      
      // Add styles for the battle interface
      const style = document.createElement('style');
      style.textContent = `
        .battle-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .battle-modal.hidden {
          display: none;
        }
        
        .battle-interface {
          width: 90%;
          max-width: 900px;
          height: 90vh;
          background: #1a1a1a;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.7);
          overflow: hidden;
        }
        
        .battle-header {
          background: #2a2a2a;
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #444;
        }
        
        .battle-header h2 {
          margin: 0;
          color: #a0a0ff;
        }
        
        .battle-status {
          display: flex;
          gap: 20px;
        }
        
        .battle-phase, .battle-round {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .battle-main {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        
        .battle-narrative {
          flex: 2;
          padding: 20px;
          overflow-y: auto;
          max-height: calc(90vh - 130px);
        }
        
        .battle-status-panel {
          flex: 1;
          background: #222;
          padding: 15px;
          border-left: 1px solid #444;
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow-y: auto;
        }
        
        .formation-status, .objectives-panel {
          background: #2a2a2a;
          border-radius: 8px;
          padding: 15px;
        }
        
        .formation-status h3, .objectives-panel h3 {
          margin-top: 0;
          color: #a0a0ff;
          margin-bottom: 15px;
        }
        
        .status-item {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          flex-wrap: wrap;
        }
        
        .status-label {
          flex: 0 0 100px;
          font-weight: bold;
        }
        
        .status-bar-container {
          flex: 1;
          height: 10px;
          background: #444;
          border-radius: 5px;
          overflow: hidden;
          margin: 0 10px;
        }
        
        .status-bar {
          height: 100%;
          border-radius: 5px;
          transition: width 0.5s;
        }
        
        .cohesion-bar { background: linear-gradient(to right, #4776E6, #8E54E9); }
        .morale-bar { background: linear-gradient(to right, #56ab2f, #a8e063); }
        .casualty-bar { background: linear-gradient(to right, #ff5f6d, #ffc371); }
        
        .objectives-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .objective-item {
          padding: 10px;
          background: #333;
          border-radius: 5px;
          border-left: 3px solid #666;
        }
        
        .objective-complete {
          border-left-color: #4CAF50;
          background: rgba(76, 175, 80, 0.2);
        }
        
        .battle-controls {
          padding: 15px;
          border-top: 1px solid #444;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .battle-btn {
          padding: 10px 20px;
          background: #333;
          color: #fff;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .battle-btn:hover {
          background: #444;
          transform: translateY(-2px);
        }
        
        .battle-btn:active {
          transform: translateY(1px);
        }
        
        .battle-btn.reaction {
          background: #a0a0ff;
          color: #000;
        }
        
        .battle-btn.reaction:hover {
          background: #b8b8ff;
        }
        
        .battle-btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .battle-btn.disabled:hover {
          transform: none;
        }
        
        .battle-btn.primary {
          background: #2a623d;
        }
        
        .battle-btn.primary:hover {
          background: #367a4d;
        }
        
        .battle-btn.danger {
          background: #a32f2f;
        }
        
        .battle-btn.danger:hover {
          background: #bd3a3a;
        }
        
        .narrative-entry {
          margin-bottom: 15px;
          border-left: 3px solid #444;
          padding-left: 10px;
        }
        
        .narrative-player {
          border-left-color: #a0a0ff;
        }
        
        .narrative-enemy {
          border-left-color: #ff5f6d;
        }
        
        .narrative-alert {
          border-left-color: #ffc371;
          font-weight: bold;
        }
        
        .narrative-event {
          border-left-color: #a8e063;
        }
        
        .hazard-warning {
          animation: hazard-flash 1s infinite;
          font-weight: bold;
          color: #ff5f6d;
        }
        
        @keyframes hazard-flash {
          0% { color: #ff5f6d; }
          50% { color: #fff; }
          100% { color: #ff5f6d; }
        }
        
        .reaction-check {
          background: rgba(160, 160, 255, 0.2);
          border: 1px solid #a0a0ff;
          border-radius: 8px;
          padding: 15px;
          margin: 15px 0;
        }
        
        .reaction-check-title {
          font-weight: bold;
          color: #a0a0ff;
          margin-bottom: 10px;
        }
        
        .reaction-options {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
        }
      `;
      
      document.head.appendChild(style);
    }
  },
  
  // Start a new battle
  initiateBattle: function(battleType, options = {}) {
    console.log("Initiating battle:", battleType);
    
    // Get battle template
    const template = this.battleTemplates[battleType];
    if (!template) {
      console.error("Battle template not found:", battleType);
      return;
    }
    
    // Initialize battle state
    this.state = {
      active: true,
      battleType: battleType,
      phase: "preparation",
      round: 0,
      maxRounds: 10,
      
      // Formation status
      formation: options.formation || "shieldwall",
      cohesion: 100,
      morale: 100,
      casualtyRate: 0,
      
      // Hazards and threats
      activeThreats: [],
      
      // Battle outcome tracking
      objectivesSecured: 0,
      totalObjectives: template.objectives.length,
      playerWounds: 0,
      
      // Preparedness bonus from quest activities
      preparednessBonus: options.preparednessBonus || 0,
      
      // Related quest info
      questId: options.questId || null
    };
    
    // Set up the battle interface
    this.renderBattleInterface(template);
    
    // Show the battle modal
    const battleModal = document.getElementById('shieldwall-battle');
    if (battleModal) {
      battleModal.classList.remove('hidden');
    }
    
    // Start the battle sequence
    this.startBattleSequence(template);
  },
  
  // Render the battle interface
  renderBattleInterface: function(template) {
    // Set battle title
    document.getElementById('battle-title').textContent = template.name;
    
    // Set phase display
    document.getElementById('battle-phase-display').textContent = "Preparation";
    
    // Set round display
    document.getElementById('battle-round-display').textContent = `0/${this.state.maxRounds}`;
    
    // Set formation type
    document.getElementById('formation-type').textContent = this.formationTypes[this.state.formation].name;
    
    // Set formation status bars
    document.getElementById('cohesion-bar').style.width = '100%';
    document.getElementById('cohesion-value').textContent = '100%';
    
    document.getElementById('morale-bar').style.width = '100%';
    document.getElementById('morale-value').textContent = '100%';
    
    document.getElementById('casualty-bar').style.width = '0%';
    document.getElementById('casualty-value').textContent = '0%';
    
    // Clear the battle narrative
    document.getElementById('battle-narrative').innerHTML = "";
    
    // Set up objectives
    const objectivesList = document.getElementById('objectives-list');
    objectivesList.innerHTML = "";
    
    template.objectives.forEach((objective, index) => {
      const objectiveItem = document.createElement('div');
      objectiveItem.className = 'objective-item';
      objectiveItem.dataset.index = index;
      objectiveItem.textContent = objective;
      objectivesList.appendChild(objectiveItem);
    });
    
    // Clear battle controls
    document.getElementById('battle-controls').innerHTML = "";
  },
  
  // Start the battle sequence
  startBattleSequence: function(template) {
    // Add initial narrative
    this.addBattleNarrative(template.narrativeIntro, 'event');
    
    // Add initial control buttons
    this.renderPreparationControls();
  },
  
  // Add a narrative entry to the battle log
  addBattleNarrative: function(text, type = 'normal') {
    const narrativeContainer = document.getElementById('battle-narrative');
    if (!narrativeContainer) return;
    
    const entry = document.createElement('div');
    entry.className = `narrative-entry narrative-${type}`;
    entry.innerHTML = text;
    
    narrativeContainer.appendChild(entry);
    
    // Scroll to bottom
    narrativeContainer.scrollTop = narrativeContainer.scrollHeight;
  },
  
  // Update the battle status display
  updateBattleStatus: function() {
    // Update cohesion
    document.getElementById('cohesion-bar').style.width = `${this.state.cohesion}%`;
    document.getElementById('cohesion-value').textContent = `${Math.round(this.state.cohesion)}%`;
    
    // Update morale
    document.getElementById('morale-bar').style.width = `${this.state.morale}%`;
    document.getElementById('morale-value').textContent = `${Math.round(this.state.morale)}%`;
    
    // Update casualty rate
    document.getElementById('casualty-bar').style.width = `${this.state.casualtyRate}%`;
    document.getElementById('casualty-value').textContent = `${Math.round(this.state.casualtyRate)}%`;
    
    // Update phase
    document.getElementById('battle-phase-display').textContent = 
      this.state.phase.charAt(0).toUpperCase() + this.state.phase.slice(1);
    
    // Update round
    document.getElementById('battle-round-display').textContent = 
      `${this.state.round}/${this.state.maxRounds}`;
    
    // Update objectives if any are completed
    const objectives = document.querySelectorAll('.objective-item');
    for (let i = 0; i < objectives.length; i++) {
      if (i < this.state.objectivesSecured) {
        objectives[i].classList.add('objective-complete');
      }
    }
  },
  
  // Render the preparation phase controls
  renderPreparationControls: function() {
    const controlsContainer = document.getElementById('battle-controls');
    controlsContainer.innerHTML = "";
    
    // Add control buttons
    const startButton = document.createElement('button');
    startButton.className = 'battle-btn primary';
    startButton.textContent = 'Begin Advance';
    startButton.addEventListener('click', () => this.startEngagementPhase());
    controlsContainer.appendChild(startButton);
    
    // Add formation selection if more formations are available
    if (Object.keys(this.formationTypes).length > 1) {
      const formationButton = document.createElement('button');
      formationButton.className = 'battle-btn';
      formationButton.textContent = 'Change Formation';
      formationButton.addEventListener('click', () => this.showFormationSelection());
      controlsContainer.appendChild(formationButton);
    }
  },
  
  // Show formation selection dialog
  showFormationSelection: function() {
    // Create modal dialog
    const dialogId = 'formation-selection-dialog';
    let dialog = document.getElementById(dialogId);
    
    // Create dialog if it doesn't exist
    if (!dialog) {
      dialog = document.createElement('div');
      dialog.id = dialogId;
      dialog.className = 'formation-dialog';
      document.body.appendChild(dialog);
      
      // Add styles for the dialog
      const style = document.createElement('style');
      style.textContent = `
        .formation-dialog {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1100;
        }
        
        .formation-dialog-content {
          background: #2a2a2a;
          width: 500px;
          max-width: 90%;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
        }
        
        .formation-dialog-title {
          color: #a0a0ff;
          margin-top: 0;
          margin-bottom: 15px;
          border-bottom: 1px solid #444;
          padding-bottom: 10px;
        }
        
        .formation-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .formation-option {
          background: #333;
          border-radius: 5px;
          padding: 15px;
          cursor: pointer;
          transition: all 0.3s;
          border: 1px solid transparent;
        }
        
        .formation-option:hover {
          background: #444;
        }
        
        .formation-option.selected {
          border-color: #a0a0ff;
          background: rgba(160, 160, 255, 0.1);
        }
        
        .formation-name {
          font-weight: bold;
          color: #a0a0ff;
          margin-bottom: 5px;
        }
        
        .formation-stats {
          display: flex;
          gap: 10px;
          margin: 10px 0;
          flex-wrap: wrap;
        }
        
        .formation-stat {
          background: #222;
          padding: 5px 10px;
          border-radius: 3px;
          font-size: 0.9em;
        }
        
        .formation-dialog-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }
      `;
      
      document.head.appendChild(style);
    }
    
    // Populate dialog content
    dialog.innerHTML = `
      <div class="formation-dialog-content">
        <h3 class="formation-dialog-title">Select Formation</h3>
        
        <div class="formation-options">
          ${Object.entries(this.formationTypes).map(([key, formation]) => `
            <div class="formation-option ${key === this.state.formation ? 'selected' : ''}" data-formation="${key}">
              <div class="formation-name">${formation.name}</div>
              <div class="formation-description">${formation.description}</div>
              <div class="formation-stats">
                <div class="formation-stat">Cohesion: +${formation.cohesionBonus}</div>
                <div class="formation-stat">Defense: +${formation.defensiveBonus}</div>
                <div class="formation-stat">Offense: +${formation.offensiveBonus}</div>
                <div class="formation-stat">Mobility: -${formation.mobilityPenalty}</div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="formation-dialog-actions">
          <button id="confirm-formation-btn" class="battle-btn primary">Confirm</button>
          <button id="cancel-formation-btn" class="battle-btn">Cancel</button>
        </div>
      </div>
    `;
    
    // Show the dialog
    dialog.style.display = 'flex';
    
    // Add event listeners for formation options
    dialog.querySelectorAll('.formation-option').forEach(option => {
      option.addEventListener('click', function() {
        // Remove selected class from all options
        dialog.querySelectorAll('.formation-option').forEach(opt => {
          opt.classList.remove('selected');
        });
        
        // Add selected class to clicked option
        this.classList.add('selected');
      });
    });
    
    // Add event listeners for buttons
    document.getElementById('confirm-formation-btn').addEventListener('click', () => {
      // Get selected formation
      const selectedOption = dialog.querySelector('.formation-option.selected');
      if (selectedOption) {
        const formationKey = selectedOption.dataset.formation;
        this.changeFormation(formationKey);
      }
      
      // Hide dialog
      dialog.style.display = 'none';
    });
    
    document.getElementById('cancel-formation-btn').addEventListener('click', () => {
      // Just hide the dialog
      dialog.style.display = 'none';
    });
  },
  
  // Change the current formation
  changeFormation: function(formationKey) {
    if (!this.formationTypes[formationKey]) return;
    
    const oldFormation = this.state.formation;
    this.state.formation = formationKey;
    
    // Update formation display
    document.getElementById('formation-type').textContent = 
      this.formationTypes[formationKey].name;
    
    // Add narrative about formation change
    this.addBattleNarrative(
      `The Sarkein signals for the company to shift into ${this.formationTypes[formationKey].name} formation. The ranks adjust with practiced efficiency, shields and weapons repositioning for the new tactical stance.`,
      'event'
    );
    
    console.log(`Formation changed from ${oldFormation} to ${formationKey}`);
  },
  
  // Start the engagement phase of battle
  startEngagementPhase: function() {
    this.state.phase = "engagement";
    
    // Add narrative
    this.addBattleNarrative(
      "At the Sarkein's command, your formation begins its advance toward the enemy. Shields overlap, weapons at the ready. The rhythmic sound of marching fills the air as you move as one unit, maintaining cohesion with your comrades on either side.",
      'event'
    );
    
    // Update battle status
    this.updateBattleStatus();
    
    // Replace controls with engagement options
    const controlsContainer = document.getElementById('battle-controls');
    controlsContainer.innerHTML = "";
    
    // Add control buttons
    const advanceButton = document.createElement('button');
    advanceButton.className = 'battle-btn primary';
    advanceButton.textContent = 'Continue Advance';
    advanceButton.addEventListener('click', () => this.handleEngagementAction('advance'));
    controlsContainer.appendChild(advanceButton);
    
    const cautiousButton = document.createElement('button');
    cautiousButton.className = 'battle-btn';
    cautiousButton.textContent = 'Advance Cautiously';
    cautiousButton.addEventListener('click', () => this.handleEngagementAction('cautious'));
    controlsContainer.appendChild(cautiousButton);
    
    const haltButton = document.createElement('button');
    haltButton.className = 'battle-btn';
    haltButton.textContent = 'Hold Position';
    haltButton.addEventListener('click', () => this.handleEngagementAction('hold'));
    controlsContainer.appendChild(haltButton);
    
    // Start engagement events
    setTimeout(() => this.triggerEngagementEvent(), 2000);
  },
  
  // Handle player choice during engagement phase
  handleEngagementAction: function(action) {
    switch (action) {
      case 'advance':
        // Standard advance - faster but more vulnerable
        this.addBattleNarrative(
          "You march forward with the formation, maintaining a steady pace. The enemy grows closer, and you can now make out individual defenders preparing to meet your advance.",
          'player'
        );
        
        // Higher chance of reaching combat phase quickly
        this.state.engagementProgress = (this.state.engagementProgress || 0) + 2;
        break;
        
      case 'cautious':
        // Cautious advance - slower but safer
        this.addBattleNarrative(
          "Your formation advances with caution, each step measured and deliberate. Shields remain tightly overlapped, providing maximum protection as you close the distance.",
          'player'
        );
        
        // Improve cohesion slightly
        this.state.cohesion = Math.min(100, this.state.cohesion + 5);
        
        // Slower progress
        this.state.engagementProgress = (this.state.engagementProgress || 0) + 1;
        break;
        
      case 'hold':
        // Hold position - recover cohesion but no progress
        this.addBattleNarrative(
          "The formation halts at your sergeant's command, allowing time to tighten ranks and adjust shields. The brief pause helps restore order to the line.",
          'player'
        );
        
        // Significant cohesion improvement
        this.state.cohesion = Math.min(100, this.state.cohesion + 10);
        break;
    }
    
    // Disable controls temporarily
    const controlsContainer = document.getElementById('battle-controls');
    const buttons = controlsContainer.querySelectorAll('button');
    buttons.forEach(button => {
      button.disabled = true;
      button.classList.add('disabled');
    });
    
    // Update battle status
    this.updateBattleStatus();
    
    // Continue with engagement events or progress to combat
    if (this.state.engagementProgress >= 5) {
      // Progress to combat phase
      setTimeout(() => this.startCombatPhase(), 2000);
    } else {
      // Continue engagement
      setTimeout(() => {
        // Re-enable controls
        buttons.forEach(button => {
          button.disabled = false;
          button.classList.remove('disabled');
        });
        
        // Trigger next engagement event
        this.triggerEngagementEvent();
      }, 2000);
    }
  },
  
  // Trigger a random engagement event
  triggerEngagementEvent: function() {
    // List of possible engagement events
    const events = [
      // Enemy missile fire
      () => {
        this.addBattleNarrative(
          "A volley of arrows arcs overhead from the enemy position, descending toward your formation. \"Shields up!\" comes the urgent command.",
          'enemy'
        );
        
        // Create a reaction check
        this.createReactionCheck(
          "Incoming Missile Fire",
          "Enemy archers have launched a volley at your formation. How do you respond?",
          [
            {
              label: "Raise Shield",
              callback: () => {
                // Check if successful based on discipline skill
                const disciplineSkill = window.player.skills.discipline || 0;
                const difficultyMod = 0.3; // Base success chance without skill
                const successChance = Math.min(0.9, difficultyMod + (disciplineSkill * 0.1));
                
                if (Math.random() < successChance) {
                  // Success
                  this.addBattleNarrative(
                    "You raise your shield just in time, the arrow thudding harmlessly against it. All around you, your comrades do the same, creating a solid roof of shields over the formation.",
                    'player'
                  );
                  
                  // Slight cohesion improvement
                  this.state.cohesion = Math.min(100, this.state.cohesion + 5);
                } else {
                  // Partial success - you're fine but formation takes damage
                  this.addBattleNarrative(
                    "You raise your shield, but the timing is slightly off. An arrow finds a gap in the formation nearby, followed by a cry of pain. The cohesion of your line wavers momentarily.",
                    'player'
                  );
                  
                  // Reduce cohesion
                  this.state.cohesion = Math.max(0, this.state.cohesion - 10);
                  
                  // Minor casualty increase
                  this.state.casualtyRate = Math.min(100, this.state.casualtyRate + 2);
                }
                
                // Re-enable controls
                this.enableControls();
              }
            },
            {
              label: "Maintain March",
              callback: () => {
                // This is the wrong choice - automatically fail
                this.addBattleNarrative(
                  "You continue marching forward, but arrows rain down on the formation. Men cry out as missiles find gaps between shields. The cohesion of your line suffers as soldiers instinctively flinch away from the barrage.",
                  'player'
                );
                
                // Major cohesion reduction
                this.state.cohesion = Math.max(0, this.state.cohesion - 20);
                
                // Minor casualty increase
                this.state.casualtyRate = Math.min(100, this.state.casualtyRate + 5);
                
                // Re-enable controls
                this.enableControls();
              }
            }
          ]
        );
      },
      
      // Difficult terrain
      () => {
        this.addBattleNarrative(
          "The formation approaches a section of rough ground—broken stones and uneven earth that threatens to disrupt your orderly advance.",
          'event'
        );
        
        // Create a reaction check
        this.createReactionCheck(
          "Difficult Terrain",
          "The uneven ground ahead could break formation cohesion. How will you handle it?",
          [
            {
              label: "Slow Down",
              callback: () => {
                // This is the correct choice - high chance of success
                // Check if successful based on discipline skill
                const disciplineSkill = window.player.skills.discipline || 0;
                const difficultyMod = 0.6; // Base success chance without skill
                const successChance = Math.min(0.95, difficultyMod + (disciplineSkill * 0.1));
                
                if (Math.random() < successChance) {
                  // Success
                  this.addBattleNarrative(
                    "You reduce your pace, carefully placing each step on the uneven ground. The formation slows as one, maintaining its shape despite the difficult terrain.",
                    'player'
                  );
                  
                  // Slower progress but maintain cohesion
                  this.state.engagementProgress = (this.state.engagementProgress || 0) + 0.5;
                } else {
                  // Partial success
                  this.addBattleNarrative(
                    "You slow down, but the uneven footing still causes some disruption in the line. The formation wavers but quickly re-establishes itself.",
                    'player'
                  );
                  
                  // Minor cohesion reduction
                  this.state.cohesion = Math.max(0, this.state.cohesion - 5);
                }
                
                // Re-enable controls
                this.enableControls();
              }
            },
            {
              label: "Maintain Pace",
              callback: () => {
                // This is risky - lower chance of success
                const disciplineSkill = window.player.skills.discipline || 0;
                const survivalSkill = window.player.skills.survival || 0;
                const combinedSkill = (disciplineSkill + survivalSkill) / 2;
                const difficultyMod = 0.2; // Base success chance without skill
                const successChance = Math.min(0.8, difficultyMod + (combinedSkill * 0.1));
                
                if (Math.random() < successChance) {
                  // Success - impressive feat
                  this.addBattleNarrative(
                    "Despite the challenging terrain, you maintain your pace, carefully navigating the uneven ground without breaking formation. Your skill impresses nearby comrades, bolstering their confidence.",
                    'player'
                  );
                  
                  // Normal progress and morale boost
                  this.state.engagementProgress = (this.state.engagementProgress || 0) + 1;
                  this.state.morale = Math.min(100, this.state.morale + 5);
                } else {
                  // Failure
                  this.addBattleNarrative(
                    "Attempting to maintain pace over the rough ground proves disastrous. Soldiers stumble, the line becomes disjointed, and gaps appear in the formation. Officers bark orders to reform the line.",
                    'player'
                  );
                  
                  // Major cohesion reduction
                  this.state.cohesion = Math.max(0, this.state.cohesion - 15);
                }
                
                // Re-enable controls
                this.enableControls();
              }
            }
          ]
        );
      },
      
      // Formation adjustment
      () => {
        this.addBattleNarrative(
          "\"Adjust left! Close those gaps!\" The sergeant's voice carries over the sound of marching. The right flank of your formation has begun to drift out of alignment.",
          'event'
        );
        
        // Create a reaction check
        this.createReactionCheck(
          "Formation Drift",
          "Your section of the formation needs to adjust. How do you respond?",
          [
            {
              label: "Adjust Quickly",
              callback: () => {
                // This is risky - requires good discipline
                const disciplineSkill = window.player.skills.discipline || 0;
                const difficultyMod = 0.3; // Base success chance without skill
                const successChance = Math.min(0.9, difficultyMod + (disciplineSkill * 0.15));
                
                if (Math.random() < successChance) {
                  // Success - quick adjustment
                  this.addBattleNarrative(
                    "You respond immediately to the order, stepping sideways while maintaining your shield position. The formation realigns smoothly without losing momentum.",
                    'player'
                  );
                  
                  // Maintain progress and improve cohesion
                  this.state.engagementProgress = (this.state.engagementProgress || 0) + 1;
                  this.state.cohesion = Math.min(100, this.state.cohesion + 5);
                } else {
                  // Failure - too hasty
                  this.addBattleNarrative(
                    "Your hasty adjustment causes you to bump into your neighbor, creating a ripple of disruption through the line. The sergeant curses as the formation temporarily loses its crisp alignment.",
                    'player'
                  );
                  
                  // Reduce cohesion
                  this.state.cohesion = Math.max(0, this.state.cohesion - 10);
                }
                
                // Re-enable controls
                this.enableControls();
              }
            },
            {
              label: "Follow Others' Lead",
              callback: () => {
                // Safer option - higher base chance
                const disciplineSkill = window.player.skills.discipline || 0;
                const difficultyMod = 0.5; // Base success chance without skill
                const successChance = Math.min(0.95, difficultyMod + (disciplineSkill * 0.1));
                
                if (Math.random() < successChance) {
                  // Success - smooth adjustment
                  this.addBattleNarrative(
                    "You watch the soldiers to your left and adjust your position to match theirs. The formation corrects its alignment with minimal disruption.",
                    'player'
                  );
                  
                  // Slight cohesion improvement
                  this.state.cohesion = Math.min(100, this.state.cohesion + 3);
                } else {
                  // Minor failure - delayed response
                  this.addBattleNarrative(
                    "You wait to follow others, but your delayed response creates a momentary gap in the line. The sergeant gives you a sharp look as you hurry to correct your position.",
                    'player'
                  );
                  
                  // Minor cohesion reduction
                  this.state.cohesion = Math.max(0, this.state.cohesion - 5);
                }
                
                // Re-enable controls
                this.enableControls();
              }
            }
          ]
        );
      },
      
      // Enemy skirmishers
      () => {
        this.addBattleNarrative(
          "Enemy skirmishers appear on your flank, darting forward to throw javelins before retreating. Their light armor makes them quick and evasive.",
          'enemy'
        );
        
        // Create a reaction check
        this.createReactionCheck(
          "Skirmisher Threat",
          "Enemy skirmishers are targeting your formation's flank. How do you respond?",
          [
            {
              label: "Maintain Formation",
              callback: () => {
                // This is the correct choice for shieldwall
                const formationBonus = this.state.formation === 'shieldwall' ? 0.2 : 0;
                const disciplineSkill = window.player.skills.discipline || 0;
                const difficultyMod = 0.4; // Base success chance without skill
                const successChance = Math.min(0.9, difficultyMod + formationBonus + (disciplineSkill * 0.1));
                
                if (Math.random() < successChance) {
                  // Success
                  this.addBattleNarrative(
                    "You hold your position in the line despite the temptation to respond to the flanking threat. The formation remains solid, shields absorbing the thrown javelins. Officers dispatch a detachment to deal with the skirmishers while the main force maintains its advance.",
                    'player'
                  );
                  
                  // Cohesion boost for discipline
                  this.state.cohesion = Math.min(100, this.state.cohesion + 5);
                  
                  // Minor casualty increase from javelin hits
                  this.state.casualtyRate = Math.min(100, this.state.casualtyRate + 2);
                } else {
                  // Partial success
                  this.addBattleNarrative(
                    "Your section maintains formation, but elsewhere soldiers break ranks to chase the skirmishers. The sergeant bellows orders to reform the line as javelins continue to fall.",
                    'player'
                  );
                  
                  // Reduce cohesion
                  this.state.cohesion = Math.max(0, this.state.cohesion - 10);
                  
                  // More casualties from the disruption
                  this.state.casualtyRate = Math.min(100, this.state.casualtyRate + 5);
                }
                
                // Re-enable controls
                this.enableControls();
              }
            },
            {
              label: "Break Formation to Pursue",
              callback: () => {
                // This is usually the wrong choice for a formation battle
                const tacticsSkill = window.player.skills.tactics || 0;
                const difficultyMod = 0.1; // Very low base success chance
                const successChance = Math.min(0.5, difficultyMod + (tacticsSkill * 0.08));
                
                if (Math.random() < successChance) {
                  // Rare success - skilled counter-skirmish
                  this.addBattleNarrative(
                    "You break from the line with several others, forming a disciplined counter-skirmish force. Your swift response drives off the enemy skirmishers before they can inflict significant damage, and you quickly return to the main formation.",
                    'player'
                  );
                  
                  // Morale boost for aggressive action
                  this.state.morale = Math.min(100, this.state.morale + 10);
                  
                  // But still some cohesion penalty
                  this.state.cohesion = Math.max(0, this.state.cohesion - 5);
                } else {
                  // Failure - tactical error
                  this.addBattleNarrative(
                    "Breaking formation proves to be a serious mistake. The skirmishers retreat, drawing you and others away from the main force, only to circle back when the line is weakened. The sergeant furiously orders you back into position as officers struggle to restore order.",
                    'player'
                  );
                  
                  // Major cohesion reduction
                  this.state.cohesion = Math.max(0, this.state.cohesion - 25);
                  
                  // Significant casualty increase from the disorganization
                  this.state.casualtyRate = Math.min(100, this.state.casualtyRate + 8);
                  
                  // Also personal injury risk
                  if (Math.random() < 0.4) {
                    this.addBattleNarrative(
                      "In the confusion, a javelin grazes your arm, drawing blood. Nothing serious, but a painful reminder of the importance of formation discipline.",
                      'player'
                    );
                    
                    // Minor personal wound
                    this.state.playerWounds += 1;
                    
                    // Reduce player health
                    window.gameState.health = Math.max(1, window.gameState.health - 10);
                    window.updateStatusBars();
                  }
                }
                
                // Re-enable controls
                this.enableControls();
              }
            }
          ]
        );
      }
    ];
    
    // Pick a random event
    const event = events[Math.floor(Math.random() * events.length)];
    event();
    
    // Update battle status
    this.updateBattleStatus();
  },
  
  // Create a reaction check UI
  createReactionCheck: function(title, description, options) {
    const battleControls = document.getElementById('battle-controls');
    
    // Create reaction check container
    const reactionCheck = document.createElement('div');
    reactionCheck.className = 'reaction-check';
    
    // Add title and description
    const reactionTitle = document.createElement('div');
    reactionTitle.className = 'reaction-check-title';
    reactionTitle.textContent = title;
    reactionCheck.appendChild(reactionTitle);
    
    const reactionDesc = document.createElement('div');
    reactionDesc.className = 'reaction-check-description';
    reactionDesc.textContent = description;
    reactionCheck.appendChild(reactionDesc);
    
    // Add options
    const reactionOptions = document.createElement('div');
    reactionOptions.className = 'reaction-options';
    
    options.forEach(option => {
      const button = document.createElement('button');
      button.className = 'battle-btn reaction';
      button.textContent = option.label;
      button.addEventListener('click', () => {
        // Remove the reaction check
        battleControls.removeChild(reactionCheck);
        
        // Execute the callback
        option.callback();
      });
      
      reactionOptions.appendChild(button);
    });
    
    reactionCheck.appendChild(reactionOptions);
    
    // Add to battle controls
    battleControls.innerHTML = '';
    battleControls.appendChild(reactionCheck);
  },
  
  // Re-enable control buttons
  enableControls: function() {
    const controlsContainer = document.getElementById('battle-controls');
    controlsContainer.innerHTML = "";
    
    // Add engagement control buttons
    const advanceButton = document.createElement('button');
    advanceButton.className = 'battle-btn primary';
    advanceButton.textContent = 'Continue Advance';
    advanceButton.addEventListener('click', () => this.handleEngagementAction('advance'));
    controlsContainer.appendChild(advanceButton);
    
    const cautiousButton = document.createElement('button');
    cautiousButton.className = 'battle-btn';
    cautiousButton.textContent = 'Advance Cautiously';
    cautiousButton.addEventListener('click', () => this.handleEngagementAction('cautious'));
    controlsContainer.appendChild(cautiousButton);
    
    const haltButton = document.createElement('button');
    haltButton.className = 'battle-btn';
    haltButton.textContent = 'Hold Position';
    haltButton.addEventListener('click', () => this.handleEngagementAction('hold'));
    controlsContainer.appendChild(haltButton);
  },
  
  // Start the combat phase
  startCombatPhase: function() {
    this.state.phase = "combat";
    this.state.round = 1;
    
    // Add narrative
    this.addBattleNarrative(
      "Your formation reaches the enemy position. \"SHIELDS LOCK!\" The command echoes down the line as the two forces close to striking distance. The Arrasi defenders brace for impact, their own shields forming a hasty barrier.\n\nWith a thunderous crash, your formation collides with the enemy line. The real battle begins now.",
      'event'
    );
    
    // Update battle status
    this.updateBattleStatus();
    
    // Start combat round
    this.startCombatRound();
  },
  
  // Start a new combat round
  startCombatRound: function() {
    // Add round transition narrative
    if (this.state.round > 1) {
      this.addBattleNarrative(
        `The battle continues, your company pressing against the enemy defenses. Blood and sweat mingle as the clash of weapons fills the air. Round ${this.state.round} of the battle begins.`,
        'event'
      );
    }
    
    // Update status display
    this.updateBattleStatus();
    
    // Render combat controls
    this.renderCombatControls();
    
    // Trigger a combat event
    setTimeout(() => this.triggerCombatEvent(), 2000);
  },
  
  // Render combat phase control buttons
  renderCombatControls: function() {
    const controlsContainer = document.getElementById('battle-controls');
    controlsContainer.innerHTML = "";
    
    // Add combat control buttons
    const advanceButton = document.createElement('button');
    advanceButton.className = 'battle-btn primary';
    advanceButton.textContent = 'Press Attack';
    advanceButton.addEventListener('click', () => this.handleCombatAction('press'));
    controlsContainer.appendChild(advanceButton);
    
    const defendButton = document.createElement('button');
    defendButton.className = 'battle-btn';
    defendButton.textContent = 'Hold the Line';
    defendButton.addEventListener('click', () => this.handleCombatAction('hold'));
    controlsContainer.appendChild(defendButton);
    
    const supportButton = document.createElement('button');
    supportButton.className = 'battle-btn';
    supportButton.textContent = 'Support Allies';
    supportButton.addEventListener('click', () => this.handleCombatAction('support'));
    controlsContainer.appendChild(supportButton);
  },
  
  // Handle player combat action choice
  handleCombatAction: function(action) {
    switch (action) {
      case 'press':
        // Aggressive - push for objectives
        this.addBattleNarrative(
          "You throw your weight into your shield, pushing forward with the formation. The line advances step by step, gradually forcing the enemy back.",
          'player'
        );
        
        // Higher chance of securing objectives but more casualties
        if (Math.random() < 0.4) {
          // Secure an objective if not all are secured
          if (this.state.objectivesSecured < this.state.totalObjectives) {
            this.state.objectivesSecured++;
            
            // Add narrative about securing objective
            const template = this.battleTemplates[this.state.battleType];
            const objective = template.objectives[this.state.objectivesSecured - 1];
            
            this.addBattleNarrative(
              `Your aggressive push helps the company secure its objective: ${objective}. A cheer rises from nearby soldiers as the enemy falls back.`,
              'event'
            );
            
            // Morale boost
            this.state.morale = Math.min(100, this.state.morale + 10);
          }
        }
        
        // Cost of aggression - cohesion and casualty risk
        this.state.cohesion = Math.max(0, this.state.cohesion - 10);
        this.state.casualtyRate = Math.min(100, this.state.casualtyRate + 5);
        
        // Personal injury risk
        if (Math.random() < 0.3) {
          this.addBattleNarrative(
            "As you press forward, an enemy blade finds a gap in your defense, scoring a painful cut across your arm.",
            'player'
          );
          
          // Wound counter
          this.state.playerWounds += 1;
          
          // Reduce player health
          window.gameState.health = Math.max(1, window.gameState.health - 15);
          window.updateStatusBars();
        }
        break;
        
      case 'hold':
        // Defensive - maintain position
        this.addBattleNarrative(
          "You focus on holding your position in the line, shield braced against enemy attacks. \"Stand firm!\" the sergeant calls, and your section responds with disciplined resolve.",
          'player'
        );
        
        // Improve cohesion
        this.state.cohesion = Math.min(100, this.state.cohesion + 15);
        
        // Lower casualty rate
        this.state.casualtyRate = Math.max(0, this.state.casualtyRate - 2);
        
        // Less chance of objectives but safer
        if (Math.random() < 0.15 && this.state.cohesion > 70) {
          // Secure an objective if conditions are good
          if (this.state.objectivesSecured < this.state.totalObjectives) {
            this.state.objectivesSecured++;
            
            // Add narrative about securing objective
            const template = this.battleTemplates[this.state.battleType];
            const objective = template.objectives[this.state.objectivesSecured - 1];
            
            this.addBattleNarrative(
              `Your solid defense creates an opportunity. As the enemy exhausts itself against your line, other sections of the company maneuver to secure ${objective}.`,
              'event'
            );
            
            // Morale boost
            this.state.morale = Math.min(100, this.state.morale + 8);
          }
        }
        break;
        
      case 'support':
        // Support allies - balance cohesion and offense
        this.addBattleNarrative(
          "You divide your attention between fighting and supporting your comrades, maintaining the integrity of the formation while looking for opportunities to assist those around you.",
          'player'
        );
        
        // Balanced approach
        this.state.cohesion = Math.min(100, this.state.cohesion + 5);
        this.state.morale = Math.min(100, this.state.morale + 5);
        
        // Moderate chance of objectives
        if (Math.random() < 0.25) {
          // Secure an objective
          if (this.state.objectivesSecured < this.state.totalObjectives) {
            this.state.objectivesSecured++;
            
            // Add narrative about securing objective
            const template = this.battleTemplates[this.state.battleType];
            const objective = template.objectives[this.state.objectivesSecured - 1];
            
            this.addBattleNarrative(
              `Your coordinated efforts with nearby soldiers create a synchronized advance. The formation moves as one to secure ${objective}.`,
              'event'
            );
            
            // Morale boost
            this.state.morale = Math.min(100, this.state.morale + 5);
          }
        }
        break;
    }
    
    // Disable controls temporarily
    const controlsContainer = document.getElementById('battle-controls');
    const buttons = controlsContainer.querySelectorAll('button');
    buttons.forEach(button => {
      button.disabled = true;
      button.classList.add('disabled');
    });
    
    // Update battle status
    this.updateBattleStatus();
    
    // Continue with combat round or advance to next round
    setTimeout(() => {
      // Enemy response
      this.triggerEnemyResponse();
      
      // After enemy response, either trigger another event or end round
      setTimeout(() => {
        // Check if battle should end
        if (this.shouldEndBattle()) {
          this.endBattle();
        } else if (this.state.round >= this.state.maxRounds) {
          // Maximum rounds reached, end battle
          this.endBattle();
        } else {
          // Move to next round
          this.state.round++;
          this.startCombatRound();
        }
      }, 3000);
    }, 2000);
  },
  
  // Trigger a random combat event
  triggerCombatEvent: function() {
    // List of possible combat events
    const events = [
      // Enemy push
      () => {
        this.addBattleNarrative(
          "The enemy line surges forward in a coordinated push, threatening to break through your formation. Shields slam against shields as the pressure intensifies.",
          'enemy'
        );
        
        // Create a reaction check
        this.createReactionCheck(
          "Enemy Push",
          "The enemy is attempting to break your line. How do you respond?",
          [
            {
              label: "Brace and Push Back",
              callback: () => {
                // Check success based on physical attributes and discipline
                const physicalBonus = window.player.phy * 0.05;
                const disciplineSkill = window.player.skills.discipline || 0;
                const difficultyMod = 0.3; // Base success chance without skill
                const successChance = Math.min(0.9, difficultyMod + physicalBonus + (disciplineSkill * 0.1));
                
                if (Math.random() < successChance) {
                  // Success
                  this.addBattleNarrative(
                    "You plant your feet firmly and throw your weight into your shield, pushing back against the enemy pressure. The line holds, and the enemy push falters against your resolute defense.",
                    'player'
                  );
                  
                  // Improved cohesion from successful defense
                  this.state.cohesion = Math.min(100, this.state.cohesion + 10);
                  
                  // Morale boost
                  this.state.morale = Math.min(100, this.state.morale + 5);
                } else {
                  // Failure
                  this.addBattleNarrative(
                    "Despite your efforts, the enemy's push is too strong. Your section of the line gives ground, forced back several paces before regaining stability. The sergeant curses as the formation struggles to reform.",
                    'player'
                  );
                  
                  // Reduced cohesion
                  this.state.cohesion = Math.max(0, this.state.cohesion - 15);
                  
                  // Increased casualty rate
                  this.state.casualtyRate = Math.min(100, this.state.casualtyRate + 5);
                  
                  // Personal injury risk
                  if (Math.random() < 0.4) {
                    this.addBattleNarrative(
                      "In the chaotic push, an enemy spear thrusts between shields, catching you in the side. The wound isn't deep, but it's painful and bleeding.",
                      'player'
                    );
                    
                    // Wound counter
                    this.state.playerWounds += 1;
                    
                    // Reduce player health
                    window.gameState.health = Math.max(1, window.gameState.health - 20);
                    window.updateStatusBars();
                  }
                }
                
                // Re-enable combat controls
                this.renderCombatControls();
              }
            },
            {
              label: "Tactical Withdrawal",
              callback: () => {
                // Check success based on tactics and discipline
                const tacticsSkill = window.player.skills.tactics || 0;
                const disciplineSkill = window.player.skills.discipline || 0;
                const combinedSkill = (tacticsSkill + disciplineSkill) / 2;
                const difficultyMod = 0.4; // Base success chance without skill
                const successChance = Math.min(0.9, difficultyMod + (combinedSkill * 0.1));
                
                if (Math.random() < successChance) {
                  // Success
                  this.addBattleNarrative(
                    "You recognize the overwhelming force and step back in a controlled motion, signaling those around you to do the same. The formation gives ground intentionally, absorbing the enemy push without breaking, then reforms with minimal disruption.",
                    'player'
                  );
                  
                  // Cohesion maintained
                  this.state.cohesion = Math.min(100, this.state.cohesion + 5);
                } else {
                  // Failure
                  this.addBattleNarrative(
                    "Your attempt at an orderly withdrawal devolves into confusion. Some soldiers hold their ground while others step back, creating gaps in the line. The enemy exploits these openings, driving deeper into your formation.",
                    'player'
                  );
                  
                  // Severely reduced cohesion
                  this.state.cohesion = Math.max(0, this.state.cohesion - 25);
                  
                  // Increased casualty rate
                  this.state.casualtyRate = Math.min(100, this.state.casualtyRate + 8);
                }
                
                // Re-enable combat controls
                this.renderCombatControls();
              }
            }
          ]
        );
      },
      
      // Shield collapse
      () => {
        this.addBattleNarrative(
          "A soldier to your left falls, creating a dangerous gap in the shieldwall. Enemy warriors immediately try to exploit the opening, pressing toward the breach.",
          'event'
        );
        
        // Create a reaction check
        this.createReactionCheck(
          "Gap in Formation",
          "A gap has opened in your line. How do you respond?",
          [
            {
              label: "Close the Gap",
              callback: () => {
                // This requires good discipline and reaction time
                const disciplineSkill = window.player.skills.discipline || 0;
                const difficultyMod = 0.3; // Base success chance without skill
                const successChance = Math.min(0.9, difficultyMod + (disciplineSkill * 0.15));
                
                if (Math.random() < successChance) {
                  // Success
                  this.addBattleNarrative(
                    "You immediately slide to your left, extending your shield to cover the gap. Another soldier moves up behind you, and together you restore the integrity of the line before the enemy can exploit the weakness.",
                    'player'
                  );
                  
                  // Cohesion boost for good formation maintenance
                  this.state.cohesion = Math.min(100, this.state.cohesion + 15);
                  
                  // Minor morale boost
                  this.state.morale = Math.min(100, this.state.morale + 5);
                } else {
                  // Partial success/failure
                  this.addBattleNarrative(
                    "You move to close the gap, but not quite fast enough. An enemy warrior thrusts through the opening before you can seal it. There's a desperate moment of close-quarters fighting before reinforcements arrive to stabilize the line.",
                    'player'
                  );
                  
                  // Reduced cohesion
                  this.state.cohesion = Math.max(0, this.state.cohesion - 10);
                  
                  // Increased casualty rate
                  this.state.casualtyRate = Math.min(100, this.state.casualtyRate + 3);
                  
                  // Personal injury risk
                  if (Math.random() < 0.5) {
                    this.addBattleNarrative(
                      "In the chaotic moment, you take a glancing blow to the shoulder. Your armor absorbs most of the impact, but it will leave a nasty bruise.",
                      'player'
                    );
                    
                    // Wound counter
                    this.state.playerWounds += 1;
                    
                    // Reduce player health slightly
                    window.gameState.health = Math.max(1, window.gameState.health - 10);
                    window.updateStatusBars();
                  }
                }
                
                // Re-enable combat controls
                this.renderCombatControls();
              }
            },
            {
              label: "Maintain Your Position",
              callback: () => {
                // This is the wrong choice in a shieldwall
                this.addBattleNarrative(
                  "You maintain your position, focusing on your own section of the line. Without anyone moving to close the gap, enemy warriors pour through the breach, attacking the formation from within. Panic spreads as your line begins to crumble from the inside.",
                  'player'
                );
                
                // Severe cohesion damage
                this.state.cohesion = Math.max(0, this.state.cohesion - 30);
                
                // Major casualty increase
                this.state.casualtyRate = Math.min(100, this.state.casualtyRate + 10);
                
                // Morale hit
                this.state.morale = Math.max(0, this.state.morale - 15);
                
                // Re-enable combat controls
                this.renderCombatControls();
              }
            }
          ]
        );
      },
      
      // Signal from officer
      () => {
        this.addBattleNarrative(
          "An officer raises a signal flag, calling for a coordinated maneuver. The sergeants bark orders, relaying the command down the line.",
          'event'
        );
        
        // Create a reaction check
        this.createReactionCheck(
          "Formation Command",
          "Officers are signaling for a coordinated maneuver. How do you respond?",
          [
            {
              label: "Follow Orders Precisely",
              callback: () => {
                // This requires good discipline
                const disciplineSkill = window.player.skills.discipline || 0;
                const difficultyMod = 0.4; // Base success chance without skill
                const successChance = Math.min(0.95, difficultyMod + (disciplineSkill * 0.1));
                
                if (Math.random() < successChance) {
                  // Success
                  this.addBattleNarrative(
                    "You execute the maneuver exactly as ordered, moving in perfect sync with your section. The formation shifts as one, creating pressure points in the enemy line that your company quickly exploits.",
                    'player'
                  );
                  
                  // Cohesion boost
                  this.state.cohesion = Math.min(100, this.state.cohesion + 10);
                  
                  // Chance to secure objective
                  if (Math.random() < 0.3 && this.state.objectivesSecured < this.state.totalObjectives) {
                    this.state.objectivesSecured++;
                    
                    // Add narrative about securing objective
                    const template = this.battleTemplates[this.state.battleType];
                    const objective = template.objectives[this.state.objectivesSecured - 1];
                    
                    this.addBattleNarrative(
                      `The coordinated maneuver pays off. Your company successfully secures ${objective} as the enemy line buckles under the precise pressure.`,
                      'event'
                    );
                    
                    // Morale boost
                    this.state.morale = Math.min(100, this.state.morale + 10);
                  }
                } else {
                  // Failure - misinterpretation
                  this.addBattleNarrative(
                    "You attempt to follow the orders, but either misinterpret the signal or move at the wrong moment. Your section falls out of sync with the rest of the formation, creating momentary confusion.",
                    'player'
                  );
                  
                  // Minor cohesion reduction
                  this.state.cohesion = Math.max(0, this.state.cohesion - 5);
                }
                
                // Re-enable combat controls
                this.renderCombatControls();
              }
            },
            {
              label: "Focus on Individual Combat",
              callback: () => {
                // This is generally the wrong choice in formation combat
                this.addBattleNarrative(
                  "Caught up in the immediacy of combat, you miss or ignore the command, focusing instead on the enemy directly in front of you. As the formation shifts around you, you find yourself out of position, creating a weak point in the line.",
                  'player'
                );
                
                // Significant cohesion reduction
                this.state.cohesion = Math.max(0, this.state.cohesion - 20);
                
                // Increased personal risk
                if (Math.random() < 0.4) {
                  this.addBattleNarrative(
                    "Your isolation makes you vulnerable. An enemy warrior takes advantage of your exposed position, landing a solid blow before your comrades can adjust to protect you.",
                    'player'
                  );
                  
                  // Wound counter
                  this.state.playerWounds += 1;
                  
                  // Reduce player health
                  window.gameState.health = Math.max(1, window.gameState.health - 25);
                  window.updateStatusBars();
                }
                
                // Re-enable combat controls
                this.renderCombatControls();
              }
            }
          ]
        );
      }
    ];
    
    // Pick a random event
    const event = events[Math.floor(Math.random() * events.length)];
    event();
    
    // Update battle status
    this.updateBattleStatus();
  },
  
  // Trigger enemy response to player's action
  triggerEnemyResponse: function() {
    // Different responses based on current state
    if (this.state.objectivesSecured >= this.state.totalObjectives / 2) {
      // Player is winning - enemy gets desperate
      this.addBattleNarrative(
        "Sensing the tide turning against them, the Arrasi defenders fight with renewed desperation. Their captain rallies them for a counter-push, hoping to regain lost ground.",
        'enemy'
      );
      
      // Enemy desperation affects cohesion and casualties
      this.state.cohesion = Math.max(0, this.state.cohesion - 10);
      this.state.casualtyRate = Math.min(100, this.state.casualtyRate + 5);
    } else if (this.state.cohesion < 40) {
      // Player's formation is weak - enemy exploits
      this.addBattleNarrative(
        "The enemy senses weakness in your formation. They concentrate their attacks on vulnerable points in your line, seeking to shatter what remains of your cohesion.",
        'enemy'
      );
      
      // Further cohesion damage
      this.state.cohesion = Math.max(0, this.state.cohesion - 15);
      this.state.casualtyRate = Math.min(100, this.state.casualtyRate + 8);
      this.state.morale = Math.max(0, this.state.morale - 10);
    } else {
      // Normal battle progression
      this.addBattleNarrative(
        "The enemy responds to your movements, adjusting their defense to counter your tactics. The battle continues as a deadly dance of advance and retreat, thrust and parry.",
        'enemy'
      );
      
      // Standard battle attrition
      this.state.cohesion = Math.max(0, this.state.cohesion - 5);
      this.state.casualtyRate = Math.min(100, this.state.casualtyRate + 3);
    }
    
    // Update battle status
    this.updateBattleStatus();
  },
  
  // Check if battle should end
  shouldEndBattle: function() {
    // Check if all objectives secured
    if (this.state.objectivesSecured >= this.state.totalObjectives) {
      return true;
    }
    
    // Check if formation has collapsed
    if (this.state.cohesion <= 0) {
      return true;
    }
    
    // Check if casualty rate is too high
    if (this.state.casualtyRate >= 40) {
      return true;
    }
    
    // Check if morale has broken
    if (this.state.morale <= 0) {
      return true;
    }
    
    // Continue battle
    return false;
  },
  
  // End the battle and determine outcome
  endBattle: function() {
    // Determine outcome based on objectives and formation state
    let outcome = "incomplete";
    let outcomeNarrative = "";
    
    if (this.state.objectivesSecured >= this.state.totalObjectives) {
      // Complete victory
      outcome = "victory";
      outcomeNarrative = "Victory! Your formation achieved all objectives, securing a decisive win for the Paanic Empire.";
    } else if (this.state.objectivesSecured >= Math.ceil(this.state.totalObjectives / 2)) {
      // Partial victory
      outcome = "partial";
      outcomeNarrative = "Partial Victory. Your formation secured key objectives, though not all. The raid is considered a qualified success.";
    } else if (this.state.cohesion <= 0) {
      // Formation collapsed
      outcome = "defeat";
      outcomeNarrative = "Defeat. Your formation collapsed under enemy pressure, forcing a retreat before objectives could be secured.";
    } else if (this.state.casualtyRate >= 40) {
      // Too many casualties
      outcome = "defeat";
      outcomeNarrative = "Defeat. Casualties mounted too high, and the Sarkein ordered a withdrawal to preserve the remaining force.";
    } else if (this.state.morale <= 0) {
      // Morale broke
      outcome = "defeat";
      outcomeNarrative = "Defeat. Morale crumbled in the face of stiff resistance, and the formation lost its will to fight.";
    } else {
      // Battle ended without clear resolution
      outcome = "incomplete";
      outcomeNarrative = "The battle ends without a decisive outcome. Your formation withdraws in good order, having achieved some objectives but not all.";
    }
    
    // Final battle narrative
    this.addBattleNarrative(outcomeNarrative, 'event');
    
    // Show end battle controls
    const controlsContainer = document.getElementById('battle-controls');
    controlsContainer.innerHTML = "";
    
    // Add end battle button
    const endButton = document.createElement('button');
    endButton.className = 'battle-btn primary';
    endButton.textContent = 'End Battle';
    endButton.addEventListener('click', () => this.completeBattle(outcome));
    controlsContainer.appendChild(endButton);
  },
  
  // Complete battle and return to game
  completeBattle: function(outcome) {
    // Apply battle results to player
    // Health reduction based on wounds
    const healthLoss = this.state.playerWounds * 10;
    window.gameState.health = Math.max(1, window.gameState.health - healthLoss);
    
    // Stamina loss from exertion
    window.gameState.stamina = Math.max(0, window.gameState.stamina - 50);
    
    // Experience gain
    let experienceGain = 50; // Base experience
    
    if (outcome === "victory") {
      experienceGain = 100;
    } else if (outcome === "partial") {
      experienceGain = 75;
    }
    
    window.gameState.experience += experienceGain;
    
    // Skill improvements
    const disciplineGain = 0.3;
    const tacticsGain = 0.2;
    
    const mentalSkillCap = Math.floor(window.player.men / 1.5);
    
    if (window.player.skills.discipline < mentalSkillCap) {
      window.player.skills.discipline = Math.min(mentalSkillCap, window.player.skills.discipline + disciplineGain);
      window.showNotification(`Your discipline improved by ${disciplineGain.toFixed(1)}`, 'success');
    }
    
    if (window.player.skills.tactics < mentalSkillCap) {
      window.player.skills.tactics = Math.min(mentalSkillCap, window.player.skills.tactics + tacticsGain);
      window.showNotification(`Your tactics improved by ${tacticsGain.toFixed(1)}`, 'success');
    }
    
    // Apply damage to equipment from battle
    if (window.player.equipment) {
      // Damage armor
      if (window.player.equipment.body) {
        const bodyArmor = window.player.equipment.body;
        if (bodyArmor.durability !== undefined) {
          const durabilityLoss = Math.floor(Math.random() * 20) + 10; // 10-30 durability loss
          bodyArmor.durability = Math.max(0, bodyArmor.durability - durabilityLoss);
        }
      }
      
      // Damage helmet
      if (window.player.equipment.head) {
        const helmet = window.player.equipment.head;
        if (helmet.durability !== undefined) {
          const durabilityLoss = Math.floor(Math.random() * 15) + 5; // 5-20 durability loss
          helmet.durability = Math.max(0, helmet.durability - durabilityLoss);
        }
      }
      
      // Damage weapon
      if (window.player.equipment.mainHand) {
        const weapon = window.player.equipment.mainHand;
        if (weapon.durability !== undefined) {
          const durabilityLoss = Math.floor(Math.random() * 25) + 15; // 15-40 durability loss
          weapon.durability = Math.max(0, weapon.durability - durabilityLoss);
        }
      }
      
      // Damage shield
      if (window.player.equipment.offHand) {
        const shield = window.player.equipment.offHand;
        if (shield.durability !== undefined) {
          const durabilityLoss = Math.floor(Math.random() * 30) + 20; // 20-50 durability loss
          shield.durability = Math.max(0, shield.durability - durabilityLoss);
        }
      }
    }
    
    // Update quest if associated with one
    if (this.state.questId) {
      const quest = window.QuestSystem.activeQuests.find(q => q.id === this.state.questId);
      if (quest) {
        // Store battle outcome in the quest
        quest.battleOutcome = outcome;
        
        // Advance to next quest stage
        window.QuestSystem.advanceQuestStage(this.state.questId);
      }
    }
    
    // Hide battle interface
    const battleModal = document.getElementById('shieldwall-battle');
    if (battleModal) {
      battleModal.classList.add('hidden');
    }
    
    // Update game UI
    window.updateStatusBars();
    window.checkLevelUp();
    
    // Show notification
    window.showNotification(`Battle complete! +${experienceGain} XP`, 'success');
  }
};

// Initialize the Shieldwall system when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Initialize if not already initialized
  if (window.ShieldwallSystem && !window.ShieldwallSystem.initialized) {
    window.ShieldwallSystem.initialize();
  }
});
