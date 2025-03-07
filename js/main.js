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

// Main initialization system
window.initializeAllSystems = function() {
    console.log("Beginning system initialization...");
    
    // Track initialization status
    window.systemStatus = {
        gameState: false,
        inventory: false,
        equipment: false,
        combat: false,
        ui: false
    };

    try {
        // 1. Initialize game state first
        if (typeof window.initializeGameState === 'function') {
            window.initializeGameState();
            window.systemStatus.gameState = true;
            console.log("✓ Game state initialized");
        } else {
            console.error("Game state initialization function not found");
        }

        // 2. Initialize inventory and items system
        if (typeof window.initializeItems === 'function') {
            window.initializeItems();
            console.log("✓ Items system initialized");
        }
        
        if (typeof window.initializeInventory === 'function') {
            window.initializeInventory();
            window.systemStatus.inventory = true;
            console.log("✓ Inventory system initialized");
        }

        // 3. Initialize equipment system
        if (typeof window.initializeEquipmentUI === 'function') {
            window.initializeEquipmentUI();
            window.systemStatus.equipment = true;
            console.log("✓ Equipment system initialized");
        }

        // 4. Initialize combat system
        if (typeof window.initializeCombatSystem === 'function') {
            window.initializeCombatSystem();
            window.systemStatus.combat = true;
            console.log("✓ Combat system initialized");
        }

        // 5. Initialize campaign and mission systems
        if (typeof window.initializeCampaignAndMissionSystems === 'function') {
            window.initializeCampaignAndMissionSystems();
            console.log("✓ Campaign and mission systems initialized");
        }

        // 6. Set up UI event listeners last
        setupEventListeners();
        window.systemStatus.ui = true;
        console.log("✓ UI event listeners initialized");

        // 7. Initial UI updates
        if (typeof window.updateStatusBars === 'function') {
            window.updateStatusBars();
        }
        if (typeof window.updateActionButtons === 'function') {
            window.updateActionButtons();
        }

        console.log("All systems initialized successfully");
        return true;
    } catch (error) {
        console.error("Error during initialization:", error);
        return false;
    }
};

// Set up all event listeners
function setupEventListeners() {
    // Close buttons for panels
    const closeButtons = document.querySelectorAll('.close-btn');
    if (closeButtons) {
        closeButtons.forEach(button => {
            button.addEventListener('click', function() {
                const panel = this.closest('.game-panel');
                if (panel) {
                    panel.classList.add('hidden');
                }
            });
        });
    }

    // Equipment slot listeners
    const equipmentSlots = document.querySelectorAll('.equipment-slot');
    if (equipmentSlots) {
        equipmentSlots.forEach(slot => {
            slot.addEventListener('click', function(e) {
                if (typeof window.handleEquipmentSlotClick === 'function') {
                    window.handleEquipmentSlotClick(e);
                }
            });
        });
    }

    // Inventory item listeners
    const inventoryList = document.getElementById('inventoryList');
    if (inventoryList) {
        inventoryList.addEventListener('click', function(e) {
            if (e.target.closest('.inventory-item') && typeof window.handleInventoryItemClick === 'function') {
                window.handleInventoryItemClick(e);
            }
        });
    }
}

// Wait for DOM to be ready before initializing
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing game systems...");
    window.initializeAllSystems();
});

// Error handling for system dependencies
window.checkSystemDependency = function(systemName) {
    if (!window.systemStatus || !window.systemStatus[systemName]) {
        console.error(`Required system '${systemName}' is not initialized`);
        return false;
    }
    return true;
};
