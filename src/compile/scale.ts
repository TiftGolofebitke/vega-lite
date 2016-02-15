// https://github.com/Microsoft/TypeScript/blob/master/doc/spec.md#11-ambient-declarations
declare var exports;

import {FieldDef} from '../schema/fielddef.schema';
import {Scale} from '../schema/scale.schema';

import {contains, extend} from '../util';
import {Model} from './Model';
import {SHARED_DOMAIN_OPS} from '../aggregate';
import {COLUMN, ROW, X, Y, SHAPE, SIZE, COLOR, TEXT, hasScale, Channel} from '../channel';
import {SOURCE, STACKED_SCALE} from '../data';
import {NOMINAL, ORDINAL, QUANTITATIVE, TEMPORAL} from '../type';
import {Mark, BAR, TEXT as TEXT_MARK} from '../mark';
import {rawDomain} from './time';
import {field} from '../fielddef';

/**
 * Color Ramp's scale for legends.  This scale has to be ordinal so that its
 * legends show a list of numbers.
 */
export const COLOR_LEGEND = 'color_legend';

// scale used to get labels for binned color scales
export const COLOR_LEGEND_LABEL = 'color_legend_label';

export function compileScales(channels: Channel[], model: Model) {
  return channels.filter(hasScale)
    .reduce(function(scales: any[], channel: Channel) {
      const fieldDef = model.fieldDef(channel);

      // Add additional scales needed to support ordinal legends (list of values)
      // for color ramp.
      if (channel === COLOR && model.legend(COLOR) && (fieldDef.type === ORDINAL || fieldDef.bin || fieldDef.timeUnit)) {
        scales.push(colorLegendScale(model, fieldDef));
        if (fieldDef.bin) {
          scales.push(binColorLegendLabel(model, fieldDef));
        }
      }

      scales.push(mainScale(model, fieldDef, channel));
      return scales;
    }, []);
}

/**
 * Return the main scale for each channel.  (Only color can have multiple scales.)
 */
function mainScale(model: Model, fieldDef: FieldDef, channel: Channel) {
  const scale = model.scale(channel);
  const sort = model.sort(channel);

  let scaleDef: any = {
    name: model.scaleName(channel),
    type: type(scale, fieldDef, channel, model.mark()),
  };

  scaleDef.domain = domain(scale, model, channel, scaleDef.type);
  extend(scaleDef, rangeMixins(scale, model, channel, scaleDef.type));

  if (sort && (typeof sort === 'string' ? sort : sort.order) === 'descending') {
    scaleDef.reverse = true;
  }

  // Add optional properties
  [
    // general properties
    'round',
    // quantitative / time
    'clamp', 'nice',
    // quantitative
    'exponent', 'zero',
    // ordinal
    'padding', 'points'
  ].forEach(function(property) {
    // TODO include fieldDef as part of the parameters
    const value = exports[property](scale, fieldDef, channel, scaleDef.type);
    if (value !== undefined) {
      scaleDef[property] = value;
    }
  });

  return scaleDef;
}

/**
 *  Return a scale  for producing ordinal scale for legends.
 *  - For an ordinal field, provide an ordinal scale that maps rank values to field value
 *  - For a field with bin or timeUnit, provide an identity ordinal scale
 *    (mapping the field values to themselves)
 */
function colorLegendScale(model: Model, fieldDef: FieldDef) {
  return {
    name: COLOR_LEGEND,
    type: 'ordinal',
    domain: {
      data: model.dataTable(),
      // use rank_<field> for ordinal type, for bin and timeUnit use default field
      field: model.field(COLOR, (fieldDef.bin || fieldDef.timeUnit) ? {} : {prefn: 'rank_'}), sort: true
    },
    range: {data: model.dataTable(), field: model.field(COLOR), sort: true}
  };
}

/**
 *  Return an additional scale for bin labels because we need to map bin_start to bin_range in legends
 */
function binColorLegendLabel(model: Model, fieldDef: FieldDef) {
  return {
    name: COLOR_LEGEND_LABEL,
    type: 'ordinal',
    domain: {
      data: model.dataTable(),
      field: model.field(COLOR,  {prefn: 'rank_'}),
      sort: true
    },
    range: {
      data: model.dataTable(),
      field: field(fieldDef, {binSuffix: '_range'}),
      sort: {
        field: model.field(COLOR, { binSuffix: '_start' }),
        op: 'min' // min or max doesn't matter since same _range would have the same _start
      }
    }
  };
}

