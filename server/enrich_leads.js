// Required modules
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const INPUT_CSV = path.join(__dirname, '../Texas Real Estate Leads - Demo - Sheet1.csv');
const OUTPUT_CSV = path.join(__dirname, '../Texas_Leads_With_Emails.csv');
const PDL_API_KEY = process.env.PDL_API_KEY;
const PDL_URL = 'https://api.peopledatalabs.com/v5/person/enrich';

async function enrichLead(name, address) {
  // Try to split name into first and last
  let first_name = '', last_name = '';
  if (name.includes(',')) {
    // Format: LAST, FIRST
    [last_name, first_name] = name.split(',').map(s => s.trim());
  } else {
    // Try to split by space
    const parts = name.trim().split(' ');
    first_name = parts[0] || '';
    last_name = parts.slice(1).join(' ') || '';
  }

  const data = {
    first_name,
    last_name,
    location: address.replace(/\n/g, ', '),
    pretty: true,
    include_if_matched: true,
    required: 'emails',
  };

  try {
    const response = await axios.post(PDL_URL, data, {
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': PDL_API_KEY,
      },
      timeout: 15000,
    });
    return response.data;
  } catch (err) {
    return { error: err.response ? err.response.data : err.message };
  }
}

async function processLeads() {
  const leads = [];
  let count = 0;
  const MAX_LEADS = 5; // Process only 5 at a time

  return new Promise((resolve, reject) => {
    fs.createReadStream(INPUT_CSV)
      .pipe(csv())
      .on('data', (row) => {
        if (count < MAX_LEADS) {
          const name = row['Name'] || '';
          const address = row['Mailing Address'] || '';
          if (name && address) {
            leads.push({ name, address, rowNumber: count + 1 });
            count++;
          }
        }
      })
      .on('end', async () => {
        console.log(`\n=== Processing ${leads.length} leads ===\n`);
        
        const results = [];
        for (let i = 0; i < leads.length; i++) {
          const lead = leads[i];
          console.log(`[${i + 1}/${leads.length}] Enriching: ${lead.name}`);
          console.log(`Address: ${lead.address.replace(/\n/g, ', ')}`);
          
          const enriched = await enrichLead(lead.name, lead.address);
          
          // Log the full response to see what we're getting
          console.log('PDL Response:', JSON.stringify(enriched, null, 2));
          
          let emails = '';
          let phones = '';
          let pdlStatus = 'No match';
          
          if (enriched && !enriched.error) {
            // Check for emails
            if (enriched.emails && Array.isArray(enriched.emails) && enriched.emails.length > 0) {
              emails = enriched.emails.map(e => e.address).join('; ');
            }
            
            // Check for phone numbers
            if (enriched.phone_numbers && Array.isArray(enriched.phone_numbers) && enriched.phone_numbers.length > 0) {
              phones = enriched.phone_numbers.map(p => p.number).join('; ');
            }
            
            if (emails || phones) {
              pdlStatus = 'Match found';
            }
          } else if (enriched.error) {
            pdlStatus = `Error: ${JSON.stringify(enriched.error)}`;
          }
          
          results.push({
            RowNumber: lead.rowNumber,
            Name: lead.name,
            Address: lead.address.replace(/\n/g, ', '),
            Emails: emails || 'No email found',
            Phones: phones || 'No phone found',
            PDLStatus: pdlStatus,
          });
          
          console.log(`Result: Emails=${emails || 'None'}, Phones=${phones || 'None'}`);
          console.log('---\n');
          
          // Add a small delay between requests to be respectful to the API
          if (i < leads.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // Write to output CSV
        const csvWriter = createCsvWriter({
          path: OUTPUT_CSV,
          header: [
            { id: 'RowNumber', title: 'Row #' },
            { id: 'Name', title: 'Name' },
            { id: 'Address', title: 'Address' },
            { id: 'Emails', title: 'Emails' },
            { id: 'Phones', title: 'Phones' },
            { id: 'PDLStatus', title: 'PDL Status' },
          ],
        });
        await csvWriter.writeRecords(results);
        console.log(`\n=== COMPLETE ===`);
        console.log(`Results written to: ${OUTPUT_CSV}`);
        console.log(`Processed ${results.length} leads`);
        resolve();
      })
      .on('error', reject);
  });
}

if (require.main === module) {
  processLeads().catch(err => {
    console.error('Error:', err);
  });
} 