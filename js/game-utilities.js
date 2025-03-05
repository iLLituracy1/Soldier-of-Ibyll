// GAME UTILITIES MODULE
// This module contains common utility functions, debugging tools,
// and optimizations for the Soldier of Ibyll game

window.GameUtilities = (function() {
  // Private variables
  let _debugMode = false;
  let _performanceMode = 'balanced'; // 'performance', 'balanced', or 'quality'
  let _logHistory = [];
  let _errorCount = 0;
  const MAX_LOG_HISTORY = 100;
  
  // Private methods
  function _formatLogMessage(type, message, data) {
    const timestamp = new Date().toISOString().replace('T', ' ').substr(0, 19);
    let logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    
    // Add data to log if provided
    if (data !== undefined) {
      try {
        // Try to stringify the data if it's an object
        if (typeof data === 'object' && data !== null) {
          logMessage += ': ' + JSON.stringify(data);
        } else {
          logMessage += ': ' + data;
        }
      } catch (error) {
        logMessage += ': [Object could not be stringified]';
      }
    }
    
    return logMessage;
  }
  
  function _storeLogMessage(type, message, data) {
    // Create log entry
    const logEntry = {
      timestamp: new Date(),
      type: type,
      message: message,
      data: data
    };
    
    // Add to log history
    _logHistory.unshift(logEntry);
    
    // Trim log history if it exceeds maximum size
    if (_logHistory.length > MAX_LOG_HISTORY) {
      _logHistory.pop();
    }
    
    // Increment error count if this is an error
    if (type === 'error') {
      _errorCount++;
    }
  }
  
  // Public API
  return {
    // Initialize utilities
    init: function(options = {}) {
      // Set debug mode from options or localStorage
      _debugMode = options.debugMode || localStorage.getItem('soldierOfIbyll_debugMode') === 'true';
      
      // Set performance mode from options or localStorage
      _performanceMode = options.performanceMode || 
                        localStorage.getItem('soldierOfIbyll_performanceMode') || 
                        'balanced';
      
      console.log(`[GameUtilities] Initialized: Debug Mode = ${_debugMode}, Performance Mode = ${_performanceMode}`);
      
      // Register error handler for uncaught errors
      window.addEventListener('error', (event) => {
        this.logError('Uncaught error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
        
        // Add emergency recovery button for uncaught errors
        if (_errorCount > 3) {
          this.addEmergencyRecoveryButton();
        }
      });
      
      return this;
    },
    
    // Logging Functions
    
    // Log a message with various severity levels
    log: function(message, data) {
      const formattedMessage = _formatLogMessage('info', message, data);
      console.log(formattedMessage);
      _storeLogMessage('info', message, data);
    },
    
    logWarning: function(message, data) {
      const formattedMessage = _formatLogMessage('warn', message, data);
      console.warn(formattedMessage);
      _storeLogMessage('warn', message, data);
    },
    
    logError: function(message, data) {
      const formattedMessage = _formatLogMessage('error', message, data);
      console.error(formattedMessage);
      _storeLogMessage('error', message, data);
      
      // In debug mode, show error notification
      if (_debugMode && window.UI && typeof window.UI.showNotification === 'function') {
        window.UI.showNotification(`Error: ${message}`, 'error');
      }
    },
    
    logDebug: function(message, data) {
      if (_debugMode) {
        const formattedMessage = _formatLogMessage('debug', message, data);
        console.debug(formattedMessage);
        _storeLogMessage('debug', message, data);
      }
    },
    
    // Get log history
    getLogHistory: function() {
      return _logHistory.slice(); // Return a copy
    },
    
    // Get error count
    getErrorCount: function() {
      return _errorCount;
    },
    
    // Reset error count
    resetErrorCount: function() {
      _errorCount = 0;
    },
    
    // Clear log history
    clearLogHistory: function() {
      _logHistory = [];
      return true;
    },
    
    // Performance and Optimization Functions
    
    // Throttle function to limit how often a function can be called
    throttle: function(func, delay) {
      let lastCall = 0;
      return function(...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
          lastCall = now;
          return func.apply(this, args);
        }
      };
    },
    
    // Debounce function to delay execution until after a pause
    debounce: function(func, delay) {
      let timerId;
      return function(...args) {
        clearTimeout(timerId);
        timerId = setTimeout(() => {
          func.apply(this, args);
        }, delay);
      };
    },
    
    // Execute a function on next animation frame for smoother UI updates
    rafExec: function(func) {
      return function(...args) {
        return window.requestAnimationFrame(() => {
          func.apply(this, args);
        });
      };
    },
    
    // Batch DOM updates to reduce reflows
    batchDomUpdates: function(updateFunctions) {
      // Force a style recalculation once before updates
      document.body.offsetHeight;
      
      // Execute all update functions
      updateFunctions.forEach(fn => {
        if (typeof fn === 'function') {
          fn();
        }
      });
      
      // Force a single reflow after all updates
      document.body.offsetHeight;
    },
    
    // Memory Management
    
    // Remove event listeners to prevent memory leaks
    removeAllEventListeners: function(element) {
      if (!element) return false;
      
      // Clone the node to remove all event listeners
      const clone = element.cloneNode(true);
      if (element.parentNode) {
        element.parentNode.replaceChild(clone, element);
        return true;
      }
      return false;
    },
    
    // Clear all event listeners from a list of elements
    clearEventListeners: function(selectors) {
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          this.removeAllEventListeners(element);
        });
      });
    },
    
    // Debug and Testing Functions
    
    // Enable debug mode
    enableDebugMode: function() {
      _debugMode = true;
      localStorage.setItem('soldierOfIbyll_debugMode', 'true');
      console.log('[GameUtilities] Debug mode enabled');
      
      // Add debug panel to UI
      this.addDebugPanel();
      
      return true;
    },
    
    // Disable debug mode
    disableDebugMode: function() {
      _debugMode = false;
      localStorage.setItem('soldierOfIbyll_debugMode', 'false');
      console.log('[GameUtilities] Debug mode disabled');
      
      // Remove debug panel from UI
      const debugPanel = document.getElementById('debugPanel');
      if (debugPanel && debugPanel.parentNode) {
        debugPanel.parentNode.removeChild(debugPanel);
      }
      
      return true;
    },
    
    // Check if debug mode is enabled
    isDebugMode: function() {
      return _debugMode;
    },
    
    // Set performance mode
    setPerformanceMode: function(mode) {
      if (['performance', 'balanced', 'quality'].includes(mode)) {
        _performanceMode = mode;
        localStorage.setItem('soldierOfIbyll_performanceMode', mode);
        console.log(`[GameUtilities] Performance mode set to: ${mode}`);
        
        // Apply performance settings
        this.applyPerformanceSettings();
        
        return true;
      }
      return false;
    },
    
    // Get current performance mode
    getPerformanceMode: function() {
      return _performanceMode;
    },
    
    // Apply performance settings based on current mode
    applyPerformanceSettings: function() {
      switch (_performanceMode) {
        case 'performance':
          // Throttle non-critical UI updates
          window.updateStatusBars = this.throttle(window.updateStatusBars, 500);
          break;
          
        case 'balanced':
          // Use default settings (medium throttling)
          window.updateStatusBars = this.throttle(window.updateStatusBars, 250);
          break;
          
        case 'quality':
          // Use RAF for smoothest updates
          window.updateStatusBars = this.rafExec(window.updateStatusBars);
          break;
      }
    },
    
    // Add a debug panel to the UI
    addDebugPanel: function() {
      if (!_debugMode) return;
      
      // Check if panel already exists
      if (document.getElementById('debugPanel')) return;
      
      const debugPanel = document.createElement('div');
      debugPanel.id = 'debugPanel';
      debugPanel.style.position = 'fixed';
      debugPanel.style.bottom = '10px';
      debugPanel.style.left = '10px';
      debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      debugPanel.style.color = '#fff';
      debugPanel.style.padding = '10px';
      debugPanel.style.borderRadius = '5px';
      debugPanel.style.zIndex = '10000';
      debugPanel.style.maxHeight = '200px';
      debugPanel.style.overflow = 'auto';
      debugPanel.style.fontSize = '12px';
      debugPanel.style.maxWidth = '300px';
      
      // Add controls
      const controls = document.createElement('div');
      controls.innerHTML = `
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <button id="debugClearLogs" style="font-size: 10px; padding: 2px 5px;">Clear Logs</button>
          <button id="debugTestState" style="font-size: 10px; padding: 2px 5px;">Test State</button>
          <button id="debugClose" style="font-size: 10px; padding: 2px 5px;">Close</button>
        </div>
      `;
      
      debugPanel.appendChild(controls);
      
      // Add content container
      const content = document.createElement('div');
      content.id = 'debugContent';
      debugPanel.appendChild(content);
      
      // Append to document body
      document.body.appendChild(debugPanel);
      
      // Add event listeners
      document.getElementById('debugClearLogs').addEventListener('click', () => {
        this.clearLogHistory();
        this.updateDebugPanel();
      });
      
      document.getElementById('debugTestState').addEventListener('click', () => {
        this.testGameState();
      });
      
      document.getElementById('debugClose').addEventListener('click', () => {
        debugPanel.style.display = 'none';
      });
      
      // Update debug panel initially
      this.updateDebugPanel();
      
      // Set interval to update debug panel
      setInterval(() => {
        if (_debugMode && debugPanel.style.display !== 'none') {
          this.updateDebugPanel();
        }
      }, 1000);
    },
    
    // Update debug panel content
    updateDebugPanel: function() {
      if (!_debugMode) return;
      
      const content = document.getElementById('debugContent');
      if (!content) return;
      
      // Get game state info
      const gameState = window.gameState || {};
      
      // Show basic game info
      content.innerHTML = `
        <div><strong>Game State:</strong> Day ${gameState.day || 0}, Time: ${this.formatGameTime(gameState.time || 0)}</div>
        <div><strong>Player Health:</strong> ${Math.round(gameState.health || 0)}/${gameState.maxHealth || 100}</div>
        <div><strong>Location:</strong> ${this.getCurrentLocation()}</div>
        <div><strong>State Flags:</strong> 
          ${gameState.inBattle ? 'In Battle, ' : ''}
          ${gameState.inMission ? 'In Mission, ' : ''}
          ${gameState.inMissionCombat ? 'Mission Combat, ' : ''}
        </div>
        <div><strong>Errors:</strong> ${_errorCount}</div>
        <div><strong>Recent Logs:</strong></div>
      `;
      
      // Add recent logs
      const logList = document.createElement('div');
      logList.style.fontSize = '10px';
      logList.style.marginTop = '5px';
      logList.style.maxHeight = '80px';
      logList.style.overflow = 'auto';
      
      _logHistory.slice(0, 5).forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.style.marginBottom = '2px';
        logEntry.style.borderLeft = '2px solid ' + this.getLogTypeColor(log.type);
        logEntry.style.paddingLeft = '3px';
        logEntry.textContent = `[${log.type}] ${log.message}`;
        logList.appendChild(logEntry);
      });
      
      content.appendChild(logList);
    },
    
    // Helper to get color for log type
    getLogTypeColor: function(type) {
      switch(type) {
        case 'error': return '#ff4b4b';
        case 'warn': return '#ffb74b';
        case 'debug': return '#4bbfff';
        default: return '#4bff91';
      }
    },
    
    // Format game time for display
    formatGameTime: function(minutes) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const ampm = hours < 12 ? 'AM' : 'PM';
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${mins.toString().padStart(2, '0')} ${ampm}`;
    },
    
    // Get current game location
    getCurrentLocation: function() {
      const locationElement = document.getElementById('location');
      return locationElement ? locationElement.textContent : 'Unknown';
    },
    
    // Test game state for issues
    testGameState: function() {
      this.log('Testing game state...');
      let issues = [];
      
      // Check for issues with window.gameState
      if (!window.gameState) {
        issues.push('window.gameState is undefined');
      } else {
        // Check for inconsistent state flags
        if (window.gameState.inBattle && !window.gameState.currentEnemy) {
          issues.push('In battle but no enemy is set');
        }
        
        if (window.gameState.inMission && !window.gameState.currentMission) {
          issues.push('In mission but no mission is set');
        }
        
        if (window.gameState.inMissionCombat && !window.gameState.inBattle) {
          issues.push('In mission combat but not in battle');
        }
        
        // Check health and stamina
        if (window.gameState.health > window.gameState.maxHealth) {
          issues.push('Health exceeds max health');
        }
        
        if (window.gameState.stamina > window.gameState.maxStamina) {
          issues.push('Stamina exceeds max stamina');
        }
      }
      
      // Check for UI issues
      const narrativeContainer = document.getElementById('narrative-container');
      if (narrativeContainer && narrativeContainer.style.display === 'none') {
        issues.push('Narrative container is hidden');
      }
      
      const actions = document.getElementById('actions');
      if (actions && actions.style.display === 'none' && !window.gameState.inBattle) {
        issues.push('Actions container is hidden outside combat');
      }
      
      // Report results
      if (issues.length > 0) {
        this.logWarning('Game state issues found', issues);
        
        // Show notification with issues
        if (window.UI && typeof window.UI.showNotification === 'function') {
          window.UI.showNotification(`Game state issues found: ${issues.length}. See console for details.`, 'warning');
        }
        
        // Add emergency recovery button if serious issues
        if (issues.length > 2) {
          this.addEmergencyRecoveryButton();
        }
        
        return issues;
      } else {
        this.log('Game state test passed, no issues found');
        
        // Show notification if in debug mode
        if (_debugMode && window.UI && typeof window.UI.showNotification === 'function') {
          window.UI.showNotification('Game state test passed', 'info');
        }
        
        return [];
      }
    },
    
    // Add emergency recovery button
    addEmergencyRecoveryButton: function() {
      // Check if already exists
      if (document.getElementById('emergency-recovery-btn')) {
        return;
      }
      
      // Create button
      const button = document.createElement('button');
      button.id = 'emergency-recovery-btn';
      button.textContent = '🛟 Emergency Recovery';
      button.style.position = 'fixed';
      button.style.bottom = '10px';
      button.style.right = '10px';
      button.style.zIndex = '9999';
      button.style.backgroundColor = '#ff4b4b';
      button.style.color = 'white';
      button.style.padding = '10px';
      button.style.border = 'none';
      button.style.borderRadius = '5px';
      
      // Add click handler
      button.onclick = () => {
        this.performEmergencyRecovery();
        
        // Remove button after use
        if (button.parentNode) {
          button.parentNode.removeChild(button);
        }
      };
      
      document.body.appendChild(button);
    },
    
    // Perform emergency recovery
    performEmergencyRecovery: function() {
      this.log('Performing emergency recovery');
      
      // Reset critical state flags
      if (window.gameState) {
        window.gameState.inBattle = false;
        window.gameState.inMission = false;
        window.gameState.inMissionCombat = false;
        window.gameState.currentEnemy = null;
        window.gameState.currentMission = null;
      }
      
      // Restore UI elements
      const elementsToRestore = [
        {id: 'narrative-container', style: 'block'},
        {selector: '.status-bars', style: 'flex'},
        {id: 'actions', style: 'flex'},
        {id: 'location', style: 'block'},
        {id: 'timeDisplay', style: 'block'},
        {id: 'dayDisplay', style: 'block'},
        {id: 'dayNightIndicator', style: 'block'}
      ];
      
      elementsToRestore.forEach(item => {
        const element = item.id 
          ? document.getElementById(item.id) 
          : document.querySelector(item.selector);
          
        if (element) {
          element.style.display = item.style;
        }
      });
      
      // Hide combat interface
      const combatInterface = document.getElementById('combatInterface');
      if (combatInterface) {
        combatInterface.classList.add('hidden');
        combatInterface.classList.remove('combat-fullscreen');
      }
      
      // Unlock narrative if it was locked
      if (window.UI && window.UI.state) {
        window.UI.state.narrativeLock = false;
      }
      
      // Call other recovery methods if available
      if (window.GameState && typeof window.GameState.emergencyRecovery === 'function') {
        window.GameState.emergencyRecovery();
      }
      
      if (window.CombatMissionIntegration && typeof window.CombatMissionIntegration.emergencyRecovery === 'function') {
        window.CombatMissionIntegration.emergencyRecovery();
      }
      
      if (window.UI && typeof window.UI.emergencyRecovery === 'function') {
        window.UI.emergencyRecovery();
      }
      
      // Update UI
      if (typeof window.updateActionButtons === 'function') {
        window.updateActionButtons();
      }
      
      if (typeof window.updateStatusBars === 'function') {
        window.updateStatusBars();
      }
      
      // Set a recovery message
      if (typeof window.setNarrative === 'function') {
        window.setNarrative("You have returned to camp after recovering from a momentary disorientation.");
      }
      
      // Show notification
      if (typeof window.showNotification === 'function') {
        window.showNotification("Game state has been reset.", "info");
      }
      
      this.log('Emergency recovery completed');
      
      return true;
    },
    
    // String Utility Functions
    
    // Safely get a value from a nested object with dot notation
    getNestedValue: function(obj, path, defaultValue = undefined) {
      if (!obj || !path) return defaultValue;
      
      const keys = path.split('.');
      let current = obj;
      
      for (let i = 0; i < keys.length; i++) {
        if (current === null || current === undefined) {
          return defaultValue;
        }
        current = current[keys[i]];
      }
      
      return current !== undefined ? current : defaultValue;
    },
    
    // Safely set a value in a nested object with dot notation
    setNestedValue: function(obj, path, value) {
      if (!obj || !path) return false;
      
      const keys = path.split('.');
      let current = obj;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current) || current[keys[i]] === null || typeof current[keys[i]] !== 'object') {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return true;
    },
    
    // Generate a random ID
    generateId: function(prefix = '') {
      return prefix + Math.random().toString(36).substr(2, 9);
    },
    
    // Truncate text to specified length
    truncateText: function(text, maxLength, suffix = '...') {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength - suffix.length) + suffix;
    },
    
    // Array and Object Utilities
    
    // Deep clone an object
    deepClone: function(obj) {
      if (obj === null || typeof obj !== 'object') return obj;
      
      try {
        return JSON.parse(JSON.stringify(obj));
      } catch (error) {
        this.logError('Failed to deep clone object', error);
        return { ...obj }; // Fallback to shallow clone
      }
    },
    
    // Merge objects deeply
    deepMerge: function(target, source) {
      if (typeof target !== 'object' || target === null) {
        target = {};
      }
      
      if (typeof source !== 'object' || source === null) {
        return target;
      }
      
      Object.keys(source).forEach(key => {
        const targetValue = target[key];
        const sourceValue = source[key];
        
        if (Array.isArray(sourceValue)) {
          target[key] = sourceValue.slice();
        } else if (typeof sourceValue === 'object' && sourceValue !== null) {
          target[key] = this.deepMerge(
            targetValue && typeof targetValue === 'object' ? targetValue : {}, 
            sourceValue
          );
        } else {
          target[key] = sourceValue;
        }
      });
      
      return target;
    },
    
    // Check if two objects are equivalent
    areObjectsEqual: function(obj1, obj2) {
      try {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
      } catch (error) {
        this.logError('Failed to compare objects', error);
        return false;
      }
    },
    
    // DOM Utility Functions
    
    // Create an element with attributes and children
    createElement: function(tag, attributes = {}, children = []) {
      const element = document.createElement(tag);
      
      // Set attributes
      Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'style' && typeof value === 'object') {
          Object.assign(element.style, value);
        } else if (key === 'className') {
          element.className = value;
        } else if (key === 'onClick') {
          element.addEventListener('click', value);
        } else {
          element.setAttribute(key, value);
        }
      });
      
      // Add children
      if (Array.isArray(children)) {
        children.forEach(child => {
          if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
          } else if (child instanceof Node) {
            element.appendChild(child);
          }
        });
      } else if (typeof children === 'string') {
        element.textContent = children;
      }
      
      return element;
    },
    
    // Check if element is visible
    isElementVisible: function(element) {
      if (!element) return false;
      
      return !!(
        element.offsetWidth || 
        element.offsetHeight || 
        element.getClientRects().length
      );
    },
    
    // Add CSS style to page
    addStyleToPage: function(css) {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
      return style;
    },
    
    // Math and Calculation Utilities
    
    // Random number between min and max (inclusive)
    randomInt: function(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1) + min);
    },
    
    // Clamp a value between min and max
    clamp: function(value, min, max) {
      return Math.max(min, Math.min(max, value));
    },
    
    // Weighted random selection
    weightedRandom: function(options) {
      const totalWeight = options.reduce((sum, option) => sum + (option.weight || 1), 0);
      let random = Math.random() * totalWeight;
      
      for (const option of options) {
        random -= (option.weight || 1);
        if (random <= 0) {
          return option.value;
        }
      }
      
      return options[options.length - 1].value;
    }
  };
})();

// Initialize GameUtilities when document is ready
document.addEventListener('DOMContentLoaded', function() {
  window.GameUtilities.init();
});
