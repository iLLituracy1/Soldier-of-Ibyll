// enemies.js - Enemy template definitions for the combat system

/**
 * Enemy templates define the stats and behaviors of opponents in combat.
 * Each template is accessed by its key (e.g., ARRASI_VAELGORR) and used
 * to create enemy instances during combat.
 */

// Define enemy templates with stats, abilities, and equipment
window.ENEMY_TEMPLATES = {
  ARRASI_VAELGORR: {
    name: "Arrasi Vaelgorr",
    description: "Seasoned warriors who make up a large portion of the Arrasi shieldwall. Known to use spears and shields, and carry several javelins or throwing spears.",
    health: 90,
    maxHealth: 90,
    experienceValue: 20,
    lootTable: ["legionShield", "rations", "repair_kit"],
    lootChance: 0.3,
    
    // Combat attributes
    power: 9,
    accuracy: 10,
    speed: 8,
    defense: 12,
    counterSkill: 2,
    hasShield: true,
    blockChance: 20,
    armorPenetration: 5,
    
    // Preferred tactics
    preferredDistance: 2, // Starts at medium for javelin throws, then closes in
    preferredStance: "neutral",
    weaponRange: 2, // Can attack at medium range with thrown weapons
    
    // Equipment reference (for narrative purposes)
    weapon: "Thrusting Spear, Javelins",
    armor: "Chain vest over woolen underlayer.",
    ammunition: {
      javelin: {
        current: 3,
        max: 3,
        name: "Arrasi Javelin",
        damageBonus: 2
      }
    }
  },
  
  IMPERIAL_DESERTER: {
    name: "Imperial Deserter",
    description: "A former soldier of the Empire who has abandoned their post. Still equipped with military gear.",
    health: 100,
    maxHealth: 100,
    experienceValue: 25,
    lootTable: ["basic_sword", "legion_armor", "legion_helmet"],
    lootChance: 0.4,
    
    // Combat attributes
    power: 10,
    accuracy: 8,
    speed: 7,
    defense: 10,
    counterSkill: 1,
    hasShield: true,
    blockChance: 15,
    armorPenetration: 0,
    
    // Preferred tactics
    preferredDistance: 1,
    preferredStance: "defensive",
    weaponRange: 1,
    
    // Equipment reference
    weapon: "Paanic Military Sword",
    armor: "Legion Armor",
    ammunition: {
      javelin: {
        current: 1,
        max: 1,
        name: "Light Javelin",
        damageBonus: 0
      }
    }
  },
  
  ARRASI_DRUSKARI: {
    name: "Arrasi Druskari",
    description: "Heavy shock infantry, often exiled or sworn clansmen who have pledged their lives to the battlefield. Wield large hewing swords. Have a reputation for fighting until they are literally hacked apart.",
    health: 140,
    maxHealth: 140,
    experienceValue: 35,
    lootTable: ["royalGreatsword", "staminaPotion", "health_potion", "repair_kit"],
    lootChance: 0.35,
    
    // Combat attributes
    power: 14,
    accuracy: 7,
    speed: 6,
    defense: 8,
    counterSkill: 3,
    hasShield: false,
    armorPenetration: 20,
    
    // Preferred tactics
    preferredDistance: 1,
    preferredStance: "aggressive",
    weaponRange: 2,
    
    // Equipment reference
    weapon: "Massive Hewing Sword",
    armor: "Chainmail Hauberk"
  },


  ARRASI_HARNSKIR: {
    name: "Arrasi Harnskir",
    description: "Barely armored spearmen from rural clans, forming basic defensive lines.",
    health: 50,
    maxHealth: 50,
    experienceValue: 5,
    lootTable: ["legionShield", "rations", "repair_kit"],
    lootChance: 0.3,
    
    // Combat attributes
    power: 7,
    accuracy: 4,
    speed: 5,
    defense: 4,
    counterSkill: 1,
    hasShield: true,
    blockChance: 12,
    armorPenetration: 5,
    
    // Preferred tactics
    preferredDistance: 2, 
    preferredStance: "defensive",
    weaponRange: 2, 
    
    // Equipment reference (for narrative purposes)
    weapon: "Thrusting Spear",
    armor: "Basic Tunic",
  },

  ARRASI_GRYNDAL: {
    name: "Arrasi Gryndal",
    description: "Young, reckless warriors with makeshift weapons, often the first to charge in battle.",
    health: 60,
    maxHealth: 60,
    experienceValue: 5,
    lootTable: ["rations", "repair_kit"],
    lootChance: 0.2,
    
    // Combat attributes
    power: 9,
    accuracy: 4,
    speed: 8,
    defense: 3,
    counterSkill: 0,
    hasShield: false,
    blockChance: 0,
    armorPenetration: 5,
    
    // Preferred tactics
    preferredDistance: 1, 
    preferredStance: "aggressive",
    weaponRange: 1, 
    
    // Equipment reference (for narrative purposes)
    weapon: "Cragspike",
    armor: "Basic Tunic",
  },


  ARRASI_THARRKYN: {
    name: "Arrasi Tharrkyn",
    description: "Club-armed brutes who fight in loose bands, relying on brute force over finesse.",
    health: 65,
    maxHealth: 65,
    experienceValue: 5,
    lootTable: ["rations", "repair_kit"],
    lootChance: 0.2,
    
    // Combat attributes
    power: 11,
    accuracy: 3,
    speed: 6,
    defense: 5,
    counterSkill: 1,
    hasShield: true,
    blockChance: 8,
    armorPenetration: 10,
    
    // Preferred tactics
    preferredDistance: 1, 
    preferredStance: "aggressive",
    weaponRange: 1, 
    
    // Equipment reference (for narrative purposes)
    weapon: "Clubhammer",
    armor: "Layered Linen",
  }
};
