// eventSystem.js - Custom events for game state changes

window.gameEvents = {
    // Flag to prevent double initialization
    initialized: false,
    
    // Dispatch a custom event
    dispatch: function(eventName, detail = {}) {
      console.log(`Dispatching event: ${eventName}`, detail);
      const event = new CustomEvent(eventName, { detail });
      document.dispatchEvent(event);
    },
    
    // Initialize event overrides safely
    initialize: function() {
      if (this.initialized) return;
      
      console.log("Initializing game events system...");
      
      // Safely override combat system functions
      if (window.combatSystem) {
        // Combat initiation
        if (window.combatSystem.initiateCombat && !window._initiateCombatWrapped) {
          window._initiateCombatWrapped = true;
          const originalInitiate = window.combatSystem.initiateCombat;
          window.combatSystem.initiateCombat = function() {
            window.gameEvents.dispatch('combatStarted');
            return originalInitiate.apply(this, arguments);
          };
        }
        
        // Combat end
        if (window.combatSystem.endCombat && !window._endCombatWrapped) {
          window._endCombatWrapped = true;
          const originalEndCombat = window.combatSystem.endCombat;
          window.combatSystem.endCombat = function(outcome) {
            window.gameEvents.dispatch('combatEnded', { outcome });
            return originalEndCombat.apply(this, arguments);
          };
        }
      }
      
      // Handle quest system events
      if (window.assignQuest && !window._assignQuestWrapped) {
        window._assignQuestWrapped = true;
        const originalAssign = window.assignQuest;
        window.assignQuest = function(templateId) {
          const result = originalAssign.apply(this, arguments);
          if (result) {
            window.gameEvents.dispatch('questStarted', { templateId });
          }
          return result;
        };
      }
      
      if (window.completeQuest && !window._completeQuestWrapped) {
        window._completeQuestWrapped = true;
        const originalComplete = window.completeQuest;
        window.completeQuest = function(questId) {
          const result = originalComplete.apply(this, arguments);
          if (result) {
            window.gameEvents.dispatch('questCompleted', { questId });
          }
          return result;
        };
      }
      
      this.initialized = true;
      console.log("Game events system initialized");
    }
  };
  
  // Initialize the event system after DOM is loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize after a delay to ensure other systems are loaded
    setTimeout(() => {
      window.gameEvents.initialize();
    }, 1000);
  });