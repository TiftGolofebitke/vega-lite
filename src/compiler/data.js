'use strict';

require('../globals');

module.exports = data;

var vlfield = require('../field'),
  util = require('../util'),
  time = require('./time');

/**
 * Create Vega's data array from a given encoding.
 *
 * @param  {Encoding} encoding
 * @return {Array} Array of Vega data.
 *                 This always includes a "raw" data table.
 *                 If the encoding contains aggregate value, this will also create
 *                 aggregate table as well.
 */
function data(encoding) {
  var def = [data.raw(encoding)];

  var aggregate = data.aggregate(encoding);
  if (aggregate) def.push(data.aggregate(encoding));

  // TODO add "having" filter here

  // append non-positive filter at the end for the data table
  data.filterNonPositive(def[def.length - 1], encoding);

  return def;
}

data.raw = function(encoding) {
  var raw = {name: RAW};

  // Data source (url or inline)
  if (encoding.hasValues()) {
    raw.values = encoding.data().values;
  } else {
    raw.url = encoding.data().url;
    raw.format = {type: encoding.data().formatType};
  }

  // Set data's format.parse if needed
  var parse = data.raw.formatParse(encoding);
  if (parse) {
    raw.format = raw.format || {};
    raw.format.parse = parse;
  }

  raw.transform = data.raw.transform(encoding);
  return raw;
};

data.raw.formatParse = function(encoding) {
  var parse;

  encoding.forEach(function(field) {
    if (field.type == T) {
      parse = parse || {};
      parse[field.name] = 'date';
    } else if (field.type == Q) {
      if (vlfield.isCount(field)) return;
      parse = parse || {};
      parse[field.name] = 'number';
    }
  });

  return parse;
};

/**
 * Generate Vega transforms for the raw data table.  This can include
 * transforms for time unit, binning and filtering.
 */
data.raw.transform = function(encoding) {
  // time and bin should come before filter so we can filter by time and bin
  return data.raw.transform.time(encoding).concat(
    data.raw.transform.bin(encoding),
    data.raw.transform.filter(encoding)
  );
};

var BINARY = {
  '>':  true,
  '>=': true,
  '=':  true,
  '!=': true,
  '<':  true,
  '<=': true
};

data.raw.transform.time = function(encoding) {
  return encoding.reduce(function(transform, field, encType) {
    if (field.type === T && field.timeUnit) {
      var fieldRef = encoding.fieldRef(encType, {nofn: true, d: !encoding._vega2, datum: encoding._vega2});

      transform.push({
        type: 'formula',
        field: encoding.fieldRef(encType),
        expr: time.formula(field.timeUnit, fieldRef)
      });
    }
    return transform;
  }, []);
};

data.raw.transform.bin = function(encoding) {
  return encoding.reduce(function(transform, field, encType) {
    if (encoding.bin(encType)) {
      transform.push({
        type: 'bin',
        field: encoding.fieldRef(encType, {nofn: true}),
        output: encoding.fieldRef(encType),
        maxbins: encoding.bin(encType).maxbins
      });
    }
    return transform;
  }, []);
};

data.raw.transform.filter = function(encoding) {
  var filters = encoding.filter().reduce(function(f, filter) {
    var condition = '';
    var operator = filter.operator;
    var operands = filter.operands;

    var d = encoding._vega2 ? 'datum.' : 'd.data.';

    if (BINARY[operator]) {
      // expects a field and a value
      if (operator === '=') {
        operator = '==';
      }

      var op1 = operands[0];
      var op2 = operands[1];
      condition = d + op1 + ' ' + operator + ' ' + op2;
    } else if (operator === 'notNull') {
      // expects a number of fields
      for (var j=0; j<operands.length; j++) {
        condition += d + operands[j] + '!==null';
        if (j < operands.length - 1) {
          condition += ' && ';
        }
      }
    } else {
      util.warn('Unsupported operator: ', operator);
      return f;
    }
    f.push('(' + condition + ')');
    return f;
  }, []);
  if (filters.length === 0) return [];

  return [{
      type: 'filter',
      test: filters.join(' && ')
  }];
};

data.aggregate = function(encoding) {
  var dims = {}, meas = {};

  encoding.forEach(function(field, encType) {
    if (field.aggregate) {
      if (field.aggregate === 'count') {
        meas.count = {op: 'count', field: '*'};
      }else {
        meas[field.aggregate + '|' + field.name] = {
          op: field.aggregate,
          field: encoding.fieldRef(encType, {nofn: true})
        };
      }
    } else {
      dims[field.name] = encoding.fieldRef(encType);
    }
  });

  dims = util.vals(dims);
  meas = util.vals(meas);

  if (meas.length > 0) {
    return {
      name: AGGREGATE,
      source: RAW,
      transform: [{
        type: 'aggregate',
        groupby: dims,
        fields: meas
      }]
    };
  }

  return null;
};

data.filterNonPositive = function(dataTable, encoding) {
  encoding.forEach(function(field, encType) {
    if (encoding.scale(encType).type === 'log') {
      dataTable.transform.push({
        type: 'filter',
        test: encoding.fieldRef(encType, encoding._vega2 ? {datum: 1} : {d: 1}) + ' > 0'
      });
    }
  });
};
