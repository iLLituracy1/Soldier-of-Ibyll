// js/data/campaigns.js - Campaign definitions

window.campaignTemplates = {
    "arrasi_campaign": {
      name: "Arrasi Peninsula Campaign",
      description: "Push west into Arrasi territory to secure the peninsula.",
      duration: "3 months", // In-game time
      missionProgression: [
        // Each stage must be completed to advance
        {
          stage: 1,
          name: "Securing the Border",
          availableMissions: ["patrol", "patrol", "skirmish"],
          requiredCompletions: 2, // Complete any 2 of the 3 available missions
          unlocks: "stage2"
        },
        {
          stage: 2,
          name: "Frontier Assault",
          availableMissions: ["skirmish", "skirmish", "raid"],
          requiredCompletions: 2,
          unlocks: "stage3"
        },
        {
          stage: 3,
          name: "The Final Push",
          availableMissions: ["raid", "siege"],
          requiredCompletions: 2, // Must complete both
          unlocks: "victory"
        }
      ],
      victoryRewards: {
        experience: 300,
        taelors: 200,
        specialItem: "arrasi_campaign_medal",
        veteranStatus: true,
        veteranTitle: "Peninsula Veteran"
      }
    },
    
    // More campaign templates can be added
  };