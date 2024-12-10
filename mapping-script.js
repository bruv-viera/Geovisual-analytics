/* VISUALIZATION SETUP */

// Set the size of the map container in pixel values
var width = 900;
var height = 850;

var svg = d3.select("#mapContainer") 
  .append("svg") 
  .attr("width", width)  
  .attr("height", height)  
  .attr("preserveAspectRatio", "xMidYMid") 
  .attr("viewBox", [0, 0, width, height]) 
  .attr("title", "Trees in Vienna");

var g = svg.append("g"); // Add a group element to the SVG element

// Define the projection and path generator
var projection = d3.geoAlbers()
   .center([16.3738, 48.2082])
   .rotate([4.5, 0]) // Adjust for Austria's position
   .parallels([45, 55]) // Standard parallels for the projection
   .scale(100000) // Adjust to zoom in appropriately
   .translate([width / 2, height / 2]); // Center on the screen;
var path = d3.geoPath().projection(projection);

// Load the GeoJSON data for streets
d3.json("https://raw.githubusercontent.com/RassCrom/geovisual_vienna_trees/refs/heads/main/streets-oldtown.geojson.geojson")
  .then(function(streets) {
    projection.fitSize([width, height], streets); 
    d3.select("svg");
    g.selectAll("path")
      .data(streets.features) 
      .enter() 
      .append("path") 
      .attr("d", path) 
      .attr("fill", "none") 
      .attr("stroke", "#708090")
      .attr("stroke-width", 0.25) 
      .attr("stroke-opacity", 0.9) 
  })
  .catch(function(error) {
    alert("There are some problems with the street dataset :(");
  });


d3.json("https://raw.githubusercontent.com/RassCrom/geovisual_vienna_trees/main/streets.geojson")
  .then(function(trees) {
    // Create a color scale to map trunk size to color
    let colorScale = d3.scaleOrdinal()
      .domain(["Tilia cordata 'Greenspire' (Stadtlinde)", "Celtis australis (Südlicher Zürgelbaum)",
        "Acer pseudoplatanus 'Atropurpureum' (Purpurner Bergahorn)"]) // Define tree types
      .range(["#deebf7", "#9ecae1", "#3182bd"]); // Corresponding colors for each tree type
    

    let smallestTree = d3.min(trees.features, function(d) { return d.properties.TrunkSize; });
    let biggestTree = d3.max(trees.features, function(d) { return d.properties.TrunkSize; });
    
    let radiusSize = d3.scaleSqrt()
      .domain([smallestTree, biggestTree])  // Set domain based on the smallest and largest trunk sizes
      .range([0, 15]);  // Map trunk size to a radius range

    let treeColor = d3.scaleLinear()
      .domain([0, 1800, 1900, 2021]) // Define stops for planting years
      .range(["#ffffcc", "#c2e699", "#78c679", "#238443"]); // Map years to colors

    var t = textures.lines()
      .thicker();
    svg.call(t);

    g.selectAll("circle") // Create circle elements for each tree
      .data(trees.features
        .filter(function(d) {
          return (d.properties.PlantingYear > 1920 && d.properties.PlantingYear < 2020) ||
                 d.properties.TreeType == "Sophora japonica (Schnurbaum)" ||
                 d.properties.TreeType == "Tilia cordata 'Greenspire' (Stadtlinde)";
        })
      )
      .enter()
      .append("circle")
      .attr('cx', function(d) {
        return projection(d.geometry.coordinates)[0]; // X coordinate from projection
      })
      .attr('cy', function(d) {
        return projection(d.geometry.coordinates)[1]; // Y coordinate from projection
      })
      .attr("r", function(d) {
        return radiusSize(d.properties.TrunkSize); // Use the square root scale for radius size
      }) 


      .on("mouseover", function(event, d) {
        div.transition()
          .duration(200)
          .style("opacity", 0.9);

        // Display the data-driven text in the tooltip
        div.html(  
            "<table>" +
              "<tr>"+
                "<th>Attribute</th>"+
                "<th>Individual " + d.properties.TreeID +  "</th>"+
             "</tr>"+
             "<tr>"+
               "<td>Species: </td>"+
               "<td>" + d.properties.TreeType + "</td>" +
             "</tr>"+
               "<td>Planting Year: </td>" +
               "<td>"+ d.properties.PlantingYear + "</td>"+
            "</table>"
        )
          .style("position", "absolute") // Set from where the positional coordinates are counted
          .style("left", (event.pageX + 20) + "px") // Set horizontal position of the tooltip
          .style("top", (event.pageY + 20) + "px") // Vertical position of the tooltip

        d3.select(this) // Select the tree being hovered over
          .raise() // Display the selected tree on top
          .transition() // Set the smooth transition – animation from current tree state to hovered state
          .duration(500) // Set time for transition
          .attr("fill", "red") // Change tree color to blue
          .attr("stroke-width", 2) // Change the thickness of the circle stroke
          .attr("cursor", "pointer"); // Change cursor to pointer
      })
      
      .on("mouseout", function(event, d) {
        div.transition()
          .duration(10) 
          .style("opacity", 0);


        d3.select(this)
          .lower() 
          .transition() 
          .duration(500) 
          .attr("stroke-width", 1) 
          .attr("fill", "yellowGreen");    
      })
      
        .on("click", function(event, d) {         
        var elem = d3.select(this);        
        var currentRadius = parseFloat(elem.attr("r"));
        elem.transition()           
          .duration(150)           
           .attr("r", currentRadius * 1.5)  
           .transition()  
           .duration(150)  
           .attr("r", currentRadius);   
        })      

         .on("dblclick", function(event, d) {      
        var elem = d3.select(this); // Select the clicked element (circle or tree)
        elem.transition()           
            .duration(150)  // Duration of shrinking           
            .style("fill","cyan")  // Shrink radius by 0.5x (half size)
            .transition()  // After shrinking, return to the original size
            .delay(150)
            .duration(150)  // Duration of returning to original size
            .style("fill","")
        })

      .attr("stroke", function(d) {
        let trunkSize = d.properties.TrunkSize;
        if (trunkSize <= 50) {
          return "#ffffcc";  // Light green for small trees
        } else if (trunkSize <= 150) {
          return "#c2e699";  // "medium greenfor medium-small trees
        } else if (trunkSize <= 300) {
          return "#78c679";  // dark green for medium-large trees
        } else {
          return "#238443";  // darker green  for large trees
        }
      })

      .attr("stroke-width", function(d) {
        let trunkSize = d.properties.TrunkSize;
        if (trunkSize <= 50) {
          return 1;  // Thin stroke for small trees
        } else if (trunkSize <= 150) {
          return 2;  // Medium stroke for medium-small trees
        } else if (trunkSize <= 300) {
          return 3;  // Thicker stroke for medium-large trees
        } else {
          return 4;  // Thick stroke for large trees
        }
      })
      .attr("stroke-opacity", 0.5)
      .attr("fill", "none")
      .attr("fill-opacity", 0.5);
      })
   .catch(function(error) {
    alert("There was an error loading the tree data.");
  });   

