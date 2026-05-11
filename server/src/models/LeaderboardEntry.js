const mongoose = require('mongoose');

const leaderboardEntrySchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    score: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeaderboardEntry', leaderboardEntrySchema);