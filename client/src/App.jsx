import React from 'react';
import { HashRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import HostDashboard from './pages/HostDashboard';
import HostGame from './pages/HostGame';
import JoinRoom from './pages/JoinRoom';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/host" element={<HostGame />} />
        <Route path="/host/:roomCode" element={<HostDashboard />} />
        <Route path="/join/:roomCode" element={<JoinRoom />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
