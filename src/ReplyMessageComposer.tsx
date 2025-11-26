import MessageComposer from "./ui/message-composer";

export default function ReplyMessageComposer() {
  return (
    <MessageComposer.Provider
      onSend={() => {
        /*override send logic*/
      }}
    >
      <MessageComposer.PresetHeader />
      <MessageComposer.Input />
      <MessageComposer.Footer>
        <MessageComposer.SendButton />
      </MessageComposer.Footer>
    </MessageComposer.Provider>
  );
}
