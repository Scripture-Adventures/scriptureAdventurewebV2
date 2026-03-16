import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export default function History() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { tasterOnboardingDone, tasterEmail, currentCohort, currentCohortId } = useAppStore();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        // Taster flow: use taster_plan_submissions filtered to the current cohort's taster member
        if (tasterOnboardingDone) {
          const email = tasterEmail || user?.email;
          if (!email) {
            setReports([]);
            return;
          }

          // Find the taster_members row for this email + cohort (or fallback to first row)
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
              console.error('Error fetching taster member for history (by cohort):', error);
            }
            member = data;
          } else {
            const { data, error } = await supabase
              .from('taster_members')
              .select('*')
              .eq('email', email)
              .limit(1);
            if (error) {
              console.error('Error fetching taster member for history:', error);
            }
            member = data?.[0] ?? null;
          }

          if (!member) {
            setReports([]);
            return;
          }

          const { data, error: historyError } = await supabase
            .from('taster_plan_submissions')
            .select('*')
            .eq('taster_memberid', member.id)
            .order('created_at', { ascending: false })
            .limit(20);

          if (historyError) {
            console.error('Error fetching taster history:', historyError);
          }
          if (data) setReports(data);
          return;
        }

        // Main adventure flow: use main_plan_submissions by main_member_id
        if (user) {
          const { data, error } = await supabase
            .from('main_plan_submissions')
            .select('*')
            .eq('main_member_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

          if (error) {
            console.error('Error fetching main history:', error);
          }
          if (data) setReports(data);
        }
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [tasterOnboardingDone, tasterEmail, currentCohort, currentCohortId]);

  return (
    <div className="container animate-fade-in delay-100" style={{ paddingBottom: '20px' }}>
      {/* Header */}
      <div className="flex-center" style={{ marginBottom: '20px', backgroundColor: 'var(--surface-elevated)', padding: '15px', borderRadius: 'var(--radius-md)' }}>
        <h2 style={{ fontSize: '18px', textAlign: 'center' }}>Adventure Reports</h2>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '30vh' }}>
          <Loader className="animate-spin text-primary" size={30} />
        </div>
      ) : reports.length === 0 ? (
        <div className="flex-col" style={{ gap: '15px', marginTop: '20px' }}>
          <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
            <h4>No history yet</h4>
            <p className="text-muted" style={{ fontSize: '14px', marginTop: '10px' }}>
              Start an adventure and submit reports to see your history here.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-col" style={{ gap: '15px' }}>
          {reports.map((report, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '15px', borderLeft: '4px solid var(--primary)' }}>
              <p style={{ fontWeight: 'bold' }}>Submission: {new Date(report.created_at).toLocaleDateString()}</p>
              <p className="text-muted" style={{ fontSize: '14px' }}>{report.status || 'Active'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
