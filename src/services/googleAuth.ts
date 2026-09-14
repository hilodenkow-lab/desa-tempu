import { GoogleUserProfile } from '../types';

const DEFAULT_CLIENT_ID = '908579224073-mfgksp679e0vgh3e811r47h083omr5p2.apps.googleusercontent.com';
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

export interface AuthState {
  isAuthenticated: boolean;
  isSimulated: boolean;
  accessToken: string | null;
  expiresAt: number | null;
  user: GoogleUserProfile | null;
  isLoading: boolean;
  error: string | null;
}

class GoogleAuthService {
  private tokenClient: any = null;
  private state: AuthState = {
    isAuthenticated: false,
    isSimulated: false,
    accessToken: null,
    expiresAt: null,
    user: null,
    isLoading: false,
    error: null
  };
  private listeners: Array<(state: AuthState) => void> = [];

  constructor() {
    this.restoreSession();
  }

  public getClientId(): string {
    return localStorage.getItem('bina_desa_custom_client_id') || DEFAULT_CLIENT_ID;
  }

  public setClientId(clientId: string): void {
    localStorage.setItem('bina_desa_custom_client_id', clientId.trim());
    this.tokenClient = null; // force re-init
  }

  private restoreSession() {
    try {
      const savedToken = localStorage.getItem('bina_desa_access_token');
      const savedExpiresAt = localStorage.getItem('bina_desa_expires_at');
      const savedUser = localStorage.getItem('bina_desa_user');
      const isSimulated = localStorage.getItem('bina_desa_is_simulated') === 'true';

      if (savedToken && savedExpiresAt && savedUser) {
        const expiresAtNum = parseInt(savedExpiresAt, 10);
        if (Date.now() < expiresAtNum) {
          this.state = {
            isAuthenticated: true,
            isSimulated,
            accessToken: savedToken,
            expiresAt: expiresAtNum,
            user: JSON.parse(savedUser),
            isLoading: false,
            error: null
          };
        } else {
          this.clearSession();
        }
      }
    } catch (e) {
      console.warn('Error restoring Google session:', e);
    }
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  public getState(): AuthState {
    return { ...this.state };
  }

  public clearError(): void {
    this.state = { ...this.state, error: null };
    this.notify();
  }

  public getAccessToken(): string | null {
    if (this.state.expiresAt && Date.now() > this.state.expiresAt) {
      this.clearSession();
      return null;
    }
    return this.state.accessToken;
  }

  public signInAsDemo(name = 'Petugas Pembina Kecamatan Tempunak', email = 'petugas.tempunak@sintang.go.id'): void {
    const demoToken = 'simulated_oauth_token_' + Date.now();
    const expiresAt = Date.now() + 30 * 86400 * 1000;
    const user: GoogleUserProfile = {
      name,
      email
    };

    localStorage.setItem('bina_desa_access_token', demoToken);
    localStorage.setItem('bina_desa_expires_at', expiresAt.toString());
    localStorage.setItem('bina_desa_user', JSON.stringify(user));
    localStorage.setItem('bina_desa_is_simulated', 'true');

    this.state = {
      isAuthenticated: true,
      isSimulated: true,
      accessToken: demoToken,
      expiresAt,
      user,
      isLoading: false,
      error: null
    };
    this.notify();
  }

  public initTokenClient(callback?: (token: string) => void): Promise<boolean> {
    return new Promise((resolve) => {
      const checkGsi = () => {
        if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
          try {
            this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
              client_id: this.getClientId(),
              scope: SCOPES,
              callback: async (tokenResponse: any) => {
                if (tokenResponse.error) {
                  const errorMsg = tokenResponse.error_description || tokenResponse.error;
                  this.state = {
                    ...this.state,
                    isLoading: false,
                    error: `Otentikasi Google: ${errorMsg}. Anda dapat mengaktifkan Mode Petugas Tempunak (Simulasi) agar sinkronisasi tetap berjalan.`
                  };
                  this.notify();
                  return;
                }

                const accessToken = tokenResponse.access_token;
                const expiresIn = parseInt(tokenResponse.expires_in || '3600', 10);
                const expiresAt = Date.now() + expiresIn * 1000;

                // Fetch User Profile
                let userProfile: GoogleUserProfile = {
                  email: 'petugas.tempunak@sintang.go.id',
                  name: 'Petugas Pembina Kecamatan Tempunak'
                };

                try {
                  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                  });
                  if (res.ok) {
                    const data = await res.json();
                    userProfile = {
                      email: data.email,
                      name: data.name || data.email,
                      picture: data.picture
                    };
                  }
                } catch (err) {
                  console.warn('Could not fetch user profile details:', err);
                }

                // Save session
                localStorage.setItem('bina_desa_access_token', accessToken);
                localStorage.setItem('bina_desa_expires_at', expiresAt.toString());
                localStorage.setItem('bina_desa_user', JSON.stringify(userProfile));
                localStorage.setItem('bina_desa_is_simulated', 'false');

                this.state = {
                  isAuthenticated: true,
                  isSimulated: false,
                  accessToken,
                  expiresAt,
                  user: userProfile,
                  isLoading: false,
                  error: null
                };
                this.notify();

                if (callback) {
                  callback(accessToken);
                }
              }
            });
            resolve(true);
          } catch (e: any) {
            console.error('Failed to init Google OAuth token client', e);
            resolve(false);
          }
        } else {
          setTimeout(checkGsi, 200);
        }
      };

      checkGsi();
    });
  }

  public async signIn(): Promise<void> {
    this.state = { ...this.state, isLoading: true, error: null };
    this.notify();

    if (!this.tokenClient) {
      await this.initTokenClient();
    }

    if (this.tokenClient) {
      try {
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } catch (err: any) {
        this.state = { 
          ...this.state, 
          isLoading: false, 
          error: 'Dialog otentikasi Google terhambat (karena kebijakan keamanan preview iframe atau origin). Anda dapat menggunakan tombol "Masuk Akun Petugas Tempunak" di tab Pengaturan untuk sinkronisasi langsung.' 
        };
        this.notify();
      }
    } else {
      this.state = { 
        ...this.state, 
        isLoading: false, 
        error: 'Google Identity Client belum siap. Anda dapat mengaktifkan "Masuk Akun Petugas Tempunak (Mode Simulasi)" untuk menjalankan semua fitur tanpa hambatan.' 
      };
      this.notify();
    }
  }

  public signOut(): void {
    if (this.state.accessToken && (window as any).google?.accounts?.oauth2 && !this.state.isSimulated) {
      try {
        (window as any).google.accounts.oauth2.revoke(this.state.accessToken, () => {
          console.log('Google token revoked');
        });
      } catch (e) {
        console.warn('Error revoking token:', e);
      }
    }
    this.clearSession();
  }

  private clearSession() {
    localStorage.removeItem('bina_desa_access_token');
    localStorage.removeItem('bina_desa_expires_at');
    localStorage.removeItem('bina_desa_user');
    localStorage.removeItem('bina_desa_is_simulated');
    this.state = {
      isAuthenticated: false,
      isSimulated: false,
      accessToken: null,
      expiresAt: null,
      user: null,
      isLoading: false,
      error: null
    };
    this.notify();
  }
}

export const googleAuth = new GoogleAuthService();
