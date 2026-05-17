import { useState, useEffect } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const TOPICS = [
  {
    id:"product_design", title:"Product Design", emoji:"🎨", color:"#f59e0b",
    priority:"CRITICAL", track:"both",
    testedAt:"Every FAANG loop + Salesforce, ServiceNow, Microsoft. #1 most tested.",
    tldr:"Design a product for user X. Tests: user empathy, structured thinking, prioritisation judgment.",
    framework:{
      name:"CIRCLES Method (Lewis Lin, Decode & Conquer 5th Ed) — 2025 adaptation",
      steps:[
        {label:"C — Clarify scope",content:"Ask 1–2 questions BEFORE anything else. 'What company/platform are we building for? Any constraints on timeline or market?' Never skip. For enterprise: also clarify 'Who is the buyer vs the end user?' — they are usually different people with different needs."},
        {label:"I — Identify the user",content:"Segment users. Never say 'everyone'. Pick 1–2 primary segments. B2C: demographic + behavioural. Enterprise: identify the user persona (IT admin, sales rep) AND the economic buyer (CIO, VP). They have very different pain points and success metrics."},
        {label:"R — Report user needs",content:"List 3 pain points using jobs-to-be-done language: 'When I [context], I want to [goal], so I can [outcome].' Rank by frequency × severity. Enterprise: include workflow friction, compliance burden, integration pain — these outrank UI delight."},
        {label:"C — Cut via prioritisation",content:"Pick ONE pain point to solve. Justify using impact × frequency. Never solve everything — this is a major red flag. Enterprise: also weigh 'does solving this help win or retain large contracts?'"},
        {label:"L — List solutions",content:"Brainstorm 3+ solutions across: UI changes, automation, AI assistance, integrations, notifications, marketplace/platform features. Be creative before being practical. Enterprise: include self-service admin, API/webhooks, SSO/SAML, bulk operations, audit logs."},
        {label:"E — Evaluate tradeoffs",content:"Score on impact, effort, time-to-market. Pick 1 recommendation. Explicitly state what you are NOT building and why. Enterprise: state compliance, SLA, and rollback considerations."},
        {label:"S — Summarise",content:"60-second wrap: user → pain point → solution → ONE success metric → key risk. This is your executive summary. Land it cleanly — many candidates ramble here."},
      ]
    },
    keyRules:[
      "Clarify first. Always. No exceptions — even 30 seconds of clarification changes everything.",
      "Sketch a rough wireframe. Meta explicitly expects paper sketches in product sense rounds.",
      "Pick ONE user segment and go deep. Breadth is penalised at FAANG.",
      "4–5 minutes max. Timer from Day 1 of practice.",
      "Enterprise: always separate the buyer from the user in your answer.",
      "End with ONE primary success metric, not a list of five.",
    ],
    sources:[
      {type:"📗 Book",title:"Decode and Conquer (5th Ed) — Ch 1–4",author:"Lewis C. Lin",note:"CIRCLES originator. 160+ practice Qs with full answers. Primary reference.",url:"https://www.lewis-lin.com"},
      {type:"📘 Book",title:"Cracking the PM Interview — Product Design chapter",author:"McDowell & Bavaro",note:"Best starting point before Decode. Read this chapter first.",url:"https://www.crackingthepminterview.com"},
      {type:"🎥 Free",title:"Exponent YouTube — Product Design Playlist",author:"Exponent",note:"Free mock interviews showing what 4/4 answers look like in real time. Watch 5+ before your first mock.",url:"https://www.youtube.com/@ExponentTV"},
      {type:"✍️ Free",title:"Jackie Bavaro's PM Interview Blog",author:"Jackie Bavaro (ex-Google, Asana CPO)",note:"Real answer examples and common mistakes. Free.",url:"https://jackiebo.medium.com"},
      {type:"📋 Free",title:"PM Exercises — 2,300+ real interview questions",author:"PM Exercises",note:"Filterable by company and question type. Practice here after learning the framework.",url:"https://www.productmanagementexercises.com"},
    ],
    gateChecks:[
      {q:"What is the VERY FIRST thing you do when given a product design question — before any frameworks?",a:"Clarify scope with 1–2 targeted questions: 'What company/platform are we building for?', 'Are there constraints on timeline, market, or platform?' You never start designing before this step. Jumping to solutions is the #1 PM interview red flag — it signals you solve before you understand.",difficulty:"Starter"},
      {q:"You're at a Salesforce B2B interview. They ask you to design a product for 'sales teams.' What is fundamentally different about your approach vs a B2C design question?",a:"In enterprise you must separate two people: (1) The economic buyer — VP of Sales or CIO who controls budget. They care about ROI, compliance, and integration. (2) The end user — the individual sales rep who uses it daily. They care about reducing manual data entry and closing deals faster. Your design must satisfy BOTH. A purely user-centric design that ignores the buyer's needs will never get purchased in enterprise. This distinction alone separates candidates who understand enterprise from those who don't.",difficulty:"Intermediate"},
      {q:"You have 5 potential solutions. Walk through exactly how you decide which ONE to recommend.",a:"Score each solution on: (1) Impact — how well does it solve the prioritised pain point, (2) Reach — how many users are affected, (3) Effort — realistic build complexity. Pick highest impact + reach with manageable effort. Crucially: explicitly state what you are deprioritising and WHY. Saying 'I'm not recommending X because...' demonstrates PM judgment. Interviewers reward explicit tradeoffs over confident assertions. Candidates who recommend everything solve nothing.",difficulty:"Intermediate"},
      {q:"What should the last 60 seconds of your product design answer sound like?",a:"A crisp executive summary: (1) Restate the user segment, (2) Restate the pain point you solved, (3) State your solution in one sentence, (4) Give ONE primary success metric — not a list — pick the north star, (5) State the single biggest risk or tradeoff. Many candidates ramble here. Landing cleanly is what separates a 3/4 from a 4/4 score on every interviewer's rubric.",difficulty:"Starter"},
      {q:"Why does Meta explicitly expect candidates to bring paper to product sense interviews?",a:"Meta interviewers expect candidates to sketch a rough wireframe or UI diagram during the product sense round. It doesn't need to be polished — boxes and arrows are fine. This shows you can translate abstract thinking into concrete product UI, makes your answer memorable, and demonstrates you think in terms of real product experiences rather than just frameworks. Ex-Meta PM coaches explicitly say: 'Take a piece of paper in with you. Be ready to scribble a rough design.' A candidate who only speaks verbally in a product design round is leaving a 4/4 signal on the table.",difficulty:"Starter"},
    ],
    practiceQ:[
      {context:"B2C",q:"Design a product that helps first-generation college students navigate the university application process."},
      {context:"Enterprise",q:"You are a PM at ServiceNow. Design a feature that helps IT service managers reduce time to resolve high-severity incidents."},
      {context:"Enterprise",q:"Design a product for Salesforce that helps enterprise sales teams reduce manual CRM data entry by 50%."},
    ]
  },
  {
    id:"rca", title:"Root Cause Analysis", emoji:"🔍", color:"#ef4444",
    priority:"CRITICAL — MISSING FROM MOST PLANS", track:"both",
    testedAt:"Meta Execution round, Google Analytics, Amazon, Microsoft. #2 most tested question type.",
    tldr:"A metric dropped. Diagnose why systematically. Tests: MECE thinking and structured analysis under pressure.",
    framework:{
      name:"MECE Diagnostic Framework — 4 Categories in Order",
      steps:[
        {label:"Step 1: Clarify (max 2 questions)",content:"Ask only: 'Is this a real drop or could it be a data/tracking issue?' and 'When did the drop start — sudden or gradual?' A sudden drop suggests technical error. Gradual suggests product degradation or trend. Stop at 2 questions — asking more signals you can't drive independently."},
        {label:"Step 2: State your MECE structure",content:"Before diving in, announce: 'I'll investigate four MECE categories in order: Technical/data issues, External forces, Internal product changes, Uncontrollable events.' Stating your structure before executing it is what separates 4/4 answers from 3/4."},
        {label:"Step 3: Technical/Data first",content:"Always check data integrity first. Logging errors, tracking bugs, data pipeline failures, timezone issues, or A/B test sampling errors create false drops. Ask: 'Did we push any data infrastructure changes this week?' A 30%+ overnight drop almost always has a technical cause."},
        {label:"Step 4: External forces",content:"Competitor promotions, seasonality, app store algorithm changes, OS updates, marketing spend changes, PR events. Enterprise: check if a major customer segment had an outage or migration."},
        {label:"Step 5: Internal product changes",content:"Deepest investigation. Recent feature launches, UI changes, algorithm updates, push notification changes, A/B tests in production, pricing changes, onboarding changes? Check the deployment log. This is usually where the answer lives."},
        {label:"Step 6: Uncontrollable events",content:"Regulatory changes, economic events, major news. For enterprise SaaS: also check industry-wide compliance deadlines causing usage spikes or drops."},
        {label:"Step 7: Three-part recommendation",content:"(1) Immediate fix — stop the bleeding now. (2) Long-term fix — prevent recurrence. (3) Monitoring plan — which metric to watch, what threshold triggers another investigation. Many candidates stop at diagnosis. Interviewers want all three parts."},
      ]
    },
    keyRules:[
      "Never jump to internal causes without checking data integrity first.",
      "Communicate your elimination process out loud — interviewers score structure, not just the final answer.",
      "30%+ overnight drop? Suspect technical error first, always.",
      "Segment the drop: does it affect all users or a specific cohort (mobile/desktop, geography, user type)?",
      "Enterprise: check if a specific large customer drove the aggregate metric change.",
      "End with three things: immediate fix, long-term fix, monitoring plan.",
    ],
    sources:[
      {type:"🌐 Free",title:"RCA Framework for PM Interviews — 5 worked examples",author:"HelloPM",note:"Banking apps, food delivery, social media. Practical MECE walkthrough. Best free starting resource.",url:"https://hellopm.co/how-to-approach-rca-questions/"},
      {type:"🌐 Free",title:"Reddit Comments RCA — Full Live Case Study",author:"Tough Tongue AI",note:"Watch a full RCA with interviewer meta-commentary on scoring. Watch before your first RCA practice.",url:"https://www.toughtongueai.com/blog/product-execution-pm-interview-reddit-root-cause-analysis"},
      {type:"📗 Book",title:"Decode and Conquer — Execution Chapter",author:"Lewis C. Lin",note:"Multiple worked RCA examples with full model answers. This chapter alone justifies the book."},
      {type:"🌐 Free",title:"Exponent YouTube — Metrics & Execution Playlist",author:"Exponent",note:"Free videos on metric drop diagnosis in real-time interviews.",url:"https://www.youtube.com/@ExponentTV"},
    ],
    gateChecks:[
      {q:"A PM says 'DAU dropped 20% — it must be the new feature we launched last week.' What is wrong with this?",a:"They violated MECE by jumping directly to an internal explanation without first checking: (1) Is the data accurate? Could it be a tracking/logging issue? (2) Are there external forces — competitor launch, seasonality, OS update? Only after eliminating these should you investigate internal product changes. Jumping to internal causes is the most common RCA failure mode. Interviewers specifically score against this pattern.",difficulty:"Starter"},
      {q:"What does MECE stand for and why is it specifically important in RCA?",a:"Mutually Exclusive, Collectively Exhaustive. In RCA: Mutually Exclusive = your investigation categories don't overlap so you don't double-investigate. Collectively Exhaustive = all possible causes are covered so the real cause isn't missed. Without MECE, candidates investigate randomly and miss obvious causes. Interviewers look for candidates who announce their MECE structure before executing it — this alone signals senior PM thinking.",difficulty:"Starter"},
      {q:"Checkout conversion dropped 15% this week. Data is confirmed accurate. Walk through your next 3 investigation steps in the correct order.",a:"(1) External: Did a competitor run a major promotion? Did a payment provider (Stripe, PayPal) have documented outages? Did a major marketing channel drop spend or go offline? (2) Internal product changes: Were any UI changes, pricing changes, or A/B tests pushed live this week? Check the deployment log — specifically anything touching the checkout flow. (3) Segment: Does the drop affect all users or a specific cohort — mobile vs desktop, new vs returning users, specific geography, specific payment method? Segmentation almost always reveals the actual cause instantly.",difficulty:"Intermediate"},
      {q:"For a B2B enterprise SaaS product, monthly active users dropped 22%. What two enterprise-specific investigation steps would you add to standard MECE?",a:"(1) Large customer concentration check: In B2B, losing or a migration by a single enterprise customer (e.g. one company with 5,000 seats) can move aggregate MAU metrics significantly. Check: 'Did any top-10 customers reduce licences, pause usage, or migrate to a competitor this month?' (2) Contract/renewal cycle: Enterprise SaaS has seasonal usage tied to contract cycles and budget quarters. A MAU drop may coincide with a Q4 budget freeze where procurement paused expansion. These patterns don't exist in B2C and are easy to miss if you apply a pure B2C lens.",difficulty:"Advanced"},
    ],
    practiceQ:[
      {context:"B2C",q:"Monthly active users on your fitness app dropped 18% last month. Diagnose this systematically."},
      {context:"Enterprise",q:"A large enterprise customer's daily Salesforce CRM logins dropped 30% in the past week. How do you investigate?"},
      {context:"B2C",q:"The add-to-cart rate on your e-commerce app dropped 25% overnight. Walk through your full investigation."},
    ]
  },
  {
    id:"metrics", title:"Metrics — Definition & Change", emoji:"📊", color:"#06b6d4",
    priority:"HIGH", track:"both",
    testedAt:"All companies. Two distinct question types — most candidates only prep one.",
    tldr:"Type 1: 'What metrics would you track for X?' (KPI selection). Type 2: 'Metric dropped — diagnose it' (see RCA). Different frameworks required.",
    framework:{
      name:"HEART + NSM + B2B SaaS Metrics Framework",
      steps:[
        {label:"HEART Framework (Google)",content:"Happiness (NPS, satisfaction), Engagement (actions/session, frequency), Adoption (new feature usage %), Retention (D1/D7/D30 return rates), Task Success (completion rate, error rate). Use HEART when the question is about a specific feature or user experience quality."},
        {label:"North Star Metric",content:"The single metric that best captures value delivered to users AND correlates with long-term business growth. Examples: Spotify → time spent listening. Airbnb → nights booked. Slack → messages sent per active team. Your NSM is the answer when asked 'What's the ONE metric you'd care most about?'"},
        {label:"Input vs Output Metrics",content:"Output metrics are lagging: revenue, DAU, NPS. Input metrics are leading and actionable: onboarding completion rate, time-to-first-value, features shipped. Great PMs track both but act on inputs. Always pair an output metric with the input metric that drives it."},
        {label:"B2C Metric Vocabulary",content:"DAU/MAU ratio (stickiness), D1/D7/D30 retention, Churn rate, CAC (Customer Acquisition Cost), LTV (Lifetime Value), NPS, Conversion rate, Session length, Feature adoption rate, Viral coefficient (K-factor)."},
        {label:"B2B/Enterprise Metric Vocabulary",content:"ARR (Annual Recurring Revenue), MRR growth, Net Revenue Retention (NRR — must be >100% for healthy SaaS), Logo churn, Expansion revenue, Time-to-Value (TTV), Product Qualified Leads (PQLs), Seat expansion rate, SLA compliance %, Support ticket volume/customer, CSAT."},
        {label:"Guardrail Metrics",content:"Metrics you monitor to ensure your primary metric improvement doesn't cause collateral damage. Example: increasing notifications (engagement up) but unsubscribe rate spikes (guardrail breached). Always state at least one guardrail metric — it distinguishes senior from junior PM answers."},
      ]
    },
    keyRules:[
      "Always lead with the North Star Metric, then support with secondary metrics.",
      "Always name at least one guardrail metric — this separates junior from senior PM answers.",
      "For B2B/Enterprise: NRR is more important than gross new logos. Know this cold.",
      "Never give a list of 10 metrics without prioritising. Pick 3 max and explain why.",
      "Know the difference: Metric Definition ≠ Metric Change (RCA). Different frameworks required.",
      "NRR > 100%: existing customers are growing. NRR < 90%: serious product health problem.",
    ],
    sources:[
      {type:"🌐 Free",title:"HEART Framework — Original Google Publication",author:"Kerry Rodden, Google",note:"Read the original, not a summary. Short and precise. The authoritative source.",url:"https://research.google/pubs/measuring-the-user-experience-on-a-large-scale-user-research-at-google/"},
      {type:"🌐 Free",title:"Lenny's Newsletter — North Star Metric Guide",author:"Lenny Rachitsky (ex-Airbnb)",note:"Definitive NSM guide with examples from 30+ companies. One of the most shared PM resources.",url:"https://www.lennysnewsletter.com/p/north-star-metric"},
      {type:"🌐 Free",title:"SaaS Metrics 2.0 — B2B Metric Definitions",author:"David Skok (Matrix Partners)",note:"ARR, NRR, LTV/CAC, churn defined with formulas and benchmarks. Required for enterprise PM roles.",url:"https://www.forentrepreneurs.com/saas-metrics-2/"},
      {type:"📗 Book",title:"Decode and Conquer — Analytical Questions Chapter",author:"Lewis C. Lin",note:"AARM Method (Acquisition, Activation, Retention, Monetisation) as alternative framework."},
    ],
    gateChecks:[
      {q:"What is a North Star Metric and how is it different from a KPI?",a:"The NSM is the single metric that best captures core value delivered to users AND correlates with long-term sustainable business growth. It sits above KPIs. KPIs are operational measures teams act on daily. Example: Airbnb's NSM is 'Nights Booked' — it captures both host revenue and guest experience in one number. Having many KPIs but no NSM means your organisation is optimising components without strategic direction.",difficulty:"Starter"},
      {q:"What is NRR and what does NRR of 95% vs 120% tell you about product health?",a:"NRR = (Starting MRR + Expansion − Contraction − Churn) / Starting MRR. NRR 95%: existing customers are collectively shrinking — you're running to stand still even with perfect new acquisition. This signals product isn't delivering enough value to prevent downgrades or churn. NRR 120%: for every $100 starting revenue you end with $120 purely from existing customers expanding. You'd grow 20% even with zero new customers. Benchmark: >120% is world-class (Snowflake, Datadog). 100–110% is healthy. <90% is a serious red flag requiring immediate intervention.",difficulty:"Intermediate"},
      {q:"What is a guardrail metric and give an example of when you'd need one?",a:"A guardrail metric is a secondary metric you monitor to ensure improving your primary metric doesn't cause unintended harm. Example: You're a PM trying to increase engagement (primary: sessions per week). You add more push notifications. Sessions go up 12% but notification unsubscribe rates go up 25%. Without the guardrail you'd ship this as a win. With it you catch the collateral damage. Always name at least one guardrail — interviewers use this to distinguish junior PMs (optimise one metric) from senior PMs (think systemically about tradeoffs).",difficulty:"Intermediate"},
      {q:"You are PM for Microsoft Teams. What is your North Star Metric and why — not just DAU?",a:"For Microsoft Teams, the North Star Metric is 'Messages Sent per Active Team per Week' rather than DAU. Rationale: Teams is a collaborative product where value is experienced at the team level, not individual level. This metric captures whether teams are actually communicating (value delivered) not just logging in (activity). It directly drives Microsoft M365 retention and upsell. Guardrail metrics: message delivery failure rate (technical quality) and support ticket volume per org (satisfaction). DAU alone fails because enterprise usage patterns vary by company culture — some organisations use Teams but primarily for video calls, not messaging.",difficulty:"Advanced"},
    ],
    practiceQ:[
      {context:"B2C",q:"What metrics would you use to measure the success of Instagram Reels? Walk through your full framework."},
      {context:"Enterprise",q:"What metrics would you track as PM for Salesforce's new AI-powered sales coaching feature?"},
      {context:"Enterprise",q:"You are PM for Microsoft Teams. What metrics do you present to the CEO in a quarterly business review?"},
    ]
  },
  {
    id:"system_design", title:"System Design for PMs", emoji:"🏗️", color:"#a78bfa",
    priority:"HIGH — MISSING FROM MOST PLANS", track:"both",
    testedAt:"Google (TPM roles), Amazon, Stripe, LinkedIn, Microsoft Azure PM, enterprise platform PM roles at ServiceNow.",
    tldr:"You don't need to code. You need to understand how systems work and articulate tradeoffs. Tests: 'Can you speak engineering's language and make smart build decisions?'",
    framework:{
      name:"PM System Design Framework (Aakash Gupta / Educative — PM adaptation)",
      steps:[
        {label:"1. Clarify scope and constraints",content:"Ask: What scale? (100 users or 100 million?) What platform (web/mobile/API)? What's the most critical constraint — latency, consistency, or cost? For enterprise: also clarify SLA requirements (99.9% uptime = 8.7 hrs downtime/year; 99.99% = 52 mins/year)."},
        {label:"2. Define Functional + Non-Functional Requirements",content:"Functional: what the system does. Non-functional (NFRs): Reliability (uptime SLA), Latency (p99 response time targets), Scalability (growth expectations), Security (auth, encryption), Compliance (GDPR, SOC2, HIPAA, PCI-DSS). PMs are specifically scored on NFRs — most candidates skip them entirely."},
        {label:"3. High-level architecture",content:"Sketch boxes and arrows: Client → API Gateway → Backend Services → Database → Cache. You don't need exact technologies. You need to know WHY each component exists and what problem it solves. Enterprise: add integration layer (webhooks, event bus) and admin/audit components."},
        {label:"4. Deep-dive one component",content:"Pick the most critical component and go deeper. 'The database is most critical here — let me discuss the tradeoffs between SQL and NoSQL for this use case.' This shows technical depth without needing to cover everything."},
        {label:"5. Tradeoffs",content:"Explicitly state tradeoffs: Consistency vs Availability (CAP theorem), SQL vs NoSQL, Monolith vs Microservices, Build vs Buy, Sync vs Async, REST vs GraphQL. You don't need implementation details — you need to know WHEN each is appropriate and what you give up."},
        {label:"6. Scale and enterprise considerations",content:"How does the system behave at 10x, 100x load? Enterprise: discuss multi-tenancy (customer data isolation), SLA guarantees, disaster recovery, and compliance audit trails. For enterprise PM roles, multi-tenancy is a PM decision that affects pricing, compliance, and roadmap."},
      ]
    },
    keyRules:[
      "PMs are scored on WHAT and WHY, not HOW. You don't need implementation details.",
      "Always state NFRs before jumping to architecture — most candidates skip this and it's noticed.",
      "Know: REST vs GraphQL, SQL vs NoSQL, Monolith vs Microservices — when each is appropriate.",
      "Enterprise: understand multi-tenancy, SLAs, webhooks, API versioning, SSO/SAML.",
      "CAP theorem: In distributed systems you get at most 2 of: Consistency, Availability, Partition Tolerance.",
      "Google L6 TPM interviewers focus more on estimation and scoping than technical architecture details.",
    ],
    sources:[
      {type:"🌐 Free",title:"System Design for Product Managers — PM vs Engineer Differences",author:"Aakash Gupta (ex-Apollo, Google)",note:"Clearest explanation of what PMs are scored on vs engineers. Start here.",url:"https://www.news.aakashg.com/p/system-design-interview"},
      {type:"🌐 Free",title:"System Design Concepts for Product Managers",author:"The Product Notebook (Substack)",note:"6-area breakdown with PM-level analogies covering scaling, microservices, reliability, security. Free.",url:"https://theproductnotebook.substack.com/p/system-design-concepts-for-product"},
      {type:"📘 Book",title:"System Design Interview Vol 1 — Ch 1–5 only",author:"Alex Xu",note:"Written for engineers but Ch 1–5 covers fundamentals PMs need. Skim for concepts not code.",url:"https://www.amazon.com/System-Design-Interview-insiders-Second/dp/B08CMF2CQF"},
      {type:"🌐 Free",title:"Educative — PM System Design Interview Questions",author:"Educative",note:"PM-specific system design course. Maps user journeys to backend systems with RICE-based tradeoffs.",url:"https://www.educative.io/blog/system-design-fundamentals-technical-product-managers"},
    ],
    gateChecks:[
      {q:"What is the difference between what a PM is scored on in system design vs what an engineer is scored on?",a:"Engineers are scored on HOW to build: specific algorithms, code quality, performance optimisation. PMs are scored on WHAT and WHY: can you define the right requirements (functional + non-functional), articulate the high-level architecture, identify the right tradeoffs, and communicate constraints clearly? A Google L6 TPM interviewer said: 'I was more interested in estimation and scoping than the technical solution.' PMs who try to answer system design questions like engineers typically fail — they go too deep on implementation and miss the product thinking layer.",difficulty:"Starter"},
      {q:"What are Non-Functional Requirements and name 5 that a PM must always define before discussing architecture?",a:"NFRs define HOW the system performs, not what it does. The 5 PMs must always state: (1) Reliability — what uptime SLA? (99.9% = 8.7hrs downtime/year). (2) Latency — acceptable response time? (p99 < 200ms). (3) Scalability — expected growth? (10x users in 12 months?). (4) Security — auth model, encryption requirements. (5) Compliance — GDPR, SOC2, HIPAA, PCI-DSS for regulated industries. NFRs specifically separate senior PM candidates — most candidates jump straight to functional features and architecture without stating these.",difficulty:"Intermediate"},
      {q:"What is multi-tenancy in enterprise SaaS and why is it a PM concern, not just an engineering concern?",a:"Multi-tenancy means a single software instance serves multiple customers with each customer's data isolated. It is a PM concern because: (1) It directly impacts pricing model — shared infrastructure enables competitive pricing. (2) It creates compliance risks — a data leak between tenants can violate GDPR and destroy enterprise trust. (3) It affects product roadmap — some enterprise customers require single-tenant deployments for security compliance (government, healthcare, finance). (4) Feature flags and configuration management become critical — different tenants may need different feature sets. PMs must understand these tradeoffs to make roadmap and pricing decisions.",difficulty:"Advanced"},
      {q:"Explain REST vs GraphQL and when you'd recommend each as a PM.",a:"REST: Each API endpoint returns a fixed set of data. Easy to understand, widely supported, great for simple stable data models and multiple client types. Use REST for external APIs — easier for third parties to integrate. GraphQL: Clients request exactly the data they need. Eliminates over-fetching and under-fetching. Use GraphQL when you have complex nested data requirements and multiple clients with different data needs (mobile app needs less data than desktop). PM recommendation: REST for external APIs (third-party ecosystem), GraphQL for internal product APIs where multiple frontend teams have diverse data requirements.",difficulty:"Intermediate"},
    ],
    practiceQ:[
      {context:"B2C",q:"Design the high-level backend system for a Twitter-like feed. Walk through architecture and key tradeoffs."},
      {context:"Enterprise",q:"You are PM at ServiceNow. Design the notification system alerting IT teams when a high-severity incident is raised. What are your NFRs?"},
      {context:"Enterprise",q:"A large bank wants to integrate your SaaS platform via API. What API design decisions matter most and why?"},
    ]
  },
  {
    id:"strategy_gtm", title:"Strategy & GTM", emoji:"♟️", color:"#22c55e",
    priority:"HIGH", track:"both",
    testedAt:"Google (strategy-heavy), Microsoft, Salesforce, Amazon. GTM is a separate case type from strategy.",
    tldr:"Two distinct types: (1) Strategy — 'Should Company X enter Market Y?' (2) GTM — 'How would you launch Feature X?' Different frameworks. Don't conflate them.",
    framework:{
      name:"Strategy Framework + GTM Framework (separate tools)",
      steps:[
        {label:"Strategy: Root in company mission",content:"Start with: 'What is the company's core mission and current strategic position?' Interviewers specifically score for candidates who root their strategy in company mission, not just market opportunity. This is what separates 2/4 from 4/4 answers."},
        {label:"Strategy: Market analysis",content:"Porter's 5 Forces or SWOT: Who are the competitors? TAM/SAM/SOM? Barriers to entry? Unfair advantage? Enterprise markets: regulatory landscape and existing relationships matter as much as product capability."},
        {label:"Strategy: Recommendation + conditions",content:"Make a clear call — 'Yes, enter' or 'No, don't' with specific conditions. State: (1) Strategic rationale, (2) Biggest risk, (3) Success metrics at 6/12/24 months, (4) First 3 moves. Weak candidates hedge. Strong candidates decide."},
        {label:"GTM: Beachhead segment + ICP",content:"Who specifically do you target first? Beachhead = the narrow initial customer group where you can win completely before expanding. Enterprise ICP: company size, industry, specific trigger events indicating readiness to buy. Never launch everywhere simultaneously."},
        {label:"GTM: Channels + sequencing",content:"How do you reach the target customer? B2C: app stores, social, SEO, influencers, viral loops. Enterprise: direct sales, partner channels, events, analyst relations (Gartner/Forrester), PLG via free tier. State sequencing — Month 1 vs Month 6 activities."},
        {label:"GTM: Pricing model + rationale",content:"B2C: freemium, subscription, one-time, ad-supported. Enterprise: per-seat, usage-based, tiered (starter/professional/enterprise), value-based. State your pricing model AND justify WHY. Enterprise: never price too low — sub-$50K ARR contracts don't get executive attention or dedicated CSMs."},
        {label:"GTM: Launch metrics + feedback loop",content:"What defines a successful launch? B2C: D1 retention, activation rate, NPS from first 100 users. Enterprise: time-to-first-value (TTFV), trial-to-paid conversion, expansion revenue from pilot customers. State your feedback loop — how will you iterate in the first 90 days?"},
      ]
    },
    keyRules:[
      "Strategy and GTM are separate question types. Never conflate them in your answer.",
      "Strategy questions: always root recommendation in company mission. Interviewers score for this.",
      "GTM questions: always state beachhead segment first. Never launch everywhere simultaneously.",
      "Enterprise GTM: state ICP (Ideal Customer Profile), sales motion (PLG vs sales-led), partner strategy.",
      "4/4 strategy answers have unique insight, not CNBC-level analysis. Read Stratechery weekly.",
      "Always end with specific success metrics at a defined time horizon — not vague outcomes.",
    ],
    sources:[
      {type:"🌐 Free",title:"How to Crack the Product Strategy Interview",author:"Aakash Gupta (Product Growth Newsletter)",note:"7 major strategy question categories with real interview scorecard rubrics. Essential.",url:"https://www.news.aakashg.com/p/crack-the-product-strategy-interview"},
      {type:"📘 Book",title:"Swipe to Unlock — Technology and Business Strategy",author:"Detroja, Mehta, Agashe (ex-Google/Microsoft)",note:"Best book for understanding tech strategy: platforms, data flywheels, freemium, APIs as moats. Fast read.",url:"https://swipetounlock.com"},
      {type:"🌐 Free",title:"Stratechery — Weekly Tech Strategy Deep Dives",author:"Ben Thompson",note:"Read the free weekly articles. This is what separates 3/4 from 4/4 strategy answers — unique insight.",url:"https://stratechery.com"},
      {type:"🌐 Free",title:"a16z — Enterprise GTM and PLG Playbook",author:"Andreessen Horowitz",note:"Definitive enterprise GTM reference: ICP definition, PLG vs sales-led, partner strategy. Free.",url:"https://a16z.com/product-led-growth/"},
    ],
    gateChecks:[
      {q:"What is the strategic difference between a 'market entry' question and a 'GTM' question in PM interviews?",a:"Market entry (Strategy): 'Should Company X enter Market Y?' — tests evaluation of strategic fit, competitive dynamics, and long-term positioning. You're making a recommendation about WHETHER to enter and the high-level approach. Uses Porter's 5 Forces, SWOT, TAM analysis. GTM: 'How would you launch Feature X?' — assumes the build decision is made and tests execution planning. You're answering HOW to bring it to market. Uses: beachhead segment (ICP), positioning, channels, pricing, launch sequencing, success metrics. Using a GTM framework to answer a market entry question immediately signals to interviewers that you conflate the two.",difficulty:"Intermediate"},
      {q:"A PM interviewer rates most strategy answers 2/4 because 'they lack anything beyond CNBC-level insight.' What does a 4/4 look like?",a:"According to Product Alliance research of real interview scorecards: 1/4 = jump to solutions without strategic context. 2/4 = can think critically but surface-level (generic competitive analysis). 3/4 = candidates who read Stratechery and The Information — a news-level view. 4/4 = genuinely unique insight that makes the interviewer think 'I didn't think of it that way.' This comes from deeply understanding the company's business model and defensible advantages. Example: 4/4 on 'Should Google enter payments?' notes that Google's incentive is NOT to own payment processing (low margin, regulatory risk) but to own the user data graph payments create — citing their advertising revenue model. That's unique insight.",difficulty:"Advanced"},
      {q:"What is a beachhead segment in GTM and why is it critical for enterprise software launches?",a:"A beachhead segment is the specific narrow initial customer group you focus on first — where you can win completely before expanding. Named after the military beachhead (establish foothold, then expand). For enterprise: your beachhead should be where (1) pain is acute and quantifiable, (2) you have an unfair advantage (existing relationships, domain expertise), (3) buyers are reachable through current channels, (4) winning here creates a defensible reference. Why critical: enterprise sales cycles are 6–18 months. Spreading across 5 segments simultaneously means winning none of them. Salesforce started with small sales teams, then expanded upmarket. ServiceNow started with IT service management at mid-size tech companies, then expanded to HR, legal, and finance.",difficulty:"Intermediate"},
      {q:"Compare product-led growth (PLG) vs sales-led growth for enterprise software. When do you recommend each?",a:"PLG: Users discover, adopt, and champion the product before procurement gets involved. Product does the selling. Examples: Slack, Figma, Notion. Recommend PLG when: product value is immediately apparent in a free trial, individual users can adopt without IT approval, expansion happens organically. Sales-led: Enterprise reps lead with relationships and RFPs. Examples: SAP, Oracle, Workday. Recommend when: deal size is >$100K ARR (ROI requires human justification), compliance reviews are mandatory, integration complexity requires professional services, or buyers are CIOs who don't use the product themselves. Hybrid (product-led sales): Users get value through freemium/trial (PLG) and sales teams use product engagement data to identify high-fit prospects for enterprise upsell. Examples: Salesforce Starter→Enterprise, HubSpot Starter→Pro.",difficulty:"Advanced"},
    ],
    practiceQ:[
      {context:"B2C",q:"Should Spotify enter the live events and concert ticketing market? Make a clear recommendation with conditions."},
      {context:"Enterprise",q:"ServiceNow wants to expand from IT workflows into HR workflow automation. How would you approach the GTM strategy?"},
      {context:"Enterprise",q:"You are PM at Salesforce. Design the GTM for a new AI-powered sales forecasting tool targeting mid-market companies."},
    ]
  },
  {
    id:"behavioral", title:"Behavioural & Leadership", emoji:"🧠", color:"#ec4899",
    priority:"CRITICAL", track:"both",
    testedAt:"All companies. 85% of your evaluation at Google/Meta comes from behavioural rounds.",
    tldr:"You need 10 STAR stories, mapped to 3 company frameworks simultaneously. Most candidates have 5 stories and 1 framework.",
    framework:{
      name:"STAR Method + 3-Company Simultaneous Mapping",
      steps:[
        {label:"STAR: Situation",content:"Set context in 2–3 sentences. Stakes must be clear. 'I was PM on a team of 8 at JPMC, working on a critical ATM modernisation initiative with a $2M budget and an exec-level deadline.' Don't over-explain — 2 sentences max."},
        {label:"STAR: Task",content:"What was YOUR specific responsibility — not the team's. 'My task was to prioritise the roadmap for a system processing 50,000 daily transactions and ensure the migration shipped without downtime.' Make ownership explicit."},
        {label:"STAR: Action",content:"This is 70% of your answer. What did YOU specifically do — not 'we'. Walk through your exact decision-making process, who you influenced, what tradeoffs you weighed, and what you chose not to do. This is where interviewers differentiate candidates."},
        {label:"STAR: Result",content:"Quantify wherever possible. 'Shipped on time. Reduced processing errors by 34%. No unplanned downtime.' If no metrics: state qualitative impact and business significance. Then: 'If I were to do it again, I would...' — this signals maturity."},
        {label:"Amazon mapping (16 LPs)",content:"Map each story to at least 1 LP. Critical LPs for PM interviews: Customer Obsession, Ownership, Invent and Simplify, Are Right A Lot, Earn Trust, Deliver Results, Dive Deep, Bias for Action, Think Big. Write one story per LP. Amazon interviewers probe with 'Tell me more about YOUR specific contribution.'"},
        {label:"Meta mapping (UIE)",content:"Meta: Understand-Identify-Execute. Reframe your stories: Did you deeply Understand the user/business problem? Did you Identify the right solution? Did you Execute and measure impact? Meta scores all three dimensions simultaneously."},
        {label:"Google mapping (Manage at Scale)",content:"Google tests: handling ambiguity, working cross-functionally, making decisions without authority, long-term user impact at scale. Frame stories around: structured problem-solving, data-driven decisions, influencing without authority, billions-of-users impact."},
      ]
    },
    keyRules:[
      "You need 10 stories, not 8. Add: (1) developing someone, (2) ethical product tradeoff.",
      "Every story must be under 3 minutes. Record yourself. Rewrite anything over 3 min.",
      "Use 'I' not 'we'. Interviewers evaluate YOUR judgment, not your team's.",
      "Never say 'we didn't really have failures' — this is an immediate red flag.",
      "Enterprise/Microsoft: add a story about aligning a difficult executive or C-suite stakeholder.",
      "Same story, 3 framings: practice telling one story through Amazon LP, Meta UIE, and Google lenses.",
    ],
    sources:[
      {type:"🌐 Free",title:"8 Most-Asked PM Behavioural Questions with Expert Answers",author:"IGotAnOffer",note:"Highest-frequency questions with full example answers. Read before writing your stories.",url:"https://igotanoffer.com/blogs/product-manager/pm-behavioral-interview-questions"},
      {type:"🌐 Free",title:"Amazon's 16 Leadership Principles — Official Page",author:"Amazon",note:"Read the official descriptions. Write a story for each one. Non-optional for Amazon; the most rigorous behavioural prep framework for any company.",url:"https://www.amazon.jobs/content/en/our-workplace/leadership-principles"},
      {type:"📘 Book",title:"Cracking the PM Interview — Behavioural Questions Chapter",author:"McDowell & Bavaro",note:"Specifically strong on STAR format for PM-specific scenarios: roadmap conflicts, stakeholder pushback, shipping without data."},
      {type:"🌐 Free",title:"Meta Leadership and Drive Interview Guide",author:"IGotAnOffer (ex-Meta PM Lead)",note:"Specific to Meta's UIE framework for behavioural interviews. Includes scoring rubrics.",url:"https://igotanoffer.com/blogs/product-manager/meta-leadership-drive"},
    ],
    gateChecks:[
      {q:"You have 5 STAR stories. An interviewer asks about a time you failed. Why is 'we didn't really have major failures' a red flag even if true?",a:"It signals to interviewers one of three things: (1) You don't take accountability — you attribute failures to teams, processes, or circumstances. (2) You haven't operated in environments with real stakes. (3) You lack self-awareness. A 4/4 answer picks a genuine failure, explains specifically what YOUR decision was, what went wrong as a direct result, and — critically — what you changed about how you work because of it. The 'what I changed' is the part that signals maturity. According to analysis of 200+ FAANG PM candidates, behavioural answers about failure are where most candidates drop from a 3 to a 2.",difficulty:"Intermediate"},
      {q:"You have a conflict story with an engineering lead who disagreed with your roadmap. How do you frame it differently for Amazon vs Meta?",a:"Amazon framing (Leadership Principles — Earn Trust + Dive Deep): Emphasise that you used data to build the case, actively sought the engineering lead's input to understand their concern, found common ground, and delivered results. Amazon scores for data-driven persuasion and results. Meta framing (UIE): Emphasise Understand — did you deeply understand what the engineering lead's real concern was (technical debt, team capacity, wrong priorities)? Then Identify — how did you adjust the solution to address both user need AND engineering concern? Then Execute — what was the shipped outcome and metric? Meta scores for empathy + execution alignment. The story facts are identical. The framing emphasis changes completely.",difficulty:"Advanced"},
      {q:"For Microsoft or enterprise software PM roles, what additional story should you prepare that FAANG prep typically ignores?",a:"A story about aligning a difficult executive or C-suite stakeholder. Enterprise PM interviews at Microsoft, Salesforce, and ServiceNow specifically test your ability to navigate complex internal politics, manage up, and influence without authority in large organisations. Strong story structure: 'I was driving a platform consolidation that required a VP of Sales to change their team's workflow. They were resistant because their team had a quarterly target and couldn't afford disruption. I...' — then walk through how you built alignment (data, executive sponsorship, phased rollout, what you gave up to get their support). This story type rarely appears in FAANG prep guides because consumer tech PMs have less enterprise political experience.",difficulty:"Intermediate"},
      {q:"What are the 5 Amazon Leadership Principles most likely tested in PM interviews?",a:"(1) Customer Obsession — 'Tell me about a time you made a product decision based on deep customer understanding, even when it conflicted with internal stakeholder preferences.' (2) Ownership — 'Tell me about a time you took ownership of a problem outside your scope.' (3) Invent and Simplify — 'Tell me about a time you found a simpler way to solve a complex problem.' (4) Deliver Results — 'Tell me about a time you delivered despite significant obstacles.' (5) Earn Trust — 'Tell me about a time you influenced a stakeholder who initially disagreed with your approach.' Amazon interviewers use follow-up questions like 'Tell me more about YOUR specific contribution' to separate team from individual accomplishments.",difficulty:"Starter"},
    ],
    practiceQ:[
      {context:"Universal",q:"Tell me about a time you had to make a difficult prioritisation decision with incomplete data."},
      {context:"Enterprise",q:"Describe a time you influenced a senior stakeholder who strongly disagreed with your product direction."},
      {context:"Universal",q:"Tell me about a product decision you made that turned out to be wrong. What did you learn?"},
    ]
  },
  {
    id:"estimation", title:"Estimation & Pricing", emoji:"🔢", color:"#818cf8",
    priority:"HIGH", track:"both",
    testedAt:"Google, Amazon, Microsoft. Pricing is a separate case type from estimation.",
    tldr:"Two types: (1) Fermi estimation — 'How many ATMs in the US?' (2) Pricing — 'How would you price this feature?' Different frameworks required.",
    framework:{
      name:"Fermi Estimation Framework + Pricing Framework",
      steps:[
        {label:"Fermi: State your approach",content:"Announce: 'I'll break this down bottom-up using a few key assumptions.' State assumptions explicitly — interviewers score the reasoning, not whether you hit the exact number."},
        {label:"Fermi: Anchor with known numbers",content:"Start with a number you know (US population: 330M, smartphones: ~85% penetration, avg household: 2.5 people). Build from there. Never start from zero — always anchor to a known figure."},
        {label:"Fermi: Chain of reasoning",content:"Link numbers with clear logic: 'US has 330M people. ~70% are adults. Of those, ~60% shop online. Average online shopper makes 3 purchases/month. So...' Each link must have a stated rationale."},
        {label:"Fermi: Sanity check",content:"At the end: 'Does this number make sense?' Run a quick alternative calculation to validate. E.g. calculate from supply side instead of demand side. This signals senior analytical thinking — most candidates skip this."},
        {label:"Pricing: Identify the value metric",content:"What is the unit of value? Per user? Per transaction? Per GB? Per API call? The pricing model must align with how customers experience value. SaaS: per seat or per usage. Enterprise: tiered (Starter/Professional/Enterprise) tied to feature access and support level."},
        {label:"Pricing: Segment willingness to pay",content:"Enterprise: value-based pricing (price to % of value delivered — typically 10–30%). Consumer: competitive pricing (within range of alternatives). Freemium: convert via feature gating. State which model and why."},
        {label:"Pricing: State the risks",content:"Too high: slows adoption, helps competitors. Too low: leaves revenue on table, signals low quality to enterprise buyers — sub-$50K ARR contracts don't get executive attention or dedicated CSMs. State recommended price, the range you'd test, and the metric that would signal mispricing."},
      ]
    },
    keyRules:[
      "State assumptions explicitly and confidently — interviewers score the reasoning not the number.",
      "Always do a sanity check at the end — most candidates skip this and it's a missed 4/4 signal.",
      "Know 3 pricing models cold: value-based, cost-plus, competitive. Know when each applies.",
      "Enterprise pricing: never go too low. Sub-$50K ARR contracts don't get executive attention.",
      "Estimation and pricing are separate case types. Don't conflate them.",
      "Practice 5+ Fermi questions without a calculator before your first interview loop.",
    ],
    sources:[
      {type:"🌐 Free",title:"PM Estimation Interview Questions — Framework + Examples",author:"IGotAnOffer",note:"Full estimation framework with 10 worked examples. Best free starting resource for Fermi questions.",url:"https://igotanoffer.com/blogs/product-manager/estimation-interview-questions"},
      {type:"🌐 Free",title:"SaaS Pricing Strategy — The Complete Guide",author:"Paddle (ex-ProfitWell)",note:"Most comprehensive free resource on SaaS pricing. Covers value metric, segmentation, price page design.",url:"https://www.paddle.com/blog/saas-pricing-strategy"},
      {type:"📗 Book",title:"Decode and Conquer — Estimation Chapter",author:"Lewis C. Lin",note:"Multiple worked Fermi estimation examples with full model answers and sanity checks."},
    ],
    gateChecks:[
      {q:"Estimate the number of ATMs in the United States. Walk through your full reasoning.",a:"Approach: bottom-up from population. US population: 330M. Adults who use ATMs (18+, not fully digital-only): ~60% = 200M people. Average ATM visit frequency: ~2x/month. Total ATM transactions/month: 200M × 2 = 400M. Average ATM serves ~300 transactions/day = ~9,000/month. Assume 50% utilisation = ~4,500 transactions/month per ATM effective capacity. Divide: 400M ÷ 4,500 = ~89,000 ATMs. Sanity check: Reported US ATM count is ~450,000 (bank-branch, retail, independent). My estimate is low — I underestimated the large number of independent/retail ATMs (gas stations, convenience stores) that serve infrequent users. Revise utilisation assumption downward → estimate ~225,000. Key: state assumptions, chain your reasoning, sanity check, and acknowledge the gap.",difficulty:"Intermediate"},
      {q:"You're pricing a new AI-powered feature for Salesforce CRM. Enterprise customers. Walk through your pricing decision.",a:"Step 1: Value metric — the feature is an AI sales coach that helps reps close more deals. Value metric: 'deals closed per rep' or 'sales rep productivity per week'. Step 2: Quantify value — if the feature saves 2 hours/week per rep and a rep's fully-loaded cost is $100K/year, that's $5K/year per seat in productivity savings. Step 3: Price to % of value — enterprise SaaS typically prices at 10–30% of value delivered. At 20% = $1,000/seat/year add-on. Step 4: Segment — smaller customers get lighter tier at $500/seat. Enterprise gets premium tier with advanced analytics and dedicated CSM. Step 5: Risk — too low (<$500/seat) and enterprise procurement won't take it seriously. Too high (>$2,000/seat) and you'll face long sales cycles. Run a price test with 10 pilot customers before committing.",difficulty:"Advanced"},
      {q:"Estimate the annual revenue from Google Search ads in the US.",a:"Approach: bottom-up from US internet users. US internet users: ~280M. Adults who use Google Search daily: ~75% = 210M. Average Google searches per user per day: ~4 searches. Searches per day: 210M × 4 = 840M. Searches per year: 840M × 365 = ~307B. Ads shown per search: ~2-3 on average = ~700B ad impressions/year. Average CPC (cost per click): ~$1.50 blended across all categories. Click-through rate: ~2%. Clicks = 700B × 2% = 14B clicks × $1.50 = $21B. Sanity check: Google reported ~$175B in search ad revenue globally in 2023, with US at ~50-60% = $85-100B. My estimate is too low — I underestimated searches per day and CPC. Adjustment: searches are 8-10/day per user, CPC averages $3-5 across categories. Key point: state your math, sanity check against known figures, and explain the gap.",difficulty:"Advanced"},
    ],
    practiceQ:[
      {context:"B2C",q:"Estimate the number of Uber trips taken in New York City on a typical weekday."},
      {context:"Enterprise",q:"How would you price a new ServiceNow feature that automates IT incident escalation using AI?"},
      {context:"B2C",q:"Estimate the total number of WhatsApp messages sent globally per day."},
    ]
  },
  {
    id:"enterprise_b2b", title:"Enterprise & B2B PM", emoji:"🏢", color:"#f97316",
    priority:"HIGH FOR ENTERPRISE ROLES", track:"enterprise",
    testedAt:"ServiceNow, Salesforce, Microsoft, SAP, Workday, Adobe, Atlassian, Zendesk, Stripe, enterprise divisions of Google/AWS/Azure.",
    tldr:"Enterprise PM is structurally different from B2C. Interviewers at enterprise companies immediately detect B2C mental models.",
    framework:{
      name:"Enterprise PM Mental Model — 7 Key Differences From B2C",
      steps:[
        {label:"1. Buyer ≠ User",content:"In enterprise, the person who decides to buy (CIO, VP of Engineering, Procurement) is often NOT the person who uses it daily (IT admin, sales rep, HR manager). Your product must satisfy both: the buyer's ROI/compliance needs AND the user's daily workflow needs. Design decisions must consider both simultaneously."},
        {label:"2. Reliability > Delight",content:"Enterprise customers demand 99.9%+ uptime. A single outage at a hospital, bank, or airline costs millions. Prioritise SLA compliance, zero-downtime deployments, rollback plans, and disaster recovery as first-class product requirements — not afterthoughts."},
        {label:"3. Integration is a product decision",content:"Enterprise software must integrate with: ERP systems (SAP, Oracle), identity providers (Okta, Active Directory), data platforms (Snowflake, Databricks), communication tools (Slack, Teams). Your roadmap must include native integrations, webhooks, and a robust API. Integration friction is why enterprise deals die."},
        {label:"4. Customer concentration risk",content:"In B2C, losing 100 users is a blip. In enterprise SaaS, losing your top 5 customers can be existential. Track customer health scores, proactively flag churn risk, and build features solving top-customer pain points. Your roadmap IS influenced by large accounts — this is not a bad thing."},
        {label:"5. Compliance is non-negotiable",content:"Enterprise products must comply with: GDPR (EU data privacy), SOC 2 Type II (security audit), ISO 27001, HIPAA (healthcare), PCI-DSS (payments), FedRAMP (US government). Not being SOC 2 certified can disqualify your product from procurement entirely. PMs must understand these as product requirements."},
        {label:"6. Sales team is a key PM stakeholder",content:"You must understand: sales cycles (6–18 months for large deals), how features impact win/loss rates, what competitors are winning on, and how to build a roadmap that sales can use in enterprise RFPs. Product roadmap = sales tool in enterprise."},
        {label:"7. Success metrics are fundamentally different",content:"B2C: DAU, engagement, NPS. Enterprise: ARR, NRR, time-to-value (TTV), support ticket volume, SLA compliance rate, expansion revenue, customer health score. Know all of these cold. Never use B2C metrics as your primary success metrics for enterprise products."},
      ]
    },
    keyRules:[
      "Always separate the buyer from the user in your product design and strategy answers.",
      "Lead with reliability and compliance when discussing enterprise product requirements.",
      "Know NRR (Net Revenue Retention) as your primary business health metric.",
      "For Microsoft/ServiceNow/Salesforce: know their specific platform at a product level before interviewing.",
      "Enterprise GTM: understand PLG vs sales-led and when each applies.",
      "Never use B2C metrics (DAU, viral coefficient) as primary success metrics for enterprise products.",
    ],
    sources:[
      {type:"🌐 Free",title:"What Makes B2B Product Management Harder Than B2C",author:"TripAdvisor Engineering Blog",note:"7 specific B2B vs B2C PM differences from a practitioner. Read before any enterprise interview.",url:"https://www.tripadvisor.com/engineering/what-makes-b2b-product-management-harder-than-b2c-product-management/"},
      {type:"🌐 Free",title:"SaaS Metrics 2.0 — The Definitive B2B Metrics Reference",author:"David Skok (Matrix Partners)",note:"ARR, NRR, LTV/CAC, logo churn, expansion revenue — all with formulas and benchmarks. Required reading.",url:"https://www.forentrepreneurs.com/saas-metrics-2/"},
      {type:"🌐 Free",title:"Microsoft PM Interview Cheat Sheet 2025",author:"Product Alliance",note:"Microsoft-specific: interview format, stress interview, technical questions. Best free resource for Microsoft PM prep.",url:"https://www.productalliance.com/guides/microsoft-pm-interview-cheat-sheet"},
      {type:"📗 Book",title:"Inspired — Ch 30–40 (Enterprise chapters)",author:"Marty Cagan (SVPG)",note:"The definitive PM book. Enterprise chapters specifically cover B2B product management challenges.",url:"https://www.svpg.com/books/inspired-how-to-create-tech-products-customers-love-2nd-edition/"},
    ],
    gateChecks:[
      {q:"You're at ServiceNow. They ask: 'How would you prioritise a roadmap item requested by your 3 largest customers vs a feature that benefits 500 smaller customers?'",a:"Framework: (1) Calculate revenue concentration — if your 3 largest customers represent 40%+ of ARR, their requests have strategic weight. Losing one is not a blip. (2) Assess strategic alignment — does the large-customer feature move toward or away from your long-term platform vision? A feature solving only one customer's unique workflow is a customisation risk. (3) Evaluate generalisability — can the large-customer feature be built in a way that also serves the 500 smaller customers, even if imperfectly? (4) Consider NRR impact — which path has higher net revenue retention at 12 months? Recommendation: build the large-customer feature IF it's architecturally generalisable and strategically aligned. Push back if it's a bespoke workaround creating tech debt without broader applicability.",difficulty:"Advanced"},
      {q:"What is SOC 2 Type II and why must a PM understand it — not just the legal/security team?",a:"SOC 2 Type II is a security audit certification verifying your company has maintained specific security controls over a 6–12 month period (not just that they exist — Type I — but that they've been operating effectively over time). Why PMs must understand it: (1) It's a procurement gate — most enterprise buyers won't sign contracts with vendors who aren't SOC 2 Type II certified. Go/no-go for enterprise GTM. (2) It constrains product decisions — features introducing new data flows or third-party integrations may require security review before shipping. PMs who don't understand this ship features that fail audits. (3) It affects roadmap prioritisation — maintaining SOC 2 compliance is ongoing technical work that competes with feature development. (4) It's a differentiator — SOC 2 Type II certification is a selling point in enterprise RFPs.",difficulty:"Advanced"},
      {q:"What is Net Revenue Retention (NRR) and what does 95% vs 120% tell you about product health?",a:"NRR = (Starting MRR + Expansion MRR − Contraction MRR − Churned MRR) / Starting MRR. NRR 95%: existing customers are collectively shrinking — for every $100 starting revenue you end with $95. You're running to stand still even with perfect new acquisition. Signals: product isn't delivering enough value to prevent downgrades/churn, or competitors are winning expansion. NRR 120%: for every $100 starting revenue you end with $120 — purely from existing customers expanding. You'd grow 20% even with zero new customers. This is the hallmark of a healthy enterprise SaaS product. Benchmark: >120% is world-class (Snowflake, Datadog). 100–110% is healthy. <90% is a serious red flag requiring immediate product and CS intervention.",difficulty:"Intermediate"},
    ],
    practiceQ:[
      {context:"Enterprise",q:"You are PM at ServiceNow. Your top 3 customers want a custom SAP integration. Your smaller customers want a better mobile experience. Prioritise."},
      {context:"Enterprise",q:"Design a product strategy for Salesforce to enter the enterprise HR management market, currently dominated by Workday."},
      {context:"Enterprise",q:"You are a PM at Adobe. How would you structure the metrics dashboard you'd present to your CPO for the Creative Cloud enterprise tier?"},
    ]
  },
  {
    id:"ai_pm", title:"AI Product Management", emoji:"🤖", color:"#84cc16",
    priority:"CRITICAL FOR 2025–2026", track:"both",
    testedAt:"Google, Meta, OpenAI, Microsoft Copilot, Salesforce Einstein, ServiceNow AI, Amazon AWS AI teams. Now tested at most FAANG loops.",
    tldr:"Interviewers detect instantly whether you've used AI or built with AI. These are completely different. Most 2025 interview loops now include an AI product question.",
    framework:{
      name:"AI PM Framework — 6 Dimensions",
      steps:[
        {label:"1. AI-Native vs AI-Enabled",content:"AI-Native: the core product IS the model (ChatGPT, Midjourney, Cursor). AI-Enabled: AI is a feature on top of a traditional product (Gmail Smart Compose, Salesforce Einstein, Microsoft Copilot). These require different PM skills, different GTM, different success metrics. Always clarify which type you're discussing before answering."},
        {label:"2. Precision vs Recall tradeoff",content:"Precision: of all the results the model returned, what % were actually correct? Recall: of all correct results that exist, what % did the model find? High precision + low recall = conservative, misses things. Low precision + high recall = aggressive, many false positives. PM implication: for fraud detection, high recall matters (don't miss fraud) even if precision suffers (some false positives). For medical diagnosis AI, both matter critically."},
        {label:"3. Data flywheel",content:"More users → more data → better model → better product → more users. This is a compounding moat. Companies with data flywheels (Google Search, Spotify, TikTok) become structurally harder to compete with. In product strategy: identify whether your AI product has a data flywheel and how to accelerate it."},
        {label:"4. Model evaluation framework",content:"Offline metrics (accuracy, F1 score, AUC on test set) ≠ online metrics (user engagement, task completion, business outcomes). Define both: offline metrics for model quality + online metrics for product impact. Always state: 'My success metric is X (online), which I validate with Y (offline) during model development.'"},
        {label:"5. AI ethics and guardrails",content:"Bias in training data produces biased outputs. Define: what guardrails prevent harmful outputs? What human review process exists for high-stakes decisions? How do you handle the model being wrong? Enterprise AI: what disclosure requirements exist (EU AI Act)? This is tested in both FAANG and enterprise PM loops."},
        {label:"6. AI product failure modes",content:"Know the common failure modes: model drift (performance degrades as world changes), hallucinations (LLMs generating false information confidently), adversarial inputs (users tricking the model), cold start problem (not enough data to start the flywheel). Strong AI PMs can describe how they'd detect and address each."},
      ]
    },
    keyRules:[
      "Using AI tools ≠ building AI products. Interviewers detect the difference in 60 seconds.",
      "Know precision vs recall and when each matters — this is tested explicitly.",
      "Know the data flywheel concept and name 3 companies that use it as a moat.",
      "Enterprise AI: know EU AI Act implications and SOC2 considerations for AI features.",
      "State both offline evaluation metrics AND online success metrics for any AI product answer.",
      "Always clarify AI-native vs AI-enabled at the start of any AI product question.",
    ],
    sources:[
      {type:"🌐 Free",title:"How to Crack the AI PM Interview in 2026",author:"Shailesh Sharma (TechnoManagers)",note:"Most current resource on what's changed in 2025–2026 AI PM interviews. Read first.",url:"https://www.technomanagers.com/p/how-to-crack-the-ai-pm-interview"},
      {type:"🌐 Free",title:"Coursera — Generative AI for Product Managers Specialisation",author:"Vanderbilt University",note:"4-course specialisation covering GenAI fundamentals, product applications, ethical considerations. Free to audit.",url:"https://www.coursera.org/specializations/generative-ai-for-product-managers"},
      {type:"🌐 Free",title:"Lenny's Newsletter — AI Product Strategy Issues",author:"Lenny Rachitsky",note:"Periodic deep dives on AI product strategy and what AI-native PM actually means in practice.",url:"https://www.lennysnewsletter.com"},
      {type:"📘 Book",title:"The Coming Wave",author:"Mustafa Suleyman (Microsoft AI CEO)",note:"Strategic context on where AI is heading. Gives you the 4/4 unique insight that separates candidates."},
    ],
    gateChecks:[
      {q:"A candidate says 'I have AI experience — I use ChatGPT and Claude daily in my work.' Why does an AI PM interviewer immediately discount this?",a:"Using AI tools is a user experience. Building AI products requires: defining evaluation metrics (offline: F1 score, AUC; online: task completion, engagement), understanding model selection tradeoffs (accuracy vs latency vs cost), making build-vs-fine-tune-vs-API decisions, designing data feedback loops, and owning guardrail policies for failure modes. Interviewers in 2025–2026 probe one level deeper in 60 seconds and immediately distinguish user knowledge from builder knowledge. The correct answer: describe an AI product decision you made — data source selection, evaluation framework design, precision/recall tradeoff choice, or guardrail design.",difficulty:"Starter"},
      {q:"Explain the precision/recall tradeoff and give a real PM example where you'd optimise for high recall at cost of precision.",a:"Precision = what % of your model's positive predictions are actually correct. Recall = what % of all actual positives does your model successfully find. These are in tension: to improve recall you lower the threshold for flagging something as positive, which also flags more false positives (lowering precision). Real PM example: Fraud detection at a bank. If your fraud model has 80% recall, 20% of real fraud transactions are missed — real financial losses to customers. You'd optimise for HIGH RECALL even if precision drops to 70% (30% of flagged transactions are false positives requiring manual review). The cost of a false positive (brief card block, customer service call) is much lower than the cost of a false negative (actual fraud).",difficulty:"Intermediate"},
      {q:"What is a data flywheel and name 3 products where it creates a defensible moat?",a:"A data flywheel: more users → more usage data → better model/algorithm → better product experience → more users. Each turn compounds the advantage. (1) TikTok: every video watched and swipe trains the recommendation model. More people = more accurate prediction of what keeps you watching — structurally impossible for a new entrant to replicate without billions of training examples. (2) Google Search: every query and click trains the ranking model. 90%+ market share = 90%+ of training data. A new search engine starts with no flywheel. (3) Waze/Google Maps: every trip driven contributes real-time traffic data, improving routing for every other driver. For a PM: identify whether your product has a data flywheel and design features that accelerate it — explicit feedback mechanisms, implicit signal capture.",difficulty:"Intermediate"},
      {q:"You are PM at Salesforce launching Einstein AI (AI-powered CRM recommendations). Define success metrics — and what's different about measuring AI product success vs a traditional feature?",a:"Traditional feature: DAU, feature adoption rate, task completion rate. AI product requires two additional layers — Offline metrics (model quality, pre-launch): Precision of recommendations (are suggested next actions actually relevant?), Recall (are we surfacing all important actions?), AUC-ROC for the underlying model. Online metrics (product impact, post-launch): Task completion rate when following AI recommendations vs not, Revenue attributed to AI-recommended actions (closed deals from AI-suggested next steps), Time-to-next-action (does Einstein reduce time a rep takes to decide what to do?), User trust metric — what % of recommendations are acted on without modification vs discarded? Key difference: if online metrics are good but offline metrics degrade over time (model drift), you need to catch this early. Build a monitoring pipeline that flags when model performance drops below threshold — this is a product requirement, not just engineering concern.",difficulty:"Advanced"},
    ],
    practiceQ:[
      {context:"B2C",q:"You are PM at Spotify. Design an AI-powered playlist generator. What are your success metrics including offline and online?"},
      {context:"Enterprise",q:"ServiceNow wants to add AI to automatically prioritise IT incident queues. How do you handle precision/recall tradeoffs in this context?"},
      {context:"Enterprise",q:"Salesforce Einstein recommends next best actions to sales reps. Users are ignoring 60% of recommendations. As PM, how do you diagnose and fix this?"},
    ]
  },
];

