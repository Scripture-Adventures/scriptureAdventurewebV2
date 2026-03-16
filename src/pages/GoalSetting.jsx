import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function GoalSetting() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    prayerGoal: '',
    bibleStudyGoal: '',
    evangelismGoal: '',
    personalGoal: '',
    resourceConsumption: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('goal_submissions').insert([
          {
            cohort_id: 'default', // placeholder
            saNumber: 'default', // placeholder
            ...formData,
            created_at: new Date().toISOString()
          }
        ]);
        navigate('/track-goal');
      }
    } catch (err) {
      console.error(err);
      // fallback for demo
      navigate('/track-goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in delay-100" style={{ paddingBottom: '30px' }}>
      <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '20px', gap: '15px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--primary)' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '22px', margin: 0 }}>Set Weekly Goals</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '20px' }}>
        <div>
          <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Prayer goals (Daily)</label>
          <textarea 
            name="prayerGoal"
            className="input-field" 
            placeholder="How many minutes/hours will you pray daily?" 
            value={formData.prayerGoal}
            onChange={handleChange}
            rows={2}
          />
        </div>

        <div>
          <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Bible Study goals (Daily)</label>
          <textarea 
            name="bibleStudyGoal"
            className="input-field" 
            placeholder="How many chapters/verses will you study?" 
            value={formData.bibleStudyGoal}
            onChange={handleChange}
            rows={2}
          />
        </div>

        <div>
          <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Evangelism goals</label>
          <textarea 
            name="evangelismGoal"
            className="input-field" 
            placeholder="Who will you reach out to?" 
            value={formData.evangelismGoal}
            onChange={handleChange}
            rows={2}
          />
        </div>

        <div>
          <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Personal goals</label>
          <textarea 
            name="personalGoal"
            className="input-field" 
            placeholder="Any other personal goal?" 
            value={formData.personalGoal}
            onChange={handleChange}
            rows={2}
          />
        </div>

        <div>
           <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Resources Consumption</label>
           <input 
             type="number"
             name="resourceConsumption"
             className="input-field" 
             placeholder="How many resources will you consume?" 
             value={formData.resourceConsumption}
             onChange={handleChange}
           />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '15px' }}>
          {loading ? 'Submitting...' : 'Submit Goals'}
        </button>
      </form>
    </div>
  );
}
