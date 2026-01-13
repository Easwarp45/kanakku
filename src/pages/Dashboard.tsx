import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Plus, Users, TrendingUp, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">₹</span>
            </div>
            <span className="font-semibold">Kanakku</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container px-4 py-6">
        {/* Welcome section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Hello, {user?.user_metadata?.display_name || "there"}! 👋
          </h1>
          <p className="text-muted-foreground">
            Track your expenses and manage your money
          </p>
        </div>

        {/* Quick add expense card */}
        <Card className="mb-6 bg-primary text-primary-foreground">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm opacity-90">Today's spending</p>
              <p className="text-3xl font-bold">₹0</p>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="h-12 w-12 rounded-full p-0"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </CardContent>
        </Card>

        {/* Monthly overview */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">This Month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Expenses</span>
              <span className="text-xl font-semibold">₹0</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 w-0 rounded-full bg-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              No budget set. Tap to create one.
            </p>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="flex h-auto flex-col gap-2 py-4"
          >
            <Plus className="h-5 w-5 text-primary" />
            <span className="text-xs">Add Expense</span>
          </Button>
          <Button
            variant="outline"
            className="flex h-auto flex-col gap-2 py-4"
          >
            <Users className="h-5 w-5 text-secondary" />
            <span className="text-xs">Split Bill</span>
          </Button>
          <Button
            variant="outline"
            className="flex h-auto flex-col gap-2 py-4"
          >
            <TrendingUp className="h-5 w-5 text-accent" />
            <span className="text-xs">Analytics</span>
          </Button>
        </div>

        {/* Recent transactions placeholder */}
        <div className="mt-6">
          <h2 className="mb-4 text-lg font-semibold">Recent Transactions</h2>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground">
                Add your first expense to get started
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Bottom navigation placeholder */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background safe-bottom">
        <div className="container flex h-16 items-center justify-around px-4">
          <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2">
            <div className="h-5 w-5 rounded bg-primary" />
            <span className="text-xs">Home</span>
          </Button>
          <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Expenses</span>
          </Button>
          <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Groups</span>
          </Button>
          <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Analytics</span>
          </Button>
          <Button variant="ghost" className="flex flex-col gap-1 h-auto py-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Profile</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}