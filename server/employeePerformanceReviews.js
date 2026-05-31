function n(value) {
  return Number(value || 0);
}

function round(value) {
  return Math.round(n(value) * 100) / 100;
}

function currentQuarterBounds() {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3);
  const start = new Date(now.getFullYear(), quarter * 3, 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), quarter * 3 + 3, 0).toISOString().slice(0, 10);
  return { start, end, label: `Q${quarter + 1} ${now.getFullYear()}` };
}

export async function ensureEmployeePerformanceReviewSchema(db) {
  await db.query(`
    create table if not exists employee_attendance_events (
      id bigserial primary key,
      employee_id bigint not null references employees(id) on delete cascade,
      event_date date not null default current_date,
      event_type text not null check (event_type in ('clock_in','clock_out','late_arrival','early_departure','missed_clock_in','missed_clock_out','call_out','no_show','left_midday','returned_midday','pto_used','sick_time_used','unpaid_absence','overtime_worked','covered_shift','came_in_when_called','manager_correction','employee_acknowledgement')),
      status text not null default 'recorded' check (status in ('recorded','pending_approval','approved','denied','disputed','excused','unexcused')),
      scheduled_start timestamptz,
      scheduled_end timestamptz,
      actual_start timestamptz,
      actual_end timestamptz,
      minutes_missed integer not null default 0,
      minutes_overtime integer not null default 0,
      reason text,
      approval_source text,
      manager_name text,
      scan_ref text,
      vault_ref text,
      guard_ref text,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists employee_performance_notes (
      id bigserial primary key,
      employee_id bigint not null references employees(id) on delete cascade,
      note_date date not null default current_date,
      note_type text not null check (note_type in ('positive','coaching','write_up','customer_praise','manager_note','safety','training','policy','attendance','teamwork','overtime_help','called_in_help')),
      severity text not null default 'normal' check (severity in ('positive','normal','coaching','warning','critical')),
      title text not null,
      detail text,
      manager_name text,
      employee_acknowledged_at timestamptz,
      scan_ref text,
      vault_ref text,
      guard_ref text,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create table if not exists employee_review_cycles (
      id bigserial primary key,
      tenant_id text not null default 'steelcraft',
      cycle_name text not null,
      cycle_type text not null check (cycle_type in ('quarterly','half_year','yearly','custom')),
      start_date date not null,
      end_date date not null,
      status text not null default 'open' check (status in ('open','drafting','manager_review','employee_acknowledgement','closed')),
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (tenant_id, cycle_name)
    );

    create table if not exists employee_reviews (
      id bigserial primary key,
      review_cycle_id bigint not null references employee_review_cycles(id) on delete cascade,
      employee_id bigint not null references employees(id) on delete cascade,
      status text not null default 'draft' check (status in ('draft','manager_review','employee_review','acknowledged','closed','disputed')),
      attendance_score numeric(6,2) not null default 0,
      reliability_score numeric(6,2) not null default 0,
      teamwork_score numeric(6,2) not null default 0,
      policy_score numeric(6,2) not null default 0,
      positive_contribution_score numeric(6,2) not null default 0,
      overall_score numeric(6,2) not null default 0,
      ai_summary text,
      manager_summary text,
      employee_response text,
      improvement_plan text,
      scan_ref text,
      vault_ref text,
      guard_ref text,
      raw jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (review_cycle_id, employee_id)
    );
  `);
}

