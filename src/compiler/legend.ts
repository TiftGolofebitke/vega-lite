import {extend, keys} from '../util';
import {COLOR, SIZE, SHAPE, Channel} from '../channel';
import {Model} from './Model';
import * as time from './time';
import {TEMPORAL} from '../type';

export function compileLegends(model: Model) {
  var defs = [];

  if (model.has(COLOR) && model.fieldDef(COLOR).legend) {
    defs.push(compileLegend(model, COLOR, {
      fill: COLOR
      // TODO: consider if this should be stroke for line
    }));
  }

  if (model.has(SIZE) && model.fieldDef(SIZE).legend) {
    defs.push(compileLegend(model, SIZE, {
      size: SIZE
    }));
  }

  if (model.has(SHAPE) && model.fieldDef(SHAPE).legend) {
    defs.push(compileLegend(model, SHAPE, {
      shape: SHAPE
    }));
  }
  return defs;
}

export function compileLegend(model: Model, channel: Channel, def) {
  let legend = model.fieldDef(channel).legend;

  // 1.1 Add properties with special rules
  def.title = title(model, channel);

  // 1.2 Add properties without rules
  ['orient', 'format', 'values'].forEach(function(property) {
    let value = legend[property];
    if (value !== undefined) {
      def[property] = value;
    }
  });

  // 2) Add mark property definition groups
  let props = legend.properties || {};
  ['title', 'labels', 'symbols', 'legend'].forEach(function(group) {
    let value = properties[group] ?
      properties[group](model, channel, props[group]) : // apply rule
      props[group]; // no rule -- just default values
    if (value !== undefined) {
      def.properties = def.properties || {};
      def.properties[group] = value;
    }
  });

  return def;
}

export function title(model: Model, channel: Channel) {
  let leg = model.fieldDef(channel).legend;

  if (leg.title) return leg.title;

  return model.fieldTitle(channel);
}

namespace properties {
  export function labels(model: Model, channel: Channel, spec) {
    var fieldDef = model.fieldDef(channel);
    var timeUnit = fieldDef.timeUnit;
    if (fieldDef.type === TEMPORAL && timeUnit && time.labelTemplate(timeUnit)) {
      return extend({
        text: {
          template: '{{datum.data | ' + time.labelTemplate(timeUnit) + '}}'
        }
      }, spec || {});
    }
    return spec;
  }

  export function symbols(model: Model, channel: Channel, spec) {
    let symbols:any = {};
    let marktype = model.marktype();

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
        if (model.fieldDef(SHAPE).filled) {
          if (model.has(COLOR) && channel === COLOR) {
            symbols.fill = {scale: COLOR, field: 'data'};
          } else {
            symbols.fill = {value: model.fieldDef(COLOR).value};
          }
          symbols.stroke = {value: 'transparent'};
        } else {
          if (model.has(COLOR) && channel === COLOR) {
            symbols.stroke = {scale: COLOR, field: 'data'};
          } else {
            symbols.stroke = {value: model.fieldDef(COLOR).value};
          }
          symbols.fill = {value: 'transparent'};
          symbols.strokeWidth = {value: model.config('strokeWidth')};
        }

        break;
      case 'line':
      case 'area':
        // TODO use shape here after implementing #508
        break;
    }

    var opacity = model.fieldDef(COLOR).opacity;
    if (opacity) {
      symbols.opacity = {value: opacity};
    }

    symbols = extend(symbols, spec || {});

    return keys(symbols).length > 0 ? symbols : undefined;
  }
}
