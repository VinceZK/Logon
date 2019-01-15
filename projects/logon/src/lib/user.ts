export class User {
  domain: string;
  username: string;
  userid: string;
  displayName: string;
  name: {
           familyName: string;
           givenName: string;
           middleName: string;
        };
  emails: PluralField[];
  photos: PluralField[];
  phoneNumbers: PluralField[];
  password: string;
  password_r: string;
  pwdState: number;
  locked: boolean;
}
export class PluralField {
  value: string;
  type: string;
  primary: boolean;
}

export class QueryObject {
  ENTITY_ID: string;
  RELATION_ID: string;
  PROJECTION?: Array<string|Projection>;
  FILTER?: Selection[];
  SORT?: Sort[];
}
export class Projection {
  RELATION_ID?: string;
  FIELD_NAME: string;
  ALIAS?: string;
}
export class Selection {
  RELATION_ID?: string;
  FIELD_NAME: string;
  OPERATOR: string;
  LOW: string;
  HIGH?: string;
}
export class Sort {
  FIELD_NAME: string;
  RELATION_ID: string;
  ORDER: string;
}
