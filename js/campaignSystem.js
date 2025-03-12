// js/campaignSystem.js
window.campaignSystem = {
    // Campaign state
    currentCampaign: null,
    currentNode: null,
    completedNodes: [],
    armyJoined: false,
    campaignDay: 0,
    
    // Initialize the campaign system
    initialize: function() {
      // Create the map container if it doesn't exist
      if (!document.getElementById('campaignMapContainer')) {
        this.createMapContainer();
      }
      
      // Add region labels to the map
      this.addRegionLabels();
      
      // Setup event handlers
      this.setupEventHandlers();
      
      console.log("Campaign system initialized");
    },
    
    // Create the map container and add it to the document
    createMapContainer: function() {
      // Create the container element
      const container = document.createElement('div');
      container.id = 'campaignMapContainer';
      container.className = 'hidden';
      
      // Add the HTML structure
      container.innerHTML = `
        <div class="map-ui-header">
          <h2>Campaign: <span id="campaignName">Arrasi Peninsula Invasion</span></h2>
          <div class="campaign-stats">
            <div>Day: <span id="campaignDay">0</span></div>
            <div>Army Strength: <span id="armyStrength">100</span>%</div>
          </div>
          <button id="closeMapButton" class="map-button">Close Map</button>
        </div>
        
        <div class="map-display">
          <div id="mapBackground"></div>
          <div id="nodesContainer"></div>
          <div id="pathsContainer"></div>
          <div id="armyMarker" class="army-marker">⚔️</div>
        </div>
        
        <div class="map-ui-footer">
          <div id="nodeInfo" class="node-info-box">
            <h3 id="nodeTitle">Select a location</h3>
            <p id="nodeDescription">Click on a location to see details.</p>
          </div>
          <button id="advanceCampaignButton" class="map-button">Advance to Next Location</button>
        </div>
      `;
      
      // Add to document
      document.body.appendChild(container);
      
      // Add CSS styles for map if they don't exist
      if (!document.getElementById('campaign-map-styles')) {
        this.addMapStyles();
      }
    },
    
    // Add region labels to map
    addRegionLabels: function() {
      const mapBackground = document.getElementById('mapBackground');
      
      // Add Arrasi label
      const arrosiLabel = document.createElement('div');
      arrosiLabel.className = 'region-label arrasi';
      arrosiLabel.textContent = 'Arrasi Peninsula';
      mapBackground.appendChild(arrosiLabel);
      
      // Add Nesia label
      const nesiaLabel = document.createElement('div');
      nesiaLabel.className = 'region-label nesia';
      nesiaLabel.textContent = 'Nesia';
      mapBackground.appendChild(nesiaLabel);
    },
    
    // Add CSS styles for map
    addMapStyles: function() {
      const styleElement = document.createElement('style');
      styleElement.id = 'campaign-map-styles';
      styleElement.textContent = `
        /* Campaign Map Styles */
        #campaignMapContainer {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.9);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          padding: 20px;
          box-sizing: border-box;
          color: #e0e0e0;
        }
        
        .map-ui-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .map-display {
          position: relative;
          flex-grow: 1;
          overflow: hidden;
          border-radius: 8px;
          background-color: #121212;
        }
        
        #mapBackground {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          /* Create the map using CSS instead of an image */
          background: linear-gradient(to right, 
            #1e293b 0%, /* Arrasi Peninsula - darker land */
            #1e293b 35%, /* End of peninsula */
            #0f4c81 36%, /* Sea border */
            #0f4c81 100% /* Sea */
          );
        }
        
        /* Create geographical features using CSS elements */
        #mapBackground::before {
          content: '';
          position: absolute;
          width: 35%;
          height: 100%;
          background:
            radial-gradient(circle at 10% 30%, #2d4263 0%, transparent 25%) no-repeat,
            radial-gradient(circle at 20% 60%, #2d4263 0%, transparent 30%) no-repeat,
            radial-gradient(circle at 15% 40%, #2d4263 0%, transparent 20%) no-repeat;
          /* Mountains and terrain in Arrasi */
        }
        
        #mapBackground::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 65%;
          height: 100%; 
          /* Create some texture for the sea */
          background: repeating-linear-gradient(
            45deg,
            rgba(15, 76, 129, 0.5),
            rgba(15, 76, 129, 0.5) 10px,
            rgba(15, 76, 129, 0.7) 10px,
            rgba(15, 76, 129, 0.7) 20px
          );
          opacity: 0.2;
        }
        
        /* Region labels on map */
        .region-label {
          position: absolute;
          color: rgba(255, 255, 255, 0.7);
          font-weight: bold;
          font-size: 14px;
          text-shadow: 0 0 4px #000;
          pointer-events: none;
        }
        
        .region-label.arrasi {
          top: 20%;
          left: 10%;
        }
        
        .region-label.nesia {
          top: 35%;
          left: 30%;
        }
        
        #nodesContainer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 2;
        }
        
        #pathsContainer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }
        
        .map-node {
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.2s ease;
          border: 2px solid white;
          font-size: 12px;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
          color: white;
        }
        
        .node-battle {
          background-color: rgba(255, 0, 0, 0.7);
        }
        
        .node-objective {
          background-color: rgba(0, 100, 255, 0.7);
        }
        
        .node-siege {
          background-color: rgba(128, 0, 128, 0.7);
        }
        
        .node-completed {
          background-color: rgba(0, 128, 0, 0.7);
        }
        
        .node-available {
          animation: pulse 1.5s infinite;
        }
        
        .node-current {
          border: 3px solid #FFD700;
          box-shadow: 0 0 10px #FFD700;
        }
        
        .army-marker {
          position: absolute;
          font-size: 24px;
          transform: translate(-50%, -50%);
          z-index: 10;
          filter: drop-shadow(0 0 3px black);
        }
        
        .map-path {
          position: absolute;
          background-color: rgba(255, 255, 255, 0.5);
          height: 3px;
          transform-origin: 0 0;
          pointer-events: none;
        }
        
        .path-traveled {
          background-color: #FFD700;
        }
        
        .map-ui-footer {
          display: flex;
          margin-top: 15px;
          gap: 15px;
        }
        
        .node-info-box {
          flex-grow: 1;
          background-color: rgba(30, 30, 30, 0.8);
          border-radius: 8px;
          padding: 10px 15px;
        }
        
        .map-button {
          background-color: #444;
          border: none;
          color: white;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .map-button:hover {
          background-color: #555;
        }
        
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
          100% { transform: translate(-50%, -50%) scale(1); }
        }
      `;
      
      document.head.appendChild(styleElement);
    },
    
    // Set up event handlers
    setupEventHandlers: function() {
      // Close map button
      document.getElementById('closeMapButton')?.addEventListener('click', () => {
        document.getElementById('campaignMapContainer').classList.add('hidden');
      });
      
      // Advance campaign button
      document.getElementById('advanceCampaignButton')?.addEventListener('click', () => {
        if (this.currentCampaign && this.currentNode) {
          this.advanceToCurrent();
        }
      });
    },
    
    // Node data structure
    createNodeTemplate: function(config) {
      return {
        id: config.id,
        name: config.name,
        description: config.description,
        position: config.position, // {x, y} coordinates on map
        nodeType: config.nodeType || "battle", // battle, objective, siege
        difficulty: config.difficulty || 1,
        connections: config.connections || [], // IDs of connected nodes
        resources: config.resources || {}, // Resources gained from capturing
        completed: false,
        available: config.available || false,
        
        // Special attributes for different node types
        objectiveDetails: config.objectiveDetails || null,
        battleDetails: config.battleDetails || null,
        siegeDetails: config.siegeDetails || null
      };
    },
    
    // Campaign data structure
    createCampaignTemplate: function(config) {
      return {
        id: config.id,
        name: config.name,
        description: config.description,
        region: config.region,
        startNode: config.startNode,
        endNode: config.endNode,
        nodes: config.nodes || {},
        armyStrength: config.armyStrength || 100,
        enemyStrength: config.enemyStrength || 100,
        daysPassed: 0,
        completed: false,
        outcome: null
      };
    },
    
    // Create Arrasi Peninsula Campaign
    createArrasiCampaign: function() {
      // Create campaign object
      const arrasiCampaign = this.createCampaignTemplate({
        id: 'arrasi_peninsula',
        name: 'Invasion of the Arrasi Peninsula',
        description: 'Lead your forces into the mysterious Arrasi Peninsula, where crystalline plains and fierce defenders await.',
        region: 'arrasi',
        startNode: 'nesian_border',
        endNode: 'crystal_citadel',
        armyStrength: 100,
        enemyStrength: 100,
        nodes: {}
      });
      
      // Create nodes - positions based on the map geography
      arrasiCampaign.nodes['nesian_border'] = this.createNodeTemplate({
        id: 'nesian_border',
        name: 'Nesian Border',
        description: 'The fortified border between Nesia and the Arrasi Peninsula. Your forces have gathered here for the invasion.',
        position: { x: 30, y: 30 }, // Near the border between Nesia and Arrasi
        nodeType: 'objective',
        available: true,
        connections: ['coastal_village'],
        objectiveDetails: {
          mission: 'Establish supply lines for the campaign'
        }
      });
      
      arrasiCampaign.nodes['coastal_village'] = this.createNodeTemplate({
        id: 'coastal_village',
        name: 'Arrasi Coastal Village',
        description: 'A fishing settlement on the coast. Taking it will secure a supply route by sea.',
        position: { x: 22, y: 40 }, 
        nodeType: 'battle',
        connections: ['crossroads', 'southern_hills'],
        battleDetails: {
          enemyType: 'Arrasi Militia',
          commanderName: 'Local Headman'
        }
      });
      
      arrasiCampaign.nodes['crossroads'] = this.createNodeTemplate({
        id: 'crossroads',
        name: 'Trading Crossroads',
        description: 'A strategic junction where trade routes from across the peninsula converge.',
        position: { x: 15, y: 45 },
        nodeType: 'objective',
        connections: ['crystal_plains', 'vaelgorr_camp'],
        objectiveDetails: {
          mission: 'Gather intelligence on enemy movements'
        }
      });
      
      arrasiCampaign.nodes['southern_hills'] = this.createNodeTemplate({
        id: 'southern_hills',
        name: 'Southern Hills',
        description: 'Elevated terrain overlooking much of the southern peninsula. An excellent defensive position.',
        position: { x: 24, y: 55 },
        nodeType: 'battle',
        connections: ['vaelgorr_camp', 'spear_fortress'],
        battleDetails: {
          enemyType: 'Arrasi Archers',
          commanderName: 'Hill Captain'
        }
      });
      
      arrasiCampaign.nodes['crystal_plains'] = this.createNodeTemplate({
        id: 'crystal_plains',
        name: 'Crystal Plains',
        description: 'Strange, shimmering plains where crystal formations distort vision and create illusions.',
        position: { x: 10, y: 60 },
        nodeType: 'battle',
        difficulty: 7,
        connections: ['western_cliffs', 'crystal_citadel'],
        battleDetails: {
          enemyType: 'Arrasi Vaelgorr Infantry',
          commanderName: 'Crystal Warden'
        }
      });
      
      arrasiCampaign.nodes['vaelgorr_camp'] = this.createNodeTemplate({
        id: 'vaelgorr_camp',
        name: 'Vaelgorr War Camp',
        description: 'A large encampment of Arrasi Vaelgorr warriors, ready to defend their homeland.',
        position: { x: 18, y: 65 },
        nodeType: 'battle',
        difficulty: 6,
        connections: ['crystal_plains', 'spear_fortress'],
        battleDetails: {
          enemyType: 'Arrasi Vaelgorr Elite',
          commanderName: 'Vaelgorr Warleader'
        }
      });
      
      arrasiCampaign.nodes['spear_fortress'] = this.createNodeTemplate({
        id: 'spear_fortress',
        name: 'Spear Fortress',
        description: 'A formidable fortress guarding the approach to the inner peninsula.',
        position: { x: 26, y: 70 },
        nodeType: 'siege',
        difficulty: 8,
        connections: ['crystal_citadel'],
        siegeDetails: {
          fortStrength: 7,
          defendersCount: 'Heavy',
          hasArtillery: true
        }
      });
      
      arrasiCampaign.nodes['western_cliffs'] = this.createNodeTemplate({
        id: 'western_cliffs',
        name: 'Western Cliffs',
        description: 'Treacherous cliffs overlooking the western sea. A dangerous position that provides a flanking route.',
        position: { x: 5, y: 70 },
        nodeType: 'objective',
        connections: ['crystal_citadel'],
        objectiveDetails: {
          mission: 'Secure a flanking position for the final assault'
        }
      });
      
      arrasiCampaign.nodes['crystal_citadel'] = this.createNodeTemplate({
        id: 'crystal_citadel',
        name: 'Crystal Citadel',
        description: 'The heart of Arrasi power, a massive fortress built into a mountain of crystal. Capturing this will secure the peninsula.',
        position: { x: 15, y: 80 },
        nodeType: 'siege',
        difficulty: 10,
        connections: [],
        siegeDetails: {
          fortStrength: 10,
          defendersCount: 'Massive',
          hasArtillery: true,
          specialDefenses: 'Crystal Illusion Fields'
        }
      });
      
      return arrasiCampaign;
    },
    
    // Start a campaign
    startCampaign: function(campaignId) {
      // For now, we'll focus on the Arrasi campaign
      const campaign = this.createArrasiCampaign();
      this.currentCampaign = campaign;
      
      // Set the starting node as current and available
      this.currentNode = campaign.startNode;
      campaign.nodes[campaign.startNode].available = true;
      
      // Show the map UI
      document.getElementById('campaignMapContainer').classList.remove('hidden');
      this.renderCampaignMap(campaign);
      
      // Show narrative about campaign start
      window.setNarrative(`Your Kasvaari has joined the main Armarin for the invasion of the ${campaign.name}. The Veyar has ordered all forces to prepare for a prolonged campaign. Your journey begins at ${campaign.nodes[campaign.startNode].name}, where you'll establish the foundation for this ambitious conquest.`);
      
      return campaign;
    },
    
    // Render campaign map
    renderCampaignMap: function(campaign) {
      // Clear previous nodes and paths
      document.getElementById('nodesContainer').innerHTML = '';
      document.getElementById('pathsContainer').innerHTML = '';
      
      // Update campaign title
      document.getElementById('campaignName').textContent = campaign.name;
      document.getElementById('campaignDay').textContent = campaign.daysPassed;
      document.getElementById('armyStrength').textContent = campaign.armyStrength;
      
      // Render nodes
      for (const nodeId in campaign.nodes) {
        const node = campaign.nodes[nodeId];
        this.renderNode(node);
      }
      
      // Render paths between connected nodes
      this.renderPaths(campaign);
      
      // Position army marker at current node
      if (this.currentNode) {
        const currentNode = campaign.nodes[this.currentNode];
        this.updateArmyMarker(currentNode.position.x, currentNode.position.y);
      }
    },
    
    // Render a single node
    renderNode: function(node) {
      const nodesContainer = document.getElementById('nodesContainer');
      
      // Create node element
      const nodeElement = document.createElement('div');
      nodeElement.className = `map-node node-${node.nodeType}`;
      nodeElement.dataset.nodeId = node.id;
      
      // Add state classes
      if (node.completed) {
        nodeElement.classList.add('node-completed');
      }
      if (node.available) {
        nodeElement.classList.add('node-available');
      }
      if (node.id === this.currentNode) {
        nodeElement.classList.add('node-current');
      }
      
      // Position node on map
      nodeElement.style.left = `${node.position.x}%`;
      nodeElement.style.top = `${node.position.y}%`;
      
      // Add node symbol based on type
      let nodeSymbol = '•';
      if (node.nodeType === 'battle') nodeSymbol = '⚔️';
      if (node.nodeType === 'objective') nodeSymbol = '🎯';
      if (node.nodeType === 'siege') nodeSymbol = '🏰';
      
      nodeElement.innerHTML = `<span>${nodeSymbol}</span>`;
      
      // Add click handler to show node info
      nodeElement.addEventListener('click', () => {
        this.showNodeInfo(node);
      });
      
      nodesContainer.appendChild(nodeElement);
    },
    
    // Render paths between nodes
    renderPaths: function(campaign) {
      const pathsContainer = document.getElementById('pathsContainer');
      const drawnPaths = new Set(); // To avoid drawing the same path twice
      
      // For each node, draw paths to its connections
      for (const nodeId in campaign.nodes) {
        const node = campaign.nodes[nodeId];
        
        node.connections.forEach(connectedId => {
          // Create a unique path identifier
          const pathId = [nodeId, connectedId].sort().join('-');
          
          // Skip if path already drawn
          if (drawnPaths.has(pathId)) return;
          drawnPaths.add(pathId);
          
          const connectedNode = campaign.nodes[connectedId];
          
          // Calculate path position and angle
          const x1 = node.position.x;
          const y1 = node.position.y;
          const x2 = connectedNode.position.x;
          const y2 = connectedNode.position.y;
          
          const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
          const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
          
          // Create path element
          const pathElement = document.createElement('div');
          pathElement.className = 'map-path';
          
          // Check if path has been traveled
          const bothCompleted = node.completed && connectedNode.completed;
          if (bothCompleted) {
            pathElement.classList.add('path-traveled');
          }
          
          // Position and rotate path
          pathElement.style.width = `${length}%`;
          pathElement.style.left = `${x1}%`;
          pathElement.style.top = `${y1}%`;
          pathElement.style.transform = `rotate(${angle}deg)`;
          
          pathsContainer.appendChild(pathElement);
        });
      }
    },
    
    // Update army marker position
    updateArmyMarker: function(x, y) {
      const armyMarker = document.getElementById('armyMarker');
      armyMarker.style.left = `${x}%`;
      armyMarker.style.top = `${y}%`;
    },
    
    // Show node information
    showNodeInfo: function(node) {
      const nodeTitle = document.getElementById('nodeTitle');
      const nodeDescription = document.getElementById('nodeDescription');
      
      nodeTitle.textContent = node.name;
      
      let descriptionText = node.description;
      
      // Add specific details based on node type
      if (node.nodeType === 'battle') {
        descriptionText += `\n\nBattle difficulty: ${node.difficulty}/10`;
        if (node.battleDetails) {
          descriptionText += `\nEnemy forces: ${node.battleDetails.enemyType}`;
        }
      } else if (node.nodeType === 'objective') {
        descriptionText += `\n\nMission: ${node.objectiveDetails?.mission || 'Unknown'}`;
      } else if (node.nodeType === 'siege') {
        descriptionText += `\n\nFortification strength: ${node.siegeDetails?.fortStrength || 5}/10`;
      }
      
      // Add status information
      if (node.completed) {
        descriptionText += '\n\nStatus: Captured';
      } else if (node.id === this.currentNode) {
        descriptionText += '\n\nStatus: Current position';
      } else if (node.available) {
        descriptionText += '\n\nStatus: Available to advance';
      } else {
        descriptionText += '\n\nStatus: Locked';
      }
      
      nodeDescription.textContent = descriptionText;
      
      // Update advance button state
      const advanceButton = document.getElementById('advanceCampaignButton');
      if (node.id === this.currentNode && !node.completed) {
        advanceButton.disabled = false;
        advanceButton.textContent = `Advance to ${node.name}`;
      } else {
        advanceButton.disabled = true;
        advanceButton.textContent = 'Select current node to advance';
      }
    },
    
    // Advance to current node and start its mission/battle
    advanceToCurrent: function() {
      if (!this.currentCampaign || !this.currentNode) return;
      
      const campaign = this.currentCampaign;
      const currentNode = campaign.nodes[this.currentNode];
      
      // Generate a travel narrative
      const travelDays = Math.floor(Math.random() * 3) + 1; // 1-3 days of travel
      campaign.daysPassed += travelDays;
      
      window.setNarrative(`The Armarin marches for ${travelDays} days toward ${currentNode.name}. As you approach, your Kasvaari prepares for the challenge ahead.`);
      
      // Start the appropriate node encounter based on type
      switch(currentNode.nodeType) {
        case 'battle':
          this.startBattle(currentNode);
          break;
        case 'objective':
          this.startObjective(currentNode);
          break;
        case 'siege':
          this.startSiege(currentNode);
          break;
      }
      
      // Close the map UI
      document.getElementById('campaignMapContainer').classList.add('hidden');
    },
    
    // Start a battle at a node
    startBattle: function(node) {
      window.addToNarrative(`The signal horns sound as your forces engage the enemy at ${node.name}. Your Kasvaari forms up in battle formation.`);
      
      // Start a battle using the existing combat system
      // For now, we'll create a simplified version that just shows an outcome
      setTimeout(() => {
        // If we have a combat system, try to use it
        if (window.combatSystem && window.combatSystem.initiateCombat) {
          // Map node enemy type to actual enemy template
          let enemyType = "ARRASI_VAELGORR"; // Default
          
          if (node.battleDetails && node.battleDetails.enemyType) {
            // Convert descriptive enemy type to combat system type
            if (node.battleDetails.enemyType.includes("Militia")) {
              enemyType = "IMPERIAL_DESERTER"; // Use deserter template for militia
            } else if (node.battleDetails.enemyType.includes("Elite")) {
              enemyType = "ARRASI_DRUSKARI"; // Use elite template
            }
          }
          
          try {
            // Try to initiate combat with existing system
            window.combatSystem.initiateCombat(enemyType);
            
            // We'll handle node completion in the combat resolution
            // This would need integration with combat victory events
          } catch (e) {
            console.error("Error initiating combat:", e);
            // Fallback to simplified combat
            this.fallbackBattleResolution(node);
          }
        } else {
          // No combat system, use simplified resolution
          this.fallbackBattleResolution(node);
        }
      }, 2000);
    },
    
    // Simplified battle resolution if combat system unavailable
    fallbackBattleResolution: function(node) {
      // For demonstration, we'll always win but take some army damage
      const damageTaken = Math.floor(Math.random() * 10) + 5; // 5-15% damage
      this.currentCampaign.armyStrength = Math.max(50, this.currentCampaign.armyStrength - damageTaken);
      
      window.addToNarrative(`After a fierce battle, your forces emerge victorious! The enemy has been driven from ${node.name}, though you've suffered ${damageTaken}% casualties.`);
      
      // Experience and rewards
      window.gameState.experience += 25;
      window.player.taelors += Math.floor(Math.random() * 30) + 20;
      
      // Update UI
      window.updateStatusBars();
      window.updateProfileIfVisible();
      
      // Show notification
      window.showNotification(`Battle victory! +25 XP`, 'success');
      
      // Mark node as completed and unlock connected nodes
      this.completeCurrentNode();
    },
    
    // Start an objective mission at a node
    startObjective: function(node) {
      window.addToNarrative(`Your Kasvaari has been tasked with a special mission at ${node.name}: ${node.objectiveDetails.mission}.`);
      
      // For demonstration, create a simple skill check
      const requiredSkill = Math.random() > 0.5 ? 'tactics' : 'survival';
      const skillValue = window.player.skills[requiredSkill];
      const difficulty = node.difficulty * 2;
      
      setTimeout(() => {
        if (skillValue > difficulty) {
          window.addToNarrative(`Your ${requiredSkill} skill of ${skillValue.toFixed(1)} helps you complete the mission successfully!`);
          
          // Experience bonus for completing an objective
          window.gameState.experience += 20;
          window.showNotification(`Mission complete! +20 XP`, 'success');
        } else {
          window.addToNarrative(`Despite your best efforts, the mission is only partially successful. Your ${requiredSkill} skill of ${skillValue.toFixed(1)} wasn't quite enough for the difficulty (${difficulty}).`);
          
          // Still get some experience
          window.gameState.experience += 10;
          window.showNotification(`Mission partially complete. +10 XP`, 'info');
          
          // Army takes a small morale hit
          this.currentCampaign.armyStrength = Math.max(50, this.currentCampaign.armyStrength - 3);
        }
        
        // Update UI
        window.updateStatusBars();
        window.updateProfileIfVisible();
        
        // Mark node as completed and unlock connected nodes
        this.completeCurrentNode();
      }, 2000);
    },
    
    // Start a siege at a node
    startSiege: function(node) {
      window.addToNarrative(`The massive walls of ${node.name} loom before your forces. The Veyar has ordered a full siege, and your Kasvaari will play a crucial role.`);
      
      // Sieges are multi-day operations
      const siegeDays = node.siegeDetails.fortStrength + Math.floor(Math.random() * 3);
      this.currentCampaign.daysPassed += siegeDays;
      
      setTimeout(() => {
        // Calculate siege outcome based on army strength and fort strength
        const successChance = (this.currentCampaign.armyStrength - node.siegeDetails.fortStrength * 5) / 100;
        
        if (Math.random() < successChance) {
          window.addToNarrative(`After ${siegeDays} days of siege operations, your forces breach the defenses of ${node.name}! The fortress falls to the might of the Paanic Empire.`);
          
          // Significant casualties from a siege
          const casualties = Math.floor(Math.random() * 15) + 10; // 10-25% casualties
          this.currentCampaign.armyStrength = Math.max(40, this.currentCampaign.armyStrength - casualties);
          
          window.addToNarrative(`The siege is won, but at a cost of ${casualties}% of your forces.`);
          
          // Major XP gain for sieges
          window.gameState.experience += 40;
          window.showNotification(`Siege victorious! +40 XP`, 'success');
          
          // Update UI
          window.updateStatusBars();
          window.updateProfileIfVisible();
          
          // Mark node as completed and unlock connected nodes
          this.completeCurrentNode();
        } else {
          window.addToNarrative(`After ${siegeDays} days of brutal siege warfare, your forces have failed to breach the defenses of ${node.name}. The Veyar orders a retreat to regroup.`);
          
          // Heavy casualties from a failed siege
          const casualties = Math.floor(Math.random() * 20) + 15; // 15-35% casualties
          this.currentCampaign.armyStrength = Math.max(30, this.currentCampaign.armyStrength - casualties);
          
          window.addToNarrative(`The failed siege has cost you ${casualties}% of your forces. You'll need to find another approach.`);
          
          // Some XP even for failure
          window.gameState.experience += 15;
          window.showNotification(`Siege failed. +15 XP`, 'warning');
          
          // Update UI
          window.updateStatusBars();
          window.updateProfileIfVisible();
          
          // Don't mark as completed, but allow trying again
          window.addToNarrative(`<button onclick="window.campaignSystem.showCampaignMap()" class="action-btn">View Campaign Map</button>`);
        }
      }, 2000);
    },
    
    // Mark current node as completed and unlock connected nodes
    completeCurrentNode: function() {
      if (!this.currentCampaign || !this.currentNode) return;
      
      const campaign = this.currentCampaign;
      const currentNode = campaign.nodes[this.currentNode];
      
      // Mark as completed
      currentNode.completed = true;
      
      // Make connected nodes available
      currentNode.connections.forEach(connectedId => {
        campaign.nodes[connectedId].available = true;
      });
      
      // Check if this was the end node
      if (this.currentNode === campaign.endNode) {
        this.completeCampaign();
        return;
      }
      
      // Add dialog option to view map
      window.addToNarrative(`<button onclick="window.campaignSystem.showCampaignMap()" class="action-btn">View Campaign Map</button>`);
    },
    
    // Show the campaign map
    showCampaignMap: function() {
      if (!this.currentCampaign) {
        // If no campaign exists, start one
        this.startCampaign('arrasi_peninsula');
        return;
      }
      
      // Show map UI
      document.getElementById('campaignMapContainer').classList.remove('hidden');
      this.renderCampaignMap(this.currentCampaign);
    },
    
    // Complete the entire campaign
    completeCampaign: function() {
      if (!this.currentCampaign) return;
      
      const campaign = this.currentCampaign;
      campaign.completed = true;
      campaign.outcome = 'victory';
      
      window.setNarrative(`The Armarin has achieved a historic victory! The ${campaign.name} has been conquered after ${campaign.daysPassed} days of campaigning. Your role in this triumph will be remembered in the annals of the Paanic Empire.`);
      
      // Substantial rewards for completing a campaign
      window.gameState.experience += 100;
      window.player.taelors += 500;
      
      // Improve a random skill significantly
      const skills = Object.keys(window.player.skills);
      const randomSkill = skills[Math.floor(Math.random() * skills.length)];
      window.player.skills[randomSkill] += 1.0;
      
      window.showNotification(`Campaign complete! +100 XP, +500 Taelors`, 'success');
      window.showNotification(`Your ${randomSkill} skill has improved significantly!`, 'success');
      
      // Check for level up
      window.checkLevelUp();
    }
  };