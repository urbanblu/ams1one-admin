"use client";

import {
  AvatarDropzone,
  Button as UiButton,
  DrawerTitleBar,
  FileDropzone,
  IconButton,
  drawerBodyClass,
  drawerDialogClass,
  drawerFooterClass,
  drawerWidth,
} from "@/components/ui";

import CustomDatePicker from "@/components/custom-date-picker";
import CustomInputComponent from "@/components/custom-input-component";
import CustomSelectComponent from "@/components/custom-select-component";
import LmcService from "@/api/lmc";
import WritersService from "@/api/writers";
import { useFileUpload } from "@/hooks/use-file-upload";
import ToastService from "@/utils/toast-service";
import ApiError from "@/utils/api_error";
import { cn, Drawer, Form } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { LuPencil } from "react-icons/lu";

function EditRetailerUserDrawer({ writerId }: { writerId: string }) {
  const [drawerIsOpen, setDrawerOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("");
  const queryClient = useQueryClient();

  const {
    files: selfieFiles,
    previewUrls: selfiePreviewUrls,
    onClick: onSelfieUploadClick,
    InputComponent: SelfieInputComponent,
    removeFile: removeSelfie,
    clearFiles: clearSelfie,
  } = useFileUpload({
    accept: "image/*",
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onMaxFileSizeDetected: () => {
      ToastService.info({ text: "Maximum file size exceeded" });
    },
  });

  const {
    files: idCardFiles,
    previewUrls: idCardPreviewUrls,
    onClick: onIdCardUploadClick,
    InputComponent: IdCardInputComponent,
    removeFile: removeIdCardFile,
    clearFiles: clearIdCard,
  } = useFileUpload({
    accept: "image/*",
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onMaxFileSizeDetected: () => {
      ToastService.info({ text: "Maximum file size exceeded" });
    },
  });

  const { data: writerDetail } = useQuery({
    queryKey: ["writers", writerId, "detail"],
    queryFn: () => WritersService.fetchWriterDetail(writerId),
    enabled: drawerIsOpen && !!writerId,
  });

  // Reuses cached data from the parent page — no extra network call
  const { data: writerProfile } = useQuery({
    queryKey: ["writers", "profile", writerId],
    queryFn: () => WritersService.fetchWriterProfile(writerId),
    enabled: drawerIsOpen && !!writerId,
  });

  const { data: lmcs = [], isPending: lmcPending } = useQuery({
    queryKey: ["lmc", "owners"],
    queryFn: LmcService.fetchLmcOwners,
    enabled: drawerIsOpen,
  });

  const lmcOptions = lmcs.map((lmc) => ({
    key: lmc.id,
    label: `${lmc.owner?.full_name ?? lmc.name} (${lmc.code})`,
  }));

  // Merge detail + profile — detail has split names & supervisor_id,
  // profile is the reliable source for location, dob, photo, id card.
  // Split profile.name as fallback for first/last when detail hasn't loaded yet.
  const profileNameParts = writerProfile?.name.trim().split(/\s+/) ?? [];
  const merged = {
    first_name:
      writerDetail?.first_name ||
      profileNameParts.slice(0, -1).join(" ") ||
      profileNameParts[0] ||
      "",
    last_name:
      writerDetail?.last_name ||
      (profileNameParts.length > 1
        ? profileNameParts[profileNameParts.length - 1]
        : "") ||
      "",
    email: writerDetail?.email ?? writerProfile?.email ?? "",
    phone: writerDetail?.phone ?? writerProfile?.phone ?? "",
    photo_url: writerDetail?.photo_url ?? writerProfile?.photo_url ?? null,
    id_card_image_url:
      writerDetail?.id_card_image_url ??
      writerProfile?.id_card_image_url ??
      null,
    location_address:
      writerDetail?.location_address ?? writerProfile?.location_address ?? "",
    date_of_birth:
      writerDetail?.date_of_birth ?? writerProfile?.date_of_birth ?? "",
    supervisor_id: writerDetail?.supervisor_id ?? "",
  };

  // Key progresses through states to force remount with fresh defaultValues each time
  // a new data source becomes available (profile first, then detail with split names).
  const formKey = writerDetail
    ? `detail-${writerId}`
    : writerProfile
      ? `profile-${writerId}`
      : "loading";

  const { mutateAsync: editWriter, isPending } = useMutation({
    mutationKey: ["writers", writerId, "edit"],
    mutationFn: (payload: Parameters<typeof WritersService.editWriter>[1]) =>
      WritersService.editWriter(writerId, payload),
    onSuccess: async () => {
      ToastService.success({ text: "Retailer updated successfully" });
      await queryClient.invalidateQueries({
        queryKey: ["writers", "profile", writerId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["writers", writerId, "detail"],
      });
      clearSelfie();
      clearIdCard();
      setDrawerOpen(false);
    },
    onError: (error: ApiError) => {
      ToastService.error({
        text: error?.message ?? "Failed to update retailer",
      });
    },
  });

  const handleSubmit: React.ComponentProps<typeof Form>["onSubmit"] = async (
    e,
  ) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    await editWriter({
      first_name: String(data.firstName ?? ""),
      last_name: String(data.lastName ?? ""),
      email: String(data.email ?? ""),
      phone: String(data.phoneNumber ?? ""),
      location_address: String(data.location ?? ""),
      date_of_birth: selectedDate ?? merged.date_of_birth,
      supervisor_id: selectedSupervisorId || merged.supervisor_id,
      photo: selfieFiles[0] ?? null,
      id_card_image: idCardFiles[0] ?? null,
    });
  };

  const existingDateValue = (() => {
    const dob = merged.date_of_birth;
    if (!dob) return undefined;
    try {
      return parseDate(dob);
    } catch {
      return undefined;
    }
  })();

  const supervisorInitialKey = selectedSupervisorId || merged.supervisor_id;

  return (
    <Drawer>
      <IconButton label="Edit writer" onClick={() => setDrawerOpen(true)}>
        <LuPencil />
      </IconButton>
      <Drawer.Backdrop isOpen={drawerIsOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content placement="right">
          <Drawer.Dialog className={cn(drawerDialogClass, drawerWidth.form)}>
            <Form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={handleSubmit}
            >
              <DrawerTitleBar
                icon={<LuPencil />}
                title="Edit writer"
                description={writerProfile?.name || undefined}
                onClose={() => setDrawerOpen(false)}
              />
              <Drawer.Body className={drawerBodyClass}>
                <div key={formKey} className="space-y-4">
                  <SelfieInputComponent />
                  <IdCardInputComponent />

                  <AvatarDropzone
                    file={selfieFiles[0]}
                    previewUrl={selfiePreviewUrls[0]}
                    existingUrl={merged.photo_url}
                    onPick={onSelfieUploadClick}
                    onRemove={() => removeSelfie(0)}
                  />

                  <FileDropzone
                    label="ID card image"
                    hint="JPG, PNG — max 10 MB"
                    file={idCardFiles[0]}
                    previewUrl={idCardPreviewUrls[0]}
                    existingUrl={merged.id_card_image_url}
                    onPick={onIdCardUploadClick}
                    onRemove={() => removeIdCardFile(0)}
                  />

                  <CustomInputComponent
                    label="First name"
                    name="firstName"
                    defaultValue={merged.first_name}
                    isRequired
                  />
                  <CustomInputComponent
                    label="Last name"
                    name="lastName"
                    defaultValue={merged.last_name}
                    isRequired
                  />
                  <CustomInputComponent
                    label="Email"
                    name="email"
                    type="email"
                    showPreficIcon={false}
                    showPlaceholder={false}
                    isRequired={false}
                    defaultValue={merged.email}
                  />
                  <CustomInputComponent
                    label="Phone number"
                    name="phoneNumber"
                    type="tel"
                    defaultValue={merged.phone}
                  />
                  <CustomInputComponent
                    label="Location"
                    name="location"
                    defaultValue={merged.location_address}
                  />
                  <CustomSelectComponent
                    label="Supervisor"
                    placeholder="Select supervisor"
                    showDropDownIcon
                    list={lmcOptions}
                    isDisabled={lmcPending || lmcOptions.length === 0}
                    initialItemKey={supervisorInitialKey}
                    onSelectionChange={(val) =>
                      setSelectedSupervisorId(val.key)
                    }
                  />
                  <CustomDatePicker
                    label="Date of birth"
                    className="w-full"
                    defaultValue={existingDateValue}
                    onDatePicked={(date) => setSelectedDate(date.toString())}
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
                  {isPending ? "Saving…" : "Save writer"}
                </UiButton>
              </Drawer.Footer>
            </Form>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

export default EditRetailerUserDrawer;
