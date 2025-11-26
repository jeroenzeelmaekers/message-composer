import {
  type InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { FORMAT_TEXT_COMMAND, type EditorThemeClasses } from "lexical";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import {
  BoldIcon,
  CodeSquareIcon,
  FileIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListIndentIncreaseIcon,
  ListOrderedIcon,
  PaperclipIcon,
  SendIcon,
  StrikethroughIcon,
  XIcon,
} from "lucide-react";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type ComponentProps,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
} from "@lexical/list";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { AutoLinkNode, LinkNode, TOGGLE_LINK_COMMAND } from "@lexical/link";
import Dropzone from "react-dropzone";

const ICON_SIZE = 16;

const THEME = {
  text: {
    bold: "font-bold",
    italic: "italic",
    strikethrough: "line-through",
  },
  list: {
    ul: "list-disc",
    ol: "list-decimal",
    listitem: "ml-6",
    nested: {
      listitem: "ml-4 list-inside",
    },
  },
} satisfies EditorThemeClasses;

type MessageComposerContext = {
  message?: string;
  files?: File[];
  setFiles?: Dispatch<SetStateAction<File[]>>;
  onSend?: () => void;
};

const MessageComposerContext = createContext<
  MessageComposerContext | undefined
>(undefined);

function useMessageComposerContext() {
  const context = useContext(MessageComposerContext);
  if (!context) {
    throw new Error(
      "useMessageComposerContext must be used within a MessageComposer.Provider",
    );
  }
  return context;
}

type ComposerProps = PropsWithChildren<MessageComposerContext>;

function Provider({ children, ...props }: ComposerProps) {
  const [files, setFiles] = useState<File[]>([]);

  const initialConfig = {
    namespace: "message-composer",
    onError(error: Error) {
      console.error(error);
    },
    theme: THEME,
    nodes: [ListNode, ListItemNode, LinkNode, AutoLinkNode],
  } satisfies InitialConfigType;

  return (
    <MessageComposerContext.Provider value={{ ...props, files, setFiles }}>
      <div className="border border-gray-200 rounded-lg p-1 w-[600px] max-h-[400px] bg-gray-50">
        <LexicalComposer initialConfig={initialConfig}>
          {children}

          <ListPlugin />
          <LinkPlugin />
        </LexicalComposer>
      </div>
    </MessageComposerContext.Provider>
  );
}

function PresetHeader() {
  return (
    <Header>
      <ActionGroup>
        <BoldButton />
        <ItalicButton />
        <StrikeThroughButton />
      </ActionGroup>
      <Divider />
      <ActionGroup>
        <LinkButton />
        <ListButton />
        <OrderedListButton />
      </ActionGroup>
      <Divider />
      <ActionGroup>
        <IncrementIndentButton />
        <CodeBlockButton />
      </ActionGroup>
    </Header>
  );
}

function Header({ children }: { children: ReactNode }) {
  return <div className="flex flex-row">{children}</div>;
}

function BoldButton({ type = "button", ...props }: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();

  function onClick() {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  }

  return (
    <Button type={type} onClick={onClick} {...props}>
      <BoldIcon size={ICON_SIZE} />
      <span className="sr-only">Bold</span>
    </Button>
  );
}

function ItalicButton({ type = "button", ...props }: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();

  function onClick() {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
  }

  return (
    <Button type={type} onClick={onClick} {...props}>
      <ItalicIcon size={ICON_SIZE} />
      <span className="sr-only">Italic</span>
    </Button>
  );
}

function StrikeThroughButton({
  type = "button",
  ...props
}: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();

  function onClick() {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
  }

  return (
    <Button type={type} onClick={onClick} {...props}>
      <StrikethroughIcon size={ICON_SIZE} />
      <span className="sr-only">Strike through</span>
    </Button>
  );
}

function LinkButton({ type = "button", ...props }: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();

  function onAddOrEditLink() {
    editor.getEditorState().read(() => {
      const url = prompt("Enter URL");
      if (!url) return;
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    });
  }

  return (
    <Button type={type} onClick={onAddOrEditLink} {...props}>
      <LinkIcon size={ICON_SIZE} />
      <span className="sr-only">Link</span>
    </Button>
  );
}

function ListButton({ type = "button", ...props }: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();

  function onClick() {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  }
  return (
    <Button type={type} onClick={onClick} {...props}>
      <ListIcon size={ICON_SIZE} />
      <span className="sr-only">List</span>
    </Button>
  );
}