export async function seedDemoAttendanceAndReviewData(db) {
  await ensureEmployeePerformanceReviewSchema(db);
  const employees = await db.query(`select id, first_name, last_name, department, role_title from employees where employment_status = 'active' order by id limit 20`).catch(() => ({ rows: [] }));
  for (const [index, employee] of employees.rows.entries()) {
    const existing = await db.query(`select count(*)::int as count from employee_attendance_events where employee_id = $1`, [employee.id]);
    if (existing.rows[0].count > 0) continue;
    const events = [
      ['late_arrival', index % 3 === 0 ? 2 : 0, 'Traffic / late arrival pattern'],
      ['missed_clock_out', index % 4 === 0 ? 1 : 0, 'Forgot clock out; manager correction required'],
      ['call_out', index % 5 === 0 ? 1 : 0, 'Call-out recorded'],
      ['sick_time_used', index % 5 === 0 ? 1 : 0, 'Approved sick time'],
      ['pto_used', index % 6 === 0 ? 1 : 0, 'Approved PTO'],
      ['left_midday', index % 7 === 0 ? 1 : 0, 'Left midday with approval'],
      ['overtime_worked', index % 2 === 0 ? 3 : 1, 'Worked overtime when requested'],
      ['came_in_when_called', index % 4 === 0 ? 2 : 0, 'Came in on short notice'],
      ['covered_shift', index % 3 === 1 ? 1 : 0, 'Covered shift for team']
    ];
    for (const [eventType, count, reason] of events) {
      for (let i = 0; i < count; i += 1) {
        await db.query(
          `insert into employee_attendance_events (employee_id, event_date, event_type, status, minutes_missed, minutes_overtime, reason, manager_name, raw)
           values ($1, current_date - ($2::int * interval '7 days'), $3, $4, $5, $6, $7, $8, $9)`,
          [employee.id, i + index, eventType, eventType.includes('missed') ? 'pending_approval' : 'approved', ['late_arrival','left_midday','call_out','no_show','missed_clock_in','missed_clock_out'].includes(eventType) ? 30 + (i * 10) : 0, eventType === 'overtime_worked' ? 60 + (i * 30) : 0, reason, employee.manager_name || 'Manager', { seeded: true }]
        );
      }
    }
    if (index % 2 === 0) {
      await db.query(
        `insert into employee_performance_notes (employee_id, note_type, severity, title, detail, manager_name, raw)
         values ($1,'positive','positive',$2,$3,'Manager',$4)`,
        [employee.id, 'Helped team when coverage was needed', 'Employee worked overtime or came in when called and supported the team.', { seeded: true }]
      );
    }
    if (index % 5 === 0) {
      await db.query(
        `insert into employee_performance_notes (employee_id, note_type, severity, title, detail, manager_name, raw)
         values ($1,'coaching','coaching',$2,$3,'Manager',$4)`,
        [employee.id, 'Attendance coaching note', 'Review late arrivals and missed punch pattern next cycle.', { seeded: true }]
      );
    }
  }
}

export async function createOrGetReviewCycle(db, { tenantId = 'steelcraft', cycleType = 'quarterly', startDate = null, endDate = null, cycleName = null } = {}) {
  await ensureEmployeePerformanceReviewSchema(db);
  const bounds = currentQuarterBounds();
  const start = startDate || bounds.start;
  const end = endDate || bounds.end;
  const name = cycleName || (cycleType === 'quarterly' ? bounds.label : `${cycleType} ${start} to ${end}`);
  const result = await db.query(
    `insert into employee_review_cycles (tenant_id, cycle_name, cycle_type, start_date, end_date, status, raw)
     values ($1,$2,$3,$4,$5,'open',$6)
     on conflict (tenant_id, cycle_name) do update set cycle_type = excluded.cycle_type, start_date = excluded.start_date, end_date = excluded.end_date, updated_at = now()
     returning *`,
    [tenantId, name, cycleType, start, end, { source: 'employee_review_cycle' }]
  );
  return result.rows[0];
}

