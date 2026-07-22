Vendored third-party libraries (bundled so visualizations work offline):

- d3.min.js    — D3 v7.9.0   (ISC License, https://d3js.org)
- anime.min.js — anime.js v3.2.2 (MIT License, https://animejs.com)

These are unmodified distribution builds. Regenerate with:
    npm install d3@7 animejs@3
    cp node_modules/d3/dist/d3.min.js shared/viz/vendor/
    cp node_modules/animejs/lib/anime.min.js shared/viz/vendor/
