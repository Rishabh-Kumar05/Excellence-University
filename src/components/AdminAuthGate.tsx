import { useState } from 'react';
import {
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Mail,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../lib/api';
import {
  ADMIN_EMAIL,
  auth,
  googleProvider,
  isAdminEmail,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from '../lib/firebase';

interface AdminAuthGateProps {
  currentUserEmail?: string | null;
  onAuthenticated?: () => void;
}

const FIREBASE_USERS_URL =
  'https://console.firebase.google.com/project/excellence-university-fe77a/authentication/users';

interface AdminErrorInfo {
  message: string;
  showCredentialHelp?: boolean;
}

function mapAdminAuthError(err: unknown): AdminErrorInfo {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code)
      : '';
  const raw = `${code} ${err instanceof Error ? err.message : String(err)}`;

  if (
    raw.includes('auth/invalid-credential') ||
    raw.includes('auth/wrong-password') ||
    raw.includes('auth/user-not-found')
  ) {
    return {
      message: `Firebase Authentication rejected this password for ${ADMIN_EMAIL}. This account was likely created earlier with a different password (or needs its password set in Firebase Console).`,
      showCredentialHelp: true,
    };
  }
  if (raw.includes('auth/invalid-email')) {
    return { message: 'Please enter a valid administrator email address.' };
  }
  if (raw.includes('auth/too-many-requests')) {
    return { message: 'Too many sign-in attempts. Please wait a moment and try again.' };
  }
  if (raw.includes('auth/popup-closed-by-user')) {
    return { message: 'Sign-in popup was closed before completing authentication.' };
  }
  if (raw.includes('auth/operation-not-allowed') || raw.includes('CONFIGURATION_NOT_FOUND')) {
    return {
      message:
        'Email/Password sign-in is disabled in Firebase Console. Enable the Email/Password provider in Firebase Authentication.',
    };
  }
  return { message: err instanceof Error ? err.message : String(err) };
}

export function AdminAuthGate({ currentUserEmail, onAuthenticated }: AdminAuthGateProps) {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<AdminErrorInfo | null>(null);
  const [infoMsg, setInfoMsg] = useState('');

  const isNonAdminSignedIn = Boolean(currentUserEmail && !isAdminEmail(currentUserEmail));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorInfo(null);
    setInfoMsg('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!isAdminEmail(normalizedEmail)) {
      setErrorInfo({
        message: `Access denied. Only the designated administrator account (${ADMIN_EMAIL}) is permitted to sign in to the Admin Portal.`,
      });
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      if (!isAdminEmail(cred.user.email)) {
        await signOut(auth);
        setErrorInfo({
          message: 'Access denied. This account does not hold Administrator privileges.',
        });
        return;
      }
      await api.syncAdminRoleDoc();
      await api.recordLoginActivity('Sign In');
      onAuthenticated?.();
    } catch (err) {
      setErrorInfo(mapAdminAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAdminSignIn = async () => {
    setErrorInfo(null);
    setInfoMsg('');
    setLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (!isAdminEmail(cred.user.email)) {
        await signOut(auth);
        setErrorInfo({
          message: `Access denied (${cred.user.email || 'unknown account'}). Only ${ADMIN_EMAIL} can access the Admin Portal.`,
        });
        return;
      }
      await api.syncAdminRoleDoc();
      await api.recordLoginActivity('Sign In');
      onAuthenticated?.();
    } catch (err) {
      setErrorInfo(mapAdminAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorInfo(null);
    setInfoMsg('');
    const targetEmail = email.trim().toLowerCase() || ADMIN_EMAIL;
    if (!isAdminEmail(targetEmail)) {
      setErrorInfo({ message: `Password reset here is restricted to ${ADMIN_EMAIL}.` });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, targetEmail);
      setInfoMsg(`Password reset email sent to ${targetEmail}. Check your inbox to set your new password.`);
    } catch (err) {
      setErrorInfo(mapAdminAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = async () => {
    setLoading(true);
    setErrorInfo(null);
    try {
      await signOut(auth);
      setInfoMsg('Signed out of scholar account. Sign in with administrator credentials below.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f7f9ff] min-h-[78vh] flex items-center justify-center px-6 py-16">
      <div className="bg-white rounded-xl max-w-md w-full border border-[#c6c6ca]/50 shadow-xl overflow-hidden">
        <div className="bg-[#1a1c1f] text-white px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-widest text-[#ffe088]">
            Excellence University
          </p>
          <h1 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold mt-1">
            Administrator Portal Login
          </h1>
          <p className="text-xs text-[#c6c6ca] mt-1.5 leading-relaxed">
            Restricted access for University Administration to inspect portal logins, manage
            attendance, and publish official college notices.
          </p>
        </div>

        <div className="p-6 space-y-5">
          {isNonAdminSignedIn && (
            <div className="p-3.5 rounded-lg bg-[#f1f4f9] border border-[#c6c6ca]/60 text-xs text-[#181c20] space-y-2.5">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-[#735c00] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Currently signed in as <span className="font-semibold">{currentUserEmail}</span>.
                  Scholar accounts do not have permission to open the Admin Portal.
                </p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handleSwitchAccount}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1a1c1f] text-white font-semibold hover:bg-[#735c00] transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-[#fed65b]" />
                <span>Sign Out &amp; Switch to Admin</span>
              </button>
            </div>
          )}

          {errorInfo && (
            <div className="p-3.5 rounded-lg bg-[#ffdad6] text-[#93000a] text-xs leading-relaxed space-y-2">
              <p>{errorInfo.message}</p>
              {errorInfo.showCredentialHelp && (
                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="font-semibold underline text-[#745c00] cursor-pointer"
                  >
                    Send Password Reset Email
                  </button>
                  <a
                    href={FIREBASE_USERS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold underline text-[#745c00]"
                  >
                    <span>Manage User in Firebase Console</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {infoMsg && (
            <div className="p-3.5 rounded-lg bg-[#fed65b]/30 text-[#574500] text-xs leading-relaxed">
              {infoMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#45474a] mb-1">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#76777b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={ADMIN_EMAIL}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#c6c6ca] text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#45474a]">
                  Administrator Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-[#735c00] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#76777b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-[#c6c6ca] text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#76777b] hover:text-[#181c20] cursor-pointer p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#000000] text-white text-sm font-semibold hover:bg-[#735c00] transition-colors cursor-pointer disabled:opacity-60"
            >
              {loading ? 'Verifying Admin Session...' : 'Sign In as Administrator'}
            </button>
          </form>

          <div className="relative flex items-center py-0.5">
            <div className="flex-grow border-t border-[#ebeef3]" />
            <span className="shrink mx-3 text-xs text-[#76777b]">or</span>
            <div className="flex-grow border-t border-[#ebeef3]" />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleAdminSignIn}
            className="w-full py-2.5 px-4 rounded-lg border border-[#c6c6ca] bg-white hover:bg-[#f7f9ff] text-xs font-semibold text-[#181c20] flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
              />
            </svg>
            <span>Continue with Google ({ADMIN_EMAIL})</span>
          </button>

          <p className="text-[11px] text-[#45474a] flex items-center gap-1.5 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#735c00] shrink-0" />
            <span>
              Protected by Role-Based Firestore Security Rules for {ADMIN_EMAIL}.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
