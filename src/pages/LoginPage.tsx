import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function friendlyError(err: unknown): string {
  const code = err instanceof Error && 'code' in err ? String((err as { code?: string }).code) : '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with that email already exists — try logging in instead.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    default:
      return err instanceof Error ? err.message : 'Something went wrong. Please try again.';
  }
}

export function LoginPage() {
  const { signUp, logIn, logInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (mode === 'signup') {
        await signUp(email, password, displayName);
      } else {
        await logIn(email, password);
      }
    } catch (err) {
      setError(friendlyError(err));
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await logInWithGoogle();
    } catch (err) {
      setError(friendlyError(err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>🛒 Weekly Recipes</h1>
        <p className="page__subtitle">
          {mode === 'login' ? 'Log in to see the recipe library.' : 'Create an account to join the recipe library.'}
        </p>

        <form className="recipe-form" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label>
              Name
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </label>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="recipe-form__actions">
            <button type="submit" className="button button--primary" disabled={isSubmitting}>
              {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </form>

        <button type="button" className="button auth-card__google" onClick={handleGoogle} disabled={isSubmitting}>
          Sign in with Google
        </button>

        <p className="auth-card__switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button type="button" className="link-button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}
