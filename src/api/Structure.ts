export interface Structure {
  id: string;
  name: string;
  completed: boolean;
  materials: Material[];
  stability: number;
}
interface Material {
  good: string;
  quantity: number;
  targetQuantity: number;
}
