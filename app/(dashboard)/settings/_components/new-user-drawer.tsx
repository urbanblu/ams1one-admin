import CustomInputComponent from "@/components/custom-input-component";
import CustomSelectComponent from "@/components/custom-select-component";
import PermissionsService from "@/api/permissions";
import {
  Button,
  CloseButton,
  CloseIcon,
  Drawer,
  Form,
  Spinner,
} from "@heroui/react";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminUsersService from "@/api/admin-users";
import ToastService from "@/utils/toast-service";
import ApiError from "@/utils/api_error";
import { LuPlus } from "react-icons/lu";

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
      <Button
        className="h-11 w-full cursor-pointer rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-white transition-all hover:opacity-95 disabled:opacity-60 md:w-auto"
        size="md"
        onClick={() => setDrawerOpen(true)}
      >
        <LuPlus className="size-4" />
        Add member
      </Button>
      <Drawer.Backdrop
        variant="blur"
        className="backdrop-blur-sm"
        isOpen={drawerIsOpen}
        onOpenChange={setDrawerOpen}
      >
        <Drawer.Content placement="right">
          <Drawer.Dialog className="rounded-none bg-surface sm:rounded-l-3xl sm:overflow-hidden">
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
                <div className="flex flex-col space-y-3">
                  <span className="text-lg font-bold">New user</span>
                  <div className="space-y-4">
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
                    <CustomSelectComponent
                      label="Dashboard Role"
                      placeholder="Select a role"
                      showDropDownIcon
                      isRequired
                      list={roleOptions}
                      onSelectionChange={(item) => setRoleId(item.key)}
                    />
                  </div>
                  <Button
                    className="mt-2 h-11 w-full cursor-pointer rounded-xl bg-brand-gradient text-sm font-semibold text-white transition-all hover:opacity-95 disabled:opacity-60"
                    type="submit"
                    isDisabled={isPending}
                    isPending={isPending}
                  >
                    {({ isPending }) => (
                      <>
                        {isPending ? (
                          <Spinner color="current" size="sm" />
                        ) : (
                          "Save"
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}

export default NewUserDrawer;
