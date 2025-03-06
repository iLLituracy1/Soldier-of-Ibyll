// ENHANCED MISSION SYSTEM
// A complete rewrite of the mission system with improved combat integration

window.MissionSystem = (function() {
  // Private state
  let _missionTemplates = {};      // Mission template definitions
  let _currentMission = null;      // Currently active mission
  let _missionStage = 0;           // Current stage in the active mission
  let _missionHistory = [];        // Record of completed missions
  let _missionCooldowns = {};      // Cooldown periods for mission types
  let _dialogueStage = 0;          // Current dialogue stage (for dialogue mission stages)
  let _combatCallback = null;      // Callback for when combat completes
  let _pendingCombatResult = null; // Store combat result when UI is not ready
  
  // Event system for mission state changes
  const _events = {
    missionStart: [],
    missionComplete: [],
    missionFail: [],
    stageChange: [],
    combatStart: [],
    combatEnd: []
  };
  
  // Private helper functions
  function _log(message, data) {
    console.log(`[MissionSystem] ${message}`, data || '');
  }
  
  // Register event listeners
  function _on(event, callback) {
    if (!_events[event]) {
      _events[event] = [];
    }
    _events[event].push(callback);
    return _events[event].length - 1;
  }
  
  // Remove event listener
  function _off(event, index) {
    if (!_events[event]) return;
    _events[event].splice(index, 1);
  }
  
  // Trigger event
  function _trigger(event, data) {
    if (!_events[event]) return;
    _log(`Event triggered: ${event}`, data);
    
    for (const callback of _events[event]) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} event handler:`, error);
      }
    }
  }
  
  // Generate a unique mission ID
  function _generateMissionId() {
    return 'mission_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  }
  
  // Apply mission rewards
  function _applyMissionRewards(rewards) {
    if (!rewards) return;
    
    let rewardText = "You receive:";
    
    // Apply experience rewards
    if (rewards.experience) {
      const expGain = rewards.experience;
      window.gameState.experience += expGain;
      rewardText += `\n- ${expGain} experience`;
      
      // Check for level up
      if (window.GameState && typeof window.GameState.checkLevelUp === 'function') {
        window.GameState.checkLevelUp();
      } else if (typeof window.checkLevelUp === 'function') {
        window.checkLevelUp();
      }
    }
    
    // Apply currency rewards
    if (rewards.taelors) {
      const taelors = rewards.taelors;
      window.player.taelors = (window.player.taelors || 0) + taelors;
      rewardText += `\n- ${taelors} taelors`;
    }
    
    // Apply item rewards
    if (rewards.items && rewards.items.length > 0) {
      for (const item of rewards.items) {
        // Check if item should be awarded based on chance
        if (item.chance && Math.random() > item.chance) continue;
        
        // Add item to inventory
        if (!window.player.inventory) {
          window.player.inventory = [];
        }
        
        window.player.inventory.push({
          name: item.name,
          effect: item.effect || "No special effects",
          value: item.value || 0
        });
        
        rewardText += `\n- ${item.name}`;
      }
    }
    
    // Apply relationship changes
    if (rewards.relationships) {
      for (const [npcId, change] of Object.entries(rewards.relationships)) {
        if (!window.player.relationships) {
          window.player.relationships = {};
        }
        
        if (!window.player.relationships[npcId]) {
          // Use correct name for each NPC ID
          let npcName = npcId;
          if (npcId === "commander") npcName = "Taal'Veyar Thelian";
          else if (npcId === "sergeant") npcName = "Sen'Vaorin Darius";
          else if (npcId === "quartermaster") npcName = "Quartermaster Cealdain";
          
          window.player.relationships[npcId] = { name: npcName, disposition: 0 };
        }
        
        const currentRelationship = window.player.relationships[npcId];
        if (currentRelationship) {
          const newDisposition = Math.min(100, Math.max(-100, currentRelationship.disposition + change));
          currentRelationship.disposition = newDisposition;
          
          if (change > 0) {
            rewardText += `\n- Improved relationship with ${currentRelationship.name}`;
          } else if (change < 0) {
            rewardText += `\n- Worsened relationship with ${currentRelationship.name}`;
          }
        }
      }
    }
    
    // Show rewards to player
    if (typeof window.addToNarrative === 'function') {
      window.addToNarrative(rewardText);
    }
  }
  
  // Handle mission completion
  function _completeMission(success, rewards) {
    if (!_currentMission) {
      console.warn("[MissionSystem] No active mission to complete");
      return;
    }
    
    _log('Completing mission:', { mission: _currentMission.title, success });
    
    // Record mission completion in history
    _missionHistory.push({
      id: _currentMission.id,
      title: _currentMission.title,
      type: _currentMission.type,
      success: success,
      completedOn: window.gameState.day
    });
    
    // Limit history size to 20 entries
    if (_missionHistory.length > 20) {
      _missionHistory.shift();
    }
    
    // Distribute rewards if successful
    if (success && rewards) {
      _applyMissionRewards(rewards);
    }
    
    // Apply cooldown
    _missionCooldowns[_currentMission.type] = {
      until: window.gameState.day + (_currentMission.cooldown || 2)
    };
    
    // Trigger appropriate completion event
    if (success) {
      _trigger('missionComplete', { mission: _currentMission });
    } else {
      _trigger('missionFail', { mission: _currentMission });
    }
    
    // Reset mission state
    window.gameState.inMission = false;
    window.gameState.currentMission = null;
    window.gameState.missionStage = 0;
    
    _currentMission = null;
    _missionStage = 0;
    _dialogueStage = 0;
    _combatCallback = null;
    
    // Update UI
    if (window.UI) {
      window.UI.updateStatusBars();
      window.UI.updateActionButtons();
      
      // Unlock narrative for updates if it was locked
      if (window.UI.state) {
        window.UI.state.narrativeLock = false;
      }
    } else {
      // Legacy UI update
      if (typeof window.updateStatusBars === 'function') {
        window.updateStatusBars();
      }
      
      if (typeof window.updateActionButtons === 'function') {
        window.updateActionButtons();
      }
    }
    
    // Update achievement progress
    if (success && typeof window.updateAchievementProgress === 'function') {
      window.updateAchievementProgress('mission_master');
    }
    
    return true;
  }
  
  // Generate a mission from a template
  function _generateMission(type) {
    // Get the mission template
    const template = _missionTemplates[type];
    if (!template) {
      console.error("[MissionSystem] Unknown mission type:", type);
      return null;
    }
    
    // Check cooldown
    if (_missionCooldowns[type] && window.gameState.day < _missionCooldowns[type].until) {
      _log(`Mission ${type} on cooldown until day ${_missionCooldowns[type].until}`);
      return null;
    }
    
    // Create a new mission instance
    const mission = {
      id: _generateMissionId(),
      type: type,
      title: template.title,
      description: template.description,
      difficulty: template.difficulty,
      stages: template.stages.map(stage => ({ ...stage })), // Deep copy stages
      rewards: { ...template.rewards }, // Copy rewards
      cooldown: template.cooldown || 2
    };
    
    return mission;
  }
  
  // Process the current mission stage
  function _processMissionStage() {
    if (!_currentMission || _missionStage >= _currentMission.stages.length) {
      console.warn("[MissionSystem] No active mission stage to process");
      return;
    }
    
    const stage = _currentMission.stages[_missionStage];
    _log('Processing mission stage:', { stage: _missionStage, type: stage.type });
    
    // Trigger stage change event
    _trigger('stageChange', { 
      mission: _currentMission,
      stageIndex: _missionStage, 
      stage: stage 
    });
    
    // Update mission stage in global state
    window.gameState.missionStage = _missionStage;
    
    // Process stage based on type
    switch(stage.type) {
      case 'text':
        _processTextStage(stage);
        break;
      case 'choice':
        _processChoiceStage(stage);
        break;
      case 'combat':
        _processCombatStage(stage);
        break;
      case 'skill_check':
        _processSkillCheckStage(stage);
        break;
      case 'dialogue':
        _processDialogueStage(stage);
        break;
      default:
        console.warn("[MissionSystem] Unknown mission stage type:", stage.type);
        // Move to next stage as a fallback
        _advanceMissionStage();
    }
  }
  
  // Process a text stage
  function _processTextStage(stage) {
    if (typeof window.setNarrative === 'function') {
      window.setNarrative(stage.text);
    }
    
    // Create Continue button
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      
      const continueBtn = document.createElement('button');
      continueBtn.className = 'action-btn';
      continueBtn.textContent = 'Continue';
      continueBtn.onclick = function() {
        _advanceMissionStage();
      };
      
      actionsContainer.appendChild(continueBtn);
    } else {
      console.warn("[MissionSystem] Actions container not found for text stage");
      // Auto-advance after a delay as fallback
      setTimeout(_advanceMissionStage, 2000);
    }
  }
  
  // Process a choice stage
  function _processChoiceStage(stage) {
    if (typeof window.setNarrative === 'function') {
      window.setNarrative(stage.text);
    }
    
    // Create choice buttons
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      
      stage.choices.forEach((choice, index) => {
        const choiceBtn = document.createElement('button');
        choiceBtn.className = 'action-btn';
        choiceBtn.textContent = choice.text;
        
        // Check if choice is locked by skill or attribute requirements
        let isLocked = false;
        let lockReason = '';
        
        if (choice.requires) {
          for (const [requirement, value] of Object.entries(choice.requires)) {
            if (requirement === 'phy' || requirement === 'men') {
              // Attribute check
              const playerValue = window.player[requirement] || 0;
              if (playerValue < value) {
                isLocked = true;
                lockReason = `Requires ${requirement === 'phy' ? 'Physical' : 'Mental'} ${value}`;
                break;
              }
            } else if (requirement.startsWith('skills.')) {
              // Skill check
              const skillName = requirement.split('.')[1];
              const playerSkills = window.player.skills || {};
              const playerValue = playerSkills[skillName] || 0;
              if (playerValue < value) {
                isLocked = true;
                lockReason = `Requires ${skillName} ${value}`;
                break;
              }
            }
          }
        }
        
        if (isLocked) {
          choiceBtn.disabled = true;
          choiceBtn.classList.add('disabled');
          choiceBtn.title = lockReason;
          choiceBtn.textContent += ` (${lockReason})`;
        } else {
          choiceBtn.onclick = function() {
            // Process choice outcome
            if (choice.outcome) {
              if (choice.outcome.text) {
                if (typeof window.addToNarrative === 'function') {
                  window.addToNarrative("\n\n" + choice.outcome.text);
                }
              }
              
              if (choice.outcome.goto !== undefined) {
                // Jump to a specific stage
                _missionStage = choice.outcome.goto - 1; // -1 because we'll advance stage after
              }
              
              if (choice.outcome.rewards) {
                _applyMissionRewards(choice.outcome.rewards);
              }
              
              if (choice.outcome.damage) {
                // Apply damage to player
                const currentHealth = window.gameState.health;
                const damage = choice.outcome.damage;
                window.gameState.health = Math.max(1, currentHealth - damage);
                
                if (typeof window.showNotification === 'function') {
                  window.showNotification(`You took ${damage} damage!`, 'damage');
                }
                
                if (typeof window.updateStatusBars === 'function') {
                  window.updateStatusBars();
                }
              }
              
              // Handle special outcomes
              if (choice.outcome.success === true) {
                setTimeout(() => {
                  _completeMission(true, _currentMission.rewards);
                }, 2000);
                return;
              } else if (choice.outcome.success === false) {
                setTimeout(() => {
                  _completeMission(false);
                }, 2000);
                return;
              }
            }
            
            // Advance to next stage
            _advanceMissionStage();
          };
        }
        
        actionsContainer.appendChild(choiceBtn);
      });
    } else {
      console.warn("[MissionSystem] Actions container not found for choice stage");
    }
  }
  
  // Process a combat stage
  function _processCombatStage(stage) {
    if (typeof window.setNarrative === 'function') {
      window.setNarrative(stage.text);
    }
    
    // Create initiate combat button
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      
      const combatBtn = document.createElement('button');
      combatBtn.className = 'action-btn';
      combatBtn.textContent = 'Engage';
      combatBtn.onclick = function() {
        _startCombat(stage);
      };
      
      actionsContainer.appendChild(combatBtn);
    } else {
      console.warn("[MissionSystem] Actions container not found for combat stage");
      // Auto-start combat as fallback
      setTimeout(() => {
        _startCombat(stage);
      }, 1000);
    }
  }
  
  // Handle combat start
  function _startCombat(stage) {
    // Set mission combat flag
    window.gameState.inMissionCombat = true;
    
    // Prepare combat callback
    _combatCallback = function(result) {
      _handleCombatResult(result, stage);
    };
    
    // Register one-time event listener for combat end
    if (window.CombatSystem && typeof window.CombatSystem.on === 'function') {
      window.CombatSystem.on('combatEnd', function handleCombatEnd(data) {
        // Remove this listener to avoid duplicate calls
        window.CombatSystem.off('combatEnd', handleCombatEnd);
        
        // Call our callback with the result
        _combatCallback(data.result);
      });
      
      // Start combat using the proper API
      if (typeof window.CombatSystem.startMissionCombat === 'function') {
        window.CombatSystem.startMissionCombat(stage.enemy, stage.environment || null);
      } else {
        window.CombatSystem.startCombat(stage.enemy, stage.environment || null);
      }
    } else {
      // Legacy combat system
      if (typeof window.setOriginalEndCombatFunction === 'function') {
        // Save original endCombatWithResult function
        window.setOriginalEndCombatFunction(window.endCombatWithResult);
        
        // Override endCombatWithResult to handle mission continuation
        window.endCombatWithResult = function(result) {
          // Call original function
          if (typeof window.originalEndCombatFunction === 'function') {
            window.originalEndCombatFunction(result);
          }
          
          // Continue mission after a short delay
          if (window.gameState.inMissionCombat) {
            window.gameState.inMissionCombat = false;
            
            setTimeout(() => {
              _handleCombatResult(result, stage);
            }, 1000);
          }
        };
      }
      
      // Start combat with legacy function
      if (typeof window.startCombat === 'function') {
        window.startCombat(stage.enemy, stage.environment || null);
      } else {
        console.error("[MissionSystem] No combat system available");
        // Skip combat as a failsafe
        _advanceMissionStage();
      }
    }
    
    // Trigger combat start event
    _trigger('combatStart', { 
      mission: _currentMission,
      stage: stage,
      enemy: stage.enemy,
      environment: stage.environment
    });
  }
  
  // Handle combat result
  function _handleCombatResult(result, stage) {
    _log('Handling combat result:', result);
    
    // Clear the callback
    _combatCallback = null;
    
    // Clear mission combat flag
    window.gameState.inMissionCombat = false;
    
    // Check if mission system is still active
    if (!_currentMission) {
      console.warn("[MissionSystem] No active mission when handling combat result");
      return;
    }
    
    // Check if UI is ready - use presence of actions container as indicator
    const actionsContainer = document.getElementById('actions');
    if (!actionsContainer || actionsContainer.style.display === 'none') {
      // UI isn't ready yet, store the result and check again later
      _log('UI not ready for combat result, storing for later');
      _pendingCombatResult = { result, stage };
      
      // Check again in 500ms
      setTimeout(() => {
        if (_pendingCombatResult) {
          _log('Processing pending combat result');
          const { result, stage } = _pendingCombatResult;
          _pendingCombatResult = null;
          _processCombatResult(result, stage);
        }
      }, 500);
      
      return;
    }
    
    // Process the combat result immediately
    _processCombatResult(result, stage);
  }
  
  // Process combat result when UI is ready
  function _processCombatResult(result, stage) {
    // Trigger combat end event
    _trigger('combatEnd', { 
      mission: _currentMission,
      stage: stage,
      result: result
    });
    
    // Process based on result
    if (result === 'victory') {
      if (stage.success) {
        if (typeof window.setNarrative === 'function') {
          window.setNarrative(stage.success);
        }
      } else {
        if (typeof window.setNarrative === 'function') {
          window.setNarrative("You've emerged victorious from the battle!");
        }
      }
      
      // Advance mission after a short delay
      setTimeout(() => {
        _advanceMissionStage();
      }, 2000);
    } else {
      if (stage.failure) {
        if (typeof window.setNarrative === 'function') {
          window.setNarrative(stage.failure);
        }
      } else {
        if (typeof window.setNarrative === 'function') {
          window.setNarrative("You've been defeated in battle, but manage to escape with your life.");
        }
      }
      
      // Failed mission
      setTimeout(() => {
        _completeMission(false);
      }, 2000);
    }
  }
  
  // Process a skill check stage
  function _processSkillCheckStage(stage) {
    if (typeof window.setNarrative === 'function') {
      window.setNarrative(stage.text);
    }
    
    // Create attempt check button
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      
      const attemptBtn = document.createElement('button');
      attemptBtn.className = 'action-btn';
      attemptBtn.textContent = `Attempt ${stage.skill.charAt(0).toUpperCase() + stage.skill.slice(1)} Check`;
      attemptBtn.onclick = function() {
        _performSkillCheck(stage);
      };
      
      actionsContainer.appendChild(attemptBtn);
    } else {
      console.warn("[MissionSystem] Actions container not found for skill check stage");
      // Auto-perform skill check as fallback
      setTimeout(() => {
        _performSkillCheck(stage);
      }, 1000);
    }
  }
  
  // Perform a skill check
  function _performSkillCheck(stage) {
    let playerSkill = 0;
    
    // Handle different skill path formats
    if (stage.skill.includes('.')) {
      // Handle paths like "skills.melee"
      const parts = stage.skill.split('.');
      let current = window.player;
      for (const part of parts) {
        current = current[part] || 0;
      }
      playerSkill = current;
    } else if (stage.skill === 'phy' || stage.skill === 'men') {
      // Handle attributes directly
      playerSkill = window.player[stage.skill] || 0;
    } else {
      // Default to skills object
      playerSkill = (window.player.skills || {})[stage.skill] || 0;
    }
    
    // Calculate success chance
    let successChance = playerSkill * 10 + 20; // Base 20% + 10% per skill point
    
    // Apply difficulty modifier
    const difficulty = stage.difficulty || 5;
    successChance -= difficulty * 5;
    
    // Clamp to reasonable range
    successChance = Math.min(95, Math.max(5, successChance));
    
    // Roll for success
    const roll = Math.random() * 100;
    const success = roll <= successChance;
    
    // Show result
    if (typeof window.addToNarrative === 'function') {
      window.addToNarrative(`\n\nYou attempt to use your ${stage.skill} skill...`);
    }
    
    setTimeout(() => {
      if (success) {
        if (typeof window.addToNarrative === 'function') {
          window.addToNarrative(`\n\nSuccess! ${stage.success}`);
        }
        
        // Apply rewards if any
        if (stage.rewards) {
          _applyMissionRewards(stage.rewards);
        }
        
        // Advance to next stage after a delay
        setTimeout(() => {
          _advanceMissionStage();
        }, 2000);
      } else {
        if (typeof window.addToNarrative === 'function') {
          window.addToNarrative(`\n\nFailure. ${stage.failure}`);
        }
        
        if (stage.failureOutcome === 'continue') {
          // Continue to next stage despite failure
          setTimeout(() => {
            _advanceMissionStage();
          }, 2000);
        } else {
          // End mission in failure
          setTimeout(() => {
            _completeMission(false);
          }, 2000);
        }
      }
    }, 1500);
  }
  
  // Process a dialogue stage
  function _processDialogueStage(stage) {
    if (!stage.dialogue || stage.dialogue.length === 0) {
      console.warn("[MissionSystem] Empty dialogue in mission stage");
      _advanceMissionStage();
      return;
    }
    
    // Check if we've gone through all dialogue
    if (_dialogueStage >= stage.dialogue.length) {
      _dialogueStage = 0;
      _advanceMissionStage();
      return;
    }
    
    const dialogue = stage.dialogue[_dialogueStage];
    
    // Set or add to narrative based on dialogue index
    if (_dialogueStage === 0) {
      if (typeof window.setNarrative === 'function') {
        window.setNarrative(`${dialogue.speaker}: "${dialogue.text}"`);
      }
    } else {
      if (typeof window.addToNarrative === 'function') {
        window.addToNarrative(`\n\n${dialogue.speaker}: "${dialogue.text}"`);
      }
    }
    
    // Create continue button
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      actionsContainer.innerHTML = '';
      
      const continueBtn = document.createElement('button');
      continueBtn.className = 'action-btn';
      continueBtn.textContent = 'Continue';
      continueBtn.onclick = function() {
        _dialogueStage++;
        _processDialogueStage(stage);
      };
      
      actionsContainer.appendChild(continueBtn);
    } else {
      console.warn("[MissionSystem] Actions container not found for dialogue stage");
      // Auto-advance dialogue as fallback
      setTimeout(() => {
        _dialogueStage++;
        _processDialogueStage(stage);
      }, 2000);
    }
  }
  
  // Advance to the next mission stage
  function _advanceMissionStage() {
    _missionStage++;
    _dialogueStage = 0;
    
    // Check if we've reached the end of the mission
    if (_missionStage >= _currentMission.stages.length) {
      // Mission completed successfully
      _completeMission(true, _currentMission.rewards);
    } else {
      // Process the next stage
      _processMissionStage();
    }
  }
  
  // Safely return to normal game state
  function _returnToNormalGameState() {
    // Ensure all mission flags are cleared
    window.gameState.inMission = false;
    window.gameState.currentMission = null;
    window.gameState.missionStage = 0;
    window.gameState.inMissionCombat = false;
    
    // Clear mission state
    _currentMission = null;
    _missionStage = 0;
    _dialogueStage = 0;
    _combatCallback = null;
    _pendingCombatResult = null;
    
    // Show regular action buttons
    const actionsContainer = document.getElementById('actions');
    if (actionsContainer) {
      actionsContainer.style.display = 'flex';
    }
    
    // Unlock narrative for updates if it was locked
    if (window.UI && window.UI.state) {
      window.UI.state.narrativeLock = false;
    }
    
    // Update UI
    if (typeof window.updateActionButtons === 'function') {
      window.updateActionButtons();
    }
    
    // Set a return narrative
    if (typeof window.setNarrative === 'function') {
      window.setNarrative("You have returned to camp.");
    }
    
    return true;
  }
  
  // Public API
  return {
    // Initialize the mission system
    init: function() {
      _log("Initializing mission system...");
      
      // Register mission templates
      this.registerMissionTemplates();
      
      // Register event handlers
      this.registerEventHandlers();
      
      // Setup compatibility layer with global missionSystem
      this.setupCompatibilityLayer();
      
      _log("Mission system initialized!");
    },
    
    // Register event handlers
    registerEventHandlers: function() {
      // Listen for combat end events
      if (window.CombatSystem && typeof window.CombatSystem.on === 'function') {
        window.CombatSystem.on('combatEnd', function(data) {
          _log('Received combatEnd event from CombatSystem', data);
          
          // Check if we're in a mission combat
          if (window.gameState.inMissionCombat && _combatCallback) {
            // Call our callback with the result
            _combatCallback(data.result);
          }
        });
      }
      
      // Register window-level error handling for missions
      window.addEventListener('error', function(event) {
        if (window.gameState.inMission) {
          console.error("[MissionSystem] Error detected during mission:", event.error);
          
          // If we're in a broken state, try to recover
          const actionsContainer = document.getElementById('actions');
          if (!actionsContainer || actionsContainer.children.length === 0) {
            console.warn("[MissionSystem] Detected broken UI state, attempting recovery");
            _returnToNormalGameState();
          }
        }
      });
    },
    
    // Set up backward compatibility layer
    setupCompatibilityLayer: function() {
      // Create/update global missionSystem object for backward compatibility
      window.missionSystem = window.missionSystem || {};
      
      // Link core functions to global object
      window.missionSystem.getAvailableMissionsFrom = this.getAvailableMissionsFrom.bind(this);
      window.missionSystem.canGetMissionsFrom = this.canGetMissionsFrom.bind(this);
      window.missionSystem.startMission = this.startMission.bind(this);
      window.missionSystem.getMissionHistory = () => _missionHistory;
      window.missionSystem.getMissionCooldowns = () => _missionCooldowns;
      window.missionSystem.getCurrentMission = () => _currentMission;
      
      // Legacy method for generating available missions
      window.missionSystem.generateAvailableMissions = function() {
        console.log("[Legacy] Generating available missions");
        return true;
      };
      
      // Track available missions for backward compatibility
      window.missionSystem.availableMissions = window.missionSystem.availableMissions || [];
      window.missionSystem.missionHistory = _missionHistory;
      window.missionSystem.missionCooldowns = _missionCooldowns;
      
      // Support continueMissionAfterCombat for backward compatibility
      window.missionSystem.continueMissionAfterCombat = this.continueMissionAfterCombat.bind(this);
      
      // Set up global functions
      window.startMission = this.startMission.bind(this);
      window.continueMissionAfterCombat = this.continueMissionAfterCombat.bind(this);
    },
    
    // Get available missions from an NPC
    getAvailableMissionsFrom: function(npcId) {
      const missions = [];
      
      // Filter missions by NPC
      for (const [type, template] of Object.entries(_missionTemplates)) {
        if (template.giver === npcId) {
          // Check cooldown
          if (_missionCooldowns[type] && window.gameState.day < _missionCooldowns[type].until) {
            continue;
          }
          
          // Check requirements if any
          if (template.requires) {
            let meetsRequirements = true;
            
            for (const [requirement, value] of Object.entries(template.requires)) {
              if (requirement === 'level') {
                // Check player level
                if ((window.gameState.level || 1) < value) {
                  meetsRequirements = false;
                  break;
                }
              } else if (requirement === 'reputation') {
                // Check NPC relationship
                const relationship = (window.player.relationships || {})[npcId];
                if (!relationship || relationship.disposition < value) {
                  meetsRequirements = false;
                  break;
                }
              } else {
                // Check other attribute or skill
                let playerValue = 0;
                if (requirement.includes('.')) {
                  // Handle paths like "skills.melee"
                  const parts = requirement.split('.');
                  let current = window.player;
                  for (const part of parts) {
                    current = current[part] || 0;
                  }
                  playerValue = current;
                } else {
                  // Direct property on player
                  playerValue = window.player[requirement] || 0;
                }
                
                if (playerValue < value) {
                  meetsRequirements = false;
                  break;
                }
              }
            }
            
            if (!meetsRequirements) {
              continue;
            }
          }
          
          missions.push({
            type: type,
            title: template.title,
            description: template.description,
            difficulty: template.difficulty
          });
        }
      }
      
      return missions;
    },
    
    // Check if player can get missions from an NPC
    canGetMissionsFrom: function(npcId) {
      return this.getAvailableMissionsFrom(npcId).length > 0;
    },
    
    // Start a mission
    startMission: function(type) {
      // Check if already in a mission
      if (window.gameState.inMission) {
        console.warn("[MissionSystem] Cannot start a new mission while one is in progress");
        return false;
      }
      
      // Generate the mission
      const mission = _generateMission(type);
      if (!mission) {
        console.warn("[MissionSystem] Failed to generate mission of type:", type);
        return false;
      }
      
      // Set mission state
      _currentMission = mission;
      _missionStage = 0;
      _dialogueStage = 0;
      
      // Update game state
      window.gameState.inMission = true;
      window.gameState.currentMission = mission;
      window.gameState.missionStage = 0;
      
      // Lock narrative updates during mission if UI system supports it
      if (window.UI && window.UI.state) {
        window.UI.state.narrativeLock = true;
      }
      
      // Trigger mission start event
      _trigger('missionStart', { mission });
      
      // Start the mission
      _processMissionStage();
      
      return true;
    },
    
    // Continue mission after combat (for backward compatibility)
    continueMissionAfterCombat: function(result) {
      if (_pendingCombatResult) {
        _log('Already have pending combat result, ignoring duplicate call');
        return;
      }
      
      if (!window.gameState.inMission || !_currentMission) {
        console.warn("[MissionSystem] No active mission to continue after combat");
        return;
      }
      
      // Get the current stage
      const stage = _currentMission.stages[_missionStage];
      if (stage.type !== 'combat') {
        console.warn("[MissionSystem] Current mission stage is not combat");
        return;
      }
      
      // Handle the combat result
      _handleCombatResult(result, stage);
    },
    
    // Update mission cooldowns (called at day change)
    updateCooldowns: function() {
      const currentDay = window.gameState.day;
      
      // Remove expired cooldowns
      for (const [missionType, cooldown] of Object.entries(_missionCooldowns)) {
        if (currentDay >= cooldown.until) {
          delete _missionCooldowns[missionType];
        }
      }
    },
    
    // Emergency recovery function
    emergencyRecover: function() {
      _log("Performing emergency recovery");
      return _returnToNormalGameState();
    },
    
    // Register mission templates
    registerMissionTemplates: function() {
      // Register standard mission templates
      _missionTemplates = {
        // Patrol mission
        'patrol': {
          title: "Border Patrol",
          description: "Patrol the border area to ensure no enemy forces are approaching.",
          difficulty: 1,
          giver: "sergeant",
          cooldown: 2,
          stages: [
            {
              type: "text",
              text: "Sen'Vaorin Darius hands you a map of the border region. 'We need eyes on the northeast sector. Reports indicate Arrasi movement in that area. Scout it out and report back.'"
            },
            {
              type: "choice",
              text: "You make your way to the northeast sector. The terrain is rocky and visibility is limited. How do you want to proceed?",
              choices: [
                {
                  text: "Take the high ground for better visibility",
                  outcome: {
                    text: "You climb to a vantage point, giving you an excellent view of the surrounding area."
                  }
                },
                {
                  text: "Move stealthily through the underbrush",
                  requires: { "skills.survival": 2 },
                  outcome: {
                    text: "Using your survival skills, you move silently through the underbrush, keeping out of sight."
                  }
                },
                {
                  text: "Patrol the main trail quickly",
                  outcome: {
                    text: "You move at a quick pace down the main trail, covering ground efficiently but making yourself more visible."
                  }
                }
              ]
            },
            {
              type: "text",
              text: "As you patrol the area, you notice signs of recent activity - broken branches, footprints, and disturbed vegetation."
            },
            {
              type: "skill_check",
              text: "There are tracks in the soft ground. Can you determine who left them?",
              skill: "survival",
              difficulty: 4,
              success: "You examine the tracks carefully. These were definitely made by Arrasi scouts - probably a group of three or four that passed through early this morning.",
              failure: "You can tell someone passed through here, but can't determine who or when.",
              failureOutcome: "continue"
            },
            {
              type: "combat",
              text: "As you continue your patrol, you spot movement ahead. Suddenly, an Arrasi scout emerges from behind a rock, weapon drawn!",
              enemy: "arrasi_scout",
              success: "With the scout defeated, you can now return to camp with your report.",
              failure: "You're forced to retreat. The mission is a failure."
            },
            {
              type: "text",
              text: "You return to camp with valuable intelligence about Arrasi movements in the northeast sector."
            }
          ],
          rewards: {
            experience: 50,
            taelors: 25
          }
        },
        
        // Reconnaissance mission
        'recon': {
          title: "Reconnaissance Mission",
          description: "Gather intelligence on enemy positions beyond the river.",
          difficulty: 2,
          giver: "commander",
          requires: { "level": 2 },
          cooldown: 3,
          stages: [
            {
              type: "dialogue",
              dialogue: [
                {
                  speaker: "Taal'Veyar Thelian",
                  text: "We need accurate information about Arrasi troop movements beyond the eastern ridge."
                },
                {
                  speaker: "Taal'Veyar Thelian",
                  text: "This is strictly a reconnaissance mission. Avoid engagement if possible."
                },
                {
                  speaker: "You",
                  text: "How close should I get to their positions?"
                },
                {
                  speaker: "Taal'Veyar Thelian",
                  text: "Close enough to count their numbers and identify their equipment, but don't risk detection."
                }
              ]
            },
            {
              type: "text",
              text: "You travel eastward through the dense forest, keeping alert for any signs of enemy patrols."
            },
            {
              type: "choice",
              text: "You reach the river that marks the approach to Arrasi territory. How will you cross?",
              choices: [
                {
                  text: "Use the old bridge to the north",
                  outcome: {
                    text: "You take the bridge, which saves time but might be watched."
                  }
                },
                {
                  text: "Wade across at a shallow point",
                  requires: { "phy": 3 },
                  outcome: {
                    text: "Using your physical strength, you fight the current and make it across the river safely.",
                    rewards: { experience: 10 }
                  }
                },
                {
                  text: "Find a hidden crossing point",
                  requires: { "skills.survival": 3 },
                  outcome: {
                    text: "Your survival skills help you locate a perfect crossing point concealed by overhanging trees.",
                    rewards: { experience: 15 }
                  }
                }
              ]
            },
            {
              type: "skill_check",
              text: "You need to move through Arrasi-controlled territory without being detected.",
              skill: "survival",
              difficulty: 6,
              success: "You navigate carefully through the enemy territory, using natural cover and moving silently.",
              failure: "As you move through the area, you accidentally alert an Arrasi patrol!",
              failureOutcome: "continue"
            },
            {
              type: "choice",
              text: "An Arrasi patrol is headed your way! What do you do?",
              choices: [
                {
                  text: "Hide and let them pass",
                  requires: { "skills.survival": 4 },
                  outcome: {
                    text: "You find perfect concealment and remain perfectly still as the patrol passes just a few feet away from you.",
                    goto: 6
                  }
                },
                {
                  text: "Create a distraction",
                  requires: { "skills.tactics": 3 },
                  outcome: {
                    text: "You throw a rock to create noise away from your position. The patrol investigates the sound, allowing you to slip away.",
                    goto: 6
                  }
                },
                {
                  text: "Prepare for combat",
                  outcome: {
                    text: "You ready your weapon as the patrol spots you."
                  }
                }
              ]
            },
            {
              type: "combat",
              text: "The Arrasi patrol has spotted you! You'll need to fight your way out.",
              enemy: "arrasi_warrior",
              success: "You defeat the patrol, but now you need to complete your mission quickly before reinforcements arrive.",
              failure: "You're overwhelmed by the Arrasi patrol and barely escape with your life."
            },
            {
              type: "text",
              text: "You reach a vantage point overlooking the Arrasi camp. From here, you can observe their forces without being detected."
            },
            {
              type: "skill_check",
              text: "You need to accurately assess the Arrasi forces from your observation point.",
              skill: "tactics",
              difficulty: 5,
              success: "You carefully count their numbers, identify their weapons, and note the positions of their officers. This is valuable intelligence.",
              failure: "You gather some basic information, but can't make detailed observations about their forces.",
              failureOutcome: "continue"
            },
            {
              type: "text",
              text: "With your mission complete, you carefully make your way back to camp to report your findings."
            }
          ],
          rewards: {
            experience: 75,
            taelors: 40,
            items: [
              { name: "Tactical Map", chance: 0.8, value: 30 }
            ],
            relationships: {
              "commander": 5
            }
          }
        },
        
        // Supply mission for Quartermaster
        'supplies': {
          title: "Supply Procurement",
          description: "Secure vital supplies for the Kasvaari camp.",
          difficulty: 1,
          giver: "quartermaster",
          cooldown: 2,
          stages: [
            {
              type: "dialogue",
              dialogue: [
                {
                  speaker: "Quartermaster Cealdain",
                  text: "Our medical supplies are running low. We need you to gather some medicinal herbs from the eastern forest."
                },
                {
                  speaker: "You",
                  text: "What exactly am I looking for?"
                },
                {
                  speaker: "Quartermaster Cealdain",
                  text: "Redleaf and bitterroot. Both grow near the streams. Be careful though, the area might have Arrasi patrols."
                }
              ]
            },
            {
              type: "text",
              text: "You make your way to the eastern forest. The area is lush and vibrant, with the sound of flowing water in the distance."
            },
            {
              type: "skill_check",
              text: "You need to find the medicinal herbs. Can you identify them among the forest vegetation?",
              skill: "survival",
              difficulty: 3,
              success: "You easily spot clusters of redleaf growing near the stream banks, and discover patches of bitterroot under the shade of large trees.",
              failure: "You spend a long time searching but struggle to distinguish the medicinal herbs from other similar-looking plants.",
              failureOutcome: "continue"
            },
            {
              type: "choice",
              text: "While gathering herbs, you hear voices nearby. It sounds like an Arrasi patrol.",
              choices: [
                {
                  text: "Hide and wait for them to pass",
                  outcome: {
                    text: "You quickly hide behind thick vegetation and remain still as the patrol passes by, unaware of your presence."
                  }
                },
                {
                  text: "Climb a tree for better observation",
                  requires: { "phy": 2 },
                  outcome: {
                    text: "You climb a tall tree and observe the patrol from above. They're just a small scouting group, and they soon leave the area.",
                    rewards: { experience: 10 }
                  }
                },
                {
                  text: "Retreat to another area",
                  outcome: {
                    text: "You quietly move to another part of the forest to continue gathering herbs, avoiding potential conflict."
                  }
                }
              ]
            },
            {
              type: "text",
              text: "After collecting a substantial amount of medicinal herbs, you begin your return journey to the Kasvaari camp."
            },
            {
              type: "text",
              text: "You deliver the herbs to Quartermaster Cealdain, who immediately begins processing them for the medical supplies."
            }
          ],
          rewards: {
            experience: 40,
            taelors: 20,
            relationships: {
              "quartermaster": 5
            }
          }
        }
      };
      
      return true;
    },
    
    // Event registration
    on: function(event, callback) {
      return _on(event, callback);
    },
    
    off: function(event, index) {
      _off(event, index);
    },
    
    // Public getters
    getMissionHistory: function() {
      return [..._missionHistory];
    },
    
    getMissionCooldowns: function() {
      return {..._missionCooldowns};
    },
    
    getCurrentMission: function() {
      return _currentMission;
    }
  };
})();

// Initialize the mission system when document is ready
document.addEventListener('DOMContentLoaded', function() {
  window.MissionSystem.init();
});


// COMBAT-MISSION INTEGRATION FIX
// Add this to the end of your missions.js file or as a separate file

// Fix for mission combat callback handling
(function fixMissionCombatIntegration() {
  console.log("Applying mission-combat integration fix");
  
  // Fix the handleCombatEnd function in MissionSystem
  if (window.MissionSystem) {
    // Safely handle combat end events
    const originalRegisterEventHandlers = window.MissionSystem.registerEventHandlers;
    window.MissionSystem.registerEventHandlers = function() {
      console.log("Setting up enhanced combat event handlers");
      
      // Listen for combat end events safely
      if (window.CombatSystem && typeof window.CombatSystem.on === 'function') {
        window.CombatSystem.on('combatEnd', function(data) {
          console.log('Received combatEnd event from CombatSystem', data);
          
          // Check if we're in a mission combat and have a valid callback
          if (window.gameState.inMissionCombat && 
              typeof window.MissionSystem._combatCallback === 'function') {
            try {
              // Call our callback with the result
              window.MissionSystem._combatCallback(data.result);
            } catch (error) {
              console.error("Error in combat callback:", error);
              
              // Force narrative unlock in case of error
              if (window.UI && window.UI.state) {
                window.UI.state.narrativeLock = false;
              }
              
              // Reset combat mission state
              window.gameState.inMissionCombat = false;
            }
          } else if (window.gameState.inMissionCombat) {
            console.warn("Combat ended during mission but no valid callback exists");
            
            // Force narrative unlock
            if (window.UI && window.UI.state) {
              window.UI.state.narrativeLock = false;
            }
            
            // Reset mission combat state
            window.gameState.inMissionCombat = false;
          }
        });
      }
      
      // Call original if it exists
      if (typeof originalRegisterEventHandlers === 'function') {
        originalRegisterEventHandlers.call(window.MissionSystem);
      }
    };
    
    // Fix retreat handling during missions
    const originalAttemptRetreat = window.attemptRetreat || function() {};
    window.attemptRetreat = function() {
      console.log("Enhanced retreat function");
      
      // Check if we're in a mission
      if (window.gameState.inMission && window.gameState.inMissionCombat) {
        // Show retreat message
        const combatLog = document.getElementById('combatLog');
        if (combatLog) {
          combatLog.innerHTML += `<p>You attempt to retreat from combat...</p>`;
        }
        
        // Force UI cleanup first
        if (typeof window.cleanupCombatUI === 'function') {
          window.cleanupCombatUI();
        }
        
        // Mark combat as over
        window.gameState.inBattle = false;
        window.gameState.currentEnemy = null;
        
        // Clear mission combat flag
        window.gameState.inMissionCombat = false;
        
        // Ensure UI elements are visible
        const narrativeContainer = document.getElementById('narrative-container');
        if (narrativeContainer) narrativeContainer.style.display = 'block';
        
        const statusBars = document.querySelector('.status-bars');
        if (statusBars) statusBars.style.display = 'flex';
        
        // Unlock narrative
        if (window.UI && window.UI.state) {
          window.UI.state.narrativeLock = false;
        }
        
        // Set a retreat narrative
        if (typeof window.setNarrative === 'function') {
          window.setNarrative("You've managed to retreat from combat and return to safety, though you're exhausted from running.");
        }
        
        // Show a notification
        if (typeof window.showNotification === 'function') {
          window.showNotification("Retreated from combat", "info");
        }
        
        // End the mission with failure
        if (window.MissionSystem && 
            typeof window.MissionSystem._completeMission === 'function') {
          setTimeout(function() {
            window.MissionSystem._completeMission(false);
          }, 1000);
        } else {
          // Force mission state reset as fallback
          window.gameState.inMission = false;
          window.gameState.currentMission = null;
          window.gameState.missionStage = 0;
          
          // Update action buttons
          if (typeof window.updateActionButtons === 'function') {
            setTimeout(window.updateActionButtons, 500);
          }
        }
        
        return;
      }
      
      // Otherwise use original retreat function
      originalAttemptRetreat();
    };
    
    // Ensure narrative gets unlocked after missions
    const originalCompleteMission = window.MissionSystem._completeMission;
    if (typeof originalCompleteMission === 'function') {
      window.MissionSystem._completeMission = function(success, rewards) {
        // Force unlock narrative before completing
        if (window.UI && window.UI.state) {
          window.UI.state.narrativeLock = false;
        }
        
        // Call original
        return originalCompleteMission.call(window.MissionSystem, success, rewards);
      };
    }
    
    // Run the fixed event handler registration
    window.MissionSystem.registerEventHandlers();
  }
  
  console.log("Mission-combat integration fix applied");
})();