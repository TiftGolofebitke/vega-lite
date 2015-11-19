/// <reference path="../../typings/colorbrewer.d.ts"/>
/// <reference path="../../typings/d3-color.d.ts"/>

// https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md#11-ambient-declarations
declare var exports;

import * as colorbrewer from 'colorbrewer';
import {interpolateHsl} from 'd3-color';

import * as util from '../util';
import Encoding from '../Encoding';
import {COL, ROW, X, Y, SHAPE, SIZE, COLOR, TEXT} from '../channel';
import {SOURCE, STACKED} from '../data';
import * as time from './time';
import {NOMINAL, ORDINAL, QUANTITATIVE, TEMPORAL} from '../type';

export function names(props) {
  return util.keys(util.keys(props).reduce(function(a, x) {
    if (props[x] && props[x].scale) a[props[x].scale] = 1;
    return a;
  }, {}));
}

export function defs(names: Array<string>, encoding: Encoding, layout, stats, facet?) {
  return names.reduce(function(a, name) {
    var scaleDef: any = {};

    scaleDef.name = name;
    var t = scaleDef.type = type(name, encoding);
    scaleDef.domain = domain(encoding, name, t, facet);

    // Add optional properties
    [
      // general properties
      'range', 'reverse', 'round',
      // quantitative / time
      'clamp', 'nice',
      // quantitative
      'exponent', 'zero',
      // ordinal
      'bandWidth', 'outerPadding', 'padding', 'points'
    ].forEach(function(property) {
      var value = exports[property](encoding, name, t, layout, stats);
      if (value !== undefined) {
        scaleDef[property] = value;
      }
    });

    return (a.push(scaleDef), a);
  }, []);
}

export function type(name: string, encoding: Encoding) {
  var type = encoding.fieldDef(name).type;
  switch (type) {
    case NOMINAL: //fall through
    case ORDINAL:
      return 'ordinal';
    case TEMPORAL:
      var timeUnit = encoding.fieldDef(name).timeUnit;
      return timeUnit ? time.scale.type(timeUnit, name) : 'time';
    case QUANTITATIVE:
      if (encoding.bin(name)) {
        return name === ROW || name === COL || name === SHAPE ? 'ordinal' : 'linear';
      }
      return encoding.scale(name).type;
  }
}

export function domain(encoding: Encoding, name, type, facet:boolean = false) {
  var fieldDef = encoding.fieldDef(name);

  if (fieldDef.scale.domain) { // explicit value
    return fieldDef.scale.domain;
  }

  // special case for temporal scale
  if (fieldDef.type === TEMPORAL) {
    var range = time.scale.domain(fieldDef.timeUnit, name);
    if (range) return range;
  }

  // For stack, use STACKED data.
  var stack = encoding.stack();
  if (stack && name === stack.value) {
    return {
      data: STACKED,
      field: encoding.fieldRef(name, {
        // If faceted, scale is determined by the max of sum in each facet.
        prefn: (facet ? 'max_' : '') + 'sum_'
      })
    };
  }

  var useRawDomain = _useRawDomain(encoding, name);
  var sort = domainSort(encoding, name, type);

  if (useRawDomain) { // useRawDomain - only Q/T
    return {
      data: SOURCE,
      field: encoding.fieldRef(name, {noAggregate:true})
    };
  } else if (fieldDef.bin) { // bin

    return {
      data: encoding.dataTable(),
      field: type === 'ordinal' ?
        // ordinal scale only use bin start for now
        encoding.fieldRef(name, { bin_suffix: '_start' }) :
        // need to merge both bin_start and bin_end for non-ordinal scale
        [
          encoding.fieldRef(name, { bin_suffix: '_start' }),
          encoding.fieldRef(name, { bin_suffix: '_end' })
        ]
    };
  } else if (sort) { // have sort -- only for ordinal
    return {
      // If sort by aggregation of a specified sort field, we need to use SOURCE table,
      // so we can aggregate values for the scale independently from the main aggregation.
      data: sort.op ? SOURCE : encoding.dataTable(),
      field: encoding.fieldRef(name),
      sort: sort
    };
  } else {
    return {
      data: encoding.dataTable(),
      field: encoding.fieldRef(name)
    };
  }
}

export function domainSort(encoding: Encoding, name, type):any {
  var sort = encoding.fieldDef(name).sort;
  if (sort === 'ascending' || sort === 'descending') {
    return true;
  }

  // Sorted based on an aggregate calculation over a specified sort field (only for ordinal scale)
  if (type === 'ordinal' && util.isObject(sort)) {
    return {
      op: sort.op,
      field: sort.field
    };
  }
  return undefined;
}

export function reverse(encoding: Encoding, name) {
  var sort = encoding.fieldDef(name).sort;
  return sort && (sort === 'descending' || (sort.order === 'descending')) ? true : undefined;
}

