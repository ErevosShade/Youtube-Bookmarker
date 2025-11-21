function findVideoElement() { return document.querySelector('video'); }
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
  return true;
});
