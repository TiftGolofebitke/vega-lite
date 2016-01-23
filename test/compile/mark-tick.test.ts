// TODO:
// test mark-tick with the following test cases,
// looking at mark-point.test.ts as inspiration
//
// After finishing all test, make sure all lines in mark-tick.ts is tested
// (except the scaffold labels() method)
import {assert} from 'chai';
import {tick} from '../../src/compile/mark-tick';

describe('Mark: Tick', function() {
  it('should return the correct mark type', function() {
    assert.equal(tick.markType(), 'rect');
  });

  describe('with quantitative x', function() {
    it('should be centered on y', function() {
      // TODO
    });

    it('should scale on x', function() {
      // TODO
    });
  });

  describe('with quantitative y', function() {
    it('should be centered on x', function() {
      // TODO
    });

    it('should scale on y', function() {
      // TODO
    });
  });

  describe('with quantitative x and ordinal y', function() {
    it('should scale on x', function() {
      // TODO
    });

    it('should scale on y', function() {
      // TODO
    });
  });
});
