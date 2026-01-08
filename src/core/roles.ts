export enum UserRole {
  ADMIN = 'admin',
  SELLER = 'seller',
  CUSTOMER = 'customer',
}

export const USER_ROLES = [UserRole.ADMIN, UserRole.SELLER, UserRole.CUSTOMER] as const;