const RECRUITER_ITEMS = [
  {
    id:"cv_narrative", title:"CV Narrative & XYZ Bullets", urgency:"DO THIS FIRST",
    color:"#ef4444",
    desc:"Recruiters spend 6–10 seconds on your CV. Without a coherent narrative and outcome-driven bullets, you're screened before a single interview question is asked.",
    whyItMatters:"Your current CV has four AI projects (unfunded), a cloud infrastructure project, a banking context, and 12 years across three industries. A recruiter scanning for a FAANG senior PM sees no clear throughline. The narrative gap gets you screened out at 6 seconds.",
    actions:[
      {task:"Write your one-sentence positioning statement",detail:"'I am the PM who [specific value] for [type of company], with a track record of [honest proof point].' Example for your situation: 'Senior PM with 12 years driving complex infrastructure and AI product initiatives in regulated industries — now shipping a public product to close the portfolio gap.' This goes in your headline and opens every recruiter call."},
      {task:"Rewrite every CV bullet using XYZ format",detail:"Accomplished [X] as measured by [Y], by doing [Z]. Bad: 'Led ATM channel modernisation initiative.' Good: 'Designed and pitched a $2M business case for ATM fleet resilience covering 14,500 terminals, advancing to CPO and MD review and securing executive sponsorship for funding committee.' Real. Honest. Not overstated."},
      {task:"Frame unfunded AI projects correctly",detail:"Never say shipped. Say: 'Designed, vendor-validated, and secured CPO sponsorship for an AI-powered [X] initiative. Advanced to funding committee — pending 2025 budget approval.' This is honest, shows PM work, and doesn't overstate."},
      {task:"Add your side project the moment it has 1 real user",detail:"'Shipped [Product Name] — a [description] with [X] active users and [Y] metric. Built and owned end-to-end as PM, designer, and researcher.' This is your proof-of-ownership bullet. It closes the portfolio gap."},
      {task:"Sanity check: have a senior PM or recruiter read your CV",detail:"Ask them: 'In 10 seconds, what do I do and what's my biggest accomplishment?' If they pause or guess wrong, rewrite it."},
    ],
    checkItems:[
      "Positioning statement written and placed at top of CV",
      "Every bullet rewritten in XYZ format with at least one metric or scope indicator",
      "AI projects framed as 'designed/pitched/validated' — not 'shipped'",
      "JPMC cloud modernisation (6+ releases) written as a real delivery story",
      "Side project added with user and metric as soon as it has real users",
      "CV reviewed by a senior PM or recruiter contact",
    ]
  },
  {
    id:"linkedin", title:"LinkedIn Optimization", urgency:"WEEK 1",
    color:"#f97316",
    desc:"Recruiters at Google, Meta, Salesforce, and ServiceNow use LinkedIn Recruiter with Boolean search. A static profile with just your job title makes you invisible to inbound searches.",
    whyItMatters:"The hidden job market accounts for up to 80% of available positions. LinkedIn's algorithm rewards active profiles — those that post, comment, and engage appear higher in recruiter searches than dormant profiles with similar keyword density.",
    actions:[
      {task:"Rewrite your LinkedIn headline",detail:"Not just your job title. Format: '[Role] | [Domain 1] | [Domain 2] | [Domain 3]'. Example: 'Senior Product Manager | ATM Channel Modernisation | AI Product Strategy | Fintech & Enterprise Software'. This is what recruiters search for."},
      {task:"Rewrite your About section",detail:"First person, 3–5 paragraphs. Paragraph 1: your positioning statement. Paragraph 2: 2–3 honest proof points with specifics. Paragraph 3: what you're building next (the side project). Paragraph 4: what you're looking for. Include 10–15 keywords for your target roles naturally woven in."},
      {task:"Enable 'Open to Work' — recruiter-only setting",detail:"Go to Settings → Open to Work. Set visibility to 'Recruiters only' — not your entire network. You are at a bank and discretion matters. This makes you 35% more likely to receive InMail from relevant recruiters according to LinkedIn's own data."},
      {task:"Post once per week minimum",detail:"Even 3 sentences about something you learned, an observation about fintech, or an ATM/payments trend. LinkedIn's algorithm rewards active profiles. When you launch the side project, your LinkedIn post becomes your single biggest recruiter magnet."},
      {task:"Connect with 5 PMs at target companies this week",detail:"Not a generic connection request. Personalise: 'I'm a PM at JPMC working on ATM channel modernisation — I've been following [Company]'s [specific product] and would love to learn from your perspective on [specific topic]. Would you be open to a 20-minute chat?'"},
    ],
    checkItems:[
      "LinkedIn headline updated with domains and keywords",
      "About section rewritten with positioning statement + proof points + side project",
      "Open to Work enabled (recruiter-only visibility)",
      "Profile photo is professional and recent",
      "Experience section updated to match CV XYZ bullets",
      "First LinkedIn post published",
      "5 personalised connection requests sent to PMs at target companies",
    ]
  },
  {
    id:"phone_screen", title:"Recruiter Phone Screen Prep", urgency:"WEEK 2",
    color:"#f59e0b",
    desc:"The recruiter screen comes before any interview loop. It has completely different questions from PM interviews — and most candidates are unprepared for it.",
    whyItMatters:"A 20–30 minute recruiter call covers: your background walk, why you're leaving JPMC, why this company specifically, and your compensation range. The 'no shipped product' question will come. You need a rehearsed, honest, confident answer — not a defensive explanation.",
    actions:[
      {task:"Write and rehearse your 2-minute background walk",detail:"Structure: Current role + context (2 sentences) → Key accomplishments in order of relevance to this company (3–4 sentences) → Why you're at this inflection point (1–2 sentences). End with: 'Which is why I'm exploring senior PM roles where I can [specific value this company cares about].' Time it. 2 minutes maximum."},
      {task:"Prepare your 30-second 'no shipped product' answer",detail:"'My four AI initiatives at JPMC are in advanced design and funding stages — that's the nature of enterprise banking cycles. I recognised the portfolio gap early and am currently shipping a public product called [X] with early users and real metrics, launching publicly in [month]. That gives me the consumer shipping experience to complement my enterprise background.' Honest. Forward-looking. PM-thinking."},
      {task:"Prepare company-specific 'Why [Company]?' for each target",detail:"Not generic. For Salesforce: reference a specific product decision they made. For ServiceNow: reference their Now Platform expansion strategy. For Google: reference a specific PM challenge at their scale. Interviewers know generic answers immediately."},
      {task:"Prepare your 'Why leaving JPMC?' answer",detail:"Never badmouth. Frame as: 'I've loved the complexity and scale of building in a regulated enterprise environment. After [X years] I'm ready to [move into consumer tech / accelerate shipping pace / build AI products with a faster feedback loop]. This is the right moment in my career to make that move.'"},
      {task:"Practice the full phone screen out loud — record it",detail:"Use your phone's voice recorder. Listen back. You will cringe. That's the point. Fix whatever makes you cringe before the real call."},
    ],
    checkItems:[
      "2-minute background walk written and timed (under 2 mins)",
      "30-second 'no shipped product' answer rehearsed out loud",
      "'Why [Company]?' answers written for each of your 3 target companies",
      "'Why leaving JPMC?' answer written and rehearsed",
      "Full mock phone screen recorded and reviewed",
      "Ready to answer 'What's your expected compensation range?' without giving a number first",
    ]
  },
  {
    id:"application_pipeline", title:"Application Timeline & Pipeline", urgency:"RESTRUCTURE NOW",
    color:"#ef4444",
    desc:"The current plan applies in Week 11. Senior PM recruitment cycles at FAANG take 6–12 weeks from application to offer. Applying in Week 11 means offers arrive in Week 22 at the earliest.",
    whyItMatters:"At 8–10 applications with a 20% response rate, you get 1–2 conversations. That's not a pipeline — that's a lottery ticket. Senior PM searches need 15–20 targeted applications with a real referral strategy running from Week 1.",
    actions:[
      {task:"Weeks 1–4: Map and activate referral contacts",detail:"Identify 5 contacts at target companies with Director level or above. LinkedIn, JPMC alumni network, conference contacts, former colleagues who moved to tech. Prioritise by seniority — a VP-level referral carries dramatically more weight than a peer-level referral. Reach out personally with a specific ask: 'I'm applying for the Senior PM role in [team] — would you be willing to refer me internally?'"},
      {task:"Weeks 5–8: Apply to 3–5 stretch roles as practice",detail:"These are companies you're less attached to. The rejection feedback is free coaching. Use these early applications to refine your CV, your cover notes, and your recruiter phone screen. You'll be a better applicant at Week 9 because of them."},
      {task:"Weeks 9–10: Apply to primary target roles (15–20, not 8–10)",detail:"Tailored CV per role — adjust the top 3 bullets and the headline to match the JD keywords. Cover note: 3 sentences max. Sentence 1: why this company specifically. Sentence 2: one specific proof point. Sentence 3: what you'd bring."},
      {task:"Weeks 11–12: Active interview loops running",detail:"At this stage you should have multiple loops running simultaneously, not just starting to apply. This is where interview prep pays off — you're in real loops with real companies."},
      {task:"Track every application in a simple spreadsheet",detail:"Columns: Company | Role | Applied date | Referral (Y/N) | Status | Next step | Deadline. Review weekly. If a role has been open for 3+ weeks with no response, follow up once with your referral contact."},
    ],
    checkItems:[
      "3 target companies identified with specific teams/roles mapped",
      "5 referral contacts identified and outreach initiated",
      "Application tracking spreadsheet set up",
      "CV tailored for each company type (FAANG consumer vs enterprise software)",
      "First 3 applications submitted by end of Week 5",
      "Primary application blitz (15–20 roles) completed by Week 10",
    ]
  },
  {
    id:"compensation", title:"Compensation Research", urgency:"WEEK 1",
    color:"#84cc16",
    desc:"Getting anchored low in the recruiter phone screen costs you money that no Week 12 negotiation tactic can recover. Know your number before the first call.",
    whyItMatters:"Senior PM compensation at FAANG ranges from $180K–$280K base + RSUs. Enterprise software (ServiceNow, Salesforce) ranges $150K–$220K base. Not knowing these ranges means you're negotiating blind — or worse, anchoring yourself below market.",
    actions:[
      {task:"Research compensation at each target company on Levels.fyi",detail:"Search 'Senior Product Manager [Company]'. Filter by level (L5/L6 at Google, L6 at Amazon, E6 at Meta). Note: base salary, annual bonus, RSU vesting schedule, and signing bonus. Total Compensation (TC) is what matters, not just base."},
      {task:"Cross-reference with Glassdoor and Blind",detail:"Levels.fyi is most accurate for TC. Glassdoor gives base salary ranges. Blind has real-time candidate discussions about offer specifics. Use all three for triangulation."},
      {task:"Build your 3-number range",detail:"Floor: minimum you'd accept (don't share this). Target: what you're aiming for based on market research. Stretch: what you'd take if they pressed an exploding offer. Have these numbers ready before your first recruiter call."},
      {task:"Prepare your compensation deflection answer",detail:"When asked 'What's your expected compensation range?' — never give a number first. Say: 'I'm targeting the market rate for this level, which I understand is in the range of $X–$Y total comp based on my research. I'm flexible depending on the full package structure.' If they press: 'I'd need to understand the full comp structure including RSUs and bonus before committing to a number.'"},
      {task:"Study the full TC components",detail:"Base salary, annual bonus (% of base, based on performance/company), RSU grant (4-year vest, 1-year cliff — understand the vesting schedule), signing bonus (often one-time, sometimes clawed back if you leave early), relocation. Each of these is negotiable separately."},
    ],
    checkItems:[
      "Levels.fyi research complete for all 3 target companies",
      "Glassdoor and Blind research cross-referenced",
      "Three-number range established (floor, target, stretch)",
      "Compensation deflection answer rehearsed",
      "RSU vesting schedule mechanics understood",
      "JPMC current total comp calculated as baseline for negotiation",
    ]
  },
  {
    id:"references", title:"Reference Strategy", urgency:"WEEK 3",
    color:"#818cf8",
    desc:"Senior PM placements almost always include reference checks. A reference who says 'Charan was a solid contributor' is actively damaging. You need references who can speak to product ownership, influence, and business impact.",
    whyItMatters:"References at JPMC should speak specifically to: PM ownership (not just contribution), business impact of your work, and your ability to influence without authority. If your references don't know to emphasise these, they will default to generic praise.",
    actions:[
      {task:"Identify 3 strategic references",detail:"Ideally: (1) A senior stakeholder at Director/MD level who can speak to business impact — ideally your CPO or MD. (2) A peer PM or product lead who can speak to your PM craft and collaboration. (3) An engineer or designer you partnered with closely who can speak to how you worked cross-functionally."},
      {task:"Brief each reference before they're contacted",detail:"Share your positioning statement. Tell them: 'I'm applying for senior PM roles at [companies]. The key things I want them to hear from you are: [1] that I own product decisions end-to-end, [2] the business impact of [specific project], [3] how I influenced [stakeholder] to [outcome].' Give them the story to tell."},
      {task:"Ask the hard diagnostic question",detail:"Ask each reference directly: 'If a hiring manager asks whether I owned product decisions end to end — not just contributed — what would you say?' This surfaces any gap in their perception before it surfaces in a reference check."},
      {task:"For JPMC specifically: be careful about confidentiality",detail:"Reference conversations at banks are sensitive. Confirm with each person that they're comfortable being a reference before the formal ask. Some senior JPMC executives require HR approval for external references."},
    ],
    checkItems:[
      "3 references identified (senior stakeholder + peer PM + cross-functional partner)",
      "Each reference briefed on your positioning and the key stories to reinforce",
      "Diagnostic question asked of each reference — no surprises in their answer",
      "Confirmed each reference is willing and cleared to speak externally",
      "References have your updated CV and understand the roles you're targeting",
    ]
  },
  {
    id:"portfolio", title:"Work Samples & Portfolio", urgency:"WEEK 6",
    color:"#06b6d4",
    desc:"Enterprise companies — especially Microsoft, Salesforce, and ServiceNow — sometimes request a portfolio exercise or sample work. Your plan has zero portfolio preparation.",
    whyItMatters:"Enterprise PM roles increasingly include take-home exercises: 'Write a PRD for this scenario', 'Prioritise this backlog', or 'Present a product strategy.' Your side project becomes your portfolio anchor — real decisions, real tradeoffs, real metrics.",
    actions:[
      {task:"Sanitise one ARIES or ANDOP document into a shareable one-pager",detail:"Remove all JPMC confidential data, client names, and proprietary system names. Keep the structure: problem statement, approach, key decisions, outcomes. This becomes your enterprise PM portfolio piece — proof you can structure complex technical product work."},
      {task:"The side project PRD is your strongest portfolio piece",detail:"Write it properly from Week 2 onwards. It should include: problem statement, user research (even if 3 conversations), prioritised requirements, success metrics, what you're not building and why, and the key tradeoff you made. This is what you send when asked for a work sample."},
      {task:"Create a one-page case study of the JPMC cloud modernisation",detail:"The 6+ releases of real delivered infrastructure work. Format: Background → Your role → Key decisions you owned → Measurable outcomes → What you'd do differently. 1 page maximum. This is your 'I've shipped real things' document."},
      {task:"Prepare for a take-home exercise",detail:"Some companies send a 48-hour exercise: 'Write a strategy memo for [product scenario].' Practice this format now using one of your strategic topics. Time yourself: 2 hours max for the exercise. Structure: exec summary → market context → recommendation → success metrics → risks. Clean, crisp, no fluff."},
    ],
    checkItems:[
      "One ARIES/ANDOP document sanitised and ready to share",
      "Side project PRD written (started by Week 2, refined as you build)",
      "JPMC cloud modernisation one-page case study written",
      "Take-home exercise format practiced at least once with a timer",
      "All portfolio documents in a single shareable folder (Google Drive or Notion)",
    ]
  },
  {
    id:"no_product_answer", title:"The 'No Shipped Product' Answer", urgency:"WEEK 1 — CRITICAL",
    color:"#ef4444",
    desc:"Every FAANG and enterprise recruiter will ask this. It will come up in the phone screen, in every behavioural round, and in every 'walk me through your background' moment. You need one answer that is honest, confident, and not defensive.",
    whyItMatters:"The way you answer this question signals how you handle adversity, how self-aware you are, and whether you're already solving the problem. Candidates who are defensive lose the interviewer instantly. Candidates who show they diagnosed the gap and are actively closing it demonstrate PM thinking.",
    actions:[
      {task:"Write the 30-second version",detail:"'My four AI product initiatives at JPMC — fleet resilience, cash optimisation, credit scoring, and compliance — are all in advanced design and funding stages. That's the reality of building in a regulated enterprise banking environment. I recognised the portfolio gap and I'm currently shipping [Product Name] publicly — early users, real metrics, launching in [month]. That gives me the consumer shipping story to complement my enterprise design experience.'"},
      {task:"Write the 2-minute expanded version for behavioural rounds",detail:"Same structure but expanded with: (1) What specifically you did on each of the four AI projects (designed, vendor-validated, wrote business cases, presented to MD and CPO, advanced to funding committee), (2) What you learned about why enterprise products move slowly, (3) How you made the specific decision to build the side project to close the gap, (4) What you've shipped so far and what you've learned as a PM who owns the whole stack."},
      {task:"Reframe JPMC cloud modernisation as real delivery",detail:"'The one project where I owned delivery end-to-end is JPMC's cloud modernisation programme — 6+ releases shipped to production, covering infrastructure used by [X] users. I owned the roadmap, the vendor relationships, and the release process. That's my proof of delivery.' This is honest. It shifts the frame from 'no shipped product' to 'here's what I shipped.'"},
      {task:"Practice this answer until it sounds natural, not rehearsed",detail:"Record yourself. Play it back. If you sound like you're reading a script, practice more. If you sound defensive, rewrite it. The answer should land like a confident PM talking about a real plan — not an apology."},
    ],
    checkItems:[
      "30-second version written and rehearsed (sounds natural, not scripted)",
      "2-minute expanded version written for behavioural rounds",
      "JPMC cloud modernisation reframed as a real delivery story",
      "Answer recorded and reviewed — no defensiveness in tone",
      "Answer updated with real side project metrics as they become available",
    ]
  },
];

