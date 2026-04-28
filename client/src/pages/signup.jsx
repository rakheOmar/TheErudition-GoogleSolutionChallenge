import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import { Truck, Loader2 } from "lucide-react";

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUp(email, password, name);
      navigate("/overview");
    } catch (err) {
      setError(err.message || "Failed to create account");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full framer-frosted px-4 py-2 font-medium text-sm text-[#0099ff] mb-6">
            <Truck className="h-4 w-4" />
            AI-Powered Pharma Logistics
          </div>
          <h1 className="font-[500] text-[62px] leading-[0.95] tracking-[-3.1px] text-white mb-4">
            Create Account
          </h1>
          <p className="text-[15px] text-[#a6a6a6]">Join the Control Tower</p>
        </div>

        <div className="rounded-[20px] bg-[#090909] p-8 framer-ring">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-[10px] bg-[rgba(255,68,68,0.1)] border border-[rgba(255,68,68,0.3)] px-4 py-3 text-[14px] text-[#ff4444]">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[13px] text-[#a6a6a6] mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-[10px] bg-[#000000] border border-[rgba(0,153,255,0.15)] px-4 py-3 text-[15px] text-white placeholder-[rgba(255,255,255,0.3)] focus:border-[#0099ff] focus:outline-none transition-colors"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] text-[#a6a6a6] mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-[10px] bg-[#000000] border border-[rgba(0,153,255,0.15)] px-4 py-3 text-[15px] text-white placeholder-[rgba(255,255,255,0.3)] focus:border-[#0099ff] focus:outline-none transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-[13px] text-[#a6a6a6] mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[10px] bg-[#000000] border border-[rgba(0,153,255,0.15)] px-4 py-3 text-[15px] text-white placeholder-[rgba(255,255,255,0.3)] focus:border-[#0099ff] focus:outline-none transition-colors"
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-3 rounded-[100px] bg-white px-6 py-4 font-[500] text-[16px] text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,153,255,0.3)] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[14px] text-[#a6a6a6]">
              Already have an account?{" "}
              <Link to="/login" className="text-[#0099ff] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        
      </div>
    </div>
  );
}

export default SignupPage;