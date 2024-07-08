# Process Documentation

This document describes the various notable technical decisions made throughout the development process of this application.

## Geocoding

As mentioned in `db/README.md`:

> All geocoding in this project (during data upload and to initially fetch the locations of CARES Act properties) is done using the [United States Census Bureau's free geocoding service](https://geocoding.geo.census.gov/geocoder/). There are some edge cases that arise from this service as it geocodes addresses rather "literally", typically relating to the actual parcel location as opposed to how people typically reference the address geographically.

The decision to use the U.S. Census Bureau's tool as the geocoding service was primarily driven by the high cost of batch geocoding using other services. Accurate at the time of writing, the pricing models for popular batch geocoding options are shown below:

- MapBox - $5/1000 requests, no free tier
- Google - $5/1000 requests, $200 monthly credit
- U.S. Census - free
- ArcGIS - $0.50/1000 requests, 20,000 requests free per month

Each "request" can be interpreted as a lookup for a single address. To evaluate these options, we make 2 important assumptions: the frequency of file uploads and the amount of eviction records we expect to see per file upload. For the frequency of file uploads, we shall assume that a city planner uploads eviction records quarterly. The number of deduplicated eviction records (duplication referring to the `caseID` field) in a 3-month time period differs per county. However, as a baseline estimate, we assume around ~5500 or so deduplicated records between DeKalb and Fulton over one quarter. If we look at Google and ArcGIS, these services provide "free tiers" up to a certain amount per month. However, since data uploads happen only several times a year, we would likely only be able to make use of 1 months' worth of credits in each service's free tier. For ArcGIS, this stays relatively inexpensive. Google's geocoding API remains feasible as long as the monthly $200 credit is not surpassed.

Given these rough calculations, it may be justified to use more robust geocoding services instead of the one provided for free by the U.S. Census Bureau. However, considering that the prototyping and development stage of this tool would require many data uploads to test functionality, the decision was made to use the free service. This decision also allowed the complexity of the batch geocoding to be addressed at a later time, enabling more time to be spent actually developing the user-facing side of the application.

Circling back to the services mentioned above, it is important to note the potential benefits and drawbacks of using each service. As for the U.S. Census Bureau's geocoding API, I have found that it performs rather poorly in some cases where the address is geocoded to a location that is away from the actual point of interest. One example of this is `2916 CLAIRMONT RD` which geocodes to the back of a hotel (33.84278968999249, -84.31512718790488), instead of the actual apartment complex (33.84142051791532, -84.31571492069926). Services like Google will likely accurately geocode these addresses due to their extensive data on "how people actually navigate to their destinations", allowing them to suggest relevant points of interest as opposed to the location of a piece of land associated with an address. This problem is exacerbated when eviction records that _would_ be suggestions if the addresses were geocoded accurately are not within a suggestion radius of one another, preventing the suggestions from even being presented to the user at all for them to manually determine.

In addition, this API is sensitive to small differences between addresses, causing some addresses not to geocode at all. This can be problematic because we are unable to suggest any such eviction records as potential suggestions if they are not already address matches with any CARES Act properties.

With regard to the other services, the general consensus from geospatial developers online seem to be that MapBox and ArcGIS offer competitive geocoding capabilities compared to Google in terms of their accuracy and speed.

## Suggestion radius threshold

The suggestion radius threshold determines how far away (spatially) a geocoded eviction record must be from a geocoded CARES Act property in order for it to be considered a suggestion (provided, of course, that the eviction record does not have a matching address to the CARES Act property). To investigate a reasonable distance, we looked at 2 potential distances, 0.1 miles (160m) and 0.25 miles (400m), and tested how many suggestions we would theoretically see in DeKalb and Fulton counties. When we conducted these calculations, our assumed upload frequency was weekly instead of quarterly.

**0.1mi/160m:**

```
[DeKalb] Mean: 88.08227848101266, Min: 1, Max: 421, Median: 51.0
[Fulton] Mean: 89.10526315789474, Min: 6, Max: 647, Median: 27.5
```

**0.25mi/400m:**

```
[DeKalb] Mean: 220.43396226415095, Min: 4, Max: 1016, Median: 136.0
[Fulton] Mean: 193.1578947368421, Min: 16, Max: 1270, Median: 90.0
```

Given the high maximum values in the 0.25mi case, we determined that a threshold of 0.1mi was our best option. We discussed the idea of making this distance even smaller. However, we came to the conclusion that setting the distance too small could result in us not adequately capturing related CARES Act evictions if the two buildings were not immediately adjacent to one another. Later, we also realized that due to the general inaccuracy of the U.S. Census Bureau geocoding service, setting this value any smaller would allow more edge cases to occur like the example described in the previous section.

We recently pivoted our assumption in data upload frequency from weekly to quarterly. It may be beneficial to revisit the suggestion radius again due to the sheer number of suggestions the user will be faced with after a single data upload, as there will likely be thousands of suggestions that will be extremely time-consuming and tiresome to comb through as a user.

## Suggestion confirmation scope

Another point of discussion during the design process was whether confirming or rejecting a suggestion should automatically apply the same choice to all other suggestions for that property with the same address. For example, let us assume that (A) `520 FULTON ST, Apt 302` is the address for our suggestion, and that there are other suggestions for the same CARES Act property for which the addresses are (B) `520 FULTON ST, Apt 404`, (C) `520 FULTON ST, Apt 211`, and (D) `521 FULTON ST`. Using the rule, if a user confirms the suggestion, meaning that they have matched (A) as belonging to the CARES Act property, records (B) and (C) would also be confirmed as well.

We decided not to continue with this idea for the time being, our reasoning being that maintaining record-level granularity in confirming and rejecting suggestions is still important in the event of undoing/changing a singular record. Given that our assumed data upload frequency has decreased, however, our expectation for the number of suggestions presented to the user at one time has increased. It may be best to reconsider the user experience in sifting through the increased quantity of suggestions, especially if they can only verify one suggestion at a time.

## Date range of interest

Initially, all available data for Fulton and DeKalb counties were used to populate the database. For Fulton, these were eviction records dated between 2017 to 2020, and for DeKalb, these were 2019 to 2021. We made this assumption as we wanted to have as much data as possible to serve as reference points for how many evictions are occurring at CARES Act properties in general, and not just for the period of time after the CARES Act was passed. However, upon plotting the data on the map and looking at the quantity of data, we decided that it was unnecessary to seed the database with pre-COVID data, especially when contextualizing this tool for our users. Since our users are primarily trying to find unlawful evictions at CARES Act properties of interest, it was no longer as crucial for us to analyze historical trends on the tool itself. We thereby realigned our tool's functionalities to the goals of the user by restricting our date range to after March of 2020. Driving this decision was also the judgment that eviction records will be scraped again.

Note that the seed file `db/seed/dump.sql` does not contain any eviction record information. The date range agreed upon merely serves as a guideline for how we should initialize the application moving forward for our users.
