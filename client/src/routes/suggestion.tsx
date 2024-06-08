import { Params, redirect } from "react-router-dom";
import { urls } from "../utils/consts";

type GetSuggestionLocationsOutput = {
  id: number;
  caseID: string;
  caresLocation: [number, number];
  evictionLocation: [number, number];
};

function constructGoogleMapsUrl(
  caresLocation: GetSuggestionLocationsOutput["caresLocation"],
  evictionLocation: GetSuggestionLocationsOutput["evictionLocation"]
) {
  return `https://www.google.com/maps/dir/${caresLocation
    .reverse()
    .join(",")}/${evictionLocation.reverse().join(",")}/`;
}

export async function loader({
  params,
}: {
  params: Params<"caresId" | "caseID">;
}) {
  const { caresLocation, evictionLocation } = await getSuggestionLocations(
    params.caresId!,
    params.caseID!
  );

  return redirect(constructGoogleMapsUrl(caresLocation, evictionLocation));
}

export async function getSuggestionLocations(caresId: string, caseID: string) {
  const url = new URL(urls.suggestion.external);
  url.searchParams.set("caresId", caresId);
  url.searchParams.set("caseID", caseID);
  const res = await fetch(url);
  const data = await res.json();
  return data as GetSuggestionLocationsOutput;
}
