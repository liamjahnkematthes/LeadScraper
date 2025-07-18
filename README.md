# Lead Scraper Pro 🚀

A modern, user-friendly interface for automated Google Maps lead scraping powered by n8n workflow automation.

## Features ✨

- **Real-time Scraping**: Watch emails being discovered in real-time
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS
- **Multiple Business Types**: Choose from preset business types or enter custom ones
- **Flexible Regions**: Select from Utah cities or add custom locations
- **Live Progress Tracking**: Real-time progress dashboard with statistics
- **Email Management**: Search, filter, sort, and bulk copy scraped emails
- **WebSocket Integration**: Real-time updates via WebSocket connection
- **n8n Integration**: Powered by robust n8n workflow automation

## How It Works 🔧

1. **Configure Search**: Select business type and target regions
2. **Start Scraping**: Click "Start Lead Scraping" to begin
3. **Real-time Updates**: Watch progress and results update live
4. **Manage Results**: Search, filter, and export your leads
5. **Download Data**: Export results as CSV for further use

## Architecture 🏗️

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │  Express API    │    │  n8n Workflow   │
│                 │    │                 │    │                 │
│ • Form Input    │◄──►│ • WebSocket     │◄──►│ • Google Maps   │
│ • Real-time     │    │ • REST API      │    │ • Web Scraping  │
│ • Results       │    │ • Job Management│    │ • Email Extract │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Setup Instructions 🛠️

### Prerequisites

- Node.js (v16 or higher)
- n8n installed and running
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd LeadScraper
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (root, server, and client)
npm run install-all
```

### 3. Set Up Authentication

#### 3.1 Create n8n API Key
1. Open your n8n instance (usually http://localhost:5678)
2. Go to **Settings > n8n API**
3. Click **Create an API key**
4. Copy the API key for use in your `.env` file

#### 3.2 Generate Webhook Authentication Token
Generate a secure random token for webhook authentication:
```bash
# Using OpenSSL (recommended)
openssl rand -hex 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 3.3 Configure n8n Webhook Authentication
1. In your n8n instance, go to **Settings > Credentials**
2. Click **Add Credential** and select **Header Auth**
3. Create a new credential with:
   - **Name**: `Webhook Authentication`
   - **Name**: `x-n8n-webhook-auth`
   - **Value**: The token you generated in Step 3.2
4. Save the credential

#### 3.4 Set up n8n Environment Variables (Enterprise Only)
**Note**: n8n Cloud free tier doesn't support environment variables. The workflow has been configured with hardcoded authentication tokens.

If you have n8n Enterprise, you can optionally set up:
1. Go to **Settings > Variables**
2. Add a new variable:
   - **Key**: `WEBHOOK_AUTH_TOKEN`
   - **Value**: The same token you generated in Step 3.2

### 4. Configure n8n Workflow

1. Import the `New Leads Workflow.json` file into your n8n instance
2. **Important**: Assign the "Webhook Authentication" credential to the "Start Scraping Webhook" node
3. Make sure n8n is running on `http://localhost:5678`
4. Activate the workflow in n8n

### 5. Environment Variables

Create a `.env` file in the root directory (copy from `env.example`):

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# n8n Configuration
N8N_BASE_URL=http://localhost:5678
N8N_API_KEY=your_n8n_api_key_from_step_3.1
N8N_WEBHOOK_AUTH_TOKEN=your_secure_token_from_step_3.2
N8N_WEBHOOK_AUTH_HEADER=x-n8n-webhook-auth
```

**Security Note**: 
- Never commit your `.env` file to version control
- Use strong, randomly generated tokens
- These tokens must match between your `.env` file and n8n configuration

### 6. Start the Application

```bash
# Development mode (runs both server and client)
npm run dev

# Or run separately:
npm run server  # Backend only
npm run client  # Frontend only
```

### 7. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **WebSocket**: ws://localhost:5000/ws

## API Endpoints 📡

### REST API

- `GET /api/health` - Health check
- `POST /api/scraping/start` - Start scraping job
- `POST /api/scraping/stop/:jobId` - Stop scraping job
- `GET /api/scraping/status/:jobId` - Get job status
- `GET /api/scraping/jobs` - Get all active jobs

### Webhook Endpoints (for n8n)

- `POST /webhook/status-update` - Receive status updates
- `POST /webhook/new-emails` - Receive new email notifications
- `POST /webhook/job-complete` - Receive job completion notifications

## n8n Workflow Configuration 🔄

The workflow includes these key components:

1. **Webhook Trigger**: Receives job start requests from UI
2. **Query Processing**: Converts UI input to search queries
3. **Google Maps Search**: Searches for businesses
4. **URL Extraction**: Extracts website URLs from results
5. **Web Scraping**: Visits each website to find emails
6. **Email Filtering**: Removes duplicates and invalid emails
7. **Status Updates**: Sends real-time updates to UI
8. **Results Storage**: Saves to Google Sheets (optional)

## Customization Options 🎨

### Business Types

Add more business types in `client/src/components/LeadScraperForm.js`:

```javascript
const BUSINESS_TYPES = [
  'your-business-type',
  // ... existing types
];
```

### Regions

Add more regions in the same file:

```javascript
const REGIONS = [
  'Your City, State',
  // ... existing regions
];
```

### Styling

The UI uses Tailwind CSS with custom color schemes defined in `client/tailwind.config.js`.

## Troubleshooting 🔧

### Common Issues

1. **WebSocket Connection Failed**
   - Check if backend server is running
   - Verify WebSocket URL in `client/src/hooks/useWebSocket.js`

2. **n8n Workflow Not Triggering**
   - Ensure n8n is running on correct port
   - Check webhook URLs in workflow match server endpoints
   - Verify workflow is activated in n8n

3. **No Emails Found**
   - Check if Google Maps returns results for your queries
   - Verify website URLs are accessible
   - Review email regex pattern in n8n workflow

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment.

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License 📄

This project is licensed under the MIT License - see the LICENSE file for details.

## Support 💬

For support and questions:
- Check the troubleshooting section
- Review n8n documentation
- Create an issue in the repository

## Acknowledgments 🙏

- Built with [React](https://reactjs.org/)
- Powered by [n8n](https://n8n.io/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide React](https://lucide.dev/)

---

**⚠️ Disclaimer**: This tool is for educational purposes. Always respect robots.txt files and website terms of service when scraping data. 