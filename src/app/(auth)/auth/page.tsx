"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
  email: z.email(),
  password: z.string().nonempty("Password is required"),
});

function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const handleSubmit = useCallback((data: z.infer<typeof formSchema>) => {
    console.log("Form submitted with data:", data);
    // Handle form submission logic here
  }, []);

  return (
      <Card className="min-w-[400px]">
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl font-bold font-inter">Login</h1>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          <Form {...form}>
            <form
              id="auth-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold text-dark-2 mb-1">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                        className="py-5"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold text-dark-2 mb-1">
                      Password
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="py-5 pr-10"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                      >
                        {showPassword ? (
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

          <div className="flex items-center justify-end">
            <Button variant={"link"} className="text-info px-0" asChild>
              <Link href="/forgot-password">Forgot Password?</Link>
            </Button>
          </div>
        </CardContent>

        <CardFooter>
          <Button type="submit" form="auth-form" className="w-full py-5 font-bold">
            Login
          </Button>
        </CardFooter>
      </Card>
  );
}

export default AuthPage;
