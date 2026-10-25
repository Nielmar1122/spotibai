/* ============================================================
   Spotibai Frontend App (Final Fixed Version)
   ============================================================ */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const state = {
  user: null,
  view: 'home',
  queue: [],
  currentSong: null,
  favorites: new Set(),
  shuffle: false,
  repeat: false
};

/* ---------- API helper ---------- */
async function api(path, opts = {}) {
  try {
    const res = await fetch('/api' + path, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      ...opts
    });
    if (!res.ok) throw new Error('Server error');
    return await res.json();
  } catch (err) {
    return null;
  }
}

/* ---------- Auth ---------- */
async function loadUser() {
  const data = await api('/auth/me');
  if (data && data.user) {
    state.user = data.user;
    state.favorites = new Set((data.user.favorites || []).map(String));
  } else {
    state.user = null;
    state.favorites = new Set();
  }
  renderAuth();
}

function renderAuth() {
  const area = $('#authArea');
  if (!area) return;
  
  if (state.user) {
    area.innerHTML = `
      <span class="text-white me-2">Hi, <strong>${state.user.username}</strong></span>
      <button class="btn btn-outline-danger btn-sm" id="logoutBtn">Logout</button>`;
    $('#logoutBtn').onclick = async () => { 
      await api('/auth/logout', { method: 'POST' }); 
      state.user = null; 
      state.favorites = new Set(); 
      renderAuth(); 
      navigate('home'); 
    };
  } else {
    area.innerHTML = `
      <button class="btn btn-outline-light btn-sm me-2" id="loginBtn">Login</button>
      <button class="btn btn-success btn-sm" id="regBtn">Sign Up</button>`;
    
    setTimeout(() => {
      const login = document.getElementById('loginBtn');
      const reg = document.getElementById('regBtn');
      if (login) login.onclick = () => renderAuthPage('login');
      if (reg) reg.onclick = () => renderAuthPage('register');
    }, 100);
  }
}

/* ---------- Navigation ---------- */
function navigate(view) {
  state.view = view;
  $$('.sidebar .nav-link').forEach(a => a.classList.toggle('active', a.dataset.view === view));
  const renderers = {
    home: renderHome, search: renderSearchPage, songs: renderSongs,
    artists: renderArtists, albums: renderAlbums, playlists: renderPlaylists,
    favorites: renderFavorites, recent: renderRecent, profile: renderProfile,
    admin: renderAdmin
  };
  if (renderers[view]) renderers[view]();
  else renderHome();
  if ($('#sidebar')) $('#sidebar').classList.remove('open');
}

document.addEventListener('DOMContentLoaded', () => {
  $$('.sidebar .nav-link').forEach(a => a.onclick = () => navigate(a.dataset.view));
  if ($('#menuToggle')) $('#menuToggle').onclick = () => $('#sidebar').classList.toggle('open');
});

/* ---------- Card renderers (Uses your uploads!) ---------- */
function songCard(s) {
  const fav = state.favorites.has(String(s._id));
  
  // If the user uploaded a cover, use it. Otherwise, use a placeholder.
  const cover = (s.coverImage && s.coverImage !== '/images/default-cover.png') 
    ? s.coverImage 
    : `https://placehold.co/400x400/181818/1ed760?text=${encodeURIComponent(s.title.substring(0, 2))}`;

  return `
    <div class="music-card" data-song-id="${s._id}">
      <img src="${cover}" alt="${s.title}" onerror="this.src='https://placehold.co/400x400/181818/1ed760?text=Error'">
      <div class="title">${s.title}</div>
      <div class="subtitle">${s.artist}</div>
      <div class="d-flex justify-content-between align-items-center mt-2">
        <small class="text-muted">${fmt(s.duration)}</small>
        <button class="btn-icon fav-btn ${fav ? 'active' : ''}" data-fav="${s._id}">
          <i class="bi bi-heart${fav ? '-fill' : ''}"></i>
        </button>
      </div>
      <button class="card-play"><i class="bi bi-play-fill"></i></button>
    </div>`;
}

