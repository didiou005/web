import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './LanguageContext';
import { ThemeProvider } from './ThemeContext';
import Navbar from './Navbar';
import LandingPage from './LandingPage';
import ComplaintForm from './ComplaintForm';
import FollowUp from './FollowUp';

import ScrollToTop from './ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <LanguageProvider>
        <ThemeProvider>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signalement" element={<ComplaintForm />} />
              <Route path="/suivi" element={<FollowUp />} />
            </Routes>
          </div>
        </ThemeProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
