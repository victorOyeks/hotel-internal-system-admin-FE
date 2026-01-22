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
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { forgotPassword, verifyOtp } from "@/lib/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";

const formSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

function VerifyOTP() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
    mode: "onSubmit",
  });

  const { mutate, isPending } = useMutation({
    mutationKey: ["verify-otp"],
    mutationFn: async (payload: z.infer<typeof formSchema>) => {
      const res = await verifyOtp(payload);

      if (!res.success) {
        throw Error(res.error || "Invalid OTP, please try again.");
      }

      return res.data;
    },
    onError: (error) => {
      toast.error("Verification failed", {
        description: error.message,
      });
    },
    onSuccess: (data) => {
      toast.success("OTP verified!", {
        description: "Please set your new password.",
      });
      // Navigate to new password page with resetToken
      router.push(
        `/forgot-password/new-password?token=${encodeURIComponent(
          data.resetToken
        )}`
      );
    },
  });

  const { mutate: resendOtp, isPending: isResending } = useMutation({
    mutationKey: ["resend-otp"],
    mutationFn: async () => {
      if (!email) {
        throw Error("Email not found. Please start over.");
      }
      const res = await forgotPassword({ email });

      if (!res.success) {
        throw Error(res.error || "Failed to resend OTP.");
      }

      return res.data;
    },
    onError: (error) => {
      toast.error("Failed to resend OTP", {
        description: error.message,
      });
    },
    onSuccess: () => {
      toast.success("OTP resent!", {
        description: "Please check your email for the new verification code.",
      });
      form.reset();
    },
  });

  return (
    <Card className="w-full h-full md:h-auto md:max-w-[450px]">
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl font-bold font-inter leading-tight">
            Verify OTP
          </h1>
        </CardTitle>
        <CardDescription>
          Enter the 6-digit code sent to{" "}
          {email ? (
            <span className="font-medium text-foreground">{email}</span>
          ) : (
            "your email"
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <Form {...form}>
          <form
            id="verify-otp-form"
            onSubmit={form.handleSubmit((data) => {
              mutate(data);
            })}
            className="space-y-4"
          >
            <FormField
              name="otp"
              control={form.control}
              render={({ field }) => (
                <FormItem className="flex flex-col items-center">
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
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
          form="verify-otp-form"
          className="w-full font-bold"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              <span className="sr-only">Loading...</span>
            </>
          ) : (
            "Verify OTP"
          )}
        </Button>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Didn't receive the code?</span>
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto"
            disabled={isResending}
            onClick={() => resendOtp()}
          >
            {isResending ? "Resending..." : "Resend OTP"}
          </Button>
        </div>
        <Button variant="link" asChild>
          <Link href="/forgot-password">Use a different email</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default VerifyOTP;
