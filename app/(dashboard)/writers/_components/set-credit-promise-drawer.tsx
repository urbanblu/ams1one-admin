import { Button as UiButton, drawerDialogClass } from "@/components/ui";
import CustomInputComponent from "@/components/custom-input-component";
import {
  CloseButton,
  CloseIcon,
  Drawer,
  Form,
} from "@heroui/react";
import React from "react";

type Props = {
  onFilterTap?: (payload: { name: string; phoneNumber: string }) => void;
};

function SetCreditPromiseDrawer(payload: Props) {
  const [drawerIsOpen, setDrawerOpen] = React.useState(false);

  return (
    <Drawer>
      <UiButton size="sm" onClick={() => setDrawerOpen(true)}>
        Credit promise
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
                    <UiButton className="mt-2" size="lg" type="submit" fullWidth>
                      Save credit promise
                    </UiButton>
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
