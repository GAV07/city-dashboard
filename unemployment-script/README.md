# Unemployment Script

## Table of Contents

1. [Introduction](#introduction)
2. [How to Execute](#how-to-execute)
3. [Understanding the Script](#understanding-the-script)
    - [What Are Series IDs (example of Miami)](#seriedIDs)
    - [Example Query](#example-query)
    - [Code Explanation](#code-explanation)
4. [BLS Documentation](#documentation)

## Introduction

This script is designed to fetch unemployment data from the U.S. Department of Labor's Bureau of Labor Statistics (BLS) API. It provides a flexible way to retrieve unemployment statistics for analysis and reporting purposes.

## How to Execute

To execute the script, inside `/unemployment-script`, run the following command in your terminal:

```bash
node unemployment-script.js
```

## Understanding the Script

### What Are Series IDs (example of Miami)
                                1         2
                       12345678901234567890
          Series ID    LAUCT124500000000003
          Positions    Value            Field Name
          1-2          LA               Prefix
          3            U                Seasonal Adjustment Code
          4-18         CT1245000000000  Area Code
          19-20        03               Measure Code
      
   * #### Measure Codes
         measure_code	 measure_text
         03	         unemployment rate
         04	         unemployment
         05	         employment
         06	         labor force
         07	         employment-population ratio
         08	         labor force participation rate
         09	         civilian noninstitutional population

### Example Query

```javascript
const res = await axios.post(URL, {
   "seriesid": ['LAUCT124500000000003', 'LAUCT124500000000004'],
   "startyear": 2023,
   "endyear": 2023
}, {
   headers: {
      "Authorization": `Bearer ${blsAPIKey}`
   }
})
```

### Code Explanation

#### The provided JavaScript code snippet illustrates making a POST request using the Axios library. Here's a breakdown focusing on the series, start and end years, and the authorization:


   * `seriesid`: The series ID is an array
      ```javascript 
           ['LAUCT124500000000003', 'LAUCT124500000000004']
      ``` 
      representing specific data series. In this example, it includes two series IDs.


   * `startyear` and `endyear`: These properties specify the start and end years for the data retrieval. In this case, it's set to 2023`, indicating data for the year 2023.


   * `Authorization`: `Bearer ${blsAPIKey}`: This sets the "Authorization" header in the HTTP request. The BLS API requires an API key for authentication.

## BLS Documentation

* ### [Register for a key](https://data.bls.gov/registrationEngine/)
    
* ### [API signatures (V2)](https://www.bls.gov/developers/api_signature_v2.htm)

* ### [Local Area Unemployment Statistics](https://www.bls.gov/help/hlpforma.htm)

   * ### [Area type codes](https://download.bls.gov/pub/time.series/la/la.area_type)
   
   * ### [Area code of cities](https://download.bls.gov/pub/time.series/la/la.area)
  
   * ### [Measure codes](https://download.bls.gov/pub/time.series/la/la.measure) 