require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// CORS middleware - Add this BEFORE other middleware
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Middleware to parse JSON
app.use(express.json());

// /ask-claude endpoint
app.post('/ask-claude', async (req, res) => {
    const userPrompt = req.body.prompt;
    
    if (!userPrompt) {
        return res.status(400).json({ error: 'Missing prompt in request body.' });
    }
    
    const apiKey = process.env.CLAUDE_API_KEY;
    
    // DEBUG: Log key info (first/last 8 chars only for security)
    if (apiKey) {
        console.log('API Key loaded. Length:', apiKey.length, 'Preview:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 8));
    } else {
        console.log('API Key is undefined or empty!');
    }
    
    if (!apiKey) {
        return res.status(500).json({ error: 'CLAUDE_API_KEY is not set in environment.' });
    }
    
    try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: userPrompt
                    }
                ]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Claude API error:', errorData);
            return res.status(response.status).json({ 
                error: 'Claude API error', 
                details: errorData 
            });
        }
        
        const data = await response.json();
        const completion = data.content?.[0]?.text || '';
        
        res.json({ completion });
        
    } catch (err) {
        console.error('Claude API error:', err);
        res.status(500).json({ error: 'Claude API error', details: err.message });
    }
});

// Test endpoint
app.get('/', (req, res) => {
    res.send('Aldrich AI Backend is running.');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});