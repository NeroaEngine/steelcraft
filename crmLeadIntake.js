export const LEAD_INTAKE_STATUSES = {
  EMAIL_RECEIVED: 'email_received',
  PARSED: 'parsed',
  TWILIO_CALL_QUEUED: 'twilio_call_queued',
  TWILIO_TEXT_QUEUED: 'twilio_text_queued',
  CALL_ATTEMPTED: 'call_attempted',
  CALL_CONNECTED: 'call_connected',
  CALL_MISSED: 'call_missed',
  SMS_SENT: 'sms_sent',
  SMS_DELIVERED: 'sms_delivered',
  SMS_FAILED: 'sms_failed',
  EMAIL_SENT: 'email_sent',
  EMAIL_OPENED: 'email_opened',
  EMAIL_CLICKED: 'email_clicked',
  NEEDS_MANUAL_REVIEW: 'needs_manual_review',
  QUALIFIED: 'qualified',
  UNQUALIFIED: 'unqualified',
  CREATED_IN_CRM: 'created_in_crm',
};

export const COMMUNICATION_CHANNELS = {
  CALL: 'call',
  SMS: 'sms',
  EMAIL: 'email',
};

export function normalizePhone(value = '') {
  const digits = String(value).replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (String(value).trim().startsWith('+')) return String(value).trim();
  return digits || '';
}

export function extractEmail(value = '') {
  return String(value).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
}

export function extractPhone(value = '') {
  const match = String(value).match(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/);
  return match ? normalizePhone(match[0]) : '';
}

export function extractNameFromBody(body = '') {
  const namePatterns = [
    /(?:name|contact|lead)\s*[:\-]\s*([^\n\r]+)/i,
    /(?:from)\s*[:\-]\s*([^\n\r]+)/i,
  ];
  for (const pattern of namePatterns) {
    const match = String(body).match(pattern);
    if (match?.[1]) return match[1].trim().slice(0, 120);
  }
  return '';
}

export function detectLeadSource({ from = '', subject = '', body = '' } = {}) {
  const haystack = `${from} ${subject} ${body}`.toLowerCase();
  if (haystack.includes('zillow')) return 'Zillow';
  if (haystack.includes('realtor.com') || haystack.includes('realtor')) return 'Realtor.com';
  if (haystack.includes('homes.com')) return 'Homes.com';
  if (haystack.includes('website') || haystack.includes('contact form') || haystack.includes('quote')) return 'Website Form';
  return 'Email Lead';
}

export function detectPipeline({ sourceLabel = '', subject = '', body = '' } = {}) {
  const haystack = `${sourceLabel} ${subject} ${body}`.toLowerCase();
  if (haystack.includes('seller') || haystack.includes('listing')) return 'Seller Leads';
  if (haystack.includes('buyer') || haystack.includes('showing')) return 'Buyer Leads';
  if (haystack.includes('rent') || haystack.includes('rental')) return 'Rental Leads';
  if (haystack.includes('vendor')) return 'Vendor Leads';
  return 'General Leads';
}

export function parseInboundLeadEmail(payload = {}) {
  const subject = payload.subject || payload.Subject || '';
  const from = payload.from || payload.From || payload.sender || '';
  const body = payload.text || payload.TextBody || payload.body || payload.html || payload.HtmlBody || '';
  const sourceLabel = detectLeadSource({ from, subject, body });
  const parsedEmail = extractEmail(`${from} ${body}`);
  const parsedPhone = extractPhone(body);
  const parsedName = extractNameFromBody(body) || String(from).replace(/<[^>]+>/g, '').trim();
  const pipeline = detectPipeline({ sourceLabel, subject, body });

  return {
    rawSubject: subject,
    rawFrom: from,
    rawBody: body,
    parsedName,
    parsedEmail,
    parsedPhone,
    parsedInterest: subject,
    parsedSourceLabel: sourceLabel,
    pipeline,
    status: LEAD_INTAKE_STATUSES.PARSED,
    needsManualReview: !parsedEmail && !parsedPhone,
  };
}

