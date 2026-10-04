# IT ERP Industry Pack

## Positioning

The IT industry pack turns Neroa ERP / Business OS into an AI-run IT operations module, not just a ticket board.

The pack is designed for small and mid-sized companies that need clean IT operations, proof, access control, asset tracking, user lifecycle management, software visibility, vendor control, and audit-ready history without running a separate enterprise IT stack.

## Core promise

Neroa IT does not just track tickets. It tracks every IT request, device, user access change, vendor, license, approval, incident, SOP, renewal, cost, and proof record in one operational system.

## Core IT modules

### IT Command Center

Central operating view for IT.

Includes:

- open tickets
- risky devices
- overdue access reviews
- pending approvals
- expiring SaaS renewals
- unresolved incidents
- devices due for replacement
- unused licenses
- IT spend snapshot
- audit/proof activity

### IT Helpdesk

Ticket and support queue for internal IT requests.

Tracks:

- requester
- department
- issue category
- priority
- SLA timer
- status
- assignee
- internal notes
- employee-visible notes
- escalation
- linked asset
- linked user
- recurring issue detection
- resolution proof

Common ticket types:

- password reset
- device issue
- software access
- printer/network issue
- email problem
- onboarding request
- offboarding request
- security concern
- hardware request

### Asset Management

Tracks company-owned or company-managed equipment.

Assets include:

- laptops
- desktops
- phones
- tablets
- printers
- routers
- firewalls
- POS devices
- monitors
- peripherals
- backup devices
- company-issued equipment

Tracks:

- asset tag
- assigned user
- department
- purchase date
- warranty
- condition
- serial number
- lifecycle status
- replacement date
- repair history
- location
- linked receipts
- Vault documents

### User Access Management

Controls employee onboarding, offboarding, and access changes.

Tracks:

- employee
- role
- department
- manager approval
- app access
- permission level
- access request date
- approval date
- granted by
- revoked by
- offboarding checklist
- access removal proof
- exceptions

Common workflows:

- onboard new hire
- change user role
- grant app access
- revoke app access
- offboard employee
- emergency access removal
- admin permission review

### SaaS / License Management

Tracks company software, renewals, seats, and waste.

Systems may include:

- Microsoft 365
- Google Workspace
- Slack
- Zoom
- Adobe
- QuickBooks
- CRM tools
- ERP tools
- industry-specific software
- security platforms
- phone systems

Tracks:

- vendor
- contract owner
- seats purchased
- seats assigned
- unused seats
- cost per seat
- renewal date
- cancellation window
- department usage
- approval owner
- linked contract
- renewal decision

### Device + Security Compliance

Monitors IT hygiene and device readiness.

Tracks:

- antivirus status
- encryption status
- patch status
- MDM status
- device check-in
- risky devices
- unsupported OS
- missing updates
- device ownership
- remote wipe status
- security exceptions
- audit evidence

### Vendor + Contract Management

Tracks IT vendors and service providers.

Vendors include:

- internet provider
- MSP
- phone provider
- cloud provider
- software vendor
- hardware vendor
- cybersecurity vendor
- copier/printer provider

Tracks:

- vendor contact
- contract
- renewal date
- cancellation terms
- support contact
- monthly cost
- service level
- linked tickets
- open disputes
- performance notes
- Vault contract path

### IT Purchasing

Handles hardware and software requests.

Workflow:

1. employee or manager requests hardware/software
2. IT reviews request
3. manager/finance approves
4. quote or purchase order is attached
5. purchase is completed
6. item is received
7. asset/license is created automatically
8. receipt and proof are stored in Vault

Tracks:

- requester
- item requested
- business reason
- cost
- approval path
- vendor
- PO
- receiving status
- assigned asset
- linked user

### Incident Management

Tracks outages, security events, downtime, and root-cause analysis.

Incident examples:

- email outage
- internet outage
- ransomware concern
- phishing incident
- account compromise
- system downtime
- data loss event
- failed backup
- vendor outage
- critical app down

Tracks:

- incident title
- severity
- affected systems
- affected users
- start time
- resolution time
- timeline
- root cause
- prevention steps
- communication log
- owner
- proof files
- Vault incident record

### Knowledge Base / SOPs

Stores IT procedures and AI-generated support documentation.

Includes:

- how-to guides
- onboarding SOPs
- offboarding SOPs
- printer setup
- VPN setup
- software install guides
- access request policy
- password reset policy
- security handling rules
- repeated-ticket SOP suggestions

