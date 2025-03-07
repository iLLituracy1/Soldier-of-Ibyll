// INVENTORY SYSTEM MODULE
// Handles items, inventory management, equipment slots, and related functionality

// Initialize the items database
window.items = window.items || {};

// Item categories and their properties
const ITEM_CATEGORIES = {
  WEAPON: {
    equippable: true,
    slot: "weapon",
    consumable: false,
    stackable: false
  },
  ARMOR: {
    equippable: true,
    slot: "armor",
    consumable: false,
    stackable: false
  },
  HELMET: {
    equippable: true,
    slot: "helmet",
    consumable: false,
    stackable: false
  },
  SHIELD: {
    equippable: true,
    slot: "offhand",
    consumable: false,
    stackable: false
  },
  AMULET: {
    equippable: true,
    slot: "amulet",
    consumable: false,
    stackable: false
  },
  AMMUNITION: {
    equippable: true,
    slot: "ammo",
    consumable: false,
    stackable: true
  },
  CONSUMABLE: {
    equippable: false,
    slot: null,
    consumable: true,
    stackable: true
  },
  QUEST_ITEM: {
    equippable: false,
    slot: null,
    consumable: false,
    stackable: false
  },
  MATERIAL: {
    equippable: false,
    slot: null,
    consumable: false,
    stackable: true
  }
};

// Weapon types and their properties
const WEAPON_TYPES = {
  SWORD: {
    attacks: ["slash", "stab"],
    range: 1,
    hands: 1,
    special: "parry"
  },
  CLEAVER: {
    attacks: ["chop", "heft"],
    range: 1,
    hands: 1,
    special: "bleed"
  },
  MACE: {
    attacks: ["crush", "swing"],
    range: 1,
    hands: 1,
    special: "stun"
  },
  AXE: {
    attacks: ["hack", "strike"],
    range: 1,
    hands: 1,
    special: "shield_break"
  },
  SPEAR: {
    attacks: ["thrust", "brace"],
    range: 2,
    hands: 1,
    special: "brace_for_charge"
  },
  GREATSWORD: {
    attacks: ["heavy_slash", "sweep"],
    range: 1,
    hands: 2,
    special: "cleave"
  },
  POLEARM: {
    attacks: ["thrust", "hook"],
    range: 2,
    hands: 2,
    special: "push_back"
  },
  BOW: {
    attacks: ["quick_shot", "aimed_shot"],
    range: 3,
    hands: 2,
    special: "mark_target",
    requiresAmmo: "arrow"
  },
  CROSSBOW: {
    attacks: ["shoot", "aimed_shot"],
    range: 3,
    hands: 2,
    special: "penetrate",
    requiresAmmo: "bolt"
  },
  MATCHLOCK: {
    attacks: ["fire", "overcharge"],
    range: 4,
    hands: 2,
    special: "deadly_aim",
    requiresAmmo: "powder"
  }
};

