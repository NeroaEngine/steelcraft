function parseSettings(settings) {
  if (!settings) return {};
  if (typeof settings === 'object') return settings;
  try { return JSON.parse(settings); } catch { return {}; }
}

function columnLabels(column) {
  const settings = parseSettings(column.settings_str || column.settings);
  const labels = settings.labels || {};
  if (Array.isArray(labels)) return labels.filter(Boolean).map(String);
  return Object.values(labels).filter(Boolean).map(String);
}

function simplifyColumn(column) {
  return { sourceId: column.id, sourceTitle: column.title, sourceType: column.type, labels: columnLabels(column) };
}

function boardText(board) {
  const columns = board.columns || [];
  return `${board.name || ''} ${columns.map((column) => `${column.title} ${column.type} ${columnLabels(column).join(' ')}`).join(' ')}`.toLowerCase();
}

function classifyBoard(board) {
  const text = boardText(board);
  if (text.includes('training')) return 'training_support';
  if (text.includes('whitecap') || text.includes('supplier') || text.includes('vendor')) return 'field_supplier_coordination';
  if (text.includes('garage door') || text.includes('steel') || text.includes('concrete') || text.includes('site work') || text.includes('framing') || text.includes('drywall') || text.includes('drop ceiling')) return 'erection_readiness';
  if (text.includes('job') || text.includes('rfi') || text.includes('punch list') || text.includes('submittal') || text.includes('inspection') || text.includes('permitting')) return 'project_execution';
  return 'operations_workflow';
}

function scoreDestination(board, destination) {
  const text = boardText(board);
  let score = 0;
  for (const word of destination.signals) if (text.includes(word)) score += 1;
  return score;
}

function destinationOptions(board) {
  const destinations = [
    { portal: 'Projects Portal', workspace: 'Project Workflow', lane: 'Execution / RFIs / Punch / Submittals', signals: ['job', 'rfi', 'punch', 'submittal', 'inspection', 'permitting', 'architect', 'engineer'] },
    { portal: 'Projects Portal', workspace: 'Erection Readiness', lane: 'Trades / site work / field readiness', signals: ['steel', 'concrete', 'garage door', 'site work', 'framing', 'mechanical', 'electrical', 'drywall', 'drop ceiling', 'civil'] },
    { portal: 'Planning Portal', workspace: 'Production Planning', lane: 'Schedule blockers / handoffs / readiness', signals: ['ready', 'not ready', 'due date', 'pending', 'working on it', 'schedule'] },
    { portal: 'Purchasing Portal', workspace: 'Vendor and Material Coordination', lane: 'Suppliers / material / outside vendors', signals: ['vendor', 'supplier', 'whitecap', 'material', 'delivery', 'po'] },
    { portal: 'HR Portal', workspace: 'Training', lane: 'Employee training and support', signals: ['training', 'employee', 'course'] },
    { portal: 'Contacts / CRM', workspace: 'Relationships', lane: 'Contacts / companies / communication', signals: ['contact', 'customer', 'owner', 'phone', 'email'] },
    { portal: 'Admin', workspace: 'System Setup', lane: 'Internal setup / configuration only', signals: ['setup', 'admin', 'config'] }
  ];

  const ranked = destinations
    .map((destination) => {
      const { signals, ...clean } = destination;
      const score = scoreDestination(board, destination);
      return { ...clean, score, confidence: score >= 4 ? 'high' : score >= 2 ? 'medium' : score === 1 ? 'low' : 'review' };
    })
    .sort((a, b) => b.score - a.score);

  const topScore = ranked[0]?.score || 0;
  return ranked.filter((option, index) => index < 4 || option.score === topScore);
}

