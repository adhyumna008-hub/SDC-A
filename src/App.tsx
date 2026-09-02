import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AnnouncementTicker } from './components/AnnouncementTicker';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MinimalCyberBackground } from './components/MinimalCyberBackground';
import { LandingPage } from './pages/LandingPage';
import { EventsPage } from './pages/EventsPage';
import { OpportunitiesPage } from './pages/OpportunitiesPage';
import { IdeaHubPage } from './pages/IdeaHubPage';
import { MyRegistrationsPage } from './pages/MyRegistrationsPage';
import { AdminDashboard } from './pages/AdminDashboard';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="bg-deep-black text-on-background font-body-md min-h-screen flex flex-col relative selection:bg-neon-purple selection:text-white">
          <MinimalCyberBackground />
          <AnnouncementTicker />
          <Navbar />
          <div className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/opportunities" element={<OpportunitiesPage />} />
              <Route path="/idea-hub" element={<IdeaHubPage />} />
              <Route path="/my-registrations" element={<MyRegistrationsPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
