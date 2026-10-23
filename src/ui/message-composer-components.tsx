import { LexicalExtensionComposer } from "@lexical/react/LexicalExtensionComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { useLexicalIsTextContentEmpty } from "@lexical/react/useLexicalIsTextContentEmpty";
import { $createCodeNode, CodeExtension, CodeIndentExtension } from "@lexical/code";
import { ClearEditorExtension } from "@lexical/extension";
import { HistoryExtension } from "@lexical/history";
import { RichTextExtension } from "@lexical/rich-text";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListExtension,
  REMOVE_LIST_COMMAND,
  $isListNode,
  type ListType,
} from "@lexical/list";
import { LinkExtension, TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  CLEAR_EDITOR_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  IS_APPLE,
  type EditorThemeClasses,
  type LexicalEditor,
  type LexicalNode,
  type SerializedEditorState,
  type TextFormatType,
  defineExtension,
} from "lexical";
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
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type Dispatch,
  type MouseEventHandler,
  type PropsWithChildren,
  type ReactNode,
  type SetStateAction,
} from "react";
import Dropzone from "react-dropzone";
import { cn } from "../lib/utils";
import { MAX_FILES, MAX_FILE_SIZE, getFileKey, mergeFiles } from "./file-utils";

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
  code: "font-mono bg-gray-100 rounded px-1",
} satisfies EditorThemeClasses;

const COMPOSER_EXTENSION = defineExtension({
  name: "message-composer",
  namespace: "message-composer",
  dependencies: [
    ClearEditorExtension,
    CodeExtension,
    CodeIndentExtension,
    HistoryExtension,
    LinkExtension,
    ListExtension,
    RichTextExtension,
  ],
  theme: THEME,
  onError(error: Error) {
    console.error(error);
  },
});

export type MessagePayload = {
  editorState: SerializedEditorState;
  text: string;
  files: File[];
};

type ComposerContext = {
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
  addFiles: (files: readonly File[]) => void;
  openFilePicker: () => void;
  onSend?: (payload: MessagePayload) => void | Promise<void>;
  sendMessage: (editor: LexicalEditor) => Promise<void>;
  isSending: boolean;
  status: string;
  statusIsError: boolean;
};

const MessageComposerContext = createContext<ComposerContext | undefined>(undefined);

function useMessageComposerContext() {
  const context = useContext(MessageComposerContext);
  if (!context) {
    throw new Error("useMessageComposerContext must be used within a MessageComposer.Provider");
  }
  return context;
}

type ProviderProps = PropsWithChildren<{
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  onSend?: (payload: MessagePayload) => void | Promise<void>;
}>;

export function Provider({
  children,
  files: controlledFiles,
  onFilesChange,
  onSend,
}: ProviderProps) {
  const [uncontrolledFiles, setUncontrolledFiles] = useState<File[]>([]);
  const files = controlledFiles ?? uncontrolledFiles;
  const filesRef = useRef(files);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);

  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const setFiles: Dispatch<SetStateAction<File[]>> = (update) => {
    const nextFiles = typeof update === "function" ? update(filesRef.current) : update;
    filesRef.current = nextFiles;
    if (controlledFiles === undefined) {
      setUncontrolledFiles(nextFiles);
    }
    onFilesChange?.(nextFiles);
  };

  function addFiles(incomingFiles: readonly File[]) {
    const { files: nextFiles, rejectedCount } = mergeFiles(filesRef.current, incomingFiles);
    setFiles(nextFiles);
    setStatusIsError(rejectedCount > 0);
    setStatus(
      rejectedCount > 0
        ? `${rejectedCount} file${rejectedCount === 1 ? " was" : "s were"} not added. Add up to ${MAX_FILES} files, each no larger than 10 MiB.`
        : "",
    );
  }

  async function sendMessage(editor: LexicalEditor) {
    if (!onSend || sendingRef.current) return;

    sendingRef.current = true;
    setIsSending(true);
    setStatus("");
    setStatusIsError(false);

    const editorState = editor.getEditorState();
    const payload: MessagePayload = {
      editorState: editorState.toJSON(),
      text: editorState.read(() => $getRoot().getTextContent()),
      files: [...filesRef.current],
    };

    try {
      await onSend(payload);
      editor.dispatchCommand(CLEAR_EDITOR_COMMAND, undefined);
      setFiles([]);
    } catch {
      setStatus("Message could not be sent. Try again.");
      setStatusIsError(true);
    } finally {
      sendingRef.current = false;
      setIsSending(false);
    }
  }

  return (
    <MessageComposerContext.Provider
      value={{
        files,
        setFiles,
        addFiles,
        openFilePicker: () => fileInputRef.current?.click(),
        onSend,
        sendMessage,
        isSending,
        status,
        statusIsError,
      }}
    >
      <div className="w-full max-w-[37.5rem] rounded-lg border border-gray-300 bg-gray-50 p-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(event) => {
            addFiles(Array.from(event.currentTarget.files ?? []));
            event.currentTarget.value = "";
          }}
        />
        <LexicalExtensionComposer extension={COMPOSER_EXTENSION} contentEditable={null}>
          {children}
        </LexicalExtensionComposer>
        {status && (
          <p
            role={statusIsError ? "alert" : "status"}
            className={cn("px-2 pt-1 text-sm", statusIsError ? "text-red-800" : "text-gray-700")}
          >
            {status}
          </p>
        )}
      </div>
    </MessageComposerContext.Provider>
  );
}

