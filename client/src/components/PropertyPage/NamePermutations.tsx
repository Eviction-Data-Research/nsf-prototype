import {
  Flex,
  Text,
  Box,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { GetCaresPropertyOutput } from "../PropertyPopup/PropertyPopup";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

type Props = Pick<GetCaresPropertyOutput, "property" | "namePermutations">;

const columnHelper = createColumnHelper<Props["namePermutations"][number]>();

const columns = [
  columnHelper.accessor("plaintiff", {
    cell: (info) => info.getValue(),
    header: () => <span>Name Permutation</span>,
  }),
  columnHelper.accessor("count", {
    cell: (info) => info.getValue(),
    header: () => <span>Eviction Count</span>,
  }),
  columnHelper.accessor("mostRecentlySeen", {
    cell: (info) => info.getValue(),
    header: () => <span>Seen Most Recently On</span>,
  }),
];

function NamePermutations({ property, namePermutations }: Props) {
  const table = useReactTable({
    data: namePermutations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    defaultColumn: {
      size: 20, //starting column size
      minSize: 20, //enforced during column resizing
      maxSize: 500, //enforced during column resizing
    },
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

  return (
    <Flex flexDir="column" gap={4}>
      <Flex flexDir="column">
        <Text fontSize="xl" fontWeight="bold">
          Name Permutations
        </Text>
        <Text>
          {`Known plaintiff names in the eviction records used at ${property.propertyName}.`}
        </Text>
      </Flex>
      <Text fontWeight="bold">
        {`Total number of permutations: ${namePermutations.length}`}
      </Text>
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
                      <Td display="flex" key={cell.id} w="100%">
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

export default NamePermutations;
