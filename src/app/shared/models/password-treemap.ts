export interface PasswordTreemap {
    name: string;
    children: Category[];
}

export interface Category {
    name: string;
    children: Node[];
}

export interface Node {
    name: string;
    value: number;
}