export function PresetHeader() {
  return (
    <Header aria-label="Message formatting">
      <ActionGroup aria-label="Text style">
        <BoldButton />
        <ItalicButton />
        <StrikeThroughButton />
      </ActionGroup>
      <Divider />
      <ActionGroup aria-label="Insert formatting">
        <LinkButton />
        <ListButton />
        <OrderedListButton />
      </ActionGroup>
      <Divider />
      <ActionGroup aria-label="Block formatting">
        <IncrementIndentButton />
        <CodeBlockButton />
      </ActionGroup>
    </Header>
  );
}

export function Header({ children, ...props }: PropsWithChildren<ComponentProps<"div">>) {
  return (
    <div
      {...props}
      role="group"
      aria-label={props["aria-label"] ?? "Message formatting"}
      className={cn("flex flex-wrap", props.className)}
    >
      {children}
    </div>
  );
}

function useFormatActive(format: TextFormatType) {
  const [editor] = useLexicalComposerContext();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    function updateFormat() {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        setIsActive($isRangeSelection(selection) && selection.hasFormat(format));
      });
    }

    updateFormat();
    return editor.registerUpdateListener(updateFormat);
  }, [editor, format]);

  return isActive;
}

function useListActive(type: ListType) {
  const [editor] = useLexicalComposerContext();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    function updateList() {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          setIsActive(false);
          return;
        }

        let node: LexicalNode | null = selection.anchor.getNode();
        while (node) {
          if ($isListNode(node)) {
            setIsActive(node.getListType() === type);
            return;
          }
          node = node.getParent();
        }
        setIsActive(false);
      });
    }

    updateList();
    return editor.registerUpdateListener(updateList);
  }, [editor, type]);

  return isActive;
}

function withAction(
  action: () => void,
  consumerHandler?: MouseEventHandler<HTMLButtonElement>,
): MouseEventHandler<HTMLButtonElement> {
  return (event) => {
    consumerHandler?.(event);
    if (!event.defaultPrevented) action();
  };
}

