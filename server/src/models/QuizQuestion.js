const mongoose = require('mongoose');

const quizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('QuizQuestion', quizQuestionSchema);