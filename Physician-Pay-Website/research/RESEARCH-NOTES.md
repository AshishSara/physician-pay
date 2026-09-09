# Research additions and calculation audit

Reviewed 9 September 2026. Existing pay evidence and 2024 purchasing-power data are preserved. No new unsupported specialty/state salary medians have been imputed.

## Housing

[HUD FY2025 Schedule](https://www.huduser.gov/portal/datasets/fmr/fmr2025/FY2025_FMR_Schedule.pdf), 58 pages, contains studio, one-, two-, three- and four-bedroom rent amounts. The included `hud-lines.json` preserves the full text lines used for extraction. `build-housing.py` reads all 3,028 lines and parses metro areas and nonmetro county/town equivalents; territories are excluded, retaining all 50 states and DC. The result is **3,006 state/area records**, not 3,006 unique national markets: a cross-state market can appear once per state.

All rows of [HUD's April 28, 2025 revisions](https://www.federalregister.gov/documents/2025/03/28/2025-05345/fair-market-rents-for-the-housing-choice-voucher-program-moderate-rehabilitation-single-room) are applied. The source has 60 revised area rows, including Montana county revisions. The Boston area appears in Massachusetts and New Hampshire and is updated in both. The extraction checks uniqueness, five positive integer rent values, state coverage and every revised-area match. A separate five-number scan caught four entries lacking dotted leaders in the printed schedule, including Nashville; those are included. Three Maine reservation names remain truncated as printed, with their reported amounts intact.

FMRs estimate the 40th percentile of gross rents for standard-quality units; [major utilities are included](https://www.huduser.gov/portal/sites/default/files/pdf/fmr-overviewFY25.pdf), while phone/cable/internet are excluded. They are a historical program benchmark, not a current listing, physician-lifestyle rent or state median. FY2026/2027 publications exist; FY2025 is intentionally frozen for this historical tax/expense planning snapshot.

[CMHC's October 2025 survey / December 2025 report](https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/market-reports/rental-market-reports-major-centres) supplies 17 city references. Its Figure 1 gives two-bedroom purpose-built new-tenant means for Vancouver, Edmonton, Calgary, Toronto, Ottawa, Montréal and Halifax. Ten other references use the city's all-unit two-bedroom mean. These are labeled separately and selected explicitly. NB, PEI and Newfoundland/Labrador have no bundled city rent from this extraction; the interface asks for a quote. The rent references are optional inputs to a cash budget and do not redefine the existing PPP model.

## Eight state models

`layers-data.js` records each state source, rate/brackets, deduction, threshold and local-tax requirement. Full primary links are in the site's Sources and `build-layers.py`.

| State | 2025 single-filer ordinary earned-income treatment |
|---|---|
| Arizona | 2.5% after $15,750 standard deduction; no additional charitable deduction or credits |
| Illinois | 4.95%; $2,850 exemption lost in full above $250,000 federal AGI |
| North Carolina | 4.25% after $12,750 standard deduction |
| Virginia | 2%, 3%, 5%, 5.75%; $8,750 standard deduction plus $930 personal exemption |
| Louisiana | 3% after $12,500 deduction; old federal-tax deduction not carried forward |
| Michigan | 4.25% after $5,800 exemption; city income tax must be entered |
| Kentucky | 4% after $3,270 standard deduction; local occupational tax must be entered |
| Colorado | 4.4%; $15,750 deduction limited to $12,000 above $300,000 AGI; employee FAMLI 0.45% up to $176,100; local occupational tax must be entered |

Low-income credits, special adjustments, itemized deductions, business elections and cross-border tax rules are outside this model. Colorado does not assume an optional self-employed FAMLI contribution. Personal income-tax calculations do not silently replace local business taxes; every U.S. business case still requires applicable local/other tax input. All baseline calculations remain 2025, not current-year estimates.

## Debt, time and financial assets

[AAMC's Class of 2025 fact card](https://store.aamc.org/downloadable/download/sample/sample_id/652/) reports median combined premedical and medical education debt of $215,000 among indebted graduates and 70% reporting education debt. The interface offers the median as an optional example, never a default obligation for every physician. The modeled 6% loan rate is an analyst example, not the AAMC federal-loan rate.

Loans use fixed monthly amortization and explicitly entered extra payments. Government repayment/forgiveness plans and subsidies are not modeled. All inputs must be in the scenario's currency. Mortgage payments use monthly U.S. compounding and a Canadian semiannual-to-monthly convention. Actual mortgage renewals can change rates; loan approval and insurance eligibility are outside scope. Down payment and closing costs are separately funded; entered financial assets must be after the home purchase. Home equity and mortgage liability are both excluded from the financial-assets projection.

Work-hour assumptions are editable examples. Total work hours include clinical, charting, administrative and active-call work; commuting is separate. They change the hourly denominator without fabricating a new compensation estimate.

Monthly surplus equals physician net cash plus other household take-home, less living expenses and current debt payments. Other household net income does not alter the single-filer physician tax model. Projections hold nominal income and living costs fixed, apply a user-chosen annual net return monthly, add the selected share of positive surplus, and subtract negative surplus in full. Moving costs occur in month 1. Repaid debt releases its payment into surplus. No future inflation, salary, tax or investment performance is predicted.

[Bank of Canada 2025 average](https://www.bankofcanada.ca/rates/exchange/annual-average-exchange-rates/) is CAD1.3978 per USD. The separate savings view divides CAD by that editable rate; USD is unchanged. It holds the rate fixed for projections. It is not a live exchange quote. PPP is used for consumption comparisons, not wealth conversion.

## Verification

Reference tests cover the original tax/accounting/price model and the new state thresholds, local-tax blocking, FAMLI, loan amortization, zero interest, early payoff, mortgage compounding, household cash flow, debt-payment release, deficits, projections, income break-even solver and data coverage. Static JavaScript and local asset checks are part of packaging. Browser/visual/end-to-end testing was not performed in this update.
