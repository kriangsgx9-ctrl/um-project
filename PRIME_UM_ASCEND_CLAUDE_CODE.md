# PRIME UM ASCEND
## Digital Leadership Development Platform
### From Agent → Leader → UM

> Product specification for Claude Code
> Version: 1.0
> Status: MVP build-ready
> Primary language: Thai
> UI language: Thai with selective English product terminology
> Design direction: Premium Executive SaaS / enterprise-grade

---

# 1. Product Vision

Build a professional web application that manages the complete development journey of insurance agents who want to become UM.

This is NOT merely an HR dashboard or KPI tracker.

The product must guide each Future UM through:

**PLAN → ACT → PROVE → COACH → GROW → PROMOTE**

The application should make it immediately clear:

1. Where the user is in the UM journey
2. What they need to accomplish
3. What actions they need to do today/this week
4. What evidence they have completed
5. What gaps remain
6. What the Coach/AL needs to coach
7. Whether the person is ready for the Promotion Gate

---

# 2. Product Name

## PRIME UM ASCEND

Tagline:

**From Agent → Leader → UM**

Alternative internal phrase:

**Build People. Build Business. Build Leaders.**

---

# 3. Target Users / Roles

Implement role-based access.

## 3.1 Future UM

An agent participating in the UM development program.

Can:
- View personal journey
- View current phase
- View tasks/actions
- Complete actions
- Submit evidence
- Track KPI
- Track recruitment
- Record coaching
- Complete weekly reflection
- View readiness score
- Prepare for promotion assessment

## 3.2 Coach

Can:
- View assigned Future UMs
- Review actions
- Verify evidence
- Add coaching notes
- Assign development actions
- Review KPI
- Assess competencies
- See risk/gap indicators

## 3.3 AL / Manager

Can:
- View all Future UMs
- View team readiness
- Filter by phase/status
- Review KPI
- Review recruitment funnel
- Review coaching
- Review promotion readiness
- Approve gates
- Generate reports

## 3.4 Admin

Can:
- Manage users
- Manage program cohorts
- Manage roadmap phases
- Manage actions
- Manage competency criteria
- Manage KPI targets
- Manage assessment criteria
- Manage roles/permissions
- Manage system settings

---

# 4. Core Product Principle

Do NOT make the dashboard number-heavy.

The primary UX question is:

> "วันนี้ฉันต้องทำอะไร เพื่อเข้าใกล้ UM อีกกี่ขั้น?"

The Future UM dashboard should prioritize:
- Journey
- Today's actions
- Weekly priorities
- Progress
- Gaps
- Evidence
- Coaching

---

# 5. UM Development Roadmap

The default program is 180 days / 6 phases.

## Phase 01 — DISCOVER
Days 1–14

Objective:
Understand motivation, career vision, current capability and development gaps.

Required outputs:
- UM Vision
- Career Goal
- Current Assessment
- Gap Analysis
- Personal Development Plan

Gate:
**Discover Gate**

---

## Phase 02 — BUILD
Days 15–45

Objective:
Build core capabilities required for a future UM.

Competencies:
- Sales Management
- Recruitment
- Coaching
- Leadership
- Management

Required outputs:
- Skill activities
- Shadowing
- 1-on-1 practice
- Team meeting practice
- Recruitment interview practice
- Coaching practice

Gate:
**Build Gate**

---

## Phase 03 — PRODUCE
Days 46–75

Objective:
Demonstrate personal production discipline and management thinking.

Track:
- Activity
- Appointment
- Presentation
- Case
- FYP
- NBC
- Target vs Actual
- Gap
- Corrective Action

Gate:
**Produce Gate**

---

## Phase 04 — RECRUIT
Days 76–120

Objective:
Build a sustainable recruitment pipeline.

Recruitment funnel:
Prospect → Contact → Interview → Presentation → Follow-up → Commit → Onboard

Track:
- Candidate Mapping
- Contacts
- Interviews
- Presentations
- Follow-ups
- Commits
- New Agents

Gate:
**Recruit Gate**

---

## Phase 05 — LEAD
Days 121–150

Objective:
Operate a mini-team and demonstrate leadership.

Recommended mini-team:
3–5 people

Required:
- Team planning
- Daily activity follow-up
- Weekly 1-on-1
- Team meeting
- KPI review
- Coaching
- Team development plan

