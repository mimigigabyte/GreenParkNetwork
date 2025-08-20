export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?: string;
  avatar_url?: string;
  company_name?: string;
  role?: 'admin' | 'user';
}