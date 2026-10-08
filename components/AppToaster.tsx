"use client";

import { Toaster } from "react-hot-toast";

const AppToaster = () => (
  <Toaster
    position="bottom-right"
    toastOptions={{
      style: {
        background: "#000000",
        color: "#fff",
      },
    }}
  />
);

export default AppToaster;
