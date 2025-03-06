// MISSION CHAIN SYSTEM
// Manages connected sequences of missions with branching outcomes and reputation effects

window.MissionChainSystem = (function() {
  // Private variables
  let _activeChains = {};          // Active mission chains
  let _completedChains = [];       // Completed mission chains
  let _chainTemplates = {};        // Mission chain templates
  let _activeBranch = null;        // Currently active branch
  let _eventListeners = {};        // Event listeners
  let _reputationImpacts = {};     // Cumulative reputation impacts
  let _branchingChoices = [];      // History of branching choices
  
  // Private helper functions
  function _log(message, data) {
    console.log(`[MissionChainSystem] ${message}`, data || '');
  }
  
  function _error(message, data) {
    console.error(`[MissionChainSystem] ${message}`, data || '');
  }
  
  // Generate a unique ID
  function _generateId() {
    return 'chain_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  }
  
  // Calculate a player's disposition with a faction
  function _getDisposition(factionId) {
    // Check player relationships
    if (window.player && window.player.relationships && window.player.relationships[factionId]) {
      return window.player.relationships[factionId].disposition || 0;
    }
    
    return 0; // Neutral by default
  }
  
  // Update reputation with a faction
  function _updateReputation(factionId, amount) {
    try {
      // Ensure player relationships exists
      if (!window.player.relationships) {
        window.player.relationships = {};
      }
      
      // Create relationship if it doesn't exist
      if (!window.player.relationships[factionId]) {
        let factionName = factionId;
        
        // Map common faction IDs to names
        if (factionId === "commander") factionName = "Taal'Veyar Thelian";
        else if (factionId === "sergeant") factionName = "Sen'Vaorin Darius";
        else if (factionId === "quartermaster") factionName = "Quartermaster Cealdain";
        else if (factionId === "paanic") factionName = "Paanic Empire";
        else if (factionId === "arrasi") factionName = "Arrasi Empire";
        else if (factionId === "locals") factionName = "Local Settlements";
        
        window.player.relationships[factionId] = { 
          name: factionName, 
          disposition: 0 
        };
      }
      
      // Update disposition
      const currentDisposition = window.player.relationships[factionId].disposition;
      const newDisposition = Math.max(-100, Math.min(100, currentDisposition + amount));
      window.player.relationships[factionId].disposition = newDisposition;
      
      // Record impact for this chain
      _reputationImpacts[factionId] = (_reputationImpacts[factionId] || 0) + amount;
      
      // Return change
      return {
        faction: factionId,
        previous: currentDisposition,
        current: newDisposition,
        change: amount
      };
    } catch (error) {
      _error(`Failed to update reputation with faction ${factionId}:`, error);
      return null;
    }
  }
  
  // Load mission chain templates
  function _loadChainTemplates() {
    _chainTemplates = {
      // Diplomatic chain
      "diplomatic_initiative": {
        id: "diplomatic_initiative",
        title: "Diplomatic Initiative",
        description: "A series of missions to establish peaceful relations with local settlements, potentially creating a buffer against Arrasi expansion.",
        initialReputation: { Paanic: 5 },
        branches: {
          "peaceful": {
            name: "Peaceful Outreach",
            description: "Focus on building trust and offering mutually beneficial arrangements.",
            missions: [
              "diplomatic_contact",
              "diplomatic_supply",
              "diplomatic_protection"
            ],
            requirements: { 
              skills: { command: 2 } 
            },
            outcomes: {
              success: {
                reputation: { locals: 15, Paanic: 5, arrasi: -5 },
                reward: { experience: 150, taelors: 100 }
              },
              failure: {
                reputation: { locals: -10, Paanic: -5 },
                penalty: { experience: 0 }
              }
            }
          },
          "forceful": {
            name: "Show of Strength",
            description: "Demonstrate Paanic military might while offering protection.",
            missions: [
              "combat_patrol",
              "combat_arrasi",
              "diplomatic_alliance"
            ],
            requirements: { 
              skills: { tactics: 2, melee: 2 } 
            },
            outcomes: {
              success: {
                reputation: { locals: 5, Paanic: 10, arrasi: -15 },
                reward: { experience: 150, taelors: 120 }
              },
              failure: {
                reputation: { locals: -15, Paanic: -10 },
                penalty: { experience: 0 }
              }
            }
          }
        },
        defaultBranch: "peaceful",
        requiredSuccess: 2, // Need at least 2 successful missions for chain success
        chainRewards: {
          item: {
            name: "Diplomatic Seal of Alliance",
            effect: "Grants special trading privileges with local settlements",
            value: 250
          }
        }
      },
      
      // Combat chain
      "arrasi_offensive": {
        id: "arrasi_offensive",
        title: "Arrasi Offensive",
        description: "A series of combat missions to push back Arrasi forces that have been encroaching on Paanic territory.",
        initialReputation: { Paanic: 5, arrasi: -5 },
        branches: {
          "direct": {
            name: "Direct Assault",
            description: "Engage Arrasi forces head-on with overwhelming force.",
            missions: [
              "combat_patrol",
              "combat_outpost",
              "combat_commander"
            ],
            requirements: { 
              skills: { melee: 3 },
              attributes: { phy: 4 }
            },
            outcomes: {
              success: {
                reputation: { Paanic: 20, arrasi: -20 },
                reward: { experience: 200, taelors: 150 }
              },
              failure: {
                reputation: { Paanic: -15 },
                penalty: { experience: 0 }
              }
            }
          },
          "guerrilla": {
            name: "Guerrilla Tactics",
            description: "Use hit-and-run tactics to disrupt Arrasi supply lines and communications.",
            missions: [
              "stealth_sabotage",
              "stealth_intel",
              "combat_ambush"
            ],
            requirements: { 
              skills: { survival: 2, marksmanship: 2 } 
            },
            outcomes: {
              success: {
                reputation: { Paanic: 15, arrasi: -15 },
                reward: { experience: 175, taelors: 125 }
              },
              failure: {
                reputation: { Paanic: -10 },
                penalty: { experience: 0 }
              }
            }
          }
        },
        defaultBranch: "direct",
        requiredSuccess: 2,
        chainRewards: {
          item: {
            name: "Arrasi Commander's Insignia",
            effect: "Trophy that grants +5% damage against Arrasi enemies",
            value: 300
          }
        }
      },
      
      // Supply chain
      "resource_crisis": {
        id: "resource_crisis",
        title: "Resource Crisis",
        description: "A series of missions to secure essential supplies during a shortage at the main camp.",
        initialReputation: { quartermaster: 5 },
        branches: {
          "trading": {
            name: "Trading Network",
            description: "Establish trade routes and agreements with local settlements.",
            missions: [
              "supply_negotiation",
              "escort_supplies",
              "supply_caravan"
            ],
            requirements: { 
              skills: { command: 2, organization: 2 } 
            },
            outcomes: {
              success: {
                reputation: { quartermaster: 15, locals: 10 },
                reward: { experience: 125, taelors: 150 }
              },
              failure: {
                reputation: { quartermaster: -10, locals: -5 },
                penalty: { experience: 0 }
              }
            }
          },
          "foraging": {
            name: "Wilderness Foraging",
            description: "Venture into dangerous territories to gather resources directly.",
            missions: [
              "supply_herbs",
              "supply_hunting",
              "combat_beasts"
            ],
            requirements: { 
              skills: { survival: 3 } 
            },
            outcomes: {
              success: {
                reputation: { quartermaster: 15 },
                reward: { experience: 150, taelors: 100 }
              },
              failure: {
                reputation: { quartermaster: -15 },
                penalty: { experience: 0 }
              }
            }
          }
        },
        defaultBranch: "trading",
        requiredSuccess: 2,
        chainRewards: {
          item: {
            name: "Quartermaster's Commendation",
            effect: "Grants a 10% discount on all purchases from the quartermaster",
            value: 200
          }
        }
      }
    };
    
    return true;
  }
  
  // Create a new mission chain instance from a template
  function _createChainInstance(templateId) {
    // Get the template
    const template = _chainTemplates[templateId];
    if (!template) {
      _error(`Chain template not found: ${templateId}`);
      return null;
    }
    
    // Create a new instance with a unique ID
    const chainInstance = {
      id: _generateId(),
      templateId: templateId,
      title: template.title,
      description: template.description,
      activeBranch: null,
      availableBranches: {},
      missions: {},
      currentMissionIndex: 0,
      missionHistory: [],
      missionSuccesses: 0,
      branchChosen: false,
      completed: false,
      success: false,
      reputationImpacts: {}
    };
    
    // Apply initial reputation impacts
    if (template.initialReputation) {
      for (const [faction, amount] of Object.entries(template.initialReputation)) {
        _updateReputation(faction, amount);
        chainInstance.reputationImpacts[faction] = amount;
      }
    }
    
    // Process branches to determine which are available
    for (const [branchId, branch] of Object.entries(template.branches)) {
      // Check if player meets branch requirements
      let meetsRequirements = true;
      
      if (branch.requirements) {
        // Check skill requirements
        if (branch.requirements.skills) {
          for (const [skill, level] of Object.entries(branch.requirements.skills)) {
            const playerSkill = window.player.skills ? (window.player.skills[skill] || 0) : 0;
            if (playerSkill < level) {
              meetsRequirements = false;
              break;
            }
          }
        }
        
        // Check attribute requirements
        if (meetsRequirements && branch.requirements.attributes) {
          for (const [attr, level] of Object.entries(branch.requirements.attributes)) {
            const playerAttr = window.player[attr] || 0;
            if (playerAttr < level) {
              meetsRequirements = false;
              break;
            }
          }
        }
      }
      
      // If requirements are met, add to available branches
      if (meetsRequirements) {
        chainInstance.availableBranches[branchId] = {
          id: branchId,
          name: branch.name,
          description: branch.description,
          missionIds: [...branch.missions]
        };
      }
    }
    
    // If no branches are available, use the default branch
    if (Object.keys(chainInstance.availableBranches).length === 0 && template.defaultBranch) {
      const defaultBranch = template.branches[template.defaultBranch];
      
      if (defaultBranch) {
        chainInstance.availableBranches[template.defaultBranch] = {
          id: template.defaultBranch,
          name: defaultBranch.name,
          description: defaultBranch.description,
          missionIds: [...defaultBranch.missions]
        };
      }
    }
    
    // Store the required success count
    chainInstance.requiredSuccess = template.requiredSuccess || 1;
    
    // Store chain rewards
    chainInstance.rewards = template.chainRewards || {};
    
    return chainInstance;
  }
  
  // Select a branch for a chain
  function _selectChainBranch(chainId, branchId) {
    // Get chain instance
    const chain = _activeChains[chainId];
    if (!chain) {
      _error(`Chain not found: ${chainId}`);
      return false;
    }
    
    // Check if branch is available
    if (!chain.availableBranches[branchId]) {
      _error(`Branch not available: ${branchId}`);
      return false;
    }
    
    // Get template
    const template = _chainTemplates[chain.templateId];
    if (!template) {
      _error(`Chain template not found: ${chain.templateId}`);
      return false;
    }
    
    // Get branch data
    const branch = chain.availableBranches[branchId];
    const templateBranch = template.branches[branchId];
    
    // Set active branch
    chain.activeBranch = branchId;
    chain.branchChosen = true;
    _activeBranch = branchId;
    
    // Track branching choice
    _branchingChoices.push({
      chainId: chainId,
      branchId: branchId,
      timestamp: Date.now()
    });
    
    // Generate missions for this branch
    for (const missionId of branch.missionIds) {
      // Create the mission if MissionGenerator is available
      let mission = null;
      
      if (window.MissionGenerator && typeof window.MissionGenerator.generateMission === 'function') {
        // Create parameters for mission generator
        const params = {
          type: missionId.split('_')[0] || 'combat', // First part of ID as type
          difficulty: template.difficulty || 3,
          chainId: chainId,
          branchId: branchId
        };
        
        // Generate the mission
        mission = window.MissionGenerator.generateMission(params);
      }
      
      // If mission generation failed or MissionGenerator not available, create a placeholder
      if (!mission) {
        mission = {
          id: missionId,
          title: `Mission: ${missionId}`,
          description: 'Mission details not available.',
          type: missionId.split('_')[0] || 'standard',
          chainId: chainId,
          branchId: branchId
        };
      }
      
      // Store the mission
      chain.missions[missionId] = mission;
    }
    
    // Trigger branch selected event
    _triggerEvent('branchSelected', {
      chainId: chainId,
      branchId: branchId,
      branch: branch
    });
    
    return true;
  }
  
  // Get the next mission in the chain
  function _getNextMission(chainId) {
    // Get chain instance
    const chain = _activeChains[chainId];
    if (!chain) {
      _error(`Chain not found: ${chainId}`);
      return null;
    }
    
    // Check if chain is completed
    if (chain.completed) {
      return null;
    }
    
    // Check if branch has been chosen
    if (!chain.branchChosen) {
      _error(`No branch chosen for chain: ${chainId}`);
      return null;
    }
    
    // Get branch data
    const branch = chain.availableBranches[chain.activeBranch];
    if (!branch) {
      _error(`Active branch not found: ${chain.activeBranch}`);
      return null;
    }
    
    // Check if all missions completed
    if (chain.currentMissionIndex >= branch.missionIds.length) {
      return null;
    }
    
    // Get next mission ID
    const missionId = branch.missionIds[chain.currentMissionIndex];
    
    // Return the mission
    return chain.missions[missionId] || null;
  }
  
  // Process mission completion
  function _processMissionCompletion(chainId, missionId, success) {
    // Get chain instance
    const chain = _activeChains[chainId];
    if (!chain) {
      _error(`Chain not found: ${chainId}`);
      return false;
    }
    
    // Get template
    const template = _chainTemplates[chain.templateId];
    if (!template) {
      _error(`Chain template not found: ${chain.templateId}`);
      return false;
    }
    
    // Record mission completion
    chain.missionHistory.push({
      missionId: missionId,
      success: success,
      timestamp: Date.now()
    });
    
    // Update success count
    if (success) {
      chain.missionSuccesses++;
    }
    
    // Advance to next mission
    chain.currentMissionIndex++;
    
    // Check if chain is complete
    const branch = chain.availableBranches[chain.activeBranch];
    const isLastMission = chain.currentMissionIndex >= branch.missionIds.length;
    
    if (isLastMission) {
      // Determine overall chain success
      const chainSuccess = chain.missionSuccesses >= chain.requiredSuccess;
      
      // Mark chain as complete
      chain.completed = true;
      chain.success = chainSuccess;
      
      // Get outcome based on success
      const outcome = chainSuccess ? 
        template.branches[chain.activeBranch].outcomes.success : 
        template.branches[chain.activeBranch].outcomes.failure;
      
      // Apply reputation changes
      if (outcome.reputation) {
        for (const [faction, amount] of Object.entries(outcome.reputation)) {
          const result = _updateReputation(faction, amount);
          
          if (result) {
            // Record in chain reputation impacts
            chain.reputationImpacts[faction] = (chain.reputationImpacts[faction] || 0) + amount;
          }
        }
      }
      
      // Apply rewards or penalties
      if (chainSuccess && outcome.reward) {
        // Add experience
        if (outcome.reward.experience) {
          window.gameState.experience += outcome.reward.experience;
          
          // Check for level up
          if (window.GameState && typeof window.GameState.checkLevelUp === 'function') {
            window.GameState.checkLevelUp();
          } else if (typeof window.checkLevelUp === 'function') {
            window.checkLevelUp();
          }
        }
        
        // Add taelors
        if (outcome.reward.taelors) {
          window.player.taelors = (window.player.taelors || 0) + outcome.reward.taelors;
        }
      } else if (!chainSuccess && outcome.penalty) {
        // Apply penalties if any
      }
      
      // Apply chain rewards if successful
      if (chainSuccess && template.chainRewards) {
        // Add special item
        if (template.chainRewards.item) {
          if (!window.player.inventory) {
            window.player.inventory = [];
          }
          
          window.player.inventory.push(template.chainRewards.item);
          
          // Show notification
          if (typeof window.showNotification === 'function') {
            window.showNotification(`Obtained ${template.chainRewards.item.name}!`, "reward");
          }
        }
      }
      
      // Move from active to completed chains
      _completedChains.push({ ...chain });
      delete _activeChains[chainId];
      
      // Trigger chain completed event
      _triggerEvent('chainCompleted', {
        chainId: chainId,
        success: chainSuccess,
        chain: chain
      });
    } else {
      // Trigger mission completed event
      _triggerEvent('missionCompleted', {
        chainId: chainId,
        missionId: missionId,
        success: success,
        nextMission: _getNextMission(chainId)
      });
    }
    
    return true;
  }
  
  // Trigger an event
  function _triggerEvent(eventName, data) {
    if (!_eventListeners[eventName]) return;
    
    for (const listener of _eventListeners[eventName]) {
      try {
        listener(data);
      } catch (error) {
        _error(`Error in event listener for ${eventName}:`, error);
      }
    }
  }
  
  // Public API
  return {
    // Initialize the mission chain system
    init: function() {
      _log("Initializing mission chain system");
      
      // Load chain templates
      _loadChainTemplates();
      
      // Register with mission system if available
      if (window.MissionSystem) {
        _log("Registering with mission system");
        
        if (typeof window.MissionSystem.on === 'function') {
          window.MissionSystem.on('missionComplete', (data) => {
            // Check if this mission is part of a chain
            if (data.mission.chainId) {
              this.completeMission(data.mission.chainId, data.mission.id, true);
            }
          });
          
          window.MissionSystem.on('missionFail', (data) => {
            // Check if this mission is part of a chain
            if (data.mission.chainId) {
              this.completeMission(data.mission.chainId, data.mission.id, false);
            }
          });
        }
      }
      
      return true;
    },
    
    // Start a new mission chain
    startChain: function(chainTemplateId) {
      try {
        // Create chain instance
        const chain = _createChainInstance(chainTemplateId);
        
        if (!chain) {
          return null;
        }
        
        // Add to active chains
        _activeChains[chain.id] = chain;
        
        // Reset reputation impacts for this chain
        _reputationImpacts = {};
        
        // Trigger chain started event
        _triggerEvent('chainStarted', {
          chainId: chain.id,
          templateId: chainTemplateId,
          chain: chain
        });
        
        _log(`Started chain: ${chain.title} (${chain.id})`);
        
        return chain;
      } catch (error) {
        _error("Failed to start chain:", error);
        return null;
      }
    },
    
    // Select a branch for a chain
    selectBranch: function(chainId, branchId) {
      try {
        const result = _selectChainBranch(chainId, branchId);
        
        if (result) {
          _log(`Selected branch: ${branchId} for chain: ${chainId}`);
          
          // Return the next mission
          return _getNextMission(chainId);
        }
        
        return null;
      } catch (error) {
        _error("Failed to select branch:", error);
        return null;
      }
    },
    
    // Start the next mission in a chain
    startNextMission: function(chainId) {
      try {
        // Get next mission
        const mission = _getNextMission(chainId);
        
        if (!mission) {
          _log(`No more missions in chain: ${chainId}`);
          return null;
        }
        
        // Start the mission if MissionSystem is available
        if (window.MissionSystem && typeof window.MissionSystem.startMission === 'function') {
          const result = window.MissionSystem.startMission(mission.id || mission.type);
          
          if (result) {
            _log(`Started mission: ${mission.title} (${mission.id}) in chain: ${chainId}`);
            return mission;
          }
        }
        
        _error(`Failed to start mission in chain: ${chainId}`);
        return null;
      } catch (error) {
        _error("Failed to start next mission:", error);
        return null;
      }
    },
    
    // Complete a mission in a chain
    completeMission: function(chainId, missionId, success) {
      try {
        const result = _processMissionCompletion(chainId, missionId, success);
        
        if (result) {
          _log(`Completed mission: ${missionId} in chain: ${chainId} (${success ? 'Success' : 'Failure'})`);
          return true;
        }
        
        return false;
      } catch (error) {
        _error("Failed to complete mission:", error);
        return false;
      }
    },
    
    // Get available mission chains
    getAvailableChains: function() {
      const available = [];
      
      for (const [id, template] of Object.entries(_chainTemplates)) {
        // Check if already active
        let isActive = false;
        for (const chainId in _activeChains) {
          if (_activeChains[chainId].templateId === id) {
            isActive = true;
            break;
          }
        }
        
        // Skip if already active
        if (isActive) continue;
        
        // Check requirements if any
        let meetsRequirements = true;
        
        if (template.requirements) {
          // Level requirement
          if (template.requirements.level && (window.gameState.level || 1) < template.requirements.level) {
            meetsRequirements = false;
          }
          
          // Reputation requirements
          if (meetsRequirements && template.requirements.reputation) {
            for (const [faction, level] of Object.entries(template.requirements.reputation)) {
              if (_getDisposition(faction) < level) {
                meetsRequirements = false;
                break;
              }
            }
          }
          
          // Previous chain requirements
          if (meetsRequirements && template.requirements.previousChain) {
            const requiredChain = template.requirements.previousChain;
            
            // Check if required chain is completed successfully
            const completedChain = _completedChains.find(c => 
              c.templateId === requiredChain && c.success
            );
            
            if (!completedChain) {
              meetsRequirements = false;
            }
          }
        }
        
        if (meetsRequirements) {
          available.push({
            id: id,
            title: template.title,
            description: template.description,
            branches: Object.keys(template.branches).length
          });
        }
      }
      
      return available;
    },
    
    // Get active mission chains
    getActiveChains: function() {
      return { ..._activeChains };
    },
    
    // Get completed mission chains
    getCompletedChains: function() {
      return [..._completedChains];
    },
    
    // Get a specific chain
    getChain: function(chainId) {
      return _activeChains[chainId] || _completedChains.find(c => c.id === chainId) || null;
    },
    
    // Get chain template by ID
    getChainTemplate: function(templateId) {
      return _chainTemplates[templateId] || null;
    },
    
    // Get all chain templates
    getChainTemplates: function() {
      return { ..._chainTemplates };
    },
    
    // Add an event listener
    on: function(eventName, callback) {
      if (!_eventListeners[eventName]) {
        _eventListeners[eventName] = [];
      }
      
      _eventListeners[eventName].push(callback);
      return _eventListeners[eventName].length - 1;
    },
    
    // Remove an event listener
    off: function(eventName, index) {
      if (!_eventListeners[eventName]) return;
      
      _eventListeners[eventName].splice(index, 1);
    },
    
    // Get reputation impacts from current chain
    getReputationImpacts: function() {
      return { ..._reputationImpacts };
    },
    
    // Add a custom chain template
    addChainTemplate: function(templateId, template) {
      if (!templateId || !template) {
        _error("Invalid template or ID");
        return false;
      }
      
      _chainTemplates[templateId] = template;
      return true;
    }
  };
})();

// Initialize the mission chain system when document is ready
document.addEventListener('DOMContentLoaded', function() {
  if (window.MissionChainSystem) {
    window.MissionChainSystem.init();
  }
});
