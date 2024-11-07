export interface ITask {
    id: number;
    title: string;
    description: string;
    status: 'incomplete' | 'completed';
    created_at: Date;
}