# FactorViz

The interactive front end for the [Open Source Bond Asset
Pricing](https://openbondassetpricing.com) corporate bond factors. Published with GitHub
Pages and embedded on the site; this repository holds only the page and its data.

**Do not edit anything here by hand.** Everything is generated:

    python tools/make_factorviz.py --pages-dir <this repo>

from `osbap_data` in the private build repo, which is where `factorviz.html` lives.

## What is in here

| path | what |
|---|---|
| `index.html` | the page. Self-contained but for Chart.js, pinned from cdnjs |
| `data/meta.json` | controls, display names, product index |
| `data/stats_<dataset>_<sort>.json` | every series x 4 windows, precomputed |
| `data/series/*.csv` | the wide time series, fetched on demand |

The CSVs are **byte-for-byte the files inside the published release archives**, so what the
page plots is exactly what you can download from the site.

## Reading the numbers

Factors are published **without sign correction**, so a factor's sign is whatever the raw
sort gives and no column name carries a star. The page's "orient to positive mean" control
applies the shipped correction for display only, and is on by default. Older OSBAP files
applied it to the data, which made a factor's sign depend on where the sample ended.

Alpha is the intercept of the one-factor bond CAPM of Dickerson, Mueller and Robotti (2023),
with one benchmark per return type -- a duration-adjusted factor is never regressed on an
unadjusted market -- and is blank below 24 overlapping months. Every t-statistic uses
Newey-West standard errors with lags = floor(T^0.25).

Charts show the cumulative **sum** of monthly returns: a long-short factor is zero-cost, so
compounding it is not meaningful.

## Citation

Dickerson, A., Robotti, C., & Rossetti, G. (2026). *The Corporate Bond Factor Replication
Crisis.* Working Paper.
