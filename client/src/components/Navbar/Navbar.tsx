import { Text, Flex, Heading, IconButton, Button, Box } from "@chakra-ui/react";
import { HamburgerIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { BiBarChartSquare } from "react-icons/bi";
import { PopupType, useOpenPopup } from "./NavbarWrapper";

interface Props {
  openPopup: PopupType | undefined;
  setOpenPopup: React.Dispatch<React.SetStateAction<PopupType | undefined>>;
}

function Navbar({ openPopup, setOpenPopup }: Props) {
  return (
    <Flex
      w="100%"
      p={2}
      alignItems="center"
      justifyContent="space-between"
      bgColor="blue.500"
    >
      <Flex flexDir="row" alignItems="center" gap={2}>
        <IconButton
          variant="ghost"
          size="sm"
          icon={<HamburgerIcon boxSize={6} color="white" />}
          aria-label={"Menu"}
          _hover={{ bgColor: "blue.600" }}
        />
        <Heading fontSize="lg" textColor="white">
          Atlanta CARES Act Eviction Tracker
        </Heading>
      </Flex>
      <Flex gap={2} flexDir="row">
        <IconButton
          icon={<InfoOutlineIcon boxSize={6} color="white" />}
          size="sm"
          aria-label="Info"
          variant="ghost"
          _hover={{ bgColor: "blue.600" }}
          onClick={() =>
            openPopup === "about"
              ? setOpenPopup(undefined)
              : setOpenPopup("about")
          }
        />
        <IconButton
          icon={<BiBarChartSquare color="white" />}
          aria-label="Chart"
          variant="ghost"
          size="sm"
          fontSize={28}
          _hover={{ bgColor: "blue.600" }}
          onClick={() =>
            openPopup === "chart"
              ? setOpenPopup(undefined)
              : setOpenPopup("chart")
          }
        />
        <Button
          size="sm"
          variant="outline"
          _hover={{ bgColor: "blue.600" }}
          textColor="white"
          rightIcon={
            <Box
              bgColor="red.500"
              textColor="white"
              py={0.5}
              px={1}
              borderRadius={2}
            >
              80
            </Box>
          }
        >
          Updates
        </Button>
      </Flex>
    </Flex>
  );
}

export default Navbar;
