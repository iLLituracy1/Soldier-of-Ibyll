// EVENT SYSTEM MODULE
// This module provides a centralized event system for the Soldier of Ibyll game
// to standardize communication between different game systems

window.EventSystem = (function() {
  // Map of event listeners
  const _eventListeners = {};
  
  // Event history for debugging
  const _eventHistory = [];
  const MAX_HISTORY = 100;
  
  // Debug mode flag
  let _debugMode = false;
  
  // Logging helpers
  function _log(message, data) {
    if (window.GameUtilities) {
      window.GameUtilities.log(`[EventSystem] ${message}`, data);
    } else {
      console.log(`[EventSystem] ${message}`, data || '');
    }
  }
  
  function _logError(message, data) {
    if (window.GameUtilities) {
      window.GameUtilities.logError(`[EventSystem] ${message}`, data);
    } else {
      console.error(`[EventSystem] ${message}`, data || '');
    }
  }
  
  // Private method to add event to history
  function _addToHistory(eventName, data) {
    _eventHistory.unshift({
      timestamp: new Date(),
      eventName: eventName,
      data: data
    });
    
    // Trim history if it gets too long
    if (_eventHistory.length > MAX_HISTORY) {
      _eventHistory.pop();
    }
  }
  
  // Public API
  return {
    // Initialize the event system
    init: function(options = {}) {
      _debugMode = options.debugMode || false;
      _log('Event system initialized');
      
      // Register for debug mode changes if GameUtilities exists
      if (window.GameUtilities && typeof window.GameUtilities.isDebugMode === 'function') {
        _debugMode = window.GameUtilities.isDebugMode();
        
        // Subscribe to debug mode changes
        if (window.GameState && typeof window.GameState.subscribe === 'function') {
          window.GameState.subscribe((property, value) => {
            if (property === 'debugMode') {
              _debugMode = value;
            }
          });
        }
      }
      
      return this;
    },
    
    // Subscribe to an event
    on: function(eventName, callback, context = null) {
      if (typeof eventName !== 'string') {
        _logError('Event name must be a string');
        return -1;
      }
      
      if (typeof callback !== 'function') {
        _logError('Callback must be a function');
        return -1;
      }
      
      // Create array for this event if it doesn't exist
      if (!_eventListeners[eventName]) {
        _eventListeners[eventName] = [];
      }
      
      // Add listener to array
      const listener = {
        callback: callback,
        context: context,
        once: false
      };
      
      _eventListeners[eventName].push(listener);
      
      if (_debugMode) {
        _log(`Added listener for event: ${eventName}`);
      }
      
      // Return index for removal
      return _eventListeners[eventName].length - 1;
    },
    
    // Subscribe to an event and only trigger once
    once: function(eventName, callback, context = null) {
      if (typeof eventName !== 'string') {
        _logError('Event name must be a string');
        return -1;
      }
      
      if (typeof callback !== 'function') {
        _logError('Callback must be a function');
        return -1;
      }
      
      // Create array for this event if it doesn't exist
      if (!_eventListeners[eventName]) {
        _eventListeners[eventName] = [];
      }
      
      // Add listener to array with once flag
      const listener = {
        callback: callback,
        context: context,
        once: true
      };
      
      _eventListeners[eventName].push(listener);
      
      if (_debugMode) {
        _log(`Added one-time listener for event: ${eventName}`);
      }
      
      // Return index for removal
      return _eventListeners[eventName].length - 1;
    },
    
    // Unsubscribe from an event
    off: function(eventName, indexOrCallback) {
      if (typeof eventName !== 'string') {
        _logError('Event name must be a string');
        return false;
      }
      
      if (!_eventListeners[eventName]) {
        if (_debugMode) {
          _log(`No listeners found for event: ${eventName}`);
        }
        return false;
      }
      
      // Handle removal by index
      if (typeof indexOrCallback === 'number') {
        if (indexOrCallback >= 0 && indexOrCallback < _eventListeners[eventName].length) {
          _eventListeners[eventName].splice(indexOrCallback, 1);
          
          if (_debugMode) {
            _log(`Removed listener at index ${indexOrCallback} for event: ${eventName}`);
          }
          
          return true;
        }
        
        _logError(`Invalid listener index: ${indexOrCallback}`);
        return false;
      }
      
      // Handle removal by callback reference
      if (typeof indexOrCallback === 'function') {
        const initialLength = _eventListeners[eventName].length;
        _eventListeners[eventName] = _eventListeners[eventName].filter(
          listener => listener.callback !== indexOrCallback
        );
        
        const removed = initialLength - _eventListeners[eventName].length;
        
        if (_debugMode && removed > 0) {
          _log(`Removed ${removed} listeners for event: ${eventName}`);
        }
        
        return removed > 0;
      }
      
      _logError('Invalid argument for off() - must be an index or callback function');
      return false;
    },
    
    // Remove all listeners for an event
    offAll: function(eventName) {
      if (typeof eventName !== 'string') {
        _logError('Event name must be a string');
        return false;
      }
      
      if (!_eventListeners[eventName]) {
        if (_debugMode) {
          _log(`No listeners found for event: ${eventName}`);
        }
        return false;
      }
      
      const count = _eventListeners[eventName].length;
      _eventListeners[eventName] = [];
      
      if (_debugMode) {
        _log(`Removed all ${count} listeners for event: ${eventName}`);
      }
      
      return true;
    },
    
    // Trigger an event
    trigger: function(eventName, data = {}) {
      if (typeof eventName !== 'string') {
        _logError('Event name must be a string');
        return false;
      }
      
      if (_debugMode) {
        _log(`Triggering event: ${eventName}`, data);
      }
      
      // Add to history
      _addToHistory(eventName, data);
      
      // If no listeners, return
      if (!_eventListeners[eventName] || _eventListeners[eventName].length === 0) {
        if (_debugMode) {
          _log(`No listeners for event: ${eventName}`);
        }
        return true; // Event was triggered, even if no one was listening
      }
      
      // Create array to track which listeners to remove (once listeners)
      const toRemove = [];
      
      // Call each listener
      _eventListeners[eventName].forEach((listener, index) => {
        try {
          listener.callback.call(listener.context, data);
          
          // If this is a once listener, mark for removal
          if (listener.once) {
            toRemove.push(index);
          }
        } catch (error) {
          _logError(`Error in event listener for ${eventName}`, error);
        }
      });
      
      // Remove once listeners (in reverse order to avoid index shifting)
      for (let i = toRemove.length - 1; i >= 0; i--) {
        _eventListeners[eventName].splice(toRemove[i], 1);
      }
      
      if (_debugMode && toRemove.length > 0) {
        _log(`Removed ${toRemove.length} one-time listeners for event: ${eventName}`);
      }
      
      return true;
    },
    
    // Get event history
    getEventHistory: function() {
      return _eventHistory.slice(); // Return a copy
    },
    
    // Clear event history
    clearEventHistory: function() {
      _eventHistory.length = 0;
      
      if (_debugMode) {
        _log('Event history cleared');
      }
      
      return true;
    },
    
    // Get current event listeners
    getEventListeners: function(eventName = null) {
      if (eventName) {
        if (!_eventListeners[eventName]) {
          return [];
        }
        
        // Return a simplified version of the listeners
        return _eventListeners[eventName].map(listener => ({
          isOnce: listener.once,
          hasContext: listener.context !== null
        }));
      }
      
      // Return summary of all listeners
      const summary = {};
      
      Object.keys(_eventListeners).forEach(event => {
        summary[event] = _eventListeners[event].length;
      });
      
      return summary;
    },
    
    // Register common game events (standardization of event names)
    registerGameEvents: function() {
      // Define standard event names as properties
      this.EVENTS = {
        // Game state events
        GAME_INITIALIZED: 'game:initialized',
        GAME_SAVED: 'game:saved',
        GAME_LOADED: 'game:loaded',
        
        // Time events
        TIME_CHANGED: 'time:changed',
        DAY_CHANGED: 'day:changed',
        
        // Player events
        PLAYER_LEVEL_UP: 'player:levelUp',
        PLAYER_ATTRIBUTE_CHANGED: 'player:attributeChanged',
        PLAYER_SKILL_CHANGED: 'player:skillChanged',
        PLAYER_HEALTH_CHANGED: 'player:healthChanged',
        PLAYER_STAMINA_CHANGED: 'player:staminaChanged',
        PLAYER_ITEM_ADDED: 'player:itemAdded',
        PLAYER_ITEM_REMOVED: 'player:itemRemoved',
        
        // Combat events
        COMBAT_STARTED: 'combat:started',
        COMBAT_ENDED: 'combat:ended',
        COMBAT_TURN_STARTED: 'combat:turnStarted',
        COMBAT_ATTACK: 'combat:attack',
        COMBAT_DAMAGE: 'combat:damage',
        COMBAT_STANCE_CHANGED: 'combat:stanceChanged',
        COMBAT_DISTANCE_CHANGED: 'combat:distanceChanged',
        
        // Mission events
        MISSION_STARTED: 'mission:started',
        MISSION_COMPLETED: 'mission:completed',
        MISSION_FAILED: 'mission:failed',
        MISSION_STAGE_CHANGED: 'mission:stageChanged',
        
        // NPC events
        NPC_DIALOG_STARTED: 'npc:dialogStarted',
        NPC_DIALOG_ENDED: 'npc:dialogEnded',
        NPC_RELATIONSHIP_CHANGED: 'npc:relationshipChanged',
        
        // Quest events
        QUEST_ADDED: 'quest:added',
        QUEST_UPDATED: 'quest:updated',
        QUEST_COMPLETED: 'quest:completed',
        
        // UI events
        UI_PANEL_OPENED: 'ui:panelOpened',
        UI_PANEL_CLOSED: 'ui:panelClosed',
        UI_NOTIFICATION: 'ui:notification',
        UI_ACHIEVEMENT: 'ui:achievement',
        
        // Error events
        ERROR_OCCURRED: 'error:occurred',
        ERROR_RECOVERED: 'error:recovered'
      };
      
      _log('Standard game events registered');
      
      return this.EVENTS;
    },
    
    // Connect to existing systems and replace observer patterns
    connectToGameSystems: function() {
      // Connect to GameState if it exists
      if (window.GameState && typeof window.GameState.subscribe === 'function') {
        const originalSubscribe = window.GameState.subscribe;
        
        // Replace GameState.subscribe with our event system
        window.GameState.subscribe = (callback) => {
          // Create event handler that calls callback with property, value, oldValue
          const handler = (data) => {
            callback(data.property, data.value, data.oldValue);
          };
          
          // Subscribe to state change event
          return this.on('state:changed', handler);
        };
        
        // Replace GameState.notify with event trigger
        const originalNotify = window.GameState.notify;
        window.GameState.notify = (property, value, oldValue) => {
          // Call original for backward compatibility
          if (typeof originalNotify === 'function') {
            originalNotify.call(window.GameState, property, value, oldValue);
          }
          
          // Trigger our event
          this.trigger('state:changed', { property, value, oldValue });
          
          // Also trigger specific property events
          this.trigger(`state:changed:${property}`, { value, oldValue });
          
          // Map certain properties to standard events
          const eventMappings = {
            'health': this.EVENTS.PLAYER_HEALTH_CHANGED,
            'stamina': this.EVENTS.PLAYER_STAMINA_CHANGED,
            'level': this.EVENTS.PLAYER_LEVEL_UP,
            'time': this.EVENTS.TIME_CHANGED,
            'day': this.EVENTS.DAY_CHANGED,
            'combatDistance': this.EVENTS.COMBAT_DISTANCE_CHANGED,
            'combatStance': this.EVENTS.COMBAT_STANCE_CHANGED
          };
          
          if (property in eventMappings) {
            this.trigger(eventMappings[property], { value, oldValue });
          }
        };
        
        _log('Connected to GameState system');
      }
      
      // Connect to UI system if it exists
      if (window.UI) {
        // Connect panel operations
        const originalOpenPanel = window.UI.openPanel;
        if (typeof originalOpenPanel === 'function') {
          window.UI.openPanel = (panelId) => {
            const result = originalOpenPanel.call(window.UI, panelId);
            this.trigger(this.EVENTS.UI_PANEL_OPENED, { panelId });
            return result;
          };
        }
        
        const originalClosePanel = window.UI.closePanel;
        if (typeof originalClosePanel === 'function') {
          window.UI.closePanel = (panelId) => {
            const result = originalClosePanel.call(window.UI, panelId);
            this.trigger(this.EVENTS.UI_PANEL_CLOSED, { panelId });
            return result;
          };
        }
        
        // Connect notifications
        const originalShowNotification = window.UI.showNotification;
        if (typeof originalShowNotification === 'function') {
          window.UI.showNotification = (text, type = 'info') => {
            const result = originalShowNotification.call(window.UI, text, type);
            this.trigger(this.EVENTS.UI_NOTIFICATION, { text, type });
            return result;
          };
        }
        
        // Connect achievements
        const originalShowAchievement = window.UI.showAchievement;
        if (typeof originalShowAchievement === 'function') {
          window.UI.showAchievement = (achievementId) => {
            const result = originalShowAchievement.call(window.UI, achievementId);
            this.trigger(this.EVENTS.UI_ACHIEVEMENT, { achievementId });
            return result;
          };
        }
        
        _log('Connected to UI system');
      }
      
      // Connect to CombatSystem if it exists
      if (window.CombatSystem) {
        // Connect combat start
        const originalStartCombat = window.CombatSystem.startCombat;
        if (typeof originalStartCombat === 'function') {
          window.CombatSystem.startCombat = (enemyType, environment) => {
            const result = originalStartCombat.call(window.CombatSystem, enemyType, environment);
            this.trigger(this.EVENTS.COMBAT_STARTED, { enemyType, environment });
            return result;
          };
        }
        
        // Connect combat end
        const originalEndCombat = window.CombatSystem.endCombat;
        if (typeof originalEndCombat === 'function') {
          window.CombatSystem.endCombat = (result) => {
            const funcResult = originalEndCombat.call(window.CombatSystem, result);
            this.trigger(this.EVENTS.COMBAT_ENDED, { result });
            return funcResult;
          };
        }
        
        _log('Connected to CombatSystem');
      }
      
      // Connect to MissionSystem if it exists
      if (window.MissionSystem) {
        // Connect mission start
        const originalStartMission = window.MissionSystem.startMission;
        if (typeof originalStartMission === 'function') {
          window.MissionSystem.startMission = (mission) => {
            const result = originalStartMission.call(window.MissionSystem, mission);
            this.trigger(this.EVENTS.MISSION_STARTED, { mission });
            return result;
          };
        }
        
        // Connect mission completion
        const originalCompleteMission = window.MissionSystem.completeMission;
        if (typeof originalCompleteMission === 'function') {
          window.MissionSystem.completeMission = (success) => {
            const result = originalCompleteMission.call(window.MissionSystem, success);
            
            if (success) {
              this.trigger(this.EVENTS.MISSION_COMPLETED, { 
                mission: window.gameState.currentMission 
              });
            } else {
              this.trigger(this.EVENTS.MISSION_FAILED, { 
                mission: window.gameState.currentMission 
              });
            }
            
            return result;
          };
        }
        
        _log('Connected to MissionSystem');
      }
      
      return true;
    },
    
    // Setup error tracking
    setupErrorTracking: function() {
      // Connect to window error event
      window.addEventListener('error', (event) => {
        this.trigger(this.EVENTS.ERROR_OCCURRED, {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error
        });
      });
      
      // Connect to unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.trigger(this.EVENTS.ERROR_OCCURRED, {
          message: event.reason.message || 'Unhandled Promise Rejection',
          error: event.reason
        });
      });
      
      _log('Error tracking set up');
      return true;
    }
  };
})();

// Initialize the EventSystem when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize with standard events
  window.EventSystem.init();
  window.EventSystem.registerGameEvents();
  
  // Wait a bit for other systems to initialize
  setTimeout(function() {
    // Connect to other game systems
    window.EventSystem.connectToGameSystems();
    window.EventSystem.setupErrorTracking();
    
    // Trigger initialized event
    if (window.EventSystem.EVENTS) {
      window.EventSystem.trigger(window.EventSystem.EVENTS.GAME_INITIALIZED);
    }
  }, 500);
});
