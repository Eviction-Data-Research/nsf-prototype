import {
  Flex,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Skeleton,
  Stack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { urls } from "../../../utils/consts";
import { Suggestion } from "../../../utils/types";
import NewSuggestions from "./NewSuggestions";
import ArchivedSuggestions from "./ArchivedSuggestions";
import { useReducer, useState } from "react";
import { VerificationStatus } from "../../PropertyPage/Suggestions/Suggestions";

export type CaresPropertySuggestion = {
  id: number;
  propertyName: string;
  suggestions: Pick<Suggestion, "caseID" | "address" | "verification">[];
};

type GetSuggestionsOutput = {
  suggestions: CaresPropertySuggestion[];
  archivedSuggestions: Suggestion[];
  numSuggestions: number;
};

enum ActionType {
  Set,
  Init,
}

type InitAction = {
  type: ActionType.Init;
  suggestions: CaresPropertySuggestion[];
};

type SetAction = {
  id: number;
  type: ActionType.Set;
  caseID: string;
  verificationStatus: VerificationStatus;
};

export type Action = InitAction | SetAction;

function reducer(
  state: CaresPropertySuggestion[],
  action: Action
): CaresPropertySuggestion[] {
  switch (action.type) {
    case ActionType.Set:
      const { id, caseID, verificationStatus } = action;
      const newState = new Array(state.length);
      state.forEach((property, i) => {
        if (property.id === id) {
          const newSuggestions = property.suggestions.map((suggestion) => {
            if (suggestion.caseID === caseID) {
              return {
                ...suggestion,
                verification: verificationStatus,
              };
            } else {
              return suggestion;
            }
          });
          newState[i] = {
            ...property,
            suggestions: newSuggestions,
          };
        } else {
          newState[i] = property;
        }
      });
      return newState;
    case ActionType.Init:
      const { suggestions } = action;
      return suggestions;
    default:
      return state;
  }
}

function SuggestionsPopup() {
  const { data } = useQuery({
    queryKey: ["suggestions"],
    queryFn: () => {
      return fetch(urls.suggestion.all).then((res) => {
        const parsed = res.json() as Promise<GetSuggestionsOutput>;
        parsed.then((val) => {
          suggestionsDispatch({
            type: ActionType.Init,
            suggestions: val.suggestions,
          });
        });
        return parsed;
      });
    },
    refetchOnWindowFocus: false,
  });

  const [suggestionsWithVerificationContext, suggestionsDispatch] = useReducer(
    reducer,
    data?.suggestions ?? []
  );
  // const [
  //   archivedSuggestionsWithVerificationContext,
  //   archivedSuggestionsDispatch,
  // ] = useReducer(reducer, archivedSuggestions);

  const [mostRecentSuggestionFocus, setMostRecentSuggestionFocus] = useState<
    string | null
  >(null);

  // if (data === undefined || isLoading) {
  //   return <Spinner />;
  // }

  return (
    <Flex
      pos="absolute"
      top={2}
      right={2}
      flexDir="column"
      gap={4}
      p={4}
      bgColor="white"
      borderRadius={12}
      boxShadow="md"
      w="35em"
    >
      <Text fontWeight="bold" fontSize="lg">
        Suggestions
      </Text>
      <Tabs colorScheme="blue" align="center" isFitted isLazy>
        <TabList>
          <Tab
            textColor="gray.500"
            borderColor="gray.200"
            fontWeight="semibold"
            _selected={{ textColor: "blue.500", borderColor: "blue.500" }}
          >
            <Flex gap={2} alignItems="center">
              New
              {data ? (
                <Flex justifyContent="center" alignItems="center">
                  <Text
                    px={1}
                    py={0}
                    bgColor="red.500"
                    borderRadius={2}
                    fontSize={12}
                    textColor="white"
                    fontWeight="bold"
                  >
                    {data.numSuggestions}
                  </Text>
                </Flex>
              ) : null}
            </Flex>
          </Tab>
          <Tab
            textColor="gray.500"
            borderColor="gray.200"
            fontWeight="semibold"
            _selected={{ textColor: "blue.500", borderColor: "blue.500" }}
          >
            Archived
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {data ? (
              <NewSuggestions
                properties={suggestionsWithVerificationContext}
                mostRecentSuggestionFocus={mostRecentSuggestionFocus}
                setMostRecentSuggestionFocus={setMostRecentSuggestionFocus}
                dispatch={suggestionsDispatch}
              />
            ) : (
              <Stack spacing={2}>
                {Array.from(Array(6)).map((_, i) => (
                  <Skeleton key={i} w="100%" h="51px" />
                ))}
              </Stack>
            )}
          </TabPanel>
          <TabPanel>
            <ArchivedSuggestions />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Flex>
  );
}

export default SuggestionsPopup;
