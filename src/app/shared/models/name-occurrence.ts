export interface NameOccurrence {
  name: string;
  username: number;
  password: number;
  both: number;
  gender?: Gender;
  egocentric?: number;
}

export type Gender = 'female' | 'male';
