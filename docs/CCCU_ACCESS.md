# What we need from CCCU to run on the real systems

The demo runs against fake SITS and fake Blackboard. This is the list of access, information and approvals needed to point the same agent at CCCU's real SITS and Blackboard Ultra.

Assumptions for now:
- Login/SSO is out of scope for this list (we'll solve it separately).
- We will get Blackboard REST API access, used for **verification** (reading back what the agent created). The agent itself still works through the UI.

Status key: ☐ not requested · ◐ requested · ☑ granted

---

## 0. Vendor consent — blocking, and not technical

Both vendors' terms restrict automated access to their UIs. This is the first thing to resolve, because it decides whether the UI-agent approach is permissible at all.

- **Tribal (SITS):** the Tribal Admissions Acceptable Use Policy states that users may not access the system by automated means, or scrape, crawl or harvest any content or personal data, **without prior written consent**.
- **Anthology (Blackboard):** the Platform Policies prohibit unauthorised data harvesting, web scraping and password engineering, and bar using electronic means to avoid use limitations or to overload system resources via automated scripts.

Consequences:
- ☐ Confirm with CCCU procurement/legal whether these policies bind CCCU contractually, and whether CCCU can grant consent or whether it must come from the vendor.
- ☐ Request **written consent** for a narrowly scoped pilot: named accounts, listed courses only, module data only (no student records), hidden content only, rate-limited, audit log available on request.
- ☐ In parallel, establish which **sanctioned integration paths** the vendors and CCCU support, since those avoid the question entirely:
  - Anthology: REST API, SIS/Data Integration framework, course templates or content copy
  - Tribal: StuTalk / web services, or a scheduled report or export
- ☐ If consent is refused and no sanctioned write path exists, record that the UI-agent route is closed for these systems and fall back to a human-in-the-loop drafting tool.

Reading a page with an automated browser is "harvesting" on a strict reading, and automating a sign-in is close to "password engineering". The least problematic variant is a human signing in and the automation attaching to an authenticated session — but that is a mitigation, not a permission.

---

## 1. Blackboard Ultra

### Environments
- ☐ A **test/staging Blackboard Ultra instance** to develop against (strongly preferred over production)
- ☐ Its base URL, and confirmation it runs the same Ultra version as production
- ☐ Network access from where the agent runs (VPN / IP allowlist, if required)

### REST API (for verification)
- ☐ A REST application registered on the Anthology developer portal (application key + secret). We can register it; CCCU must then approve it.
- ☐ The application **enabled in CCCU's Blackboard admin panel** (REST API Integrations), linked to a dedicated system user
- ☐ That user's role and entitlements: read courses, read course content (create is not needed for verification)
- ☐ API rate limits / quotas for that integration

### UI account for the agent
- ☐ A Blackboard account with a role that can create content in the target courses (e.g. Instructor / Course Builder) but nothing more
- ☐ A short **allowlist of test courses** the agent may touch during a pilot

### Information
- ☐ **Course ID naming convention** and how it maps to SITS module codes and terms (e.g. `U24CS101-2026-S1`?)
- ☐ Are course shells pre-created from SITS already? By what process (data feed / integration)?
- ☐ Any standard folder / document structure CCCU expects in module pages (names, templates)
- ☐ Which **content editor** our instance uses and how it behaves (see note below), and whether the "New Content Editor (Beta)" flag is on — it becomes mandatory for all customers in December 2026
- ☐ Confirmation that the agent's account holds `Course/Organization (Content Areas) > Edit Materials` on the pilot courses (the privilege needed to edit a Document) and nothing broader
- ☐ Which document block types CCCU expects in module pages (Content block vs HTML block), and whether any template or course-copy process already produces them
- ☐ Release/update schedule (Ultra updates monthly; UI changes can affect the agent)

## 2. SITS

### Environments
- ☐ A **test SITS / e:Vision instance** with realistic, non-personal module data
- ☐ Its URL and network access requirements

### Access
- ☐ A **read-only** account that can view module detail screens and nothing else (no student records)
- ☐ For verification ground truth, one of:
  - ☐ SITS web services / API access (Tribal's integration options, e.g. StuTalk), or
  - ☐ A scheduled report or export of module data (CSV/XML), or
  - ☐ Read-only access to the relevant database views

### Information
- ☐ Which screens show module data, and **screenshots** of them (to make the fake SITS realistic)
- ☐ Where each of our fields lives: title, level, credits, term/occurrence, module leader, description, learning outcomes, assessments (name, type, weighting, due date)
- ☐ Whether due dates and learning outcomes are actually held in SITS, or somewhere else (e.g. a module catalogue system)
- ☐ Assessment type codes and how they map to Coursework / Exam / Presentation / Portfolio
- ☐ Term / occurrence code format (e.g. how "2026/27 Semester 1" is stored)

## 3. Data protection and approvals

- ☐ **DPIA** (data protection impact assessment) covering the agent, since page content is sent to an external LLM
- ☐ Approval to use **OpenAI** for this, and on what terms (enterprise agreement, zero data retention, EU/UK data residency if required)
- ☐ Confirmation of which data may be processed: module data only, staff names (module leaders), **no student data**
- ☐ IT security review of the agent (where it runs, where credentials and logs are stored)
- ☐ Change approval for automated activity on live systems (pilot first, then production)
- ☐ Check vendor terms: automation of the Blackboard (Anthology) and SITS (Tribal) UIs

## 4. People

- ☐ **Learning Technology / Digital Education** team: Blackboard admin, REST integration, course conventions
- ☐ **SITS / Student Records** team: SITS access, data locations, exports
- ☐ **IT Security**: security review, network access
- ☐ **Data Protection Officer**: DPIA, LLM approval
- ☐ 1–2 **module leaders** or admin staff for a pilot and feedback on the created pages

---

## Note: which editor does our Blackboard use?

Blackboard doesn't publicly document which library its Ultra content editor is built on, so we have to check on the real system. Ways to find out:

1. **Browser DevTools (quickest):** open the editor in a CCCU Blackboard course, right-click the text area, choose *Inspect*, and look at the class names around it:
   - `tox-…` → TinyMCE
   - `ql-…` → Quill
   - `ProseMirror` → ProseMirror / Tiptap
   - `ck-…` → CKEditor
   - only `contenteditable` → custom editor
2. **Test the shortcuts:** in the editor, type `- ` or `* ` at the start of a line and see if it becomes a bullet; try `Ctrl/Cmd+B`, and check whether a heading dropdown exists.
3. **Ask the Learning Technology team** or check Anthology's release notes for the content editor.

Why it matters: the agent types formatted content using editor shortcuts (decided for the demo with Quill). If the real editor behaves differently, only the "enter formatted content" step needs to change, which is why it's kept as one swappable step.
