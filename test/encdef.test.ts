import {expect} from 'chai';

import * as vlFieldDef from '../src/encdef';
import {Type} from '../src/consts';


describe('vl.fieldDef.cardinality()', function () {
  describe('for Q', function () {
    it('should return cardinality', function() {
      var fieldDef = {name:2, type:'quantitative'};
      var stats = {2:{distinct: 10, min:0, max:150}};
      var cardinality = vlFieldDef.cardinality(fieldDef, stats);
      expect(cardinality).to.equal(10);
    });
  });

  describe('for B(Q)', function(){
    it('should return cardinality', function() {
      var fieldDef = {name:2, type:'quantitative', bin: {maxbins: 15}};
      var stats = {2:{distinct: 10, min:0, max:150}};
      var cardinality = vlFieldDef.cardinality(fieldDef, stats);
      expect(cardinality).to.equal(15);
    });
  });
});

describe('vl.fieldDef.isTypes', function () {
  it('should return correct type checking', function() {
    var qDef = {name: 'number', type:'quantitative'};
    expect(qDef.type === Type.Quantitative).to.eql(true);
    expect(vlFieldDef.isTypes(qDef, [Type.Quantitative])).to.eql(true);
    expect(vlFieldDef.isTypes(qDef, [Type.Quantitative, Type.Ordinal])).to.eql(true);
    expect(vlFieldDef.isTypes(qDef, [Type.Ordinal, Type.Quantitative])).to.eql(true);
    expect(vlFieldDef.isTypes(qDef, [Type.Quantitative, Type.Nominal])).to.eql(true);
    expect(vlFieldDef.isTypes(qDef, [Type.Nominal])).to.eql(false);
  });
});
