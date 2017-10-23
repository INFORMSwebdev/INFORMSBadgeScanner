$(document).ready( function() {

  createContact();

  $('#EMPTYCONTACTS').click( function() {
    ret = confirm('Are you sure?');
    if( ret == true )
    {
      deleteCollectedCards();
      gotopage("main_page");
    }
  });

  // Set scan testing to false if this is an iOS or Android device
  var userAgent = navigator.userAgent || navigator.vendor;
  if( userAgent.match( /iPad/i ) || userAgent.match( /iPhone OS \w+/i ) || userAgent.match( /iPod/i ) || userAgent.match( /Android/i ) ) SCANTEST = false;
  else SCANTEST = true;

});

$(document).on('pageshow','#main_page',function() {
   showBadgeMenu();
});

$(document).on('pageshow','#scanner_page',function() {
   if( $('#p').html() == '' ) scan();
   $('#backtomenu').html('<div onClick="gotopage(\'main_page\')" class="scan_btn">Back to contact list</div>');

});

$(document).on('pagehide','#scanner_page',function() {
   if( $.mobile.activePage.attr("id") != "editcontact_page" ) $('#p').html('');
});

$(document).on('pageshow','#editcontact_page',function() {
   showPageTitle('editcontact_page');
});

