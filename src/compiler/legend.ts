import {setter, getter} from '../util';
import * as time from './time';
import {COLOR, SHAPE, SIZE} from '../consts';
import {Q, O, N, T} from '../consts';

export function defs(encoding, styleCfg) {
  var defs = [];

  if (encoding.has(COLOR) && encoding.encDef(COLOR).legend) {
    defs.push(def(COLOR, encoding, {
      fill: COLOR
    }, styleCfg));
  }

  if (encoding.has(SIZE) && encoding.encDef(SIZE).legend) {
    defs.push(def(SIZE, encoding, {
      size: SIZE
    }, styleCfg));
  }

  if (encoding.has(SHAPE) && encoding.encDef(SHAPE).legend) {
    defs.push(def(SHAPE, encoding, {
      shape: SHAPE
    }, styleCfg));
  }
  return defs;
};

export function def(name, encoding, def, styleCfg) {
  var timeUnit = encoding.encDef(name).timeUnit;

  def.title = title(name, encoding);
  def.orient = encoding.encDef(name).legend.orient;

  def = style(name, encoding, def, styleCfg);

  if (encoding.isType(name, T) &&
    timeUnit &&
    time.hasScale(timeUnit)
  ) {
    setter(def, ['properties', 'labels', 'text', 'scale'], 'time-'+ timeUnit);
  }

  return def;
};

export function style(name, e, def, styleCfg) {
  var symbols = getter(def, ['properties', 'symbols']),
    marktype = e.marktype();

  switch (marktype) {
    case 'bar':
    case 'tick':
    case 'text':
      symbols.stroke = {value: 'transparent'};
      symbols.shape = {value: 'square'};
      break;

    case 'circle':
    case 'square':
      symbols.shape = {value: marktype};
      /* fall through */
    case 'point':
      // fill or stroke
      if (e.encDef(SHAPE).filled) {
        if (e.has(COLOR) && name === COLOR) {
          symbols.fill = {scale: COLOR, field: 'data'};
        } else {
          symbols.fill = {value: e.value(COLOR)};
        }
        symbols.stroke = {value: 'transparent'};
      } else {
        if (e.has(COLOR) && name === COLOR) {
          symbols.stroke = {scale: COLOR, field: 'data'};
        } else {
          symbols.stroke = {value: e.value(COLOR)};
        }
        symbols.fill = {value: 'transparent'};
        symbols.strokeWidth = {value: e.config('strokeWidth')};
      }

      break;
    case 'line':
    case 'area':
      // TODO use shape here after implementing #508
      break;
  }

  var opacity = e.encDef(COLOR).opacity || styleCfg.opacity;
  if (opacity) {
    symbols.opacity = {value: opacity};
  }
  return def;
};

export function title(name, encoding) {
  var leg = encoding.encDef(name).legend;

  if (leg.title) return leg.title;

  return encoding.fieldTitle(name);
};
