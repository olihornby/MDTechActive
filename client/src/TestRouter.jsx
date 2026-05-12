import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

const TestHome = () => <h1>Test Home</h1>;
const TestAbout = () => <h1>Test About</h1>;

const TestRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TestHome />} />
        <Route path="/about" element={<TestAbout />} />
      </Routes>
    </Router>
  );
};

export default TestRouter;