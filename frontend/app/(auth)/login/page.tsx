import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 gap-6">
      <LoginForm />
      <p className="text-xs text-muted-foreground">
        Made with ❤️ by{" "}
        <a href="https://github.com/navneetsn18" target="_blank" rel="noopener noreferrer"
          className="hover:text-foreground transition-colors underline underline-offset-2">
          @navneetsn18
        </a>
      </p>
    </div>
  );
}
