import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';

const formatTime = (seconds) => {
  const safe = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(safe / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(safe % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
};

const formatEventTime = (date = new Date()) =>
  date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

const HostDashboard = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnding, setIsEnding] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [activityLog, setActivityLog] = useState([]);

  const timerRemainingSeconds = room?.endsAt
    ? Math.max(0, Math.floor((new Date(room.endsAt).getTime() - now) / 1000))
    : stats?.timerRemainingSeconds || 0;

  const loadDashboardData = async ({ isInitial = false } = {}) => {
    try {
      if (isInitial) {
        setLoading(true);
      }

      const [roomData, leaderboardData, statsData] = await Promise.all([
        api.get(`/game-room/${roomCode}`),
        api.get(`/game-room/${roomCode}/leaderboard`),
        api.get(`/game-room/${roomCode}/stats`),
      ]);

      setRoom(roomData);
      const nextPlayers = roomData.players || [];
      setPlayers(nextPlayers);
      setLeaderboard(leaderboardData || []);
      setStats(statsData);
      setError('');

      setActivityLog((previousLog) => {
        if (isInitial && players.length === 0) {
          return previousLog;
        }

        const prevPlayersById = new Map(players.map((player) => [String(player._id), player]));
        const nextPlayersById = new Map(nextPlayers.map((player) => [String(player._id), player]));
        const newEvents = [];

        nextPlayers.forEach((player) => {
          const playerId = String(player._id);
          const previousPlayer = prevPlayersById.get(playerId);
          if (!previousPlayer) {
            newEvents.push({
              id: `${Date.now()}-${playerId}-joined`,
              message: `${player.username} joined the room.`,
              time: formatEventTime(),
            });
            return;
          }

          const scoreDiff = Number(player.score || 0) - Number(previousPlayer.score || 0);
          if (scoreDiff > 0) {
            newEvents.push({
              id: `${Date.now()}-${playerId}-score-up`,
              message: `${player.username} gained ${scoreDiff} points.`,
              time: formatEventTime(),
            });
          } else if (scoreDiff < 0) {
            newEvents.push({
              id: `${Date.now()}-${playerId}-score-down`,
              message: `${player.username} spent ${Math.abs(scoreDiff)} points.`,
              time: formatEventTime(),
            });
          }
        });

        players.forEach((player) => {
          if (!nextPlayersById.has(String(player._id))) {
            newEvents.push({
              id: `${Date.now()}-${player._id}-left`,
              message: `${player.username} left the room.`,
              time: formatEventTime(),
            });
          }
        });

        if (newEvents.length === 0) {
          return previousLog;
        }

        return [...newEvents, ...previousLog].slice(0, 12);
      });
    } catch (error) {
      setError(error.message || 'Failed to load host dashboard data.');
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadDashboardData({ isInitial: true });

    const pollId = setInterval(() => {
      loadDashboardData();
    }, 5000);

    return () => clearInterval(pollId);
  }, [roomCode]);

  useEffect(() => {
    const timerId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const handleKickPlayer = async (playerId) => {
    try {
      const player = players.find((entry) => String(entry._id) === String(playerId));
      await api.post('/game-room/kick', {
        roomCode,
        playerId,
        username: player?.username,
      });
      await loadDashboardData();
    } catch (error) {
      setError(error.message || 'Failed to kick player.');
    }
  };

  const handleEndGame = async () => {
    try {
      setIsEnding(true);
      await api.post('/game-room/end', { roomCode });
      await loadDashboardData();
      navigate('/');
    } catch (error) {
      setError(error.message || 'Failed to end game.');
    } finally {
      setIsEnding(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex flex-column min-vh-100 app-shell">
        <Navbar />
        <main id="main-content" className="container py-5" tabIndex={-1} role="status" aria-live="polite">Loading host dashboard...</main>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100 app-shell">
      <Navbar />
      <main id="main-content" className="container py-5 host-dashboard theme-page flex-grow-1" tabIndex={-1}>
        <div className="card mb-4" style={{ borderTop: '4px solid var(--bs-success)' }}>
          <div className="card-body text-center">
            <p className="mb-2 text-secondary">Room Code</p>
            <h2 className="h2 fw-bold mb-0 font-monospace text-success">{room?.roomCode || roomCode}</h2>
            <p className="mb-0 mt-2 text-secondary small">Share this code with players to join your game</p>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
          <h1 className="mb-0">Host Dashboard</h1>
          <button type="button" className="btn btn-outline-danger" onClick={handleEndGame} disabled={isEnding}>
            {isEnding ? 'Ending...' : 'End Game Early'}
          </button>
        </div>

        {error ? <p className="text-danger" role="alert">{error}</p> : null}
        <p className="visually-hidden" role="status" aria-live="polite">
          Timer remaining {formatTime(timerRemainingSeconds)}. Players in room {players.length}.
        </p>

        <div className="row g-3 mb-4">
        <div className="col-12 col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 text-secondary">Room Code</h2>
              <p className="fs-5 fw-bold mb-0">{room?.roomCode || roomCode}</p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 text-secondary">Timer Remaining</h2>
              <p className="fs-5 fw-bold mb-0">{formatTime(timerRemainingSeconds)}</p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 text-secondary">Timer Length</h2>
              <p className="fs-5 fw-bold mb-0">{room?.timeLimit || 0} min</p>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-3">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 text-secondary">Game Status</h2>
              <p className="fs-5 fw-bold mb-0">{room?.isActive ? 'Active' : 'Ended'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 text-secondary">Recent Activity</h2>
              <p className="small mb-2">Players in this room: <strong>{stats?.instancesInSystem?.playersInRoom ?? players.length}</strong></p>
              {activityLog.length === 0 ? (
                <p className="mb-0 text-secondary small">Activity will appear as players join and score changes happen.</p>
              ) : (
                <ul className="mb-0 ps-3 small">
                  {activityLog.slice(0, 5).map((event) => (
                    <li key={event.id}>
                      {event.message} <span className="text-secondary">({event.time})</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-8">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h6 text-secondary">Leaderboard</h2>
              {leaderboard.length === 0 ? (
                <p className="mb-0">No players have joined yet.</p>
              ) : (
                <ol className="mb-0">
                  {leaderboard.map((entry) => (
                    <li key={entry._id || entry.username}>
                      {entry.username} - {entry.score}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </div>

        <div className="card">
          <div className="card-body">
            <h2 className="h6 text-secondary">Players in Room</h2>
            {players.length === 0 ? (
              <p className="mb-0">No players connected.</p>
            ) : (
              <ul className="list-group">
                {players.map((player) => (
                  <li key={player._id} className="list-group-item d-flex justify-content-between align-items-center">
                    <span>{player.username} ({player.score} pts)</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleKickPlayer(player._id)}
                      aria-label={`Kick ${player.username} from room`}
                    >
                      Kick
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default HostDashboard;
