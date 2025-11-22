# Velocity Logic - Automated Quoting Agent

A production-ready, headless AI agent for automated quoting that monitors Gmail, parses email intent using OpenAI, checks pricing data, generates PDF quotes, and creates Gmail draft replies.

## Features

- 📧 **Gmail Integration**: Monitors inbox and creates draft replies
- 🤖 **AI-Powered Parsing**: Uses OpenAI GPT-4o to extract customer intent
- 💰 **Smart Pricing**: Fuzzy matching against pricing database
- 📄 **Professional PDFs**: Branded quote generation with Velocity Logic styling
- 🔄 **Continuous Monitoring**: Runs continuously, checking for new emails every 60 seconds

## Tech Stack

- **Python 3.9+**
- **OpenAI API** (`openai`)
- **Gmail API** (`google-api-python-client`, `google-auth-oauthlib`)
- **Pandas** (`pandas`)
- **FPDF** (`fpdf`)
- **TheFuzz** (`thefuzz`) for fuzzy string matching

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy the `.env.template` file to `.env` and add your OpenAI API key:

```bash
cp .env.template .env
```

Edit `.env`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Google OAuth Setup (Optional)

For Gmail integration:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials (Desktop app)
5. Download the credentials JSON file
6. Save it as `credentials.json` in the project root

**Note**: If `credentials.json` is not found, the agent will run in Mock Mode, simulating email operations without actually accessing Gmail.

### 4. Pricing Data

The pricing data is stored in `data/pricing.csv`. You can customize this file with your own services and prices.

## Usage

### Run Continuously

```bash
python main.py
```

The agent will:
- Check for new unread emails every 60 seconds
- Process each email through the full workflow
- Create Gmail drafts with PDF quotes attached

### Test Mode

Test the agent with a sample email:

```bash
python main.py --test
```

## Project Structure

```
velocity-logic-agent/
├── main.py                 # Main orchestration script
├── services/
│   ├── llm_service.py      # OpenAI integration
│   ├── pricing_engine.py   # Pricing calculations
│   ├── pdf_service.py      # PDF generation
│   └── gmail_service.py    # Gmail API integration
├── data/
│   └── pricing.csv         # Pricing database
├── output/                 # Generated PDFs (created automatically)
├── .env                    # Environment variables (create from template)
├── credentials.json        # Google OAuth credentials (optional)
├── token.pickle           # OAuth token cache (created automatically)
└── requirements.txt        # Python dependencies
```

## Workflow

1. **Email Monitoring**: Checks Gmail for unread messages
2. **Intent Parsing**: Uses OpenAI to extract customer name, services, and quantities
3. **Pricing**: Fuzzy matches services to pricing database and calculates totals
4. **PDF Generation**: Creates professional branded quote PDF
5. **Draft Creation**: Creates Gmail draft reply with PDF attached (does not send)

## Customization

### Pricing Data

Edit `data/pricing.csv` to add/modify services. Columns:
- `Service Name`: Primary service name
- `Keywords`: Comma-separated keywords for fuzzy matching
- `Unit Price`: Price per unit
- `Unit`: Unit type (Each, Hour, etc.)
- `Description`: Service description

### Branding

Edit `services/pdf_service.py` to customize:
- Company name
- Colors (Navy Blue: `#0f172a`, Teal: `#2dd4bf`)
- Layout and styling

### Email Templates

Edit the `_generate_email_body()` method in `main.py` to customize email content.

## Error Handling

The agent includes robust error handling:
- Missing credentials → Runs in Mock Mode
- API failures → Logs errors and continues
- Invalid pricing matches → Warns and continues with zero price
- PDF generation errors → Logs and skips

## License

Proprietary - Velocity Logic

