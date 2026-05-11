const express = require('express');
const router = express.Router();
const QuizQuestion = require('../models/QuizQuestion');

// Get all quiz questions
router.get('/', async (req, res) => {
  try {
    const questions = await QuizQuestion.find();
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quiz questions' });
  }
});

module.exports = router;