// Item initialization - define all items available in the game
function initializeItems() {
  // WEAPONS
  window.items.paanic_sword = {
    id: "paanic_sword",
    name: "Paanic Infantry Sword",
    description: "A slightly curved blade favored by Paanic infantry. Well-balanced for both cutting and thrusting.",
    category: "WEAPON",
    type: "SWORD",
    stats: {
      damage: [4, 7],
      toHit: 5,
      critChance: 10
    },
    value: 35,
    condition: 100,
    maxCondition: 100,
    durabilityLoss: 1,
    weight: 1.5,
    effects: [],
    requirements: {
      phy: 2,
      skills: {
        melee: 1
      }
    }
  };
  
  window.items.paanic_cleaver = {
    id: "paanic_cleaver",
    name: "Paanic Military Cleaver",
    description: "A heavy blade with forward weight, designed for chopping through enemies. Favored by Paanic assault troops.",
    category: "WEAPON",
    type: "CLEAVER",
    stats: {
      damage: [5, 9],
      toHit: 0,
      critChance: 5
    },
    value: 45,
    condition: 100,
    maxCondition: 100,
    durabilityLoss: 1,
    weight: 2.0,
    effects: [{
      type: "bleedChance",
      value: 20,
      description: "20% chance to cause bleeding"
    }],
    requirements: {
      phy: 4,
      skills: {
        melee: 2
      }
    }
  };
  
  window.items.nesian_matchlock = {
    id: "nesian_matchlock",
    name: "Nesian Matchlock Rifle",
    description: "A precision-built black powder weapon from Nesia, capable of deadly shots at long range.",
    category: "WEAPON",
    type: "MATCHLOCK",
    stats: {
      damage: [10, 15],
      toHit: -10,
      critChance: 15
    },
    value: 120,
    condition: 100,
    maxCondition: 100,
    durabilityLoss: 2,
    weight: 4.0,
    effects: [{
      type: "armorPenetration",
      value: 30,
      description: "Ignores 30% of armor"
    }],
    requirements: {
      phy: 3,
      skills: {
        marksmanship: 3
      }
    }
  };
  
  window.items.imperial_spear = {
    id: "imperial_spear",
    name: "Imperial Spear",
    description: "A standard-issue spear from the empire's armories. Excellent for keeping enemies at bay.",
    category: "WEAPON",
    type: "SPEAR",
    stats: {
      damage: [5, 8],
      toHit: 10,
      critChance: 5
    },
    value: 25,
    condition: 100,
    maxCondition: 100,
    durabilityLoss: 1,
    weight: 2.5,
    effects: [],
    requirements: {
      phy: 3,
      skills: {}
    }
  };
  
  // ARMOR
  window.items.paanic_mail = {
    id: "paanic_mail",
    name: "Paanic Mail Armor",
    description: "Standard-issue mail armor for Paanic regulars, offering good protection at a moderate weight.",
    category: "ARMOR",
    stats: {
      defense: 35,
      staminaPenalty: 5
    },
    value: 80,
    condition: 100,
    maxCondition: 100,
    durabilityLoss: 1,
    weight: 6.0,
    effects: [],
    requirements: {
      phy: 5
    }
  };
  
  window.items.nesian_breastplate = {
    id: "nesian_breastplate",
    name: "Nesian Officer's Breastplate",
    description: "A finely crafted steel breastplate worn by Nesian officers, offering excellent protection for vital areas.",
    category: "ARMOR",
    stats: {
      defense: 50,
      staminaPenalty: 10
    },
    value: 150,
    condition: 100,
    maxCondition: 100,
    durabilityLoss: 1,
    weight: 8.0,
    effects: [],
    requirements: {
      phy: 7
    }
  };
  
  // HELMETS
  window.items.paanic_helmet = {
    id: "paanic_helmet",
    name: "Paanic Infantry Helmet",
    description: "A simple steel helmet with cheek guards, standard issue for Paanic infantry.",
    category: "HELMET",
    stats: {
      defense: 20,
      visionPenalty: 0
    },
    value: 40,
    condition: 100,
    maxCondition: 100,
    durabilityLoss: 1,
    weight: 1.5,
    effects: [],
    requirements: {}
  };
  
  // SHIELDS
  window.items.wooden_shield = {
    id: "wooden_shield",
    name: "Wooden Shield",
    description: "A simple round shield made of wood with a metal boss and rim. Provides decent protection.",
    category: "SHIELD",
    stats: {
      defense: 15,
      blockChance: 30,
      staminaPenalty: 5
    },
    value: 30,
    condition: 100,
    maxCondition: 100,
    durabilityLoss: 2,
    weight: 3.0,
    effects: [],
    requirements: {
      phy: 3
    }
  };
  
  // AMULETS
  window.items.valor_medallion = {
    id: "valor_medallion",
    name: "Medallion of Valor",
    description: "A bronze medallion bestowed upon soldiers who have shown exceptional bravery. Seems to boost confidence.",
    category: "AMULET",
    stats: {},
    value: 50,
    condition: 100,
    maxCondition: 100,
    durabilityLoss: 0,
    weight: 0.1,
    effects: [{
      type: "moraleBoost",
      value: 10,
      description: "+10 to morale"
    }],
    requirements: {}
  };
  
  // AMMUNITION
  window.items.powder_pouch = {
    id: "powder_pouch",
    name: "Black Powder Pouch",
    description: "A leather pouch containing black powder charges, shot, and wadding for matchlock rifles.",
    category: "AMMUNITION",
    ammoType: "powder",
    quantity: 10,
    maxQuantity: 20,
    value: 15,
    weight: 0.5,
    effects: [],
    requirements: {}
  };
  
  window.items.quiver = {
    id: "quiver",
    name: "Arrow Quiver",
    description: "A leather quiver containing arrows for bows.",
    category: "AMMUNITION",
    ammoType: "arrow",
    quantity: 20,
    maxQuantity: 30,
    value: 10,
    weight: 0.5,
    effects: [],
    requirements: {}
  };
  
  // CONSUMABLES
  window.items.healing_poultice = {
    id: "healing_poultice",
    name: "Healing Poultice",
    description: "A medicinal herb mixture that accelerates healing when applied to wounds.",
    category: "CONSUMABLE",
    stats: {},
    value: 15,
    quantity: 1,
    maxQuantity: 5,
    weight: 0.2,
    effects: [{
      type: "heal",
      value: 25,
      description: "Heals 25 health points"
    }],
    requirements: {}
  };
  
  window.items.stamina_draught = {
    id: "stamina_draught",
    name: "Stamina Draught",
    description: "A bitter herbal concoction that revitalizes tired muscles and clears the mind.",
    category: "CONSUMABLE",
    stats: {},
    value: 20,
    quantity: 1,
    maxQuantity: 5,
    weight: 0.2,
    effects: [{
      type: "restoreStamina",
      value: 30,
      description: "Restores 30 stamina points"
    }],
    requirements: {}
  };
  
  window.items.morale_wine = {
    id: "morale_wine",
    name: "Spiced Wine",
    description: "A fine vintage spiced with exotic herbs. Drinking it improves morale but may dull the senses.",
    category: "CONSUMABLE",
    stats: {},
    value: 25,
    quantity: 1,
    maxQuantity: 3,
    weight: 0.5,
    effects: [
      {
        type: "moraleBoost",
        value: 15,
        description: "+15 to morale"
      },
      {
        type: "staminaPenalty",
        value: -5,
        description: "-5 to stamina"
      }
    ],
    requirements: {}
  };
  
  // QUEST ITEMS
  window.items.command_orders = {
    id: "command_orders",
    name: "Sealed Command Orders",
    description: "A sealed scroll containing orders from high command. The wax seal bears the mark of the Paanic Empire.",
    category: "QUEST_ITEM",
    value: 0,
    weight: 0.1,
    effects: [],
    requirements: {}
  };
  
  // MATERIALS
  window.items.leather_scraps = {
    id: "leather_scraps",
    name: "Leather Scraps",
    description: "Pieces of cured leather that can be used for repairs or crafting.",
    category: "MATERIAL",
    value: 5,
    quantity: 1,
    maxQuantity: 10,
    weight: 0.2,
    effects: [],
    requirements: {}
  };
  
  window.items.metal_fragments = {
    id: "metal_fragments",
    name: "Metal Fragments",
    description: "Broken pieces of metal that could be melted down for repairs or crafting.",
    category: "MATERIAL",
    value: 8,
    quantity: 1,
    maxQuantity: 10,
    weight: 0.3,
    effects: [],
    requirements: {}
  };
}

