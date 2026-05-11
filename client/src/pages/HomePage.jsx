import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function HomePage() {
  const [healthStatus, setHealthStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await api.getHealthStatus();
        setHealthStatus(response.status === 'ok' ? 'OK' : String(response.status || 'Unknown'));
      } catch (error) {
        setError(error.message || 'Could not reach backend server');
        setHealthStatus('Unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  const handleHostGame = () => {
    navigate('/host');
  };

  const handleJoinGame = () => {
    const normalizedRoomCode = roomCode.trim().toUpperCase();
    const normalizedUsername = username.trim();

    if (!normalizedRoomCode || !normalizedUsername) {
      setError('Enter both a username and room code to join.');
      return;
    }

    setError('');
    navigate(`/join/${normalizedRoomCode}?username=${encodeURIComponent(normalizedUsername)}`);
  };

  if (loading) return <p role="status" aria-live="polite">Loading...</p>;

  return (
    <div className="d-flex flex-column min-vh-100 app-shell">
      <Navbar />

      <main id="main-content" className="container py-5 flex-grow-1" tabIndex={-1}>
        <section className="home-hero mb-4 p-4 p-lg-5">
          <div className="home-hero-badge">Ages 11-16 | Classroom Tech Career Game</div>
          <h1 className="display-5 fw-bold mb-3">MDTechActive</h1>
          <p className="lead mb-3">
            Explore real technology careers through fast-paced classroom challenges. Learn key digital concepts, build confidence, and compete in a safe, teacher-led game environment.
          </p>
          <p className="text-secondary mb-0">
            Designed for secondary students, with age-appropriate questions across software, cybersecurity, data, design, and digital teamwork.
          </p>
        </section>

        <section className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card h-100 home-feature-card">
              <div className="card-body">
                <h2 className="h5">Learn by Playing</h2>
                <p className="text-secondary mb-0">Answer structured tech questions, earn points, and strengthen digital knowledge through active participation.</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card h-100 home-feature-card">
              <div className="card-body">
                <h2 className="h5">Explore Career Paths</h2>
                <p className="text-secondary mb-0">Discover how roles like software developer, cyber analyst, and data specialist connect to real-world problems.</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card h-100 home-feature-card">
              <div className="card-body">
                <h2 className="h5">Build Future Skills</h2>
                <p className="text-secondary mb-0">Practice critical thinking, collaboration, and digital decision-making skills that support future study and careers.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="home-join-panel p-4 p-lg-4">
          <h2 className="h4 mb-1">Start a Classroom Session</h2>
          <p className="text-secondary mb-3">Teachers can host a room. Students can join instantly with a room code.</p>
          <p className="visually-hidden" role="status" aria-live="polite">Server status: {healthStatus}</p>

          {error ? <p id="home-form-error" className="text-danger mb-3" role="alert">{error}</p> : null}

          <div className="d-flex gap-2 flex-wrap mb-3">
            <button type="button" className="btn btn-primary" onClick={handleHostGame}>
              Host a Room
            </button>
          </div>

          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-4">
              <label className="form-label" htmlFor="home-username">Student Name</label>
              <input
                id="home-username"
                type="text"
                className="form-control"
                placeholder="Enter student name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="nickname"
                aria-describedby={error ? 'home-form-error' : undefined}
              />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label" htmlFor="home-room-code">Room Code</label>
              <input
                id="home-room-code"
                type="text"
                className="form-control text-uppercase"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                maxLength={10}
                inputMode="text"
                aria-describedby={error ? 'home-form-error' : undefined}
              />
            </div>
            <div className="col-12 col-md-4 d-grid d-md-block">
              <button type="button" className="btn btn-success" onClick={handleJoinGame}>
                Join Room
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
