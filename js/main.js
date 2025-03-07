// MAIN ENTRY POINT
// Initializes the game and sets up event listeners with Time Management integration

console.log("Game initializing...");

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM Content Loaded - Starting character creation...");

    // Hide game container and ensure only character creation is visible
    const gameContainer = document.getElementById('gameContainer');
    const characterCreator = document.getElementById('creator');
    const actionsContainer = document.getElementById('actions');
    
    if (gameContainer) {
        gameContainer.classList.add('hidden');
    }
    if (characterCreator) {
        characterCreator.classList.remove('hidden');
    }
    if (actionsContainer) {
        actionsContainer.innerHTML = ''; // Clear any actions
    }

    // Initialize player object with default values
    window.player = {
        name: "",
        origin: "",
        career: {
            title: "",
            description: ""
        },
        phy: 1,
        men: 1,
        skills: {
            melee: 0,
            marksmanship: 0,
            survival: 0,
            command: 0,
            discipline: 0,
            tactics: 0,
            organization: 0,
            arcana: 0
        },
        relationships: {},
        inventory: [],
        taelors: 10,
        isVeteran: false,
        veteranTitle: ""
    };

    // Set up event listeners for character creation only
    const buttons = {
        'paanic-button': () => window.selectOrigin('Paanic'),
        'nesian-button': () => window.selectOrigin('Nesian'),
        'lunarine-button': () => window.selectOrigin('Lunarine'),
        'wyrdman-button': () => window.selectOrigin('Wyrdman'),
        'back-to-intro-button': window.backToIntro,
        'back-to-origin-button': window.backToOrigin,
        'confirm-name-button': window.setName,
        'back-to-name-button': window.backToName,
        'confirm-character-button': window.confirmCharacter,
        'continue-to-empire-button': window.showEmpireUpdate,
        'start-adventure-button': window.startAdventure
    };

    // Add event listeners with null checks
    for (const [id, handler] of Object.entries(buttons)) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        }
    }

    console.log("Character creation setup complete - waiting for player input...");
});

// Define campaign system functions that will be used later
window.initializeCampaignAndMissionSystems = function() {
    console.log("Initializing campaign and mission systems...");
    console.log("Setting up campaign system");

    // Initialize campaign system
    if (typeof window.initializeCampaignSystem === 'function') {
        window.initializeCampaignSystem();
    }

    // Initialize mission system
    if (typeof window.initializeMissionSystem === 'function') {
        window.initializeMissionSystem();
    }

    // Set up campaign functions if not already defined
    if (typeof window.initiateCampaign !== 'function') {
        window.initiateCampaign = function(campaignType) {
            // Get campaign template
            const template = window.campaignTemplates[campaignType];
            if (!template) {
                console.error(`Campaign type ${campaignType} not found`);
                return false;
            }
            
            // Create campaign instance
            const campaign = {
                id: 'c' + Date.now().toString(36),
                type: campaignType,
                name: template.name,
                description: template.description,
                currentStage: 1,
                completedMissions: [],
                state: "active"
            };
            
            // Store in game state
            window.gameState.currentCampaign = campaign;
            window.gameState.mainQuest.stage = 1;
            
            // Show campaign briefing
            window.showCampaignBriefing(campaign);
            
            return true;
        };

        window.showCampaignBriefing = function(campaign) {
            window.addToNarrative(`
                <h3>Campaign Briefing: ${campaign.name}</h3>
                <p>${campaign.description}</p>
                <p>You are now at Stage ${campaign.currentStage} of the campaign. Report to the command tent for mission assignments.</p>
            `);
        };
    }

    console.log("Campaign and mission systems initialized successfully");
};
