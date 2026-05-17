# JSONL Segment Manager
**ID:** MEM-INT-002 | **Tier:** T3 | **Class:** ELEVATED
**Owner:** AI-Native Org | **Updated:** 2026-05-16

---

## Purpose

Manages the lifecycle of all append-only JSONL files in the Enterprise AI OS. Implements daily segment rotation, weekly compression and archival, cold storage migration, and query-optimized index maintenance. Prevents unbounded file growth while preserving full audit history.

---

## Managed JSONL Files

| File | Daily Volume (est.) | Retention | Priority |
|------|--------------------|-----------| ---------|
| execution-ledger.jsonl | ~5,000 events | 7 years | CRITICAL |
| audit-chain.jsonl | ~1,000 events | 10 years | CRITICAL |
| approval-records.jsonl | ~200 events | 7 years | CRITICAL |
| decisions.jsonl (strategic) | ~50 events | Permanent | CRITICAL |
| signal-log.jsonl | ~500 events | 1 year | HIGH |
| workflow-states.jsonl | ~2,000 events | 2 years | HIGH |
| agent-invocations.jsonl | ~10,000 events | 1 year | HIGH |
| hallucination-events.jsonl | ~20 events | 3 years | HIGH |
| improvement-audit-trail.jsonl | ~100 events | Permanent | HIGH |
| All others | varies | per policy | STANDARD |

---

## Segment Architecture

```
memory/execution-store/execution-ledger/
  execution-ledger-2026-05-16.jsonl      ← today's active segment
  execution-ledger-2026-05-15.jsonl.gz   ← yesterday (compressed)
  execution-ledger-2026-05-14.jsonl.gz
  ...
  execution-ledger-2026-04-16.jsonl.gz   ← 30 days ago
  
memory/execution-store/execution-ledger/archive/
  execution-ledger-2026-04.tar.gz        ← monthly archive (day 1 of following month)
  execution-ledger-2026-03.tar.gz
  ...

memory/execution-store/execution-ledger/cold/
  execution-ledger-2025.tar.gz.enc       ← annual cold archive (encrypted)
  execution-ledger-2024.tar.gz.enc
```

---

## Segment Lifecycle Schedule

```
Daily at 00:05 UTC:
  1. Close current segment (rename: {file}-{YYYY-MM-DD}.jsonl)
  2. Create new empty active segment
  3. Compress yesterday's closed segment (.gz, preserving SHA-256 in manifest)
  4. Update segment index (memory/memory-integrity/segment-index.yaml)

First day of each month at 03:00 UTC:
  1. Collect all daily segments from prior month
  2. Create monthly archive (.tar.gz of all daily .gz files)
  3. Verify archive integrity (extract and re-checksum 10% of records)
  4. Remove individual daily segments for prior month
  5. Update segment index

First Sunday of each year at 04:00 UTC:
  1. Encrypt prior year's monthly archives (AES-256)
  2. Move to cold storage directory
  3. Update cold storage manifest
  4. Remove monthly archives for prior year from hot storage
```

---

## Segment Index Schema

```yaml
segment_index:
  file_base: string                      # e.g., execution-ledger
  system: string                         # owning system
  
  hot_segments:                          # daily .jsonl.gz files (30 days)
    - date: YYYY-MM-DD
      path: string
      record_count: number
      sha256: string
      size_bytes: number
      
  archive_segments:                      # monthly .tar.gz files (1 year)
    - month: YYYY-MM
      path: string
      daily_count: number
      total_records: number
      sha256: string
      
  cold_segments:                         # annual .tar.gz.enc files (permanent)
    - year: YYYY
      path: string
      total_records: number
      sha256_before_encryption: string
      encrypted: true
      
  query_hints:
    last_record_at: ISO8601
    total_records_all_time: number
    oldest_searchable_without_cold_restore: ISO8601
```

---

## Query API

The segment manager provides efficient query over segmented history:

```
query(file_base, start_time, end_time, filter_fn) → [records]
  - Automatically routes to correct segment(s)
  - Decompresses only required segments
  - Applies filter_fn for early exit
  - Returns records in chronological order
  - Estimated latency: < 1s for hot; < 10s for archive; 10 min for cold restore

count(file_base, time_range) → number
  - Uses segment index for fast counting (no decompression needed)
  
latest(file_base, n) → [last n records]
  - Always reads from active segment (no decompression)
```

---

## Hash Chain Preservation

For cryptographically chained files (audit-chain.jsonl, approval-records.jsonl):
- Chain continuity is preserved across segment boundaries
- Each new segment starts with a chain-continuation record: `{"type":"SEGMENT_CONTINUATION","prev_segment_last_hash":"...","prev_segment":"..."}`
- Hash chain can be verified across the full lifetime by loading all segments in order

---

## Health Monitoring

```yaml
segment_health:
  active_segments: number                # files with active writes
  total_hot_storage_gb: number
  total_archive_storage_gb: number
  oldest_unarchived_day: YYYY-MM-DD
  compression_ratio_avg: number          # typically 8–15x for JSONL
  
  last_daily_rotation: ISO8601
  last_monthly_archive: ISO8601
  last_cold_migration: ISO8601
  
  integrity_failures_30d: number         # target: 0
```
