import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { KanakkuLogo } from "@/components/ui/KanakkuLogo";

const signupSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters"),
    email: z.string().trim().email("Please enter a valid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(72, "Password must be less than 72 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: SignupFormValues) {
    setIsLoading(true);
    const { error } = await signUp(values.email, values.password, values.displayName);
    setIsLoading(false);
    if (error) {
      toast.error(error.message || "Failed to create account");
      return;
    }
    toast.success("Account created! Check your email to verify 📬");
    navigate("/login");
  }

  const inputClass = "bg-white/5 border-white/10 focus:border-primary/60 placeholder:text-muted-foreground/50 rounded-xl h-12";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-64 w-64 rounded-full bg-primary/20 blur-[80px]" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-accent/15 blur-[80px]" />
        <div className="absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-secondary/12 blur-[80px]" />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 sm:px-6 py-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="mb-8 flex flex-col items-center gap-4"
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute h-28 w-28 rounded-full"
              style={{ background: 'radial-gradient(circle,rgba(0,207,255,0.18) 0%,rgba(0,232,122,0.1) 50%,transparent 75%)', filter: 'blur(8px)' }}
            />
            <div className="absolute h-[88px] w-[88px] rounded-full border border-white/10"
              style={{ boxShadow: '0 0 20px rgba(0,207,255,0.2)' }}
            />
            <KanakkuLogo size={68} />
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold"
              style={{ background: 'linear-gradient(135deg,#00CFFF 0%,#00E87A 50%,#CCFF00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Kanakku
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1 justify-center">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              join the money gang
            </p>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full max-w-sm"
        >
          <div className="glass-card p-4 sm:p-6 space-y-1">
            <h2 className="font-display text-xl font-bold">Create account</h2>
            <p className="text-sm text-muted-foreground pb-4">free forever, no cap 🙌</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground/80">Your Name</FormLabel>
                      <FormControl>
                        <Input id="signup-name" placeholder="What do we call you?" autoComplete="name" className={inputClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground/80">Email</FormLabel>
                      <FormControl>
                        <Input id="signup-email" type="email" placeholder="you@example.com" autoComplete="email" className={inputClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground/80">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="min 6 characters"
                            autoComplete="new-password"
                            className={`${inputClass} pr-12`}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground/80">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            id="signup-confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="same again"
                            autoComplete="new-password"
                            className={`${inputClass} pr-12`}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-1">
                  <Button
                    id="signup-submit"
                    type="submit"
                    className="w-full h-12 rounded-xl font-display font-semibold text-base btn-glow bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Creating..." : "Create Account →"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-muted-foreground/60">
            By signing up you agree to our{" "}
            <Link to="/terms" className="underline hover:text-muted-foreground">Terms</Link>
            {" & "}
            <Link to="/privacy" className="underline hover:text-muted-foreground">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}