Gate:
**Lead Gate**

---

## Phase 06 — PROVE
Days 151–180

Objective:
Demonstrate that the Future UM can operate as a leader.

Required:
- Team Business Plan
- Recruitment Plan
- 90-Day Team Plan
- Leadership Presentation
- Final Assessment
- Evidence Portfolio
- Coach Assessment

Gate:
**Promotion Gate**

---

# 6. Navigation

Desktop navigation:

- Dashboard
- My Journey
- Actions
- Performance
- Recruitment
- Development
- Leadership
- Evidence
- Promotion

Coach / AL:
- My Team
- Team Dashboard
- Coaching
- Assessments
- Promotion Review

Admin:
- Users
- Cohorts
- Roadmap
- KPI Settings
- Competencies
- Reports
- Settings

Mobile navigation should be simplified:
- Home
- Journey
- Actions
- Team
- Profile

---

# 7. Dashboard — Future UM

Route:
`/dashboard`

The dashboard must feel like a personal command center.

## Header

Show:
- Greeting
- User name
- Current role
- Notification
- Profile

Example:

> Good morning, Kriang 👋
>
> Future UM
>
> Let's move one step closer to UM today.

---

## UM Journey Card

Display:
- Current phase
- Phase name
- Overall progress
- Current phase progress
- Days remaining
- Next gate

Example:

**RECRUIT**
Phase 4 of 6

Progress:
68%

Days:
24 remaining

Next:
Recruit Gate

---

## Today's Action Card

Show 3–5 priority actions.

Each action:
- Category
- Title
- Due time/date
- Status
- CTA

Examples:
- Interview Candidate
- Coaching Session
- Review Team KPI
- Update Recruitment Pipeline

CTA:
**Start Action**

---

## Weekly Priority

Show top 3 priorities generated from:
- incomplete actions
- KPI gaps
- current phase
- upcoming gate
- coach recommendations

---

## Readiness Score

Display:
`82 / 100`

Use 5 dimensions:
- Personal Production
- Recruitment
- Team Development
- Leadership
- Management

Do not imply that this score replaces official company promotion criteria.

Label:
**Internal UM Readiness**

---

# 8. My Journey

Route:
`/journey`

Use a premium vertical or horizontal timeline.

Structure:

DISCOVER
● Completed

BUILD
● Completed

PRODUCE
● Completed

RECRUIT
● Current

LEAD
○ Upcoming

PROVE
○ Upcoming

UM READY
○

Each phase opens a detail page.

---

# 9. Phase Detail Page

Route:
`/journey/:phaseId`

Display:

## Phase Header
- Phase number
- Phase name
- Objective
- Date range
- Progress
- Gate status

## Mission
A concise statement explaining the phase.

## Required Actions
List action cards.

Each action:
- title
- description
- required/optional
- due date
- status
- evidence requirement
- coach verification

## Gate Checklist

Example:

- [x] Candidate Mapping
- [x] 10 Candidate Contacts
- [x] 3 Interviews
- [ ] Career Presentation
- [ ] 1 New Agent Onboarded

---

# 10. Action Center

Route:
`/actions`

Tabs:
- Today
- This Week
- Upcoming
- Completed

Filters:
- Phase
- Category
- Priority
- Status
- Due date

Action status:
- Not Started
- In Progress
- Submitted
- Waiting Review
- Verified
- Needs Revision
- Completed

Priority:
- Critical
- High
- Medium
- Low

---

# 11. Action Detail

Route:
`/actions/:actionId`

Show:

- Mission
- Why this matters
- Instructions
- Success criteria
- Due date
- Related competency
- Required evidence
- Coach
- Activity history

CTA:
**Complete Action**

If evidence is required:
- upload image/file
- add note
- submit

After submission:
`Waiting for Coach Review`

---

# 12. UM Passport

Route:
`/passport`

Create a premium digital leadership passport.

Display:
- Profile
- Current phase
- Readiness score
- Program start date
- Days in program
- Completed gates
- Competency progress
- Achievement badges
- Evidence count

Sections:
1. Vision
2. Skills
3. Production
4. Recruitment
5. Development
6. Leadership
7. Management

---

# 13. Evidence Portfolio

Route:
`/evidence`

