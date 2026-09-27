"use client";

import {
  Button as UiButton,
  DrawerTitleBar,
  FieldLabel,
  drawerBodyClass,
  drawerDialogClass,
  drawerFooterClass,
  drawerWidth,
} from "@/components/ui";

import CustomCheckboxItem from "@/components/custom-checkbox";
import CustomInputComponent from "@/components/custom-input-component";
import PermissionsService from "@/api/permissions";
import ToastService from "@/utils/toast-service";
import type { IDashboardRole } from "@/interfaces/admin-users.interface";
import { cn, Accordion, Drawer, Modal, Spinner } from "@heroui/react";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ApiError from "@/utils/api_error";
import { LuShieldCheck, LuTrash2 } from "react-icons/lu";

function ExistingRolesDrawer() {
  const [drawerIsOpen, setDrawerOpen] = React.useState(false);
  const [editingRole, setEditingRole] = useState<IDashboardRole | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const queryClient = useQueryClient();

  const resetDrawerState = () => {
    setDrawerOpen(false);
    setEditingRole(null);
    setIsAdding(false);
  };

  const isFormView = isAdding || !!editingRole;

  return (
    <>
      <UiButton variant="outline" size="sm" onClick={() => setDrawerOpen(true)}>
        <LuShieldCheck />
        Roles &amp; permissions
      </UiButton>
      <Drawer.Backdrop
        isOpen={drawerIsOpen}
        onOpenChange={(open) => {
          if (!open) resetDrawerState();
          else setDrawerOpen(true);
        }}
      >
        <Drawer.Content placement="right">
          <Drawer.Dialog className={cn(drawerDialogClass, drawerWidth.form)}>
            <DrawerTitleBar
              icon={<LuShieldCheck />}
              title={
                editingRole
                  ? "Edit role"
                  : isAdding
                    ? "New role"
                    : "Roles & permissions"
              }
              description={
                isFormView
                  ? "Choose the pages this role can reach."
                  : "Which pages each dashboard role can reach."
              }
              onClose={resetDrawerState}
            />

            {!isFormView ? (
              <RolesList
                onAdd={() => setIsAdding(true)}
                onEdit={(role) => setEditingRole(role)}
                onDeleted={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["permissions", "roles"],
                  })
                }
              />
            ) : (
              <RoleForm
                role={editingRole ?? undefined}
                onCancel={() => {
                  setIsAdding(false);
                  setEditingRole(null);
                }}
                onSaved={() => {
                  queryClient.invalidateQueries({
                    queryKey: ["permissions", "roles"],
                  });
                  setIsAdding(false);
                  setEditingRole(null);
                }}
              />
            )}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}

export default ExistingRolesDrawer;

