// finding the video element 
//If YouTube changes implementation drastically (e.g., custom player), this might fail — then you'd need more sophisticated detection.
function findVideoElement() { return document.querySelector('video'); }

//B — Reading video info
function getVideoInfo() {
  const video = findVideoElement();
  const url = location.href;
  let currentTime = null;
  if (video && typeof video.currentTime === 'number') currentTime = Math.floor(video.currentTime);
  const title = document.title.replace(' - YouTube', '').trim();
  const urlObj = new URL(url);
  const videoId = urlObj.searchParams.get('v') || null;
  return { title, currentTime, videoId, url };
}

//C — Receiving messages (GET / JUMP)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;
  if (message.type === 'GET_VIDEO_INFO') {
    sendResponse({ success: true, data: getVideoInfo() });
  } else if (message.type === 'JUMP_TO_TIME') {
    const video = findVideoElement();
    if (video && message.time != null) {
      try { video.currentTime = Number(message.time); sendResponse({ success: true }); }
      catch (e) { sendResponse({ success: false, error: e.message }); }
    } else sendResponse({ success: false, error: 'No video element or invalid time' });
  }
});

//D — SPA detection (watching for navigation changes)
let lastVideoId = null;

function detectVideoChange() {
  const urlObj = new URL(location.href);
  const vid = urlObj.searchParams.get("v");

  if (vid !== lastVideoId) {
    lastVideoId = vid;
    // Notify popup if it’s open (safe to ignore if closed)
    chrome.runtime.sendMessage({
      type: "VIDEO_CHANGED",
      videoId: vid
    });
  }
}

function addBookmarkButtonToYouTubePlayer() {
  const rightControls = document.querySelector(".ytp-right-controls");

  // controls not visible yet
  if (!rightControls) return;

  // avoid duplicates
  if (document.querySelector("#ytbkmk-player-btn")) return;

  // create YouTube-style button
  const btn = document.createElement("button");
  btn.id = "ytbkmk-player-btn";
  btn.className = "ytp-button";
  btn.title = "Add Bookmark";

  btn.innerHTML = `
  <svg viewBox="0 0 24 24" width="22" height="22" fill="#ff4c4c">
    <path d="M7 2h10a2 2 0 0 1 2 2v18l-7-3-7 3V4a2 2 0 0 1 2-2z"/>
  </svg>
`;

  btn.style.fontSize = "18px";
  btn.style.marginRight = "6px";

  btn.onclick = () => {
    const video = document.querySelector("video");
    if (!video) return;

    // Prevent crash if extension was reloaded
    if (!chrome.runtime?.id) {
      console.warn("Extension context invalid — ignored click");
      return;
    }

    const time = Math.floor(video.currentTime);
    // Default label = formatted time (e.g., "1:23" or "12:04")
    const defaultLabel = formatTime(time);

    // Ask user for a title
    const userInput = prompt(
      "Enter bookmark title (leave empty to use timestamp):",
      defaultLabel
    );

    // If user clicked CANCEL → do nothing
    if (userInput === null) return;

    // If blank → use timestamp
    const label =
      userInput.trim() === "" ? defaultLabel : userInput.trim();
    
      chrome.runtime.sendMessage({
      type: "SAVE_BOOKMARK",
      time: time,
      label: label,
      url: location.href
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.warn("SendMessage error:", chrome.runtime.lastError.message);
        return;
      }
    }
  );

  };

  // Time formatter helper
  function formatTime(seconds) {
    seconds = Number(seconds);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

      return `${m}:${String(s).padStart(2, "0")}`;
  }

  // Insert as FIRST button on the right control bar
  rightControls.insertBefore(btn, rightControls.firstChild);
}

// Continuously watch the DOM for YouTube player changes
const playerObserver = new MutationObserver(() => addBookmarkButtonToYouTubePlayer());
playerObserver.observe(document.body, { childList: true, subtree: true });

// attempt initial inject
addBookmarkButtonToYouTubePlayer();


// YouTube is an SPA → WATCH FOR URL CHANGES
const navigationObserver  = new MutationObserver(() => detectVideoChange());
navigationObserver.observe(document.body, { childList: true, subtree: true });

// Also check periodically (fallback)
setInterval(detectVideoChange, 1500);

