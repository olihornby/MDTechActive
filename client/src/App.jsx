import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

const HomePage = lazy(() => import('./pages/HomePage'));
const HostDashboard = lazy(() => import('./pages/HostDashboard'));
const HostGame = lazy(() => import('./pages/HostGame'));
const JoinRoom = lazy(() => import('./pages/JoinRoom'));

const App = () => {
  return (
    <Router>
      <Suspense fallback={<div className="text-center p-5">Loading page…</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/host" element={<HostGame />} />
          <Route path="/host/:roomCode" element={<HostDashboard />} />
          <Route path="/join/:roomCode" element={<JoinRoom />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
