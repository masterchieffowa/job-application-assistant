// This runs on LinkedIn pages if user wants to auto-extract
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractFromLinkedIn") {
    try {
      const jobTitle =
        document
          .querySelector(
            "h1.job-title, h2.job-title, .jobs-unified-top-card__job-title"
          )
          ?.textContent?.trim() || "";
      const company =
        document
          .querySelector(
            ".jobs-unified-top-card__company-name, .job-details-jobs-unified-top-card__company-name a"
          )
          ?.textContent?.trim() || "";
      const description =
        document
          .querySelector(".jobs-description__content, .jobs-box__html-content")
          ?.textContent?.trim() || "";

      let fullPost = `Job Title: ${jobTitle}\n`;
      fullPost += `Company: ${company}\n\n`;
      fullPost += description;

      sendResponse({ success: true, jobPost: fullPost });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true;
});
