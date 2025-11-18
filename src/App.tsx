import MessageComposer from "./ui/message-composer";

export default function App() {
  return (
    <main className="p-4">
      <MessageComposer.Provider>
        <MessageComposer.FileDrop>
          <MessageComposer.PresetHeader />
          <MessageComposer.Input />
          <MessageComposer.PresetFooter />
        </MessageComposer.FileDrop>
        <MessageComposer.FileList />
      </MessageComposer.Provider>
    </main>
  );
}
