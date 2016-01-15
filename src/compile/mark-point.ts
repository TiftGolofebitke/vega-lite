import {Model} from './Model';
import {X, Y, SHAPE, SIZE} from '../channel';
import {applyColorAndOpacity, ColorMode} from './util';

export namespace point {
  export function markType() {
    return 'symbol';
  }

  export function properties(model: Model) {
    // TODO Use Vega's marks properties interface
    var p: any = {};

    // x
    if (model.has(X)) {
      p.x = {
        scale: model.scale(X),
        field: model.field(X, { binSuffix: '_mid' })
      };
    } else {
      p.x = { value: model.fieldDef(X).scale.bandWidth / 2 };
    }

    // y
    if (model.has(Y)) {
      p.y = {
        scale: model.scale(Y),
        field: model.field(Y, { binSuffix: '_mid' })
      };
    } else {
      p.y = { value: model.fieldDef(Y).scale.bandWidth / 2 };
    }

    // size
    if (model.has(SIZE)) {
      p.size = {
        scale: model.scale(SIZE),
        field: model.field(SIZE)
      };
    } else {
      p.size = { value: model.sizeValue() };
    }

    // shape
    if (model.has(SHAPE)) {
      p.shape = {
        scale: model.scale(SHAPE),
        field: model.field(SHAPE)
      };
    } else {
      p.shape = { value: model.fieldDef(SHAPE).value };
    }

    applyColorAndOpacity(p, model);
    return p;
  }

  export function labels(model: Model) {
    // TODO(#240): fill this method
  }
}

function filled_point_props(shape) {
  return function(model: Model) {
    // TODO Use Vega's marks properties interface
    var p: any = {};

    // x
    if (model.has(X)) {
      p.x = {
        scale: model.scale(X),
        field: model.field(X, { binSuffix: '_mid' })
      };
    } else {
      p.x = { value: model.fieldDef(X).scale.bandWidth / 2 };
    }

    // y
    if (model.has(Y)) {
      p.y = {
        scale: model.scale(Y),
        field: model.field(Y, { binSuffix: '_mid' })
      };
    } else {
      p.y = { value: model.fieldDef(Y).scale.bandWidth / 2 };
    }

    // size
    if (model.has(SIZE)) {
      p.size = {
        scale: model.scale(SIZE),
        field: model.field(SIZE)
      };
    } else {
      p.size = { value: model.sizeValue() };
    }

    // shape
    p.shape = { value: shape };

    applyColorAndOpacity(p, model, ColorMode.ALWAYS_FILLED);
    return p;
  };
}

export namespace circle {
  export function markType(model: Model) {
    return 'symbol';
  }

  export const properties = filled_point_props('circle');

  export function labels(model: Model) {
    // TODO(#240): fill this method
    return undefined;
  }
}

export namespace square {
  export function markType(model: Model) {
    return 'symbol';
  }

  export const properties = filled_point_props('square');

  export function labels(model: Model) {
    // TODO(#240): fill this method
    return undefined;
  }
}
