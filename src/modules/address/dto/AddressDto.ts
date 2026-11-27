export interface CreateAddressDto {
  type: 'shipping' | 'billing' | 'both';
  fullName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export type UpdateAddressDto = Partial<Omit<CreateAddressDto, 'type'>> & {
  type?: CreateAddressDto['type'];
};
