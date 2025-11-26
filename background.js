chrome.runtime.onInstalled.addListener(() => {
  console.log("LinkedIn Job Auto-Applier installed!");
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openGmail") {
    chrome.tabs.create({ url: request.url });
  }
  return true;
});