export function type(scale: Scale, fieldDef: FieldDef, channel: Channel, mark: Mark): string {
  if (!hasScale(channel)) {
    // There is no scale for these channels
    return null;
  }

  // We can't use linear/time for row, column or shape
  if (contains([ROW, COLUMN, SHAPE], channel)) {
    return 'ordinal';
  }

  if (scale.type !== undefined) {
    return scale.type;
  }

  switch (fieldDef.type) {
    case NOMINAL:
      return 'ordinal';
    case ORDINAL:
      if (channel === COLOR) {
        return 'linear'; // time has order, so use interpolated ordinal color scale.
      }
      return 'ordinal';
    case TEMPORAL:
      if (channel === COLOR) {
        return 'time'; // time has order, so use interpolated ordinal color scale.
      }

      if (fieldDef.timeUnit) {
        switch (fieldDef.timeUnit) {
          case 'hours':
          case 'day':
          case 'month':
            return 'ordinal';
          default:
            // date, year, minute, second, yearmonth, monthday, ...
            return 'time';
        }
      }
      return 'time';

    case QUANTITATIVE:
      if (fieldDef.bin) {
        return contains([X, Y, COLOR], channel) ? 'linear' : 'ordinal';
      }
      return 'linear';
  }

  // should never reach this
  return null;
}

export function domain(scale: Scale, model: Model, channel:Channel, scaleType: string) {
  var fieldDef = model.fieldDef(channel);

  if (scale.domain) { // explicit value
    return scale.domain;
  }

  // special case for temporal scale
  if (fieldDef.type === TEMPORAL) {
    if (rawDomain(fieldDef.timeUnit, channel)) {
      return {
        data: fieldDef.timeUnit,
        field: 'date'
      };
    }

    return {
      data: model.dataTable(),
      field: model.field(channel),
      sort: {
        field: model.field(channel),
        op: 'min'
      }
    };
  }

  // For stack, use STACKED data.
  var stack = model.stack();
  if (stack && channel === stack.fieldChannel) {
    if(stack.offset === 'normalize') {
      return [0, 1];
    }
    return {
      data: STACKED_SCALE,
      // STACKED_SCALE produces sum of the field's value e.g., sum of sum, sum of distinct
      field: model.field(channel, {prefn: 'sum_'})
    };
  }

  var useRawDomain = _useRawDomain(scale, model, channel, scaleType);
  var sort = domainSort(model, channel, scaleType);

  if (useRawDomain) { // useRawDomain - only Q/T
    return {
      data: SOURCE,
      field: model.field(channel, {noAggregate: true})
    };
  } else if (fieldDef.bin) { // bin
    return scaleType === 'ordinal' ? {
      // ordinal bin scale takes domain from bin_range, ordered by bin_start
      data: model.dataTable(),
      field: model.field(channel, { binSuffix: '_range' }),
      sort: {
        field: model.field(channel, { binSuffix: '_start' }),
        op: 'min' // min or max doesn't matter since same _range would have the same _start
      }
    } : channel === COLOR ? {
      // Currently, binned on color uses linear scale and thus use _start point
      data: model.dataTable(),
      field: model.field(channel, { binSuffix: '_start' })
    } : {
      // other linear bin scale merges both bin_start and bin_end for non-ordinal scale
      data: model.dataTable(),
      field: [
        model.field(channel, { binSuffix: '_start' }),
        model.field(channel, { binSuffix: '_end' })
      ]
    };
  } else if (sort) { // have sort -- only for ordinal
    return {
      // If sort by aggregation of a specified sort field, we need to use SOURCE table,
      // so we can aggregate values for the scale independently from the main aggregation.
      data: sort.op ? SOURCE : model.dataTable(),
      field: (fieldDef.type === ORDINAL && channel === COLOR) ? model.field(channel, {prefn: 'rank_'}) : model.field(channel),
      sort: sort
    };
  } else {
    return {
      data: model.dataTable(),
      field: (fieldDef.type === ORDINAL && channel === COLOR) ? model.field(channel, {prefn: 'rank_'}) : model.field(channel),
    };
  }
}

export function domainSort(model: Model, channel: Channel, scaleType: string): any {
  if (scaleType !== 'ordinal') {
    return undefined;
  }

  var sort = model.sort(channel);
  if (sort === 'ascending' || sort === 'descending') {
    return true;
  }

  // Sorted based on an aggregate calculation over a specified sort field (only for ordinal scale)
  if (typeof sort !== 'string') {
    return {
      op: sort.op,
      field: sort.field
    };
  }
  return undefined;
}


/**
 * Determine if useRawDomain should be activated for this scale.
 * @return {Boolean} Returns true if all of the following conditons applies:
 * 1. `useRawDomain` is enabled either through scale or config
 * 2. Aggregation function is not `count` or `sum`
 * 3. The scale is quantitative or time scale.
 */
