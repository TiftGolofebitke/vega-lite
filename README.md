# vega-data

This data lives at https://github.com/vega/vega-data

Common repository for example datasets used by vega related projects. Keep changes to this repository minimal as other projects (vega, vega-editor, vega-lite, polestar, voyager) use this data in their tests and for examples.

## How to use it

Use git subtree to add these datasets to a project. Add data git `subtree add` like:

```
git subtree add --prefix path-to-data git@github.com:vega/vega-data.git gh-pages
```

Update to the latest version of vega-data with

```
git subtree pull --prefix path-to-data git@github.com:vega/vega-data.git gh-pages
```

You can also get the data directly via HTTP served by Github like:

https://vega.github.io/vega-data/cars.json