const PROJECTS = [
  {id:1,name:"Business Case Builder",fit:9,desc:"Simplified public version of Litmus for startup PMs.",risk:"Over-scoping"},
  {id:2,name:"PM Interview Prep Tool",fit:8,desc:"AI mock interviews with structured feedback for PM candidates.",risk:"Crowded space"},
  {id:3,name:"ATM Finder / Branch Intelligence",fit:7,desc:"Public ATM availability and accessibility tool.",risk:"IP risk re JPMC"},
  {id:4,name:"Requirements Tracker / PRD Generator",fit:7,desc:"Your Register methodology as a lightweight web product.",risk:"Needs user validation first"},
  {id:5,name:"Meeting Notes → Action Items",fit:6,desc:"Paste transcript, get structured action items and owners.",risk:"Hard to differentiate"},
];

const STORAGE_KEY = "pm-academy-v4";

async function loadState(){
  try{const r=await window.storage.get(STORAGE_KEY);return r?JSON.parse(r.value):{};}catch{return{};}
}
async function saveState(v){
  try{await window.storage.set(STORAGE_KEY,JSON.stringify(v));}catch{}
}

function Bar({pct,color="#f59e0b",h=5}){
  return(
    <div style={{background:"#1e293b",borderRadius:99,height:h,overflow:"hidden",flex:1}}>
      <div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:99,transition:"width .4s ease"}}/>
    </div>
  );
}

