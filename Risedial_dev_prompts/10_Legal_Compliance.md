# Prompt 10: Create Legal & Compliance Documents

## Context
You are creating Risedial's complete legal and compliance framework including privacy policy, terms of service, mental health disclaimers, crisis intervention protocols, data protection policies, and regulatory compliance documentation to ensure legal operation of an AI therapeutic companion.

## Required Reading
First, read these files to understand legal requirements:
- `Context/project_blueprint.md` - Service specifications and user safety requirements
- `docs/COMPLETE_DEVELOPMENT_STRATEGY.md` - Compliance and legal framework specifications
- `src/lib/crisis-detection.ts` - Crisis intervention capabilities (if created)
- `docs/setup/supabase-setup.md` - Data handling and storage specifications

## Task
Create comprehensive legal documentation that ensures compliance with healthcare regulations, data protection laws, crisis intervention standards, and platform policies while protecting both users and the service provider.

## Exact Expected Outputs

### 1. Privacy Policy - docs/legal/privacy-policy.md
Create comprehensive privacy policy:

```markdown
# Privacy Policy for Risedial AI Therapeutic Companion

**Last Updated:** [Date]

## Introduction

Risedial ("we," "our," or "us") is committed to protecting your privacy and maintaining the confidentiality of your personal and therapeutic information. This Privacy Policy explains how we collect, use, protect, and share your information when you use our AI therapeutic companion service through Telegram.

## Information We Collect

### Personal Information
- **Telegram User Data:** Your Telegram user ID, username, first name, and profile information
- **Conversation Data:** All messages you send to and receive from Risedial, including timestamps
- **Therapeutic Data:** Emotional assessments, progress tracking, psychological profile information
- **Crisis Risk Data:** Safety assessments and risk evaluations for crisis intervention purposes

### Automatically Collected Information
- **Usage Analytics:** Message frequency, session duration, feature usage patterns
- **Technical Data:** IP address, device information, response times, error logs
- **Cost Tracking:** Token usage, API costs, subscription tier information

### Sensitive Health Information
We collect and process mental health-related information that may be considered Protected Health Information (PHI) under HIPAA, including:
- Emotional state assessments
- Therapeutic progress indicators
- Crisis risk evaluations
- Mental health conversation content

## How We Use Your Information

### Therapeutic Services
- Provide personalized AI therapeutic responses and support
- Track your emotional progress and therapeutic outcomes
- Generate insights and recommendations for your growth
- Maintain conversation history for contextual understanding

### Safety and Crisis Prevention
- Monitor for crisis situations and suicidal ideation
- Provide immediate crisis intervention and safety resources
- Alert emergency services when imminent danger is detected
- Maintain records for safety protocol compliance

### Service Improvement
- Analyze conversation patterns to improve AI responses
- Develop better therapeutic techniques and interventions
- Enhance crisis detection accuracy and effectiveness
- Optimize system performance and user experience

### Legal and Compliance
- Comply with legal obligations and regulatory requirements
- Respond to legal process and government requests
- Protect against fraud, abuse, and security threats
- Maintain records for audit and compliance purposes

## Data Sharing and Disclosure

### Crisis Situations
In cases of imminent danger to yourself or others, we may share information with:
- Emergency services (911, local police, emergency medical services)
- Crisis intervention centers and suicide prevention hotlines
- Mental health professionals when immediate intervention is required

### Legal Requirements
We may disclose information when legally required:
- Court orders, subpoenas, or other legal process
- Compliance with applicable laws and regulations
- Protection of our rights, property, or safety
- Investigation of fraud or security incidents

### Service Providers
We share limited information with trusted service providers:
- **Supabase:** Database hosting and management (encrypted data)
- **OpenAI:** AI processing (anonymized conversation data)
- **Vercel:** Platform hosting and delivery
- **Telegram:** Message delivery infrastructure

### No Sale of Personal Data
We do not sell, rent, or trade your personal information to third parties for marketing purposes.

## Data Security and Protection

### Encryption and Security
- All data is encrypted in transit and at rest using industry-standard encryption
- Secure API communications with TLS/SSL protocols
- Regular security audits and vulnerability assessments
- Access controls and authentication for all data systems

### Data Minimization
- We collect only information necessary for therapeutic services
- Automatic deletion of old conversation data (retention limits apply)
- Anonymization of data used for AI training and improvement
- Regular data purging for inactive accounts

### Crisis Data Handling
- Crisis-related information is flagged and securely stored
- Access limited to authorized crisis intervention personnel
- Immediate notification systems for high-risk situations
- Compliance with mental health emergency protocols

## Your Privacy Rights

### Access and Control
- **View Your Data:** Request a copy of all personal information we have
- **Update Information:** Correct or update your profile and preferences
- **Delete Account:** Request complete deletion of your account and data
- **Data Portability:** Export your conversation history and progress data

### Communication Preferences
- **Opt-out:** Discontinue service at any time by blocking the Telegram bot
- **Crisis Notifications:** Choose emergency contact preferences
- **Progress Reports:** Control frequency and detail of progress updates

### Geographic Rights
- **EU Users (GDPR):** Right to access, rectification, erasure, portability, and objection
- **California Users (CCPA):** Right to know, delete, and opt-out of sale
- **Canada Users (PIPEDA):** Right to access and correction of personal information

## Data Retention

### Conversation Data
- Active conversations: Retained for therapeutic continuity and progress tracking
- Inactive accounts: Data deleted after 1 year of inactivity
- Crisis records: Retained for 7 years for safety and legal compliance

### Progress and Analytics
- Therapeutic progress data: Retained while account is active
- Anonymized analytics: Retained indefinitely for service improvement
- Cost and usage data: Retained for billing and compliance purposes

## International Data Transfers

Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards through:
- Standard Contractual Clauses for EU data transfers
- Privacy Shield frameworks where applicable
- Adequacy decisions and binding corporate rules
- Explicit consent for sensitive health data transfers

## Children's Privacy

Risedial is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we discover we have collected information from a child, we will delete it immediately.

## Changes to Privacy Policy

We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will notify you of material changes through:
- In-app notification through Telegram
- Email notification (if provided)
- Posted notice on our website
- 30-day advance notice for material changes

## Contact Information

For privacy-related questions or concerns:

**Data Protection Officer**
Email: privacy@risedial.com
Address: [Company Address]

**Crisis Support**
Emergency: 911
Crisis Text Line: Text HOME to 741741
National Suicide Prevention Lifeline: 988

## Effective Date

This Privacy Policy is effective as of [Date] and applies to all information collected since that date.
```

