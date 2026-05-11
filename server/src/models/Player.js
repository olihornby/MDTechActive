const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    roomCode: { type: String, required: true },
    score: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Player', playerSchema);