import {
  Flex,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Box,
  Button,
} from "@chakra-ui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  createColumnHelper,
} from "@tanstack/react-table";
import { GetCaresPropertyOutput } from "../PropertyPopup/PropertyPopup";
import { useRef } from "react";
import { Download } from "lucide-react";
import saveAs from "file-saver";
import { urls } from "../../utils/consts";
import { useMutation } from "@tanstack/react-query";

type Props = Pick<GetCaresPropertyOutput, "addressPermutations"> & {
  caresId: string;
};

const columnHelper = createColumnHelper<Props["addressPermutations"][number]>();

const columns = [
  columnHelper.accessor("address", {
    cell: (info) => info.getValue(),
    header: () => <span>Address Variations</span>,
  }),
];

async function exportAddressPermutations(caresId: string) {
  const url = new URL(urls.export.addresses);
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

function AddressPermutations({ addressPermutations, caresId }: Props) {
  const table = useReactTable({
    data: addressPermutations,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 53, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  const items = rowVirtualizer.getVirtualItems();

  const { mutate: exportData } = useMutation({
    mutationKey: ["exportAddresses", caresId],
    mutationFn: () => exportAddressPermutations(caresId),
  });

  return (
    <Flex flexDir="column" gap={4}>
      <Flex flexDir="row" justifyContent="space-between">
        <Flex flexDir="column">
          <Text fontSize="xl" fontWeight="bold">
            Unstandardized Addresses
          </Text>
          <Text>
            Find unstandardized addresses for this CARES Act property.
          </Text>
        </Flex>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download size={18} />}
          alignSelf="end"
          onClick={() => exportData()}
        >
          Download
        </Button>
      </Flex>
      <Box
        ref={tableContainerRef}
        pos="relative"
        w="100%"
        borderRadius={12}
        borderColor="gray.200"
        borderWidth={1}
        maxH="30em"
        overflowY="scroll"
      >
        <Table variant="striped" display="grid" w="100%">
          <Thead pos="sticky" top={0} zIndex={1} display="grid" bgColor="white">
            {table.getHeaderGroups().map((headerGroup) => (
              <Tr key={headerGroup.id} display="flex" w="100%">
                {headerGroup.headers.map((header) => (
                  <Th key={header.id} display="flex" w="100%">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </Th>
                ))}
              </Tr>
            ))}
          </Thead>
          <Tbody
            display="grid"
            pos="relative"
            w="100%"
            h={`${rowVirtualizer.getTotalSize()}px`}
          >
            {items.map((virtualRow) => {
              const row = rows[virtualRow.index];
              return (
                <Tr
                  display="flex"
                  pos="absolute"
                  data-index={virtualRow.index} //needed for dynamic row height measurement
                  ref={(node) => rowVirtualizer.measureElement(node)} //measure dynamic row height
                  key={row.id}
                  transform={`translateY(${virtualRow.start}px)`}
                  w="100%"
                >
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <Td key={cell.id} display="flex" w="100%">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Td>
                    );
                  })}
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
    </Flex>
  );
}

export default AddressPermutations;
