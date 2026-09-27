"use client";

import {
  AvatarDropzone,
  Button as UiButton,
  DrawerTitleBar,
  drawerBodyClass,
  drawerDialogClass,
  drawerFooterClass,
  drawerWidth,
} from "@/components/ui";

import CustomInputComponent from "@/components/custom-input-component";
import LmcService from "@/api/lmc";
import { useFileUpload } from "@/hooks/use-file-upload";
import ToastService from "@/utils/toast-service";
import { cn, Drawer, Form } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { LuPencil } from "react-icons/lu";
import type { ILmcSummaryInfo } from "@/interfaces/lmc.interface";
import ApiError from "@/utils/api_error";

function EditLmcUserDrawer({
  lmcId,
  info,
}: {
  lmcId: string;
  info?: ILmcSummaryInfo;
}) {
  const [drawerIsOpen, setDrawerOpen] = React.useState(false);
  const queryClient = useQueryClient();

  const {
    files: selfieFiles,
    previewUrls: selfiePreviewUrls,
    onClick: onSelfieUploadClick,
    InputComponent: SelfieInputComponent,
    removeFile: removeSelfie,
    clearFiles,
  } = useFileUpload({
    accept: "image/*",
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onMaxFileSizeDetected: () => {
      ToastService.info({ text: "Maximum file size exceeded" });
    },
  });

  const nameParts = info?.name?.split(" ") ?? [];
  const defaultFirstName = nameParts[0] ?? "";
  const defaultLastName = nameParts.slice(1).join(" ");

  const { mutateAsync: editLmc, isPending } = useMutation({
    mutationKey: ["lmc", lmcId, "edit"],
    mutationFn: (payload: Parameters<typeof LmcService.editLmc>[1]) =>
      LmcService.editLmc(lmcId, payload),
    onSuccess: async () => {
      ToastService.success({ text: "Supervisor updated successfully" });
      await queryClient.invalidateQueries({
        queryKey: ["lmc", lmcId, "summary"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["lmc", "detail-cards"],
      });
      clearFiles();
      setDrawerOpen(false);
    },
    onError: (error: ApiError) => {
      ToastService.error({
        text: error?.message ?? "Failed to update supervisor",
      });
    },
  });

  const handleSubmit: React.ComponentProps<typeof Form>["onSubmit"] = async (
    e,
  ) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    await editLmc({
      first_name: String(data.firstName ?? ""),
      last_name: String(data.lastName ?? ""),
      phone: String(data.phoneNumber ?? ""),
      photo: selfieFiles[0] ?? null,
    });
  };

  return (
    <Drawer>
      <UiButton variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
        <LuPencil />
        Edit
      </UiButton>
      <Drawer.Backdrop isOpen={drawerIsOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content placement="right">
          <Drawer.Dialog className={cn(drawerDialogClass, drawerWidth.form)}>
            <Form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={handleSubmit}
            >
              <DrawerTitleBar
                icon={<LuPencil />}
                title="Edit supervisor"
                description={info?.name || undefined}
                onClose={() => setDrawerOpen(false)}
              />
              <Drawer.Body className={drawerBodyClass}>
                <div key={info?.name ?? "loading"} className="space-y-4">
                  <SelfieInputComponent />
                  <AvatarDropzone
                    file={selfieFiles[0]}
                    previewUrl={selfiePreviewUrls[0]}
                    onPick={onSelfieUploadClick}
                    onRemove={() => removeSelfie(0)}
                  />
                  <CustomInputComponent
                    label="First name"
                    name="firstName"
                    defaultValue={defaultFirstName}
                    isRequired
                  />
                  <CustomInputComponent
                    label="Last name"
                    name="lastName"
                    defaultValue={defaultLastName}
                    isRequired
                  />
                  <CustomInputComponent
                    label="Phone number"
                    name="phoneNumber"
                    type="tel"
                    defaultValue={info?.phone}
                  />
                </div>
              </Drawer.Body>
              <Drawer.Footer className={drawerFooterClass}>
                <UiButton
                  size="lg"
                  type="submit"
                  fullWidth
                  isPending={isPending}
                >
                  {isPending ? "Saving…" : "Save supervisor"}
                </UiButton>
              </Drawer.Footer>
            </Form>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

export default EditLmcUserDrawer;