// Initialize the player's inventory
window.initializeInventory = function() {
  // Make sure we've defined all the items
  initializeItems();
  
  // Set up initial inventory if not already set
  if (!window.player.inventory) {
    window.player.inventory = [];
  }
  
  // Set up equipment slots if not already set
  if (!window.player.equipment) {
    window.player.equipment = {
      weapon: null,  // Main hand weapon
      offhand: null, // Shield or offhand weapon
      armor: null,   // Body armor
      helmet: null,  // Head protection
      amulet: null,  // Accessory
      ammo: null     // Ammunition
    };
  }
  
  // Add starting equipment based on career
  if (window.player.career) {
    addStartingEquipment(window.player.career.title);
  }
};

// Add starting equipment based on career
function addStartingEquipment(career) {
  // Default starter set
  let starterWeapon = null;
  let starterArmor = null;
  let starterHelmet = null;
  let starterOffhand = null;
  let starterAmmo = null;
  
  // Career-specific equipment
  switch (career) {
    case "Paanic Regular":
      starterWeapon = "paanic_sword";
      starterArmor = "paanic_mail";
      starterHelmet = "paanic_helmet";
      starterOffhand = "wooden_shield";
      break;
    
    case "Nesian Scout":
      starterWeapon = "nesian_matchlock";
      starterArmor = "paanic_mail";
      starterAmmo = "powder_pouch";
      break;
    
    case "Geister Initiate":
      starterWeapon = "paanic_cleaver";
      starterArmor = "paanic_mail";
      // Special Geister amulet would go here
      break;
    
    case "Lunarine Sellsword":
      starterWeapon = "paanic_cleaver";
      starterArmor = "paanic_mail";
      starterOffhand = "wooden_shield";
      break;
    
    case "Berserker":
      starterWeapon = "imperial_spear";
      // Lighter armor for Berserkers
      break;
      
    // Add more cases for other careers
      
    default:
      // Default equipment for any other career
      starterWeapon = "paanic_sword";
      starterArmor = "paanic_mail";
      break;
  }
  
  // Add the items to inventory and equip them
  if (starterWeapon && window.items[starterWeapon]) {
    addToInventory(window.items[starterWeapon]);
    equipItem(starterWeapon);
  }
  
  if (starterArmor && window.items[starterArmor]) {
    addToInventory(window.items[starterArmor]);
    equipItem(starterArmor);
  }
  
  if (starterHelmet && window.items[starterHelmet]) {
    addToInventory(window.items[starterHelmet]);
    equipItem(starterHelmet);
  }
  
  if (starterOffhand && window.items[starterOffhand]) {
    addToInventory(window.items[starterOffhand]);
    equipItem(starterOffhand);
  }
  
  if (starterAmmo && window.items[starterAmmo]) {
    addToInventory(window.items[starterAmmo]);
    equipItem(starterAmmo);
  }
  
  // Add some common consumables
  addToInventory(window.items.healing_poultice);
  addToInventory(window.items.stamina_draught);
}

