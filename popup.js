document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".tab-content")
      .forEach((c) => c.classList.add("hidden"));

    tab.classList.add("active");
    const tabName = tab.dataset.tab;
    document.getElementById(`${tabName}-tab`).classList.remove("hidden");
  });
});

// Resume upload
document.getElementById("resumeUpload").addEventListener("click", () => {
  document.getElementById("resumeFile").click();
});

document.getElementById("resumeFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    document.getElementById("resumeText").textContent = `📄 ${file.name}`;
    showStatus("Resume uploaded successfully!", "success");
  }
});

// Default resume upload
document.getElementById("defaultResumeUpload").addEventListener("click", () => {
  document.getElementById("defaultResumeFile").click();
});

document.getElementById("defaultResumeFile").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    document.getElementById(
      "defaultResumeText"
    ).textContent = `📄 ${file.name}`;
    // Store file info in chrome.storage
    chrome.storage.local.set({ defaultResume: file.name });
  }
});

// Extract from LinkedIn
document.getElementById("extractBtn").addEventListener("click", async () => {
  showStatus("Extracting job details from LinkedIn...", "success");

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab.url.includes("linkedin.com/jobs")) {
      showStatus("Please navigate to a LinkedIn job posting first", "error");
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      { action: "extractJobDetails" },
      (response) => {
        if (response && response.success) {
          document.getElementById("jobTitle").value = response.data.title || "";
          document.getElementById("companyName").value =
            response.data.company || "";
          document.getElementById("jobDescription").value =
            response.data.description || "";
          document.getElementById("hrEmail").value =
            response.data.hrEmail || "";
          showStatus("Job details extracted successfully!", "success");
        } else {
          showStatus(
            "Could not extract details. Please fill manually.",
            "error"
          );
        }
      }
    );
  } catch (error) {
    showStatus("Error: " + error.message, "error");
  }
});

// Generate email
document.getElementById("generateBtn").addEventListener("click", async () => {
  const jobTitle = document.getElementById("jobTitle").value;
  const companyName = document.getElementById("companyName").value;
  const jobDescription = document.getElementById("jobDescription").value;
  const hrName = document.getElementById("hrName").value;
  const additionalDetails = document.getElementById("additionalDetails").value;

  if (!jobTitle || !companyName || !jobDescription) {
    showStatus("Please fill in job title, company, and description", "error");
    return;
  }

  const config = await chrome.storage.local.get(["geminiKey"]);
  if (!config.geminiKey) {
    showStatus("Please configure Gemini API key in Settings", "error");
    return;
  }

  showStatus("Generating email with AI...", "success");

  try {
    // Generate email body
    const emailPrompt = `Create a professional job application email based on:

Job Title: ${jobTitle}
Company: ${companyName}
HR Name: ${hrName || "Hiring Manager"}
Job Description: ${jobDescription}
${additionalDetails ? `Additional Details: ${additionalDetails}` : ""}

Requirements:
- Professional and concise tone
- Highlight relevant experience
- Express genuine interest
- Include call to action
- Keep it under 200 words
${hrName ? `- Address to ${hrName}` : '- Use "Dear Hiring Manager"'}

Format: Return only the email body, no subject line.`;

    const emailResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: emailPrompt }] }],
        }),
      }
    );

    const emailData = await emailResponse.json();
    const emailBody = emailData.candidates[0].content.parts[0].text;

    // Generate subject line
    const subjectPrompt = `Create a professional email subject line for applying to: ${jobTitle} at ${companyName}. Return only the subject line, nothing else. Maximum 10 words.`;

    const subjectResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: subjectPrompt }] }],
        }),
      }
    );

    const subjectData = await subjectResponse.json();
    const emailSubject = subjectData.candidates[0].content.parts[0].text
      .replace(/['"]/g, "")
      .trim();

    // Display results
    document.getElementById("emailSubject").value = emailSubject;
    document.getElementById("emailBody").value = emailBody;
    document.getElementById("emailPreview").classList.remove("hidden");

    showStatus("Email generated successfully! Review and send.", "success");
  } catch (error) {
    showStatus("Error generating email: " + error.message, "error");
  }
});

// Send email
document.getElementById("sendBtn").addEventListener("click", () => {
  const hrEmail = document.getElementById("hrEmail").value;
  const subject = document.getElementById("emailSubject").value;
  const body = document.getElementById("emailBody").value;

  if (!hrEmail) {
    showStatus("Please enter HR email address", "error");
    return;
  }

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    hrEmail
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  chrome.tabs.create({ url: gmailUrl });
  showStatus("Gmail opened. Please review and send!", "success");
});

// Save settings
document
  .getElementById("saveSettingsBtn")
  .addEventListener("click", async () => {
    const geminiKey = document.getElementById("geminiKey").value;

    await chrome.storage.local.set({ geminiKey });

    const statusDiv = document.getElementById("settingsStatus");
    statusDiv.className = "status success";
    statusDiv.textContent = "✓ Settings saved successfully!";
    statusDiv.style.display = "block";

    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 3000);
  });

// Load saved settings
chrome.storage.local.get(["geminiKey", "defaultResume"], (result) => {
  if (result.geminiKey) {
    document.getElementById("geminiKey").value = result.geminiKey;
  }
  if (result.defaultResume) {
    document.getElementById(
      "defaultResumeText"
    ).textContent = `📄 ${result.defaultResume}`;
  }
});

function showStatus(message, type) {
  const statusDiv = document.getElementById("status");
  statusDiv.className = `status ${type}`;
  statusDiv.textContent = message;
  statusDiv.style.display = "block";

  setTimeout(() => {
    statusDiv.style.display = "none";
  }, 5000);
}
