import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isValidEmail } from "../utils/validators";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

/**
 * LoginPage Component
 * Handles customer authentication, error feedback, and redirect destination.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) {
      setServerError("");
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError("");

    try {
      const response = await login({
        email: formData.email,
        password: formData.password
      });

      showToast("success", `Welcome back, ${response.user?.name || "Customer"}!`);
      
      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });
    } catch (err) {
      const msg = err.message || "Invalid credentials. Please verify your email and password.";
      setServerError(msg);
      showToast("error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to pre-fill test user credentials
  const fillTestCredentials = () => {
    setFormData({
      email: "alexander@aurabank.io",
      password: "Password123!"
    });
    setErrors({});
    setServerError("");
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to access your ledger accounts and real-time transaction dashboard."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <Input
          label="Email Address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="name@aurabank.io"
          icon={Mail}
          error={errors.email}
          required
          autoComplete="email"
        />

        <div>
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••••••"
            icon={Lock}
            error={errors.password}
            required
            autoComplete="current-password"
          />
          <div className="flex justify-end mt-1.5">
            <button
              type="button"
              onClick={() =>
                showToast("info", "Password reset is restricted in sandbox mode.")
              }
              className="text-xs font-medium text-slate-400 hover:text-brand-accent transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          icon={ArrowRight}
          iconPosition="right"
        >
          {isSubmitting ? "Authenticating..." : "Sign In to Account"}
        </Button>

        {/* Demo Quick Fill Helper */}
        <div className="pt-2">
          <button
            type="button"
            onClick={fillTestCredentials}
            className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-700/80 hover:border-brand-accent/50 text-[11px] font-medium text-slate-400 hover:text-slate-300 flex items-center justify-center gap-2 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand-accent" />
            Fill Demo Customer Credentials
          </button>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-brand-accent font-semibold hover:underline ml-1"
            >
              Open a free account
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
