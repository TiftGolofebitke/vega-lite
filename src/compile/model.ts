import {AxisProperties} from '../axis';
import {Channel, X, COLUMN} from '../channel';
import {Config, CellConfig} from '../config';
import {Data, DataTable} from '../data';
import {channelMappingReduce, channelMappingForEach} from '../encoding';
import {FieldDef, FieldRefOption, field} from '../fielddef';
import {LegendProperties} from '../legend';
import {Scale, ScaleType} from '../scale';
import {BaseSpec} from '../spec';
import {Transform} from '../transform';
import {extend, mergeArrays, vals, Dict} from '../util';
import {VgData, VgMarkGroup, VgScale, VgAxis, VgLegend} from '../vega.schema';

import {DataComponent} from './data';
import {LayoutComponent} from './layout';
import {ScaleComponent} from './scale';

// FIXME remove this
export interface ScaleMap {
  x?: Scale;
  y?: Scale;
  row?: Scale;
  column?: Scale;
  color?: Scale;
  size?: Scale;
  shape?: Scale;
};

export interface Component {
  data: DataComponent;
  layout: LayoutComponent;
  scale: Dict<ScaleComponent>;
  axis: Dict<VgAxis>;
  legend: Dict<VgLegend>;

  /** storing axes group for facet and concat */
  axisGroup: Dict<VgMarkGroup>;
  /** storing grid group for facet (and concat?) */
  gridGroup: Dict<VgMarkGroup[]>;

  mark: VgMarkGroup[];
}

class NameMap {
  private _nameMap: Dict<string>;

  constructor() {
    this._nameMap = {} as Dict<string>;
  }

  public rename(oldName, newName) {
    this._nameMap[oldName] = newName;
  }

  public get(name) {
    // If the name appear in the _nameMap, we need to read its new name.
    // We have to loop over the dict just in case, the new name also gets renamed.
    while (this._nameMap[name]) {
      name = this._nameMap[name];
    }

    return name;
  }
}

export abstract class Model {
  protected _parent: Model;
  protected _name: string;
  protected _description: string;

  protected _data: Data;

  /** Name map for data sources, which can be renamed by a model's parent. */
  protected _dataNameMap: NameMap;

  /** Name map for scales, which can be renamed by a model's parent. */
  protected _scaleNameMap: NameMap;

  /** Name map for size, which can be renamed by a model's parent. */
  protected _sizeNameMap: NameMap;

  protected _transform: Transform;
  protected _scale: ScaleMap;

  protected _axis: {
    x?: AxisProperties;
    y?: AxisProperties;
    row?: AxisProperties;
    column?: AxisProperties;
  };

  protected _legend: {
    color?: LegendProperties;
    size?: LegendProperties;
    shape?: LegendProperties;
  };

  protected _config: Config;

  protected _warnings: string[] = [];

  public component: Component;

  constructor(spec: BaseSpec, parent: Model, parentGivenName: string) {
    this._parent = parent;

    // If name is not provided, always use parent's givenName to avoid name conflicts.
    this._name = spec.name || parentGivenName;

    // Have a shared name maps
    this._dataNameMap = parent ? parent._dataNameMap : new NameMap();
    this._scaleNameMap = parent ? parent._scaleNameMap : new NameMap();
    this._sizeNameMap = parent ? parent._sizeNameMap : new NameMap();

    this._data = spec.data;

    this._description = spec.description;
    this._transform = spec.transform;

    this.component = {data: {}, layout: null, mark: null, scale: null, axis: null, axisGroup: null, gridGroup: null, legend: null};
  }


  public parse() {
    this.parseData();
    this.parseSelectionData();
    this.parseLayoutData();
    this.parseScale(); // depends on data name
    this.parseAxis(); // depends on scale name
    this.parseLegend(); // depends on scale name
    this.parseAxisGroup(); // depends on child axis
    this.parseGridGroup();
    this.parseMark(); // depends on data name and scale name, axisGroup, gridGroup and children's scale, axis, legend and mark.
  }

  public abstract parseData();

  public abstract parseSelectionData();

  public abstract parseLayoutData();

  public abstract parseScale();

  public abstract parseMark();

  public abstract parseAxis();

  public abstract parseLegend();

  // TODO: revise if these two methods make sense for shared scale concat
  public abstract parseAxisGroup();
  public abstract parseGridGroup();


  public abstract assembleData(data: VgData[]): VgData[];

