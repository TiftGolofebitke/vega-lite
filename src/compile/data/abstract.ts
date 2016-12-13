import {FacetModel} from './../facet';
import {LayerModel} from './../layer';
import {UnitModel} from './../unit';

// TODO: use this to implement all other data compiler.

/**
 * Abstract interface for implementing a data component compiler.
 * Each type of data component compiler should have a common data component (T),
 * which stores minimal set of properties that can be merged
 * and assembled into the desired output.
 *
 * For some data component type, the component might simply be the desired output
 * if the desired output is already easy to merge.  However, that is not the
 * case for all types of data components.
 */
export interface AbstractDataCompiler<T> {
  parseUnit: (model: UnitModel) => T;
  parseLayer: (model: LayerModel) => T;
  parseFacet: (model: FacetModel) => T;
  assemble: (component: T) => any;
}
