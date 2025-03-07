// Initialize game systems
window.initializeGame = function(characterData = null) {
    // Initialize game state
    window.gameState = {
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        morale: 75,
        experience: 0,
        level: 1,
        skillPoints: 0,
        time: 480, // Start at 8:00 AM (in minutes)
        weather: "clear",
        inBattle: false,
        equipmentDefense: 0,
        staminaPenalty: 0,
        visionPenalty: 0,
        blockChance: 0,
        mainQuest: { stage: 0, completed: false },
        sideQuests: [], // Initialize empty sideQuests array
        campaignIntroduced: false,
        currentCampaign: null,
        dailyPatrolDone: false,
        discoveredBrawlerPits: false,
        discoveredGamblingTent: false,
        awaitingCommanderReport: false
    };

    // Initialize or restore player data
    if (characterData) {
        // Preserve existing player object if it exists
        const existingPlayer = window.player || {};
        
        // Create new player object with character data
        window.player = {
            // Spread character data first
            ...characterData,
            // Preserve any existing properties not in character data
            ...existingPlayer,
            // Ensure equipment is properly initialized
            equipment: {
                ...(existingPlayer.equipment || {}),
                weapon: null,
                offhand: null,
                armor: null,
                helmet: null,
                amulet: null,
                ammo: null
            }
        };

        console.log("Player data after initialization:", {
            name: window.player.name,
            origin: window.player.origin,
            career: window.player.career,
            phy: window.player.phy,
            men: window.player.men,
            skills: window.player.skills
        });
    } else {
        // Only set default player data if no character data exists
        window.player = {
            name: "Player",
            phy: 5,
            men: 5,
            skills: {
                melee: 1,
                marksmanship: 1,
                survival: 1,
                tactics: 1
            },
            inventory: [],
            equipment: {
                weapon: null,
                offhand: null,
                armor: null,
                helmet: null,
                amulet: null,
                ammo: null
            }
        };
    }

    // Initialize inventory system
    if (typeof window.initializeItems === 'function') {
        window.initializeItems();
    }
    if (typeof window.initializeInventory === 'function') {
        window.initializeInventory();
    }

    // Initialize UI
    if (typeof window.initializeEquipmentUI === 'function') {
        window.initializeEquipmentUI();
    }

    // Update UI elements
    if (typeof window.updateStatusBars === 'function') {
        window.updateStatusBars();
    }
    if (typeof window.updateActionButtons === 'function') {
        window.updateActionButtons();
    }
    
    // Set initial narrative
    window.setNarrative("You begin your journey as a soldier in the borderlands.");
}; 