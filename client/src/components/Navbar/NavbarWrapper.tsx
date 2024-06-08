import { Box, Flex } from "@chakra-ui/react";
import { Outlet, useOutletContext } from "react-router-dom";
import Navbar from "./Navbar";
import { useState } from "react";

export type PopupType = "about" | "chart" | "property" | "suggestions";
type PopupState = [
  openPopup: PopupType | undefined,
  setOpenPopup: React.Dispatch<React.SetStateAction<PopupType | undefined>>
];

function NavbarWrapper() {
  const [openPopup, setOpenPopup] = useState<PopupType | undefined>();
  return (
    <Flex w="100dvw" h="100dvh" flexDir="column">
      <Navbar openPopup={openPopup} setOpenPopup={setOpenPopup} />
      <Box h="100%">
        <Outlet context={[openPopup, setOpenPopup]} />
      </Box>
    </Flex>
  );
}
export function useOpenPopup() {
  return useOutletContext<PopupState>();
}

export default NavbarWrapper;
