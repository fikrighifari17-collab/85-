import sys

path = r'c:\xampp\htdocs\musik - Copy\public\js\music.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """    card.innerHTML = 
      '<div class="playlist-grid-all" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(170px, 1fr));gap:24px;padding:24px">' +
        pls.map(pl => {
          const coverKey = getPLKey() + '_cover_' + pl.id;
          const coverData = localStorage.getItem(coverKey) || '';
          return `
            <div class="pl-card" onclick="window.viewPlaylist(${pl.id})" style="cursor:pointer;background:var(--bg3);border-radius:18px;padding:18px;transition:transform 0.2s, background 0.2s">
              <div class="pl-card-cover" style="width:100%;aspect-ratio:1;border-radius:12px;background:var(--bg4);overflow:hidden;margin-bottom:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 16px rgba(0,0,0,0.2)">
                ${coverData ? `<img src="${coverData}" style="width:100%;height:100%;object-fit:cover">` : `<svg viewBox="0 0 24 24" fill="currentColor" style="width:44px;height:44px;opacity:0.3;color:var(--accent)"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`}
              </div>
              <div class="pl-card-name" style="font-weight:700;font-size:15px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(pl.name)}</div>
              <div class="pl-card-meta" style="font-size:12px;color:var(--muted);margin-top:6px;font-weight:500">${(pl.tracks||[]).length} songs</div>
            </div>
          `;
        }).join('') +
      '</div>';"""

new_code = """    card.innerHTML = 
      '<div class="playlist-grid-all">' +
        pls.map(pl => {
          const coverKey = getPLKey() + '_cover_' + pl.id;
          const coverData = localStorage.getItem(coverKey) || '';
          return `
            <div class="pl-card" onclick="window.viewPlaylist(${pl.id})">
              <div class="pl-card-cover">
                ${coverData ? `<img src="${coverData}" alt="cover">` : `<svg viewBox="0 0 24 24" fill="currentColor" style="width:48px;height:48px;opacity:0.3;color:var(--accent)"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`}
                <div class="pl-card-play-overlay">
                  <svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
              <div class="pl-card-name">${esc(pl.name)}</div>
              <div class="pl-card-meta">${(pl.tracks||[]).length} songs</div>
            </div>
          `;
        }).join('') +
      '</div>';"""

if old_code in content:
    new_content = content.replace(old_code, new_code)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated music.js")
else:
    # Try fuzzy match (ignore whitespaces)
    print("Exact match failed, trying fuzzy match...")
    import re
    # Escape special chars and replace whitespaces with \s*
    pattern = re.escape(old_code).replace(r'\ ', r'\s*').replace(r'\n', r'\s*')
    new_content, count = re.subn(pattern, new_code, content)
    if count > 0:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Successfully updated music.js with {count} replacements.")
    else:
        print("Could not find the code to replace.")
        sys.exit(1)
