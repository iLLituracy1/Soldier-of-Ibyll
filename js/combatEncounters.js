// Combat Encounters System
// Handles random combat encounter generation and processing

// Check for random combat encounters based on activity type
window.checkForCombatEncounters = function(activityType) {
  // Don't trigger encounters if already in battle
  if (window.gameState.inBattle) return;
  
  // Base encounter chance depends on activity
  let encounterChance = 0;
  switch(activityType) {
    case 'patrol':
      encounterChance = 0.25; // 25% chance during patrol
      break;
    case 'scout':
      encounterChance = 0.35; // 35% chance during scouting
      break;
    case 'forage':
      encounterChance = 0.20; // 20% chance while foraging
      break;
    default:
      encounterChance = 0.05; // 5% base chance for other activities
  }
  
  // Modify chance based on time of day
  const timeOfDay = window.getTimeOfDay();
  if (timeOfDay === 'night') {
    encounterChance *= 1.5; // Higher chance at night
  } else if (timeOfDay === 'dawn' || timeOfDay === 'evening') {
    encounterChance *= 1.2; // Slightly higher chance at dawn/evening
  }
  
  // Modify chance based on player skills
  if (window.player.skills.survival) {
    // Survival skill reduces encounter chance (1% per 0.1 skill)
    encounterChance -= (window.player.skills.survival * 10) / 100;
    encounterChance = Math.max(0.05, encounterChance); // Minimum 5% chance
  }
  
  // Roll for encounter
  if (Math.random() < encounterChance) {
    // Encounter triggered!
    generateRandomEncounter(activityType);
    return true;
  }
  
  return false;
};

// Generate a random combat encounter
function generateRandomEncounter(activityType) {
  // Determine possible enemy types based on current location and activity
  const possibleEnemies = [];
  
  // Base enemy types available in all areas
  possibleEnemies.push({
    type: 'wild_beast',
    chance: 0.3,
    minLevel: 1,
    maxLevel: 3
  });
  
  // Add more enemy types based on area (assumed to be Western Hierarchate)
  possibleEnemies.push({
    type: 'arrasi_scout',
    chance: 0.4,
    minLevel: 1,
    maxLevel: 2
  });
  
  possibleEnemies.push({
    type: 'arrasi_warrior',
    chance: 0.2,
    minLevel: 1,
    maxLevel: 3
  });
  
  possibleEnemies.push({
    type: 'imperial_deserter',
    chance: 0.1,
    minLevel: 1,
    maxLevel: 2
  });
  
  // Filter by chance roll
  const eligibleEnemies = possibleEnemies.filter(enemy => Math.random() < enemy.chance);
  
  if (eligibleEnemies.length === 0) {
    // Default to wild beast if no other enemies selected
    triggerEncounter('wild_beast', 1);
    return;
  }
  
  // Select a random enemy from eligible options
  const selectedEnemy = eligibleEnemies[Math.floor(Math.random() * eligibleEnemies.length)];
  
  // Determine encounter level
  const encounterLevel = selectedEnemy.minLevel + 
    Math.floor(Math.random() * (selectedEnemy.maxLevel - selectedEnemy.minLevel + 1));
  
  // Trigger the encounter
  triggerEncounter(selectedEnemy.type, encounterLevel);
}

// Trigger a specific combat encounter
function triggerEncounter(enemyType, level) {
  // Set narrative for encounter
  let encounterText = "";
  
  switch(enemyType) {
    case 'arrasi_scout':
      encounterText = "As you round a bend, you spot an Arrasi scout. They notice you at the same moment, and their hand moves to their weapon.";
      break;
    case 'arrasi_warrior':
      encounterText = "An Arrasi warrior steps out from behind cover, weapon drawn. Their eyes lock with yours in a silent challenge.";
      break;
    case 'imperial_deserter':
      encounterText = "A ragged figure in tattered imperial uniform lurks nearby. Seeing your approach, the deserter tenses, ready for a fight.";
      break;
    case 'wild_beast':
      encounterText = "A low growl alerts you to danger. A wild beast stalks toward you, hunger in its eyes.";
      break;
    default:
      encounterText = "You encounter a hostile figure. Prepare for combat!";
  }
  
  // Set the narrative
  window.setNarrative(encounterText);
  
  // Start combat with this enemy
  window.startCombat(enemyType);
}