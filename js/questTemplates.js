// Quest Templates Data
// This file contains quest templates data separated from quest logic

// Define quest templates as pure data
window.questTemplates = {
  // Raid the Frontier quest template
  raid_frontier: {
    id: 'raid_frontier',
    title: 'Raid the Frontier',
    description: 'The Sarkein has ordered a raid on an Arrasi outpost near the frontier. Prepare your gear and be ready to march at dawn.',
    stages: [
      {
        id: 'stage_dispatch',
        description: 'You\'ve received orders from Sarkein Reval to prepare for a raid on an Arrasi outpost.',
        objective: 'Report to the Sarkein\'s tent for briefing.',
        action: 'report',
        battleType: 'narrative',
        narrative: `<p>Your Vayren orders you to report to the command tent with the rest of your Squad. The interior is sparse but organized, with maps of the frontier spread across a sturdy wooden table. Sarkein Reval, a weathered veteran with a scar crossing his left eye, addresses the assembled soldiers.</p>
          
          <p>"Listen well," he says, his voice carrying throughout the tent. "Our scouts have identified an Arrasi outpost near the frontier that's been a staging ground for raids on our supply lines. Our Spear Host has been selected to neutralize it."</p>
          
          <p>He points to a location on the map. "The outpost is here, a half-day's march to the west. It's lightly garrisoned - perhaps twenty men - but they have good visibility of the surrounding area. We'll need to move quickly and quietly."</p>
          
          <p>"Your objective is to disable the outpost - eliminate the garrison, destroy any supplies, and burn the structures. We move out at dawn tomorrow. Use today to prepare."</p>
          
          <p>The Sarkein looks over the gathered soldiers with a steady gaze. "Any questions?"</p>
          
          <p>When no one speaks up, he dismisses the assembly. "Prepare well. The Empire depends on it."</p>`,
        nextStage: 'stage_preparation'
      },
      {
        id: 'stage_preparation',
        description: 'The raid will commence tomorrow at dawn. You have one day to prepare your equipment and rest.',
        objective: 'Prepare for the raid (1 day).',
        action: 'prepare',
        battleType: 'narrative',
        narrative: `<p>You spend the day preparing for tomorrow's raid. You inspect your equipment, carefully checking your armor for weak spots and ensuring your weapons are in good condition. You also visit the quartermaster to procure any necessary supplies.</p>
          
          <p>Around camp, other soldiers are similarly engaged in preparation. Some practice formations, others sharpen blades or repair armor. There's a quiet tension in the air - the anticipation of combat.</p>
          
          <p>You take time to rest and mentally prepare yourself for what lies ahead. Tomorrow will bring danger, but also an opportunity to prove your worth to the Kasvaari.</p>`,
        timeAdvance: 1440, // 24 hours
        nextStage: 'stage_march'
      },
      {
        id: 'stage_march',
        description: 'Your unit marches toward the frontier, a half-day\'s journey through increasingly rough terrain.',
        objective: 'March to the frontier.',
        action: 'proceed',
        battleType: 'narrative',
        timeAdvance: 700, 
        narrative: `<p>Dawn breaks with a blood-red sun as your Spear Host assembles at the camp's edge. The Sarkein inspects the units briefly, then gives the order to move out. The column of soldiers winds its way westward, shields and spears glinting in the early morning light.</p>
          
          <p>The terrain grows increasingly rugged as you approach the frontier. The column moves in practiced silence, with scouts ranging ahead and to the flanks. Dust clings to your armor and throat as the hours pass.</p>
          
          <p>By midday, you've reached a ridge overlooking a shallow valley. The Sarkein calls for a halt and gathers the Vayrens of each Squad.</p>
          
          <p>You see him point westward, but you can't make out anything they are saying. </p>
          
          <p>A moment later, your Vayren returns to your squad with orders. "Our unit is to provide a small scouting party to circle north and assess their defenses. Three soldiers. Volunteers?"</p>`,
        choices: [
          {
            text: "Volunteer.",
            action: "volunteer_scout",
            nextStage: "stage_scout"
          },
          {
            text: "Remain silent.",
            action: "remain_silent",
            nextStage: "stage_wait"
          }
        ]
      },
      {
        id: 'stage_wait',
        description: 'You dont take the opportunity to volunteer for the scouting mission.',
        objective: 'Wait for the scouts to return.',
        action: 'wait',
        battleType: 'narrative',
        narrative: `<p>You dont take the opportunity to volunteer for the scouting mission.</p>
        
        <p>Hours pass as you wait for the scouting party to return. You can't help but wonder if they've gotten into trouble.</p>
        
        <p>When they finally do show up, they're bloodied and bruised. It seems they encountered an Arrasi patrol but managed to take care of them, ensuring no alarm was raised in preparation of our attack.</p>
        
        <p>The Vayren gathers your squad, then moves to relay the information to Sarkein Reval, who immediately gives the mobilization order. Within the hour, our assault will begin.</p>`,
        timeAdvance: 240,             
        nextStage: 'stage_assault'     
      },
      {
        id: 'stage_scout',
        description: 'You step up, volunteering as a scout.',
        objective: 'Participate in scouting the outpost.',
        action: 'proceed',
        battleType: 'narrative',
        narrative: `<p>You step up, volunteering as a scout.</p>
        
          <p>Your small scouting party - consisting of you and two fellow soldiers from your Squad - begins circling wide around the valley to approach the outpost from the north. One of your companions is a quiet Nesian with sharp eyes, the other a burly Paanic veteran.</p>
          
          <p>Moving from cover to cover, you gradually work your way closer to the Arrasi position. The outpost comes into view: a wooden palisade surrounding several structures, with a larger central building that appears to be the command post. Two watchtowers stand at opposite corners, each manned by a single guard.</p>
          
          <p>Your trio holds position while you take turns crawling forward to a better vantage point. From here, you can see movement within the compound - perhaps fifteen to twenty soldiers moving with the casual confidence of men who don't expect trouble.</p>
          
          <p>As you're about to retreat and report your findings, your instincts warn you of potential danger nearby...</p>`,
        
        // Add a stat check for spotting the patrol
        statCheck: {
          type: 'skill',
          stat: 'survival',
          attribute: 'men', // Add mental attribute to survival skill
          difficulty: 2,
          successText: `<p>Your heightened senses and training alert you to subtle signs - disturbed vegetation, a faint metallic glint in the distance. You signal your companions to freeze as you scan the area more carefully.</p>
            
            <p>Through the brush, you spot an Arrasi patrol of four soldiers moving along a path that will take them directly past your position. They haven't noticed you yet.</p>`,
          failureText: `<p>Despite your best efforts, you fail to notice the approaching patrol until it's almost too late. The sound of voices and boots on gravel alerts you to their presence.</p>
            
            <p>An Arrasi patrol of four soldiers is heading directly toward your position, and they're close - too close to retreat without being seen.</p>`
        },  // Define different outcomes based on the check
        outcomes: {
          success: {
            nextStage: 'stage_ambush_advantage', // New stage for successful detection
            narrativeAddition: `<p>With enough warning, you and your companions have time to prepare an ambush. You quickly find concealed positions and ready your weapons, waiting for the perfect moment to strike.</p>`,
            rewards: {
              experience: 15,
              skillImprovements: {
                survival: 0.1
              }
            }
          },
          failure: {
            nextStage: 'stage_ambush', // Original stage where you face two enemies
            narrativeAddition: `<p>With no time to prepare, you and your companions must face the patrol at a disadvantage. You huddle lower, hoping to at least gain the element of surprise as they pass by.</p>`,
            penalties: {
              stamina: -10
            }
          }
        }
      },
     // Add a new stage for the advantage path
{
  id: 'stage_ambush_advantage',
  description: 'Having spotted the patrol early, you prepare an effective ambush.',
  objective: 'Ambush the Arrasi patrol from an advantageous position.',
  action: 'combat',
  battleType: 'individual',
  enemyType: "ARRASI_VAELGORR", // Only one enemy instead of two
  combatOptions: {
    requireDefeat: true
  },
  narrative: `<p>From your concealed positions, you and your companions watch as the Arrasi patrol approaches. The soldiers move with the casual confidence of men on routine duty, completely unaware of the danger.</p>
    
    <p>You signal to your companions, coordinating your attack for maximum effect. As the patrol passes by, your companions strike from the sides, quickly eliminating three of the Arrasi soldiers before they can react.</p>
    
    <p>The remaining soldier - a more alert guard at the rear of the patrol - manages to draw his weapon as he realizes what's happening. He turns to face you, his eyes wide with the sudden understanding that he is alone.</p>`,
  successText: "With the advantage of your well-executed ambush, you dispatch the final Arrasi soldier before he can raise an alarm. The patrol has been eliminated with impressive efficiency.",
  failureText: "Despite your advantageous position, the remaining Arrasi soldier proves more skilled than anticipated. You lay in the dirt, listening to your comrades fighting as your consciousness fades away.",
  timeAdvance: 240, 
  nextStage: 'stage_patrol_report'
},

// Original ambush stage remains (for the failure path)
{
  id: 'stage_ambush',
  description: 'While scouting, you encounter an Arrasi patrol. The element of surprise is compromised.',
  objective: 'Deal with the patrol.',
  action: 'combat',
  battleType: 'individual',
  enemyType: ["ARRASI_VAELGORR", "ARRASI_VAELGORR"],
  combatOptions: {
    requireDefeat: true 
  },
  narrative: `<p>Your scouting party exchanges urgent signals as the patrol approaches. There are four Arrasi soldiers - too many to let pass, too many to ambush without risk of raising the alarm.</p>
    
    <p>Without the advantage of preparation, you must face multiple opponents at once. You ready your weapons as the patrol draws closer, hearts pounding, knowing that the success of the entire mission now hinges on silencing these men quickly.</p>
    
    <p>Two of the Arrasi soldiers notice your movement and call out an alarm. The element of surprise is lost as they draw their weapons and charge toward your position!</p>`,
  successText: "The last Arrasi soldier falls, and your scouting party quickly drags the bodies into the underbrush. The three of you need to report back to the Sarkein quickly.",
  failureText: "You find yourself overwhelmed by the Arrasi patrol. As consciousness fades, you hear shouts of alarm being raised.",
  timeAdvance: 240, 
  nextStage: 'stage_patrol_report'
},
      {
        id: 'stage_patrol_report',
        description: 'Having eliminated the patrol, you must report back to the main force.',
        objective: 'Return to the main force and report your findings.',
        action: 'report',
        battleType: 'narrative',
        narrative: `<p>Your scouting party hurries back to the main force and reports your findings to the Sarkein, including the patrol you eliminated.</p>
          
          <p>"Good work handling that patrol," he says grimly, "but we've lost the luxury of time. We attack now, before they realize something's wrong."</p>
          
          <p>He rapidly issues orders, dividing the Spear Host into three assault groups. "First group will create a diversion at the main gate. Second group will scale the eastern wall. Third group, with me, will breach from the west once their attention is divided."</p>
          
          <p>Your Squad is assigned to the second group, tasked with scaling the eastern wall. The plan is set, and with grim determination, your forces move into position.</p>
          
          <p>The attack begins with a barrage of flaming arrows arcing toward the front gate. Shouts of alarm erupt from within the outpost. As the Arrasi soldiers rush to defend the main entrance, your group hurries toward the eastern wall with scaling ladders.</p>`,
        nextStage: 'stage_assault'
      },
      {
        id: 'stage_assault',
        description: 'With the patrol eliminated, your unit must now assault the outpost before reinforcements arrive.',
        objective: 'Assault the Arrasi outpost.',
        action: 'combat',
        battleType: 'individual',
        enemyType: 'ARRASI_VAELGORR',
        combatOptions:{
          requireDefeat: false,
          maxTurns: 45,
          enemySequence: [
            { type: ["ARRASI_DRUSKARI", "ARRASI_VAELGORR"], waves: 2 },
            { type: ["ARRASI_VAELGORR", "ARRASI_VAELGORR"], waves: 2},
          ],
        },
        narrative: `<p>The attack begins in earnest. The first assault group launches flaming arrows over the palisade, creating a diversion at the main gate. Shouts and alarms ring out across the outpost.</p>
          
          <p>As the Arrasi defenders rush to the main entrance, your group quickly approaches the eastern wall with scaling ladders. You position your ladder against the wall and prepare to climb.</p>
          
          <p>The third group, led by the Sarkein himself, circles to the western side of the outpost. The coordinated assault has begun.</p>
          
          <p>You reach the top of the wall and come face to face with an Arrasi defender. Your sword is drawn as you prepare to engage in combat.</p>`,
        successText: "The fighting is intense but brief. The Arrasi garrison, caught between three attacking forces, is quickly overwhelmed. Within minutes, the outpost is secured.",
        failureText: "The assault goes poorly. The Arrasi defenders are more numerous and better prepared than expected. As casualties mount, the Sarkein gives the order to withdraw.",
        nextStage: 'stage_return'
      },
      {
        id: 'stage_return',
        description: 'The raid was successful. Time to return to camp with the spoils and report to the Sarkein.',
        objective: 'Return to camp and report success.',
        action: 'complete',
        battleType: 'narrative',
        narrative: `<p>Your Spear Host returns to camp victorious, bearing captured supplies and valuable intelligence. The elimination of the Arrasi outpost represents a significant blow to enemy operations in the region.</p>
          
          <p>Later that evening, Sarkein Reval gathered the unit in our camp. There he stood, in the center of near a hundred men with the wagon containing the spoils from the Arrasi outpost. He gave a brief speech, recognizing some of your fellow soldiers for their heroics. You are not named.</p>

          <p>You collect your share and head to your quarters for the night.</p>`
        }

    ],
    baseReward: {
      experience: 100,
      taelors: 150,
      items: ['health_Potion', 'arrasi_blade', 'arrasi_pendant',]
    },
    minDayToTrigger: 2,         // Only available after day 2
    chanceTrigger: 1,        // 25% chance of triggering when conditions are met
    cooldownDays: 5             // Must wait 5 days between assignments of this quest
  },
};
