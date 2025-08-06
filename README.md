# Time Entry Automation Chrome Extension

A Chrome Extension designed to automate the process of creating time entries by leveraging the power of a large language model (LLM). This extension intercepts existing endpoints that are called on ClickTime to take relevant Job, Task, Calendar, and Jira information, which it then uses to generate (hopefully) intelligent time entry suggestions.

## ✨ Features

* **Data Scraping:** Automatically extracts calendar events, jobs, and tasks from the current webpage using an injected script.
* **LLM Integration:** Sends contextual data to the Google Gemini API to get time entry suggestions in a structured JSON format.
  * The LLM of choice can be changed! I've separated the logic into the callLLM.ts file.
* **Persistent Logic:** Handles all long-running API calls in a dedicated background script to prevent interruptions.
* **Secure Messaging:** Uses a secure and robust messaging system to ensure communication between different parts of the extension is safe and reliable.

## 🚀 Getting Started

### Prerequisites

* Node.js (LTS version recommended)
* npm (comes with Node.js)
* An AI API Key, this is currently using Googles AI studio key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [your-repo-url]
    cd [your-repo-name]
    ```

2.  **Run setup script**
    ```bash
    npm setup
    ```
    
3.  **Create a Google AI API key**
    * Go to https://aistudio.google.com/apikey
    * Click "Create API Key"
    * Copy that key to be used in step 4... 
    
4.  **Add a .env file**
    * In the root directory, add a .env file
    * In that file add two variables
      * CLICKTIME_AUTH_TOKEN={YOUR_TOKEN}
      * AI_API_KEY={YOUR_GOOGLE_AI_STUDIO_KEY} 

5.  **Set up the Extension in Chrome:**
    * Open Chrome and navigate to `chrome://extensions`.
    * Enable **Developer mode** in the top-right corner.
    * Click **Load unpacked**.
    * Select the repo folder from your project directory.


## 🧠 Architecture

The extension follows a standard Chrome Extension architecture with a focus on reliable messaging between different contexts.

* **Content Script:** The main content script, which is injected into the webpage, is responsible for:
    1.  Injecting `injected.js` into the page to access the DOM.
    2.  Acting as a bridge to forward messages from the injected script to the background script using `chrome.runtime.sendMessage`.

* **Injected Script:** This script runs in the webpage's context, allowing it to scrape data directly from the DOM (e.g., calendar entries, job IDs). It uses `window.postMessage` to send this data to the content script.

* **Background Script:** The persistent core of the extension. It listens for messages from the content script and is responsible for:
    1.  Storing data from the webpage using `chrome.storage.local`.
    2.  Making the API call to the Google Gemini LLM.
    3.  Sending the LLM's response back to the popup or another script.

* **Popup Script:** The user interface. It triggers the LLM call via a message to the background script and displays the generated time entry suggestions to the user.

## 🤝 Contributing

Contributions are welcome! It would be cool if people wanted to contribute to this lil side guy.