Evidence categories:
- Production
- Recruitment
- Coaching
- Leadership
- Management
- Team Development
- Business Plan
- Presentation

Each evidence record:
- title
- category
- date
- description
- attachments
- related action
- related phase
- verification status
- reviewer
- reviewer comment

Statuses:
- Draft
- Submitted
- Verified
- Revision Required

---

# 14. Performance Dashboard

Route:
`/performance`

Five pillars:

## PRODUCE
- FYP
- NBC
- Case
- Activity
- Target vs Actual

## RECRUIT
- Candidates
- Contacts
- Interviews
- Presentations
- Commits
- New Agents

## DEVELOP
- Coaching sessions
- Training
- 1-on-1
- Development actions

## LEAD
- Team meetings
- Team activity
- Team production
- Team development

## MANAGE
- KPI reviews
- Planning
- Forecast
- Action completion

Use:
- KPI cards
- line charts
- progress bars
- target vs actual
- trend indicators

Do not overload the screen.

---

# 15. Recruitment Funnel

Route:
`/recruitment`

Visual funnel:

Prospect
↓
Contact
↓
Interview
↓
Presentation
↓
Follow-up
↓
Commit
↓
Onboard

Each stage shows count and conversion rate.

Allow:
- Add candidate
- Update stage
- Add next action
- Add note
- Record contact
- Record interview
- Record presentation
- Record outcome

Candidate fields:
- Name
- Contact
- Source
- Current stage
- Owner
- Next action
- Next action date
- Notes
- Created date
- Updated date

Privacy:
Only authorized users may access candidate information.

---

# 16. Development / Coaching

Route:
`/development`

Show:
- Competency matrix
- Coaching sessions
- Skill progress
- Development plan
- Coach feedback

## Coaching Session

Fields:
- Date
- Topic
- Observation
- Strength
- Gap
- Coach feedback
- Action commitment
- Follow-up date
- Status

Framework:

**Observe → Question → Feedback → Action Plan → Follow-up**

---

# 17. Weekly Leadership Review

Route:
`/weekly-review`

Five questions:

1. What happened?
2. What worked?
3. What did not work?
4. What did I learn?
5. What will I do next week?

Add:
- KPI summary
- recruitment summary
- development summary
- top 3 priorities
- coach comment

Allow submission and coach review.

---

# 18. Monthly Business Review

Route:
`/monthly-review`

Generate a structured report:

## UM READINESS
Overall internal readiness

## PERFORMANCE
Production summary

## RECRUITMENT
Recruitment funnel

## DEVELOPMENT
Coaching/training

## LEADERSHIP
Team activity

## KEY ACHIEVEMENTS
Top achievements

## KEY GAPS
Development gaps

## NEXT 30 DAYS
Action plan

Allow export/share.

---

# 19. AL / Coach Command Center

Route:
`/team`

The AL dashboard is a management command center.

Top cards:
- Total Future UMs
- Ready
- Developing
- At Risk
- Current Gate
- Upcoming Gates

Table:

| Name | Phase | Readiness | Gate | Risk | Last Activity |
|---|---|---:|---|---|---|

Clicking a person opens their profile.

---

# 20. Risk Radar

Route:
`/team/risks`

Identify gaps based on:
- overdue actions
- low KPI performance
- inactive recruitment
- missing coaching
- missing evidence
- upcoming gate
- repeated revision
- low engagement

Risk levels:
- Green
- Amber
- Red

Example:

**Leadership Gap**
No leadership activity recorded in the last 14 days.

Recommended action:
> Assign a Team Meeting Leadership Mission.

Important:
This is a development signal, not an automatic judgment of promotion eligibility.

---

# 21. Promotion Gate

Route:
`/promotion`

Show:

## PROMOTION READINESS

Checklist:
- Personal Production
- Recruitment
- Team Development
- Leadership
- Management
- Evidence
- Coach Assessment
- Final Presentation

Each item:
- status
- evidence
- reviewer
- date
- comments

Statuses:
- Not Started
- In Progress
- Ready for Review
- Verified
- Needs Development

---

# 22. Final Assessment

Include:

## 1. Business Plan
How will the candidate build the business?

## 2. Recruitment Plan
How will the candidate build a sustainable recruitment pipeline?

## 3. 90-Day Team Plan
What will the candidate do after becoming UM?

