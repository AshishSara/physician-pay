# Publish this website free on GitHub Pages

The easiest upload is **one file**. The `index.html` at the top level of this ZIP contains all styles, data and JavaScript.

1. Extract the ZIP on your computer. Open `index.html` in Chrome, Safari, Edge or Firefox to use the website offline.
2. Open [AshishSara/physician-pay](https://github.com/AshishSara/physician-pay). Choose **Add file → Upload files**.
3. Upload the top-level **index.html** and commit to **main**. Keep your existing LICENSE and README if desired. The other files are source/research material; the website works with just this HTML.
4. Open **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, then **main** and **/(root)**. Save.
5. Wait for the Pages deployment to complete. GitHub shows the live URL in Pages settings.

Expected address after deployment: [ashishsara.github.io/physician-pay](https://ashishsara.github.io/physician-pay/). This package has not been published by the assistant; that address is the expected destination.

Do not upload the ZIP itself as the website. Upload the extracted HTML. A file-preview pane may disable JavaScript; download and open the HTML in a normal browser to use its controls.

GitHub Pages is available for public repositories with GitHub Free. This site makes no runtime API calls, needs no account or database, and requires no paid server. [GitHub's official setup instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Later updates

Replace the same top-level `index.html` and commit to `main`. Pages rebuilds from that branch. To edit source files, use `dist/`, then run `python package.py`; upload the newly generated `release/Physician-Pay.html` renamed to `index.html`.

Alternatively, upload all files inside `dist/` to the repository root together. Do not mix the multi-file `dist/index.html` with an incomplete set of its JavaScript dependencies. The standalone top-level HTML avoids that problem.
