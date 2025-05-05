const audioPlayer = document.getElementById('audioPlayer');
const playlist = document.getElementById('playlist');
const addMusicBtn = document.getElementById('addMusicBtn');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const volumeSlider = document.getElementById('volumeSlider');
const progressBar = document.querySelector('.progress');
const currentTimeEl = document.getElementById('currentTime');
const totalTimeEl = document.getElementById('totalTime');
const songTitleEl = document.getElementById('songTitle');
const artistNameEl = document.getElementById('artistName');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

// Audio context and analyzer setup
let audioContext;
let analyser;
let dataArray;
let animationId;
let particles = [];

// Initialize audio context
function initAudioContext() {
    try {
        if (!audioContext) {
            console.log('Initializing audio context...');
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            const source = audioContext.createMediaElementSource(audioPlayer);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            console.log('Audio context initialized successfully');
        }
    } catch (error) {
        console.error('Error initializing audio context:', error);
    }
}

// Particle class
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2; // Increased size
        this.speedX = Math.random() * 4 - 2;
        this.speedY = Math.random() * 4 - 2;
        this.color = `hsl(${Math.random() * 60 + 200}, 70%, 60%)`; // Brighter colors
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.size > 0.2) this.size -= 0.05; // Slower fade
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Create particles
function createParticles(x, y, intensity) {
    const particleCount = Math.floor(intensity / 5); // Adjusted for better visibility
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(x, y));
    }
}

// Animation loop
function animate() {
    try {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            console.log('Audio intensity:', average); // Debug log
            
            // Create particles based on audio intensity
            if (average > 30) {
                createParticles(
                    canvas.width / 2 + (Math.random() - 0.5) * 100,
                    canvas.height / 2 + (Math.random() - 0.5) * 100,
                    average
                );
                console.log('Creating particles, count:', particles.length); // Debug log
            }
        } else {
            console.log('Analyser not initialized'); // Debug log
        }

        // Update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].draw();

            if (particles[i].size <= 0.2 || 
                particles[i].x < 0 || 
                particles[i].x > canvas.width || 
                particles[i].y < 0 || 
                particles[i].y > canvas.height) {
                particles.splice(i, 1);
            }
        }

        animationId = requestAnimationFrame(animate);
    } catch (error) {
        console.error('Error in animation loop:', error);
    }
}

// Resize canvas
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

// Initialize canvas size
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let currentPlaylist = [];
let currentTrackIndex = 0;

// Format time in MM:SS
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Update progress bar
function updateProgress() {
    if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.style.width = `${progress}%`;
        currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    }
}

// Update total time
function updateTotalTime() {
    totalTimeEl.textContent = formatTime(audioPlayer.duration);
}

