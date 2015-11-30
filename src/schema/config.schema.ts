// TODO: add interface Config

export var config = {
  type: 'object',
  properties: {
    // template
    width: {
      type: 'integer',
      default: undefined
    },
    height: {
      type: 'integer',
      default: undefined
    },
    viewport: {
      type: 'array',
      items: {
        type: 'integer'
      },
      default: undefined
    },

    // filter null
    // TODO(#597) revise this config
    filterNull: {
      type: 'object',
      properties: {
        nominal: {type:'boolean', default: false},
        ordinal: {type:'boolean', default: false},
        quantitative: {type:'boolean', default: true},
        temporal: {type:'boolean', default: true}
      }
    },

    // single plot
    singleHeight: {
      // will be overwritten by bandWidth
      type: 'integer',
      default: 200,
      minimum: 0
    },
    singleWidth: {
      // will be overwritten by bandWidth
      type: 'integer',
      default: 200,
      minimum: 0
    },
    // band size
    bandWidth: {
      type: 'integer',
      default: 21,
      minimum: 0
    },
    padding: {
      type: 'number',
      default: 1,
      description: 'default scale padding ratio for ordinal x/y scales.'
    },
    // small multiples
    cellPadding: {
      type: 'integer',
      default: 16,
      description: 'default padding between facets.'
    },
    cellGridColor: {
      type: 'string',
      role: 'color',
      default: '#000000'
    },
    cellGridOpacity: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      default: 0.25
    },
    cellGridOffset: {
      type: 'number',
      default: 6 // equal to tickSize
    },
    cellBackgroundColor: {
      type: 'string',
      role: 'color',
      default: 'rgba(0,0,0,0)'
    },
    cellWidth: {
      type: 'integer',
      default: 150
    },
    cellHeight: {
      type: 'integer',
      default: 150
    },
    textCellWidth: {
      type: 'integer',
      default: 90,
      minimum: 0
    },

    // layout
    // TODO: add orient
    sortLineBy: {
      type: 'string',
      default: undefined,
      description: 'Data field to sort line by. ' +
        '\'-\' prefix can be added to suggest descending order.'
    },
    stack: {
      type: ['boolean', 'object'],
      default: {},
      description: 'Enable stacking (for bar and area marks only).',
      properties: {
        sort: {
          oneOf: [{
            type: 'string',
            enum: ['ascending', 'descending']
          },{
            type: 'array',
            items: {type: 'string'},
          }],
          description: 'Order of the stack. ' +
            'This can be either a string (either "descending" or "ascending")' +
            'or a list of fields to determine the order of stack layers.' +
            'By default, stack uses descending order.'
        },
        offset: {
          type: 'string',
          enum: ['zero', 'center', 'normalize']
          // TODO(#620) refer to Vega spec once it doesn't throw error
          // enum: vgStackSchema.properties.offset.oneOf[0].enum
        }
      }
    },

    // marks
    strokeWidth: {
      type: 'integer',
      default: 2,
      minimum: 0
    },
    singleBarOffset: {
      type: 'integer',
      default: 5,
      minimum: 0
    },
    // other
    characterWidth: {
      type: 'integer',
      default: 6
    },
    numberFormat: {
      type: 'string',
      default: 's',
      description: 'D3 Number format for axis labels and text tables.'
    },
    timeFormat: {
      type: 'string',
      default: '%Y-%m-%d',
      description: 'Date format for axis labels.'
    },
    useRawDomain: {
      type: 'boolean',
      default: false,
      description: 'Use the source data range as scale domain instead of ' +
                   'aggregated data for aggregate axis. ' +
                   'This option does not work with sum or count aggregate' +
                   'as they might have a substantially larger scale range.' +
                   'By default, use value from config.useRawDomain.'
    }
  }
};
