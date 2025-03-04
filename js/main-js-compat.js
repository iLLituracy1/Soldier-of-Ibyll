// MAIN.JS COMPATIBILITY SCRIPT
// Direct fix for main.js initialization

// IMPORTANT: Create global objects immediately to prevent null errors
window.missionSystem = window.missionSystem || {};
window.missionSystem.availableMissions = window.missionSystem.availableMissions || [];
window.missionSystem.missionHistory = window.missionSystem.missionHistory || [];
window.missionSystem.missionCooldowns = window.missionSystem.missionCooldowns || {};
window.missionSystem.currentMission = window.missionSystem.currentMission || null;

// Add essential functions if they don't exist
window.missionSystem.generateAvailableMissions = window.missionSystem.generateAvailableMissions || function() {
  console.log("Default generateAvailableMissions called");
  // Ensure the array exists
  window.missionSystem.availableMissions = window.missionSystem.availableMissions || [];
  return true;
};

// Force generate missions if needed
if (Array.isArray(window.missionSystem.availableMissions) && 
    window.missionSystem.availableMissions.length === 0) {
  console.log("Forcing generation of available missions");
  try {
    window.missionSystem.generateAvailableMissions();
  } catch (e) {
    console.error("Error in generateAvailableMissions:", e);
  }
}

// Log status for debugging
console.log("Mission system compatibility initialized:");
console.log("- availableMissions:", 
  Array.isArray(window.missionSystem.availableMissions) ? 
  "Array[" + window.missionSystem.availableMissions.length + "]" : 
  window.missionSystem.availableMissions);
