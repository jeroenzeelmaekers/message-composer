import MessageComposer from "./ui/message-composer";

export default function ChatMessageComposer() {
  return (
    <MessageComposer.Provider>
      <MessageComposer.FileDrop>
        <MessageComposer.PresetHeader />
        <MessageComposer.Input />
        <MessageComposer.PresetFooter />
      </MessageComposer.FileDrop>
      <MessageComposer.FileList />
    </MessageComposer.Provider>
  );
}
