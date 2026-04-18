import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarOff } from 'lucide-react';
import { isWeeklyGoalSettingAllowed, weeklyGoalWindowMessage } from '../lib/weeklyGoalWindow';
import { useAppStore } from '../store/appStore';
import {
  formatGoalDateDMY,
  goalFormatter,
  parseCohortStartDate,
  resolveGoalSubmissionWhatsappUrl,
  submitGoalGoogleForm,
  weeksCalculator,
} from '../lib/goalSubmission';

export default function GoalSetting() {
  const navigate = useNavigate();
  const { currentCohort, currentCohortId } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const canSetGoals = isWeeklyGoalSettingAllowed();

  const [formData, setFormData] = useState({
    prayerGoalWeek: '',
    prayerGoalDaily: '',
    bibleStudyWeek: '',
    bibleStudyDaily: '',
    evangelismGoal: '',
    personalGoal: '',
    resourceConsumption: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const buildInsertRow = ({
    cohortIdStr,
    circleNumber,
    weekStr,
    dateStr,
    prayerGoalCombined,
    bibleStudyCombined,
    evangelismGoal,
    personalGoal,
    resourceConsumption,
    saNumber,
    nowIso,
  }) => ({
    cohort_id: cohortIdStr,
    circle_number: circleNumber ?? null,
    week: weekStr,
    date: dateStr,
    bible_study_goal: bibleStudyCombined,
    evangelism_goal: evangelismGoal,
    personal_goal: personalGoal,
    prayer_goal: prayerGoalCombined,
    resource_consumption: String(resourceConsumption ?? ''),
    saNumber: saNumber ?? null,
    created_at: nowIso,
    updated_at: nowIso,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isWeeklyGoalSettingAllowed()) return;
    setSubmitError(null);
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setSubmitError('You must be signed in to submit goals.');
        return;
      }

      const { data: member, error: memberErr } = await supabase
        .from('main_members')
        .select('sanumber, circle_number, firstname, lastname')
        .eq('email', user.email)
        .maybeSingle();

      if (memberErr) {
        console.error(memberErr);
        setSubmitError('Could not load your member profile.');
        return;
      }
      if (!member?.sanumber) {
        setSubmitError('Your SA number is missing from your profile. Contact support.');
        return;
      }

      const cohortRaw = currentCohort?.id ?? currentCohortId;
      const cohortIdStr =
        cohortRaw != null && String(cohortRaw).trim() !== '' ? String(cohortRaw) : '';
      if (!cohortIdStr) {
        setSubmitError('Cohort is not set. Log out and sign in again, choosing your cohort.');
        return;
      }

      const startRaw = currentCohort?.start_date || currentCohort?.startDate;
      const startDate = parseCohortStartDate(startRaw);
      const now = new Date();
      const weekStr = startDate ? weeksCalculator(startDate, now) : '1';
      const dateStr = formatGoalDateDMY(now);
      const nowIso = now.toISOString();

      const prayerGoalCombined = `${formData.prayerGoalWeek}   ${formData.prayerGoalDaily}`.trim();
      const bibleStudyCombined = `${formData.bibleStudyWeek}   ${formData.bibleStudyDaily}`.trim();

      submitGoalGoogleForm({
        date: dateStr,
        saNumber: member.sanumber,
        prayerGoal: prayerGoalCombined,
        bibleStudyGoal: bibleStudyCombined,
        evangelismGoal: formData.evangelismGoal,
        personalGoal: formData.personalGoal,
        resourceConsumption: String(formData.resourceConsumption ?? ''),
      });

      const row = buildInsertRow({
        cohortIdStr,
        circleNumber: member.circle_number,
        weekStr,
        dateStr,
        prayerGoalCombined,
        bibleStudyCombined,
        evangelismGoal: formData.evangelismGoal,
        personalGoal: formData.personalGoal,
        resourceConsumption: formData.resourceConsumption,
        saNumber: member.sanumber,
        nowIso,
      });

      const { error: insertError } = await supabase.from('goal_submissions').insert([row]);

      if (insertError) {
        console.error('goal_submissions insert:', insertError);
        setSubmitError(insertError.message || 'Failed to save goals. Please try again.');
        return;
      }

      const clip = goalFormatter(
        dateStr,
        formData.prayerGoalDaily,
        formData.prayerGoalWeek,
        formData.bibleStudyDaily,
        formData.bibleStudyWeek,
        formData.evangelismGoal,
        formData.personalGoal,
        formData.resourceConsumption,
        'Week ',
        member.firstname,
        member.lastname,
        member.sanumber,
        member.circle_number,
        weekStr
      );
      try {
        await navigator.clipboard.writeText(clip);
      } catch (clipErr) {
        console.warn('Clipboard:', clipErr);
      }

      // Circle N → current_cohort.circles[N - 1].circle_whatsapp_link; else main_group_link.
      let cohortForLink = { ...(currentCohort || {}) };
      const cohortIdNum = parseInt(String(cohortIdStr), 10);
      if (!Number.isNaN(cohortIdNum)) {
        const { data: cohortFresh } = await supabase
          .from('current_cohort')
          .select('circles, main_group_link')
          .eq('id', cohortIdNum)
          .maybeSingle();
        if (cohortFresh) {
          cohortForLink = { ...cohortForLink, ...cohortFresh };
          useAppStore.getState().setCurrentCohort({ ...(currentCohort || {}), ...cohortFresh });
        }
      }
      const groupLink = resolveGoalSubmissionWhatsappUrl(cohortForLink, member.circle_number);
      window.open(groupLink, '_blank', 'noopener,noreferrer');

      navigate('/track-goal');
    } catch (err) {
      console.error(err);
      setSubmitError(err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (!canSetGoals) {
    return (
      <div className="container animate-fade-in delay-100" style={{ paddingBottom: '30px' }}>
        <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '20px', gap: '15px' }}>
          <button type="button" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--primary)' }}>
            <ArrowLeft size={24} />
          </button>
          <h2 style={{ fontSize: '22px', margin: 0 }}>Set Weekly Goals</h2>
        </div>
        <div
          className="glass-card flex-col flex-center"
          style={{
            padding: '28px 20px',
            textAlign: 'center',
            gap: '16px',
            border: '1px solid rgba(125,17,17,0.15)',
            borderRadius: '20px',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(125,17,17,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CalendarOff size={32} color="var(--primary)" />
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Not available today</h3>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.5, color: 'var(--text-secondary)', maxWidth: '340px' }}>
            {weeklyGoalWindowMessage()}
          </p>
          <button type="button" className="btn btn-primary" style={{ marginTop: '8px', width: '100%', maxWidth: '280px' }} onClick={() => navigate('/track-goal')}>
            Back to Goal Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in delay-100" style={{ paddingBottom: '30px' }}>
      <div className="flex-center" style={{ justifyContent: 'flex-start', marginBottom: '20px', gap: '15px' }}>
        <button type="button" onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--primary)' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '22px', margin: 0 }}>Set Weekly Goals</h2>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', padding: '10px 12px', background: 'rgba(57,210,192,0.12)', borderRadius: '12px' }}>
        Weekly goals can only be submitted on <strong>Saturday</strong> and <strong>Sunday</strong>. After submit, your summary is copied and your group link opens (same as the mobile app).
      </p>

      {submitError && (
        <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,89,99,0.12)', borderRadius: '12px', color: 'var(--error)', fontSize: '14px' }}>
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-col" style={{ gap: '20px' }}>
        <div>
          <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Prayer goals — weekly</label>
          <textarea
            name="prayerGoalWeek"
            className="input-field"
            placeholder="Weekly prayer target (matches app: week field)"
            value={formData.prayerGoalWeek}
            onChange={handleChange}
            rows={2}
          />
        </div>
        <div>
          <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Prayer goals — daily</label>
          <textarea
            name="prayerGoalDaily"
            className="input-field"
            placeholder="How many minutes/hours will you pray daily?"
            value={formData.prayerGoalDaily}
            onChange={handleChange}
            rows={2}
            required
          />
        </div>

        <div>
          <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Bible study — weekly</label>
          <textarea
            name="bibleStudyWeek"
            className="input-field"
            placeholder="Weekly Bible reading plan"
            value={formData.bibleStudyWeek}
            onChange={handleChange}
            rows={2}
          />
        </div>
        <div>
          <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Bible study — daily</label>
          <textarea
            name="bibleStudyDaily"
            className="input-field"
            placeholder="How many chapters/verses per day?"
            value={formData.bibleStudyDaily}
            onChange={handleChange}
            rows={2}
            required
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
            required
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
            required
          />
        </div>

        <div>
          <label style={{ fontWeight: 'bold', marginBottom: '8px', display: 'block' }}>Resources consumption</label>
          <input
            type="number"
            name="resourceConsumption"
            className="input-field"
            placeholder="How many resources will you consume? (of 6)"
            value={formData.resourceConsumption}
            onChange={handleChange}
            required
            min={0}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', padding: '15px' }}>
          {loading ? 'Submitting...' : 'Submit Goals'}
        </button>
      </form>
    </div>
  );
}
