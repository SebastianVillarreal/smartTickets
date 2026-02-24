import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/state/auth';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('manager@demo.com');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Navigate to="/" replace />;

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <div className="grid w-full max-w-5xl gap-6 md:grid-cols-[1.15fr_0.85fr]">
        <div className="hidden rounded-2xl border border-border bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-8 text-white shadow-soft md:block">
          <div className="text-xs uppercase tracking-[0.22em] text-cyan-200">Executive Bug & Feature Ops</div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight">Dashboard corporativo para bugs, features y tiempos de solución</h1>
          <p className="mt-3 max-w-md text-sm text-slate-200">
            KPIs, tendencias y workflow unificado por sistema para dirección, managers y desarrollo.
          </p>
        </div>

        <Card className="self-center">
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setLoading(true);
                try {
                  await login(email, password);
                  navigate('/');
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Error de login');
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div>
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
              <Button className="w-full" disabled={loading}>{loading ? 'Ingresando...' : 'Entrar'}</Button>
              <div className="text-xs text-muted-foreground">
                Demo: `admin@demo.com`, `manager@demo.com`, `dev@demo.com`, `reporter@demo.com`
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
