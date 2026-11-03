import { login } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="login-page">
      <form action={login} className="login-card">
        <div className="logo-lg">CCCU Learn</div>
        <h1>Sign in</h1>
        {error && <p className="error">The username or password you entered is incorrect.</p>}
        <label>
          Username
          <input name="username" autoComplete="username" />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" />
        </label>
        <button type="submit" className="primary">Sign in</button>
      </form>
    </div>
  );
}
