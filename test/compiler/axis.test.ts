import {expect} from 'chai';

import * as axis from '../../src/compiler/axis';
import {Model} from '../../src/compiler/Model';

describe('Axis', function() {
  var layout = {
      cellWidth: 60,  // default characterWidth = 6
      cellHeight: 60
    };

  describe('(X) for Time Data', function() {
    var field = 'a',
      timeUnit = 'month',
      encoding = new Model({
        marktype: 'line',
        encoding: {
          x: {field: field, type: 'temporal', timeUnit: timeUnit}
        }
      });
    var _axis = axis.compileAxis('x', encoding);

    //FIXME decouple the test here

    it('should use custom label', function() {
      expect(_axis.properties.labels.text.template).to.equal('{{datum.data | month}}');
    });
    it('should rotate label', function() {
      expect(_axis.properties.labels.angle.value).to.equal(270);
    });
  });


  describe('grid()', function () {
    // FIXME(kanitw): Jul 19, 2015 - write test
  });

  describe('orient()', function () {
    it('should return specified orient', function () {
      var orient = axis.orient(new Model({
          encoding: {
            x: {field: 'a', axis:{orient: 'bottom'}}
          }
        }), 'x');
      expect(orient).to.eql('bottom');
    });

    it('should return undefined by default', function () {
      var orient = axis.orient(new Model({
          encoding: {
            x: {field: 'a'}
          }
        }), 'x');
      expect(orient).to.eql(undefined);
    });

    it('should return top for COL', function () {
      var orient = axis.orient(new Model({
          encoding: {
            x: {field: 'a'},
            column: {field: 'a'}
          }
        }), 'column');
      expect(orient).to.eql('top');
    });
  });

  describe('title()', function () {
    it('should add explicitly specified title', function () {
      var title = axis.title(new Model({
          encoding: {
            x: {field: 'a', axis: {title: 'Custom'}}
          }
        }), 'x');
      expect(title).to.eql('Custom');
    });

    it('should add return fieldTitle by default', function () {
      var title = axis.title(new Model({
          encoding: {
            x: {field: 'a', type: 'Q', axis: {titleMaxLength: 3}}
          }
        }), 'x');
      expect(title).to.eql('a');
    });

    it('should add return fieldTitle by default', function () {
      var title = axis.title(new Model({
          encoding: {
            x: {field: 'a', type: 'Q', aggregate: 'sum', axis: {titleMaxLength: 10}}
          }
        }), 'x');
      expect(title).to.eql('SUM(a)');
    });

    it('should add return fieldTitle by default and truncate', function () {
      var title = axis.title(new Model({
          encoding: {
            x: {field: 'a', type: 'Q', aggregate: 'sum', axis: {titleMaxLength: 3}}
          }
        }), 'x');
      expect(title).to.eql('SU…');
    });


    it('should add return fieldTitle by default and truncate', function () {
      var title = axis.title(new Model({
          encoding: {
            x: {field: 'abcdefghijkl'}
          },
          config: {
            singleWidth: 60
          }
        }), 'x');
      expect(title).to.eql('abcdefghi…');
    });
  });

  describe('titleOffset()', function () {
    // FIXME(kanitw): Jul 19, 2015 - write test
  });
});
