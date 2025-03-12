// ITEM SYSTEM MODULE
// Defines item templates, categories, and functionality

// Item Categories
window.ITEM_CATEGORIES = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  ACCESSORY: 'accessory',
  CONSUMABLE: 'consumable',
  MATERIAL: 'material',
  AMMUNITION:'ammunition',
  QUEST: 'quest'
};

// Equipment Slots
window.EQUIPMENT_SLOTS = {
  HEAD: 'head',
  BODY: 'body',
  MAIN_HAND: 'mainHand',
  OFF_HAND: 'offHand',
  ACCESSORY: 'accessory',
  AMMUNITION: 'ammunition',
  MOUNT:  'mount'
};

// Item Rarities with color codes
window.ITEM_RARITIES = {
  COMMON: { name: 'Common', color: '#aaaaaa', multiplier: 1.0, symbol: '●' },
  UNCOMMON: { name: 'Uncommon', color: '#00aa00', multiplier: 1.5, symbol: '◆' },
  RARE: { name: 'Rare', color: '#0066ff', multiplier: 2.5, symbol: '★' },
  EPIC: { name: 'Epic', color: '#aa00aa', multiplier: 4.0, symbol: '✧' },
  LEGENDARY: { name: 'Legendary', color: '#ff9900', multiplier: 6.0, symbol: '✦' },
  UNIQUE: { name: 'Unique', color: '#aa0000', multiplier: 10.0, symbol: '❖' }
};

// Item Symbols (instead of custom icons)
window.ITEM_SYMBOLS = {
  // Weapons
  SWORD: '⚔️',
  SPEAR: '🔱',
  AXE: '🪓',
  BOW: '🏹',
  STAFF: '🪄',
  MACE: '🔨',
  DAGGER: '🗡️',
  SHIELD: '🛡️',
  CROSSBOW: '⚔️', // No specific emoji, reuse sword
  RIFLE: '🔫',
  
  // Armor
  HELMET: '⛑️',
  CHEST: '👕',
  GLOVES: '🧤',
  BOOTS: '👢',
  
  // Accessories
  AMULET: '📿',
  RING: '💍',
  
  // Consumables
  POTION: '🧪',
  FOOD: '🍖',
  SCROLL: '📜',
  
  // Materials
  METAL: '🧲',
  PLANT: '🌿',
  GEM: '💎',
  
  // Quest
  QUEST: '❗',
  
  // Mounts
  MOUNT: '🐎',
  WARHORSE: '🐎',
  CHARGER: '🐎',
  CONSTRUCT: '🤖'
};

// Add mount type
window.MOUNT_TYPES = {
  WARHORSE: { name: 'Warhorse', symbol: window.ITEM_SYMBOLS.WARHORSE, slot: window.EQUIPMENT_SLOTS.MOUNT },
  CHARGER: { name: 'Charger', symbol: window.ITEM_SYMBOLS.CHARGER, slot: window.EQUIPMENT_SLOTS.MOUNT },
  CONSTRUCT: { name: 'Construct', symbol: window.ITEM_SYMBOLS.CONSTRUCT, slot: window.EQUIPMENT_SLOTS.MOUNT }
};

// Weapon Types
window.WEAPON_TYPES = {
  SWORD: { name: 'Sword', symbol: window.ITEM_SYMBOLS.SWORD, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 1 },
  GREATSWORD: { name: 'Greatsword', symbol: window.ITEM_SYMBOLS.SWORD, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 2 },
  SPEAR: { name: 'Spear', symbol: window.ITEM_SYMBOLS.SPEAR, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 2 },
  AXE: { name: 'Axe', symbol: window.ITEM_SYMBOLS.AXE, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 1 },
  BATTLEAXE: { name: 'Battle Axe', symbol: window.ITEM_SYMBOLS.AXE, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 2 },
  BOW: { name: 'Bow', symbol: window.ITEM_SYMBOLS.BOW, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 2 },
  CROSSBOW: { name: 'Crossbow', symbol: window.ITEM_SYMBOLS.CROSSBOW, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 2 },
  DAGGER: { name: 'Dagger', symbol: window.ITEM_SYMBOLS.DAGGER, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 1 },
  SHIELD: { name: 'Shield', symbol: window.ITEM_SYMBOLS.SHIELD, slot: window.EQUIPMENT_SLOTS.OFF_HAND, hands: 1 },
  RIFLE: { name: 'Rifle', symbol: window.ITEM_SYMBOLS.RIFLE, slot: window.EQUIPMENT_SLOTS.MAIN_HAND, hands: 2 }
};

