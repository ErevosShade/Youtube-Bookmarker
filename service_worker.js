chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['bookmarks'], (res) => {
    if (!res.bookmarks) chrome.storage.local.set({ bookmarks: {} });
  });
});
