// Async function to create a d3 heatmap for a given independent variable and a set of genes

// indepVarType is the type of independent variable for the plot (probably either 'cohort' or 'mutatedGene')
    // NOTE: The function is currently only set to handle indepVarType='cohort'
// indepVar is the independent variable (ex1: 'PAAD', ex2: 'TP53')
// dataInput is the array os JSONs of gene expression data to visualize
// svgObject is the object on the html page to build the plot

createHeatmap = async function(indepVarType, indepVars, dataInput, svgObject) {

    // Set the columns to be the set of TCGA participant barcodes 'myGroups' and the rows to be the set of expression z-score's called 'myVars'
    var myGroups = d3.map(dataInput, function(d){return d.tcga_participant_barcode;}).keys();
    var myVars = d3.map(dataInput, function(d){return d.gene;}).keys();

    // Set up the figure dimensions:
        var margin = {top: 80, right: 30, bottom: 30, left: 60},
            width = 1250 - margin.left - margin.right,
            height = 500 - margin.top - margin.bottom;

    // Define minZ and maxZ for the color interpolator (this may become a user defined value later on):
    var minZ = -2
    var maxZ = 2

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////// Build the Axis and Color Scales Below ///////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Build x scale and axis for heatmap::
    var x = d3.scaleBand()
        .range([ 0, width-50 ])
        .domain(myGroups)
        .padding(0.0);

    // Append x axis for the heatmap:
    svgObject.append("g")
        .style("font-size", 15)
        .attr("transform", "translate(0," + height + ")")
        .select(".domain").remove()

    // Build y scale and axis for heatmap:
    var y = d3.scaleBand()
        .range([ height, 0 ])
        .domain(myVars)
        .padding(0.0);

    // Append the y axis for the heatmap:
    svgObject.append("g")
        .style("font-size", 9.5)
        .call(d3.axisLeft(y).tickSize(0))
        .select(".domain").remove()

    // Position scale for the legend:
    var yScale = d3.scaleLinear().domain([minZ, maxZ]).range([height,0]);
    var legendAxis = d3.axisRight()
        .scale(yScale)
        .tickSize(5)
        .ticks(5)
    
    // Append the axis for the legend:
    svgObject.append("g")
        .style("font-size",10)
        .attr("transform", "translate("+ width + ',' + 0 + ")")
        .call(legendAxis)

    // Create arr array to build legend:
    var arr = [];
    var step = (maxZ - minZ) / (1000 - 1);
    for (var i = 0; i < 1000; i++) {
      arr.push(minZ + (step * i));
    };

    // Build color scale
    interpolateRdBkGn = d3.interpolateRgbBasis(["blue","white","red"])
    var myColor = d3.scaleSequential()
        .interpolator(interpolateRdBkGn)                          // A different d3 interpolator can be used here for a different color gradient
        .domain([minZ, maxZ])                                          // This domain scale will change the coloring of the heatmap.
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////// Build the Axis and Color Scales Above ///////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    
    
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////// Build the Mouseover Tool Below ///////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
    // Build the scroll over tool:
    // create a tooltip
    var tooltip = d3.select("#heatmapRef")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
        tooltip
        .style("opacity", 1)
        d3.select(this)
        .style("stroke", "black")
        .style("opacity", 1)
    }
    const spacing = "\xa0\xa0\xa0\xa0|\xa0\xa0\xa0\xa0";
    var mousemove = function(d) {
        tooltip
        // Choose what the tooltip will display (this can be customized to display other data):
        .html("\xa0\xa0"+ 
              "Expression Level: " + d.expression_log2.toFixed(5) + spacing + 
              "Expression Z Score: " + d["z-score"].toFixed(5) +spacing +
              "Cohort: " +d.cohort)
        .style("left", (d3.mouse(this)[0]+70) + "px")
        .style("top", (d3.mouse(this)[1]) + "px")
    }
    var mouseleave = function(d) {
        tooltip
        .style("opacity", 0)
        d3.select(this)
        .style("stroke", "none")
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////// Build the Mouseover Tool Above ///////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////// Build the Heatmap with Legend Below ////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Build the heatmap:
    svgObject.selectAll()
        .data(dataInput, function(d) {return d.tcga_participant_barcode+':'+d.gene;})
        .enter()
        .append("rect")
        .attr("x", function(d) {return x(d.tcga_participant_barcode) })
        .attr("y", function(d) {return y(d.gene) })
        .attr("width", x.bandwidth() )
        .attr("height", y.bandwidth() )
        .style("fill", function(d) {return myColor(d["z-score"])} )
        .style("stroke-width", 4)
        .style("stroke", "none")
        .style("opacity", 1)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        
    // Build the Legend:   
    svgObject.selectAll()
        .data(arr)
        .enter()
        .append('rect')
        .attr('x', 1130)
        .attr('y', function(r) { return yScale(r) })
        .attr("width", 25)
        .attr("height", 1 + (height/arr.length) )
        .style("fill", function(r) {return myColor(r)} )
        .style("stroke-width", 4)
        .style("stroke", "none")
        .style("opacity", 1)

    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////// Build the Heatmap with Legend Above ////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////// Set the Heatmap Title Below ////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Set the title of the plot depending on the type of independent variable being plotted:
    if (indepVarType == 'cohort') {

        // Add title to graph
        svgObject.append("text")
            .attr("x", 0)
            .attr("y", -25)
            .attr("text-anchor", "left")
            .style("font-size", "26px")
            .text("Gene Expression Heatmap for "+indepVars.join(' and '))

    } else if (indepVarType == 'mutatedGene') {

        // Add title to graph
        svgObject.append("text")
        .attr("x", 0)
        .attr("y", -25)
        .attr("text-anchor", "left")
        .style("font-size", "26px")
        .text("Gene Expression Heatmap for Patients with a mutated "+indepVars+" Gene")
    };



    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////// End of Program ///////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
};