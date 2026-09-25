import CustomInputComponent from "@/components/custom-input-component";
import { Button, CloseButton, CloseIcon, Drawer, Form } from "@heroui/react";
import React from "react";

type Props = {
  onFilterTap?: (payload: { name: string; phoneNumber: string }) => void;
};

function SetCreditPromiseDrawer(payload: Props) {
  const [drawerIsOpen, setDrawerOpen] = React.useState(false);

  return (
    <Drawer>
      <Button
        className="h-10 cursor-pointer rounded-xl bg-brand-gradient px-4 text-sm font-semibold text-white transition-all hover:opacity-95 disabled:opacity-60"
        size="md"
        onClick={() => setDrawerOpen(true)}
      >
        Credit Promise
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
                onSubmit={(e) => {
                  e.preventDefault();
                  const data = Object.fromEntries(
                    new FormData(e.currentTarget),
                  );

                  const finalData = {
                    name: data.name as string,
                    phoneNumber: data.phoneNumber as string,
                  };

                  payload.onFilterTap?.(finalData);
                }}
              >
                <div className="flex flex-col space-y-3">
                  <span className="text-sm font-bold">Set Credit Promise</span>
                  <div className="space-y-4">
                    <CustomInputComponent
                      label="Amount"
                      name="amount"
                      validate={(value) => {
                        if (!value || value.trim() === "") {
                          return "Amount is required";
                        }
                        const num = Number(value);
                        if (isNaN(num)) {
                          return "Amount must be a number";
                        }
                        if (num <= 0) {
                          return "Amount must be greater than 0";
                        }
                        return true;
                      }}
                    />
                    <Button
                      className="mt-2 h-11 w-full cursor-pointer rounded-xl bg-brand-gradient text-sm font-semibold text-white transition-all hover:opacity-95 disabled:opacity-60"
                      type="submit"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </Form>
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

export default SetCreditPromiseDrawer;
