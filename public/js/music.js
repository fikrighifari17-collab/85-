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
    window.refreshRightPanel();
  }
  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  // ── Render right panel ──────────────────────────────
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

    // Only render center playlist if we're on the music library page
    // (#main-page-title is unique to the music index page)
    const onMusicPage = !!document.getElementById('main-page-title');
    if (onMusicPage) {
      if (typeof window.renderCenterPlaylist === 'function') {
        window.renderCenterPlaylist(pl);
      }
    } else {
      // Navigate to music page first, then open playlist after navigation
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

    window.playPlaylistTrack = function(plId, trackId) {
       if (typeof setPlaylist === 'function' && window._currentViewedPlaylistTracks) {
         setPlaylist(window._currentViewedPlaylistTracks);
       }
       if (typeof playTrackById === 'function') {
         playTrackById(trackId);
       }
    };

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

  window.renderCenterPlaylist = function(pl) {
    // Guard: only operate on the music library page
    if (!document.getElementById('main-page-title')) return;

    window._centerPlaylistId = pl.id;

    // Update page title
    const titleEl = document.getElementById('main-page-title');
    if (titleEl) titleEl.textContent = pl.name;

    // Cover image
    const coverKey  = getPLKey() + '_cover_' + pl.id;
    const coverData = localStorage.getItem(coverKey) || '';

    const savedSort = localStorage.getItem('namarie_pl_sort_center_' + pl.id) || 'default';

    // Build the full center content, injected into the .card
    const card = document.querySelector('.card');
    if (!card) return;

    card.innerHTML =
      // ── Playlist Header ──
      '<div class="pl-center-header">' +
        // Row 1: cover + info + delete
        '<div style="display:flex;gap:16px;align-items:flex-start;margin-bottom:16px">' +
          // Cover
          '<div class="pl-cover-wrap" onclick="window.changeCover(' + pl.id + ')" title="Change cover photo" style="width:72px;height:72px;flex-shrink:0">' +
            (coverData
              ? '<img src="' + coverData + '" alt="cover" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">'
              : '<svg viewBox="0 0 24 24" fill="currentColor" style="width:36px;height:36px;opacity:.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>') +
            '<div class="pl-cover-overlay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg></div>' +
          '</div>' +
          // Info
          '<div style="flex:1;min-width:0">' +
            '<div class="pl-name-row">' +
              '<div class="pl-name-display" id="pl-center-name">' + esc(pl.name) + '</div>' +
              '<button class="pl-edit-name-btn" onclick="window.editCenterPlaylistName(' + pl.id + ')" title="Edit name">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>' +
              '</button>' +
            '</div>' +
            '<div id="pl-center-count" style="font-size:12px;color:var(--muted)">' + (pl.tracks||[]).length + ' songs</div>' +
          '</div>' +
          // Delete button
          '<button onclick="window.deletePlaylist(' + pl.id + ')" title="Delete playlist" style="background:transparent;border:none;color:var(--muted);cursor:pointer;padding:6px;border-radius:6px;transition:color .15s" onmouseover="this.style.color=\'var(--danger)\'" onmouseout="this.style.color=\'var(--muted)\'">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4h6v2"/></svg>' +
          '</button>' +
        '</div>' +
        // Row 2: Search + Sort + Add
        '<div style="display:flex;gap:8px;align-items:center;">' +
          '<div class="pl-search-wrap" style="flex:1;margin-bottom:0">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
            '<input class="pl-search-input" id="pl-center-search" placeholder="Search playlist..." oninput="window.filterCenterPlaylist()">' +
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
      // ── Track List ──
      '<div class="section-header"><span class="section-title" id="pl-center-section-count">' + (pl.tracks||[]).length + ' songs</span></div>' +
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

    let tracks = (window._centerPlaylistTracks || []).slice();

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

    listEl.innerHTML = tracks.map((t, i) =>
      '<div class="music-row" data-idx="' + i + '" data-id="' + t.id + '" data-title="' + esc(t.title.toLowerCase()) + '">' +
        '<div class="music-num">' + (i+1) + '</div>' +
        '<div class="music-info-click" style="display:flex;align-items:center;flex:1;gap:10px;cursor:pointer" onclick="playPlaylistTrack(' + pl.id + ', ' + t.id + ')">' +
          '<div class="music-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/></svg></div>' +
          '<div class="music-info">' +
            '<div class="music-name music-title" id="title-' + t.id + '">' + esc(t.title) + '</div>' +
            '<div class="music-meta">' + (t.duration_formatted || '') + '</div>' +
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
      '</div>'
    ).join('');

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

  window.editCenterPlaylistName = function(id) {
    const nameEl = document.getElementById('pl-center-name');
    if (!nameEl) return;
    const oldName = nameEl.textContent.trim();
    const input = document.createElement('input');
    input.className = 'pl-name-input';
    input.value = oldName;
    nameEl.parentNode.insertBefore(input, nameEl);
    nameEl.style.display = 'none';
    input.focus(); input.select();
    function save() {
      const newName = input.value.trim() || oldName;
      const pls = getPlaylists();
      const pl  = pls.find(p => p.id === id);
      if (pl && newName !== oldName) {
        pl.name = newName;
        savePlaylists(pls);
        const titleEl = document.getElementById('main-page-title');
        if (titleEl) titleEl.textContent = newName;
        const rtitleEl = document.getElementById('right-panel-title');
        if (rtitleEl) rtitleEl.textContent = newName;
        if (typeof window.renderPlaylistPanel === 'function') window.renderPlaylistPanel();
        if (typeof showToast === 'function') showToast('Playlist renamed!', 'success');
      }
      nameEl.textContent = newName;
      nameEl.style.display = '';
      input.remove();
    }
    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { nameEl.style.display = ''; input.remove(); }
    });
  };

  // ── Edit nama playlist ─────────────────────────────
  window.editPlaylistName = function(id) {
    const nameEl = document.getElementById('pl-detail-name');
    if (!nameEl) return;
    const oldName = nameEl.textContent.trim();

    const input       = document.createElement('input');
    input.className   = 'pl-name-input';
    input.value       = oldName;
    nameEl.parentNode.insertBefore(input, nameEl);
    nameEl.style.display = 'none';
    input.focus(); input.select();

    function save() {
      const newName = input.value.trim() || oldName;
      const pls = getPlaylists();
      const pl  = pls.find(p => p.id === id);
      if (pl && newName !== oldName) {
        pl.name = newName;
        savePlaylists(pls);
        // Update header
        const titleEl = document.getElementById('right-panel-title');
        if (titleEl) titleEl.textContent = newName;
        if (typeof showToast === 'function') showToast('Playlist name updated!', 'success');
      }
      nameEl.textContent   = newName;
      nameEl.style.display = '';
      input.remove();
    }

    input.addEventListener('blur', save);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
      if (e.key === 'Escape') { nameEl.style.display = ''; input.remove(); }
    });
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
        const coverKey = getPLKey() + '_cover_' + id;
        localStorage.setItem(coverKey, e.target.result);
        fileInput.remove();
        // Also update center if showing this playlist
        if (window._centerPlaylistId === id) {
          const freshPl = getPlaylists().find(p => p.id === id);
          if (freshPl) window.renderCenterPlaylist(freshPl);
        }
        // Refresh sidebar to show new cover thumbnail immediately
        if (typeof window.reloadSidebarPlaylists === 'function') window.reloadSidebarPlaylists();
        if (typeof showToast === 'function') showToast('Cover photo updated!', 'success');
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
      const countEl = document.getElementById('pl-center-count');
      if (countEl) countEl.textContent = pl.tracks.length + ' songs';
      const sectEl = document.getElementById('pl-center-section-count');
      if (sectEl) sectEl.textContent = pl.tracks.length + ' songs';
    }
    
    if (window._activePlId === plId) window.viewPlaylist(plId); // Refresh detail
    window.renderPlaylistPanel(); // Refresh list
    if (typeof showToast === 'function') showToast('Song removed from playlist', 'info');
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

  // ── Buat playlist ─────────────────────────────────
  window.createPlaylist = function(name) {
    if (!name) return;
    const pls = getPlaylists();
    pls.push({ id: Date.now(), name, tracks: [] });
    savePlaylists(pls);
    if (typeof showToast === 'function') showToast('Playlist "' + name + '" created!', 'success');
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

  // Init render
  window.renderPlaylistPanel();

  // Bind konfirmasi hapus playlist
  const confirmDeletePlBtn = document.getElementById('confirm-delete-playlist-btn');
  if (confirmDeletePlBtn && !confirmDeletePlBtn.dataset.bound) {
    confirmDeletePlBtn.dataset.bound = '1';
    confirmDeletePlBtn.addEventListener('click', () => {
      const id = window._deletePlaylistId;
      if (!id) return;
      savePlaylists(getPlaylists().filter(p => p.id !== id));
      if (typeof showToast === 'function') showToast('Playlist deleted', 'info');
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
    // Restore page title
    const titleEl = document.getElementById('main-page-title');
    if (titleEl && window._libraryPageTitleText) titleEl.textContent = window._libraryPageTitleText;

    // Restore card content
    const c = document.querySelector('.card');
    if (c && window._libraryCardHTML) {
      c.innerHTML = window._libraryCardHTML;
    }

    // Re-bind click events on restored rows
    document.querySelectorAll('.music-row .music-info-click').forEach(area => {
      area.addEventListener('click', () => {
        const row = area.closest('.music-row');
        if (row) {
          if (typeof setPlaylist === 'function' && window._library) setPlaylist(window._library);
          if (typeof window.playTrackById === 'function') window.playTrackById(parseInt(row.dataset.id));
        }
      });
    });

    // Re-apply filters & like buttons
    if (typeof applyFilters === 'function') applyFilters();
    if (typeof updateAllLikeButtons === 'function') updateAllLikeButtons();
    if (typeof highlightRow === 'function') highlightRow(window.currentIdx || 0);
  };

  // ── Bind klik baris musik (play) ──────────────────
  document.querySelectorAll('.music-row .music-info-click').forEach(area => {
    area.addEventListener('click', () => {
      const row = area.closest('.music-row');
      if (row) {
        if (typeof setPlaylist === 'function' && window._library) {
          setPlaylist(window._library);
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
      if (match) found++;
    });

    const countEl = document.querySelector('.section-title');
    if (countEl && !q) countEl.textContent = found + ' songs';

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
      rows.forEach((row, i) => {
        const numEl = row.querySelector('.music-num');
        if (numEl) numEl.textContent = i + 1;
        row.dataset.idx = i;
        trackList.appendChild(row);
      });

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
      if (sortLabel) sortLabel.textContent = sortNames[savedSort];
      if (sortDirIcon) sortDirIcon.classList.toggle('desc', ['za','duration-desc','oldest'].includes(savedSort));
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

  // ── Rename ────────────────────────────────────────
  window.startRename = function(id) {
    const titleEl = document.getElementById('title-' + id);
    if (!titleEl) return;
    const oldVal  = titleEl.textContent.trim();
    const overlay = document.getElementById('rename-overlay');
    const oldLabel= document.getElementById('rename-dialog-old');
    const input   = document.getElementById('rename-dialog-input');
    if (!overlay || !input) return;
    if (oldLabel) oldLabel.textContent = 'Current name: ' + oldVal;
    input.value = oldVal;
    overlay.classList.add('open');
    setTimeout(() => { input.focus(); input.select(); }, 150);

    function closeDialog() { overlay.classList.remove('open'); }

    async function doSave() {
      const newTitle = input.value.trim();
      if (!newTitle || newTitle === oldVal) { closeDialog(); return; }
      const saveBtn = document.getElementById('rename-save-btn');
      if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Saving...'; }
      try {
        const csrf = document.querySelector('meta[name=csrf-token]').content;
        const res  = await fetch('/music/' + id + '/rename', {
          method: 'PATCH',
          headers: { 'Content-Type':'application/json', 'X-CSRF-TOKEN':csrf, 'Accept':'application/json', 'X-Requested-With':'XMLHttpRequest' },
          body: JSON.stringify({ title: newTitle }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message||'Error');
        titleEl.textContent = data.title;
        const lib = window._library || [];
        const t   = lib.find(t => t.id === id);
        if (t) { t.title = data.title; if (typeof setPlaylist==='function') setPlaylist(lib); }
        closeDialog();
        if (typeof showToast === 'function') showToast('Name successfully updated!', 'success');
      } catch(err) {
        if (typeof showToast === 'function') showToast('Failed: ' + err.message, 'error');
      } finally {
        const sb = document.getElementById('rename-save-btn');
        if (sb) { sb.disabled = false; sb.textContent = 'Save'; }
      }
    }

    // Clone buttons to remove old listeners
    const saveBtn   = document.getElementById('rename-save-btn');
    const cancelBtn = document.getElementById('rename-cancel-btn');
    const newSave   = saveBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    saveBtn.replaceWith(newSave);
    cancelBtn.replaceWith(newCancel);
    newSave.addEventListener('click', doSave);
    newCancel.addEventListener('click', closeDialog);
    input.onkeydown = e => { if(e.key==='Enter'){e.preventDefault();doSave();} if(e.key==='Escape') closeDialog(); };
    overlay.onclick = e => { if(e.target===overlay) closeDialog(); };
  };

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
}

// ── Runner ────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMusicPage);
} else {
  initMusicPage();
}