var zoom = d3.zoom()
  .scaleExtent([1, 8]) // Set zoom scale extent
  .on('zoom', function(event) {
    g.selectAll("path").attr('transform', event.transform); // Scale streets
    g.selectAll("circle").attr('transform', event.transform); // Scale trees
  });
svg.call(zoom); 


function zoomIn() {
  d3.select('svg')
    .transition(1)
    .call(zoom.scaleBy, 2);
}

function zoomOut() {
  d3.select('svg')
    .transition(1)
    .call(zoom.scaleBy, 0.5); 
}    

// Reset functionality to reset the zoom and pan to original view
document.getElementById("resetButton").addEventListener("click", function() {
  svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity); // Reset zoom and pan
});

var div = d3.select("body") // Select the body of the website
  .append("div") // Add the container for the tooltip content
  .attr("class", "tooltip") // Add class name to the container
  .style("opacity", 0); // Set initial transparency of tooltip to 0 – invisible












var legendWidth = 250;
var legendHeight = 520; 

var legend = d3.select("#legend") 
  .style("position", "absolute")
  .style("top", "10px")  
  .style("left", "20px")
  .append("svg") 
  .attr("width", legendWidth)
  .attr("height", legendHeight);

  legend.append("line")
  .attr("x1", 10)        // Starting x position of the line
  .attr("y1", 450)        // Starting y position of the line (adjust based on existing content)
  .attr("x2", 100)       // Ending x position of the line
  .attr("y2", 450)        // Ending y position of the line (same as y1 for horizontal line)
  .attr("stroke", "#333") // Line color (dark gray for streets)
  .attr("stroke-width", 4) // Line thickness
  .attr("stroke-linecap", "round"); // Rounded line ends

legend.append("text")
  .attr("x", 110)        // Position the text next to the line
  .attr("y", 450)         // Align text with the line
  .attr("font-size", "14px")  // Font size for the label
  .attr("font-family", "Arial, sans-serif")  // Font for the label
  .attr("fill", "black")  // Text color
  .text("Street"); 


let yearLabels = [
  "Pre-1800", 
  "1800 - 1900", 
  "1900 - 2021",
  "Post-2021"  
];

