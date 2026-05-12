# StructApp — Product Requirements Document (v1)

**Version:** 1.0  
**Date:** May 11, 2026  
**Status:** Draft — Approved for Implementation Planning

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Goals & Success Criteria](#2-goals--success-criteria)
3. [Users & Roles](#3-users--roles)
4. [Functional Requirements](#4-functional-requirements)
5. [Data Model](#5-data-model)
6. [System Architecture](#6-system-architecture)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Out of Scope for v1](#8-out-of-scope-for-v1)

---

## 1. Product Overview

StructApp is a vendor-hosted SaaS platform for enterprise asset-owning organizations to manage their structural integrity inspection program end-to-end. Target customers are organizations that own and operate portfolios of buildings, sites, and facilities — such as large industrial operators, mining companies, and commercial real estate operators.

The platform supports the full inspection lifecycle: registering assets, planning and scheduling inspections, executing field inspections offline, capturing evidence, reviewing and approving assessments, tracking defects and remediation actions, and reporting portfolio health.

The product is not customer-specific and must serve multiple independent tenants within a shared SaaS infrastructure.

---

## 2. Goals & Success Criteria

### Primary Goal

An asset-owning organization can manage its structural inspection program end-to-end in one system — including manual asset registration, inspection planning, offline field execution, assessment approval, findings and remediation tracking, and portfolio reporting — without relying on any external system.

### What v1 Is Not

v1 is not a continuous monitoring platform, a maintenance management system, an IoT analytics tool, or an EAM/ERP integration hub. It is a structural inspection program management product.

---

## 3. Users & Roles

### Tenancy Model

Each asset-owning organization operates in an isolated tenant. External consultants are granted scoped access into a specific tenant at the inspection or site level by a Tenant Admin. They cannot browse the full asset portfolio or any tenant data outside their explicit assignments.

### Role Definitions

| Role | Description |
|---|---|
| **Platform Admin** | Vendor-managed super-admin. Manages tenant provisioning, global inspection templates, rating schemes, and compliance framework mappings. |
| **Admin** | Per-tenant. Manages users, assets, sites, access grants, and scheduling. Cannot modify global templates or framework configurations. |
| **Approver** | Per-tenant. Reviews submitted inspections, issues the final approval decision, accepts risk, and owns remediation tracking. Default approver is always an internal asset-owner-side user. |
| **Inspector** | Per-tenant or external. Executes inspections, captures evidence, records findings, and submits completed assessments. External consultants are granted the Inspector role scoped to specific inspections or sites. |

### Collaboration Boundary

Internal users own the asset portfolio, inspection scheduling, final risk acceptance, and remediation. External consultants may perform inspections, upload evidence, and submit technical assessments. Final approval authority always rests with an internal Approver.

---

## 4. Functional Requirements

### 4.1 Asset Register

- Admins manually create and manage assets.
- Assets follow a flexible hierarchy: **Portfolio → Site/Facility → Building/Structure → Inspection Area/Component**.
- Only the levels needed for a specific asset must be populated; the full hierarchy is not mandatory.
- Each asset record holds: name, type, location (GPS coordinates), description, owner, and custom metadata fields.
- Assets can be marked active or inactive.

### 4.2 Inspection Planning & Scheduling

- Admins define inspection plans per asset or asset type, including recurrence interval (e.g., annually, every 2 years).
- The system auto-generates the next inspection event when the current one is closed.
- Manual override of scheduled dates is permitted by an Admin.
- Inspections can be assigned to an internal Inspector or an external consultant.

### 4.3 Inspection Execution (Field)

- Inspectors work from an assigned inspection record that includes the applicable template, checklist, and evidence requirements.
- The full inspection lifecycle is: **Planned → Assigned → In Progress → Submitted → Approved → Closed**.
- Field execution must work fully offline. All changes made offline are synchronized when connectivity returns, with conflict resolution logging.
- During execution the inspector can:
  - Complete checklist items.
  - Record condition and risk ratings per inspection area/component.
  - Add findings/defect records.
  - Attach photos, annotated notes, and files.
  - Capture GPS coordinates for the asset and individual findings.
  - Link to sensor readings or external documents (optional).
  - Add narrative justification text.

### 4.4 Inspection Templates

- Templates are defined and managed by the Platform Admin.
- Each template specifies: applicable asset types, checklist items, required evidence types, rating fields, and compliance framework mappings.
- Tenant users select and consume templates; they cannot modify them.

### 4.5 Assessment & Rating

- Condition is rated on a **5-level scale**: 1 = Very Good, 2 = Good, 3 = Fair, 4 = Poor, 5 = Critical/Failure.
- Risk is rated on a **4-level scale**: Low, Medium, High, Critical.
- Both ratings are applied at the inspection area/component level.
- The system automatically rolls up ratings to the building/structure and asset level using the worst-case child value.
- Each assessment includes controlled structured fields plus narrative expert justification sections.

### 4.6 Findings & Defects

- Findings are first-class records, not just text inside a report.
- Each finding record holds: title, description, severity, location (GPS), linked inspection, linked asset/component, photos, status, assigned owner, due date, and closure evidence.
- Finding statuses: **Open → In Progress → Pending Verification → Closed**.
- Findings persist across inspections and can be re-evaluated in future inspection cycles.

### 4.7 Approval Workflow

- A submitted inspection is assigned to a single internal Approver.
- The Approver reviews the assessment, evidence, and findings, then either approves or returns the inspection for revision.
- Upon approval the inspection moves to Closed and the next scheduled inspection event is auto-generated.
- Only internal users with the Approver role can issue final approval.

### 4.8 Remediation Tracking

- Remediation actions are created from findings at approval or any time post-approval.
- Each action holds: description, linked finding, assigned owner, due date, status, and closure evidence.
- Action statuses: **Open → In Progress → Pending Verification → Closed**.
- Closure requires verification evidence upload and explicit closure approval by an Approver.
- No detailed maintenance execution workflow (work orders, labor, parts) is in scope.

### 4.9 Notifications & Escalations

The system sends role-based email notifications for:

| Event | Recipient |
|---|---|
| Inspection due within threshold | Assigned Inspector, Admin |
| Inspection overdue | Assigned Inspector, Admin, Approver |
| Inspection submitted for approval | Assigned Approver |
| Inspection returned for revision | Inspector |
| Inspection approved | Inspector, Admin |
| High or Critical finding raised | Approver, Admin |
| Remediation action due within threshold | Action owner, Admin |
| Remediation action overdue | Action owner, Approver, Admin |

Notification thresholds (e.g., "7 days before due") are configurable by the Admin.

### 4.10 Reporting & Dashboards

**Portfolio Dashboard** (Approver, Admin):
- Asset health heatmap by condition and risk rating.
- Inspection program status: on-track, due soon, overdue counts.
- Open findings by severity and status.
- Open remediation actions by due date and owner.

**Formal Inspection Reports** (all roles):
- Generated per approved inspection.
- Includes: asset details, inspection summary, component-level ratings, findings list with photos, compliance status, approver signature and timestamp.
- Exported as **PDF** only (no editable formats).

**Portfolio Data Export**:
- Asset register, inspection history, findings log, and remediation actions exportable as **CSV/Excel**.

### 4.11 Compliance Framework

- The Platform Admin maps compliance rules and inspection template items to configurable compliance framework references.
- Formal inspection reports can display compliance status per framework.
- No single standard is hard-coded; multiple frameworks can be configured.

### 4.12 AI-Assisted Features (Optional)

- Draft narrative summaries for inspection reports.
- Defect description text suggestions during field capture.
- Report-writing assistance.
- AI features are assistive only. The system must never present AI output as a structural engineering decision or risk rating. All final assessments are authored and owned by the human inspector or approver.

---

## 5. Data Model

### 5.1 Entity Overview

```
Organisation (Tenant)
├── Users
├── Sites
│   └── Buildings / Structures
│       └── Inspection Areas / Components
├── Inspection Plans
│   └── Inspection Events
│       ├── Checklist Responses
│       ├── Evidence Items
│       └── Findings
│           └── Remediation Actions
└── Audit Log
```

### 5.2 Core Entities

#### Organisation
| Field | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| name | string | Tenant display name |
| status | enum | active, suspended |
| created_at | timestamp | |
| updated_at | timestamp | |

#### User
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| organisation_id | UUID | FK to Organisation |
| name | string | |
| email | string | Unique per organisation |
| password_hash | string | Bcrypt hashed |
| role | enum | admin, approver, inspector |
| is_external | boolean | True for external consultants |
| status | enum | active, invited, suspended |
| created_at | timestamp | |
| updated_at | timestamp | |

#### Asset (Site / Building / Component)
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| organisation_id | UUID | FK to Organisation |
| parent_id | UUID | FK to Asset (nullable, self-referencing) |
| level | enum | portfolio, site, building, component |
| name | string | |
| asset_type | string | Configurable by Platform Admin |
| description | text | |
| latitude | decimal | |
| longitude | decimal | |
| owner_user_id | UUID | FK to User |
| status | enum | active, inactive |
| created_at | timestamp | |
| updated_at | timestamp | |

#### InspectionPlan
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| organisation_id | UUID | |
| asset_id | UUID | FK to Asset |
| template_id | UUID | FK to InspectionTemplate |
| recurrence_interval_days | integer | e.g., 365 for annual |
| next_due_date | date | Auto-calculated |
| assigned_inspector_id | UUID | FK to User (nullable) |
| assigned_approver_id | UUID | FK to User (nullable) |
| status | enum | active, paused |
| created_at | timestamp | |
| updated_at | timestamp | |

#### InspectionEvent
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| organisation_id | UUID | |
| plan_id | UUID | FK to InspectionPlan |
| asset_id | UUID | FK to Asset |
| template_id | UUID | FK to InspectionTemplate |
| inspector_id | UUID | FK to User |
| approver_id | UUID | FK to User (nullable) |
| status | enum | planned, assigned, in_progress, submitted, approved, closed |
| scheduled_date | date | |
| started_at | timestamp | |
| submitted_at | timestamp | |
| approved_at | timestamp | |
| closed_at | timestamp | |
| overall_condition_rating | integer | 1–5, rolled up |
| overall_risk_rating | enum | low, medium, high, critical |
| compliance_status | enum | compliant, non_compliant, conditional |
| narrative_summary | text | |
| created_at | timestamp | |
| updated_at | timestamp | |

#### InspectionArea (Component-level rating within an event)
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| inspection_event_id | UUID | FK to InspectionEvent |
| asset_id | UUID | FK to Asset (the component) |
| condition_rating | integer | 1–5 |
| risk_rating | enum | low, medium, high, critical |
| narrative | text | |
| created_at | timestamp | |
| updated_at | timestamp | |

#### ChecklistResponse
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| inspection_event_id | UUID | |
| checklist_item_id | UUID | FK to template checklist item |
| response | enum | pass, fail, na, observation |
| notes | text | |
| created_at | timestamp | |
| updated_at | timestamp | |

#### EvidenceItem
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| organisation_id | UUID | |
| inspection_event_id | UUID | FK to InspectionEvent (nullable) |
| finding_id | UUID | FK to Finding (nullable) |
| type | enum | photo, annotation, file, sensor_link, document_link |
| storage_url | string | Object storage reference |
| caption | text | |
| latitude | decimal | |
| longitude | decimal | |
| captured_at | timestamp | Device-recorded time |
| uploaded_by | UUID | FK to User |
| created_at | timestamp | |

#### Finding
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| organisation_id | UUID | |
| inspection_event_id | UUID | FK to InspectionEvent |
| asset_id | UUID | FK to Asset |
| title | string | |
| description | text | |
| severity | enum | low, medium, high, critical |
| latitude | decimal | |
| longitude | decimal | |
| status | enum | open, in_progress, pending_verification, closed |
| assigned_owner_id | UUID | FK to User |
| due_date | date | |
| closed_at | timestamp | |
| created_by | UUID | FK to User |
| created_at | timestamp | |
| updated_at | timestamp | |

#### RemediationAction
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| organisation_id | UUID | |
| finding_id | UUID | FK to Finding |
| description | text | |
| assigned_owner_id | UUID | FK to User |
| due_date | date | |
| status | enum | open, in_progress, pending_verification, closed |
| verification_notes | text | |
| closed_at | timestamp | |
| closed_by | UUID | FK to User |
| created_at | timestamp | |
| updated_at | timestamp | |

#### AuditLog
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| organisation_id | UUID | |
| actor_user_id | UUID | FK to User |
| entity_type | string | e.g., InspectionEvent, Finding |
| entity_id | UUID | |
| action | string | e.g., status_changed, evidence_uploaded |
| before_state | jsonb | Snapshot before change |
| after_state | jsonb | Snapshot after change |
| occurred_at | timestamp | Immutable |

#### InspectionTemplate (Platform Admin managed)
| Field | Type | Notes |
|---|---|---|
| id | UUID | |
| name | string | |
| asset_type | string | |
| version | integer | |
| checklist_items | jsonb | Array of checklist item definitions |
| evidence_requirements | jsonb | Required evidence types |
| compliance_mappings | jsonb | Maps items to framework references |
| status | enum | draft, published, deprecated |
| created_at | timestamp | |
| updated_at | timestamp | |

### 5.3 Key Relationships

```
Organisation         1 ─── * User
Organisation         1 ─── * Asset (self-referencing tree)
Organisation         1 ─── * InspectionPlan
InspectionPlan       1 ─── * InspectionEvent
InspectionEvent      1 ─── * InspectionArea
InspectionEvent      1 ─── * ChecklistResponse
InspectionEvent      1 ─── * EvidenceItem
InspectionEvent      1 ─── * Finding
Finding              1 ─── * RemediationAction
Finding              1 ─── * EvidenceItem
Organisation         1 ─── * AuditLog
InspectionTemplate   1 ─── * InspectionPlan
```

### 5.4 Rating Rollup Logic

1. Each `InspectionArea` record holds a `condition_rating` (1–5) and `risk_rating`.
2. When an `InspectionEvent` is submitted, the system derives `overall_condition_rating` and `overall_risk_rating` as the **worst-case value** across all child `InspectionArea` records.
3. Asset-level health displayed in the portfolio dashboard reflects the most recently approved `InspectionEvent` for that asset.

---

## 6. System Architecture

### 6.1 Architecture Style

Multi-tenant SaaS. A **monolithic backend with modular internal boundaries** is recommended for v1 — it avoids distributed-systems complexity while enabling clean separation that can be extracted into services later. The front-end and back-end are independently deployed.

### 6.2 High-Level Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│                                                                  │
│  ┌─────────────────────────┐   ┌──────────────────────────────┐  │
│  │  Web Application (SPA)  │   │  Mobile PWA (Field / Offline) │  │
│  │  React / TypeScript     │   │  React / TypeScript           │  │
│  │  Dashboard, Admin,      │   │  Inspection execution,        │  │
│  │  Reporting, Approvals   │   │  Evidence capture, Offline    │  │
│  └───────────┬─────────────┘   └───────────────┬──────────────┘  │
└──────────────┼──────────────────────────────────┼────────────────┘
               │ HTTPS / REST + JWT                │
               │                                   │
┌──────────────▼───────────────────────────────────▼────────────────┐
│                         API Gateway / BFF                         │
│           Rate limiting · Auth token validation · Routing         │
└──────────────────────────────┬────────────────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────────┐
│                     Application Server                            │
│                  (Modular Monolith — Node.js / TypeScript)        │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐    │
│  │  Auth       │  │  Asset       │  │  Inspection           │    │
│  │  Module     │  │  Module      │  │  Module               │    │
│  └─────────────┘  └──────────────┘  └───────────────────────┘    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐    │
│  │  Findings & │  │  Reporting   │  │  Notification         │    │
│  │  Remediation│  │  Module      │  │  Module               │    │
│  └─────────────┘  └──────────────┘  └───────────────────────┘    │
│  ┌─────────────┐  ┌──────────────┐                               │
│  │  Audit      │  │  Template    │                               │
│  │  Module     │  │  Module      │                               │
│  └─────────────┘  └──────────────┘                               │
└──────────────────────────────┬────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
┌─────────▼──────┐  ┌──────────▼──────┐  ┌─────────▼──────┐
│  PostgreSQL     │  │  Object Storage │  │  Email Service  │
│  (Primary DB)   │  │  (Evidence      │  │  (SMTP / SES)   │
│  Multi-tenant   │  │   Files, PDFs)  │  │  Notifications  │
│  row-level      │  │                 │  │                 │
│  isolation      │  │                 │  │                 │
└────────────────┘  └─────────────────┘  └─────────────────┘
```

### 6.3 Front-End

| Concern | Decision |
|---|---|
| Framework | React with TypeScript |
| Deployment | Single unified codebase; layout and feature availability adapt to screen size and role |
| Mobile field experience | Progressive Web App (PWA); installable on Android and iOS |
| Offline capability | Service worker with IndexedDB local store; sync on reconnect with server-side conflict logging |
| State management | Server-state via React Query; client state via React Context |
| Offline conflict strategy | Last-write-wins with conflict flagged for Approver review if inspection state changed server-side during offline period |

### 6.4 Back-End

| Concern | Decision |
|---|---|
| Runtime | Node.js with TypeScript |
| Architecture | Modular monolith; domain modules are internal boundaries, not separate services |
| API style | REST; JSON over HTTPS |
| Authentication | JWT bearer tokens; native email/password with bcrypt hashing; invitation flow for new users |
| Authorization | Role + tenant checks on every request; row-level tenant filter applied globally via middleware |
| File handling | Evidence files uploaded directly to object storage via pre-signed URLs; metadata stored in DB |
| PDF generation | Server-side PDF rendering from approved inspection data |
| Background jobs | Async job queue for: notification dispatch, PDF generation, offline sync resolution, scheduled inspection event auto-generation |

### 6.5 Database

| Concern | Decision |
|---|---|
| Engine | PostgreSQL |
| Multi-tenancy | `organisation_id` foreign key on every tenant-scoped table; application-layer enforcement + database-level row filtering |
| Audit table | Append-only `AuditLog` table; no deletes or updates permitted via application code |
| Migrations | Versioned schema migrations (e.g., via Flyway or similar) |
| Sensitive fields | Passwords hashed at application layer before persistence; no plaintext credentials stored |

### 6.6 Object Storage

- All evidence files (photos, attachments, generated PDFs) are stored in an object storage service (e.g., AWS S3 or equivalent).
- Files are not publicly accessible; access is through time-limited pre-signed URLs generated by the application server.
- Each file is keyed under its `organisation_id` to enforce tenant isolation at the storage level.

### 6.7 Offline Sync Architecture

```
Mobile PWA (offline)
    │
    │  1. User completes inspection offline
    │     – Writes to IndexedDB local store
    │
    │  2. Connectivity restored
    │     – PWA detects online status
    │     – Sync agent queues local mutations
    │
    ▼
Sync API endpoint
    │
    │  3. Server validates each mutation:
    │     – Checks tenant/role authorization
    │     – Detects conflicts (server record changed while offline)
    │     – Applies non-conflicting mutations
    │     – Flags conflicts in AuditLog for Approver review
    │
    ▼
PostgreSQL + AuditLog
```

### 6.8 Security Considerations

| Control | Implementation |
|---|---|
| Transport | TLS 1.2+ enforced on all endpoints |
| Authentication | JWT with short expiry (15 min) + refresh token rotation |
| Password storage | Bcrypt with appropriate cost factor |
| Tenant isolation | `organisation_id` validated on every API call; no cross-tenant data access |
| File access | Pre-signed URLs with short TTL; no direct public access to object storage |
| Input validation | All inputs validated and sanitised at API boundary |
| Audit immutability | `AuditLog` rows are insert-only; no application update or delete path exists |
| Rate limiting | Applied at API Gateway for authentication endpoints and upload endpoints |
| Dependency security | Automated dependency vulnerability scanning in CI pipeline |

### 6.9 Deployment Architecture

```
                          CDN (static assets)
                               │
                    ┌──────────▼──────────┐
                    │   Load Balancer      │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
      ┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
      │  App Server │  │  App Server  │  │  App Server  │
      │  Instance   │  │  Instance    │  │  Instance    │
      └──────┬──────┘  └───────┬──────┘  └───────┬──────┘
             └─────────────────┼─────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
      ┌───────▼──────┐  ┌──────▼──────┐  ┌──────▼───────┐
      │  PostgreSQL  │  │  Job Queue  │  │  Object      │
      │  Primary     │  │  (Redis)    │  │  Storage     │
      │  + Replica   │  │             │  │              │
      └──────────────┘  └─────────────┘  └──────────────┘
```

- All infrastructure is hosted by the vendor (SaaS-first).
- Architecture is kept environment-agnostic to support future private-hosted deployments.
- Application configuration via environment variables; no secrets in source code.

---

## 7. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Availability | 99.5% monthly uptime |
| API response time | p95 < 500 ms for standard reads/writes |
| Offline sync | Full sync completes within 60 seconds on a standard mobile connection after reconnect |
| File upload | Evidence files up to 50 MB per item |
| Scale | Multiple tenants; up to thousands of assets and tens of thousands of inspections per tenant |
| Audit retention | Audit log retained for minimum 7 years |
| Data isolation | Zero cross-tenant data leakage; validated at both application and storage layers |
| Browser support | Last two major versions of Chrome, Firefox, Safari, Edge |
| Mobile support | iOS 16+, Android 12+ via PWA |

---

## 8. Out of Scope for v1

The following are explicitly deferred to future releases:

- Continuous IoT sensor monitoring as a primary operating mode
- External system integrations: EAM, ERP, GIS, CMMS, maintenance management systems
- Enterprise SSO / federated identity
- Floor plan, building model, or map-based visualization of assets and findings
- Full maintenance execution workflows: work orders, labor tracking, parts, contractor management
- Multi-step / multi-approver approval chains
- Tenant-level self-service configuration of inspection templates, rating schemes, or compliance frameworks
- Editable (Word) report exports
- Native iOS or Android applications (PWA covers v1 mobile needs)
- Public API / webhook integrations for third-party consumers
