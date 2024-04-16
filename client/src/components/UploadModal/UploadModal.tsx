import {
  useDisclosure,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Text,
  useToast,
  Stack,
  Box,
  Flex,
  Select,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { Column, columnLabels, urls } from "../../utils/consts";

enum UploadStage {
  PreUpload,
  ColAssignment,
}

const uploadStageButtonTextMap: Record<UploadStage, string> = {
  [UploadStage.PreUpload]: "Next",
  [UploadStage.ColAssignment]: "Submit",
};

type SelectedFilters = Record<string, Column>;

function UploadModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [uploadStage, setUploadStage] = useState(UploadStage.PreUpload);
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({});

  const selectedFiltersValues = Object.values(selectedFilters);

  const errorToast = useToast({
    title: "Error",
    description: "An error has occurred. Please try again later.",
    status: "error",
    duration: 5000,
    isClosable: true,
  });

  const {
    data: preUploadData,
    mutateAsync: preUploadMutate,
    isPending: preUploadIsPending,
  } = useMutation({
    mutationFn: (formData: FormData) =>
      fetch(urls.upload.request, {
        method: "POST",
        body: formData,
      }).then((res) => res.json()),
  });

  const {
    // data: colAssignData,
    mutateAsync: colAssignMutate,
    // isPending: colAssignIsPending,
  } = useMutation({
    mutationFn: (formData: FormData) =>
      fetch(urls.upload.confirm, {
        method: "POST",
        body: formData,
      }).then((res) => res.json()),
  });

  async function handlePreUploadSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    // const input = formData.get("file");
    // console.log(input);
    // if (form === null) {
    //   errorToast();
    //   return;
    // }
    try {
      await preUploadMutate(formData);
      setUploadStage(UploadStage.ColAssignment);
    } catch (e) {
      console.error(e);
      errorToast();
    }
  }
  async function handleColAssignmentSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("cols", JSON.stringify(selectedFilters));
    console.log(formData.get("file"));
    try {
      await colAssignMutate(formData);
    } catch (e) {
      console.error(e);
      errorToast();
    }
  }

  const submitHandlerMap: Record<UploadStage, (params: any) => void> = {
    [UploadStage.PreUpload]: handlePreUploadSubmit,
    [UploadStage.ColAssignment]: handleColAssignmentSubmit,
  };

  return (
    <>
      <Button
        colorScheme="teal"
        zIndex={2}
        position="absolute"
        bottom={5}
        left={5}
        leftIcon={<DownloadIcon size={20} />}
        onClick={onOpen}
      >
        Upload week data
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="2xl"
        closeOnOverlayClick={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload week data</ModalHeader>
          <form onSubmit={submitHandlerMap[uploadStage]}>
            <ModalBody display="flex" flexDirection="column" gap={4}>
              <Box>
                <input name="file" type="file" accept=".csv" />
              </Box>
              {uploadStage === UploadStage.ColAssignment && (
                <Flex flexDir="column" h={400} gap={2}>
                  <Text fontSize="lg" fontWeight="semibold">
                    Assign columns
                  </Text>
                  <Stack h="100%" overflowY="scroll">
                    {Object.entries(preUploadData).map(([k, _v], i) => {
                      return (
                        <Flex
                          flexDir="row"
                          alignItems="center"
                          justifyContent="space-between"
                          bgColor={i % 2 === 0 ? "white" : "gray.100"}
                          p={1}
                        >
                          <Text>{k}</Text>
                          <Select
                            size="sm"
                            value={selectedFilters[k] ?? "Ignore"}
                            w="40%"
                            placeholder="Ignore"
                            onChange={(e) => {
                              setSelectedFilters({
                                ...selectedFilters,
                                [k]: e.target.value as Column,
                              });
                            }}
                          >
                            {Object.values(Column)
                              .filter(
                                (col) =>
                                  col === selectedFilters[k] ||
                                  !selectedFiltersValues.includes(col)
                              )
                              .map((col) => (
                                <option value={col}>{columnLabels[col]}</option>
                              ))}
                          </Select>
                        </Flex>
                      );
                    })}
                  </Stack>
                </Flex>
              )}
            </ModalBody>

            <ModalFooter gap={2}>
              <Button
                variant="ghost"
                colorScheme="red"
                onClick={() => {
                  setUploadStage(UploadStage.PreUpload);
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                colorScheme="teal"
                mr={3}
                isLoading={preUploadIsPending}
              >
                {uploadStageButtonTextMap[uploadStage]}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
}

export default UploadModal;
