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

  const config = await chrome.storage.local.get(["openrouterKey"]);
  if (!config.openrouterKey) {
    showStatus("Please configure your GPT API key in Settings", "error");
    return;
  }

  const extractBtn = document.getElementById("extractBtn");
  extractBtn.disabled = true;
  extractBtn.innerHTML = "<span>⏳</span> Analyzing job post...";

  showStatus("Analyzing job post with AI...", "success");

  try {
    const extractPrompt = `Extract the following information from this job post and return ONLY a valid JSON object with no additional text:

Job Post:
${jobPost}

Return ONLY this JSON format:
{
  "jobTitle": "extracted job title",
  "company": "company name or 'Not specified'",
  "location": "location or 'Not specified'",
  "requirements": ["key requirement 1", "key requirement 2"],
  "contactInfo": "email/contact if found, else empty string"
}`;

    let extractedText = await callOpenRouter(extractPrompt, 0.2, 800);

    // Cleanup any accidental formatting
    extractedText = extractedText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Force extract JSON only
    const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Model did not return JSON");

    const extracted = JSON.parse(jsonMatch[0]);

    // Display extracted info
    const infoDiv = document.getElementById("extractedInfo");
    const contentDiv = document.getElementById("extractedContent");

    let html = `<strong>Job Title:</strong> ${extracted.jobTitle}<br>`;
    html += `<strong>Company:</strong> ${extracted.company}<br>`;
    html += `<strong>Location:</strong> ${extracted.location}<br>`;

    if (Array.isArray(extracted.requirements)) {
      html += `<strong>Key Requirements:</strong><ul>`;
      extracted.requirements.slice(0, 3).forEach((req) => {
        html += `<li>${req}</li>`;
      });
      html += `</ul>`;
    }

    contentDiv.innerHTML = html;
    infoDiv.classList.remove("hidden");

    if (extracted.contactInfo) {
      document.getElementById("hrEmail").value = extracted.contactInfo;
    }

    showStatus("✓ Job information extracted successfully!", "success");
  } catch (error) {
    console.error("Extraction Error:", error);
    showStatus("❌ Failed to extract information. Try again.", "error");
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

  const config = await chrome.storage.local.get(["openrouterKey"]);
  if (!config.openrouterKey) {
    showStatus("Please configure Gemini API key in Settings", "error");
    return;
  }

  const generateBtn = document.getElementById("generateBtn");
  generateBtn.disabled = true;
  generateBtn.innerHTML = "<span>⏳</span> Generating email...";

  showStatus("Generating professional email with AI...", "success");

  try {
    // Email body prompt
    const emailPrompt = `Create a professional job application email based on this job post.

Job Post:
${jobPost}

${
  additionalDetails
    ? `\nCandidate's Additional Notes:\n${additionalDetails}`
    : ""
}

Requirements:
- Professional/engaging tone
- Highlight relevant qualifications
- Concise (150-200 words)
- Begin with "Dear Hiring Manager"
- End with "Best regards" + [Your Name]
- No subject line
- Return ONLY the email body text (no markdown, no extra formatting).`;

    const emailBody = await callOpenRouter(emailPrompt, 0.7, 500);

    // Subject line
    const subjectPrompt = `Create a professional email subject line for a job application.

Job Post:
${jobPost}

Return ONLY the subject line, max 10 words. No quotes, no extra text.`;

    let subject = await callOpenRouter(subjectPrompt, 0.4, 60);

    subject = subject.replace(/['"]/g, "").trim();

    // Display results
    document.getElementById("emailSubject").value = subject;
    document.getElementById("emailBody").value = emailBody;
    document.getElementById("emailPreview").classList.remove("hidden");

    document
      .getElementById("emailPreview")
      .scrollIntoView({ behavior: "smooth", block: "nearest" });

    showStatus("✓ Email generated! Please review before sending.", "success");
  } catch (error) {
    console.error("Email Generation Error:", error);
    showStatus("❌ Failed to generate email. Try again.", "error");
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
    const openrouterKey = document.getElementById("openrouterKey").value.trim();

    if (!openrouterKey) {
      const statusDiv = document.getElementById("settingsStatus");
      statusDiv.className = "status error";
      statusDiv.textContent = "Please enter an API key";
      statusDiv.style.display = "block";
      return;
    }

    await chrome.storage.local.set({ openrouterKey });

    const statusDiv = document.getElementById("settingsStatus");
    statusDiv.className = "status success";
    statusDiv.textContent = "✓ Settings saved successfully!";
    statusDiv.style.display = "block";

    setTimeout(() => {
      statusDiv.style.display = "none";
    }, 3000);
  });

// Load saved settings
chrome.storage.local.get(["openrouterKey"], (result) => {
  if (result.openrouterKey) {
    document.getElementById("openrouterKey").value = result.openrouterKey;
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

async function callOpenRouter(prompt, temperature = 0.3, maxTokens = 800) {
  const { openrouterKey } = await chrome.storage.local.get(["openrouterKey"]);
  if (!openrouterKey) throw new Error("Missing OpenRouter API key");

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://job-extension",
        "X-Title": "Job Application Assistant",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        temperature,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`OpenRouter Error: ${response.status}`);
  }

  const data = await response.json();

  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
