/** App.js
 * Citizen Operation Group
 * Test JS for building a interface to the Open 311 API
 */

var app = {
    tgtConsole: "console",
    discovery: {},
    startup: function () {
        $.ajax({
            type: 'GET',
            url: "https://city-of-ottawa-dev.apigee.net/open311/v2/discovery.json",
            datatype: "json",
            statusCode: {
                403 : function () {
                    alert("Missing or Invalid API Key (specifed the error message)");
                },
                400 : function () {
                    alert("The URL request is invalid or open311 service is not running or reachable.");
                }
            }
        }).success(function (data) {
            app.discovery = data;
            app.toConsole(JSON.stringify(data));
        })
    },
    get: function (param) {
        return this.discovery[param];
    },
    getProperties: function () {
        var list = [];
        for (var field in this.discovery) {
            if (this.discovery.hasOwnProperty(field)) {
                var obj = {}
                obj[field] = this.discovery[field];
                list.push(obj);
            }
        }
        return list;
    },
    list: function () {
        toConsole(JSON.stringify(this.discovery));
    },
    listAvailableKeys: function () {
        var list = [];
        for (var field in this.discovery) {
            if (this.discovery.hasOwnProperty(field)) {
                list.push(field);
            }
        }
        return list;
    },
    toConsole: function (data) {
        document.getElementById(this.tgtConsole).innerHTML = data;
    },
    generatePrimary: function () {
        $.ajax({
            type: 'GET',
            url: "https://city-of-ottawa-dev.apigee.net/open311/v2/services.json",
            datatype: "json",
            statusCode: {
                403: function () {
                    alert("Missing or Invalid API Key (specifed the error message)");
                },
                400: function () {
                    alert("The URL request is invalid or open311 service is not running or reachable.");
                }
            }
        }).success(function (data) {
            // If successful.
            // Clear table.
            document.getElementById("primary-container").innerHTML = '';

            /* The element structure is as follows:
                 {
                    "service_code": "2000000-1",
                    "service_name": "Test All Inputs Service",
                    "description": "Use this service to test all of the input types contained in the open311 Georeport V2 specification.",
                    "metadata": true,
                    "type": "realtime",
                    "keywords": "test",
                    "group": "Test"
                },
             */

            // For each element found build a row.
            var temp_RowBuilder = "";

            for (i = (data.length-1); i >= 0; i--) {
                temp_RowBuilder += app.generatePrimaryRow(data[i]);
            }

            // Push built list to the page.
            document.getElementById("primary-container").innerHTML = temp_RowBuilder;
        })
    },
    generatePrimaryRow: function (dataElement) {
        var row = "";
        row += '<div class="row" id="pc-' + dataElement.service_name + '">';
        row += '<div class="col-md-12">';
        row += '<h4>' + dataElement.service_name + '</h4>';
        //row += '<p>' + dataElement.description + '</p>'; 
        //row += '<p> <a class="btn" href="https://city-of-ottawa-dev.apigee.net/open311/v2/services/' + dataElement.service_code + '.xml"> Advanced details » </a></p>'; 
        row += '<p> <a class="btn" id="pmryTicketingLink" code="' + dataElement.service_code + '" href="#"> Send to ticketing » </a></p>'; 
        row += '</div>';
        row += '</div>';
        return row;
    },
    generateSecondary: function (service_code) {       
        if (service_code == 'null') {
            return;
        }

        $.ajax({
            type: 'GET',
            url: "https://city-of-ottawa-dev.apigee.net/open311/v2/services/" + service_code + ".json",
            datatype: "json",
            statusCode: {
                403: function () {
                    alert("Missing or Invalid API Key (specifed the error message)");
                },
                400: function () {
                    alert("The URL request is invalid or open311 service is not running or reachable.");
                }
            }
        }).success(function (data) {
            // If successful.
            // Clear table.
            document.getElementById("secondary-container").innerHTML = '';

            // For each element found in the attrib list build a row.
            var localAttrib = data.attributes;
            var temp_RowBuilder = "";

            for (i = 0; i < localAttrib.length; i++) {
                temp_RowBuilder += app.generateFormRow(localAttrib[i]);
            }

            // Push built list to the page.
            document.getElementById("secondary-container").innerHTML = temp_RowBuilder;
        })
    },
    localize: function (param) {
        var locale = 'en';
        /*
            Eventually fix all the bad descriptions.
            also allows for translations. Beats FR edition.
        */
    },
    generateFormRow: function (data) {
        /*
            Form data attribute is packaged 
            {
            "variable": false,
            "code": "addtl_contact_fields",
            "datatype": "string",
            "required": false,
            "datatype_description": null,
            "order": 1,
            "description": "Additional contact information",
            "values": []
            }
        */
        var row = '';

        // If we are a just a string display as such.     
        if (data.variable == false) {
            row += '<div class="form-group col-2"></div>';
            row += '<div class="form-group col-10" id="' + data.code + '">';

            var localDD = data.description;            

            if (/Additional contact+/.test(localDD)) {
                row += '<h3>' + localDD + '</h3>';
            } else {
                row += '<p>' + localDD + '</p>';
            } 
            
            row += '</div>';
            // If we are a proper form element.            
        } else {
            // Label in 2-DIV
            row += '<div class="form-group col-2">';
            row += '<label class="control-label" for="' + data.code + '">' + data.description + '</label>';
            row += '<div class="col-10">';
                // Input Object for 10-DIV
            if (data.datatype == 'string') {
                row += '<input class="form-control" id="' + data.code + '" type="text"/>';
            } else if (data.datatype == 'singlevaluelist') {
                // Detect Yes/No Radios
                if (/Yes+/.test(data.values[0].key)) {
                    for (var field in data.values) {
                        row += '<div class="radio">';
                        row += '<label><input type="radio" name="' + data.values[0].key + '">' + data.values[field].name + '</label>';
                        row += '</div>';
                    }
                    // Regular selection
                } else {
                    row += '<select class="custom-select" id="' + data.code + '">';
                    for (var field in data.values) {
                        row += '<option value="' + data.values[field].key + '">' + data.values[field].name + '</option>';
                    }
                    row += '</select>';
                }
            } else if (data.datatype == 'text') {
                    row += '<textarea class="form-control" rows="5" id="' + data.code + '"></textarea>';
            } else {
                    row += '<input class="form-control" id="' + data.code + '" type="text"/>';
                    console.log(data.datatype);
            }

            if (data.required == 'true') {
                // append required to the above row using id of localData.code
            }

            if (data.datatype_description != null) {
                // append alt code to id of localData.code
                console.log("DTD: " + data.datatype_description);
            }
            row += '</div>';
            row += '</div>';
        }
        return row;
    },
    postRequest: function () {
        
    }
// app.js 
}