// "use client";

// /* eslint-disable react-hooks/set-state-in-effect */
// import { useEffect, useState } from "react";
// import { createPortal } from "react-dom";

// import { useToast } from "@/hooks/use-toast";
// import { ToastCard } from "@/components/ui/toast";

// export function Toaster() {
//   const { toasts, dismiss } = useToast();
//   const [mounted, setMounted] = useState(false);

//   useEffect(() => {
//     setMounted(true);
//   }, []);

//   if (!mounted) return null;

//   return createPortal(
//     <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 pointer-events-none sm:justify-end">
//       <div className="flex w-full max-w-sm flex-col gap-3">
//         {toasts.map(({ id, ...toast }) => (
//           <ToastCard
//             key={id}
//             id={id}
//             {...toast}
//             onClose={() => {
//               toast.onOpenChange?.(false);
//               dismiss(id);
//             }}
//           />
//         ))}
//       </div>
//     </div>,
//     document.body
//   );
// }
