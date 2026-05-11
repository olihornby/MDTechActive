import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [username, setUsername] = useState('');
  const [score, setScore] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const data = await api.get('/leaderboard');
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newEntry = { username, score: parseInt(score, 10) };
      await api.post('/leaderboard', newEntry);
      setUsername('');
      setScore('');
      fetchLeaderboard();
    } catch (error) {
      console.error('Error adding leaderboard entry:', error);
    }
  };

  return (
    <div>
      <h2>Leaderboard</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Enter score"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          required
        />
        <button type="submit">Add to Leaderboard</button>
      </form>
      <ul>
        {leaderboard.map((entry, index) => (
          <li key={index}>
            {entry.username}: {entry.score}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Leaderboard;