function Tag({label,color}){
  return <span style={{fontSize:9,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color,border:`1px solid ${color}40`,padding:"2px 7px",borderRadius:3,whiteSpace:"nowrap"}}>{label}</span>;
}

export default function App(){
  const [view,setView]=useState("home");
  const [section,setSection]=useState("topics"); // topics | recruiter | project | progress
  const [activeTopic,setActiveTopic]=useState(null);
  const [activeRecruiter,setActiveRecruiter]=useState(null);
  const [topicTab,setTopicTab]=useState("learn");
  const [completedChecks,setCompletedChecks]=useState({});
  const [recruiterChecks,setRecruiterChecks]=useState({});
  const [expandedSteps,setExpandedSteps]=useState({});
  const [gcRevealed,setGcRevealed]=useState({});
  const [practiceLog,setPracticeLog]=useState([]);
  const [buildLog,setBuildLog]=useState([]);
  const [selectedProject,setSelectedProject]=useState(null);
  const [logNote,setLogNote]=useState("");
  const [buildEntry,setBuildEntry]=useState("");
  const [aiChat,setAiChat]=useState({});
  const [aiLoading,setAiLoading]=useState({});
  const [userInput,setUserInput]=useState({});
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    const link=document.createElement("link");
    link.rel="stylesheet";
    link.href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap";
    document.head.appendChild(link);
    loadState().then(s=>{
      if(s.completedChecks)setCompletedChecks(s.completedChecks);
      if(s.recruiterChecks)setRecruiterChecks(s.recruiterChecks);
      if(s.practiceLog)setPracticeLog(s.practiceLog);
      if(s.buildLog)setBuildLog(s.buildLog);
      if(s.selectedProject)setSelectedProject(s.selectedProject);
      setReady(true);
    });
  },[]);

  useEffect(()=>{
    if(ready)saveState({completedChecks,recruiterChecks,practiceLog,buildLog,selectedProject});
  },[completedChecks,recruiterChecks,practiceLog,buildLog,selectedProject,ready]);

  const toggleCheck=id=>setCompletedChecks(s=>({...s,[id]:!s[id]}));
  const toggleRecruiter=id=>setRecruiterChecks(s=>({...s,[id]:!s[id]}));

  const topic=TOPICS.find(t=>t.id===activeTopic);
  const recruiterItem=RECRUITER_ITEMS.find(r=>r.id===activeRecruiter);
  const proj=PROJECTS.find(p=>p.id===selectedProject);

  const totalInterviewChecks=TOPICS.reduce((a,t)=>a+t.gateChecks.length,0);
  const doneInterviewChecks=Object.keys(completedChecks).filter(k=>completedChecks[k]).length;
  const interviewPct=totalInterviewChecks?Math.round((doneInterviewChecks/totalInterviewChecks)*100):0;

  const totalRecruiterChecks=RECRUITER_ITEMS.reduce((a,r)=>a+r.checkItems.length,0);
  const doneRecruiterChecks=Object.keys(recruiterChecks).filter(k=>recruiterChecks[k]).length;
  const recruiterPct=totalRecruiterChecks?Math.round((doneRecruiterChecks/totalRecruiterChecks)*100):0;

  const overallPct=Math.round((interviewPct+recruiterPct)/2);

