'use strict';

var dl = require('datalib');

var vldata = module.exports = {},
  vlfield = require('./field'),
  util = require('./util');

vldata.getUrl = function getDataUrl(encoding, stats) {
  if (!encoding.data('vegaServer')) {
    // don't use vega server
    return encoding.data('url');
  }

  if (encoding.length() === 0) {
    // no fields
    return;
  }

  var fields = [];
  encoding.forEach(function(field, encType) {
    var obj = {
      name: encoding.field(encType, true),
      field: field.name
    };
    if (field.aggr) {
      obj.aggr = field.aggr;
    }
    if (field.bin) {
      obj.binSize = util.getbins(stats[field.name], encoding.bin(encType).maxbins).step;
    }
    fields.push(obj);
  });

  var query = {
    table: encoding.data('vegaServer').table,
    fields: fields
  };

  return encoding.data('vegaServer').url + '/query/?q=' + JSON.stringify(query);
};

vldata.types = {
  'boolean': 'O',
  'number': 'Q',
  'integer': 'Q',
  'date': 'T',
  'string': 'O'
};

vldata.getStats = function(data) {
  var stats = {},
    fields = util.keys(data[0]);

  fields.forEach(function(k) {
    var stat = dl.profile(data, function(d) {
      return d[k];
    });

    stat.maxlength = data.reduce(function(max,row) {
      if (row[k] === null) {
        return max;
      }
      var len = row[k].toString().length;
      return len > max ? len : max;
    }, 0);

    var sample = {};
    while(Object.keys(sample).length < Math.min(stat.distinct, 10)) {
      var value = data[Math.floor(Math.random() * data.length)][k];
      sample[value] = true;
    }
    stat.sample = Object.keys(sample);

    stats[k] = stat;
  });

  stats.count = data.length;
  return stats;
};
