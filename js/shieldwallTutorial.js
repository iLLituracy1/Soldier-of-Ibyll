// shieldwallTutorial.js
// Provides a tutorial introduction to the shieldwall battle system

window.shieldwallTutorial = {
  // Tutorial state
  state: {
    active: false,
    currentStep: 0,
    steps: [
      {
        title: "Welcome to Formation Combat",
        message: "The Shieldwall system simulates large-scale battles where you are part of a formation rather than in individual combat. Your actions affect both your survival and your unit's integrity.",
        highlight: null
      },
      {
        title: "Formation Overview",
        message: "This diagram shows your unit's formation (blue circles) facing the enemy formation (red circles). Pay attention to the formation integrity - gaps can form that need to be defended.",
        highlight: ".formation-overview"
      },
      {
        title: "Unit Strength & Cohesion",
        message: "Your unit's strength shows how many soldiers remain active. Cohesion represents how well your formation is holding together - if it drops too low, your line will break!",
        highlight: ".unit-status-bars"
      },
      {
        title: "Battle Momentum",
        message: "This meter shows which side is winning the battle. Your actions can shift momentum in your favor, eventually leading to victory if you push the enemy to breaking point.",
        highlight: ".momentum-indicator"
      },
      {
        title: "Your Shield Position",
        message: "Position your shield to counter different threats: HIGH protects against arrows, CENTER is balanced, and LOW defends against charges and attacks to the legs.",
        highlight: ".shield-position"
      },
      {
        title: "Combat Stance",
        message: "Your stance affects your combat effectiveness: AGGRESSIVE increases damage but lowers defense, DEFENSIVE improves protection but reduces attack power, and BALANCED is a middle ground.",
        highlight: ".player-stance"
      },
      {
        title: "Reacting to Threats",
        message: "When threats emerge, you'll need to react quickly. Different threats require different reactions - choose wisely and ensure your shield is positioned correctly!",
        highlight: ".reaction-container"
      },
      {
        title: "Battle Phases",
        message: "Battles progress through phases like skirmish, engagement, and main battle. Each phase brings different challenges and required tactics.",
        highlight: ".battle-phase"
      },
      {
        title: "Completing Battles",
        message: "Victory is achieved by maintaining cohesion and pushing momentum in your favor. If your unit breaks or your health falls too low, you'll be defeated.",
        highlight: null
      },
      {
        title: "Ready for Battle",
        message: "You're now ready to face the enemy in formation combat! Remember: maintain cohesion, react quickly to threats, and work together with your unit to achieve victory.",
        highlight: null
      }
    ]
  },
  
  // Start the tutorial
  start: function() {
    this.state.active = true;
    this.state.currentStep = 0;
    
    // Create tutorial overlay if it doesn't exist
    this.createTutorialOverlay();
    
    // Show the first step
    this.showStep(0);
    
    // If shieldwall isn't active, start a demo battle
    if (!window.shieldwallSystem.state.active) {
      // Configure a tutorial battle
      const tutorialConfig = {
        enemyName: "Training Enemy Forces",
        unitStrength: 40,
        startingCohesion: 85,
        startingMomentum: 0,
        startingPhase: "preparation",
        order: "hold the line"
      };
      
      // Initialize if needed
      if (!window.shieldwallSystem.initialized) {
        window.shieldwallSystem.initialize();
      }
      
      // Start the battle
      window.shieldwallSystem.initiateBattle(tutorialConfig);
    }
  },
  
  // Create tutorial overlay
  createTutorialOverlay: function() {
    // Remove existing overlay if any
    const existingOverlay = document.getElementById('tutorial-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    // Create new overlay
    const overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    overlay.className = 'tutorial-overlay';
    
    // Create tutorial box
    const tutorialBox = document.createElement('div');
    tutorialBox.className = 'tutorial-box';
    
    // Tutorial content
    const tutorialTitle = document.createElement('h3');
    tutorialTitle.id = 'tutorial-title';
    tutorialTitle.className = 'tutorial-title';
    
    const tutorialMessage = document.createElement('p');
    tutorialMessage.id = 'tutorial-message';
    tutorialMessage.className = 'tutorial-message';
    
    // Navigation buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'tutorial-buttons';
    
    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.className = 'tutorial-btn';
    prevButton.onclick = () => this.prevStep();
    
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.className = 'tutorial-btn';
    nextButton.onclick = () => this.nextStep();
    
    const skipButton = document.createElement('button');
    skipButton.textContent = 'Skip Tutorial';
    skipButton.className = 'tutorial-btn skip-btn';
    skipButton.onclick = () => this.end();
    
    // Assemble the overlay
    buttonContainer.appendChild(prevButton);
    buttonContainer.appendChild(nextButton);
    buttonContainer.appendChild(skipButton);
    
    tutorialBox.appendChild(tutorialTitle);
    tutorialBox.appendChild(tutorialMessage);
    tutorialBox.appendChild(buttonContainer);
    
    overlay.appendChild(tutorialBox);
    
    // Add to document
    document.body.appendChild(overlay);
    
    // Add tutorial styles if not already added
    this.addTutorialStyles();
  },
  
  // Show a specific tutorial step
  showStep: function(stepIndex) {
    if (!this.state.active) return;
    
    const steps = this.state.steps;
    if (stepIndex < 0 || stepIndex >= steps.length) return;
    
    this.state.currentStep = stepIndex;
    
    // Update tutorial content
    const step = steps[stepIndex];
    const tutorialTitle = document.getElementById('tutorial-title');
    const tutorialMessage = document.getElementById('tutorial-message');
    
    if (tutorialTitle && tutorialMessage) {
      tutorialTitle.textContent = step.title;
      tutorialMessage.textContent = step.message;
    }
    
    // Remove previous highlights
    const highlightedElements = document.querySelectorAll('.tutorial-highlight');
    highlightedElements.forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
    
    // Add highlight if specified
    if (step.highlight) {
      const elementToHighlight = document.querySelector(step.highlight);
      if (elementToHighlight) {
        elementToHighlight.classList.add('tutorial-highlight');
      }
    }
    
    // Update button states
    const prevButton = document.querySelector('.tutorial-buttons button:first-child');
    if (prevButton) {
      prevButton.disabled = stepIndex === 0;
    }
    
    const nextButton = document.querySelector('.tutorial-buttons button:nth-child(2)');
    if (nextButton) {
      if (stepIndex === steps.length - 1) {
        nextButton.textContent = 'Complete';
      } else {
        nextButton.textContent = 'Next';
      }
    }
  },
  
  // Move to next step
  nextStep: function() {
    if (this.state.currentStep >= this.state.steps.length - 1) {
      // Last step, end tutorial
      this.end();
    } else {
      this.showStep(this.state.currentStep + 1);
    }
  },
  
  // Move to previous step
  prevStep: function() {
    if (this.state.currentStep > 0) {
      this.showStep(this.state.currentStep - 1);
    }
  },
  
  // End the tutorial
  end: function() {
    this.state.active = false;
    
    // Remove the tutorial overlay
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) {
      overlay.remove();
    }
    
    // Remove all highlights
    const highlightedElements = document.querySelectorAll('.tutorial-highlight');
    highlightedElements.forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
    
    // Show completion message
    window.showNotification("Tutorial completed! You now understand the basics of formation combat.", 'success');
  },
  
  // Add tutorial styles
  addTutorialStyles: function() {
    if (document.getElementById('tutorial-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'tutorial-styles';
    styleElement.textContent = `
      .tutorial-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 2000;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: none;
      }
      
      .tutorial-box {
        background-color: #1a1a1a;
        border: 2px solid #c9aa71;
        border-radius: 8px;
        padding: 20px;
        max-width: 500px;
        pointer-events: auto;
        box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
      }
      
      .tutorial-title {
        color: #c9aa71;
        margin-top: 0;
        margin-bottom: 10px;
        font-size: 1.2em;
      }
      
      .tutorial-message {
        color: #e0e0e0;
        margin-bottom: 20px;
        line-height: 1.5;
      }
      
      .tutorial-buttons {
        display: flex;
        justify-content: space-between;
        gap: 10px;
      }
      
      .tutorial-btn {
        background-color: #2a2a2a;
        color: #e0e0e0;
        border: none;
        padding: 8px 15px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .tutorial-btn:hover:not([disabled]) {
        background-color: #3a3a3a;
        transform: translateY(-2px);
      }
      
      .tutorial-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .skip-btn {
        margin-left: auto;
        background-color: #444;
      }
      
      .tutorial-highlight {
        position: relative;
        z-index: 1999;
        box-shadow: 0 0 0 4px #c9aa71, 0 0 0 5000px rgba(0, 0, 0, 0.5);
        animation: tutorial-pulse 2s infinite;
      }
      
      @keyframes tutorial-pulse {
        0% { box-shadow: 0 0 0 4px #c9aa71, 0 0 0 5000px rgba(0, 0, 0, 0.5); }
        50% { box-shadow: 0 0 0 8px #c9aa71, 0 0 0 5000px rgba(0, 0, 0, 0.5); }
        100% { box-shadow: 0 0 0 4px #c9aa71, 0 0 0 5000px rgba(0, 0, 0, 0.5); }
      }
    `;
    
    document.head.appendChild(styleElement);
  }
};

// Function to start the shieldwall tutorial
window.startShieldwallTutorial = function() {
  window.shieldwallTutorial.start();
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("Shieldwall tutorial initialized");
});