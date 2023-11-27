# Dashboard Scripts

## Table of Contents

1. [Project Setup](#project-setup)
    - [Installation](#installation)
    - [Environment Variables](#environment-variables)
2. [Folder Structure](#folder-structure)


## Project Setup

### Installation

To get started, follow these steps to set up and run the project on your local machine.

1. **Download Node.js:**

   Visit the official Node.js website at [https://nodejs.org/](https://nodejs.org/) and download the latest LTS (Long-Term Support) version, which is recommended for most users.


2. **Clone the repository to your local machine:**

   ```bash
   git clone https://github.com/elouis12/dashboard-scripts.git
    ```

3. **Install the necessary packages:**

   ```bash
   cd dashboard-scripts
   npm install
   ```

### Environment Variables

To configure the project correctly, you need to set up environment variables. Create a .env file in the root directory (dashboard-scripts) and add the following variables:

```bash
API_KEY = YOUR_API_KEY
BASE_ID = YOUR_BASE_ID

SEC_TABLE = YOUR_TABLE_NAME
INCOME_LEVEL_TABLE = YOUR_INCOME_LEVEL_TABLE_NAME
POVERTY_EDUCATION_LEVEL_TABLE = YOUR_POVERTY_EDUCATION_LEVEL_TABLE_NAME
INCOME_MEAN_AND_MEDIAN_TABLE = YOUR_INCOME_MEAN_AND_MEDIAN_TABLE_NAME
OVERALL_POVERTY_LEVEL_TABLE = YOUR_OVERALL_POVERTY_LEVEL_TABLE_NAME
PROPERTY_APPRAISAL_TAXES_TABLE = YOUR_PROPERTY_APPRAISAL_TAXES_TABLE_NAME
UNEMPLOYMENT_TABLE = YOUR_UNEMPLOYMENT_TABLE_NAME
EMPLOYMENT_BY_INDUSTRY_TABLE = YOUR_EMPLOYMENT_BY_INDUSTRY_TABLE_NAME

CENSUS_API_KEY = YOUR_CENSUS_API_KEY

BLS_API_KEY = YOUR_BLS_API_KEY

OPENAI_API_KEY = YOUR_OPENAI_API_KEY
```

## Folder Structure

The project is structured as follows:

- `dashboard-scripts/` (Parent Directory)
  - |
   - `sec-script/` (Child Folder)
      - `sec-script.js` - (in the directory, run) ```node sec-script.js```

