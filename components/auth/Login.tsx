
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft, Mail, Lock, User, ArrowRight, UserCircle2 } from 'lucide-react';
import { authService } from '../../services/supabase';

interface LoginProps {
    onLogin?: (user: any) => void;
}

type ViewState = 'landing' | 'signin' | 'signup';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [view, setView] = useState<ViewState>('landing');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.signInWithGoogle();
    } catch (err: any) {
      setError("Connection failed. Please try Email login.");
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
      setIsLoading(true);
      setError(null);
      try {
          const result = await authService.signInWithGuest();
          if (result.user && onLogin) {
              onLogin(result.user);
          }
      } catch (err: any) {
          setError("Guest login failed.");
      } finally {
          setIsLoading(false);
      }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setError(null);

      try {
          let result;
          if (view === 'signup') {
              if (!username) throw new Error("Username is required");
              result = await authService.signUpWithEmail(email, password, username);
          } else {
              result = await authService.signInWithEmail(email, password);
          }

          if (result.user && onLogin) {
              onLogin(result.user);
          } else if (result.user) {
              window.location.reload();
          } else if (view === 'signup' && !result.session) {
             setError("Account created! Please check your email to confirm.");
          }
      } catch (err: any) {
          setError(err.message || "Authentication failed");
      } finally {
          setIsLoading(false);
      }
  };

  const resetForm = () => {
      setError(null);
      setEmail('');
      setPassword('');
      setUsername('');
  }

  return (
    <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans text-white">
       
       {/* Background Ambience */}
       <div className="absolute inset-0 bg-black">
          <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-blue-900/10 rounded-full blur-[120px] animate-pulse" />
       </div>

       {/* Top Left Logo */}
       <div className="absolute top-8 left-8 text-white/90 font-bold text-lg tracking-tight z-20">
          Stranded
       </div>

       <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center">
          
          <AnimatePresence>
            {view === 'landing' && (
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.5, opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    className="w-48 h-48 md:w-64 md:h-64 rounded-[24px] bg-[#111] border border-white/10 shadow-2xl mb-12 relative overflow-hidden flex items-center justify-center group shrink-0"
                >
                    <div className="absolute inset-2 rounded-full overflow-hidden animate-[spin_8s_linear_infinite]">
                        <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,#ff00cc_90deg,transparent_180deg,#3333ff_270deg,transparent_360deg)] opacity-80 blur-xl scale-150"></div>
                    </div>
                    <div className="absolute inset-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm" />
                    <div className="w-4 h-4 rounded-full bg-black border border-white/20 relative z-10 shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
                </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
             {view === 'landing' ? (
                <motion.div 
                    key="landing"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="w-full flex flex-col items-center"
                >
                    <h1 className="text-[22px] md:text-[24px] font-bold text-center leading-snug tracking-tight mb-10 max-w-xs text-white/90">
                        A sacred place for your work-in-progress music
                    </h1>

                    <div className="w-full space-y-3">
                        <button 
                            onClick={handleGoogleLogin}
                            className="w-full h-12 bg-white/5 backdrop-blur-md hover:bg-white/10 active:scale-[0.98] transition-all rounded-full flex items-center justify-center text-[15px] font-medium text-white relative group border border-white/5"
                        >
                             <div className="absolute left-1.5 top-1.5 bottom-1.5 w-9 h-9 bg-white rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                            </div>
                            <span>Continue with Google</span>
                        </button>

                        <button 
                            onClick={handleGuestLogin}
                            className="w-full h-12 bg-white/5 backdrop-blur-md hover:bg-white/10 active:scale-[0.98] transition-all rounded-full flex items-center justify-center text-[15px] font-medium text-white relative group border border-white/5"
                        >
                            <div className="absolute left-1.5 top-1.5 bottom-1.5 w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
                                <UserCircle2 size={18} className="text-white/80" />
                            </div>
                            <span>Continue as Guest</span>
                        </button>

                        <div className="pt-2">
                            <button 
                                onClick={() => { setView('signin'); resetForm(); }}
                                className="w-full h-12 border border-white/10 hover:bg-white/5 active:scale-[0.98] transition-all rounded-full flex items-center justify-center text-[15px] font-medium text-white/90 relative group"
                            >
                                <span>Sign In / Create Account</span>
                            </button>
                        </div>
                    </div>
                    
                    <p className="mt-8 text-[11px] text-gray-500 text-center max-w-xs leading-relaxed">
                        By continuing you confirm that you've read and accepted our <a href="#" className="underline hover:text-gray-300">Terms</a> and <a href="#" className="underline hover:text-gray-300">Privacy Policy</a>.
                    </p>
                </motion.div>
             ) : (
                <motion.div
                    key="form"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    className="w-full"
                >
                    <div className="flex items-center mb-8">
                        <button 
                            onClick={() => { setView('landing'); resetForm(); }}
                            className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
                        >
                            <ChevronLeft size={24} className="text-white" />
                        </button>
                        <h2 className="text-2xl font-bold ml-2">
                            {view === 'signin' ? 'Welcome Back' : 'Create Account'}
                        </h2>
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        
                        {view === 'signup' && (
                             <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-400 ml-4 uppercase tracking-wider">Username</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User size={18} className="text-gray-500" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your name"
                                        className="w-full h-12 bg-white/5 backdrop-blur-sm border border-white/5 rounded-xl pl-11 pr-4 text-white focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all placeholder:text-gray-600"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-400 ml-4 uppercase tracking-wider">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-500" />
                                </div>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full h-12 bg-white/5 backdrop-blur-sm border border-white/5 rounded-xl pl-11 pr-4 text-white focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all placeholder:text-gray-600"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                             <label className="text-xs font-medium text-gray-400 ml-4 uppercase tracking-wider">Password</label>
                             <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-500" />
                                </div>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full h-12 bg-white/5 backdrop-blur-sm border border-white/5 rounded-xl pl-11 pr-4 text-white focus:outline-none focus:bg-white/10 focus:border-white/20 transition-all placeholder:text-gray-600"
                                    required
                                    minLength={6}
                                />
                             </div>
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-[#FA233B] hover:bg-[#D41C30] active:scale-[0.98] transition-all rounded-full flex items-center justify-center text-[16px] font-bold text-white shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <div className="flex items-center space-x-2">
                                        <span>{view === 'signin' ? 'Sign In' : 'Create Account'}</span>
                                        <ArrowRight size={18} />
                                    </div>
                                )}
                            </button>
                        </div>
                    </form>

                    {error && (
                         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 text-red-400 text-sm font-medium bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/20 text-center">
                             {error}
                         </motion.div>
                    )}

                    <div className="mt-8 text-center">
                        <p className="text-gray-500 text-sm">
                            {view === 'signin' ? "Don't have an account?" : "Already have an account?"}
                        </p>
                        <button 
                            onClick={() => {
                                setView(view === 'signin' ? 'signup' : 'signin');
                                setError(null);
                            }}
                            className="text-[#FA233B] font-semibold text-sm mt-1 hover:underline"
                        >
                            {view === 'signin' ? "Sign up for free" : "Sign in here"}
                        </button>
                    </div>

                </motion.div>
             )}
          </AnimatePresence>

       </div>
    </div>
  );
};

export default Login;
