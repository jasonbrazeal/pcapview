$(document).ready(function() {

  var dropZone = $('#dropzone');

  dropZone.on('dragenter', function (e)
  {
      // e.stopPropagation();
      e.preventDefault();
      $("html").css('border', '3px solid #333');
      $("#upload").show();
      // if (event.target.className == "dropzone" ) {
      //     event.target.style.background = "purple";
      // }
  });
  dropZone.on('dragleave', function (e)
  {
      // e.stopPropagation();
      e.preventDefault();
      $("html").css('border', '0');
      $("#upload").hide();
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
    $("html").css('border', '0');
    $("#upload").hide();
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
        $('p.lead').text('drop another pcap file anywhere above');
      });
    }
  }); /* on drop */

  function renderVisualization(raw_data) {
    console.log('rendering visualization...')
    // console.log(raw_data)
    data = JSON.parse(raw_data)
    convDict = data[0];
    dataPoints = data[1];

    // var tipPoint = d3.tip().attr('class', 'd3-tip').html(function(d) { return d; });
    // tipPoint.direction('e');
    // tipPoint.offset(function() {
    //   return [10, 0]
    // });
    // var tipLine = d3.tip().attr('class', 'd3-tip').html(function(d) { return d; });
    // tipLine.direction('e');

    $('<div id="output"></div>').insertAfter('.container');

    var margin = {top: 60, right: 50, bottom: 100, left: 80};
    var width = 960 - margin.left - margin.right;
    // height of visualization is based on number of conversations
    var height = 145 + 15 * Object.getOwnPropertyNames(convDict).length - margin.top - margin.bottom;

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
        // .call(tipPoint)
        // .call(tipLine)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      x.domain(d3.extent(dataPoints, function(d) { return moment.utc(d[0]).toDate(); }));
      y.domain(d3.extent(dataPoints, function(d) { return Number(d[1]); }));

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0,-15)")
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
          .attr("transform", "translate(0," + (height + 15) + ")")
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

      // packet scatterplot
      svg.append("g")
          .attr("class", "dotGroup")
          .selectAll(".dot")
          .data(dataPoints)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 3)
          .attr("cx", function(d) { return x(moment.utc(d[0]).toDate()); })
          .attr("cy", function(d) { return y(Number(d[1])); })
          .style("fill", function(d) { return d3.rgb(protoColors[convDict[d[1]].proto]); })
          // .on('mouseover', tipPoint.show)
          // .on('mouseout', tipPoint.hide);

      // conversation lines and hover-over rectangles
      var lineGroup = svg.append("g")
          .attr("class", "lineGroup");
      // lineGroup.append("path")
      //     .datum(data)
      //     .attr("class", "line")
      //     .attr("d", line)
      //     .style("stroke", function(d) { return d3.rgb(d[1]); });

      var line = d3.svg.line().interpolate("linear")
             .x(function(d, i) {
               return x(moment.utc(d[0]).toDate());
             })
             .y(function(d, i) {
               return y(Number(d[1]));
             });

      var rectGroup = svg.append("g")
          .attr("class", "rectGroup");


      var protocols = [];
      var convData = [];
      for (var convId in convDict) {
        var lineData = [convDict[convId].first_point, convDict[convId].last_point];
        convData.push(lineData);
        lineGroup.append("path")
          .datum(lineData)
          .attr("class", "line")
          .attr("d", line)
          .style("stroke", function(d) { return d3.rgb(protoColors[convDict[convId].proto]); })
          .style("stroke-width", "3px")
          // .on('mouseover', tipLine.show)
          // .on('mouseout', tipLine.hide);
        if (protocols.indexOf(convDict[convId].proto) < 0) {
          protocols.push(convDict[convId].proto)
        }
      }

      convData.forEach(function(convo, i, arr) {
        rectGroup.append("rect")
          .datum(convo)
          .attr("class", "conv-hover")
          .attr("x", function(d) {
                        console.log(d)
                        var coord_x = x(moment.utc(d[0][0]).subtract("1", "second").toDate());
                        return coord_x; })
          .attr("y", function(d) {
                        var revConvId = (Object.getOwnPropertyNames(convDict).length + 1 - Number(d[0][1])).toString();
                        return 15 * Number(convDict[revConvId].first_point[1]) - 20; })
          .attr("width", function(d) {
                        var coord_x_first = x(moment.utc(d[0][0]).subtract("1", "second").toDate());
                        var coord_x_last = x(moment.utc(d[1][0]).add("1", "second").toDate());
                        return coord_x_last - coord_x_first })
          .attr("height", 10)
          .style("stroke", function(d) { return d3.rgb(protoColors[convDict[d[0][1]].proto]); })
          .style("fill", "transparent");
      });


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

      legendGroup.attr("transform", "translate(" + (-1 * width - 50) + "," + (height - 10) + ")");

      // prevent dragging and dropping on the visualization
      $("#output, #output *").on('drop', function(e) {
        e.stopPropagation();
        e.preventDefault();
        return false;
      });

      $("#output, #output *").on('dragover', function(e) {
        e.stopPropagation();
        e.preventDefault();
        return false;
      });

      $(".conv-hover").hover(function(e) {
        $(this).css("fill", $(this).css("stroke"));
      }, function(e) {
        $(this).css("fill", "transparent");
      });

  } /* renderVisualization */

  function handleError(data) {
    console.log('handling error...')
    $('<div id="output"></div>').insertAfter('.container');
    $('#output').text(data);
  } /* handleError */

}); /* document.ready */