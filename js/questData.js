// QUEST DATA MODULE
// Contains data for all quests in the game

/**
 * This module defines the data for all quests available in the game.
 * Each quest is defined with:
 * - Core properties (id, title, description)
 * - Requirements to start the quest
 * - Stages that make up the quest
 * - Objectives to complete
 * - Rewards for completing the quest
 * - Custom functions for quest logic
 */

window.questData = {
  // Raid the Frontier Quest - First large-scale battle using the Shieldwall system
  "raid_the_frontier": {
    id: "raid_the_frontier",
    title: "Raid the Frontier",
    description: "Your company has been tasked with a raid on Arrasi settlements near the frontier. The objective is to gather intelligence, test the enemy's defenses, and secure valuable resources.",
    introduction: "Soldier! The Sarkein has selected our unit for a special assignment. We are to cross the border and raid the Arrasi settlements on the frontier. This mission will test your mettle in a true battle formation. Prepare yourself for a day's march, followed by a potentially hostile engagement.",
    
    // Requirements
    requirements: {
      minLevel: 2,
      skills: {
        discipline: 1,
        survival: 1
      }
    },
    
    // Daily trigger chance (25% each day)
    dailyTriggerChance: 0.25,
    
    // Quest stages
    stages: [
      {
        // Stage 1: Preparation Stage
        title: "Preparation",
        description: "Prepare for the raid by gathering supplies, checking equipment, and training with your unit.",
        introNarrative: "The Sarkein's orders have come through: your company will conduct a raid across the Arrasi frontier. You have one day to prepare before marching at dawn. The quartermaster has opened his stores, and the training grounds are bustling with soldiers readying themselves for battle.",
        
        // Custom actions for this stage
        actions: [
          {
            id: "visit_quartermaster",
            label: "Visit Quartermaster",
            execute: function(quest) {
              // Open quartermaster shop with special raid supplies
              window.QuestSystem.triggerEvent('openQuartermasterWithSupplies', {
                questId: quest.id,
                discountPercent: 10, // 10% discount on supplies
                specialItems: ['repairKit', 'healthPotion', 'staminaPotion']
              });
              
              // Add narrative
              window.addToNarrative("The quartermaster nods as you approach. \"Heard about the raid. I've got supplies set aside for your unit at a special rate. Wouldn't want you marching underprepared.\"");
              
              // Mark action as taken
              quest.visitedQuartermaster = true;
              
              // Check if all preparation actions have been taken
              window.QuestSystem.checkPreparationComplete(quest);
            }
          },
          {
            id: "formation_training",
            label: "Train in Formation Tactics",
            execute: function(quest) {
              // Special training focused on shieldwall tactics
              window.addToNarrative("You join your comrades on the training field, where veterans are drilling the unit in formation tactics. The sergeant barks orders as you practice locking shields, maintaining cohesion through maneuvers, and responding to signals.\n\n\"Listen up! When you're in the shieldwall, you're not fighting as an individual—you're part of something larger. Your shield protects the soldier to your left as much as it protects you. Maintain formation, follow signals, and watch for gaps!\"");
              
              // Improve relevant skills
              const disciplineGain = 0.2;
              const tacticGain = 0.15;
              
              const mentalSkillCap = Math.floor(window.player.men / 1.5);
              
              if (window.player.skills.discipline < mentalSkillCap) {
                window.player.skills.discipline = Math.min(mentalSkillCap, window.player.skills.discipline + disciplineGain);
                window.showNotification(`Your discipline improved by ${disciplineGain.toFixed(1)}`, 'success');
              }
              
              if (window.player.skills.tactics < mentalSkillCap) {
                window.player.skills.tactics = Math.min(mentalSkillCap, window.player.skills.tactics + tacticGain);
                window.showNotification(`Your tactics improved by ${tacticGain.toFixed(1)}`, 'success');
              }
              
              // Add experience
              window.gameState.experience += 15;
              window.showNotification(`+15 XP from formation training`, 'success');
              
              // Update UI
              window.updateStatusBars();
              window.updateProfileIfVisible();
              
              // Mark action as taken
              quest.completedFormationTraining = true;
              
              // Advance time by 3 hours
              window.updateTimeAndDay(180);
              
              // Check if all preparation actions have been taken
              window.QuestSystem.checkPreparationComplete(quest);
            }
          },
          {
            id: "equipment_check",
            label: "Check Equipment",
            execute: function(quest) {
              // Inventory & equipment status check
              window.addToNarrative("You lay out your equipment for inspection, checking each piece thoroughly. A wise precaution before marching to battle.");
              
              // Check equipment conditions
              let equipmentStatus = "Your equipment appears to be ";
              
              // Calculate average equipment condition
              let totalDurability = 0;
              let totalEquipment = 0;
              
              for (const slot in window.player.equipment) {
                const item = window.player.equipment[slot];
                if (item && item !== "occupied" && item.durability !== undefined) {
                  totalDurability += item.durability / item.getTemplate().maxDurability;
                  totalEquipment++;
                }
              }
              
              const avgCondition = totalEquipment > 0 ? totalDurability / totalEquipment : 0;
              
              if (avgCondition > 0.8) {
                equipmentStatus += "in excellent condition. You're well-prepared for the raid.";
              } else if (avgCondition > 0.5) {
                equipmentStatus += "in decent condition, though some maintenance wouldn't hurt.";
              } else if (avgCondition > 0.3) {
                equipmentStatus += "showing significant wear. You should consider repairs before the raid.";
              } else {
                equipmentStatus += "in poor condition. Seeking repairs is strongly recommended before marching.";
              }
              
              window.addToNarrative(equipmentStatus);
              
              // Advance time slightly
              window.updateTimeAndDay(30); // 30 minutes
              
              // Mark action as taken
              quest.checkedEquipment = true;
              
              // Check if all preparation actions have been taken
              window.QuestSystem.checkPreparationComplete(quest);
            }
          },
          {
            id: "ready_to_march",
            label: "Report Ready for March",
            execute: function(quest) {
              // Move to the next stage if all preparations are complete
              const requiredPreparations = quest.completedFormationTraining && quest.checkedEquipment;
              
              if (requiredPreparations) {
                window.addToNarrative("You report to the Sarkein that you've completed your preparations and are ready to march at dawn. He nods approvingly.\n\n\"Good to see a soldier who takes preparation seriously. Get some rest—we march at first light.\"");
                
                // Advance to the next stage
                window.QuestSystem.advanceQuestStage(quest.id);
              } else {
                window.addToNarrative("The Sarkein eyes you critically. \"Not so fast, soldier. I expect my troops to be fully prepared before reporting ready. At minimum, you should complete formation training and check your equipment. Dismissed.\"");
              }
            }
          }
        ],
        
        onStart: function(quest) {
          // Initialize tracking for this stage
          quest.completedFormationTraining = false;
          quest.checkedEquipment = false;
          quest.visitedQuartermaster = false;
        }
      },
      
      // Stage 2: The March
      {
        title: "The March",
        description: "March with your company to the Arrasi frontier, maintaining vigilance along the way.",
        introNarrative: "Dawn breaks with the blaring of horns and the rhythmic cadence of drums. Your company forms up at the eastern gate, shields gleaming in the early light. The Sarkein rides up and down the line, his voice carrying over the assembled troops.\n\n\"Today we march to the frontier! Keep your eyes sharp and your formation tight. The journey will test your endurance before we ever see the enemy.\"",
        
        actions: [
          {
            id: "begin_march",
            label: "Begin the March",
            execute: function(quest) {
              // Start the march sequence
              window.addToNarrative("The drums beat a marching pattern, and your company moves out through the gates. The familiar weight of your equipment settles on your shoulders as you begin what will be a long day's march toward the frontier.\n\nThe road stretches ahead, winding through the rolling hills of the Western Hierarchate. In the distance, the terrain grows more rugged, marking the approach to Arrasi territory.");
              
              // Reduce stamina from marching
              const staminaLoss = 30;
              window.gameState.stamina = Math.max(0, window.gameState.stamina - staminaLoss);
              window.updateStatusBars();
              
              // Start march events sequence
              setTimeout(() => window.QuestSystem.handleMarchEvent(quest, 0), 1500);
            }
          }
        ],
        
        onStart: function(quest) {
          // Initialize tracking for the march
          quest.marchProgress = 0;
          quest.marchEvents = 0;
          quest.scoutingSuccess = false;
        }
      },
      
      // Stage 3: The Raid
      {
        title: "The Raid",
        description: "Engage in a raid on the Arrasi settlement using shieldwall tactics.",
        introNarrative: "Your company crests the final ridge as dusk approaches. Below, nestled in a small valley, lies the Arrasi settlement—a cluster of stone buildings surrounded by farmland. The Sarkein signals for the company to halt and gather.\n\n\"Listen carefully,\" he addresses the assembled soldiers. \"Our target is their granary and any military supplies we can seize. We move in formation—a proper shieldwall. This is no time for lone heroics. We stay together, we fight together, we leave together. Questions?\"\n\nThe plan is simple but effective: the company will advance in a shieldwall formation, secure the objectives, and withdraw before Arrasi reinforcements can arrive.",
        
        actions: [
          {
            id: "start_battle",
            label: "Form the Shieldwall",
            execute: function(quest) {
              // Initialize the Shieldwall battle system
              window.addToNarrative("At the Sarkein's command, your company forms into a tight shieldwall. You take your position in the formation, shield raised and weapon ready. The sharp metallic sound of weapons being drawn ripples through the ranks.\n\n\"Forward!\" comes the command, and the shieldwall begins its advance toward the settlement.");
              
              // Trigger the Shieldwall battle system
              window.ShieldwallSystem.initiateBattle("arrasi_raid", {
                questId: quest.id,
                formation: "shieldwall",
                preparednessBonus: quest.scoutingSuccess ? 10 : 0 // Bonus if scouting was successful
              });
            }
          }
        ],
        
        onStart: function(quest) {
          // Initialize battle tracking
          quest.battleOutcome = null;
          quest.casualtiesSustained = 0;
          quest.objectivesSecured = 0;
        }
      },
      
      // Stage 4: Return to Camp
      {
        title: "Return to Camp",
        description: "Return to the Kasvaari's Camp with your company, reporting on the raid's outcome.",
        introNarrative: "The raid complete, your company withdraws from the Arrasi settlement in good order. The march back is tense at first, all eyes watching for pursuit, but you soon cross back into imperial territory.\n\nAs the familiar walls of the Kasvaari's Camp come into view, a sense of relief washes over the company. The gates open to receive you, and the Sarkein calls for the officers to prepare their reports.",
        
        actions: [
          {
            id: "report_to_sarkein",
            label: "Report to the Sarkein",
            execute: function(quest) {
              // Report results and complete the quest
              let narrative = "You join the Sarkein and other officers in the command tent. Maps of the frontier region are spread across the central table, with markers indicating the location of your raid.\n\n\"Report,\" the Sarkein orders, looking directly at you.";
              
              // Different outcomes based on battle success
              if (quest.battleOutcome === 'victory') {
                narrative += "\n\nYou detail the successful raid, describing how the shieldwall held firm against the Arrasi defenders and how the company secured the targeted supplies. The Sarkein nods with approval.\n\n\"Well executed. The intelligence and supplies you've brought back will be valuable for planning future operations in the region. The company performed admirably—your formation training clearly paid off.\"";
              } else if (quest.battleOutcome === 'partial') {
                narrative += "\n\nYou report on the raid's mixed results, explaining how the company secured some objectives but faced significant resistance. The shieldwall held, but not without cost.\n\n\"Not a complete success, but acceptable,\" the Sarkein comments. \"We learned valuable information about their defenses, even if we didn't secure everything we wanted. Next time, we'll be better prepared.\"";
              } else {
                narrative += "\n\nYou grimly report on the difficulties encountered during the raid—how the Arrasi defenders were more numerous and better prepared than expected, forcing a withdrawal before the objectives could be secured.\n\n\"A setback, but not a failure,\" the Sarkein says firmly. \"We've gained intelligence about their defensive capabilities, and that alone makes this operation worthwhile. The company fought well under difficult circumstances.\"";
              }
              
              narrative += "\n\nThe debriefing continues as other officers add their observations. By the end, plans are already being formed for the next operation, incorporating lessons from your raid.";
              
              window.setNarrative(narrative);
              
              // Complete the quest
              window.QuestSystem.completeQuest(quest.id);
            }
          }
        ],
        
        onStart: function(quest) {
          // Nothing special to initialize here
        }
      }
    ],
    
    // Objectives
    objectives: {
      // Can add specific objectives that track progress if needed
    },
    
    // Rewards
    rewards: {
      experience: 100,
      taelors: 50,
      items: ["healthPotion", "repairKit"],
      skills: {
        discipline: 0.3,
        tactics: 0.2
      }
    },
    
    // Complete when all objectives are met
    completeOnAllObjectives: false,
    
    // Callback on quest completion
    onComplete: function(quest) {
      window.showNotification("Your performance in the raid has been noted by the Sarkein", "success");
      
      // Could set flags for future quests or unlock new content
    },
    
    // Narrative for quest completion
    completionNarrative: "The frontier raid has concluded. Whether a resounding success or a learning experience, your participation in the shieldwall has given you valuable battlefield experience. The Sarkein has taken note of your performance, which may influence future assignments.",
    
    // Narrative for quest failure
    failureNarrative: "The frontier raid ended in disaster. Your company has returned to camp significantly depleted, and the Sarkein is not pleased with the outcome. Nevertheless, lessons have been learned for future operations."
  }
};

