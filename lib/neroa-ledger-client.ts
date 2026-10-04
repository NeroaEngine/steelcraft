export async function appendLedgerEvent(event: {
  type: string
  actor: string
  projectId?: string
  payload: Record<string, unknown>
  parentEventIds?: string[]
}) {
  const res = await fetch(`${process.env.NEROA_LEDGER_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.NEROA_LEDGER_API_KEY}`,
    },
    body: JSON.stringify(event),
  })

  if (!res.ok) {
    throw new Error(`Failed to append ledger event: ${res.status}`)
  }

  return res.json()
}
