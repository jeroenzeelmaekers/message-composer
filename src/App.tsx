import type { PropsWithChildren } from "react";
import ChatMessageComposer from "./variants/ChatMessageComposer";
import ReplyMessageComposer from "./variants/ReplyMessageComposer";

export default function App() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 antialiased">
      <h1 className="sr-only">Message composer examples</h1>
      <VariantContainer title="Chat message composer">
        <ChatMessageComposer />
      </VariantContainer>
      <VariantContainer title="Reply message composer">
        <ReplyMessageComposer />
      </VariantContainer>
    </main>
  );
}

function VariantContainer({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <section className="flex min-w-0 flex-col gap-2">
      <h2 className="text-base font-medium text-gray-900">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
