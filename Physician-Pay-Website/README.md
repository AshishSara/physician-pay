# Physician Pay — version 4

A static, browser-only physician income and purchasing-power comparison for Canada and the United States. No backend, account, tracker, paid API or server subscription is required. The research snapshot was reviewed on 9 September 2026.

## Added in version 4

- Housing: 3,006 HUD FY2025 state/area records, with studio to four-bedroom rents and April 2025 revisions, across all 50 states and DC. Seventeen CMHC 2025 Canadian city references include seven new-tenant rent averages. Rent definitions and missing coverage are explicit. They are budget references, not salary data or live listings.
- Household budget: comparable modeled lifestyle, entered total budget, or itemized rent/ownership, food, transport, utilities, childcare and other spending. Ownership includes mortgage payments, property tax, home/mortgage insurance, maintenance and condo fees, plus a separately funded upfront down payment/closing-cost estimate.
- Loans: fixed-rate repayment, extra payments, debt-free date and interest costs; optional AAMC US$215,000 median debt example for indebted 2025 graduates.
- Time: take-home per working hour and per hour including commuting. User-entered time assumptions never silently scale salary.
- Financial projections: other household net income, moving costs, current financial assets, hypothetical net investment returns and investment share. Debt payments become available when repaid. Projections are nominal arithmetic with fixed income/spending; they exclude home equity and mortgage debt.
- Savings across currencies: a separately editable exchange rate, initialized to the Bank of Canada 2025 average of CAD1.3978/USD. Purchasing power is never used to inflate savings.
- Decision tools: lower-pay, higher-overhead and higher-living-cost scenarios; approximate break-even gross income; source and model quality audit.
- Eight additional state income-tax calculations: Arizona, Illinois, North Carolina, Virginia, Louisiana, Michigan, Kentucky and Colorado. Some still require local tax totals. Colorado employee FAMLI is included.
- Location explorer: every province or state for the chosen specialty; source labels, cash, modeled spending power, incomplete-input explanations, A/B loading and CSV export.
- Printing/PDF through the browser and version 4 JSON save/load, retaining earlier version 2/3 imports.

Published medians remain the default. Specialty and location stay at the top, and changes automatically update the benchmark. Unavailable medians clear the amount. National U.S. medians remain labeled national; no state-specific specialty pay is invented.

## Existing comparison features

- Every Canada–U.S., Canada–Canada and U.S.–U.S. pairing now has a common local purchasing-power result. The former cross-border dead end is removed.
- Known take-home inputs bypass the tax model, including in places without automatic tax coverage. Gross salary and practice-revenue scenarios remain available.
- Results separate actual cash, purchasing-power equivalents and cash remaining after a living budget.
- The comparison shows matching-income requirements, currency/local-price decomposition, adjustable local prices, an explicit sensitivity test and annual/monthly amounts.
- Expense presets distinguish employer-paid, included-in-overhead and separately self-paid professional costs. No double deduction of the same costs is intended.
- KFF health-plan contributions and CMPA regional fee references are available. Planning allowances are clearly distinguished from survey means or published fees. Malpractice is not falsely assumed constant across specialties/states.
- Comparisons can be exported and reloaded as local JSON files. A Montréal accent-matching omission in the original price dataset is fixed.

## Model and example

All annual income inputs are in the selected country's currency. I$ denotes the consumption purchasing power of US$1 at national-average U.S. prices, not cash received or a foreign-exchange rate.

- U.S. local currency per I$ = BEA 2024 regional price parity / 100.
- Canada local currency per I$ = World Bank 2024 private-consumption PPP (1.240903 CAD/I$) × local 2024 MBM basket / modeled Canadian reference basket (CAD57,698.5289705203).
- Purchasing power = spendable cash / local currency per I$.
- Matching take-home in B = A's purchasing power × B's local-currency cost per I$.

The Canadian reference is an analytical calibration: one named city basket per province, weighted by the province's July 2024 population. It is **not** an official national price index or a measured average provincial basket. The MBM modest-family basket differs from the consumption basket underlying PPP and BEA. The resulting local cross-border measure is a proxy, with material model and lifestyle uncertainty. Users can inspect all anchors, override prices/reference, stress-test costs, or compare equivalent personal budgets instead.

For the illustrative known-net case of CAD208,000 in Vancouver, BC and USD316,000 in Oklahoma:

