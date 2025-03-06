// MISSION GENERATOR SYSTEM
// Procedural mission generation with mission chains, branching outcomes, and reputation effects

window.MissionGenerator = (function() {
  // Private state
  let _missionTemplates = {};      // Mission templates registered with the generator
  let _missionChains = {};         // Mission chain definitions
  let _activeMissionChains = [];   // Currently active mission chains
  let _locationData = {};          // Location data for mission generation
  let _enemyData = {};             // Enemy data for mission generation
  let _eventListeners = {};        // Event listeners for mission generator events
  
  // Difficulty levels
  const DIFFICULTY = {
    VERY_EASY: 1,
    EASY: 2,
    MEDIUM: 3,
    HARD: 4,
    VERY_HARD: 5
  };
  
  // Mission types
  const MISSION_TYPES = {
    COMBAT: 'combat',
    STEALTH: 'stealth',
    RECON: 'recon',
    DIPLOMATIC: 'diplomatic',
    ESCORT: 'escort',
    SUPPLY: 'supply',
    RESCUE: 'rescue',
    SABOTAGE: 'sabotage'
  };
  
  // Stage types (extending existing types)
  const STAGE_TYPES = {
    TEXT: 'text',
    CHOICE: 'choice',
    COMBAT: 'combat',
    SKILL_CHECK: 'skill_check',
    DIALOGUE: 'dialogue',
    STEALTH: 'stealth',         // New: Stealth mechanics
    ESCORT: 'escort',           // New: Escort NPC mechanics
    PUZZLE: 'puzzle',           // New: Puzzle mechanics
    TIMED_CHALLENGE: 'timed',   // New: Time-limited challenges
    MAP_MOVEMENT: 'map',        // New: Map-based movement
    DIPLOMATIC: 'diplomatic'    // New: Diplomatic negotiations
  };
  
  // Private helper functions
  function _log(message, data) {
    console.log(`[MissionGenerator] ${message}`, data || '');
  }
  
  function _error(message, data) {
    console.error(`[MissionGenerator] ${message}`, data || '');
  }
  
  // Generate a unique ID
  function _generateId() {
    return 'mission_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  }
  
  // Get player level for difficulty calculations
  function _getPlayerLevel() {
    return window.gameState.level || 1;
  }
  
  // Get player skill value
  function _getPlayerSkill(skillName) {
    if (!window.player || !window.player.skills) return 0;
    return window.player.skills[skillName] || 0;
  }
  
  // Generate rewards based on difficulty
  function _generateRewards(difficulty, missionType) {
    const baseExp = 25;
    const baseTaelors = 15;
    
    // Calculate scaled rewards
    const expMultiplier = 1 + (difficulty * 0.5);
    const taelorMultiplier = 1 + (difficulty * 0.4);
    
    // Add randomness to rewards (±15%)
    const randomFactor = 0.85 + (Math.random() * 0.3);
    
    const expReward = Math.floor(baseExp * difficulty * expMultiplier * randomFactor);
    const taelorReward = Math.floor(baseTaelors * difficulty * taelorMultiplier * randomFactor);
    
    // Generate potential items based on mission type and difficulty
    const potentialItems = [];
    
    if (missionType === MISSION_TYPES.COMBAT) {
      if (Math.random() < 0.3) {
        potentialItems.push({
          name: "Combat Stimulant",
          effect: "Temporarily increases Physical by 1 during combat",
          value: 25 * difficulty,
          chance: 0.5 + (difficulty * 0.1)
        });
      }
    }
    
    if (missionType === MISSION_TYPES.RECON || missionType === MISSION_TYPES.STEALTH) {
      if (Math.random() < 0.3) {
        potentialItems.push({
          name: "Nightsight Potion",
          effect: "Grants improved vision in darkness",
          value: 20 * difficulty,
          chance: 0.5 + (difficulty * 0.1)
        });
      }
    }
    
    if (missionType === MISSION_TYPES.SUPPLY) {
      if (Math.random() < 0.4) {
        potentialItems.push({
          name: "Medical Supply Kit",
          effect: "Restores 25 health when used",
          value: 30 * difficulty,
          chance: 0.6 + (difficulty * 0.1)
        });
      }
    }
    
    // Add rare valuable item for harder missions
    if (difficulty >= DIFFICULTY.HARD && Math.random() < 0.2) {
      potentialItems.push({
        name: "Rare Artifact",
        effect: "Valuable collector's item",
        value: 75 * difficulty,
        chance: 0.3
      });
    }
    
    // Calculate relationship changes
    const relationships = {};
    
    // Different mission types affect different NPCs
    if (missionType === MISSION_TYPES.COMBAT || missionType === MISSION_TYPES.RECON) {
      relationships.commander = Math.floor(2 + (difficulty * 0.8));
    } else if (missionType === MISSION_TYPES.STEALTH || missionType === MISSION_TYPES.SABOTAGE) {
      relationships.sergeant = Math.floor(2 + (difficulty * 0.7));
    } else if (missionType === MISSION_TYPES.SUPPLY) {
      relationships.quartermaster = Math.floor(3 + (difficulty * 0.9));
    }
    
    // Add skill improvement chances
    const skillImprovements = {};
    
    // Add skill improvements based on mission type
    switch (missionType) {
      case MISSION_TYPES.COMBAT:
        skillImprovements.melee = { min: 0.1, max: 0.2 + (difficulty * 0.1) };
        break;
      case MISSION_TYPES.STEALTH:
        skillImprovements.survival = { min: 0.1, max: 0.2 + (difficulty * 0.1) };
        break;
      case MISSION_TYPES.RECON:
        skillImprovements.marksmanship = { min: 0.1, max: 0.2 + (difficulty * 0.1) };
        break;
      case MISSION_TYPES.DIPLOMATIC:
        skillImprovements.command = { min: 0.1, max: 0.2 + (difficulty * 0.1) };
        break;
      case MISSION_TYPES.ESCORT:
        skillImprovements.tactics = { min: 0.1, max: 0.2 + (difficulty * 0.1) };
        break;
      default:
        // Add a random skill improvement
        const skills = ['melee', 'marksmanship', 'survival', 'command', 'tactics', 'discipline'];
        const randomSkill = skills[Math.floor(Math.random() * skills.length)];
        skillImprovements[randomSkill] = { min: 0.1, max: 0.2 + (difficulty * 0.1) };
    }
    
    return {
      experience: expReward,
      taelors: taelorReward,
      items: potentialItems,
      relationships: relationships,
      skillImprovements: skillImprovements
    };
  }
  
  // Generate a random enemy appropriate for the mission
  function _generateEnemy(difficulty, missionType, playerLevel) {
    // Default enemy if we can't find an appropriate one
    const defaultEnemy = {
      name: "Arrasi Scout",
      description: "A lightly armed scout from the Arrasi forces.",
      health: 50 + (playerLevel * 5),
      damage: 5 + (playerLevel),
      threat: difficulty,
      skills: {
        melee: 1 + Math.floor(difficulty / 2),
        marksmanship: 2 + Math.floor(difficulty / 2)
      }
    };
    
    // If enemy data is available, select an appropriate enemy
    if (_enemyData && Object.keys(_enemyData).length > 0) {
      const appropriateEnemies = Object.values(_enemyData).filter(enemy => {
        return enemy.threat <= difficulty + 1 && enemy.threat >= difficulty - 1;
      });
      
      if (appropriateEnemies.length > 0) {
        // Pick a random appropriate enemy
        const enemy = appropriateEnemies[Math.floor(Math.random() * appropriateEnemies.length)];
        
        // Clone the enemy to avoid modifying the template
        const enemyClone = JSON.parse(JSON.stringify(enemy));
        
        // Scale enemy stats based on player level
        const levelFactor = 1 + ((playerLevel - 1) * 0.15);
        enemyClone.health = Math.floor(enemyClone.health * levelFactor);
        enemyClone.damage = Math.floor(enemyClone.damage * levelFactor);
        
        return enemyClone;
      }
    }
    
    // Fall back to default enemy
    return defaultEnemy;
  }
  
  // Generate a mission environment
  function _generateEnvironment(locationType) {
    const environments = {
      forest: {
        terrain: ['dense', 'light', 'old-growth', 'swampy'],
        weather: ['clear', 'foggy', 'rainy', 'windy']
      },
      mountain: {
        terrain: ['rocky', 'steep', 'narrow', 'craggy'],
        weather: ['clear', 'windy', 'stormy', 'snowy']
      },
      plains: {
        terrain: ['open', 'grassy', 'hilly', 'barren'],
        weather: ['clear', 'windy', 'rainy', 'hot']
      },
      urban: {
        terrain: ['streets', 'alleys', 'ruins', 'buildings'],
        weather: ['clear', 'foggy', 'rainy', 'night']
      },
      desert: {
        terrain: ['dunes', 'rocky', 'flat', 'canyon'],
        weather: ['clear', 'sandstorm', 'hot', 'night']
      }
    };
    
    // Default to forest if location type is not specified or not found
    const location = environments[locationType] || environments.forest;
    
    // Pick random terrain and weather
    const terrain = location.terrain[Math.floor(Math.random() * location.terrain.length)];
    const weather = location.weather[Math.floor(Math.random() * location.weather.length)];
    
    return {
      terrain: terrain,
      weather: weather
    };
  }
  
  // Generate mission stages procedurally
  function _generateMissionStages(missionType, difficulty, playerLevel, environment) {
    const stages = [];
    
    // Start with an introduction stage
    stages.push({
      type: STAGE_TYPES.TEXT,
      text: _generateIntroText(missionType, difficulty, environment)
    });
    
    // Generate 3-6 main stages based on difficulty
    const numStages = 3 + Math.floor(Math.random() * Math.min(difficulty + 1, 4));
    
    for (let i = 0; i < numStages; i++) {
      // Determine stage type based on mission type and progression
      let stageType;
      
      // First actual stage after intro is usually a choice
      if (i === 0) {
        stageType = STAGE_TYPES.CHOICE;
      } 
      // Last stage usually has a climactic element
      else if (i === numStages - 1) {
        if (missionType === MISSION_TYPES.COMBAT) {
          stageType = STAGE_TYPES.COMBAT;
        } else if (missionType === MISSION_TYPES.DIPLOMATIC) {
          stageType = STAGE_TYPES.DIALOGUE;
        } else if (missionType === MISSION_TYPES.STEALTH) {
          stageType = STAGE_TYPES.STEALTH;
        } else {
          stageType = STAGE_TYPES.SKILL_CHECK;
        }
      } 
      // Middle stages are varied
      else {
        const stageOptions = [];
        
        // Always possible stage types
        stageOptions.push(STAGE_TYPES.TEXT, STAGE_TYPES.SKILL_CHECK, STAGE_TYPES.CHOICE);
        
        // Add mission-specific stage types
        if (missionType === MISSION_TYPES.COMBAT) {
          stageOptions.push(STAGE_TYPES.COMBAT);
        } 
        if (missionType === MISSION_TYPES.STEALTH) {
          stageOptions.push(STAGE_TYPES.STEALTH);
        }
        if (missionType === MISSION_TYPES.ESCORT) {
          stageOptions.push(STAGE_TYPES.ESCORT);
        }
        if (missionType === MISSION_TYPES.DIPLOMATIC) {
          stageOptions.push(STAGE_TYPES.DIALOGUE, STAGE_TYPES.DIPLOMATIC);
        }
        
        // Pick a random stage type from options
        stageType = stageOptions[Math.floor(Math.random() * stageOptions.length)];
      }
      
      // Generate the stage based on type
      let stage;
      switch (stageType) {
        case STAGE_TYPES.COMBAT:
          stage = _generateCombatStage(missionType, difficulty, playerLevel, environment);
          break;
        case STAGE_TYPES.CHOICE:
          stage = _generateChoiceStage(missionType, difficulty, playerLevel, environment);
          break;
        case STAGE_TYPES.SKILL_CHECK:
          stage = _generateSkillCheckStage(missionType, difficulty, playerLevel);
          break;
        case STAGE_TYPES.STEALTH:
          stage = _generateStealthStage(missionType, difficulty, playerLevel);
          break;
        case STAGE_TYPES.ESCORT:
          stage = _generateEscortStage(missionType, difficulty, playerLevel);
          break;
        case STAGE_TYPES.DIALOGUE:
          stage = _generateDialogueStage(missionType, difficulty, playerLevel);
          break;
        case STAGE_TYPES.DIPLOMATIC:
          stage = _generateDiplomaticStage(missionType, difficulty, playerLevel);
          break;
        default:
          stage = _generateTextStage(missionType, difficulty, environment);
      }
      
      stages.push(stage);
    }
    
    // Add a conclusion stage
    stages.push({
      type: STAGE_TYPES.TEXT,
      text: _generateConclusionText(missionType, difficulty)
    });
    
    return stages;
  }
  
  // Generate intro text for mission
  function _generateIntroText(missionType, difficulty, environment) {
    const difficultyDescriptions = [
      "a routine",
      "a straightforward",
      "a challenging",
      "a dangerous",
      "an extremely perilous"
    ];
    
    const missionDescriptions = {
      [MISSION_TYPES.COMBAT]: "combat operation",
      [MISSION_TYPES.STEALTH]: "stealth infiltration",
      [MISSION_TYPES.RECON]: "reconnaissance mission",
      [MISSION_TYPES.DIPLOMATIC]: "diplomatic negotiation",
      [MISSION_TYPES.ESCORT]: "escort assignment",
      [MISSION_TYPES.SUPPLY]: "supply procurement",
      [MISSION_TYPES.RESCUE]: "rescue operation",
      [MISSION_TYPES.SABOTAGE]: "sabotage mission"
    };
    
    const terrainDescriptions = {
      "dense": "a dense, shadowy forest where visibility is limited to a few paces",
      "light": "a light forest with scattered trees offering minimal cover",
      "old-growth": "an ancient forest with massive trees towering overhead",
      "swampy": "a swampy forest with treacherous footing and murky water",
      "rocky": "a rocky mountainous area with unstable footing and narrow paths",
      "steep": "steep mountain terrain that requires careful climbing",
      "narrow": "narrow mountain passes vulnerable to ambush",
      "craggy": "craggy peaks with limited paths and dangerous falls",
      "open": "open plains that offer little cover but good visibility",
      "grassy": "grassy plains with occasional rolling hills",
      "hilly": "hilly plains with good vantage points",
      "barren": "barren plains with little vegetation and harsh conditions",
      "streets": "urban streets with multiple routes and hiding spots",
      "alleys": "narrow urban alleys perfect for ambushes",
      "ruins": "crumbling urban ruins with unstable structures",
      "buildings": "occupied buildings requiring careful navigation",
      "dunes": "shifting sand dunes that complicate movement",
      "canyon": "deep canyons with echoing sounds and limited escape routes"
    };
    
    const weatherEffects = {
      "clear": "Clear weather provides good visibility.",
      "foggy": "A thick fog limits visibility significantly.",
      "rainy": "Steady rain makes the ground slippery and reduces visibility.",
      "windy": "Strong winds carry sounds in unpredictable ways.",
      "stormy": "A violent storm makes communication difficult.",
      "snowy": "Snow covers the ground, making tracking easier but movement harder.",
      "hot": "Oppressive heat will test your endurance.",
      "night": "The cover of darkness provides advantages for stealth.",
      "sandstorm": "A sandstorm reduces visibility and makes breathing difficult."
    };
    
    // Get descriptions
    const diffText = difficultyDescriptions[difficulty - 1] || "a";
    const missionText = missionDescriptions[missionType] || "mission";
    const terrainText = terrainDescriptions[environment.terrain] || "the area";
    const weatherText = weatherEffects[environment.weather] || "";
    
    // Construct the intro text
    return `You've been assigned ${diffText} ${missionText} in ${terrainText}. ${weatherText}
    
Your orders are clear and the stakes are high. Success will strengthen the Paanic position in the region, while failure could have serious consequences for the campaign.`;
  }
  
  // Generate conclusion text
  function _generateConclusionText(missionType, difficulty) {
    const conclusions = [
      "With your mission complete, you return to camp to report your success. Your actions have strengthened the Paanic position in the region.",
      "Mission accomplished. You make your way back to camp, knowing your efforts have made a difference in the ongoing campaign.",
      "As you return to base, you reflect on the challenges you overcame. Your success will be noted by the command.",
      "The mission is complete. Your efforts will help turn the tide in the larger conflict against the Arrasi forces.",
      "With your objectives achieved, you make the journey back to camp, ready for your next assignment."
    ];
    
    return conclusions[Math.floor(Math.random() * conclusions.length)];
  }
  
  // Generate a combat stage
  function _generateCombatStage(missionType, difficulty, playerLevel, environment) {
    const enemy = _generateEnemy(difficulty, missionType, playerLevel);
    
    // Generate different combat scenarios based on mission type
    let encounterText = "";
    
    if (missionType === MISSION_TYPES.COMBAT) {
      encounterText = "You encounter enemy forces blocking your path. There's no way to proceed without engaging them.";
    } else if (missionType === MISSION_TYPES.STEALTH) {
      encounterText = "Despite your best efforts to remain undetected, an enemy patrol has spotted you. You'll need to eliminate them before they can raise the alarm.";
    } else if (missionType === MISSION_TYPES.RECON) {
      encounterText = "Your reconnaissance has been compromised. An enemy scout has spotted you and is moving to engage.";
    } else if (missionType === MISSION_TYPES.ESCORT) {
      encounterText = "Attackers have ambushed your escort route. You'll need to fend them off to protect your charge.";
    } else {
      encounterText = "An enemy force blocks your path. Combat is unavoidable if you wish to proceed.";
    }
    
    const successText = "With the enemy defeated, you can continue your mission.";
    const failureText = "You're forced to retreat after being overwhelmed by the enemy. The mission is in jeopardy.";
    
    return {
      type: STAGE_TYPES.COMBAT,
      text: encounterText,
      enemy: enemy,
      environment: environment,
      success: successText,
      failure: failureText
    };
  }
  
  // Generate a text stage
  function _generateTextStage(missionType, difficulty, environment) {
    const textOptions = [
      `As you move through the ${environment.terrain} terrain, you notice signs of recent activity. Footprints and disturbed vegetation suggest someone passed through here recently.`,
      `The ${environment.weather} conditions make your progress ${environment.weather === 'clear' ? 'easier' : 'more difficult'}, but you press on, aware of the mission's importance.`,
      `You come across signs of a recent skirmish. There are no bodies, but the evidence suggests the Arrasi were involved.`,
      `Taking a moment to assess your surroundings, you spot a potential route that might provide an advantage.`,
      `You find a discarded communication from Arrasi forces, providing some insight into their movements in the area.`
    ];
    
    return {
      type: STAGE_TYPES.TEXT,
      text: textOptions[Math.floor(Math.random() * textOptions.length)]
    };
  }
  
  // Generate a choice stage
  function _generateChoiceStage(missionType, difficulty, playerLevel, environment) {
    let text = "";
    let choices = [];
    
    // Generate different choice scenarios based on mission type
    if (missionType === MISSION_TYPES.COMBAT || missionType === MISSION_TYPES.RECON) {
      text = `You spot an Arrasi patrol in the distance. They haven't noticed you yet. How do you proceed?`;
      
      choices = [
        {
          text: "Prepare an ambush",
          requires: { "skills.tactics": Math.max(1, Math.floor(difficulty / 2)) },
          outcome: {
            text: "You set up a perfect ambush position and catch the patrol by surprise, giving you a significant advantage.",
            rewards: { experience: 10 * difficulty }
          }
        },
        {
          text: "Observe their patrol route",
          requires: { "skills.survival": Math.max(1, Math.floor(difficulty / 2)) },
          outcome: {
            text: "You patiently observe the patrol and note their patterns. This intelligence will be valuable for your mission.",
            rewards: { experience: 10 * difficulty }
          }
        },
        {
          text: "Avoid them completely",
          outcome: {
            text: "You carefully navigate around the patrol, avoiding detection but taking more time.",
            damage: difficulty // Slight stamina cost for the detour
          }
        }
      ];
    } 
    else if (missionType === MISSION_TYPES.STEALTH) {
      text = `You've reached a guarded checkpoint. How will you get past?`;
      
      choices = [
        {
          text: "Find an alternative route",
          requires: { "skills.survival": Math.max(1, Math.floor(difficulty / 2)) },
          outcome: {
            text: "You discover a little-used path that bypasses the checkpoint entirely.",
            rewards: { experience: 10 * difficulty }
          }
        },
        {
          text: "Create a distraction",
          requires: { "skills.tactics": Math.max(1, Math.floor(difficulty / 2)) },
          outcome: {
            text: "You create a diversion that draws the guards away from their posts, allowing you to slip past.",
            rewards: { experience: 10 * difficulty }
          }
        },
        {
          text: "Wait for a shift change",
          outcome: {
            text: "You patiently wait for the guards to rotate, taking advantage of the momentary confusion to proceed.",
            damage: difficulty // Slight time penalty
          }
        }
      ];
    }
    else if (missionType === MISSION_TYPES.DIPLOMATIC) {
      text = `During your diplomatic meeting, the other party makes an unexpected demand. How do you respond?`;
      
      choices = [
        {
          text: "Appeal to their self-interest",
          requires: { "skills.command": Math.max(1, Math.floor(difficulty / 2)) },
          outcome: {
            text: "You eloquently explain how cooperation benefits them, swaying their position in your favor.",
            rewards: { experience: 15 * difficulty }
          }
        },
        {
          text: "Offer a compromise",
          outcome: {
            text: "You offer a reasonable compromise that addresses their concerns while protecting your interests.",
            rewards: { experience: 10 * difficulty }
          }
        },
        {
          text: "Stand firm on your position",
          requires: { "phy": Math.max(2, Math.floor(difficulty / 2)) },
          outcome: {
            text: "Your commanding presence makes it clear you won't be intimidated. They reluctantly withdraw their demand.",
            rewards: { experience: 10 * difficulty }
          }
        }
      ];
    }
    else {
      // Default choices for any mission type
      text = `You come to a fork in your path. One route seems faster but more exposed, while the other is longer but offers better cover.`;
      
      choices = [
        {
          text: "Take the faster route",
          outcome: {
            text: "You make good time on the direct path, though you remain vigilant for potential danger.",
            damage: difficulty * 2 // More risky
          }
        },
        {
          text: "Take the safer route",
          outcome: {
            text: "You proceed cautiously along the covered path, sacrificing speed for safety.",
            rewards: { experience: 5 * difficulty }
          }
        },
        {
          text: "Scout ahead before deciding",
          requires: { "skills.survival": Math.max(1, Math.floor(difficulty / 2)) },
          outcome: {
            text: "Your careful scouting reveals a third path that offers both speed and safety.",
            rewards: { experience: 10 * difficulty }
          }
        }
      ];
    }
    
    return {
      type: STAGE_TYPES.CHOICE,
      text: text,
      choices: choices
    };
  }
  
  // Generate a skill check stage
  function _generateSkillCheckStage(missionType, difficulty, playerLevel) {
    // Define possible skill checks based on mission type
    const skillChecks = {
      [MISSION_TYPES.COMBAT]: [
        {
          skill: "melee",
          text: "You need to quickly assess the enemy force's formation and weak points.",
          success: "Your combat experience allows you to identify vulnerabilities in their positioning.",
          failure: "You struggle to identify any clear weaknesses in the enemy formation."
        },
        {
          skill: "tactics",
          text: "The terrain offers potential tactical advantages if used correctly.",
          success: "You identify the perfect positions to gain combat advantage.",
          failure: "You fail to fully utilize the terrain to your advantage."
        }
      ],
      [MISSION_TYPES.STEALTH]: [
        {
          skill: "survival",
          text: "You need to move silently past a group of guards.",
          success: "Using your survival skills, you navigate silently through the area without alerting anyone.",
          failure: "You make a small noise, causing the guards to become more alert."
        },
        {
          skill: "marksmanship",
          text: "You need to take out a distant sentry without alerting others.",
          success: "Your precise shot neutralizes the sentry quietly and efficiently.",
          failure: "Your shot misses the vital spot, causing the sentry to make noise before falling."
        }
      ],
      [MISSION_TYPES.RECON]: [
        {
          skill: "survival",
          text: "You need to follow tracks to locate the enemy camp.",
          success: "Your tracking skills lead you directly to the hidden camp.",
          failure: "The trail goes cold, and you waste time searching for the right path."
        },
        {
          skill: "marksmanship",
          text: "You need to use your spyglass to count enemy forces at a distance.",
          success: "Your trained eye allows you to accurately assess their numbers and equipment.",
          failure: "You can only make a rough estimate of their forces."
        }
      ],
      [MISSION_TYPES.DIPLOMATIC]: [
        {
          skill: "command",
          text: "You need to convince the local leader of your peaceful intentions.",
          success: "Your authoritative yet respectful manner wins their trust.",
          failure: "The leader remains suspicious of your motives."
        },
        {
          skill: "tactics",
          text: "You need to analyze the political situation to identify potential allies.",
          success: "Your analysis reveals several factions that might support your cause.",
          failure: "The complex political landscape remains confusing to you."
        }
      ]
    };
    
    // Default to combat checks if mission type not found
    const availableChecks = skillChecks[missionType] || skillChecks[MISSION_TYPES.COMBAT];
    
    // Select a random skill check
    const check = availableChecks[Math.floor(Math.random() * availableChecks.length)];
    
    // Scale difficulty based on mission difficulty
    let checkDifficulty = difficulty + 2;
    
    // Small chance of minor reward on success
    const randomReward = Math.random() < 0.3 ? {
      experience: 5 * difficulty,
      taelors: Math.floor(5 * difficulty * Math.random())
    } : null;
    
    return {
      type: STAGE_TYPES.SKILL_CHECK,
      text: check.text,
      skill: check.skill,
      difficulty: checkDifficulty,
      success: check.success,
      failure: check.failure,
      failureOutcome: "continue", // Generally continue mission even on failure
      rewards: randomReward
    };
  }
  
  // Generate a stealth stage (new stage type)
  function _generateStealthStage(missionType, difficulty, playerLevel) {
    const stealthScenarios = [
      {
        text: "You need to infiltrate a guarded perimeter without being detected. Guards patrol in regular intervals, and you must time your movements carefully.",
        success: "You slip through the defenses like a shadow, undetected by the patrol.",
        failure: "A guard spots your movement and raises the alarm!"
      },
      {
        text: "A section of the compound is protected by detection wards. You'll need to move with extraordinary care to avoid triggering them.",
        success: "You navigate the trapped area with precision, avoiding all the detection wards.",
        failure: "One of the wards activates, sending a silent alert to nearby guards."
      },
      {
        text: "You need to retrieve an item from a guarded room. The guards seem alert and well-trained.",
        success: "You time your movements perfectly, retrieving the item without alerting the guards.",
        failure: "As you grab the item, you accidentally knock something over, alerting the guards to your presence."
      }
    ];
    
    // Pick a random scenario
    const scenario = stealthScenarios[Math.floor(Math.random() * stealthScenarios.length)];
    
    return {
      type: STAGE_TYPES.STEALTH,
      text: scenario.text,
      skill: "survival", // Primary skill for stealth
      difficulty: difficulty + 2, // Stealth is challenging
      success: scenario.success,
      failure: scenario.failure,
      // If stealth fails, usually leads to combat
      failureOutcome: "combat",
      failureCombatEnemy: _generateEnemy(difficulty, missionType, playerLevel),
      rewards: {
        experience: 15 * difficulty // Good XP for successful stealth
      }
    };
  }
  
  // Generate an escort stage (new stage type)
  function _generateEscortStage(missionType, difficulty, playerLevel) {
    const escortScenarios = [
      {
        text: "You must escort a VIP through hostile territory. They're not trained for combat and will require your protection.",
        success: "You successfully guide the VIP through danger, keeping them safe from harm.",
        failure: "The VIP is injured during your escort, complicating the mission."
      },
      {
        text: "A supply caravan needs military escort through a narrow pass known for ambushes.",
        success: "The caravan reaches its destination safely thanks to your vigilance.",
        failure: "The caravan comes under attack, and some supplies are lost in the chaos."
      },
      {
        text: "An injured soldier needs evacuation from the field. You must ensure their safe passage while they're unable to defend themselves.",
        success: "You bring the injured soldier to safety, protecting them from further harm.",
        failure: "The wounded soldier's condition worsens during the journey, requiring emergency treatment."
      }
    ];
    
    // Pick a random scenario
    const scenario = escortScenarios[Math.floor(Math.random() * escortScenarios.length)];
    
    return {
      type: STAGE_TYPES.ESCORT,
      text: scenario.text,
      // Escort requires multiple skill checks
      primarySkill: "tactics", 
      secondarySkill: "survival",
      difficulty: difficulty + 1,
      success: scenario.success,
      failure: scenario.failure,
      failureOutcome: "continue", // Mission continues even if escort has issues
      vipHealth: 100, // Track VIP health during escort
      rewards: {
        experience: 20 * difficulty,
        relationships: { commander: 2 } // Good reputation for successful escorts
      }
    };
  }
  
  // Generate a dialogue stage
  function _generateDialogueStage(missionType, difficulty, playerLevel) {
    // Define potential NPCs for dialogue
    const npcs = [
      { name: "Village Elder", attitude: "cautious" },
      { name: "Arrasi Defector", attitude: "nervous" },
      { name: "Merchant Caravan Leader", attitude: "shrewd" },
      { name: "Local Scout", attitude: "friendly" },
      { name: "Suspicious Traveler", attitude: "hostile" }
    ];
    
    // Select a random NPC
    const npc = npcs[Math.floor(Math.random() * npcs.length)];
    
    // Generate dialogue based on NPC attitude
    const dialogue = [];
    
    // Initial greeting
    dialogue.push({
      speaker: npc.name,
      text: _generateNpcGreeting(npc.attitude)
    });
    
    // Player response
    dialogue.push({
      speaker: "You",
      text: "I'm on a mission for the Paanic forces. I need information about this area."
    });
    
    // NPC response
    dialogue.push({
      speaker: npc.name,
      text: _generateNpcResponse(npc.attitude, missionType)
    });
    
    // Player follow-up
    dialogue.push({
      speaker: "You",
      text: _generatePlayerFollowUp(missionType)
    });
    
    // NPC information
    dialogue.push({
      speaker: npc.name,
      text: _generateNpcInformation(npc.attitude, missionType)
    });
    
    return {
      type: STAGE_TYPES.DIALOGUE,
      dialogue: dialogue
    };
  }
  
  // Generate NPC greeting based on attitude
  function _generateNpcGreeting(attitude) {
    switch (attitude) {
      case "friendly":
        return "Ah, a Paanic soldier! It's good to see a friendly face in these troubled times.";
      case "cautious":
        return "Halt there. What business do you have in these parts?";
      case "nervous":
        return "Please... I've done nothing wrong. I'm just trying to survive.";
      case "shrewd":
        return "Well now, what have we here? Another soldier looking for something, I presume?";
      case "hostile":
        return "You're a long way from your camp, soldier. Not everyone welcomes the Empire's presence here.";
      default:
        return "Hello there. What brings you to these parts?";
    }
  }
  
  // Generate NPC response based on attitude and mission type
  function _generateNpcResponse(attitude, missionType) {
    if (attitude === "friendly") {
      return "Of course, I'm happy to help the Paanic Empire. What do you need to know?";
    } else if (attitude === "cautious") {
      return "Information has value, soldier. What's in it for me if I help you?";
    } else if (attitude === "nervous") {
      return "I... I don't know much. The Arrasi punish anyone who speaks to Paanic Soldiers...";
    } else if (attitude === "shrewd") {
      return "Information and supplies are my trade. Perhaps we can come to an arrangement?";
    } else if (attitude === "hostile") {
      return "Why should I help you? The Arrasi were here first, then you Paan arrived with your war.";
    } else {
      return "I might know something, depending on what you're looking for.";
    }
  }
  
  // Generate player follow-up based on mission type
  function _generatePlayerFollowUp(missionType) {
    switch (missionType) {
      case MISSION_TYPES.COMBAT:
        return "I need to know about enemy troop movements in the area. Have you seen any Arrasi patrols recently?";
      case MISSION_TYPES.STEALTH:
        return "I'm looking for unguarded approaches to the Arrasi position nearby. Any suggestions?";
      case MISSION_TYPES.RECON:
        return "I'm gathering intelligence on Arrasi strength in this region. What can you tell me about their numbers?";
      case MISSION_TYPES.DIPLOMATIC:
        return "I'm trying to establish better relations between the local settlements and Paanic forces. Who should I speak with?";
      case MISSION_TYPES.ESCORT:
        return "I need to find the safest route through this area for an important convoy. What path would you recommend?";
      default:
        return "Any information about the surrounding area would be helpful. What can you tell me?";
    }
  }
  
  // Generate NPC information based on attitude and mission type
  function _generateNpcInformation(attitude, missionType) {
    // Base information relevant to mission type
    let baseInfo = "";
    
    switch (missionType) {
      case MISSION_TYPES.COMBAT:
        baseInfo = "The Arrasi have been moving troops through the eastern valley. They seem to be establishing a forward camp near the old bridge.";
        break;
      case MISSION_TYPES.STEALTH:
        baseInfo = "The western approach to their camp has fewer guards. There's an old tunnel that runs under the ridge that they might not know about.";
        break;
      case MISSION_TYPES.RECON:
        baseInfo = "From what I've seen, they have perhaps thirty soldiers, mostly infantry with a few archers. Their commander is a brutal woman named Varessa.";
        break;
      case MISSION_TYPES.DIPLOMATIC:
        baseInfo = "Elder Tharion is the one who holds sway in these parts. His farm is north of the village. He doesn't trust soldiers, but he's fair-minded.";
        break;
      case MISSION_TYPES.ESCORT:
        baseInfo = "The main road is watched by Arrasi scouts. Take the river path instead - it's longer but safer, and the water will hide your tracks.";
        break;
      default:
        baseInfo = "This area has seen fighting between the Paanic Empire and Arrasi for months now. Most locals try to stay out of it, just trying to survive.";
    }
    
    // Modify information based on NPC attitude
    if (attitude === "friendly") {
      return baseInfo + " I hope that helps. The sooner this conflict ends, the better for all of us.";
    } else if (attitude === "cautious") {
      return "Well... " + baseInfo + " That's all I know. Now I should go before someone sees us talking.";
    } else if (attitude === "nervous") {
      return "I shouldn't be telling you this, but... " + baseInfo + " Please don't tell anyone I spoke to you.";
    } else if (attitude === "shrewd") {
      return baseInfo + " That information is worth something, remember that next time we meet.";
    } else if (attitude === "hostile") {
      return "Fine. " + baseInfo + " Now leave me be. I've helped enough.";
    } else {
      return baseInfo;
    }
  }
  
  // Generate a diplomatic stage (new stage type)
  function _generateDiplomaticStage(missionType, difficulty, playerLevel) {
    const diplomaticScenarios = [
      {
        text: "You're negotiating with a local leader who's hesitant to ally with Paanic forces. You'll need to convince them of the benefits of cooperation.",
        positions: ["security", "trade", "autonomy"],
        success: "The leader sees the wisdom in your proposal and agrees to a mutually beneficial arrangement.",
        failure: "The negotiations break down, and the leader remains unconvinced of Paanic intentions."
      },
      {
        text: "Two rival factions are in conflict, and you've been tasked with mediating a resolution that will benefit the Paanic position.",
        positions: ["resources", "territory", "recognition"],
        success: "You successfully broker a compromise that satisfies both parties while advancing Paanic interests.",
        failure: "The factions refuse to compromise, and tensions remain high."
      },
      {
        text: "An Arrasi diplomat has requested a meeting under a flag of truce. Command suspects it may be a ploy, but has authorized you to hear them out.",
        positions: ["prisoner exchange", "territorial concessions", "ceasefire terms"],
        success: "You navigate the diplomatic minefield carefully, extracting valuable concessions without giving away too much.",
        failure: "The Arrasi diplomat outmaneuvers you, gaining information while offering little in return."
      }
    ];
    
    // Pick a random scenario
    const scenario = diplomaticScenarios[Math.floor(Math.random() * diplomaticScenarios.length)];
    
    return {
      type: STAGE_TYPES.DIPLOMATIC,
      text: scenario.text,
      skill: "command",
      positions: scenario.positions,
      difficulty: difficulty + 2, // Diplomacy is challenging
      success: scenario.success,
      failure: scenario.failure,
      failureOutcome: "continue", // Diplomacy failures rarely end the mission
      rewards: {
        experience: 25 * difficulty,
        relationships: { commander: 3 } // Good reputation boost for successful diplomacy
      }
    };
  }
  
  // Function to generate a procedural mission
  function _generateMission(params = {}) {
    // Set default parameters if not provided
    const missionType = params.type || MISSION_TYPES.COMBAT;
    const difficulty = params.difficulty || Math.min(5, Math.max(1, _getPlayerLevel()));
    const playerLevel = _getPlayerLevel();
    const locationName = params.location || 'forest';
    
    // Generate environment based on location
    const environment = _generateEnvironment(locationName);
    
    // Generate a basic title
    let title = "";
    switch (missionType) {
      case MISSION_TYPES.COMBAT:
        title = "Combat Operation";
        break;
      case MISSION_TYPES.STEALTH:
        title = "Stealth Infiltration";
        break;
      case MISSION_TYPES.RECON:
        title = "Reconnaissance Mission";
        break;
      case MISSION_TYPES.DIPLOMATIC:
        title = "Diplomatic Negotiation";
        break;
      case MISSION_TYPES.ESCORT:
        title = "Escort Assignment";
        break;
      case MISSION_TYPES.SUPPLY:
        title = "Supply Procurement";
        break;
      case MISSION_TYPES.RESCUE:
        title = "Rescue Operation";
        break;
      case MISSION_TYPES.SABOTAGE:
        title = "Sabotage Mission";
        break;
      default:
        title = "Field Operation";
    }
    
    // Add adjectives based on difficulty
    const difficultyAdjectives = ["Routine", "Standard", "Priority", "High-Risk", "Critical"];
    title = `${difficultyAdjectives[difficulty-1]} ${title}`;
    
    // Generate description
    let description = "";
    switch (missionType) {
      case MISSION_TYPES.COMBAT:
        description = "Engage and eliminate Arrasi forces in the area to secure our position.";
        break;
      case MISSION_TYPES.STEALTH:
        description = "Infiltrate enemy territory without detection to acquire intelligence or assets.";
        break;
      case MISSION_TYPES.RECON:
        description = "Gather critical intelligence on enemy positions and strength.";
        break;
      case MISSION_TYPES.DIPLOMATIC:
        description = "Negotiate with local leaders to secure support for Paanic operations.";
        break;
      case MISSION_TYPES.ESCORT:
        description = "Ensure the safe passage of an important individual or convoy.";
        break;
      case MISSION_TYPES.SUPPLY:
        description = "Secure essential supplies needed for camp operations.";
        break;
      case MISSION_TYPES.RESCUE:
        description = "Locate and extract captured personnel from enemy territory.";
        break;
      case MISSION_TYPES.SABOTAGE:
        description = "Disable or destroy enemy resources to weaken their position.";
        break;
      default:
        description = "Complete objectives to advance Paanic strategic interests.";
    }
    
    // Generate mission stages
    const stages = _generateMissionStages(missionType, difficulty, playerLevel, environment);
    
    // Generate rewards
    const rewards = _generateRewards(difficulty, missionType);
    
    // Create the mission object
    const mission = {
      id: _generateId(),
      type: missionType,
      title: title,
      description: description,
      difficulty: difficulty,
      location: locationName,
      environment: environment,
      stages: stages,
      rewards: rewards,
      cooldown: Math.floor(difficulty * 1.5), // Cooldown days based on difficulty
      giver: _getMissionGiver(missionType) // Determine appropriate NPC giver
    };
    
    return mission;
  }
  
  // Determine appropriate mission giver based on mission type
  function _getMissionGiver(missionType) {
    switch (missionType) {
      case MISSION_TYPES.COMBAT:
      case MISSION_TYPES.RECON:
      case MISSION_TYPES.SABOTAGE:
        return "commander";
      case MISSION_TYPES.STEALTH:
      case MISSION_TYPES.ESCORT:
      case MISSION_TYPES.RESCUE:
        return "sergeant";
      case MISSION_TYPES.SUPPLY:
      case MISSION_TYPES.DIPLOMATIC:
        return "quartermaster";
      default:
        // Randomize if unknown type
        const givers = ["commander", "sergeant", "quartermaster"];
        return givers[Math.floor(Math.random() * givers.length)];
    }
  }
  
  // Generate a mission chain (series of connected missions)
  function _generateMissionChain(params = {}) {
    const chainId = _generateId();
    const chainLength = params.length || 3; // Default to 3 missions in a chain
    const chainType = params.type || MISSION_TYPES.COMBAT;
    const baseTitle = params.title || "Operation: Eye of the Storm";
    const baseDifficulty = params.difficulty || Math.min(4, Math.max(1, _getPlayerLevel()));
    
    const missions = [];
    
    // Generate a storyline for the chain
    const chainStoryline = _generateChainStoryline(chainType, chainLength);
    
    // Generate each mission in the chain
    for (let i = 0; i < chainLength; i++) {
      // Increase difficulty slightly as chain progresses
      const missionDifficulty = Math.min(5, baseDifficulty + Math.floor(i / 2));
      
      // Determine mission type - main type for first and last, may vary in between
      let missionType = chainType;
      if (i > 0 && i < chainLength - 1) {
        // Middle missions have chance to be different types
        if (Math.random() < 0.4) {
          const supportTypes = _getSupportingMissionTypes(chainType);
          missionType = supportTypes[Math.floor(Math.random() * supportTypes.length)];
        }
      }
      
      // Create mission parameters
      const missionParams = {
        type: missionType,
        difficulty: missionDifficulty,
        location: chainStoryline.locations[i] || 'forest',
        chainPosition: i + 1,
        chainLength: chainLength
      };
      
      // Generate the mission
      const mission = _generateMission(missionParams);
      
      // Customize for chain
      mission.chainId = chainId;
      mission.chainPosition = i + 1;
      mission.title = `${baseTitle} (${i+1}/${chainLength}): ${mission.title}`;
      
      // Add chain-specific content to description
      mission.description = `${chainStoryline.descriptions[i] || mission.description} ${i+1}/${chainLength} in Operation: ${baseTitle}.`;
      
      // Special rewards for final mission in chain
      if (i === chainLength - 1) {
        mission.rewards.experience += 50;
        mission.rewards.taelors += 30;
        
        // Add special item reward for completing the chain
        mission.rewards.items.push({
          name: chainStoryline.finalReward.name,
          effect: chainStoryline.finalReward.effect,
          value: 100 + (50 * missionDifficulty),
          chance: 1.0 // Guaranteed
        });
      }
      
      missions.push(mission);
    }
    
    // Create the chain object
    const chain = {
      id: chainId,
      title: baseTitle,
      type: chainType,
      description: chainStoryline.chainDescription,
      missions: missions,
      currentPosition: 0, // Start at beginning
      completed: false,
      difficultyLevel: baseDifficulty,
      rewards: {
        experience: 100 + (baseDifficulty * 50),
        taelors: 50 + (baseDifficulty * 25),
        items: [chainStoryline.finalReward]
      }
    };
    
    return chain;
  }
  
  // Get supporting mission types for a main mission type
  function _getSupportingMissionTypes(mainType) {
    switch (mainType) {
      case MISSION_TYPES.COMBAT:
        return [MISSION_TYPES.RECON, MISSION_TYPES.SABOTAGE, MISSION_TYPES.STEALTH];
      case MISSION_TYPES.STEALTH:
        return [MISSION_TYPES.RECON, MISSION_TYPES.SABOTAGE, MISSION_TYPES.RESCUE];
      case MISSION_TYPES.DIPLOMATIC:
        return [MISSION_TYPES.ESCORT, MISSION_TYPES.SUPPLY, MISSION_TYPES.RECON];
      case MISSION_TYPES.ESCORT:
        return [MISSION_TYPES.COMBAT, MISSION_TYPES.RECON, MISSION_TYPES.STEALTH];
      case MISSION_TYPES.RESCUE:
        return [MISSION_TYPES.STEALTH, MISSION_TYPES.COMBAT, MISSION_TYPES.RECON];
      default:
        return [MISSION_TYPES.COMBAT, MISSION_TYPES.STEALTH, MISSION_TYPES.RECON];
    }
  }
  
  // Generate a storyline for a mission chain
  function _generateChainStoryline(chainType, chainLength) {
    // Define potential chain storylines
    const storylines = [
      {
        title: "Breaking the Line",
        chainDescription: "A coordinated operation to break through Arrasi defensive positions and establish a Paanic foothold in contested territory.",
        descriptions: [
          "Scout enemy positions to identify weaknesses in their defensive line.",
          "Sabotage enemy supply lines to weaken their defensive capabilities.",
          "Launch a direct assault on the weakened position to break through their lines.",
          "Secure and fortify the captured position against counter-attack.",
          "Repel the Arrasi counter-attack and solidify Paanic control of the region."
        ],
        locations: ['forest', 'mountain', 'plains', 'urban', 'mountain'],
        finalReward: {
          name: "Commander's Commendation",
          effect: "A formal recognition of your tactical prowess, increasing respect among the troops.",
          value: 200
        }
      },
      {
        title: "Shadow Protocol",
        chainDescription: "A covert operation to infiltrate Arrasi territory and extract critical intelligence without being detected.",
        descriptions: [
          "Establish a hidden forward base in neutral territory near the Arrasi border.",
          "Infiltrate the outer perimeter of Arrasi defenses without raising alarms.",
          "Locate and access the secured intelligence within the Arrasi compound.",
          "Extract safely with the acquired intelligence, leaving no trace of your presence.",
          "Deliver the intelligence to Paanic command and debrief on your findings."
        ],
        locations: ['forest', 'plains', 'urban', 'mountain', 'forest'],
        finalReward: {
          name: "Phantom Cloak",
          effect: "A specialized cloak that enhances stealth capabilities in low light conditions.",
          value: 250
        }
      },
      {
        title: "Diplomatic Overture",
        chainDescription: "A sensitive diplomatic mission to forge alliances with local powers against the Arrasi influence.",
        descriptions: [
          "Make initial contact with neutral local leaders to gauge their receptiveness.",
          "Secure safe passage for a Paanic diplomatic envoy through contested territory.",
          "Negotiate preliminary terms of alliance with the local council.",
          "Defend the diplomatic party from Arrasi assassins seeking to disrupt negotiations.",
          "Finalize the alliance and establish formal relations between the Paan and the locals."
        ],
        locations: ['urban', 'plains', 'urban', 'forest', 'urban'],
        finalReward: {
          name: "Diplomatic Seal of Alliance",
          effect: "A formal symbol of the new alliance, granting you improved standing with local merchants.",
          value: 175
        }
      }
    ];
    
    // Select a storyline based on chain type
    let selectedStoryline;
    if (chainType === MISSION_TYPES.COMBAT) {
      selectedStoryline = storylines[0];
    } else if (chainType === MISSION_TYPES.STEALTH) {
      selectedStoryline = storylines[1];
    } else if (chainType === MISSION_TYPES.DIPLOMATIC) {
      selectedStoryline = storylines[2];
    } else {
      // Random selection for other types
      selectedStoryline = storylines[Math.floor(Math.random() * storylines.length)];
    }
    
    // Ensure we have enough descriptions for the chain length
    while (selectedStoryline.descriptions.length < chainLength) {
      selectedStoryline.descriptions.push("Continue the operation according to evolving mission parameters.");
    }
    
    // Ensure we have enough locations for the chain length
    const defaultLocations = ['forest', 'mountain', 'plains', 'urban', 'desert'];
    while (selectedStoryline.locations.length < chainLength) {
      selectedStoryline.locations.push(defaultLocations[Math.floor(Math.random() * defaultLocations.length)]);
    }
    
    return selectedStoryline;
  }
  
  // Public API
  return {
    // Constants
    DIFFICULTY: DIFFICULTY,
    MISSION_TYPES: MISSION_TYPES,
    STAGE_TYPES: STAGE_TYPES,
    
    // Initialize the mission generator
    init: function() {
      _log("Initializing mission generator");
      
      // Register with mission system if available
      if (window.MissionSystem) {
        _log("Registering with mission system");
        
        // Register event listeners
        if (typeof window.MissionSystem.on === 'function') {
          window.MissionSystem.on('missionStart', function(data) {
            _log("Mission started:", data.mission.title);
          });
          
          window.MissionSystem.on('missionComplete', function(data) {
            _log("Mission completed:", data.mission.title);
            
            // Check for active chain missions
            _activeMissionChains.forEach(function(chain) {
              if (!chain.completed && chain.missions[chain.currentPosition] && 
                  chain.missions[chain.currentPosition].id === data.mission.id) {
                // Advance in the chain
                chain.currentPosition++;
                
                // Check if chain is complete
                if (chain.currentPosition >= chain.missions.length) {
                  chain.completed = true;
                  
                  // Trigger event for chain completion
                  if (_eventListeners.chainComplete) {
                    _eventListeners.chainComplete.forEach(listener => {
                      try {
                        listener(chain);
                      } catch (error) {
                        console.error("Error in chain completion listener:", error);
                      }
                    });
                  }
                } else {
                  // Make next mission in chain available
                  // This depends on how your mission availability system works
                  _log("Next mission in chain available:", chain.missions[chain.currentPosition].title);
                }
              }
            });
          });
        }
      }
      
      // Load mission templates
      this.loadMissionTemplates();
      
      // Load location data
      this.loadLocationData();
      
      // Load enemy data
      this.loadEnemyData();
      
      _log("Mission generator initialized");
      return true;
    },
    
    // Load predefined location data
    loadLocationData: function() {
      _log("Loading location data");
      
      _locationData = {
        forest: {
          name: "Silvanian Forest",
          description: "A dense forest with ancient trees and numerous hidden paths.",
          terrain: ['dense', 'light', 'old-growth', 'swampy'],
          weather: ['clear', 'foggy', 'rainy', 'windy'],
          enemies: ['scout', 'ranger', 'beast'],
          difficulty: 2
        },
        mountain: {
          name: "Eastern Ridges",
          description: "Rocky mountain terrain with steep paths and limited cover.",
          terrain: ['rocky', 'steep', 'narrow', 'craggy'],
          weather: ['clear', 'windy', 'stormy', 'snowy'],
          enemies: ['scout', 'warrior', 'shaman'],
          difficulty: 3
        },
        plains: {
          name: "Paanic Plains",
          description: "Open grasslands with occasional hills and limited cover.",
          terrain: ['open', 'grassy', 'hilly', 'barren'],
          weather: ['clear', 'windy', 'rainy', 'hot'],
          enemies: ['warrior', 'mounted', 'archer'],
          difficulty: 2
        },
        urban: {
          name: "Arrasi Outpost",
          description: "Abandoned buildings and ruins of a former settlement.",
          terrain: ['streets', 'alleys', 'ruins', 'buildings'],
          weather: ['clear', 'foggy', 'rainy', 'night'],
          enemies: ['guard', 'elite', 'commander'],
          difficulty: 4
        },
        desert: {
          name: "Shimmering Sands",
          description: "Arid desert with shifting dunes and scarce resources.",
          terrain: ['dunes', 'rocky', 'flat', 'canyon'],
          weather: ['clear', 'sandstorm', 'hot', 'night'],
          enemies: ['scout', 'beast', 'nomad'],
          difficulty: 3
        }
      };
      
      return true;
    },
    
    // Load predefined enemy data
    loadEnemyData: function() {
      _log("Loading enemy data");
      
      _enemyData = {
        arrasi_scout: {
          name: "Arrasi Scout",
          description: "A lightly armored scout equipped for reconnaissance.",
          health: 50,
          damage: 6,
          threat: 1,
          skills: {
            melee: 2,
            marksmanship: 3,
            survival: 4
          },
          loot: [
            { name: "Scout Map", chance: 0.3, value: 15 },
            { name: "Light Rations", chance: 0.5, value: 5 }
          ]
        },
        arrasi_warrior: {
          name: "Arrasi Warrior",
          description: "A well-trained soldier with standard combat equipment.",
          health: 75,
          damage: 8,
          threat: 2,
          skills: {
            melee: 4,
            marksmanship: 2,
            survival: 2
          },
          loot: [
            { name: "Warrior Badge", chance: 0.2, value: 20 },
            { name: "Combat Rations", chance: 0.4, value: 8 }
          ]
        },
        arrasi_elite: {
          name: "Arrasi Elite Guard",
          description: "A highly trained elite soldier with superior equipment.",
          health: 100,
          damage: 12,
          threat: 3,
          skills: {
            melee: 5,
            marksmanship: 4,
            survival: 3,
            tactics: 3
          },
          loot: [
            { name: "Elite Insignia", chance: 0.15, value: 35 },
            { name: "Superior Rations", chance: 0.3, value: 12 }
          ]
        },
        arrasi_commander: {
          name: "Arrasi Commander",
          description: "A veteran battlefield commander with advanced training and equipment.",
          health: 125,
          damage: 15,
          threat: 4,
          skills: {
            melee: 5,
            marksmanship: 4,
            survival: 3,
            tactics: 5,
            command: 4
          },
          loot: [
            { name: "Commander's Seal", chance: 0.1, value: 50 },
            { name: "Tactical Map", chance: 0.25, value: 30 }
          ]
        },
        forest_beast: {
          name: "Forest Beast",
          description: "A large predatory animal that roams the forest.",
          health: 60,
          damage: 10,
          threat: 2,
          skills: {
            melee: 4,
            survival: 5
          },
          loot: [
            { name: "Beast Hide", chance: 0.6, value: 15 },
            { name: "Sharp Fang", chance: 0.4, value: 20 }
          ]
        }
      };
      
      return true;
    },
    
    // Load mission templates
    loadMissionTemplates: function() {
      _log("Loading mission templates");
      
      // Example template - these would normally be more extensive
      _missionTemplates = {
        combat_basic: {
          type: MISSION_TYPES.COMBAT,
          title: "Eliminate Enemy Patrol",
          description: "Eliminate an Arrasi patrol operating in our territory.",
          difficulty: DIFFICULTY.MEDIUM,
          minLevel: 1,
          giver: "commander"
        },
        stealth_basic: {
          type: MISSION_TYPES.STEALTH,
          title: "Covert Intelligence Gathering",
          description: "Infiltrate enemy territory to gather intelligence without being detected.",
          difficulty: DIFFICULTY.HARD,
          minLevel: 2,
          giver: "sergeant"
        },
        diplomatic_basic: {
          type: MISSION_TYPES.DIPLOMATIC,
          title: "Negotiate Local Alliance",
          description: "Negotiate with local settlements to form an alliance against Arrasi forces.",
          difficulty: DIFFICULTY.MEDIUM,
          minLevel: 3,
          giver: "quartermaster"
        }
      };
      
      return true;
    },
    
    // Generate a procedural mission
    generateMission: function(params = {}) {
      return _generateMission(params);
    },
    
    // Generate a mission chain
    generateMissionChain: function(params = {}) {
      return _generateMissionChain(params);
    },
    
    // Register a mission template
    registerMissionTemplate: function(key, template) {
      if (!key || !template) {
        _error("Invalid template or key");
        return false;
      }
      
      _missionTemplates[key] = template;
      return true;
    },
    
    // Get all mission templates
    getMissionTemplates: function() {
      return {..._missionTemplates};
    },
    
    // Get all active mission chains
    getActiveMissionChains: function() {
      return [..._activeMissionChains];
    },
    
    // Add a mission chain to active chains
    activateMissionChain: function(chain) {
      if (!chain || !chain.id) {
        _error("Invalid mission chain");
        return false;
      }
      
      // Check if already active
      const existingIndex = _activeMissionChains.findIndex(c => c.id === chain.id);
      if (existingIndex >= 0) {
        _log("Chain already active:", chain.id);
        return false;
      }
      
      _activeMissionChains.push(chain);
      _log("Mission chain activated:", chain.title);
      
      // Trigger event
      if (_eventListeners.chainActivated) {
        _eventListeners.chainActivated.forEach(listener => {
          try {
            listener(chain);
          } catch (error) {
            console.error("Error in chain activation listener:", error);
          }
        });
      }
      
      return true;
    },
    
    // Get next mission in a chain
    getNextChainMission: function(chainId) {
      const chain = _activeMissionChains.find(c => c.id === chainId);
      if (!chain || chain.completed) {
        return null;
      }
      
      return chain.missions[chain.currentPosition] || null;
    },
    
    // Add event listener
    on: function(event, callback) {
      if (!_eventListeners[event]) {
        _eventListeners[event] = [];
      }
      
      _eventListeners[event].push(callback);
      return _eventListeners[event].length - 1;
    },
    
    // Remove event listener
    off: function(event, index) {
      if (!_eventListeners[event]) return;
      
      _eventListeners[event].splice(index, 1);
    },
    
    // Get location data
    getLocationData: function() {
      return {..._locationData};
    },
    
    // Get enemy data
    getEnemyData: function() {
      return {..._enemyData};
    }
  };
})();

// Initialize the mission generator when document is ready
document.addEventListener('DOMContentLoaded', function() {
  if (window.MissionGenerator) {
    window.MissionGenerator.init();
  }
});