### 2. Terms of Service - docs/legal/terms-of-service.md
Create comprehensive terms of service:

```markdown
# Terms of Service for Risedial AI Therapeutic Companion

**Last Updated:** [Date]

## Agreement to Terms

By accessing or using Risedial, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use our service.

## Service Description

Risedial is an AI-powered therapeutic companion that provides:
- Emotional support and active listening
- Therapeutic conversation and guidance
- Progress tracking and personal insights
- Crisis detection and safety resources
- Mental health education and coping strategies

## Important Disclaimers

### NOT A SUBSTITUTE FOR PROFESSIONAL CARE
Risedial is a complementary tool and does not replace professional mental health care. Our service:
- Is not a licensed mental health provider
- Cannot diagnose mental health conditions
- Should not be your only source of mental health support
- May not be appropriate for severe mental health conditions

### AI LIMITATIONS
Our AI system:
- May make mistakes or provide inaccurate information
- Cannot guarantee therapeutic outcomes
- Should be used in conjunction with human support
- Is continuously learning and improving

### CRISIS SITUATIONS
In mental health emergencies:
- Call 911 immediately for life-threatening situations
- Contact crisis hotlines for immediate human support
- Our AI may detect crisis situations but cannot provide emergency intervention
- We may notify emergency services if imminent danger is detected

## User Responsibilities

### Appropriate Use
You agree to:
- Use the service for legitimate therapeutic and personal growth purposes
- Provide accurate information about your mental health status
- Seek professional help for serious mental health conditions
- Respect the AI companion and avoid abusive language

### Prohibited Activities
You may not:
- Use the service to harm yourself or others
- Share login credentials or account access
- Attempt to manipulate or break the AI system
- Use the service for illegal activities
- Violate Telegram's terms of service

### Crisis Situations
In crisis situations, you agree to:
- Seek immediate professional help when needed
- Allow us to contact emergency services if necessary
- Provide accurate location information for emergency response
- Understand that AI responses may have delays

## Subscription and Billing

### Subscription Tiers
- **Basic:** Limited daily messages, basic features
- **Premium:** Increased messaging, advanced analytics
- **Unlimited:** Unlimited messaging, priority support

### Billing Terms
- Subscriptions are billed monthly in advance
- All sales are final unless otherwise specified
- Price changes will be communicated 30 days in advance
- Cancellation takes effect at the end of the current billing period

### Refund Policy
- No refunds for partial months of service
- Refunds considered on a case-by-case basis for technical issues
- Chargebacks may result in account suspension

## Privacy and Data Protection

### Data Collection
We collect information necessary to provide therapeutic services, including:
- Conversation history and content
- Emotional assessments and progress data
- Crisis risk evaluations
- Usage analytics and system performance data

### Data Use
Your data is used to:
- Provide personalized therapeutic responses
- Track progress and generate insights
- Detect crisis situations and provide safety interventions
- Improve our AI system and services

### Data Security
We implement industry-standard security measures:
- Encryption of all data in transit and at rest
- Regular security audits and updates
- Access controls and authentication
- Compliance with data protection regulations

## Intellectual Property

### Our Content
All content provided by Risedial, including AI responses, therapeutic frameworks, and system design, is protected by intellectual property laws.

### Your Content
You retain ownership of your personal information and conversation content, while granting us necessary rights to provide our services.

### Feedback and Suggestions
Any feedback or suggestions you provide may be used to improve our services without compensation.

## Limitation of Liability

### Service Limitations
TO THE MAXIMUM EXTENT PERMITTED BY LAW:
- Our service is provided "as is" without warranties
- We disclaim all warranties, express or implied
- We are not liable for therapeutic outcomes or mental health changes
- Our liability is limited to the amount you paid for the service

### Crisis Situations
We are not liable for:
- Delays in crisis detection or response
- Accuracy of crisis risk assessments
- Outcomes of emergency interventions
- Technical failures during crisis situations

### Third-Party Services
We are not responsible for:
- Telegram platform availability or security
- Third-party service interruptions
- Actions of emergency services or crisis centers

## Indemnification

You agree to defend, indemnify, and hold us harmless from any claims, damages, or costs arising from:
- Your use of the service
- Violation of these Terms
- Infringement of third-party rights
- Misuse of therapeutic content or advice

## Termination

### By You
You may terminate your account at any time by:
- Blocking the Telegram bot
- Requesting account deletion
- Canceling your subscription

### By Us
We may terminate or suspend your account for:
- Violation of these Terms
- Abusive or harmful behavior
- Technical or security reasons
- Legal requirements

### Effect of Termination
Upon termination:
- Your access to the service will end immediately
- Your data will be deleted according to our retention policy
- Crisis-related data may be retained for safety purposes
- Outstanding balances remain due

## Dispute Resolution

### Governing Law
These Terms are governed by [Jurisdiction] law without regard to conflict of law principles.

### Arbitration
Disputes will be resolved through binding arbitration in [Location] according to [Arbitration Rules].

### Class Action Waiver
You waive the right to participate in class action lawsuits against us.

## Changes to Terms

We may modify these Terms at any time. We will notify you of material changes through:
- In-app notification
- Email notification
- Posted notice on our website
- 30-day advance notice for significant changes

Continued use of the service after changes constitutes acceptance of the new Terms.

## Contact Information

For questions about these Terms:

**Legal Department**
Email: legal@risedial.com
Address: [Company Address]

**Customer Support**
Email: support@risedial.com
Telegram: @RisedialSupport

**Crisis Resources**
Emergency: 911
Crisis Text Line: Text HOME to 741741
National Suicide Prevention Lifeline: 988

## Severability

If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full effect.

## Entire Agreement

These Terms, together with our Privacy Policy, constitute the entire agreement between you and Risedial.

## Effective Date

These Terms are effective as of [Date] and apply to all users of the service.
```

