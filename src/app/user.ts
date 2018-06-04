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

class PluralField {
  value: string;
  type: string;
  primary: boolean;
}
