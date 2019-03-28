export interface NameOccurrence {
  name: string;
  username: number;
  password: number;
  both: number;
  gender?: Gender;
}

export type Gender = 'female' | 'male';
