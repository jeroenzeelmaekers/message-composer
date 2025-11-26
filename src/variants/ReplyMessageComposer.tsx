import MessageComposer from "../ui/message-composer";

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
        <div className="flex flex-row w-full justify-end">
          <MessageComposer.SendButton />
        </div>
      </MessageComposer.Footer>
    </MessageComposer.Provider>
  );
}
