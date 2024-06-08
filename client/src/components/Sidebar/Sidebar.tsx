import {
  ChevronRightIcon,
  ChevronLeftIcon,
  CalendarIcon,
  CloseIcon,
} from "@chakra-ui/icons";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Flex,
  Icon,
  IconButton,
  InputGroup,
  InputRightElement,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { FolderDown } from "lucide-react";
import { SingleDatepicker } from "chakra-dayzed-datepicker";
import {
  DatepickerConfigs,
  PropsConfigs,
} from "chakra-dayzed-datepicker/dist/utils/commonTypes";
import { County, FilterState } from "../../routes/root";
import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { urls } from "../../utils/consts";
import { saveAs } from "file-saver";

const configs: DatepickerConfigs = {
  dateFormat: "MMMM d, yyyy",
};

const propsConfigs: PropsConfigs = {
  calendarPanelProps: {
    contentProps: {
      border: "none",
    },
    dividerProps: {
      color: "gray.300",
    },
  },
  popoverCompProps: {
    popoverBodyProps: {
      p: 0,
    },
  },
  inputProps: {
    placeholder: "Select a date",
  },
  dayOfMonthBtnProps: {
    defaultBtnProps: {
      p: 1,
      _hover: {
        bgColor: "blue.100",
      },
    },
    selectedBtnProps: {
      bgColor: "blue.500",
      textColor: "white",
      _hover: {
        bgColor: "blue.600",
      },
    },
  },
};

async function exportEvictionData() {
  const url = new URL(urls.export.all);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "text/csv",
      "Content-Type": "application/json",
    },
  });

  const filename = res.headers
    ?.get("Content-Disposition")
    ?.split(";")
    ?.find((n) => n.includes("filename="))
    ?.replace("filename=", "")
    ?.trim();

  const blob = await res.blob();

  saveAs(blob, filename);
}

interface Props {
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
}

function Sidebar({ filterState, setFilterState }: Props) {
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: true });

  const cancelRef = useRef(null);

  const {
    isOpen: isExportOpen,
    onOpen: onExportOpen,
    onClose: onExportClose,
  } = useDisclosure();

  const { mutate: exportData } = useMutation({
    mutationKey: ["exportEvictions"],
    mutationFn: () => exportEvictionData(),
    onSuccess: () => {
      onExportClose();
    },
  });

  return (
    <Flex h="100%" flexDir="row" pos="relative" top={0} left={0} w="22em">
      <Flex
        w="100%"
        h="100%"
        bgColor="white"
        flexDir="column"
        p={4}
        display={isOpen ? "flex" : "none"}
        gap={4}
      >
        <Flex flexDir="row" justifyContent="space-between" alignItems="center">
          <Text fontSize="lg" fontWeight="bold">
            Filters
          </Text>
          <Button
            size="sm"
            variant="outline"
            colorScheme="blue"
            leftIcon={<FolderDown size={18} />}
            onClick={onExportOpen}
          >
            Export
          </Button>
          <AlertDialog
            isOpen={isExportOpen}
            onClose={onExportClose}
            leastDestructiveRef={cancelRef}
            isCentered
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Export
                </AlertDialogHeader>

                <AlertDialogBody>
                  You are currently exporting <b>all eviction records</b> in the
                  database. Would you like to proceed?
                </AlertDialogBody>

                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={onExportClose}>
                    Cancel
                  </Button>
                  <Button
                    colorScheme="blue"
                    onClick={() => exportData()}
                    ml={3}
                  >
                    Confirm
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
        </Flex>
        <CheckboxGroup
          colorScheme="blue"
          defaultValue={["Fulton", "DeKalb"]}
          onChange={(value) => {
            if (value.length === 0) return;
            setFilterState({ ...filterState, counties: value as County[] });
          }}
          value={filterState.counties}
        >
          <Stack spacing={1} direction="column">
            <Checkbox size="md" value="Fulton">
              Fulton County
            </Checkbox>
            <Checkbox size="md" value="DeKalb">
              DeKalb County
            </Checkbox>
            <Checkbox size="md" value="Clayton" disabled>
              Clayton County
            </Checkbox>
            <Checkbox size="md" value="Cobb" disabled>
              Cobb County
            </Checkbox>
            <Checkbox size="md" value="Gwinnett" disabled>
              Gwinnett County
            </Checkbox>
          </Stack>
        </CheckboxGroup>
        <Flex flexDir="column" gap={2}>
          <Text fontWeight="medium">From</Text>
          <InputGroup>
            <SingleDatepicker
              usePortal
              propsConfigs={propsConfigs}
              configs={configs}
              name="date-from"
              date={filterState.dateFrom}
              onDateChange={(date) =>
                setFilterState({ ...filterState, dateFrom: date })
              }
            />
            <InputRightElement
              pointerEvents={filterState.dateFrom ? "auto" : "none"}
            >
              {filterState.dateFrom ? (
                <IconButton
                  size="xs"
                  variant="ghost"
                  colorScheme="blue"
                  _hover={{ bgColor: "transparent", cursor: "pointer" }}
                  icon={<CloseIcon />}
                  aria-label={"Clear"}
                  onClick={() =>
                    setFilterState({ ...filterState, dateFrom: undefined })
                  }
                />
              ) : (
                <CalendarIcon />
              )}
            </InputRightElement>
          </InputGroup>
        </Flex>
        <Flex flexDir="column" gap={2}>
          <Text fontWeight="medium">To</Text>
          <InputGroup>
            <SingleDatepicker
              usePortal
              propsConfigs={propsConfigs}
              configs={configs}
              name="date-to"
              date={filterState.dateTo}
              onDateChange={(date) =>
                setFilterState({ ...filterState, dateTo: date })
              }
            />
            <InputRightElement
              pointerEvents={filterState.dateTo ? "auto" : "none"}
            >
              {filterState.dateTo ? (
                <IconButton
                  size="xs"
                  variant="ghost"
                  colorScheme="blue"
                  _hover={{ bgColor: "transparent", cursor: "pointer" }}
                  icon={<CloseIcon />}
                  aria-label={"Clear"}
                  onClick={() =>
                    setFilterState({ ...filterState, dateTo: undefined })
                  }
                />
              ) : (
                <CalendarIcon />
              )}
            </InputRightElement>
          </InputGroup>
        </Flex>
        <Flex flexDir="column" gap={2}>
          <Text fontWeight="medium">
            Buildings with eviction count at least
          </Text>
          <NumberInput
            size="md"
            defaultValue={0}
            min={0}
            value={filterState.minCount}
            onChange={(valString) => {
              const parsed = parseInt(valString);
              setFilterState({
                ...filterState,
                minCount: Number.isNaN(parsed) ? 0 : parsed,
              });
            }}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <Checkbox value="activity" size="sm">
            Only show buildings with activity
          </Checkbox>
        </Flex>
      </Flex>
      <Box
        bgColor="white"
        py={6}
        h="fit-content"
        w="fit-content"
        borderRightRadius={8}
        transitionDuration="0.2s"
        transitionTimingFunction="ease-in-out"
        _hover={{
          cursor: "pointer",
          bgColor: "gray.50",
        }}
        boxShadow="md"
        onClick={isOpen ? onClose : onOpen}
      >
        <Icon as={isOpen ? ChevronLeftIcon : ChevronRightIcon} boxSize={7} />
      </Box>
    </Flex>
  );
}

export default Sidebar;
