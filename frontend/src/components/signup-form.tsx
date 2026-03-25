import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import authService from "@/services/auth-service";
import { toast } from "sonner";

const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.email("Invalid email address"),
  password1: z.string().min(8, "Password must be at least 8 characters long"),
  password2: z
    .string()
    .min(8, "Confirm Password must be at least 8 characters long"),
});

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const form = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password1: "",
      password2: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    if (data.password1 !== data.password2) {
      form.setError("password2", {
        type: "validate",
        message: "Passwords do not match",
      });
      form.setError("password1", {
        type: "validate",
        message: "Passwords do not match",
      });
      return;
    }

    try {
      await authService.signup(data);
    } catch (error) {
      toast.error("Error signing up", {
        description: "Please try again",
      });
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                control={form.control}
                name="username"
                render={({ field, fieldState }) => {
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="name">Username</FieldLabel>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Username"
                        required
                        aria-invalid={fieldState.invalid}
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  );
                }}
              />
              <Controller
                control={form.control}
                name="email"
                render={({ field, fieldState }) => {
                  return (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">Email</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        required
                        aria-invalid={fieldState.invalid}
                        {...field}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  );
                }}
              />
              <Field>
                <Field className="grid grid-cols-2 gap-4">
                  <Controller
                    control={form.control}
                    name="password1"
                    render={({ field, fieldState }) => {
                      return (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="password">Password</FieldLabel>
                          <Input
                            id="password"
                            type="password"
                            required
                            aria-invalid={fieldState.invalid}
                            {...field}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      );
                    }}
                  />
                  <Controller
                    control={form.control}
                    name="password2"
                    render={({ field, fieldState }) => {
                      return (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="confirm-password">
                            Confirm Password
                          </FieldLabel>
                          <Input
                            id="confirm-password"
                            type="password"
                            required
                            {...field}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      );
                    }}
                  />
                </Field>
              </Field>
              <Field>
                <Button type="submit">Create Account</Button>
                <FieldDescription className="text-center">
                  Already have an account? <Link to="/login">Sign in</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
