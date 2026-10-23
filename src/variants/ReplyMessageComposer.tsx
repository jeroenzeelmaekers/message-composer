import MessageComposer from "../ui/message-composer";

export default function ReplyMessageComposer() {
  return (
    <MessageComposer.Provider onSend={() => {}}>
      <MessageComposer.PresetHeader />
      <MessageComposer.Input label="Reply message" />
      <MessageComposer.Footer>
        <div className="flex w-full justify-end">
          <MessageComposer.SendButton />
        </div>
      </MessageComposer.Footer>
    </MessageComposer.Provider>
  );
}
