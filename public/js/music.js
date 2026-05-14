/**
 * Namárië – music.js v7
 * Semua fungsi playlist dijadikan global agar tidak hilang saat AJAX navigate
 */

// ══════════════════════════════════════════════════════════════
//  PLAYLIST MANAGER  (global, diinisialisasi sekali)
// ══════════════════════════════════════════════════════════════

(function initPlaylistManager() {
  // Jangan inisialisasi ulang jika sudah ada
  if (window._playlistManagerReady) return;
  window._playlistManagerReady = true;

  function getPLKey() {
    return 'namarie_playlists_' + (window.NAMARIE_USER_ID || 'guest');
  }
  function getPlaylists() {
    return JSON.parse(localStorage.getItem(getPLKey()) || '[]');
  }
  function savePlaylists(pls) {
    localStorage.setItem(getPLKey(), JSON.stringify(pls));
    // Update sidebar
    if (typeof window.reloadSidebarPlaylists === 'function') {
      window.reloadSidebarPlaylists();
    }
    // Update right panel
    if (typeof window.refreshRightPanel === 'function') {
      window.refreshRightPanel();
    }

    // Refresh main view if on "My Playlists" page
    const titleEl = document.getElementById('main-page-title');
    const isAllPlaylistsView = (titleEl && titleEl.textContent === 'My Playlists');
    if (isAllPlaylistsView && typeof window.viewAllPlaylists === 'function') {
      window.viewAllPlaylists();
    }
  }
  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  // ── Play Count Tracking ─────────────────────────────
  let _lastIncrementedId = null;
  let _lastIncrementedTime = 0;

  window.incrementPlayCount = function(trackId) {
    if (!trackId) return;

    // Debounce
    const now = Date.now();
    if (trackId === _lastIncrementedId && (now - _lastIncrementedTime) < 1000) {
      return;
    }
    _lastIncrementedId = trackId;
    _lastIncrementedTime = now;

    const userSuffix = (window.NAMARIE_USER_ID || 'guest');
    const countsKey  = 'namarie_play_counts_' + userSuffix;
    const historyKey = 'namarie_play_history_' + userSuffix;
    const resetKey   = 'namarie_top_reset_' + userSuffix;
    
    // Check for weekly reset
    const lastReset = parseInt(localStorage.getItem(resetKey) || '0');
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    
    let counts = JSON.parse(localStorage.getItem(countsKey) || '{}');
    if (now - lastReset > ONE_WEEK) {
      counts = {};
      localStorage.setItem(resetKey, now.toString());
    }

    counts[trackId] = (counts[trackId] || 0) + 1;
    localStorage.setItem(countsKey, JSON.stringify(counts));

    // Record to history log for detailed stats
    let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history.push({ id: trackId, ts: now });
    if (history.length > 500) history.shift(); // Limit log size
    localStorage.setItem(historyKey, JSON.stringify(history));
    
    // Refresh Top Panel if active
    const topTab = document.querySelector('.right-panel-tab[data-tab="top"]');
    if (topTab && topTab.classList.contains('active')) {
      window.renderTopPanel();
    }
  };

  window.recordListenDuration = function(trackId, durationSeconds) {
    if (!trackId || durationSeconds < 1) return;
    const userSuffix = (window.NAMARIE_USER_ID || 'guest');
    const totalTimeKey = 'namarie_total_time_' + userSuffix;
    const trackTimeKey = 'namarie_track_time_' + userSuffix;

    // Global total
    let total = parseInt(localStorage.getItem(totalTimeKey) || '0');
    localStorage.setItem(totalTimeKey, (total + durationSeconds).toString());

    // Per track total
    let trackTimes = JSON.parse(localStorage.getItem(trackTimeKey) || '{}');
    trackTimes[trackId] = (trackTimes[trackId] || 0) + durationSeconds;
    localStorage.setItem(trackTimeKey, JSON.stringify(trackTimes));

    // Daily stats (last 30 days)
    const dailyKey = 'namarie_daily_stats_' + userSuffix;
    const dailyStats = JSON.parse(localStorage.getItem(dailyKey) || '{}');
    const today = new Date().toISOString().split('T')[0];
    dailyStats[today] = (dailyStats[today] || 0) + durationSeconds;
    
    // Prune old data (keep only 30 days)
    const dates = Object.keys(dailyStats).sort();
    if (dates.length > 30) {
      delete dailyStats[dates[0]];
    }
    localStorage.setItem(dailyKey, JSON.stringify(dailyStats));
  };

  window.renderTopPanel = function() {
    const container = document.getElementById('top-list');
    if (!container) return;
    
    const userSuffix = (window.NAMARIE_USER_ID || 'guest');
    const countsKey  = 'namarie_play_counts_' + userSuffix;
    const resetKey   = 'namarie_top_reset_' + userSuffix;

    // Check for weekly reset before rendering
    const now = Date.now();
    const lastReset = parseInt(localStorage.getItem(resetKey) || '0');
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    
    let counts = JSON.parse(localStorage.getItem(countsKey) || '{}');
    if (now - lastReset > ONE_WEEK) {
      counts = {};
      localStorage.setItem(countsKey, '{}');
      localStorage.setItem(resetKey, now.toString());
    }
    
    const lib = window._pageTracksData || [];
    if (!lib.length) return;

    const sorted = Object.keys(counts)
      .map(id => ({ id: parseInt(id), count: counts[id] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Limit to 5 songs

    const tracks = sorted.map(s => lib.find(t => t.id === s.id)).filter(Boolean);

    if (!tracks.length) {
      container.innerHTML = '<div class="right-panel-empty"><p>No play history yet.</p></div>';
      return;
    }

    container.innerHTML = tracks.map((t, i) => {
      const coverHTML = t.cover_url 
        ? '<img src="' + t.cover_url + '" alt="cover" style="width:100%;height:100%;object-fit:cover;border-radius:4px">'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>';

      return '<div class="pl-track-item" onclick="window.playFromList(' + t.id + ')">' +
        '<div class="pl-track-num">' + (i+1) + '</div>' +
        '<div class="pl-track-icon" style="width:24px;height:24px;flex-shrink:0;margin:0 10px 0 0;overflow:hidden;border-radius:4px">' + coverHTML + '</div>' +
        '<div class="pl-track-info">' +
          '<div class="pl-track-title">' + esc(t.title) + '</div>' +
          '<div class="pl-track-meta">' + esc(t.artist || 'Unknown Artist') + ' • ' + (counts[t.id] || 0) + ' plays</div>' +
        '</div>' +
        '<button class="icon-btn" onclick="event.stopPropagation(); window.queueTrack(' + t.id + ')" title="Add to queue">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' +
        '</button></div>';
    }).join('');
  };

  window.renderDiscoverPanel = function(force = false) {
    const container = document.getElementById('discover-list');
    if (!container) return;
    
    const userSuffix = (window.NAMARIE_USER_ID || 'guest');
    const cacheKey   = 'namarie_discover_cache_' + userSuffix;
    
    const lib = window._pageTracksData || [];
    if (!lib.length) {
      container.innerHTML = '<div class="right-panel-empty"><p>No tracks in library yet.</p></div>';
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    let cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
    
    let tracks = [];
    if (!force && cached && cached.date === today) {
      // Use cached tracks
      tracks = cached.trackIds.map(id => lib.find(t => t.id === id)).filter(Boolean);
    } 
    
    // If force refresh, or no cache, or cache is empty, re-generate
    if (force || !tracks.length) {
      const shuffled = lib.sort(() => 0.5 - Math.random()).slice(0, 5);
      tracks = shuffled;
      localStorage.setItem(cacheKey, JSON.stringify({
        date: today,
        trackIds: shuffled.map(t => t.id)
      }));
    }

    container.innerHTML = tracks.map((t, i) => {
      const coverHTML = t.cover_url 
        ? '<img src="' + t.cover_url + '" alt="cover" style="width:100%;height:100%;object-fit:cover;border-radius:4px">'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>';

      return '<div class="pl-track-item" onclick="window.playFromList(' + t.id + ')">' +
        '<div class="pl-track-icon" style="overflow:hidden;border-radius:4px">' + coverHTML + '</div>' +
        '<div class="pl-track-info">' +
          '<div class="pl-track-title">' + esc(t.title) + '</div>' +
          '<div class="pl-track-meta" style="font-size:10px;color:var(--muted)">' + esc(t.artist || 'Unknown Artist') + '</div>' +
        '</div>' +
        '<button class="icon-btn" onclick="event.stopPropagation(); window.queueTrack(' + t.id + ')" title="Add to queue">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' +
        '</button></div>';
    }).join('');
  };

  window.playFromList = function(id) {
    if (typeof window.playTrackById === 'function') window.playTrackById(id);
  };
  window.refreshRightPanel = function() {
    if (window._activePlId) {
      // Sedang view detail → refresh isi
      window.viewPlaylist(window._activePlId);
    } else {
      // Sedang di list → render list
      window.renderPlaylistPanel();
    }
  };

  window.renderPlaylistPanel = function() {
    window._activePlId = null;
    const container = document.getElementById('playlist-list');
    const titleEl   = document.getElementById('right-panel-title');
    const metaEl    = document.getElementById('right-panel-meta');
    const backBtn   = document.getElementById('right-panel-back');
    if (titleEl) titleEl.textContent = 'Playlist';
    if (metaEl)  metaEl.textContent  = 'Manage your playlists';
    if (backBtn) backBtn.style.display = 'none';
    if (!container) return;

    const pls = getPlaylists();
    if (!pls.length) {
      container.innerHTML =
        '<div class="right-panel-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' +
        '<p>No playlists yet.<br>Create your first playlist!</p></div>';
    } else {
      container.innerHTML = pls.map(pl => {
        const coverKey  = getPLKey() + '_cover_' + pl.id;
        const coverData = localStorage.getItem(coverKey) || '';
        const iconHTML  = coverData
          ? '<img src="' + coverData + '" style="width:100%;height:100%;object-fit:cover;border-radius:5px">'
          : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
        return '<div class="queue-item" onclick="window.viewPlaylist(' + pl.id + ')">' +
          '<div class="queue-icon" style="overflow:hidden">' + iconHTML + '</div>' +
          '<div class="queue-info">' +
          '<div class="queue-title">' + esc(pl.name) + '</div>' +
          '<div style="font-size:11px;color:var(--muted)">' + (pl.tracks||[]).length + ' songs</div>' +
          '</div>' +
          '<button class="icon-btn danger" onclick="event.stopPropagation();window.deletePlaylist(' + pl.id + ')" title="Delete playlist">' +
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>' +
          '</button></div>';
      }).join('');
    }
  };

  window.viewPlaylist = function(id) {
    window._activePlId = id;
    const pls   = getPlaylists();
    const pl    = pls.find(p => p.id === id);
    if (!pl) return;

    // Sync metadata with library if available
    const lib = window._library || window._pageTracksData || [];
    let changed = false;
    pl.tracks = (pl.tracks || []).map(t => {
      const fresh = lib.find(l => l.id === t.id);
      if (fresh) {
        if (t.title !== fresh.title || t.artist !== fresh.artist || t.cover_url !== fresh.cover_url) {
          changed = true;
          return { ...t, ...fresh };
        }
      }
      return t;
    });
    if (changed) savePlaylists(pls);

    // Sidebar active state management (Headphone icon)
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const plNavLink = document.getElementById('nav-view-all-playlists');
    if (plNavLink) plNavLink.classList.add('active');

    // Determine if we are on the music library page and NOT in stats mode
    const onMusicPage = !!document.getElementById('main-page-title');
    const isStats = !!window._isStatsMode;

    if (onMusicPage && !isStats) {
      if (typeof window.renderCenterPlaylist === 'function') {
        window.renderCenterPlaylist(pl);
      }
    } else {
      // If we're in stats mode or not on music page, reset stats flag 
      // and navigate to music page first to get a clean layout.
      window._isStatsMode = false;
      window._pendingPlaylistId = id;
      
      if (typeof ajaxNavigate === 'function') {
        ajaxNavigate('/music');
      } else {
        window.location.href = '/music';
      }
      return;
    }

    // Mark active in sidebar
    document.querySelectorAll('.playlist-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.playlist-item').forEach(el => {
      if (el.querySelector('.playlist-name') && el.querySelector('.playlist-name').textContent.trim() === pl.name) {
        el.classList.add('active');
      }
    });

    // playPlaylistTrack will be defined globally below

    window.openAddSongsModal = function(plId) {
      window._addSongsPlId = plId;
      const search = document.getElementById('add-songs-search');
      if (search) search.value = '';
      window.filterAddSongs();
      openModal('modal-add-songs-playlist');
    };

    window.filterAddSongs = function() {
      const plId = window._addSongsPlId;
      const pl = getPlaylists().find(p => p.id === plId);
      if (!pl) return;
      
      const q = (document.getElementById('add-songs-search')?.value || '').toLowerCase().trim();
      const listEl2 = document.getElementById('add-songs-list');
      if (!listEl2) return;

      const allTracks = window._pageTracksData || [];
      const plTrackIds = (pl.tracks || []).map(t => t.id);
      const result = allTracks.filter(t => !q || t.title.toLowerCase().includes(q));

      if (result.length === 0) {
        listEl2.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:12px;padding:20px;">No songs found.</div>';
        return;
      }

      listEl2.innerHTML = result.map(t => {
        const isAdded = plTrackIds.includes(t.id);
        return '<div style="display:flex;align-items:center;padding:8px;border-bottom:1px solid var(--border);gap:10px;">' +
               '<div style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;">' + esc(t.title) + '</div>' +
               (isAdded 
                 ? '<button disabled style="background:transparent;border:none;color:var(--muted);font-size:12px;">Added</button>'
                 : '<button onclick="window.addTrackFromModal(' + t.id + ')" style="background:var(--primary);color:#fff;border:none;border-radius:12px;padding:4px 10px;font-size:11px;cursor:pointer;">Add</button>'
               ) +
               '</div>';
      }).join('');
    };

    window.addTrackFromModal = function(trackId) {
      const track = (window._pageTracksData || []).find(t => t.id === trackId);
      if (track) {
        window.addTrackToPlaylist(window._addSongsPlId, track);
        window.filterAddSongs();
        if (window._centerPlaylistId === window._addSongsPlId) {
           const freshPl = getPlaylists().find(p => p.id === window._addSongsPlId);
           if (freshPl) window.renderCenterPlaylist(freshPl);
        }
      }
    };
  };

  const quotes = [
    '"Music is the wine that fills the cup of silence." — Robert Fripp',
    '"Music in the soul can be heard by the universe." — Lao Tzu',
    '"The only truth is music." — Jack Kerouac',
    '"Music is the moonlight in the gloomy night of life." — Jean Paul Friedrich Richter',
    '"Music is feeling then, not sound." — Wallace Stevens',
    '"Music washes away from the soul the dust of everyday life." — Berthold Auerbach',
    '"To live is to be musical, starting with the blood dancing in your veins." — Mary Oliver',
    '"Music is the strongest form of magic." — Marilyn Manson',
    '"A song can change or save a life." — Unknown',
    '"Music is the poetry of the air." — Jean Paul',
    '"My life is a song that never ends." — Unknown',
    '"Music is the breath of instruments." — English Proverb',
    '"Without music, life would be a mistake." — Friedrich Nietzsche',
    '"Music is prayer the heart sings." — Unknown',
    '"Where there is music, there is no room for evil." — Miguel de Cervantes',
    '"Music is life itself." — Louis Armstrong',
    '"Let the music speak." — Unknown',
    '"Sing the song only you can sing." — Unknown',
    '"Music: The art of thinking with sounds." — Jules Combarieu',
    '"Everything in the universe has a rhythm." — Maya Angelou'
  ];

  window.renderCenterPlaylist = function(pl) {
    // Guard: only operate on the music library page
    if (!document.getElementById('main-page-title')) return;

    window._centerPlaylistId = pl.id;

    // Hide the global page header to prevent overlapping
    const globalHeader = document.querySelector('.page-header-sticky');
    if (globalHeader) globalHeader.style.display = 'none';

    // Required variables for rendering
    const coverKey  = getPLKey() + '_cover_' + pl.id;
    const coverData = localStorage.getItem(coverKey) || '';
    const savedSort = localStorage.getItem('namarie_pl_sort_center_' + pl.id) || 'default';
    const card      = document.querySelector('.card');
    if (!card) return;

    const quote = quotes[Math.floor(Math.random() * quotes.length)];

    card.innerHTML =
      // ── Combined Sticky Header (Quote + Info + Actions) ──
      '<div class="pl-sticky-header-wrap" style="top: 0; z-index: 110;">' +
        // Quote Row (Left aligned, Segoe Print) + Back Button
        '<div style="padding: 16px 28px 0; display:flex; align-items:center; gap:16px;">' +
          '<button class="pl-back-btn-top" onclick="window.viewAllPlaylists()" title="Back to Playlists" style="background:none; border:none; padding:0; cursor:pointer; color:var(--muted); display:flex; align-items:center; justify-content:center; transition:all 0.2s; flex-shrink:0;">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px;height:20px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>' +
          '</button>' +
          '<div style="font-family: \'Segoe Print\', \'Comic Sans MS\', cursive; font-size: 15px; color: var(--text); opacity: 0.9; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">' + quote + '</div>' +
        '</div>' +
        
        // Playlist Info Row
        '<div class="pl-center-header" style="padding-top: 8px; padding-bottom: 0;">' +
          '<div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px">' +
            // Cover
            '<div class="pl-cover-wrap" onclick="window.changeCover(' + pl.id + ')" title="Change cover photo" style="width:150px;height:150px;flex-shrink:0">' +
              (coverData
                ? '<img src="' + coverData + '" alt="cover" style="width:100%;height:100%;object-fit:cover;border-radius:12px;">'
                : '<svg viewBox="0 0 24 24" fill="currentColor" style="width:64px;height:64px;opacity:.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>') +
              '<div class="pl-cover-overlay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>' +
            '</div>' +
            // Info
            '<div style="flex:1;min-width:0">' +
              '<div class="pl-name-row">' +
                '<div class="pl-name-display" id="pl-center-name">' + esc(pl.name) + '</div>' +
                '<div style="display:flex;gap:4px;margin-left:auto">' +
                  '<button class="pl-edit-name-btn" onclick="window.editCenterPlaylistName(' + pl.id + ')" title="Edit name">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
                  '</button>' +
                  '<button class="pl-edit-name-btn" onclick="window.deletePlaylist(' + pl.id + ')" title="Delete playlist" onmouseover="this.style.color=\'var(--danger)\'" onmouseout="this.style.color=\'var(--muted)\'">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/></svg>' +
                  '</button>' +
                '</div>' +
              '</div>' +
              '<div class="pl-desc-wrap" onclick="window.editCenterPlaylistDesc(' + pl.id + ')" title="Click to edit description">' +
                '<span id="pl-center-desc" class="pl-desc-text">' + esc(pl.description || '') + '</span>' +
                '<span class="pl-desc-placeholder"' + (pl.description ? ' style="display:none"' : '') + '>Add a description...</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // Action Bar Row (with Search)
        '<div style="display:flex;justify-content:space-between;align-items:center;padding: 12px 28px;">' +
          '<span class="section-title" id="pl-center-section-count" style="margin:0; font-size:14px; font-weight:600;">' + (pl.tracks||[]).length + ' songs</span>' +
          '<div style="display:flex;gap:8px;align-items:center;">' +
            // Search Bar
            '<div style="position:relative;display:flex;align-items:center">' +
              '<svg style="position:absolute;left:10px;width:12px;height:12px;color:var(--muted)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>' +
              '<input type="text" id="pl-center-search" placeholder="Find song..." onkeyup="window.filterCenterPlaylist()" style="background:var(--bg3);color:var(--text);border:none;border-radius:20px;padding:8px 12px 8px 30px;font-size:12px;outline:none;width:140px;transition:width 0.2s" onfocus="this.style.width=\'180px\'" onblur="this.style.width=\'140px\'">' +
            '</div>' +
            '<select id="pl-center-sort" onchange="window.filterCenterPlaylist()" style="background:var(--bg3);color:var(--text);border:none;border-radius:20px;padding:8px 12px;font-size:12px;outline:none;cursor:pointer;">' +
              '<option value="default"' + (savedSort==='default'?' selected':'') + '>Default</option>' +
              '<option value="az"' + (savedSort==='az'?' selected':'') + '>A-Z</option>' +
              '<option value="za"' + (savedSort==='za'?' selected':'') + '>Z-A</option>' +
              '<option value="duration-asc"' + (savedSort==='duration-asc'?' selected':'') + '>Shortest</option>' +
              '<option value="duration-desc"' + (savedSort==='duration-desc'?' selected':'') + '>Longest</option>' +
            '</select>' +
            '<button onclick="window.openAddSongsModal(' + pl.id + ')" title="Add songs" style="background:var(--primary);color:#fff;border:none;border-radius:20px;padding:8px 14px;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:5px;font-weight:500">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
              'Add' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      // ── Track List ──
      '<div class="music-list" id="pl-center-track-list"></div>';

    // Render track rows
    window._centerPlaylistTracks = (pl.tracks || []).slice();
    window._renderCenterTracks(pl);

    // Like button state
    if (typeof updateAllLikeButtons === 'function') updateAllLikeButtons();
  };

  window._renderCenterTracks = function(pl) {
    const listEl = document.getElementById('pl-center-track-list');
    if (!listEl) return;

    const q    = (document.getElementById('pl-center-search')?.value || '').toLowerCase().trim();
    const sort = document.getElementById('pl-center-sort')?.value || 'default';

    // Save sort preference
    localStorage.setItem('namarie_pl_sort_center_' + pl.id, sort);

    // SYNC with library (always use latest metadata for display)
    const lib = window._library || window._pageTracksData || [];
    let tracks = (window._centerPlaylistTracks || []).map(t => {
      const fresh = lib.find(l => l.id === t.id);
      return fresh ? { ...t, ...fresh } : t;
    });

    // Filter
    if (q) tracks = tracks.filter(t => t.title.toLowerCase().includes(q));

    // Sort
    if (sort === 'az')            tracks.sort((a,b) => a.title.localeCompare(b.title));
    else if (sort === 'za')       tracks.sort((a,b) => b.title.localeCompare(a.title));
    else if (sort === 'duration-asc')  tracks.sort((a,b) => (a.duration||0) - (b.duration||0));
    else if (sort === 'duration-desc') tracks.sort((a,b) => (b.duration||0) - (a.duration||0));

    if (!tracks.length) {
      listEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted);font-size:13px">' + (q ? 'No songs found.' : 'No songs in playlist yet.') + '</div>';
      return;
    }

    // Set current playlist context for player
    window._currentViewedPlaylistTracks = pl.tracks;

    listEl.innerHTML = tracks.map((t, i) => {
      const coverHTML = t.cover_url 
        ? '<img src="' + t.cover_url + '" alt="cover" style="width:100%;height:100%;object-fit:cover;border-radius:4px">'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg>';

      return '<div class="music-row" data-idx="' + i + '" data-id="' + t.id + '" data-title="' + esc(t.title.toLowerCase()) + '">' +
        '<div class="music-num">' + (i+1) + '</div>' +
        '<div class="music-info-click" style="display:flex;align-items:center;flex:1;gap:10px;cursor:pointer" onclick="playPlaylistTrack(' + pl.id + ', ' + t.id + ')">' +
          '<div class="music-icon">' + coverHTML + '</div>' +
          '<div class="music-info">' +
            '<div class="music-name music-title" id="title-' + t.id + '">' + esc(t.title) + '</div>' +
            '<div class="music-meta">' +
              esc(t.artist || 'Unknown Artist') + ' • ' + (t.duration_formatted || '') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<button class="music-like" data-id="' + t.id + '" title="Like" onclick="event.stopPropagation();toggleLike(' + t.id + ')">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
        '</button>' +
        '<button title="Remove from playlist" onclick="event.stopPropagation();window.removeFromPlaylist(' + pl.id + ', ' + t.id + ')" style="background:transparent;border:none;color:var(--muted);cursor:pointer;padding:8px;border-radius:6px;transition:color .15s" onmouseover="this.style.color=\'var(--danger)\'" onmouseout="this.style.color=\'var(--muted)\'">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>' +
        '</button>' +
        '<div class="music-dur">' + (t.duration_formatted || '') + '</div>' +
        '<div class="music-actions" onclick="event.stopPropagation()">' +
          '<button class="icon-btn" title="Add to queue" onclick="queueTrack(' + t.id + ')">' +
            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');

    if (typeof updateAllLikeButtons === 'function') updateAllLikeButtons();
    if (typeof highlightRow === 'function') highlightRow(window.currentIdx || 0);
  };

  window.filterCenterPlaylist = function() {
    const plId = window._centerPlaylistId;
    const pl   = plId ? getPlaylists().find(p => p.id === plId) : null;
    if (!pl) return;
    // Refresh from latest saved data
    window._centerPlaylistTracks = (pl.tracks || []).slice();
    window._renderCenterTracks(pl);
  };

  window.playPlaylistTrack = function(plId, trackId) {
    const pl = getPlaylists().find(p => p.id === plId);
    if (!pl || !pl.tracks) return;
    if (typeof window.setPlaylist === 'function') {
      window.setPlaylist(pl.tracks);
      if (typeof window.playTrackById === 'function') {
        window.playTrackById(trackId);
      }
    }
  };

    // removeFromPlaylist will be defined globally below

  window.editCenterPlaylistName = function(id) {
    const pls = getPlaylists();
    const pl  = pls.find(p => p.id === id);
    if (!pl) return;

    window._renamePlaylistId = id;
    const input = document.getElementById('rename-playlist-input');
    if (input) {
      input.value = pl.name;
      openModal('modal-rename-playlist');
      setTimeout(() => { input.focus(); input.select(); }, 150);
    }
  };

  window.editCenterPlaylistDesc = function(id) {
    const descWrap = document.querySelector('.pl-desc-wrap');
    const descEl = document.getElementById('pl-center-desc');
    const placeholderEl = descWrap ? descWrap.querySelector('.pl-desc-placeholder') : null;
    if (!descEl || !descWrap) return;

    const oldDesc = descEl.textContent.trim();
    const input = document.createElement('textarea');
    input.className = 'pl-desc-input';
    input.value = oldDesc;
    input.placeholder = 'Add a description...';
    
    descWrap.parentNode.insertBefore(input, descWrap);
    descWrap.style.display = 'none';
    input.focus();

    function save() {
      const newDesc = input.value.trim();
      const pls = getPlaylists();
      const pl = pls.find(p => p.id === id);
      if (pl && newDesc !== oldDesc) {
        pl.description = newDesc;
        savePlaylists(pls);
        if (typeof showToast === 'function') showToast('Description updated!', 'success');
      }
      descEl.textContent = newDesc;
      if (placeholderEl) {
        placeholderEl.style.display = newDesc ? 'none' : '';
      }
      descWrap.style.display = '';
      input.remove();
    }

    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { descWrap.style.display = ''; input.remove(); }
    });
  };

  // ── Edit nama playlist ─────────────────────────────
  window.editPlaylistName = function(id) {
    window.editCenterPlaylistName(id);
  };

  // ── Ganti cover playlist ───────────────────────────
  window.changeCover = function(id) {
    const fileInput = document.createElement('input');
    fileInput.type  = 'file';
    fileInput.accept= 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
    fileInput.click();

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) { fileInput.remove(); return; }

      const reader = new FileReader();
      reader.onload = e => {
        window.openCropper({
          src: e.target.result,
          title: 'Crop Playlist Cover',
          aspectRatio: 1, // Square for covers
          onSave: (canvas) => {
            const croppedData = canvas.toDataURL('image/jpeg', 0.8);
            const coverKey = getPLKey() + '_cover_' + id;
            localStorage.setItem(coverKey, croppedData);
            
            // Update UI
            if (window._centerPlaylistId === id) {
              const freshPl = getPlaylists().find(p => p.id === id);
              if (freshPl) window.renderCenterPlaylist(freshPl);
            }
            if (typeof window.reloadSidebarPlaylists === 'function') window.reloadSidebarPlaylists();
            if (typeof showToast === 'function') showToast('Cover photo updated!', 'success');
          }
        });
        fileInput.remove();
      };
      reader.readAsDataURL(file);
    });
  };

  window.deletePlaylist = function(id) {
    window._deletePlaylistId = id;
    if (typeof openModal === 'function') openModal('modal-delete-playlist');
  };

  window.removeFromPlaylist = function(plId, trackId) {
    const pls = getPlaylists();
    const pl  = pls.find(p => p.id === plId);
    if (!pl) return;
    pl.tracks = (pl.tracks||[]).filter(t => t.id !== trackId);
    savePlaylists(pls);
    
    // Refresh the center view if it's currently showing this playlist
    if (window._centerPlaylistId === plId) {
      window._centerPlaylistTracks = (pl.tracks || []).slice();
      window._renderCenterTracks(pl);
      const countEl = document.getElementById('pl-center-section-count');
      if (countEl) countEl.textContent = pl.tracks.length + ' songs';
    }
    
    if (window._activePlId === plId) window.viewPlaylist(plId); // Refresh detail
    window.renderPlaylistPanel(); // Refresh list
    if (typeof showToast === 'function') showToast('Song removed from playlist', 'success');
  };

  // ── Tambah track ke playlist ──────────────────────
  window.addTrackToPlaylist = function(plId, track) {
    const pls = getPlaylists();
    const pl  = pls.find(p => p.id === plId);
    if (!pl) return;
    pl.tracks = pl.tracks || [];
    if (pl.tracks.find(t => t.id === track.id)) {
      if (typeof showToast === 'function') showToast('"' + track.title + '" is already in the playlist', 'warning');
      return;
    }
    pl.tracks.push(track);
    savePlaylists(pls);  // ← ini trigger refresh otomatis
    if (typeof showToast === 'function') showToast('Added to "' + pl.name + '"', 'success');
  };

  // ── STATS FOR NERDS Logic ────────────────────────
  window.viewStats = function() {
    window._isStatsMode = true;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const navLink = document.getElementById('nav-stats');
    if (navLink) navLink.classList.add('active');

    const contentArea = document.querySelector('.content-area');
    if (!contentArea) return;

    contentArea.innerHTML = `
      <div class="page-title" id="main-page-title" style="display:flex; align-items:center; gap:16px; margin-bottom: 28px;">
        <div class="stats-tabs-wrapper">
          <span id="tab-stats-general" class="stats-tab-btn active" onclick="window.renderStatsDashboard('general')">Stats For Nerds</span>
          <span id="tab-stats-detailed" class="stats-tab-btn" onclick="window.renderStatsDashboard('detailed')">Stats For Nerds</span>
        </div>
      </div>
      <div id="stats-container" class="stats-container-wrapper"></div>
    `;

    window.renderStatsDashboard('general');
  };

  window.renderStatsDashboard = function(tab = 'general') {
    const container = document.getElementById('stats-container');
    if (!container) return;

    // Update tab active state
    document.querySelectorAll('.stats-tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('tab-stats-' + tab);
    if (activeBtn) activeBtn.classList.add('active');

    const userSuffix = (window.NAMARIE_USER_ID || 'guest');
    const totalTimeKey = 'namarie_total_time_' + userSuffix;
    const historyKey = 'namarie_play_history_' + userSuffix;
    const trackTimeKey = 'namarie_track_time_' + userSuffix;

    const totalSeconds = parseInt(localStorage.getItem(totalTimeKey) || '0');
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    const trackTimes = JSON.parse(localStorage.getItem(trackTimeKey) || '{}');
    const cacheKey = 'namarie_metadata_cache_' + userSuffix;
    const metadataCache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
    const lib = window._library || window._pageTracksData || [];

    const getTrack = (id) => lib.find(t => t.id == id) || metadataCache[id] || {};
    const totalHours = (totalSeconds / 3600).toFixed(1);
    const totalMins  = Math.floor(totalSeconds / 60);

    // Common Footer
    const footerHTML = `
      <div class="stats-footer">
        <button class="btn-premium-back" onclick="window.restoreLibraryView()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Back to Library
        </button>
      </div>
    `;

    if (tab === 'general') {
      // Top Songs
      const songCounts = {};
      history.forEach(h => songCounts[h.id] = (songCounts[h.id] || 0) + 1);
      const topSongs = Object.keys(songCounts)
        .map(id => ({ ...getTrack(id), count: songCounts[id] }))
        .filter(t => t.title)
        .sort((a,b) => b.count - a.count)
        .slice(0, 5);

      // Top Artists
      const artistTimes = {};
      Object.keys(trackTimes).forEach(id => {
        const t = getTrack(id);
        if (t && t.artist) {
          artistTimes[t.artist] = (artistTimes[t.artist] || 0) + trackTimes[id];
        }
      });
      const topArtists = Object.keys(artistTimes)
        .map(name => ({ name, time: artistTimes[name] }))
        .sort((a,b) => b.time - a.time)
        .slice(0, 5);

      // Top Genres
      const genreTimes = {};
      Object.keys(trackTimes).forEach(id => {
        const t = getTrack(id);
        if (t && t.genre) {
          genreTimes[t.genre] = (genreTimes[t.genre] || 0) + trackTimes[id];
        }
      });
      const topGenres = Object.keys(genreTimes)
        .map(name => ({ name, time: genreTimes[name] }))
        .sort((a,b) => b.time - a.time)
        .slice(0, 5);

      // Activity Milestones
      const milestones = [
        { name: 'Music Explorer', icon: '🌍', limit: 100, val: totalSeconds / 60 },
        { name: 'Vibe Master', icon: '🔥', limit: 600, val: totalSeconds / 60 },
        { name: 'Legendary Listener', icon: '👑', limit: 3000, val: totalSeconds / 60 }
      ];

      container.innerHTML = `
        <div class="stats-dashboard">
          <div class="stats-hero">
            <div class="hero-content">
              <div class="hero-label">Your Sound DNA</div>
              <div class="hero-value">${totalHours} <span class="unit">HOURS</span></div>
              <div class="hero-sub">You've spent the equivalent of ${Math.round(totalSeconds / 86400 * 10) / 10} days purely on music.</div>
            </div>
            <div class="hero-badge-wrap">
               <div class="personality-badge">
                  <span class="p-icon">🎧</span>
                  <span class="p-text">${totalHours > 50 ? 'Elite Listener' : (totalHours > 10 ? 'Music Enthusiast' : 'Casual Listener')}</span>
               </div>
            </div>
          </div>

          <div class="stats-main-grid">
              <div class="stat-box">
                <div class="stat-box-header">
                  <h3 class="stat-box-title">🏆 Top Artist Rankings</h3>
                </div>
                <div class="artist-list-premium">
                  ${topArtists.map((a, i) => `
                      <div class="artist-rank-item">
                        <div class="rank-num">#${i+1}</div>
                        <div class="artist-details">
                          <div class="artist-name-row">
                            <span class="a-name">${esc(a.name)}</span>
                            <span class="a-time">${Math.floor(a.time / 60)} min</span>
                          </div>
                          <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${Math.max(5, Math.round((a.time / totalSeconds) * 100) || 0)}%"></div>
                          </div>
                        </div>
                      </div>
                  `).join('') || '<div class="empty-state">No artists tracked yet.</div>'}
                </div>
              </div>

              <div class="stat-box">
                <div class="stat-box-header">
                  <h3 class="stat-box-title">🎸 Music Taste Profile</h3>
                </div>
                <div class="genre-list-premium">
                  ${topGenres.map((g, i) => `
                      <div class="genre-rank-item" style="margin-bottom:12px;">
                        <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px; font-weight:600;">
                          <span>${esc(g.name)}</span>
                          <span style="color:var(--muted)">${Math.floor(g.time / 60)} min</span>
                        </div>
                        <div class="progress-bar-container" style="height:6px; background:rgba(255,255,255,0.05); border-radius:10px; overflow:hidden;">
                          <div class="progress-bar-fill" style="width: ${Math.max(5, Math.round((g.time / totalSeconds) * 100) || 0)}%; background:linear-gradient(90deg, var(--accent), var(--accent2)); border-radius:10px;"></div>
                        </div>
                      </div>
                  `).join('') || '<div class="empty-state">No genre data available.</div>'}
                </div>
              </div>

              <div class="stat-box">
                <div class="stat-box-header">
                  <h3 class="stat-box-title">🎖️ Milestones</h3>
                </div>
                <div class="milestones-grid">
                  ${milestones.map(m => `
                      <div class="milestone-badge ${m.val >= m.limit ? 'active' : ''}">
                        <div class="m-icon">${m.icon}</div>
                        <div class="m-text">${m.name}</div>
                        <div class="m-prog">${m.val >= m.limit ? 'Unlocked' : Math.round((m.val / m.limit) * 100) + '%'}</div>
                      </div>
                  `).join('')}
                </div>
              </div>

              <div class="stat-box">
                <div class="stat-box-header">
                  <h3 class="stat-box-title">🎵 Heaviest Rotation</h3>
                </div>
                <div class="top-tracks-list">
                  ${topSongs.map((t, i) => `
                    <div class="track-stat-row">
                      <div class="t-rank">${i+1}</div>
                      <div class="t-thumb-wrap">
                         <img src="${t.cover_url}" class="t-thumb" onerror="this.src='/img/default-cover.png'">
                      </div>
                      <div class="t-info">
                        <div class="t-title">${esc(t.title)}</div>
                        <div class="t-artist">${esc(t.artist)}</div>
                      </div>
                      <div class="t-count">${t.count} <span class="t-unit">plays</span></div>
                    </div>
                  `).join('') || '<div class="empty-state">History is empty.</div>'}
                </div>
              </div>
          </div>
          ${footerHTML}
        </div>
      `;
    } else {
      // DETAILED TAB
      const timeStats = { morning: 0, afternoon: 0, evening: 0, night: 0 };
      history.forEach(h => {
        const hour = new Date(h.ts).getHours();
        if (hour >= 6 && hour < 12) timeStats.morning++;
        else if (hour >= 12 && hour < 18) timeStats.afternoon++;
        else if (hour >= 18 && hour < 24) timeStats.evening++;
        else timeStats.night++;
      });
      const maxTime = Math.max(1, timeStats.morning, timeStats.afternoon, timeStats.evening, timeStats.night);

      container.innerHTML = `
        <div class="stats-dashboard">
          <div class="stats-main-grid">
            <div class="stats-col">
              <div class="stat-box">
                <div class="stat-box-header">
                  <h3 class="stat-box-title">⏰ Listening Routine</h3>
                  <div class="stat-box-meta">Based on your last 500 plays</div>
                </div>
                <div class="routine-list" style="display:flex; flex-direction:column; gap:14px;">
                  ${[
                    { label: 'Morning', icon: '🌅', val: timeStats.morning, color: '#fbbf24' },
                    { label: 'Afternoon', icon: '☀️', val: timeStats.afternoon, color: '#f87171' },
                    { label: 'Evening', icon: '🌆', val: timeStats.evening, color: '#818cf8' },
                    { label: 'Night', icon: '🌙', val: timeStats.night, color: '#60a5fa' }
                  ].map(r => `
                    <div class="routine-item" style="display:flex; align-items:center; gap:12px;">
                      <div style="font-size:18px;">${r.icon}</div>
                      <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px; font-weight:600;">
                          <span>${r.label}</span>
                          <span style="color:var(--muted)">${r.val} plays</span>
                        </div>
                        <div class="progress-bar-container" style="height:4px; background:rgba(255,255,255,0.05);">
                          <div class="progress-bar-fill" style="width:${Math.round((r.val / maxTime) * 100)}%; background:${r.color};"></div>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="stats-col">
              <div class="stat-box">
                 <div class="stat-box-header">
                    <h3 class="stat-box-title">📊 Activity Insight</h3>
                 </div>
                 <div class="activity-heatmap">
                    <div class="heatmap-grid">
                      ${(() => {
                        const dailyKey = 'namarie_daily_stats_' + userSuffix;
                        const stats = JSON.parse(localStorage.getItem(dailyKey) || '{}');
                        const dots = [];
                        const now = new Date();
                        for (let i = 27; i >= 0; i--) {
                          const d = new Date();
                          d.setDate(now.getDate() - i);
                          const dateStr = d.toISOString().split('T')[0];
                          const secs = stats[dateStr] || 0;
                          const level = secs > 3600 ? 3 : (secs > 1800 ? 2 : (secs > 0 ? 1 : 0));
                          dots.push(`<div class="heat-dot lvl-${level}" title="${dateStr}: ${Math.floor(secs/60)}m"></div>`);
                        }
                        return dots.join('');
                      })()}
                    </div>
                    <div class="heatmap-legend">
                      <span>Quiet</span>
                      <div class="heat-dot lvl-1" style="width:8px;height:8px"></div>
                      <div class="heat-dot lvl-2" style="width:8px;height:8px"></div>
                      <div class="heat-dot lvl-3" style="width:8px;height:8px"></div>
                      <span>Vibrant</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>
          ${footerHTML}
        </div>
      `;
    }
  };

  // ── Buat playlist ─────────────────────────────────
  window.createPlaylist = function(name) {
    if (!name) return;
    const pls = getPlaylists();
    pls.push({ id: Date.now(), name, tracks: [] });
    savePlaylists(pls);
    if (typeof showToast === 'function') showToast('Playlist "' + name + '" created!', 'success');
  };

  window.playPlaylist = function(id) {
    const pls = getPlaylists();
    const pl = pls.find(p => p.id === id);
    if (!pl || !pl.tracks || !pl.tracks.length) {
      if (typeof showToast === 'function') showToast('Playlist is empty', 'warning');
      return;
    }

    if (window._currentlyPlayingPlaylistId === id && typeof audio !== 'undefined') {
      if (audio.paused) audio.play();
      else audio.pause();
      return;
    }

    if (typeof setPlaylist === 'function') {
      window._currentlyPlayingPlaylistId = id;
      setPlaylist(pl.tracks, true);
      if (typeof playTrack === 'function') playTrack(0);
      if (typeof showToast === 'function') showToast('Playing playlist: ' + pl.name, 'success');
    }
  };

  // ── Quick add + picker ────────────────────────────
  window.quickAddToPlaylist = function(trackId) {
    // Cari track dari library berdasarkan ID
    const lib   = window._library || [];
    const track = lib.find(t => t.id === trackId);
    if (!track) {
      if (typeof showToast === 'function') showToast('Track not found', 'error');
      return;
    }
    const pls = getPlaylists();
    if (!pls.length)      { openModal('modal-overlay'); return; }
    if (pls.length === 1) { window.addTrackToPlaylist(pls[0].id, track); return; }
    showPickerDropdown(trackId, track);
  };

  function showPickerDropdown(trackId, track) {
    closePicker();
    const pls = getPlaylists();
    const btn = document.querySelector('.add-to-pl-btn[data-id="' + trackId + '"]');
    const rect = btn ? btn.getBoundingClientRect() : { left: 400, bottom: 200 };

    const picker = document.createElement('div');
    picker.id    = 'pl-picker-dropdown';
    picker.className = 'pl-picker';
    picker.style.top  = (rect.bottom + window.scrollY + 6) + 'px';
    picker.style.left = Math.max(8, rect.left - 160) + 'px';

    picker.innerHTML =
      '<div class="pl-picker-header">Add to Playlist</div>' +
      pls.map(pl =>
        '<div class="pl-picker-item" onclick="window._pickPlaylist(' + pl.id + ')">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' +
        '<span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(pl.name) + '</span>' +
        '<span class="pl-count">' + (pl.tracks||[]).length + '</span>' +
        '</div>'
      ).join('') +
      '<div class="pl-picker-new" onclick="closePicker();openModal(\'modal-overlay\')">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
      'New Playlist</div>';

    document.body.appendChild(picker);
    window._pickerTrack = track;
    window._pickPlaylist = function(plId) {
      window.addTrackToPlaylist(plId, window._pickerTrack);
      closePicker();
    };
    setTimeout(() => document.addEventListener('click', closePicker, { once: true }), 50);
  }

  function closePicker() {
    const p = document.getElementById('pl-picker-dropdown');
    if (p) p.remove();
  }
  window.closePicker = closePicker;

  // Back button right panel
  const backBtn = document.getElementById('right-panel-back');
  if (backBtn && !backBtn.dataset.bound) {
    backBtn.dataset.bound = '1';
    backBtn.addEventListener('click', () => {
      if (typeof tracks !== 'undefined' && typeof setPlaylist === 'function') setPlaylist(tracks);
      window.renderPlaylistPanel();
    });
  }

  // Btn buat playlist (right panel bawah)
  const btnNew = document.getElementById('btn-new-playlist');
  if (btnNew && !btnNew.dataset.bound) {
    btnNew.dataset.bound = '1';
    btnNew.addEventListener('click', () => openModal('modal-overlay'));
  }

  // Form buat playlist
  const plForm = document.getElementById('playlist-form');
  if (plForm && !plForm.dataset.bound) {
    plForm.dataset.bound = '1';
    plForm.addEventListener('submit', e => {
      e.preventDefault();
      const nameEl = document.getElementById('pl-name');
      const name   = nameEl ? nameEl.value.trim() : '';
      if (!name) return;
      window.createPlaylist(name);
      closeModal('modal-overlay');
      if (nameEl) nameEl.value = '';
    });
  }

  // Form rename playlist
  const renamePlForm = document.getElementById('rename-playlist-form');
  if (renamePlForm && !renamePlForm.dataset.bound) {
    renamePlForm.dataset.bound = '1';

    // Tutup modal jika tekan ESC di input
    const renameInput = document.getElementById('rename-playlist-input');
    if (renameInput) {
      renameInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal('modal-rename-playlist');
      });
    }

    renamePlForm.addEventListener('submit', e => {
      e.preventDefault();
      const input = document.getElementById('rename-playlist-input');
      const newName = input ? input.value.trim() : '';
      const id = window._renamePlaylistId;
      if (!newName || !id) return;

      const pls = getPlaylists();
      const pl = pls.find(p => p.id === id);
      if (pl && pl.name !== newName) {
        pl.name = newName;
        savePlaylists(pls);

        // Update UI jika sedang view playlist ini
        const nameEl = document.getElementById('pl-center-name');
        if (nameEl && window._centerPlaylistId === id) {
          nameEl.textContent = newName;
        }
        const rightPanelTitle = document.getElementById('right-panel-title');
        if (rightPanelTitle && window._activePlId === id) {
          rightPanelTitle.textContent = newName;
        }
        
        if (typeof showToast === 'function') showToast('Playlist renamed!', 'success');
      }
      closeModal('modal-rename-playlist');
    });
  }

  // Init render
  window.renderPlaylistPanel();

  window.viewAllPlaylists = function() {
    const mainArea = document.querySelector('.content-area');
    if (!mainArea) return;

    // Show header if hidden (will be redeclared below)
    const sHeader = document.querySelector('.page-header-sticky');
    if (sHeader) sHeader.style.display = 'flex';

    // Reset center state
    window._centerPlaylistId = null;
    const pls = getPlaylists();

    // Ensure we have the basic page structure
    const isProfile = mainArea.querySelector('.profile-grid');
    const hasHeader = mainArea.querySelector('.page-header-sticky');
    const hasCard   = mainArea.querySelector('.card');

    if (isProfile || !hasHeader || !hasCard) {
      mainArea.innerHTML = `
        <div class="page-header-sticky"></div>
        <div class="card"></div>
      `;
    }

    const stickyHeader = mainArea.querySelector('.page-header-sticky');
    const card = mainArea.querySelector('.card');

    // Update Sticky Header Content with Flex Row (Title Left, Button Right)
    stickyHeader.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:0 20px;width:100%">
        <div style="display:flex; flex-direction:column;">
          <div class="page-title" style="margin:0 !important; height:auto; line-height:1.2;" id="main-page-title">My Playlists</div>
          <div class="section-title" id="main-page-track-count" style="font-size:13px; color:var(--muted2); font-weight:500; margin-top:2px;">${pls.length} playlists</div>
        </div>
        <button class="btn-new-pl-header" onclick="openModal('modal-overlay')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          <span>New Playlist</span>
        </button>
      </div>
    `;

    // Sidebar active state management
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const plNavLink = document.getElementById('nav-view-all-playlists');
    if (plNavLink) plNavLink.classList.add('active');

    window._isStatsMode = false;
    const headerSearch = document.querySelector('.search-input-wrapper');
    const headerSort   = document.querySelector('.sort-wrap');
    if (headerSearch) headerSearch.style.setProperty('display', 'none', 'important');
    if (headerSort)   headerSort.style.setProperty('display', 'none', 'important');

    if (!pls.length) {
      card.innerHTML = 
        '<div style="text-align:center;padding:80px;color:var(--muted)">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:48px;height:48px;opacity:.3;margin-bottom:16px"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' +
          '<p style="font-size:15px;font-weight:500;color:var(--text)">No playlists yet</p>' +
          '<p style="font-size:13px;margin-top:4px">Create your first playlist to see it here.</p>' +
          '<button class="btn btn-primary" onclick="openModal(\'modal-overlay\')" style="margin-top:20px;padding:10px 24px">Create Playlist</button>' +
        '</div>';
      return;
    }

    card.innerHTML = 
      '<div class="playlist-grid-all">' +
        pls.map(pl => {
          const coverKey = getPLKey() + '_cover_' + pl.id;
          const coverData = localStorage.getItem(coverKey) || '';
          return `
            <div class="pl-card" onclick="window.viewPlaylist(${pl.id})">
              <div class="pl-card-cover">
                ${coverData ? `<img src="${coverData}" alt="cover">` : `<svg viewBox="0 0 24 24" fill="currentColor" style="width:48px;height:48px;opacity:0.3;color:var(--accent)"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`}
                <div class="pl-card-play-overlay" data-pl-id="${pl.id}" onclick="event.stopPropagation(); window.playPlaylist(${pl.id})">
                  <svg class="pl-card-play-icon-svg" viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px">
                    ${(window._currentlyPlayingPlaylistId === pl.id && typeof audio !== 'undefined' && !audio.paused) 
                      ? '<rect x="6" y="6" width="12" height="12" rx="2"/>' 
                      : '<path d="M8 5v14l11-7z"/>'}
                  </svg>
                </div>
              </div>
              <div class="pl-card-name">${esc(pl.name)}</div>
              <div class="pl-card-meta">${(pl.tracks||[]).length} songs</div>
            </div>
          `;
        }).join('') +
      '</div>';
  };

  // Bind konfirmasi hapus playlist
  const confirmDeletePlBtn = document.getElementById('confirm-delete-playlist-btn');
  if (confirmDeletePlBtn && !confirmDeletePlBtn.dataset.bound) {
    confirmDeletePlBtn.dataset.bound = '1';
    confirmDeletePlBtn.addEventListener('click', () => {
      const id = window._deletePlaylistId;
      if (!id) return;
      savePlaylists(getPlaylists().filter(p => p.id !== id));
      if (typeof showToast === 'function') showToast('Playlist deleted', 'success');
      closeModal('modal-delete-playlist');
    });
  }

})(); // End initPlaylistManager — dijalankan SEKALI


// ══════════════════════════════════════════════════════════════
//  MUSIC PAGE INIT  (dijalankan setiap halaman musik di-load)
// ══════════════════════════════════════════════════════════════

function initMusicPage() {
  window._centerPlaylistId = null; // Reset whenever a fresh page init runs

  // ── Set playlist ke player ────────────────────────
  // Gunakan window._pageTracksData yang di-set dari blade inline script
  const tracks = window._pageTracksData || [];
  if (tracks.length && typeof window.setPlaylist === 'function') {
    window._library = tracks.slice();
    window.setPlaylist(tracks);
    
    // Cache metadata for Stats dashboard
    const userSuffix = (window.NAMARIE_USER_ID || 'guest');
    const cacheKey = 'namarie_metadata_cache_' + userSuffix;
    let cache = JSON.parse(localStorage.getItem(cacheKey) || '{}');
    tracks.forEach(t => cache[t.id] = t);
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  }

  // Save the original library DOM (.card) so we can restore it when returning from playlist view
  const card = document.querySelector('.card');
  if (card) {
    window._libraryCardHTML         = card.innerHTML;
    window._libraryPageTitleText    = (document.getElementById('main-page-title') || {}).textContent || 'Music Library';
  }

  // If we navigated here from another page to open a specific playlist, open it now
  if (window._pendingPlaylistId) {
    const pendingId = window._pendingPlaylistId;
    window._pendingPlaylistId = null;
    setTimeout(() => { if (typeof window.viewPlaylist === 'function') window.viewPlaylist(pendingId); }, 50);
  }

  // Expose restore function so player.js can call it
  window.restoreLibraryView = function() {
    window._isStatsMode = false;
    if (typeof window.ajaxNavigate === 'function') {
      window.ajaxNavigate('/');
    } else {
      location.href = '/';
    }
  };

  // ── Bind klik baris musik (play) ──────────────────
  document.querySelectorAll('.music-row .music-info-click').forEach(area => {
    area.addEventListener('click', () => {
      const row = area.closest('.music-row');
      if (row) {
        if (typeof setPlaylist === 'function' && window._library) {
          setPlaylist(window._library, true);
        }
        if (typeof window.playTrackById === 'function') {
          window.playTrackById(parseInt(row.dataset.id));
        } else {
          playTrack(+row.dataset.idx);
        }
      }
    });
  });

  // ── Filter Liked & Search ─────────────────────────
  const isLikedFilter = new URLSearchParams(window.location.search).get('filter') === 'liked';
  const pageTitle = document.querySelector('.page-title');
  if (isLikedFilter && pageTitle && pageTitle.textContent.trim() === 'Music Library') {
    pageTitle.textContent = 'Liked Music';
  }

  function applyFilters() {
    const q = (document.getElementById('music-search')?.value || '').toLowerCase().trim();
    const likedKey = 'sn_liked_' + (window.NAMARIE_USER_ID || 'guest');
    const likedIds = JSON.parse(localStorage.getItem(likedKey) || '[]');
    let found = 0;

    document.querySelectorAll('.music-row').forEach(row => {
      const id = parseInt(row.dataset.id);
      
      // Check liked filter
      if (isLikedFilter && !likedIds.includes(id)) {
        row.style.display = 'none';
        return;
      }

      // Check search query
      const match = !q || (row.dataset.title||'').toLowerCase().includes(q);
      row.style.display = match ? '' : 'none';
      
      if (match) {
        found++;
        // Update visual numbering (1, 2, 3...) based on current filtered view
        const numEl = row.querySelector('.music-num');
        if (numEl) numEl.textContent = found;
      }
    });

    // Update song count display (Prefer ID but fallback to class)
    const countEl = document.getElementById('main-page-track-count') || document.querySelector('.section-title');
    if (countEl) {
      countEl.textContent = found + ' songs';
    }

    const noRes = document.getElementById('no-results');
    if (noRes) {
      if (!found) {
        noRes.style.display = 'block';
        noRes.textContent = (isLikedFilter && !q) ? 'No liked music yet.' : 'No songs found.';
      } else {
        noRes.style.display = 'none';
      }
    }

    // Update player playlist if only filtering (not searching)
    if (!q && typeof window.setPlaylist === 'function') {
      if (!window._centerPlaylistId) {
        let filteredTracks = window._pageTracksData || [];
        if (isLikedFilter) {
          filteredTracks = filteredTracks.filter(t => likedIds.includes(t.id));
        }
        window._library = filteredTracks.slice();
        window.setPlaylist(filteredTracks);
      }
    }
  }

  // Init filter on load
  applyFilters();

  const searchInput = document.getElementById('music-search');
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  // ── Sort ──────────────────────────────────────────
  (function() {
    const sortBtn      = document.getElementById('sort-btn');
    const sortDropdown = document.getElementById('sort-dropdown');
    const sortLabel    = document.getElementById('sort-label');
    const sortDirIcon  = document.getElementById('sort-dir-icon');
    const trackList    = document.getElementById('track-list');
    if (!sortBtn || !sortDropdown || !trackList) return;

    // Guard: hapus listener lama sebelum pasang baru
    const newSortBtn = sortBtn.cloneNode(true);
    sortBtn.parentNode.replaceChild(newSortBtn, sortBtn);
    const freshBtn = document.getElementById('sort-btn');

    const sortNames = {
      newest: 'Date Added (Newest)', oldest: 'Date Added (Oldest)',
      az: 'Name A → Z', za: 'Name Z → A',
      'duration-asc': 'Duration (Shortest)', 'duration-desc': 'Duration (Longest)'
    };

    function openDropdown() {
      const rect = freshBtn.getBoundingClientRect();
      sortDropdown.style.top     = (rect.bottom + 6) + 'px';
      sortDropdown.style.right   = (window.innerWidth - rect.right) + 'px';
      sortDropdown.style.left    = 'auto';
      sortDropdown.style.display = 'block';
      freshBtn.classList.add('active');
    }
    function closeDropdown() {
      sortDropdown.style.display = 'none';
      freshBtn.classList.remove('active');
    }
    function isOpen() { return sortDropdown.style.display === 'block'; }

    freshBtn.addEventListener('click', e => {
      e.stopPropagation();
      isOpen() ? closeDropdown() : openDropdown();
    });

    // Satu listener mousedown di document — pakai key agar tidak double
    if (!window._sortMousedownBound) {
      window._sortMousedownBound = true;
      document.addEventListener('mousedown', e => {
        const sb = document.getElementById('sort-btn');
        const sd = document.getElementById('sort-dropdown');
        if (sd && sd.style.display === 'block') {
          if (sb && !sb.contains(e.target) && !sd.contains(e.target)) {
            sd.style.display = 'none';
            if (sb) sb.classList.remove('active');
          }
        }
      });
    }

    // Clone sort options agar tidak ada listener lama
    sortDropdown.querySelectorAll('.sort-option').forEach(opt => {
      const fresh = opt.cloneNode(true);
      opt.parentNode.replaceChild(fresh, opt);
    });
    sortDropdown.querySelectorAll('.sort-option').forEach(opt => {
      opt.addEventListener('click', e => {
        e.stopPropagation();
        const sortBy = opt.dataset.sort;
        localStorage.setItem('namarie_main_sort_' + (window.NAMARIE_USER_ID || 'guest'), sortBy);
        sortDropdown.querySelectorAll('.sort-option').forEach(b => b.classList.remove('active'));
        opt.classList.add('active');
        const lb = document.getElementById('sort-label');
        const di = document.getElementById('sort-dir-icon');
        if (lb) lb.textContent = sortNames[sortBy] || 'Sort';
        if (di) di.classList.toggle('desc', ['za','duration-desc','oldest'].includes(sortBy));
        doSort(sortBy);
        closeDropdown();
      });
    });

    function doSort(sortBy) {
      const rows = Array.from(trackList.querySelectorAll('.music-row'));
      if (!rows.length) return;

      // Simpan data-idx asli sebelum sort agar newest/oldest bisa pakai
      rows.forEach((r, i) => { if (!r.dataset.origIdx) r.dataset.origIdx = r.dataset.idx || i; });

      rows.sort((a, b) => {
        const tA  = (a.querySelector('.music-title') || a.querySelector('.music-name'))?.textContent.trim().toLowerCase() || '';
        const tB  = (b.querySelector('.music-title') || b.querySelector('.music-name'))?.textContent.trim().toLowerCase() || '';
        const oiA = parseInt(a.dataset.origIdx) || 0;
        const oiB = parseInt(b.dataset.origIdx) || 0;

        function dur(row) {
          const el = row.querySelector('.music-dur');
          if (!el) return 0;
          const p  = el.textContent.trim().split(':');
          return (parseInt(p[0]) || 0) * 60 + (parseInt(p[1]) || 0);
        }

        switch (sortBy) {
          case 'newest':        return oiB - oiA;  // index besar = lama diupload (list server sudah desc)
          case 'oldest':        return oiA - oiB;
          case 'az':            return tA.localeCompare(tB, 'id');
          case 'za':            return tB.localeCompare(tA, 'id');
          case 'duration-asc':  return dur(a) - dur(b);
          case 'duration-desc': return dur(b) - dur(a);
          default:              return 0;
        }
      });

      // Re-render ke DOM
      rows.forEach((row) => {
        trackList.appendChild(row);
      });

      // Re-apply filters and update visual numbering (1, 2, 3...)
      if (typeof applyFilters === 'function') {
        applyFilters();
      }

      // Sync playlist ke player sesuai urutan baru
      const lib = window._library || [];
      if (lib.length && typeof setPlaylist === 'function') {
        const sorted = rows.map(r => lib.find(t => t.id === parseInt(r.dataset.id))).filter(Boolean);
        setPlaylist(sorted);
      }
    }

    // Apply saved sort on load
    const savedSort = localStorage.getItem('namarie_main_sort_' + (window.NAMARIE_USER_ID || 'guest'));
    if (savedSort && sortNames[savedSort]) {
      const opt = Array.from(sortDropdown.querySelectorAll('.sort-option')).find(o => o.dataset.sort === savedSort);
      if (opt) {
        sortDropdown.querySelectorAll('.sort-option').forEach(b => b.classList.remove('active'));
        opt.classList.add('active');
      }
      
      // Re-acquire fresh references because we cloned sortBtn earlier
      const freshLabel = document.getElementById('sort-label');
      const freshIcon  = document.getElementById('sort-dir-icon');
      if (freshLabel) freshLabel.textContent = sortNames[savedSort];
      if (freshIcon)  freshIcon.classList.toggle('desc', ['za','duration-desc','oldest'].includes(savedSort));
      
      doSort(savedSort);
    }
  })();

  // ── Like ──────────────────────────────────────────
  window.toggleLike = function(id) {
    // Panggil _toggleLike (internal player.js) langsung, bukan lewat toggleLikeTrack
    // untuk menghindari infinite loop
    if (typeof _toggleLike === 'function') {
      _toggleLike(id);
    } else if (typeof window.toggleLikeTrack === 'function') {
      window.toggleLikeTrack(id);
    }

    if (typeof applyFilters === 'function') {
      applyFilters();
    }
  };

  // ── Queue ─────────────────────────────────────────
  window.queueTrack = function(trackId) {
    if (typeof window.queueTrack_player === 'function') window.queueTrack_player(trackId);
  };

  // ── Metadata Editor & Upload ───────────────────────
  window.handleMusicSelect = function(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    window._pendingMusicFile = file; // Store file globally for submission
    const fileName = file.name.split('.').slice(0, -1).join('.');
    
    // Open modal in UPLOAD mode
    const overlay = document.getElementById('modal-metadata-editor-overlay');
    const title   = document.getElementById('meta-editor-title');
    const fTitle  = document.getElementById('meta-title');
    const fArtist = document.getElementById('meta-artist');
    const fAlbum  = document.getElementById('meta-album');
    const fGenre  = document.getElementById('meta-genre');
    const fTrackId= document.getElementById('meta-track-id');
    const fFileSec= document.getElementById('upload-file-section');
    const fFileInfo= document.getElementById('selected-file-info');
    const fCoverPreview = document.getElementById('meta-cover-preview');
    const fCoverPlaceholder = document.getElementById('meta-cover-placeholder');
    const fProgress = document.getElementById('upload-progress-container');
    const fProgressBar = document.getElementById('upload-progress-bar');
    const fProgressPct = document.getElementById('upload-progress-percent');
    const fSaveBtn = document.getElementById('meta-save-btn');
    const fCancelBtn = document.getElementById('meta-cancel-btn');

    if (!overlay) return;

    title.textContent = 'Upload Music Details';
    fTitle.value  = fileName;
    fArtist.value = '';
    fAlbum.value  = '';
    fGenre.value  = '';
    fTrackId.value = ''; // Empty means UPLOAD
    fFileSec.style.display = 'block';
    fFileInfo.textContent = `Selected: ${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`;
    fCoverPreview.style.display = 'none';
    fCoverPlaceholder.style.display = 'flex';
    fProgress.style.display = 'none';
    fProgressBar.style.width = '0%';
    fProgressPct.textContent = '0%';
    fSaveBtn.disabled = false;
    fSaveBtn.textContent = 'Upload Now';
    fCancelBtn.style.display = 'block';

    overlay.classList.add('open');
  };

  window.openMetadataEditor = function(id) {
    const track = (window._library || []).find(t => t.id === id);
    if (!track) return;

    const overlay = document.getElementById('modal-metadata-editor-overlay');
    const title   = document.getElementById('meta-editor-title');
    const fTitle  = document.getElementById('meta-title');
    const fArtist = document.getElementById('meta-artist');
    const fAlbum  = document.getElementById('meta-album');
    const fGenre  = document.getElementById('meta-genre');
    const fTrackId= document.getElementById('meta-track-id');
    const fFileSec= document.getElementById('upload-file-section');
    const fCoverPreview = document.getElementById('meta-cover-preview');
    const fCoverPlaceholder = document.getElementById('meta-cover-placeholder');
    const fProgress = document.getElementById('upload-progress-container');
    const fSaveBtn = document.getElementById('meta-save-btn');
    const fCancelBtn = document.getElementById('meta-cancel-btn');

    if (!overlay) return;

    title.textContent = 'Edit Song Metadata';
    fTitle.value  = track.title || '';
    fArtist.value = track.artist || '';
    fAlbum.value  = track.album || '';
    fGenre.value  = track.genre || '';
    fTrackId.value = id; // Has ID means EDIT
    fFileSec.style.display = 'none';
    fProgress.style.display = 'none';
    fSaveBtn.disabled = false;
    fSaveBtn.textContent = 'Save Changes';
    fCancelBtn.style.display = 'block';

    if (track.cover_url && !track.cover_url.includes('default-cover.png')) {
      fCoverPreview.src = track.cover_url;
      fCoverPreview.style.display = 'block';
      fCoverPlaceholder.style.display = 'none';
    } else {
      fCoverPreview.style.display = 'none';
      fCoverPlaceholder.style.display = 'flex';
    }

    overlay.classList.add('open');
  };

  // Handle Cover Preview
  const metaCoverInput = document.getElementById('meta-cover-input');
  if (metaCoverInput) {
    metaCoverInput.onchange = function() {
      if (this.files && this.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
          const preview = document.getElementById('meta-cover-preview');
          const placeholder = document.getElementById('meta-cover-placeholder');
          preview.src = e.target.result;
          preview.style.display = 'block';
          placeholder.style.display = 'none';
        };
        reader.readAsDataURL(this.files[0]);
      }
    };
  }

  // Handle Metadata Form Submit (Upload or Edit)
  const metaForm = document.getElementById('metadata-editor-form');
  if (metaForm) {
    metaForm.onsubmit = async function(e) {
      e.preventDefault();
      const trackId = document.getElementById('meta-track-id').value;
      const isEdit  = !!trackId;
      const formData = new FormData(this);
      
      if (!isEdit) {
        if (window._pendingMusicFile) {
          formData.append('file', window._pendingMusicFile);
        } else {
          // Fallback check input directly if variable is missing
          const fileInput = document.getElementById('file-input-sidebar');
          if (fileInput && fileInput.files[0]) {
            formData.append('file', fileInput.files[0]);
          } else {
            alert('Please select a music file first.');
            return;
          }
        }
      }

      const saveBtn = document.getElementById('meta-save-btn');
      const cancelBtn = document.getElementById('meta-cancel-btn');
      const progressWrap = document.getElementById('upload-progress-container');
      const progressBar = document.getElementById('upload-progress-bar');
      const progressPct = document.getElementById('upload-progress-percent');

      saveBtn.disabled = true;
      saveBtn.textContent = isEdit ? 'Saving...' : 'Uploading...';
      cancelBtn.style.display = 'none';
      if (!isEdit) progressWrap.style.display = 'block';

      try {
        const url = isEdit ? `/music/${trackId}/update` : '/music/upload';
        const csrf = document.querySelector('meta[name=csrf-token]').content;

        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        if (isEdit) formData.append('_method', 'PATCH');
        xhr.setRequestHeader('X-CSRF-TOKEN', csrf);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Accept', 'application/json');

        xhr.upload.onprogress = e => {
          if (e.lengthComputable && !isEdit) {
            const pct = Math.round((e.loaded / e.total) * 100);
            progressBar.style.width = pct + '%';
            progressPct.textContent = pct + '%';
          }
        };

        xhr.onload = function() {
          try {
            const res = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300 && res.success) {
              if (typeof showToast === 'function') showToast(isEdit ? 'Metadata updated!' : 'Music uploaded!', 'success');
              setTimeout(() => window.location.reload(), 1000);
            } else {
              throw new Error(res.message || 'Error occurred');
            }
          } catch(e) {
            if (typeof showToast === 'function') showToast('Error: ' + e.message, 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = isEdit ? 'Save Changes' : 'Upload Now';
            cancelBtn.style.display = 'block';
          }
        };

        xhr.onerror = () => { 
           if (typeof showToast === 'function') showToast('Network error', 'error');
           saveBtn.disabled = false;
           saveBtn.textContent = isEdit ? 'Save Changes' : 'Upload Now';
           cancelBtn.style.display = 'block';
        };
        xhr.send(formData);

      } catch (err) {
        if (typeof showToast === 'function') showToast('Error: ' + err.message, 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = isEdit ? 'Save Changes' : 'Upload Now';
        cancelBtn.style.display = 'block';
      }
    };
  }

  // ── Hapus ─────────────────────────────────────────
  window.confirmDelete = function(id) { window._deleteTargetId = id; openModal('modal-delete'); };
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  if (confirmDeleteBtn && !confirmDeleteBtn.dataset.bound) {
    confirmDeleteBtn.dataset.bound = '1';
    confirmDeleteBtn.addEventListener('click', () => {
      if (!window._deleteTargetId) return;
      
      // Clean up deleted track from all custom playlists in localStorage
      const plKey = 'namarie_playlists_' + (window.NAMARIE_USER_ID || 'guest');
      let pls = JSON.parse(localStorage.getItem(plKey) || '[]');
      let changed = false;
      pls.forEach(pl => {
        const oldLen = (pl.tracks || []).length;
        pl.tracks = (pl.tracks || []).filter(t => t.id !== window._deleteTargetId);
        if (pl.tracks.length !== oldLen) changed = true;
      });
      if (changed) {
        localStorage.setItem(plKey, JSON.stringify(pls));
      }

      const form = document.getElementById('delete-form-' + window._deleteTargetId);
      if (form) form.submit();
    });
  }

  // ── Profile Global Logic ──
  window.toggleSection = function(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const content = el.querySelector('.accordion-content');
    const isActive = el.classList.contains('active');
    
    // Close others
    document.querySelectorAll('.accordion-item').forEach(item => {
      item.classList.remove('active');
      const c = item.querySelector('.accordion-content');
      if (c) c.style.display = 'none';
    });

    if (!isActive) {
      el.classList.add('active');
      if (content) content.style.display = 'block';
    }
  };

  window.closeCropModal = function() {
    const modal = document.getElementById('cropper-modal');
    const input = document.getElementById('avatar-input');
    if (modal) modal.classList.remove('active');
    if (input) input.value = '';
    if (window._profileCropper) {
      window._profileCropper.destroy();
      window._profileCropper = null;
    }
  };

}

// ── Runner ────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicPage);
} else {
  initMusicPage();
}

/* ── Smart Marquee Detection Logic ── */
window.initMarquee = function() {
  const titles = document.querySelectorAll(".music-title, #now-playing-title, .pl-track-title, .queue-title");
  titles.forEach(el => {
    // Reset state first
    el.classList.remove("animate-marquee");
    el.style.transform = "none";
    el.style.animationDuration = "";
    
    // Check if content overflows its container
    if (!el.parentElement.classList.contains("marquee-container")) {
      const wrapper = document.createElement("div");
      wrapper.className = "marquee-container";
      el.parentNode.insertBefore(wrapper, el);
      wrapper.appendChild(el);
    }
    
    el.classList.add("marquee-text");
    
    // Use a small timeout to ensure layout is calculated
    setTimeout(() => {
      const containerWidth = el.parentElement.offsetWidth;
      const textWidth = el.scrollWidth;
      
      if (textWidth > containerWidth) {
        el.classList.add("animate-marquee");
        el.setAttribute("data-text", el.textContent);
        
        // Kecepatan standar: 20px per detik saat di-hover
        const duration = textWidth / 20; 
        el.style.animationDuration = duration + "s";
      }
    }, 100);
  });
};

// Re-run whenever content updates
document.addEventListener("DOMContentLoaded", window.initMarquee);

// Observe AJAX content changes (SPA Navigation)
const marqueeObserver = new MutationObserver((mutations) => {
  let shouldUpdate = false;
  mutations.forEach(m => {
    if (m.type === 'childList' || m.type === 'characterData') shouldUpdate = true;
  });
  if (shouldUpdate) window.initMarquee();
});

const appShell = document.querySelector(".app-shell");
if (appShell) {
  marqueeObserver.observe(appShell, { childList: true, subtree: true });
}