// utility for field

var consts = require('./consts'),
  time = require('./compile/time');

var field = module.exports = {};

field.shorthand = function(f) {
  return (f.aggr ? f.aggr + '_' : '') +
    (f.fn ? f.fn + '_' : '') +
    (f.bin ? 'bin_' : '') +
    (f.name || '') + '-' +
    (consts.dataTypeNames[f.type] || f.type);
};

field.shorthands = function(fields, delim){
  delim = delim || ',';
  return fields.map(field.shorthand).join(delim);
};

var typeOrder = {
  O: 0,
  G: 1,
  T: 2,
  Q: 3
};

field.order = {};

field.order.typeThenName = function(field) {
  return typeOrder[field.type] + '_' + field.name;
};

field.order.original = function() {
  return 0; // no swap will occur
};

field.order.name = function(field) {
  return field.name;
};

field.order.typeThenCardinality = function(field, stats){
  return stats[field.name].cardinality;
};

field.isOrdinalScale = function(field, isType /*optional*/) {
  isType = isType || function(field, type) {
    return field.type === consts.dataTypeNames[type];
  };

  var fn;
  return  isType(field, O) || field.bin ||
    ( isType(field, T) && field.fn && time.isOrdinalFn(field.fn) );
};
