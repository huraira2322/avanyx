const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
const search = /\/\/ 3\. AVANYX AI INTERNAL EVALUATION BENCHMARK SUITE/g;
const replacement = // 2b. Demand Forecaster Endpoint
  app.post('/api/ai/forecast', async (req, res) => {
    const { businessContext, tenantId, userId } = req.body;
    const requestId = \eq-fcst-\\;
    
    try {
      const wallet = await AvanyxCreditSystem.getWallet(userId);
      if (wallet && wallet.isSuspended) {
        return res.status(403).json({ success: false, error: 'ACCOUNT_SUSPENDED' });
      }
    } catch (err) {}
  
    const prompt = \You are the Avanyx AI Demand Forecaster.
  Analyze the provided business context, specifically "salesHistory" and "products".
  
  CRITICAL RULES:
  1. NO FAKE DATA. Do not invent fake "rush hours", peak times, or sales numbers if the salesHistory does not support it.
  2. If the salesHistory is empty or contains too few transactions to confidently predict a weekly forecast (e.g. less than 3 real sales), you MUST set "hasEnoughData": false and provide a reason.
  3. If there is sufficient data, calculate realistic projections based strictly on the provided ledger.
  4. Stockout Risks: Calculate daysRemaining based on actual item sales velocity.
  5. Output STRICT JSON only. No markdown formatting.
  
  Format:
  {
    "hasEnoughData": boolean,
    "reason": "If false, explain why (e.g. 'Not enough sales data to generate a forecast yet.')",
    "forecastDays": [
      { "day": "Monday", "expectedRevenue": 150, "confidence": 85 }
    ],
    "hourlyRush": [
      { "time": "08:00 - 11:59", "label": "Morning", "probability": 20 },
      { "time": "12:00 - 14:59", "label": "Lunch", "probability": 40 },
      { "time": "15:00 - 17:59", "label": "Afternoon", "probability": 15 },
      { "time": "18:00 - 22:00", "label": "Evening", "probability": 25 }
    ],
    "projectedOutcome": {
      "projectedRev": 4500,
      "projectedMargin": 35
    },
    "stockoutRisks": [
      { "id": "sku-id", "name": "Product Name", "stock": 10, "daysRemaining": 5 } 
    ]
  }
  
  BUSINESS CONTEXT:
  \\;
  
    const routerRequest = {
      engineId: 'avanyx-brain',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      maxTokens: 3000,
      userId: userId || 'default-user',
      requestId,
    };
  
    try {
      const result = await routeAIRequest(routerRequest);
      let parsed;
      try {
        const text = result.content.replace(/\\\json/gi, '').replace(/\\\/g, '').trim();
        parsed = JSON.parse(text);
      } catch (e) {
        parsed = { hasEnoughData: false, reason: "AI failed to parse ledger data." };
      }
      return res.json({ success: true, ...parsed });
    } catch (error) {
      return res.json({ success: false, error: error.message });
    }
  });

  // 3. AVANYX AI INTERNAL EVALUATION BENCHMARK SUITE;
content = content.replace(search, replacement);
fs.writeFileSync('server.ts', content);
console.log('Patched');
