// Quest Templates Data
// This file contains quest templates data separated from quest logic

// 7 days: 1440 × 7 = 10080

// 14 days: 1440 × 14 = 20160

// 30 days: 1440 × 30 = 43200 

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
        narrative: `<p>Your Vayren orders you to report to the command tent with the rest of your squad. The interior is sparse but organized, with maps of the frontier spread across a sturdy wooden table. Sarkein Reval, a weathered veteran with a scar crossing his left eye, addresses the assembled soldiers.</p>
          
          <p>"Listen well," he says, his voice carrying throughout the tent. "Our scouts have identified an Arrasi outpost near the frontier that's been a staging ground for raids on our supply lines. Our Spear Host has been selected to neutralize it."</p>
          
          <p>He points to a location on the map. "The outpost is here, a half-day's march to the west. It's lightly garrisoned - perhaps twenty men - but they have good visibility of the surrounding area. We'll need to move quickly and quietly."</p>
          
          <p>"Our objective is to disable the outpost - eliminate the garrison, destroy any supplies, and burn the structures. We move out at dawn tomorrow. Use today to prepare."</p>
          
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
        narrative: `<p>Around camp, other soldiers are similarly engaged in preparation. Some practice formations, others sharpen blades or repair armor. There's a quiet tension in the air - the anticipation of combat.</p>
          
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
        timeAdvance: 600, 
        narrative: `<p>Dawn breaks with a blood-red sun as your Spear Host assembles at the camp's edge. The Sarkein inspects the units briefly, then gives the order to move out. The column of soldiers winds its way westward, shields and spears glinting in the early morning light.</p>
          
          <p>The terrain grows increasingly rugged as you approach the frontier. The column moves in practiced silence, with scouts ranging ahead and to the flanks. Dust clings to your armor and throat as the hours pass.</p>
          
          <p>By midday, you've reached a ridge overlooking a shallow valley. The Sarkein calls for a halt and gathers the Vayrens of each Squad.</p>
          
          <p>You see him point westward, but you can't make out anything they are saying. </p>
          
          <p>A moment later, your Vayren returns to your squad with orders. "Our unit is to provide a small scouting party to circle north and assess their defenses. Three soldiers. Volunteers?"</p>`,
        choices: [
          {
            text: "Volunteer.",
            action: "volunteer",
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
          difficulty: 3,
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
              deeds: 1,
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
  enemyType: 'ARRASI_VAELGORR', // Only one enemy instead of two
  allies: ['PAANIC_REGULAR'],
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
          
          <p>He rapidly issues orders, dividing the Spear Host into three assault groups. As if no time passed at all, you find yourself rushing toward palisade walls.</p>`,
        nextStage: 'stage_assault'
      },
      {
        id: 'stage_assault',
        description: 'With the patrol eliminated, your unit must now assault the outpost before reinforcements arrive.',
        objective: 'Assault the Arrasi outpost.',
        action: 'combat',
        battleType: 'individual',
        enemyType: 'ARRASI_VAELGORR',
        allies: ['PAANIC_REGULAR'],
        combatOptions:{
          requireDefeat: false,
          maxTurns: 65,
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
      deeds: 100,
      taelors: 150,
      items: ['health_Potion', 'arrasi_blade', 'arrasi_pendant',]
    },
    minDayToTrigger: 100,         // Only available after day 2
    chanceTrigger: 1,        // 25% chance of triggering when conditions are met
    cooldownDays: 5             // Must wait 5 days between assignments of this quest
  },
};








// Add a new campaign quest template example
window.questTemplates.frontier_campaign = {
  id: 'frontier_campaign',
  title: 'Advance to the Frontier',
  description: 'Our Kasvaari will join up with the main invasion force, and advance to the Arrasi Frontier. Prepare for a long march.',
  isCampaignQuest: true, // Flag to mark as campaign quest
  campaignPartId: 'part_1', // Which campaign part this belongs to
  
  stages: [
    {
      id: 'stage_orders',
      description: 'You\'ve received orders to prepare for a march to the Arrasi Frontier.',
      objective: 'Receive orders...',
      action: 'report',
      battleType: 'narrative',
      narrative: `<p>The camp buzzes with activity as orders pass down from the command tent. Sarkein Reval gathers all eighty members of the Spear Host at the center of the camp and announces that you'll be moving out soon.</p>
      
      <p>This is it. This is what you’ve been preparing for over the past few months. The anticipation in the camp is palpable. You can only hope your training has prepared you for what’s to come.</p>
      
      <p>You'll be joining the rest of the invasion force at the Wall of Nesia-- a bastion that spans the length of Nesia's western border. On the other side, the Arrasi kingdoms of the peninsula stake their claim.</p>`,
      nextStage: 'stage_preparation',
      timeAdvance: 10080, 
    },

    {
      id: 'stage_preparation',
      description: 'Fall in and begin your march.',
      objective: 'Form up',
      action: 'proceed',
      battleType: 'narrative',
      narrative: `<p>A week later, your Spear Host is among the last to dismantle their section of camp and fall into formation with the rest of the Kasvaari.</p>

      <p>Unsurprisingly, your unit is also one of the last in the column, trailing at the very end of the Kasvaari. Even so, the Wall of Nesia looms ever larger on the horizon, dominating more of the backdrop with each passing mile.</p>
      
      <p>Apparently, the Armarin--the invasion force that you are currently marching to join with--is expected to be around 30,000 strong once all forces are assembled.`,
      nextStage: 'stage_march',
      timeAdvance: 10080, 
    },

    {
      id: 'stage_march',
      description: 'Your march continues.',
      objective: 'Stay in line, soldier.',
      action: 'proceed',
      battleType: 'narrative',
      narrative: `<p>Dont Oslotheon, the Hierarch of Eterpau and King of the Nesians, has marshaled his own force of 15,000 under the command of his brother, Adiv, the Sceptremarch.</p>
      
      <p>They will be fighting alongside our Armarin. This is good news — the Nesian Heirknights are renowned heavy cavalry, and their sharpshooters have served in the Paanic ranks since their conquest.</p>
      
      <p>You can't help but wonder what the stakes are for the Nesian nobility.</p>`,
      nextStage: 'stage_march2',
      timeAdvance: 10080, 
    },

    {
      id: 'stage_march2',
      description: 'The Wall of Nesia looms ahead.',
      objective: 'Enter the sprawling camp at the Wall.',
      action: 'proceed',
      battleType: 'narrative',
      narrative: `<p>By dusk, you crest a final hill and there it is — the Wall of Nesia, rising like a jagged spine of stone and timber. Its ramparts bristle with banners, each marking a different Kasvaari or Nesian host.</p>
      
      <p>The sprawling camp at its base is a chaotic mass of tents, fires, and soldiers moving with purpose. Officers bark orders, smiths hammer out fresh weapons, and clusters of riders thunder down the roads delivering messages.</p>
      
      <p>It's clear that this is no mere encampment — it's a war machine prepared to grind forward. Your unit is directed to pitch camp near the northern wing, among a host of veteran Kasvaari's. Their hardened faces regard your unit with clear pity, though some throw you curt nods.</p>
      
      <p>You get to work digging in.</p>`,
      nextStage: 'stage_muster',
      timeAdvance: 4320, 
    },

    {
      id: 'stage_muster',
      description: 'Muster and prepare to march into enemy territory.',
      objective: 'Form ranks with the Iron Legion.',
      action: 'proceed',
      battleType: 'narrative',
      narrative: `<p>A week passes very quickly. In the morning, your unit assembles in formation as the muster horn sounds. Alongside your Kasvaari, other units fall into their places, swelling your force to a powerful 7,000 strong — a Vaoseht, an Iron Legion.</p>
      
      <p>The Vaorin, a grim-faced man clad in lacquered black armor, rides past on a powerful destrier. His gaze lingers on your formation a moment longer than the others before he wheels away, satisfied.</p>
      
      <p>Word spreads quickly: enemy fortifications lie ahead, barring the way to the Crystalline Plains. Worse still, scouts report that two Arrasi Kings have combined their forces — a host of some 14,000 — and they are somewhere in the border region.</p>
      
      <p>Your unit marches past the Wall of Nesia in a long, grinding column. The air is thick with the scent of oil and iron. Somewhere ahead, war waits.</p>
      
      <p>You wonder if you'll ever see the towering feudalscapes of Nesia again.</p>`,
      nextStage: 'stage_prebattle',
      timeAdvance: 10080, 
    },

    {
      id: 'stage_prebattle',
      description: 'Battle looms...',
      objective: 'Stay in formation. Remember your training.',
      action: 'proceed',
      battleType: 'narrative',
      narrative: `<p>The border frontier is a desolate place — semi-hilly, with gravel crunching underfoot for mile after mile. You struggle to imagine how anyone survives here; no wonder the Arrasi kingdoms are raiders, living off plunder.</p>
      
      <p>Your 7,000-strong force finally comes within two miles of your destination — a fortified hill pass blocking the only viable route forward. There’s no way around it; you'll have to attack head-on.</p>
      
      <p>Camp is established about a mile and a half away, perched on high ground. From there, you can see the pass and far beyond — no doubt the Arrasi have dispatched riders already, warning of your advance.</p>
      
      <p>That evening, orders come down from the Vaorin. The assault is set for dawn. The camp remains busy into the night — weapons sharpened, ladders constructed, and warriors lingering by the fires, knowing what tomorrow will bring.</p>`,
      nextStage: 'stage_battle',
      timeAdvance: 1440, 
    },

    {
      id: 'stage_battle',
      description: 'Battle!',
      objective: 'Stay alive, do your duty. For the Paanic Empire!',
      action: 'proceed',
      battleType: 'narrative',
      narrative: `<p>Come dawn, your Kasvaari is the second to form up in the pass.</p>
      
      <p>Most of the men stand silent as the dead. A mix of tension and eagerness swells within you — your first real engagement lies ahead.</p>
      
      <p>The horns sound, signalling the attack to begin.</p>`,
      timeAdvance: 60, 

      statCheck: {
        type: 'skill',
        stat: 'melee',
        attribute: 'phy', 
        difficulty: 3,
        successText: `<p>Your Sarkein personally orders you and a few others from your squad to the front to join the vanguard. You quickly move up, joining a smaller element of around 500 regulars. Most of them are veterans, and you feel out of place.</p>`,
        failureText: `<p>Your Sarkein personally orders some of the more experienced members of your squad to join the vanguard. You don't envy them, but part of you wishes you were honored with the duty.</p>`,
      },  
      outcomes: {
        success: {
          nextStage: 'stage_precombat', 
          narrativeAddition: `<p>You're led by a hardened Sen'Vaorin named Darius. You notice that it is not a traditional Paanic name, but the men seem to revere his ability.</p>
          <p>You are quickly organized into a smaller group of around 50. You will storm the far right wall, making a ladder assault with the rest of the vanguard in that section. Within minutes, you find yourself assailed by enemy projectiles, the defenders desperately doing anything to ward off your advance!`,
        },
        failure: {
          nextStage: 'stage_wait', 
          narrativeAddition: `<p>You stand in formation. This is all you can do for now. From many rows back, it's hard to make out exactly what's happening ahead of you, but you can see the mass of Paanic Regulars making their assault across the walls of the bastion ahead.</p>`,
          timeAdvance: 60,
        }
      }
     },


     {
      id: 'stage_precombat',
      description: 'Battle!',
      objective: 'You\'re in the vanguard! The din of battle crashes around you. Stay alive, do your duty. For the Paanic Empire!',
      action: 'proceed',
      battleType: 'narrative',
      narrative: `<p>You march forward with the vanguard element. You try your best to... `,
      choices: [
        {
          text: "Stay alive.",
          action: "selfpreserve",
          nextStage: "stage_selfpreserve",
          requiresShield: true,
        },
        {
          text: "Protect the ladders.",
          action: "protect",
          nextStage: "stage_protect",
          requiresShield: true
        },
        {
          text: "Stay alive.",
          action: "prepare",
          nextStage: "stage_survival",
        }
      ],
     },

     {
      id: 'stage_selfpreserve',
      description: 'Battle!',
      objective: 'You\'re in the vanguard! The din of battle crashes around you. Stay alive, do your duty. For the Paanic Empire!',
      action: 'proceed',
      battleType: 'narrative',
      narrative: `<p>You decide to just try to stay alive. Risking your life to protect the ladders is suicidal.</p>
      
      <p>You quickly realize that you aren't special in that regard anyway. Some defenders seem to call you out from atop the walls, directing their volley toward your position!</p>`,
     
      statCheck: {
        type: 'skill',
        stat: 'survival',
        attribute: 'phy', 
        difficulty: 3,
        successText: `<p>You quickly raise your shield and defend yourself against the incoming projectiles.</p>`,
        failureText: `<p>Your defensive posture is lacking, and one of the arrows lands true.</p>`,
      },  
      outcomes: {
        success: {
          nextStage: 'stage_vanguard', 
          narrativeAddition: `The projectiles are deflected from your shield as a result of your well-timed defensive posture. Moments later, you find yourself fighting atop the walls.`,
        },
        failure: {
          nextStage: 'stage_vanguard', 
          narrativeAddition: `<p>A grazing hit, but it stings. Moments later, you find yourself fighting atop the walls.</p>`,
          penalties: {
            health: -8
          }
        }
      }
     },

     {
      id: 'stage_survival',
      description: 'Battle!',
      objective: 'You\'re in the vanguard! The din of battle crashes around you. Stay alive, do your duty. For the Paanic Empire!',
      action: 'proceed',
      battleType: 'narrative',
      narrative: `<p>You decide to just try to stay alive. You don't have a shield, so risking your life to protect the ladders is suicidal.</p>
      
      <p>Some defenders seem to call you out from atop the walls, directing their next volleys toward your position!</p>`,
     
      statCheck: {
        type: 'skill',
        stat: 'survival',
        attribute: 'phy', 
        difficulty: 3,
        successText: `<p>You duck and run, managing to take cover beneath another regular's shield.</p>`,
        failureText: `<p>You are too slow to react, and one of the arrows lands true.</p>`,
      },  
      outcomes: {
        success: {
          nextStage: 'stage_vanguard', 
          narrativeAddition: `Your quick footwork allows you to slip beneath the cover of a nearby companion. The projectiles miss you completely. Moments later, you find yourself fighting atop the walls.`,
        },
        failure: {
          nextStage: 'stage_vanguard', 
          narrativeAddition: `<p>A grazing hit, but it stings. Moments later, you find yourself fighting atop the walls.</p>`,
          penalties: {
            health: -8
          }
        }
      }
     },

     {
      id: 'stage_protect',
      description: 'Battle!',
      objective: 'You\'re in the vanguard! The din of battle crashes around you. Stay alive, do your duty. For the Paanic Empire!',
      action: 'proceed',
      battleType: 'narrative',
      narrative: `<p>Protecting the ladder bearers might be suicidal, but if you make it to the walls with no ladders, you're dead anyway. You decide to help them make it there.</p>
      
      <p>It doesn't take long for your position to be targeted by a volley of projectiles!</p>`,

      statCheck: {
        type: 'combined',
        stat: ['survival', 'melee'],
        attribute: 'phy', 
        difficulty: 3,
        successText: `<p>You quickly raise your shield and defend both yourself and the ladder bearer next to you against the incoming projectiles.</p>`,
        failureText: `<p>Your defensive posture is lacking, and one of the arrows lands true. Another slips past your defense, and strikes a ladder bearer in the throat.</p>`,
      },  
      outcomes: {
        success: {
          nextStage: 'stage_vanguard', 
          narrativeAddition: `The projectiles are deflected from your shield as a result of your well-timed defensive posture. The ladder bearers make it to their destination easier thanks to your efforts. Moments later, you find yourself fighting atop the walls.`,
          rewards: {
            deeds: 50
          }
        },
        failure: {
          nextStage: 'stage_vanguard', 
          narrativeAddition: `<p>A grazing hit, but it stings. At least you defended the ladder bearers. Most of you make it to the walls alive. Moments later, you find yourself fighting atop them...</p>`,
          penalties: {
            health: -12,
          },
          rewards: {
            deeds: 20
          }
        }
      }
     },

     {
      id: 'stage_vanguard',
      description: 'Battle!',
      objective: 'You\'re in the vanguard! The din of battle crashes around you. Stay alive, do your duty. For the Paanic Empire!',
      action: 'combat',
      battleType: 'individual',
      enemyType: ['ARRASI_GRYNDAL'], 
      allies: ['PAANIC_REGULAR'],
      combatOptions:{
        requireDefeat: false,
        maxTurns: 75,
        enemySequence: [
          { type: ["ARRASI_GRYNDAL", "ARRASI_THARRKYN"], waves: 2 },
          { type: ["ARRASI_THARRKYN", "ARRASI_HARNSKIR"], waves: 2},
        ],
      },
      narrative: `<p>On the walls, you come face to face with brutal Arrasi warriors...</p>`,
      nextStage: 'stage_aftermath',
    },


     {
      id: 'stage_wait',
      description: 'Battle!',
      objective: 'The din of battle crashes around you. Stay alive, do your duty. For the Paanic Empire!',
      action: 'combat',
      battleType: 'individual',
      enemyType: ['ARRASI_HARNSKIR', 'ARRASI_GRYNDAL'], 
      allies: ['PAANIC_REGULAR'],
      combatOptions:{
        requireDefeat: false,
        maxTurns: 75,
        enemySequence: [
          { type: ["ARRASI_HARNSKIR", "ARRASI_GRYNDAL"], waves: 2 },
          { type: ["ARRASI_THARRKYN", "ARRASI_GRYNDAL"], waves: 2},
        ],
      },
      narrative: `<p>Finally, the order is given, and you are thrown into the fray. The way has been paved for you, paid with by the blood of your fellow regulars.</p>
      
      <p>You move quickly, stepping over the bodies of fellow soldiers. There's no time to think about it.</p>
      
      <p>Some of the walls are still contested, and there is an active ram at the gatehouse. Your officers direct your unit to a section of the wall that has collapsed. Men are scrapping atop the rubble, and formations hold both sides.</p>
      
      <p>Weapon in hand, you step into the fold of your first battle...</p>`,
      nextStage: 'stage_aftermath',
      timeAdvance: 60, 
    },

    {
      id: 'stage_aftermath',
      description: 'Dust and blood is in the air.',
      objective: 'Witness the aftermath of the initial assault.',
      action: 'proceed',
      battleType: 'narrative',
      narrative: `<p>The fort is yours, though it came at a steep cost. The wounded are dragged to makeshift triage stations, while soldiers patrol the battlements to ensure no counterattack catches you unaware.</p>

      <p>Among the surviving defenders, a small group of hardened elites have retreated to the Keep. The entrance has been barred, and the defenders are refusing to yield.</p>

      <p>Darius, the Sen'Vaorin who led the vanguard, stands before the assembled host and calls for volunteers. Anyone willing to storm the Keep will receive two extra shares of spoils. Predictably, most of the volunteers are seasoned warriors. No one expects a green recruit to step forward.</p>

      <p>You feel a mix of exhaustion and relief, but part of you wonders if the Keep’s defenders have anything worth the risk...</p>`,

      choices: [
        {
          text: "Don't volunteer.",
          action: "remain_silent",
          nextStage: "stage_camp"
        },
        {
          text: "Volunteer.",
          action: "Volunteer",
          nextStage: "stage_keep"
        }
      ]
    },

    {
      id: 'stage_keep',
      description: 'Battle!',
      objective: 'Storm the keep!',
      action: 'combat',
      battleType: 'individual',
      enemyType: ['ARRASI_DRUSKARI', 'ARRASI_DRUSKARI'], 
      allies: ['PAANIC_REGULAR'],
      combatOptions:{
        requireDefeat: false,
        maxTurns: 100,
        enemySequence: [
          { type: ["ARRASI_DRUSKARI", "ARRASI_DRUSKARI"], waves: 2 },
          { type: ["ARRASI_DRUSKARI", "ARRASI_DRUSKARI"], waves: 2},
        ],
      },
      narrative: `<p>You step forward, taking your place among the group of volunteers. Sen'Vaorin Darius gives you a nod.</p>
      
      <p>It isn't long until you're thrust against the keep defenders, face to face with elite warriors...</p>`,
      timeAdvance: 120,
      nextStage: "stage_keepaftermath"
    },

    {
      id: 'stage_keepaftermath',
      description: 'Witness the aftermath of the keep battle.',
      objective: 'Victory!',
      action: 'proceed',
      battleType: 'narrative',
      narrative: `<p>As the keep falls, the last defenders are either put to the swords or captured. You move through the structure, having first plunder rights!</p>
      
      <p>Sen'Vaorin Darius ensures your task force gets to plunder the keep spoils without the rest of the army, and afterward you receive your double share.</p>`,
      timeAdvance: 60,
      nextStage: 'stage_camp',
      rewards: {
        taelors: 350,
        deeds: 25,
      }
    },

    {
      id: 'stage_camp',
      description: 'Back at camp...',
      objective: 'Collect yourself, and rest.',
      action: 'proceed',
      battleType: 'narrative',
      narrative: `<p>Later, you find yourself hard at rest within your quarters, reflecting on the matters of the day. It felt like only now have you realized the carnage that you witnessed back on that hill.</p>
      
      <p>As you drift to sleep, you imagine yourself a more stoic warrior, unfazed by the gruesome realities of warfare.</p>`,
      timeAdvance: 120,
      nextStage: "stage_arrival"
    },
    
    {
      id: 'stage_arrival',
      description: 'After days of marching, your unit arrives back at the massive camp beneath the Wall of Nesia.',
      objective: 'Return to camp.',
      action: 'prepare',
      battleType: 'narrative',
      narrative: `<p>After some days of marching, your force finally makes it back to the Wall of Nesia. As you move beneath its ramparts, you feel a sense of elation. You didn't know if you'd lay eyes on these lands ever again.</p>
      
      <p>As you reclaim your camp grounds, you get the feeling that this was only the beginning of a long and arduous conflict...</p>`,
      timeAdvance: 20160
      // No nextStage indicates quest completion
    }
  ],
  
  // Campaign quests should have special callbacks
  onComplete: function() {
    // This will be called when quest is completed
    window.completeCampaignPart('part_1');
  },
  
  onFail: function() {
    // This will be called if quest fails
    window.failCampaignPart('part_1');
  },
  
  baseReward: {
    deeds: 150,
    taelors: 300,
  },
  
  // Campaign quests aren't triggered by chance - they're forced
  minDayToTrigger: null,
  chanceTrigger: 1,
};