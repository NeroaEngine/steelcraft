const DEMO_TENANT = 'steelcraft-demo';

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function round(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function makeProof(seed) {
  let hash = 0;
  const text = String(seed || 'neroa-comptroller-production');
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  return `neroaproof:demo:${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

const employees = [
  ['EMP-001', 'John Rivera', 'Press Lead', 25.00],
  ['EMP-002', 'Maria Lane', 'Press Operator', 24.00],
  ['EMP-003', 'David Brooks', 'Press Operator', 23.00],
  ['EMP-004', 'Tina Cole', 'Press Operator', 22.50],
  ['EMP-005', 'Marcus Green', 'Press Assistant', 22.00],
  ['EMP-006', 'Avery King', 'Press Assistant', 21.50],
  ['EMP-007', 'Nina Perez', 'Production Prep', 21.00],
  ['EMP-008', 'Caleb Scott', 'Production Prep', 20.50],
  ['EMP-009', 'Riley Stone', 'Quality Control', 20.00],
  ['EMP-010', 'Olivia Hart', 'Quality Control', 19.50],
  ['EMP-011', 'Ben Adams', 'Finishing', 19.00],
  ['EMP-012', 'Maya Reed', 'Finishing', 18.50],
  ['EMP-013', 'Sam Young', 'Packing', 18.00],
  ['EMP-014', 'Lexi Moore', 'Packing', 17.50],
  ['EMP-015', 'Chris Ford', 'Shipping', 17.00],
  ['EMP-016', 'Ella Price', 'Runner', 16.50],
  ['EMP-017', 'Noah Ward', 'Runner', 16.00]
];

const fixedCosts = [
  ['Rent / building', 15000],
  ['Equipment leases', 12000],
  ['Insurance', 6500],
  ['Software / phones / internet', 4500],
  ['Utilities', 5200],
  ['Vehicles / fuel base', 4800],
  ['Admin salaries burden', 9000]
];

const machines = [
  ['M1', 'Auto press 1', 2500, 0.65],
  ['M2', 'Auto press 2', 2700, 0.85],
  ['M3', 'Manual / specialty press', 3500, 0.35],
  ['M4', 'Auto press 4', 2600, 0.55]
];

const customers = ['Atlas Apparel', 'River City Merch', 'Forge Fitness', 'Summit School', 'Northside Church', 'Pine Street Events', 'Apex Roofing', 'Blue Line Electric', 'Bright Path Academy', 'Cedar Creek Outdoors', 'Union Baseball', 'Metro Coffee', 'Harbor Plumbing', 'Oak Grove PTO', 'Wildcat Boosters', 'Stone River Supply', 'Main Street Market', 'Coastal Soccer', 'Vega Motors', 'Iron House Gym'];
const vendors = ['Blank Shirt Supply', 'InkPro Distribution', 'Box + Poly Mailers', 'Screen Room Supply', 'UPS Demo Feed', 'Payroll Clearing', 'Utility Provider', 'Equipment Finance Co', 'Lease Management', 'Insurance Carrier'];

function buildAccountingEntries() {
  const entries = [];
  for (let i = 0; i < 80; i += 1) {
    const customer = customers[i % customers.length];
    const amount = round(420 + ((i * 137) % 2600));
    entries.push({
      id: `INV-${String(1001 + i).padStart(4, '0')}`,
      entry_type: 'invoice',
      party: customer,
      amount,
      status: i % 9 === 0 ? 'past_due' : i % 4 === 0 ? 'open' : 'ready',
      ledger_account: 'Screen Printing Revenue',
      proof_anchor: makeProof(`invoice-${i}-${customer}-${amount}`)
    });
  }
  for (let i = 0; i < 65; i += 1) {
    const vendor = vendors[i % vendors.length];
    const amount = round(85 + ((i * 91) % 1800));
    entries.push({
      id: `BILL-${String(2001 + i).padStart(4, '0')}`,
      entry_type: 'bill',
      party: vendor,
      amount,
      status: i % 6 === 0 ? 'needs_review' : 'ready_to_pay',
      ledger_account: i % 3 === 0 ? 'Production Materials' : i % 3 === 1 ? 'Freight and Shipping' : 'Production Supplies',
      proof_anchor: makeProof(`bill-${i}-${vendor}-${amount}`)
    });
  }
  for (let i = 0; i < 45; i += 1) {
    const employee = employees[i % employees.length];
    const amount = round(employee[3] * (6 + (i % 5)));
    entries.push({
      id: `TIME-${String(3001 + i).padStart(4, '0')}`,
      entry_type: 'labor_timecard',
      party: employee[1],
      amount,
      status: i % 10 === 0 ? 'needs_manager_review' : 'approved',
      ledger_account: 'Direct Labor',
      proof_anchor: makeProof(`time-${i}-${employee[1]}-${amount}`)
    });
  }
  for (let i = 0; i < 25; i += 1) {
    const machine = machines[i % machines.length];
    const units = 120 + ((i * 43) % 700);
    const amount = round(units * machine[3]);
    entries.push({
      id: `PROD-${String(4001 + i).padStart(4, '0')}`,
      entry_type: 'production_batch',
      party: machine[1],
      amount,
      units,
      status: 'completed',
      ledger_account: 'Production Output',
      proof_anchor: makeProof(`production-${i}-${machine[1]}-${units}`)
    });
  }
  return entries;
}

export function buildComptrollerProductionReport() {
  const monthlyFixedCost = fixedCosts.reduce((sum, item) => sum + item[1], 0);
  const workDaysPerMonth = 22;
  const calendarDaysPerMonth = 30;
  const dailyFixedCostWorkday = round(monthlyFixedCost / workDaysPerMonth);
  const dailyFixedCostCalendar = round(monthlyFixedCost / calendarDaysPerMonth);

  const machineRows = machines.map(([machineId, machineName, units, rate]) => ({
    machineId,
    machineName,
    units,
    rate,
    productionValue: round(units * rate)
  }));
  const totalUnits = machineRows.reduce((sum, row) => sum + row.units, 0);
  const productionValue = round(machineRows.reduce((sum, row) => sum + row.productionValue, 0));
  const laborHoursPerEmployee = 10;
  const laborRows = employees.map(([employeeId, name, role, hourlyRate]) => ({
    employeeId,
    name,
    role,
    hours: laborHoursPerEmployee,
    hourlyRate,
    laborCost: round(hourlyRate * laborHoursPerEmployee)
  }));
  const directLabor = round(laborRows.reduce((sum, row) => sum + row.laborCost, 0));
  const payrollBurdenRate = 0.12;
  const payrollBurden = round(directLabor * payrollBurdenRate);
  const loadedLabor = round(directLabor + payrollBurden);
  const estimatedDailyResult = round(productionValue - loadedLabor - dailyFixedCostWorkday);
  const unitsPerLaborHour = round(totalUnits / (employees.length * laborHoursPerEmployee));
  const breakEvenUnitsAtAvgRate = round((loadedLabor + dailyFixedCostWorkday) / (productionValue / totalUnits));
  const proofAnchor = makeProof(`${today()}|${productionValue}|${loadedLabor}|${dailyFixedCostWorkday}|${estimatedDailyResult}`);

  return {
    reportDate: today(),
    reportName: 'Daily Comptroller Production Efficiency Report',
    tenantId: DEMO_TENANT,
    fixedCosts: fixedCosts.map(([name, amount]) => ({ name, monthlyAmount: amount })),
    fixedCostSummary: {
      monthlyFixedCost,
      workDaysPerMonth,
      calendarDaysPerMonth,
      dailyFixedCostWorkday,
      dailyFixedCostCalendar
    },
    production: {
      machines: machineRows,
      totalUnits,
      productionValue,
      averageValuePerUnit: round(productionValue / totalUnits),
      unitsPerLaborHour
    },
    labor: {
      employees: laborRows,
      employeeCount: employees.length,
      totalHours: employees.length * laborHoursPerEmployee,
      directLabor,
      payrollBurdenRate,
      payrollBurden,
      loadedLabor
    },
    dailyResult: {
      productionValue,
      loadedLabor,
      dailyFixedCostWorkday,
      estimatedDailyResult,
      breakEvenUnitsAtAvgRate,
      status: estimatedDailyResult >= 0 ? 'positive_day' : 'loss_day'
    },
    comptrollerNarrative: estimatedDailyResult >= 0
      ? `Production produced ${totalUnits.toLocaleString()} units and generated ${money(productionValue)} in production value. After loaded labor of ${money(loadedLabor)} and a workday fixed-cost burden of ${money(dailyFixedCostWorkday)}, estimated operating result is ${money(estimatedDailyResult)}. This is a thin positive day. Neroa recommends watching labor scheduling and machine mix because the margin cushion is only ${money(estimatedDailyResult)}.`
      : `Production produced ${totalUnits.toLocaleString()} units and generated ${money(productionValue)} in production value. After loaded labor of ${money(loadedLabor)} and fixed-cost burden of ${money(dailyFixedCostWorkday)}, the day lost ${money(Math.abs(estimatedDailyResult))}. Neroa recommends reducing scheduled hours, improving machine output mix, or raising unit pricing.`,
    accountingEntries: buildAccountingEntries(),
    proof: {
      proofAnchor,
      chainStatus: 'demo_proof_ready_pending_neroa_proof_anchor',
      proofPath: 'production_summary -> labor_summary -> fixed_cost_burden -> daily_result -> owner_report'
    }
  };
}

export function registerComptrollerProductionDemoRoutes(app) {
  app.get('/api/accounting/comptroller/demo-production/report', async (req, res, next) => {
    try {
      const report = buildComptrollerProductionReport();
      res.json({ ok: true, report });
    } catch (error) { next(error); }
  });

  app.post('/api/accounting/comptroller/demo-production/seed', async (req, res, next) => {
    try {
      const report = buildComptrollerProductionReport();
      res.json({ ok: true, seeded: true, entryCount: report.accountingEntries.length, report });
    } catch (error) { next(error); }
  });
}
