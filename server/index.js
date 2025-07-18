require('dotenv').config();


const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { OpenAI } = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const app = express();
const port = process.env.PORT || 5000;

// Environment variables
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY;
const N8N_WEBHOOK_AUTH_TOKEN = process.env.N8N_WEBHOOK_AUTH_TOKEN;
const N8N_WEBHOOK_AUTH_HEADER = process.env.N8N_WEBHOOK_AUTH_HEADER || 'x-n8n-webhook-auth';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Middleware
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create HTTP server for WebSocket
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

// In-memory storage for active jobs and properties
const activeJobs = new Map();
const propertyResults = new Map();

// In-memory storage for lead status
const leadStatus = new Map(); // key: leadId, value: { status: 'new' | 'contacted' | 'automated', ... }

// Helper to get all leads (flatten all propertyResults)
function getAllLeads() {
  let leads = [];
  for (const [jobId, props] of propertyResults.entries()) {
    leads = leads.concat(props.map((lead, idx) => ({ ...lead, jobId, leadId: `${jobId}-${idx}` })));
  }
  return leads;
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Broadcast to all connected WebSocket clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(data));
      } catch (error) {
        console.error('Error broadcasting to client:', error);
      }
    }
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Anderson County Property Scraper',
    timestamp: new Date().toISOString(),
    activeJobs: activeJobs.size 
  });
});

// Start property scraping endpoint
app.post('/api/scraping/start', async (req, res) => {
  try {
    const { minAcres, maxAcres, propertyTypes, counties, waitTime } = req.body;

    if (!counties || !Array.isArray(counties) || counties.length === 0) {
      return res.status(400).json({ error: 'Counties array is required' });
    }

    if (!minAcres || minAcres < 1) {
      return res.status(400).json({ error: 'Minimum acreage must be at least 1' });
    }

    // Generate unique job ID
    const jobId = uuidv4();

    // Store job info
    activeJobs.set(jobId, {
      id: jobId,
      status: 'starting',
      startTime: new Date(),
      totalCounties: counties.length,
      processedCounties: 0,
      minAcres,
      maxAcres,
      propertyTypes: propertyTypes || ['D1', 'E1'],
      counties,
      waitTime: waitTime || 2
    });

    // Initialize property results for this job
    propertyResults.set(jobId, []);

    // Trigger n8n workflow via webhook with authentication
    const n8nWebhookUrl = `${N8N_BASE_URL}/webhook/start-property-scraping`;
    
    const n8nPayload = {
      minAcres: minAcres || 50,
      maxAcres: maxAcres || 10000,
      propertyTypes: propertyTypes || ['D1', 'E1'],
      counties,
      waitTime: waitTime || 2,
      jobId
    };

    console.log('Triggering n8n property workflow:', n8nWebhookUrl);
    console.log('Payload:', JSON.stringify(n8nPayload, null, 2));

    const n8nResponse = await axios.post(n8nWebhookUrl, n8nPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY,
        [N8N_WEBHOOK_AUTH_HEADER]: N8N_WEBHOOK_AUTH_TOKEN
      },
      timeout: 30000
    });

    // Update job status
    const job = activeJobs.get(jobId);
    if (job) {
      job.status = 'running';
      job.n8nExecutionId = n8nResponse.data?.executionId;
    }

    // Broadcast job start to connected clients
    broadcast({
      type: 'job_started',
      jobId,
      totalCounties: counties.length,
      minAcres: minAcres,
      maxAcres: maxAcres,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      jobId,
      message: 'Property scraping job started successfully',
      totalCounties: counties.length
    });

  } catch (error) {
    console.error('Error starting property scraping:', error);
    res.status(500).json({ 
      error: 'Failed to start property scraping job',
      details: error.message 
    });
  }
});

// Stop scraping endpoint
app.post('/api/scraping/stop/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = activeJobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Update job status
    job.status = 'stopped';
    job.endTime = new Date();

    // Broadcast job stop to connected clients
    broadcast({
      type: 'job_stopped',
      jobId,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Scraping job stopped successfully',
      jobId
    });

  } catch (error) {
    console.error('Error stopping scraping:', error);
    res.status(500).json({ 
      error: 'Failed to stop scraping job',
      details: error.message 
    });
  }
});

// Get job status endpoint
app.get('/api/scraping/status/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = activeJobs.get(jobId);
    const properties = propertyResults.get(jobId) || [];

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      job,
      totalProperties: properties.length,
      properties: properties.slice(-10) // Return last 10 properties
    });

  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ 
      error: 'Failed to get job status',
      details: error.message 
    });
  }
});

// Get all active jobs
app.get('/api/scraping/jobs', (req, res) => {
  try {
    const jobs = Array.from(activeJobs.values()).map(job => ({
      ...job,
      totalProperties: (propertyResults.get(job.id) || []).length
    }));

    res.json({
      activeJobs: jobs.length,
      jobs
    });

  } catch (error) {
    console.error('Error getting jobs:', error);
    res.status(500).json({ 
      error: 'Failed to get jobs',
      details: error.message 
    });
  }
});