### 3. Mental Health Disclaimer - docs/legal/mental-health-disclaimer.md
Create specific mental health disclaimer:

```markdown
# Mental Health Disclaimer

**IMPORTANT NOTICE: READ CAREFULLY BEFORE USING RISEDIAL**

## NOT A REPLACEMENT FOR PROFESSIONAL CARE

Risedial is an AI-powered therapeutic companion designed to provide emotional support and therapeutic conversation. **Risedial is NOT**:

- A licensed mental health professional
- A substitute for professional therapy or counseling
- A medical device or diagnostic tool
- Qualified to diagnose mental health conditions
- Able to prescribe medications or medical treatment

## PROFESSIONAL CONSULTATION REQUIRED

You should consult with qualified mental health professionals for:
- Mental health diagnoses
- Treatment planning and medication management
- Severe mental health conditions
- Suicidal thoughts or self-harm behaviors
- Substance abuse or addiction issues
- Trauma or PTSD treatment

## AI SYSTEM LIMITATIONS

Our AI system:
- May provide inaccurate or inappropriate responses
- Cannot understand context as well as human therapists
- May miss important emotional or psychological cues
- Should not be relied upon for critical mental health decisions
- Is designed to complement, not replace, human care

## EMERGENCY SITUATIONS

**IMMEDIATE DANGER**: If you are in immediate danger of harming yourself or others:
- Call 911 (US) or your local emergency number
- Go to your nearest emergency room
- Call the National Suicide Prevention Lifeline: 988

**CRISIS SUPPORT**:
- Crisis Text Line: Text HOME to 741741
- National Suicide Prevention Lifeline: 988
- International Association for Suicide Prevention: https://iasp.info/resources/Crisis_Centres/

## WHEN TO SEEK PROFESSIONAL HELP

Contact a mental health professional if you experience:
- Persistent thoughts of suicide or self-harm
- Severe depression or anxiety that interferes with daily life
- Substance abuse or addiction
- Eating disorders
- Psychosis, hallucinations, or delusions
- Severe trauma or PTSD symptoms
- Relationship or family crisis requiring intervention

## NO GUARANTEE OF OUTCOMES

Risedial does not guarantee:
- Improvement in mental health symptoms
- Resolution of psychological problems
- Prevention of mental health crises
- Therapeutic effectiveness for all users
- Compatibility with all mental health conditions

## USER RESPONSIBILITY

By using Risedial, you acknowledge that:
- You are responsible for your own mental health and safety
- You will seek professional help when needed
- You understand the limitations of AI-based support
- You will not rely solely on Risedial for mental health care
- You will use the service as a supplement to, not replacement for, professional care

## DATA AND PRIVACY CONSIDERATIONS

Mental health information is highly sensitive. Please understand:
- All conversations are recorded and analyzed
- Crisis situations may trigger emergency protocols
- Data may be shared with emergency services if necessary
- We implement strong privacy protections but cannot guarantee absolute security

## CONTRAINDICATIONS

Risedial may not be appropriate for individuals with:
- Active psychosis or severe mental illness
- Acute suicidal ideation
- Severe substance abuse disorders
- Cognitive impairments affecting judgment
- Court-ordered mental health treatment requirements

## PARENTAL GUIDANCE

For users under 18:
- Parental supervision and consent is required
- Professional mental health care is strongly recommended
- Crisis situations will involve parental notification
- Age-appropriate professional resources should be primary care source

## PROFESSIONAL RESOURCES

We recommend establishing relationships with:
- Licensed therapists or counselors
- Psychiatrists for medication management
- Primary care physicians for overall health
- Crisis intervention centers in your area
- Support groups for your specific concerns

## LEGAL DISCLAIMERS

- This service is provided "as is" without warranties
- We disclaim liability for mental health outcomes
- Users assume responsibility for their mental health care decisions
- Professional consultation is strongly recommended for all mental health concerns

## ACKNOWLEDGMENT

By using Risedial, you acknowledge that you have read, understood, and agree to this Mental Health Disclaimer. You understand the limitations of AI-based therapeutic support and agree to seek professional mental health care when appropriate.

**If you do not agree with these terms or do not understand the limitations described, please do not use Risedial.**

---

**Last Updated:** [Date]

**For immediate crisis support:** 
- Emergency: 911
- Crisis Text Line: Text HOME to 741741
- National Suicide Prevention Lifeline: 988
```

