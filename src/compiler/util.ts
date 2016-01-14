import {Model} from './Model';
import {COLOR} from '../channel';

export enum ColorMode {
  ALWAYS_FILLED,
  ALWAYS_STROKED
}

export const FILL_STROKE_CONFIG = ['fill', 'fillOpacity',
  'stroke', 'strokeWidth', 'strokeDash', 'strokeDashOffset', 'strokeOpacity',
  'opacity'];

export function applyColorAndOpacity(p, model: Model, colorMode?: ColorMode) {
  const filled = colorMode === ColorMode.ALWAYS_FILLED ? true :
    colorMode === ColorMode.ALWAYS_STROKED ? false :
    model.config().mark.filled;

  // Apply fill and stroke config first
  // so that `color.value` can override `fill` and `stroke` config
  applyMarkConfig(p, model, FILL_STROKE_CONFIG);

  if (filled) {
    if (model.has(COLOR)) {
      p.fill = {
        scale: model.scale(COLOR),
        field: model.field(COLOR)
      };
    } else {
      p.fill = { value: model.fieldDef(COLOR).value };
    }
  } else {
    if (model.has(COLOR)) {
      p.stroke = {
        scale: model.scale(COLOR),
        field: model.field(COLOR)
      };
    } else {
      p.stroke = { value: model.fieldDef(COLOR).value };
    }
  }
}

export function applyMarkConfig(marksProperties, model: Model, propsList: string[]) {
  propsList.forEach(function(property) {
    const value = model.config().mark[property];
    if (value !== undefined) {
      marksProperties[property] = { value: value };
    }
  });
}