  public abstract assembleLayout(layoutData: VgData[]): VgData[];

  // TODO: for Arvind to write
  // public abstract assembleSelectionSignal(layoutData: VgData[]): VgData[];
  // public abstract assembleSelectionData(layoutData: VgData[]): VgData[];

  public assembleScales(): VgScale[] {
    // FIXME: this should help assemble scale domains with scale signature as well
    return mergeArrays(vals(this.component.scale));
  }

  public abstract assembleMarks(): any[]; // TODO: VgMarkGroup[]

  public assembleAxes(): VgAxis[] {
    return vals(this.component.axis);
  }

  public assembleLegends(): any[] { // TODO: VgLegend[]
    return vals(this.component.legend);
  }

  public assembleGroup() {
    let group: VgMarkGroup = {};

    // TODO: consider if we want scales to come before marks in the output spec.

    group.marks = this.assembleMarks();
    const scales = this.assembleScales();
    if (scales.length > 0) {
      group.scales = scales;
    }

    const axes = this.assembleAxes();
    if (axes.length > 0) {
      group.axes = axes;
    }

    const legends = this.assembleLegends();
    if (legends.length > 0) {
      group.legends = legends;
    }

    return group;
  }

  public abstract assembleParentGroupProperties(cellConfig: CellConfig);

  public abstract channels(): Channel[];

  protected abstract mapping();

  public reduce(f: (acc: any, fd: FieldDef, c: Channel) => any, init, t?: any) {
    return channelMappingReduce(this.channels(), this.mapping(), f, init, t);
  }

  public forEach(f: (fd: FieldDef, c: Channel, i:number) => void, t?: any) {
    channelMappingForEach(this.channels(), this.mapping(), f, t);
  }

  public abstract has(channel: Channel): boolean;

  public parent(): Model {
    return this._parent;
  }

  public name(text: string, delimiter: string = '-') {
    return (this._name ? this._name + delimiter : '') + text;
  }

  public description() {
    return this._description;
  }

  public data() {
    return this._data;
  }

  public renameData(oldName: string, newName: string) {
     this._dataNameMap.rename(oldName, newName);
  }

  /**
   * Return the data source name for the given data source type.
   *
   * For unit spec, this is always simply the spec.name + '-' + dataSourceType.
   * However, for composite specs, data sources might get merged, thus we have to
   */
  public dataName(dataSourceType: DataTable): string {
    return this._dataNameMap.get(this.name(dataSourceType + ''));
  }

  public renameSize(oldName: string, newName: string) {
    this._sizeNameMap.rename(oldName, newName);
  }

  public channelSizeName(channel: Channel) {
    return this.sizeName(channel === X || channel === COLUMN ? 'width' : 'height');
  }

  public sizeName(size: string) {
     return this._sizeNameMap.get(this.name(size, '_'));
  }

  public abstract dataTable(): string;

  public transform() {
    return this._transform || {};
  }

  /** Get "field" reference for vega */
  public field(channel: Channel, opt: FieldRefOption = {}) {
    const fieldDef = this.fieldDef(channel);

    if (fieldDef.bin) { // bin has default suffix that depends on scaleType
      opt = extend({
        binSuffix: this.scale(channel).type === ScaleType.ORDINAL ? '_range' : '_start'
      }, opt);
    }

    return field(fieldDef, opt);
  }

  public abstract fieldDef(channel: Channel): FieldDef;

  public scale(channel: Channel): Scale {
    return this._scale[channel];
  }

  // TODO: rename to hasOrdinalScale
  public isOrdinalScale(channel: Channel) {
    const scale = this.scale(channel);
    return scale && scale.type === ScaleType.ORDINAL;
  }

  public renameScale(oldName: string, newName: string) {
    this._scaleNameMap.rename(oldName, newName);
  }

  /** returns scale name for a given channel */
  public scaleName(channel: Channel|string): string {
    return this._scaleNameMap.get(this.name(channel + ''));
  }

  public sort(channel: Channel) {
    return (this.mapping()[channel] || {}).sort;
  }

  public abstract stack();

  public axis(channel: Channel): AxisProperties {
    return this._axis[channel];
  }

  public legend(channel: Channel): LegendProperties {
    return this._legend[channel];
  }

  /**
   * Get the spec configuration.
   */
  public config() {
    return this._config;
  }

  public addWarning(message: string) {
    this._warnings.push(message);
  }

  public warnings(): string[] {
    return this._warnings;
  }
}
