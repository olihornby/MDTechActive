const mongoose = require('mongoose');

const gameRoomSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true },
    host: { type: String, required: true },
    timeLimit: { type: Number, required: true },
    minigameType: { type: String, required: true },
    questionTypes: [{ type: String }],
    startedAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    shutdownAt: { type: Date },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GameRoom', gameRoomSchema);