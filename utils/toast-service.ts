import { Slide, toast, type ToastOptions } from "react-toastify";

const BASE: ToastOptions = {
  position: "top-right",
  autoClose: 5000,
  className:
    "!rounded-2xl !border !border-border-subtle !bg-surface !text-sm !text-foreground !font-sans !shadow-lg !shadow-zinc-200/60",
  hideProgressBar: true,
  closeOnClick: false,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
  transition: Slide,
};

class ToastService {
  static info = ({ text }: { text: string }) => {
    toast.info(text, BASE);
  };

  static error = ({ text }: { text: string }) => {
    toast.error(text, BASE);
  };

  static success = ({ text }: { text: string }) => {
    toast.success(text, BASE);
  };
}

export default ToastService;