function reviewScore(metrics) {
  const attendancePenalty = metrics.lateArrivals * 4 + metrics.missedPunches * 3 + metrics.callOuts * 5 + metrics.noShows * 12 + metrics.leftMidday * 4;
  const positiveBoost = Math.min(20, metrics.overtimeWorked * 3 + metrics.cameInWhenCalled * 5 + metrics.coveredShifts * 4 + metrics.positiveNotes * 5);
  const writeUpPenalty = metrics.writeUps * 10 + metrics.coachingNotes * 4;
  const attendanceScore = Math.max(0, Math.min(100, 100 - attendancePenalty));
  const reliabilityScore = Math.max(0, Math.min(100, 90 - attendancePenalty - writeUpPenalty + positiveBoost));
  const positiveContributionScore = Math.max(0, Math.min(100, 70 + positiveBoost));
  const policyScore = Math.max(0, Math.min(100, 95 - writeUpPenalty - metrics.missedPunches * 2));
  const teamworkScore = Math.max(0, Math.min(100, 75 + metrics.coveredShifts * 6 + metrics.cameInWhenCalled * 5 + metrics.overtimeWorked * 2));
  const overallScore = round((attendanceScore + reliabilityScore + positiveContributionScore + policyScore + teamworkScore) / 5);
  return { attendanceScore, reliabilityScore, positiveContributionScore, policyScore, teamworkScore, overallScore };
}

function buildAiSummary(employee, metrics, scores) {
  const name = `${employee.first_name} ${employee.last_name}`.trim();
  const positives = [];
  const concerns = [];
  if (metrics.cameInWhenCalled) positives.push(`${metrics.cameInWhenCalled} short-notice call-in support event(s)`);
  if (metrics.overtimeWorked) positives.push(`${metrics.overtimeWorked} overtime support event(s)`);
  if (metrics.coveredShifts) positives.push(`${metrics.coveredShifts} covered shift event(s)`);
  if (metrics.positiveNotes) positives.push(`${metrics.positiveNotes} positive manager/customer note(s)`);
  if (metrics.lateArrivals) concerns.push(`${metrics.lateArrivals} late arrival(s)`);
  if (metrics.missedPunches) concerns.push(`${metrics.missedPunches} missed punch event(s)`);
  if (metrics.callOuts) concerns.push(`${metrics.callOuts} call-out(s)`);
  if (metrics.leftMidday) concerns.push(`${metrics.leftMidday} left-midday event(s)`);
  if (metrics.writeUps) concerns.push(`${metrics.writeUps} write-up(s)`);
  return `${name} review summary: Overall score ${scores.overallScore}. Positives: ${positives.length ? positives.join(', ') : 'no extra positive events recorded this cycle'}. Concerns: ${concerns.length ? concerns.join(', ') : 'no major attendance or policy concerns recorded this cycle'}. Manager should verify context before finalizing.`;
}

