import {Config} from '../config';
import {ResolveMapping} from '../resolve';
import {BaseSpec} from '../spec';
import {keys} from '../util';
import {VgData, VgScale, VgSignal} from '../vega.schema';
import {assembleData} from './data/assemble';
import {parseData} from './data/parse';
import {assembleLayoutSignals} from './layout/assemble';
import {Model} from './model';
import {assembleScaleForModelAndChildren} from './scale/assemble';

export abstract class BaseConcatModel extends Model {
  constructor(spec: BaseSpec, parent: Model, parentGivenName: string, config: Config, resolve: ResolveMapping) {
    super(spec, parent, parentGivenName, config, resolve);
  }

  public parseData() {
    this.component.data = parseData(this);
    this.children.forEach((child) => {
      child.parseData();
    });
  }
  public parseSelection() {
    // Merge selections up the hierarchy so that they may be referenced
    // across unit specs. Persist their definitions within each child
    // to assemble signals which remain within output Vega unit groups.
    this.component.selection = {};
    for (const child of this.children) {
      child.parseSelection();
      keys(child.component.selection).forEach((key) => {
        this.component.selection[key] = child.component.selection[key];
      });
    }
  }

  public parseMarkGroup() {
    for (const child of this.children) {
      child.parseMarkGroup();
    }
  }

  public parseAxisAndHeader() {
    for (const child of this.children) {
      child.parseAxisAndHeader();
    }

    // TODO(#2415): support shared axes
  }

  public assembleData(): VgData[] {
     if (!this.parent) {
      // only assemble data in the root
      return assembleData(this.component.data);
    }

    return [];
  }

  public assembleScales(): VgScale[] {
    return assembleScaleForModelAndChildren(this);
  }

  public assembleSelectionTopLevelSignals(signals: any[]): VgSignal[] {
    return this.children.reduce((sg, child) => child.assembleSelectionTopLevelSignals(sg), signals);
  }

  public assembleSelectionSignals(): VgSignal[] {
    this.children.forEach((child) => child.assembleSelectionSignals());
    return [];
  }

  public assembleLayoutSignals(): VgSignal[] {
    return this.children.reduce((signals, child) => {
      return signals.concat(child.assembleLayoutSignals());
    }, assembleLayoutSignals(this));
  }

  public assembleSelectionData(data: VgData[]): VgData[] {
    return this.children.reduce((db, child) => child.assembleSelectionData(db), []);
  }

  public assembleMarks(): any[] {
    // only children have marks
    return this.children.map(child => {
      const title = child.assembleTitle();
      const style = child.assembleGroupStyle();
      const layoutSizeEncodeEntry = child.assembleLayoutSize();
      return {
        type: 'group',
        name: child.getName('group'),
        ...(title ? {title} : {}),
        ...(style ? {style} : {}),
        ...(layoutSizeEncodeEntry ? {
          encode: {
            update: layoutSizeEncodeEntry
          }
        } : {}),
        ...child.assembleGroup()
      };
    });
  }
}