let legendYearColor = d3.scaleLinear()
  .domain([0, 1800, 1900, 2021])  // Keep the original domain
  .range(["#ffffcc", "#c2e699", "#78c679", "#238443"]); // Existing color range

var circleRadius = 8; // Set the radius for the empty circles
var symbolGap = 10; // Gap between symbols
var symbolLabelGap = 30; // Gap between circle and label

let trunkSizeLabels = [
  "Small (≤ 50 cm)",
  "Medium (51 - 150 cm)",
  "Large (151 - 300 cm)",
  "Very Large (> 300 cm)"
];

let strokeWidth = function(d) {
  if (d === "Small (≤ 50 cm)") {
    return 2;  // Thin circle for small trees
  } else if (d === "Medium (51 - 150 cm)") {
    return 4;  // Medium circle for medium-small trees
  } else if (d === "Large (151 - 300 cm)") {
    return 6;  // Thick circle for medium-large trees
  } else {
    return 8;  // Very thick circle for large trees
  }
};

var yearLabelStartY = 50;  
var trunkSizeLabelStartY = 250;  


legend.selectAll("legend-symbols")
  .data(yearLabels)
  .enter()
  .append("circle")
  .attr("cx", 0) 
  .attr("cy", function(d, i) {
    return yearLabelStartY + i * (circleRadius * 2 + symbolGap); // Vertical positioning of circles
  })
  .attr("r", circleRadius) // Set the radius of the circle
  .attr("stroke", function(d, i) {
    // Assign stroke color based on the planting year category
    if (i === 0) {
      return legendYearColor(0); // Color for Pre-1800
    } else if (i === 1) {
      return legendYearColor(1800); // Color for 1800 - 1900
    } else if (i === 2) {
      return legendYearColor(1900); // Color for 1900 - 2021
    } else {
      return legendYearColor(2021); // Color for Post-2021
    }
  })
  .attr("fill", function(d, i) {
    // Assign fill color based on the planting year category
    if (i === 0) {
      return legendYearColor(0); // Color for Pre-1800
    } else if (i === 1) {
      return legendYearColor(1800); // Color for 1800 - 1900
    } else if (i === 2) {
      return legendYearColor(1900); // Color for 1900 - 2021
    } else {
      return legendYearColor(2021); // Color for Post-2021
    }
  })
  .attr("stroke-width", 2); // Assign stroke width for all circles

// Append text labels for the planting years in the legend
legend.selectAll("legend-labels")
  .data(yearLabels)
  .enter()
  .append("text")
  .attr("x", symbolLabelGap + circleRadius * 2) // Position the labels next to the circles
  .attr("y", function(d, i) {
    return yearLabelStartY + i * (circleRadius * 2 + symbolGap) + (circleRadius); // Align the label vertically with the circle
  })
  .style("fill", "black")
  .text(function(d) {
    return d; // Display the planting year range as the label
  })
  .attr("font-size", "14px")
  .attr("font-style", "italic")
  .attr("text-anchor", "left")
  .style("alignment-baseline", "middle");

legend.append("text")
  .attr("x", 0)
  .attr("y", yearLabelStartY - 20)  // Add space above year labels
  .attr("font-size", "16px")
  .attr("font-weight", "bold")
  .text("Plant Year");

// Append circles for trunk size categories in the legend
legend.selectAll("trunk-size-symbols")
  .data(trunkSizeLabels)
  .enter()
  .append("circle")
  .attr("cx", 0) // Set the x position of the circle
  .attr("cy", function(d, i) {
    return trunkSizeLabelStartY + i * (circleRadius * 2 + symbolGap); // Position below the year legend
  })
  .attr("r", circleRadius) 
  .attr("stroke", "#999") 
  .attr("fill", "#fff") 
  .attr("stroke-width", function(d) {
    return strokeWidth(d);  // Set stroke width based on trunk size category
  });

// Append text labels for trunk sizes in the legend
legend.selectAll("trunk-size-labels")
  .data(trunkSizeLabels)
  .enter()
  .append("text")
  .attr("x", symbolLabelGap + circleRadius * 2) // Position the labels next to the circles
  .attr("y", function(d, i) {
    return trunkSizeLabelStartY + i * (circleRadius * 2 + symbolGap) + (circleRadius); // Align the label vertically with the circle
  })
  .style("fill", "black")
  .text(function(d) {
    return d; // Display the trunk size category as the label
  })
  .attr("font-size", "14px")
  .attr("font-style", "italic")
  .attr("text-anchor", "left")
  .style("alignment-baseline", "middle");

legend.append("text")
  .attr("x", 0)
  .attr("y", trunkSizeLabelStartY - 20)  // Add space above trunk size labels
  .attr("font-size", "16px")
  .attr("font-weight", "bold")
  .text("Trunk Size");