function inferField(column) {
  const title = String(column.title || '').toLowerCase();
  const type = String(column.type || '').toLowerCase();
  const labels = columnLabels(column).join(' ').toLowerCase();
  if (title === 'name') return { field: 'work_item_name', label: 'Work item', module: 'workflow' };
  if (type === 'people' || title.includes('owner')) return { field: 'responsible_person', label: 'Responsible person', module: 'assignment' };
  if (title.includes('due')) return { field: 'due_date', label: 'Due date', module: 'schedule' };
  if (title.includes('date')) return { field: 'date', label: 'Date', module: 'schedule' };
  if (title.includes('status') && labels.includes('approved')) return { field: 'approval_status', label: 'Approval status', module: 'approval' };
  if (title.includes('status')) return { field: 'workflow_status', label: 'Workflow status', module: 'workflow' };
  if (title.includes('type') || labels.includes('inspection') || labels.includes('permitting') || labels.includes('rfi')) return { field: 'workflow_type', label: 'Workflow type', module: 'classification' };
  if (title.includes('category') || title.includes('trade') || labels.includes('mechanical') || labels.includes('electrical')) return { field: 'trade_category', label: 'Trade/category', module: 'classification' };
  if (type === 'numbers') return { field: 'quantity_or_reference_number', label: 'Number', module: 'tracking' };
  if (type === 'last_updated') return { field: 'last_activity_at', label: 'Last activity', module: 'audit' };
  if (type === 'dropdown') return { field: 'controlled_option', label: column.title, module: 'classification' };
  return { field: column.id, label: column.title, module: 'custom' };
}

function buildSteps(board) {
  const columns = board.columns || [];
  const statusLabels = columns.flatMap((column) => column.type === 'status' ? columnLabels(column) : []);
  const typeLabels = columns.flatMap((column) => /type|category|trade/i.test(column.title || '') ? columnLabels(column) : []);
  const normalizedStatuses = statusLabels.map((label) => String(label).toLowerCase());
  const steps = [];
  if (normalizedStatuses.some((label) => label.includes('submitted'))) steps.push({ key: 'submitted', label: 'Submitted', source: 'status label' });
  if (normalizedStatuses.some((label) => label.includes('action') || label.includes('pending'))) steps.push({ key: 'needs_action', label: 'Needs action', source: 'status label' });
  if (normalizedStatuses.some((label) => label.includes('inspection'))) steps.push({ key: 'inspection', label: 'Inspection', source: 'type/status label' });
  if (normalizedStatuses.some((label) => label.includes('rfi'))) steps.push({ key: 'rfi', label: 'RFI / question', source: 'type/status label' });
  if (normalizedStatuses.some((label) => label.includes('punch'))) steps.push({ key: 'punch', label: 'Punch item', source: 'type/status label' });
  if (normalizedStatuses.some((label) => label.includes('done') || label.includes('approved'))) steps.push({ key: 'complete', label: 'Complete / approved', source: 'status label' });
  if (normalizedStatuses.some((label) => label.includes('not ready') || label.includes('not approved'))) steps.push({ key: 'blocked', label: 'Blocked / not ready', source: 'status label' });
  if (!steps.length) steps.push({ key: 'intake', label: 'Intake', source: 'default' }, { key: 'assign', label: 'Assign owner', source: 'default' }, { key: 'track', label: 'Track status/date', source: 'default' }, { key: 'complete', label: 'Complete', source: 'default' });
  return { steps, categories: Array.from(new Set(typeLabels)).filter(Boolean).slice(0, 80), statuses: Array.from(new Set(statusLabels)).filter(Boolean).slice(0, 80) };
}

function primaryDestination(board, classification) {
  const options = destinationOptions(board);
  const top = options[0];
  if (top?.score > 0) return top;
  switch (classification) {
    case 'project_execution': return { portal: 'Projects Portal', workspace: 'Project Workflow', lane: 'Execution / RFIs / Punch / Submittals', confidence: 'medium', score: 1 };
    case 'erection_readiness': return { portal: 'Projects Portal', workspace: 'Erection Readiness', lane: 'Readiness / trades / site work', confidence: 'medium', score: 1 };
    case 'field_supplier_coordination': return { portal: 'Purchasing Portal', workspace: 'Vendor and Material Coordination', lane: 'Suppliers / material / outside vendors', confidence: 'medium', score: 1 };
    case 'training_support': return { portal: 'HR Portal', workspace: 'Training', lane: 'Training support workflow', confidence: 'medium', score: 1 };
    default: return { portal: 'Planning Portal', workspace: 'Operations Workflow', lane: 'General workflow tracking', confidence: 'review', score: 0 };
  }
}

