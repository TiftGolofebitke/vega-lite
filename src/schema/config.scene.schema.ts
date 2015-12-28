export interface SceneConfig {
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeOpacity? :number;
  strokeDash?: number;
  strokeDashOffset?: number;
}

export const sceneConfig = {
  type: 'object',
  properties: {
    fill: {
      type: 'string',
      role: 'color',
      default: 'rgba(0,0,0,0)'
    },
    fillOpacity: {
      type: 'number',
    },
    stroke: {
      type: 'string',
      role: 'color',
    },
    strokeWidth: {
      type: 'integer'
    },
    strokeOpacity: {
      type: 'number'
    },
    strokeDash: {
      type: 'array',
      default: undefined
    },
    strokeDashOffset: {
      type: 'integer',
      description: 'The offset (in pixels) into which to begin drawing with the stroke dash array.'
    }
  }
};
