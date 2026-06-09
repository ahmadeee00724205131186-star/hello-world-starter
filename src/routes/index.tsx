import { createFileRoute } from "@tanstack/react-router";
import { Hand } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hello — Welcome" },
      { name: "description", content: "A simple, friendly greeting page." },
      { property: "og:title", content: "Hello" },
      { property: "og:description", content: "A simple, friendly greeting page." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <div className="mb-6 inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
          <Hand className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Hello, World!
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">
          Welcome to your new app. This is a simple, friendly place to start building something great.
        </p>
      </div>
    </div>
  );
}
