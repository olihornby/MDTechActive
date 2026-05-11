import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Quiz = () => {
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const data = await api.get('/quiz');
        setQuestions(data || []);
      } catch (error) {
        console.error('Error fetching quiz questions:', error);
      }
    };

    fetchQuestions();
  }, []);

  return (
    <div>
      <h2>Quiz</h2>
      {questions.map((question, index) => (
        <div key={index}>
          <h3>{question.question}</h3>
          <ul>
            {question.options.map((option, idx) => (
              <li key={idx}>{option}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default Quiz;