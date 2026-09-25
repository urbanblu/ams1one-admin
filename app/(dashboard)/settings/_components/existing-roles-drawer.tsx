"use client";

import { Button as UiButton, drawerDialogClass } from "@/components/ui";

import CustomCheckboxItem from "@/components/custom-checkbox";
import CustomInputComponent from "@/components/custom-input-component";
import PermissionsService from "@/api/permissions";
import ToastService from "@/utils/toast-service";
import type { IDashboardRole } from "@/interfaces/admin-users.interface";
import { cn, Accordion, Button, CloseButton, CloseIcon, Drawer, Modal, Spinner } from "@heroui/react";
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RiDeleteBin6Line } from "react-icons/ri";
import ApiError from "@/utils/api_error";
import { LuShieldCheck } from "react-icons/lu";

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

  return (
    <>
      <Button
        className="h-10 cursor-pointer rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-subtle w-full md:w-auto"
        size="md"
        onClick={() => setDrawerOpen(true)}
      >
        <LuShieldCheck className="size-4" />
        Roles &amp; permissions
      </Button>
      <Drawer.Backdrop
        variant="blur"
        className="backdrop-blur-sm"
        isOpen={drawerIsOpen}
        onOpenChange={(open) => {
          if (!open) resetDrawerState();
          else setDrawerOpen(true);
        }}
      >
        <Drawer.Content placement="right">
          <Drawer.Dialog className={cn(drawerDialogClass, "flex h-full max-h-screen flex-col")}>
            <Drawer.Header>
              <CloseButton
                className="flex size-8 cursor-pointer items-center justify-center self-end rounded-full bg-subtle text-muted-foreground transition-colors hover:bg-zinc-200 hover:text-foreground"
                onClick={resetDrawerState}
              >
                <CloseIcon className="size-4" />
              </CloseButton>
            </Drawer.Header>

            {!isAdding && !editingRole ? (
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
          <Modal.Dialog className="rounded-3xl">
            <Modal.Header>
              <Modal.Heading className="text-lg font-semibold tracking-tight">
                Delete role?
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-black">
                  {confirmRole?.name}
                </span>
                ? This cannot be undone.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button
                className="h-10 cursor-pointer rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-subtle flex-1"
                size="md"
                isDisabled={isDeleting}
                onClick={() => setConfirmRole(null)}
              >
                Cancel
              </Button>
              <Button
                className="h-10 flex-1 cursor-pointer rounded-xl bg-rose-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
                size="md"
                isPending={isDeleting}
                onClick={() => confirmRole && deleteRole(confirmRole.id)}
              >
                {({ isPending }) =>
                  isPending ? <Spinner color="current" size="sm" /> : "Delete"
                }
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">Existing Roles</span>
            <UiButton size="sm" onClick={onAdd}>
              New role
            </UiButton>
          </div>

          {isPending ? (
            <div className="flex justify-center py-8">
              <Spinner size="sm" className="text-primary" />
            </div>
          ) : roles.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-8">
              No roles yet. Create one to assign to team members.
            </p>
          ) : (
            <div className="rounded-2xl border border-border-subtle bg-surface">
              <Accordion>
                {roles.map((role) => (
                  <Accordion.Item key={role.id}>
                    <Accordion.Heading>
                      <Accordion.Trigger>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-bold truncate">
                            {role.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 shrink-0">
                            ({role.user_count} user
                            {role.user_count !== 1 ? "s" : ""})
                          </span>
                          <span
                            role="button"
                            tabIndex={0}
                            className="text-[10px] font-semibold text-primary cursor-pointer shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(role);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                onEdit(role);
                              }
                            }}
                          >
                            Edit
                          </span>
                        </div>
                        <Accordion.Indicator />
                      </Accordion.Trigger>
                    </Accordion.Heading>
                    <Accordion.Panel>
                      <Accordion.Body>
                        {role.description && (
                          <p className="text-[11px] text-muted-foreground mb-2">
                            {role.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {role.page_keys.length === 0 ? (
                            <span className="text-[11px] text-zinc-400">
                              No pages assigned
                            </span>
                          ) : (
                            role.page_keys.map((key) => (
                              <span
                                key={key}
                                className="text-[10px] bg-subtle text-muted-foreground px-2 py-0.5 rounded font-mono"
                              >
                                {key}
                              </span>
                            ))
                          )}
                        </div>
                        {role.user_count === 0 && (
                          <button
                            className="flex items-center gap-1 text-[11px] cursor-pointer text-rose-500 font-semibold mt-1"
                            onClick={() => setConfirmRole(role)}
                          >
                            <RiDeleteBin6Line />
                            Delete role
                          </button>
                        )}
                      </Accordion.Body>
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </Drawer.Body>
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
    <Drawer.Body className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
      <div className="flex flex-col space-y-4">
        <span className="text-lg font-bold">
          {role ? "Edit Role" : "New Role"}
        </span>

        <div key={role?.id ?? "new"} className="space-y-3">
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
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Pages
          </span>
          {pagesPending ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" className="text-primary" />
            </div>
          ) : (
            <div className="space-y-4 mt-2">
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
                    <div className="flex items-center gap-2 mb-1">
                      <CustomCheckboxItem
                        selected={allSelected || someSelected}
                        label={category}
                        labelClassName="text-[11px] font-bold"
                        setIsSelected={() => toggleCategory(catKeys)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 pl-2">
                      {catPages.map((page) => (
                        <CustomCheckboxItem
                          key={page.key}
                          selected={selectedKeys.includes(page.key)}
                          label={page.name}
                          labelClassName="text-[11px] font-normal"
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

        <Button
          className="h-11 w-full cursor-pointer rounded-xl bg-brand-gradient text-sm font-semibold text-white transition-all hover:opacity-95 disabled:opacity-60"
          isDisabled={isPending || !name.trim()}
          isPending={isPending}
          onClick={() => saveRole()}
        >
          {({ isPending }) =>
            isPending ? <Spinner color="current" size="sm" /> : "Save"
          }
        </Button>
        <Button
          className="h-11 w-full cursor-pointer rounded-xl border border-border bg-surface text-sm font-semibold text-foreground transition-colors hover:bg-subtle"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </Drawer.Body>
  );
}
