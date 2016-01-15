import * as vlBin from './bin';
import * as vlChannel from './channel';
import * as vlData from './data';
import * as vlEncoding from './encoding';
import * as vlFieldDef from './fielddef';
import * as vlCompile from './compile/compile';
import * as vlSchema from './schema/schema';
import * as vlShorthand from './shorthand';
import * as vlSpec from './spec';
import * as vlTimeUnit from './timeunit';
import * as vlType from './type';
import * as vlValidate from './validate';
import * as vlUtil from './util';

export var bin = vlBin;
export var channel = vlChannel;
export var compile = vlCompile.compile;
export var data = vlData;
export var encoding = vlEncoding;
export var fieldDef = vlFieldDef;
export var schema = vlSchema;
export var shorthand = vlShorthand;
export var spec = vlSpec;
export var timeUnit = vlTimeUnit;
export var type = vlType;
export var util = vlUtil;
export var validate = vlValidate;

export const version = '__VERSION__';