function artistCard(a) {
  // If the user uploaded an artist image, use it. Otherwise, placeholder.
  const imgUrl = (a.profileImage && a.profileImage !== '/images/default-artist.png')
    ? a.profileImage
    : `https://placehold.co/400x400/1ed760/000000?text=${encodeURIComponent(a.name.substring(0, 1))}`;

  return `
    <div class="music-card">
      <img src="${imgUrl}" alt="${a.name}" style="border-radius:50%;" onerror="this.src='https://placehold.co/400x400/1ed760/000000?text=Error'">
      <div class="title text-center">${a.name}</div>
      <div class="subtitle text-center">${a.songs ? a.songs.length : 0} songs</div>
    </div>`;
}

function albumCard(a) {
  const cover = (a.coverImage && a.coverImage !== '/images/default-cover.png') 
    ? a.coverImage 
    : `https://placehold.co/400x400/181818/1ed760?text=${encodeURIComponent(a.title.substring(0, 2))}`;
    
  return `
    <div class="music-card">
      <img src="${cover}">
      <div class="title">${a.title}</div>
      <div class="subtitle">${a.artist}</div>
    </div>`;
}

function fmt(sec) {
  sec = Math.floor(sec || 0);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

/* ---------- Views ---------- */
async function renderHome() {
  const songs = await api('/songs') || [];
  const artists = await api('/artists') || [];
  state.queue = songs;
  
  $('#view').innerHTML = `
    <div class="glass-card mb-4" style="background:linear-gradient(135deg,rgba(30,215,96,.18),rgba(20,20,20,.6))">
      <h1 class="mb-2" style="font-weight:800">Mayong Adlaw 🎧</h1>
      <p class="text-muted mb-0">Welcome to <strong>Spotibai</strong>.</p>
    </div>
    <h2 class="section-title">Featured Bisaya Songs</h2>
    <div class="card-grid">${songs.slice(0,8).map(songCard).join('') || '<p class="text-muted">No songs uploaded yet.</p>'}</div>
    <h2 class="section-title">Trending Artists</h2>
    <div class="card-grid">${artists.slice(0,6).map(artistCard).join('') || '<p class="text-muted">No artists uploaded yet.</p>'}</div>
  `;
  bindCards();
}

async function renderSongs() {
  const songs = await api('/songs') || [];
  state.queue = songs;
  $('#view').innerHTML = `<h2 class="section-title">All Songs</h2>
    <div class="card-grid">${songs.map(songCard).join('') || '<p class="text-muted">No songs uploaded yet.</p>'}</div>`;
  bindCards();
}

async function renderArtists() {
  const artists = await api('/artists') || [];
  $('#view').innerHTML = `<h2 class="section-title">Artists</h2>
    <div class="card-grid">${artists.map(artistCard).join('') || '<p class="text-white">No artists uploaded yet.</p>'}</div>`;
}

async function renderAlbums() {
  // 1. Fetch all songs from the database
  const songs = await api('/songs') || [];
  
  // 2. Group the songs into albums based on their album name
  const albumsMap = {};
  
  songs.forEach(song => {
    // If the song has no album, group it under "Singles"
    const albumName = song.album && song.album.trim() !== '' ? song.album : 'Singles';
    
    if (!albumsMap[albumName]) {
      albumsMap[albumName] = {
        title: albumName,
        artist: song.artist,
        coverImage: song.coverImage, // Use the first song's cover as the album cover
        releaseDate: song.releaseDate,
        songs: []
      };
    }
    albumsMap[albumName].songs.push(song);
  });

  // 3. Convert the grouped object into an array
  const albumsList = Object.values(albumsMap);

  // 4. Render the albums
  $('#view').innerHTML = `<h2 class="section-title">Albums</h2>
    <div class="card-grid">
      ${albumsList.length > 0 
        ? albumsList.map(albumCard).join('') 
        : '<p class="text-muted">No albums found. Upload some songs first!</p>'}
    </div>`;
}

async function renderPlaylists() {
  if (!state.user) return renderAuthPage('login');
  const lists = await api('/playlists') || [];
  
  $('#view').innerHTML = `
    <div class="d-flex justify-content-between align-items-center">
      <h2 class="section-title mb-0">My Playlists</h2>
      <button class="btn-accent btn" id="newPlBtn"><i class="bi bi-plus"></i> New Playlist</button>
    </div>
    <div class="card-grid mt-3">
      ${lists.map(p => `
        <div class="music-card">
          <div style="width:100%;aspect-ratio:1;border-radius:10px;background:linear-gradient(135deg,#1ed760,#17b34d);display:flex;align-items:center;justify-content:center;font-size:2rem;margin-bottom:12px">🎵</div>
          <div class="title">${p.name}</div>
          <div class="subtitle">${p.songs.length} songs</div>
          <button class="btn btn-sm btn-outline-danger mt-2" onclick="deletePlaylist('${p._id}')">Delete</button>
        </div>`).join('') || '<p class="text-muted">No playlists yet.</p>'}
    </div>`;

    // Modern Playlist Modal Logic
  $('#newPlBtn').onclick = () => {
    $('#newPlaylistName').value = ''; // Clear input
    const plModal = new bootstrap.Modal(document.getElementById('playlistModal'));
    plModal.show();
  };

  // When they click "Create" inside the modal
  document.getElementById('savePlaylistBtn').onclick = async () => {
    const name = $('#newPlaylistName').value.trim();
    if (!name) return; // Do nothing if empty
    
    // Save to database
    await api('/playlists', { method: 'POST', body: JSON.stringify({ name }) });
    
    // Close modal and reload the page content
    bootstrap.Modal.getInstance(document.getElementById('playlistModal')).hide();
    renderPlaylists();
  };

  // Allow pressing "Enter" to submit
  document.getElementById('newPlaylistName').onkeypress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('savePlaylistBtn').click();
    }
  };
}

