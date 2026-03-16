import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MessageCircle, Heart, CheckCircle, FileText, Link as LinkIcon, Bookmark } from 'lucide-react';

export default function AdventureReport() {
  const navigate = useNavigate();
  const { tasterEmail, tasterOnboardingDone, currentCohort, currentCohortId, tasterDetails } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState(false);
  
  const [planData, setPlanData] = useState(null);
  const [memberData, setMemberData] = useState(null);
  
  const [formData, setFormData] = useState({
    meditation: '',
    actionPlan: '',
    paulinePrayer1Start: '',
    paulinePrayer1End: '',
    paulinePrayer2Start: '',
    paulinePrayer2End: '',
    confessionChecked: false,
    resourcesChecked: false,
  });

  // Normalize plan fields (Supabase may return camelCase or snake_case)
  const planConfession = planData?.confession ?? '';
  const planResource1 = planData?.resource1 ?? planData?.resource_1 ?? null;
  const planResource2 = planData?.resource2 ?? planData?.resource_2 ?? null;
  const planResource3 = planData?.resource3 ?? planData?.resource_3 ?? null;
  const hasResources = !!(planResource1 || planResource2 || planResource3);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const email = user?.email || tasterEmail;

        if (email && tasterOnboardingDone) {
          // Fetch member (for form submission and memberData), being careful with multiple cohorts
          const cohortId = currentCohortId || currentCohort?.id;
          let member = null;
          if (cohortId) {
            const { data, error } = await supabase
              .from('taster_members')
              .select('*')
              .eq('email', email)
              .eq('current_cohort_id', cohortId)
              .maybeSingle();
            if (error) {
              console.error('Error fetching taster member by cohort:', error);
            }
            member = data;
          } else {
            const { data, error } = await supabase
              .from('taster_members')
              .select('*')
              .eq('email', email)
              .limit(1);
            if (error) {
              console.error('Error fetching taster member:', error);
            }
            member = data?.[0] ?? null;
          }

          if (member) {
            setMemberData(member);
          }

          // Fetch today's plan same as Home: always get latest plan when in taster mode
          const { data: plans } = await supabase
            .from('plans_taster')
            .select('*')
            .order('date', { ascending: false })
            .limit(1);

          if (plans && plans.length > 0) {
            setPlanData(plans[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching plan context:', err);
      } finally {
        setFetching(false);
      }
    };
    
    fetchInitialData();
  }, [tasterEmail, tasterOnboardingDone, currentCohortId, currentCohort]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const copyResource = (link) => {
    navigator.clipboard.writeText(link);
    alert('Resource link copied!');
  };

  const getMeditationHours = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) return "F";
    if (hour >= 6 && hour < 18) return "D";
    return "S";
  };

  const generateClipboardText = () => {
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    const timeNow = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nameFirst =
      memberData?.firstname ||
      memberData?.first_name ||
      tasterDetails?.firstname ||
      tasterDetails?.first_name ||
      '';
    const nameLast =
      memberData?.lastname ||
      memberData?.last_name ||
      tasterDetails?.lastname ||
      tasterDetails?.last_name ||
      '';
    const name = `${nameFirst} ${nameLast}`.trim();
    const saNumber =
      memberData?.satnumber ||
      memberData?.sa_number ||
      tasterDetails?.satnumber ||
      tasterDetails?.sa_number ||
      '';
    
    // In plans_taster the scripture reference is typically stored in `meditation` / `pauline`
    const meditationVerse = planData?.meditation || '';
    const prayerVerse = planData?.pauline || '';

    const pauline2 = (formData.paulinePrayer2Start && formData.paulinePrayer2End) 
                    ? `${formData.paulinePrayer2Start} - ${formData.paulinePrayer2End}` 
                    : ' ';

    return `*Name:* ${name || ' '}
*SA Number:* ${saNumber || ' '}
*Date:* ${formattedDate}

*Meditation: ${meditationVerse || ''}*
${formData.meditation || ''}

*Action plan:*
${formData.actionPlan || ''}

*Pauline Prayer: ${prayerVerse}*
${formData.paulinePrayer1Start} - ${formData.paulinePrayer1End} 
${pauline2}

*Confession:* ✅
${formData.resourcesChecked ? '*Resources:* ✅' : '*Resources:* ❌'}
`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (memberData && planData) {
        // Submit report following Flutter logic
        const { error: insertError } = await supabase.from('taster_plan_submissions').insert([{
          pauline1: `${formData.paulinePrayer1Start} - ${formData.paulinePrayer1End}`,
          pauline2: (formData.paulinePrayer2Start && formData.paulinePrayer2End) 
                    ? `${formData.paulinePrayer2Start} - ${formData.paulinePrayer2End}` 
                    : ' ',
          action_plan: formData.actionPlan,
          evening_meditation: formData.meditation,
          confession: planConfession || '',
          date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          taster_plan_id: planData.id,
          taster_memberid: memberData.id,
        }]);
        if (insertError) {
          console.error('Error inserting taster_plan_submissions:', insertError);
          throw insertError;
        }

        // Update members submission count
        const { error: updateError } = await supabase.from('taster_members').update({
          total_submission: (memberData.total_submission || 0) + 1
        }).eq('id', memberData.id);
        if (updateError) {
          console.error('Error updating taster_members total_submission:', updateError);
          throw updateError;
        }

        // Google Form Fallback Tracking (Fire and forget, no-cors to avoid blocking)
        try {
          const googleFormData = new URLSearchParams();
          const today = new Date();
          const formattedDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
          const dayOrNight = getMeditationHours();
          
          googleFormData.append('entry.1581596874', formattedDate);
          googleFormData.append('entry.639640256', memberData.satnumber || memberData.sa_number || '');
          
          if (dayOrNight === 'D') {
            googleFormData.append('entry.1635214566', formData.meditation); // Morning Meditation
            googleFormData.append('entry.873247309', ''); // Evening Meditation
          } else {
            googleFormData.append('entry.1635214566', ''); // Morning Meditation
            googleFormData.append('entry.873247309', formData.meditation); // Evening Meditation
          }
          
          googleFormData.append('entry.2006588546', `${formData.paulinePrayer1Start} - ${formData.paulinePrayer1End}`);
          googleFormData.append('entry.394922426', (formData.paulinePrayer2Start && formData.paulinePrayer2End) ? `${formData.paulinePrayer2Start} - ${formData.paulinePrayer2End}` : ' ');
          googleFormData.append('entry.547836724', formData.actionPlan);

          fetch('https://docs.google.com/forms/d/e/1FAIpQLSeenGTs8SbEtJQnMNbwrPRs7MvA0yo6d6fbd0ARwb_KF7GgGg/formResponse', {
            method: 'POST',
            mode: 'no-cors',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: googleFormData,
          }).catch(console.error); // Catch silently to not disrupt UX
        } catch (formErr) {
          console.error('Google Form submission failed', formErr);
        }
        try {
          const text = generateClipboardText();
          await navigator.clipboard.writeText(text);
        } catch (clipboardErr) {
          console.error('Failed to copy to clipboard', clipboardErr);
        }
      } 
      
      setSuccess(true);
      // Removed automatic redirect, user must click the button to go to WhatsApp
    } catch (err) {
      console.error(err);
      alert('Error saving report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container flex-col flex-center animate-fade-in" style={{ minHeight: '80vh', textAlign: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: 'rgba(57,210,192,0.1)', padding: '30px', borderRadius: '50%', marginBottom: '20px' }}>
          <CheckCircle color="var(--secondary)" size={60} />
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Update</h2>
        <p style={{ marginTop: '10px', fontSize: '16px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
          Your Meditation has been Copied to Clipboard. <br />
          Paste your meditation when you get to the main WhatsApp group page!
        </p>
        
        <button 
          className="btn btn-primary"
          style={{ width: '100%', maxWidth: '300px', padding: '16px', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', marginTop: '30px', boxShadow: '0 8px 16px rgba(125,17,17,0.2)' }}
          onClick={() => {
            const groupLink = currentCohort?.tasterGroupLink || currentCohort?.taster_group_link || 'https://chat.whatsapp.com/';
            window.open(groupLink, '_blank', 'noopener,noreferrer');
            navigate('/history');
          }}
        >
          Open Form & Continue
        </button>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="container flex-col flex-center" style={{ minHeight: '80vh' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '15px', color: 'var(--text-primary)' }}>Loading adventure...</p>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in delay-100" style={{ paddingBottom: '30px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', gap: '15px' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(125,17,17,0.1)', borderRadius: '50%', width: '40px', height: '40px' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '22px', margin: 0, fontWeight: '700', color: 'var(--text-primary)' }}>Adventure Report (Taster)</h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)' }}>Document your daily reading</p>
        </div>
      </div>

      {/* Today's plan: Confession & Resource links (from plans_taster, same as Home) */}
      {planData && (
        <div className="flex-col" style={{ padding: '20px', gap: '16px', borderRadius: '20px', marginBottom: '24px', backgroundColor: '#FFFBF9', border: '1px solid rgba(125,17,17,0.2)', boxShadow: '0 2px 8px rgba(125,17,17,0.06)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Today&apos;s plan</h3>
          {/* Confession */}
          <div>
            <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Confession</p>
            <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.5', color: 'var(--text-primary)', fontWeight: '500' }}>
              {planConfession || 'No confession for today.'}
            </p>
          </div>
          {/* Resource links */}
          {hasResources && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Resources</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {[planResource1, planResource2, planResource3].map((res, index) => {
                  if (!res) return null;
                  return (
                    <a
                      key={index}
                      href={res}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '20px', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}
                    >
                      <LinkIcon size={14} />
                      Resource {index + 1}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '24px' }}>
        
        {/* Pauline Prayer 1 */}
        <div className="glass-card flex-col" style={{ padding: '20px', gap: '15px', borderRadius: '20px', backgroundColor: '#FFFFFF', border: '1px solid rgba(125,17,17,0.12)', boxShadow: '0 2px 8px rgba(125,17,17,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
            <Clock size={20} />
            <label style={{ fontWeight: 'bold', fontSize: '15px' }}>Pauline Prayer 1 Time</label>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
               <label style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px', display: 'block', fontWeight: '500' }}>Start Time</label>
               <input type="time" name="paulinePrayer1Start" className="input-field" value={formData.paulinePrayer1Start} onChange={handleChange} required style={{ backgroundColor: '#FFFFFF', color: 'var(--text-primary)', borderColor: 'rgba(125,17,17,0.2)' }} />
            </div>
            <div style={{ flex: 1 }}>
               <label style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px', display: 'block', fontWeight: '500' }}>End Time</label>
               <input type="time" name="paulinePrayer1End" className="input-field" value={formData.paulinePrayer1End} onChange={handleChange} required style={{ backgroundColor: '#FFFFFF', color: 'var(--text-primary)', borderColor: 'rgba(125,17,17,0.2)' }} />
            </div>
          </div>
        </div>

        {/* Meditation */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', backgroundColor: '#FFFFFF', border: '1px solid rgba(125,17,17,0.12)', boxShadow: '0 2px 8px rgba(125,17,17,0.06)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '10px' }}>
             <Heart size={20} />
             <label style={{ fontWeight: 'bold', fontSize: '15px', display: 'block' }}>Meditation Reflection</label>
           </div>
           <textarea 
             name="meditation"
             className="input-field" 
             placeholder="What stood out to you from today's meditation?" 
             value={formData.meditation}
             onChange={handleChange}
             rows={4}
             required
             style={{ backgroundColor: '#FFFFFF', color: 'var(--text-primary)', borderColor: 'rgba(125,17,17,0.2)' }}
           />
        </div>

        {/* Pauline Prayer 2 */}
        <div className="glass-card flex-col" style={{ padding: '20px', gap: '15px', borderRadius: '20px', backgroundColor: '#FFFFFF', border: '1px solid rgba(125,17,17,0.12)', boxShadow: '0 2px 8px rgba(125,17,17,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
            <Clock size={20} />
            <label style={{ fontWeight: 'bold', fontSize: '15px' }}>Pauline Prayer 2 Time (Optional)</label>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1 }}>
               <label style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px', display: 'block', fontWeight: '500' }}>Start Time</label>
               <input type="time" name="paulinePrayer2Start" className="input-field" value={formData.paulinePrayer2Start} onChange={handleChange} style={{ backgroundColor: '#FFFFFF', color: 'var(--text-primary)', borderColor: 'rgba(125,17,17,0.2)' }} />
            </div>
            <div style={{ flex: 1 }}>
               <label style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px', display: 'block', fontWeight: '500' }}>End Time</label>
               <input type="time" name="paulinePrayer2End" className="input-field" value={formData.paulinePrayer2End} onChange={handleChange} style={{ backgroundColor: '#FFFFFF', color: 'var(--text-primary)', borderColor: 'rgba(125,17,17,0.2)' }} />
            </div>
          </div>
        </div>

        {/* Action Plan */}
        <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', backgroundColor: '#FFFFFF', border: '1px solid rgba(125,17,17,0.12)', boxShadow: '0 2px 8px rgba(125,17,17,0.06)' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '10px' }}>
             <MessageCircle size={20} />
             <label style={{ fontWeight: 'bold', fontSize: '15px', display: 'block' }}>Action Plan(s)</label>
           </div>
           <textarea 
             name="actionPlan"
             className="input-field" 
             placeholder="How will you apply this in your daily life going forward?" 
             value={formData.actionPlan}
             onChange={handleChange}
             rows={3}
             required
             style={{ backgroundColor: '#FFFFFF', color: 'var(--text-primary)', borderColor: 'rgba(125,17,17,0.2)' }}
           />
        </div>

        {/* Confession & Resources Details */}
        <div className="glass-card flex-col" style={{ padding: '20px', gap: '20px', borderRadius: '20px', backgroundColor: '#FFFFFF', border: '1px solid rgba(125,17,17,0.12)' }}>
          
          {/* Confession Checkbox */}
          <div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                name="confessionChecked"
                checked={formData.confessionChecked}
                onChange={handleChange}
                style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: 'var(--primary)' }}
                required
              />
              <div>
                <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                  Confession (check this box after taking your confession.)
                </span>
              </div>
            </label>
            <div style={{ marginTop: '12px', padding: '15px', backgroundColor: '#FFFBF9', borderRadius: '12px', borderLeft: '3px solid var(--primary)' }}>
              <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic', lineHeight: '1.5', color: 'var(--text-primary)', fontWeight: '500' }}>
                {planConfession || 'Confession not available for today.'}
              </p>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(125,17,17,0.15)', margin: '5px 0' }} />

          {/* Resources Checkbox */}
          <div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                name="resourcesChecked"
                checked={formData.resourcesChecked}
                onChange={handleChange}
                style={{ width: '20px', height: '20px', marginTop: '2px', accentColor: 'var(--primary)' }}
                required
              />
              <div>
                <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                  Resources (check this box after reading the resources.)
                </span>
              </div>
            </label>

            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {planResource1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: '#FFFBF9', borderRadius: '12px', boxShadow: '0 2px 6px rgba(125,17,17,0.08)', border: '1px solid rgba(125,17,17,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <Bookmark size={16} color="var(--primary)" />
                     <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Resource 1</span>
                  </div>
                  <a href={planResource1} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: 'var(--primary)', borderRadius: '20px' }}>
                    <LinkIcon size={14} />
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>Open</span>
                  </a>
                </div>
              )}
              {planResource2 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: '#FFFBF9', borderRadius: '12px', boxShadow: '0 2px 6px rgba(125,17,17,0.08)', border: '1px solid rgba(125,17,17,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <Bookmark size={16} color="var(--primary)" />
                     <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Resource 2</span>
                  </div>
                  <a href={planResource2} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: 'var(--primary)', borderRadius: '20px' }}>
                    <LinkIcon size={14} />
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>Open</span>
                  </a>
                </div>
              )}
              {planResource3 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 15px', backgroundColor: '#FFFBF9', borderRadius: '12px', boxShadow: '0 2px 6px rgba(125,17,17,0.08)', border: '1px solid rgba(125,17,17,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <Bookmark size={16} color="var(--primary)" />
                     <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>Resource 3</span>
                  </div>
                  <a href={planResource3} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', backgroundColor: 'var(--primary)', borderRadius: '20px' }}>
                    <LinkIcon size={14} />
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>Open</span>
                  </a>
                 </div>
              )}
              {!hasResources && (
                 <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>No resources linked for today.</p>
              )}
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', marginTop: '10px', boxShadow: '0 8px 16px rgba(125,17,17,0.2)' }}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
