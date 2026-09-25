"use client";

import { Button as UiButton, drawerDialogClass } from "@/components/ui";

import CustomInputComponent from "@/components/custom-input-component";
import LmcService from "@/api/lmc";
import { useFileUpload } from "@/hooks/use-file-upload";
import ToastService from "@/utils/toast-service";
import { Button, CloseButton, CloseIcon, Drawer, Form } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import React from "react";
import { IoCameraOutline } from "react-icons/io5";
import { RiDeleteBin6Line, RiEditLine } from "react-icons/ri";
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
      <Button
        className="bg-primary px-5 text-white rounded-lg text-xs font-bold"
        size="sm"
        onClick={() => setDrawerOpen(true)}
      >
        <RiEditLine />
        Edit
      </Button>
      <Drawer.Backdrop
        variant="blur"
        className="backdrop-blur-xs"
        isOpen={drawerIsOpen}
        onOpenChange={setDrawerOpen}
      >
        <Drawer.Content placement="right">
          <Drawer.Dialog className={drawerDialogClass}>
            <Drawer.Header>
              <CloseButton
                className="flex size-8 cursor-pointer items-center justify-center self-end rounded-full bg-subtle text-muted-foreground transition-colors hover:bg-zinc-200 hover:text-foreground"
                onClick={() => setDrawerOpen(false)}
              >
                <CloseIcon className="size-4" />
              </CloseButton>
            </Drawer.Header>
            <Drawer.Body className="px-5 pb-6">
              <Form onSubmit={handleSubmit}>
                <div className="flex flex-col space-y-3">
                  <span className="text-lg font-bold">Edit Supervisor</span>
                  <div key={info?.name ?? "loading"} className="space-y-4">
                    <SelfieInputComponent />
                    <div className="w-full flex justify-center">
                      <div
                        className={`relative rounded-full w-35 h-35 ${selfieFiles.length === 0 ? "border" : ""} justify-center flex flex-col`}
                        onClick={onSelfieUploadClick}
                      >
                        <div
                          className={`flex flex-col items-center ${selfieFiles.length === 0 ? "p-3" : ""} space-y-2`}
                        >
                          {selfieFiles.length === 0 ? (
                            <>
                              <IoCameraOutline size={25} />
                              <span className="text-center text-xs">
                                Click to add photo
                              </span>
                            </>
                          ) : (
                            <div className="relative w-35 h-35 rounded-full overflow-hidden">
                              <Image
                                src={URL.createObjectURL(selfieFiles[0])}
                                alt="Profile"
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                        </div>
                        {selfieFiles.length > 0 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSelfie(0);
                            }}
                            className="absolute top-1 right-3 z-10 cursor-pointer bg-white rounded-full p-1"
                          >
                            <RiDeleteBin6Line className="text-rose-500" />
                          </span>
                        )}
                      </div>
                    </div>
                    <CustomInputComponent
                      label="First Name"
                      name="firstName"
                      defaultValue={defaultFirstName}
                      isRequired
                    />
                    <CustomInputComponent
                      label="Last Name"
                      name="lastName"
                      defaultValue={defaultLastName}
                      isRequired
                    />
                    <CustomInputComponent
                      label="Phone Number"
                      name="phoneNumber"
                      type="tel"
                      defaultValue={info?.phone}
                    />
                  </div>
                  <UiButton
                    className="mt-2"
                    size="lg"
                    type="submit"
                    fullWidth
                    isPending={isPending}
                  >
                    {isPending ? "Saving…" : "Save supervisor"}
                  </UiButton>
                </div>
              </Form>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

export default EditLmcUserDrawer;