// Helper to delete playlists
window.deletePlaylist = async (id) => {
  // No ugly popup, just delete it instantly
  await api('/playlists/' + id, { method: 'DELETE' });
  renderPlaylists();
};

async function renderFavorites() {
  if (!state.user) return renderAuthPage('login');
  const songs = await api('/favorites') || [];
  state.queue = songs;
  $('#view').innerHTML = `<h2 class="section-title">Your Favorites</h2>
    <div class="card-grid">${songs.map(songCard).join('') || '<p class="text-muted">Nothing yet.</p>'}</div>`;
  bindCards();
}

async function renderRecent() {
  if (!state.user) return renderAuthPage('login');
  
  // Get fresh user data
  const data = await api('/auth/me');
  
  if (!data || !data.user || !data.user.recentlyPlayed || data.user.recentlyPlayed.length === 0) {
    return $('#view').innerHTML = `<h2 class="section-title">Recently Played</h2><p class="text-white">You haven't played any songs yet.</p>`;
  }

  // Safely extract the song IDs
  const recentIds = data.user.recentlyPlayed
    .map(item => {
      // Handle both old (string) and new (object) database formats
      if (typeof item === 'string') return item;
      if (item && item.song) return String(item.song._id || item.song); 
      return null;
    })
    .filter(id => id !== null);

  // Get all songs and filter only the recent ones
  const allSongs = await api('/songs') || [];
  const recentSongs = allSongs.filter(s => recentIds.includes(String(s._id)));
  
  state.queue = recentSongs;
  
  $('#view').innerHTML = `<h2 class="section-title">Recently Played</h2>
    <div class="card-grid">
      ${recentSongs.length > 0 
        ? recentSongs.map(songCard).join('') 
        : '<p class="text-white">No matching songs found.</p>'}
    </div>`;
  bindCards();
}

async function renderProfile() {
  if (!state.user) return renderAuthPage('login');
  $('#view').innerHTML = `
    <div class="glass-card d-flex align-items-center gap-4">
      <div style="width:96px;height:96px;border-radius:50%;background:#1ed760;display:flex;align-items:center;justify-content:center;font-size:2rem;color:#000">${state.user.username.charAt(0).toUpperCase()}</div>
      <div><h1 class="mb-0">${state.user.username}</h1><div class="text-white">${state.user.email}</div></div>
    </div>`;
}