// ─── Roles list view ──────────────────────────────────────────────────────────
function RolesList({
  onAdd,
  onEdit,
  onDeleted,
}: {
  onAdd: () => void;
  onEdit: (role: IDashboardRole) => void;
  onDeleted: () => void;
}) {
  const [confirmRole, setConfirmRole] = useState<IDashboardRole | null>(null);

  const { data: roles = [], isPending } = useQuery({
    queryKey: ["permissions", "roles"],
    queryFn: PermissionsService.fetchRoles,
  });

  const { mutateAsync: deleteRole, isPending: isDeleting } = useMutation({
    mutationFn: PermissionsService.deleteRole,
    onSuccess: () => {
      ToastService.success({ text: "Role deleted" });
      setConfirmRole(null);
      onDeleted();
    },
    onError: (error: ApiError) => {
      ToastService.error({ text: error?.message ?? "Failed to delete role" });
      setConfirmRole(null);
    },
  });

  return (
    <>
      <Modal.Backdrop
        isOpen={!!confirmRole}
        onOpenChange={(open) => {
          if (!open) setConfirmRole(null);
        }}
      >
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog className="rounded-lg">
            <Modal.Header>
              <Modal.Heading className="text-base font-medium tracking-tight">
                Delete role?
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-foreground-light">
                Are you sure you want to delete{" "}
                <span className="font-medium text-foreground">
                  {confirmRole?.name}
                </span>
                ? This cannot be undone.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <UiButton
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => setConfirmRole(null)}
              >
                Cancel
              </UiButton>
              <UiButton
                type="button"
                variant="danger"
                isPending={isDeleting}
                onClick={() => confirmRole && deleteRole(confirmRole.id)}
              >
                {isDeleting ? "Deleting…" : "Delete role"}
              </UiButton>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Drawer.Body className={drawerBodyClass}>
        {isPending ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" className="text-brand-700" />
          </div>
        ) : roles.length === 0 ? (
          <p className="py-8 text-center text-xs text-foreground-light">
            No roles yet. Create one to assign to team members.
          </p>
        ) : (
          <div className="rounded-lg border border-border bg-surface">
            <Accordion>
              {roles.map((role) => (
                <Accordion.Item key={role.id}>
                  <Accordion.Heading>
                    <Accordion.Trigger>
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {role.name}
                        </span>
                        <span className="shrink-0 text-xs text-foreground-light">
                          {role.user_count} user
                          {role.user_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <Accordion.Indicator />
                    </Accordion.Trigger>
                  </Accordion.Heading>
                  <Accordion.Panel>
                    <Accordion.Body>
                      {role.description && (
                        <p className="mb-2 text-xs text-foreground-light">
                          {role.description}
                        </p>
                      )}
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {role.page_keys.length === 0 ? (
                          <span className="text-xs text-foreground-light">
                            No pages assigned
                          </span>
                        ) : (
                          role.page_keys.map((key) => (
                            <span
                              key={key}
                              className="rounded-md border border-border bg-surface-100 px-2 py-0.5 font-ident text-xs text-foreground-light"
                            >
                              {key}
                            </span>
                          ))
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <UiButton
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(role)}
                        >
                          Edit role
                        </UiButton>
                        {role.user_count === 0 && (
                          <UiButton
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => setConfirmRole(role)}
                          >
                            <LuTrash2 />
                            Delete
                          </UiButton>
                        )}
                      </div>
                    </Accordion.Body>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          </div>
        )}
      </Drawer.Body>
      <Drawer.Footer className={drawerFooterClass}>
        <UiButton type="button" size="lg" fullWidth onClick={onAdd}>
          New role
        </UiButton>
      </Drawer.Footer>
    </>
  );
}

// ─── Create / edit role form ──────────────────────────────────────────────────
function RoleForm({
  role,
  onCancel,
  onSaved,
}: {
  role?: IDashboardRole;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    role?.page_keys ?? [],
  );
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");

  const { data: pages = [], isPending: pagesPending } = useQuery({
    queryKey: ["permissions", "pages"],
    queryFn: PermissionsService.fetchPages,
  });

  // Group pages by category
  const grouped = pages.reduce<Record<string, typeof pages>>((acc, page) => {
    if (!acc[page.category]) acc[page.category] = [];
    acc[page.category].push(page);
    return acc;
  }, {});

  const { mutateAsync: saveRole, isPending } = useMutation({
    mutationFn: () => {
      const payload = { name, description, page_keys: selectedKeys };
      return role
        ? PermissionsService.updateRole(role.id, payload)
        : PermissionsService.createRole(payload);
    },
    onSuccess: () => {
      ToastService.success({ text: role ? "Role updated" : "Role created" });
      onSaved();
    },
    onError: (error: ApiError) => {
      ToastService.error({ text: error?.message ?? "Failed to save role" });
    },
  });

  const toggle = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleCategory = (categoryKeys: string[]) => {
    const allSelected = categoryKeys.every((k) => selectedKeys.includes(k));
    if (allSelected) {
      setSelectedKeys((prev) => prev.filter((k) => !categoryKeys.includes(k)));
    } else {
      setSelectedKeys((prev) => [...new Set([...prev, ...categoryKeys])]);
    }
  };

  return (
    <>
      <Drawer.Body className={drawerBodyClass}>
        <div className="space-y-4">
          <div key={role?.id ?? "new"} className="space-y-3.5">
            <CustomInputComponent
              label="Name"
              name="name"
              defaultValue={name}
              onChange={(e) => setName(e.target.value)}
            />
            <CustomInputComponent
              label="Description"
              name="description"
              defaultValue={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <FieldLabel>Pages</FieldLabel>
            {pagesPending ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" className="text-brand-700" />
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(grouped).map(([category, catPages]) => {
                  const catKeys = catPages.map((p) => p.key);
                  const allSelected = catKeys.every((k) =>
                    selectedKeys.includes(k),
                  );
                  const someSelected = catKeys.some((k) =>
                    selectedKeys.includes(k),
                  );

                  return (
                    <div key={category}>
                      <div className="mb-1 flex items-center gap-2">
                        <CustomCheckboxItem
                          selected={allSelected || someSelected}
                          label={category}
                          labelClassName="text-xs font-medium text-foreground"
                          setIsSelected={() => toggleCategory(catKeys)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 pl-2">
                        {catPages.map((page) => (
                          <CustomCheckboxItem
                            key={page.key}
                            selected={selectedKeys.includes(page.key)}
                            label={page.name}
                            labelClassName="text-xs"
                            setIsSelected={() => toggle(page.key)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Drawer.Body>
      <Drawer.Footer className={drawerFooterClass}>
        <div className="flex w-full items-center gap-2">
          <UiButton
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onCancel}
          >
            Cancel
          </UiButton>
          <UiButton
            type="button"
            size="lg"
            className="flex-1"
            disabled={isPending || !name.trim()}
            isPending={isPending}
            onClick={() => saveRole()}
          >
            {isPending ? "Saving…" : "Save role"}
          </UiButton>
        </div>
      </Drawer.Footer>
    </>
  );
}
