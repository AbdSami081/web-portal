"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useAuth } from "@/context/authContext";
import Image from "next/image";
import logoImage from "@/public/assets/logo.png";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { login } = useAuth();
  const [username, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);

    if (!username || !password) {
      toast.info("Enter your credentials");
      setLoading(false);
      return;
    }

    try {
      await login(username, password);
      toast.success("Logged in successfully!");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <div className="space-y-2 text-center">
            <Image src={logoImage} alt="sns" className="mx-auto h-20 w-40" />
            <h1 className="text-3xl font-semibold">Welcome back</h1>
            <p className="text-muted-foreground">
              Sign in to access to your dashboard.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Employee Id</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your employee id"
                  required
                  value={username}
                  onChange={(e) => setUserName(e.target.value)}
                  className="bg-gray-200"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSubmit();
                  }}
                  placeholder="****"
                  className="bg-gray-200"
                />
              </Field>

              <Field>
                <Button type="button" onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Logging in...
                    </div>
                  ) : (
                    "Login"
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
