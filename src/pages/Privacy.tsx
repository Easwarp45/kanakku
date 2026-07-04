import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Database, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  {
    icon: Database,
    title: "What we store",
    body: "We store the information needed to power expenses, income, budgets, groups, notifications, and your account settings.",
  },
  {
    icon: Lock,
    title: "How we protect it",
    body: "We use authentication, access control, and platform security features to reduce unauthorized access and keep your account data isolated.",
  },
  {
    icon: ShieldCheck,
    title: "How we use it",
    body: "Your data is used to show balances, generate insights, sync across devices, and support the features you enable in the app.",
  },
];

export default function Privacy() {
  return (
    <div className="page-content min-h-full bg-background">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.16),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.14),transparent_28%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))]" />

        <div className="relative mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Button variant="outline" asChild className="rounded-xl">
              <Link to="/signup">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>

            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Privacy Policy
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-2xl shadow-black/10 backdrop-blur sm:p-8">
            <div className="max-w-2xl space-y-3">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                This page explains the data Kanakku uses to run the app and the protections around it.
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {items.map((item) => {
                const Icon = item.icon;

                return (
                  <section key={item.title} className="rounded-2xl border border-border/70 bg-background/70 p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-base font-semibold">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                  </section>
                );
              })}
            </div>

            <div className="mt-8 grid gap-4 rounded-2xl border border-border/70 bg-background/50 p-5 text-sm text-muted-foreground sm:grid-cols-2">
              <p>
                We do not want unnecessary data. Only the information required to provide the product experience should be collected and retained.
              </p>
              <p>
                If you need the formal privacy notice for your deployment, replace this starter page with your reviewed policy text.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}