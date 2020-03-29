export class PermissionList {
  NAME: string;
  DESCRIPTION: string;
  CREATED_BY: string;
  CREATE_TIME: string;
  CHANGED_BY: string;
  CHANGE_TIME: string;
  INSTANCE_GUID: string;
}

export class UserList {
  USER_ID: string;
  USER_NAME: string;
  DISPLAY_NAME: string;
  LOCK: boolean;
  PWD_STATE: string;
  INSTANCE_GUID: string;
}

export class AppList {
  APP_ID: string;
  NAME: string;
  ROUTE_LINK: string;
  IS_EXTERNAL: boolean;
  CREATED_BY: string;
  CREATE_TIME: string;
  CHANGED_BY: string;
  CHANGE_TIME: string;
  INSTANCE_GUID: string;
}

export class AuthObjList {
  OBJ_NAME: string;
  DESC: string;
  CREATED_BY: string;
  CREATE_TIME: string;
  CHANGED_BY: string;
  CHANGE_TIME: string;
  INSTANCE_GUID: string;
}

export class AuthProfileList {
  PROFILE_NAME: string;
  DESC: string;
  CREATED_BY: string;
  CREATE_TIME: string;
  CHANGED_BY: string;
  CHANGE_TIME: string;
  INSTANCE_GUID: string;
}

export class AppCategoryList {
  ID: string;
  ICON: string;
  NAME: string;
  TYPE: string;
  CREATED_BY: string;
  CREATE_TIME: string;
  CHANGED_BY: string;
  CHANGE_TIME: string;
  INSTANCE_GUID: string;
}

export class Authorization {
  AuthObject: string;
  AuthFieldValue: AuthFieldValue;
}

export class AuthFieldValue {
  [key: string]: Array<string | SelectOption>;
}

export class SelectOption {
  Operator: Operator;
  Option: Option;
  Low: string | number;
  High: string | number;
}

export enum Operator {
  Between = 'Between',
  GreaterThan = 'GreaterThan',
  LessThan = 'LessThan',
  GreaterEqual = 'GreaterEqual',
  LessEqual = 'LessEqual',
  Equal = 'Equal',
  NotEqual = 'NotEqual',
  StartsWith = 'StartsWith',
  EndsWith = 'EndsWith',
  Contains = 'Contains',
  Matches = 'Matches'
}

export enum Option {
  Include = 'Include',
  Exclude = 'Exclude'
}
