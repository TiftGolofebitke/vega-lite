/**
 * Module for compiling Vega-lite spec into Vega spec.
 */
import {Model} from './Model';

import {compileAxis} from './axis';
import {compileData} from './data';
import {facetMixins} from './facet';
import {compileLegends} from './legend';
import {compileMarks} from './marks';
import {compileScales} from './scale';
import {extend, keys} from '../util';

import {LAYOUT} from '../data';
import {COLUMN, ROW, X, Y} from '../channel';

export {Model} from './Model';

export function compile(spec, theme?) {
  var model = new Model(spec, theme);
  const layout = model.layout();

  let rootGroup:any = extend({
      name: spec.name ? spec.name + '-root' : 'root',
      type: 'group',
    },
    spec.description ? {description: spec.description} : {},
    {
      from: {data: LAYOUT},
      properties: {
        update: {
          width: layout.width.field ?
                 {field: layout.width.field} :
                 {value: layout.width},
          height: layout.height.field ?
                  {field: layout.height.field} :
                  {value: layout.height}
        }
      }
    });

  const marks = compileMarks(model);

  // Small Multiples
  if (model.has(ROW) || model.has(COLUMN)) {
    // put the marks inside a facet cell's group
    extend(rootGroup, facetMixins(model, marks));
  } else {
    rootGroup.marks = marks;
    rootGroup.scales = compileScales(model.channels(), model);

    var axes = (model.has(X) ? [compileAxis(X, model)] : [])
      .concat(model.has(Y) ? [compileAxis(Y, model)] : []);
    if (axes.length > 0) {
      rootGroup.axes = axes;
    }
  }

  // legends (similar for either facets or non-facets
  var legends = compileLegends(model);
  if (legends.length > 0) {
    rootGroup.legends = legends;
  }

  // FIXME replace FIT with appropriate mechanism once Vega has it
  const FIT = 1;

  // TODO: change type to become VgSpec
  var output = extend(
    spec.name ? {name: spec.name} : {},
    {
      width: layout.width.field ? FIT : layout.width,
      height: layout.height.field ? FIT : layout.height,
      padding: 'auto'
    },
    ['viewport', 'background'].reduce(function(topLevelConfig, property) {
      const value = model.config(property);
      if (value !== undefined) {
        topLevelConfig[property] = value;
      }
      return topLevelConfig;
    }, {}),
    keys(model.config('scene')).length > 0 ? ['fill', 'fillOpacity', 'stroke', 'strokeWidth',
      'strokeOpacity', 'strokeDash', 'strokeDashOffset'].reduce(function(topLevelConfig: any, property) {
        const value = model.sceneConfig(property);
        if (value !== undefined) {
          topLevelConfig.scene = topLevelConfig.scene || {};
          topLevelConfig.scene[property] = {value: value};
        }
        return topLevelConfig;
    }, {}) : {},
    {
      data: compileData(model),
      marks: [rootGroup]
    });

  return {
    spec: output
    // TODO: add warning / errors here
  };
}