function _useRawDomain (scale: Scale, model: Model, channel: Channel, scaleType: string) {
  const fieldDef = model.fieldDef(channel);

  return scale.useRawDomain && //  if useRawDomain is enabled
    // only applied to aggregate table
    fieldDef.aggregate &&
    // only activated if used with aggregate functions that produces values ranging in the domain of the source data
    SHARED_DOMAIN_OPS.indexOf(fieldDef.aggregate) >= 0 &&
    (
      // Q always uses quantitative scale except when it's binned.
      // Binned field has similar values in both the source table and the summary table
      // but the summary table has fewer values, therefore binned fields draw
      // domain values from the summary table.
      (fieldDef.type === QUANTITATIVE && !fieldDef.bin) ||
      // T uses non-ordinal scale when there's no unit or when the unit is not ordinal.
      (fieldDef.type === TEMPORAL && scaleType === 'time')
    );
}


export function rangeMixins(scale: Scale, model: Model, channel: Channel, scaleType: string): any {
  var fieldDef = model.fieldDef(channel);

  if (scaleType === 'ordinal' && scale.bandWidth) {
    return {bandWidth: scale.bandWidth};
  }

  if (scale.range) { // explicit value
    return {range: scale.range};
  }

  switch (channel) {
    case X:
      // we can't use {range: "width"} here since we put scale in the root group
      // not inside the cell, so scale is reusable for axes group

      return {
        rangeMin: 0,
        rangeMax: model.config().unit.width // Fixed unit width for non-ordinal
      };
    case Y:
      return {
        rangeMin: model.config().unit.width, // Fixed unit width for non-ordinal
        rangeMax: 0
      };
    case SIZE:
      if (model.is(BAR)) {
        // TODO: determine bandSize for bin, which actually uses linear scale
        const dimension = model.config().mark.orient === 'horizontal' ? Y : X;
        return {range: [2, model.scale(dimension).bandWidth]};
      } else if (model.is(TEXT_MARK)) {
        return {range: [8, 40]};
      }
      // else -- point, square, circle
      const xIsMeasure = model.isMeasure(X);
      const yIsMeasure = model.isMeasure(Y);

      const bandWidth = xIsMeasure !== yIsMeasure ?
        model.scale(xIsMeasure ? Y : X).bandWidth :
        Math.min(
          model.scale(X).bandWidth || 21 /* config.scale.bandWidth */,
          model.scale(Y).bandWidth || 21 /* config.scale.bandWidth */
        );

      return {range: [10, (bandWidth - 2) * (bandWidth - 2)]};
    case SHAPE:
      return {range: 'shapes'};
    case COLOR:
      if (fieldDef.type === NOMINAL) {
        return {range: 'category10'};
      }
      // else -- ordinal, time, or quantitative
      return {range: ['#AFC6A3', '#09622A']}; // tableau greens
    case ROW:
      return {range: 'height'};
    case COLUMN:
      return {range: 'width'};
  }
  return {};
}

export function clamp(scale: Scale) {
  // TODO: check scale type as well

  // only return value if explicit value is specified.
  return scale.clamp;
}

export function exponent(scale: Scale) {
  // TODO: check scale type as well

  // only return value if explicit value is specified.
  return scale.exponent;
}

export function nice(scale: Scale, fieldDef: FieldDef, channel: Channel, scaleType: string) {
  // TODO: check scale type up here

  if (scale.nice !== undefined) {
    // explicit value
    return scale.nice;
  }

  switch (channel) {
    case X: /* fall through */
    case Y:
      if (scaleType === 'time' || scaleType === 'ordinal') {
        return undefined;
      }
      return true;

    case ROW: /* fall through */
    case COLUMN:
      return true;
  }
  return undefined;
}

export function padding(scale: Scale, fieldDef: FieldDef, channel: Channel, scaleType: string) {
  if (scaleType === 'ordinal' && channel !== ROW && channel !== COLUMN) {
    return scale.padding;
  }
  return undefined;
}

export function points(scale: Scale, fieldDef: FieldDef, channel: Channel, scaleType: string) {
  if (scaleType === 'ordinal') {
    switch (channel) {
      case X:
      case Y:
        return true;
    }
  }
  return undefined;
}

export function round(scale: Scale, fieldDef: FieldDef, channel: Channel) {
  if (scale.round !== undefined) {
    return scale.round;
  }

  // FIXME: revise if round is already the default value
  switch (channel) {
    case X: /* fall through */
    case Y:
    case ROW:
    case COLUMN:
    case SIZE:
      return true;
  }
  return undefined;
}

export function zero(scale: Scale, fieldDef: FieldDef, channel: Channel) {
  var timeUnit = fieldDef.timeUnit;

  if (scale.zero !== undefined) {
    // explicit value
    return scale.zero;
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

  return channel === X || channel === Y ?
    // if not bin / temporal, returns undefined for X and Y encoding
    // since zero is true by default in vega for linear scale
    undefined :
    false;
}
