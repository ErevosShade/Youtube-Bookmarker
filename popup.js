const bookmarksList = document.getElementById('bookmarks-list');
const clearAllBtn = document.getElementById('clear-all');

/* --------------------------------------------
   Helper — Gets the current tab’s YouTube videoId
--------------------------------------------- */
async function getActiveVideoId() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url.includes("youtube.com/watch")) return null;

  const url = new URL(tab.url);
  return url.searchParams.get("v");
}

/* --------------------------------------------
   Render bookmarks list
--------------------------------------------- */
function renderBookmarks(arr) {
  bookmarksList.innerHTML = '';

  if (!arr || arr.length === 0) {
    bookmarksList.innerHTML = '<li>No bookmarks</li>';
    return;
  }

  arr.forEach((bm, index) => {
    const li = document.createElement('li');
    li.className = 'bookmark-item';

    li.innerHTML = `
      <span>${formatTime(bm.time)} — ${bm.label || ''}</span>
    `;

    const controls = document.createElement('div');

    const jump = document.createElement('button');
    jump.textContent = 'Jump';
    jump.onclick = () => jumpToTime(bm.time);

    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.onclick = () => deleteBookmark(index);

    controls.appendChild(jump);
    controls.appendChild(del);
    li.appendChild(controls);

    bookmarksList.appendChild(li);
  });
}

/* --------------------------------------------
   Load bookmarks for current video
--------------------------------------------- */
function loadBookmarksForVideo(videoId) {
  if (!videoId) {
    bookmarksList.innerHTML = '<li>No bookmarks</li>';
    return;
  }

  chrome.storage.local.get(['bookmarks'], (res) => {
    const all = res.bookmarks || {};
    renderBookmarks(all[videoId] || []);
  });
}

/* --------------------------------------------
   Delete bookmark
--------------------------------------------- */
function deleteBookmark(i) {
  getActiveVideoId().then((videoId) => {
    if (!videoId) return;

    chrome.storage.local.get(['bookmarks'], (res) => {
      const all = res.bookmarks || {};
      const arr = all[videoId] || [];

      arr.splice(i, 1);
      all[videoId] = arr;

      chrome.storage.local.set({ bookmarks: all }, () => {
        loadBookmarksForVideo(videoId);
      });
    });
  });
}

/* --------------------------------------------
   Clear bookmarks (for this video only)
--------------------------------------------- */
function clearAll() {
  getActiveVideoId().then((videoId) => {
    if (!videoId) {
      chrome.storage.local.set({ bookmarks: {} }, () => {
        bookmarksList.innerHTML = '<li>No bookmarks</li>';
      });
      return;
    }

    chrome.storage.local.get(['bookmarks'], (res) => {
      const all = res.bookmarks || {};
      all[videoId] = [];

      chrome.storage.local.set({ bookmarks: all }, () => {
        loadBookmarksForVideo(videoId);
      });
    });
  });
}

/* --------------------------------------------
   Jump to timestamp
--------------------------------------------- */
function jumpToTime(t) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: 'JUMP_TO_TIME',
      time: t
    });
  });
}

/* --------------------------------------------
   Time formatting
--------------------------------------------- */
function formatTime(seconds) {
  seconds = Number(seconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* --------------------------------------------
   Init
--------------------------------------------- */
clearAllBtn.onclick = clearAll;

(async () => {
  const videoId = await getActiveVideoId();
  loadBookmarksForVideo(videoId);
})();
