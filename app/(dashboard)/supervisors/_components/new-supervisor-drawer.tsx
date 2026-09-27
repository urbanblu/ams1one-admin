import {
  AvatarDropzone,
  Button as UiButton,
  DrawerTitleBar,
  FormSection,
  drawerBodyClass,
  drawerDialogClass,
  drawerFooterClass,
  drawerWidth,
} from "@/components/ui";
import CustomInputComponent from "@/components/custom-input-component";
import { useFileUpload } from "@/hooks/use-file-upload";
import LmcService from "@/api/lmc";
import ToastService from "@/utils/toast-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn, Drawer, Form } from "@heroui/react";

import React from "react";
import ApiError from "@/utils/api_error";
import { LuPlus, LuUserPlus } from "react-icons/lu";

type Props = {
  onFilterTap?: (payload: { name: string; phoneNumber: string }) => void;
};

function NewLmcDrawer(payload: Props) {
  const [drawerIsOpen, setDrawerOpen] = React.useState(false);
  const [passwordValue, setPasswordValue] = React.useState("");
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
    maxSize: 10 * 1024 * 1024, // 10MB
    onMaxFileSizeDetected: () => {
      ToastService.info({
        text: "Maximum file size exceeded",
      });
    },
  });

  const { mutateAsync: registerSupervisor, isPending } = useMutation({
    mutationKey: ["lmc", "register-onboarding"],
    mutationFn: LmcService.registerSupervisorOnboarding,
    onSuccess: async () => {
      ToastService.success({ text: "Supervisor registered successfully" });
      await queryClient.invalidateQueries({
        queryKey: ["lmc", "detail-cards"],
      });
      setDrawerOpen(false);
    },
    onError: (error: ApiError) => {
      ToastService.error({
        text: error?.message ?? "Failed to create new supervisor",
      });
    },
  });

  return (
    <>
      <UiButton size="sm" onClick={() => setDrawerOpen(true)}>
        <LuPlus />
        New supervisor
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

                await registerSupervisor({
                  email: String(data.email ?? ""),
                  first_name: String(data.firstName ?? ""),
                  last_name: String(data.lastName ?? ""),
                  phone: String(data.phoneNumber ?? ""),
                  password,
                  address: String(data.location ?? ""),
                  photo: files[0],
                });

                payload.onFilterTap?.({
                  name: String(data.firstName ?? ""),
                  phoneNumber: String(data.phoneNumber ?? ""),
                });
              }}
            >
              <DrawerTitleBar
                icon={<LuUserPlus />}
                title="New supervisor"
                description="Register a supervisor and issue their login."
                onClose={() => setDrawerOpen(false)}
              />
              <Drawer.Body className={drawerBodyClass}>
                <div className="space-y-6">
                  <FormSection title="Identity">
                    <InputComponent />
                    <AvatarDropzone
                      file={files[0]}
                      previewUrl={previewUrls[0]}
                      onPick={onPhotoUploadClick}
                      onRemove={() => removeFile(0)}
                    />
                    <CustomInputComponent label="First name" name="firstName" />
                    <CustomInputComponent label="Last name" name="lastName" />
                  </FormSection>

                  <FormSection title="Contact">
                    <CustomInputComponent
                      label="Email"
                      name="email"
                      type="email"
                      showPreficIcon={false}
                      showPlaceholder={false}
                      isRequired
                    />
                    <CustomInputComponent
                      label="Phone number"
                      name="phoneNumber"
                      type="tel"
                    />
                    <CustomInputComponent label="Location" name="location" />
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
    </>
  );
}

export default NewLmcDrawer;
