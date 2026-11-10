# Pilot scope statement

One page, for sign-off by the system owner, the DPO and IT Security. Attach it to any request for accounts or access.

## Objective

Reduce the manual work of setting up Blackboard Ultra module pages at the start of each term. A tool reads a module's record and produces the standard page structure and content. A member of staff reviews and publishes.

## What it reads

Module records only, from SITS: code, title, level, credits, term, module leader, description, learning outcomes, assessments (name, type, weighting, due date).

## What it writes

Per module, in one Ultra course: a folder named **Module Information** containing two documents, **Module Overview** and **Assessment Information**. Everything is created **hidden from students**. No existing content is edited or deleted. No visibility is changed by the tool — publishing is a human action.

## What it does not touch

No student records, names, IDs, marks, submissions or attendance. No enrolments. No grades. No course settings, tools or integrations. No files outside the listed pilot courses.

## Accounts requested

| System | Account | Rights |
|---|---|---|
| SITS | Read-only | View module detail screens only |
| Blackboard Ultra | User role with `Course/Organization (Content Areas) > Edit Materials` | The listed pilot courses only |
| Blackboard Ultra | REST application (verification only) | Read courses and course content |

Plus: one **test/staging** Ultra course or course set, and network access for the machine the tool runs on (VPN or IP allowlist).

## Volume and rate

One course at a time, sequential. Declared ceiling: 60 page loads per hour, no parallel sessions, runs in office hours only, maximum 10 courses in the pilot. The tool stops on the first unexpected condition rather than retrying indefinitely.

## Data protection

- Page content (module data, module leader names) is sent to the model provider for interpretation. **No screenshots** are sent (`ALLOW_SCREENSHOTS=false`).
- Proposed: a processing agreement with no training on our data, retention of no more than 30 days, UK/EEA residency where required.
- Local run logs hold extracted module data only, retained 30 days, on an encrypted managed machine, and are available to CCCU on request.
- Credentials are not stored by the tool: a person signs in, and the tool uses that authenticated session.

## Vendor terms

Access will use only routes the vendors sanction. Where a sanctioned route exists (REST API, templates, course copy, approved export), that route is used instead of driving the user interface. Written consent is obtained from Tribal and Anthology before any automated interaction with their UIs.

## Success criteria

Ten modules processed. Measured: modules set up correctly without manual repair, retries per module, wall-clock time per module, and every item hidden from students at the end. Verification compares the result against the SITS record, not against the tool's own report.

## Out of scope

Production write access beyond the pilot courses, unattended overnight operation, changes to security controls or monitoring, access to student data, and any publishing of content to students.

## Sign-off

| Role | Name | Decision | Date |
|---|---|---|---|
| System owner (SITS / Student Records) | | | |
| System owner (Blackboard / Learning Technology) | | | |
| Data Protection Officer | | | |
| IT Security | | | |
