# Velocity Logic Agent - Setup Guide

This guide will help you configure the external services required for the Velocity Logic Agent to function fully.

## 1. OpenAI API Key (The Brain)

The agent uses OpenAI (GPT-4) to understand customer emails and extract intent.

1.  **Sign Up/Login**: Go to [platform.openai.com](https://platform.openai.com/).
2.  **Create Key**: Navigate to **API Keys** in the sidebar.
3.  **Generate**: Click **"Create new secret key"**.
4.  **Copy**: Copy the key (starts with `sk-...`).
5.  **Configure**:
    - Open the `.env` file in the project root.
    - Paste your key: `OPENAI_API_KEY=sk-your-key-here`.

## 2. Google Gmail API (The Ears)

The agent uses the Gmail API to read incoming emails and create drafts.

### Step A: Create Google Cloud Project
1.  Go to [console.cloud.google.com](https://console.cloud.google.com/).
2.  Create a **New Project** (e.g., "Velocity Logic Agent").

### Step B: Enable Gmail API
1.  In the sidebar, go to **APIs & Services > Library**.
2.  Search for **"Gmail API"**.
3.  Click **Enable**.

### Step C: Configure OAuth Consent Screen
1.  Go to **APIs & Services > OAuth consent screen**.
2.  Select **External** (unless you have a Google Workspace organization).
3.  Fill in required fields (App Name, Support Email).
4.  **Scopes**: Add `.../auth/gmail.compose` and `.../auth/gmail.readonly`.
5.  **Test Users**: Add your own email address (important for testing).

### Step D: Create Credentials
1.  Go to **APIs & Services > Credentials**.
2.  Click **Create Credentials > OAuth client ID**.
3.  Application type: **Desktop app**.
4.  Name: "Velocity Logic Agent".
5.  Click **Create**.
6.  **Download JSON**: Click the download icon (⬇️) to download the `client_secret_....json` file.
7.  **Rename & Move**:
    - Rename the file to `credentials.json`.
    - Move it to the project root folder: `/Users/emilyfehr8/CascadeProjects/ai agent test/velocity-logic-agent/credentials.json`.

### Step E: First Run
1.  Restart the backend server (`python3 web_interface.py`).
2.  The terminal will prompt you to visit a URL to authorize the app.
3.  Click the link, log in with your Google account, and allow access.
4.  A `token.pickle` file will be created, and you won't need to log in again.

## 3. Verify Installation
1.  Go to the **Dashboard**.
2.  Check the **Agent Status** card. It should say **Active** (Green).
3.  Send a test email to your connected account.
4.  Watch the **Activity Feed** for "Email Received".
