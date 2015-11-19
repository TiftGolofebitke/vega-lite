// utility for Encoding Definition

import {Shorthand, MAXBINS_DEFAULT} from './consts';
import {AGGREGATE_OPS} from './aggregate';
import * as util from './util';
import * as time from './compiler/time';
import {TIMEUNITS} from './timeunit';
import {NOMINAL, ORDINAL, QUANTITATIVE, TEMPORAL, SHORT_TYPE, TYPE_FROM_SHORT_TYPE} from './type';

/**
 * @param field
 * @param opt
 *   opt.nofn -- exclude bin, aggregate, timeUnit
 *   opt.noAggregate -- exclude aggregation function
 *   opt.datum - include 'datum.'
 *   opt.fn - replace fn with custom function prefix
 *   opt.prefn - prepend fn with custom function prefix
 *   opt.bin_suffix - append suffix to the field ref for bin (default='_start')

 * @return {[type]}       [description]
 */
export function fieldRef(fieldDef, opt) {
  opt = opt || {};

  var f = (opt.datum ? 'datum.' : '') + (opt.prefn || ''),
    name = fieldDef.name;

  if (isCount(fieldDef)) {
    return f + 'count';
  } else if (opt.fn) {
    return f + opt.fn + '_' + name;
  } else if (!opt.nofn && fieldDef.bin) {
    var bin_suffix = opt.bin_suffix || '_start';
    return f + 'bin_' + name + bin_suffix;
  } else if (!opt.nofn && !opt.noAggregate && fieldDef.aggregate) {
    return f + fieldDef.aggregate + '_' + name;
  } else if (!opt.nofn && fieldDef.timeUnit) {
    return f + fieldDef.timeUnit + '_' + name;
  }  else {
    return f + name;
  }
}

export function shorthand(f) {
  return (f.aggregate ? f.aggregate + Shorthand.FUNC : '') +
    (f.timeUnit ? f.timeUnit + Shorthand.FUNC : '') +
    (f.bin ? 'bin' + Shorthand.FUNC : '') +
    (f.name || '') + Shorthand.TYPE + SHORT_TYPE[f.type];
}

export function shorthands(fieldDefs, delim) {
  delim = delim || Shorthand.DELIM;
  return fieldDefs.map(shorthand).join(delim);
}

export function fromShorthand(shorthand: string) {
  var split = shorthand.split(Shorthand.TYPE), i;

  var fieldDef: any = {
    name: split[0].trim(),
    type: TYPE_FROM_SHORT_TYPE[split[1].trim()]
  };

  // check aggregate type
  for (i in AGGREGATE_OPS) {
    var a = AGGREGATE_OPS[i];
    if (fieldDef.name.indexOf(a + '_') === 0) {
      fieldDef.name = fieldDef.name.substr(a.length + 1);
      if (a == 'count' && fieldDef.name.length === 0) fieldDef.name = '*';
      fieldDef.aggregate = a;
      break;
    }
  }

  for (i in TIMEUNITS) {
    var tu = TIMEUNITS[i];
    if (fieldDef.name && fieldDef.name.indexOf(tu + '_') === 0) {
      fieldDef.name = fieldDef.name.substr(fieldDef.name.length + 1);
      fieldDef.timeUnit = tu;
      break;
    }
  }

  // check bin
  if (fieldDef.name && fieldDef.name.indexOf('bin_') === 0) {
    fieldDef.name = fieldDef.name.substr(4);
    fieldDef.bin = true;
  }

  return fieldDef;
}

export function isTypes(fieldDef, types: Array<String>) {
  for (var t = 0; t < types.length; t++) {
    if (fieldDef.type === types[t]) {
      return true;
    }
  }
  return false;
}

/*
 * Most fields that use ordinal scale are dimensions.
 * However, YEAR(T), YEARMONTH(T) use time scale, not ordinal but are dimensions too.
 */
export function isOrdinalScale(fieldDef) {
  return  isTypes(fieldDef, [NOMINAL, ORDINAL]) ||
    (fieldDef.type === TEMPORAL && fieldDef.timeUnit && time.isOrdinalFn(fieldDef.timeUnit) );
}


// TODO remove these "isDimension/isMeasure" stuff
function _isFieldDimension(fieldDef) {
  return  isTypes(fieldDef, [NOMINAL, ORDINAL]) || !!fieldDef.bin ||
    (fieldDef.type === TEMPORAL && !!fieldDef.timeUnit );
}

export function isDimension(fieldDef) {
  return fieldDef && _isFieldDimension(fieldDef);
}

export function isMeasure(fieldDef) {
  return fieldDef && !_isFieldDimension(fieldDef);
}

export function count() {
  return {name:'*', aggregate: 'count', type: QUANTITATIVE, displayName: COUNT_DISPLAYNAME};
}

export const COUNT_DISPLAYNAME = 'Number of Records';

export function isCount(fieldDef) {
  return fieldDef.aggregate === 'count';
}

export function cardinality(fieldDef, stats, filterNull = {}) {
  // FIXME need to take filter into account

  var stat = stats[fieldDef.name];
  var type = fieldDef.type;

  if (fieldDef.bin) {
    var bins = util.getbins(stat, fieldDef.bin.maxbins || MAXBINS_DEFAULT);
    return (bins.stop - bins.start) / bins.step;
  }
  if (fieldDef.type === TEMPORAL) {
    var cardinality = time.cardinality(fieldDef, stats, filterNull, type);
    if(cardinality !== null) return cardinality;
    //otherwise use calculation below
  }
  if (fieldDef.aggregate) {
    return 1;
  }

  // remove null
  return stat.distinct -
    (stat.missing > 0 && filterNull[type] ? 1 : 0);
}
