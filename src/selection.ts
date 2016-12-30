export enum SelectionTypes {
  SINGLE = 'single' as any,
  MULTI  = 'multi'  as any,
  INTERVAL = 'interval' as any
}

export enum SelectionDomain {
  DATA = 'data' as any,
  VISUAL = 'visual'  as any
}

export enum SelectionResolutions {
  SINGLE = 'single' as any,
  INDEPENDENT = 'independent' as any,
  UNION = 'union' as any,
  UNION_OTHERS = 'union_others' as any,
  INTERSECT = 'intersect' as any,
  INTERSECT_OTHERS = 'intersect_others' as any
}

export interface SelectionSpec {
  type: SelectionTypes;
  domain?: SelectionDomain;
  on: any;
  predicate: string;
  bind: any;

  // Transforms
  project?: ProjectSpec;
  toggle?: string | boolean;
  translate?: any;
  zoom?: any;
  nearest?: any;
}

export interface ProjectSpec {
  fields?: string[];
  encodings?: string[];
}

export interface SelectionComponent {
  name: string;
  type: SelectionTypes;
  domain: SelectionDomain;
  events: any;
  predicate: string;
  bind: any;
  resolve: SelectionResolutions;

  // Transforms
  project?: any;
  toggle?: any;
  translate?: any;
  zoom?: any;
  nearest?: any;
}
