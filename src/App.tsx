import type { PropsWithChildren } from "react";
import ChatMessageComposer from "./variants/ChatMessageComposer";
import ReplyMessageComposer from "./variants/ReplyMessageComposer";

export default function App() {
  return (
    <main className="p-4 antialiased flex flex-col space-y-2">
      <VariantContainer title="Chat Message Composer">
        <ChatMessageComposer />
      </VariantContainer>
      <VariantContainer title="Reply Message Composer">
        <ReplyMessageComposer />
      </VariantContainer>
    </main>
  );
}

function VariantContainer({
  title,
  children,
}: PropsWithChildren<{ title: string }>) {
  return (
    <article className="flex flex-col gap-1">
      <h1 className="text-md font-medium text-gray-800">{title}</h1>
      <div>{children}</div>
    </article>
  );
}
