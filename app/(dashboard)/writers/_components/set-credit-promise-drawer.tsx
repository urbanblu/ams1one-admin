import {
  Button,
  DrawerTitleBar,
  drawerBodyClass,
  drawerDialogClass,
  drawerFooterClass,
  drawerWidth,
} from "@/components/ui";
import CustomInputComponent from "@/components/custom-input-component";
import { cn, Drawer, Form } from "@heroui/react";
import React from "react";
import { LuWallet } from "react-icons/lu";

type Props = {
  onFilterTap?: (payload: { name: string; phoneNumber: string }) => void;
};

function SetCreditPromiseDrawer(payload: Props) {
  const [drawerIsOpen, setDrawerOpen] = React.useState(false);

  return (
    <Drawer>
      <Button size="sm" onClick={() => setDrawerOpen(true)}>
        Credit promise
      </Button>
      <Drawer.Backdrop isOpen={drawerIsOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Content placement="right">
          <Drawer.Dialog className={cn(drawerDialogClass, drawerWidth.form)}>
            <Form
              className="flex min-h-0 flex-1 flex-col"
              onSubmit={(e) => {
                e.preventDefault();
                const data = Object.fromEntries(new FormData(e.currentTarget));

                const finalData = {
                  name: data.name as string,
                  phoneNumber: data.phoneNumber as string,
                };

                payload.onFilterTap?.(finalData);
              }}
            >
              <DrawerTitleBar
                icon={<LuWallet />}
                title="Set credit promise"
                description="Cap how much credit this writer can carry."
                onClose={() => setDrawerOpen(false)}
              />
              <Drawer.Body className={drawerBodyClass}>
                <CustomInputComponent
                  label="Amount"
                  name="amount"
                  isRequired
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
              </Drawer.Body>
              <Drawer.Footer className={drawerFooterClass}>
                <Button size="lg" type="submit" fullWidth>
                  Save credit promise
                </Button>
              </Drawer.Footer>
            </Form>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

export default SetCreditPromiseDrawer;
