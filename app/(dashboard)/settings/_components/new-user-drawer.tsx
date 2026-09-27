import {
  Button as UiButton,
  DrawerTitleBar,
  FormSection,
  drawerBodyClass,
  drawerDialogClass,
  drawerFooterClass,
  drawerWidth,
} from "@/components/ui";
import CustomInputComponent from "@/components/custom-input-component";
import CustomSelectComponent from "@/components/custom-select-component";
import PermissionsService from "@/api/permissions";
import { cn, Drawer, Form } from "@heroui/react";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminUsersService from "@/api/admin-users";
import ToastService from "@/utils/toast-service";
import ApiError from "@/utils/api_error";
import { LuPlus, LuUserPlus } from "react-icons/lu";

type Props = {
  onCreated?: () => void;
};

function NewUserDrawer(payload: Props) {
  const [drawerIsOpen, setDrawerOpen] = React.useState(false);
  const [passwordValue, setPasswordValue] = React.useState("");
  const [roleId, setRoleId] = React.useState<string>("");
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ["permissions", "roles"],
    queryFn: PermissionsService.fetchRoles,
    enabled: drawerIsOpen,
  });

  const roleOptions = roles.map((r) => ({ key: r.id, label: r.name }));

  const { mutateAsync: createAdmin, isPending } = useMutation({
    mutationKey: ["admin-users", "create"],
    mutationFn: AdminUsersService.createAdmin,
    onSuccess: async () => {
      ToastService.success({ text: "New team member created" });
      await queryClient.invalidateQueries({
        queryKey: ["admin-users", "list"],
      });
      payload.onCreated?.();
      setDrawerOpen(false);
    },
    onError: (error: ApiError) => {
      ToastService.error({ text: error?.message ?? "Unable to create admin" });
    },
  });

  return (
    <>
      <UiButton size="sm" onClick={() => setDrawerOpen(true)}>
        <LuPlus />
        Add member
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
                if (!roleId) {
                  ToastService.error({
                    text: "Please select a dashboard role",
                  });
                  return;
                }
                await createAdmin({
                  first_name: String(data.firstName ?? ""),
                  last_name: String(data.surname ?? ""),
                  email: String(data.email ?? ""),
                  phone: String(data.phoneNumber ?? ""),
                  password,
                  role_id: roleId || null,
                });
              }}
            >
              <DrawerTitleBar
                icon={<LuUserPlus />}
                title="New team member"
                description="Create a dashboard login and assign its role."
                onClose={() => setDrawerOpen(false)}
              />
              <Drawer.Body className={drawerBodyClass}>
                <div className="space-y-6">
                  <FormSection title="Identity">
                    <CustomInputComponent
                      label="First Name"
                      name="firstName"
                      isRequired
                    />
                    <CustomInputComponent
                      label="Surname"
                      name="surname"
                      isRequired
                    />
                  </FormSection>

                  <FormSection title="Contact">
                    <CustomInputComponent
                      label="Email"
                      name="email"
                      showPlaceholder={false}
                      type="email"
                      isRequired
                    />
                    <CustomInputComponent
                      label="Phone Number"
                      name="phoneNumber"
                      type="tel"
                      isRequired
                    />
                  </FormSection>

                  <FormSection title="Credentials">
                    <CustomInputComponent
                      type="password"
                      name="password"
                      label="Password"
                      minLength={8}
                      onChange={(e) => setPasswordValue(e.target.value)}
                      showPlaceholder={false}
                      showSuffixIcon={false}
                      showPreficIcon={false}
                      isRequired
                    />
                    <CustomInputComponent
                      type="password"
                      name="confirmPassword"
                      label="Confirm Password"
                      showLabel={true}
                      showPlaceholder={false}
                      validate={(val) => {
                        if (!val) return "This field is required";
                        if (val !== passwordValue)
                          return "Passwords do not match";
                        return null;
                      }}
                      showSuffixIcon={false}
                      showPreficIcon={false}
                      isRequired
                    />
                  </FormSection>

                  <FormSection title="Access">
                    <CustomSelectComponent
                      label="Dashboard Role"
                      placeholder="Select a role"
                      showDropDownIcon
                      isRequired
                      list={roleOptions}
                      onSelectionChange={(item) => setRoleId(item.key)}
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
                  {isPending ? "Saving…" : "Save member"}
                </UiButton>
              </Drawer.Footer>
            </Form>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}

export default NewUserDrawer;