const callAI = async (topicId, gcIndex, question, userAns) => {
  const key = `${topicId}-${gcIndex}`;
  setAiLoading((s) => ({ ...s, [key]: true }));

  try {
    const resp = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question,
        answer: userAns || "[No answer]",
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("API ERROR:", data);
      throw new Error("API failed");
    }

    setAiChat((s) => ({
      ...s,
      [key]: data.result,
    }));

  } catch (err) {
    console.error("FRONTEND ERROR:", err);
    setAiChat((s) => ({
      ...s,
      [key]: "Evaluation failed — check API / network."
    }));
  } finally {
    setAiLoading((s) => ({ ...s, [key]: false }));
  }
};

  const diffColor=d=>d==="Starter"?"#22c55e":d==="Intermediate"?"#f59e0b":"#ef4444";

  const s={
    wrap:{background:"#030711",minHeight:"100vh",color:"#e2e8f0",fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13},
    mono:{fontFamily:"'IBM Plex Mono',monospace"},
    card:(b="#1e293b",bg="#080f1e")=>({background:bg,border:`1px solid ${b}`,borderRadius:12,padding:16,marginBottom:12}),
    btn:(c="#f59e0b",ghost=false)=>({background:ghost?"transparent":c,color:ghost?c:"#000",border:ghost?`1px solid ${c}40`:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer"}),
    tag:(c)=>({fontSize:9,fontWeight:800,letterSpacing:1.2,textTransform:"uppercase",color:c,border:`1px solid ${c}40`,padding:"2px 7px",borderRadius:3}),
    input:{background:"#111827",border:"1px solid #334155",borderRadius:8,color:"#e2e8f0",fontSize:12,padding:"10px 12px",fontFamily:"inherit",width:"100%",resize:"vertical",minHeight:70,boxSizing:"border-box"},
  };

  // ── HOME / OVERVIEW ──────────────────────────────────────────────────────────
  const Home=()=>(
    <div style={{padding:"0 0 60px"}}>
      {/* Hero */}
      <div style={{padding:"22px 16px 16px",textAlign:"center"}}>
        <div style={{...s.mono,fontSize:9,color:"#334155",letterSpacing:2,marginBottom:8}}>CHARAN · PM INTERVIEW ACADEMY · V4 · BATTLE-READY</div>
        <div style={{fontSize:22,fontWeight:900,color:"#fff",marginBottom:4,lineHeight:1.2}}>Senior PM Prep</div>
        <div style={{fontSize:12,color:"#475569",marginBottom:16}}>Interview curriculum + Recruiter readiness. Both required to get the offer.</div>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:20}}>
          {[
            {l:"Overall",v:`${overallPct}%`,c:"#f59e0b"},
            {l:"Interview Prep",v:`${interviewPct}%`,c:"#818cf8"},
            {l:"Recruiter Ready",v:`${recruiterPct}%`,c:"#22c55e"},
          ].map(x=>(
            <div key={x.l} style={{background:"#080f1e",border:"1px solid #1e293b",borderRadius:10,padding:"10px 16px",minWidth:90,textAlign:"center"}}>
              <div style={{...s.mono,fontSize:18,fontWeight:900,color:x.c}}>{x.v}</div>
              <div style={{fontSize:10,color:"#475569",marginTop:2}}>{x.l}</div>
            </div>
          ))}
        </div>
        {/* Honest situation */}
        <div style={{...s.card("#ef444430","#0a0505"),textAlign:"left",maxWidth:680,margin:"0 auto 14px"}}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:"#ef4444",marginBottom:10}}>⚠ The Honest Situation — Read This First</div>
          {[
            ["CRITICAL GAP","No shipped product owned as PM. Every FAANG interviewer will probe this hard.","#ef4444"],
            ["4 AI PROJECTS","ARIES, ANDOP, Home Lending, HMDA — all designed and pitched, none funded, none shipped.","#f97316"],
            ["REAL DELIVERY","JPMC cloud modernisation (6+ releases). Infrastructure, not AI. Real. Own it fully.","#84cc16"],
            ["THE HEDGE","Side project must ship publicly with real users by Week 10. It's your primary deliverable.","#f59e0b"],
            ["RECRUITER TRAP","Great interview prep means nothing if you don't get the call. Recruiter readiness is equally critical.","#818cf8"],
          ].map(([tag,text,c])=>(
            <div key={tag} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}>
              <Tag label={tag} color={c}/>
              <span style={{fontSize:12,color:"#94a3b8",lineHeight:1.55}}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section nav */}
      <div style={{padding:"0 12px"}}>
        {[
          {id:"topics",emoji:"📚",title:"Interview Curriculum",sub:"9 topics — frameworks, sources, AI gate checks",pct:interviewPct,color:"#818cf8"},
          {id:"recruiter",emoji:"🎯",title:"Recruiter Readiness",sub:"8 gaps — CV, LinkedIn, phone screen, compensation",pct:recruiterPct,color:"#22c55e"},
          {id:"project",emoji:"🛠️",title:"Side Project Tracker",sub:proj?`${proj.name} — build log`:"No project selected yet",pct:0,color:"#f59e0b"},
          {id:"progress",emoji:"📈",title:"Full Progress Dashboard",sub:`${doneInterviewChecks+doneRecruiterChecks} of ${totalInterviewChecks+totalRecruiterChecks} total items complete`,pct:overallPct,color:"#f59e0b"},
        ].map(item=>(
          <div key={item.id} onClick={()=>{setSection(item.id);setView("section");}} style={{...s.card(),cursor:"pointer",borderLeft:`3px solid ${item.color}`,marginBottom:10,display:"flex",gap:12,alignItems:"center"}}>
            <div style={{fontSize:24}}>{item.emoji}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:800,color:"#fff",fontSize:13,marginBottom:2}}>{item.title}</div>
              <div style={{fontSize:11,color:"#475569",marginBottom:6}}>{item.sub}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Bar pct={item.pct} color={item.color} h={3}/>
                <span style={{...s.mono,fontSize:9,color:"#334155"}}>{item.pct}%</span>
              </div>
            </div>
            <div style={{color:"#334155",fontSize:14}}>→</div>
          </div>
        ))}
      </div>
    </div>
  );

