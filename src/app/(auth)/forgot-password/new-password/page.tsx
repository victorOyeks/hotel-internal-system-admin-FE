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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { setNewPassword } from "@/lib/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function NewPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("token") || "";

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onSubmit",
  });

  // Redirect if no token is present
  useEffect(() => {
    if (!resetToken) {
      toast.error("Invalid reset link", {
        description: "Please start the password reset process again.",
      });
      router.replace("/forgot-password");
    }
  }, [resetToken, router]);

  const { mutate, isPending } = useMutation({
    mutationKey: ["set-new-password"],
    mutationFn: async (payload: z.infer<typeof formSchema>) => {
      const res = await setNewPassword({
        resetToken,
        newPassword: payload.newPassword,
        confirmPassword: payload.confirmPassword,
      });

      if (!res.success) {
        throw Error(res.error || "Failed to reset password, try again.");
      }

      return res.data;
    },
    onError: (error) => {
      // Check if token expired
      if (error.message.toLowerCase().includes("expired")) {
        toast.error("Reset token expired", {
          description: "Please start the password reset process again.",
        });
        router.replace("/forgot-password");
        return;
      }
      toast.error("Something went wrong", {
        description: error.message,
      });
    },
    onSuccess: (data) => {
      toast.success("Password reset successfully!", {
        description:
          data?.message || "You can now login with your new password.",
      });
      router.push("/auth");
    },
  });

  if (!resetToken) {
    return null; // Will redirect in useEffect
  }

  return (
    <Card className="w-full h-full md:h-auto md:max-w-[450px]">
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl font-bold font-inter leading-tight">
            Set New Password
          </h1>
        </CardTitle>
        <CardDescription>
          Enter a safe and secure password you will remember.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <Form {...form}>
          <form
            id="new-password-form"
            onSubmit={form.handleSubmit((data) => {
              mutate(data);
            })}
            className="space-y-4"
          >
            <FormField
              name="newPassword"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter new password"
                        className="pr-10"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="link"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOffIcon className="h-5 w-5 text-gray-500" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-500" />
                      )}
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
                    <FormControl>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm new password"
                        className="pr-10"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="link"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOffIcon className="h-5 w-5 text-gray-500" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-500" />
                      )}
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
          form="new-password-form"
          className="w-full font-bold"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              <span className="sr-only">Loading...</span>
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
        <Button variant="link" asChild>
          <Link href="/auth">Back to Login</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default NewPassword;
