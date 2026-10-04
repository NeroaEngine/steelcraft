export async function appendLedgerEvent(event) {
  if (!process.env.NEROA_LEDGER_URL || !process.env.NEROA_LEDGER_API_KEY) {
    return { skipped: true, reason: 'NEROA_LEDGER_URL or NEROA_LEDGER_API_KEY is not configured.' };
  }

  const res = await fetch(`${process.env.NEROA_LEDGER_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.NEROA_LEDGER_API_KEY}`
    },
    body: JSON.stringify(event)
  });

  if (!res.ok) {
    throw new Error(`Failed to append ledger event: ${res.status}`);
  }

  return res.json();
}

export function getLedgerProofFields(body = {}) {
  return {
    sourceRepo: body.sourceRepo || process.env.SOURCE_REPO || 'NeroaEngine/steelcraft',
    sourceCommitSha: body.sourceCommitSha || process.env.SOURCE_COMMIT_SHA || process.env.COMMIT_SHA || null,
    sourcePacketId: body.sourcePacketId || null,
    sourceRunnerId: body.sourceRunnerId || process.env.SOURCE_RUNNER_ID || process.env.DIGITALOCEAN_APP_ID || null
  };
}

export function getDagEventId(response) {
  return response?.id || response?.eventId || response?.dagEventId || response?.event?.id || null;
}
