# SEC Script

## Table of Contents

1. [Introduction](#introduction)
2. [How to Execute](#how-to-execute)
3. [Tax PDF Information](#information)

## Introduction

#### This script

    1. Downloads the zipped (.gz) file by using Puppeteer (a web scraping library)
        It opens a browser at the link and clicks the download button

    2. It stores it locally to `/downloads/XML.gz`

    3. An unzipping library is then used to unzip the .gz file and extract the .xml file to /downloads/sec.xml

    3. The .xml is then parsed into JSON

    5. Using that JSON, it grabs the firm values and sends them to the database


## How to Execute

To execute the script, inside `/sec-script`, run the following command in your terminal:

```bash
node sec-script.js
```

## SEC Site

* ### [site](https://adviserinfo.sec.gov/compilation)