export function BoldButton({ type = "button", onClick, ...props }: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();
  const isActive = useFormatActive("bold");

  return (
    <Button
      {...props}
      type={type}
      tooltip={`Bold · ${IS_APPLE ? "⌘B" : "Ctrl+B"}`}
      aria-keyshortcuts={IS_APPLE ? "Meta+B" : "Control+B"}
      aria-pressed={isActive}
      onClick={withAction(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold"), onClick)}
    >
      <BoldIcon size={ICON_SIZE} aria-hidden="true" />
      <span className="sr-only">Bold</span>
    </Button>
  );
}

export function ItalicButton({ type = "button", onClick, ...props }: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();
  const isActive = useFormatActive("italic");

  return (
    <Button
      {...props}
      type={type}
      tooltip={`Italic · ${IS_APPLE ? "⌘I" : "Ctrl+I"}`}
      aria-keyshortcuts={IS_APPLE ? "Meta+I" : "Control+I"}
      aria-pressed={isActive}
      onClick={withAction(() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic"), onClick)}
    >
      <ItalicIcon size={ICON_SIZE} aria-hidden="true" />
      <span className="sr-only">Italic</span>
    </Button>
  );
}

export function StrikeThroughButton({
  type = "button",
  onClick,
  ...props
}: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();
  const isActive = useFormatActive("strikethrough");

  return (
    <Button
      {...props}
      type={type}
      tooltip="Strike through"
      aria-pressed={isActive}
      onClick={withAction(
        () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough"),
        onClick,
      )}
    >
      <StrikethroughIcon size={ICON_SIZE} aria-hidden="true" />
      <span className="sr-only">Strike through</span>
    </Button>
  );
}

export function LinkButton({ type = "button", onClick, ...props }: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();

  function addOrEditLink() {
    const url = prompt("Enter URL");
    if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
  }

  return (
    <Button {...props} type={type} tooltip="Link" onClick={withAction(addOrEditLink, onClick)}>
      <LinkIcon size={ICON_SIZE} aria-hidden="true" />
      <span className="sr-only">Link</span>
    </Button>
  );
}

export function ListButton({ type = "button", onClick, ...props }: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();
  const isActive = useListActive("bullet");

  return (
    <Button
      {...props}
      type={type}
      tooltip="Bulleted list"
      aria-pressed={isActive}
      onClick={withAction(
        () =>
          editor.dispatchCommand(
            isActive ? REMOVE_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND,
            undefined,
          ),
        onClick,
      )}
    >
      <ListIcon size={ICON_SIZE} aria-hidden="true" />
      <span className="sr-only">List</span>
    </Button>
  );
}

export function OrderedListButton({
  type = "button",
  onClick,
  ...props
}: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();
  const isActive = useListActive("number");

  return (
    <Button
      {...props}
      type={type}
      tooltip="Numbered list"
      aria-pressed={isActive}
      onClick={withAction(
        () =>
          editor.dispatchCommand(
            isActive ? REMOVE_LIST_COMMAND : INSERT_ORDERED_LIST_COMMAND,
            undefined,
          ),
        onClick,
      )}
    >
      <ListOrderedIcon size={ICON_SIZE} aria-hidden="true" />
      <span className="sr-only">Ordered list</span>
    </Button>
  );
}

export function IncrementIndentButton({
  type = "button",
  onClick,
  ...props
}: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();

  return (
    <Button
      {...props}
      type={type}
      tooltip="Increase indent"
      onClick={withAction(() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined), onClick)}
    >
      <ListIndentIncreaseIcon size={ICON_SIZE} aria-hidden="true" />
      <span className="sr-only">Increase indent</span>
    </Button>
  );
}

export function CodeBlockButton({ type = "button", onClick, ...props }: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();

  function insertCodeBlock() {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) selection.insertNodes([$createCodeNode()]);
    });
  }

  return (
    <Button
      {...props}
      type={type}
      tooltip="Code block"
      onClick={withAction(insertCodeBlock, onClick)}
    >
      <CodeSquareIcon size={ICON_SIZE} aria-hidden="true" />
      <span className="sr-only">Code block</span>
    </Button>
  );
}

export function SendButton({ type = "button", onClick, ...props }: ComponentProps<"button">) {
  const [editor] = useLexicalComposerContext();
  const { onSend, sendMessage, isSending } = useMessageComposerContext();

  return (
    <Button
      {...props}
      type={type}
      disabled={props.disabled || !onSend || isSending}
      onClick={withAction(() => void sendMessage(editor), onClick)}
    >
      <SendIcon size={ICON_SIZE} aria-hidden="true" />
      <span className="sr-only">{isSending ? "Sending message" : "Send message"}</span>
    </Button>
  );
}

export function FileButton({ type = "button", onClick, ...props }: ComponentProps<"button">) {
  const { openFilePicker } = useMessageComposerContext();

  return (
    <Button {...props} type={type} onClick={withAction(openFilePicker, onClick)}>
      <PaperclipIcon size={ICON_SIZE} aria-hidden="true" />
      <span className="sr-only">Add file</span>
    </Button>
  );
}

