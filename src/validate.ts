import {toMap} from './util';
import * as Encoding from './Encoding';
import {schema} from './schema/schema';

interface RequiredChannelMap {
  [marktype:string]: Array<string>;
}

/**
 * Required Encoding Channels for each mark type
 * @type {Object}
 */
export const DefaultRequiredChannelMap: RequiredChannelMap = {
  text: ['text'],
  line: ['x', 'y'],
  area: ['x', 'y']
};

interface SupportedChannelMap {
  [marktype:string]: {
    [channel:string]: number
  };
}

/**
 * Supported Encoding Channel for each mark type
 */
export const DefaultSupportedChannelMap: SupportedChannelMap = {
  bar: toMap(['row', 'col', 'x', 'y', 'size', 'color']), // TODO(#400) add detail
  line: toMap(['row', 'col', 'x', 'y', 'color', 'detail']), // TODO: add size when Vega supports
  area: toMap(['row', 'col', 'x', 'y', 'color']), // TODO(#400) add detail
  tick: toMap(['row', 'col', 'x', 'y', 'color', 'detail']),
  circle: toMap(['row', 'col', 'x', 'y', 'color', 'size', 'detail']),
  square: toMap(['row', 'col', 'x', 'y', 'color', 'size', 'detail']),
  point: toMap(['row', 'col', 'x', 'y', 'color', 'size', 'detail', 'shape']),
  text: toMap(['row', 'col', 'size', 'color', 'text']) //TODO(#724) revise
};

// TODO: consider if we should add validate method and
// requires ZSchema in the main vega-lite repo

/**
  * Further check if encoding mapping of a spec is invalid and
  * return error if it is invalid.
  *
  * This checks if
  * (1) all the required encoding channels for the mark type are specified
  * (2) all the specified encoding channels are supported by the mark type
  * @param  {[type]} spec [description]
  * @param  {RequiredChannelMap  = DefaultRequiredChannelMap}  requiredChannelMap
  * @param  {SupportedChannelMap = DefaultSupportedChannelMap} supportedChannelMap
  * @return {String} Return one reason why the encoding is invalid,
  *                  or null if the encoding is valid.
  */
export function getEncodingMappingError(spec, //TODO: add ":spec"
      requiredChannelMap: RequiredChannelMap = DefaultRequiredChannelMap,
      supportedChannelMap: SupportedChannelMap = DefaultSupportedChannelMap
    ) {
  let marktype = spec.marktype;
  let encoding = spec.encoding;
  let requiredChannels = requiredChannelMap[marktype];
  let supportedChannels = supportedChannelMap[marktype];

  for (let i in requiredChannels) { // all required channels are in encoding`
    if (!(requiredChannels[i] in encoding)) {
      return 'Missing encoding channel \"' + requiredChannels[i] +
              '\" for marktype \"' + marktype + '\"';
    }
  }

  for (let channel in encoding) { // all channels in encoding are supported
    if (!supportedChannels[channel]) {
      return 'Encoding channel \"' + channel +
             '\" is not supported by mark type \"' + marktype + '\"';
    }
  }

  if (marktype == 'bar' && !encoding.x && !encoding.y) {
    return 'Missing both x and y for bar';
  }

  return null;
}