export async function buildEmployeeReviewReport(db, { tenantId = 'steelcraft', cycleType = 'quarterly', startDate = null, endDate = null } = {}) {
  await ensureEmployeePerformanceReviewSchema(db);
  await seedDemoAttendanceAndReviewData(db);
  const cycle = await createOrGetReviewCycle(db, { tenantId, cycleType, startDate, endDate });
  const employees = await db.query(`select * from employees where employment_status = 'active' order by department, last_name`).catch(() => ({ rows: [] }));
  const reviews = [];
  for (const employee of employees.rows) {
    const events = await db.query(`select * from employee_attendance_events where employee_id = $1 and event_date between $2 and $3`, [employee.id, cycle.start_date, cycle.end_date]);
    const notes = await db.query(`select * from employee_performance_notes where employee_id = $1 and note_date between $2 and $3`, [employee.id, cycle.start_date, cycle.end_date]);
    const metrics = {
      lateArrivals: events.rows.filter((row) => row.event_type === 'late_arrival').length,
      missedPunches: events.rows.filter((row) => ['missed_clock_in','missed_clock_out'].includes(row.event_type)).length,
      callOuts: events.rows.filter((row) => row.event_type === 'call_out').length,
      noShows: events.rows.filter((row) => row.event_type === 'no_show').length,
      leftMidday: events.rows.filter((row) => row.event_type === 'left_midday').length,
      ptoUsed: events.rows.filter((row) => row.event_type === 'pto_used').length,
      sickTimeUsed: events.rows.filter((row) => row.event_type === 'sick_time_used').length,
      unpaidAbsences: events.rows.filter((row) => row.event_type === 'unpaid_absence').length,
      overtimeWorked: events.rows.filter((row) => row.event_type === 'overtime_worked').length,
      cameInWhenCalled: events.rows.filter((row) => row.event_type === 'came_in_when_called').length,
      coveredShifts: events.rows.filter((row) => row.event_type === 'covered_shift').length,
      minutesMissed: events.rows.reduce((sum, row) => sum + n(row.minutes_missed), 0),
      minutesOvertime: events.rows.reduce((sum, row) => sum + n(row.minutes_overtime), 0),
      positiveNotes: notes.rows.filter((row) => row.severity === 'positive' || row.note_type === 'positive').length,
      coachingNotes: notes.rows.filter((row) => row.note_type === 'coaching').length,
      writeUps: notes.rows.filter((row) => row.note_type === 'write_up').length
    };
    const scores = reviewScore(metrics);
    const aiSummary = buildAiSummary(employee, metrics, scores);
    const raw = { metrics, events: events.rows, notes: notes.rows };
    const reviewResult = await db.query(
      `insert into employee_reviews (review_cycle_id, employee_id, status, attendance_score, reliability_score, teamwork_score, policy_score, positive_contribution_score, overall_score, ai_summary, raw)
       values ($1,$2,'draft',$3,$4,$5,$6,$7,$8,$9,$10)
       on conflict (review_cycle_id, employee_id) do update set
         attendance_score = excluded.attendance_score,
         reliability_score = excluded.reliability_score,
         teamwork_score = excluded.teamwork_score,
         policy_score = excluded.policy_score,
         positive_contribution_score = excluded.positive_contribution_score,
         overall_score = excluded.overall_score,
         ai_summary = excluded.ai_summary,
         raw = excluded.raw,
         updated_at = now()
       returning *`,
      [cycle.id, employee.id, scores.attendanceScore, scores.reliabilityScore, scores.teamworkScore, scores.policyScore, scores.positiveContributionScore, scores.overallScore, aiSummary, raw]
    );
    reviews.push({ employee: { id: employee.id, name: `${employee.first_name} ${employee.last_name}`.trim(), department: employee.department, roleTitle: employee.role_title }, metrics, scores, review: reviewResult.rows[0] });
  }
  return { report: 'employee_reviews', cycle, reviewCount: reviews.length, reviews, note: 'AI prepares the review packet. Manager finalizes. Employee may acknowledge or dispute. Scan trace/Vault records attach to final approvals.' };
}

export async function buildAttendanceReport(db, { startDate = null, endDate = null } = {}) {
  await ensureEmployeePerformanceReviewSchema(db);
  await seedDemoAttendanceAndReviewData(db);
  const bounds = currentQuarterBounds();
  const start = startDate || bounds.start;
  const end = endDate || bounds.end;
  const result = await db.query(`
    select e.id as employee_id, e.first_name, e.last_name, e.department, e.role_title,
      count(*) filter (where a.event_type = 'late_arrival')::int as late_arrivals,
      count(*) filter (where a.event_type in ('missed_clock_in','missed_clock_out'))::int as missed_punches,
      count(*) filter (where a.event_type = 'call_out')::int as call_outs,
      count(*) filter (where a.event_type = 'no_show')::int as no_shows,
      count(*) filter (where a.event_type = 'left_midday')::int as left_midday,
      count(*) filter (where a.event_type = 'pto_used')::int as pto_used,
      count(*) filter (where a.event_type = 'sick_time_used')::int as sick_time_used,
      count(*) filter (where a.event_type in ('overtime_worked','came_in_when_called','covered_shift'))::int as positive_coverage_events,
      coalesce(sum(a.minutes_missed),0)::int as minutes_missed,
      coalesce(sum(a.minutes_overtime),0)::int as minutes_overtime
    from employees e
    left join employee_attendance_events a on a.employee_id = e.id and a.event_date between $1 and $2
    where e.employment_status = 'active'
    group by e.id
    order by e.department, e.last_name
  `, [start, end]);
  return { report: 'attendance', startDate: start, endDate: end, rows: result.rows };
}
