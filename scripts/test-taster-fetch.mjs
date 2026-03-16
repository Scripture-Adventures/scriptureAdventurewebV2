/**
 * Test script: does taster_members return a row for the given email (and optional cohort id)?
 * Run from webapp folder: node scripts/test-taster-fetch.mjs
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rpnwvaptbtpkislfxcbh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwbnd2YXB0YnRwa2lzbGZ4Y2JoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3MTgyMTAsImV4cCI6MjA3NDI5NDIxMH0.hRFtf0RRdFor9LOK7vedNeYGZp1lU2Btr6kuEcc3zvs';

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = 'adebayodavid17108247@gmail.com';
const COHORT_ID = 9;

async function run() {
  console.log('Querying taster_members for email:', TEST_EMAIL);
  console.log('Optional filter: current_cohort_id =', COHORT_ID);
  console.log('---');

  // 1) By email only (what Home does today)
  const { data: byEmail, error: errEmail } = await supabase
    .from('taster_members')
    .select('*')
    .eq('email', TEST_EMAIL)
    .single();

  console.log('By email only (.single()):');
  console.log('  error:', errEmail ? { code: errEmail.code, message: errEmail.message } : null);
  console.log('  data:', byEmail ? JSON.stringify(byEmail, null, 2) : null);
  console.log('---');

  // 2) By email + cohort_id (maybe .single() fails if multiple rows; try .maybeSingle() or filter by cohort)
  const { data: byEmailAndCohort, error: errCohort } = await supabase
    .from('taster_members')
    .select('*')
    .eq('email', TEST_EMAIL)
    .eq('current_cohort_id', COHORT_ID)
    .maybeSingle();

  console.log('By email + current_cohort_id = 9 (.maybeSingle()):');
  console.log('  error:', errCohort ? { code: errCohort.code, message: errCohort.message } : null);
  console.log('  data:', byEmailAndCohort ? JSON.stringify(byEmailAndCohort, null, 2) : null);
  console.log('---');

  // 3) All rows for this email (in case there are multiple)
  const { data: allRows, error: errAll } = await supabase
    .from('taster_members')
    .select('id, email, firstname, lastname, current_cohort_id')
    .eq('email', TEST_EMAIL);

  console.log('All rows for this email:');
  console.log('  error:', errAll ? { code: errAll.code, message: errAll.message } : null);
  console.log('  count:', allRows?.length ?? 0);
  if (allRows?.length) console.log('  rows:', JSON.stringify(allRows, null, 2));
}

run().catch((e) => { console.error(e); process.exit(1); });