function renderSearchPage() {
  $('#view').innerHTML = `
    <h2 class="section-title">Search</h2>
    <input id="searchPageInput" class="form-control form-control-lg mb-3" placeholder="Search songs, artists, albums...">
    <div id="searchResults"></div>`;

  $('#searchPageInput').oninput = (e) => {
    clearTimeout(window.searchTimeout);
    const q = e.target.value.trim();
    if (!q) return $('#searchResults').innerHTML = '';

    window.searchTimeout = setTimeout(async () => {
      const results = await api('/search?q=' + encodeURIComponent(q));
      if (!results) return;
      
      const section = (title, html) => html ? `<h3 class="section-title" style="font-size:1.2rem">${title}</h3><div class="card-grid">${html}</div>` : '';
      
      $('#searchResults').innerHTML = `
        ${section('Songs', (results.songs || []).map(songCard).join(''))}
        ${section('Artists', (results.artists || []).map(artistCard).join(''))}
        ${section('Albums', (results.albums || []).map(albumCard).join(''))}
        ${section('Playlists', (results.playlists || []).map(p => `<div class="music-card"><div class="title">${p.name}</div></div>`).join(''))}
        ${(!results.songs?.length && !results.artists?.length && !results.albums?.length) ? '<p class="text-muted">No results found.</p>' : ''}
      `;
      bindCards();
    }, 300);
  };
}

/* ---------- Admin Page (Upload) ---------- */
function renderAdmin() {
  if (!state.user || !state.user.isAdmin) {
    return $('#view').innerHTML = `<div class="glass-card text-center"><h2>Admin Only</h2><p class="text-muted">Please log in as admin@spotibai.com</p></div>`;
  }
  
  $('#view').innerHTML = `
    <h2 class="section-title">Admin Dashboard</h2>
    
    <ul class="nav nav-tabs mb-4" id="adminTabs">
      <li class="nav-item"><a class="nav-link active text-success" href="#" data-tab="song">🎵 Upload Song</a></li>
      <li class="nav-item"><a class="nav-link text-light" href="#" data-tab="artist">👤 Upload Artist</a></li>
    </ul>

    <form id="uploadSongForm" class="glass-card">
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">🎵 UPLOAD MUSIC (MP3)</label>
          <input type="file" class="form-control" name="audio" accept="audio/*">
        </div>
        <div class="col-md-6">
          <label class="form-label">🖼️ UPLOAD ALBUM COVER (JPG/PNG)</label>
          <input type="file" class="form-control" name="cover" accept="image/*">
        </div>
        <div class="col-md-6"><label class="form-label">Song Title</label><input class="form-control" name="title" required></div>
        <div class="col-md-6"><label class="form-label">Artist Name</label><input class="form-control" name="artist" required></div>
        <div class="col-md-6"><label class="form-label">Album</label><input class="form-control" name="album"></div>
        <div class="col-md-6"><label class="form-label">Genre</label><input class="form-control" name="genre" value="Bisaya"></div>
        <div class="col-12"><button class="btn-accent btn" type="submit">Upload Song</button></div>
      </div>
    </form>

    <form id="uploadArtistForm" class="glass-card d-none">
      <div class="row g-3">
        <div class="col-12">
          <label class="form-label">🖼️ UPLOAD ARTIST PROFILE IMAGE</label>
          <input type="file" class="form-control" name="profileImage" accept="image/*">
        </div>
        <div class="col-md-6"><label class="form-label">Artist Name</label><input class="form-control" name="name" required></div>
        <div class="col-md-6"><label class="form-label">Biography</label><input class="form-control" name="biography"></div>
        <div class="col-12"><button class="btn-accent btn" type="submit">Upload Artist</button></div>
      </div>
    </form>
  `;

  $$('#adminTabs .nav-link').forEach(tab => {
    tab.onclick = (e) => {
      e.preventDefault();
      $$('#adminTabs .nav-link').forEach(t => { t.classList.remove('active', 'text-success'); t.classList.add('text-light'); });
      tab.classList.add('active', 'text-success'); tab.classList.remove('text-light');
      
      if (tab.dataset.tab === 'song') {
        $('#uploadSongForm').classList.remove('d-none');
        $('#uploadArtistForm').classList.add('d-none');
      } else {
        $('#uploadSongForm').classList.add('d-none');
        $('#uploadArtistForm').classList.remove('d-none');
      }
    };
  });

  $('#uploadSongForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = await fetch('/api/songs', { method: 'POST', body: fd });
    if (res.ok) { alert('✅ Song uploaded!'); navigate('songs'); }
    else { alert('❌ Error uploading song'); }
  };

  $('#uploadArtistForm').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = await fetch('/api/artists', { method: 'POST', body: fd });
    if (res.ok) { alert('✅ Artist uploaded!'); navigate('artists'); }
    else { alert('❌ Error uploading artist'); }
  };
}

