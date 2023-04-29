<!-----

Yay, no errors, warnings, or alerts!

Conversion time: 0.415 seconds.


Using this Markdown file:

1. Paste this output into your source file.
2. See the notes and action items below regarding this conversion run.
3. Check the rendered output (headings, lists, code blocks, tables) for proper
   formatting and use a linkchecker before you publish this page.

Conversion notes:

* Docs to Markdown version 1.0β34
* Fri Apr 28 2023 21:50:21 GMT-0700 (PDT)
* Source doc: IP tracer - Decisions
----->



# IP Tracer


## Designs decisions and considerations


## Introduction

This document is a summary of the design decisions and considerations taken into account while building the IP Tracer.


## Decisions



1. Architecture:
    1. The service is deployed as an express server on an instance of GCP App Engine. This architecture is simple and supports auto-scaling. Other frameworks were discarded due to complexity. Serverless approach is discarded due to higher complexity and the service relying on in-memory data that would need to be externalised with cloud functions.
    2. Chosen DB is Mongo. Document DB favors speed and flexibility over consistency and data integrity, which fits the objective here, since persistence needs are very simple. Also, Mongo DB pairs quite nicely with JS-based technologies.
2. Load Management for IPs
    3. As load increases, auto-scaling can help serve a higher number of requests. However, given the throttle limits of IP-API, it would be hard to serve more than a couple thousands requests per minute without a paid plan, as the API can only serve 1545 IPs per minute, a SLA restriction. For a load close to 5M requests per minute, IP-API is insufficient. Given the number of possible IPs (~4000M), getting completely different IPs every time in a 1-minute window is utterly possible. Moreover, since there are no applicable principles of spatial or temporal locality (i.e. we can’t predict what the next IP is likely to be), we have to assume a uniform distribution and caching IP results won’t significantly help reduce response-time for individual ips. Also, even though requests throttle quotas are awarded per client IP, not even by using all outbound google IPs ([about 500](https://cloud.google.com/appengine/docs/legacy/standard/python/outbound-ip-addresses)) could the effective limit be raised to support millions of requests. Similarly, it is evident that if this limit was easy to circumvent, it wouldn’t still be in place.Finally, we conclude a paid plan is necessary to fulfil such demand.
    4. IP API offers 2 ways of retrieving IPs: single and batch. Batch mode significantly increases the rate at which trace requests can be served. Because of this, the proposed implementation explores a dual approach, where a limit is defined for single-ip requests and, after this limit, individual traces are grouped in batches for faster processing. The proposed approach resolves a batch either as soon as it is full or as early as it can, based on a limit in the window time between batches. These 2 parameters (MAX_BATCH_SIZE  and MIN_WINDOW_INTERVAL) can be used combined with the limit for single-requests to manage how the app reacts to heavy load. This approach has some downfalls (first trace after the limit can take up to MIN_WINDOW_INTERVAL to resolve if no other traces are requested) but could be improved to predict load and adjust the parameters dynamically. Also, similar alternatives were considered (like having fixed-window batches) but were discarded due to similar complexity and lower efficiency and flexibility to configure.
    5. Much of the country-related data has been stored in static files as it doesn’t change with time (countries don’t move, currencies rarely change). The proposed approach is to store them statically and only change them when necessary. The implementation stores files within the code, but they could be easily externalised if necessary, for example to allow for easy manual updates. (Note: distance between countries and US is recalculated for every trace. This is not necessary, it could be also stored in a static file)
3. Exchange rate cache:
    6. Retrieving the exchange rate for each individual trace can be costly, and also API cost increases with usage. So, the proposed solution caches exchange rates with a configurable validity, since exchange rates change often but usually not several times in a minute. It can be noted that the implementation includes a simple cache that caches result promise, to avoid fetching the data multiple times if a fetch is already being executed.
4. Statistics:
    7. To compute statistics, traces are saved in a MongoDB collection, as raw data. While this is not strictly necessary, it is advisable to store them since they constitute the most basic piece of data of the application and are a good backup to turn to if more aggregated data gets corrupted.
    8. For statistics, since they both represent maximums per country, the data is stored in a separate document for each country (traces are incremented, distance is stored though it actually doesn’t change, and could be taken from a static file, but implementation hasn’t gone that far). This denormalization ensures that retrieving statistics is a O(1) operation, since it always has to process the same number of records (less than 300 in fact, the number of countries)
    9. To group statistics by country, they are updated every time a new ip is traced. Doing this could introduce the threat of concurrency, where a country is updated in between another service instance was reading it. Initially an optimistic locking approach with retries was implemented, but this was removed in favor of atomic updates made by MongoDB.
5. Misc:
    10. Routes.ts could be split into separate files for routes, controller and server when it grows.
    11. Error handling has been implemented to a very basic extent.