| Measure | Vancouver, BC | Oklahoma |
|---|---:|---:|
| Local price factor before national PPP | 1.089144 | 0.878430 |
| Local currency needed per I$ | CAD1.351522 | USD0.878430 |
| Annual purchasing-power equivalent | I$153,901 | I$359,733 |

The central modeled ratio is 2.3374× in Oklahoma. About CAD486,187 annual take-home would match the Oklahoma scenario at the modeled Vancouver prices. These are calculations on **entered illustrative incomes**, not predicted specialty salaries. Default ±15% cost sensitivity is an analyst-chosen stress test, not a confidence interval.

## Expense defaults

Employee practice overhead is zero **as a deduction from salary**, because it belongs to the employer's business. This does not mean practices have no costs. The employer-paid malpractice/dues setting is explicitly a contract assumption.

KFF's 2025 general employer survey provides worker annual premiums of USD1,440 single / USD6,850 family, and full group premiums of USD9,325 / USD26,993. Full group premiums used for a self-employed scenario are a proxy, not an individual policy quote. Canada supplemental coverage, disability, out-of-pocket care, dues and U.S. self-paid malpractice inputs are labeled planning allowances, not purported measured averages. The CMPA reference uses its 2025 regional work-type fees, before entered reimbursements.

Canadian overhead defaults use historical 2017 CMA profiles where available, with an explicit age warning; dermatology's 35% is a broader medical-specialist figure. The U.S. 45% all-in overhead is a planning assumption. Overhead includes professional costs by default. If professional costs are separately itemized, the user must exclude them from the overhead percentage.

## Tax scope

Fixed **2025**, single, under 65, full-year resident, earned-income baseline. These are historical illustrations, not 2026 forecasts.

- Canada: automatic federal/provincial calculations for nine provinces; Quebec requires entered totals.
- U.S.: federal model; automatic state income tax for New York, Oklahoma, California, Arizona, Illinois, North Carolina, Virginia, Louisiana, Michigan, Kentucky and Colorado, plus nine no-wage-tax states. Michigan/Kentucky/Colorado require local tax totals; Alaska/Washington require payroll totals. Remaining states require state, local and contribution totals. All U.S. business cases require applicable local/business tax totals.
- Household credits, retirement deductions, itemization/SALT, corporations, QBI and cross-border tax treatment are outside the automatic model. Health costs are after-tax, even when real benefits might be pretax.
- Missing required tax inputs block the estimate. Known take-home works in all locations. Manual tax overrides remain fixed when income changes.

## Pay evidence

The embedded data preserve 190 Canadian province/specialty cells, 867 U.S. state/occupation cells and 12 national AMGA compensation medians. Missing, suppressed and top-coded data remain identified. CIHI payments are gross and include mixed workloads; BLS wages are not attending-only; AMGA medians represent national participating groups. Geographic specialty salary gaps are not filled using invented multipliers.

## Run, test, and publish

Open `dist/index.html` directly, or serve `dist/` with any static host. No build step or package installation is needed. The separate `Physician-Pay.html` delivery embeds all assets for offline use.

Run `node tests.cjs`, `node tests-model.cjs` , `node tests-benchmarks.cjs` and `node tests-planner.cjs` from the project root. These cover reference tax cases, accounting identities, all geographic price options, cross-border currency consistency, direct-net behavior, expense treatment, overrides, CMPA examples and invalid inputs. Added tests check eight new state models, tax thresholds, loan and mortgage payments, debt-payoff cash release, projections, break-even solving and housing coverage. Static JavaScript/asset checks also pass. Browser/visual QA was not performed in this session.

`research/anchors.json` includes the reproducible calibration inputs, published fee groups and their source links. `python research/build-model.py` recreates `dist/model-data.js`. The embedded `dist/data.js` is the complete frozen pay/tax/price snapshot; the original salary-data extraction pipeline is not required to run or publish the site.

See `PUBLISH.md` for one-file GitHub Pages upload instructions. The top-level `index.html` in the ZIP is standalone and ready to upload. This version is delivered for manual upload; no repository changes or deployment were attempted in this update.

## Rebuild the download

`python package.py` creates `release/Physician-Pay.html` and `release/Physician-Pay-Website.zip`. No runtime dependencies are required by the site. Node is needed only for the packager's syntax checks and calculation tests. Python uses its standard library.

`research/build-housing.py` reconstructs the HUD rent records from the included line transcription and applies all April 2025 revisions. `research/build-layers.py` builds the added data module. See `research/RESEARCH-NOTES.md` for exact source definitions and validation limits.