function OrderedListButton({
  type = "button",
  ...props
}: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();

  function onClick() {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  }

  return (
    <Button type={type} onClick={onClick} {...props}>
      <ListOrderedIcon size={ICON_SIZE} />
      <span className="sr-only">Ordered list</span>
    </Button>
  );
}

function IncrementIndentButton({
  type = "button",
  ...props
}: ComponentProps<"button">) {
  return (
    <Button type={type} {...props}>
      <ListIndentIncreaseIcon size={ICON_SIZE} />
      <span className="sr-only">Increase indent</span>
    </Button>
  );
}

function CodeBlockButton({
  type = "button",
  ...props
}: ComponentProps<"button">) {
  return (
    <Button type={type} {...props}>
      <CodeSquareIcon size={ICON_SIZE} />
      <span className="sr-only">Code block</span>
    </Button>
  );
}

function SendButton({ type = "button", ...props }: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();
  const { files, onSend } = useMessageComposerContext();

  function onSendMessage() {
    // Override send behavior.
    if (onSend) onSend();

    // Default behavior: log the message and files to the console.
    const message = editor.getEditorState().toJSON();
    console.log("Sending message:", message);
    console.log("With files:", files);
  }

  return (
    <Button type={type} onClick={onSendMessage} {...props}>
      <SendIcon size={ICON_SIZE} />
      <span className="sr-only">Send message</span>
    </Button>
  );
}

function FileButton({ type = "button", ...props }: ComponentProps<"button">) {
  return (
    <Button type={type} {...props}>
      <PaperclipIcon size={ICON_SIZE} />
      <span className="sr-only">Add file</span>
    </Button>
  );
}

function Button(props: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="p-2 hover:bg-gray-200 text-gray-400 hover:text-gray-500 rounded"
    />
  );
}

function ActionGroup({ children }: { children: ReactNode }) {
  return <div className="flex flex-row">{children}</div>;
}

function Divider({
  orientation = "vertical",
}: {
  orientation?: "vertical" | "horizontal";
}) {
  if (orientation === "horizontal") {
    return <div className="border-t border-gray-200 my-2 w-full" />;
  }

  return (
    <div className="before:border-l before:border-gray-200 before:mx-2 my-auto" />
  );
}

function Footer({ children }: { children: ReactNode }) {
  return <div className="flex flex-row">{children}</div>;
}

function PresetFooter() {
  return (
    <Footer>
      <div className="flex flex-row w-full justify-end">
        <FileButton />
        <SendButton />
      </div>
    </Footer>
  );
}

function Input() {
  return (
    <RichTextPlugin
      contentEditable={
        <ContentEditable className="min-h-20 mx-2 outline-none" />
      }
      ErrorBoundary={LexicalErrorBoundary}
    />
  );
}

function FileDrop({ children }: { children: ReactNode }) {
  const { setFiles } = useMessageComposerContext();
  return (
    <Dropzone
      onDrop={(files) => setFiles?.((prev) => [...prev, ...files])}
      noClick
    >
      {({ getRootProps, getInputProps, isDragActive }) => (
        <section>
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <div className="bg-gray-100 rounded border border-dashed border-gray-300 h-full w-full relative">
                <p className="absolute justify-self-center top-1/2">
                  Drop files here
                </p>
                {children}
              </div>
            ) : (
              <>{children}</>
            )}
          </div>
        </section>
      )}
    </Dropzone>
  );
}

function FileList() {
  const { files, setFiles } = useMessageComposerContext();

  if (!files || files.length === 0) {
    return null;
  }

  function removeFile(index: number) {
    setFiles?.((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <>
      <MessageComposer.Divider orientation="horizontal" />
      <ul className="flex flex-row flex-wrap gap-1">
        {files?.map((file, index) => (
          <li key={index}>
            <button
              className="group flex flex-row items-center bg-white px-2.5 py-1 rounded-lg overflow-hidden border border-gray-200 hover:cursor-pointer"
              onClick={() => removeFile(index)}
            >
              <XIcon
                size={ICON_SIZE}
                className="hidden mr-1 text-gray-400 group-hover:inline"
              />
              <FileIcon
                size={ICON_SIZE}
                className="inline mr-1 text-gray-400 group-hover:hidden"
              />
              <span className="text-gray-600 text-sm">{file.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

const MessageComposer = {
  Provider,
  PresetHeader,
  Header,
  Footer,
  PresetFooter,
  Divider,
  Input,
  BoldButton,
  ItalicButton,
  StrikeThroughButton,
  LinkButton,
  ListButton,
  OrderedListButton,
  IncrementIndentButton,
  CodeBlockButton,
  SendButton,
  FileButton,
  FileDrop,
  FileList,
};

export default MessageComposer;
