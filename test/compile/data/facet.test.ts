import {assert} from 'chai';
import {FacetNode} from '../../../src/compile/data/facet';
import {parseFacetModelWithScale} from '../../util';

describe('compile/data/facet', () => {
  describe('assemble', () => {
    it('should calculate column distinct if child has an independent discrete scale with step', () => {
      const model = parseFacetModelWithScale({
        $schema: 'https://vega.github.io/schema/vega-lite/v2.json',
        description: 'A trellis bar chart showing the US population distribution of age groups and gender in 2000.',
        data: {url: 'data/population.json'},
        facet: {column: {field: 'gender', type: 'nominal'}},
        spec: {
          mark: 'bar',
          encoding: {
            y: {
              aggregate: 'sum',
              field: 'people',
              type: 'quantitative',
              axis: {title: 'population'}
            },
            x: {
              field: 'age',
              type: 'ordinal',
              scale: {rangeStep: 17}
            },
            color: {
              field: 'gender',
              type: 'nominal',
              scale: {range: ['#EA98D2', '#659CCA']}
            }
          }
        },
        resolve: {
          scale: {x: 'independent'}
        },
        config: {view: {fill: 'yellow'}}
      });

      const node = new FacetNode(null, model, 'facetName', 'dataName');
      const data = node.assemble();

      assert.deepEqual(data[0], {
        name: 'column_domain',
        source: 'dataName',
        transform: [
          {
            type: 'aggregate',
            groupby: ['gender'],
            fields: ['age'],
            ops: ['distinct'],
            as: ['distinct_age']
          }
        ]
      });
    });

    it('should calculate column and row distinct if child has an independent discrete scale with step and the facet has both row and column', () => {
      const model = parseFacetModelWithScale({
        $schema: 'https://vega.github.io/schema/vega-lite/v2.json',
        data: {
          values: [
            {r: 'r1', c: 'c1', a: 'a1', b: 'b1'},
            {r: 'r1', c: 'c1', a: 'a2', b: 'b2'},
            {r: 'r2', c: 'c2', a: 'a1', b: 'b1'},
            {r: 'r3', c: 'c2', a: 'a3', b: 'b2'}
          ]
        },
        facet: {
          row: {field: 'r', type: 'nominal'},
          column: {field: 'c', type: 'nominal'}
        },
        spec: {
          mark: 'rect',
          encoding: {
            y: {field: 'b', type: 'nominal'},
            x: {field: 'a', type: 'nominal'}
          }
        },
        resolve: {
          scale: {
            x: 'independent',
            y: 'independent'
          }
        }
      });

      const node = new FacetNode(null, model, 'facetName', 'dataName');
      const data = node.assemble();

      // crossed data
      assert.deepEqual(data[0], {
        name: 'cross_column_domain_row_domain',
        source: 'dataName',
        transform: [
          {
            type: 'aggregate',
            groupby: ['c', 'r'],
            fields: ['a', 'b'],
            ops: ['distinct', 'distinct']
          }
        ]
      });

      assert.deepEqual(data[1], {
        name: 'column_domain',
        source: 'cross_column_domain_row_domain',
        transform: [
          {
            type: 'aggregate',
            groupby: ['c'],
            fields: ['distinct_a'],
            ops: ['max'],
            as: ['distinct_a']
          }
        ]
      });

      assert.deepEqual(data[2], {
        name: 'row_domain',
        source: 'cross_column_domain_row_domain',
        transform: [
          {
            type: 'aggregate',
            groupby: ['r'],
            fields: ['distinct_b'],
            ops: ['max'],
            as: ['distinct_b']
          }
        ]
      });
    });

    it('should calculate column and row sort array', () => {
      const model = parseFacetModelWithScale({
        $schema: 'https://vega.github.io/schema/vega-lite/v2.json',
        data: {
          name: 'a'
        },
        facet: {
          row: {field: 'r', type: 'nominal', sort: ['r1', 'r2']},
          column: {field: 'c', type: 'nominal', sort: ['c1', 'c2']}
        },
        spec: {
          mark: 'rect',
          encoding: {
            y: {field: 'b', type: 'quantitative'},
            x: {field: 'a', type: 'quantitative'}
          }
        }
      });

      const node = new FacetNode(null, model, 'facetName', 'dataName');
      const data = node.assemble();

      assert.deepEqual(data[0], {
        name: 'column_domain',
        source: 'dataName',
        transform: [
          {
            type: 'aggregate',
            groupby: ['c'],
            fields: ['column_c_sort_index'],
            ops: ['max'],
            as: ['column_c_sort_index']
          }
        ]
      });

      assert.deepEqual(data[1], {
        name: 'row_domain',
        source: 'dataName',
        transform: [
          {
            type: 'aggregate',
            groupby: ['r'],
            fields: ['row_r_sort_index'],
            ops: ['max'],
            as: ['row_r_sort_index']
          }
        ]
      });
    });

    it('should calculate column and row sort field', () => {
      const model = parseFacetModelWithScale({
        $schema: 'https://vega.github.io/schema/vega-lite/v2.json',
        data: {
          name: 'a'
        },
        facet: {
          row: {field: 'r', type: 'nominal', sort: {op: 'median', field: 'b'}},
          column: {field: 'c', type: 'nominal', sort: {op: 'median', field: 'a'}}
        },
        spec: {
          mark: 'rect',
          encoding: {
            y: {field: 'b', type: 'quantitative'},
            x: {field: 'a', type: 'quantitative'}
          }
        }
      });

      const node = new FacetNode(null, model, 'facetName', 'dataName');
      const data = node.assemble();

      assert.deepEqual(data[0], {
        name: 'column_domain',
        source: 'dataName',
        transform: [
          {
            type: 'aggregate',
            groupby: ['c'],
            fields: ['a'],
            ops: ['median'],
            as: ['median_a']
          }
        ]
      });

      assert.deepEqual(data[1], {
        name: 'row_domain',
        source: 'dataName',
        transform: [
          {
            type: 'aggregate',
            groupby: ['r'],
            fields: ['b'],
            ops: ['median'],
            as: ['median_b']
          }
        ]
      });
    });
  });

  describe('hash', () => {
    it('should generate the correct hash', () => {
      const model = parseFacetModelWithScale({
        $schema: 'https://vega.github.io/schema/vega-lite/v2.json',
        data: {
          name: 'a'
        },
        facet: {
          row: {field: 'r', type: 'nominal', sort: {op: 'median', field: 'b'}},
          column: {field: 'c', type: 'nominal', sort: {op: 'median', field: 'a'}}
        },
        spec: {
          mark: 'rect',
          encoding: {
            y: {field: 'b', type: 'quantitative'},
            x: {field: 'a', type: 'quantitative'}
          }
        }
      });

      const facetNode = new FacetNode(null, model, 'facetName', 'dataName');

      expect(facetNode.hash()).toEqual(
        'Facet c:{"fields":["c"],"name":"column_domain","sortField":{"field":"a","op":"median"}} r:{"fields":["r"],"name":"row_domain","sortField":{"field":"b","op":"median"}}'
      );
    });
  });
});
