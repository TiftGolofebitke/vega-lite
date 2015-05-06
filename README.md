# Vegalite  [![Build Status](https://travis-ci.org/uwdata/vegalite.svg)](https://travis-ci.org/uwdata/vegalite)

**Vegalite is work in progress and we are working on improving the code and documentation.**

Provides a higher-level grammar for visual analysis, comparable to ggplot or Tableau, that generates complete [Vega](https://vega.github.io/) specifications.

Vegalite specifications consist of simple mappings of variables in a data set to visual encoding channels such as position (`x`,`y`), `size`, `color` and `shape`. These mappings are then translated into full visualization specifications using the Vega visualization grammar. These resulting visualizations can then be exported or further modified to customize the display.

The complete schema for specifications as [JSON schema](http://json-schema.org/) is at [spec.json](https://uwdata.github.io/vegalite/spec.json). Use Vegalite in the [online editor](https://uwdata.github.io/vegalite/).

## Example specification

```json
{
  "marktype": "point",
  "enc": {
    "x": {"type": "Q","name": "yield","aggr": "avg"},
    "y": {
      "sort": [{"name": "yield","aggr": "avg","reverse": false}],
      "type": "O",
      "name": "variety"
    },
    "row": {"type": "O","name": "site"},
    "color": {"type": "O","name": "year"}
  },
  "cfg": {"dataUrl": "data/barley.json"}
}
```

## Setup Instructions

Make sure you have node.js. (We recommend using [homebrew](http://brew.sh) and simply run `brew install node`.)

Install gulp  globally by running

```sh
npm install -g gulp
```

Then install all the npm dependencies:

```bash
npm install
```

You can run `gulp` to compile vegalite or run `gulp serve` to open the live vegalite editor. 
