import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';

const QUESTION_TYPE_OPTIONS = [
  { id: 'multiple-choice', label: 'Multiple Choice (Single Answer)' },
  { id: 'true-false', label: 'True / False' },
  { id: 'select-all', label: 'Select All That Apply' },
  { id: 'order-steps', label: 'Order the Steps' },
  { id: 'match-role', label: 'Match the Role' },
  { id: 'scenario-choice', label: 'Scenario Choice' },
  { id: 'short-answer', label: 'Type the Answer' },
];

const HostGame = () => {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState('HostUser');
  const [timeLimit, setTimeLimit] = useState(5);
  const [minigameType, setMinigameType] = useState('tower-defence');
  const [questionTypes, setQuestionTypes] = useState(
    QUESTION_TYPE_OPTIONS.map((option) => option.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    const normalizedHostName = hostName.trim();

    if (!normalizedHostName) {
      setError('Host name is required.');
      return;
    }

    if (!Number.isFinite(Number(timeLimit)) || Number(timeLimit) < 1) {
      setError('Timer length must be at least 1 minute.');
      return;
    }

    if (!questionTypes.length) {
      setError('Select at least one question type.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const response = await api.post('/game-room/create', {
        host: normalizedHostName,
        timeLimit: Number(timeLimit),
        minigameType,
        questionTypes,
      });

      const createdRoomCode = response.room?.roomCode;
      navigate(`/host/${createdRoomCode}`);
    } catch (error) {
      setError(error.message || 'Error creating game room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100 app-shell">
      <Navbar />
      <main id="main-content" className="container py-5 theme-page flex-grow-1" tabIndex={-1}>
        <h1 className="mb-4">Host a Game</h1>

        {error ? <p id="host-form-error" className="text-danger" role="alert">{error}</p> : null}

        <div className="row g-3 mb-3">
        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="host-name">Host Name</label>
          <input
            id="host-name"
            type="text"
            className="form-control"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            autoComplete="name"
            aria-describedby={error ? 'host-form-error' : undefined}
          />
        </div>



        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="host-time-limit">Timer Length (minutes)</label>
          <input
            id="host-time-limit"
            type="number"
            className="form-control"
            min="1"
            max="180"
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            aria-describedby={error ? 'host-form-error' : undefined}
          />
        </div>

        <div className="col-12 col-md-6">
          <label className="form-label" htmlFor="host-mode">Mode</label>
          <select
            id="host-mode"
            className="form-select"
            value={minigameType}
            onChange={(e) => setMinigameType(e.target.value)}
          >
            <option value="tower-defence">Tower Defence</option>
            <option value="factory">Factory</option>
            <option value="one-on-one">One on One</option>
          </select>
        </div>

        <div className="col-12">
          <fieldset className="border rounded-3 p-3">
            <legend className="float-none w-auto px-2 h6 mb-3">Question Types</legend>
            <div className="row g-2">
              {QUESTION_TYPE_OPTIONS.map((option) => {
                const inputId = `question-type-${option.id}`;
                const isChecked = questionTypes.includes(option.id);
                return (
                  <div className="col-12 col-md-6" key={option.id}>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={inputId}
                        checked={isChecked}
                        onChange={(event) => {
                          setQuestionTypes((prev) => {
                            if (event.target.checked) {
                              return [...prev, option.id];
                            }
                            return prev.filter((value) => value !== option.id);
                          });
                        }}
                      />
                      <label className="form-check-label" htmlFor={inputId}>
                        {option.label}
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>
        </div>
      </div>

        <button type="button" className="btn btn-primary" onClick={handleCreateRoom} disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Room'}
        </button>
      </main>
    </div>
  );
};

export default HostGame;
