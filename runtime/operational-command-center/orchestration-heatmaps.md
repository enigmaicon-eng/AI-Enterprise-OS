# Orchestration Heatmaps

**System ID:** `orchestration-heatmaps`
**Role:** Generates live visual heatmaps of orchestration state across the enterprise — agent load heatmaps, dependency hotspot maps, trust score distribution maps, routing pattern density maps, and inter-org collaboration load maps; refreshes every 5 minutes with configurable time-window aggregation
**Storage:** `memory/operational-command-center/heatmap-state.yaml`

---

## Purpose

Numbers tell you a metric is elevated. Heatmaps tell you where. An agent load heatmap shows instantly which org units are saturated and which are idle. A routing pattern heatmap reveals which intent→agent paths are overloaded. A collaboration load heatmap identifies which org pairs generate the most cross-boundary traffic. Orchestration heatmaps are the spatial representation of orchestration telemetry — turning metrics into a map that operators can read at a glance.

---

## Heatmap Types

### 1. Agent Load Heatmap

```
Rows: Agent orgs (17 orgs)
Cols: Time buckets (last 24h × 15-min intervals = 96 cols)
Cell value: avg_utilization_rate (0.0 – 1.0)
Color scale: 0.0="cool blue" → 0.50="green" → 0.75="yellow" → 0.90="orange" → 1.0="red"

Example:
                    [00:00] ... [08:00] ... [12:00] ... [16:00] ... [22:00]
product-org          ░░░░░░░░░   ████████    ██████████  █████████   ░░░░░░░
engineering-org      ░░░░░░░░░   ██████      ███████████ █████████   ░░░░░░░
governance-org       ░░░░░░░░░   ████        ███████     █████████   ░░░░░░░
qa-org               ░░░░░░░░░   ███         ████████    ██████      ░░░░░░░
```

### 2. Routing Pattern Density Heatmap

```
Rows: Intent categories (product, architecture, engineering, qa, ux, delivery, analytics...)
Cols: Target agent orgs
Cell value: routing_count in window (normalized by max)
Interpretation: Which intents are hitting which orgs most frequently

High-density cells indicate primary routing paths.
Low-density cells in expected positions indicate routing failures or misconfigurations.
```

### 3. Trust Score Distribution Heatmap

```
Rows: Workflow definition IDs
Cols: Trust score bands (0.0-0.2, 0.2-0.4, 0.4-0.6, 0.6-0.8, 0.8-1.0)
Cell value: percentage of runs in that band

Healthy pattern: Most runs in 0.8+ band
Warning pattern: Distribution shifting left (toward lower scores)
Critical pattern: Any mass in 0.0-0.2 band (disqualifier band)
```

### 4. Inter-Org Collaboration Load Heatmap

```
Rows: Source orgs
Cols: Target orgs
Cell value: handoff_count + cross-org_request_count in window

High-value off-diagonal cells = active inter-org collaboration paths.
Symmetric vs asymmetric patterns reveal collaboration directionality.
```

### 5. Governance Decision Latency Heatmap

```
Rows: Approval types (HUMAN_APPROVAL, PEER_REVIEW, GATE_VERDICT, POLICY_DECISION)
Cols: Authority level buckets (T1, T2, T3, T4, T5)
Cell value: median_approval_wait_ms

Identifies which authority levels are creating governance bottlenecks.
```

---

## Heatmap Data Schema

```yaml
HeatmapSnapshot:
  snapshot_id: string
  heatmap_type: string
  window_start: datetime
  window_end: datetime
  generated_at: datetime
  
  # Matrix data
  rows: [string]           # Row labels
  cols: [string]           # Column labels
  
  matrix:
    - row_label: string
      values: [float]      # One value per column; null = no data
  
  # Annotation overlays
  hotspots:
    - row: string
      col: string
      value: float
      annotation: string   # Human-readable interpretation
      severity: "INFO | WARNING | CRITICAL"
  
  # Color scale definition
  color_scale:
    low_color: string      # Hex color for minimum value
    mid_color: string      # Hex color for midpoint
    high_color: string     # Hex color for maximum value
    low_threshold: float
    high_threshold: float
    alert_threshold: float # Values above this are highlighted with border
```

---

## Heatmap Generation Engine

