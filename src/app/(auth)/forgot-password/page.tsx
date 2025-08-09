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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import React, { useCallback } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

const formSchema = z.object({
  email: z.email("Invalid email address"),
});

function ForgotPassword() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
    mode: "onSubmit",
  });

  const handleSubmit = useCallback((data: z.infer<typeof formSchema>) => {
    console.log("Form submitted with data:", data);
    // Handle form submission logic here, like sending a reset link
  }, []);

  return (
    <Card className="min-w-[450px]">
      <CardHeader>
        <CardTitle>
          <h1 className="text-2xl font-bold font-inter leading-tight">Forgot Password</h1>
        </CardTitle>
        <CardDescription>
          Provide a registered email address, we’ll send you a link to reset
          password
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <Form {...form}>
            <form
                id="forgot-password-form"
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
            >
                <FormField
                    name="email"
                    control={form.control}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-base font-semibold text-dark-2">
                                Email
                            </FormLabel>
                            <FormControl>
                                <Input
                                    type="email"
                                    placeholder="Enter your email"
                                    {...field}
                                  
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </form>
        </Form>
      </CardContent>

      <CardFooter className="flex-col gap-y-2">
        <Button type="submit" form="forgot-password-form" className="w-full font-bold">
          Submit
        </Button>
        <Button variant="link" asChild>
          <Link href="/auth">Back to Login</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ForgotPassword;
