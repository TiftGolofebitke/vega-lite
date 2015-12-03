/** Constants and utilities for data type */

export enum Type {
  QUANTITATIVE = <any>'quantitative',
  ORDINAL = <any>'ordinal',
  TEMPORAL = <any>'temporal',
  NOMINAL = <any>'nominal',

  // legacy short names, translated in getFullName
  Q = <any>'quantitative',
  O = <any>'ordinal',
  T = <any>'temporal',
  N = <any>'nominal'
}

export const QUANTITATIVE = Type.QUANTITATIVE;
export const ORDINAL = Type.ORDINAL;
export const TEMPORAL = Type.TEMPORAL;
export const NOMINAL = Type.NOMINAL;

/**
 * Mapping from full type names to short type names.
 * @type {Object}
 */
export const SHORT_TYPE = {
  quantitative: 'Q',
  temporal: 'T',
  nominal: 'N',
  ordinal: 'O'
};
/**
 * Mapping from short type names to full type names.
 * @type {Object}
 */
export const TYPE_FROM_SHORT_TYPE = {
  Q: QUANTITATIVE,
  T: TEMPORAL,
  O: ORDINAL,
  N: NOMINAL
};

/**
 * Get full, lowercase type name for a given type.
 * @param  type
 * @return Full type name.
 */
export function getFullName(type: Type): Type {
  return TYPE_FROM_SHORT_TYPE[Type[type].toUpperCase()] || // short type is uppercase by default
         Type[type].toLowerCase();
}
