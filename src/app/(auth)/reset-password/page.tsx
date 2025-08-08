"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z
  .object({
    initialPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirmPassword: z
      .string()
      .min(8, "Confirm Password must be at least 8 characters long"),
  })
  .refine((data) => data.initialPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function ResetPassword() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      initialPassword: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });
  const [showInitialPassword, setShowInitialPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = useCallback((data: z.infer<typeof formSchema>) => {
    console.log("Form submitted with data:", data);
    // Handle form submission logic here, like updating the password
  }, []);

  return (
    <Card className="min-w-[450px]">
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl font-bold font-inter">Reset Password</h1>
        </CardTitle>
        <CardDescription>
          Enter a safe and secure password you will remember.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <Form {...form}>
          <form
            id="reset-password-form"
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              name="initialPassword"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <div className="relative">
                    <Input
                      type="password"
                      {...field}
                      className="w-full py-5"
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size={"icon"}
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() =>
                        setShowInitialPassword(!showInitialPassword)
                      }
                    >
                      {showInitialPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="confirmPassword"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      {...field}
                      className="w-full py-5"
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size={"icon"}
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex-col gap-y-2">
        <Button
          type="submit"
          form="reset-password-form"
          className="w-full py-5 font-bold"
        >
          Reset Password
        </Button>
        <Button variant="link" className="py-5" asChild>
          <Link href="/auth">Back to Login</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ResetPassword;
