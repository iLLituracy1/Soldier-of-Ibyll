// STEALTH MISSION SYSTEM
// Specialized mechanics for stealth-based missions

window.StealthMissionSystem = (function() {
  // Private variables
  let _alertLevel = 0;          // 0-100% alert level
  let _detectionRadius = 0;     // Current detection radius (varies by alert level)
  let _playerPosition = null;   // Current player position in stealth map
  let _guardPatterns = [];      // Guard patrol patterns
  let _activeGuards = [];       // Active guards in the current area
  let _stealthMap = null;       // Map data for the stealth area
  let _interactiveObjects = []; // Objects player can interact with
  let _missionObjectives = [];  // Objectives for the stealth mission
  let _completedObjectives = 0; // Number of completed objectives
  let _isActive = false;        // Whether stealth system is currently active
  let _difficultyLevel = 2;     // Difficulty level (1-5)
  let _skillBonus = 0;          // Bonus from player skills
  let _lastNoisePosition = null;// Position of last noise made
  let _visionCones = true;      // Whether to show vision cones
  
  // Constants
  const ALERT_LEVELS = {
    UNAWARE: 0,       // Guards are not alerted
    SUSPICIOUS: 25,   // Guards are suspicious but haven't confirmed presence
    SEARCHING: 50,    // Guards are actively searching the area
    ALERTED: 75,      // Guards know someone is present and are on high alert
    COMBAT: 100       // Guards have spotted the player and combat is initiated
  };
  
  const SURFACES = {
    NORMAL: { noiseFactor: 1.0, speedFactor: 1.0 },
    WOOD: { noiseFactor: 1.2, speedFactor: 1.1 },
    STONE: { noiseFactor: 0.8, speedFactor: 0.9 },
    METAL: { noiseFactor: 1.5, speedFactor: 0.8 },
    CARPET: { noiseFactor: 0.6, speedFactor: 1.1 },
    WATER: { noiseFactor: 1.3, speedFactor: 0.7 }
  };
  
  const LIGHTING_LEVELS = {
    DARK: { visibilityFactor: 0.6 },
    DIM: { visibilityFactor: 0.8 },
    NORMAL: { visibilityFactor: 1.0 },
    BRIGHT: { visibilityFactor: 1.2 }
  };
  
  // Calculate stealth values based on player stats
  function _calculateStealthValues() {
    // Get relevant skills
    const survivalSkill = (window.player.skills && window.player.skills.survival) || 0;
    const disciplineSkill = (window.player.skills && window.player.skills.discipline) || 0;
    
    // Calculate skill bonus
    _skillBonus = (survivalSkill * 0.7) + (disciplineSkill * 0.3);
    
    // Calculate detection radius based on difficulty and player skills
    // Higher skill = smaller detection radius
    _detectionRadius = 10 * _difficultyLevel * (1 - (_skillBonus * 0.05));
    _detectionRadius = Math.max(3, Math.min(25, _detectionRadius));
    
    return {
      detectionRadius: _detectionRadius,
      skillBonus: _skillBonus
    };
  }
  
  // Create a guard with patrol pattern
  function _createGuard(guardType, startPosition, patrolPoints) {
    // Guard types determine stats and behavior
    const guardTypes = {
      standard: {
        visionRange: 8,
        visionWidth: 60, // degrees
        moveSpeed: 1.0,
        alertness: 1.0,
        detectionSpeed: 1.0
      },
      elite: {
        visionRange: 10,
        visionWidth: 75,
        moveSpeed: 1.2,
        alertness: 1.3,
        detectionSpeed: 1.2
      },
      dog: {
        visionRange: 6,
        visionWidth: 40,
        moveSpeed: 1.5,
        alertness: 1.8,
        detectionSpeed: 1.5,
        canSmell: true, // Special ability for dogs
        smellRange: 12
      },
      archer: {
        visionRange: 15,
        visionWidth: 45,
        moveSpeed: 0.9,
        alertness: 1.1,
        detectionSpeed: 0.9
      },
      sleepy: {
        visionRange: 6,
        visionWidth: 50,
        moveSpeed: 0.8,
        alertness: 0.6,
        detectionSpeed: 0.7
      }
    };
    
    // Default to standard if invalid type
    const guardData = guardTypes[guardType] || guardTypes.standard;
    
    // Create the guard object
    const guard = {
      type: guardType,
      position: { ...startPosition },
      direction: 0, // 0 degrees = east, 90 = north, etc.
      patrolPoints: patrolPoints || [],
      currentPatrolIndex: 0,
      patrolWaitTime: 0,
      detectionLevel: 0, // 0-100%
      state: 'patrol', // patrol, alert, search, combat
      lastKnownPlayerPosition: null,
      visionRange: guardData.visionRange,
      visionWidth: guardData.visionWidth,
      moveSpeed: guardData.moveSpeed,
      alertness: guardData.alertness,
      detectionSpeed: guardData.detectionSpeed,
      canSmell: guardData.canSmell || false,
      smellRange: guardData.smellRange || 0
    };
    
    return guard;
  }
  
  // Update a guard's position and state
  function _updateGuard(guard, deltaTime, playerPosition) {
    // Skip if in combat already
    if (_alertLevel >= ALERT_LEVELS.COMBAT) return;
    
    // Update guard based on state
    switch(guard.state) {
      case 'patrol':
        _updateGuardPatrol(guard, deltaTime);
        break;
      case 'alert':
        _updateGuardAlert(guard, deltaTime, playerPosition);
        break;
      case 'search':
        _updateGuardSearch(guard, deltaTime);
        break;
      case 'combat':
        // In combat state, guards try to engage the player
        _moveGuardTowards(guard, playerPosition, deltaTime);
        break;
    }
    
    // Check if guard detects player
    if (playerPosition) {
      const detected = _checkGuardDetection(guard, playerPosition);
      
      if (detected) {
        // If detected, update guard and alert level
        guard.detectionLevel = 100;
        guard.state = 'combat';
        guard.lastKnownPlayerPosition = { ...playerPosition };
        
        // Update global alert level
        _alertLevel = ALERT_LEVELS.COMBAT;
      }
    }
  }
  
  // Update guard in patrol state
  function _updateGuardPatrol(guard, deltaTime) {
    // If no patrol points, just stand in place
    if (!guard.patrolPoints || guard.patrolPoints.length === 0) {
      return;
    }
    
    // If waiting at patrol point
    if (guard.patrolWaitTime > 0) {
      guard.patrolWaitTime -= deltaTime;
      return;
    }
    
    // Get current target patrol point
    const targetPoint = guard.patrolPoints[guard.currentPatrolIndex];
    
    // Move towards target point
    const reached = _moveGuardTowards(guard, targetPoint, deltaTime);
    
    // If reached target point
    if (reached) {
      // Wait at point
      guard.patrolWaitTime = targetPoint.waitTime || 2000; // Default 2 second wait
      
      // Move to next patrol point
      guard.currentPatrolIndex = (guard.currentPatrolIndex + 1) % guard.patrolPoints.length;
    }
    
    // Check if global alert level should change guard behavior
    if (_alertLevel >= ALERT_LEVELS.SEARCHING) {
      guard.state = 'search';
    } else if (_alertLevel >= ALERT_LEVELS.SUSPICIOUS) {
      // Look around more carefully
      guard.visionWidth += 15; // Temporarily increase vision width
    }
  }
  
  // Update guard in alert state
  function _updateGuardAlert(guard, deltaTime, playerPosition) {
    // In alert state, guard moves towards last known player position or noise
    const targetPosition = guard.lastKnownPlayerPosition || _lastNoisePosition;
    
    if (targetPosition) {
      const reached = _moveGuardTowards(guard, targetPosition, deltaTime);
      
      if (reached) {
        // Start searching
        guard.state = 'search';
      }
    } else {
      // No target position, fallback to search
      guard.state = 'search';
    }
  }
  
  // Update guard in search state
  function _updateGuardSearch(guard, deltaTime) {
    // In search state, guard moves to random positions near last known position
    if (!guard.searchTarget || guard.searchTimeRemaining <= 0) {
      // Create new search target
      const center = guard.lastKnownPlayerPosition || _lastNoisePosition || guard.position;
      
      // Random position within search radius
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 8 + 2; // 2-10 units away
      
      guard.searchTarget = {
        x: center.x + Math.cos(angle) * distance,
        y: center.y + Math.sin(angle) * distance
      };
      
      guard.searchTimeRemaining = 5000; // 5 seconds per search location
    }
    
    // Move towards search target
    const reached = _moveGuardTowards(guard, guard.searchTarget, deltaTime);
    
    if (reached) {
      // Wait and look around
      guard.direction += (Math.random() - 0.5) * 90; // Look around +/- 45 degrees
      guard.searchTimeRemaining -= deltaTime;
    }
    
    // Reduce global alert level over time if no new stimuli
    if (_alertLevel > ALERT_LEVELS.UNAWARE) {
      _alertLevel = Math.max(ALERT_LEVELS.UNAWARE, _alertLevel - (deltaTime * 0.005));
    }
    
    // Return to patrol when alert level is low
    if (_alertLevel <= ALERT_LEVELS.SUSPICIOUS) {
      guard.state = 'patrol';
      guard.visionWidth = guardTypes[guard.type].visionWidth; // Reset vision width
    }
  }
  
  // Move guard towards a target position
  function _moveGuardTowards(guard, targetPosition, deltaTime) {
    // Calculate direction to target
    const dx = targetPosition.x - guard.position.x;
    const dy = targetPosition.y - guard.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if we've reached the target (within 0.5 units)
    if (distance <= 0.5) {
      return true;
    }
    
    // Calculate new direction
    const targetDirection = Math.atan2(dy, dx) * (180 / Math.PI);
    
    // Smoothly rotate towards target direction
    const angleDiff = _getAngleDifference(guard.direction, targetDirection);
    const maxTurn = 180 * (deltaTime / 1000); // 180 degrees per second
    const turnAmount = Math.min(Math.abs(angleDiff), maxTurn) * Math.sign(angleDiff);
    
    guard.direction += turnAmount;
    
    // Normalize direction to 0-360
    guard.direction = (guard.direction + 360) % 360;
    
    // Move towards target
    const moveSpeed = guard.moveSpeed * deltaTime / 1000; // Units per second
    const moveDistance = Math.min(distance, moveSpeed);
    
    // Update position
    guard.position.x += Math.cos(guard.direction * (Math.PI / 180)) * moveDistance;
    guard.position.y += Math.sin(guard.direction * (Math.PI / 180)) * moveDistance;
    
    return false; // Not reached yet
  }
  
  // Check if guard detects the player
  function _checkGuardDetection(guard, playerPosition) {
    // Calculate distance to player
    const dx = playerPosition.x - guard.position.x;
    const dy = playerPosition.y - guard.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // First check distance
    if (distance > guard.visionRange) {
      // Too far to see
      return false;
    }
    
    // Check if in vision cone (if not using smell)
    if (!guard.canSmell) {
      // Calculate angle to player
      const angleToPlayer = Math.atan2(dy, dx) * (180 / Math.PI);
      
      // Calculate difference between guard direction and angle to player
      const angleDiff = _getAngleDifference(guard.direction, angleToPlayer);
      
      // Check if player is in vision cone
      if (Math.abs(angleDiff) > guard.visionWidth / 2) {
        // Not in vision cone
        return false;
      }
    } else if (guard.canSmell && distance <= guard.smellRange) {
      // Guard can smell player within smell range (ignores vision cone)
      guard.detectionLevel += guard.alertness * 10;
    }
    
    // Calculate line of sight - check for obstacles
    if (_stealthMap && _stealthMap.obstacles) {
      // Simple line-of-sight check
      const hasLineOfSight = _checkLineOfSight(guard.position, playerPosition);
      
      if (!hasLineOfSight) {
        // No line of sight
        return false;
      }
    }
    
    // Calculate detection speed based on distance, lighting, and movement
    const distanceFactor = 1 - (distance / guard.visionRange);
    const lightingFactor = _getLightingFactorAtPosition(playerPosition);
    const movementFactor = _playerMovement ? 1.5 : 1.0; // Moving players are easier to detect
    
    // Increase detection level
    const detectionIncrease = guard.detectionSpeed * 
                             distanceFactor * 
                             lightingFactor * 
                             movementFactor * 
                             guard.alertness;
    
    guard.detectionLevel += detectionIncrease;
    
    // Check if detection level reached threshold
    if (guard.detectionLevel >= 100) {
      return true;
    }
    
    // Update overall alert level based on guard's detection
    if (guard.detectionLevel > 75) {
      _alertLevel = Math.max(_alertLevel, ALERT_LEVELS.ALERTED);
    } else if (guard.detectionLevel > 50) {
      _alertLevel = Math.max(_alertLevel, ALERT_LEVELS.SEARCHING);
    } else if (guard.detectionLevel > 25) {
      _alertLevel = Math.max(_alertLevel, ALERT_LEVELS.SUSPICIOUS);
    }
    
    return false;
  }
  
  // Calculate angle difference (accounting for wrapping)
  function _getAngleDifference(angle1, angle2) {
    let diff = angle2 - angle1;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  }
  
  // Check line of sight between two points
  function _checkLineOfSight(pointA, pointB) {
    // Simplified line-of-sight check
    // In a real implementation, you'd use raycasting against the obstacle map
    
    // If no obstacles or map data, assume clear line of sight
    if (!_stealthMap || !_stealthMap.obstacles || _stealthMap.obstacles.length === 0) {
      return true;
    }
    
    // For simplicity, check a few points along the line
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = pointA.x + (pointB.x - pointA.x) * t;
      const y = pointA.y + (pointB.y - pointA.y) * t;
      
      // Check each obstacle
      for (const obstacle of _stealthMap.obstacles) {
        // Simple rectangle check
        if (x >= obstacle.x && x <= obstacle.x + obstacle.width &&
            y >= obstacle.y && y <= obstacle.y + obstacle.height) {
          return false; // Line of sight blocked
        }
      }
    }
    
    return true; // Clear line of sight
  }
  
  // Get lighting factor at a position
  function _getLightingFactorAtPosition(position) {
    // Default to normal lighting
    let lightingFactor = LIGHTING_LEVELS.NORMAL.visibilityFactor;
    
    // If we have lighting data in the map
    if (_stealthMap && _stealthMap.lightingSources) {
      // Check each light source
      for (const light of _stealthMap.lightingSources) {
        const dx = position.x - light.x;
        const dy = position.y - light.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If within light radius
        if (distance <= light.radius) {
          // Calculate light intensity at this point
          const intensity = 1 - (distance / light.radius);
          const lightEffect = light.brightness * intensity;
          
          // Increase lighting factor (brighter = easier to spot)
          lightingFactor += lightEffect;
        }
      }
    }
    
    return lightingFactor;
  }
  
  // Handle player movement
  function _handlePlayerMovement(newPosition, isSneaking) {
    if (!_isActive || !_playerPosition) return;
    
    // Calculate movement noise
    const dx = newPosition.x - _playerPosition.x;
    const dy = newPosition.y - _playerPosition.y;
    const movementDistance = Math.sqrt(dx * dx + dy * dy);
    
    // If actually moved
    if (movementDistance > 0) {
      // Calculate noise level based on speed and sneaking
      let noiseLevel = movementDistance;
      
      // Reduce noise when sneaking
      if (isSneaking) {
        noiseLevel *= 0.4;
      }
      
      // Apply surface noise factor
      const surfaceType = _getSurfaceTypeAtPosition(newPosition);
      noiseLevel *= SURFACES[surfaceType].noiseFactor;
      
      // Apply skill bonus to reduce noise
      noiseLevel *= (1 - (_skillBonus * 0.05));
      
      // If noise is significant
      if (noiseLevel > 0.5) {
        // Set last noise position
        _lastNoisePosition = { ...newPosition };
        
        // Alert nearby guards based on noise level
        _alertNearbyGuards(newPosition, noiseLevel);
      }
      
      // Update player position
      _playerPosition = { ...newPosition };
    }
  }
  
  // Get surface type at position
  function _getSurfaceTypeAtPosition(position) {
    // Default to normal
    let surfaceType = 'NORMAL';
    
    // If we have surface data in the map
    if (_stealthMap && _stealthMap.surfaces) {
      // Check each surface area
      for (const surface of _stealthMap.surfaces) {
        // Simple rectangle check
        if (position.x >= surface.x && position.x <= surface.x + surface.width &&
            position.y >= surface.y && position.y <= surface.y + surface.height) {
          return surface.type;
        }
      }
    }
    
    return surfaceType;
  }
  
  // Alert nearby guards based on noise
  function _alertNearbyGuards(position, noiseLevel) {
    // Base alert radius on noise level
    const alertRadius = noiseLevel * 5; // 5 units per noise unit
    
    // Check each guard
    for (const guard of _activeGuards) {
      // Calculate distance to guard
      const dx = position.x - guard.position.x;
      const dy = position.y - guard.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If within alert radius
      if (distance <= alertRadius) {
        // Calculate alert effect based on distance
        const alertEffect = 1 - (distance / alertRadius);
        
        // Increase detection level
        guard.detectionLevel += alertEffect * 25; // Up to 25% detection per noise
        
        // Set last known position to noise
        guard.lastKnownPlayerPosition = { ...position };
        
        // Update guard state if significantly alerted
        if (alertEffect > 0.6) {
          if (guard.state === 'patrol') {
            guard.state = 'alert';
          }
        }
      }
    }
    
    // Update global alert level
    if (noiseLevel > 2) {
      _alertLevel = Math.max(_alertLevel, ALERT_LEVELS.SEARCHING);
    } else if (noiseLevel > 1) {
      _alertLevel = Math.max(_alertLevel, ALERT_LEVELS.SUSPICIOUS);
    }
  }
  
  // Handle player interaction with objects
  function _handlePlayerInteraction(objectId) {
    // Find the object
    const object = _interactiveObjects.find(obj => obj.id === objectId);
    
    if (!object) return false;
    
    // Check if player is close enough
    if (_playerPosition) {
      const dx = _playerPosition.x - object.position.x;
      const dy = _playerPosition.y - object.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // If too far
      if (distance > object.interactionRadius) {
        return false;
      }
      
      // Handle interaction based on object type
      switch(object.type) {
        case 'door':
          // Toggle door state
          object.isOpen = !object.isOpen;
          
          // Update stealth map if needed
          if (_stealthMap && _stealthMap.obstacles) {
            // Find door obstacle
            const doorObstacle = _stealthMap.obstacles.find(obs => obs.id === objectId);
            
            if (doorObstacle) {
              doorObstacle.isActive = !object.isOpen;
            }
          }
          
          // Make noise when opening/closing
          if (!object.isQuiet) {
            _lastNoisePosition = { ...object.position };
            _alertNearbyGuards(object.position, 1.5); // Moderate noise
          }
          
          break;
          
        case 'chest':
        case 'container':
          // Open container and get contents
          object.isOpen = true;
          
          // Make noise when opening
          if (!object.isQuiet) {
            _lastNoisePosition = { ...object.position };
            _alertNearbyGuards(object.position, 1.0); // Small noise
          }
          
          // Handle objective completion if needed
          if (object.isObjective) {
            _completeObjective(object.objectiveId);
          }
          
          break;
          
        case 'lever':
        case 'switch':
          // Toggle state
          object.isActivated = !object.isActivated;
          
          // Make noise when activating
          _lastNoisePosition = { ...object.position };
          _alertNearbyGuards(object.position, 0.8); // Small noise
          
          // Trigger effects
          if (object.effects) {
            for (const effect of object.effects) {
              switch(effect.type) {
                case 'door':
                  // Find the target door
                  const targetDoor = _interactiveObjects.find(obj => obj.id === effect.targetId);
                  if (targetDoor) {
                    targetDoor.isOpen = effect.value;
                  }
                  break;
                  
                case 'light':
                  // Find the target light
                  if (_stealthMap && _stealthMap.lightingSources) {
                    const targetLight = _stealthMap.lightingSources.find(light => light.id === effect.targetId);
                    if (targetLight) {
                      targetLight.isActive = effect.value;
                    }
                  }
                  break;
              }
            }
          }
          
          break;
          
        case 'distraction':
          // Activate a distraction to lure guards
          object.isActivated = true;
          
          // Create noise at object position
          _lastNoisePosition = { ...object.position };
          _alertNearbyGuards(object.position, 2.5); // Loud noise
          
          // Set distraction duration
          object.durationRemaining = object.duration || 10000; // 10 seconds default
          
          break;
      }
      
      return true;
    }
    
    return false;
  }
  
  // Complete an objective
  function _completeObjective(objectiveId) {
    // Find the objective
    const objective = _missionObjectives.find(obj => obj.id === objectiveId);
    
    if (!objective || objective.completed) return;
    
    // Mark as completed
    objective.completed = true;
    _completedObjectives++;
    
    // Check if all objectives are completed
    if (_completedObjectives >= _missionObjectives.length) {
      // Mission success!
      _endStealthMission(true);
    }
  }
  
  // End stealth mission
  function _endStealthMission(success) {
    // Calculate final metrics
    const finalMetrics = {
      success: success,
      alertLevel: _alertLevel,
      guardsAlerted: _activeGuards.filter(g => g.state !== 'patrol').length,
      objectivesCompleted: _completedObjectives,
      totalObjectives: _missionObjectives.length
    };
    
    // Reset state
    _isActive = false;
    
    // Call callback if provided
    if (typeof _stealthMissionCallback === 'function') {
      _stealthMissionCallback(finalMetrics);
    }
    
    return finalMetrics;
  }
  
  // Create a stealth map
  function _createStealthMap(mapData) {
    // Default map if none provided
    if (!mapData) {
      mapData = {
        width: 20,
        height: 20,
        obstacles: [],
        surfaces: [],
        lightingSources: [],
        spawnPoints: {
          player: { x: 2, y: 2 },
          guards: [
            { x: 10, y: 10, type: 'standard' }
          ]
        }
      };
    }
    
    return mapData;
  }
  
  // Render stealth UI
  function _renderStealthUI() {
    try {
      // Create or get container
      let container = document.getElementById('stealthMissionInterface');
      
      if (!container) {
        container = document.createElement('div');
        container.id = 'stealthMissionInterface';
        container.className = 'stealth-mission-interface';
        document.body.appendChild(container);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
          .stealth-mission-interface {
            position: fixed;
            top: 10px;
            right: 10px;
            background-color: rgba(0, 0, 0, 0.6);
            border-radius: 5px;
            padding: 10px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 1000;
          }
          
          .alert-meter {
            width: 150px;
            height: 20px;
            background-color: #333;
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 10px;
          }
          
          .alert-level {
            height: 100%;
            background-color: #4b6bff;
            width: 0%;
            transition: width 0.5s ease, background-color 0.5s ease;
          }
          
          .stealth-objectives {
            margin-bottom: 10px;
          }
          
          .objective-item {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
            font-size: 12px;
          }
          
          .objective-checkbox {
            width: 12px;
            height: 12px;
            border: 1px solid white;
            margin-right: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .objective-item.completed .objective-checkbox {
            background-color: #4bff6b;
            color: black;
          }
          
          .objective-item.completed .objective-text {
            text-decoration: line-through;
            opacity: 0.7;
          }
          
          .stealth-controls {
            font-size: 12px;
            color: #ccc;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Update content
      let alertColor = '#4b6bff'; // Blue for normal
      
      if (_alertLevel >= ALERT_LEVELS.COMBAT) {
        alertColor = '#ff4b4b'; // Red for combat
      } else if (_alertLevel >= ALERT_LEVELS.ALERTED) {
        alertColor = '#ffa64b'; // Orange for alerted
      } else if (_alertLevel >= ALERT_LEVELS.SEARCHING) {
        alertColor = '#ffdc4b'; // Yellow for searching
      }
      
      // Create interface HTML
      container.innerHTML = `
        <div class="alert-meter">
          <div class="alert-level" style="width:${_alertLevel}%; background-color:${alertColor};"></div>
        </div>
        
        <div class="stealth-objectives">
          ${_missionObjectives.map(obj => `
            <div class="objective-item ${obj.completed ? 'completed' : ''}">
              <div class="objective-checkbox">${obj.completed ? '✓' : ''}</div>
              <div class="objective-text">${obj.text}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="stealth-controls">
          WASD: Movement | SHIFT: Sneak | E: Interact
        </div>
      `;
    } catch (error) {
      console.error("[StealthMissionSystem] Failed to render UI:", error);
    }
  }
  
  // Public API
  return {
    // Initialize the stealth mission system
    init: function() {
      console.log("[StealthMissionSystem] Initializing stealth mission system");
      
      // Calculate initial stealth values
      _calculateStealthValues();
      
      return true;
    },
    
    // Start a stealth mission
    startStealthMission: function(params) {
      try {
        // Default parameters
        params = params || {};
        
        _difficultyLevel = params.difficulty || 2;
        _stealthMap = _createStealthMap(params.mapData);
        _missionObjectives = params.objectives || [
          { id: "obj1", text: "Infiltrate the building", completed: false },
          { id: "obj2", text: "Retrieve the documents", completed: false },
          { id: "obj3", text: "Escape without being detected", completed: false }
        ];
        
        // Set up player position
        _playerPosition = _stealthMap.spawnPoints.player;
        
        // Create guards
        _activeGuards = [];
        if (_stealthMap.spawnPoints.guards) {
          for (const guardSpawn of _stealthMap.spawnPoints.guards) {
            const patrolPoints = guardSpawn.patrolPoints || [];
            const guard = _createGuard(guardSpawn.type, guardSpawn, patrolPoints);
            _activeGuards.push(guard);
          }
        }
        
        // Create interactive objects
        _interactiveObjects = params.interactiveObjects || [];
        
        // Reset mission state
        _alertLevel = ALERT_LEVELS.UNAWARE;
        _completedObjectives = 0;
        _isActive = true;
        _stealthMissionCallback = params.callback;
        
        // Set up stealth UI
        _renderStealthUI();
        
        console.log("[StealthMissionSystem] Stealth mission started");
        
        return true;
      } catch (error) {
        console.error("[StealthMissionSystem] Failed to start stealth mission:", error);
        return false;
      }
    },
    
    // Update the stealth mission (called on game loop)
    update: function(deltaTime) {
      if (!_isActive) return;
      
      try {
        // Update guards
        for (const guard of _activeGuards) {
          _updateGuard(guard, deltaTime, _playerPosition);
        }
        
        // Update interactive objects
        for (const object of _interactiveObjects) {
          // Update distractions
          if (object.type === 'distraction' && object.isActivated) {
            object.durationRemaining -= deltaTime;
            
            if (object.durationRemaining <= 0) {
              object.isActivated = false;
            }
          }
        }
        
        // Update UI
        _renderStealthUI();
        
        // Check for combat transition
        if (_alertLevel >= ALERT_LEVELS.COMBAT) {
          // End stealth mission and transition to combat
          this.endStealthMission(false);
          
          // Trigger combat if available
          if (window.CombatSystem && typeof window.CombatSystem.startCombat === 'function') {
            // Convert active guards to combat enemies
            const enemies = _activeGuards.map(guard => {
              return {
                name: `Arrasi ${_capitalizeFirstLetter(guard.type)} Guard`,
                health: 50 + (guard.type === 'elite' ? 25 : 0),
                damage: 8 + (guard.type === 'elite' ? 3 : 0),
                threat: guard.type === 'elite' ? 3 : 2
              };
            });
            
            // Start combat with first enemy (or all if supported)
            window.CombatSystem.startCombat(enemies[0]);
          }
        }
      } catch (error) {
        console.error("[StealthMissionSystem] Error in update:", error);
      }
    },
    
    // Handle player movement in stealth mission
    movePlayer: function(newPosition, isSneaking) {
      if (!_isActive) return false;
      
      return _handlePlayerMovement(newPosition, isSneaking);
    },
    
    // Handle player interaction with an object
    interactWithObject: function(objectId) {
      if (!_isActive) return false;
      
      return _handlePlayerInteraction(objectId);
    },
    
    // End the stealth mission
    endStealthMission: function(success) {
      if (!_isActive) return null;
      
      return _endStealthMission(success);
    },
    
    // Get the current alert level
    getAlertLevel: function() {
      return _alertLevel;
    },
    
    // Get the player's current position
    getPlayerPosition: function() {
      return _playerPosition ? { ..._playerPosition } : null;
    },
    
    // Get the active guards
    getActiveGuards: function() {
      return _activeGuards.map(guard => ({ ...guard }));
    },
    
    // Get the mission objectives
    getMissionObjectives: function() {
      return _missionObjectives.map(obj => ({ ...obj }));
    },
    
    // Toggle vision cones display
    toggleVisionCones: function(show) {
      _visionCones = show !== undefined ? show : !_visionCones;
      return _visionCones;
    },
    
    // Make a noise at a position
    makeNoise: function(position, noiseLevel) {
      if (!_isActive) return false;
      
      _lastNoisePosition = { ...position };
      _alertNearbyGuards(position, noiseLevel);
      
      return true;
    },
    
    // Check if a stealth mission is active
    isActive: function() {
      return _isActive;
    }
  };
})();

// Helper function to capitalize first letter of string
function _capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialize the stealth mission system when document is ready
document.addEventListener('DOMContentLoaded', function() {
  if (window.StealthMissionSystem) {
    window.StealthMissionSystem.init();
  }
});
