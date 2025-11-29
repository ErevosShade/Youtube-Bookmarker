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

// YouTube is an SPA → WATCH FOR URL CHANGES
const observer = new MutationObserver(() => detectVideoChange());
observer.observe(document.body, { childList: true, subtree: true });

// Also check periodically (fallback)
setInterval(detectVideoChange, 1500);