// ── TOPICS LIST ───────────────────────────────────────────────
const TopicsList = () => (
  <div style={{ padding: "14px 12px 60px" }}>
    <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#475569", marginBottom: 14 }}>
      9 Interview Topics — Click to Study
    </div>

    {TOPICS.map((t) => {
      const done = t.gateChecks.filter((_, i) => completedChecks[`${t.id}-${i}`]).length;
      const pct = Math.round((done / t.gateChecks.length) * 100);

      return (
        <div
          key={t.id}
          onClick={() => {
            setActiveTopic(t.id);
            setTopicTab("learn");
            setView("topic");
          }}
          style={{ ...s.card(), cursor: "pointer", borderLeft: `3px solid ${t.color}`, marginBottom: 10, display: "flex", gap: 10, alignItems: "center" }}
        >
          <div style={{ fontSize: 20 }}>{t.emoji}</div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 800, color: "#fff", fontSize: 13 }}>{t.title}</span>
              <Tag label={t.priority.split(" ")[0]} color={t.priority.startsWith("CRITICAL") ? "#ef4444" : "#f97316"} />
              {t.track === "enterprise" && <Tag label="Enterprise" color="#818cf8" />}
            </div>

            <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{t.tldr}</div>

            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <Bar pct={pct} color={t.color} h={3} />
              <span style={{ fontSize: 9 }}>{done}/{t.gateChecks.length} checks</span>
            </div>
          </div>

          <div style={{ fontSize: 14 }}>→</div>
        </div>
      );
    })}
  </div>
);

