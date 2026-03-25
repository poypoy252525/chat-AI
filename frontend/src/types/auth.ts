// ---------------------------------------------------------------------------
// Auth types
// ---------------------------------------------------------------------------

export interface User {
  pk: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean; // true while the initial session check is in-flight
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password1: string;
  password2: string;
}
