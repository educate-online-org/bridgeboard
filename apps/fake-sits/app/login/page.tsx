import { login } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-head">CCCU &mdash; Student Records System (SITS)</div>
        <form action={login} className="login-form">
          <p>Please enter your SITS username and password.</p>
          {error && <p className="error">Invalid username or password.</p>}
          <label>
            Username
            <input name="username" autoComplete="username" />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="current-password" />
          </label>
          <button type="submit">Log in</button>
        </form>
      </div>
    </div>
  );
}
