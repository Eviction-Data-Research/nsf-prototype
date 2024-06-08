import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import Home from "./routes/root";
import NavbarWrapper from "./components/Navbar/NavbarWrapper";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CaresProperty, {
  loader as caresPropertyLoader,
} from "./routes/caresProperty";
import { loader as suggestionLoader } from "./routes/suggestion";

export const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <NavbarWrapper />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "cares/:caresId",
        element: <CaresProperty />,
        loader: caresPropertyLoader,
      },
    ],
  },
  {
    path: "/suggestion/:caresId/:caseID",
    loader: suggestionLoader,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ChakraProvider>
  </React.StrictMode>
);
