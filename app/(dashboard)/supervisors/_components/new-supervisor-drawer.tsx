import {
  Button as UiButton,
  FormSection,
  drawerDialogClass,
} from "@/components/ui";
import CustomInputComponent from "@/components/custom-input-component";
import { useFileUpload } from "@/hooks/use-file-upload";
import LmcService from "@/api/lmc";
import ToastService from "@/utils/toast-service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloseButton, CloseIcon, Drawer, Form } from "@heroui/react";

import Image from "next/image";
import React from "react";
import { IoCameraOutline } from "react-icons/io5";
import { RiDeleteBin6Line } from "react-icons/ri";
import ApiError from "@/utils/api_error";
import { LuPlus } from "react-icons/lu";

type Props = {
  onFilterTap?: (payload: { name: string; phoneNumber: string }) => void;
};

function NewLmcDrawer(payload: Props) {
  const [drawerIsOpen, setDrawerOpen] = React.useState(false);
  const [passwordValue, setPasswordValue] = React.useState("");
  const queryClient = useQueryClient();

  const {
    files,
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
                <div className="flex flex-col space-y-3">
                  <span className="text-lg font-bold">NEW SUPERVISOR</span>
                  <div className="space-y-6">
                    <FormSection title="Identity">
                      <InputComponent />
                      <div className="w-full flex justify-center">
                        <div
                          className={`relative rounded-full w-35 h-35 ${files.length === 0 ? "border" : ""} justify-center flex flex-col`}
                          onClick={onPhotoUploadClick}
                        >
                          <div
                            className={`flex flex-col items-center ${files.length === 0 ? "p-3" : ""} space-y-2`}
                          >
                            {files.length === 0 ? (
                              <>
                                <IoCameraOutline size={25} />
                                <span className="text-center">
                                  Click to add photo
                                </span>
                              </>
                            ) : (
                              <Image
                                src={URL.createObjectURL(files[0])}
                                alt="Profile"
                                className="w-35 h-35 object-cover rounded-full"
                                width={0}
                                height={0}
                              />
                            )}
                          </div>
                          {files.length > 0 && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(0);
                              }}
                              className="absolute top-1 right-3 z-10 cursor-pointer bg-white rounded-full p-1 shadow-sm"
                            >
                              <RiDeleteBin6Line className="text-rose-500" />
                            </span>
                          )}
                        </div>
                      </div>
                      <CustomInputComponent
                        label="First Name"
                        name="firstName"
                      />
                      <CustomInputComponent label="Last Name" name="lastName" />
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
                        label="Phone Number"
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
                        label="Confirm Password"
                        validate={(val) => {
                          if (!val) return "This field is required";
                          if (val !== passwordValue)
                            return "Passwords do not match";
                          return null;
                        }}
                      />
                    </FormSection>
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
    </>
  );
}

export default NewLmcDrawer;
