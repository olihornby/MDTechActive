const express = require('express');
const router = express.Router();
const LeaderboardEntry = require('../models/LeaderboardEntry');

// Get leaderboard entries
router.get('/', async (req, res) => {
  try {
    const leaderboard = await LeaderboardEntry.find().sort({ score: -1 });
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard entries' });
  }
});

// Add a new leaderboard entry
router.post('/', async (req, res) => {
  try {
    const { username, score } = req.body;
    const newEntry = new LeaderboardEntry({ username, score });
    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add leaderboard entry' });
  }
});

module.exports = router;