var sharedDomainAggregate = ['mean', 'average', 'stdev', 'stdevp', 'median', 'q1', 'q3', 'min', 'max'];

/**
 * Determine if useRawDomain should be activated for this scale.
 * @return {Boolean} Returns true if all of the following conditons applies:
 * 1. `useRawDomain` is enabled either through scale or config
 * 2. Aggregation function is not `count` or `sum`
 * 3. The scale is quantitative or time scale.
 */
export function _useRawDomain (encoding: Encoding, name) {
  var fieldDef = encoding.fieldDef(name);

  // scale value
  var scaleUseRawDomain = encoding.scale(name).useRawDomain;

  // Determine if useRawDomain is enabled. If scale value is specified, use scale value.
  // Otherwise, use config value.
  var useRawDomainEnabled = scaleUseRawDomain !== undefined ?
      scaleUseRawDomain : encoding.config('useRawDomain');

  return  useRawDomainEnabled &&
    // only applied to aggregate table
    fieldDef.aggregate &&
    // only activated if used with aggregate functions that produces values ranging in the domain of the source data
    sharedDomainAggregate.indexOf(fieldDef.aggregate) >= 0 &&
    (
      // Q always uses quantitative scale except when it's binned.
      // Binned field has similar values in both the source table and the summary table
      // but the summary table has fewer values, therefore binned fields draw
      // domain values from the summary table.
      (fieldDef.type === QUANTITATIVE && !fieldDef.bin) ||
      // T uses non-ordinal scale when there's no unit or when the unit is not ordinal.
      (fieldDef.type === TEMPORAL &&
        (!fieldDef.timeUnit || !time.isOrdinalFn(fieldDef.timeUnit))
      )
    );
}

export function bandWidth(encoding: Encoding, name, type, layout) {
  // TODO: eliminate layout

  switch (name) {
    case X: /* fall through */
    case Y:
      if (type === 'ordinal') {
        return encoding.bandWidth(name, layout[name].useSmallBand);
      }
      break;
    case ROW: // support only ordinal
      return layout.cellHeight;
    case COL: // support only ordinal
      return layout.cellWidth;
  }
  return undefined;
}

export function clamp(encoding: Encoding, name) {
  // only return value if explicit value is specified.
  return encoding.fieldDef(name).scale.clamp;
}

export function exponent(encoding: Encoding, name) {
  // only return value if explicit value is specified.
  return encoding.fieldDef(name).scale.exponent;
}

export function nice(encoding: Encoding, name, type) {
  if (encoding.fieldDef(name).scale.nice !== undefined) {
    // explicit value
    return encoding.fieldDef(name).scale.nice;
  }

  switch (name) {
    case X: /* fall through */
    case Y:
      if (type === 'time' || type === 'ordinal') {
        return undefined;
      }
      return true;

    case ROW: /* fall through */
    case COL:
      return true;
  }
  return undefined;
}

export function outerPadding(encoding: Encoding, name, type) {
  if (type === 'ordinal') {
    if (encoding.fieldDef(name).scale.outerPadding !== undefined) {
      return encoding.fieldDef(name).scale.outerPadding; // explicit value
    }
    if (name === ROW || name === COL) {
      return 0;
    }
  }
  return undefined;
}

export function padding(encoding: Encoding, name, type) {
  if (type === 'ordinal') {
    // Both explicit and non-explicit values are handled by the helper method.
    return encoding.padding(name);
  }
  return undefined;
}

export function points(encoding: Encoding, name, type) {
  if (type === 'ordinal') {
    if (encoding.fieldDef(name).scale.points !== undefined) {
      // explicit value
      return encoding.fieldDef(name).scale.points;
    }

    switch (name) {
      case X:
      case Y:
        return true;
    }
  }
  return undefined;
}


export function range(encoding: Encoding, name, type, layout, stats) {
  var fieldDef = encoding.fieldDef(name);

  if (fieldDef.scale.range) { // explicit value
    return fieldDef.scale.range;
  }

  switch (name) {
    case X:
      return layout.cellWidth ? [0, layout.cellWidth] : 'width';
    case Y:
      if (type === 'ordinal') {
        return layout.cellHeight ?
          (fieldDef.bin ? [layout.cellHeight, 0] : [0, layout.cellHeight]) :
          'height';
      }
      return layout.cellHeight ? [layout.cellHeight, 0] : 'height';
    case SIZE:
      if (encoding.is('bar')) {
        // FIXME this is definitely incorrect
        // but let's fix it later since bar size is a bad encoding anyway
        return [3, Math.max(encoding.bandWidth(X), encoding.bandWidth(Y))];
      } else if (encoding.is(TEXT)) {
        return [8, 40];
      }
      // else -- point
      var bandWidth = Math.min(encoding.bandWidth(X), encoding.bandWidth(Y)) - 1;
      return [10, 0.8 * bandWidth*bandWidth];
    case SHAPE:
      return 'shapes';
    case COLOR:
      return color(encoding, name, type, stats);
  }

  return undefined;
}

