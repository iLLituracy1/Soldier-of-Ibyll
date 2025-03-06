// ENHANCED MISSION INTERFACE
// Provides improved mission tracking, map visualization, and progression metrics

window.MissionInterface = (function() {
  // Private variables
  let _currentMission = null;
  let _currentMissionData = {};
  let _mapData = {};
  let _missionMetrics = {};
  let _displayMode = 'standard'; // standard, map, details
  let _progressHistory = [];
  
  // Event listeners
  let _eventListeners = {};
  
  // DOM elements cache
  let _elements = {
    container: null,
    header: null,
    content: null,
    objectives: null,
    map: null,
    metrics: null,
    actions: null
  };
  
  // Private helper functions
  function _log(message, data) {
    console.log(`[MissionInterface] ${message}`, data || '');
  }
  
  function _error(message, data) {
    console.error(`[MissionInterface] ${message}`, data || '');
  }
  
  // Create the mission interface container and basic structure
  function _createInterface() {
    try {
      // Check if container already exists
      let container = document.getElementById('enhancedMissionInterface');
      if (container) {
        return container;
      }
      
      // Create container
      container = document.createElement('div');
      container.id = 'enhancedMissionInterface';
      container.className = 'enhanced-mission-interface';
      
      // Create header
      const header = document.createElement('div');
      header.className = 'mission-header';
      container.appendChild(header);
      _elements.header = header;
      
      // Create content area
      const content = document.createElement('div');
      content.className = 'mission-content';
      container.appendChild(content);
      _elements.content = content;
      
      // Create objectives section
      const objectives = document.createElement('div');
      objectives.className = 'mission-objectives';
      container.appendChild(objectives);
      _elements.objectives = objectives;
      
      // Create map section
      const map = document.createElement('div');
      map.className = 'mission-map';
      map.style.display = 'none'; // Hidden by default
      container.appendChild(map);
      _elements.map = map;
      
      // Create metrics section
      const metrics = document.createElement('div');
      metrics.className = 'mission-metrics';
      container.appendChild(metrics);
      _elements.metrics = metrics;
      
      // Create actions section
      const actions = document.createElement('div');
      actions.className = 'mission-actions';
      actions.id = 'missionActionsEnhanced';
      container.appendChild(actions);
      _elements.actions = actions;
      
      // Add the container to the body
      document.body.appendChild(container);
      _elements.container = container;
      
      // Add initial styles
      _addInterfaceStyles();
      
      return container;
    } catch (error) {
      _error("Error creating interface:", error);
      return null;
    }
  }
  
  // Add CSS styles for the interface
  function _addInterfaceStyles() {
    try {
      const styleId = 'missionInterfaceStyles';
      
      // Check if styles already exist
      if (document.getElementById(styleId)) {
        return;
      }
      
      const styleElement = document.createElement('style');
      styleElement.id = styleId;
      
      styleElement.textContent = `
        .enhanced-mission-interface {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.9);
          color: #eee;
          font-family: Arial, sans-serif;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          padding: 20px;
          box-sizing: border-box;
          overflow: auto;
          transform: translateY(100%);
          transition: transform 0.3s ease-in-out;
        }
        
        .enhanced-mission-interface.active {
          transform: translateY(0%);
        }
        
        .mission-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 15px;
          border-bottom: 1px solid #444;
          margin-bottom: 15px;
        }
        
        .mission-title {
          font-size: 24px;
          font-weight: bold;
          color: #4b6bff;
        }
        
        .mission-difficulty {
          display: flex;
          align-items: center;
        }
        
        .difficulty-star {
          color: gold;
          margin-right: 2px;
        }
        
        .mission-content {
          margin-bottom: 20px;
          line-height: 1.5;
        }
        
        .mission-objectives {
          margin-bottom: 20px;
        }
        
        .objective-item {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          padding: 8px;
          background-color: rgba(75, 107, 255, 0.1);
          border-radius: 4px;
        }
        
        .objective-item.completed {
          background-color: rgba(75, 255, 107, 0.1);
        }
        
        .objective-checkbox {
          margin-right: 10px;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #4b6bff;
          border-radius: 4px;
        }
        
        .objective-item.completed .objective-checkbox {
          border-color: #4bff6b;
          background-color: #4bff6b;
          color: #000;
        }
        
        .mission-map {
          margin-bottom: 20px;
          background-color: #222;
          border-radius: 8px;
          min-height: 200px;
          position: relative;
        }
        
        .map-location {
          position: absolute;
          width: 16px;
          height: 16px;
          background-color: #4b6bff;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          cursor: pointer;
        }
        
        .map-location.current {
          background-color: #4bff6b;
          box-shadow: 0 0 8px #4bff6b;
        }
        
        .map-location.completed {
          background-color: #888;
        }
        
        .map-path {
          position: absolute;
          height: 2px;
          background-color: #4b6bff;
          transform-origin: left center;
        }
        
        .mission-metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .metric-item {
          flex: 1;
          min-width: 150px;
          background-color: rgba(75, 107, 255, 0.1);
          padding: 10px;
          border-radius: 4px;
        }
        
        .metric-title {
          font-size: 12px;
          text-transform: uppercase;
          color: #888;
          margin-bottom: 5px;
        }
        
        .metric-value {
          font-size: 20px;
          font-weight: bold;
          color: #4b6bff;
        }
        
        .mission-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: auto;
          padding-top: 20px;
          border-top: 1px solid #444;
        }
        
        .mission-action-btn {
          padding: 10px 15px;
          background-color: #4b6bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .mission-action-btn:hover {
          background-color: #3a59e0;
        }
        
        .mission-action-btn.danger {
          background-color: #ff4b4b;
        }
        
        .mission-action-btn.danger:hover {
          background-color: #e03a3a;
        }
        
        .mission-tabs {
          display: flex;
          margin-bottom: 20px;
          border-bottom: 1px solid #444;
        }
        
        .mission-tab {
          padding: 10px 15px;
          cursor: pointer;
          margin-right: 5px;
          border-bottom: 3px solid transparent;
        }
        
        .mission-tab.active {
          border-bottom-color: #4b6bff;
          color: #4b6bff;
        }
        
        .mission-progress-bar {
          height: 5px;
          background-color: #333;
          margin-bottom: 20px;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background-color: #4b6bff;
          width: 0%;
          transition: width 0.5s ease;
        }
        
        .mission-rewards {
          background-color: rgba(255, 215, 0, 0.1);
          border: 1px solid rgba(255, 215, 0, 0.3);
          border-radius: 4px;
          padding: 10px;
          margin-top: 15px;
        }
        
        .reward-title {
          font-weight: bold;
          color: gold;
          margin-bottom: 5px;
        }
        
        .reward-item {
          display: flex;
          align-items: center;
          margin-bottom: 5px;
        }
        
        .reward-icon {
          margin-right: 8px;
          width: 20px;
          text-align: center;
        }
      `;
      
      document.head.appendChild(styleElement);
    } catch (error) {
      _error("Error adding interface styles:", error);
    }
  }
  
  // Update the interface content based on mission data
  function _updateInterfaceContent(mission) {
    if (!mission || !_elements.container) {
      return;
    }
    
    try {
      // Update header
      _updateHeader(mission);
      
      // Update content based on current display mode
      switch (_displayMode) {
        case 'map':
          _updateMapView(mission);
          break;
        case 'details':
          _updateDetailsView(mission);
          break;
        case 'standard':
        default:
          _updateStandardView(mission);
      }
      
      // Update objectives
      _updateObjectives(mission);
      
      // Update metrics
      _updateMetrics(mission);
      
      // Update action buttons
      _updateActionButtons(mission);
    } catch (error) {
      _error("Error updating interface content:", error);
    }
  }
  
  // Update the mission header
  function _updateHeader(mission) {
    if (!_elements.header) return;
    
    try {
      _elements.header.innerHTML = '';
      
      // Create tabs
      const tabs = document.createElement('div');
      tabs.className = 'mission-tabs';
      
      const standardTab = document.createElement('div');
      standardTab.className = `mission-tab ${_displayMode === 'standard' ? 'active' : ''}`;
      standardTab.textContent = 'Overview';
      standardTab.onclick = () => {
        _setDisplayMode('standard');
      };
      
      const mapTab = document.createElement('div');
      mapTab.className = `mission-tab ${_displayMode === 'map' ? 'active' : ''}`;
      mapTab.textContent = 'Map';
      mapTab.onclick = () => {
        _setDisplayMode('map');
      };
      
      const detailsTab = document.createElement('div');
      detailsTab.className = `mission-tab ${_displayMode === 'details' ? 'active' : ''}`;
      detailsTab.textContent = 'Details';
      detailsTab.onclick = () => {
        _setDisplayMode('details');
      };
      
      tabs.appendChild(standardTab);
      tabs.appendChild(mapTab);
      tabs.appendChild(detailsTab);
      
      // Create title and difficulty
      const titleRow = document.createElement('div');
      titleRow.style.display = 'flex';
      titleRow.style.justifyContent = 'space-between';
      titleRow.style.alignItems = 'center';
      titleRow.style.width = '100%';
      
      const title = document.createElement('div');
      title.className = 'mission-title';
      title.textContent = mission.title;
      
      const difficulty = document.createElement('div');
      difficulty.className = 'mission-difficulty';
      
      // Add difficulty stars
      for (let i = 0; i < mission.difficulty; i++) {
        const star = document.createElement('span');
        star.className = 'difficulty-star';
        star.textContent = '★';
        difficulty.appendChild(star);
      }
      
      titleRow.appendChild(title);
      titleRow.appendChild(difficulty);
      
      _elements.header.appendChild(tabs);
      _elements.header.appendChild(titleRow);
      
      // Add progress bar
      const progressBar = document.createElement('div');
      progressBar.className = 'mission-progress-bar';
      
      const progressFill = document.createElement('div');
      progressFill.className = 'progress-fill';
      
      // Calculate progress percentage
      const currentStage = window.gameState.missionStage;
      const totalStages = mission.stages.length;
      const progressPercentage = Math.min(100, Math.max(0, (currentStage / totalStages) * 100));
      
      progressFill.style.width = `${progressPercentage}%`;
      progressBar.appendChild(progressFill);
      
      _elements.header.appendChild(progressBar);
    } catch (error) {
      _error("Error updating header:", error);
    }
  }
  
  // Update the standard view (basic mission info)
  function _updateStandardView(mission) {
    if (!_elements.content) return;
    
    try {
      _elements.content.innerHTML = '';
      
      // Show mission description
      const description = document.createElement('div');
      description.className = 'mission-description';
      description.textContent = mission.description;
      
      // Show current stage
      const currentStage = mission.stages[window.gameState.missionStage];
      const stageInfo = document.createElement('div');
      stageInfo.className = 'mission-stage-info';
      stageInfo.innerHTML = `
        <div class="stage-counter">Stage: ${window.gameState.missionStage + 1}/${mission.stages.length}</div>
        <div class="stage-type">Current Stage Type: ${_formatStageType(currentStage.type)}</div>
      `;
      
      // Show rewards section
      const rewards = document.createElement('div');
      rewards.className = 'mission-rewards';
      
      const rewardsTitle = document.createElement('div');
      rewardsTitle.className = 'reward-title';
      rewardsTitle.textContent = 'Mission Rewards:';
      rewards.appendChild(rewardsTitle);
      
      const rewardsList = document.createElement('div');
      rewardsList.className = 'rewards-list';
      
      // Add experience reward
      if (mission.rewards.experience) {
        const expReward = document.createElement('div');
        expReward.className = 'reward-item';
        expReward.innerHTML = `<span class="reward-icon">⭐</span> ${mission.rewards.experience} Experience`;
        rewardsList.appendChild(expReward);
      }
      
      // Add taelors reward
      if (mission.rewards.taelors) {
        const taelorReward = document.createElement('div');
        taelorReward.className = 'reward-item';
        taelorReward.innerHTML = `<span class="reward-icon">💰</span> ${mission.rewards.taelors} Taelors`;
        rewardsList.appendChild(taelorReward);
      }
      
      // Add item rewards
      if (mission.rewards.items && mission.rewards.items.length > 0) {
        mission.rewards.items.forEach(item => {
          const itemReward = document.createElement('div');
          itemReward.className = 'reward-item';
          itemReward.innerHTML = `<span class="reward-icon">📦</span> ${item.name} ${item.chance < 1 ? `(${Math.floor(item.chance * 100)}% chance)` : ''}`;
          rewardsList.appendChild(itemReward);
        });
      }
      
      // Add relationship rewards
      if (mission.rewards.relationships) {
        for (const [npcId, value] of Object.entries(mission.rewards.relationships)) {
          const relReward = document.createElement('div');
          relReward.className = 'reward-item';
          relReward.innerHTML = `<span class="reward-icon">👥</span> Improved relationship with ${_getNpcName(npcId)}`;
          rewardsList.appendChild(relReward);
        }
      }
      
      rewards.appendChild(rewardsList);
      
      // Add elements to content
      _elements.content.appendChild(description);
      _elements.content.appendChild(stageInfo);
      _elements.content.appendChild(rewards);
      
      // Show environment info if available
      if (mission.environment) {
        const environmentInfo = document.createElement('div');
        environmentInfo.className = 'mission-environment';
        environmentInfo.innerHTML = `
          <div class="environment-title">Environment:</div>
          <div class="environment-details">
            <div>Terrain: ${mission.environment.terrain}</div>
            <div>Weather: ${mission.environment.weather}</div>
          </div>
        `;
        _elements.content.appendChild(environmentInfo);
      }
      
      // Hide map when in standard view
      if (_elements.map) {
        _elements.map.style.display = 'none';
      }
    } catch (error) {
      _error("Error updating standard view:", error);
    }
  }
  
  // Update the map view
  function _updateMapView(mission) {
    if (!_elements.content || !_elements.map) return;
    
    try {
      // Clear content area
      _elements.content.innerHTML = '';
      
      // Display brief info
      const briefInfo = document.createElement('div');
      briefInfo.className = 'mission-brief-info';
      briefInfo.textContent = mission.description;
      _elements.content.appendChild(briefInfo);
      
      // Show map
      _elements.map.style.display = 'block';
      _elements.map.innerHTML = '';
      
      // Create the map visualization
      _createMapVisualization(mission);
    } catch (error) {
      _error("Error updating map view:", error);
    }
  }
  
  // Create a visual map of mission progress
  function _createMapVisualization(mission) {
    try {
      // Set map dimensions
      _elements.map.style.height = '300px';
      _elements.map.style.position = 'relative';
      
      const numStages = mission.stages.length;
      const currentStage = window.gameState.missionStage;
      
      // Create nodes for each stage
      for (let i = 0; i < numStages; i++) {
        const stage = mission.stages[i];
        
        // Calculate position (distribute stages across map width)
        const xPos = 10 + ((i / (numStages - 1)) * 80);
        
        // Vary y position based on stage type
        let yPos = 50;
        if (stage.type === 'combat') {
          yPos = 30;
        } else if (stage.type === 'choice') {
          yPos = 70;
        } else if (stage.type === 'skill_check') {
          yPos = 60;
        } else if (stage.type === 'stealth') {
          yPos = 40;
        }
        
        // Create stage node
        const node = document.createElement('div');
        node.className = `map-location ${i === currentStage ? 'current' : i < currentStage ? 'completed' : ''}`;
        node.style.left = `${xPos}%`;
        node.style.top = `${yPos}%`;
        node.setAttribute('data-stage', i);
        
        // Add tooltip with stage info
        node.title = `Stage ${i+1}: ${_formatStageType(stage.type)}`;
        
        // Add click handler to show stage details
        node.onclick = function() {
          _showStageDetails(mission, i);
        };
        
        _elements.map.appendChild(node);
        
        // Create path to next node if not the last stage
        if (i < numStages - 1) {
          const nextStage = mission.stages[i + 1];
          
          // Calculate next position
          const nextXPos = 10 + (((i + 1) / (numStages - 1)) * 80);
          let nextYPos = 50;
          
          if (nextStage.type === 'combat') {
            nextYPos = 30;
          } else if (nextStage.type === 'choice') {
            nextYPos = 70;
          } else if (nextStage.type === 'skill_check') {
            nextYPos = 60;
          } else if (nextStage.type === 'stealth') {
            nextYPos = 40;
          }
          
          // Create path element
          const path = document.createElement('div');
          path.className = 'map-path';
          
          // Calculate path dimensions and rotation
          const deltaX = nextXPos - xPos;
          const deltaY = nextYPos - yPos;
          const distance = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
          const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
          
          // Set path style
          path.style.width = `${distance}%`;
          path.style.left = `${xPos}%`;
          path.style.top = `${yPos}%`;
          path.style.transform = `rotate(${angle}deg)`;
          
          // Set class based on completion
          if (i < currentStage) {
            path.style.backgroundColor = '#4bff6b'; // Completed path
          }
          
          _elements.map.appendChild(path);
        }
      }
      
      // Add legend
      const legend = document.createElement('div');
      legend.className = 'map-legend';
      legend.innerHTML = `
        <div style="position:absolute; bottom:10px; left:10px; background:rgba(0,0,0,0.7); padding:5px; border-radius:4px; font-size:12px;">
          <div><span style="display:inline-block; width:10px; height:10px; background:#4bff6b; border-radius:50%; margin-right:5px;"></span> Current</div>
          <div><span style="display:inline-block; width:10px; height:10px; background:#4b6bff; border-radius:50%; margin-right:5px;"></span> Upcoming</div>
          <div><span style="display:inline-block; width:10px; height:10px; background:#888; border-radius:50%; margin-right:5px;"></span> Completed</div>
        </div>
      `;
      
      _elements.map.appendChild(legend);
    } catch (error) {
      _error("Error creating map visualization:", error);
    }
  }
  
  // Show details for a specific stage
  function _showStageDetails(mission, stageIndex) {
    try {
      const stage = mission.stages[stageIndex];
      if (!stage) return;
      
      // Create modal for stage details
      const modal = document.createElement('div');
      modal.className = 'stage-details-modal';
      modal.style.position = 'absolute';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.background = 'rgba(0, 0, 0, 0.9)';
      modal.style.padding = '20px';
      modal.style.borderRadius = '8px';
      modal.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
      modal.style.zIndex = '1100';
      modal.style.maxWidth = '80%';
      modal.style.maxHeight = '80%';
      modal.style.overflow = 'auto';
      
      // Add close button
      const closeBtn = document.createElement('div');
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '10px';
      closeBtn.style.right = '10px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.textContent = '✕';
      closeBtn.style.fontSize = '20px';
      closeBtn.onclick = function() {
        document.body.removeChild(modal);
      };
      
      modal.appendChild(closeBtn);
      
      // Add stage content
      const content = document.createElement('div');
      
      // Stage header
      content.innerHTML = `
        <h3>Stage ${stageIndex + 1}: ${_formatStageType(stage.type)}</h3>
        <div class="stage-status">${stageIndex === window.gameState.missionStage ? 'Current' : stageIndex < window.gameState.missionStage ? 'Completed' : 'Upcoming'}</div>
      `;
      
      // Stage specific details
      switch (stage.type) {
        case 'text':
          content.innerHTML += `<p>${stage.text}</p>`;
          break;
        case 'combat':
          content.innerHTML += `
            <p>${stage.text}</p>
            <div class="enemy-details">
              <strong>Enemy:</strong> ${stage.enemy ? stage.enemy.name : 'Unknown'}
            </div>
            <div class="environment-details">
              <strong>Environment:</strong> ${stage.environment ? `${stage.environment.terrain}, ${stage.environment.weather}` : 'Standard'}
            </div>
          `;
          break;
        case 'choice':
          content.innerHTML += `
            <p>${stage.text}</p>
            <div class="choices-list">
              <strong>Choices:</strong>
              <ul>
                ${stage.choices.map(choice => `<li>${choice.text}${choice.requires ? ' (Requires specific skills)' : ''}</li>`).join('')}
              </ul>
            </div>
          `;
          break;
        case 'skill_check':
          content.innerHTML += `
            <p>${stage.text}</p>
            <div class="skill-details">
              <strong>Skill:</strong> ${stage.skill}
              <br>
              <strong>Difficulty:</strong> ${stage.difficulty}
            </div>
          `;
          break;
        case 'stealth':
          content.innerHTML += `
            <p>${stage.text}</p>
            <div class="stealth-details">
              <strong>Detection Difficulty:</strong> ${stage.difficulty || 'Medium'}
            </div>
          `;
          break;
        case 'dialogue':
          content.innerHTML += `
            <p>Dialogue interaction with NPCs.</p>
            <div class="dialogue-preview">
              ${stage.dialogue ? stage.dialogue.map(d => `<div><strong>${d.speaker}:</strong> "${d.text.substring(0, 50)}${d.text.length > 50 ? '...' : ''}"</div>`).join('') : 'dialogue'}
            </div>
          `;
          break;
        default:
          content.innerHTML += `<p>${stage.text || 'Stage details not available'}</p>`;
      }
      
      modal.appendChild(content);
      document.body.appendChild(modal);
    } catch (error) {
      _error("Error showing stage details:", error);
    }
  }
  
  // Update the details view (advanced mission info)
  function _updateDetailsView(mission) {
    if (!_elements.content) return;
    
    try {
      _elements.content.innerHTML = '';
      
      // Create detailed mission information
      const detailedInfo = document.createElement('div');
      detailedInfo.className = 'mission-detailed-info';
      
      // Mission type and chain info
      let missionTypeText = "";
      
      // Determine mission type description
      switch (mission.type) {
        case 'combat':
          missionTypeText = "Combat Operation";
          break;
        case 'stealth':
          missionTypeText = "Stealth Infiltration";
          break;
        case 'recon':
          missionTypeText = "Reconnaissance Mission";
          break;
        case 'diplomatic':
          missionTypeText = "Diplomatic Negotiation";
          break;
        case 'escort':
          missionTypeText = "Escort Assignment";
          break;
        case 'supply':
          missionTypeText = "Supply Procurement";
          break;
        case 'rescue':
          missionTypeText = "Rescue Operation";
          break;
        default:
          missionTypeText = "Standard Mission";
      }
      
      // Add mission chain info if available
      let chainInfo = "";
      if (mission.chainId) {
        chainInfo = `<div>Part of Operation: ${mission.chainId}</div>`;
        if (mission.chainPosition && mission.chainLength) {
          chainInfo += `<div>Mission ${mission.chainPosition} of ${mission.chainLength}</div>`;
        }
      }
      
      // Mission statistics
      detailedInfo.innerHTML = `
        <div class="mission-type-info">
          <div class="detail-section-title">Mission Type</div>
          <div>${missionTypeText}</div>
          ${chainInfo}
        </div>
        
        <div class="mission-stages-info">
          <div class="detail-section-title">Mission Composition</div>
          <div>Total Stages: ${mission.stages.length}</div>
          <div>Current Stage: ${window.gameState.missionStage + 1}</div>
          <div>Completion: ${Math.round((window.gameState.missionStage / mission.stages.length) * 100)}%</div>
        </div>
        
        <div class="mission-location-info">
          <div class="detail-section-title">Location</div>
          <div>Region: ${mission.location || 'Unknown'}</div>
          <div>Terrain: ${mission.environment?.terrain || 'Standard'}</div>
          <div>Weather: ${mission.environment?.weather || 'Clear'}</div>
        </div>
        
        <div class="mission-requirements-info">
          <div class="detail-section-title">Mission Analysis</div>
          <div>Difficulty Rating: ${mission.difficulty}/5</div>
          <div>Recommended Skills: ${_getRecommendedSkills(mission).join(', ')}</div>
          <div>Risk Assessment: ${_getRiskAssessment(mission)}</div>
        </div>
      `;
      
      // Add stage breakdown
      const stageBreakdown = document.createElement('div');
      stageBreakdown.className = 'mission-stage-breakdown';
      stageBreakdown.innerHTML = `
        <div class="detail-section-title">Stage Breakdown</div>
        <div class="stage-list">
          ${mission.stages.map((stage, index) => `
            <div class="stage-item ${index === window.gameState.missionStage ? 'current' : index < window.gameState.missionStage ? 'completed' : ''}">
              <div class="stage-number">${index + 1}</div>
              <div class="stage-type">${_formatStageType(stage.type)}</div>
              <div class="stage-status">${index === window.gameState.missionStage ? 'Current' : index < window.gameState.missionStage ? 'Completed' : 'Upcoming'}</div>
            </div>
          `).join('')}
        </div>
      `;
      
      _elements.content.appendChild(detailedInfo);
      _elements.content.appendChild(stageBreakdown);
      
      // Hide map in details view
      if (_elements.map) {
        _elements.map.style.display = 'none';
      }
    } catch (error) {
      _error("Error updating details view:", error);
    }
  }
  
  // Get recommended skills for a mission
  function _getRecommendedSkills(mission) {
    const skills = new Set();
    
    // Check each stage for skill requirements
    mission.stages.forEach(stage => {
      if (stage.skill) {
        skills.add(_formatSkillName(stage.skill));
      }
      
      if (stage.type === 'choice' && stage.choices) {
        stage.choices.forEach(choice => {
          if (choice.requires) {
            Object.keys(choice.requires).forEach(req => {
              if (req.startsWith('skills.')) {
                skills.add(_formatSkillName(req.split('.')[1]));
              } else if (req === 'phy') {
                skills.add('Physical');
              } else if (req === 'men') {
                skills.add('Mental');
              }
            });
          }
        });
      }
    });
    
    // Add default skills based on mission type
    switch (mission.type) {
      case 'combat':
        skills.add('Melee');
        skills.add('Tactics');
        break;
      case 'stealth':
        skills.add('Survival');
        break;
      case 'recon':
        skills.add('Marksmanship');
        skills.add('Survival');
        break;
      case 'diplomatic':
        skills.add('Command');
        break;
    }
    
    return Array.from(skills);
  }
  
  // Get risk assessment based on mission difficulty and player level
  function _getRiskAssessment(mission) {
    const playerLevel = window.gameState.level || 1;
    const missionDifficulty = mission.difficulty || 3;
    
    const difficultyGap = missionDifficulty - playerLevel;
    
    if (difficultyGap >= 3) {
      return "Extreme - Success highly unlikely";
    } else if (difficultyGap === 2) {
      return "Very High - Proceed with extreme caution";
    } else if (difficultyGap === 1) {
      return "High - Significant challenge expected";
    } else if (difficultyGap === 0) {
      return "Moderate - Appropriate for your experience";
    } else if (difficultyGap === -1) {
      return "Low - Should be manageable";
    } else {
      return "Minimal - Well within your capabilities";
    }
  }
  
  // Update mission objectives
  function _updateObjectives(mission) {
    if (!_elements.objectives) return;
    
    try {
      _elements.objectives.innerHTML = '';
      
      const title = document.createElement('div');
      title.className = 'objectives-title';
      title.textContent = 'Current Objectives';
      _elements.objectives.appendChild(title);
      
      const currentStage = mission.stages[window.gameState.missionStage];
      
      // If current stage has objectives, display them
      if (currentStage && currentStage.objectives && currentStage.objectives.length > 0) {
        currentStage.objectives.forEach(objective => {
          const objectiveItem = document.createElement('div');
          objectiveItem.className = `objective-item ${objective.completed ? 'completed' : ''}`;
          
          const checkbox = document.createElement('div');
          checkbox.className = 'objective-checkbox';
          checkbox.innerHTML = objective.completed ? '✓' : '';
          
          const text = document.createElement('div');
          text.className = 'objective-text';
          text.textContent = objective.text;
          
          objectiveItem.appendChild(checkbox);
          objectiveItem.appendChild(text);
          
          _elements.objectives.appendChild(objectiveItem);
        });
      } else {
        // Create a default objective based on stage type
        const defaultObjective = document.createElement('div');
        defaultObjective.className = 'objective-item';
        
        const checkbox = document.createElement('div');
        checkbox.className = 'objective-checkbox';
        
        const text = document.createElement('div');
        text.className = 'objective-text';
        
        // Generate default objective text based on stage type
        if (currentStage) {
          switch (currentStage.type) {
            case 'combat':
              text.textContent = "Defeat the enemy forces";
              break;
            case 'choice':
              text.textContent = "Make a decision for how to proceed";
              break;
            case 'skill_check':
              text.textContent = `Complete the ${currentStage.skill} skill check`;
              break;
            case 'stealth':
              text.textContent = "Navigate the area without detection";
              break;
            case 'dialogue':
              text.textContent = "Complete the dialogue interaction";
              break;
            default:
              text.textContent = "Proceed to the next stage of the mission";
          }
        } else {
          text.textContent = "Complete the current mission stage";
        }
        
        defaultObjective.appendChild(checkbox);
        defaultObjective.appendChild(text);
        
        _elements.objectives.appendChild(defaultObjective);
      }
    } catch (error) {
      _error("Error updating objectives:", error);
    }
  }
  
  // Update mission metrics
  function _updateMetrics(mission) {
    if (!_elements.metrics) return;
    
    try {
      _elements.metrics.innerHTML = '';
      
      // Time metrics
      const timeMetric = document.createElement('div');
      timeMetric.className = 'metric-item';
      timeMetric.innerHTML = `
        <div class="metric-title">Time Elapsed</div>
        <div class="metric-value">${_formatElapsedTime(_missionMetrics.startTime)}</div>
      `;
      
      // Progress metrics
      const progressMetric = document.createElement('div');
      progressMetric.className = 'metric-item';
      
      const currentStage = window.gameState.missionStage + 1;
      const totalStages = mission.stages.length;
      const progressPercentage = Math.round((currentStage / totalStages) * 100);
      
      progressMetric.innerHTML = `
        <div class="metric-title">Mission Progress</div>
        <div class="metric-value">${progressPercentage}%</div>
      `;
      
      // Combat metrics if available
      const combatMetric = document.createElement('div');
      combatMetric.className = 'metric-item';
      
      combatMetric.innerHTML = `
        <div class="metric-title">Combat Encounters</div>
        <div class="metric-value">${_missionMetrics.combatEncounters || 0}</div>
      `;
      
      // Add health status
      const healthMetric = document.createElement('div');
      healthMetric.className = 'metric-item';
      
      const healthPercentage = Math.round((window.gameState.health / window.gameState.maxHealth) * 100);
      
      healthMetric.innerHTML = `
        <div class="metric-title">Current Health</div>
        <div class="metric-value">${healthPercentage}%</div>
      `;
      
      _elements.metrics.appendChild(timeMetric);
      _elements.metrics.appendChild(progressMetric);
      _elements.metrics.appendChild(combatMetric);
      _elements.metrics.appendChild(healthMetric);
    } catch (error) {
      _error("Error updating metrics:", error);
    }
  }
  
  // Update mission action buttons
  function _updateActionButtons(mission) {
    if (!_elements.actions) return;
    
    try {
      _elements.actions.innerHTML = '';
      
      // Continue button for normal gameplay
      const continueBtn = document.createElement('button');
      continueBtn.className = 'mission-action-btn';
      continueBtn.textContent = 'Continue Mission';
      continueBtn.onclick = function() {
        _hideInterface();
      };
      
      // Abandon mission button
      const abandonBtn = document.createElement('button');
      abandonBtn.className = 'mission-action-btn danger';
      abandonBtn.textContent = 'Abandon Mission';
      abandonBtn.onclick = function() {
        if (confirm("Are you sure you want to abandon the mission? All progress will be lost.")) {
          _abandonMission();
        }
      };
      
      _elements.actions.appendChild(continueBtn);
      _elements.actions.appendChild(abandonBtn);
    } catch (error) {
      _error("Error updating action buttons:", error);
    }
  }
  
  // Set the display mode and update the interface
  function _setDisplayMode(mode) {
    _displayMode = mode;
    _updateInterfaceContent(_currentMission);
  }
  
  // Format stage type for display
  function _formatStageType(type) {
    if (!type) return 'Unknown';
    
    // Capitalize first letter and replace underscores with spaces
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  }
  
  // Format skill name for display
  function _formatSkillName(skill) {
    if (!skill) return 'Unknown';
    
    // Capitalize first letter
    return skill.charAt(0).toUpperCase() + skill.slice(1);
  }
  
  // Format elapsed time
  function _formatElapsedTime(startTime) {
    if (!startTime) return '0:00';
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  // Get NPC name from ID
  function _getNpcName(npcId) {
    const npcNames = {
      'commander': 'Commander Thelian',
      'sergeant': 'Sergeant Darius',
      'quartermaster': 'Quartermaster Cealdain'
    };
    
    return npcNames[npcId] || npcId;
  }
  
  // Abandon the current mission
  function _abandonMission() {
    try {
      // Hide the interface
      _hideInterface();
      
      // Reset mission state in game
      window.gameState.inMission = false;
      window.gameState.currentMission = null;
      window.gameState.missionStage = 0;
      window.gameState.inMissionCombat = false;
      
      // Update UI
      if (window.UI && typeof window.UI.updateActionButtons === 'function') {
        window.UI.updateActionButtons();
      } else if (typeof window.updateActionButtons === 'function') {
        window.updateActionButtons();
      }
      
      // Show narrative
      if (typeof window.setNarrative === 'function') {
        window.setNarrative("You've abandoned your mission and returned to camp. Your superiors may not be pleased, but sometimes discretion is the better part of valor.");
      }
      
      // Show notification
      if (typeof window.showNotification === 'function') {
        window.showNotification("Mission abandoned", "info");
      }
    } catch (error) {
      _error("Error abandoning mission:", error);
    }
  }
  
  // Public API
  return {
    // Initialize the enhanced mission interface
    init: function() {
      _log("Initializing enhanced mission interface");
      
      // Create the interface if it doesn't exist
      if (!_elements.container) {
        _createInterface();
      }
      
      // Register with mission system if available
      if (window.MissionSystem) {
        _log("Registering with mission system");
        
        if (typeof window.MissionSystem.on === 'function') {
          window.MissionSystem.on('missionStart', (data) => {
            this.onMissionStart(data.mission);
          });
          
          window.MissionSystem.on('stageChange', (data) => {
            this.onStageChange(data.mission, data.stageIndex);
          });
          
          window.MissionSystem.on('missionComplete', (data) => {
            this.onMissionComplete(data.mission);
          });
          
          window.MissionSystem.on('missionFail', (data) => {
            this.onMissionFail(data.mission);
          });
        }
      }
      
      // Set up key listener for toggling interface
      document.addEventListener('keydown', (e) => {
        // Toggle with 'M' key when in a mission
        if (e.key === 'm' && window.gameState.inMission) {
          if (_elements.container.classList.contains('active')) {
            this.hide();
          } else {
            this.show();
          }
        }
      });
      
      _log("Enhanced mission interface initialized");
      return true;
    },
    
    // Show the mission interface
    show: function() {
      try {
        // Get current mission
        _currentMission = window.gameState.currentMission;
        
        if (!_currentMission) {
          console.warn("No active mission to display");
          return false;
        }
        
        // Make sure interface is created
        if (!_elements.container) {
          _createInterface();
        }
        
        // Update interface content
        _updateInterfaceContent(_currentMission);
        
        // Show the interface
        _elements.container.classList.add('active');
        
        return true;
      } catch (error) {
        _error("Error showing interface:", error);
        return false;
      }
    },
    
    // Hide the mission interface
    hide: function() {
      try {
        if (_elements.container) {
          _elements.container.classList.remove('active');
        }
        
        return true;
      } catch (error) {
        _error("Error hiding interface:", error);
        return false;
      }
    },
    
    // Handle mission start event
    onMissionStart: function(mission) {
      try {
        _log("Mission started:", mission.title);
        
        // Store mission data
        _currentMission = mission;
        
        // Initialize metrics
        _missionMetrics = {
          startTime: Date.now(),
          combatEncounters: 0,
          skillChecks: 0,
          skillCheckSuccesses: 0,
          damageReceived: 0,
          damageDealt: 0
        };
        
        // Initialize progress history
        _progressHistory = [];
        
        // Record initial progress
        _progressHistory.push({
          timestamp: Date.now(),
          stage: 0,
          health: window.gameState.health,
          event: 'start'
        });
        
        // Show interface automatically at mission start
        setTimeout(() => {
          this.show();
        }, 1000);
        
        return true;
      } catch (error) {
        _error("Error handling mission start:", error);
        return false;
      }
    },
    
    // Handle stage change event
    onStageChange: function(mission, stageIndex) {
      try {
        _log("Stage changed:", stageIndex);
        
        // Update mission data
        _currentMission = mission;
        
        // Record progress
        _progressHistory.push({
          timestamp: Date.now(),
          stage: stageIndex,
          health: window.gameState.health,
          event: 'stage_change'
        });
        
        // Update interface if visible
        if (_elements.container && _elements.container.classList.contains('active')) {
          _updateInterfaceContent(mission);
        }
        
        return true;
      } catch (error) {
        _error("Error handling stage change:", error);
        return false;
      }
    },
    
    // Handle mission complete event
    onMissionComplete: function(mission) {
      try {
        _log("Mission completed:", mission.title);
        
        // Record final progress
        _progressHistory.push({
          timestamp: Date.now(),
          stage: window.gameState.missionStage,
          health: window.gameState.health,
          event: 'complete'
        });
        
        // Hide interface
        this.hide();
        
        return true;
      } catch (error) {
        _error("Error handling mission complete:", error);
        return false;
      }
    },
    
    // Handle mission fail event
    onMissionFail: function(mission) {
      try {
        _log("Mission failed:", mission.title);
        
        // Record final progress
        _progressHistory.push({
          timestamp: Date.now(),
          stage: window.gameState.missionStage,
          health: window.gameState.health,
          event: 'fail'
        });
        
        // Hide interface
        this.hide();
        
        return true;
      } catch (error) {
        _error("Error handling mission fail:", error);
        return false;
      }
    },
    
    // Update combat metrics
    updateCombatMetrics: function(enemies, damageDealt, damageReceived) {
      try {
        if (!_missionMetrics) return false;
        
        _missionMetrics.combatEncounters++;
        _missionMetrics.damageDealt = (_missionMetrics.damageDealt || 0) + damageDealt;
        _missionMetrics.damageReceived = (_missionMetrics.damageReceived || 0) + damageReceived;
        
        return true;
      } catch (error) {
        _error("Error updating combat metrics:", error);
        return false;
      }
    },
    
    // Update skill check metrics
    updateSkillCheckMetrics: function(skill, difficulty, success) {
      try {
        if (!_missionMetrics) return false;
        
        _missionMetrics.skillChecks++;
        if (success) {
          _missionMetrics.skillCheckSuccesses++;
        }
        
        return true;
      } catch (error) {
        _error("Error updating skill check metrics:", error);
        return false;
      }
    },
    
    // Get mission metrics
    getMissionMetrics: function() {
      return {..._missionMetrics};
    },
    
    // Get mission progress history
    getProgressHistory: function() {
      return [..._progressHistory];
    }
  };
})();

// Helper function to hide the interface - defined here to avoid underscore prefix
function _hideInterface() {
  if (window.MissionInterface) {
    window.MissionInterface.hide();
  }
}

// Initialize the enhanced mission interface when document is ready
document.addEventListener('DOMContentLoaded', function() {
  if (window.MissionInterface) {
    window.MissionInterface.init();
  }
});
