import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';
import { Loader, Edit3, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TrackGoal() {
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Fetch the most recent goal submission for simplicity
          const { data } = await supabase
            .from('goal_submissions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (data) setGoal(data);
        }
      } catch (err) {
        console.error("Error fetching goal:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGoal();
  }, []);

  return (
    <div className="container animate-fade-in delay-100" style={{ paddingBottom: '30px' }}>
      <div className="flex-center" style={{ marginBottom: '20px', backgroundColor: 'var(--primary)', color: 'white', padding: '15px', borderRadius: 'var(--radius-md)', gap: '10px' }}>
        <Target size={24} />
        <h2 style={{ fontSize: '18px', margin: 0 }}>Goal Report</h2>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '30vh' }}>
          <Loader className="animate-spin text-primary" size={30} />
        </div>
      ) : goal ? (
        <div className="flex-col" style={{ gap: '15px' }}>
          <h3 className="text-gradient">Goals for the week</h3>
          
          <div className="glass-card" style={{ padding: '15px' }}>
            <p className="text-muted" style={{ fontSize: '14px' }}>Prayer Goal</p>
            <p style={{ fontWeight: 'bold' }}>{goal.prayerGoal || 'Empty'}</p>
          </div>
          
          <div className="glass-card" style={{ padding: '15px' }}>
            <p className="text-muted" style={{ fontSize: '14px' }}>Bible Study Goal</p>
            <p style={{ fontWeight: 'bold' }}>{goal.bibleStudyGoal || 'Empty'}</p>
          </div>
          
          <div className="glass-card" style={{ padding: '15px' }}>
            <p className="text-muted" style={{ fontSize: '14px' }}>Evangelism</p>
            <p style={{ fontWeight: 'bold' }}>{goal.evangelismGoal || 'Empty'}</p>
          </div>
          
          <div className="glass-card" style={{ padding: '15px' }}>
            <p className="text-muted" style={{ fontSize: '14px' }}>Personal Goal</p>
            <p style={{ fontWeight: 'bold' }}>{goal.personalGoal || 'Empty'}</p>
          </div>
          
          <div className="glass-card" style={{ padding: '15px' }}>
            <p className="text-muted" style={{ fontSize: '14px' }}>Resources Consumption</p>
            <p style={{ fontWeight: 'bold' }}>{goal.resourceConsumption || 'Empty'} of 6</p>
          </div>
        </div>
      ) : (
        <div className="flex-col flex-center" style={{ minHeight: '40vh', textAlign: 'center' }}>
          {/* using emoji as placeholder for the image in the original app */}
          <div style={{ fontSize: '64px', marginBottom: '10px' }}>😩</div>
          <h3>Child of God,</h3>
          <p className="text-muted">You did not set new goals this week</p>
        </div>
      )}

      <button 
        className="btn btn-primary" 
        style={{ width: '100%', marginTop: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        onClick={() => navigate('/goal-setting')}
      >
        <Edit3 size={18} /> Set Weekly Goals
      </button>
    </div>
  );
}
