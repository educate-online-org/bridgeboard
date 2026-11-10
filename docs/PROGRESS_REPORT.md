# Bridgeboard — progress report

**For:** [manager] · **From:** [name] · **Date:** [date]
**Repo:** github.com/educate-online-org/bridgeboard

## In one paragraph

I built a working prototype of an AI agent that reads a module's record and sets up the matching page in Blackboard Ultra — creating the folder, writing the overview and assessment documents, formatting them, and leaving everything **hidden** so a person still publishes. It runs end to end on stand-in versions of SITS and Blackboard, and a separate verification step compares the result against the source data rather than trusting the agent. The next stage needs one thing from CCCU: a test Ultra course, plus read-only module data.

## What works today

| Capability | Status | Evidence |
|---|---|---|
| Read module records from SITS | Works, all four test modules | Extracted data matched the source record **exactly, 4 of 4**, including a deliberately broken module |
| Create the Blackboard page (folder + 2 documents) | Works | 3 of 4 modules built and verified: correct structure, correct text, **everything hidden** |
| Refuse bad data instead of guessing | Works | The broken module was flagged with all three reasons (no learning outcomes, an assessment with no due date, weights totalling 90%) and **nothing was created** |
| Survive a change to the Blackboard interface | Works | Re-ran under a second layout with moved buttons and renamed fields: same result |
| Verify the result against the source | Works | A report page showing every check per module; **caught a real defect** (a half-typed line in one document) that the UI looked fine with |
| Re-run without duplicating work | Works | A course already set up is skipped and logged |

Runtime: about 75 seconds per module, roughly 2.5 minutes for four. Model spend for the whole project so far is **under one pound**.

## How it was validated

- **Live runs** against the stand-in systems: 4 modules read, 3 set up, 1 flagged, verification passing.
- **Checks that cost nothing**: everything mechanical (creating content, typing it in, both layouts, the verification rules) is exercised with no model calls at all, which is how each change was tested before paying for a run.
- Screenshots of the result and a screen recording of the run are available separately.

## What is not proven yet

Stated plainly, because it is where the risk sits:

1. **No real system has been touched.** The stand-in SITS and Blackboard are realistic but simplified. Real Ultra builds documents from content *blocks*, so the writing step will need reworking — expected, contained in one part of the code.
2. **Vendor terms.** Tribal prohibits automated access without prior written consent; Anthology prohibits unauthorised harvesting, scraping and automated credential handling. So a pilot on the real systems needs consent in writing, or a different route.
3. **No template or API write path.** If module pages are built by hand today, there is no sanctioned way to create content programmatically — which makes consent, or a human-in-the-loop approach, the only options.

## What I need to move forward

| Ask | From whom | Why |
|---|---|---|
| One empty Ultra course to test in | Blackboard administrator (Learning Technology) | Cannot develop against the real editor without it |
| Read-only access to module records for ~10 modules (or an export) | Student Records | To verify against the real source rather than stand-ins |
| A decision on what is permitted | IT Security / DPO, with Learning Technology | Whether a named account may create hidden content in listed pilot courses for a person to publish |

Supporting documents, ready to send with any of these requests: `docs/PILOT_SCOPE.md` (one page), `docs/DATA_FLOW_DPIA.md` (what data goes where, and to the model provider), `docs/LLM_DATA_EGRESS.md` (measured, with a command that produces it at zero cost for review).

## Recommendation

Three options, cheapest and safest first:

1. **Template + drafting tool (lowest risk, no consent needed).** An Ultra course template gives every module the standard structure; the tool fills in the content and a person pastes and publishes. Most of the time saving, no automation of institutional systems, no vendor-terms question.
2. **Scoped pilot of the agent (needs written consent).** Named accounts, listed courses, hidden content only, a person publishes, rate-limited and logged. This is the version that matches the recording.
3. **Do nothing further.** The prototype stays as evidence of feasibility; no ongoing cost.

I recommend starting with 1 and asking for the consent decision in parallel — option 1 delivers value whatever the answer on consent, and it makes the pilot ask smaller.

## Honest bottom line

The workflow and the verification are proven; the integration is not, and it is gated on access and on permissions rather than on engineering. The useful thing to decide now is not whether the agent is impressive, but whether CCCU will give a test course and a permissions answer — without those, more development is guesswork.
