# Tax Script

## Table of Contents

1. [Introduction](#introduction)
2. [How to Execute](#how-to-execute)
3. [Tax PDF Information](#information)

## Introduction

#### This script 

    1. Downloads the pdf by making a GET request on the pdf link

    2. It stores it locally to `/downloads/YEAR.pdf`

    3. The pdf is then parsed to text

    4. Open AI is useed, accompanied by some prompts, to grab the values for the cities needed

    5. The values are then sent to the database

    6. The process repeats for each year

## How to Execute

To execute the script, inside `/tax-script`, run the following command in your terminal:

```bash
node tax-script.js
```

## Tax PDF Information

* ### Getting a tax year 
    ```bash 
    https://www.miamidade.gov/pa/library/reports/YEAR-taxing-authority-reports.pdf
    ```
* ### [Year 2023](https://www.miamidade.gov/pa/library/reports/2023-taxing-authority-reports.pdf)
    ```bash 
    https://www.miamidade.gov/pa/library/reports/2023-taxing-authority-reports.pdf
    ```