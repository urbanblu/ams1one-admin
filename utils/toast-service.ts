import { showToast } from "@/components/ui/toast";

class ToastService {
  static info = ({ text }: { text: string }) => showToast("info", text);
  static error = ({ text }: { text: string }) => showToast("error", text);
  static success = ({ text }: { text: string }) => showToast("success", text);
}

export default ToastService;
