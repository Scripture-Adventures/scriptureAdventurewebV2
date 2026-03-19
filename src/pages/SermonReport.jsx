import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Clock, Edit3, Heart, CheckCircle } from 'lucide-react';

export default function SermonReport() {
  const navigate = useNavigate();
  const { tasterEmail, tasterOnboardingDone, currentCohortId } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
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
    if (loading) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const email = user?.email || tasterEmail;
      if (!email) {
        throw new Error('No email found for this user.');
      }

      if (email && tasterOnboardingDone) {
        // Fetch taster details needed for the Google Form payload
        const cohortIdNum = currentCohortId ? Number(currentCohortId) : null;
        let tasterMember = null;
        if (cohortIdNum && !Number.isNaN(cohortIdNum)) {
          const res = await supabase
            .from('taster_members')
            .select('firstname,lastname,satnumber,Confirm_Phone_number,email')
            .eq('email', email)
            .eq('current_cohort_id', cohortIdNum)
            .maybeSingle();
          if (!res.error) tasterMember = res.data;
        }
        if (!tasterMember) {
          const res = await supabase
            .from('taster_members')
            .select('firstname,lastname,satnumber,Confirm_Phone_number,email')
            .eq('email', email)
            .limit(1);
          if (!res.error) tasterMember = res.data?.[0] ?? null;
        }

        const fullname = `${tasterMember?.firstname || ''} ${tasterMember?.lastname || ''}`.trim();
        const satnumber = tasterMember?.satnumber || '';
        const whatsappnumber = tasterMember?.Confirm_Phone_number || '';

        // Submit Google Form (taster + main use same form endpoint)
        try {
          const googleFormData = new URLSearchParams();
          googleFormData.append('entry.56500404', fullname);
          googleFormData.append('entry.820767133', satnumber);
          googleFormData.append('entry.299663624', email);
          googleFormData.append('entry.1622069297', formData.repetitionReport);
          googleFormData.append('entry.246125488', formData.resurrectionReport);
          googleFormData.append('entry.189701544', formData.preferredTime);
          googleFormData.append('entry.1899783262', formData.meditationReport);
          googleFormData.append('entry.1023388056', formData.concerns || '');
          googleFormData.append('entry.1638409194', whatsappnumber);

          await fetch(
            'https://docs.google.com/forms/d/e/1FAIpQLSdqMPbuLTweUqUiVX-n1sWCNIYFhpf5lePkF91fpF9Yp5mgOg/formResponse',
            {
              method: 'POST',
              mode: 'no-cors',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: googleFormData,
            }
          );
        } catch (formErr) {
          // Do not block submission UX if Google Forms is unreachable.
          console.error('Google Form submission failed:', formErr);
        }

        // Tasters just get flagged as having submitted their sermon report
        let updateQuery = supabase
          .from('taster_members')
          .update({ sermon_submitted: true })
          .eq('email', email);

        if (cohortIdNum && !Number.isNaN(cohortIdNum)) {
          updateQuery = updateQuery.eq('current_cohort_id', cohortIdNum);
        }
        const { error: updateErr } = await updateQuery;
        if (updateErr) throw updateErr;
      } else {
        // Regular members behavior
        // Google Form submission for main members too (best-effort)
        const cohortIdNum = currentCohortId ? Number(currentCohortId) : null;
        let mainMember = null;
        if (cohortIdNum && !Number.isNaN(cohortIdNum)) {
          const res = await supabase
            .from('main_members')
            .select('firstname,lastname,sanumber,whatsapp,phonenumber,email')
            .eq('email', email)
            .eq('current_cohort_id', cohortIdNum)
            .maybeSingle();
          if (!res.error) mainMember = res.data;
        }
        if (!mainMember) {
          const res = await supabase
            .from('main_members')
            .select('firstname,lastname,sanumber,whatsapp,phonenumber,email')
            .eq('email', email)
            .limit(1);
          if (!res.error) mainMember = res.data?.[0] ?? null;
        }

        const fullname = `${mainMember?.firstname || ''} ${mainMember?.lastname || ''}`.trim();
        const satnumber = mainMember?.sanumber || '';
        const whatsappnumber = mainMember?.whatsapp || mainMember?.phonenumber || '';

        try {
          const googleFormData = new URLSearchParams();
          googleFormData.append('entry.56500404', fullname);
          googleFormData.append('entry.820767133', satnumber);
          googleFormData.append('entry.299663624', email);
          googleFormData.append('entry.1622069297', formData.repetitionReport);
          googleFormData.append('entry.246125488', formData.resurrectionReport);
          googleFormData.append('entry.189701544', formData.preferredTime);
          googleFormData.append('entry.1899783262', formData.meditationReport);
          googleFormData.append('entry.1023388056', formData.concerns || '');
          googleFormData.append('entry.1638409194', whatsappnumber);

          await fetch(
            'https://docs.google.com/forms/d/e/1FAIpQLSdqMPbuLTweUqUiVX-n1sWCNIYFhpf5lePkF91fpF9Yp5mgOg/formResponse',
            {
              method: 'POST',
              mode: 'no-cors',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: googleFormData,
            }
          );
        } catch (formErr) {
          console.error('Google Form submission failed:', formErr);
        }
      }
      
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setErrorMsg(err?.message || 'Error saving sermon report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container flex-col flex-center animate-fade-in" style={{ minHeight: '80vh', textAlign: 'center' }}>
        <div style={{ backgroundColor: 'rgba(57,210,192,0.14)', padding: '30px', borderRadius: '50%', marginBottom: '20px', boxShadow: '0 14px 30px rgba(57,210,192,0.18)' }}>
          <CheckCircle color="var(--secondary)" size={60} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Submission Successful!</h2>
        <p style={{ marginTop: '10px', color: 'var(--text-primary)', fontWeight: 500 }}>
          Thank you for sharing your thoughts. We are happy to see your dedication!
        </p>
        <button
          className="btn btn-primary"
          style={{ width: '100%', maxWidth: 320, marginTop: 24, padding: '14px', borderRadius: 16, fontWeight: 700 }}
          onClick={() => navigate('/history')}
        >
          Continue to History
        </button>
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
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Share your thoughts on recent sessions
          </p>
        </div>
      </div>

      <p style={{ marginBottom: '25px', fontSize: '14px', lineHeight: '1.5', color: 'var(--text-primary)', fontWeight: 500 }}>
        Your feedback on the sermons and spiritual sessions helps us grow together.
      </p>

      {errorMsg && (
        <div style={{ padding: '14px 16px', borderRadius: 14, backgroundColor: 'rgba(255, 89, 99, 0.12)', border: '1px solid rgba(255, 89, 99, 0.28)', marginBottom: 18 }}>
          <p style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '24px' }}>
        <div
          className="glass-card"
          style={{
            padding: '20px',
            borderRadius: '20px',
            background: 'linear-gradient(145deg, rgba(57,210,192,0.16) 0%, rgba(255,255,255,0.98) 55%, rgba(125,17,17,0.05) 100%)',
            border: '1px solid rgba(57,210,192,0.22)',
            boxShadow: '0 14px 35px rgba(57,210,192,0.14)',
          }}
        >
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
            style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(57,210,192,0.28)' }}
          />
        </div>

        <div
          className="glass-card"
          style={{
            padding: '20px',
            borderRadius: '20px',
            background: 'linear-gradient(145deg, rgba(57,210,192,0.16) 0%, rgba(255,255,255,0.98) 55%, rgba(125,17,17,0.05) 100%)',
            border: '1px solid rgba(57,210,192,0.22)',
            boxShadow: '0 14px 35px rgba(57,210,192,0.14)',
          }}
        >
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '10px' }}>
             <Heart size={20} />
            <label style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Practical Way to Walking in Love
            </label>
           </div>
           <textarea 
             name="resurrectionReport"
             className="input-field" 
            placeholder="Share your reflections on how to walk in love in everyday life..." 
             value={formData.resurrectionReport}
             onChange={handleChange}
             rows={3}
             required
            style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(57,210,192,0.28)' }}
           />
        </div>

        <div
          className="glass-card"
          style={{
            padding: '20px',
            borderRadius: '20px',
            background: 'linear-gradient(145deg, rgba(57,210,192,0.16) 0%, rgba(255,255,255,0.98) 55%, rgba(125,17,17,0.05) 100%)',
            border: '1px solid rgba(57,210,192,0.22)',
            boxShadow: '0 14px 35px rgba(57,210,192,0.14)',
          }}
        >
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
            style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(57,210,192,0.28)' }}
           />
        </div>

        <div
          className="glass-card flex-col"
          style={{
            padding: '20px',
            gap: '15px',
            borderRadius: '20px',
            background: 'linear-gradient(145deg, rgba(57,210,192,0.16) 0%, rgba(255,255,255,0.98) 55%, rgba(125,17,17,0.05) 100%)',
            border: '1px solid rgba(57,210,192,0.22)',
            boxShadow: '0 14px 35px rgba(57,210,192,0.14)',
          }}
        >
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '5px' }}>
             <Clock size={20} />
             <label style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preferred Time for Meditation</label>
           </div>
           <select 
             name="preferredTime" 
             className="input-field" 
             value={formData.preferredTime}
             onChange={handleChange}
            style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(57,210,192,0.28)', fontWeight: 'bold' }}
           >
             <option value="5:30am - 6:30am on Telegram">5:30am - 6:30am on Telegram</option>
             <option value="9pm - 10pm on WhatsApp">9pm - 10pm on WhatsApp</option>
           </select>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '20px',
            borderRadius: '20px',
            border: '1px solid rgba(57,210,192,0.22)',
            background: 'linear-gradient(145deg, rgba(57,210,192,0.16) 0%, rgba(255,255,255,0.98) 55%, rgba(125,17,17,0.05) 100%)',
            boxShadow: '0 14px 35px rgba(57,210,192,0.14)',
          }}
        >
          <label style={{ fontWeight: 'bold', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', marginBottom: '10px', display: 'block' }}>
            Any Concerns or Suggestions?
          </label>
           <textarea 
             name="concerns"
             className="input-field" 
             placeholder="Share your concerns or suggestions..." 
             value={formData.concerns}
             onChange={handleChange}
             rows={3}
            style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(57,210,192,0.28)' }}
           />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