## 4. Leadership Presentation
Present to AL / management.

## 5. Final Assessment
Evaluate competencies.

Use configurable scoring criteria.

Do not hard-code official corporate promotion rules.

---

# 23. Internal UM Readiness Score

Use five dimensions:

| Dimension | Default Weight |
|---|---:|
| Personal Production | 20% |
| Recruitment | 25% |
| Team Development | 20% |
| Leadership | 20% |
| Management | 15% |

Total:
100%

Important:
- Weights must be configurable by Admin.
- Score is an internal development indicator.
- Do not represent it as an official corporate promotion decision unless configured by authorized management.

---

# 24. Competency Matrix

Default competencies:

### Production
- Personal discipline
- Activity management
- Target management
- Performance analysis

### Recruitment
- Candidate sourcing
- Approach
- Interview
- Career presentation
- Follow-up
- Onboarding

### Development
- Coaching
- Feedback
- Development planning
- Follow-up

### Leadership
- Communication
- Motivation
- Delegation
- Accountability
- Team facilitation

### Management
- Planning
- KPI management
- Forecasting
- Problem solving
- Business review

Use 1–5 maturity levels:

1. Awareness
2. Developing
3. Practicing
4. Proficient
5. Leader-ready

---

# 25. Notifications

Notify users about:

- New action assigned
- Action due soon
- Action overdue
- Evidence submitted
- Evidence approved
- Evidence revision required
- Coaching scheduled
- Gate approaching
- Gate review completed
- Important KPI gap
- Weekly review due

Do not create notification overload.

---

# 26. Search

Global search should support:
- users
- candidates
- actions
- evidence
- coaching
- reviews

---

# 27. Design System

## Visual direction

Premium Executive SaaS.

Reference feeling:
- modern
- premium
- clean
- confident
- minimal
- professional
- data-driven
- human

Avoid:
- generic Bootstrap look
- excessive gradients
- excessive glassmorphism
- crowded dashboards
- childish gamification
- overly bright colors

## Brand palette

Primary:
- Deep charcoal / near-black
- White
- PRIME Orange accent

Suggested:
- `#111111`
- `#FFFFFF`
- `#FF6B00`
- `#F5F5F5`
- `#E5E5E5`

Status:
- Green
- Amber
- Red

Do not overuse orange.

Orange is the action / brand accent.

---

# 28. Typography

Primary:
- Inter

Thai:
- IBM Plex Sans Thai
- fallback: Noto Sans Thai

Typography hierarchy:
- Large dashboard numbers
- clear section headings
- compact metadata
- readable body text

Avoid tiny text.

Minimum body size:
14px desktop
15–16px mobile

---

# 29. UI Components

Build reusable components:

- AppShell
- Sidebar
- Topbar
- PageHeader
- KPI Card
- Progress Ring
- Progress Bar
- Journey Timeline
- Phase Card
- Action Card
- Status Badge
- Risk Badge
- Evidence Card
- Coaching Card
- Funnel Chart
- Performance Chart
- Competency Matrix
- Data Table
- Filter Bar
- Search
- Modal
- Drawer
- Toast
- Empty State
- Loading Skeleton
- Confirmation Dialog
- File Upload
- Date Picker
- Dropdown
- Tabs

---

# 30. Responsive Design

Must work well on:

- Desktop
- Laptop
- Tablet
- Mobile

Desktop:
Management / analytics oriented.

Mobile:
Action oriented.

Mobile dashboard priority:

1. Journey
2. Today's actions
3. Readiness
4. KPI
5. Notifications

---

# 31. Recommended Tech Stack

Use a modern, maintainable stack.

Frontend:
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide icons

Charts:
- Recharts

Forms:
- React Hook Form
- Zod

Backend:
- Next.js API routes/server actions OR clean service layer

Database:
- PostgreSQL

ORM:
- Prisma

Authentication:
- Auth.js / compatible production authentication

File storage:
- S3-compatible storage

Deployment:
- Vercel + managed PostgreSQL

If the current project already has an established stack, inspect it first and preserve the existing architecture unless there is a strong reason to change.

---

# 32. Database Model

Suggested entities:

## User
- id
- name
- email
- phone
- role
- avatarUrl
- status
- createdAt
- updatedAt

## Cohort
- id
- name
- startDate
- endDate
- status

