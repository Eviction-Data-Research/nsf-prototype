import { Button, Divider, Flex, Spinner, Stack, Text } from "@chakra-ui/react";
import { Params, useParams } from "react-router-dom";
import { urls } from "../utils/consts";
import { GetCaresPropertyOutput } from "../components/PropertyPopup/PropertyPopup";
import { FolderDown, Printer } from "lucide-react";
import Trend from "../components/PropertyPage/Trend";
import Suggestions from "../components/PropertyPage/Suggestions/Suggestions";
import NamePermutations from "../components/PropertyPage/NamePermutations";
import AddressPermutations from "../components/PropertyPage/AddressPermutations";
import { queryClient } from "../main";
import { useMutation, useQuery } from "@tanstack/react-query";
import { saveAs } from "file-saver";

export async function loader({ params }: { params: Params<"caresId"> }) {
  const property = await queryClient.fetchQuery({
    queryKey: ["caresById", params.caresId, undefined, undefined],
    queryFn: () => getCaresPropertyById(params.caresId!),
  });
  return property;
}

export async function getCaresPropertyById(caresId: string) {
  const url = new URL(urls.cares.id);
  url.searchParams.set("id", caresId);
  const res = await fetch(url);
  const data = await res.json();
  return data as GetCaresPropertyOutput;
}

async function exportCaresPropertyData(caresId: string) {
  const url = new URL(urls.export.id);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "text/csv",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: parseInt(caresId),
    }),
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

function CaresProperty() {
  const { caresId } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["caresById", caresId!],
    queryFn: () => getCaresPropertyById(caresId!),
  });

  const { mutate: exportData } = useMutation({
    mutationKey: ["exportCares", caresId!],
    mutationFn: () => exportCaresPropertyData(caresId!),
  });

  if (data === undefined || isLoading) {
    return <Spinner />;
  }

  const {
    property,
    addressPermutations,
    namePermutations,
    suggestions,
    archivedSuggestions,
  } = data;

  return (
    <Stack direction="column" w="100%" px={40} py={10} spacing={5}>
      <Flex w="100%" flexDir="row" justifyContent="space-between">
        <Flex flexDir="column">
          <Text fontSize="xl" fontWeight="bold">
            {property.propertyName}
          </Text>
          <Text>{property.address}</Text>
        </Flex>
        <Flex flexDir="row" gap={2}>
          <Button
            variant="outline"
            leftIcon={<FolderDown size={18} />}
            onClick={() => exportData()}
          >
            Export
          </Button>
          <Button variant="outline" leftIcon={<Printer size={18} />}>
            Print
          </Button>
        </Flex>
      </Flex>
      <Divider borderColor="gray.200" />
      <Trend caresId={caresId!} suggestions={suggestions} />
      <Suggestions
        property={property}
        suggestions={suggestions}
        archivedSuggestions={archivedSuggestions}
      />
      <NamePermutations
        property={property}
        namePermutations={namePermutations}
      />
      <AddressPermutations
        caresId={caresId!}
        addressPermutations={addressPermutations}
      />
    </Stack>
  );
}

export default CaresProperty;
