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
      contexts: ['quest', 'campaign'],
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
    gather: {
      id: 'gather',
      src: 'audio/Gather.mp3',
      title: 'Gather',
      contexts: ['quest', 'campaign'],
      volume: 0.6
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
      contexts: ['quest', 'campaign'],
      volume: 0.6
    },
    end: {
      id: 'end',
      src: 'audio/End.mp3',
      title: 'Death',
      contexts: ['death'],
      volume: 0.6
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
        const audio = document.createElement('audio');
        audio.id = `audio-${track.id}`;
        audio.src = track.src;
        audio.loop = true;
        audio.volume = 0;
        audio.preload = 'auto';
        audioContainer.appendChild(audio);
      }
      
      // Add music toggle to settings
      this.addMusicControls();
      
      // Register event listeners
      window.addEventListener('contextChanged', this.handleContextChange.bind(this));
      
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
      
      // Prepare the next track
      this.nextTrack = newTrack;
      this.nextAudio = document.getElementById(`audio-${newTrack.id}`);
      
      if (!this.nextAudio) {
        console.error(`Audio element not found for track: ${newTrack.id}`);
        return;
      }
      
      // Set initial volume to 0
      this.nextAudio.volume = 0;
      
      // Start playing the next track
      this.nextAudio.currentTime = 0;
      this.nextAudio.play().catch(e => {
        console.error("Error playing audio:", e);
        
        // If autoplay is blocked, we'll need user interaction
        this.createPlayButton();
      });
      
      // If we have a current track, fade it out
      if (this.currentAudio) {
        this.fadeAudio(this.currentAudio, this.currentAudio.volume, 0, this.fadeTime, () => {
          this.currentAudio.pause();
        });
      }
      
      // Fade in the next track
      const targetVolume = newTrack.volume * this.volume;
      this.fadeAudio(this.nextAudio, 0, targetVolume, this.fadeTime);
      
      // Update current track reference
      this.currentTrack = this.nextTrack;
      this.currentAudio = this.nextAudio;
      this.nextTrack = null;
      this.nextAudio = null;
    },
    
    // Fade audio from one volume to another
    fadeAudio: function(audioElement, fromVolume, toVolume, duration, onComplete) {
      if (!audioElement) return;
      
      // Save starting time and volumes
      const startTime = Date.now();
      const volumeDiff = toVolume - fromVolume;
      
      // Create animation frame loop for smooth fade
      const fadeStep = () => {
        // Calculate progress (0 to 1)
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Set new volume
        audioElement.volume = fromVolume + volumeDiff * progress;
        
        // Continue if not complete
        if (progress < 1) {
          window.requestAnimationFrame(fadeStep);
        } else if (onComplete) {
          // Execute completion callback
          onComplete();
        }
      };
      
      // Start fade animation
      fadeStep();
    },
    
    // Stop all music
    stopMusic: function() {
      if (this.currentAudio) {
        this.fadeAudio(this.currentAudio, this.currentAudio.volume, 0, this.fadeTime, () => {
          this.currentAudio.pause();
          this.currentTrack = null;
          this.currentAudio = null;
        });
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
      overlay.style.bottom = '20px';
      overlay.style.right = '20px';
      overlay.style.zIndex = '1000';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      overlay.style.padding = '10px';
      overlay.style.borderRadius = '5px';
      overlay.style.cursor = 'pointer';
      
      const button = document.createElement('button');
      button.innerHTML = '🔊 Enable Music';
      button.style.background = 'none';
      button.style.border = '1px solid white';
      button.style.color = 'white';
      button.style.padding = '5px 10px';
      button.style.cursor = 'pointer';
      
      overlay.appendChild(button);
      document.body.appendChild(overlay);
      
      // Add click handler to start music
      overlay.addEventListener('click', () => {
        // Try to play current context music
        if (this.context && this.enabled) {
          this.playContextMusic(this.context);
        } else {
          // Default to menu music
          this.playContextMusic('menu');
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
      
      // Start with menu music
      window.setMusicContext('menu', 'intro');
    }, 1000);
  });