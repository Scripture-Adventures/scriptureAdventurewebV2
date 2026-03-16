import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Clock, Edit3, Heart, CheckCircle } from 'lucide-react';

export default function SermonReport() {
  const navigate = useNavigate();
  const { tasterEmail, tasterOnboardingDone } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    repetitionReport: '',
    resurrectionReport: '',
    meditationReport: '',
    preferredTime: '5:30am - 6:30am on Telegram',
    concerns: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || tasterEmail;

      if (email && tasterOnboardingDone) {
        // Tasters just get flagged as having submitted their sermon report
        await supabase
          .from('taster_members')
          .update({ sermon_submitted: true })
          .eq('email', email);
      } else {
        // Regular members behavior
        // If there's a specific table for main members, insert it here
      }
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/history');
      }, 2000);
    } catch (err) {
      console.error(err);
      alert('Error saving sermon report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container flex-col flex-center animate-fade-in" style={{ minHeight: '80vh', textAlign: 'center' }}>
        <div style={{ backgroundColor: 'rgba(57,210,192,0.1)', padding: '30px', borderRadius: '50%', marginBottom: '20px' }}>
          <CheckCircle color="var(--secondary)" size={60} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Submission Successful!</h2>
        <p className="text-muted" style={{ marginTop: '10px' }}>
          Thank you for sharing your thoughts. We are happy to see your dedication!
        </p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in delay-100" style={{ paddingBottom: '30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '15px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(125,17,17,0.1)', borderRadius: '50%', width: '40px', height: '40px' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '22px', margin: 0, fontWeight: '700' }}>Sermon Report</h2>
          <p className="text-muted" style={{ margin: 0, fontSize: '13px' }}>Share your thoughts on recent sessions</p>
        </div>
      </div>

      <p className="text-muted" style={{ marginBottom: '25px', fontSize: '14px', lineHeight: '1.5' }}>
        Your feedback on the sermons and spiritual sessions helps us grow together.
      </p>

      <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '24px' }}>
        <div className="glass-card" style={{ padding: '20px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '10px' }}>
            <MessageSquare size={20} />
            <label style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>The Act of Repetition</label>
          </div>
          <textarea 
            name="repetitionReport"
            className="input-field" 
            placeholder="Share your thoughts on the sermon about repetition..." 
            value={formData.repetitionReport}
            onChange={handleChange}
            rows={3}
            required
            style={{ backgroundColor: 'var(--surface)', border: '1px solid rgba(0,0,0,0.05)' }}
          />
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: '20px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '10px' }}>
             <Heart size={20} />
             <label style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>The Power of Resurrection</label>
           </div>
           <textarea 
             name="resurrectionReport"
             className="input-field" 
             placeholder="Share your reflections on the resurrection message..." 
             value={formData.resurrectionReport}
             onChange={handleChange}
             rows={3}
             required
             style={{ backgroundColor: 'var(--surface)', border: '1px solid rgba(0,0,0,0.05)' }}
           />
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: '20px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '10px' }}>
             <Edit3 size={20} />
             <label style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>The Ancient Secret of Meditation</label>
           </div>
           <textarea 
             name="meditationReport"
             className="input-field" 
             placeholder="Share your insights on the meditation teachings..." 
             value={formData.meditationReport}
             onChange={handleChange}
             rows={3}
             required
             style={{ backgroundColor: 'var(--surface)', border: '1px solid rgba(0,0,0,0.05)' }}
           />
        </div>

        <div className="glass-card flex-col" style={{ padding: '20px', gap: '15px', borderRadius: '20px' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '5px' }}>
             <Clock size={20} />
             <label style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preferred Time for Meditation</label>
           </div>
           <select 
             name="preferredTime" 
             className="input-field" 
             value={formData.preferredTime}
             onChange={handleChange}
             style={{ backgroundColor: 'var(--surface)', border: '1px solid rgba(0,0,0,0.05)', fontWeight: 'bold' }}
           >
             <option value="5:30am - 6:30am on Telegram">5:30am - 6:30am on Telegram</option>
             <option value="9pm - 10pm on WhatsApp">9pm - 10pm on WhatsApp</option>
           </select>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', border: '1px solid rgba(125,17,17,0.1)' }}>
           <label style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>Any Concerns or Suggestions?</label>
           <textarea 
             name="concerns"
             className="input-field" 
             placeholder="Share your concerns or suggestions..." 
             value={formData.concerns}
             onChange={handleChange}
             rows={3}
             style={{ backgroundColor: 'var(--surface)', border: '1px solid rgba(0,0,0,0.05)' }}
           />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
