export interface NameOccurrence {
  name: string;
  username: number;
  password: number;
  both: number;
  gender?: Gender;
  egocentric?: number;
  position?: number;
}

export type Gender = 'female' | 'male';