// Armor Types
window.ARMOR_TYPES = {
  LIGHT: { name: 'Light Armor', protection: 'low', mobility: 'high' },
  MEDIUM: { name: 'Medium Armor', protection: 'medium', mobility: 'medium' },
  HEAVY: { name: 'Heavy Armor', protection: 'high', mobility: 'low' }
};

// Item Template constructor
window.createItemTemplate = function(config) {
  return {
    id: config.id || `item_${Date.now()}`,
    name: config.name || 'Unknown Item',
    description: config.description || 'No description available.',
    category: config.category || window.ITEM_CATEGORIES.MATERIAL,
    rarity: config.rarity || window.ITEM_RARITIES.COMMON,
    value: config.value || 1,
    weight: config.weight || 0.1,
    symbol: config.symbol || '❓',
    stackable: config.stackable !== undefined ? config.stackable : false,
    maxStack: config.maxStack || 1,
    
    // Equipment properties
    equipSlot: config.equipSlot || null,
    hands: config.hands || 1,
    
    // Stats modifications
    stats: config.stats || {},
    
    // Special effects
    effects: config.effects || [],
    
    // Use function
    usable: config.usable !== undefined ? config.usable : false,
    useFunction: config.useFunction || null,
    
    // Additional properties for specific item types
    weaponType: config.weaponType || null,
    armorType: config.armorType || null,
    damageType: config.damageType || null,
    
    // Durability system
    maxDurability: config.maxDurability || (config.category === window.ITEM_CATEGORIES.WEAPON ? 100 : 
                                          config.category === window.ITEM_CATEGORIES.ARMOR ? 150 : null),
    
    // Block chance for shields
    blockChance: config.blockChance || null,
    
    // Requirements to use
    requirements: config.requirements || {}
  };
};

