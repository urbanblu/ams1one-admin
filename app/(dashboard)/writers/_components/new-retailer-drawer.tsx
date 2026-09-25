import CustomDatePicker from "@/components/custom-date-picker";
import CustomInputComponent from "@/components/custom-input-component";
import CustomSelectComponent from "@/components/custom-select-component";
import LmcService from "@/api/lmc";
import WritersService from "@/api/writers";
import { useFileUpload } from "@/hooks/use-file-upload";
import ToastService from "@/utils/toast-service";
import { CloseButton, CloseIcon, Drawer, Form } from "@heroui/react";
import { Button as UiButton, drawerDialogClass } from "@/components/ui";
import { DateValue, getLocalTimeZone, today } from "@internationalized/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import React, { useState } from "react";
import { LuCamera, LuPlus, LuTrash2 } from "react-icons/lu";

type Props = {
  onFilterTap?: (payload: { name: string; phoneNumber: string }) => void;
};

function NewRetailerDrawer(payload: Props) {
  const [drawerIsOpen, setDrawerOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = useState<string>();
  const [selectedLmcId, setSelectedLmcId] = useState<string>("");
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [passwordValue, setPasswordValue] = useState("");
  const queryClient = useQueryClient();

  const {
    files,
    onClick: onPhotoUploadClick,
    InputComponent,
    removeFile,
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
  } = useFileUpload({
    accept: "image/*",
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    onMaxFileSizeDetected: () => {
      ToastService.info({ text: "Maximum file size exceeded" });
    },
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

  const { mutateAsync: registerWriter, isPending: writerPending } = useMutation(
    {
      mutationKey: ["writers", "register"],
      mutationFn: WritersService.registerWriter,
      onSuccess: async () => {
        ToastService.success({ text: "Retailer created successfully" });
        await queryClient.invalidateQueries({ queryKey: ["writers", "all"] });
        setDrawerOpen(false);
      },
    },
  );

  return (
    <Drawer>
      <UiButton size="sm" onClick={() => setDrawerOpen(true)}>
        <LuPlus />
        New writer
      </UiButton>
      <Drawer.Backdrop
        variant="blur"
        className="backdrop-blur-sm"
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
              <Form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const data = Object.fromEntries(
                    new FormData(e.currentTarget),
                  );
                  const password = String(data.password ?? "");
                  const confirmPassword = String(data.confirmPassword ?? "");
                  if (!selectedLmcId) {
                    ToastService.error({ text: "Please select a supervisor" });
                    return;
                  }
                  if (!selectedDate) {
                    ToastService.error({ text: "Please pick date of birth" });
                    return;
                  }
                  if (password.length < 8) {
                    ToastService.error({
                      text: "password: Ensure this field has at least 8 characters.",
                    });
                    return;
                  }
                  if (password !== confirmPassword) {
                    ToastService.error({ text: "Passwords do not match" });
                    return;
                  }

                  try {
                    await registerWriter({
                      email: String(data.email ?? ""),
                      first_name: String(data.firstName ?? ""),
                      last_name: String(data.lastName ?? ""),
                      phone: String(data.phoneNumber ?? ""),
                      password,
                      supervisor_id: selectedLmcId,
                      date_of_birth: selectedDate,
                      location_address: selectedCounty,
                      photo: files[0],
                      id_card_image: idCardFiles[0],
                    });
                    payload.onFilterTap?.({
                      name: String(data.firstName ?? ""),
                      phoneNumber: String(data.phoneNumber ?? ""),
                    });
                  } catch (error) {
                    ToastService.error({
                      text:
                        error instanceof Error
                          ? error.message
                          : "Failed to register retailer",
                    });
                  }
                }}
              >
                <div className="flex flex-col">
                  <p className="text-lg font-semibold tracking-tight text-foreground">
                    Add new writer
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Register a retailer and issue their login credentials.
                  </p>
                  <div className="mt-5 space-y-4">
                    <InputComponent />
                    <IdCardInputComponent />
                    {/* Profile photo */}
                    <div className="flex w-full justify-center">
                      <div
                        className={`relative flex size-32 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-full transition-colors ${
                          files.length === 0
                            ? "border border-dashed border-border bg-surface-muted hover:border-primary"
                            : ""
                        }`}
                        onClick={onPhotoUploadClick}
                      >
                        {files.length === 0 ? (
                          <div className="flex flex-col items-center gap-1.5 px-4 text-center">
                            <LuCamera className="size-5 text-zinc-400" />
                            <span className="text-[11px] text-muted-foreground">
                              Click to add photo
                            </span>
                          </div>
                        ) : (
                          <Image
                            src={URL.createObjectURL(files[0])}
                            alt="Profile"
                            fill
                            className="object-cover"
                          />
                        )}
                        {files.length > 0 && (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(0);
                            }}
                            className="absolute right-1 top-1 z-10 flex size-7 cursor-pointer items-center justify-center rounded-full bg-surface shadow-sm"
                          >
                            <LuTrash2 className="size-3.5 text-rose-500" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ID card image */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        ID card image
                      </span>
                      <div
                        className="relative w-full cursor-pointer overflow-hidden rounded-xl border border-dashed border-border bg-surface-muted transition-colors hover:border-primary"
                        style={{ minHeight: 120 }}
                        onClick={onIdCardUploadClick}
                      >
                        {idCardFiles.length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-1.5 py-8">
                            <LuCamera className="size-6 text-zinc-400" />
                            <span className="text-xs text-muted-foreground">
                              Click to upload ID card image
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              JPG, PNG — max 10 MB
                            </span>
                          </div>
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
                            className="absolute right-2 top-2 z-10 flex size-7 cursor-pointer items-center justify-center rounded-full bg-surface shadow-sm"
                          >
                            <LuTrash2 className="size-3.5 text-rose-500" />
                          </span>
                        )}
                      </div>
                    </div>
                    <CustomInputComponent
                      label="First name"
                      name="firstName"
                      isRequired
                    />
                    <CustomInputComponent
                      label="Last name"
                      name="lastName"
                      isRequired
                    />
                    <CustomInputComponent
                      label="Email"
                      name="email"
                      showPlaceholder={false}
                      showPreficIcon={false}
                      type="email"
                    />
                    <CustomInputComponent
                      label="Phone number"
                      name="phoneNumber"
                      type="tel"
                    />
                    <CustomInputComponent
                      type="password"
                      name="password"
                      label="Password"
                      minLength={8}
                      onChange={(e) => setPasswordValue(e.target.value)}
                    />
                    <CustomInputComponent
                      type="password"
                      name="confirmPassword"
                      label="Confirm password"
                      validate={(val) => {
                        if (!val) return "This field is required";
                        if (val !== passwordValue)
                          return "Passwords do not match";
                        return null;
                      }}
                    />
                    <CustomSelectComponent
                      label="Supervisor"
                      placeholder=""
                      showDropDownIcon
                      list={lmcOptions}
                      isDisabled={lmcPending || lmcOptions.length === 0}
                      onSelectionChange={(val) => setSelectedLmcId(val.key)}
                    />
                    <CustomDatePicker
                      label="Date of birth"
                      className="w-full"
                      maxValue={today(getLocalTimeZone()).subtract({ days: 1 })}
                      onDatePicked={(date: DateValue) =>
                        setSelectedDate(date.toString())
                      }
                    />
                    <CustomSelectComponent
                      label="County"
                      placeholder="Select county"
                      showDropDownIcon
                      list={[
                        { key: "Bomi", label: "Bomi" },
                        { key: "Bong", label: "Bong" },
                        { key: "Gbarpolu", label: "Gbarpolu" },
                        { key: "Grand Bassa", label: "Grand Bassa" },
                        { key: "Grand Cape Mount", label: "Grand Cape Mount" },
                        { key: "Grand Gedeh", label: "Grand Gedeh" },
                        { key: "Grand Kru", label: "Grand Kru" },
                        { key: "Lofa", label: "Lofa" },
                        { key: "Margibi", label: "Margibi" },
                        { key: "Maryland", label: "Maryland" },
                        { key: "Montserrado", label: "Montserrado" },
                        { key: "Nimba", label: "Nimba" },
                        { key: "River Cess", label: "River Cess" },
                        { key: "River Gee", label: "River Gee" },
                        { key: "Sinoe", label: "Sinoe" },
                      ]}
                      onSelectionChange={(val) => setSelectedCounty(val.key)}
                    />
                  </div>
                  <UiButton
                    className="mt-5"
                    size="lg"
                    type="submit"
                    fullWidth
                    isPending={writerPending}
                  >
                    {writerPending ? "Saving…" : "Save writer"}
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

export default NewRetailerDrawer;
