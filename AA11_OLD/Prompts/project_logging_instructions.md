# Project Logging Instructions for AI Agents

## CRITICAL: Read This Before Any Project Work

### Your Logging Responsibilities
You are required to maintain accurate, up-to-date project logs for the **Risedial AI Companion** project. Every session must be properly documented to ensure project continuity and prevent backtracking.

---

## STEP 0: Read Project Blueprint FIRST

**MANDATORY:** Before taking any actions, you MUST:

1. **Read the complete `Context/project_blueprint.md` file** - This is your primary context source containing:
   - Complete project overview and mission
   - Technical architecture requirements
   - Business model and legal constraints
   - Therapeutic framework and safety protocols
   - Financial constraints and success criteria
   - AI agent instructions and decision-making hierarchy

2. **Use the blueprint to guide ALL decisions** during this session
3. **Reference the blueprint** when documenting choices and rationale

**DO NOT PROCEED** without reading the project blueprint first.

---

## STEP 1: Read Existing Logs Second

**MANDATORY:** After reading the blueprint, you MUST:

1. **Read the complete `Context/project_logs.md` file**
2. **Review the latest session entries** to understand current status
3. **Check the "Next Session Priorities"** section for guidance
4. **Identify where the project left off** and what was accomplished

**DO NOT PROCEED** without reading the existing logs.

---

## STEP 2: Update Project Logs After Each Session

### Required Log Entry Format

Add your session entry **AT THE TOP** of the project_logs.md file, immediately after the "Session Log Format" section. Use this exact template:

```markdown
### Session [MM/DD/YYYY] - [HH:MM] - [Focus Area]
**Objective:** [Single sentence describing the main goal of this session]

**Actions Taken:**
- [Specific action 1 - be concrete, not vague]
- [Specific action 2 - include file names, calculations, research, etc.]
- [Additional actions as needed]

**Decisions Made:**
- [Key decision 1 with brief rationale based on blueprint guidelines]
- [Key decision 2 with brief rationale]
- [Include business, technical, or strategic decisions]

**Files Created/Modified:**
- `[file path]` - [purpose/changes made]
- `[file path]` - [purpose/changes made]

**Next Actions Required:**
- [Priority 1 action - what must happen next]
- [Priority 2 action - secondary priority]
- [Additional actions as needed]

**Critical Issues/Blockers:**
- [Any issues that need resolution before proceeding]
- [Technical limitations discovered]
- [Legal or business concerns identified]

**Key Insights/Learning:**
- [Important discoveries that impact the project]
- [Unexpected findings or realizations]
- [Cost implications, technical limitations, etc.]

---
```

### Writing Guidelines

**Align with Blueprint Priorities:**
- Reference blueprint guidelines when making decisions
- Prioritize safety and legal compliance (as per blueprint)
- Consider cost implications (financial constraints from blueprint)
- Maintain focus on core mission (stealth therapeutic intervention)

**Be Specific, Not Vague:**
- ✅ Good: "Created cost calculation spreadsheet showing $8.50 CAD per user for 50 messages/day"
- ❌ Bad: "Worked on cost analysis"

**Include Measurable Results:**
- ✅ Good: "Validated n8n can handle 500 concurrent users per workflow instance"
- ❌ Bad: "Researched n8n capabilities"

**Reference Files and Locations:**
- ✅ Good: "Modified `risedial_planning/01_core_assumptions_validation.txt` to add cost breakdown"
- ❌ Bad: "Updated planning file"

**Flag Critical Information:**
- Use **CRITICAL:** prefix for major discoveries or blockers
- Use **DECISION:** prefix for important strategic choices
- Use **RISK:** prefix for potential issues identified
- Use **BLUEPRINT VIOLATION:** if something conflicts with project blueprint

---

## STEP 3: Update Other Tracking Sections

### Update Project Timeline
If you complete major milestones, update the appropriate phase:
- Change ⏳ to 🔄 for "IN PROGRESS" items
- Change 🔄 to ✅ for "COMPLETED" items
- Add new items as needed

### Update Key Decisions Made
Add any significant business, technical, or strategic decisions to the appropriate section.

