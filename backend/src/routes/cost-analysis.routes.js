/**
 * Cost Analysis Routes - AI Photo Analysis
 */

const express = require('express');
const router = express.Router();
const costAnalysisController = require('../controllers/cost-analysis.controller');

// Analyze photo and estimate repair cost
router.post('/analyze', (req, res) => costAnalysisController.analyzePhotoAndEstimateCost(req, res));

module.exports = router;