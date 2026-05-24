# Experience Classification Workbook

Working document to classify every role before it flows into `resume.json` and the site UI.

**Live in JSON today:** `employmentType`, `showInAgencyPartners`, `aliases`, `agencyGridLabel`, and restructured `portfolio.agency`.

---

## Terminology & Aliases

Use these names interchangeably when writing bullets, captions, or recruiter-facing copy.

| Canonical | Also known as |
|-----------|---------------|
| **Quick Technologies Inc** | **QTI**, **SAGE**, Quick Technologies (SAGE) |
| **Tarrant Regional Water District** | **TRWD** |
| **Trinity River Vision Authority** | **TRVA**, **Panther Island** |
| TRWD / TRVA event properties | **Rockin' the River**, **Sunday Funday**, **Oktoberfest**, **SlideTheCity** |

---

## Classification Types

| Type | Code | Resume treatment |
|------|------|------------------|
| **Direct employment** | `job` | Primary **Experience** timeline; full bullets + gallery |
| **Direct contract** | `contract` | Experience timeline; may also appear under TRYRDESIGN or Agency band |
| **Agency subcontract** | `agency` | Experience entry = agency; end client in `agencyGrid` |
| **Consultancy / freelance** | `consultancy` | TRYRDESIGN umbrella row; clients nested via `agencyGrid` |
| **Agency employer job** | `agency-job` | Experience as employer (QTI / SAGE) |

### Special case: brief job + agency logo

When a **direct hire (`job`)** is too short to stand alone visually, keep it in **Experience** but also surface the logo in **Portfolio → Agency Experience → partners strip**.

**Confirmed:** Advantis Medical Staffing — `employmentType: job`, `showInAgencyPartners: true`.

---

## Site Layout (confirmed)

### Portfolio → Agency Experience

**Logo strip (`partners`)** — creative agencies + brief high-impact job:

| Logo | File |
|------|------|
| Runner | `agencies/runner-agency.webp` |
| Amplifi Commerce | `agencies/amplifi-commerce.webp` |
| Ascend Concepts | `agencies/ascend-concepts.webp` |
| Envision Interactive | `agencies/Envision-Interactive.webp` |
| Agency Creative | `agencies/agency-icon.webp` |
| Advantis Medical Staffing | `jobs/advantis/logo.avif` |

**Name grid (`grid`)** — contract clients also delivered via TRYRDESIGN:

- Pampillonia Jewelers
- Web Video 360

*Removed from agency band:* KCM, TRWD, TRYRDESIGN, Fossil, Lock&Lock, QTI/SAGE (these stay in Experience timeline only).

---

### TRYRDESIGN \| REDFEARN.CO → Experience entry

| Grid | Label | Brands |
|------|-------|--------|
| `brandGrid` | *(default: WPMU brand marks)* | TRYRDESIGN, Deep Well Consulting |
| `agencyGrid` | **Contract & Proprietary Web Development** | Pampillonia Jewelers, Web Video 360 |

Pampillonia and Web Video 360 **also** appear in Portfolio → Agency Experience name grid.

---

## Role Inventory (confirmed / in progress)

### 1. Kenneth Copeland Ministries — `job`

| | |
|---|---|
| **Dates** | Oct 2023 – Present |
| **Display** | Experience primary |
| **Agency band** | No |

---

### 2. Advantis Medical Staffing — `job` ✓

| | |
|---|---|
| **Dates** | Apr 2023 – Jun 2023 (~2 months) |
| **Classification** | **Direct employment (`job`)** — confirmed |
| **Display** | Experience primary (high impact despite brief tenure) |
| **Agency band** | **Yes** — logo in partners strip (`showInAgencyPartners: true`) |

**Notes:** Short assignment; logo duplication in Agency section is intentional.

---

### 3. Tarrant Regional Water District — `job`

| | |
|---|---|
| **Dates** | Apr 2014 – Nov 2022 |
| **Aliases** | TRWD, TRVA, Panther Island, Rockin' the River, Sunday Funday, Oktoberfest, SlideTheCity |
| **Display** | Experience primary |
| **Agency band** | No |
| **brandGrid** | TRWD, TRVA, Panther Island |

**Notes to elaborate:** Event marketing / SEO campaigns tied to municipal festivals listed above.

---

### 4. TRYRDESIGN \| REDFEARN.CO — `consultancy`

| | |
|---|---|
| **Dates** | Jun 2010 – Present |
| **Display** | Experience primary |
| **Agency band** | No (partner brands live under this row) |

#### Contract & Proprietary Web Development (`agencyGrid`)

| Client | Also in Agency grid? | Gallery? |
|--------|---------------------|----------|
| Pampillonia Jewelers | **Yes** | Own experience row + TRYRDESIGN grid |
| Web Video 360 | **Yes** | Agency grid only (gallery TBD) |

#### Proprietary / gallery clients (under TRYRDESIGN row)

| Client | Notes |
|--------|-------|
| TexasTitle.com | Gallery |
| MaverickNational.com | Gallery |
| Levarte Travel | Gallery |
| WheresGeorge.com | Gallery |

---

### 5. Fossil Inc. — `contract`

Experience row retained. Not in Agency band (WPMU brand tenants ≠ agency clients).

---

### 6. Amplifi Commerce — `agency`

Experience row. Logo in Agency **partners** strip. End client: Nintendo 3DS.

---

### 7. Lock&Lock Texas Inc. — `contract`

Experience row only.

---

### 8. Pampillonia Jewelers — `contract`

Experience row **and** TRYRDESIGN `agencyGrid` **and** Agency name grid.

---

### 9. Quick Technologies Inc (QTI / SAGE) — `agency-job`

| | |
|---|---|
| **Aliases** | QTI, SAGE |
| **Dates** | Mar 2006 – Sep 2009 |
| **Display** | Experience primary |
| **Agency band** | No |

---

## JSON Fields Reference

```json
{
  "employmentType": "job",
  "showInAgencyPartners": true,
  "aliases": ["TRWD", "TRVA", "Panther Island"],
  "agencyGridLabel": "Contract & Proprietary Web Development",
  "agencyGrid": [{ "name": "Pampillonia Jewelers" }],
  "brandGrid": [{ "name": "TRYRDESIGN" }]
}
```

| Field | Values |
|-------|--------|
| `employmentType` | `job` \| `contract` \| `agency` \| `agency-job` \| `consultancy` |
| `showInAgencyPartners` | Advantis only (so far) — adds logo to Agency partners strip |
| `aliases` | Internal/recruiter vocabulary; not rendered yet |
| `agencyGridLabel` | Custom aria-label for contract-client grid under an experience row |

---

## Still to Elaborate

- [ ] Advantis: why tenure ended at ~2 months (for interviews)
- [ ] TRWD: tie Rockin' the River / Sunday Funday / Oktoberfest / SlideTheCity to specific bullets or gallery
- [ ] Web Video 360: add gallery captures under TRYRDESIGN or standalone
- [ ] Wire `aliases` into render tooltips or glossary UI (optional)
- [ ] Regenerate `standalone.html` after next aesthetic pass
