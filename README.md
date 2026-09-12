# Physician Pay

Compare physician income by specialty and location across Canada and the United States. Explore published pay, estimate personal take-home after practice costs and taxes, then compare local living costs.

[Open Physician Pay](https://ashishsara.github.io/physician-pay/)

The site distinguishes Canadian gross clinical payments, U.S. medical-group compensation and broader state wages. It labels each source and year. National U.S. benchmarks remain national when the selected state changes.

Automatic estimates cover employee income and unincorporated practice income under the fixed 2025 tax model. Incorporated scenarios can use independently calculated personal take-home. Funds retained in a corporation are excluded from personal spending money.

## Source and development

Edit `Physician-Pay-Website/dist/`. The root `index.html` is the standalone GitHub Pages artifact. The nested `Physician-Pay-Website/index.html` and root ZIP contain the same release.

Run locally with `python3 -m http.server 8765`, then open `/Physician-Pay-Website/dist/` on that server. The website needs no dependencies or build process to run.

Run the four existing Node checks from `Physician-Pay-Website/`: `tests.cjs`, `tests-model.cjs`, `tests-benchmarks.cjs` and `tests-planner.cjs`.

Run `python3 package.py` from that directory to build the standalone HTML and ZIP in `release/`. Copy the generated HTML to both checked-in `index.html` artifacts and the generated ZIP to the repository root before publishing. The packager also checks script syntax.

See the source-directory README and `research/RESEARCH-NOTES.md` for data definitions, assumptions and calculation scope. The clarity update changes presentation and navigation; the income data and calculation engines retain their existing historical snapshot.
