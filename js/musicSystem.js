// The revised musicSystem.js with fixes for playback issues:

// musicSystem.js - Dynamic music system for game
// Handles track selection, playback, and smooth transitions

// Music track definitions
window.musicTracks = {
    intro: {
      id: 'intro',
      src: 'audio/Intro.mp3',
      title: 'Introduction',
      contexts: ['menu'],
      volume: 0.7
    },
    curious: {
      id: 'curious',
      src: 'audio/Curious.mp3',
      title: 'Curious',
      contexts: ['camp'],
      volume: 0.6
    },
    campMarch: {
      id: 'campMarch',
      src: 'audio/Camp_March.mp3',
      title: 'Camp March',
      contexts: ['camp'],
      volume: 0.5
    },
    wadeThrough: {
      id: 'wadeThrough',
      src: 'audio/Wade_Through.mp3',
      title: 'Wade Through',
      contexts: ['battle'],
      volume: 0.7
    },
    soldier: {
      id: 'soldier',
      src: 'audio/Soldier.mp3',
      title: 'Soldier',
      contexts: ['quest', 'campaign'],
      volume: 0.5
    },
    inTheHeatOfIt: {
      id: 'inTheHeatOfIt',
      src: 'audio/In_the_Heat_of_It.mp3',
      title: 'In the Heat of It',
      contexts: ['battle'],
      volume: 0.7
    },
    crossedSwords: {
      id: 'crossedSwords',
      src: 'audio/Crossed_Swords.mp3',
      title: 'Crossed Swords',
      contexts: ['battle'],
      volume: 0.8
    },
    grass: {
      id: 'grass',
      src: 'audio/Grass.mp3',
      title: 'Grass',
      contexts: ['camp'],
      volume: 0.6
    },
    end: {
      id: 'end',
      src: 'audio/End.mp3',
      title: 'Death',
      contexts: ['death'],
      volume: 0.6
    },
    impend: {
        id: 'impend',
        src: 'audio/Impend.mp3',
        title: 'Impend',
        contexts: ['quest', 'campaign'],
        volume: 0.5
    }
  };
  
  // Music system state
  window.musicSystem = {
    // Current state
    currentTrack: null,
    currentAudio: null,
    nextTrack: null,
    nextAudio: null,
    context: 'none',
    audioElements: {}, // Cache for audio elements
    fadeIntervals: {}, // Track fade intervals
    
    // Configuration
    fadeTime: 2000, // Fade duration in milliseconds
    enabled: true,  // Global music enable/disable
    volume: 0.7,    // Master volume (0-1)
    
    // Last played tracks to avoid repetition
    lastPlayedTracks: {
      battle: [],
      quest: [],
      campaign: []
    },
    
    // Initialize the music system
    initialize: function() {
      console.log("Initializing music system...");
      
      // Create audio elements container (hidden)
      const audioContainer = document.createElement('div');
      audioContainer.id = 'audio-container';
      audioContainer.style.display = 'none';
      document.body.appendChild(audioContainer);
      
      // Preload all tracks
      for (const trackId in window.musicTracks) {
        const track = window.musicTracks[trackId];
        const audio = new Audio(track.src);
        audio.id = `audio-${track.id}`;
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = 0;
        
        // Store in our cache
        this.audioElements[track.id] = audio;
        
        // Add to DOM for debugging
        audioContainer.appendChild(audio);
        
        // Add event listeners for debugging
        audio.addEventListener('play', () => console.log(`${track.title} started playing`));
        audio.addEventListener('pause', () => console.log(`${track.title} paused`));
        audio.addEventListener('ended', () => console.log(`${track.title} ended (should loop)`));
        audio.addEventListener('error', (e) => console.error(`Error with ${track.title}:`, e));
        
        // Force preload
        audio.load();
      }
      
      // Add music toggle to settings
      this.addMusicControls();
      
      // Register event listeners
      window.addEventListener('contextChanged', this.handleContextChange.bind(this));
      
      // Create an initialization button that appears after first user interaction
      this.userInteractionNeeded = true;
      
      // Add a click handler to the entire document to detect first user interaction
      const startMusicOnInteraction = () => {
        // Only do this once
        if (!this.userInteractionNeeded) return;
        
        this.userInteractionNeeded = false;
        console.log("User interaction detected, music system ready");
        
        // Try to play menu music after user has interacted
        setTimeout(() => {
          if (this.enabled) {
            window.setMusicContext('menu', 'intro');
          }
        }, 500);
        
        // Remove this event listener since we don't need it anymore
        document.removeEventListener('click', startMusicOnInteraction);
      };
      
      document.addEventListener('click', startMusicOnInteraction);
      
      console.log("Music system initialized");
    },
    
    // Play music for a specific context
    playContextMusic: function(context, specificTrackId = null) {
      if (!this.enabled) return;
      
      console.log(`Music context changed to: ${context}`);
      
      // If context is the same and music is already playing, don't change
      if (context === this.context && this.currentTrack && !specificTrackId) {
        return;
      }
      
      // Store the new context
      this.context = context;
      
      // Select track to play
      let trackToPlay;
      
      if (specificTrackId) {
        // Play specific track if provided
        trackToPlay = window.musicTracks[specificTrackId];
      } else {
        // Otherwise, find all tracks for this context
        const contextTracks = Object.values(window.musicTracks).filter(
          track => track.contexts.includes(context)
        );
        
        if (contextTracks.length === 0) {
          console.log(`No tracks available for context: ${context}`);
          this.stopMusic();
          return;
        }
        
        // Filter out recently played tracks for this context (if possible)
        let availableTracks = contextTracks.filter(
          track => !this.lastPlayedTracks[context]?.includes(track.id)
        );
        
        // If no tracks left after filtering, use all context tracks
        if (availableTracks.length === 0) {
          availableTracks = contextTracks;
          // Reset the last played tracks for this context
          this.lastPlayedTracks[context] = [];
        }
        
        // Pick a random track from available options
        trackToPlay = availableTracks[Math.floor(Math.random() * availableTracks.length)];
        
        // Update last played tracks for this context
        if (!this.lastPlayedTracks[context]) {
          this.lastPlayedTracks[context] = [];
        }
        
        // Keep last 2 tracks in memory to avoid repetition
        this.lastPlayedTracks[context].push(trackToPlay.id);
        if (this.lastPlayedTracks[context].length > 2) {
          this.lastPlayedTracks[context].shift();
        }
      }
      
      // If we got a track to play, transition to it
      if (trackToPlay) {
        this.transitionTo(trackToPlay);
      }
    },
    
    // Transition to a new track
transitionTo: function(newTrack) {
    if (!newTrack) return;
    
    console.log(`Transitioning to track: ${newTrack.title}`);
    
    // If the same track is already playing, don't transition
    if (this.currentTrack && this.currentTrack.id === newTrack.id) {
      return;
    }
    
    // Get the audio element from our cache
    this.nextTrack = newTrack;
    this.nextAudio = this.audioElements[newTrack.id];
    
    if (!this.nextAudio) {
      console.error(`Audio element not found for track: ${newTrack.id}`);
      return;
    }
    
    // Make sure loop is set
    this.nextAudio.loop = true;
    
    // Set initial volume to 0
    this.nextAudio.volume = 0;
    
    // Stop any current fade for this audio
    const nextTrackFadeInId = `${newTrack.id}_fadein`;
    if (this.fadeIntervals[nextTrackFadeInId]) {
      clearInterval(this.fadeIntervals[nextTrackFadeInId]);
      delete this.fadeIntervals[nextTrackFadeInId];
    }
    
    // Save references to current and next track/audio for use in callbacks
    const currentTrack = this.currentTrack;
    const currentAudio = this.currentAudio;
    const nextAudio = this.nextAudio;
    
    // Start playing the next track, restart from beginning
    this.nextAudio.currentTime = 0;
    
    const playPromise = this.nextAudio.play();
    
    // Handle play promise (might reject due to autoplay restrictions)
    if (playPromise !== undefined) {
      playPromise.then(() => {
        console.log(`Successfully started playing ${newTrack.title}`);
        
        // If we have a current track, fade it out
        if (currentAudio) {
          // Stop any current fade for the current track
          const currentTrackFadeOutId = `${currentTrack.id}_fadeout`;
          if (this.fadeIntervals[currentTrackFadeOutId]) {
            clearInterval(this.fadeIntervals[currentTrackFadeOutId]);
            delete this.fadeIntervals[currentTrackFadeOutId];
          }
          
          // Fade out current track
          this.simpleFade(
            currentAudio, 
            currentAudio.volume, 
            0, 
            this.fadeTime, 
            () => {
              if (currentAudio) {
                currentAudio.pause();
                console.log(`${currentTrack.title} paused after fade out`);
              }
            },
            currentTrackFadeOutId
          );
        }
        
        // Fade in the next track
        const targetVolume = newTrack.volume * this.volume;
        this.simpleFade(nextAudio, 0, targetVolume, this.fadeTime, null, nextTrackFadeInId);
        
        // Update current track reference
        this.currentTrack = newTrack;
        this.currentAudio = nextAudio;
      }).catch(e => {
        console.log("Autoplay prevented by browser, waiting for user interaction", e);
        
        if (!document.getElementById('music-play-overlay')) {
          this.createPlayButton();
        }
        
        // We'll mark that user interaction is needed
        this.userInteractionNeeded = true;
      });
    } else {
      // For browsers that don't return a promise from play()
      console.log(`Started playing ${newTrack.title} (no promise returned)`);
      
      // If we have a current track, fade it out
      if (currentAudio) {
        // Stop any current fade for the current track
        const currentTrackFadeOutId = `${currentTrack.id}_fadeout`;
        if (this.fadeIntervals[currentTrackFadeOutId]) {
          clearInterval(this.fadeIntervals[currentTrackFadeOutId]);
          delete this.fadeIntervals[currentTrackFadeOutId];
        }
        
        // Fade out current track
        this.simpleFade(
          currentAudio, 
          currentAudio.volume, 
          0, 
          this.fadeTime, 
          () => {
            if (currentAudio) {
              currentAudio.pause();
              console.log(`${currentTrack.title} paused after fade out`);
            }
          },
          currentTrackFadeOutId
        );
      }
      
      // Fade in the next track
      const targetVolume = newTrack.volume * this.volume;
      this.simpleFade(nextAudio, 0, targetVolume, this.fadeTime, null, nextTrackFadeInId);
      
      // Update current track reference
      this.currentTrack = newTrack;
      this.currentAudio = nextAudio;
    }
    
    // Clear next track references once they're no longer needed
    this.nextTrack = null;
    this.nextAudio = null;
  },

  // Simpler fade function using setInterval
simpleFade: function(audio, fromVolume, toVolume, duration, onComplete, fadeId) {
    if (!audio) return;
    
    const steps = 20; // Number of steps for the fade
    const stepDuration = duration / steps; // Time per step
    const volumeStep = (toVolume - fromVolume) / steps; // Volume change per step
    let currentStep = 0;
    
    // Clear any existing fade interval for this fade ID
    if (this.fadeIntervals[fadeId]) {
      clearInterval(this.fadeIntervals[fadeId]);
      delete this.fadeIntervals[fadeId];
    }
    
    // Set initial volume
    audio.volume = fromVolume;
    
    // Create the interval
    this.fadeIntervals[fadeId] = setInterval(() => {
      currentStep++;
      
      if (currentStep <= steps) {
        // Set new volume
        const newVolume = fromVolume + (volumeStep * currentStep);
        audio.volume = Math.max(0, Math.min(1, newVolume)); // Clamp to valid range
      } else {
        // Ensure final volume is set exactly
        audio.volume = toVolume;
        
        // Clear the interval
        clearInterval(this.fadeIntervals[fadeId]);
        delete this.fadeIntervals[fadeId];
        
        // Call completion handler if provided
        if (onComplete) onComplete();
      }
    }, stepDuration);
  },
    
    // Stop all music
stopMusic: function() {
    // Cancel all fade intervals
    Object.keys(this.fadeIntervals).forEach(fadeId => {
      clearInterval(this.fadeIntervals[fadeId]);
      delete this.fadeIntervals[fadeId];
    });
    
    if (this.currentAudio) {
      const fadeOutId = this.currentTrack ? `${this.currentTrack.id}_fadeout` : 'current_fadeout';
      this.simpleFade(this.currentAudio, this.currentAudio.volume, 0, this.fadeTime, () => {
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentTrack = null;
          this.currentAudio = null;
        }
      }, fadeOutId);
    }
  },
    
    // Handle context changes (event listener)
    handleContextChange: function(event) {
      const context = event.detail.context;
      const trackId = event.detail.trackId;
      this.playContextMusic(context, trackId);
    },
    
    // Set master volume
    setVolume: function(level) {
      this.volume = Math.max(0, Math.min(1, level));
      
      // Update current playing audio
      if (this.currentAudio && this.currentTrack) {
        this.currentAudio.volume = this.currentTrack.volume * this.volume;
      }
      
      // Save to local storage if available
      if (window.localStorage) {
        window.localStorage.setItem('musicVolume', this.volume);
      }
    },
    
    // Toggle music on/off
    toggleMusic: function() {
      this.enabled = !this.enabled;
      
      if (!this.enabled) {
        this.stopMusic();
      } else {
        // Restart music for current context
        this.playContextMusic(this.context);
      }
      
      // Save to local storage if available
      if (window.localStorage) {
        window.localStorage.setItem('musicEnabled', this.enabled);
      }
      
      // Update UI
      this.updateMusicControls();
      
      return this.enabled;
    },
    
    // Create a play button overlay (for browsers that block autoplay)
    createPlayButton: function() {
      // Only create if it doesn't exist
      if (document.getElementById('music-play-overlay')) return;
      
      const overlay = document.createElement('div');
      overlay.id = 'music-play-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '20px';
      overlay.style.left = '50%';
      overlay.style.transform = 'translateX(-50%)';
      overlay.style.zIndex = '9999';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      overlay.style.padding = '15px 20px';
      overlay.style.borderRadius = '8px';
      overlay.style.cursor = 'pointer';
      overlay.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.5)';
      overlay.style.border = '1px solid #c9aa71';
      
      const button = document.createElement('button');
      button.innerHTML = '🎵 Click to Enable Music';
      button.style.background = 'none';
      button.style.border = '1px solid #c9aa71';
      button.style.color = '#c9aa71';
      button.style.padding = '8px 15px';
      button.style.cursor = 'pointer';
      button.style.borderRadius = '4px';
      button.style.fontWeight = 'bold';
      
      overlay.appendChild(button);
      document.body.appendChild(overlay);
      
      // Add click handler to start music
      overlay.addEventListener('click', () => {
        // Mark that user has interacted
        this.userInteractionNeeded = false;
        
        // Try to play current context music
        if (this.context && this.enabled) {
          this.playContextMusic(this.context);
        } else {
          // Default to menu music
          this.playContextMusic('menu', 'intro');
        }
        
        // Remove the overlay
        document.body.removeChild(overlay);
      });
    },
    
    // Add music controls to the game UI
    addMusicControls: function() {
      // Load saved settings
      if (window.localStorage) {
        const savedVolume = window.localStorage.getItem('musicVolume');
        if (savedVolume !== null) {
          this.volume = parseFloat(savedVolume);
        }
        
        const savedEnabled = window.localStorage.getItem('musicEnabled');
        if (savedEnabled !== null) {
          this.enabled = savedEnabled === 'true';
        }
      }
      
      // Create music controls container
      const musicControls = document.createElement('div');
      musicControls.id = 'music-controls';
      musicControls.className = 'music-controls';
      
      // Create toggle button
      const toggleButton = document.createElement('button');
      toggleButton.id = 'music-toggle';
      toggleButton.className = 'control-btn';
      toggleButton.innerHTML = `<i class="fas fa-${this.enabled ? 'volume-up' : 'volume-mute'}"></i>Music`;
      toggleButton.title = this.enabled ? 'Disable Music' : 'Enable Music';
      toggleButton.onclick = () => {
        const isEnabled = this.toggleMusic();
        toggleButton.innerHTML = `<i class="fas fa-${isEnabled ? 'volume-up' : 'volume-mute'}"></i>Music`;
        toggleButton.title = isEnabled ? 'Disable Music' : 'Enable Music';
      };
      
      // Add controls to container
      musicControls.appendChild(toggleButton);
      
      // Add the music controls to the game UI
      const uiContainer = document.querySelector('.side-panel .game-controls');
      if (uiContainer) {
        uiContainer.appendChild(musicControls);
      }
    },
    
    // Update music controls to reflect current state
    updateMusicControls: function() {
      const toggleButton = document.getElementById('music-toggle');
      if (toggleButton) {
        toggleButton.innerHTML = `<i class="fas fa-${this.enabled ? 'volume-up' : 'volume-mute'}"></i>Music`;
        toggleButton.title = this.enabled ? 'Disable Music' : 'Enable Music';
      }
    }
  };
  
  // Helper function to trigger context changes
  window.setMusicContext = function(context, specificTrackId = null) {
    // Create and dispatch custom event
    const event = new CustomEvent('contextChanged', { 
      detail: { 
        context: context,
        trackId: specificTrackId
      }
    });
    
    window.dispatchEvent(event);
  };
  
  // Initialize on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function() {
    // Wait for the game to initialize first
    setTimeout(() => {
      window.musicSystem.initialize();
      
      // We'll wait for user interaction instead of trying to autoplay
      // The click handler will take care of starting music
    }, 1000);
  });