// Add an item to inventory
window.addToInventory = function(item) {
  // Check for stackable items
  if (item.category === "CONSUMABLE" || item.category === "AMMUNITION" || item.category === "MATERIAL") {
    // Look for an existing stack of this item
    const existingItem = window.player.inventory.find(i => i.id === item.id);
    
    if (existingItem) {
      // Add to existing stack, up to maximum
      existingItem.quantity = Math.min(existingItem.maxQuantity || 99, (existingItem.quantity || 1) + (item.quantity || 1));
      return true;
    }
  }
  
  // Check inventory capacity (arbitrary limit of 20 items)
  if (window.player.inventory.length >= 20) {
    window.showNotification("Inventory is full!", "warning");
    return false;
  }
  
  // Clone the item before adding it to inventory to avoid reference issues
  const itemCopy = JSON.parse(JSON.stringify(item));
  
  // Add the item
  window.player.inventory.push(itemCopy);
  return true;
};

// Remove an item from inventory
window.removeFromInventory = function(itemId) {
  const itemIndex = window.player.inventory.findIndex(item => item.id === itemId);
  if (itemIndex !== -1) {
    // If item is equipped, unequip it first
    if (isItemEquipped(itemId)) {
      unequipItem(itemId);
    }
    
    window.player.inventory.splice(itemIndex, 1);
    return true;
  }
  return false;
};

// Equip an item from inventory
window.equipItem = function(itemId) {
  const item = window.player.inventory.find(item => item.id === itemId);
  if (!item) return false;
  
  // Check if the item is equippable
  const categoryProps = ITEM_CATEGORIES[item.category];
  if (!categoryProps || !categoryProps.equippable) return false;
  
  // Check item requirements
  if (!meetRequirements(item)) {
    window.showNotification(`You don't meet the requirements for ${item.name}`, "warning");
    return false;
  }
  
  // Get the equipment slot for this item
  const slot = categoryProps.slot;
  
  // Special handling for 2-handed weapons
  if (item.category === "WEAPON" && WEAPON_TYPES[item.type].hands === 2) {
    // If equipping a 2H weapon, we need to unequip anything in offhand
    if (window.player.equipment.offhand) {
      unequipItem(window.player.equipment.offhand.id);
    }
  }
  
  // If there's already an item in this slot, unequip it first
  if (window.player.equipment[slot]) {
    unequipItem(window.player.equipment[slot].id);
  }
  
  // Handle offhand restriction if a 2H weapon is equipped
  if (slot === "offhand" && window.player.equipment.weapon) {
    const mainWeapon = window.player.equipment.weapon;
    if (mainWeapon.category === "WEAPON" && WEAPON_TYPES[mainWeapon.type].hands === 2) {
      window.showNotification("Cannot equip an offhand item while wielding a two-handed weapon", "warning");
      return false;
    }
  }
  
  // Equip the item (copy the item to equipment slot)
  window.player.equipment[slot] = item;
  
  // Update player stats
  updateEquipmentStats();
  
  return true;
};

// Unequip an item
window.unequipItem = function(itemId) {
  // Find the slot that has this item
  let slotToEmpty = null;
  
  for (const [slot, equippedItem] of Object.entries(window.player.equipment)) {
    if (equippedItem && equippedItem.id === itemId) {
      slotToEmpty = slot;
      break;
    }
  }
  
  if (slotToEmpty) {
    // Remove the item from the equipment slot
    window.player.equipment[slotToEmpty] = null;
    
    // Update player stats
    updateEquipmentStats();
    
    return true;
  }
  
  return false;
};

