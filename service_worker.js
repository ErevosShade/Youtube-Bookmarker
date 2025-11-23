chrome.runtime.onConnect.addListener(port => {
  // Keeps SW alive
});
console.log("SW LOADED!");

chrome.runtime.onMessage.addListener((msg) => {
  console.log("SW RECEIVED MESSAGE:", msg);
});

// Listen for bookmark save requests from content.js
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("SW RECEIVED MESSAGE:", msg);

  //handle save_bookmark
  if (msg.type === "SAVE_BOOKMARK") {

    // Extract videoId from the YouTube URL
    const url = new URL(msg.url);
    const videoId = url.searchParams.get("v");

    if (!videoId) {
      console.warn("No videoId found in URL:", msg.url);
      return true;
    }

    // Load all existing bookmarks
    chrome.storage.local.get(['bookmarks'], (res) => {
      const all = res.bookmarks || {};
      const arr = all[videoId] || [];

      // Append new bookmark
      arr.push({
        time: msg.time,
        label: msg.label,
        createdAt: Date.now()
      });

      // Save back under videoId key
      all[videoId] = arr;

      chrome.storage.local.set({ bookmarks: all }, () => {
        console.log("Bookmark saved:", videoId, msg.time);
      });
    });

    sendResponse({ ok: true });
  }
  return true; // <-- KEEP WORKER ALIVE FOR ASYNC CODE
});

// Initialize bookmark storage when installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['bookmarks'], (res) => {
    if (!res.bookmarks) chrome.storage.local.set({ bookmarks: {} });
  });
});
