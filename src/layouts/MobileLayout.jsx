import React, { useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, History, User, Book, Target } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { supabase } from '../lib/supabase';
import { verifyMainMemberForCohort, isDevTestMainEmail } from '../lib/mainMemberQualification';

export default function MobileLayout() {
  const tasterOnboardingDone = useAppStore((state) => state.tasterOnboardingDone);

  useEffect(() => {
    let cancelled = false;

    async function guardMainMember() {
      if (tasterOnboardingDone) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email || cancelled) return;
      if (isDevTestMainEmail(user.email)) return;

      const cohortId = useAppStore.getState().currentCohortId;
      const check = await verifyMainMemberForCohort(supabase, user.email, cohortId);
      if (cancelled) return;
      if (check.ok) return;

      sessionStorage.setItem('sa_main_not_qualified', check.reason);
      await supabase.auth.signOut();
      useAppStore.getState().setLoggedIn(false);
    }

    guardMainMember();
    return () => {
      cancelled = true;
    };
  }, [tasterOnboardingDone]);

  return (
    <div className="mobile-wrapper">
      {/* Main Content Area */}
      <main style={{ padding: '20px 0' }}>
        <Outlet />
      </main>

      {/* Bottom Navigation Navbar */}
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={24} />
          <span>Home</span>
        </NavLink>
        
        <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <History size={24} />
          <span>History</span>
        </NavLink>

        <NavLink to="/bible" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Book size={24} />
          <span>Bible</span>
        </NavLink>

        {!tasterOnboardingDone && (
          <NavLink to="/track-goal" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Target size={24} />
            <span>Goals</span>
          </NavLink>
        )}
        
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <User size={24} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}