// Check if an item is currently equipped
window.isItemEquipped = function(itemId) {
  return Object.values(window.player.equipment).some(item => item && item.id === itemId);
};

// Check if player meets the requirements for an item
function meetRequirements(item) {
  // Check physical requirements
  if (item.requirements.phy && window.player.phy < item.requirements.phy) {
    return false;
  }
  
  // Check skill requirements
  if (item.requirements.skills) {
    for (const [skill, value] of Object.entries(item.requirements.skills)) {
      if (window.player.skills[skill] < value) {
        return false;
      }
    }
  }
  
  return true;
}

// Update player stats based on equipped items
function updateEquipmentStats() {
  // Reset equipment-based stats
  window.gameState.equipmentDefense = 0;
  window.gameState.staminaPenalty = 0;
  window.gameState.visionPenalty = 0;
  window.gameState.blockChance = 0;
  
  // Process each equipped item
  Object.values(window.player.equipment).forEach(item => {
    if (!item) return;
    
    // Add defense from armor, helmet, shield
    if (item.stats && item.stats.defense) {
      window.gameState.equipmentDefense += item.stats.defense;
    }
    
    // Add block chance from shields or other items
    if (item.stats && item.stats.blockChance) {
      window.gameState.blockChance += item.stats.blockChance;
    }
    
    // Add stamina penalties
    if (item.stats && item.stats.staminaPenalty) {
      window.gameState.staminaPenalty += item.stats.staminaPenalty;
    }
    
    // Add vision penalties
    if (item.stats && item.stats.visionPenalty) {
      window.gameState.visionPenalty += item.stats.visionPenalty;
    }
    
    // Process effects
    if (item.effects) {
      item.effects.forEach(effect => {
        // Handle item effects
        // This would be expanded based on effect types
        if (effect.type === "moraleBoost") {
          window.gameState.moraleBonus = (window.gameState.moraleBonus || 0) + effect.value;
        }
      });
    }
  });
  
  // Update UI to reflect new stats
  if (typeof window.updateProfileIfVisible === 'function') {
    window.updateProfileIfVisible();
  }
  
  if (typeof window.updateStatusBars === 'function') {
    window.updateStatusBars();
  }
}

// Use a consumable item
window.useConsumable = function(itemId) {
  const item = window.player.inventory.find(item => item.id === itemId);
  if (!item || item.category !== "CONSUMABLE") return false;
  
  // Process effects
  if (item.effects) {
    let effectMessage = `You use ${item.name}. `;
    
    item.effects.forEach(effect => {
      switch (effect.type) {
        case "heal":
          window.gameState.health = Math.min(window.gameState.maxHealth, window.gameState.health + effect.value);
          effectMessage += `Healed ${effect.value} health. `;
          break;
          
        case "restoreStamina":
          window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + effect.value);
          effectMessage += `Restored ${effect.value} stamina. `;
          break;
          
        case "moraleBoost":
          window.gameState.morale = Math.min(100, window.gameState.morale + effect.value);
          effectMessage += `Boosted morale by ${effect.value}. `;
          break;
          
        // Add more effects as needed
      }
    });
    
    // Show result notification
    window.showNotification(effectMessage, "success");
    
    // Update UI
    window.updateStatusBars();
  }
  
  // Reduce quantity or remove item
  if (item.quantity > 1) {
    item.quantity--;
  } else {
    removeFromInventory(itemId);
  }
  
  return true;
};

// Check if weapon has enough ammunition
window.hasEnoughAmmo = function() {
  const weapon = window.player.equipment.weapon;
  if (!weapon || weapon.category !== "WEAPON") return true;
  
  // Check if weapon requires ammo
  const weaponType = WEAPON_TYPES[weapon.type];
  if (!weaponType || !weaponType.requiresAmmo) return true;
  
  // Get required ammo type
  const requiredAmmo = weaponType.requiresAmmo;
  
  // Check if player has the ammo equipped
  const ammo = window.player.equipment.ammo;
  if (!ammo || ammo.ammoType !== requiredAmmo || ammo.quantity <= 0) {
    return false;
  }
  
  return true;
};

