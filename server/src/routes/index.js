const express = require('express');

const router = express.Router();

const healthRoutes = require('./healthRoutes');
const quizRoutes = require('./quizRoutes');
const leaderboardRoutes = require('./leaderboardRoutes');
const gameRoomRoutes = require('./gameRoomRoutes');
const sampleItemRoutes = require('./sampleItemRoutes');

router.use('/health', healthRoutes);
router.use('/quiz', quizRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/game-room', gameRoomRoutes);
router.use('/sample-items', sampleItemRoutes);

module.exports = router;