function boardDecisionStatus(options) {
  const best = options[0];
  const second = options[1];
  if (!best || best.score === 0) return 'needs_manual_destination';
  if (second && second.score === best.score) return 'needs_tie_breaker';
  if (best.confidence === 'high') return 'suggested_destination_ready_for_review';
  return 'needs_review';
}

export function mapMondayBoardsToSteelCraftWorkflow(boards = []) {
  const boardReviews = boards.map((board) => {
    const isSubitemBoard = String(board.name || '').toLowerCase().startsWith('subitems of');
    const classification = classifyBoard(board);
    const options = destinationOptions(board);
    const destination = primaryDestination(board, classification);
    const stepData = buildSteps(board);
    const fieldMap = (board.columns || []).map((column) => ({ ...simplifyColumn(column), ...inferField(column) }));
    return {
      sourceBoardId: board.id,
      sourceBoardName: board.name,
      sourceBoardRole: isSubitemBoard ? 'subitem_support_board' : 'primary_workflow_board',
      internalName: destination.workspace,
      classification,
      destination,
      destinationOptions: options,
      decisionStatus: isSubitemBoard ? 'review_as_child_workflow' : boardDecisionStatus(options),
      summary: {
        workspaceName: board.workspace?.name || null,
        boardKind: board.board_kind,
        state: board.state,
        columnCount: (board.columns || []).length,
        statusCount: fieldMap.filter((field) => field.sourceType === 'status').length,
        peopleFields: fieldMap.filter((field) => field.sourceType === 'people').length,
        dateFields: fieldMap.filter((field) => field.module === 'schedule').length,
        statusLabels: stepData.statuses,
        categoryLabels: stepData.categories
      },
      workflow: { steps: stepData.steps, categories: stepData.categories, statuses: stepData.statuses },
      fieldMap,
      verificationChecklist: [
        { key: 'review_each_board', label: 'Review this board individually before assigning its ERP location', status: 'required' },
        { key: 'subitem_relationship', label: isSubitemBoard ? 'Confirm which parent workflow this subitem board supports' : 'Confirm this is a primary workflow board', status: isSubitemBoard ? 'needs_review' : 'mapped' },
        { key: 'names_hidden', label: 'Do not show this as a Monday board in the ERP UI', status: 'required' },
        { key: 'destination_confirmed', label: 'Confirm final portal/workspace/lane destination', status: 'needs_review' },
        { key: 'owners_mapped', label: 'Owner/people columns map to responsible person', status: fieldMap.some((field) => field.field === 'responsible_person') ? 'mapped' : 'missing' },
        { key: 'status_mapped', label: 'Status columns map to Steel Craft workflow status/approval', status: fieldMap.some((field) => field.field.includes('status')) ? 'mapped' : 'missing' },
        { key: 'dates_mapped', label: 'Date/due date columns map to schedule fields', status: fieldMap.some((field) => field.module === 'schedule') ? 'mapped' : 'missing' },
        { key: 'categories_mapped', label: 'Type/trade/category values map to internal categories', status: stepData.categories.length ? 'mapped' : 'review' },
        { key: 'excel_separate', label: 'Keep Excel quote engine separate from this workflow source', status: 'required' }
      ]
    };
  });

  const workflowBoards = boardReviews.filter((board) => board.sourceBoardRole === 'primary_workflow_board');
  const subitemBoards = boardReviews.filter((board) => board.sourceBoardRole === 'subitem_support_board');

  return {
    ok: true,
    source: 'monday_api',
    uiName: 'Steel Craft Workflow Source',
    instruction: 'Use this as source mapping only. Do not render the ERP as a Monday board.',
    boardCount: boards.length,
    primaryWorkflowBoardCount: workflowBoards.length,
    subitemSupportBoardCount: subitemBoards.length,
    mappedWorkflowCount: workflowBoards.length,
    boardReviews,
    workflows: workflowBoards,
    subitemBoards,
    reviewOrder: boardReviews.map((item) => ({
      id: item.sourceBoardId,
      sourceBoardName: item.sourceBoardName,
      sourceBoardRole: item.sourceBoardRole,
      internalName: item.internalName,
      decisionStatus: item.decisionStatus,
      suggestedDestination: item.destination,
      otherOptions: item.destinationOptions.slice(1),
      check: item.verificationChecklist
    }))
  };
}