// Webhook endpoint for receiving status updates from n8n
app.post('/webhook/status-update', (req, res) => {
  try {
    // Verify webhook authentication
    const authHeader = req.headers[N8N_WEBHOOK_AUTH_HEADER.toLowerCase()];
    if (authHeader !== N8N_WEBHOOK_AUTH_TOKEN) {
      console.warn('Unauthorized webhook request - invalid auth token');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, message, processedCount, jobId } = req.body;
    
    console.log('Received status update:', req.body);

    // Update job status if jobId provided
    if (jobId) {
      const job = activeJobs.get(jobId);
      if (job) {
        job.processedCounties = processedCount || job.processedCounties;
        job.lastUpdate = new Date();
      }
    }

    // Broadcast status update to connected clients
    broadcast({
      type: 'status_update',
      message: message || 'Processing Anderson County properties...',
      processedCount: processedCount || 0,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Status update received' });

  } catch (error) {
    console.error('Error handling status update webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook endpoint for receiving property data from n8n
app.post('/webhook/new-properties', (req, res) => {
  try {
    // Verify webhook authentication
    const authHeader = req.headers[N8N_WEBHOOK_AUTH_HEADER.toLowerCase()];
    if (authHeader !== N8N_WEBHOOK_AUTH_TOKEN) {
      console.warn('Unauthorized webhook request - invalid auth token');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, property, jobId } = req.body;
    
    console.log('Received property data:', req.body);

    if (!property || !property.ownerName) {
      console.warn('Invalid property data received:', req.body);
      return res.status(400).json({ error: 'Invalid property data' });
    }

    // Store property data
    if (jobId && propertyResults.has(jobId)) {
      propertyResults.get(jobId).push(property);
    }

    // Update job stats
    if (jobId) {
      const job = activeJobs.get(jobId);
      if (job) {
        const properties = propertyResults.get(jobId) || [];
        job.totalProperties = properties.length;
        job.lastUpdate = new Date();
      }
    }

    // Broadcast new property to connected clients
    broadcast({
      type: 'new_property',
      property: {
        ownerName: property.ownerName,
        propertyAddress: property.propertyAddress,
        acreage: property.acreage,
        mailingAddress: property.mailingAddress,
        propertyValue: property.propertyValue,
        timestamp: property.timestamp || new Date().toISOString()
      }
    });

    res.json({ success: true, message: 'Property data received' });

  } catch (error) {
    console.error('Error handling property webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook endpoint for job completion notifications
app.post('/webhook/job-complete', (req, res) => {
  try {
    // Verify webhook authentication
    const authHeader = req.headers[N8N_WEBHOOK_AUTH_HEADER.toLowerCase()];
    if (authHeader !== N8N_WEBHOOK_AUTH_TOKEN) {
      console.warn('Unauthorized webhook request - invalid auth token');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { jobId, totalProperties, summary } = req.body;
    
    console.log('Received job completion:', req.body);

    // Update job status
    if (jobId) {
      const job = activeJobs.get(jobId);
      if (job) {
        job.status = 'completed';
        job.endTime = new Date();
        job.summary = summary;
      }
    }

    // Broadcast job completion to connected clients
    broadcast({
      type: 'job_complete',
      jobId,
      totalProperties: totalProperties || 0,
      summary: summary || 'Property scraping completed',
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, message: 'Job completion received' });

  } catch (error) {
    console.error('Error handling job completion webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leads?batch=1&size=10
app.get('/api/leads', (req, res) => {
  const batch = parseInt(req.query.batch) || 1;
  const size = parseInt(req.query.size) || 10;
  const allLeads = getAllLeads().filter(l => !leadStatus.get(l.leadId) || leadStatus.get(l.leadId).status === 'new');
  const start = (batch - 1) * size;
  const leads = allLeads.slice(start, start + size);
  res.json({ leads, batch, size, total: allLeads.length });
});

// POST /api/leads/contact
app.post('/api/leads/contact', (req, res) => {
  const { leadIds } = req.body;
  if (!Array.isArray(leadIds)) return res.status(400).json({ error: 'leadIds array required' });
  leadIds.forEach(id => leadStatus.set(id, { status: 'contacted', timestamp: new Date().toISOString() }));
  res.json({ success: true, updated: leadIds.length });
});

// POST /api/leads/automate - Updated for batch data API
app.post('/api/leads/automate', async (req, res) => {
  const { leadIds, batchConfig } = req.body;
  if (!Array.isArray(leadIds)) return res.status(400).json({ error: 'leadIds array required' });
  const allLeads = getAllLeads();
  const selectedLeads = allLeads.filter(l => leadIds.includes(l.leadId));
  let processed = 0, errors = [];
  
  for (const lead of selectedLeads) {
    try {
      // Simulate batch data processing instead of email sending
      const batchData = {
        leadId: lead.leadId,
        ownerName: lead.ownerName,
        propertyAddress: lead.propertyAddress,
        acreage: lead.acreage,
        timestamp: new Date().toISOString(),
        batchConfig: batchConfig || { type: 'lead_export', format: 'json' }
      };
      
      // Log batch data (replace with actual batch API call)
      console.log('Processing lead for batch:', batchData);
      
      leadStatus.set(lead.leadId, { status: 'automated', timestamp: new Date().toISOString() });
      processed++;
    } catch (e) {
      errors.push({ leadId: lead.leadId, error: e.message });
    }
  }
  res.json({ success: true, processed, errors });
});

// POST /api/chat
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: message }],
      max_tokens: 512
    });
    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get response from OpenAI', details: e.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
server.listen(port, () => {
  console.log(`🚀 Anderson County Property Scraper API running on port ${port}`);
  console.log(`📊 WebSocket server running on port ${port}`);
  console.log(`🔗 n8n Base URL: ${N8N_BASE_URL}`);
  console.log(`🎯 Frontend URL: ${FRONTEND_URL}`);
  
  if (!N8N_API_KEY) {
    console.warn('⚠️  Warning: N8N_API_KEY not set');
  }
  
  if (!N8N_WEBHOOK_AUTH_TOKEN) {
    console.warn('⚠️  Warning: N8N_WEBHOOK_AUTH_TOKEN not set');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app; 