import MessageComposer from "../ui/message-composer";

export default function ChatMessageComposer() {
  return (
    <MessageComposer.Provider onSend={() => {}}>
      <MessageComposer.FileDrop>
        <MessageComposer.PresetHeader />
        <MessageComposer.Input label="Chat message" />
        <MessageComposer.PresetFooter />
      </MessageComposer.FileDrop>
      <MessageComposer.FileList />
    </MessageComposer.Provider>
  );
}