/* ---------- Auth Pages ---------- */
function renderAuthPage(mode) {
  const isLogin = mode === 'login';
  $('#view').innerHTML = `
    <div class="d-flex justify-content-center" style="margin-top: 10vh;">
      <div class="glass-card" style="width:100%;max-width:420px">
        <h2 class="mb-4 text-center">${isLogin ? 'Login' : 'Sign Up'}</h2>
        <form id="authForm">
          ${!isLogin ? `<input name="username" class="form-control mb-2" placeholder="Username" required>` : ''}
          <input name="email" type="email" class="form-control mb-2" placeholder="Email" required>
          <input name="password" type="password" class="form-control mb-2" placeholder="Password" required>
          ${!isLogin ? `<input name="confirm" type="password" class="form-control mb-2" placeholder="Confirm Password" required>` : ''}
          <button class="btn-accent btn w-100 mt-2" type="submit">${isLogin ? 'Login' : 'Sign Up'}</button>
        </form>
        <div class="text-center mt-3 small text-muted">
          ${isLogin ? `No account? <a href="#" id="toReg">Sign up</a>` : `Have an account? <a href="#" id="toLogin">Login</a>`}
        </div>
      </div>
    </div>`;
    
  $('#authForm').onsubmit = async e => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.target));
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const res = await api(endpoint, { method: 'POST', body: JSON.stringify(fd) });
    
    if (res && res.user) {
      await loadUser();
      navigate('home');
    } else {
      alert("Login failed. Make sure the server is running.");
    }
  };

  if (isLogin) {
    $('#toReg').onclick = e => { e.preventDefault(); renderAuthPage('register'); };
  } else {
    $('#toLogin').onclick = e => { e.preventDefault(); renderAuthPage('login'); };
  }
}

/* ---------- Binders & Player ---------- */
function bindCards() {
  $$('.music-card[data-song-id]').forEach(card => {
    const id = card.dataset.songId;
    card.querySelector('.card-play')?.addEventListener('click', e => {
      e.stopPropagation();
      const song = state.queue.find(s => String(s._id) === id);
      if (song) playSong(song);
    });
    card.querySelector('.fav-btn')?.addEventListener('click', async e => {
      e.stopPropagation();
      if (!state.user) return renderAuthPage('login');
      const fav = state.favorites.has(id);
      if (fav) { await api('/favorites/' + id, { method: 'DELETE' }); state.favorites.delete(id); }
      else     { await api('/favorites', { method: 'POST', body: JSON.stringify({ songId: id }) }); state.favorites.add(id); }
      const btn = card.querySelector('.fav-btn');
      btn.classList.toggle('active', !fav);
      btn.innerHTML = `<i class="bi bi-heart${!fav ? '-fill' : ''}"></i>`;
    });
  });
}

function playSong(song) {
  // This is the new line that resets the ad!
  state.hasShownAd = false;

  state.currentSong = song;
  $('#playerTitle').textContent = song.title;
  $('#playerArtist').textContent = song.artist;
  
  const cover = (song.coverImage && song.coverImage !== '/images/default-cover.png') 
    ? song.coverImage 
    : `https://placehold.co/400x400/181818/1ed760?text=${encodeURIComponent(song.title.substring(0, 2))}`;
  
  $('#playerCover').src = cover;
  $('#durTime').textContent = fmt(song.duration);

  const audio = document.getElementById('audio');
  
  if (song.audioFile) {
    audio.src = song.audioFile;
    audio.play().then(() => {
      $('#btnPlay').innerHTML = '<i class="bi bi-pause-fill"></i>';
    }).catch(err => {
      alert("Error playing audio: " + err.message);
    });
  } else {
    alert("No audio file was uploaded for this song (placeholder mode).");
    $('#btnPlay').innerHTML = '<i class="bi bi-play-fill"></i>';
  }
}

