// Enhanced integration script to load our quest reward system

// Function to load a JavaScript file dynamically
function loadScript(url, callback) {
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = url;
  
  // Handle the script loading events
  script.onload = function() {
    console.log(`Successfully loaded script: ${url}`);
    if (typeof callback === 'function') {
      callback();
    }
  };
  
  script.onerror = function() {
    console.error(`Error loading script: ${url}`);
  };
  
  // Append to head to begin loading
  document.head.appendChild(script);
}

// Main integration function - call this to set up everything
function initializeEnhancedQuestSystem() {
  console.log("Initializing enhanced quest system");
  
  // Directly run initialization code
  if (!window.enhancedQuestRewards) {
    console.error("Enhanced quest rewards not available");
    return;
  }
  
  // Ensure all item templates are loaded
  if (!window.itemTemplates) {
    console.error("Item templates not available");
    return;
  }
  
  // Create custom items for rewards
  if (typeof window.createQuestRewardItems === 'function') {
    window.createQuestRewardItems();
  } else {
    console.error("createQuestRewardItems function not available");
  }
  
  // Install enhanced completeQuest function
  if (typeof window.enhanceCompleteQuest === 'function') {
    window.enhanceCompleteQuest();
  }
  
  // Install enhanced handleReturnToCamp function
  if (typeof window.enhanceHandleReturnToCamp === 'function') {
    window.enhanceHandleReturnToCamp();
  }
  
  console.log("Enhanced quest reward system installed");
}

// Run initialization when the page is fully loaded
if (document.readyState === 'complete') {
  initializeEnhancedQuestSystem();
} else {
  window.addEventListener('load', function() {
    initializeEnhancedQuestSystem();
  });
}

// Also initialize when the DOM is ready (earlier than 'load')
document.addEventListener('DOMContentLoaded', function() {
  // We'll try initializing here too, in case 'load' is delayed
  setTimeout(initializeEnhancedQuestSystem, 1000);
});