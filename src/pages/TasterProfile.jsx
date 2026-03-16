import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';

export default function TasterProfile() {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const { tasterEmail, currentCohortId, setLoggedIn, setTasterOnboardingDone, setCurrentCohortId } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchTasterMember() {
      if (!tasterEmail) {
        navigate('/onboarding');
        return;
      }

      try {
        const cohortId = currentCohortId;
        let data = null;

        if (cohortId) {
          const { data: byCohort, error } = await supabase
            .from('taster_members')
            .select('*')
            .eq('email', tasterEmail)
            .eq('current_cohort_id', cohortId)
            .maybeSingle();
          if (error) {
            console.error('Error fetching taster member (by cohort) for profile:', error);
          }
          data = byCohort;
        } else {
          const { data: rows, error } = await supabase
            .from('taster_members')
            .select('*')
            .eq('email', tasterEmail)
            .limit(1);
          if (error) {
            console.error('Error fetching taster member for profile:', error);
          }
          data = rows?.[0] ?? null;
        }

        if (data) {
          setMember(data);
          if (data.current_cohort_id != null) {
            setCurrentCohortId(String(data.current_cohort_id));
          }
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchTasterMember();
  }, [tasterEmail, currentCohortId, navigate, setCurrentCohortId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLoggedIn(false);
    setTasterOnboardingDone(false);
    setCurrentCohortId('');
    navigate('/onboarding');
  };

  if (loading) {
    return (
      <div className="container flex-center" style={{ minHeight: '100vh', backgroundColor: 'var(--surface)' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!member) return null;

  return (
    <div style={{ backgroundColor: 'var(--surface)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: '16px', backgroundColor: 'var(--surface-elevated)',
        boxShadow: 'var(--shadow-sm)', position: 'sticky', top: 0, zIndex: 10
      }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', padding: '8px' }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Profile</h1>
        <div style={{ width: '40px' }} /> {/* Spacer */}
      </div>

      <div className="container animate-fade-in" style={{ padding: '24px 16px', flex: 1 }}>
        {/* Avatar */}
        <div className="flex-center flex-col" style={{ marginBottom: '32px' }}>
          <div style={{
            width: '100px', height: '100px',
            backgroundColor: 'rgba(125, 17, 17, 0.1)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '32px', fontWeight: '800', color: 'var(--primary)' }}>
              {member.firstname?.charAt(0)}{member.lastname?.charAt(0)}
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
            {member.firstname} {member.lastname}
          </h2>
        </div>

        {/* Info List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>SAT Number</span>
            <span style={{ fontWeight: '600' }}>{member.satnumber || 'empty'}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Email</span>
            <span style={{ fontWeight: 'bold' }}>{member.email || 'empty'}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Phone Number (Whatsapp)</span>
            <span style={{ fontWeight: 'bold' }}>
              {member.Confirm_Phone_number || member.confirmPhoneNumber || 'empty'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Gender</span>
            <span style={{ fontWeight: 'bold' }}>{member.Gender || member.gender || 'empty'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Birthday</span>
            <span style={{ fontWeight: 'bold' }}>{member.Birthday || member.birthday || 'empty'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '12px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Total Submission to Qualify</span>
            <span style={{ fontWeight: 'bold' }}>
              {(member.total_submission ?? member.totalSubmission ?? 0)}/5
            </span>
          </div>

        </div>

        {/* Logout Button */}
        <div style={{ marginTop: '40px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ width: '100%', padding: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}
            onClick={handleLogout}
          >
            <LogOut size={20} />
            Log Out
          </button>
        </div>

      </div>
    </div>
  );
}