## ProgramEnrollment
- id
- userId
- cohortId
- startDate
- currentPhaseId
- status

## Phase
- id
- number
- name
- objective
- startDay
- endDay
- order

## Action
- id
- phaseId
- title
- description
- category
- priority
- requiredEvidence
- dueOffset
- competencyId

## UserAction
- id
- userId
- actionId
- status
- dueDate
- completedAt
- notes

## Evidence
- id
- userId
- actionId
- category
- title
- description
- fileUrl
- status
- reviewerId
- reviewerComment
- verifiedAt

## KPIRecord
- id
- userId
- metric
- period
- target
- actual

## Candidate
- id
- ownerId
- name
- contact
- source
- stage
- nextAction
- nextActionDate
- notes

## CoachingSession
- id
- userId
- coachId
- date
- topic
- observation
- strength
- gap
- feedback
- actionPlan
- followUpDate
- status

## WeeklyReview
- id
- userId
- weekStart
- happened
- worked
- didNotWork
- learned
- nextWeek
- coachComment
- status

## Competency
- id
- name
- category
- description

## CompetencyAssessment
- id
- userId
- competencyId
- score
- reviewerId
- comment
- assessedAt

## Gate
- id
- phaseId
- name
- description

## GateRequirement
- id
- gateId
- title
- type
- required
- order

## GateReview
- id
- userId
- gateId
- status
- reviewerId
- comment
- reviewedAt

## Notification
- id
- userId
- type
- title
- message
- readAt
- createdAt

---

# 33. Permissions

Implement RBAC.

Future UM:
- own data only

Coach:
- assigned users

AL:
- team/cohort users

Admin:
- all program data

Never expose private candidate/contact information to unauthorized users.

---

# 34. Seed Data

Create realistic demo data.

Demo users:
- Future UM 01
- Future UM 02
- Future UM 03
- Coach 01
- AL 01
- Admin 01

Create sample:
- 6 phases
- actions
- KPI records
- recruitment candidates
- coaching sessions
- evidence
- weekly reviews
- assessments

Use clearly fake/demo data.

---

# 35. Important UX Rules

1. Every screen must have a clear primary action.
2. Avoid information overload.
3. Use progressive disclosure.
4. Use consistent status colors.
5. Every task should explain why it matters.
6. Every important action should have feedback.
7. Never make users hunt for their next action.
8. Mobile actions should require minimal taps.
9. Empty states must explain what to do next.
10. Errors must be human-readable.
11. Preserve unsaved form data where practical.
12. Confirm destructive actions.
13. Use optimistic UI only when safe.
14. Provide loading states.
15. Provide accessible keyboard navigation.

---

# 36. Dashboard Information Hierarchy

Future UM:

1. Greeting
2. Current Journey
3. Today's Actions
4. Weekly Priorities
5. Readiness
6. KPI
7. Recruitment
8. Recent Evidence
9. Coach Feedback

AL:

1. Team health
2. At-risk people
3. Current phases
4. Readiness
5. KPI
6. Recruitment
7. Coaching
8. Upcoming gates

---

# 37. Gamification

Use subtle professional gamification.

Badges:
- First Leadership Mission
- Recruitment Builder
- Coaching Starter
- Team Leader
- Evidence Champion
- Gate Completed

Do not make the product feel like a game.

The goal is professional leadership development.

---

# 38. AI UM Coach — V3

Build the architecture so AI can be added later.

Potential AI features:

## Daily Priority
Analyze:
- current phase
- overdue actions
- KPI gaps
- upcoming gate
- coach notes

Return:
Top 3 priorities.

## Weekly Coaching Insight
Summarize:
- progress
- strengths
- gaps
- recommended actions

## Risk Detection
Identify:
- inactivity
- repeated overdue actions
- missing evidence
- recruitment slowdown
- coaching gaps

AI must present recommendations as development suggestions, not official promotion decisions.

---

# 39. Reporting

Reports:
- Individual UM Progress
- Cohort Progress
- Recruitment Report
- KPI Report
- Coaching Report
- Evidence Report
- Gate Readiness Report
- Monthly Business Review

Export:
- PDF
- CSV

---

# 40. Audit Trail

Track important events:

- action created
- action completed
- evidence submitted
- evidence reviewed
- score changed
- assessment completed
- gate reviewed
- role changed

