export interface CreateShippingMethodDto {
  name: string;
  description?: string;
  baseCost: number;
  costPerKg?: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  countries?: string[];
  freeShippingThreshold?: number;
  isActive?: boolean;
}

export type UpdateShippingMethodDto = Partial<CreateShippingMethodDto>;