export function round(encoding: Encoding, name) {
  if (encoding.fieldDef(name).scale.round !== undefined) {
    return encoding.fieldDef(name).scale.round;
  }

  // FIXME: revise if round is already the default value
  switch (name) {
    case X: /* fall through */
    case Y:
    case ROW:
    case COL:
    case SIZE:
      return true;
  }
  return undefined;
}

export function zero(encoding: Encoding, name) {
  var fieldDef = encoding.fieldDef(name);
  var timeUnit = fieldDef.timeUnit;

  if (fieldDef.scale.zero !== undefined) {
    // explicit value
    return fieldDef.scale.zero;
  }

  if (fieldDef.type === TEMPORAL) {
    if (timeUnit === 'year') {
      // year is using linear scale, but should not include zero
      return false;
    }
    // If there is no timeUnit or the timeUnit uses ordinal scale,
    // zero property is ignored by vega so we should not generate them any way
    return undefined;
  }
  if (fieldDef.bin) {
    // Returns false (undefined) by default of bin
    return false;
  }

  return name === X || name === Y ?
    // if not bin / temporal, returns undefined for X and Y encoding
    // since zero is true by default in vega for linear scale
    undefined :
    false;
}

export function color(encoding: Encoding, name, scaleType, stats) {
  var colorScale = encoding.scale(COLOR),
    range = colorScale.range,
    cardinality = encoding.cardinality(COLOR, stats),
    type = encoding.fieldDef(COLOR).type;

  if (range === undefined) {
    var ordinalPalette = colorScale.ordinalPalette,
      quantitativeRange = colorScale.quantitativeRange;

    if (scaleType === 'ordinal') {
      if (type === NOMINAL) {
        // use categorical color scale
        if (cardinality <= 10) {
          range = colorScale.c10palette;
        } else {
          range = colorScale.c20palette;
        }
        return colors.palette(range, cardinality, type);
      } else {
        if (ordinalPalette) {
          return colors.palette(ordinalPalette, cardinality, type);
        }
        return colors.interpolate(quantitativeRange[0], quantitativeRange[1], cardinality);
      }
    } else { //time or quantitative
      return [quantitativeRange[0], quantitativeRange[1]];
    }
  }
}

export namespace colors {
  export function palette(range, cardinality?, type?: String) {
    // FIXME(kanitw): Jul 29, 2015 - check range is string
    switch (range) {
      case 'category10k':
        // tableau's category 10, ordered by perceptual kernel study results
        // https://github.com/uwdata/perceptual-kernels
        return ['#2ca02c', '#e377c2', '#7f7f7f', '#17becf', '#8c564b', '#d62728', '#bcbd22', '#9467bd', '#ff7f0e', '#1f77b4'];

      // d3/tableau category10/20/20b/20c
      case 'category10':
        return ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

      case 'category20':
        return ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'];

      case 'category20b':
        return ['#393b79', '#5254a3', '#6b6ecf', '#9c9ede', '#637939', '#8ca252', '#b5cf6b', '#cedb9c', '#8c6d31', '#bd9e39', '#e7ba52', '#e7cb94', '#843c39', '#ad494a', '#d6616b', '#e7969c', '#7b4173', '#a55194', '#ce6dbd', '#de9ed6'];

      case 'category20c':
        return ['#3182bd', '#6baed6', '#9ecae1', '#c6dbef', '#e6550d', '#fd8d3c', '#fdae6b', '#fdd0a2', '#31a354', '#74c476', '#a1d99b', '#c7e9c0', '#756bb1', '#9e9ac8', '#bcbddc', '#dadaeb', '#636363', '#969696', '#bdbdbd', '#d9d9d9'];
    }

    // TODO add our own set of custom ordinal color palette

    if (range in colorbrewer) {
      var palette = colorbrewer[range];

      // if cardinality pre-defined, use it.
      if (cardinality in palette) return palette[cardinality];

      // if not, use the highest cardinality one for nominal
      if (type === NOMINAL) {
        return palette[Math.max.apply(null, util.keys(palette))];
      }

      // otherwise, interpolate
      var ps = cardinality < 3 ? 3 : Math.max.apply(null, util.keys(palette)),
        from = 0 , to = ps - 1;
      // FIXME add config for from / to

      return colors.interpolate(palette[ps][from], palette[ps][to], cardinality);
    }

    return range;
  }

  export function interpolate(start, end, cardinality) {
    var interpolator = interpolateHsl(start, end);
    return util.range(cardinality).map(function(i) { return interpolator(i*1.0/(cardinality-1)); });
  }
}