Audit fields:
- actor
- action
- entity
- entityId
- timestamp
- metadata

---

# 41. Security

Minimum:
- secure authentication
- RBAC
- server-side authorization
- validation with Zod
- protected API routes
- secure file upload
- input sanitization
- audit logging
- no sensitive information in client-side source
- environment variables for secrets

Never hard-code secrets.

---

# 42. Accessibility

Target:
WCAG 2.1 AA where practical.

Include:
- semantic HTML
- keyboard navigation
- visible focus
- accessible labels
- adequate contrast
- screen-reader friendly status
- no color-only meaning

---

# 43. MVP Scope

Do NOT build everything at once.

MVP must include:

### Authentication
- Login
- Role-based access

### Future UM
- Dashboard
- Journey
- Actions
- KPI
- Recruitment
- Evidence
- Coaching
- Readiness

### Coach/AL
- Team dashboard
- User detail
- Evidence review
- Coaching
- Gate review

### Admin
- Basic user management
- Roadmap management
- KPI settings

### Reporting
- Individual progress
- Team progress

---

# 44. Recommended Build Order

## Sprint 1
- Project setup
- Design system
- Authentication
- RBAC
- Database
- App shell

## Sprint 2
- Dashboard
- Journey
- Phase detail
- Actions

## Sprint 3
- KPI
- Recruitment
- Evidence

## Sprint 4
- Coaching
- Weekly review
- Competencies

## Sprint 5
- AL dashboard
- Risk radar
- Gate review

## Sprint 6
- Promotion gate
- Reporting
- QA
- Mobile optimization
- Accessibility
- Security review

---

# 45. Acceptance Criteria

The application is not considered complete until:

- Login works
- Role permissions work
- Future UM can see journey
- Future UM can complete actions
- Evidence can be uploaded/submitted
- Coach can review evidence
- KPI can be recorded
- Recruitment funnel works
- Coaching records work
- Readiness score calculates correctly
- AL can view team
- Gate review works
- Mobile layout works
- Loading states work
- Empty states work
- Error states work
- No obvious UI overflow
- No console errors in normal flows
- Database persistence works
- Authorization is enforced server-side

---

# 46. Visual Quality Bar

The product should look like a premium SaaS product suitable for presentation to senior management.

Target impression:

**Executive**
**Premium**
**Modern**
**Trustworthy**
**Focused**
**Human**
**Data-driven**

Do not settle for a basic CRUD interface.

Before considering a screen complete, check:

- spacing
- typography
- hierarchy
- alignment
- responsive behavior
- interaction states
- empty state
- loading state
- error state
- hover/focus state
- mobile usability

---

# 47. Claude Code Instructions

Before coding:

1. Inspect the repository.
2. Identify existing framework and architecture.
3. Do not overwrite working code unnecessarily.
4. Create a short implementation plan.
5. Build the design system first.
6. Build reusable components.
7. Build database/schema.
8. Build core user flows.
9. Test each flow.
10. Fix TypeScript/lint/build errors.
11. Test responsive layouts.
12. Provide a concise completion summary.

When uncertain:
- prioritize maintainability
- prioritize UX
- prioritize data integrity
- prioritize role security
- avoid unnecessary dependencies

Do not create fake functionality that appears to work but does not persist data.

For unavailable integrations:
- create a clean service abstraction
- use demo/mock data only in development
- clearly separate mock mode from production mode

---

# 48. First Implementation Milestone

Start with these pages:

1. `/login`
2. `/dashboard`
3. `/journey`
4. `/journey/[phaseId]`
5. `/actions`
6. `/performance`
7. `/recruitment`
8. `/development`
9. `/evidence`
10. `/promotion`
11. `/team`
12. `/team/[userId]`

The first working demo should allow this complete flow:

**Login → Dashboard → Journey → Action → Complete → Submit Evidence → Coach Review → Readiness Update → Gate Review**

---

# 49. Final Product Principle

The application should always answer three questions:

### WHERE AM I?
Current phase and progress.

### WHAT SHOULD I DO?
Today's and this week's actions.

### AM I READY?
Evidence, competency, readiness and gate status.

The ultimate experience:

> **Open the app → immediately understand your position → know what to do next → complete the action → prove it → receive coaching → move forward.**

This is the core of PRIME UM ASCEND.