function Button({
  className,
  type = "button",
  tooltip,
  ...props
}: ComponentProps<"button"> & { tooltip?: string }) {
  const tooltipId = useId();

  return (
    <span className="group relative inline-flex">
      <button
        {...props}
        type={type}
        aria-describedby={tooltip ? tooltipId : props["aria-describedby"]}
        className={cn(
          "inline-flex min-h-10 min-w-10 items-center justify-center rounded p-2 text-gray-700 hover:bg-gray-200 hover:text-gray-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50",
          props["aria-pressed"] && "bg-blue-100 text-blue-900 hover:bg-blue-200",
          className,
        )}
      />
      {tooltip && (
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-50 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white shadow group-hover:block group-focus-within:block"
        >
          {tooltip}
        </span>
      )}
    </span>
  );
}

export function ActionGroup({ children, ...props }: PropsWithChildren<ComponentProps<"div">>) {
  return (
    <div {...props} role="group" className={cn("flex", props.className)}>
      {children}
    </div>
  );
}

export function Divider({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  if (orientation === "horizontal") {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className="my-2 w-full border-t border-gray-300"
      />
    );
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className="mx-2 my-2 border-l border-gray-300"
    />
  );
}

export function Footer({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center">{children}</div>;
}

export function PresetFooter() {
  return (
    <Footer>
      <div className="flex w-full justify-end">
        <FileButton />
        <SendButton />
      </div>
    </Footer>
  );
}

export function Input({
  label = "Message",
  placeholder = "Write a message",
}: {
  label?: string;
  placeholder?: string;
}) {
  const [editor] = useLexicalComposerContext();
  const isEmpty = useLexicalIsTextContentEmpty(editor, true);

  return (
    <div className="relative mx-1 my-2 min-h-32">
      <ContentEditable
        ariaLabel={label}
        ariaMultiline={true}
        aria-placeholder={placeholder}
        placeholder={() => null}
        className="relative z-10 min-h-32 max-h-60 overflow-y-auto rounded px-2 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      />
      {isEmpty && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-2 top-2 text-gray-500"
        >
          {placeholder}
        </span>
      )}
    </div>
  );
}

export function FileDrop({ children }: { children: ReactNode }) {
  const { addFiles } = useMessageComposerContext();

  return (
    <Dropzone
      onDrop={(acceptedFiles, rejectedFiles) => {
        addFiles(acceptedFiles);
        if (rejectedFiles.length > 0) {
          // The provider reports all rejected or over-limit files in one message.
          addFiles(rejectedFiles.map((rejection) => rejection.file));
        }
      }}
      maxSize={MAX_FILE_SIZE}
      maxFiles={MAX_FILES}
      noClick
      noKeyboard
    >
      {({ getRootProps, getInputProps, isDragActive }) => (
        <div {...getRootProps({ className: "relative" })}>
          <input {...getInputProps()} />
          <div className="min-w-0">{children}</div>
          {isDragActive && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10 grid place-items-center rounded border-2 border-dashed border-blue-700 bg-blue-50/95 text-center font-medium text-blue-950"
            >
              Drop files here
            </div>
          )}
        </div>
      )}
    </Dropzone>
  );
}

export function FileList() {
  const { files, setFiles } = useMessageComposerContext();

  if (files.length === 0) return null;

  function removeFile(key: string) {
    setFiles((currentFiles) => currentFiles.filter((file) => getFileKey(file) !== key));
  }

  return (
    <>
      <Divider orientation="horizontal" />
      <ul aria-label="Attachments" className="flex flex-wrap gap-2">
        {files.map((file) => {
          const key = getFileKey(file);
          return (
            <li key={key} className="min-w-0 max-w-full">
              <button
                type="button"
                aria-label={`Remove attachment ${file.name}`}
                onClick={() => removeFile(key)}
                className="inline-flex min-h-10 max-w-full items-center gap-1 overflow-hidden rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-left text-sm text-gray-800 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                <FileIcon size={ICON_SIZE} className="shrink-0 text-gray-700" aria-hidden="true" />
                <span className="min-w-0 truncate">{file.name}</span>
                <XIcon size={ICON_SIZE} className="shrink-0 text-gray-700" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
