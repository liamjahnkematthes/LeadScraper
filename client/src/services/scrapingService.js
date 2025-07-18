import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data || error.message);
    
    // Handle specific error cases
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please try again.');
    }
    
    throw error;
  }
);

export const scrapingService = {
  /**
   * Start a new scraping job
   * @param {Object} jobData - The scraping job configuration
   * @param {string[]} jobData.queries - Array of search queries
   * @param {string} jobData.businessType - Type of business to search for
   * @param {string[]} jobData.regions - Array of regions to search in
   * @param {number} jobData.maxResults - Maximum results per query
   * @param {number} jobData.waitTime - Wait time between requests
   * @returns {Promise<Object>} Job information
   */
  async startScraping(jobData) {
    try {
      const response = await api.post('/scraping/start', jobData);
      return response.data;
    } catch (error) {
      console.error('Error starting scraping job:', error);
      throw new Error(error.response?.data?.error || 'Failed to start scraping job');
    }
  },

  /**
   * Stop a running scraping job
   * @param {string} jobId - The job ID to stop
   * @returns {Promise<Object>} Success confirmation
   */
  async stopScraping(jobId) {
    try {
      const response = await api.post(`/scraping/stop/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error stopping scraping job:', error);
      throw new Error(error.response?.data?.error || 'Failed to stop scraping job');
    }
  },

  /**
   * Get the status of a specific scraping job
   * @param {string} jobId - The job ID to check
   * @returns {Promise<Object>} Job status information
   */
  async getJobStatus(jobId) {
    try {
      const response = await api.get(`/scraping/status/${jobId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting job status:', error);
      throw new Error(error.response?.data?.error || 'Failed to get job status');
    }
  },

  /**
   * Get all active scraping jobs
   * @returns {Promise<Object[]>} Array of active jobs
   */
  async getActiveJobs() {
    try {
      const response = await api.get('/scraping/jobs');
      return response.data;
    } catch (error) {
      console.error('Error getting active jobs:', error);
      throw new Error(error.response?.data?.error || 'Failed to get active jobs');
    }
  },

  /**
   * Check API health
   * @returns {Promise<Object>} Health status
   */
  async checkHealth() {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      console.error('Error checking API health:', error);
      throw new Error('API health check failed');
    }
  },

  /**
   * Fetch a batch of leads for review
   * @param {number} batch - Batch number (1-based)
   * @param {number} size - Batch size
   * @returns {Promise<Object>} { leads, batch, size, total }
   */
  async fetchLeadsBatch(batch = 1, size = 10) {
    try {
      const response = await api.get(`/leads?batch=${batch}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching leads batch:', error);
      throw new Error(error.response?.data?.error || 'Failed to fetch leads batch');
    }
  },

  /**
   * Mark leads as contacted manually
   * @param {string[]} leadIds
   * @returns {Promise<Object>} Success confirmation
   */
  async markLeadsContacted(leadIds) {
    try {
      const response = await api.post('/leads/contact', { leadIds });
      return response.data;
    } catch (error) {
      console.error('Error marking leads as contacted:', error);
      throw new Error(error.response?.data?.error || 'Failed to mark leads as contacted');
    }
  },

  /**
   * Send leads for automated outreach (SendGrid)
   * @param {string[]} leadIds
   * @param {Object} emailTemplate - { subject, text, html }
   * @returns {Promise<Object>} Success confirmation
   */
  async automateLeads(leadIds, emailTemplate) {
    try {
      const response = await api.post('/leads/automate', { leadIds, emailTemplate });
      return response.data;
    } catch (error) {
      console.error('Error automating leads:', error);
      throw new Error(error.response?.data?.error || 'Failed to automate leads');
    }
  }
};

export default scrapingService; 