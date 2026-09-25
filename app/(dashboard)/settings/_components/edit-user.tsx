import { Button as UiButton, drawerDialogClass } from "@/components/ui";
import CustomInputComponent from "@/components/custom-input-component";
import CustomSelectComponent from "@/components/custom-select-component";
import PermissionsService from "@/api/permissions";
import { CloseButton, CloseIcon, Drawer, Form } from "@heroui/react";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AdminUsersService from "@/api/admin-users";
import ToastService from "@/utils/toast-service";
import { FaRegEdit } from "react-icons/fa";
import type { IAdminUser } from "@/interfaces/admin-users.interface";
import ApiError from "@/utils/api_error";

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
      <FaRegEdit
        className="w-3 h-3 text-blue-500 cursor-pointer"
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
              <Form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const data = Object.fromEntries(
                    new FormData(e.currentTarget),
                  );

                  await editAdmin({
                    first_name: String(data.firstName ?? ""),
                    last_name: String(data.surname ?? ""),
                    phone: String(data.phoneNumber ?? ""),
                    is_active: status === "active",
                    role_id: roleId === "__none__" ? null : roleId || null,
                  });
                }}
              >
                <div key={payload.user.id} className="flex flex-col space-y-3">
                  <span className="text-lg font-bold">Edit user</span>
                  <div className="space-y-4">
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
                  <UiButton
                    className="mt-2"
                    size="lg"
                    type="submit"
                    fullWidth
                    isPending={isPending}
                  >
                    {isPending ? "Saving…" : "Save"}
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

export default EditUserDrawer;
