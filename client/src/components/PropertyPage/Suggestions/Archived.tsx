import {
  Badge,
  Box,
  Button,
  Flex,
  Link as ChakraLink,
  Grid,
  GridItem,
  Stack,
  Text,
} from "@chakra-ui/react";
import React, { useRef } from "react";
import { Suggestion } from "../../../utils/types";
import { Action, ActionType, VerificationStatus } from "./Suggestions";
import { urls } from "../../../utils/consts";
import { useMutation } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  BiCalendarX,
  BiCalendarCheck,
  BiCalendarEdit,
  BiUndo,
} from "react-icons/bi";
import { Link } from "react-router-dom";

const NUM_COLUMNS = 2;

type Props = {
  archivedSuggestions: Suggestion[];
  mostRecentSuggestionFocus: string | null;
  setMostRecentSuggestionFocus: React.Dispatch<
    React.SetStateAction<string | null>
  >;
  dispatch: React.Dispatch<Action>;
};

function Archived({
  archivedSuggestions,
  mostRecentSuggestionFocus,
  setMostRecentSuggestionFocus,
  dispatch,
}: Props) {
  if (archivedSuggestions.length === 0) {
    return <Text>No archived suggestions for this property.</Text>;
  }

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
    // onSuccess: (_, variables, __) => {
    //   queryClient.invalidateQueries({ queryKey: ["cares", variables.id] });
    // },
  });

  const gridContainerRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(archivedSuggestions.length / NUM_COLUMNS),
    estimateSize: () => 98, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => gridContainerRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element?.getBoundingClientRect().height
        : undefined,
    overscan: 5,
  });

  return (
    <Box
      ref={gridContainerRef}
      pos="relative"
      w="100%"
      maxH="30em"
      overflowY="scroll"
    >
      <Grid w="100%" h={`${rowVirtualizer.getTotalSize()}px`}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          return (
            <GridItem
              display="flex"
              pos="absolute"
              top={0}
              left={0}
              w="100%"
              data-index={virtualRow.index}
              ref={(node) => rowVirtualizer.measureElement(node)}
              key={virtualRow.key}
              transform={`translateY(${virtualRow.start}px)`}
            >
              <Flex
                flexDir="row"
                w={
                  archivedSuggestions.length % 2 === 1 &&
                  virtualRow.index ===
                    Math.ceil(archivedSuggestions.length / 2) - 1
                    ? "50%"
                    : "100%"
                }
                gap={2}
                pr={
                  archivedSuggestions.length % 2 === 1 &&
                  virtualRow.index ===
                    Math.ceil(archivedSuggestions.length / 2) - 1
                    ? 1
                    : 0
                }
                justifyContent="space-between"
              >
                {archivedSuggestions
                  .slice(
                    virtualRow.index * NUM_COLUMNS,
                    (virtualRow.index + 1) * NUM_COLUMNS
                  )
                  .map((suggestion) => {
                    return (
                      <Flex
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
                        my={1}
                        gap={2}
                      >
                        <Flex w="100%" justifyContent="space-between">
                          <Flex flexDir="row" gap={2} alignItems="center">
                            <ChakraLink
                              href={`/suggestion/${suggestion.id}/${suggestion.caseID}`}
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
                                    id: suggestion.id,
                                    caseID: suggestion.caseID,
                                  }).then(() => {
                                    dispatch({
                                      type: ActionType.Set,
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
                                    id: suggestion.id,
                                    caseID: suggestion.caseID,
                                  }).then(() => {
                                    dispatch({
                                      type: ActionType.Set,
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
                                to={`/suggestion/${suggestion.id}/${suggestion.caseID}`}
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
                                  id: suggestion.id,
                                  caseID: suggestion.caseID,
                                }).then(() => {
                                  dispatch({
                                    type: ActionType.Set,
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
                    );
                  })}
              </Flex>
            </GridItem>
          );
        })}
      </Grid>
    </Box>
  );
}

export default Archived;
