$(document).ready(function() {

  var dropZone = $('#dropzone');

  dropZone.on('dragenter', function (e)
  {
      // e.stopPropagation();
      e.preventDefault();
      $(this).css('border', '3px solid #333');
      // if (event.target.className == "dropzone" ) {
      //     event.target.style.background = "purple";
      // }
  });
  dropZone.on('dragleave', function (e)
  {
      // e.stopPropagation();
      e.preventDefault();
      $(this).css('border', '0');
  });
  // dragover fires continuously while the user drags an object over a valid drop target
  dropZone.on('dragover', function (e)
  {
       // e.stopPropagation();
       e.preventDefault();
       // $(this).css('border', '3px solid #333');
  });
  dropZone.on('drop', function (e)
  {
    e.stopPropagation();
    e.preventDefault();
    $(this).css('border', '0');
    $('#output').remove();
    $('<div class="progress"><div></div></div>').insertAfter('.container');
    var files = e.originalEvent.dataTransfer.files;
    if (files.length != 1) {
     errMsg = "exactly one pcap file required";
     handleError(errMsg)
    } else {
      var fd = new FormData();
      fd.append("file", files[0]);
      $.ajax({
        url: "/ajax",
        type: "POST",
        data: fd,
        processData: false,  // tell jQuery not to process the data
        contentType: false   // tell jQuery not to set contentType
      }).done(function(data) {
        renderVisualization(data);
      }).fail(function(data) {
        handleError(data);
      }).always(function(data) {
        $('.progress').remove();
      });
    }
  }); /* on drop */

  function renderVisualization(raw_data) {
    console.log('rendering visualization...')
    // console.log(raw_data)
    data = JSON.parse(raw_data)
    convDict = data[0];
    dataPoints = data[1];

    $('<div id="output"></div>').insertAfter('.container');

    var margin = {top: 50, right: 50, bottom: 80, left: 80};
    var width = 960 - margin.left - margin.right;
    // height of visualization is based on number of conversations
    var height = 100 + 20 * Object.getOwnPropertyNames(convDict).length - margin.top - margin.bottom;

    var x = d3.time.scale.utc().range([0, width]);
    var y = d3.scale.linear()
        .range([height, 0]);

    //   if (xRange <= 7) { // 7 minutes
    var tickStrFormat = d3.time.format.utc("%-H:%M:%S");
    // } else if (xRange <= 1440) { // 1 day
    //   var tickStrFormat = "%-H:%M";
    // } else if (xRange <= 10080) { // 1 week
    //   var tickStrFormat = "%-m/%-d@%-H:00";
    // } else {
    //   var tickStrFormat = "%-m/%-d";
    // }

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        // .ticks(d3.time.hour.utc, 1)
        .tickFormat(tickStrFormat)
        .tickSize(8)
        .outerTickSize(0)
        .tickPadding(4);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var svg = d3.select("#output").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      x.domain(d3.extent(dataPoints, function(d) { return moment.utc(d[0]).toDate(); }));
      y.domain(d3.extent(dataPoints, function(d) { return Number(d[1]); }));

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0,-7)")
          .call(xAxis)
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-30) translate(50,-32)")
        .append("text")
          .attr("class", "label")
          .attr("x", width / 2)
          .attr("y", -20)
          .style("text-anchor", "end")
          .text("Time (UTC)");

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + (height + 10) + ")")
          .call(xAxis)
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-30) translate(25,15)");
        // .append("text")
        //   .attr("class", "label")
        //   .attr("x", width / 2)
        //   .attr("y", 40)
        //   .style("text-anchor", "end")
        //   .text("Time (UTC)");

        var ticks = svg.selectAll(".x.axis:first-child .tick line")
          .attr("transform", "translate(0,-8)");

      // svg.append("g")
      //     .attr("class", "y axis")
      //     .call(yAxis)
      //   .append("text")
      //     .attr("class", "label")
      //     .attr("transform", "rotate(-90)")
      //     .attr("y", 6)
      //     .attr("dy", ".71em")
      //     .style("text-anchor", "end")
      //     .text("")

      // svg.append("g")
      //     .attr("class", "y axis")
      //     .call(yAxis)
      //     .attr("transform", "translate(" + width + " ,0)")
      //   .append("text")
      //     .attr("class", "label")
      //     .attr("transform", "rotate(-90)")
      //     .attr("y", 6)
      //     .attr("dy", ".71em")
      //     .style("text-anchor", "end")
      //     .text("")

      svg.append("g")
          .attr("class", "dotGroup")
          .selectAll(".dot")
          .data(dataPoints)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 2)
          .attr("cx", function(d) { return x(moment.utc(d[0]).toDate()); })
          .attr("cy", function(d) { return y(Number(d[1])); })
          .style("fill", function(d) { console.log(d[1]); return d3.rgb(protoColors[convDict[d[1]].proto]); });



      lineGroup = svg.append("g")
          .attr("class", "lineGroup");
      // lineGroup.append("path")
      //     .datum(data)
      //     .attr("class", "line")
      //     .attr("d", line)
      //     .style("stroke", function(d) { return d3.rgb(d[1]); });


      line = d3.svg.line().interpolate("linear")
             .x(function(d, i) {
               return x(moment.utc(d[0]).toDate());
             })
             .y(function(d, i) {
               return y(Number(d[1]));
             });

      console.log(convDict);

      protocols = []
      for (var convId in convDict) {
        var lineData = [convDict[convId].first_point, convDict[convId].last_point];
        lineGroup.append("path")
          .datum(lineData)
          .attr("class", "line")
          .attr("d", line)
          .style("stroke", function(d) { return d3.rgb(protoColors[convDict[convId].proto]); });
        if (protocols.indexOf(convDict[convId].proto) < 0) {
          protocols.push(convDict[convId].proto)
        }
      }

      legendGroup = svg.append("g")
          .attr("class", "legendGroup");

      var legend = legendGroup.selectAll(".legend")
          .data(protocols)
        .enter().append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(0," + (i * -20) + ")"; });

      legend.append("rect")
          .attr("x", width - 18)
          .attr("width", 18)
          .attr("height", 18)
          .style("fill", function(d) { return d3.rgb(protoColors[d]) });

      legend.append("text")
          .attr("x", width + 3)
          .attr("y", 9)
          .attr("dy", ".35em")
          .style("text-anchor", "start")
          .text(function(d) { return d; });

      legendGroup.attr("transform", "translate(" + (-1 * width - 30) + "," + (height - 10) + ")");
  } /* renderVisualization */

  function handleError(data) {
    console.log('handling error...')
    $('<div id="output"></div>').insertAfter('.container');
    $('#output').text(data);
  } /* handleError */

}); /* document.ready */