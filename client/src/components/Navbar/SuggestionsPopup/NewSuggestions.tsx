import {
  Box,
  Text,
  Flex,
  Stack,
  Button,
  Badge,
  Link as ChakraLink,
  Icon,
  Collapse,
} from "@chakra-ui/react";
import { useMutation } from "@tanstack/react-query";
import { urls } from "../../../utils/consts";
import { Suggestion } from "../../../utils/types";
import { Action, CaresPropertySuggestion } from "./SuggestionsPopup";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useRef, useState } from "react";
import {
  BiCalendarCheck,
  BiCalendarEdit,
  BiCalendarX,
  BiUndo,
} from "react-icons/bi";
import { Link } from "react-router-dom";
import {
  ActionType,
  VerificationStatus,
} from "../../PropertyPage/Suggestions/Suggestions";
import { ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  properties: CaresPropertySuggestion[];
  mostRecentSuggestionFocus: string | null;
  setMostRecentSuggestionFocus: React.Dispatch<
    React.SetStateAction<string | null>
  >;
  dispatch: React.Dispatch<Action>;
};

function NewSuggestions({
  properties,
  mostRecentSuggestionFocus,
  setMostRecentSuggestionFocus,
  dispatch,
}: Props) {
  const [expandedIndices, setExpandedIndices] = useState<Set<number>>(
    new Set()
  );

  const { mutateAsync: confirmMutateAsync } = useMutation({
    mutationFn: (suggestion: Pick<Suggestion, "id" | "caseID">) =>
      fetch(urls.suggestion.confirm, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caresId: suggestion.id,
          caseID: suggestion.caseID,
        }),
      }),
  });
  const { mutateAsync: rejectMutateAsync } = useMutation({
    mutationFn: (suggestion: Pick<Suggestion, "id" | "caseID">) =>
      fetch(urls.suggestion.reject, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caresId: suggestion.id,
          caseID: suggestion.caseID,
        }),
      }),
  });
  const { mutateAsync: undoMutateAsync } = useMutation({
    mutationFn: (suggestion: Pick<Suggestion, "id" | "caseID">) =>
      fetch(urls.suggestion.undo, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caresId: suggestion.id,
          caseID: suggestion.caseID,
        }),
      }),
  });

  const tableContainerRef = useRef<HTMLDivElement>(null);

  const estimateHeight = useCallback(
    (index: number) => {
      if (!expandedIndices.has(index)) return 51;
      return 98 * properties[index].suggestions.length + 51;
    },
    [expandedIndices, properties]
  );

  const rowVirtualizer = useVirtualizer({
    count: properties.length,
    estimateSize: estimateHeight, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => tableContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    // measureElement:
    //   typeof window !== "undefined" &&
    //   navigator.userAgent.indexOf("Firefox") === -1
    //     ? (element) => element?.getBoundingClientRect().height
    //     : undefined,
    overscan: 5,
    // debug: true,
  });

  const items = rowVirtualizer.getVirtualItems();

  return (
    <Box ref={tableContainerRef} w="100%" maxH="30em" overflowY="scroll">
      <Box pos="relative" w="100%" h={rowVirtualizer.getTotalSize()}>
        <Box
          pos="absolute"
          top={0}
          left={0}
          w="100%"
          transform={`translateY(${items[0]?.start ?? 0}px)`}
        >
          {items.map((virtualRow) => {
            const row = properties[virtualRow.index];
            return (
              <Box
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                key={row.id}
                w="100%"
                border="none"
                gap={4}
                my={2}
              >
                <>
                  <Flex
                    w="100%"
                    justifyContent="space-between"
                    alignItems="center"
                    borderColor="gray.400"
                    borderRadius={6}
                    borderWidth={1}
                    p={3}
                    textAlign="left"
                    gap={2}
                    _hover={{
                      bgColor: "gray.50",
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      if (expandedIndices.has(row.id)) {
                        expandedIndices.delete(row.id);
                      } else {
                        expandedIndices.add(row.id);
                      }
                      setExpandedIndices(new Set(Array.from(expandedIndices)));
                    }}
                  >
                    <Text lineHeight={1.3}>
                      Potential evictions near{" "}
                      <Text
                        as="span"
                        fontWeight="semibold"
                        textDecor="underline"
                        textUnderlineOffset={2}
                      >
                        {row.propertyName}
                      </Text>
                    </Text>
                    <Flex gap={2} alignItems="center">
                      <Flex
                        flexDir="row"
                        justifyContent="space-between"
                        w="100%"
                        pr={2}
                        gap={4}
                        alignItems="center"
                      >
                        <Flex justifyContent="center" alignItems="center">
                          <Text
                            bgColor="red.500"
                            textColor="white"
                            fontWeight="bold"
                            lineHeight={1}
                            px={1.5}
                            py={1.5}
                            borderRadius={2}
                            fontSize="small"
                          >
                            {row.suggestions.length}
                          </Text>
                        </Flex>
                      </Flex>
                      <Icon
                        as={
                          expandedIndices.has(row.id) ? ChevronUp : ChevronDown
                        }
                        boxSize={6}
                      />
                    </Flex>
                  </Flex>
                  <Collapse
                    in={expandedIndices.has(row.id)}
                    unmountOnExit
                    transition={{
                      enter: { duration: 0.1 },
                      exit: { duration: 0.1 },
                    }}
                  >
                    <Stack mt={2} spacing={2}>
                      {row.suggestions.map((suggestion) => (
                        <Flex
                          key={suggestion.caseID}
                          bgColor={
                            suggestion.verification ===
                            VerificationStatus.Unverified
                              ? "white"
                              : "gray.50"
                          }
                          w="100%"
                          borderWidth={
                            mostRecentSuggestionFocus === suggestion.caseID &&
                            suggestion.verification ===
                              VerificationStatus.Unverified
                              ? 2
                              : 1
                          }
                          borderColor={
                            mostRecentSuggestionFocus === suggestion.caseID &&
                            suggestion.verification ===
                              VerificationStatus.Unverified
                              ? "blue.500"
                              : "gray.200"
                          }
                          borderRadius={12}
                          flexDir="column"
                          alignItems="end"
                          p={4}
                          gap={2}
                        >
                          <Flex w="100%" justifyContent="space-between">
                            <Flex flexDir="row" gap={2} alignItems="center">
                              <ChakraLink
                                href={`/suggestion/${row.id}/${suggestion.caseID}`}
                                display="block"
                                w={2}
                                h={2}
                                bg="blue.500"
                                borderRadius={10}
                                _visited={
                                  suggestion.verification ===
                                  VerificationStatus.Unverified
                                    ? { bg: "white" }
                                    : { bg: "gray.50" }
                                }
                                pointerEvents="none"
                              ></ChakraLink>
                              <Text>{suggestion.address}</Text>
                              {suggestion.verification !==
                              VerificationStatus.Unverified ? (
                                <Badge
                                  colorScheme={
                                    suggestion.verification ===
                                    VerificationStatus.Confirmed
                                      ? "green"
                                      : "red"
                                  }
                                >
                                  {suggestion.verification ===
                                  VerificationStatus.Confirmed
                                    ? "Confirmed"
                                    : "Rejected"}
                                </Badge>
                              ) : null}
                            </Flex>
                            <Text textColor="gray.600" fontSize="small">
                              3 days ago
                            </Text>
                          </Flex>
                          <Stack direction="row" gap={1}>
                            {suggestion.verification ===
                            VerificationStatus.Unverified ? (
                              <>
                                <Button
                                  colorScheme="red"
                                  variant={
                                    mostRecentSuggestionFocus ===
                                    suggestion.caseID
                                      ? "solid"
                                      : "outline"
                                  }
                                  size="sm"
                                  leftIcon={<BiCalendarX />}
                                  onClick={() =>
                                    rejectMutateAsync({
                                      id: row.id,
                                      caseID: suggestion.caseID,
                                    }).then(() => {
                                      dispatch({
                                        type: ActionType.Set,
                                        id: row.id,
                                        caseID: suggestion.caseID,
                                        verificationStatus:
                                          VerificationStatus.Rejected,
                                      });
                                    })
                                  }
                                >
                                  Reject
                                </Button>
                                <Button
                                  colorScheme="green"
                                  variant={
                                    mostRecentSuggestionFocus ===
                                    suggestion.caseID
                                      ? "solid"
                                      : "outline"
                                  }
                                  size="sm"
                                  leftIcon={<BiCalendarCheck />}
                                  onClick={() =>
                                    confirmMutateAsync({
                                      id: row.id,
                                      caseID: suggestion.caseID,
                                    }).then(() => {
                                      dispatch({
                                        type: ActionType.Set,
                                        id: row.id,
                                        caseID: suggestion.caseID,
                                        verificationStatus:
                                          VerificationStatus.Confirmed,
                                      });
                                    })
                                  }
                                >
                                  Accept
                                </Button>
                                <Link
                                  to={`/suggestion/${row.id}/${suggestion.caseID}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Button
                                    colorScheme="blue"
                                    variant={
                                      mostRecentSuggestionFocus ===
                                      suggestion.caseID
                                        ? "outline"
                                        : "solid"
                                    }
                                    size="sm"
                                    leftIcon={<BiCalendarEdit />}
                                    onClick={() =>
                                      setMostRecentSuggestionFocus(
                                        suggestion.caseID
                                      )
                                    }
                                  >
                                    Verify
                                  </Button>
                                </Link>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                bgColor="white"
                                leftIcon={<BiUndo />}
                                onClick={() =>
                                  undoMutateAsync({
                                    id: row.id,
                                    caseID: suggestion.caseID,
                                  }).then(() => {
                                    dispatch({
                                      type: ActionType.Set,
                                      id: row.id,
                                      caseID: suggestion.caseID,
                                      verificationStatus:
                                        VerificationStatus.Unverified,
                                    });
                                  })
                                }
                              >
                                Undo
                              </Button>
                            )}
                          </Stack>
                        </Flex>
                      ))}
                    </Stack>
                  </Collapse>
                </>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

export default NewSuggestions; //
