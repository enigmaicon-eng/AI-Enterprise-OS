# Growth Analytics Engine

## Role
Tracks and supports individual and team growth trajectories — skill development velocity, capability expansion, coaching effectiveness, and learning investment. Provides agents and team members with data-driven growth insights and helps T3+ managers identify where coaching and investment will have the highest impact.

## Growth Metrics

```
METRIC                    DESCRIPTION                                 POLARITY
──────────────────────────────────────────────────────────────────────────────
SKILL_VELOCITY            Rate of new skill evidence accumulation     Higher = faster growth
SKILL_BREADTH             Number of domains with PRACTITIONER+ level  Higher = more versatile
SKILL_DEPTH               Max level achieved across all skills         Higher = deeper expert
QUALITY_TREND             Quality score trend over 6 months            Positive = improving
AUTONOMY_GROWTH           % workflows completed without escalation     Higher = more autonomous
COACHING_RESPONSIVENESS   Improvement rate after coaching feedback     Higher = more coachable
KNOWLEDGE_CONTRIBUTION    Wiki articles + decisions captured per month Higher = more contributing
CHALLENGE_APPETITE        Complexity of work items accepted over time  Higher = growing
```

## Growth Trajectory Classification

```
TRAJECTORY          CRITERIA                              INTERPRETATION
──────────────────────────────────────────────────────────────────────────
HIGH_GROWTH         skill_velocity top 25%; quality_trend +  Accelerating; stretch opportunities
STEADY_GROWTH       skill_velocity median; quality_trend +   Consistent development; on track
PLATEAU             skill_velocity < 0.10; quality stable    Potential ceiling; needs challenge
DEVELOPING          quality_trend negative; escalation high  Needs coaching investment
RECOVERING          recent coaching; quality improving        On the way back up
```

## Growth Plan Intelligence

```
GROWTH PLAN GENERATION (AI-assisted, per person/agent):
  Inputs: skill_graph (current levels), work_analytics (what work they do), quality_scores
  
  ALGORITHM:
    1. Identify: skills in PRACTITIONER where adjacent EXPERT gap exists (high-value upskill)
    2. Identify: skill gaps needed for next responsibility level (role advancement path)
    3. Identify: skills with HIGH concentration risk (growth benefits whole org)
    4. Rank by: (strategic_value + org_bus_factor_benefit + individual_interest_signal)
  
  OUTPUT:
    top_3_growth_areas: [{skill, current_level, target_level, rationale}]
    recommended_workflows: [workflow_types that develop this skill]
    estimated_time_to_next_level: {skill: weeks}
    stretch_assignment: specific workflow recommendation to accelerate growth
```

## Coaching Effectiveness Tracking

```
COACHING_EFFECTIVENESS:
  A coaching intervention is recorded when:
    - Agent receives targeted correction from evaluation-framework
    - Human receives feedback from gate failure
    - T3 manager conducts coaching session (logged manually)
  
  MEASUREMENT:
    pre_coaching_quality: avg quality score in 30d before coaching
    post_coaching_quality: avg quality score in 30d after coaching
    improvement = post_coaching_quality - pre_coaching_quality
    
  COACHING_OUTCOMES:
    EFFECTIVE:   improvement > 0.10 within 30d
    MARGINAL:    improvement 0.03–0.10
    INEFFECTIVE: improvement < 0.03 or regression
  
  AGGREGATE: coaching_effectiveness_rate = EFFECTIVE / total_coaching_interventions
  TARGET: > 0.65
  IF rate < 0.40: coaching approach review; T4 notification
```

## Team Growth Dashboard

```
TEAM GROWTH SUMMARY:
  avg_skill_velocity: N skills/quarter per person
  team_trajectory: HIGH_GROWTH | STEADY | PLATEAU | MIXED
  skills_gained_this_quarter: {skill: N_people}
  knowledge_concentration_reduction: N risks mitigated
  coaching_interventions: N (effectiveness_rate: N%)
  
GROWTH SPOTLIGHTS:
  Highest velocity individual: {name/agent_id} — {N} new evidences this quarter
  Biggest skill gap closed: {skill} — now N PRACTITIONER, was 1
  Top knowledge contributor: {name} — {N} wiki articles + {N} decision captures
```

## Persistence
`memory/people-intelligence/growth-records.yaml`
`memory/people-intelligence/growth-history.jsonl`
`memory/people-intelligence/coaching-interventions.yaml`
`memory/people-intelligence/growth-plans.yaml`
