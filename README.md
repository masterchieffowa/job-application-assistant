/\*

# LinkedIn Job Auto-Applier - Installation Guide

## Prerequisites

1. Google Chrome or Edge browser
2. Google Gemini API Key (free): https://makersuite.google.com/app/apikey

## Installation Steps

1. **Download and Extract**

   - Create a folder called `linkedin-job-applier`
   - Save all the files above in this folder

2. **Create Icon Files**

   - Create an `icons` folder
   - Add 3 icon files (16x16, 48x48, 128x128 pixels)
   - Or use any PNG images as placeholders

3. **Load Extension**

   - Open Chrome/Edge
   - Go to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `linkedin-job-applier` folder

4. **Configure API Key**
   - Click the extension icon
   - Go to Settings tab
   - Enter your Gemini API key
   - Click Save Settings

## Usage

### Method 1: Auto-Extract from LinkedIn

1. Navigate to any LinkedIn job posting
2. Click the extension icon
3. Click "Extract Job Details from LinkedIn"
4. Review extracted details
5. Click "Generate Email with AI"
6. Review and click "Send via Gmail"

### Method 2: Manual Entry

1. Click extension icon
2. Fill in job details manually
3. Optionally add custom details
4. Click "Generate Email with AI"
5. Review and send

## Features

- ✅ Auto-extract job details from LinkedIn
- ✅ AI-powered email generation (Gemini)
- ✅ Customizable resume per application
- ✅ Optional additional details field
- ✅ Gmail integration
- ✅ Editable email before sending
- ✅ Support for both LinkedIn and external job sources

## API Limits (Gemini Free Tier)

- 60 requests per minute
- 1,500 requests per day
- More than enough for job applications!

## Troubleshooting

- **Can't extract from LinkedIn**: Make sure you're on a job posting page
- **API errors**: Verify your Gemini API key in Settings
- **Gmail not opening**: Check popup blockers

## Future Enhancements

- Direct Gmail API integration (no manual review needed)
- Application history tracking
- Response templates
- Multi-language support
  \*/
