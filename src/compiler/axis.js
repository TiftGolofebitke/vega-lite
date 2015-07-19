'use strict';

require('../globals');

var util = require('../util'),
  setter = util.setter,
  getter = util.getter,
  time = require('./time');

var axis = module.exports = {};

axis.names = function(props) {
  return util.keys(util.keys(props).reduce(function(a, x) {
    var s = props[x].scale;
    if (s === X || s === Y) a[props[x].scale] = 1;
    return a;
  }, {}));
};

axis.defs = function(names, encoding, layout, stats, opt) {
  return names.reduce(function(a, name) {
    a.push(axis.def(name, encoding, layout, stats, opt));
    return a;
  }, []);
};

axis.def = function(name, encoding, layout, stats, opt) {
  var isCol = name == COL,
    isRow = name == ROW,
    type = isCol ? 'x' : isRow ? 'y' : name,
    rowOffset = axis.titleOffset(encoding, layout, Y) + 20;

  var def = {
    type: type,
    scale: name,
    properties: {}
  };

  def = axis.grid(def, name, encoding, layout, rowOffset);
  def = axis.title(def, name, encoding, layout, opt);

  def.titleOffset = axis.titleOffset(encoding, layout, name);

  if (isRow || isCol) {
    def = axis.hideTicks(def);
  }

  if (isCol) {
    def.orient = 'top';
  }

  if (isRow) {
    def.offset = rowOffset;
  }

  if (name == X) {
    if (encoding.has(Y) && encoding.isOrdinalScale(Y) && encoding.cardinality(Y, stats) > 30) {
      def.orient = 'top';
    }

    if (encoding.isDimension(X) || encoding.isType(X, T)) {
      var isTop = def.orient ==='top',
        labelProps = isTop ? {
            angle: {value: 90},
            align: {value: 'left'},
            baseline: {value: 'middle'}
          } : {
            angle: {value: 270},
            align: {value: 'right'},
            baseline: {value: 'middle'}
          };

      setter(def, ['properties','labels'], labelProps);
    } else { // Q
      def.ticks = 5;
    }
  }

  def = axis.labels(def, name, encoding, layout, stats, opt);

  return def;
};

axis.grid = function(def, name, encoding, layout, rowOffset) {
  var cellPadding = layout.cellPadding,
    isCol = name == COL,
    isRow = name == ROW;

  if (encoding.axis(name).grid) {
    def.grid = true;
    def.layer = 'back';

    if (isCol) {
      // set grid property -- put the lines on the right the cell
      def.properties.grid = {
        x: {
          offset: layout.cellWidth * (1+ cellPadding/2.0),
          // default value(s) -- vega doesn't do recursive merge
          scale: 'col'
        },
        y: {
          value: -layout.cellHeight * (cellPadding/2),
        },
        stroke: { value: encoding.config('cellGridColor') },
        opacity: { value: encoding.config('cellGridOpacity') }
      };
    } else if (isRow) {
      // set grid property -- put the lines on the top
      def.properties.grid = {
        y: {
          offset: -layout.cellHeight * (cellPadding/2),
          // default value(s) -- vega doesn't do recursive merge
          scale: 'row'
        },
        x: {
          value: rowOffset
        },
        x2: {
          offset: rowOffset + (layout.cellWidth * 0.05),
          // default value(s) -- vega doesn't do recursive merge
          group: 'mark.group.width',
          mult: 1
        },
        stroke: { value: encoding.config('cellGridColor') },
        opacity: { value: encoding.config('cellGridOpacity') }
      };
    } else {
      def.properties.grid = {
        stroke: { value: encoding.config('gridColor') },
        opacity: { value: encoding.config('gridOpacity') }
      };
    }
  }
  return def;
};

axis.hideTicks = function(def) {
  setter(def, ['properties', 'ticks'], {
    opacity: {value: 0}
  });
  setter(def, ['properties', 'majorTicks'], {
    opacity: {value: 0}
  });
  setter(def, ['properties', 'axis'], {
    opacity: {value: 0}
  });
  return def;
};

axis.title = function (def, name, encoding, layout) {
  if (!encoding.axis(name).title) return def;

  var maxlength = null,
    fieldTitle = encoding.fieldTitle(name);
  if (name===X) {
    maxlength = layout.cellWidth / encoding.config('characterWidth');
  } else if (name === Y) {
    maxlength = layout.cellHeight / encoding.config('characterWidth');
  }

  def.title = maxlength ? util.truncate(fieldTitle, maxlength) : fieldTitle;

  if (name === ROW) {
    setter(def, ['properties','title'], {
      angle: {value: 0},
      align: {value: 'right'},
      baseline: {value: 'middle'},
      dy: {value: (-layout.height/2) -20}
    });
  }

  return def;
};

axis.labels = function (def, name, encoding, layout, stats, opt) {
  // jshint unused:false

  var timeUnit = encoding.field(name).timeUnit,
    fieldStats = stats[encoding.field(name).name];

  // add custom label for time type
  if (encoding.isType(name, T) && timeUnit && (time.hasScale(timeUnit))) {
    setter(def, ['properties','labels','text','scale'], 'time-'+ timeUnit);
  }

  if (encoding.axis(name).format) {
    def.format = encoding.axis(name).format;
  } else if (encoding.isType(name, Q) || fieldStats.type === 'number') {
    def.format = encoding.numberFormat(fieldStats);
  } else if (encoding.isType(name, T)) {
    if (!timeUnit) {
      def.format = encoding.config('timeFormat');
    } else if (timeUnit === 'year') {
      def.format = 'd';
    }
  } else if (encoding.isTypes(name, [N, O]) && encoding.axis(name).maxLabelLength) {
    var textTemplatePath = ['properties','labels','text','template'];
    setter(def, textTemplatePath, '{{data | truncate:' + encoding.axis(name).maxLabelLength + '}}');
  } else {
    // nothing
  }

  return def;
};

axis.titleOffset = function (encoding, layout, name) {
  var value = encoding.axis(name).titleOffset;
  if (value) {
    return value;
  }
  switch (name) {
    //FIXME make this adjustable
    case ROW: return 0;
    case COL: return 35;
  }
  return getter(layout, [name, 'axisTitleOffset']);
};
