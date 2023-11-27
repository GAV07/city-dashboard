# Labor Force Scripts

## Table of Contents

1. [Introduction](#introduction)
2. [Example Query](#example-query)
3. [Census Documentation](#census-documentation)

## Introduction

### These scripts scrape/gather/aggregate data from the census website

1. #### `employment-by-industry-script.js`
    Gathers employment data categorized by various industries, such as agriculture, construction, manufacturing, finance, healthcare, and more. It provides a comprehensive overview of employment trends across diverse sectors over multiple years.
    
    #### To execute:
    ```bash
    node employment-by-industry-script.js
    ```
2. #### `mean-median-inc-over-years-script.js`
    Retrieves mean and median household income data over several years. It provides insights into the economic trends, showcasing the changes in income levels for different regions.

    #### To execute:
    ```bash
    node mean-median-inc-over-years-script.js
    ```
   
3. #### `overall-pov-inc-over-years-script.js`
    Retrieves overall poverty income data over several years. It provides insights into the population, the number of individuals below the poverty level, and the percentage of people living below the poverty line.

    #### To execute:
    ```bash
    node overall-pov-inc-over-years-script.js
    ```
      
4. #### `pop-by-income-script.js`
    Retrieves population data categorized by income levels over multiple years. This script provides insights into the distribution of population across various income brackets.

    #### To execute:
    ```bash
    node pop-by-income-script.js
    ```
         
5. #### `poverty-level-by-edu-script.js`
    Retrieves data related to poverty levels categorized by education over multiple years. This script provides insights into the correlation between education levels and poverty rates.

    #### To execute:
    ```bash
    node poverty-level-by-edu-script.js
    ```
   
## Example Query

```javascript
const state = 12; // florida
const city = 45000; // miami
const year = 2023;
const timeRange = 1;
const variable = ['DP03_0033E', 'DP03_0033PE'] // [ estimate, percent ] refer to the docs for the variables
const URL = `https://api.census.gov/data/${year}/acs/acs${timeRange}/profile?get=${variable}&for=place:${city}&in=state:${florida}&key=${CENSUS_API_KEY}`

// fetch the data
const response = await fetch(URL, {
    method: 'GET'
});
```

```javascript
// output
[
   ["DP03_0033E", "DP03_0033PE"], // [ estimate variable, percent variable ]
   ["12345", "15.2"] // [ estimate value, percent value ]
]
```


## Census Documentation

### Unemployment Information

* `table` - https://data.census.gov/table/ACSDP{TIME_RANGE}Y{YEAR}.DP03?q=unemployment&g=160XX00US1245000
* `variables` - https://api.census.gov/data/{YEAR}/acs/acs{TIME_RANGE}/profile/groups/DP03.html
* `API Url for Unemployment queries` - https://api.census.gov/data/{YEAR}/acs/acs{TIME_RANGE}/profile?get={VARIABLE}&for=place:45000&in=state:12&key={CENSUS_API_KEY}


### Poverty Information

* `table` -> https://data.census.gov/table/ACSST{TIME_RANGE}Y{YEAR}.S1701?q=Poverty&g=160XX00US1245000
* `variables` -> https://api.census.gov/data/{YEAR}/acs/acs{TIME_RANGE}/subject/variables.html
* `API Url for poverty queries` -> https://api.census.gov/data/{YEAR}/acs/acs{TIME_RANGE}/subject?get={VARIABLES}&for=place:45000&in=state:12&key={CENSUS_API_KEY}

