import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AuthLayout } from "@/components/auth/AuthLayout";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      setHasRecoverySession(Boolean(data.session));
      setIsCheckingSession(false);
    };

    void verifySession();

    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(values: ResetPasswordFormValues) {
    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (!error) {
      await supabase.auth.signOut();
    }

    setIsLoading(false);

    if (error) {
      toast.error(error.message || "Failed to save password");
      return;
    }

    toast.success("Password saved. Sign in with your new password.");
    navigate("/login", { replace: true });
  }

  if (isCheckingSession) {
    return (
      <div className="page-content min-h-full bg-background flex items-center justify-center px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (!hasRecoverySession) {
    return (
      <div className="page-content min-h-full bg-background">
        <AuthLayout
          title="Reset link required"
          subtitle="Open the password reset link from your email to continue"
        >
          <div className="space-y-6">
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>We could not verify a reset session</AlertTitle>
              <AlertDescription>
                This page only works when opened from the password reset email. Request a new link if the old one expired.
              </AlertDescription>
            </Alert>

            <Button asChild className="w-full h-12 rounded-xl font-semibold">
              <Link to="/forgot-password">Request a new reset link</Link>
            </Button>

            <Button variant="outline" asChild className="w-full h-12 rounded-xl">
              <Link to="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </div>
        </AuthLayout>
      </div>
    );
  }

  return (
    <div className="page-content min-h-full bg-background">
      <AuthLayout
        title="Create a new password"
        subtitle="Choose a strong password you have not used before"
      >
        <div className="space-y-6">
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Recovery session confirmed</AlertTitle>
            <AlertDescription>
              Set your new password below, then sign in again with the updated credentials.
            </AlertDescription>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 8 characters"
                          autoComplete="new-password"
                          className="pr-12"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
                          onClick={() => setShowPassword((current) => !current)}
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
                    <FormLabel>Confirm new password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Repeat your new password"
                          autoComplete="new-password"
                          className="pr-12"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Saving password..." : "Save password"}
              </Button>
            </form>
          </Form>

          <Button variant="outline" asChild className="w-full h-12 rounded-xl">
            <Link to="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </div>
      </AuthLayout>
    </div>
  );
}