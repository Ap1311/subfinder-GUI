const express = require('express');
const path = require('path');
const dns = require('dns');
const axios = require('axios');
const app = express();

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON data from incoming requests
app.use(express.json());

// DNS Query to discover subdomains
const getSubdomainsFromDNS = async (domain) => {
    return new Promise((resolve, reject) => {
        dns.resolve(domain, 'A', (err, records) => {
            if (err) reject(err);
            resolve(records);
        });
    });
};

// Query a third-party API to discover subdomains (e.g., for public sources)
const getSubdomainsFromAPI = async (domain) => {
    try {
        const response = await axios.get(`https://api.hackertarget.com/hostsearch/?q=${domain}`);
        return response.data.split('\n').map(line => line.split(',')[0]);
    } catch (error) {
        return [];
    }
};

// Main API route to discover subdomains
app.post('/enumerate', async (req, res) => {
    const domain = req.body.domain;
    let results = [];

    try {
        // Step 1: DNS enumeration
        const dnsSubdomains = await getSubdomainsFromDNS(domain);
        results = [...results, ...dnsSubdomains];

        // Step 2: Third-party API enumeration
        const apiSubdomains = await getSubdomainsFromAPI(domain);
        results = [...results, ...apiSubdomains];

        res.json({ results });
    } catch (error) {
        res.status(500).json({ error: 'Error enumerating subdomains' });
    }
});

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = 8080;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
