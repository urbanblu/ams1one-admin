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
  FileDropzone,
  PageShell,
  Skeleton,
  Textarea,
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
    previewUrls: apkPreviewUrls,
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
    <PageShell narrow>
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
              {/* A version is a token, not a word — the badge's capitalize
                  would render it "V1.2.3". */}
              <Badge tone="info" className="normal-case">
                v{latest.version}
              </Badge>
              {latest.apk_url && (
                <div>
                  <a
                    href={latest.apk_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 transition-colors hover:text-brand-700"
                  >
                    <LuDownload className="size-3.5" />
                    Download APK
                  </a>
                </div>
              )}
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-700">
                The download link is a presigned S3 URL valid for 1 hour.
                Refresh the page for a fresh link.
              </p>
            </div>
          ) : (
            <p className="text-sm text-foreground-light">
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
                <ApkInput />
                <FileDropzone
                  label="APK file"
                  isRequired
                  preview="name"
                  hint="A single .apk"
                  file={apkFiles[0]}
                  previewUrl={apkPreviewUrls[0]}
                  onPick={pickApk}
                  onRemove={clearApk}
                />
              </div>

              <Textarea
                label="Release notes (optional)"
                name="release_notes"
                placeholder="What changed in this build"
                rows={3}
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