export function planFirstResponse(parsedLead = {}) {
  const actions = [];

  if (parsedLead.parsedPhone) {
    actions.push({
      channel: COMMUNICATION_CHANNELS.CALL,
      provider: 'twilio',
      status: LEAD_INTAKE_STATUSES.TWILIO_CALL_QUEUED,
      to: parsedLead.parsedPhone,
      purpose: 'Call new lead immediately',
    });
    actions.push({
      channel: COMMUNICATION_CHANNELS.SMS,
      provider: 'twilio',
      status: LEAD_INTAKE_STATUSES.TWILIO_TEXT_QUEUED,
      to: parsedLead.parsedPhone,
      body: buildLeadSms(parsedLead),
      purpose: 'Send instant text follow-up',
    });
  }

  if (parsedLead.parsedEmail) {
    actions.push({
      channel: COMMUNICATION_CHANNELS.EMAIL,
      provider: 'email',
      status: LEAD_INTAKE_STATUSES.EMAIL_SENT,
      to: parsedLead.parsedEmail,
      subject: `Re: ${parsedLead.parsedInterest || 'Your request'}`,
      body: buildLeadEmail(parsedLead),
      openTracking: true,
      clickTracking: true,
      purpose: 'Send tracked email follow-up',
    });
  }

  if (!actions.length) {
    actions.push({
      channel: 'manual',
      status: LEAD_INTAKE_STATUSES.NEEDS_MANUAL_REVIEW,
      purpose: 'No usable phone or email found; review raw lead email',
    });
  }

  return actions;
}

export function buildLeadSms(parsedLead = {}) {
  const name = parsedLead.parsedName ? ` ${parsedLead.parsedName.split(' ')[0]}` : '';
  return `Hi${name}, thanks for reaching out. We received your request and can help. What is the best time for a quick call?`;
}

export function buildLeadEmail(parsedLead = {}) {
  const name = parsedLead.parsedName || 'there';
  return `Hi ${name},\n\nThanks for reaching out. We received your request and wanted to follow up right away. Reply here or call/text us with the best time to connect.\n\nThank you.`;
}

export function mapTwilioStatusToLeadStatus(twilioStatus = '', channel = COMMUNICATION_CHANNELS.SMS) {
  const normalized = String(twilioStatus).toLowerCase();

  if (channel === COMMUNICATION_CHANNELS.CALL) {
    if (['completed', 'in-progress', 'answered'].includes(normalized)) return LEAD_INTAKE_STATUSES.CALL_CONNECTED;
    if (['no-answer', 'busy', 'canceled', 'failed'].includes(normalized)) return LEAD_INTAKE_STATUSES.CALL_MISSED;
    return LEAD_INTAKE_STATUSES.CALL_ATTEMPTED;
  }

  if (['sent', 'queued', 'accepted'].includes(normalized)) return LEAD_INTAKE_STATUSES.SMS_SENT;
  if (normalized === 'delivered') return LEAD_INTAKE_STATUSES.SMS_DELIVERED;
  if (['undelivered', 'failed'].includes(normalized)) return LEAD_INTAKE_STATUSES.SMS_FAILED;
  return normalized || LEAD_INTAKE_STATUSES.SMS_SENT;
}

export function routeLeadStage({ latestStatus, hasReply = false, emailOpened = false, emailClicked = false } = {}) {
  if (hasReply) return 'Hot Lead';
  if (latestStatus === LEAD_INTAKE_STATUSES.CALL_CONNECTED) return 'Hot Lead';
  if (emailClicked) return 'Engaged';
  if (emailOpened) return 'Opened Message';
  if (latestStatus === LEAD_INTAKE_STATUSES.SMS_DELIVERED) return 'Follow Up';
  if (latestStatus === LEAD_INTAKE_STATUSES.SMS_FAILED) return 'Email Follow Up';
  if (latestStatus === LEAD_INTAKE_STATUSES.NEEDS_MANUAL_REVIEW) return 'Needs Manual Review';
  return 'New Lead';
}

export function explainReadReceipt(channel) {
  if (channel === COMMUNICATION_CHANNELS.EMAIL) {
    return 'Email open tracking can be recorded through a tracking pixel/provider webhook, but privacy tools may make opens imperfect.';
  }
  if (channel === COMMUNICATION_CHANNELS.SMS) {
    return 'SMS does not provide a true read receipt through Twilio. Track delivered, failed, replies, and tracked-link clicks instead.';
  }
  return 'Track provider status callbacks and engagement events where available.';
}
