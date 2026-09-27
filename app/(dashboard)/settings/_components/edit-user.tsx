import {
  Button as UiButton,
  DrawerTitleBar,
  IconButton,
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
import type { IAdminUser } from "@/interfaces/admin-users.interface";
import ApiError from "@/utils/api_error";
import { LuPencil } from "react-icons/lu";

type Props = {
  user: IAdminUser;
  onEdited?: () => void;
};

function EditUserDrawer(payload: Props) {
  const [drawerIsOpen, setDrawerOpen] = React.useState(false);
  const [roleId, setRoleId] = React.useState<string>(
    payload.user.dashboard_role?.id ?? "",
  );
  const [status, setStatus] = React.useState<string>(
    payload.user.is_active ? "active" : "inactive",
  );
  const queryClient = useQueryClient();

  const { data: roles = [] } = useQuery({
    queryKey: ["permissions", "roles"],
    queryFn: PermissionsService.fetchRoles,
    enabled: drawerIsOpen,
  });

  const roleOptions = [
    { key: "__none__", label: "No role" },
    ...roles.map((r) => ({ key: r.id, label: r.name })),
  ];

  const { mutateAsync: editAdmin, isPending } = useMutation({
    mutationKey: ["admin-users", "edit", payload.user.id],
    mutationFn: (data: {
      first_name: string;
      last_name: string;
      phone: string;
      is_active: boolean;
      role_id: string | null;
    }) => AdminUsersService.editAdmin(payload.user.id, data),
    onSuccess: async () => {
      ToastService.success({ text: "Team member updated" });
      await queryClient.invalidateQueries({
        queryKey: ["admin-users", "list"],
      });
      payload.onEdited?.();
      setDrawerOpen(false);
    },
    onError: (error: ApiError) => {
      ToastService.error({
        text: error?.message ?? "Failed to update team member",
      });
    },
  });

  return (
    <>
      <IconButton
        label={`Edit ${payload.user.full_name || "member"}`}
        onClick={() => setDrawerOpen(true)}
      >
        <LuPencil />
      </IconButton>
      <Drawer.Backdrop isOpen={drawerIsOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content placement="right">
          <Drawer.Dialog className={cn(drawerDialogClass, drawerWidth.form)}>
            <Form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={async (e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));

                await editAdmin({
                  first_name: String(data.firstName ?? ""),
                  last_name: String(data.surname ?? ""),
                  phone: String(data.phoneNumber ?? ""),
                  is_active: status === "active",
                  role_id: roleId === "__none__" ? null : roleId || null,
                });
              }}
            >
              <DrawerTitleBar
                icon={<LuPencil />}
                title="Edit team member"
                description={payload.user.full_name || undefined}
                onClose={() => setDrawerOpen(false)}
              />
              <Drawer.Body className={drawerBodyClass}>
                <div key={payload.user.id} className="space-y-4">
                  <CustomInputComponent
                    label="First Name"
                    name="firstName"
                    defaultValue={payload.user.first_name}
                  />
                  <CustomInputComponent
                    label="Surname"
                    name="surname"
                    defaultValue={payload.user.last_name}
                  />
                  <CustomInputComponent
                    label="Phone Number"
                    name="phoneNumber"
                    type="tel"
                    defaultValue={payload.user.phone}
                  />
                  <CustomSelectComponent
                    label="Status"
                    placeholder=""
                    showDropDownIcon
                    list={[
                      { key: "active", label: "Active" },
                      { key: "inactive", label: "Inactive" },
                    ]}
                    initialItemKey={
                      payload.user.is_active ? "active" : "inactive"
                    }
                    onSelectionChange={(item) => setStatus(item.key)}
                  />
                  <CustomSelectComponent
                    label="Dashboard Role"
                    placeholder="No role"
                    showDropDownIcon
                    list={roleOptions}
                    initialItemKey={
                      payload.user.dashboard_role?.id ?? "__none__"
                    }
                    onSelectionChange={(item) => setRoleId(item.key)}
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
                  {isPending ? "Saving…" : "Save changes"}
                </UiButton>
              </Drawer.Footer>
            </Form>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}

export default EditUserDrawer;
