import { Button } from "@/components/ui";
import { useRef, useState, ChangeEvent, useCallback, useEffect } from "react";

interface UseFileUploadOptions {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number; // maximum number of files allowed
  onFilesSelected?: (files: File[]) => void;
  onMaxFileSizeDetected?: (files: File) => void;
}

interface UseFileUploadReturn {
  files: File[];
  /**
   * Blob URLs for `files`, index-aligned.
   *
   * They live here rather than in the previewing component because this is
   * where a file's lifetime is already decided: the URL is minted in the
   * change handler and released the moment its file leaves the list, so no
   * render ever mints one and nothing outstanding survives unmount.
   */
  previewUrls: string[];
  onClick: () => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  InputComponent: React.FC<{
    showFileList?: boolean;
  }>;
}

export const useFileUpload = ({
  accept = "image/*,.pdf,.doc,.docx",
  multiple = true,
  maxSize,
  maxFiles,
  onFilesSelected,
  onMaxFileSizeDetected,
}: UseFileUploadOptions = {}): UseFileUploadReturn => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  /* The same list as `previewUrls`, kept so the unmount cleanup can reach the
     current URLs without depending on them (a dependency would make the effect
     re-run and revoke a URL that is still on screen). Only the handlers below
     write to it, never a render. */
  const previewUrlsRef = useRef<string[]>([]);

  const replacePreviews = useCallback((next: string[]): void => {
    previewUrlsRef.current.forEach(URL.revokeObjectURL);
    previewUrlsRef.current = next;
    setPreviewUrls(next);
  }, []);

  // Release every outstanding URL when the owner unmounts — a closed drawer
  // must not keep a 10 MB image alive for the rest of the session.
  useEffect(
    () => () => {
      previewUrlsRef.current.forEach(URL.revokeObjectURL);
      previewUrlsRef.current = [];
    },
    [],
  );

  const onClick = useCallback((): void => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>): void => {
      const selectedFiles = e.target.files;
      if (selectedFiles) {
        let fileArray = Array.from(selectedFiles);

        // Filter by file size if maxSize is specified
        if (maxSize) {
          for (const file of fileArray) {
            if (file.size > maxSize) return onMaxFileSizeDetected?.(file);
          }
          fileArray = fileArray.filter((file) => file.size <= maxSize);
        }

        // Limit number of files if maxFiles is specified
        if (maxFiles && fileArray.length > maxFiles) {
          fileArray = fileArray.slice(0, maxFiles);
        }

        setFiles(fileArray);
        replacePreviews(fileArray.map((f) => URL.createObjectURL(f)));
        onFilesSelected?.(fileArray);
      }
    },
    [
      maxSize,
      maxFiles,
      onFilesSelected,
      onMaxFileSizeDetected,
      replacePreviews,
    ],
  );

  const removeFile = useCallback((index: number): void => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    const gone = previewUrlsRef.current[index];
    const kept = previewUrlsRef.current.filter((_, i) => i !== index);
    previewUrlsRef.current = kept;
    setPreviewUrls(kept);
    if (gone) URL.revokeObjectURL(gone);
  }, []);

  const clearFiles = useCallback((): void => {
    setFiles([]);
    replacePreviews([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [replacePreviews]);

  const InputComponent: React.FC<{
    showFileList?: boolean;
  }> = ({ showFileList = false }) => (
    <>
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        multiple={multiple}
        accept={accept}
      />
      {showFileList && files.length > 0 && (
        <div className="space-y-2 w-full">
          <div className="flex items-center justify-between">
            <p className="text-xs text-foreground-light">
              Selected files ({files.length})
            </p>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={clearFiles}
            >
              Clear all
            </Button>
          </div>
          <div className="space-y-2">
            {files.map((file: File, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-100 px-3 py-2.5"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-xs font-medium text-foreground">
                    {file.name}
                  </span>
                  <span className="text-xs tabular-nums text-foreground-light">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  return {
    files,
    previewUrls,
    onClick,
    removeFile,
    clearFiles,
    inputRef: inputRef as React.RefObject<HTMLInputElement>,
    InputComponent,
  };
};