// ── RECRUITER LIST ────────────────────────────────────────────
const RecruiterList = () => (
  <div style={{ padding: "14px 12px 60px" }}>
    <div style={{ ...s.card("#22c55e20", "#050f08"), marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#22c55e", marginBottom: 6 }}>
        Why This Section Exists
      </div>
      <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
        Great interview prep means nothing if you don't get the recruiter call.
      </div>
    </div>

    {RECRUITER_ITEMS.map((item) => {
      const done = item.checkItems.filter((_, i) => recruiterChecks[`${item.id}-${i}`]).length;
      const pct = Math.round((done / item.checkItems.length) * 100);

      return (
        <div
          key={item.id}
          onClick={() => {
            setActiveRecruiter(item.id);
            setView("recruiter");
          }}
          style={{ ...s.card(), cursor: "pointer", borderLeft: `3px solid ${item.color}`, marginBottom: 10 }}
        >
          <div style={{ fontWeight: 800, color: "#fff", fontSize: 12 }}>{item.title}</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>{item.desc}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <Bar pct={pct} color={item.color} h={3} />
            <span style={{ fontSize: 9 }}>{done}/{item.checkItems.length}</span>
          </div>
        </div>
      );
    })}
  </div>
);

const TopicDetail = () => {
  if (!topic) return null;

  const done = topic.gateChecks.filter((_, i) => completedChecks[`${topic.id}-${i}`]).length;
  const pct = Math.round((done / topic.gateChecks.length) * 100);

  return (
    <div>
      <div style={{ background: "#060d1a", borderBottom: "1px solid #1e293b", padding: "12px 14px 0" }}>
        <button onClick={() => setView("section")} style={{ ...s.btn("#475569", true), fontSize: 11, marginBottom: 10 }}>
          ← Topics
        </button>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 24 }}>{topic.emoji}</span>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#fff" }}>{topic.title}</div>
            <div style={{ fontSize: 10, color: "#475569" }}>{topic.testedAt}</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ ...s.mono, fontSize: 14, fontWeight: 900, color: topic.color }}>{pct}%</div>
            <div style={{ fontSize: 9, color: "#334155" }}>{done}/{topic.gateChecks.length} checks</div>
          </div>
        </div>

        <div style={{ display: "flex" }}>
          {[["learn","📖 Learn"],["gatecheck","🎯 Gate Checks"],["practice","✍️ Practice"]].map(([id,label])=>(
            <button
              key={id}
              onClick={()=>setTopicTab(id)}
              style={{
                borderBottom: topicTab===id?`2px solid ${topic.color}`:"2px solid transparent",
                padding:"9px 12px",
                color: topicTab===id?topic.color:"#475569",
                background:"none",
                border:"none",
                cursor:"pointer"
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "14px 12px 60px" }}>

        {/* LEARN */}
        {topicTab==="learn"&&(
          <div>
            <div style={{...s.card(`${topic.color}40`)}}>
              <div style={{fontSize:10,fontWeight:800,color:topic.color,marginBottom:6}}>What This Tests</div>
              <div style={{fontSize:13,color:"#cbd5e1"}}>{topic.tldr}</div>
            </div>

            <div style={s.card()}>
              <div style={{fontSize:10,fontWeight:800,color:"#475569",marginBottom:10}}>Critical Rules</div>
              {topic.keyRules.map((r,i)=>(
                <div key={i} style={{marginBottom:8}}>{r}</div>
              ))}
            </div>

            <div style={s.card()}>
              <div style={{fontSize:10,fontWeight:800,color:"#475569"}}>Framework</div>
              <div style={{fontSize:13,fontWeight:700,color:topic.color}}>{topic.framework.name}</div>

              {topic.framework.steps.map((step,i)=>{
                const key=`${topic.id}-step-${i}`;
                const open=expandedSteps[key];

                return(
                  <div key={i}>
                    <div onClick={()=>setExpandedSteps(s=>({...s,[key]:!s[key]}))}>
                      {step.label}
                    </div>
                    {open && <div>{step.content}</div>}
                  </div>
                );
              })}
            </div>

            <div style={s.card()}>
              <div style={{fontSize:10,fontWeight:800,color:"#475569"}}>Sources</div>
              {topic.sources.map((src,i)=>(
                <div key={i}>
                  <div>{src.title}</div>
                  <div>{src.note}</div>
                </div>
              ))}
            </div>
          </div>
        )}

{/* GATE CHECKS */}
{topicTab === "gatecheck" && (
  <div>
    <div
      style={{
        ...s.card("#f59e0b20", "#080800"),
        marginBottom: 14,
        fontSize: 12,
        color: "#f59e0b",
        lineHeight: 1.6,
      }}
    >
      <strong>How to use:</strong> Write your answer → Get AI feedback → Reveal → Mark complete.
    </div>

    {topic.gateChecks.map((gc, i) => {
      const stableKey = `${topic.id}-${i}`;
      const revealed = gcRevealed[stableKey];
      const done = completedChecks[stableKey];
      const aiResult = aiChat[stableKey];
      const loading = aiLoading[stableKey];

      return (
        <div
          key={stableKey}
          style={{
            ...s.card(done ? `${topic.color}50` : "#1e293b"),
            marginBottom: 12,
          }}
        >
          {/* ✅ QUESTION (RESTORED) */}
          <div style={{ fontSize: 12, color: "#e2e8f0", marginBottom: 8 }}>
            {gc.q}
          </div>

          {/* ANSWER INPUT */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10 }}>Your Answer</div>

            {/* ✅ UNCONTROLLED TEXTAREA (CURSOR FIX) */}
            <textarea
              placeholder="Write your answer..."
              style={{ ...s.input }}
            />

            <button
              onClick={(e) => {
                const textarea =
                  e.currentTarget.parentElement.querySelector("textarea");

                const val = textarea.value;
                if (!val.trim()) return;

                callAI(topic.id, i, gc.q, val);
              }}
              disabled={loading}
              style={{
                ...s.btn(topic.color),
                marginTop: 6,
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? "Evaluating..." : "Get AI Feedback"}
            </button>
          </div>

          {/* AI RESULT */}
          {aiResult && (
            <div
              style={{
                background: "#050b18",
                border: "1px solid #1e293b",
                borderRadius: 8,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                {aiResult}
              </div>
            </div>
          )}

          {/* REVEAL / COMPLETE FLOW */}
          {!revealed ? (
            <button
              onClick={() =>
                setGcRevealed((s) => ({
                  ...s,
                  [stableKey]: true,
                }))
              }
              style={{ ...s.btn("#475569", true), fontSize: 11 }}
            >
              Reveal Answer
            </button>
          ) : (
            <button
              onClick={() => toggleCheck(stableKey)}
              style={{
                ...s.btn(done ? "#334155" : topic.color, done),
                fontSize: 11,
              }}
            >
              {done ? "Completed" : "Mark Complete"}
            </button>
          )}
        </div>
      );
    })}
  </div>
)}

        {/* PRACTICE */}
        {topicTab==="practice"&&(
          <div>
            <div style={s.card()}>
              {topic.practiceQ.map((pq,i)=>(
                <div key={i}>
                  <Tag label={pq.context}/>
                  <div>{pq.q}</div>
                </div>
              ))}
            </div>

            <div style={s.card()}>
              <textarea
                value={logNote}
                onChange={(e)=>setLogNote(e.target.value)}
                style={s.input}
              />

              <button onClick={()=>{
                if(!logNote.trim())return;
                setPracticeLog(s=>[...s,{note:logNote}]);
                setLogNote("");
              }}>
                + Log Session
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
// ── RECRUITER DETAIL ──────────────────────────────────────────
const RecruiterDetail = () => {
  if (!recruiterItem) return null;

  const done = recruiterItem.checkItems.filter((_, i) => recruiterChecks[`${recruiterItem.id}-${i}`]).length;
  const pct = Math.round((done / recruiterItem.checkItems.length) * 100);

  return (
    <div>
      <div style={{ background: "#060d1a", padding: "12px" }}>
        <div style={{ fontSize: 16, fontWeight: 900 }}>{recruiterItem.title}</div>
        <Tag label={recruiterItem.urgency} color="#f97316" />
        <div>{pct}%</div>
      </div>

      <div style={{ padding: "12px" }}>
        {recruiterItem.actions.map((a, i) => (
          <div key={i} style={{ marginBottom: 10 }}>{a.task}</div>
        ))}
      </div>
    </div>
  );
};
  // ── SIDE PROJECT ──────────────────────────────────────────────────────────────
  const ProjectSection=()=>(
    <div style={{padding:"14px 12px 60px"}}>
      {proj?(
        <div style={{...s.card("#818cf840"),marginBottom:14}}>
          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
            <Tag label={`FIT ${proj.fit}/10`} color="#818cf8"/>
            <div style={{fontSize:10,color:"#22c55e",fontWeight:700}}>✓ Selected</div>
            <button onClick={()=>setSelectedProject(null)} style={{...s.btn("#475569",true),fontSize:10,padding:"2px 8px",marginLeft:"auto"}}>Clear</button>
          </div>
          <div style={{fontSize:17,fontWeight:800,color:"#e2e8f0",marginBottom:4}}>{proj.name}</div>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:4}}>{proj.desc}</div>
          <div style={{fontSize:11,color:"#f59e0b"}}>⚠ Risk: {proj.risk}</div>
        </div>
      ):(
        <div style={{...s.card("#f59e0b20"),fontSize:12,color:"#f59e0b",marginBottom:14}}>No project selected — pick one below. This is a Week 1 task.</div>
      )}
      <div style={{marginBottom:14}}>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:"#475569",marginBottom:10}}>All Candidates</div>
        {PROJECTS.map(p=>(
          <div key={p.id} style={{...s.card(selectedProject===p.id?"#818cf860":"#1e293b"),display:"flex",gap:12,alignItems:"flex-start",marginBottom:8}}>
            <div style={{...s.mono,fontSize:20,fontWeight:900,color:p.fit>=9?"#f59e0b":p.fit>=8?"#818cf8":"#475569",minWidth:22,lineHeight:1}}>{p.fit}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,color:"#e2e8f0",marginBottom:2,fontSize:12}}>{p.name}</div>
              <div style={{fontSize:11,color:"#64748b",marginBottom:2}}>{p.desc}</div>
              <div style={{fontSize:10,color:"#f59e0b80"}}>Risk: {p.risk}</div>
            </div>
            <button onClick={()=>setSelectedProject(selectedProject===p.id?null:p.id)} style={{...s.btn(selectedProject===p.id?"#818cf8":"#475569",selectedProject===p.id),fontSize:11,padding:"5px 10px"}}>
              {selectedProject===p.id?"✓ Selected":"Select"}
            </button>
          </div>
        ))}
      </div>
      <div style={s.card()}>
        <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:"#475569",marginBottom:10}}>Build Log</div>
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          <input value={buildEntry} onChange={e=>setBuildEntry(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(()=>{if(!buildEntry.trim())return;setBuildLog(s=>[...s,{date:new Date().toISOString().split("T")[0],entry:buildEntry.trim()}]);setBuildEntry("");})()}  placeholder="Log progress, decisions, user feedback, blockers..." style={{...s.input,resize:"none",minHeight:40}}/>
          <button onClick={()=>{if(!buildEntry.trim())return;setBuildLog(s=>[...s,{date:new Date().toISOString().split("T")[0],entry:buildEntry.trim()}]);setBuildEntry("");}} style={s.btn("#818cf8")}>+ Add</button>
        </div>
        {buildLog.length===0?(
          <div style={{fontSize:11,color:"#334155",textAlign:"center",padding:"10px 0",fontStyle:"italic"}}>No entries yet. Every build decision you log becomes a PM story for interviews.</div>
        ):[...buildLog].reverse().map((log,i)=>(
          <div key={i} style={{padding:"7px 0",borderBottom:"1px solid #0d1117",display:"flex",gap:8}}>
            <span style={{...s.mono,fontSize:10,color:"#334155",minWidth:78}}>{log.date}</span>
            <span style={{fontSize:12,color:"#cbd5e1"}}>{log.entry}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── PROGRESS ──────────────────────────────────────────────────────────────────
  const Progress=()=>{
    const readinessLabel=overallPct<20?"Not Ready":overallPct<40?"Early Stage":overallPct<60?"Building":overallPct<80?"Near Ready":"Battle Ready";
    const readinessColor=overallPct<20?"#ef4444":overallPct<40?"#f97316":overallPct<60?"#eab308":overallPct<80?"#84cc16":"#22c55e";
    return(
      <div style={{padding:"14px 12px 60px"}}>
        <div style={{...s.card(`${readinessColor}30`),marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
            <div>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:"#475569",marginBottom:4}}>Overall Readiness</div>
              <div style={{...s.mono,fontSize:28,fontWeight:900,color:readinessColor}}>{overallPct}%</div>
            </div>
            <Tag label={readinessLabel} color={readinessColor}/>
          </div>
          <Bar pct={overallPct} color={readinessColor} h={8}/>
          <div style={{fontSize:12,color:"#64748b",marginTop:10,lineHeight:1.6}}>
            {overallPct<40?"Complete the Recruiter Readiness section first — it gets you the call. Then build interview prep on top of that foundation.":
             overallPct<70?"Good momentum. Recruiter actions should be running in parallel with interview prep, not sequentially.":
             "Strong. Make sure your side project has real users and real metrics. That's the final unlock."}
          </div>
        </div>
        <div style={s.card()}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:"#475569",marginBottom:14}}>Interview Prep by Topic</div>
          {TOPICS.map(t=>{
            const done=t.gateChecks.filter((_,i)=>completedChecks[`${t.id}-${i}`]).length;
            const pct=Math.round((done/t.gateChecks.length)*100);
            return(
              <div key={t.id} style={{marginBottom:11}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,fontWeight:600,color:done===0?"#ef4444":"#94a3b8"}}>{t.emoji} {t.title}{done===0?" ← not started":""}</span>
                  <span style={{...s.mono,fontSize:10,color:"#334155"}}>{done}/{t.gateChecks.length}</span>
                </div>
                <Bar pct={pct} color={t.color} h={4}/>
              </div>
            );
          })}
        </div>
        <div style={s.card()}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:"#475569",marginBottom:14}}>Recruiter Readiness by Gap</div>
          {RECRUITER_ITEMS.map(item=>{
            const done=item.checkItems.filter((_,i)=>recruiterChecks[`${item.id}-${i}`]).length;
            const pct=Math.round((done/item.checkItems.length)*100);
            return(
              <div key={item.id} style={{marginBottom:11}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,fontWeight:600,color:done===0?"#ef4444":"#94a3b8"}}>{item.title}{done===0?" ← not started":""}</span>
                  <span style={{...s.mono,fontSize:10,color:"#334155"}}>{done}/{item.checkItems.length}</span>
                </div>
                <Bar pct={pct} color={item.color} h={4}/>
              </div>
            );
          })}
        </div>
        <div style={s.card()}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:"#475569",marginBottom:14}}>Fixed Gaps (Curriculum Cannot Close These Alone)</div>
          {[
            ["No shipped product","Ship the side project by Week 10 with real users + real metrics. That's the proof point.","#ef4444"],
            ["AI projects unfunded","Frame as 'designed, vendor-validated, pitched to CPO/MD, advancing to funding.' Never say shipped.","#f97316"],
            ["PM ownership vs BA gap","Own every decision in the side project. Document tradeoffs. That IS PM work.","#eab308"],
            ["Referral gap","A VP-level referral dramatically increases interview chances. Activate from Week 1, not Week 11.","#84cc16"],
            ["Compensation anchoring","Research Levels.fyi before the first recruiter call. Never give a number first.","#818cf8"],
          ].map(([gap,fix,c])=>(
            <div key={gap} style={{marginBottom:12,paddingBottom:12,borderBottom:"1px solid #0d1117"}}>
              <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:4}}>
                <div style={{width:5,height:5,background:c,borderRadius:"50%"}}/>
                <span style={{fontSize:12,fontWeight:700,color:c}}>{gap}</span>
              </div>
              <div style={{fontSize:11,color:"#64748b",lineHeight:1.55,paddingLeft:12}}>{fix}</div>
            </div>
          ))}
        </div>
        {practiceLog.length>0&&(
          <div style={s.card()}>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",color:"#475569",marginBottom:12}}>Practice Session Log ({practiceLog.length} total)</div>
            {[...practiceLog].reverse().slice(0,10).map((log,i)=>(
              <div key={i} style={{padding:"7px 0",borderBottom:"1px solid #0d1117",display:"flex",gap:8}}>
                <span style={{...s.mono,fontSize:10,color:"#334155",minWidth:78}}>{log.date}</span>
                <span style={{fontSize:10,color:"#818cf8",minWidth:90,flexShrink:0}}>{log.topic}</span>
                <span style={{fontSize:11,color:"#94a3b8"}}>{log.note}</span>
              </div>
            ))}
            {practiceLog.length>10&&<div style={{fontSize:10,color:"#334155",marginTop:8,textAlign:"center"}}>Showing last 10 of {practiceLog.length} sessions</div>}
          </div>
        )}
      </div>
    );
  };

  // ── TOP NAV ───────────────────────────────────────────────────────────────────
  const TopBar=()=>(
    <div style={{background:"#060d1a",borderBottom:"1px solid #1e293b",padding:"11px 14px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:10}}>
      <div onClick={()=>{setView("home");}} style={{cursor:"pointer"}}>
        <span style={{...s.mono,fontSize:13,fontWeight:900,color:"#f59e0b"}}>PM PREP</span>
      </div>
      <div style={{fontSize:9,color:"#334155",fontWeight:700,letterSpacing:1}}>CHARAN · V4</div>
      <div style={{flex:1}}/>
      <Bar pct={overallPct} color="#f59e0b" h={4}/>
      <span style={{...s.mono,fontSize:10,color:"#f59e0b",marginLeft:4}}>{overallPct}%</span>
    </div>
  );

  // ── SECTION HEADER ────────────────────────────────────────────────────────────
  const SectionHeader=({title,back})=>(
    <div style={{background:"#060d1a",borderBottom:"1px solid #1e293b",padding:"12px 14px",display:"flex",alignItems:"center",gap:10}}>
      <button onClick={()=>{setView("home");}} style={{...s.btn("#475569",true),fontSize:11,padding:"4px 10px"}}>{back||"← Home"}</button>
      <span style={{fontSize:14,fontWeight:800,color:"#fff"}}>{title}</span>
    </div>
  );

  if(!ready)return <div style={{background:"#030711",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",color:"#334155"}}>Loading...</div>;

  return(
    <div style={s.wrap}>
      <TopBar/>
      {view==="home"&&<Home/>}
      {view==="section"&&section==="topics"&&(<div><SectionHeader title="Interview Curriculum"/><TopicsList/></div>)}
      {view==="section"&&section==="recruiter"&&(<div><SectionHeader title="Recruiter Readiness"/><RecruiterList/></div>)}
      {view==="section"&&section==="project"&&(<div><SectionHeader title="Side Project Tracker"/><ProjectSection/></div>)}
      {view==="section"&&section==="progress"&&(<div><SectionHeader title="Full Progress Dashboard"/><Progress/></div>)}
      {view==="topic"&&<TopicDetail/>}
      {view==="recruiter"&&<RecruiterDetail/>}
    </div>
  );
}