// Play or pause the current track
function togglePlay() {
    if (audioPlayer.paused) {
        console.log('Starting playback...'); // Debug log
        initAudioContext();
        audioPlayer.play()
            .then(() => {
                console.log('Playback started successfully'); // Debug log
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                if (!animationId) {
                    console.log('Starting animation...'); // Debug log
                    animate();
                }
            })
            .catch(error => {
                console.error('Error playing audio:', error);
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
            });
    } else {
        audioPlayer.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

// Play a specific track
function playTrack(index) {
    if (index >= 0 && index < currentPlaylist.length) {
        currentTrackIndex = index;
        const track = currentPlaylist[index];
        audioPlayer.src = track;
        initAudioContext();
        audioPlayer.play()
            .then(() => {
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                songTitleEl.textContent = track.split('\\').pop().split('/').pop();
                artistNameEl.textContent = 'Unknown Artist';
                if (!animationId) {
                    animate();
                }
            })
            .catch(error => {
                console.error('Error playing track:', error);
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
            });
    }
}

// Add music files to playlist
addMusicBtn.addEventListener('click', async () => {
    try {
        const filePaths = await window.electronAPI.selectMusicFiles();
        if (filePaths && filePaths.length > 0) {
            currentPlaylist = [...currentPlaylist, ...filePaths];
            updatePlaylistUI();
            // Auto-play the first track if it's the first addition
            if (currentPlaylist.length === filePaths.length) {
                playTrack(0);
            }
        }
    } catch (error) {
        console.error('Error selecting files:', error);
    }
});

// Play button click handler
playBtn.addEventListener('click', togglePlay);

// Previous button click handler
prevBtn.addEventListener('click', () => {
    playTrack(currentTrackIndex - 1);
});

// Next button click handler
nextBtn.addEventListener('click', () => {
    playTrack(currentTrackIndex + 1);
});

// Volume control
volumeSlider.addEventListener('input', (e) => {
    audioPlayer.volume = e.target.value / 100;
});

// Progress bar click handler
document.querySelector('.progress-bar').addEventListener('click', (e) => {
    if (audioPlayer.duration && !isNaN(audioPlayer.duration)) {
        const progressBar = e.currentTarget;
        const clickPosition = e.offsetX;
        const progressBarWidth = progressBar.clientWidth;
        const seekTime = (clickPosition / progressBarWidth) * audioPlayer.duration;
        audioPlayer.currentTime = seekTime;
    }
});

// Update playlist UI
function updatePlaylistUI() {
    playlist.innerHTML = '';
    currentPlaylist.forEach((track, index) => {
        const li = document.createElement('li');
        li.textContent = track.split('\\').pop().split('/').pop();
        if (index === currentTrackIndex) {
            li.classList.add('active');
        }
        li.addEventListener('click', () => playTrack(index));
        playlist.appendChild(li);
    });
}

// Event listeners for audio player
audioPlayer.addEventListener('timeupdate', updateProgress);
audioPlayer.addEventListener('loadedmetadata', updateTotalTime);
audioPlayer.addEventListener('ended', () => {
    playTrack(currentTrackIndex + 1);
});

// Error handling
audioPlayer.addEventListener('error', (e) => {
    console.error('Audio error:', e);
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
});

// Debug function to check audio context state
function checkAudioContext() {
    console.log('Audio Context State:', audioContext ? audioContext.state : 'Not initialized');
    console.log('Analyser:', analyser ? 'Initialized' : 'Not initialized');
    console.log('Canvas Size:', canvas.width, 'x', canvas.height);
    console.log('Particles:', particles.length);
}

// Add event listener for audio context state changes
if (audioContext) {
    audioContext.addEventListener('statechange', () => {
        console.log('Audio Context State Changed:', audioContext.state);
    });
}

// Call checkAudioContext periodically
setInterval(checkAudioContext, 5000);

// Theme Management
const body = document.body;

function getTimeBasedTheme() {
    const hour = new Date().getHours();
    // Dark theme from 7 PM to 6 AM
    return (hour >= 19 || hour < 6) ? 'dark' : 'light';
}

function setTheme(theme) {
    body.setAttribute('data-theme', theme);
}

// Initialize theme based on time
function initializeTheme() {
    const timeBasedTheme = getTimeBasedTheme();
    setTheme(timeBasedTheme);
}

// Check and update theme every minute
function startThemeCheck() {
    // Initial check
    initializeTheme();
    
    // Check every minute
    setInterval(() => {
        const timeBasedTheme = getTimeBasedTheme();
        setTheme(timeBasedTheme);
    }, 60000); // Check every minute
}

// Start the theme checking system
startThemeCheck();

// Mini Player
const miniPlayer = document.querySelector('.mini-player');
const miniToggle = document.querySelector('.mini-toggle');
const miniPlayBtn = document.getElementById('miniPlayBtn');
const miniNextBtn = document.getElementById('miniNextBtn');
const miniSongTitle = document.getElementById('miniSongTitle');
const miniArtistName = document.getElementById('miniArtistName');

function toggleMiniPlayer() {
    miniPlayer.classList.toggle('active');
    miniToggle.innerHTML = miniPlayer.classList.contains('active') 
        ? '<i class="fas fa-chevron-down"></i>' 
        : '<i class="fas fa-chevron-up"></i>';
}

function updateMiniPlayer() {
    miniSongTitle.textContent = songTitleEl.textContent;
    miniArtistName.textContent = artistNameEl.textContent;
    miniPlayBtn.innerHTML = audioPlayer.paused 
        ? '<i class="fas fa-play"></i>' 
        : '<i class="fas fa-pause"></i>';
}

miniToggle.addEventListener('click', toggleMiniPlayer);
miniPlayBtn.addEventListener('click', togglePlay);
miniNextBtn.addEventListener('click', () => playTrack(currentTrackIndex + 1));

// Favorites System
const favoritesBtn = document.getElementById('favoritesBtn');
const toggleFavorite = document.getElementById('toggleFavorite');
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let showFavoritesOnly = false;

function toggleFavoriteSong() {
    const currentSong = currentPlaylist[currentTrackIndex];
    const index = favorites.indexOf(currentSong);
    
    if (index === -1) {
        favorites.push(currentSong);
        toggleFavorite.innerHTML = '<i class="fas fa-heart"></i>';
    } else {
        favorites.splice(index, 1);
        toggleFavorite.innerHTML = '<i class="far fa-heart"></i>';
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    updatePlaylistUI();
}

function toggleFavoritesView() {
    showFavoritesOnly = !showFavoritesOnly;
    favoritesBtn.classList.toggle('active');
    updatePlaylistUI();
}

function updatePlaylistUI() {
    playlist.innerHTML = '';
    const displayList = showFavoritesOnly 
        ? currentPlaylist.filter(song => favorites.includes(song))
        : currentPlaylist;

    displayList.forEach((track, index) => {
        const li = document.createElement('li');
        li.textContent = track.split('\\').pop().split('/').pop();
        if (index === currentTrackIndex) {
            li.classList.add('active');
        }
        if (favorites.includes(track)) {
            li.innerHTML += ' <i class="fas fa-heart"></i>';
        }
        li.addEventListener('click', () => playTrack(currentPlaylist.indexOf(track)));
        playlist.appendChild(li);
    });
}

favoritesBtn.addEventListener('click', toggleFavoritesView);
toggleFavorite.addEventListener('click', toggleFavoriteSong);

// Sleep Timer
const sleepTimer = document.getElementById('sleepTimer');
let sleepTimerId = null;

function setSleepTimer(minutes) {
    if (sleepTimerId) {
        clearTimeout(sleepTimerId);
    }
    
    if (minutes > 0) {
        sleepTimerId = setTimeout(() => {
            audioPlayer.pause();
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            miniPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
            sleepTimer.value = '0';
        }, minutes * 60 * 1000);
    }
}

sleepTimer.addEventListener('change', (e) => {
    setSleepTimer(parseInt(e.target.value));
});

// Lyrics Display
const lyricsContainer = document.querySelector('.lyrics-container');
const lyricsDiv = document.getElementById('lyrics');

function parseLyrics(lyricsText) {
    const lines = lyricsText.split('\n');
    return lines.map(line => {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
        if (match) {
            const [, min, sec, ms, text] = match;
            const time = parseInt(min) * 60 + parseInt(sec) + parseInt(ms) / 100;
            return { time, text: text.trim() };
        }
        return null;
    }).filter(line => line !== null);
}

function updateLyrics(currentTime) {
    const activeLine = lyrics.find(line => line.time > currentTime);
    if (activeLine) {
        const index = lyrics.indexOf(activeLine);
        lyricsDiv.innerHTML = lyrics
            .slice(Math.max(0, index - 2), index + 3)
            .map((line, i) => `
                <div class="lyrics-line ${i === 2 ? 'active' : ''}">
                    ${line.text}
                </div>
            `)
            .join('');
    }
}

let lyrics = [];

// Update the playTrack function to handle lyrics
function playTrack(index) {
    if (index >= 0 && index < currentPlaylist.length) {
        currentTrackIndex = index;
        const track = currentPlaylist[index];
        audioPlayer.src = track;
        initAudioContext();
        audioPlayer.play()
            .then(() => {
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                miniPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
                songTitleEl.textContent = track.split('\\').pop().split('/').pop();
                artistNameEl.textContent = 'Unknown Artist';
                miniSongTitle.textContent = songTitleEl.textContent;
                miniArtistName.textContent = artistNameEl.textContent;
                
                // Update favorite button state
                toggleFavorite.innerHTML = favorites.includes(track)
                    ? '<i class="fas fa-heart"></i>'
                    : '<i class="far fa-heart"></i>';
                
                // Try to load lyrics
                const lyricsPath = track.replace(/\.[^/.]+$/, '.lrc');
                fetch(lyricsPath)
                    .then(response => response.text())
                    .then(text => {
                        lyrics = parseLyrics(text);
                        lyricsContainer.classList.add('active');
                    })
                    .catch(() => {
                        lyrics = [];
                        lyricsContainer.classList.remove('active');
                    });
                
                if (!animationId) {
                    animate();
                }
            })
            .catch(error => {
                console.error('Error playing track:', error);
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                miniPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
            });
    }
}

// Update the timeupdate event listener to include lyrics
audioPlayer.addEventListener('timeupdate', () => {
    updateProgress();
    if (lyrics.length > 0) {
        updateLyrics(audioPlayer.currentTime);
    }
});

