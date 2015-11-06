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
        console.log(data);
        renderVisualization(data);
      }).fail(function(data) {
        console.log(data);
        handleError(data);
      }).always(function(data) {
        $('.progress').remove();
      });
    }
  }); /* on drop */

  function renderVisualization(data) {
    console.log('rendering visualization...')
  } /* renderVisualization */

  function handleError(data) {
    console.log('handling error...')
  } /* handleError */

}); /* document.ready */