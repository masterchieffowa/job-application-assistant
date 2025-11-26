// Tab switching
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
    showStatus("✓ Resume uploaded: " + file.name, "success");
  }
});

// Extract job information
document.getElementById("extractBtn").addEventListener("click", async () => {
  const jobPost = document.getElementById("jobPost").value.trim();

  if (!jobPost) {
    showStatus("Please paste a job post first", "error");
    return;
  }

  const config = await chrome.storage.local.get(["geminiKey"]);
  if (!config.geminiKey) {
    showStatus("Please configure your Gemini API key in Settings", "error");
    return;
  }

  const extractBtn = document.getElementById("extractBtn");
  extractBtn.disabled = true;
  extractBtn.innerHTML = "<span>⏳</span> Analyzing job post...";

  showStatus("Analyzing job post with AI...", "success");

  try {
    const extractPrompt = `Extract the following information from this job post and return ONLY a valid JSON object with no additional text or markdown:

Job Post:
${jobPost}

Return format (only JSON, no markdown, no backticks):
{
  "jobTitle": "extracted job title",
  "company": "company name if found, otherwise 'Not specified'",
  "location": "location if found, otherwise 'Not specified'",
  "requirements": ["key requirement 1", "key requirement 2"],
  "contactInfo": "any email or contact found, otherwise empty string"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: extractPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `API returned ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts
    ) {
      throw new Error("Invalid API response structure");
    }

    let extractedText = data.candidates[0].content.parts[0].text;

    // Clean response - remove markdown code blocks and extra text
    extractedText = extractedText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .replace(/^[^{]*/, "") // Remove text before first {
      .replace(/[^}]*$/, "") // Remove text after last }
      .trim();

    const extracted = JSON.parse(extractedText);

    // Display extracted info
    const infoDiv = document.getElementById("extractedInfo");
    const contentDiv = document.getElementById("extractedContent");

    let html = `<strong>Job Title:</strong> ${extracted.jobTitle}<br>`;
    html += `<strong>Company:</strong> ${extracted.company}<br>`;
    html += `<strong>Location:</strong> ${extracted.location}<br>`;

    if (extracted.requirements && extracted.requirements.length > 0) {
      html += `<strong>Key Requirements:</strong><ul>`;
      extracted.requirements.slice(0, 3).forEach((req) => {
        html += `<li>${req}</li>`;
      });
      html += `</ul>`;
    }

    contentDiv.innerHTML = html;
    infoDiv.classList.remove("hidden");

    // Auto-fill HR email if found
    if (extracted.contactInfo) {
      document.getElementById("hrEmail").value = extracted.contactInfo;
    }

    showStatus("✓ Job information extracted successfully!", "success");
  } catch (error) {
    console.error("Extract error:", error);
    showStatus(
      "Error: " + error.message + ". Please check your API key.",
      "error"
    );
  } finally {
    extractBtn.disabled = false;
    extractBtn.innerHTML = "<span>🔍</span> Extract Job Info (Optional)";
  }
});

// Generate email
document.getElementById("generateBtn").addEventListener("click", async () => {
  const jobPost = document.getElementById("jobPost").value.trim();
  const hrEmail = document.getElementById("hrEmail").value.trim();
  const additionalDetails = document
    .getElementById("additionalDetails")
    .value.trim();

  if (!jobPost) {
    showStatus("Please paste a job post", "error");
    return;
  }

  if (!hrEmail) {
    showStatus("Please enter HR email address", "error");
    return;
  }

  const config = await chrome.storage.local.get(["geminiKey"]);
  if (!config.geminiKey) {
    showStatus("Please configure Gemini API key in Settings", "error");
    return;
  }

  const generateBtn = document.getElementById("generateBtn");
  generateBtn.disabled = true;
  generateBtn.innerHTML = "<span>⏳</span> Generating email...";

  showStatus("Generating professional email with AI...", "success");

  try {
    // Generate email body
    const emailPrompt = `Create a professional job application email based on this job post. 

Job Post:
${jobPost}

${
  additionalDetails
    ? `\nCandidate's Additional Notes:\n${additionalDetails}`
    : ""
}

Requirements:
- Professional and engaging tone
- Highlight relevant qualifications
- Express genuine interest
- Keep it concise (150-200 words)
- Use "Dear Hiring Manager" as greeting
- End with "Best regards" and a name placeholder [Your Name]
- Include a call to action

Return ONLY the email body text. No subject line. No extra formatting. Just the email content.`;

    const emailResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: emailPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!emailResponse.ok) {
      throw new Error(`API returned ${emailResponse.status}`);
    }

    const emailData = await emailResponse.json();

    if (
      !emailData.candidates ||
      !emailData.candidates[0] ||
      !emailData.candidates[0].content
    ) {
      throw new Error("Invalid email response from API");
    }

    const emailBody = emailData.candidates[0].content.parts[0].text.trim();

    // Generate subject line
    const subjectPrompt = `Create a professional email subject line for a job application based on this job post:

${jobPost}

Return ONLY the subject line (max 10 words). No quotes, no extra text, just the subject line.`;

    const subjectResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: subjectPrompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 100,
          },
        }),
      }
    );

    if (!subjectResponse.ok) {
      throw new Error(`API returned ${subjectResponse.status}`);
    }

    const subjectData = await subjectResponse.json();

    if (!subjectData.candidates || !subjectData.candidates[0]) {
      throw new Error("Invalid subject response from API");
    }

    const subject = subjectData.candidates[0].content.parts[0].text
      .replace(/['"]/g, "")
      .replace(/Subject:/gi, "")
      .replace(/Application for/gi, "Application for")
      .trim();

    // Display results
    document.getElementById("emailSubject").value = subject;
    document.getElementById("emailBody").value = emailBody;
    document.getElementById("emailPreview").classList.remove("hidden");

    // Scroll to preview
    document
      .getElementById("emailPreview")
      .scrollIntoView({ behavior: "smooth", block: "nearest" });

    showStatus(
      "✓ Email generated! Please review and edit if needed.",
      "success"
    );
  } catch (error) {
    console.error("Generation error:", error);
    showStatus("Error generating email: " + error.message, "error");
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = "<span>✨</span> Generate Professional Email";
  }
});

// Send via Gmail
document.getElementById("sendBtn").addEventListener("click", () => {
  const hrEmail = document.getElementById("hrEmail").value.trim();
  const subject = document.getElementById("emailSubject").value;
  const body = document.getElementById("emailBody").value;

  if (!hrEmail || !subject || !body) {
    showStatus("Missing email information", "error");
    return;
  }

  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    hrEmail
  )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  chrome.tabs.create({ url: gmailUrl }, () => {
    showStatus("✓ Gmail opened! Review and send your email.", "success");
  });
});

// Save settings
document
  .getElementById("saveSettingsBtn")
  .addEventListener("click", async () => {
    const geminiKey = document.getElementById("geminiKey").value.trim();

    if (!geminiKey) {
      const statusDiv = document.getElementById("settingsStatus");
      statusDiv.className = "status error";
      statusDiv.textContent = "Please enter an API key";
      statusDiv.style.display = "block";
      return;
    }

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
chrome.storage.local.get(["geminiKey"], (result) => {
  if (result.geminiKey) {
    document.getElementById("geminiKey").value = result.geminiKey;
  }
});

// Helper function
function showStatus(message, type) {
  const statusDiv = document.getElementById("status");
  const icon = type === "success" ? "✓" : "⚠";
  statusDiv.className = `status ${type}`;
  statusDiv.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  statusDiv.style.display = "flex";

  setTimeout(() => {
    statusDiv.style.display = "none";
  }, 5000);
}