/**
 * Check if all preparation actions for the Raid quest have been taken
 * @param {Object} quest The quest object
 */
window.QuestSystem.checkPreparationComplete = function(quest) {
  if (quest.id !== "raid_the_frontier") return;
  
  // Check if all required preparations are complete
  if (quest.completedFormationTraining && quest.checkedEquipment) {
    // Update the "Report Ready" action to show it's available
    const reportAction = document.querySelector('[data-action="ready_to_march"]');
    if (reportAction) {
      reportAction.style.backgroundColor = "#3a623d"; // Green background
      reportAction.innerHTML = "Report Ready for March ✓";
    }
  }
};

/**
 * Handle march events for the Raid quest
 * @param {Object} quest The quest object
 * @param {Number} eventIndex Index of the current event
 */
window.QuestSystem.handleMarchEvent = function(quest, eventIndex) {
  if (quest.id !== "raid_the_frontier") return;
  
  // Define march events
  const marchEvents = [
    // Event 1: Initial march
    function() {
      window.addToNarrative("The morning sun climbs higher as your company marches steadily eastward. The weight of your equipment and the rhythm of the march gradually wear on your stamina. Around you, your comrades maintain formation, shields occasionally clinking against armor with each step.");
      
      // Reduce stamina
      const staminaLoss = 10;
      window.gameState.stamina = Math.max(0, window.gameState.stamina - staminaLoss);
      window.updateStatusBars();
      
      // Advance time
      window.updateTimeAndDay(120); // 2 hours
      
      // Continue to next event
      setTimeout(() => window.QuestSystem.handleMarchEvent(quest, 1), 3000);
    },
    
    // Event 2: Terrain changes
    function() {
      window.addToNarrative("The terrain grows more rugged as you approach the frontier. The well-maintained imperial roads give way to rougher paths. The Sarkein orders a brief halt to rest and check equipment before continuing.\n\nYou take the opportunity to adjust your gear and catch your breath. The frontier lands have a different character—wilder, less cultivated, with strange crystalline formations occasionally visible in the distance.");
      
      // Recover some stamina
      const staminaRecovery = 15;
      window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + staminaRecovery);
      window.updateStatusBars();
      
      // Advance time
      window.updateTimeAndDay(30); // 30 minutes
      
      // Continue to next event
      setTimeout(() => window.QuestSystem.handleMarchEvent(quest, 2), 3000);
    },
    
    // Event 3: Scouting opportunity
    function() {
      window.addToNarrative("As the company approaches the border region, the Sarkein selects a small scouting party to move ahead and gather intelligence on the Arrasi settlement. He glances in your direction.\n\n\"You—join the scouts. Your eyes look sharp enough. Report back what you see, but don't engage.\"");
      
      // Create scouting dialog
      const dialogId = 'scouting-mission-dialog';
      let dialog = document.getElementById(dialogId);
      
      if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = dialogId;
        dialog.className = 'quest-dialog';
        document.body.appendChild(dialog);
      }
      
      dialog.innerHTML = `
        <div class="quest-dialog-content">
          <h2 class="quest-dialog-title">Scouting Mission</h2>
          <div class="quest-dialog-description">
            The Sarkein has assigned you to a scouting party. How will you approach this task?
          </div>
          
          <div class="quest-dialog-details">
            <p>A successful scouting mission could provide valuable intelligence for the upcoming raid, potentially making the battle easier. However, getting too close to the settlement risks detection.</p>
          </div>
          
          <div class="quest-dialog-actions">
            <button id="cautious-scouting-btn" class="action-btn">Scout Cautiously</button>
            <button id="thorough-scouting-btn" class="action-btn">Scout Thoroughly</button>
          </div>
        </div>
      `;
      
      // Show the dialog
      dialog.style.display = 'flex';
      
      // Add event listeners
      document.getElementById('cautious-scouting-btn').addEventListener('click', () => {
        // Cautious scouting - safer but less information
        dialog.style.display = 'none';
        
        window.addToNarrative("You opt for a cautious approach, maintaining a safe distance from the settlement while still gathering useful information. Using the terrain for cover, you observe the settlement's basic layout and note the patrol patterns of the Arrasi defenders.\n\nReturning to the company, you report your findings to the Sarkein. The intelligence is useful, though not comprehensive.");
        
        // Low chance of success but no stamina penalty
        quest.scoutingSuccess = Math.random() < 0.4;
        
        if (quest.scoutingSuccess) {
          window.addToNarrative("The Sarkein nods approvingly. \"Good work. This information will help us plan our approach.\"");
          
          // Small bonus to survival skill
          const survivalImprovement = 0.1;
          const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
          
          if (window.player.skills.survival < survivalCap) {
            window.player.skills.survival = Math.min(survivalCap, window.player.skills.survival + survivalImprovement);
            window.showNotification(`Your survival skills improved by ${survivalImprovement.toFixed(1)}`, 'success');
          }
        } else {
          window.addToNarrative("The Sarkein frowns slightly. \"Minimal information, but better than nothing. We'll have to adapt once we're closer.\"");
        }
        
        // Continue to next event
        setTimeout(() => window.QuestSystem.handleMarchEvent(quest, 3), 3000);
      });
      
      document.getElementById('thorough-scouting-btn').addEventListener('click', () => {
        // Thorough scouting - more risky but better information
        dialog.style.display = 'none';
        
        window.addToNarrative("You push closer to the settlement, determined to gather detailed intelligence. Moving from cover to cover, you note the number and positions of defenders, identify the granary and other key structures, and observe the settlement's defensive weaknesses.\n\nThe risk pays off—until an Arrasi patrol nearly stumbles upon your position. You're forced to remain motionless in uncomfortable concealment for nearly an hour before making your escape.");
        
        // Higher chance of success but stamina penalty
        quest.scoutingSuccess = Math.random() < 0.7;
        
        // Stamina penalty from extended scouting and stress
        const staminaLoss = 20;
        window.gameState.stamina = Math.max(0, window.gameState.stamina - staminaLoss);
        window.updateStatusBars();
        
        if (quest.scoutingSuccess) {
          window.addToNarrative("The Sarkein studies your detailed report with interest. \"Excellent work. This intelligence will significantly improve our chances of success.\"");
          
          // Larger bonus to survival skill
          const survivalImprovement = 0.2;
          const survivalCap = Math.floor((window.player.phy + window.player.men) / 3);
          
          if (window.player.skills.survival < survivalCap) {
            window.player.skills.survival = Math.min(survivalCap, window.player.skills.survival + survivalImprovement);
            window.showNotification(`Your survival skills improved by ${survivalImprovement.toFixed(1)}`, 'success');
          }
          
          // Experience bonus for successful risk
          window.gameState.experience += 15;
          window.showNotification(`+15 XP from successful scouting`, 'success');
        } else {
          window.addToNarrative("The Sarkein listens to your report with a grim expression. \"You took an unnecessary risk. The information is useful, but it could have compromised the entire mission if you'd been captured.\"");
        }
        
        // Continue to next event
        setTimeout(() => window.QuestSystem.handleMarchEvent(quest, 3), 3000);
      });
    },
    
    // Event 4: Final approach
    function() {
      window.addToNarrative("The company resumes its march toward the Arrasi settlement, now moving with greater caution. Scouts report the terrain ahead, guiding the formation around potential ambush points. The sun begins its descent toward the horizon as you approach the final ridge.\n\nThe Sarkein orders a halt just short of the crest. \"We'll rest here until dusk, then move in with the fading light. Check your equipment one last time. The real test comes soon.\"");
      
      // Recover stamina
      const staminaRecovery = 25;
      window.gameState.stamina = Math.min(window.gameState.maxStamina, window.gameState.stamina + staminaRecovery);
      window.updateStatusBars();
      
      // Advance time
      window.updateTimeAndDay(180); // 3 hours
      
      // Continue to next event
      setTimeout(() => window.QuestSystem.handleMarchEvent(quest, 4), 3000);
    },
    
    // Event 5: Arrival at objective
    function() {
      // Advance to the next stage (The Raid)
      window.QuestSystem.advanceQuestStage(quest.id);
    }
  ];
  
  // Execute the current event
  if (eventIndex < marchEvents.length) {
    marchEvents[eventIndex]();
  }
};
