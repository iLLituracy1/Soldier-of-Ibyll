// Quest creation and management functions

// Quest creation function with expanded types
window.createQuest = function(type) {
  const questId = type + "_" + Math.floor(Math.random() * 1000);
  
  // Generate different quest types
  if (type === "training") {
    const trainingTypes = [
      "Basic Training",
      "Combat Readiness",
      "Battle Preparation",
      "Martial Exercises"
    ];
    
    const randomTitle = trainingTypes[Math.floor(Math.random() * trainingTypes.length)];
    
    return {
      id: questId,
      title: randomTitle,
      description: "Complete your training regimen to prepare for combat.",
      objectives: [
        { text: "Complete 5 training sessions", count: 0, target: 5, completed: false }
      ],
      rewards: {
        experience: 50,
        taelors: 15,
        items: []
      },
      completed: false
    };
  } else if (type === "patrol") {
    return {
      id: questId,
      title: "Perimeter Security",
      description: "Help maintain camp security by patrolling the perimeter.",
      objectives: [
        { text: "Complete 3 patrol shifts", count: 0, target: 3, completed: false }
      ],
      rewards: {
        experience: 40,
        taelors: 10,
        items: []
      },
      completed: false
    };
  } else if (type === "scout") {
    return {
      id: questId,
      title: "Forward Reconnaissance",
      description: "Scout the surrounding areas to gather intelligence on enemy movements.",
      objectives: [
        { text: "Complete 2 patrol shifts", count: 0, target: 2, completed: false }
      ],
      rewards: {
        experience: 45,
        taelors: 12,
        items: []
      },
      completed: false
    };
  } else if (type === "combat") {
    return {
      id: questId,
      title: "Threat Elimination",
      description: "Neutralize hostile elements in the surrounding region.",
      objectives: [
        { text: "Defeat 2 enemies in combat", count: 0, target: 2, completed: false }
      ],
      rewards: {
        experience: 60,
        taelors: 20,
        items: [
          { name: "Combat Talisman", type: "accessory", value: 25, effect: "+5% combat effectiveness" }
        ]
      },
      completed: false
    };
  }
  
  // Default fallback quest
  return {
    id: "misc_" + Math.floor(Math.random() * 1000),
    title: "Camp Duties",
    description: "Complete various duties around the camp.",
    objectives: [
      { text: "Complete 3 camp activities", count: 0, target: 3, completed: false }
    ],
    rewards: {
      experience: 30,
      taelors: 8,
      items: []
    },
    completed: false
  };
};

// Helper function to complete a quest
window.completeQuest = function(quest) {
  quest.completed = true;
  
  // Add rewards
  window.gameState.experience += quest.rewards.experience;
  
  // Add reward items if any
  if (quest.rewards.items && quest.rewards.items.length > 0) {
    quest.rewards.items.forEach(item => {
      if (window.player.inventory.length < 20) {
        window.player.inventory.push(item);
        window.addToNarrative(`You received ${item.name} as a reward.`);
      }
    });
  }
  
  // Add taelors reward if specified
  if (quest.rewards.taelors) {
    window.player.taelors += quest.rewards.taelors;
    window.addToNarrative(`You received ${quest.rewards.taelors} taelors as a reward.`);
  }
  
  window.showNotification(`Quest completed: ${quest.title}! +${quest.rewards.experience} XP`, 'success');
  
  // Remove completed quest and add a new one
  window.gameState.sideQuests = window.gameState.sideQuests.filter(q => q.id !== quest.id);
  
  // Add a new random quest with 20% chance of a combat quest if player has won battles
  let questTypes = ["training", "patrol", "scout"];
  
  if (window.gameState.combatVictoryAchieved && Math.random() < 0.2) {
    questTypes.push("combat");
  }
  
  const randomType = questTypes[Math.floor(Math.random() * questTypes.length)];
  const newQuest = window.createQuest(randomType);
  window.gameState.sideQuests.push(newQuest);
  
  console.log("Added new quest:", newQuest);
};

// Update quest progress function
window.updateQuestProgress = function(actionType) {
  // Ensure game state exists
  if (!window.gameState) {
    console.error('Game state not initialized');
    return;
  }

  // Ensure sideQuests array exists
  if (!window.gameState.sideQuests) {
    window.gameState.sideQuests = [];
  }

  // If no quests exist, create an initial quest
  if (window.gameState.sideQuests.length === 0) {
    const questTypes = ["training", "patrol", "scout"];
    const randomType = questTypes[Math.floor(Math.random() * questTypes.length)];
    const newQuest = window.createQuest(randomType);
    if (newQuest) {  // Only add if quest creation succeeded
      window.gameState.sideQuests.push(newQuest);
      console.log("Created initial quest:", newQuest);
    }
  }
  
  // Process each quest
  window.gameState.sideQuests.forEach(quest => {
    if (!quest || quest.completed) return;  // Skip if quest is undefined or completed
    
    let updated = false;
    
    if (!quest.objectives) {
      console.error('Quest has no objectives:', quest);
      return;
    }

    quest.objectives.forEach(objective => {
      if (!objective || objective.completed) return;  // Skip if objective is undefined or completed
      
      // Check if the objective matches the action type
      if (
        (actionType === "training" && objective.text && objective.text.toLowerCase().includes("training")) ||
        (actionType === "patrol" && objective.text && objective.text.toLowerCase().includes("patrol")) ||
        (actionType === "scout" && objective.text && objective.text.toLowerCase().includes("scout"))
      ) {
        objective.count = (objective.count || 0) + 1;
        updated = true;
        console.log(`Updated objective: ${objective.text}, count: ${objective.count}/${objective.target}`);
        
        // Check if objective is completed
        if (objective.count >= objective.target) {
          objective.completed = true;
          if (typeof window.showNotification === 'function') {
            window.showNotification(`Objective completed: ${objective.text}!`, 'success');
          }
        } else {
          if (typeof window.showNotification === 'function') {
            window.showNotification(`Objective progress: ${objective.count}/${objective.target}`, 'info');
          }
        }
      }
    });
    
    // Check if all objectives are completed
    if (updated && quest.objectives.every(obj => obj && obj.completed)) {
      if (typeof window.completeQuest === 'function') {
        window.completeQuest(quest);
      }
    }
  });
};