import { useState } from 'react';
import { ExternalLink, Eye, EyeOff, Lock, Mail, ShieldCheck, User, X } from 'lucide-react';
import { api } from '../lib/api';
import {
  auth,
  createUserWithEmailAndPassword,
  googleProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from '../lib/firebase';

interface AuthGateProps {
  title?: string;
  subtitle?: string;
  isModal?: boolean;
  onClose?: () => void;
  onAuthenticated?: () => void;
}

const FIREBASE_PROVIDERS_URL =
  'https://console.firebase.google.com/project/excellence-university-fe77a/authentication/providers';

interface MappedAuthError {
  message: string;
  needsConsoleEnable?: boolean;
  suggestSignup?: boolean;
}

function mapAuthError(err: unknown): MappedAuthError {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code)
      : '';
  const raw = `${code} ${err instanceof Error ? err.message : String(err)}`;

  if (
    raw.includes('auth/operation-not-allowed') ||
    raw.includes('auth/admin-restricted-operation') ||
    raw.includes('CONFIGURATION_NOT_FOUND')
  ) {
    return {
      message:
        'Manual Email/Password sign-in is currently disabled in your Firebase project (excellence-university-fe77a). Enable the Email/Password provider in Firebase Console, or use "Continue with Google" right now.',
      needsConsoleEnable: true,
    };
  }
  if (raw.includes('auth/email-already-in-use')) {
    return {
      message: 'An account with this email already exists. Switch to Sign In instead.',
    };
  }
  if (
    raw.includes('auth/invalid-credential') ||
    raw.includes('auth/wrong-password') ||
    raw.includes('auth/user-not-found')
  ) {
    return {
      message:
        'Incorrect email or password, or no account exists for this email yet. If you are a new scholar, switch to Create Account first.',
      suggestSignup: true,
    };
  }
  if (raw.includes('auth/invalid-email')) {
    return { message: 'Please enter a valid email address.' };
  }
  if (raw.includes('auth/weak-password')) {
    return { message: 'Password must be at least 6 characters long.' };
  }
  if (raw.includes('auth/too-many-requests')) {
    return { message: 'Too many attempts. Please wait a moment and try again.' };
  }
  if (raw.includes('auth/popup-closed-by-user')) {
    return { message: 'Sign-in popup was closed before completing authentication.' };
  }
  if (raw.includes('auth/unauthorized-domain')) {
    return {
      message:
        'This preview domain is not yet authorized in Firebase Console → Authentication → Settings → Authorized domains.',
    };
  }
  return { message: err instanceof Error ? err.message : String(err) };
}

export function AuthGate({
  title = 'Scholar Authentication Required',
  subtitle = 'Sign in or create an Excellence University account to access Faculty Mentorship and Campus Services.',
  isModal = false,
  onClose,
  onAuthenticated,
}: AuthGateProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<MappedAuthError | null>(null);
  const [infoMsg, setInfoMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setErrorState(null);
    setInfoMsg('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      await api.syncAdminRoleDoc();
      await api.recordLoginActivity('Sign In');
      onAuthenticated?.();
    } catch (err) {
      setErrorState(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorState(null);
    setInfoMsg('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (fullName.trim()) {
          await updateProfile(cred.user, { displayName: fullName.trim() });
        }
        try {
          await sendEmailVerification(cred.user);
          setInfoMsg('Account created. A verification link has been sent to your email.');
        } catch {
          // Ignore verification send error if rate-limited
        }
        await api.syncAdminRoleDoc();
        await api.recordLoginActivity('Sign Up');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        await api.syncAdminRoleDoc();
        await api.recordLoginActivity('Sign In');
      }
      onAuthenticated?.();
    } catch (err) {
      setErrorState(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorState(null);
    setInfoMsg('');
    if (!email.trim()) {
      setErrorState({ message: 'Enter your email address above first to receive a password reset link.' });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setInfoMsg(`Password reset email sent to ${email.trim()}.`);
    } catch (err) {
      setErrorState(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const card = (
    <div className="bg-white rounded-xl max-w-md w-full border border-[#c6c6ca]/50 shadow-xl overflow-hidden">
      <div className="bg-[#1a1c1f] text-white px-6 py-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[#ffe088]">
            Excellence University
          </p>
          <h2 className="text-2xl font-['Newsreader',Georgia,serif] font-semibold mt-1">
            {title}
          </h2>
          <p className="text-xs text-[#c6c6ca] mt-1.5 leading-relaxed">{subtitle}</p>
        </div>
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#c6c6ca] hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Close sign in dialog"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="p-6 space-y-5">
        {/* Mode Switch */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#ebeef3] rounded-lg">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorState(null);
            }}
            className={`py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'signin' ? 'bg-white text-[#181c20] shadow-sm' : 'text-[#45474a]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorState(null);
            }}
            className={`py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
              mode === 'signup' ? 'bg-white text-[#181c20] shadow-sm' : 'text-[#45474a]'
            }`}
          >
            Create Account
          </button>
        </div>

        {errorState && (
          <div className="p-3.5 rounded-lg bg-[#ffdad6] text-[#93000a] text-xs leading-relaxed space-y-2">
            <p>{errorState.message}</p>
            {errorState.needsConsoleEnable && (
              <a
                href={FIREBASE_PROVIDERS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold underline text-[#745c00]"
              >
                <span>Open Firebase Sign-in Providers</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {errorState.suggestSignup && mode === 'signin' && (
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorState(null);
                }}
                className="block font-semibold underline cursor-pointer"
              >
                Switch to Create Account →
              </button>
            )}
          </div>
        )}

        {infoMsg && (
          <div className="p-3 rounded-lg bg-[#fed65b]/30 text-[#574500] text-xs leading-relaxed">
            {infoMsg}
          </div>
        )}

        {/* Google Sign-In */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 px-4 rounded-lg border border-[#c6c6ca] bg-white hover:bg-[#f7f9ff] text-sm font-semibold text-[#181c20] flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
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
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-[#ebeef3]" />
          <span className="shrink mx-3 text-xs text-[#76777b]">or with university email</span>
          <div className="flex-grow border-t border-[#ebeef3]" />
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-[#45474a] mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#76777b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aarav Mehta"
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#45474a] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#76777b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scholar@excellence.edu"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#c6c6ca] text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-[#45474a]">Password</label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-[#735c00] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#76777b] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full pl-9 pr-10 py-2 rounded-lg border border-[#c6c6ca] text-sm"
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
            {loading
              ? 'Authenticating...'
              : mode === 'signin'
                ? 'Sign In to Portal'
                : 'Create Scholar Account'}
          </button>
        </form>

        <p className="text-[11px] text-[#45474a] flex items-center gap-1.5 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#735c00] shrink-0" />
          <span>Protected by Firebase Authentication &amp; Firestore Security Rules.</span>
        </p>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        {card}
      </div>
    );
  }

  return (
    <div className="bg-[#f7f9ff] min-h-[75vh] flex items-center justify-center px-6 py-16">
      {card}
    </div>
  );
}
