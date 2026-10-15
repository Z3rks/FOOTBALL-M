import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
}

/** Puerto (Adapter): verifica un id_token de Google en el servidor. */
export abstract class GoogleVerifier {
  abstract verify(idToken: string): Promise<GoogleProfile>;
}

/** Implementación con la librería oficial de Google (RNF-SEC-02, Plan de Seguridad §5). */
@Injectable()
export class GoogleAuthLibraryVerifier extends GoogleVerifier {
  private readonly clientId: string | undefined;
  private readonly client = new OAuth2Client();

  constructor(config: ConfigService) {
    super();
    this.clientId = config.get<string>('GOOGLE_CLIENT_ID') || undefined;
  }

  async verify(idToken: string): Promise<GoogleProfile> {
    if (!this.clientId) throw new ServiceUnavailableException('Google sign-in is not configured');
    let payload;
    try {
      // Verifica firma, vencimiento y que el token se emitió para NUESTRA app (audience).
      const ticket = await this.client.verifyIdToken({ idToken, audience: this.clientId });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }
    if (!payload?.sub || !payload.email) throw new UnauthorizedException('Invalid Google token');
    return {
      googleId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified === true,
      name: payload.name ?? null,
    };
  }
}
