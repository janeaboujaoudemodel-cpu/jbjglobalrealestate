import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

interface UseBiometricAuth {
  isAvailable: boolean;
  isSupported: boolean;
  authenticate: () => Promise<BiometricAuthResult>;
  register: (userId: string) => Promise<BiometricAuthResult>;
  isLoading: boolean;
}

/**
 * Hook for biometric authentication (Face ID, Touch ID, Windows Hello, etc.)
 * Uses the Web Authentication API (WebAuthn)
 */
export const useBiometricAuth = (): UseBiometricAuth => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      setIsSupported(false);
      setIsAvailable(false);
      return;
    }

    setIsSupported(true);

    try {
      // Check if platform authenticator is available (Face ID, Touch ID, etc.)
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      setIsAvailable(available);
    } catch (error) {
      console.error('Error checking biometric availability:', error);
      setIsAvailable(false);
    }
  };

  const register = useCallback(async (userId: string): Promise<BiometricAuthResult> => {
    if (!isAvailable) {
      return { success: false, error: 'Biometric authentication not available on this device' };
    }

    setIsLoading(true);

    try {
      // Create a challenge (in production, this should come from the server)
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'JBJ Global Real Estate',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userId,
          displayName: 'JBJ User',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      if (credential) {
        // Store credential ID for future authentication
        const credentialId = (credential as PublicKeyCredential).rawId;
        const credentialIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credentialId)));
        
        localStorage.setItem('jbj_biometric_credential', credentialIdBase64);
        localStorage.setItem('jbj_biometric_user', userId);

        toast.success('Biometric authentication enabled!');
        return { success: true };
      }

      return { success: false, error: 'Failed to create credential' };
    } catch (error: any) {
      console.error('Biometric registration error:', error);
      
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'Biometric registration was cancelled or not allowed' };
      }
      
      return { success: false, error: error.message || 'Failed to register biometric' };
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);

  const authenticate = useCallback(async (): Promise<BiometricAuthResult> => {
    if (!isAvailable) {
      return { success: false, error: 'Biometric authentication not available' };
    }

    const storedCredentialId = localStorage.getItem('jbj_biometric_credential');
    if (!storedCredentialId) {
      return { success: false, error: 'No biometric credential registered. Please register first.' };
    }

    setIsLoading(true);

    try {
      // Create a challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      // Convert stored credential ID back to ArrayBuffer
      const credentialIdBytes = Uint8Array.from(atob(storedCredentialId), c => c.charCodeAt(0));

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [
          {
            id: credentialIdBytes,
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      });

      if (assertion) {
        return { success: true };
      }

      return { success: false, error: 'Authentication failed' };
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      
      if (error.name === 'NotAllowedError') {
        return { success: false, error: 'Authentication was cancelled or not allowed' };
      }
      
      return { success: false, error: error.message || 'Authentication failed' };
    } finally {
      setIsLoading(false);
    }
  }, [isAvailable]);

  return {
    isAvailable,
    isSupported,
    authenticate,
    register,
    isLoading,
  };
};

export default useBiometricAuth;
