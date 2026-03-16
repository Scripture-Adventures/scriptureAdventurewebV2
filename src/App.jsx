import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/appStore';
import MobileLayout from './layouts/MobileLayout';
import TasterLogin from './pages/TasterLogin';
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import History from './pages/History';
import Profile from './pages/Profile';
import BibleSearch from './pages/BibleSearch';
import TrackGoal from './pages/TrackGoal';
import GoalSetting from './pages/GoalSetting';
import SermonReport from './pages/SermonReport';
import AdventureReport from './pages/AdventureReport';
import Support from './pages/Support';
import Privacy from './pages/Privacy';
import TasterProfile from './pages/TasterProfile';

export default function App() {
  const loggedIn = useAppStore((state) => state.loggedIn);

  return (
    <BrowserRouter>
      <Routes>
        {!loggedIn ? (
          <>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/taster-login" element={<TasterLogin />} />
            <Route path="*" element={<Navigate to="/onboarding" replace />} />
          </>
        ) : (
          <Route element={<MobileLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
            <Route path="/bible" element={<BibleSearch />} />
            <Route path="/track-goal" element={<TrackGoal />} />
            <Route path="/goal-setting" element={<GoalSetting />} />
            <Route path="/sermon-report" element={<SermonReport />} />
            <Route path="/adventure-report" element={<AdventureReport />} />
            <Route path="/support" element={<Support />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/taster-profile" element={<TasterProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}
