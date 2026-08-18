/** ZTTeam Main App Component with React Router, Cart Provider & Notification Provider */
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ZTTeamCartProvider } from './stores/ztteam_cartContext';
import { ZTTeamNotificationProvider } from './stores/ztteam_notificationContext';
import { ZTTeamHomePage } from './pages/ZTTeamHomePage';
import { ZTTeamCheckoutPage } from './pages/ZTTeamCheckoutPage';
import { ZTTeamOrdersPage } from './pages/ZTTeamOrdersPage';
import { ZTTeamStatsPage } from './pages/ZTTeamStatsPage';
import { ZTTeamProfilePage } from './pages/ZTTeamProfilePage';
import { ZTTeamSettingsPage } from './pages/ZTTeamSettingsPage';

export function App() {
  return (
    <ZTTeamNotificationProvider>
      <ZTTeamCartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ZTTeamHomePage />} />
            <Route path="/checkout" element={<ZTTeamCheckoutPage />} />
            <Route path="/orders" element={<ZTTeamOrdersPage />} />
            <Route path="/stats" element={<ZTTeamStatsPage />} />
            <Route path="/profile" element={<ZTTeamProfilePage />} />
            <Route path="/settings" element={<ZTTeamSettingsPage />} />
          </Routes>
        </BrowserRouter>
      </ZTTeamCartProvider>
    </ZTTeamNotificationProvider>
  );
}

export default App;
