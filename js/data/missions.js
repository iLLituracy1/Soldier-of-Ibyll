// js/data/missions.js - Mission templates and data

window.missionTypes = {
    // Basic mission template
    "patrol": {
      name: "Border Patrol",
      description: "Patrol the border regions to maintain imperial control.",
      difficulty: 1,
      duration: 3, // Days
      terrainOptions: ["plains", "hills", "forest"],
      weatherOptions: ["clear", "rain", "fog"],
      enemyEncounters: [
        { type: "arrasi_scout", chance: 0.6, min: 1, max: 2 },
        { type: "wild_beast", chance: 0.4, min: 1, max: 1 }
      ],
      objectives: [
        { type: "patrol", count: 3, description: "Complete 3 patrol circuits" },
        { type: "eliminate", count: 2, description: "Neutralize 2 enemy scouts" }
      ],
      rewards: {
        experience: 50,
        taelors: 20,
        itemChance: 0.3,
        itemPool: ["scout_map", "rations", "medical_supplies"]
      },
      imageRef: "patrol_mission.jpg",
      setupFunction: "setupPatrolMission",
      completionFunction: "completePatrolMission"
    },
    
    "skirmish": {
      name: "Frontier Skirmish",
      description: "Clash with enemy forces at a disputed frontier.",
      difficulty: 2,
      duration: 5,
      terrainOptions: ["hills", "forest", "rocky"],
      weatherOptions: ["clear", "rain", "wind"],
      enemyEncounters: [
        { type: "arrasi_warrior", chance: 0.7, min: 1, max: 3 },
        { type: "arrasi_scout", chance: 0.5, min: 1, max: 2 }
      ],
      objectives: [
        { type: "secure", count: 2, description: "Secure strategic points" },
        { type: "eliminate", count: 5, description: "Defeat 5 enemy combatants" }
      ],
      rewards: {
        experience: 80,
        taelors: 35,
        itemChance: 0.5,
        itemPool: ["tribal_blade", "armor_fragment", "combat_talisman"]
      },
      imageRef: "skirmish_mission.jpg",
      setupFunction: "setupSkirmishMission",
      completionFunction: "completeSkirmishMission"
    },
    
    "siege": {
      name: "Siege Operations",
      description: "Lay siege to an enemy stronghold.",
      difficulty: 3,
      duration: 10,
      terrainOptions: ["hills", "rocky"],
      weatherOptions: ["clear", "rain", "wind", "heat"],
      enemyEncounters: [
        { type: "arrasi_warrior", chance: 0.8, min: 2, max: 4 },
        { type: "arrasi_commander", chance: 0.3, min: 1, max: 1 }
      ],
      objectives: [
        { type: "sabotage", count: 1, description: "Sabotage the enemy's defenses" },
        { type: "eliminate", count: 8, description: "Defeat 8 enemy defenders" },
        { type: "secure", count: 1, description: "Breach the main gate" }
      ],
      rewards: {
        experience: 150,
        taelors: 70,
        itemChance: 0.7,
        itemPool: ["commander_insignia", "siege_plans", "crystalline_weapon"]
      },
      imageRef: "siege_mission.jpg",
      setupFunction: "setupSiegeMission",
      completionFunction: "completeSiegeMission"
    },
    
    // Add more mission types as needed
  };