// Create a new item instance from a template
window.createItemInstance = function(template, quantity = 1) {
  return {
    templateId: template.id,
    instanceId: `inst_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    quantity: template.stackable ? quantity : 1,
    durability: template.maxDurability || null,
    equipped: false,
    ammoType: template.ammoType || null,
    capacity: template.capacity || null,
    currentAmount: template.capacity || null,
    compatibleWeapons: template.compatibleWeapons || [],

     // Add method to use ammunition
     useAmmo: function(amount = 1) {
      if (this.currentAmount !== null) {
        this.currentAmount = Math.max(0, this.currentAmount - amount);
        return this.currentAmount > 0;
      }
      return true; // If not ammunition, always return true
    },
    
    // Add method to reload ammunition
    reloadAmmo: function(amount = null) {
      if (this.currentAmount !== null && this.capacity !== null) {
        this.currentAmount = amount || this.capacity;
        return true;
      }
      return false;
    },
    
    // Reference to template for easy access
    getTemplate: function() {
      return template;
    },
    
    // Convenience methods
    getName: function() {
      return template.name;
    },
    
    getSymbol: function() {
      return template.symbol;
    },
    
    getRarity: function() {
      return template.rarity;
    },
    
    getValue: function() {
      return template.value * template.rarity.multiplier;
    },
    
    use: function(character) {
      if (template.usable && template.useFunction) {
        return template.useFunction(character, this);
      }
      return false;
    },
    
    canEquip: function(character) {
      if (!template.equipSlot) return false;
      
      // Check requirements
      if (template.requirements) {
        if (template.requirements.minPhy && character.phy < template.requirements.minPhy) return false;
        if (template.requirements.minMen && character.men < template.requirements.minMen) return false;
        // Add more requirement checks as needed
      }
      
      return true;
    },
    
    getDurabilityStatus: function() {
      if (this.durability === null || template.maxDurability === null) return '';
      
      const durabilityPercent = (this.durability / template.maxDurability) * 100;
      
      if (durabilityPercent <= 0) return '(Broken)';
      if (durabilityPercent < 20) return '(Very Poor)';
      if (durabilityPercent < 40) return '(Poor)';
      if (durabilityPercent < 60) return '(Worn)';
      if (durabilityPercent < 80) return '(Good)';
      return '(Excellent)';
    },
    
    getDescription: function() {
      let desc = template.description;
      
      // Add durability status if applicable
      if (this.durability !== null) {
        const durabilityStatus = this.getDurabilityStatus();
        desc += `\n\nDurability: ${this.durability}/${template.maxDurability} ${durabilityStatus}`;
      }
      
      // Add shield block chance if applicable
      if (template.weaponType && template.weaponType.name === 'Shield' && template.blockChance) {
        desc += `\n\nBlock Chance: ${template.blockChance}%`;
        desc += `\n(+15% in Defensive Stance)`;
      }
      
      // Add stats information if equipment
      if (template.equipSlot && Object.keys(template.stats).length > 0) {
        desc += "\n\nStats:";
        for (const [stat, value] of Object.entries(template.stats)) {
          const sign = value >= 0 ? '+' : '';
          desc += `\n${stat}: ${sign}${value}`;
        }
      }

        // Add ammunition information if applicable
        if (this.ammoType) {
          desc += `\n\nAmmunition Type: ${this.ammoType}`;
          desc += `\nAmount: ${this.currentAmount}/${this.capacity}`;
          
          if (this.compatibleWeapons && this.compatibleWeapons.length > 0) {
            desc += `\n\nCompatible with: ${this.compatibleWeapons.map(w => {
              const weapon = window.itemTemplates[w];
              return weapon ? weapon.name : w;
            }).join(', ')}`;
          }
        }
      
      // Add effects information
      if (template.effects && template.effects.length > 0) {
        desc += "\n\nEffects:";
        template.effects.forEach(effect => {
          desc += `\n- ${effect.description}`;
        });
      }
      
      return desc;
    }
  };
};

// Create mount factory function
window.createMount = function(config) {
  const mountType = config.mountType || window.MOUNT_TYPES.WARHORSE;
  
  return window.createItemTemplate({
    name: config.name || `${mountType.name}`,
    description: config.description || `A loyal ${mountType.name.toLowerCase()}.`,
    category: window.ITEM_CATEGORIES.MOUNT,
    rarity: config.rarity || window.ITEM_RARITIES.UNCOMMON,
    value: config.value || 300,
    weight: 0,  // Mounts don't count for inventory weight
    symbol: mountType.symbol,
    equipSlot: mountType.slot,
    stats: {
      speed: config.speed || 20,
      mobility: config.mobility || 15,
      durability: config.durability || 50,
      ...config.stats
    },
    maxDurability: config.maxDurability || 200, // Mounts have high durability
    requirements: config.requirements || {},
    ...config
  });
};

// Item Factory - Create weapons
window.createWeapon = function(config) {
  const weaponType = config.weaponType || window.WEAPON_TYPES.SWORD;
  
  // Calculate appropriate durability based on rarity
  const rarityMultiplier = config.rarity ? config.rarity.multiplier : 1.0;
  const baseDurability = 50 + (rarityMultiplier * 20); // Common: 70, Uncommon: 80, Rare: 100, etc.
  
  return window.createItemTemplate({
    name: config.name || `${weaponType.name}`,
    description: config.description || `A standard ${weaponType.name.toLowerCase()}.`,
    category: window.ITEM_CATEGORIES.WEAPON,
    rarity: config.rarity || window.ITEM_RARITIES.COMMON,
    value: config.value || 10,
    weight: config.weight || 1.0,
    symbol: weaponType.symbol,
    equipSlot: weaponType.slot,
    hands: weaponType.hands,
    weaponType: weaponType,
    stats: {
      damage: config.damage || 5,
      armorPenetration: config.armorPenetration || 0,
      ...config.stats
    },
    maxDurability: config.maxDurability || Math.round(baseDurability),
    blockChance: weaponType.name === 'Shield' ? (config.blockChance || 20) : null,
    requirements: config.requirements || {},
    ...config
  });
};

// Item Factory - Create armor
window.createArmor = function(config) {
  const armorType = config.armorType || window.ARMOR_TYPES.MEDIUM;
  let symbol;
  
  switch(config.equipSlot) {
    case window.EQUIPMENT_SLOTS.HEAD:
      symbol = window.ITEM_SYMBOLS.HELMET;
      break;
    case window.EQUIPMENT_SLOTS.BODY:
      symbol = window.ITEM_SYMBOLS.CHEST;
      break;
    default:
      symbol = window.ITEM_SYMBOLS.CHEST;
  }
  
  // Calculate appropriate durability based on rarity and armor type
  const rarityMultiplier = config.rarity ? config.rarity.multiplier : 1.0;
  let armorTypeMultiplier = 1.0;
  if (armorType === window.ARMOR_TYPES.LIGHT) armorTypeMultiplier = 0.8;
  if (armorType === window.ARMOR_TYPES.HEAVY) armorTypeMultiplier = 1.2;
  
  const baseDurability = 75 + (rarityMultiplier * 25 * armorTypeMultiplier);
  
  return window.createItemTemplate({
    name: config.name || `${armorType.name}`,
    description: config.description || `A standard piece of ${armorType.name.toLowerCase()}.`,
    category: window.ITEM_CATEGORIES.ARMOR,
    rarity: config.rarity || window.ITEM_RARITIES.COMMON,
    value: config.value || 15,
    weight: config.weight || 2.0,
    symbol: symbol,
    equipSlot: config.equipSlot || window.EQUIPMENT_SLOTS.BODY,
    armorType: armorType,
    stats: {
      defense: config.defense || 3,
      ...config.stats
    },
    maxDurability: config.maxDurability || Math.round(baseDurability),
    requirements: config.requirements || {},
    ...config
  });
};

// Item Factory - Create consumable
window.createConsumable = function(config) {
  return window.createItemTemplate({
    name: config.name || "Potion",
    description: config.description || "A consumable item.",
    category: window.ITEM_CATEGORIES.CONSUMABLE,
    rarity: config.rarity || window.ITEM_RARITIES.COMMON,
    value: config.value || 5,
    weight: config.weight || 0.2,
    symbol: config.symbol || window.ITEM_SYMBOLS.POTION,
    stackable: true,
    maxStack: config.maxStack || 10,
    usable: true,
    useFunction: config.useFunction || function(character, item) {
      console.log(`${character.name} used ${item.getName()}`);
      return true; // Item was successfully used
    },
    ...config
  });
};

// Compare two items of the same type
window.compareItems = function(itemA, itemB) {
  if (!itemA || !itemB) return null;
  
  // Get templates
  const templateA = itemA.getTemplate ? itemA.getTemplate() : itemA;
  const templateB = itemB.getTemplate ? itemB.getTemplate() : itemB;
  
  // If different categories, can't really compare
  if (templateA.category !== templateB.category) {
    return { comparable: false, reason: "Different item categories" };
  }
  
  // For weapons and armor, compare stats
  if (templateA.category === window.ITEM_CATEGORIES.WEAPON || 
      templateA.category === window.ITEM_CATEGORIES.ARMOR) {
    
    const comparison = {
      comparable: true,
      name: { a: templateA.name, b: templateB.name },
      rarity: { a: templateA.rarity.name, b: templateB.rarity.name },
      value: { a: templateA.value, b: templateB.value, diff: templateB.value - templateA.value },
      stats: {}
    };
    
    // Compare all stats
    const allStats = new Set([
      ...Object.keys(templateA.stats || {}),
      ...Object.keys(templateB.stats || {})
    ]);
    
    allStats.forEach(stat => {
      const valueA = (templateA.stats && templateA.stats[stat]) || 0;
      const valueB = (templateB.stats && templateB.stats[stat]) || 0;
      const diff = valueB - valueA;
      
      comparison.stats[stat] = {
        a: valueA,
        b: valueB,
        diff: diff,
        better: diff > 0 ? 'b' : diff < 0 ? 'a' : 'equal'
      };
    });
    
    // Compare block chance for shields
    if (templateA.weaponType && templateA.weaponType.name === 'Shield' &&
        templateB.weaponType && templateB.weaponType.name === 'Shield') {
      const blockA = templateA.blockChance || 0;
      const blockB = templateB.blockChance || 0;
      
      comparison.stats.blockChance = {
        a: blockA,
        b: blockB,
        diff: blockB - blockA,
        better: blockB > blockA ? 'b' : blockB < blockA ? 'a' : 'equal'
      };
    }
    
    // Also compare durability if applicable
    if (itemA.durability !== undefined && itemB.durability !== undefined) {
      const durA = itemA.durability || 0;
      const durB = itemB.durability || 0;
      const maxDurA = templateA.maxDurability || 1;
      const maxDurB = templateB.maxDurability || 1;
      
      // Compare by percentage
      const durPercentA = (durA / maxDurA) * 100;
      const durPercentB = (durB / maxDurB) * 100;
      
      comparison.stats.durability = {
        a: `${durA}/${maxDurA} (${Math.round(durPercentA)}%)`,
        b: `${durB}/${maxDurB} (${Math.round(durPercentB)}%)`,
        diff: durPercentB - durPercentA,
        better: durPercentB > durPercentA ? 'b' : durPercentB < durPercentA ? 'a' : 'equal'
      };
    }
    
    return comparison;
  }
  
  // For consumables, just compare basic properties
  return {
    comparable: true,
    name: { a: templateA.name, b: templateB.name },
    rarity: { a: templateA.rarity.name, b: templateB.rarity.name },
    value: { a: templateA.value, b: templateB.value, diff: templateB.value - templateA.value }
  };
};

  // Item Factory - Create ammunition
  window.createAmmunition = function(config) {
    return window.createItemTemplate({
      name: config.name || "Ammunition",
      description: config.description || "Ammunition for ranged weapons.",
      category: window.ITEM_CATEGORIES.AMMUNITION,
      rarity: config.rarity || window.ITEM_RARITIES.COMMON,
      value: config.value || 5,
      weight: config.weight || 0.5,
      symbol: config.symbol || '🏹',
      equipSlot: window.EQUIPMENT_SLOTS.AMMUNITION,
      stackable: false,
      ammoType: config.ammoType || "arrow",
      capacity: config.capacity || 20,
      currentAmount: config.capacity || 20,
      compatibleWeapons: config.compatibleWeapons || [],
      ...config
    });
  };

// Create a predefined set of item templates
window.initializeItemTemplates = function() {
  // Store all item templates here
  window.itemTemplates = {};
  
  // WEAPONS
  window.itemTemplates.basicSword = window.createWeapon({
    id: 'basic_sword',
    name: 'Paanic Military Sword',
    description: 'A standard issue military sword from the Paanic Empire. Reliable but unremarkable.',
    weaponType: window.WEAPON_TYPES.SWORD,
    damage: 8,
    value: 25,
    maxDurability: 75
  });
  
  window.itemTemplates.nobleSword = window.createWeapon({
    id: 'noble_sword',
    name: 'Noble Ceremonial Sword',
    description: 'A finely crafted blade carried by nobility. More ceremonial than practical, but still deadly.',
    weaponType: window.WEAPON_TYPES.SWORD,
    rarity: window.ITEM_RARITIES.UNCOMMON,
    damage: 10,
    value: 100,
    stats: {
      damage: 10,
      critChance: 5
    },
    maxDurability: 90,
    armorPenetration: 5
  });
  
  window.itemTemplates.royalGreatsword = window.createWeapon({
    id: 'royal_greatsword',
    name: 'Royal Greatsword',
    description: 'A massive two-handed blade carried by the royal guards of Cennen. Its heft can cleave through armor.',
    weaponType: window.WEAPON_TYPES.GREATSWORD,
    rarity: window.ITEM_RARITIES.RARE,
    damage: 18,
    value: 350,
    stats: {
      damage: 18,
      armorPenetration: 20,
      speed: -5
    },
    requirements: {
      minPhy: 8
    },
    maxDurability: 120
  });

  // Ranged
  
  window.itemTemplates.matchlockRifle = window.createWeapon({
    id: 'matchlock_rifle',
    name: 'Nesian Matchlock Rifle',
    description: 'A firearm from Nesia, re-engineered from ancient Immortal designs. Powerful but slow to reload.',
    weaponType: window.WEAPON_TYPES.RIFLE,
    rarity: window.ITEM_RARITIES.UNCOMMON,
    damage: 25,
    value: 220,
    stats: {
      damage: 25,
      range: 40,
      speed: -20,
      armorPenetration: 15
    },
    requirements: {
      minMen: 2
    },
    maxDurability: 70
  });
  
  window.itemTemplates.hunterBow = window.createWeapon({
    id: 'hunter_bow',
    name: 'Wyrd Hunter\'s Bow',
    description: 'A recurve bow crafted by the hunters of the Wyrdplains. Fast to draw and deadly accurate.',
    weaponType: window.WEAPON_TYPES.BOW,
    rarity: window.ITEM_RARITIES.UNCOMMON,
    damage: 12,
    value: 120,
    stats: {
      damage: 12,
      range: 30,
      critChance: 10,
      armorPenetration: 5
    },
    maxDurability: 60
  });

  window.itemTemplates.throwingJavelin = window.createWeapon({
    id: 'throwing_javelin',
    name: 'Throwing Javelin',
    description: 'A lightweight spear designed to be thrown at enemies from a distance.',
    weaponType: window.WEAPON_TYPES.SPEAR,
    rarity: window.ITEM_RARITIES.COMMON,
    damage: 10,
    value: 15,
    stats: {
      damage: 10,
      range: 2, // Can attack at medium range
      armorPenetration: 10
    },
    maxDurability: 50
  });

  // Ammunition items
window.itemTemplates.quiver = window.createAmmunition({
  id: 'quiver',
  name: 'Arrow Quiver',
  description: 'A sturdy quiver that holds up to 20 arrows for bows.',
  ammoType: 'arrow',
  capacity: 20,
  symbol: '🏹',
  value: 15,
  compatibleWeapons: ['hunter_bow']
});

window.itemTemplates.javelinPack = window.createAmmunition({
  id: 'javelin_pack',
  name: 'Javelin Pack',
  description: 'A harness designed to carry up to 6 throwing javelins.',
  ammoType: 'javelin',
  capacity: 6,
  symbol: '🔱',
  value: 30,
  compatibleWeapons: []
});

window.itemTemplates.cartridgePouch = window.createAmmunition({
  id: 'cartridge_pouch',
  name: 'Powder & Shot Pouch',
  description: 'A leather pouch containing powder, shot, and supplies for up to 12 firearm loads.',
  ammoType: 'shot',
  capacity: 12,
  symbol: '💼',
  value: 40,
  compatibleWeapons: ['matchlock_rifle']
});
  
  // SHIELDS - Updated with blockChance values
  window.itemTemplates.legionShield = window.createWeapon({
    id: 'legion_shield',
    name: 'Paanic Legion Shield',
    description: 'A standard-issue military shield bearing the emblem of the Paanic Legion. Provides reliable protection against frontal attacks.',
    weaponType: window.WEAPON_TYPES.SHIELD,
    rarity: window.ITEM_RARITIES.COMMON,
    damage: 2,
    value: 40,
    stats: {
      damage: 2,
      defense: 15
    },
    maxDurability: 120,
    blockChance: 30 // Added block chance
  });
  
  // NEW: Additional shield types
  window.itemTemplates.towerShield = window.createWeapon({
    id: 'tower_shield',
    name: 'Nesian Tower Shield',
    description: 'A massive rectangular shield used by front-line infantry. Offers exceptional protection at the cost of mobility.',
    weaponType: window.WEAPON_TYPES.SHIELD,
    rarity: window.ITEM_RARITIES.UNCOMMON,
    damage: 1,
    value: 150,
    stats: {
      damage: 1,
      defense: 25,
      speed: -15
    },
    maxDurability: 180,
    blockChance: 45, // Higher block chance
    requirements: {
      minPhy: 6
    }
  });
  
  window.itemTemplates.buckler = window.createWeapon({
    id: 'buckler',
    name: 'Lunarine Buckler',
    description: 'A small, round shield favored by duelists. Offers less protection than larger shields but allows for greater mobility and counterattacks.',
    weaponType: window.WEAPON_TYPES.SHIELD,
    rarity: window.ITEM_RARITIES.UNCOMMON,
    damage: 3,
    value: 100,
    stats: {
      damage: 3,
      defense: 8,
      speed: 5,
      critChance: 5
    },
    maxDurability: 90,
    blockChance: 20 // Lower block chance but other benefits
  });
  
  window.itemTemplates.plateShield = window.createWeapon({
    id: 'plate_shield',
    name: 'Arrasi Battle Shield',
    description: 'A heavy metal shield reinforced with steel plates. Extremely durable and capable of withstanding powerful blows.',
    weaponType: window.WEAPON_TYPES.SHIELD,
    rarity: window.ITEM_RARITIES.RARE,
    damage: 4,
    value: 300,
    stats: {
      damage: 4,
      defense: 20,
      speed: -10,
      armorPenetration: 5
    },
    maxDurability: 200,
    blockChance: 40, // High block chance
    requirements: {
      minPhy: 8
    }
  });
  
  // ARMOR - Updated with appropriate durability values
  window.itemTemplates.legionHelmet = window.createArmor({
    id: 'legion_helmet',
    name: 'Legion Helmet',
    description: 'Standard issue helmet of the Paanic Legion. Provides decent protection against overhead strikes.',
    equipSlot: window.EQUIPMENT_SLOTS.HEAD,
    armorType: window.ARMOR_TYPES.MEDIUM,
    defense: 5,
    value: 30,
    maxDurability: 85
  });
  
  window.itemTemplates.legionArmor = window.createArmor({
    id: 'legion_armor',
    name: 'Legion Cuirass',
    description: 'Standard issue breastplate of the Paanic Legion. Reliable protection in battle.',
    equipSlot: window.EQUIPMENT_SLOTS.BODY,
    armorType: window.ARMOR_TYPES.MEDIUM,
    defense: 12,
    value: 75,
    maxDurability: 100
  });
  
  window.itemTemplates.cavalryArmor = window.createArmor({
    id: 'cavalry_armor',
    name: 'Nesian Cavalry Armor',
    description: 'Heavy plate armor worn by the elite cavalry of Nesia. Offers excellent protection while mounted.',
    equipSlot: window.EQUIPMENT_SLOTS.BODY,
    armorType: window.ARMOR_TYPES.HEAVY,
    rarity: window.ITEM_RARITIES.UNCOMMON,
    defense: 18,
    value: 250,
    stats: {
      defense: 18,
      speed: -10,
      intimidation: 10
    },
    requirements: {
      minPhy: 1
    },
    maxDurability: 145
  });
  
  window.itemTemplates.scoutArmor = window.createArmor({
    id: 'scout_armor',
    name: 'Scout Leather Armor',
    description: 'Lightweight leather armor designed for mobility. Favored by scouts and archers.',
    equipSlot: window.EQUIPMENT_SLOTS.BODY,
    armorType: window.ARMOR_TYPES.LIGHT,
    defense: 6,
    value: 60,
    stats: {
      defense: 6,
      speed: 10,
      stealth: 15
    },
    maxDurability: 80
  });
  
  // NEW: Heavy armor option
  window.itemTemplates.druskariPlate = window.createArmor({
    id: 'druskari_plate',
    name: 'Arrasi Druskari Platemail',
    description: 'Massive, ornate plate armor worn by Arrasi heavy infantry. Nearly impenetrable but extremely heavy and restrictive.',
    equipSlot: window.EQUIPMENT_SLOTS.BODY,
    armorType: window.ARMOR_TYPES.HEAVY,
    rarity: window.ITEM_RARITIES.RARE,
    defense: 30,
    value: 450,
    stats: {
      defense: 30,
      speed: -20,
      intimidation: 25
    },
    requirements: {
      minPhy: 10
    },
    maxDurability: 220
  });
  
  // NEW: Heavy helmet option
  window.itemTemplates.druskariHelm = window.createArmor({
    id: 'druskari_helm',
    name: 'Arrasi Druskari Helm',
    description: 'A fearsome full helm with decorative horns and a face mask, worn by elite Arrasi warriors.',
    equipSlot: window.EQUIPMENT_SLOTS.HEAD,
    armorType: window.ARMOR_TYPES.HEAVY,
    rarity: window.ITEM_RARITIES.RARE,
    defense: 12,
    value: 200,
    stats: {
      defense: 12,
      intimidation: 15
    },
    requirements: {
      minPhy: 6
    },
    maxDurability: 180
  });
  
  // ACCESSORIES
  window.itemTemplates.commandAmulet = window.createItemTemplate({
    id: 'command_amulet',
    name: 'Officer\'s Amulet',
    description: 'A military decoration worn by officers of the Paanic Empire. Enhances leadership abilities.',
    category: window.ITEM_CATEGORIES.ACCESSORY,
    rarity: window.ITEM_RARITIES.UNCOMMON,
    value: 120,
    weight: 0.1,
    symbol: window.ITEM_SYMBOLS.AMULET,
    equipSlot: window.EQUIPMENT_SLOTS.ACCESSORY,
    stats: {
      command: 15,
      charisma: 5
    }
  });
  
  // CONSUMABLES
  window.itemTemplates.healthPotion = window.createConsumable({
    id: 'health_potion',
    name: 'Health Potion',
    description: 'A red potion that restores 50 health when consumed.',
    symbol: window.ITEM_SYMBOLS.POTION,
    value: 20,
    useFunction: function(character, item) {
      window.gameState.health = Math.min(window.gameState.maxHealth, window.gameState.health + 50);
      window.updateStatusBars();
      window.showNotification('You restored 50 health!', 'success');
      return true;
    }
  });
  
  window.itemTemplates.staminaPotion = window.createConsumable({
    id: 'stamina_potion',
    name: 'Stamina Elixir',
    description: 'A green elixir that restores 75 stamina when consumed.',
    symbol: window.ITEM_SYMBOLS.POTION,
    value: 15,
    useFunction: function(character, item) {
      window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + 75);
      window.updateStatusBars();
      window.showNotification('You restored 75 stamina!', 'success');
      return true;
    }
  });
  
  window.itemTemplates.rations = window.createConsumable({
    id: 'rations',
    name: 'Military Rations',
    description: 'Standard issue field rations. Not tasty, but nutritious. Restores 20 health and 30 stamina.',
    symbol: window.ITEM_SYMBOLS.FOOD,
    value: 8,
    useFunction: function(character, item) {
      window.gameState.health = Math.min(window.gameState.maxHealth, window.gameState.health + 20);
      window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + 30);
      window.updateStatusBars();
      window.showNotification('You consumed your rations, restoring health and stamina.', 'success');
      return true;
    }
  });
  
  // Repair kit for weapons and armor
  window.itemTemplates.repairKit = window.createConsumable({
    id: 'repair_kit',
    name: 'Field Repair Kit',
    description: 'A set of tools and materials for field repairs of weapons and armor. Restores 50 durability points to an equipped item.',
    symbol: '🔧',
    value: 30,
    useFunction: function(character, item) {
      // Find equipped items that need repair
      let repairableItems = [];
      
      for (const slot in window.player.equipment) {
        const equippedItem = window.player.equipment[slot];
        if (equippedItem && equippedItem !== "occupied" && 
            equippedItem.durability !== null && 
            equippedItem.durability < equippedItem.getTemplate().maxDurability) {
          repairableItems.push(equippedItem);
        }
      }
      
      // If no items need repair
      if (repairableItems.length === 0) {
        window.showNotification('You have no equipped items that need repair.', 'warning');
        return false;
      }
      
      // If only one item needs repair, repair it
      if (repairableItems.length === 1) {
        const itemToRepair = repairableItems[0];
        const oldDurability = itemToRepair.durability;
        const template = itemToRepair.getTemplate();
        
        // Calculate repair amount
        const repairAmount = 50;
        itemToRepair.durability = Math.min(template.maxDurability, itemToRepair.durability + repairAmount);
        
        // Show notification
        window.showNotification(`Repaired ${itemToRepair.getName()} (${oldDurability} → ${itemToRepair.durability})`, 'success');
        
        // Update the UI if inventory is open
        window.updateInventoryDisplayIfOpen();
        
        return true;
      }
      
      // If multiple items need repair, show a dialog to choose
      // For simplicity, repair the first item
      const itemToRepair = repairableItems[0];
      const oldDurability = itemToRepair.durability;
      const template = itemToRepair.getTemplate();
      
      // Calculate repair amount
      const repairAmount = 50;
      itemToRepair.durability = Math.min(template.maxDurability, itemToRepair.durability + repairAmount);
      
      // Show notification
      window.showNotification(`Repaired ${itemToRepair.getName()} (${oldDurability} → ${itemToRepair.durability})`, 'success');
      
      // Update the UI if inventory is open
      window.updateInventoryDisplayIfOpen();
      
      return true;
    }
  });

  // Add mount items
  window.itemTemplates.standardWarhorse = window.createMount({
    id: 'standard_warhorse',
    name: 'Standard Warhorse',
    description: 'A well-trained warhorse from the Nesian cavalry stables. Bred for endurance and courage in battle.',
    mountType: window.MOUNT_TYPES.WARHORSE,
    value: 250,
    stats: {
      speed: 20,
      mobility: 15,
      durability: 50,
      intimidation: 10
    }
  });
  
  window.itemTemplates.castellanCharger = window.createMount({
    id: 'castellan_charger',
    name: 'Castellan Charger',
    description: 'An elite Nesian cavalry mount, trained specifically for the Castellan forces. Renowned for its fearlessness and responsiveness in battle.',
    mountType: window.MOUNT_TYPES.CHARGER,
    rarity: window.ITEM_RARITIES.RARE,
    value: 500,
    stats: {
      speed: 30,
      mobility: 25,
      durability: 60,
      intimidation: 20,
      offense: 10
    }
  });
  
  window.itemTemplates.constructMount = window.createMount({
    id: 'construct_mount',
    name: 'Immortal Construct Mount',
    description: 'A rare and mysterious mechanical construct recovered from ancient Immortal ruins. Its inner workings are impossible to fully understand, but it serves as a formidable mount in battle.',
    mountType: window.MOUNT_TYPES.CONSTRUCT,
    rarity: window.ITEM_RARITIES.EPIC,
    value: 1200,
    stats: {
      speed: 35,
      mobility: 20,
      durability: 100,
      intimidation: 30,
      defense: 15
    }
  });
  
  console.log("Item templates initialized:", Object.keys(window.itemTemplates).length);
  return window.itemTemplates;
};

// Initialize item templates when the script loads
window.initializeItemTemplates();

// Helper function to update the inventory display if it's open
window.updateInventoryDisplayIfOpen = function() {
  // Check if inventory panel is visible
  const inventoryPanel = document.getElementById('inventory');
  if (inventoryPanel && !inventoryPanel.classList.contains('hidden')) {
    // Re-render inventory items
    if (typeof window.renderInventoryItems === 'function') {
      window.renderInventoryItems();
    }
    
    // Update equipment display
    if (typeof window.updateEquipmentDisplay === 'function') {
      window.updateEquipmentDisplay();
    }
  }
};