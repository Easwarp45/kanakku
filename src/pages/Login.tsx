import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
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

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/dashboard";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    const { error } = await signIn(values.email, values.password);
    setIsLoading(false);
    if (error) {
      toast.error(error.message || "Failed to sign in");
      return;
    }
    toast.success("Welcome back! 🎉");
    navigate(from, { replace: true });
  }

  return (
    <div className="page-content min-h-full bg-background relative">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 ">
        <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-primary/20 blur-[80px]" />
        <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-secondary/15 blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-accent/10 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center justify-start sm:justify-center px-4 sm:px-6 py-8 sm:py-12">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="mb-10 flex flex-col items-center gap-4"
        >
          {/* glow ring + logo */}
          <div className="relative flex items-center justify-center">
            {/* outer pulse ring */}
            <div className="absolute h-28 w-28 rounded-full"
              style={{ background: 'radial-gradient(circle,hsl(var(--secondary) / 0.18) 0%,hsl(var(--primary) / 0.1) 50%,transparent 75%)', filter: 'blur(8px)' }}
            />
            {/* middle ring */}
            <div className="absolute h-[88px] w-[88px] rounded-full border border-border/70"
              style={{ boxShadow: '0 0 20px hsl(var(--secondary) / 0.2)' }}
            />
            {/* logo itself */}
            <KanakkuLogo size={68} />
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold"
              style={{ background: 'linear-gradient(135deg,hsl(var(--secondary)) 0%,hsl(var(--success)) 50%,hsl(var(--accent)) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              Kanakku
            </h1>
            <p className="text-sm text-muted-foreground mt-1">your money, your vibe 💜</p>
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
            <h2 className="font-display text-xl font-bold">Welcome back</h2>
            <p className="text-sm text-muted-foreground pb-4">sign in to continue</p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground/80">Email</FormLabel>
                      <FormControl>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          className="bg-card/70 border-border/70 focus:border-primary/60 placeholder:text-muted-foreground/50 rounded-xl h-12"
                          {...field}
                        />
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
                            id="login-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            autoComplete="current-password"
                            className="bg-card/70 border-border/70 focus:border-primary/60 placeholder:text-muted-foreground/50 rounded-xl h-12 pr-12"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-card transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-1">
                  <Button
                    id="login-submit"
                    type="submit"
                    className="w-full h-12 rounded-xl font-display font-semibold text-base btn-glow bg-primary hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Signing in..." : "Sign In →"}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="pt-3 text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-primary/80 hover:text-primary transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Sign up free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}