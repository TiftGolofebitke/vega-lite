import {ScaleChannel, SPATIAL_SCALE_CHANNELS} from '../channel';
import * as log from '../log';
import {Resolve, ResolveMode} from '../resolve';
import {contains} from '../util';
import {ConcatModel} from './concat';
import {FacetModel} from './facet';
import {LayerModel} from './layer';
import {isConcatModel, isFacetModel, isLayerModel, isRepeatModel, Model} from './model';
import {RepeatModel} from './repeat';

export function defaultScaleResolve(channel: ScaleChannel, model: Model): ResolveMode {
  if (isLayerModel(model) || isFacetModel(model)) {
    return 'shared';
  } else if (isConcatModel(model) || isRepeatModel(model)) {
    return contains(SPATIAL_SCALE_CHANNELS, channel) ? 'independent' : 'shared';
  }
  /* istanbul ignore next: should never reach here. */
  throw new Error('invalid model type for resolve');
}

export function parseGuideResolve(resolve: Resolve, channel: ScaleChannel): ResolveMode {
  const channelScaleResolve = resolve.scale[channel];
  const guide = contains(SPATIAL_SCALE_CHANNELS, channel) ? 'axis' : 'legend';

  if (channelScaleResolve === 'independent') {
    if (resolve[guide][channel] === 'shared') {
      log.warn(log.message.independentScaleMeansIndependentGuide(channel));
    }
    return 'independent';
  }

  return resolve[guide][channel] || 'shared';
}