### 4. Data Protection Policy - docs/legal/data-protection-policy.md
Create GDPR and data protection compliance:

```markdown
# Data Protection Policy

## Purpose and Scope

This Data Protection Policy outlines how Risedial collects, processes, stores, and protects personal data in compliance with applicable data protection laws, including GDPR, CCPA, and PIPEDA.

## Legal Basis for Processing

### Legitimate Interests
- Providing AI therapeutic companion services
- Improving service quality and user experience
- Ensuring user safety and crisis intervention
- System security and fraud prevention

### Consent
- Processing sensitive health information
- Marketing communications (where applicable)
- Data sharing with third parties (non-essential)
- International data transfers

### Vital Interests
- Crisis intervention and emergency response
- Protecting user safety and well-being
- Preventing harm to self or others

## Data Categories and Processing

### Personal Data
- **Identity Data:** Name, username, user ID
- **Contact Data:** Telegram handle, emergency contact information
- **Conversation Data:** Message content, timestamps, interaction history

### Special Category Data (Sensitive)
- **Health Data:** Mental health assessments, emotional state, therapeutic progress
- **Crisis Data:** Suicide risk assessments, self-harm indicators
- **Psychological Data:** Personality assessments, behavioral patterns

### Technical Data
- **Usage Data:** Feature usage, session duration, response times
- **System Data:** Error logs, performance metrics, security events

## Data Subject Rights

### Right to Information
- Transparent information about data processing
- Clear explanations of legal basis for processing
- Details about data retention and deletion

### Right of Access
- Copy of all personal data we hold
- Information about processing purposes and legal basis
- Details about data sharing and international transfers

### Right to Rectification
- Correction of inaccurate personal data
- Completion of incomplete data
- Updates to changed circumstances

### Right to Erasure (Right to be Forgotten)
- Deletion of personal data when no longer necessary
- Withdrawal of consent for consent-based processing
- Objection to processing based on legitimate interests

### Right to Restrict Processing
- Limitation of processing during dispute resolution
- Restriction when data accuracy is contested
- User objection to processing pending verification

### Right to Data Portability
- Structured, machine-readable format of personal data
- Direct transmission to another controller where technically feasible
- Export of conversation history and progress data

### Right to Object
- Objection to processing based on legitimate interests
- Opt-out of direct marketing and profiling
- Objection to automated decision-making

## International Data Transfers

### Adequacy Decisions
- Transfers to countries with adequate data protection
- EU Commission adequacy decisions
- Similar protections in recipient countries

### Standard Contractual Clauses
- EU Standard Contractual Clauses for international transfers
- Binding corporate rules for multi-national processing
- Additional safeguards for sensitive health data

### Explicit Consent
- User consent for transfers to non-adequate countries
- Clear information about transfer purposes and risks
- Withdrawal of consent option

## Data Retention

### Retention Periods
- **Active Conversations:** Retained during service use + 12 months
- **Crisis Records:** 7 years for safety and legal compliance
- **Analytics Data:** Anonymized and retained indefinitely
- **Technical Logs:** 13 months for security and performance

### Deletion Procedures
- Automated deletion based on retention schedules
- Secure deletion methods preventing data recovery
- Documentation of deletion for compliance audits

## Security Measures

### Technical Safeguards
- Encryption in transit (TLS 1.3) and at rest (AES-256)
- Access controls and authentication systems
- Regular security assessments and penetration testing
- Intrusion detection and monitoring systems

### Organizational Measures
- Data protection impact assessments (DPIA)
- Staff training on data protection principles
- Incident response and breach notification procedures
- Vendor management and due diligence

### Privacy by Design
- Data minimization principles
- Purpose limitation and storage limitation
- Pseudonymization and anonymization techniques
- Regular review and updates of security measures

## Breach Response

### Incident Detection
- Automated monitoring and alerting systems
- Staff reporting procedures for suspected breaches
- Third-party incident notification requirements

### Assessment and Response
- 72-hour breach notification to supervisory authorities
- Communication to affected users without undue delay
- Mitigation measures and corrective actions
- Documentation and reporting requirements

### High-Risk Breaches
- Direct notification to affected individuals
- Offer of credit monitoring or identity protection services
- Enhanced monitoring and additional security measures
- Regulatory cooperation and compliance

## Data Protection Officer

### Responsibilities
- Monitoring compliance with data protection laws
- Conducting data protection impact assessments
- Serving as contact point for supervisory authorities
- Training staff on data protection requirements

### Contact Information
- **Data Protection Officer:** dpo@risedial.com
- **Privacy Inquiries:** privacy@risedial.com
- **Data Subject Requests:** subject-rights@risedial.com

## Supervisory Authority Cooperation

### Regulatory Compliance
- Cooperation with data protection authorities
- Response to formal inquiries and investigations
- Implementation of supervisory authority decisions
- Participation in consistency mechanisms

### Audit and Compliance
- Regular compliance audits and assessments
- Documentation of processing activities (Article 30 GDPR)
- Maintenance of records of processing activities
- Compliance monitoring and reporting

## Third-Party Processing

### Data Processor Agreements
- Comprehensive data processing agreements with all vendors
- Security and confidentiality requirements
- Audit rights and compliance monitoring
- Incident notification and response procedures

### Vendor Management
- Due diligence assessments for data security
- Regular review of processor compliance
- Termination procedures for non-compliant processors
- Data return or deletion upon contract termination

## Updates and Amendments

This Data Protection Policy will be reviewed annually and updated as necessary to maintain compliance with applicable laws and regulations.

**Last Updated:** [Date]
**Next Review Date:** [Date + 1 year]

**Contact Information:**
- Data Protection Officer: dpo@risedial.com
- Privacy Team: privacy@risedial.com
- Legal Department: legal@risedial.com
```

## Validation Requirements
After creating all files:
1. Legal review by qualified attorney specializing in healthcare/technology law
2. Compliance audit for applicable jurisdictions (US, EU, Canada)
3. Review by mental health professionals for clinical accuracy
4. Privacy impact assessment for data protection compliance
5. Regular updates to reflect changing regulations
6. Translation into required languages for international users

## Success Criteria
- [ ] Complete legal framework covering all service aspects
- [ ] Compliance with healthcare regulations and privacy laws
- [ ] Clear user rights and responsibilities documentation
- [ ] Comprehensive crisis intervention protocols
- [ ] Data protection measures meeting international standards
- [ ] Regular legal review and update procedures established 