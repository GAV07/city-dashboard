
# Documentation and Implementation 
 By Nageline Vallon-Rodriguez

## Table of Contents

1. [Inital Review](#inital-review)
2. [Chosen Improvments](#chosen-imporvements)
3. [Implementations](#implementations)
4. [Final Notes](#final-notes)


## Initial Review
My initial notes of the Miami Dashboard Repository:
- Most scripts work towards aggregating data for the Miami Dashboard db, therefore data processing module is not robust enough for thorough endpoint usage (i.e. multiple paramater requests) in `getRecord`.
- API is incomplete so endpoints can be starting point of feature additions.
- `BASE_ID` called within the constructor of `ProcessData` may be unnecesary as it does not change throughout the program.
- All data file has consts with the same name as imports. Renders imports unused?
- API UI could be better/friendlier to allow for easier endpoint testing and clearer interaction points.
- Overall repository documentation could be better. Lacks clear explanation on inner tools usage and interactions.
    - First task for me was *understanding the codebase*, its purpose, and what usages users would gain from it. Therefore, further developments would need to be discussed on what the actual product is providing as documentation did not suffice.




## Chosen Improvements
- Create an endpoint relating to any of the scripts/data/db tables. 
- Worked towards making the `getRecord` method better suited to handle enpoint queries that to my understanding would most be GET requests.
    - Added some more error handling, as some errors were falling through.
- Moved `BASE_ID` out of the constructor which now only passes the table. My thought proccess is that the table is subject to change depeanding on what script calls for `ProccessData`, the `BASE_ID` does not...
- API UI was updated to allow for easier understanding of endpoint usage and even allows for output viewing.
- Provided documentation below on my alterations and implementation as an example.




## Implementations

### employment.js
This file holds the employment endpoint, which allows the caller to retrive employments stats (Population and Percentage) by industry and/or year.

#### employment endpoint
The employment endpoint can retrieve either year, industry, or both parameters to query and filter through needed data.
- Possible Improvements: Allow of partial matching due to the complicated names for filtering by industry.
***
### ProccessData Module
The `ProccessData` module allows for the sending and retrieval of data to and from the Miami Dashboard db.
Alterations: 
`BASE_ID` : is removed from the constructor.

#### getRecord(Params)
`getRecord(params)`: was updated to recieve multiple parameters and not only two arguments. Object.keys(params).length are used to check the length to determine the amount of paramaters passed.
    - Further flexibility with the number of parameters could be implemented.
    - Moved this into the try-catch to actually catch errors thrown by a possible undefined URL.
    - Added a throw in the methods catch because errors were not propogating and would give a false 200.
***
### index.html
The `index.html` file sets the stage for the UI. 
Alterations: Added a more structured layout and added more spacing for visual appeal. Highlighting translates better visually for clickables. More containers were added to accomodate the input and ouput boxes.
Having an ouput box makes it easier to display examples.

#### fetchData(endpoint)
This function allows for the URI that was made via user inputs and clicking on the appropriate GET request to be show within the ouput box as well as the output of that call.

#### fetchEmploymentData()
This function allows for user to interact with the input boxes specifically for the employment endpoint (year and industry). These parameters are optional inputs.




## Final Notes
Further improvements could be made, such as setting up a specific routes module that organizes each endpoint if varying paramaters for a single resource is needed. However, this depends on the scale and end product goal for this API.
- Structuring the UI to section the endpoints may be helpful to keep the API clean and readable.
- Clarifying goals of the user with this API and the ease of that. (ex. Adjusting naming conventions for industry parameter, allowing for partial search, or brainstorming for more ideas?)
- Continued documentation on the whole of the project.



