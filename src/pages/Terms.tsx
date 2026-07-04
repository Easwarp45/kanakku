import { Link } from "react-router-dom";
import { ArrowLeft, Shield, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const sections = [
  {
    title: "Using Kanakku",
    body: "Kanakku is designed to help you track expenses, income, budgets, and group settlements. You are responsible for the accuracy of the data you enter.",
  },
  {
    title: "Account responsibility",
    body: "Keep your account credentials private and sign out of shared devices. We may suspend access if we detect abuse, fraud, or attempts to bypass security controls.",
  },
  {
    title: "Service changes",
    body: "We may improve, modify, or discontinue features as the product evolves. When that happens, we will aim to keep the experience stable and minimize disruption.",
  },
  {
    title: "Contact",
    body: "For questions about these terms, contact the support channel provided by the app owner.",
  },
];

export default function Terms() {
  return (
    <div className="page-content min-h-full bg-background">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.14),transparent_28%),linear-gradient(to_bottom,hsl(var(--background)),hsl(var(--background)))]" />

        <div className="relative mx-auto flex min-h-full w-full max-w-4xl flex-col px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Button variant="outline" asChild className="rounded-xl">
              <Link to="/signup">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>

            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Terms of Service
            </div>
          </div>

          <div className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-2xl shadow-black/10 backdrop-blur sm:p-8">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Terms of Service</h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                These terms explain how Kanakku can be used and what we expect from account holders.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {sections.map((section) => (
                <section key={section.title} className="rounded-2xl border border-border/70 bg-background/70 p-5">
                  <h2 className="text-base font-semibold">{section.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.body}</p>
                </section>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-dashed border-border/70 bg-background/50 p-5 text-sm text-muted-foreground">
              This is the product-facing policy page. If you have formal legal requirements, replace this text with your reviewed terms.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}