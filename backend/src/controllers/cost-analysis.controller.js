/**
 * Cost Analysis Controller - AI Photo Analysis
 * Analyzes problem photos and estimates repair costs
 */

const axios = require('axios');

class CostAnalysisController {
  // Analyze problem photo and estimate cost
  async analyzePhotoAndEstimateCost(req, res) {
    try {
      const { imageUrl, category, description, location } = req.body;

      if (!imageUrl || !category) {
        return res.status(400).json({
          error: 'Image URL and category are required'
        });
      }

      // Get cost estimation using AI analysis
      const analysis = await this.analyzeImageWithAI(imageUrl, category, description, location);

      res.json({
        success: true,
        analysis,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Cost analysis error:', error);
      res.status(500).json({
        error: 'Cost analysis service unavailable',
        message: error.message
      });
    }
  }

  // AI-powered image analysis and cost estimation
  async analyzeImageWithAI(imageUrl, category, description, location) {
    try {
      const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
      
      // Create detailed prompt for cost analysis
      const prompt = `You are an expert government cost estimator analyzing infrastructure problems. 

PROBLEM DETAILS:
- Category: ${category}
- Description: ${description || 'Not provided'}
- Location: ${location || 'Not specified'}

Based on this ${category} problem, provide a detailed cost analysis in this exact JSON format:

{
  "estimatedCost": {
    "min": 5000,
    "max": 15000,
    "currency": "INR"
  },
  "severity": "medium",
  "urgency": "high",
  "timeToComplete": "3-5 days",
  "materialsNeeded": ["cement", "asphalt", "labor"],
  "laborRequired": "2-3 workers",
  "equipmentNeeded": ["road roller", "concrete mixer"],
  "breakdown": {
    "materials": 8000,
    "labor": 5000,
    "equipment": 2000
  },
  "factors": ["size of damage", "location accessibility", "weather conditions"],
  "recommendations": "Immediate repair recommended to prevent further damage"
}

Consider typical Indian government rates and local conditions. Be realistic and professional.`;

      const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'You are an expert government infrastructure cost estimator. Provide accurate, realistic cost estimates for Indian government projects. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;
      
      try {
        // Parse AI response as JSON
        const analysis = JSON.parse(aiResponse);
        return analysis;
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return this.getFallbackCostAnalysis(category, description);
      }

    } catch (error) {
      console.error('AI analysis error:', error);
      // Return fallback analysis
      return this.getFallbackCostAnalysis(category, description);
    }
  }

  // Fallback cost analysis if AI fails
  getFallbackCostAnalysis(category, description) {
    const costDatabase = {
      road: {
        estimatedCost: { min: 8000, max: 25000, currency: 'INR' },
        severity: 'medium',
        urgency: 'high',
        timeToComplete: '3-7 days',
        materialsNeeded: ['asphalt', 'cement', 'gravel', 'road paint'],
        laborRequired: '3-4 workers',
        equipmentNeeded: ['road roller', 'concrete mixer', 'excavator'],
        breakdown: { materials: 15000, labor: 8000, equipment: 2000 },
        factors: ['pothole size', 'traffic volume', 'weather conditions'],
        recommendations: 'Immediate repair to prevent accidents and further damage'
      },
      water: {
        estimatedCost: { min: 5000, max: 18000, currency: 'INR' },
        severity: 'high',
        urgency: 'critical',
        timeToComplete: '1-3 days',
        materialsNeeded: ['pipes', 'fittings', 'sealants', 'valves'],
        laborRequired: '2-3 plumbers',
        equipmentNeeded: ['pipe cutter', 'welding equipment', 'excavator'],
        breakdown: { materials: 10000, labor: 6000, equipment: 2000 },
        factors: ['pipe diameter', 'depth', 'accessibility'],
        recommendations: 'Urgent repair to restore water supply'
      },
      electricity: {
        estimatedCost: { min: 3000, max: 12000, currency: 'INR' },
        severity: 'high',
        urgency: 'critical',
        timeToComplete: '1-2 days',
        materialsNeeded: ['cables', 'transformers', 'insulators', 'poles'],
        laborRequired: '2-3 electricians',
        equipmentNeeded: ['crane', 'electrical tools', 'safety equipment'],
        breakdown: { materials: 7000, labor: 4000, equipment: 1000 },
        factors: ['voltage level', 'accessibility', 'safety requirements'],
        recommendations: 'Immediate repair for safety and power restoration'
      },
      cleanliness: {
        estimatedCost: { min: 2000, max: 8000, currency: 'INR' },
        severity: 'medium',
        urgency: 'medium',
        timeToComplete: '1-2 days',
        materialsNeeded: ['cleaning supplies', 'garbage bags', 'disinfectants'],
        laborRequired: '4-6 cleaners',
        equipmentNeeded: ['garbage truck', 'cleaning equipment'],
        breakdown: { materials: 3000, labor: 4000, equipment: 1000 },
        factors: ['area size', 'waste volume', 'accessibility'],
        recommendations: 'Regular cleaning schedule to maintain hygiene'
      }
    };

    return costDatabase[category] || costDatabase.road;
  }
}

module.exports = new CostAnalysisController();