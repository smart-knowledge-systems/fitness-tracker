"use client";

import { signIn } from "@/lib/shoo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SignInForm() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Sign in with your Google account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => signIn()} className="w-full">
          Sign in with Google
        </Button>
      </CardContent>
    </Card>
  );
}
