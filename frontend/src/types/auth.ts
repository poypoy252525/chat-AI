// ---------------------------------------------------------------------------
// Auth types
// ---------------------------------------------------------------------------

export interface User {
  id: number;
  email: string;
  username: string;
  // Add any extra fields your User model exposes (e.g. first_name, last_name)
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
  logout: () => Promise<void>;
}