AI should be able to generate draft SOPs from repeated helpdesk tickets.

### IT Cost Intelligence

Shows IT spend and waste.

Tracks:

- spend by user
- spend by department
- spend by software
- spend by vendor
- cost per asset
- support cost by category
- unused license savings
- renewal exposure
- replacement forecast
- budget forecast

## Neroa-specific differentiator

The IT pack connects directly into Neroa Guard, Vault, Scan, Connect, and the ISO/compliance runners.

Every major IT action creates proof:

- access granted
- access revoked
- device assigned
- device returned
- admin permission changed
- incident opened
- incident closed
- software purchased
- license removed
- offboarding completed
- vendor renewal reviewed
- policy acknowledged

This gives the customer an auditable IT history instead of relying on Slack, email, memory, or spreadsheets.

## AI IT Operator

The killer feature is an AI IT Operator that can answer and act on IT operations questions.

Example commands:

- Show me all unused software licenses.
- Offboard John safely.
- Which laptops are due for replacement?
- Find risky devices.
- Generate the IT SOP for new hires.
- Open an incident report for the email outage.
- Prepare renewal review for all SaaS expiring next month.
- Show all users with admin access.
- Show all devices without encryption.
- Create a purchase request for a new laptop.
- Find every open ticket tied to this device.
- What access does this employee have?
- What proof do we have that this access was revoked?

## First version to build

The first version should include:

1. IT Command Center
2. Tickets
3. Assets
4. Users / Access
5. SaaS Licenses
6. Incidents
7. Vendors
8. SOPs
9. IT Spend Dashboard
10. Scan / Vault / Audit Trail

## IT runners

### IT ticket runner

Creates, routes, prioritizes, escalates, and closes helpdesk tickets.

### IT asset runner

Creates and maintains asset records for devices and equipment.

### User access runner

Manages access requests, approvals, grants, revocations, onboarding, and offboarding.

### SaaS license runner

Tracks licenses, renewals, unused seats, costs, and cancellation opportunities.

### Device compliance runner

Checks encryption, antivirus, MDM, patch, backup, and risk status.

### IT vendor runner

Tracks IT vendors, contracts, renewals, costs, support contacts, and service history.

### IT purchasing runner

Routes hardware/software purchase requests, approvals, POs, receipts, and asset creation.

### Incident runner

Creates and manages incident timelines, severity, affected systems, root cause, and resolution proof.

### IT SOP runner

Creates, updates, reviews, retires, and suggests SOPs from repeated tickets.

### IT cost runner

Tracks spend by user, department, software, vendor, asset, and support category.

### Offboarding runner

Ensures accounts are revoked, devices are returned, access is removed, licenses are reclaimed, and proof is stored.

### IT evidence runner

Writes IT actions into Vault as proof records, including who did what, when, why, and what changed.

## Data objects

Core records:

- Ticket
- Asset
- User access profile
- SaaS license
- Vendor
- Contract
- Incident
- SOP
- Purchase request
- Renewal
- Device compliance record
- Offboarding checklist
- Evidence receipt

## Integration points

The IT pack should eventually connect to:

- Microsoft 365
- Google Workspace
- Slack
- Zoom
- Google Meet
- device management / MDM
- email security systems
- password managers
- accounting / purchasing
- Vault
- Guard Sign
- Neroa Connect

## Vault paths

Suggested Vault structure:

```text
Vault / IT / Assets / {Asset Tag}
Vault / IT / Users / {Employee Name}
Vault / IT / Incidents / {Incident ID}
Vault / IT / Vendors / {Vendor Name}
Vault / IT / SaaS / {Software Name}
Vault / IT / SOPs / {Policy or SOP Name}
Vault / IT / Purchases / {Purchase Request ID}
```

## Best positioning line

Neroa IT gives companies an AI-run IT operations layer where tickets, devices, users, software, vendors, incidents, approvals, access changes, and proof records all live together.

## Base vs module logic

This is an industry pack, not base CRM.

Base Neroa should provide:

- records
- tasks
- approvals
- Vault
- Connect
- proof
- AI summaries
- users and permissions

The IT industry pack adds:

- tickets
- assets
- user access lifecycle
- SaaS licenses
- device compliance
- incidents
- IT vendors
- IT purchasing
- IT SOPs
- IT cost intelligence