### Update Outstanding Questions
- Remove questions you've answered
- Add new questions that arise
- Flag urgent research needs

### Update Next Session Priorities
Replace the existing priorities with what should happen next based on your session outcomes.

---

## STEP 4: Maintain File Structure Tracking

When you create or modify files:

1. **Update the "Current File Structure" section**
2. **Include file purpose and current status**
3. **Note any dependencies between files**

---

## STEP 5: Quality Control Checklist

Before ending your session, verify:

- [ ] I read the project_blueprint.md file completely for context
- [ ] I read the existing project_logs.md file completely
- [ ] I added my session entry at the top in the correct format
- [ ] All actions taken are specifically documented
- [ ] File changes are clearly noted with paths and purposes
- [ ] Next actions are prioritized and actionable
- [ ] Any critical discoveries are flagged prominently
- [ ] Project timeline reflects current status
- [ ] No redundant information was added
- [ ] Log entry is concise but complete
- [ ] All decisions align with blueprint guidelines
- [ ] Future AI agents will understand exactly what happened

---

## CRITICAL DON'TS

**DO NOT:**
- Skip reading the project blueprint first
- Skip reading the existing logs
- Add redundant information already documented
- Use vague language or generalizations
- Create entries without specific actionable next steps
- Forget to update the project timeline and priorities
- Leave critical decisions undocumented
- Create confusion about current project status
- Make decisions that conflict with blueprint guidelines

**DO:**
- Always reference the project blueprint for context and guidance
- Be specific and measurable in all entries
- Include exact file paths and changes
- Flag critical issues clearly
- Provide clear direction for next sessions
- Maintain professional, organized documentation
- Think about project continuity for future AI agents
- Ensure all work aligns with the core mission and constraints

---

## Example Quality Log Entry

```markdown
### Session 12/15/2024 - 14:30 - Cost Modeling & Feasibility Analysis
**Objective:** Create detailed cost model for Risedial AI companion to validate financial sustainability per blueprint requirements

**Actions Taken:**
- Created `analysis/cost_model_v1.xlsx` with usage scenarios (10, 50, 100 messages/day)
- Researched OpenAI API pricing: $0.03/1K tokens input, $0.06/1K tokens output
- Calculated average conversation costs: $0.45 per exchange (estimated 500 tokens total)
- Analyzed n8n cloud pricing: $50/month for Pro plan (20 active workflows)
- Validated crisis detection keyword system accuracy using test scenarios

**Decisions Made:**
- **DECISION:** Set user throttling at 75 messages/day to control costs ($33.75 daily max) - aligns with blueprint cost constraint of <$15 CAD per user
- **DECISION:** Use tiered pricing: $47 CAD (basic), $87 CAD (premium) based on usage - maintains blueprint target of $50 CAD primary tier
- **DECISION:** Implement Claude backup when OpenAI costs exceed $25/user threshold - follows blueprint backup provider strategy

**Files Created/Modified:**
- `analysis/cost_model_v1.xlsx` - Complete financial projections and scenarios
- `risedial_planning/01_core_assumptions_validation.txt` - Added cost validation results

**Next Actions Required:**
- Technical proof of concept development (single-user prototype) - blueprint build order step 1
- Legal consultation scheduling (find AI/coaching specialist lawyer) - blueprint compliance requirement
- Beta user recruitment strategy (identify 5-10 test participants)

**Critical Issues/Blockers:**
- **CRITICAL:** n8n Pro plan only supports 20 workflows - need Enterprise for 1000+ users (conflicts with blueprint scale target)
- **RISK:** OpenAI rate limits could impact user experience during peak usage

**Key Insights/Learning:**
- Break-even achievable at 287 users with $47 pricing tier (well below blueprint target of <500 users)
- Crisis detection requires human backup - cannot be 100% automated (aligns with blueprint safety requirements)
- User throttling essential for cost control but must feel natural to users (maintains companion illusion per blueprint)
```

---

**Remember:** The project blueprint is your north star. These logs are the project's memory. Future AI agents and team members depend on your accurate documentation to continue the work effectively while staying aligned with the core mission. Make every entry count. 