// --- PLAYER CONTROLS (Play, Next, Prev, Shuffle, Repeat) ---

$('#btnPlay').onclick = () => {
  const audio = document.getElementById('audio');
  if (!audio.src) return alert("Click a song's play button first!");
  
  if (audio.paused) { 
    audio.play(); 
    $('#btnPlay').innerHTML = '<i class="bi bi-pause-fill"></i>'; 
  } else { 
    audio.pause(); 
    $('#btnPlay').innerHTML = '<i class="bi bi-play-fill"></i>'; 
  }
};

// 1. Play Next Song
function nextSong() {
  if (!state.queue || state.queue.length === 0) return;
  
  let i = state.queue.findIndex(s => String(s._id) === String(state.currentSong?._id));
  
  if (state.shuffle) {
    // Pick a random song
    i = Math.floor(Math.random() * state.queue.length);
  } else {
    // Pick the next song in the list
    i = (i + 1) % state.queue.length;
  }
  playSong(state.queue[i]);
}

// 2. Play Previous Song
function prevSong() {
  if (!state.queue || state.queue.length === 0) return;
  
  let i = state.queue.findIndex(s => String(s._id) === String(state.currentSong?._id));
  
  if (state.shuffle) {
    i = Math.floor(Math.random() * state.queue.length);
  } else {
    // Pick the previous song in the list
    i = (i - 1 + state.queue.length) % state.queue.length;
  }
  playSong(state.queue[i]);
}

// 3. Shuffle Button
$('#btnShuffle').onclick = (e) => {
  state.shuffle = !state.shuffle;
  e.currentTarget.classList.toggle('active', state.shuffle);
  e.currentTarget.style.color = state.shuffle ? 'var(--accent)' : 'var(--muted)';
};

// 4. Repeat Button
$('#btnRepeat').onclick = (e) => {
  state.repeat = !state.repeat;
  e.currentTarget.classList.toggle('active', state.repeat);
  e.currentTarget.style.color = state.repeat ? 'var(--accent)' : 'var(--muted)';
};

// 5. Attach Next/Prev Click Events
$('#btnNext').onclick = nextSong;
$('#btnPrev').onclick = prevSong;

// 6. Auto-play Next Song when current song ends (or repeat if enabled)
document.getElementById('audio').onended = () => {
  if (state.repeat && state.currentSong) {
    // Replay the same song
    playSong(state.currentSong);
  } else {
    // Go to next song
    nextSong();
  }
};

// 7. Ads playing halfway through the song
const audioPlayer = document.getElementById('audio');
const adModalElement = document.getElementById('adModal');

if (audioPlayer && adModalElement) {
  const adModal = new bootstrap.Modal(adModalElement, { backdrop: 'static', keyboard: false });
  
  audioPlayer.addEventListener('timeupdate', () => {
    if (!audioPlayer.duration) return;
    
    const percentPlayed = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    
    if (percentPlayed >= 50 && !state.hasShownAd) {
      state.hasShownAd = true; 
      
      audioPlayer.pause();
      $('#btnPlay').innerHTML = '<i class="bi bi-play-fill"></i>';
      
      const adVideo = document.getElementById('adVideoPlayer');
      if (adVideo) {
        adVideo.currentTime = 0;
        adVideo.muted = false;
        adVideo.play().catch(err => console.warn("Ad audio blocked", err));
      }
      
      adModal.show();
    }
  });

  $('#closeAdBtn').onclick = () => {
    const adVideo = document.getElementById('adVideoPlayer');
    if (adVideo) {
      adVideo.pause();
      adVideo.currentTime = 0;
      adVideo.muted = true;
    }
    
    adModal.hide();
    audioPlayer.play();
    $('#btnPlay').innerHTML = '<i class="bi bi-pause-fill"></i>';
  };
}

