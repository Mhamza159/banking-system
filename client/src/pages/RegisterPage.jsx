import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { isValidEmail, isValidPassword, getPasswordStrength } from "../utils/validators";
import { User, Mail, Lock, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

/**
 * RegisterPage Component
 * Provides customer onboarding, real-time password strength meter,
 * and highlights auto-provisioned 10-digit Savings Account.
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: true
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) {
      setServerError("");
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Full legal name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!isValidPassword(formData.password)) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "You must accept the terms of service";
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
      const response = await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      const accountNumber = response.account?.accountNumber;
      showToast(
        "success",
        accountNumber
          ? `Account created! Primary Savings Account #${accountNumber} is ready.`
          : "Account created successfully!"
      );

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const msg = err.message || "Failed to create account. Please check your information.";
      setServerError(msg);
      showToast("error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Open your personal banking account in seconds with zero paper documents."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Auto-provisioning Benefit Card */}
        <div className="p-3.5 rounded-xl bg-brand-accent/10 border border-brand-accent/25 text-slate-200 text-xs flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-brand-accent flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-brand-accent">
              Instant Savings Account Provisioning
            </span>
            <p className="text-[11px] text-slate-300 leading-normal">
              Upon registration, a unique 10-digit primary Savings Account is automatically generated for instant deposits and transfers.
            </p>
          </div>
        </div>

        <Input
          label="Full Legal Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Alexander Wright"
          icon={User}
          error={errors.name}
          required
          autoComplete="name"
        />

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
            placeholder="Min. 8 characters"
            icon={Lock}
            error={errors.password}
            required
            autoComplete="new-password"
          />

          {/* Password Strength Meter */}
          {formData.password && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">Password strength:</span>
                <span className="font-semibold text-slate-200">
                  {passwordStrength.label}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`rounded-full h-full transition-all duration-300 ${
                      passwordStrength.score >= step
                        ? passwordStrength.color
                        : "bg-slate-700/60"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Repeat your password"
          icon={Lock}
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
        />

        {/* Terms Agreement Checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleChange}
              className="mt-0.5 rounded border-border-default bg-sunken text-brand-accent focus:ring-brand-accent/50"
            />
            <span className="text-xs text-text-muted leading-relaxed">
              I agree to the{" "}
              <span className="text-text-primary font-medium hover:underline">
                Terms of Service
              </span>{" "}
              and{" "}
              <span className="text-text-primary font-medium hover:underline">
                Electronic Funds Disclosure
              </span>
              .
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="text-[11px] text-rose-400 mt-1">{errors.agreeTerms}</p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          icon={ArrowRight}
          iconPosition="right"
          className="mt-2"
        >
          {isSubmitting ? "Provisioning Account..." : "Create Account & Get Started"}
        </Button>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-brand-accent font-semibold hover:underline ml-1"
            >
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
