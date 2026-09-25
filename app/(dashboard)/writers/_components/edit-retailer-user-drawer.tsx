"use client";

import { Button as UiButton, drawerDialogClass } from "@/components/ui";

import CustomDatePicker from "@/components/custom-date-picker";
import CustomInputComponent from "@/components/custom-input-component";
import CustomSelectComponent from "@/components/custom-select-component";
import LmcService from "@/api/lmc";
import WritersService from "@/api/writers";
import { useFileUpload } from "@/hooks/use-file-upload";
import ToastService from "@/utils/toast-service";
import ApiError from "@/utils/api_error";
import { CloseButton, CloseIcon, Drawer, Form } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import React, { useState } from "react";
import { IoCameraOutline } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import { FaRegEdit } from "react-icons/fa";

function EditRetailerUserDrawer({ writerId }: { writerId: string }) {
  const [drawerIsOpen, setDrawerOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("");
  const queryClient = useQueryClient();

  const {
    files: selfieFiles,
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
      <FaRegEdit
        className="w-3.5 h-3.5 text-blue-500 cursor-pointer"
        onClick={() => setDrawerOpen(true)}
      />
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
                  <span className="text-lg font-bold">Edit Retailer</span>

                  <div key={formKey} className="space-y-4 mt-4">
                    <SelfieInputComponent />
                    <IdCardInputComponent />

                    {/* Profile photo */}
                    <div className="w-full flex justify-center">
                      <div
                        className={`relative rounded-full w-35 h-35 ${
                          selfieFiles.length === 0 && !merged.photo_url
                            ? "border"
                            : ""
                        } justify-center flex flex-col`}
                        onClick={onSelfieUploadClick}
                      >
                        <div
                          className={`flex flex-col items-center ${
                            selfieFiles.length === 0 && !merged.photo_url
                              ? "p-3"
                              : ""
                          } space-y-2`}
                        >
                          {selfieFiles.length === 0 ? (
                            merged.photo_url ? (
                              <Image
                                src={merged.photo_url}
                                alt="Profile"
                                className="w-35 h-35 object-cover rounded-full"
                                width={140}
                                height={140}
                              />
                            ) : (
                              <>
                                <IoCameraOutline size={25} />
                                <span className="text-center text-xs text-muted-foreground">
                                  Click to add photo
                                </span>
                              </>
                            )
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

                    {/* ID card image */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">
                        ID Card Image
                      </span>
                      <div
                        className="relative w-full rounded-xl border border-dashed border-border overflow-hidden cursor-pointer hover:border-primary transition-colors"
                        style={{ minHeight: 120 }}
                        onClick={onIdCardUploadClick}
                      >
                        {idCardFiles.length === 0 ? (
                          merged.id_card_image_url ? (
                            <Image
                              src={merged.id_card_image_url}
                              alt="ID Card"
                              className="w-full object-cover rounded-xl"
                              width={400}
                              height={220}
                              style={{ maxHeight: 220, objectFit: "cover" }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center gap-2 py-8 text-zinc-400">
                              <IoCameraOutline size={28} />
                              <span className="text-xs">
                                Click to upload ID card image
                              </span>
                              <span className="text-[10px] text-zinc-300">
                                JPG, PNG — max 10 MB
                              </span>
                            </div>
                          )
                        ) : (
                          <Image
                            src={URL.createObjectURL(idCardFiles[0])}
                            alt="ID Card"
                            className="w-full object-cover rounded-xl"
                            width={400}
                            height={220}
                            style={{ maxHeight: 220, objectFit: "cover" }}
                          />
                        )}
                        {idCardFiles.length > 0 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              removeIdCardFile(0);
                            }}
                            className="absolute top-2 right-2 z-10 cursor-pointer bg-white rounded-full p-1"
                          >
                            <RiDeleteBin6Line className="text-rose-500" />
                          </span>
                        )}
                        {idCardFiles.length === 0 &&
                          merged.id_card_image_url && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                              <span className="text-white text-xs font-semibold">
                                Click to replace
                              </span>
                            </div>
                          )}
                      </div>
                    </div>

                    <CustomInputComponent
                      label="First Name"
                      name="firstName"
                      defaultValue={merged.first_name}
                      isRequired
                    />
                    <CustomInputComponent
                      label="Last Name"
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
                      label="Phone Number"
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
                      label="Date of Birth"
                      className="w-full"
                      defaultValue={existingDateValue}
                      onDatePicked={(date) => setSelectedDate(date.toString())}
                    />
                  </div>

                  <UiButton
                    className="mt-2"
                    size="lg"
                    type="submit"
                    fullWidth
                    isPending={isPending}
                  >
                    {isPending ? "Saving…" : "Save writer"}
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

export default EditRetailerUserDrawer;
