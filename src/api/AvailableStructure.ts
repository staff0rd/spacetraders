export interface AvailableStructure {
  type: string;
  name: string;
  price: number;
  allowedLocationTypes: string[];
  consumes: string[];
  produces: string[];
}