// Consume ammunition for a ranged attack
window.consumeAmmo = function() {
  const ammo = window.player.equipment.ammo;
  if (!ammo) return false;
  
  // Reduce ammo count
  ammo.quantity--;
  
  // Remove ammo if depleted
  if (ammo.quantity <= 0) {
    window.player.equipment.ammo = null;
    
    // Find and remove from inventory
    const ammoIndex = window.player.inventory.findIndex(item => item.id === ammo.id);
    if (ammoIndex !== -1) {
      window.player.inventory.splice(ammoIndex, 1);
    }
    
    window.showNotification("You've run out of ammunition!", "warning");
  }
  
  return true;
};

// Get available combat actions based on equipped weapon
window.getWeaponActions = function() {
  const weapon = window.player.equipment.weapon;
  
  if (!weapon || weapon.category !== "WEAPON") {
    // Unarmed attacks if no weapon
    return [{
      id: "unarmed_strike",
      name: "Unarmed Strike",
      damage: [1, 3],
      toHit: 0,
      actionPoints: 4,
      range: 1,
      description: "A basic unarmed attack"
    }];
  }
  
  // Get weapon type properties
  const weaponType = WEAPON_TYPES[weapon.type];
  if (!weaponType) return [];
  
  // Build available actions
  const actions = [];
  
  // Add basic attacks based on weapon type
  weaponType.attacks.forEach((attackType, index) => {
    // Configuration for different attack types
    const attackConfig = {
      slash: { name: "Slash", damage: 0, toHit: 5, actionPoints: 4 },
      stab: { name: "Stab", damage: -1, toHit: 10, actionPoints: 3 },
      chop: { name: "Chop", damage: 1, toHit: 0, actionPoints: 5 },
      heft: { name: "Hefty Swing", damage: 2, toHit: -10, actionPoints: 6 },
      crush: { name: "Crush", damage: 1, toHit: 0, actionPoints: 5 },
      swing: { name: "Swing", damage: 0, toHit: 5, actionPoints: 4 },
      hack: { name: "Hack", damage: 1, toHit: 0, actionPoints: 5 },
      strike: { name: "Strike", damage: 0, toHit: 5, actionPoints: 4 },
      thrust: { name: "Thrust", damage: 0, toHit: 5, actionPoints: 4 },
      brace: { name: "Brace", damage: 1, toHit: 0, actionPoints: 6 },
      heavy_slash: { name: "Heavy Slash", damage: 2, toHit: -5, actionPoints: 6 },
      sweep: { name: "Sweep", damage: 1, toHit: -10, actionPoints: 5 },
      hook: { name: "Hook", damage: 0, toHit: 0, actionPoints: 5 },
      quick_shot: { name: "Quick Shot", damage: -1, toHit: -5, actionPoints: 4 },
      aimed_shot: { name: "Aimed Shot", damage: 1, toHit: 10, actionPoints: 6 },
      shoot: { name: "Shoot", damage: 0, toHit: 0, actionPoints: 5 },
      fire: { name: "Fire", damage: 0, toHit: 0, actionPoints: 5 },
      overcharge: { name: "Overcharge", damage: 3, toHit: -15, actionPoints: 7 }
    };
    
    // Get configuration for this attack type
    const config = attackConfig[attackType] || { name: "Attack", damage: 0, toHit: 0, actionPoints: 4 };
    
    // Calculate damage range
    const baseDamageLow = weapon.stats.damage[0];
    const baseDamageHigh = weapon.stats.damage[1];
    const damageLow = Math.max(1, baseDamageLow + config.damage);
    const damageHigh = Math.max(damageLow + 1, baseDamageHigh + config.damage);
    
    // Add the attack to available actions
    actions.push({
      id: `${weapon.type.toLowerCase()}_${attackType}`,
      name: config.name,
      damage: [damageLow, damageHigh],
      toHit: weapon.stats.toHit + config.toHit,
      actionPoints: config.actionPoints,
      range: weaponType.range,
      description: `${config.name} attack with your ${weapon.name}`
    });
  });
  
  // Add special ability if available
  if (weaponType.special) {
    // Configuration for special abilities
    const specialConfig = {
      parry: {
        name: "Parry",
        description: "Enter a defensive stance that increases chance to parry incoming attacks",
        actionPoints: 2,
        effect: "defense"
      },
      bleed: {
        name: "Rending Strike",
        description: "A devastating attack with high chance to cause bleeding",
        actionPoints: 5,
        effect: "offense"
      },
      stun: {
        name: "Stunning Blow",
        description: "A heavy strike aimed to stun your opponent",
        actionPoints: 5,
        effect: "offense"
      },
      shield_break: {
        name: "Shield Breaker",
        description: "A powerful attack designed to damage shields and armor",
        actionPoints: 5,
        effect: "offense"
      },
      brace_for_charge: {
        name: "Brace for Charge",
        description: "Set your spear to receive a charging enemy",
        actionPoints: 3,
        effect: "defense"
      },
      cleave: {
        name: "Cleaving Strike",
        description: "A wide attack that can hit multiple enemies",
        actionPoints: 6,
        effect: "offense"
      },
      push_back: {
        name: "Push Back",
        description: "Use your weapon to push enemies away",
        actionPoints: 4,
        effect: "utility"
      },
      mark_target: {
        name: "Mark Target",
        description: "Designate a target for increased accuracy on your next shot",
        actionPoints: 3,
        effect: "utility"
      },
      penetrate: {
        name: "Armor Piercing Shot",
        description: "A carefully aimed shot designed to penetrate armor",
        actionPoints: 6,
        effect: "offense"
      },
      deadly_aim: {
        name: "Deadly Aim",
        description: "Take extra time to aim for a devastating shot",
        actionPoints: 7,
        effect: "offense"
      }
    };
    
    // Get configuration for this special ability
    const specialAbility = specialConfig[weaponType.special];
    
    if (specialAbility) {
      actions.push({
        id: `${weapon.type.toLowerCase()}_${weaponType.special}`,
        name: specialAbility.name,
        actionPoints: specialAbility.actionPoints,
        range: weaponType.range,
        description: specialAbility.description,
        isSpecial: true,
        effectType: specialAbility.effect
      });
    }
  }
  
  return actions;
};

