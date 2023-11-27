# this was the start of a python script that would essentially do the same thing as the .js script
# the fetch() api was timing out the requests and so I started to write it in python
# then i tried the axios api and I was able to continue the .js script and make requests that were not timing out

import requests
import json


years = [2023, 2022, 2021, 2020, 2019, 2018, 2017];


seriesIds = ["LAUCT1245000000000"]; # this is the Miami area code
measureCodes = {

    "Labor Force": "06",
    "Employment": "05",
    "Unemployment": "04",
    "Unemployment Rate": "03",
}

headers = {'Content-type': 'application/json'}

def getData():


    # loop through each city
    for seriesId in seriesIds:


        # loops through each year
        for year in years:

            # for each city loop through and get data for labor force,
            for measure, code in measureCodes.items():

                print(measure + "---" + str(year) + "---" + seriesId+code)
                payload = {
                              "seriesid": [seriesId+code],
                              "startyear": str(year),
                              "endyear": str(year)
                }

                try:

                    p = requests.post('https://api.bls.gov/publicAPI/v2/timeseries/data/', json=payload, headers=headers)

                    json_data = json.loads(p.text)

                    table_data = json_data['Results']['series']

                    print(table_data)
                except e:
                    print(e)
                return


getData()


# this function processes the data returned by the request made to the bls api
def processData:


