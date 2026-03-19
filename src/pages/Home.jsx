import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';
import { Sun, Sunset, Moon, BookOpen, Loader, LogOut, UserCircle, ClipboardList, FileText, ExternalLink, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Utility for time of day greeting
const getGreetingInfo = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Good Morning', icon: <Sun className="text-warning" size={24} /> };
  if (hour < 17) return { text: 'Good Afternoon', icon: <Sunset className="text-warning" size={24} /> };
  return { text: 'Good Evening', icon: <Moon className="text-primary-light" size={24} /> };
};

// Utility to format date easily (e.g. Thu, 15 Oct, 2026)
const getFormattedDate = () => {
  const date = new Date();
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

// Get first/last name from an object with any common API key variant (firstname, first_name, firstName, etc.)
const getFirst = (obj) => obj && (obj.firstname ?? obj.first_name ?? obj.firstName ?? obj.Firstname ?? '');
const getLast = (obj) => obj && (obj.lastname ?? obj.last_name ?? obj.lastName ?? obj.Lastname ?? '');

const getDayCountFromStartDate = (startDateValue) => {
  if (!startDateValue) return null;
  const start = new Date(startDateValue);
  if (Number.isNaN(start.getTime())) return null;
  const now = new Date();
  // Day count is difference in full days (e.g. 15th -> 19th = 4)
  const diffMs = now.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : 0;
};

export default function Home() {
  const [memberData, setMemberData] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { currentCohort, currentCohortId, userDataCohortMember, setLoggedIn, tasterDetails, setTasterDetails } = useAppStore();
  const navigate = useNavigate();
  const greeting = getGreetingInfo();

  useEffect(() => {
    // In a real app, we use supabase.auth.getUser(), but we'll simulate the data fetching
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const tasterEmail = useAppStore.getState().tasterEmail;
        const email = user?.email || tasterEmail;
        const isTaster = useAppStore.getState().tasterOnboardingDone;

        if (email) {
          if (isTaster) {
            // Fetch taster member: filter by current_cohort_id when available (same email can exist in multiple cohorts)
            const cohortId = currentCohortId || currentCohort?.id;
            let members = null;
            if (cohortId) {
              const res = await supabase
                .from('taster_members')
                .select('*')
                .eq('email', email)
                .eq('current_cohort_id', cohortId)
                .maybeSingle();
              members = res.data;
            } else {
              const res = await supabase
                .from('taster_members')
                .select('*')
                .eq('email', email)
                .limit(1);
              members = res.data?.[0] ?? null;
            }
            setMemberData(members);
            if (members) {
              useAppStore.getState().setTasterDetails(members);
              if (members.current_cohort_id != null) useAppStore.getState().setCurrentCohortId(String(members.current_cohort_id));
            }
          } else {
            // Fetch main members
            const { data: members } = await supabase
              .from('main_members')
              .select('*')
              .eq('email', email)
              .single();
            setMemberData(members);
          }
        }

        // Fetch today's plan: for taster filter by date (YYYY-MM-DD); for main use latest
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        if (isTaster) {
          const { data: planRow } = await supabase
            .from('plans_taster')
            .select('*')
            .eq('date', todayStr)
            .maybeSingle();
          if (planRow) setPlanData(planRow);
        } else {
          const { data: plans } = await supabase
            .from('plans_main_adventure')
            .select('*')
            .order('date', { ascending: false })
            .limit(1);
          if (plans && plans.length > 0) setPlanData(plans[0]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '80vh' }}>
        <Loader className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const isDemoFallback = !memberData && !planData;

  // Name from fetched memberData, then store tasterDetails (set after fetch), then cohort member; try all key variants
  const first = getFirst(memberData) || getFirst(tasterDetails) || getFirst(userDataCohortMember) || '';
  const last = getLast(memberData) || getLast(tasterDetails) || getLast(userDataCohortMember) || '';
  const displayName = `${first} ${last}`.trim() || 'Adventurer';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '30px' }}>
      <div className="flex-center" style={{ marginBottom: '10px', position: 'relative' }}>
        <h2 style={{ fontSize: '22px' }}>Scripture Adventures</h2>
        {useAppStore.getState().tasterOnboardingDone && (
          <button 
            onClick={() => navigate('/taster-profile')}
            style={{ position: 'absolute', right: 0, background: 'none', border: 'none', color: 'var(--primary)' }}
          >
            <UserCircle size={28} />
          </button>
        )}
      </div>

      <div className="flex-col flex-center text-center" style={{ marginBottom: '20px' }}>
        {useAppStore.getState().tasterOnboardingDone ? (
          <>
            <h3 style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>Taster</h3>
            <p className="text-muted" style={{ fontSize: '14px', marginTop: '5px' }}>
              {(() => {
                const dayCount = getDayCountFromStartDate(
                  // Prefer cohort taster start date
                  currentCohort?.taster_start_date || currentCohort?.tasterStartDate
                );
                return `${getFormattedDate()} ( Day ${dayCount ?? '—'} )`;
              })()}
            </p>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
              {currentCohort?.nomenclature || 'Current Cohort'}
            </h3>
            <p className="text-muted" style={{ fontSize: '14px', marginTop: '5px' }}>
              {getFormattedDate()} ( Day {currentCohort?.startDate ? 'X' : '0'} )
            </p>
          </>
        )}
      </div>

      {/* Greeting Segment */}
      <div className="flex-center" style={{ justifyContent: 'flex-start', gap: '10px', marginBottom: '5px' }}>
        {greeting.icon}
        <h3 style={{ fontSize: '20px' }}>
          {greeting.text}, {displayName}
        </h3>
      </div>
      <p style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '20px' }}>
        How are you doing today?
      </p>

      {/* Conditional Dashboard Body */}
      {useAppStore.getState().tasterOnboardingDone ? (
        // *****************************************************************
        // TASTER PREMIUM DASHBOARD UI
        // *****************************************************************
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Today's Plan Premium Card */}
          <div className="glass-card" style={{ 
            padding: '24px', 
            borderRadius: '24px', 
            background: 'linear-gradient(145deg, rgba(125,17,17,0.95) 0%, rgba(85,0,0,0.95) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 20px 40px rgba(125,17,17,0.2)',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                <BookOpen color="white" size={24} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', margin: 0, fontWeight: '700' }}>Taster Plan</h2>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Meditation Section */}
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Meditation</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {planData?.meditation || (isDemoFallback ? 'Psalm 23:1-6' : 'No meditation today')}
                </p>
              </div>

              {/* Theme Section */}
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Theme</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {planData?.weeklytheme || (isDemoFallback ? 'The Lord is my Shepherd' : 'No theme today')}
                </p>
              </div>

              {/* Pauline Prayer Section */}
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Pauline Prayer (Pray Twice)</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {planData?.pauline || (isDemoFallback ? 'Ephesians 1:17-19' : 'No Pauline prayer today')}
                </p>
              </div>

              {/* Confession Section */}
              <div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Confession</p>
                <p style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {planData?.confession || (isDemoFallback ? 'I am a new creation in Christ Jesus.' : 'No confession today')}
                </p>
              </div>
            </div>
          </div>

          {/* Links & Tasks Section */}
          <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Resource Links (Dense Pill Format) */}
            {(planData?.resource1 || planData?.resource2 || planData?.resource3) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Resources</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[planData?.resource1, planData?.resource2, planData?.resource3].map((res, index) => {
                    if (!res) return null;
                    return (
                      <button 
                        key={index}
                        onClick={() => window.open(res, '_blank')}
                        className="glass-card flex-center" 
                        style={{ padding: '8px 16px', gap: '6px', border: '1px solid var(--primary)', borderRadius: '24px', backgroundColor: 'rgba(125,17,17,0.08)', transition: 'all 0.3s ease' }}
                      >
                        <ExternalLink color="var(--primary)" size={14} />
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)' }}>Read Resource {index + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>Tasks</h3>
            
            {/* Submit Adventure Report */}
            <button 
              onClick={() => navigate('/adventure-report')}
              className="glass-card" 
              style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(125,17,17,0.1) 0%, rgba(125,17,17,0.02) 100%)', boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.5), 0 4px 6px rgba(0,0,0,0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ backgroundColor: 'var(--primary)', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(125,17,17,0.3)' }}>
                  <ClipboardList color="white" size={24} />
                </div>
                <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Submit Adventure Plan Report</span>
              </div>
              <ChevronRight color="var(--primary)" size={20} />
            </button>
            
            {/* Sermon Link (must come before Submit Sermon Report) */}
            { (currentCohort?.sermonlink || currentCohort?.sermon_link || currentCohort?.sermonLink) && (
              <button 
                onClick={() => window.open(currentCohort?.sermonlink || currentCohort?.sermon_link || currentCohort?.sermonLink, '_blank')}
                className="glass-card" 
                style={{ marginTop: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', borderRadius: '16px', background: 'linear-gradient(145deg, var(--primary) 0%, var(--primary-dark) 100%)', boxShadow: '0 8px 15px rgba(125,17,17,0.2)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                    <ExternalLink color="white" size={24} />
                  </div>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>Get Taster Sermon Link</span>
                </div>
                <ChevronRight color="white" size={20} />
              </button>
            )}
            
            {/* Submit Sermon Report */}
            <button 
              onClick={() => navigate('/sermon-report')}
              className="glass-card" 
              style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 'none', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(57,210,192,0.15) 0%, rgba(57,210,192,0.02) 100%)', boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.5), 0 4px 6px rgba(0,0,0,0.02)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ backgroundColor: 'var(--secondary)', padding: '10px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(57,210,192,0.3)' }}>
                  <FileText color="white" size={24} />
                </div>
                <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Submit Sermon Report</span>
              </div>
              <ChevronRight color="var(--secondary)" size={20} />
            </button>

          </div>

        </div>
      ) : (
        // *****************************************************************
        // REGULAR DASHBOARD UI
        // *****************************************************************
        <>
          {/* Today's Plan Card */}
          <div className="glass-card" style={{ padding: '0', overflow: 'hidden', border: 'none', boxShadow: 'var(--shadow-md)' }}>
            {/* Card Header */}
            <div style={{ backgroundColor: 'var(--primary)', padding: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen color="white" size={24} />
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', margin: 0 }}>Today's Plan</h2>
            </div>
            
            {/* Card Body */}
            <div style={{ padding: '20px', backgroundColor: 'var(--primary-dark)', color: 'white' }}>
              {/* Meditation Section */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '5px' }}>Meditation</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {planData?.meditation || (isDemoFallback ? 'Psalm 23:1-6' : 'No meditation today')}
                </p>
              </div>

              {/* Theme Section */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '5px' }}>Theme</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {planData?.weeklytheme || (isDemoFallback ? 'The Lord is my Shepherd' : 'No theme today')}
                </p>
              </div>

              {/* Pauline Prayer Section */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '5px' }}>Pauline Prayer (to be prayed twice)</p>
                <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {planData?.pauline || (isDemoFallback ? 'Ephesians 1:17-19' : 'No Pauline prayer today')}
                </p>
              </div>

              {/* Confession Section */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '5px' }}>Confession</p>
                <p style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  {planData?.confession || (isDemoFallback ? 'I am a new creation in Christ Jesus.' : 'No confession today')}
                </p>
              </div>
              
              {planData?.resource1 && (
                <button className="btn btn-secondary" style={{ width: '100%', marginTop: '10px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}>
                  View Resources
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Logout Button (For both views) */}
      <div style={{ marginTop: '40px', marginBottom: '20px' }}>
        <button 
          className="btn" 
          style={{ width: '100%', padding: '16px', backgroundColor: 'var(--surface-elevated)', color: 'var(--error)' }}
          onClick={handleLogout}
        >
          <LogOut size={18} style={{ marginRight: '8px' }} /> Logout
        </button>
      </div>

    </div>
  );
}
