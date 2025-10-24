import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  // Email validation function
  const isValidVeltechEmail = (email: string): boolean => {
    const studentPattern = /^vtu\d+@veltech\.edu\.in$/;
    const facultyPattern = /^tts\d+@veltech\.edu\.in$/;
    
    return studentPattern.test(email) || facultyPattern.test(email);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email domain and format
    if (!isValidVeltechEmail(email)) {
      toast.error('Please use a valid Veltech email:\n• Students: vtu12345@veltech.edu.in\n• Faculty: tts1234@veltech.edu.in');
      return;
    }

    // Validate display name for signup
    if (isSignUp && !displayName.trim()) {
      toast.error('Please enter your display name');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up with display name
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: undefined,
            data: {
              display_name: displayName.trim(),
            }
          }
        });

        if (error) throw error;

        // Auto-login after signup
        if (data.user) {
          toast.success(`Welcome ${displayName}! Account created successfully.`);
          navigate('/');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success('Successfully logged in!');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp 
              ? 'Sign up with your Veltech email' 
              : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {/* Display Name - Only for Sign Up */}
            {isSignUp && (
              <div className="space-y-2">
                <label htmlFor="displayName" className="text-sm font-medium">
                  Display Name *
                </label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  disabled={loading}
                  maxLength={50}
                />
                <p className="text-xs text-gray-500">
                  This name will be visible to other users
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email *
              </label>
              <Input
                id="email"
                type="email"
                placeholder="vtu12345@veltech.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <div className="text-xs text-gray-500 space-y-1">
                <p>✓ Students: vtu12345@veltech.edu.in</p>
                <p>✓ Faculty: tts1234@veltech.edu.in</p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password *
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              {isSignUp && (
                <p className="text-xs text-gray-500">
                  Minimum 6 characters
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setDisplayName(''); // Clear display name when switching
              }}
              className="text-sm text-blue-600 hover:underline"
              disabled={loading}
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
