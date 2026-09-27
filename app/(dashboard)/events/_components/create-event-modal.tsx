"use client";

import { Button as UiButton, Textarea } from "@/components/ui";
import React from "react";
import { Form, Modal } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LuCalendarDays, LuPlus } from "react-icons/lu";
import EventsService from "@/api/events";
import ApiError from "@/utils/api_error";
import ToastService from "@/utils/toast-service";
import CustomInputComponent from "@/components/custom-input-component";

export default function CreateEventModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const qc = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      EventsService.createEvent({
        name: data.get("name") as string,
        event_date: data.get("event_date") as string,
        venue: (data.get("venue") as string) || undefined,
        description: (data.get("description") as string) || undefined,
      }),
    onSuccess: () => {
      ToastService.success({ text: "Event created successfully." });
      qc.invalidateQueries({ queryKey: ["events"] });
      setIsOpen(false);
    },
    onError: (err: ApiError) => {
      ToastService.error({ text: err.message ?? "Failed to create event." });
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await mutateAsync(new FormData(e.currentTarget));
  };

  return (
    <>
      <UiButton size="sm" onClick={() => setIsOpen(true)}>
        <LuPlus />
        New event
      </UiButton>

      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open && !isPending) setIsOpen(false);
        }}
        isDismissable={!isPending}
        isKeyboardDismissDisabled={isPending}
      >
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog className="rounded-lg">
            <Modal.Header>
              <Modal.Icon className="border-none bg-transparent text-foreground-muted">
                <LuCalendarDays className="w-5 h-5" />
              </Modal.Icon>
              <Modal.Heading className="text-base font-medium tracking-tight">
                Create event
              </Modal.Heading>
              <p className="mb-2 text-sm text-foreground-light">
                Create an invite-only event and issue QR tickets via SMS.
              </p>
            </Modal.Header>

            <Form onSubmit={handleSubmit}>
              <Modal.Body className="flex flex-col gap-3">
                <CustomInputComponent
                  label="Event name"
                  name="name"
                  type="text"
                  isRequired
                  placeholder="e.g. AMS1One Anniversary Party"
                />
                <CustomInputComponent
                  label="Date and time"
                  name="event_date"
                  type="datetime-local"
                  isRequired
                />
                <CustomInputComponent
                  label="Venue"
                  name="venue"
                  type="text"
                  placeholder="e.g. La Palm Royal Beach Hotel, Accra"
                />
                <Textarea
                  label="Description"
                  name="description"
                  placeholder="Optional event description"
                  rows={3}
                />
              </Modal.Body>

              <Modal.Footer>
                <UiButton
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </UiButton>
                <UiButton type="submit" isPending={isPending}>
                  {isPending ? "Creating…" : "Create event"}
                </UiButton>
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
