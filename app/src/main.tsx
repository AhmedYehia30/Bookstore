import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import { TRPCProvider } from "@/providers/trpc";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { CartProvider } from "@/contexts/CartContext";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <TRPCProvider>
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </TRPCProvider>
    </BrowserRouter>
  </React.StrictMode>
);
