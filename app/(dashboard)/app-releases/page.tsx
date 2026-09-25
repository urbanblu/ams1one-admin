"use client";

import CustomInputComponent from "@/components/custom-input-component";
import ReleasesService, { IRelease } from "@/api/releases";
import ToastService from "@/utils/toast-service";
import ApiError from "@/utils/api_error";
import { Form } from "@heroui/react";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  PageShell,
  Skeleton,
} from "@/components/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useFileUpload } from "@/hooks/use-file-upload";
import { LuDownload, LuPackage, LuUpload } from "react-icons/lu";

function AppReleasesView() {
  const queryClient = useQueryClient();
  const [uploadFormKey, setUploadFormKey] = useState(0);

  const {
    files: apkFiles,
    onClick: pickApk,
    clearFiles: clearApk,
    InputComponent: ApkInput,
  } = useFileUpload({ accept: ".apk", multiple: false });

  const { data: latest, isLoading: loadingLatest } = useQuery<IRelease>({
    queryKey: ["releases", "latest"],
    queryFn: () => ReleasesService.getLatestRelease(),
  });

  const { mutate: upload, isPending: uploading } = useMutation({
    mutationFn: (fd: FormData) => {
      const version = String(fd.get("version") ?? "").trim();
      const release_notes = String(fd.get("release_notes") ?? "").trim();
      return ReleasesService.uploadRelease({
        version,
        apk_file: apkFiles[0],
        release_notes: release_notes || undefined,
        is_published: true,
      });
    },
    onSuccess: () => {
      ToastService.success({ text: "APK uploaded successfully." });
      clearApk();
      setUploadFormKey((k) => k + 1);
      queryClient.invalidateQueries({ queryKey: ["releases", "latest"] });
    },
    onError: (err: ApiError) => {
      ToastService.error({ text: err.message ?? "Upload failed." });
    },
  });

  const handleSubmit: React.ComponentProps<typeof Form>["onSubmit"] = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const version = String(fd.get("version") ?? "").trim();

    if (!version) {
      ToastService.error({ text: "Enter a version number." });
      return;
    }
    if (apkFiles.length === 0) {
      ToastService.error({ text: "Select an APK file to upload." });
      return;
    }

    upload(fd);
  };

  return (
    <PageShell className="max-w-xl">
      <PageHeader
        title="App releases"
        description="Publish a new writer app build and share the download link."
      />

      {/* Current release */}
      <Card>
        <CardHeader
          icon={<LuPackage />}
          title="Current release"
          description="What writers are downloading today"
        />
        <CardBody>
          {loadingLatest ? (
            <Skeleton className="h-6 w-28 rounded-full" />
          ) : latest?.version ? (
            <div className="space-y-3">
              <Badge tone="info">
                <LuPackage className="size-3.5" />v{latest.version}
              </Badge>
              {latest.apk_url && (
                <div>
                  <a
                    href={latest.apk_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary-strong"
                  >
                    <LuDownload className="size-3.5" />
                    Download APK
                  </a>
                </div>
              )}
              <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-[11px] leading-relaxed text-amber-700">
                The download link is a presigned S3 URL valid for 1 hour.
                Refresh the page for a fresh link.
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No published release yet.
            </p>
          )}
        </CardBody>
      </Card>

      {/* Upload new release */}
      <Card>
        <CardHeader
          icon={<LuUpload />}
          title="Upload new release"
          description="APK plus an optional changelog"
        />
        <CardBody>
          <Form key={uploadFormKey} onSubmit={handleSubmit}>
            <div className="space-y-4 w-full">
              <CustomInputComponent
                label="Version (e.g. 1.4.2)"
                name="version"
                showPreficIcon={false}
                showPlaceholder={false}
                isRequired
              />

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                  APK file *
                </p>
                <ApkInput />
                <button
                  type="button"
                  onClick={pickApk}
                  className="w-full cursor-pointer rounded-xl border border-dashed border-border bg-surface-muted px-4 py-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {apkFiles[0] ? (
                    <span className="font-semibold text-foreground">
                      {apkFiles[0].name}
                    </span>
                  ) : (
                    "Click to select an APK file (.apk)"
                  )}
                </button>
                {apkFiles[0] && (
                  <button
                    type="button"
                    onClick={clearApk}
                    className="mt-1.5 cursor-pointer text-[11px] font-medium text-rose-500 hover:underline"
                  >
                    Remove file
                  </button>
                )}
              </div>

              <CustomInputComponent
                label="Release notes (optional)"
                name="release_notes"
                showPreficIcon={false}
                showPlaceholder={false}
                isRequired={false}
              />

              <Button
                type="submit"
                size="lg"
                fullWidth
                className="mt-2"
                isPending={uploading}
              >
                <LuUpload />
                {uploading ? "Uploading…" : "Upload release"}
              </Button>
            </div>
          </Form>
        </CardBody>
      </Card>
    </PageShell>
  );
}

export default AppReleasesView;
