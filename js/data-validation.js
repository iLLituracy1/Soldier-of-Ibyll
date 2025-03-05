// DATA VALIDATION MODULE
// This module provides validation functions to ensure data consistency
// throughout the Soldier of Ibyll game

window.DataValidator = (function() {
  // Private helper functions
  function _logValidationError(message, data) {
    if (window.GameUtilities) {
      window.GameUtilities.logError(`[Validation] ${message}`, data);
    } else {
      console.error(`[Validation] ${message}`, data);
    }
  }
  
  function _logValidationWarning(message, data) {
    if (window.GameUtilities) {
      window.GameUtilities.logWarning(`[Validation] ${message}`, data);
    } else {
      console.warn(`[Validation] ${message}`, data);
    }
  }
  
  // Schema definitions for game objects
  const schemas = {
    // Game state schema
    gameState: {
      // Required properties and their types
      required: {
        time: 'number',
        day: 'number',
        health: 'number',
        maxHealth: 'number',
        stamina: 'number',
        maxStamina: 'number',
        experience: 'number',
        level: 'number'
      },
      // Optional properties and their types
      optional: {
        inBattle: 'boolean',
        inMission: 'boolean',
        inMissionCombat: 'boolean',
        combatDistance: 'number',
        playerMomentum: 'number',
        enemyMomentum: 'number'
      },
      // Validation rules
      rules: [
        // Health and stamina must not exceed maximums
        (obj) => ({
          valid: obj.health <= obj.maxHealth,
          message: 'Health exceeds maxHealth',
          fix: () => { obj.health = obj.maxHealth; }
        }),
        (obj) => ({
          valid: obj.stamina <= obj.maxStamina,
          message: 'Stamina exceeds maxStamina',
          fix: () => { obj.stamina = obj.maxStamina; }
        }),
        // Check for combat state consistency
        (obj) => ({
          valid: !obj.inBattle || obj.currentEnemy !== null,
          message: 'In battle but no enemy present',
          fix: () => { obj.inBattle = false; }
        }),
        (obj) => ({
          valid: !obj.inMission || obj.currentMission !== null,
          message: 'In mission but no mission object present',
          fix: () => { obj.inMission = false; }
        }),
        (obj) => ({
          valid: !obj.inMissionCombat || obj.inBattle,
          message: 'In mission combat but not in battle',
          fix: () => { obj.inMissionCombat = false; }
        })
      ]
    },
    
    // Player schema
    player: {
      required: {
        name: 'string',
        origin: 'string',
        phy: 'number',
        men: 'number',
        skills: 'object',
        inventory: 'array'
      },
      optional: {
        career: 'object',
        taelors: 'number',
        relationships: 'object'
      },
      rules: [
        // Physical and mental attributes have upper limits
        (obj) => ({
          valid: obj.phy <= 15,
          message: 'Physical attribute exceeds maximum',
          fix: () => { obj.phy = 15; }
        }),
        (obj) => ({
          valid: obj.men <= 15,
          message: 'Mental attribute exceeds maximum',
          fix: () => { obj.men = 15; }
        }),
        // Validate skills object exists
        (obj) => ({
          valid: obj.skills && typeof obj.skills === 'object',
          message: 'Skills object is missing or invalid',
          fix: () => { 
            obj.skills = {
              melee: 0,
              marksmanship: 0,
              survival: 0,
              command: 0,
              discipline: 0,
              tactics: 0,
              organization: 0,
              arcana: 0
            };
          }
        })
      ]
    },
    
    // Enemy schema
    enemy: {
      required: {
        name: 'string',
        health: 'number',
        damage: 'number',
        threat: 'number'
      },
      optional: {
        description: 'string',
        skills: 'object',
        loot: 'array',
        special: 'array'
      },
      rules: [
        // Health must be positive
        (obj) => ({
          valid: obj.health > 0,
          message: 'Enemy health must be positive',
          fix: () => { obj.health = 1; }
        })
      ]
    },
    
    // Mission schema
    mission: {
      required: {
        title: 'string',
        description: 'string',
        stages: 'array',
        difficulty: 'number'
      },
      optional: {
        rewards: 'object',
        missionType: 'string',
        timeLimitMinutes: 'number'
      },
      rules: [
        // Stages array must not be empty
        (obj) => ({
          valid: obj.stages && obj.stages.length > 0,
          message: 'Mission has no stages',
          fix: () => { 
            if (!obj.stages) obj.stages = [];
            if (obj.stages.length === 0) {
              obj.stages.push({
                description: 'Complete the mission',
                objectives: []
              }); 
            }
          }
        })
      ]
    },
    
    // Item schema
    item: {
      required: {
        name: 'string'
      },
      optional: {
        effect: 'string',
        value: 'number',
        type: 'string',
        rarity: 'string',
        description: 'string'
      },
      rules: [
        // Item value should be non-negative
        (obj) => ({
          valid: !('value' in obj) || obj.value >= 0,
          message: 'Item value cannot be negative',
          fix: () => { obj.value = 0; }
        })
      ]
    }
  };
  
  // Public API
  return {
    // Validate an object against a schema
    validate: function(object, schemaName, autoFix = false) {
      if (!object) {
        _logValidationError(`Cannot validate null or undefined object against ${schemaName} schema`);
        return { valid: false, errors: ['Object is null or undefined'] };
      }
      
      const schema = schemas[schemaName];
      if (!schema) {
        _logValidationError(`Schema '${schemaName}' not found`);
        return { valid: false, errors: [`Schema '${schemaName}' not found`] };
      }
      
      const errors = [];
      const warnings = [];
      
      // Check required properties
      if (schema.required) {
        Object.entries(schema.required).forEach(([prop, type]) => {
          if (!(prop in object)) {
            errors.push(`Missing required property: ${prop}`);
            if (autoFix) {
              // Add default value based on type
              switch (type) {
                case 'string': object[prop] = ''; break;
                case 'number': object[prop] = 0; break;
                case 'boolean': object[prop] = false; break;
                case 'array': object[prop] = []; break;
                case 'object': object[prop] = {}; break;
              }
            }
          } else if (typeof object[prop] !== type && 
                    !(type === 'array' && Array.isArray(object[prop]))) {
            errors.push(`Property ${prop} should be type ${type}, got ${typeof object[prop]}`);
            if (autoFix) {
              // Convert to correct type if possible
              switch (type) {
                case 'string': object[prop] = String(object[prop]); break;
                case 'number': object[prop] = Number(object[prop]); break;
                case 'boolean': object[prop] = Boolean(object[prop]); break;
                case 'array': object[prop] = Array.isArray(object[prop]) ? object[prop] : []; break;
                case 'object': object[prop] = typeof object[prop] === 'object' ? object[prop] : {}; break;
              }
            }
          }
        });
      }
      
      // Check optional properties if they exist
      if (schema.optional) {
        Object.entries(schema.optional).forEach(([prop, type]) => {
          if (prop in object && typeof object[prop] !== type && 
              !(type === 'array' && Array.isArray(object[prop]))) {
            warnings.push(`Optional property ${prop} should be type ${type}, got ${typeof object[prop]}`);
            if (autoFix) {
              // Convert to correct type if possible
              switch (type) {
                case 'string': object[prop] = String(object[prop]); break;
                case 'number': object[prop] = Number(object[prop]); break;
                case 'boolean': object[prop] = Boolean(object[prop]); break;
                case 'array': object[prop] = Array.isArray(object[prop]) ? object[prop] : []; break;
                case 'object': object[prop] = typeof object[prop] === 'object' ? object[prop] : {}; break;
              }
            }
          }
        });
      }
      
      // Apply validation rules
      if (schema.rules) {
        schema.rules.forEach(rule => {
          const result = rule(object);
          if (!result.valid) {
            errors.push(result.message);
            if (autoFix && typeof result.fix === 'function') {
              result.fix();
            }
          }
        });
      }
      
      // Log warnings
      if (warnings.length > 0) {
        _logValidationWarning(`Validation warnings for ${schemaName}:`, warnings);
      }
      
      // Log errors
      if (errors.length > 0) {
        _logValidationError(`Validation errors for ${schemaName}:`, errors);
      }
      
      return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings
      };
    },
    
    // Validate game state
    validateGameState: function(autoFix = true) {
      const gameState = window.gameState;
      if (!gameState) {
        _logValidationError('gameState object not found');
        return { valid: false, errors: ['gameState object not found'] };
      }
      
      return this.validate(gameState, 'gameState', autoFix);
    },
    
    // Validate player data
    validatePlayer: function(autoFix = true) {
      const player = window.player;
      if (!player) {
        _logValidationError('player object not found');
        return { valid: false, errors: ['player object not found'] };
      }
      
      return this.validate(player, 'player', autoFix);
    },
    
    // Validate enemy object
    validateEnemy: function(enemy, autoFix = true) {
      if (!enemy) {
        _logValidationError('enemy object not found');
        return { valid: false, errors: ['enemy object not found'] };
      }
      
      return this.validate(enemy, 'enemy', autoFix);
    },
    
    // Validate mission object
    validateMission: function(mission, autoFix = true) {
      if (!mission) {
        _logValidationError('mission object not found');
        return { valid: false, errors: ['mission object not found'] };
      }
      
      return this.validate(mission, 'mission', autoFix);
    },
    
    // Validate item object
    validateItem: function(item, autoFix = true) {
      if (!item) {
        _logValidationError('item object not found');
        return { valid: false, errors: ['item object not found'] };
      }
      
      return this.validate(item, 'item', autoFix);
    },
    
    // Validate inventory items
    validateInventory: function(autoFix = true) {
      const player = window.player;
      if (!player || !player.inventory) {
        _logValidationError('player inventory not found');
        return { valid: false, errors: ['player inventory not found'] };
      }
      
      const errors = [];
      const warnings = [];
      
      player.inventory.forEach((item, index) => {
        const result = this.validate(item, 'item', autoFix);
        if (!result.valid) {
          errors.push(`Item at index ${index} (${item.name || 'unnamed'}) failed validation`);
        }
        if (result.warnings.length > 0) {
          warnings.push(`Item at index ${index} (${item.name || 'unnamed'}) has warnings`);
        }
      });
      
      return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings
      };
    },
    
    // Comprehensive validation of all game data
    validateAll: function(autoFix = true) {
      const results = {
        gameState: this.validateGameState(autoFix),
        player: this.validatePlayer(autoFix),
        inventory: this.validateInventory(autoFix)
      };
      
      // Check current enemy if in battle
      if (window.gameState && window.gameState.inBattle && window.gameState.currentEnemy) {
        results.currentEnemy = this.validateEnemy(window.gameState.currentEnemy, autoFix);
      }
      
      // Check current mission if in mission
      if (window.gameState && window.gameState.inMission && window.gameState.currentMission) {
        results.currentMission = this.validateMission(window.gameState.currentMission, autoFix);
      }
      
      // Determine overall validity
      const valid = Object.values(results).every(result => result.valid);
      
      if (!valid && window.GameUtilities) {
        window.GameUtilities.logWarning('Data validation found issues', results);
        
        // Add emergency recovery button for serious validation issues
        const totalErrors = Object.values(results)
          .reduce((count, result) => count + (result.errors ? result.errors.length : 0), 0);
          
        if (totalErrors > 5 && typeof window.GameUtilities.addEmergencyRecoveryButton === 'function') {
          window.GameUtilities.addEmergencyRecoveryButton();
        }
      }
      
      return {
        valid: valid,
        results: results
      };
    },
    
    // Add schema for validation
    addSchema: function(name, schema) {
      if (!name || typeof name !== 'string') {
        _logValidationError('Invalid schema name');
        return false;
      }
      
      if (!schema || typeof schema !== 'object') {
        _logValidationError('Invalid schema definition');
        return false;
      }
      
      schemas[name] = schema;
      return true;
    },
    
    // Get a copy of all schemas
    getSchemas: function() {
      return { ...schemas };
    }
  };
})();

// Run validation when document is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait for game state to initialize
  setTimeout(function() {
    if (window.DataValidator) {
      window.DataValidator.validateAll(true);
    }
  }, 1000);
});