// Get actions available from equipped shield
window.getShieldActions = function() {
  const shield = window.player.equipment.offhand;
  
  if (!shield || shield.category !== "SHIELD") {
    return [];
  }
  
  // Basic shield actions
  return [
    {
      id: "shield_block",
      name: "Shield Block",
      actionPoints: 2,
      description: "Raise your shield to block incoming attacks",
      isSpecial: true,
      effectType: "defense"
    },
    {
      id: "shield_bash",
      name: "Shield Bash",
      damage: [1, 3],
      toHit: 0,
      actionPoints: 5,
      range: 1,
      description: "Strike your opponent with your shield, potentially stunning them"
    }
  ];
};

// Get all available combat actions
window.getCombatActions = function() {
  // Combine weapon and shield actions
  const weaponActions = window.getWeaponActions();
  const shieldActions = window.getShieldActions();
  
  // Common actions always available
  const commonActions = [
    {
      id: "dodge",
      name: "Dodge",
      actionPoints: 3,
      description: "Attempt to dodge an incoming attack",
      isSpecial: true,
      effectType: "defense"
    },
    {
      id: "brace",
      name: "Brace",
      actionPoints: 2,
      description: "Brace yourself to reduce incoming damage",
      isSpecial: true,
      effectType: "defense"
    }
  ];
  
  return [...weaponActions, ...shieldActions, ...commonActions];
};

