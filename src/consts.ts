export namespace Table {
  export const SUMMARY = 'summary';
  export const SOURCE = 'source';
  export const STACKED = 'stacked';
}

// export enum Enctype {
//   X, Y, COL, ROW, SIZE, SHAPE, COLOR, TEXT, DETAIL
// }

export namespace Enctype {
  export const X = 'x';
  export const Y = 'y';
  export const ROW = 'row';
  export const COL = 'col';
  export const SHAPE = 'shape';
  export const SIZE = 'size';
  export const COLOR = 'color';
  export const TEXT = 'text';
  export const DETAIL = 'detail';
}


export enum Type {
  Q,  // Quantitative
  O,  // Ordinal
  N,  // Nominal
  T,  // Time
};

export const TIMEUNITS = [
  'year', 'month', 'day', 'date', 'hours', 'minutes', 'seconds'
];

// TODO: see if there is a nice way to import from Vega schema
export const AGGREGATE_OPS = [
  'values', 'count', 'valid', 'missing', 'distinct',
  'sum', 'mean', 'average', 'variance', 'variancep', 'stdev',
  'stdevp', 'median', 'q1', 'q3', 'modeskew', 'min', 'max',
  'argmin', 'argmax'
];

export const ENCODING_TYPES = [
  Enctype.X, Enctype.Y,
  Enctype.ROW, Enctype.COL,
  Enctype.SIZE, Enctype.SHAPE, Enctype.COLOR, Enctype.TEXT, Enctype.DETAIL
];

// TODO: remove
export var MAXBINS_DEFAULT = 15;

export const Shorthand = {
  Delim: '|',
  Assign: '=',
  Type: ',',
  Func: '_'
};
