function getFormattedDate() {
    const now = new Date();
    return now.toISOString();
}

require([
    "esri/Map",
    "esri/views/MapView",
    "esri/layers/FeatureLayer",
    "esri/Graphic",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/renderers/UniqueValueRenderer",
    "esri/widgets/Popup",
    "esri/core/reactiveUtils",
    "esri/geometry/Extent"
    ], function(Map, MapView, FeatureLayer, Graphic, SimpleMarkerSymbol, UniqueValueRenderer, Popup, reactiveUtils, Extent) {
    var map = new Map({
        basemap: "gray-vector"
    });

    let selectedType = 'None';
    let addMode = false;
    let tempGraphic = null;
    let selectedStatuses = ["New"];
    let selectedTypes = ["Power Outage", "Water Main Break", "Traffic Issue", "Animal Control", "Other"];
    let isAdjustingLocation = false;
    const reportModal = document.getElementById("reportModal");
    const commentField = document.getElementById("commentField");
    const submitComment = document.getElementById("submitComment");
    const cancelComment = document.getElementById("cancelComment");
    const categoryDropdown = document.getElementById("categoryDropdown");
    const adjustLocationButton = document.getElementById("adjustLocation");
    const locationConfirmButton = document.getElementById("locationConfirmButton");
    const toggleTableBtn = document.getElementById('toggleTableBtn');
    const reportsTableContainer = document.getElementById('reportsTableContainer');
    const reportsTableBody = document.querySelector('#reportsTable tbody');

    var view = new MapView({
        container: "viewDiv",
        map: map,
        extent: {
            xmin: -85.22,
            ymin: 30.105,
            xmax: -85.18,
            ymax: 30.12,
            spatialReference: { wkid: 4326 }
        }
    });

    var typeRenderer = {
        type: "unique-value",
        field: "commentType",
        defaultSymbol: {
            type: "simple-marker",
            color: "gray",
            size: 6,
            outline: { color: "white", width: 0 }
        },
        uniqueValueInfos: [
            {
                value: "Power Outage",
                symbol: {
                    type: "simple-marker",
                    color: "yellow",
                    size: 6,
                    outline: { color: "white", width: 0 }
                }
            },
            {
                value: "Water Main Break",
                symbol: {
                    type: "simple-marker",
                    color: "#5cfac0",
                    size: 6,
                    outline: { color: "white", width: 0 }
                }
            },
            {
                value: "Traffic Issue",
                symbol: {
                    type: "simple-marker",
                    color: "#a67b05",
                    size: 6,
                    outline: { color: "white", width: 0 }
                }
            },
            {
                value: "Animal Control",
                symbol: {
                    type: "simple-marker",
                    color: "#75746f",
                    size: 6,
                    outline: { color: "white", width: 0 }
                }
            },
            {
                value: "Other",
                symbol: {
                    type: "simple-marker",
                    color: "orange",
                    size: 6,
                    outline: { color: "white", width: 0 }
                }
            }
        ]
    };

    var statusRenderer = {
        type: "unique-value",
        field: "status",
        uniqueValueInfos: [
            {
                value: "New",
                symbol: {
                    type: "simple-marker",
                    color: "red",
                    size: 12,
                    outline: { color: "white", width: 0 }
                }
            },
            {
                value: "Department Notified",
                symbol: {
                    type: "simple-marker",
                    color: "purple",
                    size: 12,
                    outline: { color: "white", width: 0 }
                }
            },
            {
                value: "Crews Dispatched",
                symbol: {
                    type: "simple-marker",
                    color: "blue",
                    size: 12,
                    outline: { color: "white", width: 0 }
                }
            },
            {
                value: "In Progress",
                symbol: {
                    type: "simple-marker",
                    color: "yellow",
                    size: 12,
                    outline: { color: "white", width: 0 }
                }
            },
            {
                value: "Resolved",
                symbol: {
                    type: "simple-marker",
                    color: "green",
                    size: 12,
                    outline: { color: "white", width: 0 }
                }
            }
        ]
    };

    var reportsLayerBottom = new FeatureLayer({
        url: "https://services8.arcgis.com/tblHe99qQFMcNzpC/arcgis/rest/services/PPGIS_Layers/FeatureServer/13",
        outFields: ["*"],
        renderer: statusRenderer,
        editable: true,
        definitionExpression: buildStatusFilter()
    });

    const departmentNotifiedAction = { title: "Department Notified", id: "department-notified", className: "esri-icon-notice-round" };
    const crewsDispatchedAction = { title: "Crews Dispatched", id: "crews-dispatched", className: "esri-icon-share" };
    const inProcesAction = { title: "In Progress", id: "in-progress", className: "esri-icon-refresh" };
    const resolvedAction = { title: "Resolved", id: "resolved", className: "esri-icon-check-mark" };

    var reportsLayerTop = new FeatureLayer({
        url: "https://services8.arcgis.com/tblHe99qQFMcNzpC/arcgis/rest/services/PPGIS_Layers/FeatureServer/13",
        outFields: ["*"],
        renderer: typeRenderer,
        editable: true,
        popupTemplate: {
            title: `Citizen Report: {status}`,
            content: `
            <b>Comment Type: </b> {commentType}<br>
            <b>Comment: </b> {commentContent}<br>
            <b>Current Status: </b> {status}<br>
            <b>Date Submitted: </b> {submitDate} <br>
            <b>Date Resolved: </b> {resolveDate}<br>
            <b>Contact Information: </b><br>
            <i>Email Address: </i>{contactEmail}<br>
            `,
            actions: [departmentNotifiedAction, crewsDispatchedAction, inProcesAction, resolvedAction]
        },
        definitionExpression: buildStatusFilter()
    });

    map.add(reportsLayerBottom);
    map.add(reportsLayerTop);

    function applyStatus(event) {
        var selectedFeature = view.popup.selectedFeature;
        console.log(selectedFeature);
        
        if (!selectedFeature) return;

        let newStatus = null;
        let updatedFeature = {
            attributes: {
                ...selectedFeature.attributes
            }
        };

        if (event.action.id === "department-notified") {
            newStatus = "Department Notified";
        } else if (event.action.id === "crews-dispatched") {
            newStatus = "Crews Dispatched";
        } else if (event.action.id === "in-progress") {
            newStatus = "In Progress";
        } else if (event.action.id === "resolved") {
            newStatus = "Resolved";
            updatedFeature.attributes.resolveDate = getFormattedDate();
        }

        if (newStatus) {
            updatedFeature.attributes.status = newStatus;
            
            reportsLayerBottom.applyEdits({ 
                updateFeatures: [updatedFeature]
            }).then(function() {
                view.popup.close();
                view.popup.clear();
            });
        }
    }

    reactiveUtils.on(
        () => view.popup,
        "trigger-action",
        (event) => {
            applyStatus(event);
        }
    );

    function buildStatusFilter() {
        return `status IN ('${selectedStatuses.join("','")}') AND commentType IN ('${selectedTypes.join("','")}')`;
    }

    document.querySelectorAll('.statusBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const status = btn.getAttribute('data-status');
            const index = selectedStatuses.indexOf(status);

            if (index === -1) {
                selectedStatuses.push(status);
                btn.style.backgroundColor = 'lightgreen';
            } else {
                selectedStatuses.splice(index, 1);
                btn.style.backgroundColor = '';
            }

            reportsLayerTop.definitionExpression = buildStatusFilter();
            reportsLayerBottom.definitionExpression = buildStatusFilter();
        });
    });

    document.querySelectorAll('.typeBtn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = btn.getAttribute('data-type');
            const index = selectedTypes.indexOf(type);

            if (index === -1) {
                selectedTypes.push(type);
                btn.style.backgroundColor = 'lightgreen';
            } else {
                selectedTypes.splice(index, 1);
                btn.style.backgroundColor = '';
            }

            reportsLayerTop.definitionExpression = buildStatusFilter();
            reportsLayerBottom.definitionExpression = buildStatusFilter();
        });
    });


    document.getElementById('addPointButton').addEventListener('click', function() {
        addMode = true;
        document.getElementById('viewDiv').style.cursor = 'crosshair';
    });

    categoryDropdown.addEventListener('change', () => {
        selectedType = categoryDropdown.value;
        console.log("Category selected: ", selectedType);
        return selectedType;
    });

    adjustLocationButton.addEventListener('click', function() {
        reportModal.style.display = "none";
        isAdjustingLocation = true;
        document.getElementById("viewDiv").style.cursor = "crosshair";
        locationConfirmButton.style.display= "block";
        console.log(locationConfirmButton.style.display);
    });

    locationConfirmButton.addEventListener("click", function() {
        if (currentPoint) {
            isAdjustingLocation = false;
            document.getElementById('viewDiv').style.cursor = "auto";
            locationConfirmButton.style.display = "none";
            reportModal.style.display = "block";
        }
    });

    view.on("click", function(event) {
        if (!addMode && (!isAdjustingLocation)) return;

        var point = view.toMap({ x: event.x, y: event.y});
        view.graphics.removeAll();

        tempGraphic = new Graphic({
            geometry: point,
            symbol: new SimpleMarkerSymbol({
                color: "white",
                size: 8,
                outline: { color: [0, 0, 0], width: 1}
            })
        });

        view.graphics.add(tempGraphic);
        currentPoint = point;

        if (isAdjustingLocation) return;

        reportModal.style.display = "block";
        document.getElementById("viewDiv").style.cursor = "auto";
        addMode = false;
        return tempGraphic;
    });

    document.getElementById('notification-check').addEventListener('change', function(e) {
        const notificationInputs = document.querySelectorAll('.notification-input');
        notificationInputs.forEach(input => {
            input.style.display = e.target.checked ? 'block' : 'none';
        });
    });

    submitComment.addEventListener("click", function() {
        var comment = commentField.value.trim();
        var contactEmail = emailField.value.trim();
        
        var newGraphic = new Graphic({
            geometry: tempGraphic.geometry,
            attributes: {
                commentType: selectedType,
                commentContent: comment,
                status: "New",
                submitDate: getFormattedDate(),
                contactEmail: contactEmail
            }
        });

        reportsLayerTop.applyEdits({
            addFeatures: [newGraphic]
        }).then(function(result) {
            console.log("Comment successfully submitted.");
        }).catch(function(error) {
            console.error("Error submitting pin: ", error);
        });

        reportModal.style.display = 'none';
        commentField.value = '';
        emailField.value = '';
        categoryDropdown.selectedIndex = 0;
        view.graphics.remove(tempGraphic);
    });

    cancelComment.addEventListener('click', function() {
        view.graphics.remove(tempGraphic);
        reportModal.style.display = 'none';
        commentField.value = '';
        categoryDropdown.selectedIndex = 0;
        document.getElementById("viewDiv").style.cursor = "crosshair";
        addMode = false;
        document.getElementById("viewDiv").style.cursor = "auto";
    });

    document.getElementById('downloadReportBtn').addEventListener('click', function() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        if (!startDate || !endDate) {
        alert("Please select both start and end dates.");
        return;
        }

        downloadReport(startDate, endDate);
    });

    function downloadReport(startDate, endDate) {
        const query = reportsLayerBottom.createQuery();
        query.where = `submitDate >= '${startDate}' AND submitDate <= '${endDate}'`;
        query.returnGeometry = false;
        query.outFields = ['submitDate', 'resolveDate', 'commentType', 'commentContent', 'address', 'status'];
        
        reportsLayerBottom.queryFeatures(query).then(function(response) {
            const features = response.features;
            
            const data = features.map(feature => {
                const submitDate = new Date(feature.attributes.submitDate);
                
                let resolveDate = null;
                let processTime = null;
                let resolveDateStr = "";
                
                if (feature.attributes.resolveDate && feature.attributes.status === "Resolved") {
                    resolveDate = new Date(feature.attributes.resolveDate);
                    processTime = (resolveDate - submitDate) / (1000 * 60 * 60 * 24);
                    resolveDateStr = resolveDate.toISOString().split('T')[0];
                }
                
                return {
                    submitDate: submitDate.toISOString().split('T')[0],
                    resolveDate: resolveDateStr,
                    processTime: processTime ? processTime.toFixed(2) : "Not resolved",
                    commentType: feature.attributes.commentType,
                    commentContent: feature.attributes.commentContent,
                    status: feature.attributes.status
                };
            });
            
            exportToCsv('report.csv', data);
        }).catch(function(error) {
            console.error('Error querying features: ', error);
        });
    }

    function exportToCsv(filename, rows) {
        const csvContent = [
            ["Issue Type", "Comment", "Submit Date", "Resolve Date", "Process Time (days)", "Status"],
            ...rows.map(row => [
                row.commentType,
                row.commentContent,
                row.submitDate,
                row.resolveDate || "Pending",
                row.processTime,
                row.status
            ])
        ].map(e => e.join(",")).join("\n");
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    toggleTableBtn.addEventListener('click', function() {
        if (reportsTableContainer.style.display === 'none') {
            reportsTableContainer.style.display = 'block';
            toggleTableBtn.textContent = 'Hide New Reports';
            updateReportsTable();
        } else {
            reportsTableContainer.style.display = 'none';
            toggleTableBtn.textContent = 'Show New Reports';
        }
        });
        
        function updateReportsTable() {
            const query = reportsLayerTop.createQuery();
            query.where = "status = 'New'";
            query.outFields = ['submitDate', 'commentType', 'commentContent'];
            query.orderByFields = ['submitDate DESC'];

            reportsLayerTop.queryFeatures(query).then(function(response) {
                reportsTableBody.innerHTML = '';
                
                response.features.forEach(feature => {
                const row = document.createElement('tr');
                const submitDate = new Date(feature.attributes.submitDate);
                
                const dateTimeStr = submitDate.toLocaleDateString() + ' ' + 
                                    submitDate.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                    });
                
                row.innerHTML = `
                    <td style="padding: 8px; border: 1px solid #ddd;">${dateTimeStr}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${feature.attributes.commentType}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${feature.attributes.commentContent}</td>
                `;
                
                reportsTableBody.appendChild(row);
                });
            });
        }

            reportsLayerTop.on("edits", function(event) {
            if (reportsTableContainer.style.display !== 'none') {
                updateReportsTable();
            }

        view.ui.remove("zoom");
    });
});