import CustomDatePicker from "@/components/custom-date-picker";
import CustomInputComponent from "@/components/custom-input-component";
import CustomSelectComponent from "@/components/custom-select-component";
import LmcService from "@/api/lmc";
import WritersService from "@/api/writers";
import { useFileUpload } from "@/hooks/use-file-upload";
import ToastService from "@/utils/toast-service";
import { cn, Drawer, Form } from "@heroui/react";
import {
  AvatarDropzone,
  Button as UiButton,
  DrawerTitleBar,
  FileDropzone,
  FormSection,
  drawerBodyClass,
  drawerDialogClass,
  drawerFooterClass,
  drawerWidth,
} from "@/components/ui";
import { DateValue, getLocalTimeZone, today } from "@internationalized/date";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { LuPlus, LuUserPlus } from "react-icons/lu";

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
    previewUrls,
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
    previewUrls: idCardPreviewUrls,
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
      <Drawer.Backdrop isOpen={drawerIsOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content placement="right">
          <Drawer.Dialog className={cn(drawerDialogClass, drawerWidth.form)}>
            <Form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));
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
              <DrawerTitleBar
                icon={<LuUserPlus />}
                title="New writer"
                description="Register a retailer and issue their login credentials."
                onClose={() => setDrawerOpen(false)}
              />
              <Drawer.Body className={drawerBodyClass}>
                <div className="space-y-6">
                  <FormSection title="Identity">
                    <InputComponent />
                    <IdCardInputComponent />
                    <AvatarDropzone
                      file={files[0]}
                      previewUrl={previewUrls[0]}
                      onPick={onPhotoUploadClick}
                      onRemove={() => removeFile(0)}
                    />
                    <FileDropzone
                      label="ID card image"
                      hint="JPG, PNG — max 10 MB"
                      file={idCardFiles[0]}
                      previewUrl={idCardPreviewUrls[0]}
                      onPick={onIdCardUploadClick}
                      onRemove={() => removeIdCardFile(0)}
                    />
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
                  </FormSection>

                  <FormSection title="Contact">
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
                  </FormSection>

                  <FormSection title="Credentials">
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
                  </FormSection>

                  <FormSection title="Assignment">
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
                      maxValue={today(getLocalTimeZone()).subtract({
                        days: 1,
                      })}
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
                        {
                          key: "Grand Cape Mount",
                          label: "Grand Cape Mount",
                        },
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
                  </FormSection>
                </div>
              </Drawer.Body>
              <Drawer.Footer className={drawerFooterClass}>
                <UiButton
                  size="lg"
                  type="submit"
                  fullWidth
                  isPending={writerPending}
                >
                  {writerPending ? "Saving…" : "Save writer"}
                </UiButton>
              </Drawer.Footer>
            </Form>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

export default NewRetailerDrawer;