```
generate_agent_load_heatmap(window_hours=24, bucket_minutes=15) → HeatmapSnapshot:
  
  window_start = now() - timedelta(hours=window_hours)
  bucket_count = (window_hours × 60) // bucket_minutes
  
  # Time buckets
  buckets = [window_start + timedelta(minutes=i × bucket_minutes) for i in range(bucket_count)]
  
  # Load org utilization data
  utilization_events = consume_buffered_events(topic="org.capacity.signals", since=window_start)
  
  # Build matrix: org × time_bucket
  org_ids = get_all_org_ids()
  matrix = {}
  
  FOR org_id in org_ids:
    org_events = [e for e in utilization_events
                  if e.event_type == "AGENT_UTILIZATION_REPORT" and e.payload.get("org_id") == org_id]
    
    row_values = []
    FOR bucket_start in buckets:
      bucket_end = bucket_start + timedelta(minutes=bucket_minutes)
      bucket_events = [e for e in org_events if bucket_start <= e.published_at < bucket_end]
      
      IF bucket_events:
        avg_utilization = MEAN([e.payload.utilization_rate for e in bucket_events])
        row_values.append(round(avg_utilization, 3))
      ELSE:
        row_values.append(null)
    
    matrix[org_id] = row_values
  
  # Detect hotspots
  hotspots = []
  FOR org_id, values in matrix.items():
    FOR i, value in enumerate(values):
      IF value is not null AND value > 0.90:
        hotspots.append(Hotspot(
          row = org_id,
          col = buckets[i].strftime("%H:%M"),
          value = value,
          annotation = f"Utilization {value:.0%} — potential saturation",
          severity = "CRITICAL" if value > 0.95 else "WARNING"
        ))
  
  RETURN HeatmapSnapshot(
    heatmap_type = "AGENT_LOAD",
    window_start = window_start,
    window_end = now(),
    rows = org_ids,
    cols = [b.strftime("%H:%M") for b in buckets],
    matrix = [{"row_label": org_id, "values": matrix[org_id]} for org_id in org_ids],
    hotspots = hotspots,
    color_scale = {
      low_color: "#4FC3F7",   # Cool blue
      mid_color: "#66BB6A",   # Green
      high_color: "#F44336",  # Red
      low_threshold: 0.0,
      high_threshold: 1.0,
      alert_threshold: 0.90
    },
    generated_at = now()
  )

generate_trust_score_heatmap(window_hours=24) → HeatmapSnapshot:
  
  window_start = now() - timedelta(hours=window_hours)
  trust_events = consume_buffered_events(topic="runtime.trust.signals", since=window_start)
  confidence_events = [e for e in trust_events if e.event_type == "CONFIDENCE_SCORED"]
  
  bands = ["0.0-0.2", "0.2-0.4", "0.4-0.6", "0.6-0.8", "0.8-1.0"]
  band_ranges = [(0.0, 0.2), (0.2, 0.4), (0.4, 0.6), (0.6, 0.8), (0.8, 1.0)]
  
  definition_ids = list(set(e.payload.get("definition_id") for e in confidence_events if e.payload.get("definition_id")))
  
  matrix = {}
  FOR defn_id in definition_ids:
    defn_events = [e for e in confidence_events if e.payload.get("definition_id") == defn_id]
    scores = [e.payload.composite_score for e in defn_events]
    
    row_values = []
    FOR (low, high) in band_ranges:
      count = len([s for s in scores if low <= s < high])
      percentage = count / max(len(scores), 1)
      row_values.append(round(percentage, 3))
    
    matrix[defn_id] = row_values
  
  hotspots = []
  FOR defn_id, values in matrix.items():
    IF values[0] > 0.05:   # > 5% in 0.0-0.2 disqualifier band
      hotspots.append(Hotspot(
        row = defn_id, col = "0.0-0.2",
        value = values[0],
        annotation = f"{values[0]:.0%} of runs triggering disqualifiers — investigate confidence degradation",
        severity = "CRITICAL"
      ))
  
  RETURN HeatmapSnapshot(
    heatmap_type = "TRUST_SCORE_DISTRIBUTION",
    rows = definition_ids,
    cols = bands,
    matrix = [{"row_label": defn_id, "values": matrix[defn_id]} for defn_id in definition_ids],
    hotspots = hotspots,
    generated_at = now()
  )
```

---

## Integration

**Called by:**
- `operational-command-center/enterprise-operations-console.md` — heatmap panel
- Human operators — standalone heatmap inspection

**Calls:**
- `enterprise-telemetry/enterprise-event-bus.md` — consumes telemetry events
- `enterprise-telemetry/orchestration-telemetry.md` — orchestration metric data

**Writes to:** `memory/operational-command-center/heatmap-state.yaml`
