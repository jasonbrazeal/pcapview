$(document).ready(function() {

  /* set up drop zone for drag and drop uploads */
  var dropZone = $("#dropzone");
  dropZone.on("dragenter", function (e) {
      e.preventDefault();
      $(".d3-tip").remove();
      if ($(".output").length) {
        $(".container").css("background", "rgba(238, 238, 238, .4)");
        $('<div id="upload-icon-top"><span class="glyphicon glyphicon-floppy-open" aria-hidden="true"></span></div>').insertAfter("h1");
      } else if ($(".progress").length) {
        return False;
      }
      else {
        $("#dropzone").css("background", "rgba(238, 238, 238, .4)");
        $('<div id="upload-icon"><span class="glyphicon glyphicon-floppy-open" aria-hidden="true"></span></div>').insertAfter("p.lead");
      }
  });
  dropZone.on("dragleave", function (e) {
      e.preventDefault();
      $("#dropzone").css("background", "transparent");
      $(".container").css("background", "transparent");
      $("#upload-icon").remove();
      $("#upload-icon-top").remove();
      $(".d3-tip").remove();
  });
  dropZone.on("dragover", function (e) {
       e.preventDefault();
  });
  dropZone.on("drop", function (e) {
    e.stopPropagation();
    e.preventDefault();
    if ($(".progress").length) {
        return False;
      }
    $("#dropzone").css("background", "transparent");
    $(".container").css("background", "transparent");
    $("#upload-icon").remove();
    $("#upload-icon-top").remove();
    $(".d3-tip").remove();
    $(".output").remove();
    $(".ip-button").remove();
    $("p.lead").text("");
    $('<div class="progress"><div></div></div>').insertAfter(".container");
    var files = e.originalEvent.dataTransfer.files;
    if (files.length != 1) {
     handleError("exactly one pcap file required");
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
        $(".progress").remove();
        $("p.lead").text("drop another pcap file anywhere above");
        renderVisualization(data);
      }).fail(function(data) {
        handleError("error processing pcap file");
      });
    }
  }); /* on drop */

  function handleError(data) {
    /* display message to user */
    $(".progress").remove();
    $("p.lead").text("drop another pcap file anywhere above");
    $('<div class="output"><p class="alert alert-danger lead">' + data + '</p></div>').insertAfter(".container");
    $(".output").height($(window).height() - $(".container").height() - 10);
    /* prevent dragging and dropping on the error message */
    $(".output, .output *").on("drop", function(e) {
      e.stopPropagation();
      e.preventDefault();
      return false;
    });
    $(".output, .output *").on("dragover", function(e) {
      e.stopPropagation();
      e.preventDefault();
      return false;
    });
  } /* handleError */

  function renderVisualization(raw_data) {
    /* prepare data */
    data = JSON.parse(raw_data)
    convDict = data[0];
    dataPoints = data[1];

    /* initialize d3-tip */
    var tipWest = d3.tip()
        .attr("class", "d3-tip")
        .html(function(d) { return "src: " + convDict[d[0][1]].src_ip; });
    tipWest.direction("w");
    var tipEast = d3.tip()
        .attr("class", "d3-tip")
        .html(function(d) { return "dst: " + convDict[d[0][1]].dst_ip; });
    tipEast.direction("e");

    /* insert div to hold visualization */
    $('<div class="output"></div>').insertAfter(".container");
    $(".output").height($(window).height() - $(".container").height() - 65);

    /* initialize visualization's margins, scales, and axes */
    var margin = {top: 80, right: 150, bottom: 100, left: 90};
    var width = 900 - margin.left - margin.right;
    // height of visualization is based on number of conversations
    var height = 165 + 15 * Object.getOwnPropertyNames(convDict).length - margin.top - margin.bottom;

    var x = d3.time.scale.utc()
        .range([0, width])
        .domain(d3.extent(dataPoints, function(d) { return moment.utc(d[0]).toDate(); }));
    var y = d3.scale.linear()
        .range([height, 0])
        .domain(d3.extent(dataPoints, function(d) { return Number(d[1]); }));

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(d3.time.format.utc("%-H:%M:%S"))
        .tickSize(8)
        .outerTickSize(0)
        .tickPadding(4);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    /* draw svg element */
    var svg = d3.select(".output").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .call(tipWest)
        .call(tipEast)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      /* draw axes */
      var topAxis = svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0,-15)")
          .call(xAxis);

      topAxis.append("text")
          .attr("class", "label")
          .attr("x", width / 2)
          .attr("y", -52)
          .style("text-anchor", "middle")
          .style("font-size", ".75em")
          .text("Time (UTC)");

      topAxis.selectAll(".tick text")
          .style("text-anchor", "end")
          .style("font-size", ".75em")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-30) translate(50,-32)");

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + (height + 15) + ")")
          .call(xAxis)
          .selectAll(".tick text")
          .style("text-anchor", "end")
          .style("font-size", ".75em")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-30) translate(25,15)");

      var ticks = svg.selectAll(".x.axis:first-child .tick line")
        .attr("transform", "translate(0,-8)");

      /* draw packet scatterplot */
      svg.append("g")
          .attr("class", "dotGroup")
          .selectAll(".dot")
          .data(dataPoints)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 2)
          .attr("cx", function(d) { return x(moment.utc(d[0]).toDate()); })
          .attr("cy", function(d) { return y(Number(d[1])); })
          .style("fill", function(d) { return d3.rgb(protoColors[convDict[d[1]].proto]); });

      /* draw conversation lines */
      var lineGroup = svg.append("g")
          .attr("class", "lineGroup");

      var line = d3.svg.line().interpolate("linear")
             .x(function(d, i) {
               return x(moment.utc(d[0]).toDate());
             })
             .y(function(d, i) {
               return y(Number(d[1]));
             });

      // while we're looping though the conversation data drawing the lines...
      // get a list of protocols in the data for the legend
      var protocols = [];
      // convert conversation data into a list for the hover-over rectangles
      var convData = [];
      for (var convId in convDict) {
        var lineData = [convDict[convId].first_point, convDict[convId].last_point];
        convData.push(lineData);
        lineGroup.append("path")
          .datum(lineData)
          .attr("class", "line")
          .attr("d", line)
          .style("stroke", function(d) { return d3.rgb(protoColors[convDict[convId].proto]); })
          .style("stroke-width", "1px");
        if (protocols.indexOf(convDict[convId].proto) < 0) {
          protocols.push(convDict[convId].proto)
        }
      }

      /* draw hover-over rectangles for tooltips */
      var rectGroup = svg.append("g")
          .attr("class", "rectGroup");

      function showTips(d){
        tipWest.show(d);
        tipEast.show(d);
      }

      function hideTips(d){
        tipWest.hide(d);
        tipEast.hide(d);
      }

      convData.forEach(function(convo, i, arr) {
        rectGroup.append("rect")
          .datum(convo)
          .attr("x", function(d) {
                        var coord_x = x(moment.utc(d[0][0]).toDate());
                        return coord_x - 10; })
          .attr("y", function(d) {
                        var revConvId = (Object.getOwnPropertyNames(convDict).length + 1 - Number(d[0][1])).toString();
                        return 15 * Number(convDict[revConvId].first_point[1]) - 21; })
          .attr("width", function(d) {
                        var coord_x_first = x(moment.utc(d[0][0]).toDate());
                        var coord_x_last = x(moment.utc(d[1][0]).toDate());
                        return coord_x_last - coord_x_first + 20; })
          .attr("height", 12)
          .style("fill", "transparent")
          .style("stroke", "transparent")
          .attr("class", "hover-area")
          .on("mouseover", showTips)
          .on("mouseout", hideTips);

        rectGroup.append("text")
          .datum(convo)
          .attr("x", function(d) {
                        var coord_x = x(moment.utc(d[0][0]).toDate());
                        return coord_x - 5; })
          .attr("y", function(d) {
                        var revConvId = (Object.getOwnPropertyNames(convDict).length + 1 - Number(d[0][1])).toString();
                        return 15 * Number(convDict[revConvId].first_point[1]) - 15; })
          .attr("dy", ".35em")
          .style("text-anchor", "end")
          .style("font-size", ".75em")
          .attr("class", "ip-label")
          .text(function(d) { return convDict[d[0][1]].src_ip; });

        rectGroup.append("text")
          .datum(convo)
          .attr("x", function(d) {
                        var coord_x = x(moment.utc(d[1][0]).toDate());
                        return coord_x + 5; })
          .attr("y", function(d) {
                        var revConvId = (Object.getOwnPropertyNames(convDict).length + 1 - Number(d[1][1])).toString();
                        return 15 * Number(convDict[revConvId].first_point[1]) - 15; })
          .attr("dy", ".35em")
          .style("text-anchor", "start")
          .style("font-size", ".75em")
          .attr("class", "ip-label")
          .text(function(d) { return convDict[d[1][1]].dst_ip; });
        });

      /* draw legend of protocols */
      legendGroup = svg.append("g")
          .attr("class", "legendGroup");

      var legend = legendGroup.selectAll(".legend")
          .data(protocols)
        .enter().append("g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(0," + (i * 20) + ")"; });

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
          .style("font-size", ".75em")
          .text(function(d) { return d; });

      legendGroup.attr("transform", "translate(100, -50)")

      /* create button to toggle ip addresses */
      $('<button type="button" class="btn btn-default ip-button" data-toggle="button">Show IPs</button>').insertAfter(".container");
      $(".ip-button").on("click", function() {
              if ($(this).text() === "Show IPs") {
                $(this).text("Hide IPs");
                  d3.selectAll(".hover-area")
                    .on("mouseover", function() { return false; })
                    .on("mouseout", function() { return false; });
              } else if ($(this).text() === "Hide IPs") {
                $(this).text("Show IPs");
                  d3.selectAll(".hover-area")
                    .on("mouseover", showTips)
                    .on("mouseout", hideTips);
              } else {
                $(this).text("Show/Hide IPs");
              }
              $(".ip-label").toggle();
            });

      /* prevent dragging and dropping on the visualization and button */
      $(".output, .output *, .ip-button").on("drop", function(e) {
        e.stopPropagation();
        e.preventDefault();
        return false;
      });

      $(".output, .output *, .ip-button").on("dragover", function(e) {
        e.stopPropagation();
        e.preventDefault();
        return false;
      });

  } /* renderVisualization */

}); /* document.ready */