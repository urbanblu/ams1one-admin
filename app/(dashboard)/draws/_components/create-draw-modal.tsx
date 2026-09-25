"use client";

import { Button as UiButton } from "@/components/ui";
import CustomSelectComponent from "@/components/custom-select-component";
import GamesService from "@/api/games";
import ToastService from "@/utils/toast-service";
import { Button, Modal } from "@heroui/react";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ApiError from "@/utils/api_error";
import type { IAutoDrawResult } from "@/interfaces/games.interface";
import { LuDices, LuPlus } from "react-icons/lu";
import DrawRevealScreen from "./draw-reveal-screen";

function CreateDrawModal() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedEventId, setSelectedEventId] = React.useState<string>("");
  const [drawResult, setDrawResult] = React.useState<IAutoDrawResult | null>(
    null,
  );
  const queryClient = useQueryClient();

  const { data: drawableEvents = [], isPending: eventsPending } = useQuery({
    queryKey: ["games", "drawable-today"],
    queryFn: GamesService.fetchDrawableToday,
    enabled: isOpen,
  });

  const eventOptions = drawableEvents.map((e) => ({
    key: e.id,
    label: e.label,
  }));

  const { mutateAsync: runAutoDraw, isPending: isSubmitting } = useMutation({
    mutationKey: ["games", "auto-draw"],
    mutationFn: (eventId: string) => GamesService.autoDraw(eventId),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({
        queryKey: ["games", "draws-and-winnings-table"],
      });
      handleClose();
      setDrawResult(result);
    },
    onError: (error: ApiError) => {
      ToastService.error({
        text: error?.message ?? "Action failed. Please try again.",
      });
    },
  });

  const handleClose = () => {
    setIsOpen(false);
    setSelectedEventId("");
  };

  const handleSubmit = async () => {
    if (!selectedEventId) {
      ToastService.error({ text: "Please select an event" });
      return;
    }
    await runAutoDraw(selectedEventId);
  };

  // When the reveal is active, render only it — completely unmounts the modal
  if (drawResult !== null) {
    return (
      <DrawRevealScreen
        result={drawResult}
        onComplete={() => setDrawResult(null)}
      />
    );
  }

  return (
    <>
      <Button
        className="h-10 cursor-pointer rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-white transition-all hover:opacity-95 disabled:opacity-60"
        size="md"
        onClick={() => setIsOpen(true)}
      >
        <LuPlus className="size-4" />
        New draw
      </Button>

      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
        isDismissable={!isSubmitting}
        isKeyboardDismissDisabled={isSubmitting}
      >
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog className="rounded-3xl">
            <Modal.Header>
              <Modal.Icon className="rounded-2xl bg-primary-soft text-primary">
                <LuDices className="w-5 h-5" />
              </Modal.Icon>
              <Modal.Heading className="text-lg font-semibold tracking-tight">
                Create Draw
              </Modal.Heading>
              <p className="text-sm text-muted-foreground mb-2">
                Select an event to run the auto-draw algorithm.
              </p>
            </Modal.Header>

            <Modal.Body>
              <CustomSelectComponent
                label="Event"
                placeholder=""
                showDropDownIcon
                list={eventOptions}
                isDisabled={eventsPending || eventOptions.length === 0}
                onSelectionChange={(item) => setSelectedEventId(item.key)}
              />
              {!eventsPending && eventOptions.length === 0 && (
                <p className="text-xs text-zinc-400 mt-1">
                  No drawable events available for today.
                </p>
              )}
            </Modal.Body>

            <Modal.Footer>
              <UiButton
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </UiButton>
              <UiButton
                type="button"
                isPending={isSubmitting}
                disabled={isSubmitting || !selectedEventId}
                onClick={handleSubmit}
              >
                {isSubmitting ? "Drawing…" : "Draw results"}
              </UiButton>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}

export default CreateDrawModal;
