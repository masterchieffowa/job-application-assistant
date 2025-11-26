chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractJobDetails") {
    try {
      // Extract job details from LinkedIn page
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

      // Try to find HR email or contact info
      let hrEmail = "";
      const links = document.querySelectorAll('a[href^="mailto:"]');
      if (links.length > 0) {
        hrEmail = links[0].href.replace("mailto:", "");
      }

      sendResponse({
        success: true,
        data: {
          title: jobTitle,
          company: company,
          description: description,
          hrEmail: hrEmail,
        },
      });
    } catch (error) {
      sendResponse({
        success: false,
        error: error.message,
      });
    }
  }
  return true;
});