/* ---------- Boot ---------- */
window.onload = async () => {
  await loadUser();
  navigate('home');
};
// --- VOLUME & PROGRESS BAR FIX ---
const audioEl = document.getElementById('audio');
const progressBar = document.getElementById('progress');
const volumeBar = document.getElementById('volume');
const timeDisplay = document.getElementById('curTime');
const durDisplay = document.getElementById('durTime');

// 1. Volume Control
if (volumeBar) {
  volumeBar.addEventListener('input', (e) => {
    audioEl.volume = e.target.value;
  });
}

// 2. Update Progress Bar as song plays
if (audioEl) {
  audioEl.addEventListener('timeupdate', () => {
    if (!audioEl.duration) return;
    
    // Update the green progress bar
    const percent = (audioEl.currentTime / audioEl.duration) * 100;
    if (progressBar) progressBar.value = percent;
    
    // Update the current time text (e.g., 1:23)
    if (timeDisplay) {
      const mins = Math.floor(audioEl.currentTime / 60);
      const secs = Math.floor(audioEl.currentTime % 60);
      timeDisplay.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
  });
}

// 3. Seek (Jump to a specific time) when user drags the progress bar
if (progressBar) {
  progressBar.addEventListener('input', (e) => {
    if (!audioEl.duration) return;
    audioEl.currentTime = (e.target.value / 100) * audioEl.duration;
  });
}

// 4. Ensure the total duration (load time) is updated when a song loads
if (audioEl) {
  audioEl.addEventListener('loadedmetadata', () => {
    if (durDisplay && audioEl.duration) {
      const mins = Math.floor(audioEl.duration / 60);
      const secs = Math.floor(audioEl.duration % 60);
      durDisplay.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
  });
  
  // Also update duration when a new song starts playing
  audioEl.addEventListener('play', () => {
    if (durDisplay && audioEl.duration) {
      const mins = Math.floor(audioEl.duration / 60);
      const secs = Math.floor(audioEl.duration % 60);
      durDisplay.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
  });
}
// --- PLAYER HEART (FAVORITE) FIX ---
const playerFavBtn = document.getElementById('btnFav');

if (playerFavBtn) {
  playerFavBtn.onclick = async () => {
    if (!state.currentSong) return alert("Play a song first!");
    if (!state.user) return renderAuthPage('login');

    const id = String(state.currentSong._id);
    const isFav = state.favorites.has(id);

    try {
      // 1. Save to database
      if (isFav) {
        await api('/favorites/' + id, { method: 'DELETE' });
        state.favorites.delete(id);
      } else {
        await api('/favorites', { method: 'POST', body: JSON.stringify({ songId: id }) });
        state.favorites.add(id);
      }

      // 2. Update the heart in the bottom player
      playerFavBtn.classList.toggle('active', !isFav);
      playerFavBtn.innerHTML = `<i class="bi bi-heart${!isFav ? '-fill' : ''}"></i>`;
      
      // Make the heart green when active
      playerFavBtn.style.color = !isFav ? 'var(--accent)' : 'var(--muted)';

      // 3. Update the heart on the song cards in the background
      document.querySelectorAll('.fav-btn').forEach(btn => {
        if (btn.dataset.fav === id) {
          btn.classList.toggle('active', !isFav);
          btn.innerHTML = `<i class="bi bi-heart${!isFav ? '-fill' : ''}"></i>`;
        }
      });

    } catch (err) {
      alert("Error favoriting song");
    }
  };
}

// Make sure the heart turns green when you click play on a song
const originalPlaySong = playSong;
playSong = function(song) {
  originalPlaySong(song);
  
  if (playerFavBtn) {
    const isFav = state.favorites.has(String(song._id));
    playerFavBtn.classList.toggle('active', isFav);
    playerFavBtn.innerHTML = `<i class="bi bi-heart${isFav ? '-fill' : ''}"></i>`;
    playerFavBtn.style.color = isFav ? 'var(--accent)' : 'var(--muted)';
  }
};