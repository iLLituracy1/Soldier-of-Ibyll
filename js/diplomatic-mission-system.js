// DIPLOMATIC MISSION SYSTEM
// Advanced mechanics for negotiation-based missions

window.DiplomaticMissionSystem = (function() {
  // Private variables
  let _activeDiplomacy = false;         // Whether diplomacy system is active
  let _currentNegotiation = null;       // Current negotiation data
  let _negotiationHistory = [];         // History of negotiation choices
  let _relationshipImpacts = {};        // How negotiation affects relationships
  let _difficultyLevel = 2;             // Difficulty level (1-5)
  let _skillBonus = 0;                  // Bonus from player skills
  let _currentPhase = 0;                // Current negotiation phase
  let _playerStance = 'neutral';        // Player's negotiation stance
  let _diplomaticPoints = 0;            // Points earned during negotiation
  let _targetPoints = 100;              // Points needed for successful negotiation
  let _negotiationCallback = null;      // Callback for when negotiation completes
  let _npcResponseCallback = null;      // Callback for when NPC responds
  
  // Constants
  const NEGOTIATION_STANCES = {
    FRIENDLY: 'friendly',       // Cooperative, builds rapport
    NEUTRAL: 'neutral',         // Balanced approach
    ASSERTIVE: 'assertive',     // Firm but respectful
    AGGRESSIVE: 'aggressive',   // Demanding, intimidating
    DECEPTIVE: 'deceptive'      // Misleading or manipulative
  };
  
  const NEGOTIATION_TOPICS = {
    RESOURCES: 'resources',     // Trade, supplies, materials
    MILITARY: 'military',       // Defense pacts, troop movements
    TERRITORY: 'territory',     // Land rights, borders, access
    INFORMATION: 'information', // Intelligence sharing, knowledge
    POLITICAL: 'political',     // Alliances, governance, influence
    CULTURAL: 'cultural'        // Traditions, values, practices
  };
  
  const NEGOTIATION_PHASES = {
    INTRODUCTION: 0,            // Opening statements, formalities
    EXPLORATION: 1,             // Exploring interests and positions
    PROPOSAL: 2,                // Making and discussing offers
    BARGAINING: 3,              // Adjustments and concessions
    CONCLUSION: 4               // Final agreements or disagreements
  };
  
  // Calculate diplomacy values based on player stats
  function _calculateDiplomacyValues() {
    // Get relevant skills
    const commandSkill = (window.player.skills && window.player.skills.command) || 0;
    const tacticsSkill = (window.player.skills && window.player.skills.tactics) || 0;
    const disciplineSkill = (window.player.skills && window.player.skills.discipline) || 0;
    
    // Calculate skill bonus
    _skillBonus = (commandSkill * 0.5) + (tacticsSkill * 0.3) + (disciplineSkill * 0.2);
    
    // Calculate base diplomatic points based on skills
    const basePoints = _skillBonus * 5;
    
    return {
      skillBonus: _skillBonus,
      basePoints: basePoints
    };
  }
  
  // Create a negotiation scenario
  function _createNegotiation(params) {
    const defaultParams = {
      title: "Standard Negotiation",
      description: "A standard diplomatic negotiation with a local leader.",
      difficulty: 2,
      targetPoints: 100,
      counterparty: {
        name: "Local Leader",
        faction: "Neutral Settlement",
        personality: "pragmatic", // pragmatic, friendly, hostile, cautious, cunning
        interests: {
          resources: 0.7,
          military: 0.4,
          territory: 0.8,
          information: 0.5
        }
      },
      stakes: {
        success: "Successful alliance with the settlement",
        failure: "Failed negotiation, no alliance formed"
      },
      phases: [
        {
          type: NEGOTIATION_PHASES.INTRODUCTION,
          description: "Opening statements and formalities",
          options: [
            {
              text: "Begin with formal greetings honoring local customs",
              stance: NEGOTIATION_STANCES.FRIENDLY,
              effect: { points: 10, counterpartyMood: 5 }
            },
            {
              text: "Start with a direct statement of Paanic interests",
              stance: NEGOTIATION_STANCES.NEUTRAL,
              effect: { points: 5, counterpartyMood: 0 }
            },
            {
              text: "Demonstrate Paanic strength to establish position",
              stance: NEGOTIATION_STANCES.ASSERTIVE,
              effect: { points: 0, counterpartyMood: -5 }
            }
          ]
        },
        {
          type: NEGOTIATION_PHASES.EXPLORATION,
          description: "Exploring interests and objectives",
          options: [
            {
              text: "Ask about the settlement's needs and concerns",
              stance: NEGOTIATION_STANCES.FRIENDLY,
              effect: { points: 15, counterpartyMood: 10 }
            },
            {
              text: "Propose mutual cooperation against Arrasi forces",
              stance: NEGOTIATION_STANCES.NEUTRAL,
              effect: { points: 10, counterpartyMood: 5 }
            },
            {
              text: "Emphasize the dangers of refusing Paanic protection",
              stance: NEGOTIATION_STANCES.AGGRESSIVE,
              effect: { points: 5, counterpartyMood: -10 }
            }
          ]
        },
        {
          type: NEGOTIATION_PHASES.PROPOSAL,
          description: "Making and discussing offers",
          options: []  // Will be generated dynamically based on previous choices
        },
        {
          type: NEGOTIATION_PHASES.BARGAINING,
          description: "Adjustments and concessions",
          options: []  // Will be generated dynamically based on previous choices
        },
        {
          type: NEGOTIATION_PHASES.CONCLUSION,
          description: "Final agreement or disagreement",
          options: []  // Will be generated dynamically based on previous choices
        }
      ],
      topics: [
        {
          id: NEGOTIATION_TOPICS.RESOURCES,
          title: "Resource Sharing",
          description: "Trading supplies and materials between the Paanic Paanic and the settlement.",
          PaanicInterest: 0.6,
          options: [
            {
              text: "Offer fair trade terms for local resources",
              stance: NEGOTIATION_STANCES.FRIENDLY,
              effect: { points: 15, relationship: 5, resources: -5 }
            },
            {
              text: "Propose limited resource sharing with military priority",
              stance: NEGOTIATION_STANCES.NEUTRAL,
              effect: { points: 10, relationship: 0, resources: 0 }
            },
            {
              text: "Demand resource contributions to the war effort",
              stance: NEGOTIATION_STANCES.AGGRESSIVE,
              effect: { points: 5, relationship: -10, resources: 10 }
            }
          ]
        },
        {
          id: NEGOTIATION_TOPICS.MILITARY,
          title: "Military Cooperation",
          description: "Defensive arrangements between Paanic forces and settlement militia.",
          PaanicInterest: 0.8,
          options: [
            {
              text: "Offer training and equipment for local militia",
              stance: NEGOTIATION_STANCES.FRIENDLY,
              effect: { points: 15, relationship: 10, military: -5 }
            },
            {
              text: "Propose joint patrols and intelligence sharing",
              stance: NEGOTIATION_STANCES.NEUTRAL,
              effect: { points: 10, relationship: 5, military: 5 }
            },
            {
              text: "Insist on Paanic oversight of all local defenses",
              stance: NEGOTIATION_STANCES.ASSERTIVE,
              effect: { points: 5, relationship: -5, military: 15 }
            }
          ]
        },
        {
          id: NEGOTIATION_TOPICS.TERRITORY,
          title: "Territorial Access",
          description: "Access rights and usage of land around the settlement.",
          PaanicInterest: 0.7,
          options: [
            {
              text: "Request limited access for patrols only",
              stance: NEGOTIATION_STANCES.FRIENDLY,
              effect: { points: 10, relationship: 10, territory: 5 }
            },
            {
              text: "Propose formal access treaty with defined boundaries",
              stance: NEGOTIATION_STANCES.NEUTRAL,
              effect: { points: 15, relationship: 5, territory: 10 }
            },
            {
              text: "Demand unrestricted access to settlement territory",
              stance: NEGOTIATION_STANCES.AGGRESSIVE,
              effect: { points: 5, relationship: -15, territory: 20 }
            }
          ]
        }
      ]
    };
    
    // Merge default with provided parameters
    const negotiation = { ...defaultParams, ...params };
    
    // Ensure properties exist
    negotiation.counterpartyMood = 0;
    negotiation.currentPhase = 0;
    negotiation.completedTopics = [];
    
    return negotiation;
  }
  
  // Generate dynamic options for later phases based on history
  function _generateDynamicOptions() {
    if (!_currentNegotiation) return;
    
    try {
      // Generate proposal phase options based on explored interests
      if (_currentPhase === NEGOTIATION_PHASES.PROPOSAL) {
        const proposalPhase = _currentNegotiation.phases[NEGOTIATION_PHASES.PROPOSAL];
        
        // Clear existing options
        proposalPhase.options = [];
        
        // Add options for each topic
        for (const topic of _currentNegotiation.topics) {
          // Skip topics already addressed
          if (_currentNegotiation.completedTopics.includes(topic.id)) {
            continue;
          }
          
          // Determine if counterparty is interested in this topic
          const counterpartyInterest = _currentNegotiation.counterparty.interests[topic.id] || 0;
          
          // Only include topics with significant interest from either party
          if (counterpartyInterest > 0.3 || topic.PaanicInterest > 0.3) {
            // Add proposal based on topic
            const baseOption = {
              text: `Discuss ${topic.title.toLowerCase()}`,
              topicId: topic.id,
              stance: NEGOTIATION_STANCES.NEUTRAL,
              effect: { points: 5 * counterpartyInterest, topic: topic.id }
            };
            
            proposalPhase.options.push(baseOption);
          }
        }
        
        // Add a "delay decision" option
        proposalPhase.options.push({
          text: "Suggest taking time to consider the matters discussed so far",
          stance: NEGOTIATION_STANCES.NEUTRAL,
          effect: { points: 5, counterpartyMood: 5 }
        });
      }
      // Generate bargaining phase options based on proposals
      else if (_currentPhase === NEGOTIATION_PHASES.BARGAINING) {
        const bargainingPhase = _currentNegotiation.phases[NEGOTIATION_PHASES.BARGAINING];
        
        // Clear existing options
        bargainingPhase.options = [];
        
        // Add options for each completed topic
        for (const topicId of _currentNegotiation.completedTopics) {
          const topic = _currentNegotiation.topics.find(t => t.id === topicId);
          
          if (topic) {
            // Generate concession option
            bargainingPhase.options.push({
              text: `Make a concession on ${topic.title.toLowerCase()} to improve relations`,
              stance: NEGOTIATION_STANCES.FRIENDLY,
              topicId: topic.id,
              effect: { points: 15, relationship: 10, [topic.id]: -10 }
            });
            
            // Generate firm position option
            bargainingPhase.options.push({
              text: `Hold firm on ${topic.title.toLowerCase()} terms`,
              stance: NEGOTIATION_STANCES.ASSERTIVE,
              topicId: topic.id,
              effect: { points: 5, relationship: -5, [topic.id]: 0 }
            });
          }
        }
        
        // Add final bargaining options
        bargainingPhase.options.push({
          text: "Offer a gesture of goodwill to strengthen trust",
          stance: NEGOTIATION_STANCES.FRIENDLY,
          effect: { points: 20, relationship: 15, resources: -5 }
        });
        
        bargainingPhase.options.push({
          text: "Press for a quick resolution to all outstanding issues",
          stance: NEGOTIATION_STANCES.ASSERTIVE,
          effect: { points: 10, relationship: -5 }
        });
      }
      // Generate conclusion phase options
      else if (_currentPhase === NEGOTIATION_PHASES.CONCLUSION) {
        const conclusionPhase = _currentNegotiation.phases[NEGOTIATION_PHASES.CONCLUSION];
        
        // Clear existing options
        conclusionPhase.options = [];
        
        // Check negotiation progress
        const progress = _diplomaticPoints / _targetPoints;
        
        if (progress >= 0.8) {
          // Strong position - favorable options
          conclusionPhase.options.push({
            text: "Propose a formal alliance with mutual benefits",
            stance: NEGOTIATION_STANCES.FRIENDLY,
            effect: { points: 25, relationship: 15, finalizing: true }
          });
          
          conclusionPhase.options.push({
            text: "Request additional favorable terms before finalizing",
            stance: NEGOTIATION_STANCES.ASSERTIVE,
            effect: { points: 15, relationship: -5, resources: 10, finalizing: true }
          });
        } else if (progress >= 0.5) {
          // Decent position - standard options
          conclusionPhase.options.push({
            text: "Propose a standard cooperation agreement",
            stance: NEGOTIATION_STANCES.NEUTRAL,
            effect: { points: 15, relationship: 10, finalizing: true }
          });
          
          conclusionPhase.options.push({
            text: "Suggest limited cooperation focused on shared interests",
            stance: NEGOTIATION_STANCES.FRIENDLY,
            effect: { points: 20, relationship: 5, finalizing: true }
          });
        } else {
          // Weak position - salvage options
          conclusionPhase.options.push({
            text: "Propose a minimal non-aggression pact",
            stance: NEGOTIATION_STANCES.FRIENDLY,
            effect: { points: 15, relationship: 5, finalizing: true }
          });
          
          conclusionPhase.options.push({
            text: "Request time to reconsider the terms",
            stance: NEGOTIATION_STANCES.NEUTRAL,
            effect: { points: 5, relationship: 0, finalizing: false }
          });
        }
        
        // Always add option to end negotiations decisively
        conclusionPhase.options.push({
          text: "Thank them for their time and conclude negotiations",
          stance: NEGOTIATION_STANCES.NEUTRAL,
          effect: { points: 0, finalizing: true }
        });
      }
    } catch (error) {
      console.error("[DiplomaticMissionSystem] Error generating options:", error);
    }
  }
  
  // Calculate the success of a negotiation option
  function _calculateOptionSuccess(option) {
    try {
      // Base outcome on player skills and difficulty
      let successChance = 50 + (_skillBonus * 5) - (_difficultyLevel * 10);
      
      // Adjust for counterparty mood
      successChance += _currentNegotiation.counterpartyMood;
      
      // Adjust for appropriate stance based on counterparty personality
      if (_currentNegotiation.counterparty.personality) {
        switch (_currentNegotiation.counterparty.personality) {
          case "pragmatic":
            // Pragmatic counterparties respond well to neutral stances
            if (option.stance === NEGOTIATION_STANCES.NEUTRAL) successChance += 10;
            if (option.stance === NEGOTIATION_STANCES.AGGRESSIVE) successChance -= 15;
            break;
          case "friendly":
            // Friendly counterparties respond well to friendly stances
            if (option.stance === NEGOTIATION_STANCES.FRIENDLY) successChance += 15;
            if (option.stance === NEGOTIATION_STANCES.AGGRESSIVE) successChance -= 20;
            break;
          case "hostile":
            // Hostile counterparties respond better to assertive stances
            if (option.stance === NEGOTIATION_STANCES.ASSERTIVE) successChance += 5;
            if (option.stance === NEGOTIATION_STANCES.FRIENDLY) successChance -= 5;
            break;
          case "cautious":
            // Cautious counterparties respond poorly to aggressive stances
            if (option.stance === NEGOTIATION_STANCES.AGGRESSIVE) successChance -= 25;
            if (option.stance === NEGOTIATION_STANCES.ASSERTIVE) successChance -= 10;
            break;
          case "cunning":
            // Cunning counterparties can see through deception
            if (option.stance === NEGOTIATION_STANCES.DECEPTIVE) successChance -= 20;
            break;
        }
      }
      
      // Clamp success chance
      successChance = Math.max(10, Math.min(90, successChance));
      
      return successChance;
    } catch (error) {
      console.error("[DiplomaticMissionSystem] Error calculating option success:", error);
      return 50; // Default to 50% chance on error
    }
  }
  
  // Process the selected option
  function _processNegotiationOption(optionIndex) {
    if (!_currentNegotiation || !_activeDiplomacy) {
      return { success: false, message: "No active negotiation." };
    }
    
    try {
      // Get current phase
      const phase = _currentNegotiation.phases[_currentPhase];
      
      // Get selected option
      const option = phase.options[optionIndex];
      if (!option) {
        return { success: false, message: "Invalid option selected." };
      }
      
      // Calculate success chance
      const successChance = _calculateOptionSuccess(option);
      
      // Roll for success
      const roll = Math.random() * 100;
      const isSuccess = roll <= successChance;
      
      // Record player stance
      _playerStance = option.stance;
      
      // Prepare result
      const result = {
        success: isSuccess,
        option: option,
        successChance: successChance,
        roll: roll,
        effects: {}
      };
      
      // Apply effects
      if (option.effect) {
        // Base points from option
        let pointsGained = option.effect.points || 0;
        
        // Modify points based on success
        pointsGained = isSuccess ? pointsGained : Math.floor(pointsGained / 2);
        
        // Add points
        _diplomaticPoints += pointsGained;
        result.effects.points = pointsGained;
        
        // Update counterparty mood
        if (option.effect.counterpartyMood) {
          const moodChange = isSuccess ? 
            option.effect.counterpartyMood : 
            Math.floor(option.effect.counterpartyMood / 2);
          
          _currentNegotiation.counterpartyMood += moodChange;
          result.effects.mood = moodChange;
        }
        
        // Handle relationship changes
        if (option.effect.relationship) {
          const relationshipChange = isSuccess ? 
            option.effect.relationship : 
            Math.floor(option.effect.relationship / 2);
          
          _relationshipImpacts.counterparty = (_relationshipImpacts.counterparty || 0) + relationshipChange;
          result.effects.relationship = relationshipChange;
        }
        
        // Handle topic completion
        if (option.effect.topic) {
          _currentNegotiation.completedTopics.push(option.effect.topic);
          result.effects.completedTopic = option.effect.topic;
        }
        
        // Handle resource effects
        for (const topic of Object.values(NEGOTIATION_TOPICS)) {
          if (option.effect[topic]) {
            _relationshipImpacts[topic] = (_relationshipImpacts[topic] || 0) + option.effect[topic];
            result.effects[topic] = option.effect[topic];
          }
        }
        
        // Check for finalization
        if (option.effect.finalizing !== undefined) {
          result.finalizing = option.effect.finalizing;
        }
      }
      
      // Add to negotiation history
      _negotiationHistory.push({
        phase: _currentPhase,
        option: option,
        success: isSuccess,
        points: result.effects.points
      });
      
      // Generate NPC response
      const npcResponse = _generateNPCResponse(option, isSuccess);
      result.npcResponse = npcResponse;
      
      // If callback is provided, call it
      if (_npcResponseCallback) {
        setTimeout(() => {
          _npcResponseCallback(npcResponse);
        }, 500);
      }
      
      // Check for phase advancement or negotiation end
      if (option.effect && option.effect.finalizing) {
        // End negotiation
        result.negotiationComplete = true;
        result.negotiationSuccess = _diplomaticPoints >= _targetPoints;
        
        // Call completion callback if provided
        if (_negotiationCallback) {
          const finalResult = {
            success: result.negotiationSuccess,
            points: _diplomaticPoints,
            targetPoints: _targetPoints,
            history: _negotiationHistory,
            relationshipImpacts: _relationshipImpacts
          };
          
          setTimeout(() => {
            _negotiationCallback(finalResult);
          }, 1000);
        }
      } else {
        // Check if we should advance to next phase
        const shouldAdvancePhase = _shouldAdvancePhase();
        
        if (shouldAdvancePhase) {
          _currentPhase++;
          result.phaseAdvanced = true;
          
          // Generate options for the new phase
          _generateDynamicOptions();
        }
      }
      
      return result;
    } catch (error) {
      console.error("[DiplomaticMissionSystem] Error processing option:", error);
      return { success: false, message: "Error processing negotiation option." };
    }
  }
  
  // Determine if negotiation should advance to next phase
  function _shouldAdvancePhase() {
    // Check if we're already at the final phase
    if (_currentPhase >= _currentNegotiation.phases.length - 1) {
      return false;
    }
    
    // Introduction always advances after one choice
    if (_currentPhase === NEGOTIATION_PHASES.INTRODUCTION) {
      return true;
    }
    
    // Exploration advances after two topics explored
    if (_currentPhase === NEGOTIATION_PHASES.EXPLORATION) {
      return _negotiationHistory.filter(h => h.phase === NEGOTIATION_PHASES.EXPLORATION).length >= 2;
    }
    
    // Proposal advances after addressing at least half the topics
    if (_currentPhase === NEGOTIATION_PHASES.PROPOSAL) {
      return _currentNegotiation.completedTopics.length >= Math.ceil(_currentNegotiation.topics.length / 2);
    }
    
    // Bargaining advances after at least two bargaining attempts
    if (_currentPhase === NEGOTIATION_PHASES.BARGAINING) {
      return _negotiationHistory.filter(h => h.phase === NEGOTIATION_PHASES.BARGAINING).length >= 2;
    }
    
    return false;
  }
  
  // Generate an NPC response based on the selected option and success
  function _generateNPCResponse(option, isSuccess) {
    const counterparty = _currentNegotiation.counterparty;
    const personality = counterparty.personality || "pragmatic";
    const mood = _currentNegotiation.counterpartyMood;
    
    // Base responses for different personalities
    const personalityResponses = {
      pragmatic: {
        success: [
          "That seems reasonable. Let's proceed on that basis.",
          "A practical approach. I appreciate your efficiency.",
          "This serves both our interests. Good suggestion."
        ],
        failure: [
          "I'm not convinced that approach works for us.",
          "Let's consider alternatives that better balance our needs.",
          "That proposal requires further consideration."
        ]
      },
      friendly: {
        success: [
          "I'm delighted we see eye to eye on this matter!",
          "What a wonderful suggestion. This strengthens our friendship.",
          "Yes, this is exactly the kind of cooperation I hoped for."
        ],
        failure: [
          "While I appreciate your perspective, I must politely disagree.",
          "I wish I could agree, but we need something more balanced.",
          "Let's keep the friendly spirit while finding a better approach."
        ]
      },
      hostile: {
        success: [
          "Fine. I'll accept that, for now.",
          "Against my better judgment, I'll agree to these terms.",
          "Don't think this means I trust your Paanic intentions."
        ],
        failure: [
          "Absolutely not. Your proposal is unacceptable.",
          "Do you take me for a fool? These terms are insulting.",
          "This discussion is becoming a waste of my time."
        ]
      },
      cautious: {
        success: [
          "After careful consideration, I believe we can proceed.",
          "This appears to be a measured approach. I'll agree.",
          "With appropriate safeguards, this could work for us."
        ],
        failure: [
          "I need more assurances before proceeding with such terms.",
          "The risks seem to outweigh the benefits in this proposal.",
          "I must be prudent with my people's future. Let's reconsider."
        ]
      },
      cunning: {
        success: [
          "Interesting proposal. I see potential advantages for both sides.",
          "You present a compelling case. Let's explore this further.",
          "Perhaps we can find common ground on these terms."
        ],
        failure: [
          "Your offer seems... disingenuous. Let's be more transparent.",
          "I suspect there's more to this proposal than you're revealing.",
          "The terms appear imbalanced upon closer inspection."
        ]
      }
    };
    
    // Get appropriate responses for personality
    const responses = personalityResponses[personality] || personalityResponses.pragmatic;
    const responsePool = isSuccess ? responses.success : responses.failure;
    
    // Select a random response
    let response = responsePool[Math.floor(Math.random() * responsePool.length)];
    
    // Add mood modifier
    if (mood >= 20) {
      response += " I appreciate your respectful approach to these negotiations.";
    } else if (mood >= 10) {
      response += " These talks are proceeding well.";
    } else if (mood <= -20) {
      response += " I'm finding it difficult to see these negotiations succeeding.";
    } else if (mood <= -10) {
      response += " I'm beginning to question the value of this discussion.";
    }
    
    // Handle stance-specific responses
    if (option.stance === NEGOTIATION_STANCES.AGGRESSIVE && !isSuccess) {
      response += " Your aggressive posture is not helping matters.";
    } else if (option.stance === NEGOTIATION_STANCES.FRIENDLY && isSuccess) {
      response += " Your courtesy is refreshing.";
    }
    
    return {
      speaker: counterparty.name,
      text: response,
      mood: mood,
      isSuccess: isSuccess
    };
  }
  
  // Render negotiation UI
  function _renderNegotiationUI() {
    try {
      // Create or get container
      let container = document.getElementById('diplomaticMissionInterface');
      
      if (!container) {
        container = document.createElement('div');
        container.id = 'diplomaticMissionInterface';
        container.className = 'diplomatic-mission-interface';
        document.body.appendChild(container);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
          .diplomatic-mission-interface {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            z-index: 1000;
            color: white;
            font-family: Arial, sans-serif;
          }
          
          .negotiation-header {
            padding: 15px;
            background-color: rgba(75, 107, 255, 0.3);
            border-bottom: 1px solid #4b6bff;
          }
          
          .negotiation-title {
            font-size: 24px;
            margin-bottom: 5px;
          }
          
          .negotiation-phase {
            font-size: 16px;
            color: #aaa;
          }
          
          .negotiation-progress {
            width: 100%;
            height: 6px;
            background-color: #333;
            margin-top: 10px;
          }
          
          .progress-bar {
            height: 100%;
            background-color: #4b6bff;
            width: 0%;
            transition: width 0.5s ease;
          }
          
          .negotiation-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 15px;
            overflow-y: auto;
          }
          
          .dialogue-history {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            background-color: rgba(0, 0, 0, 0.3);
            border-radius: 5px;
            margin-bottom: 15px;
          }
          
          .dialogue-entry {
            margin-bottom: 10px;
            padding: 8px;
            border-radius: 5px;
          }
          
          .dialogue-entry.player {
            background-color: rgba(75, 107, 255, 0.2);
            border-left: 3px solid #4b6bff;
          }
          
          .dialogue-entry.npc {
            background-color: rgba(255, 255, 255, 0.1);
            border-left: 3px solid #aaa;
          }
          
          .dialogue-entry.npc.positive {
            border-left-color: #4bff6b;
          }
          
          .dialogue-entry.npc.negative {
            border-left-color: #ff4b4b;
          }
          
          .dialogue-speaker {
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .dialogue-text {
            line-height: 1.5;
          }
          
          .negotiation-options {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          
          .negotiation-option {
            padding: 12px;
            background-color: rgba(75, 107, 255, 0.2);
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.2s ease;
          }
          
          .negotiation-option:hover {
            background-color: rgba(75, 107, 255, 0.4);
          }
          
          .negotiation-option-friendly {
            border-left: 3px solid #4bff6b;
          }
          
          .negotiation-option-neutral {
            border-left: 3px solid #4b6bff;
          }
          
          .negotiation-option-assertive {
            border-left: 3px solid #ffc44b;
          }
          
          .negotiation-option-aggressive {
            border-left: 3px solid #ff4b4b;
          }
          
          .negotiation-option-deceptive {
            border-left: 3px solid #c44bff;
          }
          
          .negotiation-outcome {
            padding: 15px;
            text-align: center;
            margin: 20px 0;
            border-radius: 5px;
          }
          
          .negotiation-outcome.success {
            background-color: rgba(75, 255, 107, 0.2);
            border: 1px solid #4bff6b;
          }
          
          .negotiation-outcome.failure {
            background-color: rgba(255, 75, 75, 0.2);
            border: 1px solid #ff4b4b;
          }
          
          .negotiation-controls {
            padding: 15px;
            background-color: rgba(0, 0, 0, 0.3);
            border-top: 1px solid #333;
            display: flex;
            justify-content: space-between;
          }
          
          .negotiation-button {
            padding: 10px 15px;
            background-color: #4b6bff;
            border: none;
            border-radius: 4px;
            color: white;
            cursor: pointer;
          }
          
          .negotiation-button.danger {
            background-color: #ff4b4b;
          }
          
          .negotiation-button:hover {
            filter: brightness(1.2);
          }
        `;
        document.head.appendChild(style);
      }
      
      // Only render if we have active negotiation
      if (!_activeDiplomacy || !_currentNegotiation) {
        container.style.display = 'none';
        return;
      }
      
      // Show container
      container.style.display = 'flex';
      
      // Current phase and title
      const phase = _currentNegotiation.phases[_currentPhase];
      const phaseTitle = Object.keys(NEGOTIATION_PHASES).find(
        key => NEGOTIATION_PHASES[key] === _currentPhase
      ) || 'Unknown';
      
      // Calculate progress percentage
      const progressPercentage = Math.min(100, (_diplomaticPoints / _targetPoints) * 100);
      
      // Create header
      const header = `
        <div class="negotiation-header">
          <div class="negotiation-title">${_currentNegotiation.title}</div>
          <div class="negotiation-phase">Phase: ${phaseTitle} - ${phase.description}</div>
          <div class="negotiation-progress">
            <div class="progress-bar" style="width:${progressPercentage}%"></div>
          </div>
        </div>
      `;
      
      // Create dialogue history
      let dialogueHistory = '<div class="dialogue-history">';
      
      // Add negotiation introduction
      if (_negotiationHistory.length === 0) {
        dialogueHistory += `
          <div class="dialogue-entry npc">
            <div class="dialogue-speaker">${_currentNegotiation.counterparty.name}</div>
            <div class="dialogue-text">Greetings, representative of the Paanic. I am ready to discuss the matters at hand.</div>
          </div>
        `;
      }
      
      // Add history entries
      for (const entry of _negotiationHistory) {
        const option = entry.option;
        
        // Add player entry
        dialogueHistory += `
          <div class="dialogue-entry player">
            <div class="dialogue-speaker">You</div>
            <div class="dialogue-text">${option.text}</div>
          </div>
        `;
        
        // Add NPC response if available
        if (entry.npcResponse) {
          const responseClass = entry.success ? 'positive' : 'negative';
          
          dialogueHistory += `
            <div class="dialogue-entry npc ${responseClass}">
              <div class="dialogue-speaker">${entry.npcResponse.speaker}</div>
              <div class="dialogue-text">${entry.npcResponse.text}</div>
            </div>
          `;
        }
      }
      
      dialogueHistory += '</div>';
      
      // Create options
      let optionsHtml = '<div class="negotiation-options">';
      
      // Only show options if we're not at a complete/failed state
      if (_activeDiplomacy && !_currentNegotiation.complete) {
        for (let i = 0; i < phase.options.length; i++) {
          const option = phase.options[i];
          
          if (!option) continue;
          
          // Get stance class
          let stanceClass = 'neutral';
          switch(option.stance) {
            case NEGOTIATION_STANCES.FRIENDLY: 
              stanceClass = 'friendly'; 
              break;
            case NEGOTIATION_STANCES.ASSERTIVE: 
              stanceClass = 'assertive'; 
              break;
            case NEGOTIATION_STANCES.AGGRESSIVE: 
              stanceClass = 'aggressive'; 
              break;
            case NEGOTIATION_STANCES.DECEPTIVE: 
              stanceClass = 'deceptive'; 
              break;
          }
          
          optionsHtml += `
            <div class="negotiation-option negotiation-option-${stanceClass}" data-index="${i}">
              ${option.text}
            </div>
          `;
        }
      }
      
      optionsHtml += '</div>';
      
      // Create controls
      const controls = `
        <div class="negotiation-controls">
          <button class="negotiation-button" id="diplomaticCloseButton">Close Interface</button>
          <button class="negotiation-button danger" id="diplomaticAbandonButton">Abandon Negotiation</button>
        </div>
      `;
      
      // Assemble the UI
      container.innerHTML = `
        ${header}
        <div class="negotiation-content">
          ${dialogueHistory}
          ${optionsHtml}
        </div>
        ${controls}
      `;
      
      // Add event listeners
      const options = container.querySelectorAll('.negotiation-option');
      options.forEach(option => {
        option.addEventListener('click', () => {
          const index = parseInt(option.getAttribute('data-index'));
          
          if (!isNaN(index)) {
            this.selectNegotiationOption(index);
          }
        });
      });
      
      // Close button
      const closeButton = document.getElementById('diplomaticCloseButton');
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          this.hideInterface();
        });
      }
      
      // Abandon button
      const abandonButton = document.getElementById('diplomaticAbandonButton');
      if (abandonButton) {
        abandonButton.addEventListener('click', () => {
          if (confirm("Are you sure you want to abandon this negotiation? This may harm your faction's reputation.")) {
            this.endNegotiation(false);
          }
        });
      }
    } catch (error) {
      console.error("[DiplomaticMissionSystem] Failed to render UI:", error);
    }
  }
  
  // Public API
  return {
    // Constants
    NEGOTIATION_STANCES: NEGOTIATION_STANCES,
    NEGOTIATION_TOPICS: NEGOTIATION_TOPICS,
    NEGOTIATION_PHASES: NEGOTIATION_PHASES,
    
    // Initialize the diplomatic mission system
    init: function() {
      console.log("[DiplomaticMissionSystem] Initializing diplomatic mission system");
      
      // Calculate initial diplomacy values
      _calculateDiplomacyValues();
      
      return true;
    },
    
    // Start a diplomatic negotiation
    startNegotiation: function(params) {
      try {
        // Set difficulty level
        _difficultyLevel = params.difficulty || 2;
        
        // Create the negotiation
        _currentNegotiation = _createNegotiation(params);
        
        // Set target points
        _targetPoints = params.targetPoints || 100;
        
        // Calculate diplomacy values
        const diplomacyValues = _calculateDiplomacyValues();
        
        // Set initial diplomatic points
        _diplomaticPoints = diplomacyValues.basePoints;
        
        // Reset state
        _currentPhase = 0;
        _negotiationHistory = [];
        _relationshipImpacts = {};
        _activeDiplomacy = true;
        
        // Store callbacks
        _negotiationCallback = params.callback;
        _npcResponseCallback = params.npcResponseCallback;
        
        // Show UI
        _renderNegotiationUI();
        
        console.log("[DiplomaticMissionSystem] Negotiation started:", _currentNegotiation.title);
        
        return true;
      } catch (error) {
        console.error("[DiplomaticMissionSystem] Failed to start negotiation:", error);
        return false;
      }
    },
    
    // Select a negotiation option
    selectNegotiationOption: function(optionIndex) {
      if (!_activeDiplomacy || !_currentNegotiation) {
        return { success: false, message: "No active negotiation." };
      }
      
      try {
        // Process the option
        const result = _processNegotiationOption(optionIndex);
        
        // Update UI
        _renderNegotiationUI();
        
        return result;
      } catch (error) {
        console.error("[DiplomaticMissionSystem] Error selecting option:", error);
        return { success: false, message: "Error selecting negotiation option." };
      }
    },
    
    // End the negotiation
    endNegotiation: function(success) {
      if (!_activeDiplomacy || !_currentNegotiation) {
        return false;
      }
      
      try {
        // Set negotiation as completed
        _currentNegotiation.complete = true;
        _currentNegotiation.success = success;
        _activeDiplomacy = false;
        
        // Prepare final result
        const finalResult = {
          success: success,
          points: _diplomaticPoints,
          targetPoints: _targetPoints,
          history: _negotiationHistory,
          relationshipImpacts: _relationshipImpacts
        };
        
        // Call completion callback if provided
        if (_negotiationCallback) {
          _negotiationCallback(finalResult);
        }
        
        // Hide interface
        this.hideInterface();
        
        console.log("[DiplomaticMissionSystem] Negotiation ended:", success ? "Success" : "Failure");
        
        return finalResult;
      } catch (error) {
        console.error("[DiplomaticMissionSystem] Error ending negotiation:", error);
        return false;
      }
    },
    
    // Show the diplomatic interface
    showInterface: function() {
      _renderNegotiationUI();
    },
    
    // Hide the diplomatic interface
    hideInterface: function() {
      const container = document.getElementById('diplomaticMissionInterface');
      if (container) {
        container.style.display = 'none';
      }
    },
    
    // Get current negotiation status
    getNegotiationStatus: function() {
      if (!_activeDiplomacy || !_currentNegotiation) {
        return null;
      }
      
      return {
        title: _currentNegotiation.title,
        currentPhase: _currentPhase,
        diplomaticPoints: _diplomaticPoints,
        targetPoints: _targetPoints,
        counterpartyMood: _currentNegotiation.counterpartyMood,
        relationshipImpacts: { ..._relationshipImpacts },
        completedTopics: [..._currentNegotiation.completedTopics],
        negotiationHistory: _negotiationHistory.length
      };
    },
    
    // Check if a diplomatic negotiation is active
    isActive: function() {
      return _activeDiplomacy;
    },
    
    // Get relationship impacts from current negotiation
    getRelationshipImpacts: function() {
      return { ..._relationshipImpacts };
    }
  };
})();

// Initialize the diplomatic mission system when document is ready
document.addEventListener('DOMContentLoaded', function() {
  if (window.DiplomaticMissionSystem) {
    window.DiplomaticMissionSystem.init();
  }
});
