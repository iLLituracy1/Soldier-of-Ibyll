// allies.js - Ally template definitions for the combat system

/**
 * ALLY TEMPLATE GUIDE
 * 
 * Each ally template should have the following structure:
 * 
 * {
 *   name: "Ally Name",                    // Display name of the ally
 *   description: "Ally description",      // Brief description for flavor text
 *   health: 100,                          // Starting health
 *   maxHealth: 100,                       // Maximum health
 *   
 *   // Combat attributes
 *   power: 8,                             // Base damage output
 *   accuracy: 8,                          // Accuracy in combat (affects hit chance)
 *   speed: 7,                             // Initiative and reaction speed
 *   defense: 10,                          // Damage reduction
 *   counterSkill: 1,                      // Ability to counter-attack (0-3)
 *   hasShield: true,                      // Whether ally has a shield
 *   blockChance: 20,                      // Chance to block attacks with shield
 *   armorPenetration: 0,                  // Ability to bypass enemy armor
 *   
 *   // Preferred tactics
 *   preferredDistance: 1,                 // Preferred combat distance (0-3)
 *   preferredStance: "neutral",           // Default stance (neutral, aggressive, defensive)
 *   weaponRange: 1,                       // Maximum weapon reach
 *   
 *   // Equipment reference (for narrative purposes)
 *   weapon: "Military Sword",             // Primary weapon
 *   armor: "Legion Armor",                // Armor description
 *   
 *   // Optional: ammunition
 *   ammunition: {                         // Only include if ally uses ammunition
 *     javelin: {
 *       current: 2,                       // Current ammunition count
 *       max: 2,                           // Maximum ammunition capacity
 *       name: "Light Javelin",            // Ammunition name
 *       damageBonus: 0                    // Additional damage bonus
 *     }
 *   }
 * }
 */

// Define ally templates with stats, abilities, and equipment
window.ALLY_TEMPLATES = {
  PAANIC_REGULAR: {
    name: "Paanic Regular",
    description: "A disciplined soldier of the Paanic Empire, trained in shield formations and melee combat.",
    health: 100,
    maxHealth: 100,
    
    // Combat attributes
    power: 8,
    accuracy: 8,
    speed: 7,
    defense: 10,
    counterSkill: 1,
    hasShield: true,
    blockChance: 20,
    armorPenetration: 0,
    
    // Preferred tactics
    preferredDistance: 1,
    preferredStance: "neutral",
    weaponRange: 1,
    
    // Equipment reference
    weapon: "Military Sword",
    armor: "Legion Armor",
    
    // Optional ammunition
    ammunition: {
      javelin: {
        current: 2,
        max: 2,
        name: "Light Javelin",
        damageBonus: 0
      }
    }
  }
};