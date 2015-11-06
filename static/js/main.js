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
    console.log(dataPoints);
    console.log(dataPoints.length);

    $('<div id="output"></div>').insertAfter('.container');

    var margin = {top: 20, right: 20, bottom: 30, left: 40};
    var width = 960 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    var color = d3.scale.category20b();

    var x = d3.time.scale.utc().range([0, width]);
    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var svg = d3.select("#output").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      x.domain(d3.extent(dataPoints, function(d) { return moment.utc(d[0]).toDate(); })).nice();
      y.domain(d3.extent(dataPoints, function(d) { return Number(d[1]); })).nice();

      svg.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + (height + 10) + ")")
          .call(xAxis)
        .append("text")
          .attr("class", "label")
          .attr("x", width / 2)
          .attr("y", 40)
          .style("text-anchor", "end")
          .text("Time (UTC)");

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("class", "label")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("")

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
          .attr("transform", "translate(" + width + " ,0)")
        .append("text")
          .attr("class", "label")
          .attr("transform", "rotate(-90)")
          .attr("y", 6)
          .attr("dy", ".71em")
          .style("text-anchor", "end")
          .text("")

      svg.selectAll(".dot")
          .data(dataPoints)
        .enter().append("circle")
          .attr("class", "dot")
          .attr("r", 3.5)
          .attr("cx", function(d) { return x(moment.utc(d[0]).toDate()); })
          .attr("cy", function(d) { return y(Number(d[1])); })
          .style("fill", function(d) { return color(d[1]); });

      // var legend = svg.selectAll(".legend")
      //     .dataPoints(color.domain())
      //   .enter().append("g")
      //     .attr("class", "legend")
      //     .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

      // legend.append("rect")
      //     .attr("x", width - 18)
      //     .attr("width", 18)
      //     .attr("height", 18)
      //     .style("fill", color);

      // legend.append("text")
      //     .attr("x", width - 24)
      //     .attr("y", 9)
      //     .attr("dy", ".35em")
      //     .style("text-anchor", "end")
      //     .text(function(d) { return d; });

  } /* renderVisualization */

  function handleError(data) {
    console.log('handling error...')
    $('<div id="output"></div>').insertAfter('.container');
    $('#output').text(data);
  } /* handleError */

}); /* document.ready */