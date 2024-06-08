import {
  Flex,
  Heading,
  IconButton,
  Button,
  Box,
  useDisclosure,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Portal,
} from "@chakra-ui/react";
import { HamburgerIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { BiBarChartSquare } from "react-icons/bi";
import { PopupType } from "./NavbarWrapper";
import UploadModal from "../UploadModal/UploadModal";
import { CloudUpload, FolderDown } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  openPopup: PopupType | undefined;
  setOpenPopup: React.Dispatch<React.SetStateAction<PopupType | undefined>>;
}

function Navbar({ openPopup, setOpenPopup }: Props) {
  const {
    isOpen: isUploadModalOpen,
    onToggle: onUploadModalToggle,
    onClose: onUploadModalClose,
  } = useDisclosure();

  return (
    <>
      <Flex
        w="100%"
        p={2}
        alignItems="center"
        justifyContent="space-between"
        bgColor="blue.500"
      >
        <Flex flexDir="row" alignItems="center" gap={2}>
          <Menu>
            <MenuButton
              as={IconButton}
              variant="ghost"
              size="sm"
              icon={<HamburgerIcon boxSize={6} color="white" />}
              aria-label={"Menu"}
              _hover={{ bgColor: "blue.600" }}
              _active={{ bgColor: "blue.600" }}
            />
            <Portal>
              <MenuList>
                <MenuItem
                  icon={<CloudUpload size={20} />}
                  onClick={onUploadModalToggle}
                >
                  Upload data
                </MenuItem>
                <MenuItem icon={<FolderDown size={20} />}>
                  Export all data
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
          <Link to="/">
            <Heading fontSize="lg" textColor="white">
              Atlanta CARES Act Eviction Tracker
            </Heading>
          </Link>
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
            onClick={() =>
              openPopup === "suggestions"
                ? setOpenPopup(undefined)
                : setOpenPopup("suggestions")
            }
          >
            Suggestions
          </Button>
        </Flex>
      </Flex>
      <UploadModal isOpen={isUploadModalOpen} onClose={onUploadModalClose} />
    </>
  );
}

export default Navbar;