// Function to display inventory in the UI
window.displayInventory = function() {
  const inventoryList = document.getElementById('inventoryList');
  if (!inventoryList) return;
  
  // Clear current display
  inventoryList.innerHTML = `<div class="inventory-coins">${window.player.taelors || 0} Taelors</div>`;
  
  // Group items by category
  const groupedItems = {};
  
  window.player.inventory.forEach(item => {
    if (!groupedItems[item.category]) {
      groupedItems[item.category] = [];
    }
    groupedItems[item.category].push(item);
  });
  
  // Create category headers in a specific order
  const categoryOrder = ["WEAPON", "ARMOR", "HELMET", "SHIELD", "AMULET", "AMMUNITION", "CONSUMABLE", "QUEST_ITEM", "MATERIAL"];
  
  categoryOrder.forEach(category => {
    if (groupedItems[category] && groupedItems[category].length > 0) {
      // Add category header
      const categoryHeader = document.createElement('h4');
      categoryHeader.textContent = category.charAt(0) + category.slice(1).toLowerCase() + 's';
      categoryHeader.style.borderBottom = '1px solid #444';
      categoryHeader.style.paddingBottom = '5px';
      categoryHeader.style.marginTop = '15px';
      inventoryList.appendChild(categoryHeader);
      
      // Add items in this category
      groupedItems[category].forEach(item => {
        // Create item container
        const itemContainer = document.createElement('div');
        itemContainer.className = 'inventory-item';
        
        // Create item info section
        const itemInfo = document.createElement('div');
        
        // Item name (with equipped indicator)
        const itemName = document.createElement('div');
        itemName.className = 'inventory-item-name';
        itemName.textContent = item.name + (isItemEquipped(item.id) ? ' (Equipped)' : '');
        itemInfo.appendChild(itemName);
        
        // Item description
        const itemDesc = document.createElement('div');
        itemDesc.className = 'inventory-item-description';
        itemDesc.textContent = item.description;
        itemInfo.appendChild(itemDesc);
        
        // Item details (varies by type)
        if (item.category === "WEAPON") {
          const itemStats = document.createElement('div');
          itemStats.className = 'inventory-item-stats';
          itemStats.textContent = `Damage: ${item.stats.damage[0]}-${item.stats.damage[1]}, To Hit: ${item.stats.toHit > 0 ? '+' : ''}${item.stats.toHit}%`;
          itemInfo.appendChild(itemStats);
        } else if (item.category === "ARMOR" || item.category === "HELMET") {
          const itemStats = document.createElement('div');
          itemStats.className = 'inventory-item-stats';
          itemStats.textContent = `Defense: ${item.stats.defense}`;
          itemInfo.appendChild(itemStats);
        } else if (item.category === "SHIELD") {
          const itemStats = document.createElement('div');
          itemStats.className = 'inventory-item-stats';
          itemStats.textContent = `Defense: ${item.stats.defense}, Block: ${item.stats.blockChance}%`;
          itemInfo.appendChild(itemStats);
        } else if (item.category === "CONSUMABLE" || item.category === "AMMUNITION" || item.category === "MATERIAL") {
          const itemQuantity = document.createElement('div');
          itemQuantity.className = 'inventory-item-quantity';
          itemQuantity.textContent = `Quantity: ${item.quantity || 1}`;
          itemInfo.appendChild(itemQuantity);
        }
        
        // Add info section to item container
        itemContainer.appendChild(itemInfo);
        
        // Create actions section
        const itemActions = document.createElement('div');
        itemActions.className = 'inventory-item-actions';
        
        // Add appropriate action buttons
        if (ITEM_CATEGORIES[item.category].equippable) {
          if (isItemEquipped(item.id)) {
            // Unequip button
            const unequipBtn = document.createElement('button');
            unequipBtn.className = 'action-btn';
            unequipBtn.textContent = 'Unequip';
            unequipBtn.onclick = function() {
              unequipItem(item.id);
              window.displayInventory(); // Refresh display
            };
            itemActions.appendChild(unequipBtn);
          } else {
            // Equip button
            const equipBtn = document.createElement('button');
            equipBtn.className = 'action-btn';
            equipBtn.textContent = 'Equip';
            equipBtn.onclick = function() {
              equipItem(item.id);
              window.displayInventory(); // Refresh display
            };
            itemActions.appendChild(equipBtn);
          }
        }
        
        if (item.category === "CONSUMABLE") {
          // Use button for consumables
          const useBtn = document.createElement('button');
          useBtn.className = 'action-btn';
          useBtn.textContent = 'Use';
          useBtn.onclick = function() {
            useConsumable(item.id);
            window.displayInventory(); // Refresh display
          };
          itemActions.appendChild(useBtn);
        }
        
        // Drop button for all items
        const dropBtn = document.createElement('button');
        dropBtn.className = 'action-btn';
        dropBtn.textContent = 'Drop';
        dropBtn.onclick = function() {
          if (confirm(`Are you sure you want to drop ${item.name}?`)) {
            removeFromInventory(item.id);
            window.displayInventory(); // Refresh display
          }
        };
        itemActions.appendChild(dropBtn);
        
        // Add actions section to item container
        itemContainer.appendChild(itemActions);
        
        // Add the complete item entry to inventory list
        inventoryList.appendChild(itemContainer);
      });
    }
  });
  
  // Show empty inventory message if no items
  if (window.player.inventory.length === 0) {
    inventoryList.innerHTML += '<p>Your inventory is empty.</p>';
  }
};

// Export functions for external use
window.inventorySystem = {
  initializeItems,
  initializeInventory,
  addToInventory,
  removeFromInventory,
  equipItem,
  unequipItem,
  useConsumable,
  displayInventory,
  getWeaponActions,
  getShieldActions,
  getCombatActions,
  hasEnoughAmmo,
  consumeAmmo
};

// Make sure constants are available globally
window.ITEM_CATEGORIES = ITEM_CATEGORIES;
window.WEAPON_TYPES = WEAPON_TYPES;

console.log("Inventory System loaded successfully");
