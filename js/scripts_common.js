// prepare sql statement for execution
function sql_prep(str)
{
   // replace single quotes with two of them
   return str.replace(/'/g, "''");
}

// handle error in ajax call
function ajax_error(message, errorThrown)
{
  var msg = 'Error getting data';
  if( message != 'error' )
  {
     msg += '('+message;
     if( errorThrown.length > 0 )
     {
        msg += ': '+errorThrown;
     }
     msg += ')';
  }
  alert(msg);
}

// handle error in db transaction
function errorHandler(err)
{
  var msg = err.message;
  if( msg.indexOf('already exists') == -1 ) alert(err.message);
}

// change location to page identified by given identifier
function gotopage(pagename)
{
  $.mobile.pageContainer.pagecontainer("change", "index.html#"+pagename, 'slide');
}

// pad a number with leading zeroes
function pad(n, width, z)
{
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// get current datetime in milliseconds
function getESTDateTime()
{
  var datetime = new Date();
  var localTime = datetime.getTime();
  var localOffset = datetime.getTimezoneOffset() * 60000;
  var utc = localTime + localOffset;
  var ESTDateTime = new Date(utc + (3600000 * -4)); // EST is four hours behind UTC
  return ESTDateTime;
}

// get current date in a specified format
function getCurrDate()
{
  var confTime = getESTDateTime();
  currdate = confTime.getFullYear() + '-' + pad(confTime.getMonth()+1, 2)  + "-" + pad(confTime.getDate(), 2);
//currdate = '2016-11-14';
}

// get current time in a specified format
function getCurrTime()
{
  var confTime = getESTDateTime();
  currtime = pad(confTime.getHours(), 2) + ":" + pad(confTime.getMinutes(), 2) + ":" + pad(confTime.getSeconds(), 2);
//currtime = '12:45:00';
}

// hides or shows the display of the element identified by the given identifier
function toggleDisplay(id)
{
   if( $('#'+id).is(':visible') ) {
      $('#'+id).hide();
   }
   else {
      $('#'+id).show();
   }
}

function showElem(elemid)
{
   if( elemid != '' ) document.getElementById(elemid).style.display = "block";
}

function hideElem(elemid)
{
   if( elemid != '' ) document.getElementById(elemid).style.display = "none";
}

