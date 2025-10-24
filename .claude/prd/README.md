# Shift - Product Requirements Documents

**Project:** Shift
**Version:** 1.1
**Last Updated:** 2025-10-24
**Status:** Active Development

---

## Document Index

This directory contains comprehensive Product Requirements Documents (PRDs) for Shift. These living documents guide all development decisions and can be referenced and updated throughout the project lifecycle.

### Core Documents

1. **[Product Overview](./01-product-overview.md)**
   - Problem statement and value proposition
   - Target users and market validation
   - Success metrics and product principles
   - Competitive landscape
   - Go-to-market strategy

2. **[Customer Personas](./02-customer-personas.md)**
   - Primary Persona: Coach Brittlyn (Individual Coach Model)
   - Secondary Persona: Head Coach Sarah (Team Model)
   - Goals, pain points, and jobs-to-be-done
   - Current workflows and workarounds
   - Willingness to pay analysis

3. **[Feature Blueprint](./03-feature-blueprint.md)**
   - Complete feature inventory for Individual Coach Model
   - Complete feature inventory for Coaching Team Model
   - Feature priority matrix (MVP vs. Post-MVP)
   - Detailed functional specifications
   - Feature phasing roadmap

4. **[MVP Requirements](./04-mvp-requirements.md)**
   - MVP scope definition (what's in, what's out)
   - User stories in EARS notation with acceptance criteria
   - Database schema for MVP
   - Technical requirements
   - Success metrics and launch checklist

5. **[Technical Architecture](./05-technical-architecture.md)**
   - Technology stack and justification
   - System architecture and data flow patterns
   - Folder structure and code organization
   - Database schema with RLS policies
   - Security architecture
   - Deployment strategy
   - Performance optimization guidelines

---

## How to Use These Documents

### For Development
- Reference user stories from [MVP Requirements](./04-mvp-requirements.md) when building features
- Follow technical patterns from [Technical Architecture](./05-technical-architecture.md)
- Ensure features align with [Feature Blueprint](./03-feature-blueprint.md) specifications
- Validate against acceptance criteria before marking features complete

### For Planning
- Use [Product Overview](./01-product-overview.md) for strategic decisions
- Reference [Customer Personas](./02-customer-personas.md) for user-centric design
- Prioritize features using the Feature Priority Matrix in [Feature Blueprint](./03-feature-blueprint.md)
- Track progress against [MVP Requirements](./04-mvp-requirements.md)

### For Updates
- Keep documents current as requirements evolve
- Update "Last Updated" date when making changes
- Document decision rationale in relevant sections
- Maintain version history for major changes

---

## Current Development Phase

**Phase:** MVP Development (Sprint 3)
**Focus:** Individual Coach Model Only
**Status:** In Progress

### Completed
- ✅ Product requirements documentation
- ✅ Technical architecture design
- ✅ Next.js project setup
- ✅ Supabase integration
- ✅ User authentication (Sign Up page)

### In Progress
- 🔄 User authentication (Login page, protected routes)
- 🔄 Dashboard layout and navigation

### Upcoming
- ⏳ Client management (CRUD)
- ⏳ Lesson scheduling and calendar
- ⏳ Invoice generation and payment integration

---

## Quick Links

### External Resources
- [Supabase Dashboard](https://app.supabase.com)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Project Resources
- GitHub Repository: [Link when available]
- Figma Designs: [Link when available]
- Project Board: [Link when available]

---

## Document Maintenance

### Ownership
- **Product Owner:** Brittlyn
- **Technical Lead:** [To be assigned]
- **Last Reviewed:** 2025-10-24

### Review Schedule
- **Weekly:** Progress updates and user story status
- **Sprint End:** Feature completion and acceptance criteria verification
- **Monthly:** Full document review and updates

### Change Log

| Date | Document | Changes | Updated By |
|------|----------|---------|------------|
| 2025-10-24 | All | Initial PRD creation | Claude Code |
| 2025-10-24 | All | Updated app name to "Shift" and added emphasis on communication separation | Claude Code |

---

## Feedback & Questions

For questions about these documents or to propose changes:
1. Review the relevant document first
2. Check if the question is addressed in related documents
3. Document your question/proposal with rationale
4. Update documents after decisions are made

---

## Document Conventions

### Status Indicators
- ✅ Completed
- 🔄 In Progress
- ⏳ Pending/Not Started
- ❌ Out of Scope

### Priority Levels
- **P0 (Blocker):** Must-have for MVP launch
- **P1 (Important):** Should-have for MVP, can be post-launch
- **P2 (Nice-to-have):** Good to have, lower priority

### User Story Format (EARS)
- **E (Event):** WHEN [trigger/condition]
- **A (Action):** I want to [action]
- **R (Result):** So that [outcome/benefit]
- **S (Situation):** Because [context/reason]

---

## Related Project Files

### Code
- [Technical Architecture Implementation](../../)
- [Component Library](../../components/)
- [Database Migrations](../../supabase/migrations/)
- [API Routes](../../app/api/)

### Configuration
- [Environment Variables](../../.env.example)
- [Next.js Config](../../next.config.ts)
- [Tailwind Config](../../tailwind.config.ts)
- [TypeScript Config](../../tsconfig.json)

---

*These PRDs are living documents and should be updated as the product evolves. Keep them current, clear, and actionable.*
