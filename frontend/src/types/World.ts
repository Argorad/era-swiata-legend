export interface World {
    id: string;
    name: string;
    description: string;
    status: 0 | 1;
    createdAt: string;
    updatedAt: string | null;
}